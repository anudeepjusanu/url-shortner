import type { Brand } from "@/contexts/BrandContext";
import type { BlogPost } from "@/data/blogPosts";

// The rebrand announcement post intentionally names both "snip.sa" and "4r.sa"
// to document the actual historical transition — it must never be rewritten.
const REBRAND_POST_SLUG = "snip-sa-to-4r-sa-rebrand";

const brandifyText = (text: string, brand: Brand): string =>
  brand.name === "snip"
    ? text
    : text.replace(/\bSnip\b/g, brand.name).replace(/\bsnip\b/g, brand.name);

export const brandifyBlogPost = (post: BlogPost, brand: Brand): BlogPost => {
  if (post.slug === REBRAND_POST_SLUG || brand.name === "snip") return post;

  const b = (text: string) => brandifyText(text, brand);

  return {
    ...post,
    title: { en: b(post.title.en), ar: b(post.title.ar) },
    excerpt: { en: b(post.excerpt.en), ar: b(post.excerpt.ar) },
    content: { en: b(post.content.en), ar: b(post.content.ar) },
    category: { en: b(post.category.en), ar: b(post.category.ar) },
    seoTitle: post.seoTitle && {
      en: b(post.seoTitle.en),
      ar: b(post.seoTitle.ar),
    },
    seoDescription: post.seoDescription && {
      en: b(post.seoDescription.en),
      ar: b(post.seoDescription.ar),
    },
  };
};
