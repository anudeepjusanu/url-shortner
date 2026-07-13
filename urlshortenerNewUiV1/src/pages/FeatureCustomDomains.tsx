import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import CTASection from "@/components/landing/CTASection";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBrand } from "@/contexts/BrandContext";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Globe,
  ArrowRight,
  Zap,
  KeyRound,
  Timer,
  Building2,
  ArrowLeftRight,
  Check,
  Settings,
  Rocket,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useSmartLink } from "@/hooks/useSmartLink";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.12 },
  }),
};

const FeatureCustomDomains = () => {
  const { t } = useLanguage();
  const brand = useBrand();
  const { smartLink } = useSmartLink();

  const steps = [
    {
      num: "1",
      icon: Globe,
      title: t("Add your domain", "أضف نطاقك"),
      desc: t(
        "Enter your custom domain in the dashboard. Like go.myshop.sa or links.agency.com.",
        "أدخل نطاقك المخصص في لوحة التحكم. مثل go.متجري.sa أو links.agency.com.",
      ),
    },
    {
      num: "2",
      icon: Settings,
      title: t("Update DNS", "حدّث DNS"),
      desc: t(
        "Add one CNAME record pointing to cname.snip.sa. We'll verify it automatically.",
        "أضف سجل CNAME واحد يشير لـ cname.snip.sa. بنتحقق منه تلقائياً.",
      ),
    },
    {
      num: "3",
      icon: Check,
      title: t("Start using it", "ابدأ استخدامه"),
      desc: t(
        "All your new links will use your domain. Existing links keep working too.",
        "كل روابطك الجديدة بتستخدم نطاقك. الروابط الموجودة تستمر بالعمل.",
      ),
    },
  ];

  const benefits = [
    {
      icon: KeyRound,
      title: t("Free SSL certificate", "شهادة SSL مجانية"),
      desc: t(
        "Every custom domain gets automatic HTTPS. No extra configuration needed.",
        "كل نطاق مخصص يحصل على HTTPS تلقائي. بدون إعدادات إضافية.",
      ),
    },
    {
      icon: Timer,
      title: t("Instant activation", "تفعيل فوري"),
      desc: t(
        "Once DNS propagates, your domain is live. Usually takes less than 5 minutes.",
        "بمجرد انتشار DNS، نطاقك يشتغل. عادة يأخذ أقل من 5 دقائق.",
      ),
    },
    {
      icon: Building2,
      title: t("Saudi infrastructure", "بنية تحتية سعودية"),
      desc: t(
        "Your branded links are served from Saudi servers. Fast response times for local users.",
        "روابطك المميزة تُقدم من خوادم سعودية. أوقات استجابة سريعة للمستخدمين المحليين.",
      ),
    },
    {
      icon: ArrowLeftRight,
      title: t("Keep existing links", "حافظ على الروابط الحالية"),
      desc: t(
        `Switch domains anytime. Old links on ${brand.domain} will always keep working.`,
        `غيّر النطاق في أي وقت. الروابط القديمة على ${brand.domain} تظل تشتغل.`,
      ),
    },
  ];

  const examples = [
    {
      domain: "go.myshop.sa",
      path: "/ramadan-sale",
      type: t("E-commerce", "تجارة إلكترونية"),
    },
    {
      domain: "links.agency.com",
      path: "/client-report",
      type: t("Agency", "وكالة"),
    },
    {
      domain: "qr.restaurant.sa",
      path: "/menu",
      type: t("Restaurant", "مطعم"),
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="section-cream pt-32 pb-20 md:pt-40 md:pb-28 relative overflow-hidden">
        <div className="absolute -top-20 -end-20 w-[600px] h-[600px] rounded-full border-[60px] opacity-[0.04] border-[hsl(var(--sky))] pointer-events-none" />
        <div className="absolute bottom-10 -start-40 w-[400px] h-[400px] rounded-full border-[40px] opacity-[0.03] border-[hsl(var(--navy))] pointer-events-none" />

        <div className="container mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[hsl(var(--sky))]/10 text-[hsl(var(--sky))] text-xs font-bold font-body mb-6">
                <Globe className="w-3.5 h-3.5" />
                {t("Custom Domains", "النطاقات المخصصة")}
              </span>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight leading-[1.1] text-[hsl(var(--navy))]">
                {t("Your brand.", "علامتك.")}{" "}
                <span className="text-[hsl(var(--sky))]">
                  {t("Your domain.", "نطاقك.")}
                </span>
                <br className="hidden md:block" />
                {t("Your links.", "روابطك.")}
              </h1>
              <p className="font-body text-lg leading-relaxed mb-8 max-w-xl mx-auto text-[hsl(var(--navy))]/60">
                {t(
                  "Stop using generic short links. Use your own domain to build trust and brand recognition with every link you share.",
                  "توقف عن استخدام روابط قصيرة عامة. استخدم نطاقك الخاص لبناء الثقة والتعرف على علامتك مع كل رابط تشاركه.",
                )}
              </p>
              <Link to={smartLink("/signup", "/dashboard/domains")}>
                <Button className="bg-[hsl(var(--sky))] text-white font-body font-bold rounded-full px-8 py-6 text-base hover:brightness-110 transition-all shadow-lg shadow-[hsl(var(--sky))]/25">
                  {t("Add your domain", "أضف نطاقك")}
                  <ArrowRight size={16} className="ms-1.5 rtl:rotate-180" />
                </Button>
              </Link>
            </motion.div>

            {/* Domain examples visual */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-16 max-w-lg mx-auto"
            >
              <div className="bg-white rounded-2xl border border-[hsl(var(--navy))]/[0.08] shadow-elevated overflow-hidden">
                <div className="px-5 py-3 border-b border-[hsl(var(--navy))]/[0.06] flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 bg-[hsl(var(--navy))]/[0.04] rounded-lg px-3 py-1 ms-2">
                    <span className="text-[11px] font-mono text-[hsl(var(--navy))]/50">
                      https://
                    </span>
                    <span className="text-[11px] font-mono text-[hsl(var(--navy))] font-bold">
                      go.yourshop.sa
                    </span>
                    <span className="text-[11px] font-mono text-[hsl(var(--sky))]">
                      /ramadan
                    </span>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  {examples.map((ex, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.15 }}
                      className="flex items-center justify-between bg-[hsl(var(--navy))]/[0.02] rounded-xl px-4 py-3 border border-[hsl(var(--navy))]/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[hsl(var(--sky))]/10 flex items-center justify-center">
                          <Globe className="w-4 h-4 text-[hsl(var(--sky))]" />
                        </div>
                        <div>
                          <span className="text-sm font-display font-bold text-[hsl(var(--navy))] block">
                            {ex.domain}
                            <span className="text-[hsl(var(--sky))]">
                              {ex.path}
                            </span>
                          </span>
                          <span className="text-[10px] font-body text-[hsl(var(--navy))]/40">
                            {ex.type}
                          </span>
                        </div>
                      </div>
                      <Rocket className="w-4 h-4 text-[hsl(var(--sky))]" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Setup steps — clean cream section */}
      <section className="section-cream py-20 md:py-28">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14 md:mb-16"
          >
            <motion.span
              variants={fadeUp}
              custom={0}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[hsl(var(--sky))]/10 text-[hsl(var(--sky))] text-xs font-bold font-body mb-5"
            >
              <Zap className="w-3.5 h-3.5" />
              {t("QUICK SETUP", "إعداد سريع")}
            </motion.span>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[hsl(var(--navy))]"
            >
              {t("Ready in 2 minutes", "جاهز في دقيقتين")}
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="font-body text-base mt-4 max-w-md mx-auto text-[hsl(var(--navy))]/50"
            >
              {t(
                "Three simple steps to brand every link you share",
                "ثلاث خطوات بسيطة لتمييز كل رابط تشاركه",
              )}
            </motion.p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            {steps.map((s, i) => {
              const StepIcon = s.icon;
              const isLast = i === steps.length - 1;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  className="relative"
                >
                  <div className="flex gap-6 md:gap-8">
                    {/* Timeline column */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[hsl(var(--sky))]/10 border border-[hsl(var(--sky))]/20 flex items-center justify-center">
                        <StepIcon className="w-5 h-5 md:w-6 md:h-6 text-[hsl(var(--sky))]" />
                      </div>
                      {!isLast && (
                        <div className="w-px flex-1 my-3 bg-gradient-to-b from-[hsl(var(--sky))]/20 to-transparent min-h-[40px]" />
                      )}
                    </div>

                    {/* Content */}
                    <div className={`pb-10 ${isLast ? "pb-0" : ""}`}>
                      <span className="text-[11px] font-body font-bold text-[hsl(var(--sky))]/60 uppercase tracking-wider">
                        {t("Step", "خطوة")} {s.num}
                      </span>
                      <h3 className="font-display font-bold text-[hsl(var(--navy))] text-lg md:text-xl mt-1 mb-2">
                        {s.title}
                      </h3>
                      <p className="font-body text-sm leading-relaxed text-[hsl(var(--navy))]/50 max-w-md">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="text-center mt-12"
          >
            <Link to={smartLink("/signup", "/dashboard/domains/add")}>
              <Button className="bg-[hsl(var(--sky))] text-white hover:bg-[hsl(var(--sky))]/90 rounded-full px-8 h-11 text-sm font-display font-bold">
                {t("Add your domain now", "أضف نطاقك الآن")}
                <ArrowRight className="w-4 h-4 ms-2 rtl:rotate-180" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Benefits — alternating rows with large icon */}
      <section className="section-cream py-20 md:py-28">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.span
              variants={fadeUp}
              custom={0}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[hsl(var(--sky))]/10 text-[hsl(var(--sky))] text-xs font-bold font-body mb-5"
            >
              {t("BENEFITS", "المميزات")}
            </motion.span>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[hsl(var(--navy))]"
            >
              {t("Why branded links matter", "ليش الروابط المميزة مهمة")}
            </motion.h2>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-6">
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className={`group flex flex-col md:flex-row items-center gap-6 md:gap-10 rounded-3xl bg-white border border-[hsl(var(--navy))]/[0.06] p-6 md:p-8 hover:shadow-elevated transition-all duration-300 ${i % 2 !== 0 ? "md:flex-row-reverse" : ""}`}
              >
                {/* Icon area */}
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-[hsl(var(--sky))]/[0.07] flex items-center justify-center shrink-0 group-hover:bg-[hsl(var(--sky))]/[0.12] transition-colors duration-300">
                  <b.icon className="w-9 h-9 md:w-10 md:h-10 text-[hsl(var(--sky))]" />
                </div>
                {/* Text */}
                <div
                  className={`text-center md:text-start flex-1 ${i % 2 !== 0 ? "md:text-end" : ""}`}
                >
                  <h3 className="font-display font-bold text-[hsl(var(--navy))] text-lg md:text-xl mb-2">
                    {b.title}
                  </h3>
                  <p className="font-body text-sm text-[hsl(var(--navy))]/50 leading-relaxed max-w-md">
                    {b.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After comparison — single card with split */}
      <section className="section-cream py-20 md:py-28">
        <div className="container mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <motion.span
              variants={fadeUp}
              custom={0}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[hsl(var(--sky))]/10 text-[hsl(var(--sky))] text-xs font-bold font-body mb-5"
            >
              {t("COMPARISON", "مقارنة")}
            </motion.span>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[hsl(var(--navy))]"
            >
              {t("See the difference", "شف الفرق")}
            </motion.h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto bg-white rounded-3xl border border-[hsl(var(--navy))]/[0.06] overflow-hidden shadow-elevated"
          >
            {/* Header tabs */}
            <div className="grid grid-cols-2">
              <div className="px-6 py-4 bg-[hsl(var(--navy))]/[0.03] border-b border-e border-[hsl(var(--navy))]/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="text-xs font-body font-bold text-[hsl(var(--navy))]/40 uppercase tracking-wider">
                    {t("Before", "قبل")}
                  </span>
                </div>
              </div>
              <div className="px-6 py-4 bg-[hsl(var(--sky))]/[0.03] border-b border-[hsl(var(--navy))]/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--sky))]" />
                  <span className="text-xs font-body font-bold text-[hsl(var(--sky))] uppercase tracking-wider">
                    {t("After", "بعد")}
                  </span>
                </div>
              </div>
            </div>

            {/* URL rows */}
            {[
              {
                before: `${brand.domain}/xK9mzP`,
                after: "go.myshop.sa/ramadan",
                label: t("Campaign link", "رابط حملة"),
              },
              {
                before: `${brand.domain}/abc123`,
                after: "go.myshop.sa/newdrop",
                label: t("Product launch", "إطلاق منتج"),
              },
              {
                before: `${brand.domain}/7qRtWs`,
                after: "go.myshop.sa/vip",
                label: t("VIP access", "وصول VIP"),
              },
            ].map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-2 ${i < 2 ? "border-b border-[hsl(var(--navy))]/[0.06]" : ""}`}
              >
                {/* Before */}
                <div className="px-6 py-5 border-e border-[hsl(var(--navy))]/[0.06]">
                  <span className="text-[10px] font-body text-[hsl(var(--navy))]/30 block mb-1.5">
                    {row.label}
                  </span>
                  <code className="text-sm font-mono text-[hsl(var(--navy))]/40 line-through decoration-red-300/50">
                    {row.before}
                  </code>
                </div>
                {/* After */}
                <div className="px-6 py-5 bg-[hsl(var(--sky))]/[0.02]">
                  <span className="text-[10px] font-body text-[hsl(var(--sky))]/50 block mb-1.5">
                    {row.label}
                  </span>
                  <code className="text-sm font-mono text-[hsl(var(--navy))] font-medium">
                    {row.after}
                  </code>
                </div>
              </div>
            ))}

            {/* Bottom bar */}
            <div className="grid grid-cols-2 bg-[hsl(var(--navy))]/[0.02] border-t border-[hsl(var(--navy))]/[0.06]">
              <div className="px-6 py-4 border-e border-[hsl(var(--navy))]/[0.06]">
                <p className="text-[11px] font-body text-[hsl(var(--navy))]/30">
                  {t("Generic, forgettable", "عام وغير مميز")}
                </p>
              </div>
              <div className="px-6 py-4 bg-[hsl(var(--sky))]/[0.03]">
                <p className="text-[11px] font-body text-[hsl(var(--sky))] font-semibold">
                  {t("Branded, trustworthy", "مميز وموثوق")}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <CTASection />
      <Footer />
    </div>
  );
};

export default FeatureCustomDomains;
