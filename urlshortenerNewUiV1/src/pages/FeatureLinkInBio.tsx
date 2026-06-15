import React, { useRef, useEffect, useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import CTASection from "@/components/landing/CTASection";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Eye, MousePointerClick, TrendingUp, Smartphone, Sparkles, Blocks, Zap, Star, Youtube, Instagram, Briefcase, PlayCircle, UtensilsCrossed, CalendarCheck, MessageCircle, MapPin, ShoppingBag, Music2, BadgeCheck, ChevronRight, Wifi, BatteryFull, Signal, Globe, BarChart3, Palette, Languages, Link2, Phone } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useSmartLink } from "@/hooks/useSmartLink";
import { BioPreview } from "@/components/landing/BioPreviewMockup";
import brewHouseLogo from "@/assets/brew-house-logo.png";
import bgCreators from "@/assets/bg-creators.jpg";
import bgBusinesses from "@/assets/bg-businesses.jpg";
import bgInfluencers from "@/assets/bg-influencers.jpg";

/* ─── Animated floating shapes ─── */
const FloatingShape = ({ className, delay = 0, duration = 20, children }: { className?: string; delay?: number; duration?: number; children?: React.ReactNode }) => (
  <motion.div
    className={className}
    animate={{
      y: [0, -20, 0, 15, 0],
      x: [0, 10, -5, 8, 0],
      rotate: [0, 5, -3, 4, 0],
    }}
    transition={{ duration, repeat: Infinity, delay, ease: "easeInOut" }}
  >
    {children}
  </motion.div>
);

/* ─── Animated gradient orb ─── */
const GlowOrb = ({ className, color1, color2, delay = 0 }: { className?: string; color1: string; color2: string; delay?: number }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
    style={{ background: `radial-gradient(circle, ${color1}, ${color2})` }}
    animate={{
      scale: [1, 1.2, 1, 0.9, 1],
      opacity: [0.06, 0.12, 0.08, 0.1, 0.06],
    }}
    transition={{ duration: 8, repeat: Infinity, delay, ease: "easeInOut" }}
  />
);

