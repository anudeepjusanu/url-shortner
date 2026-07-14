import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  ReactNode,
} from "react";

export interface Brand {
  name: string;
  domain: string;
  title: string;
  description: string;
}

const DEFAULT_BRAND: Brand = {
  name: "snip",
  domain: "snip.sa",
  title: "snip — Smart URL Shortener for Saudi Arabia",
  description:
    "The smartest URL shortener built for Saudi marketers and developers. Shorten links, generate QR codes, use custom domains, and track real-time analytics. Hosted in Saudi Arabia. PDPL compliant.",
};

// Hostname -> brand. Add an entry here for each new branded domain.
const BRANDS: { domains: string[]; brand: Brand }[] = [
  {
    domains: ["4r.sa", "www.4r.sa", "qa.4r.sa"],
    brand: {
      name: "4r",
      domain: "4r.sa",
      title: "4r — Smart URL Shortener for Saudi Arabia",
      description:
        "The smartest URL shortener built for Saudi marketers and developers. Shorten links, generate QR codes, use custom domains, and track real-time analytics. Hosted in Saudi Arabia. PDPL compliant.",
    },
  },
];

const resolveBrand = (hostname: string): Brand => {
  const host = hostname.toLowerCase();
  const match = BRANDS.find((entry) => entry.domains.includes(host));
  return match ? match.brand : DEFAULT_BRAND;
};

const BrandContext = createContext<Brand | undefined>(undefined);

export const BrandProvider = ({ children }: { children: ReactNode }) => {
  const brand = useMemo(() => resolveBrand(window.location.hostname), []);

  // These elements are static in index.html and don't vary per-route, so no
  // page-level hook (e.g. useMetaTags) owns them — safe to update once here
  // without colliding with per-page title/description/OG meta management.
  useEffect(() => {
    document
      .querySelectorAll('link[rel="alternate"][hreflang]')
      .forEach((el) => el.setAttribute("href", `https://${brand.domain}/`));

    document
      .querySelector('meta[name="author"]')
      ?.setAttribute("content", brand.name);

    const jsonLd = document.querySelector('script[type="application/ld+json"]');
    if (jsonLd?.textContent) {
      try {
        const data = JSON.parse(jsonLd.textContent);
        data.name = brand.name;
        data.url = `https://${brand.domain}/`;
        data.description = brand.description;
        jsonLd.textContent = JSON.stringify(data, null, 2);
      } catch {}
    }
  }, [brand]);

  return (
    <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>
  );
};

export const useBrand = () => {
  const context = useContext(BrandContext);
  if (!context) throw new Error("useBrand must be used within BrandProvider");
  return context;
};
