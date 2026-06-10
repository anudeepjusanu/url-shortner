import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { showcasePages } from "@/data/sampleBioPage";
import { bioThemes } from "@/data/bioThemes";
import { ArrowRight, Calendar, Briefcase, MessageCircle, UtensilsCrossed, Truck, MapPin, Settings, Phone, Sparkles, Star, Zap, BadgeCheck, Instagram, Music, Globe, Signal, Wifi, BatteryFull } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const iconMap: Record<string, any> = {
  calendar: Calendar,
  briefcase: Briefcase,
  "message-circle": MessageCircle,
  utensils: UtensilsCrossed,
  truck: Truck,
  "map-pin": MapPin,
  settings: Settings,
  phone: Phone,
};

const categoryIcons = [Sparkles, Zap, Star];

// Rich gradient + accent per persona (overrides the simple theme background for a polished preview)
const personaVisual: Record<string, { bg: string; accent: string; socials: ("instagram" | "tiktok" | "whatsapp" | "globe" | "phone")[]; handle: string; statLabel: { en: string; ar: string } }> = {
  "showcase-1": {
    bg: "linear-gradient(160deg, hsl(350 55% 22%) 0%, hsl(350 60% 36%) 55%, hsl(350 70% 52%) 100%)",
    accent: "hsl(350 80% 65%)",
    socials: ["instagram", "tiktok", "whatsapp"],
    handle: "snip.sa/khalid",
    statLabel: { en: "12.4K views", ar: "12.4K مشاهدة" },
  },
  "showcase-2": {
    bg: "linear-gradient(165deg, hsl(24 38% 16%) 0%, hsl(22 48% 28%) 55%, hsl(30 70% 50%) 100%)",
    accent: "hsl(30 85% 60%)",
    socials: ["instagram", "whatsapp", "phone"],
    handle: "snip.sa/aldeera",
    statLabel: { en: "Open · 11am 1am", ar: "مفتوح · ١١ص ١ص" },
  },
  "showcase-3": {
    bg: "linear-gradient(170deg, hsl(220 50% 16%) 0%, hsl(215 45% 26%) 55%, hsl(210 60% 42%) 100%)",
    accent: "hsl(210 75% 60%)",
    socials: ["globe", "instagram", "whatsapp"],
    handle: "snip.sa/techplus",
    statLabel: { en: "240+ clients", ar: "+240 عميل" },
  },
};

const socialIconMap = {
  instagram: Instagram,
  tiktok: Music,
  whatsapp: MessageCircle,
  globe: Globe,
  phone: Phone,
};

