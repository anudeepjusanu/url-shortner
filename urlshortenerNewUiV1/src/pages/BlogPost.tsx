import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
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

  // Simple markdown-like rendering
  const renderContent = (text: string) => {
    const lines = text.split("\n");
    const elements: JSX.Element[] = [];
    let inCodeBlock = false;
    let codeLines: string[] = [];

    lines.forEach((line, i) => {
      if (line.startsWith("```")) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code-${i}`} className="bg-foreground text-background/80 rounded-lg p-5 text-sm font-mono overflow-x-auto my-6">
              {codeLines.join("\n")}
            </pre>
          );
          codeLines = [];
        }
        inCodeBlock = !inCodeBlock;
        return;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        return;
      }

      if (line.startsWith("## ")) {
        elements.push(
          <h2 key={i} className="font-display text-2xl font-bold text-foreground mt-10 mb-4">
            {line.replace("## ", "")}
          </h2>
        );
      } else if (line.startsWith("### ")) {
        elements.push(
          <h3 key={i} className="font-display text-xl font-semibold text-foreground mt-8 mb-3">
            {line.replace("### ", "")}
          </h3>
        );
      } else if (line.startsWith("- **")) {
        const match = line.match(/^- \*\*(.+?)\*\*\s*,?\s*(.*)/);
        if (match) {
          elements.push(
            <li key={i} className="font-body text-muted-foreground leading-relaxed ml-4 mb-2">
              <strong className="text-foreground">{match[1]}</strong>
              {match[2] && `, ${match[2]}`}
            </li>
          );
        }
      } else if (line.startsWith("- ")) {
        elements.push(
          <li key={i} className="font-body text-muted-foreground leading-relaxed ml-4 mb-2">
            {line.replace("- ", "")}
          </li>
        );
      } else if (line.match(/^\d+\.\s/)) {
        elements.push(
          <li key={i} className="font-body text-muted-foreground leading-relaxed ml-4 mb-2 list-decimal">
            {line.replace(/^\d+\.\s/, "")}
          </li>
        );
      } else if (line.startsWith("`") && line.endsWith("`")) {
        elements.push(
          <code key={i} className="bg-muted px-2 py-1 rounded text-sm font-mono text-foreground block my-4">
            {line.replace(/`/g, "")}
          </code>
        );
      } else if (line.trim() === "") {
        elements.push(<div key={i} className="h-4" />);
      } else {
        // Handle inline bold and code
        const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);
        elements.push(
          <p key={i} className="font-body text-muted-foreground leading-relaxed mb-3">
            {parts.map((part, j) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={j} className="text-foreground">{part.slice(2, -2)}</strong>;
              }
              if (part.startsWith("`") && part.endsWith("`")) {
                return <code key={j} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">{part.slice(1, -1)}</code>;
              }
              return part;
            })}
          </p>
        );
      }
    });

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
