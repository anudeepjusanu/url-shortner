require("dotenv").config();

// Backend mirror of urlshortenerNewUiV1/src/contexts/BrandContext.tsx — keep
// the domain list in sync when a new branded domain is added.
//
// The frontend resolves brand per-request from window.location.hostname
// because one static build can be served from multiple domains. The backend
// has no equivalent per-request signal for outbound email, but it doesn't
// need one: each backend deployment is already configured (via SHORT_DOMAIN/
// BASE_DOMAIN) for exactly one domain, so the brand is resolved once at
// startup from that same config.
const DEFAULT_BRAND = {
  name: "Snip",
  domain: "snip.sa",
};

const BRANDS = [
  {
    domains: ["4r.sa", "www.4r.sa", "qa.4r.sa"],
    brand: { name: "4r", domain: "4r.sa" },
  },
];

const stripPort = (hostname) => (hostname || "").split(":")[0].toLowerCase();

const resolveBrand = (hostname) => {
  const host = stripPort(hostname);
  const match = BRANDS.find((entry) => entry.domains.includes(host));
  return match ? match.brand : DEFAULT_BRAND;
};

const currentBrand = resolveBrand(
  process.env.SHORT_DOMAIN || process.env.BASE_DOMAIN,
);

module.exports = { currentBrand, resolveBrand, DEFAULT_BRAND };