const BioShowcase = () => {
  const { t, lang } = useLanguage();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setActive((i) => (i + 1) % showcasePages.length);
    }, 4000);
    return () => clearInterval(id);
  }, [paused]);

  const handleSelect = (i: number) => {
    setActive(i);
    setPaused(true);
    window.clearTimeout((handleSelect as any)._t);
    (handleSelect as any)._t = window.setTimeout(() => setPaused(false), 8000);
  };
  const activePage = showcasePages[active];
  const activeTheme = bioThemes.find(t => t.id === activePage.theme) || bioThemes[0];
  const visual = personaVisual[activePage.id] ?? personaVisual["showcase-1"];

  return (
    <section className="section-cream py-28 md:py-36 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 start-10 w-72 h-72 rounded-full bg-[hsl(var(--sky))]/5 blur-3xl" />
        <div className="absolute bottom-20 end-10 w-96 h-96 rounded-full bg-[hsl(var(--navy))]/5 blur-3xl" />
        <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[hsl(var(--sky))]/3 blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 bg-[hsl(var(--sky))]/10 border border-[hsl(var(--sky))]/20 rounded-full px-4 py-1.5 mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--sky))]" />
            <span className="text-xs font-body font-bold text-[hsl(var(--sky))]">
              {t("Bio Pages", "صفحات البايو")}
            </span>
          </motion.div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] text-[hsl(var(--navy))] mb-5">
            {t("See What You Can ", "شاهد ما يمكنك ")}
            <span className="relative">
              <span className="relative z-10">{t("Create", "إنشاؤه")}</span>
              <motion.span
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="absolute -bottom-1 start-0 end-0 h-3 bg-[hsl(var(--sky))]/15 rounded-full origin-start"
              />
            </span>
          </h2>
          <p className="font-body text-lg text-[hsl(var(--navy))]/65">
            {t(
              "Three different use cases, one powerful platform.",
              "ثلاث حالات استخدام مختلفة، منصة واحدة قوية."
            )}
          </p>
        </motion.div>

        {/* Category pills */}
        <div className="flex justify-center gap-3 mb-14">
          {showcasePages.map((page, i) => {
            const CatIcon = categoryIcons[i];
            return (
              <motion.button
                key={page.id}
                onClick={() => handleSelect(i)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className={`px-5 py-2.5 rounded-full text-sm font-body font-bold transition-all duration-300 flex items-center gap-2 ${
                  active === i
                    ? "bg-[hsl(var(--navy))] text-white shadow-lg shadow-[hsl(var(--navy))]/25"
                    : "bg-white border border-[hsl(var(--navy))]/10 text-[hsl(var(--navy))]/60 hover:text-[hsl(var(--navy))] hover:border-[hsl(var(--navy))]/25 hover:shadow-md"
                }`}
              >
                <CatIcon className="w-3.5 h-3.5" />
                {lang === "ar" ? page.categoryAr : page.categoryEn}
              </motion.button>
            );
          })}
        </div>

        {/* Main showcase area */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16">
          {/* Phone mockup */}
          <motion.div
            layout
            className="relative"
          >
            {/* Glow behind phone */}
            <div
              className="absolute inset-0 blur-[60px] opacity-30 rounded-full scale-110 transition-all duration-700"
              style={{ background: visual.bg }}
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative"
              >
                <div className="w-[280px] md:w-[300px] rounded-[36px] border-[5px] border-gray-900 bg-gray-900 shadow-2xl shadow-black/20 overflow-hidden">
                  <div
                    className="relative h-[540px] md:h-[580px] overflow-hidden"
                    style={{ background: visual.bg }}
                  >
                    {/* Notch overlay */}
                    <div className="absolute inset-x-0 top-0 z-10 h-6 flex justify-center pointer-events-none">
                      <div className="w-24 h-4 bg-gray-900 rounded-b-2xl" />
                    </div>
                    {/* Status bar */}
                    <div className="flex items-center justify-between px-5 pt-2 pb-1 text-white/85 text-[10px] font-semibold">
                      <span>9:41</span>
                      <div className="flex items-center gap-1">
                        <Signal className="w-3 h-3" />
                        <Wifi className="w-3 h-3" />
                        <BatteryFull className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <div className="flex flex-col items-center px-5 pt-3 pb-12">
                      {/* Handle pill */}
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-4">
                        <BadgeCheck className="w-2.5 h-2.5 text-white/85" />
                        <span className="text-[10px] font-semibold text-white/85 tracking-wide">{visual.handle}</span>
                      </div>

                      {/* Avatar with glow */}
                      <div className="relative mb-3">
                        <div
                          className="absolute inset-0 rounded-full blur-xl scale-125"
                          style={{ background: visual.accent, opacity: 0.55 }}
                        />
                        <motion.img
                          src={activePage.avatar}
                          alt=""
                          className="relative w-[78px] h-[78px] rounded-full object-cover ring-2 ring-white/80 shadow-2xl"
                          initial={{ scale: 0.85, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          loading="lazy"
                          width={78}
                          height={78}
                        />
                      </div>

                      {/* Name + verified */}
                      <motion.div
                        className="flex items-center gap-1 mb-0.5"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                      >
                        <h3 className="text-[15px] font-bold text-white leading-tight">
                          {lang === "ar" ? activePage.name : activePage.nameEn}
                        </h3>
                        <BadgeCheck className="w-4 h-4 text-white" fill={visual.accent} />
                      </motion.div>

                      {/* Bio */}
                      <motion.p
                        className="text-[11px] text-white/70 mb-2.5 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        {lang === "ar" ? activePage.bio : activePage.bioEn}
                      </motion.p>

                      {/* Stat chip */}
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide text-white mb-4"
                        style={{ background: `${visual.accent}33`, border: `1px solid ${visual.accent}66` }}
                      >
                        <span className="w-1 h-1 rounded-full bg-white/80" />
                        {lang === "ar" ? visual.statLabel.ar : visual.statLabel.en}
                      </span>

                      {/* Social row */}
                      <div className="flex items-center gap-2 mb-4">
                        {visual.socials.map((s) => {
                          const Icon = socialIconMap[s];
                          return (
                            <div
                              key={s}
                              className="w-7 h-7 rounded-full bg-white/12 border border-white/25 flex items-center justify-center backdrop-blur-sm"
                            >
                              <Icon className="w-3.5 h-3.5 text-white" />
                            </div>
                          );
                        })}
                      </div>

                      {/* Link buttons */}
                      <div className="w-full space-y-2">
                        {activePage.links.map((link, li) => {
                          const Icon = iconMap[link.icon] || ArrowRight;
                          return (
                            <motion.div
                              key={li}
                              initial={{ opacity: 0, x: lang === "ar" ? 16 : -16 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.25 + li * 0.07 }}
                              className="w-full py-2.5 px-3.5 rounded-2xl flex items-center gap-2.5 bg-white/12 border border-white/22 backdrop-blur-sm hover:bg-white/18 transition-colors"
                            >
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                                style={{ background: `${visual.accent}40` }}
                              >
                                <Icon className="w-3.5 h-3.5 text-white" />
                              </div>
                              <span className="text-[12px] font-semibold text-white truncate">
                                {lang === "ar" ? link.title : link.titleEn}
                              </span>
                              <ArrowRight className="w-3 h-3 text-white/60 ms-auto rtl:rotate-180" />
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Powered by snip */}
                    <div className="absolute bottom-3 inset-x-0 flex flex-col items-center gap-1 pointer-events-none">
                      <div className="text-[8px] font-bold tracking-[0.2em] text-white/45">
                        {lang === "ar" ? "بدعم من SNIP" : "POWERED BY SNIP"}
                      </div>
                      <div className="w-24 h-0.5 rounded-full bg-white/30" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Details panel */}
          <div className="max-w-sm text-center lg:text-start">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, x: lang === "ar" ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: lang === "ar" ? 20 : -20 }}
                transition={{ duration: 0.35 }}
              >
                <div className="inline-flex items-center gap-1.5 bg-[hsl(var(--sky))]/10 text-[hsl(var(--sky))] rounded-full px-3 py-1 text-xs font-body font-bold mb-4">
                  {lang === "ar" ? activePage.categoryAr : activePage.categoryEn}
                </div>
                <h3 className="font-display text-2xl md:text-3xl font-bold text-[hsl(var(--navy))] mb-3">
                  {lang === "ar" ? activePage.name : activePage.nameEn}
                </h3>
                <p className="font-body text-[hsl(var(--navy))]/60 mb-6 leading-relaxed">
                  {active === 0 && t(
                    "A designer sharing her portfolio, booking consultations, and connecting with clients through WhatsApp.",
                    "مصممة تشارك معرض أعمالها، تحجز استشارات، وتتواصل مع العملاء عبر الواتساب."
                  )}
                  {active === 1 && t(
                    "A restaurant showcasing its menu, enabling delivery orders, and sharing its location with customers.",
                    "مطعم يعرض قائمة طعامه، يتيح طلبات التوصيل، ويشارك موقعه مع الزبائن."
                  )}
                  {active === 2 && t(
                    "A tech company presenting its services and making it easy for clients to get in touch.",
                    "شركة تقنية تعرض خدماتها وتسهّل التواصل مع العملاء."
                  )}
                </p>

                {/* Feature tags */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-8">
                  {activePage.links.map((link, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 bg-white border border-[hsl(var(--navy))]/8 rounded-full px-3 py-1.5 text-xs font-body text-[hsl(var(--navy))]/70 shadow-sm"
                    >
                      {(() => { const Icon = iconMap[link.icon] || ArrowRight; return <Icon className="w-3 h-3" />; })()}
                      {lang === "ar" ? link.title : link.titleEn}
                    </span>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Dots indicator */}
            <div className="flex justify-center lg:justify-start gap-2 mb-8">
              {showcasePages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className={`rounded-full transition-all duration-300 ${
                    active === i
                      ? "w-8 h-2.5 bg-[hsl(var(--sky))]"
                      : "w-2.5 h-2.5 bg-[hsl(var(--navy))]/15 hover:bg-[hsl(var(--navy))]/30"
                  }`}
                />
              ))}
            </div>

            <Button asChild className="bg-[hsl(var(--sky))] text-white font-body font-bold rounded-full px-8 py-6 text-base hover:brightness-110 transition-all shadow-lg shadow-[hsl(var(--sky))]/20">
              <Link to="/signup">
                {t("Create Your Bio Page Free", "أنشئ صفحتك مجاناً")}
                <ArrowRight size={16} className="ms-1.5" />
              </Link>
            </Button>
          </div>
        </div>

      </div>
    </section>
  );
};

export default BioShowcase;
