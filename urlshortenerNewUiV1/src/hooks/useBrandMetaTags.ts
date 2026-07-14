import { useLocation } from "react-router-dom";
import { useBrand } from "@/contexts/BrandContext";
import { useMetaTags } from "./useMetaTags";

interface Overrides {
  title?: string;
  description?: string;
  keywords?: string;
}

// Brand-aware fallback for pages with no page-specific SEO copy of their own.
// Pages that need unique title/description should call useMetaTags directly
// instead (see Index.tsx, Signup.tsx, Blog.tsx, BlogPost.tsx).
export const useBrandMetaTags = (overrides: Overrides = {}) => {
  const brand = useBrand();
  const location = useLocation();

  const url = `https://${brand.domain}${location.pathname}`;
  const title = overrides.title ?? brand.title;
  const description = overrides.description ?? brand.description;

  useMetaTags({
    title,
    description,
    keywords: overrides.keywords,
    ogTitle: title,
    ogDescription: description,
    ogUrl: url,
    ogImage: `https://${brand.domain}/og-image.png`,
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: `https://${brand.domain}/og-image.png`,
    canonical: url,
  });
};