const SocialSvg = ({ name }: { name: string }) => {
  const cls = "w-3.5 h-3.5 text-white";
  switch (name) {
    case "instagram":
      return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" /></svg>);
    case "youtube":
      return (<svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31.9 31.9 0 000 12a31.9 31.9 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1c.3-1.8.5-3.8.5-5.8s-.2-4-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z" /></svg>);
    case "dribbble":
      return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M19.13 5.09C15.22 9.14 10 10.44 2.25 10.94" /><path d="M21.75 12.84c-6.62-1.41-12.14 1-16.38 6.32" /><path d="M8.56 2.75c4.37 6 6 12.56 6.44 21.25" /></svg>);
    case "tiktok":
      return (<svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M16.6 5.82A4.28 4.28 0 0113.8 3h-3v12.4a2.59 2.59 0 01-2.6 2.6 2.59 2.59 0 01-2.6-2.6 2.59 2.59 0 012.6-2.6c.28 0 .55.05.8.13V9.73A5.8 5.8 0 002.2 15.4a5.8 5.8 0 005.8 5.8 5.8 5.8 0 005.8-5.8V9.57a7.46 7.46 0 004.4 1.43V7.8a4.28 4.28 0 01-1.6-1.98z" /></svg>);
    case "snapchat":
      return (<svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-3 0-5.2 2-5.5 5.2-.1.8-.1 1.7-.3 2.5-.1.4-.5.8-.9 1-.3.1-.6.2-.8.3-.3.2-.3.5 0 .8.5.3 1 .5 1.4.8.3.2.5.5.5.9 0 .5-.3 1-.7 1.3-.6.5-1.3.8-2 1-.5.2-.6.4-.4.9.2.4.5.6.9.7.6.1 1.2.2 1.6.5.4.3.6.7.7 1.2 0 .1 0 .2.1.3.5-.1 1-.3 1.6-.3.7 0 1.2.2 1.8.5 1 .5 1.8 1.2 3 1.3 1.2-.1 2-.8 3-1.3.6-.3 1.1-.5 1.8-.5.6 0 1.1.2 1.6.3.1-.1.1-.2.1-.3.1-.5.3-.9.7-1.2.4-.3 1-.4 1.6-.5.4-.1.7-.3.9-.7.2-.5.1-.7-.4-.9-.7-.2-1.4-.5-2-1-.4-.3-.7-.8-.7-1.3 0-.4.2-.7.5-.9.4-.3.9-.5 1.4-.8.3-.3.3-.6 0-.8-.2-.1-.5-.2-.8-.3-.4-.2-.8-.6-.9-1-.2-.8-.2-1.7-.3-2.5C17.2 4 15 2 12 2z" /></svg>);
    case "whatsapp":
      return (<svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15s-.77.97-.94 1.17c-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.53-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.53.07-.8.37s-1.04 1.02-1.04 2.49 1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.31 1.27.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.69.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35zM12.05 21.8a9.77 9.77 0 01-4.98-1.37l-.36-.21-3.73.98.99-3.63-.23-.37a9.77 9.77 0 01-1.5-5.2c0-5.4 4.4-9.8 9.81-9.8a9.74 9.74 0 016.94 2.87 9.74 9.74 0 012.87 6.93c0 5.4-4.4 9.8-9.81 9.8zM20.52 3.48A11.77 11.77 0 0012.05 0C5.46 0 .11 5.34.11 11.93a11.9 11.9 0 001.59 5.95L0 24l6.3-1.65a11.87 11.87 0 005.75 1.47c6.59 0 11.94-5.34 11.94-11.93a11.87 11.87 0 00-3.47-8.41z" /></svg>);
    case "map-pin":
      return (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>);
    default:
      return <span className="text-white text-[8px] font-bold">{name}</span>;
  }
};

/* ═══════════════════════════════════════════════════════════════════
   FEATURE PHONE MOCKUP — 4 polished variants matching each feature
   ═══════════════════════════════════════════════════════════════════ */
const FeaturePhoneMockup = ({ variant, t, lang }: { variant: number; t: (en: string, ar: string) => string; lang: string }) => {
  const isAr = lang === "ar";

  const StatusBar = ({ textColor = "white" }: { textColor?: string }) => (
    <div className="flex items-center justify-between px-6 pt-2 pb-1 text-[10px] font-semibold" style={{ color: textColor }}>
      <span>9:41</span>
      <div className="flex items-center gap-1">
        <Signal className="w-3 h-3" />
        <Wifi className="w-3 h-3" />
        <BatteryFull className="w-3.5 h-3.5" />
      </div>
    </div>
  );

  const renderContent = () => {
    switch (variant) {
      // ───────── 0: Beautiful Themes — vivid, colorful, expressive ─────────
      case 0:
        return (
          <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, #1A0B2E 0%, #2D1B4E 35%, #C44CFF 70%, #FFB86C 100%)" }}>
            <StatusBar />
            <div className="px-5 pt-3 flex flex-col items-center text-white">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-[9px] font-bold mb-3">
                <Palette className="w-2.5 h-2.5" /> {t("THEME · MIDNIGHT GLOW", "ثيم · توهج الليل")}
              </div>
              <div className="relative mb-2">
                <div className="absolute inset-0 rounded-full blur-lg bg-[#FFB86C]/60 scale-110" />
                <div className="relative w-16 h-16 rounded-full ring-2 ring-white/80 shadow-xl bg-gradient-to-br from-[#FFB86C] via-[#FF6B9D] to-[#C44CFF] flex items-center justify-center text-2xl font-display font-bold">
                  L
                </div>
              </div>
              <div className="flex items-center gap-1 mb-0.5">
                <h3 className="text-[13px] font-bold">{t("Layla Studio", "ليلى ستوديو")}</h3>
                <BadgeCheck className="w-3 h-3" fill="#FFB86C" stroke="#1A0B2E" />
              </div>
              <p className="text-[10px] text-white/75 mb-3">{t("Visual Artist · Jeddah", "فنانة بصرية · جدة")}</p>
              <div className="w-full space-y-2">
                {[
                  { label: t("Latest Drop · Posters", "أحدث الأعمال · بوسترات"), bg: "linear-gradient(90deg, #FFB86C, #FF6B9D)" },
                  { label: t("Shop Prints", "متجر اللوحات"), bg: "linear-gradient(90deg, #C44CFF, #6B4CFF)" },
                  { label: t("Behind the scenes", "خلف الكواليس"), bg: "rgba(255,255,255,0.14)" },
                ].map((b, i) => (
                  <div key={i} className="w-full py-2.5 px-3 rounded-2xl text-[11px] font-bold text-white text-center backdrop-blur-sm border border-white/20" style={{ background: b.bg }}>
                    {b.label}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                {[Instagram, Music2, Youtube].map((Icon, i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-white/20 border border-white/30 flex items-center justify-center backdrop-blur-sm">
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      // ───────── 1: Arabic & RTL — proper right-to-left layout ─────────
      case 1:
        return (
          <div dir="rtl" className="absolute inset-0" style={{ background: "linear-gradient(160deg, hsl(35 50% 96%) 0%, hsl(35 40% 90%) 100%)", fontFamily: "'Noto Kufi Arabic', sans-serif" }}>
            <StatusBar textColor="#7a253a" />
            <div className="px-5 pt-3 flex flex-col items-center text-[#7a253a]">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#7a253a]/10 border border-[#7a253a]/20 text-[9px] font-bold mb-3" style={{ direction: "rtl" }}>
                <Languages className="w-2.5 h-2.5" /> العربية · RTL
              </div>
              <div className="relative mb-2">
                <div className="w-16 h-16 rounded-full ring-2 ring-[#7a253a]/30 shadow-lg bg-gradient-to-br from-[#a83244] to-[#7a253a] flex items-center justify-center text-white text-xl font-bold">
                  ن
                </div>
              </div>
              <div className="flex items-center gap-1 mb-0.5 flex-row-reverse">
                <BadgeCheck className="w-3 h-3" fill="#a83244" stroke="white" />
                <h3 className="text-[13px] font-bold">نورة الشمري</h3>
              </div>
              <p className="text-[10px] text-[#7a253a]/70 mb-3">كاتبة محتوى · الرياض</p>
              <div className="w-full space-y-2">
                {[
                  { label: "مدونتي الشخصية", icon: Globe },
                  { label: "مقالاتي الأخيرة", icon: Briefcase },
                  { label: "تواصل معي", icon: MessageCircle },
                ].map((b, i) => (
                  <div key={i} className="w-full py-2.5 px-3 rounded-xl flex items-center gap-2 bg-white border border-[#7a253a]/10 shadow-sm" style={{ flexDirection: "row-reverse" }}>
                    <div className="w-6 h-6 rounded-full bg-[#7a253a]/10 flex items-center justify-center">
                      <b.icon className="w-3 h-3 text-[#7a253a]" />
                    </div>
                    <span className="text-[11px] font-bold text-[#7a253a] flex-1 text-right">{b.label}</span>
                    <ChevronRight className="w-3 h-3 text-[#7a253a]/40 rotate-180" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      // ───────── 2: WhatsApp — prominent WhatsApp button ─────────
      case 2:
        return (
          <div className="absolute inset-0" style={{ background: "linear-gradient(165deg, #ECFDF5 0%, #D1FAE5 100%)" }}>
            <StatusBar textColor="#064E3B" />
            <div className="px-5 pt-3 flex flex-col items-center text-[#064E3B]">
              <div className="w-16 h-16 rounded-full ring-2 ring-[#25D366]/40 shadow-lg bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white text-xl font-bold mb-2">
                B
              </div>
              <div className="flex items-center gap-1 mb-0.5">
                <h3 className="text-[13px] font-bold">{t("Brew House", "بيت القهوة")}</h3>
                <BadgeCheck className="w-3 h-3" fill="#25D366" stroke="white" />
              </div>
              <p className="text-[10px] text-[#064E3B]/70 mb-3">{t("Specialty Coffee · Olaya", "قهوة مختصة · العليا")}</p>

              {/* Prominent WhatsApp button */}
              <a className="w-full py-3 px-4 rounded-2xl flex items-center justify-center gap-2 mb-2 shadow-lg" style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)", boxShadow: "0 8px 24px -6px rgba(37,211,102,0.5)" }}>
                <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                  <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1s-.7 1-.9 1.2-.4.2-.6.1c-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.7-1.7-2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5 0-.2 0-.4-.1-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4s-1 1-1 2.5 1.1 2.9 1.2 3.1 2.1 3.2 5.1 4.5c1.7.6 2.4.7 3.2.6.5-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.2-.1-.4-.2-.7-.4zM12 2C6.5 2 2 6.5 2 12c0 2.1.6 4 1.7 5.6L2 22l4.5-1.7C8.1 21.4 10 22 12 22c5.5 0 10-4.5 10-10S17.5 2 12 2z" />
                </svg>
                <span className="text-[12px] font-bold text-white">{t("Message us on WhatsApp", "راسلنا على واتساب")}</span>
              </a>
              <div className="text-[8px] text-[#064E3B]/50 mb-3">{t("Usually replies in minutes", "نرد عادة خلال دقائق")}</div>

              <div className="w-full space-y-1.5">
                {[
                  { label: t("View Menu", "تصفح القائمة"), icon: UtensilsCrossed },
                  { label: t("Reserve a Table", "احجز طاولة"), icon: CalendarCheck },
                ].map((b, i) => (
                  <div key={i} className="w-full py-2 px-3 rounded-xl flex items-center gap-2 bg-white border border-[#064E3B]/10 shadow-sm">
                    <div className="w-6 h-6 rounded-full bg-[#25D366]/15 flex items-center justify-center">
                      <b.icon className="w-3 h-3 text-[#128C7E]" />
                    </div>
                    <span className="text-[10px] font-semibold text-[#064E3B]">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      // ───────── 3: Custom Domain — branded URL prominently shown ─────────
      case 3:
        return (
          <div className="absolute inset-0" style={{ background: "linear-gradient(170deg, hsl(220 45% 18%) 0%, hsl(215 45% 28%) 60%, hsl(210 55% 42%) 100%)" }}>
            <StatusBar />
            {/* Browser-style URL bar */}
            <div className="mx-4 mt-1 mb-2 rounded-full bg-white/15 border border-white/25 backdrop-blur-sm px-3 py-1.5 flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-400/30 flex items-center justify-center">
                <Link2 className="w-2 h-2 text-emerald-300" />
              </div>
              <span className="text-[9px] font-mono font-bold text-white">nuqta.studio</span>
              <BadgeCheck className="w-2.5 h-2.5 text-emerald-300" />
            </div>
            <div className="px-5 flex flex-col items-center text-white">
              <div className="w-14 h-14 rounded-2xl ring-2 ring-white/40 shadow-lg bg-gradient-to-br from-[#a83244] to-[#7a253a] flex items-center justify-center text-white text-lg font-bold mb-2">
                N
              </div>
              <div className="flex items-center gap-1 mb-0.5">
                <h3 className="text-[13px] font-bold">{t("Nuqta Studio", "ستوديو نقطة")}</h3>
                <BadgeCheck className="w-3 h-3" fill="white" stroke="hsl(215 45% 28%)" />
              </div>
              <p className="text-[10px] text-white/70 mb-3">{t("Branding & Web Design", "هوية ومواقع")}</p>
              <div className="w-full space-y-1.5">
                {[
                  { label: t("Our Work", "أعمالنا"), icon: Briefcase },
                  { label: t("Get a Quote", "اطلب عرض سعر"), icon: MessageCircle },
                  { label: t("Visit Site", "زيارة الموقع"), icon: Globe },
                ].map((b, i) => (
                  <div key={i} className="w-full py-2 px-3 rounded-xl flex items-center gap-2 bg-white/12 border border-white/20 backdrop-blur-sm">
                    <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">
                      <b.icon className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-[10px] font-semibold text-white">{b.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 inline-flex items-center gap-1 text-[8px] font-mono text-white/60">
                <Globe className="w-2.5 h-2.5" /> {t("Your domain · Powered by snip.sa", "دومينك · بدعم من snip.sa")}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative w-[280px]">
      <div className="rounded-[36px] border-[6px] border-gray-900 bg-gray-900 shadow-2xl overflow-hidden">
        <div className="relative h-[560px] overflow-hidden">
          {/* Notch */}
          <div className="absolute inset-x-0 top-0 z-10 h-6 flex justify-center pointer-events-none">
            <div className="w-28 h-4 bg-gray-900 rounded-b-2xl" />
          </div>
          {renderContent()}
        </div>
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-gray-700 rounded-full" />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   THEME SHOWCASE (Everything you need) — auto-cycling
   ═══════════════════════════════════════════════════════════════════ */
const ThemeShowcaseSection = ({ features, t }: { features: string[]; t: (en: string, ar: string) => string }) => {
  const { lang } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const featureItems = [
    { title: t("Beautiful Themes", "ثيمات جميلة"), desc: t("Choose from curated themes or fully customize colors, fonts, and backgrounds to match your brand.", "اختر من ثيمات مختارة أو خصص الألوان والخطوط والخلفيات لتناسب علامتك التجارية."), color: "hsl(var(--navy))" },
    { title: t("Full Arabic & RTL", "دعم كامل للعربية"), desc: t("Native Arabic support with proper right-to-left layout. Built from the ground up for Arabic speakers.", "دعم عربي أصلي مع تنسيق من اليمين لليسار. مبني من الأساس للعرب."), color: "hsl(145,70%,42%)" },
    { title: t("WhatsApp Button", "زر واتساب"), desc: t("Let visitors message you directly with one tap. Perfect for businesses.", "خل الزوار يتواصلون معك مباشرة بضغطة واحدة. مثالي للشركات."), color: "hsl(145,70%,42%)" },
    { title: t("Custom Domain", "دومين مخصص"), desc: t("Use your own domain for a professional, branded bio link.", "استخدم دومينك الخاص لرابط بايو احترافي بعلامتك التجارية."), color: "hsl(280,60%,55%)" },
  ];

  // Auto-cycle every 4s. Pause when user manually selects (briefly).
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % featureItems.length);
    }, 4000);
    return () => clearInterval(id);
  }, [paused, featureItems.length]);

  const handleSelect = (i: number) => {
    setActiveIndex(i);
    setPaused(true);
    // resume autoplay after 8s of inactivity
    window.clearTimeout((handleSelect as any)._t);
    (handleSelect as any)._t = window.setTimeout(() => setPaused(false), 8000);
  };

  return (
    <section className="py-24 md:py-32 relative overflow-hidden" style={{ background: "linear-gradient(180deg, hsl(35 40% 95%) 0%, hsl(35 30% 93%) 50%, hsl(35 40% 95%) 100%)" }}>
      {/* Animated orbs */}
      <GlowOrb className="w-96 h-96 top-10 end-[5%]" color1="hsl(var(--sky))" color2="transparent" delay={0} />
      <GlowOrb className="w-80 h-80 bottom-20 start-[8%]" color1="hsl(280,60%,55%)" color2="transparent" delay={3} />

      {/* Decorative shapes */}
      <FloatingShape className="absolute top-32 end-[15%] opacity-[0.06] pointer-events-none" delay={1} duration={25}>
        <div className="w-16 h-16 rounded-2xl rotate-45 border-2 border-[hsl(var(--sky))]" />
      </FloatingShape>
      <FloatingShape className="absolute bottom-40 start-[12%] opacity-[0.05] pointer-events-none" delay={3} duration={22}>
        <div className="w-10 h-10 rounded-full border-2 border-[hsl(280,60%,55%)]" />
      </FloatingShape>
      <FloatingShape className="absolute top-1/2 start-[3%] opacity-[0.04] pointer-events-none" delay={5} duration={30}>
        <Star className="w-8 h-8 text-[hsl(var(--sky))]" />
      </FloatingShape>

      <div className="container mx-auto px-6 relative">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
          <motion.span initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-[hsl(var(--sky))]/15 to-[hsl(280,60%,55%)]/10 text-[hsl(var(--sky))] text-xs font-bold font-body mb-6 border border-[hsl(var(--sky))]/10">
            <Sparkles className="w-3.5 h-3.5" />
            {t("Features", "المميزات")}
          </motion.span>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[hsl(var(--navy))] mb-4">
            {t("Everything you need", "كل اللي تحتاجه")}
          </h2>
          <p className="font-body text-lg text-[hsl(var(--navy))]/45 max-w-lg mx-auto">
            {t("No missing features. No paywalls. Everything included from day one.", "بدون ميزات ناقصة. بدون رسوم. كل شي من أول يوم.")}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 max-w-6xl mx-auto">
          {/* Left: feature list */}
          <div className="space-y-3">
            {featureItems.map((item, i) => {
              const isActive = i === activeIndex;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className={`group relative rounded-2xl p-6 transition-all duration-400 cursor-pointer ${isActive ? "bg-white shadow-xl border border-[hsl(var(--navy))]/8 scale-[1.02]" : "bg-transparent border border-transparent hover:bg-white/60 hover:border-[hsl(var(--navy))]/4"}`}
                  onClick={() => handleSelect(i)}
                >
                  {/* Active indicator bar */}
                  <motion.div
                    className="absolute start-0 top-4 bottom-4 w-1 rounded-full"
                    style={{ backgroundColor: item.color }}
                    initial={false}
                    animate={{ opacity: isActive ? 1 : 0, scaleY: isActive ? 1 : 0.5 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  />
                  <div className="ps-4">
                    <h3 className={`font-display text-lg font-bold mb-1.5 transition-colors duration-300 ${isActive ? "text-[hsl(var(--navy))]" : "text-[hsl(var(--navy))]/60"}`}>{item.title}</h3>
                    <motion.p
                      className="font-body text-sm leading-relaxed text-[hsl(var(--navy))]/45"
                      initial={false}
                      animate={{ height: isActive ? "auto" : 0, opacity: isActive ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ overflow: "hidden" }}
                    >
                      {item.desc}
                    </motion.p>
                  </div>
                  {/* Mobile: inline phone mockup */}
                  <motion.div
                    className="lg:hidden mt-5"
                    initial={false}
                    animate={{ height: isActive ? "auto" : 0, opacity: isActive ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div className="flex justify-center">
                      <FeaturePhoneMockup variant={i} t={t} lang={lang} />
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}

            {/* Progress dots */}
            <div className="flex justify-center gap-2 pt-4">
              {featureItems.map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${i === activeIndex ? "w-6 bg-[hsl(var(--sky))]" : "bg-[hsl(var(--navy))]/15 hover:bg-[hsl(var(--navy))]/30"}`}
                />
              ))}
            </div>
          </div>

          {/* Right: sticky phone mockup (desktop) */}
          <div className="hidden lg:flex justify-center">
            <div className="sticky top-28">
              <div className="relative">
                {/* Animated glow ring */}
                <motion.div
                  className="absolute -inset-4 rounded-[3rem] pointer-events-none"
                  animate={{
                    boxShadow: [
                      `0 0 40px 10px ${featureItems[activeIndex].color}15`,
                      `0 0 60px 20px ${featureItems[activeIndex].color}20`,
                      `0 0 40px 10px ${featureItems[activeIndex].color}15`,
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeIndex}
                    initial={{ opacity: 0, y: 20, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.96 }}
                    transition={{ duration: 0.4, type: "spring", stiffness: 110 }}
                    className="relative"
                  >
                    <FeaturePhoneMockup variant={activeIndex} t={t} lang={lang} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   STEPS ANIMATION (Ready in 60 seconds)
   ═══════════════════════════════════════════════════════════════════ */
const StepsAnimationSection = ({ steps, t }: { steps: { num: string; emoji: string; title: string; desc: string }[]; t: (en: string, ar: string) => string }) => {
  const { smartLink } = useSmartLink();
  const stepData = [
    { gradient: "from-[hsl(var(--sky))] to-[hsl(280,60%,55%)]", bgAccent: "bg-[hsl(var(--sky))]/6", iconBg: "hsl(var(--sky))" },
    { gradient: "from-[hsl(var(--navy))] to-[hsl(var(--sky))]", bgAccent: "bg-[hsl(var(--navy))]/5", iconBg: "hsl(var(--navy))" },
    { gradient: "from-[hsl(145,70%,42%)] to-[hsl(170,60%,45%)]", bgAccent: "bg-[hsl(145,70%,42%)]/5", iconBg: "hsl(145,70%,42%)" },
  ];

  return (
    <section className="section-cream py-24 md:py-32 relative overflow-hidden">
      <GlowOrb className="w-[500px] h-[500px] top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2" color1="hsl(var(--sky))" color2="transparent" />

      <FloatingShape className="absolute top-20 end-[10%] opacity-[0.04] pointer-events-none" delay={2}>
        <Zap className="w-12 h-12 text-[hsl(var(--sky))]" />
      </FloatingShape>

      <div className="container mx-auto px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-[hsl(145,70%,42%)]/10 to-[hsl(var(--sky))]/10 text-[hsl(145,70%,42%)] text-xs font-bold font-body mb-6 border border-[hsl(145,70%,42%)]/10"
          >
            <Zap className="w-3.5 h-3.5" />
            {t("Quick setup", "إعداد سريع")}
          </motion.span>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-[hsl(var(--navy))] mb-4">
            {t("Ready in 60 seconds", "جاهز في 60 ثانية")}
          </h2>
          <p className="font-body text-lg text-[hsl(var(--navy))]/45 max-w-md mx-auto">
            {t("Three steps. No friction.", "ثلاث خطوات. بدون تعقيد.")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((s, i) => {
            const sd = stepData[i];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40, rotateX: 10 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, type: "spring", stiffness: 80, damping: 15 }}
                className="group relative"
              >
                <div className="relative bg-white rounded-3xl overflow-hidden border border-[hsl(var(--navy))]/6 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-400">
                  {/* Gradient accent bar */}
                  <div className={`h-1.5 bg-gradient-to-r ${sd.gradient}`} />

                  {/* Decorative bg */}
                  <div className={`absolute top-8 end-4 w-24 h-24 ${sd.bgAccent} rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-500`} />

                  <div className="p-8 pt-7 relative">
                    <motion.div
                      className="mb-6"
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${sd.gradient} flex items-center justify-center shadow-lg`}>
                        <span className="font-display text-2xl font-bold text-white">{s.num}</span>
                      </div>
                    </motion.div>

                    <h3 className="font-display font-bold text-xl text-[hsl(var(--navy))] mb-3">{s.title}</h3>
                    <p className="font-body text-sm text-[hsl(var(--navy))]/50 leading-relaxed">{s.desc}</p>
                  </div>
                </div>

                {/* Connector */}
                {i < 2 && (
                  <div className="hidden md:flex absolute top-1/2 -end-4 -translate-y-1/2 z-10">
                    <motion.div
                      className="w-8 h-8 rounded-full bg-white border-2 border-[hsl(var(--sky))]/20 shadow-md flex items-center justify-center"
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-[hsl(var(--sky))] rtl:rotate-180" />
                    </motion.div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-14"
        >
          <Link to={smartLink("/signup", "/dashboard/bio-pages")}>
            <Button className="bg-gradient-to-r from-[hsl(var(--sky))] to-[hsl(var(--navy))] text-white font-body font-bold rounded-full px-10 py-4 h-auto text-base shadow-xl shadow-[hsl(var(--sky))]/25 hover:shadow-2xl hover:shadow-[hsl(var(--sky))]/35 hover:scale-105 transition-all duration-300">
              {t("Start building now", "ابدأ البناء الآن")}
              <ArrowRight size={16} className="ms-2 rtl:rotate-180" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════ */
const FeatureLinkInBio = () => {
  const { t, isAr } = useLanguage();
  const { smartLink } = useSmartLink();

  const features = [
    t("Full Arabic & RTL support", "دعم كامل للعربية و RTL"),
    t("12+ block types", "أكثر من 12 نوع بلوك"),
    t("Beautiful themes", "ثيمات جميلة"),
    t("WhatsApp button", "زر واتساب"),
    t("Custom domain", "نطاق مخصص"),
    t("Page analytics", "تحليلات الصفحة"),
    t("Drag & drop builder", "محرر سحب وإفلات"),
    t("Contact forms", "نماذج تواصل"),
  ];

  const useCases = [
    {
      title: t("Creators", "المبدعين"),
      desc: t("One page for your portfolio, social links, and latest content.", "صفحة واحدة لمعرض أعمالك وروابط السوشال وآخر محتواك."),
      gradient: "from-[hsl(280,60%,55%)] to-[hsl(var(--sky))]",
      profileName: t("فاطمة الحربي", "فاطمة الحربي"),
      profileBio: t("UI/UX Designer", "مصممة واجهات"),
      avatarInitials: "SD",
      bgImage: bgCreators,
      socials: ["instagram", "youtube", "dribbble"],
      handle: "snip.sa/fatima",
      verified: true,
      stats: { label: t("Profile views", "مشاهدات الصفحة"), value: "12.4K" },
      theme: {
        bg: "linear-gradient(160deg, hsl(265 55% 22%) 0%, hsl(285 60% 32%) 55%, hsl(330 65% 45%) 100%)",
        fg: "#ffffff",
        btnBg: "rgba(255,255,255,0.14)",
        btnBorder: "rgba(255,255,255,0.18)",
        btnFg: "#ffffff",
        accent: "#f5d4ff",
      },
      links: [
        { icon: Briefcase, label: t("View my portfolio", "شاهد أعمالي"), sub: t("18 projects", "18 مشروع") },
        { icon: PlayCircle, label: t("Latest case study", "آخر دراسة حالة"), sub: t("New", "جديد") },
        { icon: Youtube, label: t("Design tutorials", "دروس تصميم"), sub: "YouTube" },
        { icon: Instagram, label: t("Daily inspiration", "إلهام يومي"), sub: "@fatima.designs" },
      ],
    },
    {
      title: t("Restaurants", "المطاعم"),
      desc: t("Share your location, menu, offers, and let customers reach you on WhatsApp.", "شارك موقعك وقائمتك وعروضك وخل العملاء يتواصلون معك عبر الواتساب."),
      gradient: "from-[hsl(var(--sky))] to-[hsl(350,60%,55%)]",
      profileName: t("بيت القهوة", "بيت القهوة"),
      profileBio: t("Specialty Coffee · Riyadh", "قهوة مختصة · الرياض"),
      avatarInitials: "BH",
      avatarImage: brewHouseLogo,
      bgImage: bgBusinesses,
      socials: ["instagram", "whatsapp", "map-pin"],
      handle: "snip.sa/brewhouse",
      verified: true,
      stats: { label: t("Open now", "مفتوح الآن"), value: "·" },
      theme: {
        bg: "linear-gradient(170deg, hsl(28 35% 14%) 0%, hsl(22 40% 22%) 60%, hsl(30 50% 30%) 100%)",
        fg: "#fdf6ec",
        btnBg: "rgba(253,246,236,0.08)",
        btnBorder: "rgba(253,246,236,0.16)",
        btnFg: "#fdf6ec",
        accent: "#e8b87a",
      },
      links: [
        { icon: UtensilsCrossed, label: t("View our menu", "تصفح القائمة"), sub: t("Updated daily", "محدثة يومياً") },
        { icon: CalendarCheck, label: t("Reserve a table", "احجز طاولة"), sub: t("Quick book", "حجز سريع") },
        { icon: MessageCircle, label: t("WhatsApp order", "اطلب واتساب"), sub: t("Reply in 2 min", "رد خلال دقيقتين") },
        { icon: MapPin, label: t("Find us", "الموقع"), sub: t("Al Olaya, Riyadh", "العليا، الرياض") },
      ],
    },
    {
      title: t("Businesses", "الأعمال"),
      desc: t("One link for all platforms, brand deals, and affiliate links with full analytics.", "رابط واحد لكل منصاتك وصفقات البراندات وروابط الأفلييت مع تحليلات كاملة."),
      gradient: "from-[hsl(var(--navy))] to-[hsl(var(--sky))]",
      profileName: t("Nuqta Studio", "ستوديو نقطة"),
      profileBio: t("Branding & Web · Est. 2021", "هوية ومواقع · تأسس 2021"),
      avatarInitials: "NQ",
      bgImage: bgInfluencers,
      socials: ["instagram", "youtube", "whatsapp"],
      handle: "snip.sa/nuqta",
      verified: true,
      stats: { label: t("Clients served", "عملاء مخدومون"), value: "240+" },
      theme: {
        bg: "linear-gradient(180deg, #f7f5f0 0%, #ffffff 100%)",
        fg: "#0f1b3d",
        btnBg: "#ffffff",
        btnBorder: "rgba(15,27,61,0.10)",
        btnFg: "#0f1b3d",
        accent: "#3b6fa0",
      },
      links: [
        { icon: Briefcase, label: t("Our services", "خدماتنا"), sub: t("Branding · Web · UX", "هوية · مواقع · تجربة") },
        { icon: Eye, label: t("Featured work", "أعمال مختارة"), sub: t("12 case studies", "12 دراسة") },
        { icon: MessageCircle, label: t("Start a project", "ابدأ مشروع"), sub: t("Free consultation", "استشارة مجانية") },
        { icon: ShoppingBag, label: t("Shop templates", "متجر القوالب"), sub: t("From 49 SAR", "من 49 ريال") },
      ],
    },
  ];

  const steps = [
    { num: "1", emoji: "🎨", title: t("Choose a theme", "اختر ثيم"), desc: t("Pick from beautiful pre-made themes.", "اختر من ثيمات جاهزة وجميلة.") },
    { num: "2", emoji: "🧩", title: t("Add your content", "أضف محتواك"), desc: t("Drag and drop blocks to build your page.", "اسحب وأفلت البلوكات لبناء صفحتك.") },
    { num: "3", emoji: "🚀", title: t("Share your link", "شارك رابطك"), desc: t("Put snip.sa/you in your bio and go.", "حط snip.sa/you في البايو وانطلق.") },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ═══ HERO ═══ */}
      <section className="section-cream pt-32 pb-20 md:pt-40 md:pb-28 relative overflow-hidden">
        {/* Animated background orbs */}
        <GlowOrb className="w-[500px] h-[500px] -top-20 end-[5%]" color1="hsl(var(--sky))" color2="transparent" delay={0} />
        <GlowOrb className="w-[400px] h-[400px] bottom-0 start-[3%]" color1="hsl(280,60%,55%)" color2="transparent" delay={2} />
        <GlowOrb className="w-72 h-72 top-1/3 start-[40%]" color1="hsl(350,60%,55%)" color2="transparent" delay={4} />

        {/* Floating decorative shapes */}
        <FloatingShape className="absolute top-40 end-[8%] opacity-[0.05] pointer-events-none" delay={0} duration={18}>
          <div className="w-20 h-20 rounded-3xl rotate-12 border-2 border-[hsl(var(--sky))]" />
        </FloatingShape>
        <FloatingShape className="absolute bottom-20 start-[15%] opacity-[0.04] pointer-events-none" delay={2} duration={22}>
          <div className="w-14 h-14 rounded-full border-2 border-[hsl(280,60%,55%)]" />
        </FloatingShape>
        <FloatingShape className="absolute top-60 start-[5%] opacity-[0.03] pointer-events-none" delay={4} duration={26}>
          <Star className="w-10 h-10 text-[hsl(var(--navy))]" />
        </FloatingShape>
        <FloatingShape className="absolute bottom-40 end-[20%] opacity-[0.04] pointer-events-none" delay={6} duration={20}>
          <Sparkles className="w-8 h-8 text-[hsl(var(--sky))]" />
        </FloatingShape>

        {/* Subtle dot pattern */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle, hsl(var(--navy)) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />

        <div className="container mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 60 }}
            >
              <motion.span
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-[hsl(var(--sky))]/15 to-[hsl(280,60%,55%)]/10 text-[hsl(var(--sky))] text-xs font-bold font-body mb-7 border border-[hsl(var(--sky))]/10 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {t("Link in Bio", "رابط البايو")}
              </motion.span>

              <h1 className="font-display text-4xl md:text-5xl lg:text-[3.75rem] font-bold mb-7 tracking-tight leading-[1.08] text-[hsl(var(--navy))]">
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="block"
                >
                  {t("One link.", "رابط واحد.")}
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="block bg-gradient-to-r from-[hsl(var(--sky))] to-[hsl(280,60%,55%)] bg-clip-text text-transparent"
                >
                  {t("Infinite possibilities.", "إمكانيات لا نهائية.")}
                </motion.span>
              </h1>
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="font-body text-lg leading-relaxed mb-10 max-w-md text-[hsl(var(--navy))]/55"
              >
                {t(
                  "Create a beautiful bio page with Arabic support, custom themes, and analytics. Free forever.",
                  "أنشئ صفحة بايو جميلة مع دعم العربية وثيمات مخصصة وتحليلات. مجاناً للأبد."
                )}
              </motion.p>

              {/* CTA input */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="flex items-center gap-0 max-w-md mb-7"
              >
                <div className="flex-1 flex items-center bg-white rounded-s-full border border-e-0 border-[hsl(var(--navy))]/10 px-5 py-4 shadow-md">
                  <span className="text-sm font-body text-[hsl(var(--navy))]/30 shrink-0">snip.sa/</span>
                  <input
                    type="text"
                    dir={isAr ? "rtl" : "ltr"}
                    placeholder={t("yourname", "اسمك")}
                    className="bg-transparent outline-none text-sm font-body text-[hsl(var(--navy))] placeholder:text-[hsl(var(--navy))]/20 w-full ms-0.5"
                  />
                </div>
                <Link to={smartLink("/signup", "/dashboard/bio-pages")}>
                  <Button className="bg-gradient-to-r from-[hsl(var(--sky))] to-[hsl(var(--navy))] text-white font-body font-bold rounded-e-full rounded-s-none px-7 py-4 h-auto text-sm hover:brightness-110 transition-all whitespace-nowrap shadow-xl shadow-[hsl(var(--sky))]/25 hover:shadow-2xl hover:scale-[1.02]">
                    {t("Claim it free", "احجزه مجاناً")}
                    <ArrowRight size={14} className="ms-1.5 rtl:rotate-180" />
                  </Button>
                </Link>
              </motion.div>

              {/* Quick features */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 }}
                className="flex flex-wrap gap-x-6 gap-y-2"
              >
                {[t("Free forever", "مجاني للأبد"), t("Arabic support", "دعم العربية"), t("No ads", "بدون إعلانات")].map((f, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs font-body text-[hsl(var(--navy))]/45">
                    <div className="w-4 h-4 rounded-full bg-[hsl(var(--sky))]/10 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-[hsl(var(--sky))]" />
                    </div>
                    {f}
                  </span>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, type: "spring", stiffness: 50 }}
              className="relative flex justify-center"
            >
              {/* Animated glow */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--sky))]/10 via-[hsl(280,60%,55%)]/6 to-transparent rounded-[3rem] blur-3xl pointer-events-none"
                animate={{ scale: [1, 1.05, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 4, repeat: Infinity }}
              />

              <motion.div
                className="relative"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <BioPreview />

                {/* Floating stat badges */}
                <motion.div
                  initial={{ opacity: 0, x: 30, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ delay: 0.9, type: "spring", stiffness: 100 }}
                  className="absolute -end-4 top-16 bg-white/95 backdrop-blur-md rounded-2xl px-4 py-3 shadow-xl border border-[hsl(var(--navy))]/6 flex items-center gap-2.5"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[hsl(var(--sky))]/20 to-[hsl(var(--sky))]/5 flex items-center justify-center">
                    <Eye className="w-4 h-4 text-[hsl(var(--sky))]" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-sm text-[hsl(var(--navy))] leading-none">1,420</p>
                    <p className="text-[10px] font-body text-[hsl(var(--navy))]/40">{t("views today", "مشاهدة اليوم")}</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -30, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ delay: 1.2, type: "spring", stiffness: 100 }}
                  className="absolute -start-6 bottom-20 bg-white/95 backdrop-blur-md rounded-2xl px-4 py-3 shadow-xl border border-[hsl(var(--navy))]/6 flex items-center gap-2.5"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[hsl(145,70%,42%)]/20 to-[hsl(145,70%,42%)]/5 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-[hsl(145,70%,42%)]" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-sm text-[hsl(var(--navy))] leading-none">+32%</p>
                    <p className="text-[10px] font-body text-[hsl(var(--navy))]/40">{t("this week", "هالأسبوع")}</p>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ USE CASES ═══ */}
      <section className="py-24 md:py-32 relative overflow-hidden" style={{ background: "linear-gradient(180deg, hsl(35 40% 95%) 0%, hsl(35 35% 94%) 100%)" }}>
        <GlowOrb className="w-[600px] h-[300px] top-0 start-1/2 -translate-x-1/2" color1="hsl(var(--sky))" color2="transparent" delay={1} />

        <FloatingShape className="absolute top-20 start-[8%] opacity-[0.04] pointer-events-none" delay={1} duration={24}>
          <div className="w-12 h-12 rounded-xl rotate-45 border-2 border-[hsl(var(--navy))]" />
        </FloatingShape>

        <div className="container mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-[hsl(var(--navy))]/10 to-[hsl(var(--sky))]/10 text-[hsl(var(--navy))] text-xs font-bold font-body mb-6 border border-[hsl(var(--navy))]/8"
            >
              <Smartphone className="w-3.5 h-3.5" />
              {t("Use cases", "حالات الاستخدام")}
            </motion.span>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[hsl(var(--navy))] mb-4">
              {t("Built for everyone", "مبني للجميع")}
            </h2>
            <p className="font-body text-lg text-[hsl(var(--navy))]/45 max-w-md mx-auto">
              {t("From creators to restaurants, one bio page fits all.", "من المبدعين للمطاعم، صفحة بايو واحدة تناسب الجميع.")}
            </p>
          </motion.div>

          <div className="space-y-6 max-w-4xl mx-auto">
            {useCases.map((uc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, type: "spring", stiffness: 70 }}
                whileHover={{ scale: 1.01, y: -4 }}
                className="group relative rounded-3xl overflow-hidden p-8 md:p-12 shadow-lg hover:shadow-2xl transition-all duration-400"
              >
                {/* Background image */}
                <img
                  src={uc.bgImage}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-transform duration-700 group-hover:scale-105"
                />
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${uc.gradient} opacity-80 pointer-events-none`} />
                {/* Animated border glow on hover */}
                <div className="absolute inset-0 rounded-3xl border border-white/0 group-hover:border-white/20 transition-all duration-500 pointer-events-none" />

                <div className="relative flex flex-col md:flex-row md:items-center gap-8">
                  <div className="flex-1">
                    <motion.h3
                      className="font-display font-bold text-white text-2xl md:text-3xl mb-3"
                    >
                      {uc.title}
                    </motion.h3>
                    <p className="font-body text-white/75 text-base leading-relaxed max-w-sm mb-5">{uc.desc}</p>
                    <Link to={smartLink("/signup", "/dashboard/bio-pages")}>
                      <Button variant="ghost" className="text-white/90 hover:text-white hover:bg-white/15 font-body font-bold text-sm px-5 py-2.5 h-auto gap-2 rounded-full border border-white/20 backdrop-blur-sm">
                        {t("Get started", "ابدأ الآن")}
                        <ArrowRight size={14} className="rtl:rotate-180" />
                      </Button>
                    </Link>
                  </div>

                  {/* Mini phone */}
                  <motion.div
                    className="shrink-0 w-56"
                    whileHover={{ y: -8, rotate: -2 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <div className="rounded-[2rem] p-[3px] bg-gradient-to-b from-white/40 to-white/10 shadow-2xl">
                      <div className="rounded-[1.85rem] overflow-hidden relative" style={{ background: uc.theme.bg, color: uc.theme.fg }}>
                        {/* Status bar */}
                        <div className="flex items-center justify-between px-4 pt-2 pb-1 text-[8px] font-bold opacity-80">
                          <span>9:41</span>
                          <div className="flex items-center gap-1">
                            <Signal className="w-2.5 h-2.5" />
                            <Wifi className="w-2.5 h-2.5" />
                            <BatteryFull className="w-3 h-3" />
                          </div>
                        </div>

                        <div className="px-4 pb-4">
                          {/* Handle pill */}
                          <div className="flex justify-center mb-3">
                            <span className="text-[8px] font-mono px-2 py-0.5 rounded-full" style={{ background: uc.theme.btnBg, border: `1px solid ${uc.theme.btnBorder}` }}>
                              {uc.handle}
                            </span>
                          </div>

                          {/* Profile */}
                          <div className="flex flex-col items-center mb-3">
                            {(uc as any).avatarImage ? (
                              <img src={(uc as any).avatarImage} alt={uc.profileName} className="w-12 h-12 rounded-full object-cover mb-1.5 ring-2" style={{ boxShadow: `0 0 0 2px ${uc.theme.accent}` }} />
                            ) : (
                              <div className="w-12 h-12 rounded-full mb-1.5 flex items-center justify-center text-[11px] font-bold" style={{ background: uc.theme.accent, color: uc.theme.bg.includes("ffffff") ? "#0f1b3d" : "#1a0f1f" }}>
                                {uc.avatarInitials}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] font-display font-bold leading-tight">{uc.profileName}</span>
                              {uc.verified && <BadgeCheck className="w-3 h-3" style={{ color: uc.theme.accent }} fill={uc.theme.accent} stroke={uc.theme.bg.includes("ffffff") ? "#fff" : "#1a0f1f"} strokeWidth={2.5} />}
                            </div>
                            <span className="text-[8.5px] mt-0.5 opacity-70">{uc.profileBio}</span>

                            {/* Stat chip */}
                            <div className="mt-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold" style={{ background: uc.theme.btnBg, border: `1px solid ${uc.theme.btnBorder}` }}>
                              <span style={{ color: uc.theme.accent }}>●</span>
                              <span>{uc.stats.label}</span>
                              {uc.stats.value !== "·" && <span className="opacity-70">· {uc.stats.value}</span>}
                            </div>
                          </div>

                          {/* Social row */}
                          <div className="flex justify-center gap-1.5 mb-3">
                            {uc.socials.map((s, j) => (
                              <div key={j} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: uc.theme.btnBg, border: `1px solid ${uc.theme.btnBorder}` }}>
                                <span style={{ color: uc.theme.fg }}>
                                  <SocialSvg name={s} />
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Links */}
                          <div className="space-y-1.5">
                            {uc.links.map((link, j) => {
                              const Icon = link.icon;
                              return (
                                <motion.div
                                  key={j}
                                  initial={{ opacity: 0, y: 8 }}
                                  whileInView={{ opacity: 1, y: 0 }}
                                  viewport={{ once: true }}
                                  transition={{ delay: 0.25 + j * 0.07 }}
                                  className="flex items-center gap-2 px-2.5 py-2 rounded-xl"
                                  style={{ background: uc.theme.btnBg, border: `1px solid ${uc.theme.btnBorder}`, color: uc.theme.btnFg }}
                                >
                                  <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: uc.theme.accent + "33" }}>
                                    <Icon className="w-3 h-3" style={{ color: uc.theme.accent }} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[9.5px] font-bold leading-tight truncate">{link.label}</p>
                                    {link.sub && <p className="text-[7.5px] opacity-60 leading-tight truncate mt-0.5">{link.sub}</p>}
                                  </div>
                                  <ChevronRight className="w-3 h-3 opacity-50 shrink-0 rtl:rotate-180" />
                                </motion.div>
                              );
                            })}
                          </div>

                          {/* Footer brand */}
                          <div className="flex items-center justify-center gap-1 mt-3 opacity-50">
                            <span className="text-[7px] font-bold tracking-wider">POWERED BY SNIP</span>
                          </div>

                          {/* Home indicator */}
                          <div className="w-16 h-0.5 rounded-full mx-auto mt-2" style={{ background: uc.theme.btnBorder }} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <ThemeShowcaseSection features={features} t={t} />

      {/* ═══ STEPS ═══ */}
      <StepsAnimationSection steps={steps} t={t} />

      <CTASection />
      <Footer />
    </div>
  );
};

export default FeatureLinkInBio;
