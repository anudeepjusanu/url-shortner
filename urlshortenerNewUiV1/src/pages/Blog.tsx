import { Link } from "react-router-dom";
import { ArrowRight, Clock, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { blogPosts } from "@/data/blogPosts";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const Blog = () => {
  const { t, lang } = useLanguage();

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="max-w-2xl mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
              {t("Blog", "المدونة")}
            </h1>
            <p className="text-muted-foreground font-body text-lg leading-relaxed">
              {t(
                "Tips, guides, and insights to help you get the most out of your short links and campaigns.",
                "نصائح وأدلة ورؤى تساعدك تستفيد أكثر من روابطك المختصرة وحملاتك."
              )}
            </p>
          </div>

          {/* Posts grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.map((post, i) => (
              <Link
                to={`/blog/${post.slug}`}
                key={post.slug}
                className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="h-48 overflow-hidden bg-[hsl(var(--navy))]">
                  {post.image ? (
                    <img
                      src={post.image}
                      alt={lang === "ar" ? post.title.ar : post.title.en}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <span className="text-primary/30 font-display text-6xl font-bold">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-body font-bold text-white bg-primary px-3 py-1 rounded-full">
                      {lang === "ar" ? post.category.ar : post.category.en}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground text-xs font-body">
                      <Clock size={12} />
                      {lang === "ar" ? post.readTime.ar : post.readTime.en}
                    </span>
                  </div>
                  <h2 className="font-display text-base font-semibold text-foreground mb-2 group-hover:text-primary transition-colors leading-snug">
                    {lang === "ar" ? post.title.ar : post.title.en}
                  </h2>
                  <p className="text-muted-foreground font-body text-sm leading-relaxed line-clamp-2">
                    {lang === "ar" ? post.excerpt.ar : post.excerpt.en}
                  </p>
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-muted-foreground/60 font-body text-xs">
                      {lang === "ar" ? post.date.ar : post.date.en}
                    </p>
                    <span className="text-primary text-xs font-body font-medium flex items-center gap-1 group-hover:underline">
                      {t("Read more", "اقرأ المزيد")}
                      <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
