const dns = require("dns").promises;
const logger = require("../config/logger");

// IPv4 ranges that must never be reached by an outbound request we make on
// behalf of a user-supplied URL: loopback, RFC1918 private space, link-local
// (which also covers the 169.254.169.254 cloud metadata endpoint), CGNAT,
// documentation/benchmarking ranges, multicast, and reserved space.
function isPrivateIPv4(ip) {
  const parts = ip.split(".").map(Number);
  if (
    parts.length !== 4 ||
    parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)
  ) {
    return true; // malformed — treat as unsafe rather than risk a bypass
  }

  const [a, b, c] = parts;

  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local + cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 0 && (c === 0 || c === 2)) return true; // IETF protocol / TEST-NET-1
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a === 198 && b === 51 && c === 100) return true; // TEST-NET-2
  if (a === 203 && b === 0 && c === 113) return true; // TEST-NET-3
  if (a >= 224) return true; // multicast (224-239) + reserved/broadcast (240-255)

  return false;
}

function isPrivateIPv6(ip) {
  const normalized = ip.toLowerCase();

  if (normalized === "::1" || normalized === "::") return true; // loopback / unspecified
  if (/^fe[89ab][0-9a-f]:/.test(normalized)) return true; // fe80::/10 link-local
  if (/^f[cd][0-9a-f]{2}:/.test(normalized)) return true; // fc00::/7 unique local

  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);

  return false;
}

function isPrivateOrReservedAddress(address, family) {
  if (family === 6 || address.includes(":")) return isPrivateIPv6(address);
  return isPrivateIPv4(address);
}

// Resolves `hostname` (works for plain domains and literal IPv4/IPv6
// addresses alike) and reports whether it lands on a private/loopback/
// link-local/reserved address that our server should never connect to on a
// user's behalf.
//
// Fails OPEN on DNS lookup errors (returns { blocked: false }) — those are
// left to each call site's existing "URL unreachable" handling, unchanged
// from before this guard existed. Only fails CLOSED when resolution
// succeeds and definitively lands on a restricted address, which is the
// actual SSRF vector this closes.
async function checkHostnameForSsrf(hostname) {
  const clean = hostname.replace(/^\[/, "").replace(/\]$/, "");

  try {
    const results = await dns.lookup(clean, { all: true, verbatim: true });
    const blocked = results.find((r) =>
      isPrivateOrReservedAddress(r.address, r.family),
    );

    if (blocked) {
      return { blocked: true, address: blocked.address };
    }
    return { blocked: false };
  } catch (error) {
    logger.info(
      `SSRF guard: DNS lookup failed for ${hostname}, allowing existing reachability handling to decide: ${error.message}`,
    );
    return { blocked: false };
  }
}

// fetch()'s own `redirect: "follow"` will happily walk a redirect chain to an
// internal address without re-checking anything. This drives the chain
// manually (redirect: "manual" per hop) and re-runs the SSRF guard before
// every hop, including the first, so a URL that's public on the first
// request can't 30x its way to a private/loopback/link-local address.
async function safeFetch(initialUrl, options = {}, maxHops = 5) {
  let currentUrl = initialUrl;

  for (let hop = 0; hop <= maxHops; hop++) {
    const hostname = new URL(currentUrl).hostname;

    const ssrfCheck = await checkHostnameForSsrf(hostname);
    if (ssrfCheck.blocked) {
      const err = new Error(
        `Blocked request to restricted address ${ssrfCheck.address}`,
      );
      err.code = "SSRF_BLOCKED_PRIVATE_ADDRESS";
      throw err;
    }

    const response = await fetch(currentUrl, {
      ...options,
      redirect: "manual",
    });

    const isRedirect = response.status >= 300 && response.status < 400;
    const location = isRedirect && response.headers.get("location");

    if (!location) {
      return response;
    }

    currentUrl = new URL(location, currentUrl).toString();
  }

  throw new Error("Too many redirects");
}

module.exports = {
  checkHostnameForSsrf,
  isPrivateOrReservedAddress,
  safeFetch,
};
