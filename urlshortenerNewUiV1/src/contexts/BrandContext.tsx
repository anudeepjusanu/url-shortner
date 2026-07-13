import { createContext, useContext, useMemo, ReactNode } from "react";

interface Brand {
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

  return (
    <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>
  );
};

export const useBrand = () => {
  const context = useContext(BrandContext);
  if (!context) throw new Error("useBrand must be used within BrandProvider");
  return context;
};
