import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { blogPosts } from "@/data/blogPosts";
import { motion } from "framer-motion";

const BlogSection = () => {
  const { t, lang } = useLanguage();
  const featured = blogPosts[0];
  const rest = blogPosts.slice(1, 3);

  return (
    <section id="blog" className="section-cream-blush py-28 md:py-36">
      <div className="container mx-auto px-6">
        <div className="flex items-end justify-between mb-14">
          <div>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-[hsl(var(--navy))] mb-3 tracking-tight">
              {t("From the blog", "من المدونة")}
            </h2>
            <p className="text-[hsl(var(--navy))]/60 font-body text-lg max-w-md">
              {t(
                "Tips, guides, and insights to help you get the most out of your short links and campaigns.",
                "نصائح وأدلة ورؤى تساعدك تستفيد أكثر من روابطك المختصرة وحملاتك."
              )}
            </p>
          </div>
          <Link
            to="/blog"
            className="hidden sm:flex items-center gap-1.5 bg-[hsl(var(--sky))] text-white font-body text-sm font-bold px-6 py-3 rounded-full hover:brightness-110 transition-all"
          >
            {t("View all posts", "جميع المقالات")}
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-3"
          >
            <Link
              to={`/blog/${featured.slug}`}
              className="group block bg-white rounded-3xl overflow-hidden border border-[hsl(var(--navy))]/10 hover:border-[hsl(var(--sky))]/30 hover:-translate-y-1 transition-all duration-300 h-full"
            >
              <div className="h-64 md:h-80 bg-[hsl(var(--navy))] flex items-center justify-center relative overflow-hidden">
                {featured.image ? (
                  <img src={featured.image} alt={lang === "ar" ? featured.title.ar : featured.title.en} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <span className="text-white/10 font-display text-[10rem] font-black">01</span>
                )}
                <span className="absolute top-5 start-5 text-xs font-body font-bold text-white bg-[hsl(var(--sky))] px-4 py-1.5 rounded-full">
                  {lang === "ar" ? featured.category.ar : featured.category.en}
                </span>
              </div>
              <div className="p-8">
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex items-center gap-1 text-[hsl(var(--navy))]/50 text-xs font-body">
                    <Clock size={12} />
                    {lang === "ar" ? featured.readTime.ar : featured.readTime.en}
                  </span>
                  <span className="text-[hsl(var(--navy))]/30 text-xs">·</span>
                  <span className="text-[hsl(var(--navy))]/40 font-body text-xs">
                    {lang === "ar" ? featured.date.ar : featured.date.en}
                  </span>
                </div>
                <h3 className="font-display text-2xl font-bold text-[hsl(var(--navy))] mb-3 leading-snug group-hover:text-[hsl(var(--sky))] transition-colors">
                  {lang === "ar" ? featured.title.ar : featured.title.en}
                </h3>
                <p className="text-[hsl(var(--navy))]/60 font-body text-sm leading-relaxed line-clamp-3">
                  {lang === "ar" ? featured.excerpt.ar : featured.excerpt.en}
                </p>
              </div>
            </Link>
          </motion.div>

          <div className="lg:col-span-2 flex flex-col gap-6">
            {rest.map((post, i) => (
              <motion.div
                key={post.slug}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (i + 1) * 0.1 }}
                className="flex-1"
              >
                <Link
                  to={`/blog/${post.slug}`}
                  className="group block bg-white rounded-3xl overflow-hidden border border-[hsl(var(--navy))]/10 hover:border-[hsl(var(--sky))]/30 hover:-translate-y-1 transition-all duration-300 h-full"
                >
                  <div className={`h-28 ${i === 0 ? "bg-[hsl(var(--sky))]" : "bg-[hsl(var(--navy))]"} flex items-center justify-center overflow-hidden`}>
                    {post.image ? (
                      <img src={post.image} alt={lang === "ar" ? post.title.ar : post.title.en} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <span className="text-white/10 font-display text-7xl font-black">
                        {String(i + 2).padStart(2, "0")}
                      </span>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-body font-bold text-white bg-[hsl(var(--sky))] px-3 py-1 rounded-full">
                        {lang === "ar" ? post.category.ar : post.category.en}
                      </span>
                      <span className="flex items-center gap-1 text-[hsl(var(--navy))]/50 text-xs font-body">
                        <Clock size={12} />
                        {lang === "ar" ? post.readTime.ar : post.readTime.en}
                      </span>
                    </div>
                    <h3 className="font-display text-base font-bold text-[hsl(var(--navy))] leading-snug group-hover:text-[hsl(var(--sky))] transition-colors">
                      {lang === "ar" ? post.title.ar : post.title.en}
                    </h3>
                    <p className="text-[hsl(var(--navy))]/40 font-body text-xs mt-3">
                      {lang === "ar" ? post.date.ar : post.date.en}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <Link
          to="/blog"
          className="sm:hidden flex items-center justify-center gap-1.5 bg-[hsl(var(--sky))] text-white font-body text-sm font-bold mt-8 px-6 py-3 rounded-full hover:brightness-110"
        >
          {t("View all posts", "جميع المقالات")}
          <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
};

export default BlogSection;
