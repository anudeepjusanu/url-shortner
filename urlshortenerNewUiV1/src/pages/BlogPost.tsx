import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMetaTags } from "@/hooks/useMetaTags";
import { blogPosts } from "@/data/blogPosts";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, lang } = useLanguage();

  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-28 pb-20">
          <div className="container mx-auto px-6 text-center">
            <h1 className="font-display text-3xl font-bold text-foreground mb-4">
              {t("Post not found", "المقال غير موجود")}
            </h1>
            <Link to="/blog" className="text-primary font-body hover:underline">
              {t("Back to blog", "العودة للمدونة")}
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const title = lang === "ar" ? post.title.ar : post.title.en;
  const content = lang === "ar" ? post.content.ar : post.content.en;
  const category = lang === "ar" ? post.category.ar : post.category.en;
  const readTime = lang === "ar" ? post.readTime.ar : post.readTime.en;
  const date = lang === "ar" ? post.date.ar : post.date.en;

  const seoTitle = post.seoTitle
    ? (lang === "ar" ? post.seoTitle.ar : post.seoTitle.en)
    : title;
  const seoDescription = post.seoDescription
    ? (lang === "ar" ? post.seoDescription.ar : post.seoDescription.en)
    : (lang === "ar" ? post.excerpt.ar : post.excerpt.en);

  useMetaTags({
    title: seoTitle,
    description: seoDescription,
    ogTitle: seoTitle,
    ogDescription: seoDescription,
    ogUrl: `https://snip.sa/blog/${slug}`,
    ogImage: post.image || "https://snip.sa/og-image.png",
    twitterTitle: seoTitle,
    twitterDescription: seoDescription,
    twitterImage: post.image || "https://snip.sa/og-image.png",
    canonical: `https://snip.sa/blog/${slug}`,
  });

  // Renders inline markdown: **bold**, `code`, [text](url)
  const renderInline = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\))/g);
    return parts.map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return <strong key={j} className="text-foreground">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
        return <code key={j} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">{part.slice(1, -1)}</code>;
      }
      const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        return (
          <a key={j} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            {linkMatch[1]}
          </a>
        );
      }
      return part;
    });
  };

  const renderContent = (text: string) => {
    const lines = text.split("\n");
    const elements: JSX.Element[] = [];
    let idx = 0;
    let inCodeBlock = false;
    let codeLines: string[] = [];

    while (idx < lines.length) {
      const line = lines[idx];

      if (line.startsWith("```")) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code-${idx}`} className="bg-foreground text-background/80 rounded-lg p-5 text-sm font-mono overflow-x-auto my-6">
              {codeLines.join("\n")}
            </pre>
          );
          codeLines = [];
        }
        inCodeBlock = !inCodeBlock;
        idx++;
        continue;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        idx++;
        continue;
      }

      // Table: collect consecutive lines starting with "|"
      if (line.startsWith("|")) {
        const tableLines: string[] = [];
        while (idx < lines.length && lines[idx].startsWith("|")) {
          tableLines.push(lines[idx]);
          idx++;
        }
        const parseRow = (row: string) =>
          row.split("|").slice(1, -1).map((c) => c.trim());
        const isSep = (cells: string[]) => cells.every((c) => /^[-: ]+$/.test(c));
        const allRows = tableLines.map(parseRow);
        const sepIdx = allRows.findIndex(isSep);
        const headerRows = sepIdx >= 0 ? allRows.slice(0, sepIdx) : [allRows[0]];
        const bodyRows = sepIdx >= 0 ? allRows.slice(sepIdx + 1) : allRows.slice(1);
        elements.push(
          <div key={`table-${idx}`} className="overflow-x-auto my-6">
            <table className="w-full border-collapse text-sm font-body">
              <thead>
                {headerRows.map((row, ri) => (
                  <tr key={ri} className="bg-muted/50">
                    {row.map((cell, ci) => (
                      <th key={ci} className="border border-border px-4 py-2 text-left font-semibold text-foreground whitespace-nowrap">
                        {cell}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {bodyRows.map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 0 ? "" : "bg-muted/20"}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="border border-border px-4 py-2 text-muted-foreground">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }

      if (line.startsWith("## ")) {
        elements.push(
          <h2 key={idx} className="font-display text-2xl font-bold text-foreground mt-10 mb-4">
            {line.replace("## ", "")}
          </h2>
        );
      } else if (line.startsWith("### ")) {
        elements.push(
          <h3 key={idx} className="font-display text-xl font-semibold text-foreground mt-8 mb-3">
            {line.replace("### ", "")}
          </h3>
        );
      } else if (line.startsWith("- **")) {
        const match = line.match(/^- \*\*(.+?)\*\*\s*,?\s*(.*)/);
        if (match) {
          elements.push(
            <li key={idx} className="font-body text-muted-foreground leading-relaxed ml-4 mb-2">
              <strong className="text-foreground">{match[1]}</strong>
              {match[2] && <span>, {renderInline(match[2])}</span>}
            </li>
          );
        }
      } else if (line.startsWith("- ")) {
        elements.push(
          <li key={idx} className="font-body text-muted-foreground leading-relaxed ml-4 mb-2">
            {renderInline(line.replace("- ", ""))}
          </li>
        );
      } else if (line.match(/^\d+\.\s/)) {
        elements.push(
          <li key={idx} className="font-body text-muted-foreground leading-relaxed ml-4 mb-2 list-decimal">
            {renderInline(line.replace(/^\d+\.\s/, ""))}
          </li>
        );
      } else if (line.startsWith("`") && line.endsWith("`")) {
        elements.push(
          <code key={idx} className="bg-muted px-2 py-1 rounded text-sm font-mono text-foreground block my-4">
            {line.replace(/`/g, "")}
          </code>
        );
      } else if (line.trim() === "") {
        elements.push(<div key={idx} className="h-4" />);
      } else {
        elements.push(
          <p key={idx} className="font-body text-muted-foreground leading-relaxed mb-3">
            {renderInline(line)}
          </p>
        );
      }

      idx++;
    }

    return elements;
  };

  // Get other posts for "Read more"
  const otherPosts = blogPosts.filter((p) => p.slug !== slug).slice(0, 2);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-6">
          {/* Back link */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-body text-sm mb-8 transition-colors"
          >
            <ArrowLeft size={16} />
            {t("Back to blog", "العودة للمدونة")}
          </Link>

          {/* Article header */}
          <article className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-xs font-body font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                {category}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground text-xs font-body">
                <Clock size={12} />
                {readTime}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground text-xs font-body">
                <Calendar size={12} />
                {date}
              </span>
            </div>

            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-8 tracking-tight leading-tight text-center">
              {title}
            </h1>

            {/* Cover image */}
            {post.image && (
              <div className="rounded-2xl overflow-hidden mb-10 shadow-md">
                <img
                  src={post.image}
                  alt={title}
                  className="w-full h-64 md:h-80 object-cover"
                  loading="lazy"
                />
              </div>
            )}

            {/* Article content */}
            <div className="prose-custom">
              {renderContent(content)}
            </div>
          </article>

          {/* Related posts */}
          {otherPosts.length > 0 && (
            <div className="max-w-3xl mt-16 pt-10 border-t border-border">
              <h3 className="font-display text-xl font-bold text-foreground mb-6">
                {t("More from the blog", "المزيد من المدونة")}
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                {otherPosts.map((p) => (
                  <Link
                    key={p.slug}
                    to={`/blog/${p.slug}`}
                    className="group bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow"
                  >
                    <span className="text-xs font-body font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                      {lang === "ar" ? p.category.ar : p.category.en}
                    </span>
                    <h4 className="font-display text-base font-semibold text-foreground mt-3 mb-2 group-hover:text-primary transition-colors leading-snug">
                      {lang === "ar" ? p.title.ar : p.title.en}
                    </h4>
                    <p className="text-muted-foreground font-body text-sm line-clamp-2">
                      {lang === "ar" ? p.excerpt.ar : p.excerpt.en}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;
