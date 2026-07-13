const redirectService = require("../services/redirectService");

// Single source of truth for "what public system domain is this request on".
// When the request host is a recognized main domain (e.g. qa.snip.sa or
// qa.4r.sa), that host wins so newly created records are pinned to whichever
// domain the user actually created them on. Otherwise falls back to
// BASE_DOMAIN, then BASE_URL's hostname, then the legacy default.
const resolvePublicDomain = (req) => {
  const requestHost = req?.get?.("host");
  if (requestHost && redirectService.isMainDomain(requestHost)) {
    return requestHost;
  }
  if (process.env.BASE_DOMAIN) return process.env.BASE_DOMAIN;
  if (process.env.BASE_URL) {
    try {
      return new URL(process.env.BASE_URL).hostname;
    } catch {}
  }
  return "snip.sa";
};

module.exports = { resolvePublicDomain };
