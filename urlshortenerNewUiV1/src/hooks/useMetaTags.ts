import { useEffect, useRef } from "react";

interface MetaTagsConfig {
  title?: string;
  description?: string;
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

export const useMetaTags = (config: MetaTagsConfig) => {
  const injected = useRef<Element[]>([]);

  useEffect(() => {
    const created: Element[] = [];

    const setMetaTag = (
      attrName: string,
      attrValue: string,
      content: string
    ) => {
      const selector = `meta[${attrName}="${attrValue}"]`;
      let element = document.querySelector(selector);
      if (element) {
        element.setAttribute("content", content);
      } else {
        element = document.createElement("meta");
        element.setAttribute(attrName, attrValue);
        element.setAttribute("content", content);
        document.head.appendChild(element);
        created.push(element);
      }
    };

    if (config.title) {
      document.title = config.title;
    }

    if (config.description) {
      setMetaTag("name", "description", config.description);
    }

    if (config.keywords) {
      setMetaTag("name", "keywords", config.keywords);
    }

    if (config.ogTitle) {
      setMetaTag("property", "og:title", config.ogTitle);
    }
    if (config.ogDescription) {
      setMetaTag("property", "og:description", config.ogDescription);
    }
    if (config.ogImage) {
      setMetaTag("property", "og:image", config.ogImage);
    }
    if (config.ogUrl) {
      setMetaTag("property", "og:url", config.ogUrl);
    }

    if (config.twitterTitle) {
      setMetaTag("name", "twitter:title", config.twitterTitle);
    }
    if (config.twitterDescription) {
      setMetaTag("name", "twitter:description", config.twitterDescription);
    }
    if (config.twitterImage) {
      setMetaTag("name", "twitter:image", config.twitterImage);
    }

    if (config.canonical) {
      const selector = 'link[rel="canonical"]';
      let link = document.querySelector(selector);
      if (link) {
        link.setAttribute("href", config.canonical);
      } else {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        link.setAttribute("href", config.canonical);
        document.head.appendChild(link);
        created.push(link);
      }
    }

    injected.current = created;

    return () => {
      injected.current.forEach((el) => el.remove());
      injected.current = [];
    };
  }, [config]);
};
