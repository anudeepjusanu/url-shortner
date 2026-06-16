import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import CTASection from "@/components/landing/CTASection";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tag, ArrowRight, BarChart3, Layers, Target, TrendingUp, Copy, Check, Mail, Megaphone, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useSmartLink } from "@/hooks/useSmartLink";

const FeatureUTMTracking = () => {
  const { t } = useLanguage();
  const { smartLink } = useSmartLink();
  const [copied, setCopied] = useState(false);

  const params = [
    { key: "utm_source", value: "instagram", label: t("Source", "المصدر"), desc: t("Where the traffic comes from", "من وين يجي الترافيك"), color: "hsl(var(--sky))" },
    { key: "utm_medium", value: "story_link", label: t("Medium", "الوسيط"), desc: t("The marketing medium", "الوسيط التسويقي"), color: "hsl(var(--navy))" },
    { key: "utm_campaign", value: "ramadan_2026", label: t("Campaign", "الحملة"), desc: t("Your campaign name", "اسم حملتك"), color: "hsl(280 60% 55%)" },
    { key: "utm_content", value: "cta_button", label: t("Content", "المحتوى"), desc: t("Differentiate similar content", "ميّز المحتوى المتشابه"), color: "hsl(150 60% 45%)" },
  ];

  const benefits = [
    {
      icon: Target,
      title: t("Know what works", "اعرف وش ينفع"),
      desc: t("See exactly which campaigns bring clicks. Stop guessing, start knowing.", "شف بالضبط أي الحملات تجيب ضغطات. وقف عن التخمين وابدأ تعرف."),
    },
    {
      icon: Layers,
      title: t("Visual builder", "منشئ بصري"),
      desc: t("No need to manually type UTM parameters. Our builder does it for you.", "ما تحتاج تكتب معلمات UTM يدوياً. المنشئ يسويها لك."),
    },
    {
      icon: BarChart3,
      title: t("Campaign reports", "تقارير الحملات"),
      desc: t("Group clicks by source, medium, or campaign. Beautiful reports without spreadsheets.", "جمّع الضغطات حسب المصدر أو الوسيط أو الحملة. تقارير جميلة بدون جداول بيانات."),
    },
    {
      icon: TrendingUp,
      title: t("Compare performance", "قارن الأداء"),
      desc: t("Run multiple campaigns and see which one performs best, side by side.", "شغّل حملات متعددة وشف أيها أفضل، جنب بعض."),
    },
  ];

  const scenarios = [
    { icon: Mail, title: t("Email campaigns", "حملات الإيميل"), desc: t("Tag newsletter links to see which emails drive engagement.", "وسّم روابط النشرة عشان تشوف أي إيميلات تجيب تفاعل."), color: "hsl(var(--sky))" },
    { icon: Megaphone, title: t("Social media ads", "إعلانات السوشال"), desc: t("Compare Instagram vs Twitter vs Snapchat ad performance.", "قارن أداء إعلانات إنستقرام وتويتر وسناب شات."), color: "hsl(280 60% 55%)" },
    { icon: Users, title: t("Influencer deals", "صفقات المؤثرين"), desc: t("Give each influencer a tagged link. See who brings real clicks.", "أعطِ كل مؤثر رابط موسوم. شف مين يجيب ضغطات حقيقية."), color: "hsl(150 60% 45%)" },
  ];

  const generatedUrl = "snip.sa/ramadan?utm_source=instagram&utm_medium=story_link&utm_campaign=ramadan_2026&utm_content=cta_button";

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero — interactive UTM builder */}
      <section className="section-cream pt-32 pb-20 md:pt-40 md:pb-28 relative overflow-hidden">
        <div className="absolute top-32 -end-20 w-[500px] h-[500px] bg-[hsl(280,60%,55%)]/[0.04] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -start-32 w-96 h-96 bg-[hsl(var(--sky))]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="lg:sticky lg:top-32">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[hsl(var(--sky))]/10 text-[hsl(var(--sky))] text-xs font-bold font-body mb-6">
                <Tag className="w-3.5 h-3.5" />
                {t("UTM Tracking", "تتبع UTM")}
              </span>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight leading-[1.1] text-[hsl(var(--navy))]">
                {t("Stop guessing.", "وقف عن التخمين.")}{" "}
                <br className="hidden md:block" />
                <span className="text-[hsl(var(--sky))]">{t("Start tracking.", "ابدأ التتبع.")}</span>
              </h1>
              <p className="font-body text-lg leading-relaxed mb-8 max-w-md text-[hsl(var(--navy))]/60">
                {t(
                  "Add UTM parameters to any short link with our visual builder. Know exactly which campaigns, sources, and content bring the most clicks.",
                  "أضف معلمات UTM لأي رابط قصير عبر أداتنا البصرية. اعرف بالضبط أي الحملات والمصادر والمحتوى تجيب أكثر ضغطات."
                )}
              </p>
              <Link to={smartLink("/signup", "/dashboard/utm-builder")}>
                <Button className="bg-[hsl(var(--sky))] text-white font-body font-bold rounded-full px-8 py-6 text-base hover:brightness-110 transition-all shadow-lg shadow-[hsl(var(--sky))]/25">
                  {t("Try the UTM builder", "جرّب منشئ UTM")}
                  <ArrowRight size={16} className="ms-1.5 rtl:rotate-180" />
                </Button>
              </Link>
            </motion.div>

            {/* Interactive UTM builder card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <div className="bg-white rounded-2xl border border-[hsl(var(--navy))]/8 shadow-elevated overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[hsl(var(--navy))]/6 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[hsl(var(--sky))]" />
                  <span className="text-sm font-display font-bold text-[hsl(var(--navy))]">
                    {t("UTM Builder", "منشئ UTM")}
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  {/* Parameters */}
                  {params.map((p, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-1.5 h-full min-h-[48px] rounded-full shrink-0 mt-1" style={{ backgroundColor: p.color }} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono font-bold text-[hsl(var(--navy))]/40">{p.key}</span>
                          <span className="text-[10px] font-body text-[hsl(var(--navy))]/30">{p.desc}</span>
                        </div>
                        <div className="bg-[hsl(var(--navy))]/[0.03] rounded-lg px-3 py-2 border border-[hsl(var(--navy))]/6">
                          <span className="text-sm font-body text-[hsl(var(--navy))]">{p.value}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Generated URL */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="bg-[hsl(var(--sky))]/5 border border-[hsl(var(--sky))]/15 rounded-xl p-4 mt-2"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-body font-bold text-[hsl(var(--sky))]">{t("Generated Link", "الرابط المُنشأ")}</span>
                      <button
                        onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                        className="flex items-center gap-1 text-[10px] font-body font-bold text-[hsl(var(--sky))] hover:text-[hsl(var(--navy))] transition-colors"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? t("Copied!", "تم النسخ!") : t("Copy", "نسخ")}
                      </button>
                    </div>
                    <div className="bg-white rounded-lg px-3 py-2 border border-[hsl(var(--sky))]/10">
                      <code className="text-[10px] font-mono text-[hsl(var(--navy))] break-all leading-relaxed">{generatedUrl}</code>
                    </div>
                  </motion.div>

                  {/* Mini stats */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="flex items-center gap-4 pt-2"
                  >
                    {[
                      { label: t("Clicks", "ضغطات"), value: "1,420", color: "hsl(var(--sky))" },
                      { label: t("Unique", "فريد"), value: "893", color: "hsl(150 60% 45%)" },
                      { label: t("Conv.", "تحويل"), value: "12.4%", color: "hsl(280 60% 55%)" },
                    ].map((stat, i) => (
                      <div key={i} className="text-center flex-1">
                        <p className="text-base font-display font-bold" style={{ color: stat.color }}>{stat.value}</p>
                        <p className="text-[10px] font-body text-[hsl(var(--navy))]/40">{stat.label}</p>
                      </div>
                    ))}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How UTM works — educational */}
      <section className="section-cream-warm py-20 md:py-28">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[hsl(var(--navy))]/5 text-[hsl(var(--navy))]/60 text-xs font-bold font-body mb-4">
              {t("HOW IT WORKS", "كيف يعمل")}
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[hsl(var(--navy))] mb-4">
              {t("UTM parameters explained", "شرح معلمات UTM")}
            </h2>
            <p className="font-body text-lg text-[hsl(var(--navy))]/50 max-w-lg mx-auto">
              {t("Four simple tags that tell you everything about where your clicks come from.", "أربع علامات بسيطة تخبرك كل شيء عن مصدر ضغطاتك.")}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {params.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-5 border border-[hsl(var(--navy))]/6 relative overflow-hidden group hover:shadow-card transition-all"
              >
                <div className="absolute top-0 inset-x-0 h-1 rounded-t-2xl" style={{ backgroundColor: p.color }} />
                <span className="font-mono text-xs font-bold block mb-2 mt-1" style={{ color: p.color }}>{p.key}</span>
                <h3 className="font-display font-bold text-[hsl(var(--navy))] mb-1">{p.label}</h3>
                <p className="font-body text-xs text-[hsl(var(--navy))]/45 mb-3">{p.desc}</p>
                <div className="bg-[hsl(var(--navy))]/[0.03] rounded-lg px-3 py-1.5">
                  <span className="text-xs font-mono text-[hsl(var(--navy))]/60">{p.value}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits — side by side with visual */}
      <section className="section-cream-soft py-20 md:py-28 relative overflow-hidden">
        <div className="absolute start-0 top-1/2 w-72 h-72 bg-[hsl(280,60%,55%)]/4 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
        <div className="container mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[hsl(var(--sky))]/10 text-[hsl(var(--sky))] text-xs font-bold font-body mb-5">
                {t("WHY UTM", "ليش UTM")}
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-[hsl(var(--navy))] mb-4 leading-[1.15]">
                {t("Know exactly where your clicks come from", "اعرف بالضبط من وين ضغطاتك جايّة")}
              </h2>
              <p className="font-body text-base text-[hsl(var(--navy))]/50 leading-relaxed mb-8">
                {t(
                  "Without UTM tracking, every click looks the same. With it, you see the full picture: which platform, campaign, and content brings results.",
                  "بدون تتبع UTM، كل نقرة تبان نفسها. معاه، تشوف الصورة الكاملة: أي منصة وحملة ومحتوى يجيب نتائج."
                )}
              </p>
              <div className="space-y-4">
                {benefits.map((b, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[hsl(var(--sky))]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <b.icon className="w-4 h-4 text-[hsl(var(--sky))]" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-[hsl(var(--navy))] text-sm mb-0.5">{b.title}</h3>
                      <p className="font-body text-xs text-[hsl(var(--navy))]/45 leading-relaxed">{b.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Mock campaign report card */}
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="bg-white rounded-2xl border border-[hsl(var(--navy))]/8 shadow-elevated overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[hsl(var(--navy))]/6 flex items-center justify-between">
                  <span className="text-sm font-display font-bold text-[hsl(var(--navy))]">{t("Campaign Report", "تقرير الحملة")}</span>
                  <span className="text-[10px] font-body text-[hsl(var(--navy))]/35">{t("Last 7 days", "آخر 7 أيام")}</span>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    { source: "Instagram", medium: "story", clicks: 842, pct: 85, color: "hsl(var(--sky))" },
                    { source: "Twitter", medium: "bio", clicks: 356, pct: 55, color: "hsl(220 70% 55%)" },
                    { source: "Email", medium: "newsletter", clicks: 198, pct: 35, color: "hsl(280 60% 55%)" },
                    { source: "WhatsApp", medium: "broadcast", clicks: 124, pct: 22, color: "hsl(150 60% 45%)" },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-20 shrink-0">
                        <span className="text-xs font-body font-semibold text-[hsl(var(--navy))]">{row.source}</span>
                        <span className="text-[10px] font-body text-[hsl(var(--navy))]/30 block">{row.medium}</span>
                      </div>
                      <div className="flex-1 h-6 bg-[hsl(var(--navy))]/[0.03] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${row.pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: 0.2 + i * 0.15 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: row.color }}
                        />
                      </div>
                      <span className="text-xs font-display font-bold text-[hsl(var(--navy))] w-12 text-end">{row.clicks}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Use cases — immersive scenario cards */}
      <section className="section-cream-rose py-20 md:py-28">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[hsl(var(--navy))] mb-4">
              {t("One link, full visibility", "رابط واحد، رؤية كاملة")}
            </h2>
            <p className="font-body text-lg text-[hsl(var(--navy))]/50 max-w-lg mx-auto">
              {t("Tag every channel and compare results instantly.", "وسّم كل قناة وقارن النتائج فوراً.")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {scenarios.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="group relative rounded-2xl overflow-hidden"
              >
                {/* Colored top gradient bar */}
                <div className="absolute inset-x-0 top-0 h-1.5 z-10" style={{ background: `linear-gradient(90deg, ${s.color}, ${s.color}88)` }} />

                <div className="bg-white border border-[hsl(var(--navy))]/6 rounded-2xl p-7 h-full flex flex-col hover:shadow-elevated hover:-translate-y-1 transition-all duration-300">
                  {/* Decorative number */}
                  <span className="absolute top-5 end-5 text-6xl font-display font-black text-[hsl(var(--navy))]/[0.03] leading-none select-none">
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  {/* Icon with colored ring */}
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 relative" style={{ backgroundColor: `${s.color}10` }}>
                    <div className="absolute inset-0 rounded-2xl border-2 opacity-20" style={{ borderColor: s.color }} />
                    <s.icon className="w-6 h-6" style={{ color: s.color }} />
                  </div>

                  <h3 className="font-display font-bold text-lg text-[hsl(var(--navy))] mb-2">{s.title}</h3>
                  <p className="font-body text-sm text-[hsl(var(--navy))]/50 leading-relaxed flex-1">{s.desc}</p>

                  {/* Mini stat bar */}
                  <div className="mt-5 pt-4 border-t border-[hsl(var(--navy))]/5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-body font-semibold text-[hsl(var(--navy))]/40">{t("Click-through rate", "معدل النقر")}</span>
                      <span className="text-xs font-display font-bold" style={{ color: s.color }}>{["18.2%", "24.7%", "31.5%"][i]}</span>
                    </div>
                    <div className="h-1.5 bg-[hsl(var(--navy))]/[0.04] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: ["45%", "62%", "78%"][i] }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.3 + i * 0.15 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <CTASection />
      <Footer />
    </div>
  );
};

export default FeatureUTMTracking;
