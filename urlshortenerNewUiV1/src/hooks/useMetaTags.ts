import { useEffect } from 'react';

interface MetaTagsConfig {
  title?: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonical?: string;
}

/**
 * Custom hook to manage document meta tags dynamically
 * Supports bilingual (English/Arabic) meta tags
 */
export const useMetaTags = (config: MetaTagsConfig) => {
  useEffect(() => {
    // Set document title
    if (config.title) {
      document.title = config.title;
    }

    // Helper function to set or update meta tag
    const setMetaTag = (selector: string, content: string) => {
      let element = document.querySelector(selector);
      if (element) {
        element.setAttribute('content', content);
      } else {
        const meta = document.createElement('meta');
        const attrRegex = /\[(\w+)=["']([^"']*)["']\]/g;
        let match;
        while ((match = attrRegex.exec(selector)) !== null) {
          meta.setAttribute(match[1], match[2]);
        }
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      }
    };

    // Set description
    if (config.description) {
      setMetaTag('meta[name="description"]', config.description);
    }

    // Set Arabic title
    if (config.titleAr) {
      setMetaTag('meta[name="title"][lang="ar"]', config.titleAr);
    }

    // Set Arabic description
    if (config.descriptionAr) {
      setMetaTag('meta[name="description"][lang="ar"]', config.descriptionAr);
    }

    // Set keywords
    if (config.keywords) {
      setMetaTag('meta[name="keywords"]', config.keywords);
    }

    // Set Open Graph tags
    if (config.ogTitle) {
      setMetaTag('meta[property="og:title"]', config.ogTitle);
    }
    if (config.ogDescription) {
      setMetaTag('meta[property="og:description"]', config.ogDescription);
    }
    if (config.ogImage) {
      setMetaTag('meta[property="og:image"]', config.ogImage);
    }
    if (config.ogUrl) {
      setMetaTag('meta[property="og:url"]', config.ogUrl);
    }

    // Set Twitter Card tags
    if (config.twitterTitle) {
      setMetaTag('meta[name="twitter:title"]', config.twitterTitle);
    }
    if (config.twitterDescription) {
      setMetaTag('meta[name="twitter:description"]', config.twitterDescription);
    }
    if (config.twitterImage) {
      setMetaTag('meta[name="twitter:image"]', config.twitterImage);
    }

    // Set canonical URL
    if (config.canonical) {
      let link = document.querySelector('link[rel="canonical"]');
      if (link) {
        link.setAttribute('href', config.canonical);
      } else {
        const canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        canonical.setAttribute('href', config.canonical);
        document.head.appendChild(canonical);
      }
    }

    // Cleanup function to restore default values
    return () => {
      document.title = 'snip.sa — Smart URL Shortener for Saudi Arabia';
    };
  }, [config]);
};
