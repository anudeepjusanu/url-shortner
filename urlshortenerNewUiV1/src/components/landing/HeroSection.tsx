import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowDown, Link2, Check, Copy, MousePointerClick, QrCode, Eye, Sparkles, CreditCard, MapPin, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { urlsAPI } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";
import qrImage from "@/assets/qr-1.png";

const INTERVAL = 4000;
const SCREENS = 3;

const isValidUrl = (value: string) => {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

const HeroSection = () => {
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [checking, setChecking] = useState(false);
  const { t } = useLanguage();
  const { user } = useAuth();
  const [shortened, setShortened] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const navigate = useNavigate();

  const handleShorten = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setUrlError(t("Please add a link first", "الرجاء إضافة رابط أولاً"));
      return;
    }
    if (!isValidUrl(trimmed)) {
      setUrlError(t("Please enter a valid URL (e.g. https://example.com)", "الرجاء إدخال رابط صحيح (مثال: https://example.com)"));
      return;
    }
    setUrlError("");
    setChecking(true);
    try {
      const result = await urlsAPI.checkSafety(trimmed);
      if (!result.isSafe) {
        setUrlError(
          result.message ||
          t(
            "This URL has been flagged as unsafe (phishing or malware). Please use a different link.",
            "تم تصنيف هذا الرابط على أنه غير آمن (تصيد أو برامج ضارة). الرجاء استخدام رابط مختلف."
          )
        );
        return;
      }
    } catch {
      // Safety check failed — fail open and let the user continue
    } finally {
      setChecking(false);
    }
    if (user) {
      navigate("/dashboard", { state: { prefillUrl: trimmed } });
    } else {
      navigate("/shorten", { state: { url: trimmed } });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shortened);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setActiveIndex((prev) => (prev + 1) % SCREENS);
    }, INTERVAL);
    return () => clearInterval(timer);
  }, []);

  const labels = [
    t("Links", "الروابط"),
    t("QR Codes", "QR Codes"),
    t("Analytics", "التحليلات"),
  ];

  const variants = {
    enter: (dir: number) => ({ y: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { y: 0, opacity: 1 },
    exit: (dir: number) => ({ y: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <section className="relative section-cream flex items-center pt-28 pb-16 md:pt-32 md:pb-20 overflow-x-hidden">
      <div className="container mx-auto px-6 relative">
        <div className="grid lg:grid-cols-[1.45fr_1fr] gap-6 lg:gap-8 items-center">
          <div className="text-center lg:text-start lg:max-w-none">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[hsl(158,55%,95%)] border border-[hsl(158,55%,40%)]/25 mb-6"
            >
              <ShieldCheck size={14} className="text-[hsl(158,55%,32%)]" />
              <span className="text-base leading-none">🇸🇦</span>
              <span className="font-body text-xs sm:text-sm font-semibold text-[hsl(158,55%,22%)]">
                {t(
                  "100% Saudi platform your data stays in the Kingdom",
                  "منصة سعودية 100% بياناتك تبقى في المملكة"
                )}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.02] mb-4 tracking-tight text-[hsl(var(--navy))]"
            >
              {t("Shorten. Track. Done.", "اختصر. تابع. انجز.")}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="font-body text-lg md:text-xl font-semibold mb-8 sm:mb-12 text-[hsl(var(--navy))]/80"
            >
              {t("The #1 link management platform in Saudi Arabia", "منصة إدارة الروابط الأولى في السعودية")}
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-base md:text-2xl font-body leading-relaxed mb-10 sm:mb-14 max-w-2xl mx-auto lg:mx-0 lg:max-w-none text-[hsl(var(--navy))]/70"
            >
              {t(
                "Don't guess, know. Every link you share gives you data to build your decisions on.",
                "بدل ما تخمّن، اعرف. كل رابط تشاركه يعطيك بيانات تبني عليها قراراتك."
              )}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-xl mx-auto lg:mx-0 lg:max-w-none"
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <div className={`flex-1 flex items-center gap-3 px-6 bg-white rounded-full shadow-soft border ${urlError ? "border-red-400" : "border-transparent"}`}>
                  <Link2 size={20} className="opacity-30 shrink-0 text-[hsl(var(--navy))]" />
                  <input
                    type="url"
                    placeholder={t("Paste your link here...", "الصق رابطك هنا...")}
                    value={url}
                    onChange={(e) => { setUrl(e.target.value); if (urlError) setUrlError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleShorten()}
                    className="w-full bg-transparent text-[hsl(var(--navy))] placeholder:text-[hsl(var(--navy))]/40 outline-none py-5 font-body text-base"
                  />
                </div>
                <Button
                  onClick={handleShorten}
                  disabled={checking}
                  className="bg-[hsl(var(--navy))] text-white font-body font-bold px-9 py-6 h-auto shrink-0 rounded-full hover:opacity-90 transition-all text-base disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {checking ? (
                    <>
                      <Loader2 size={16} className="ms-1.5 animate-spin" />
                      {t("Checking...", "جارٍ الفحص...")}
                    </>
                  ) : (
                    <>
                      {t("Shorten it now Free", "اختصره الآن مجاناً")}
                      <ArrowRight size={16} className="ms-1.5 rtl:rotate-180" />
                    </>
                  )}
                </Button>
              </div>
              {urlError && (
                <p className="mt-2 text-sm font-body text-red-500 ps-3">{urlError}</p>
              )}

              {shortened && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="mt-3 p-4 bg-[hsl(var(--navy))]/10 rounded-2xl flex items-center justify-between"
                >
                  <span className="font-display font-bold text-sm text-[hsl(var(--navy))]">{shortened}</span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-[hsl(var(--navy))]/60 hover:text-[hsl(var(--navy))] transition-opacity text-xs font-body bg-[hsl(var(--navy))]/10 px-3 py-1.5 rounded-full"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? t("Copied", "تم النسخ") : t("Copy", "نسخ")}
                  </button>
                </motion.div>
              )}

              <div className="mt-8 sm:mt-10 flex flex-wrap justify-center lg:justify-start gap-2.5">
                {[
                  { icon: Sparkles, en: "Completely free", ar: "مجاني تماماً" },
                  { icon: CreditCard, en: "No credit card", ar: "بدون بطاقة بنكية" },
                  { icon: MapPin, en: "Ready in 30 seconds", ar: "جاهز في 30 ثانية" },
                ].map((badge, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white shadow-soft border border-[hsl(var(--navy))]/5"
                  >
                    <badge.icon size={14} className="text-[hsl(var(--sky))]" />
                    <span className="text-sm font-body font-medium text-[hsl(var(--navy))]/75">
                      {t(badge.en, badge.ar)}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>


          {/* URL morph + live analytics */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative max-w-[360px] sm:max-w-md mx-auto lg:max-w-none lg:scale-[1.1] lg:translate-x-8 rtl:lg:-translate-x-8 origin-center"
          >
            <UrlMorphCard />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

/* ─── URL morph + live analytics card ─── */

const UrlMorphCard = () => {
  const { t } = useLanguage();
  const [step, setStep] = useState(0); // 0 = long, 1 = morphing, 2 = short + analytics
  const [clicks, setClicks] = useState(1247);
  const [scans, setScans] = useState(312);

  useEffect(() => {
    const loop = setInterval(() => {
      setStep((s) => (s + 1) % 3);
    }, 2600);
    return () => clearInterval(loop);
  }, []);

  useEffect(() => {
    const ticker = setInterval(() => {
      setClicks((c) => c + Math.floor(Math.random() * 3) + 1);
      if (Math.random() > 0.6) setScans((s) => s + 1);
    }, 1400);
    return () => clearInterval(ticker);
  }, []);

  const longUrl =
    "https://www.myshop.sa/collections/ramadan-2026?utm_source=instagram&utm_medium=story&utm_campaign=ramadan_launch&ref=hero";

  return (
    <div className="bg-white rounded-3xl shadow-elevated overflow-hidden border border-[hsl(var(--navy))]/5">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-[hsl(var(--navy))]/5 bg-[hsl(var(--cream))]/60">
        <span className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--navy))]/15" />
        <span className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--navy))]/15" />
        <span className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--navy))]/15" />
        <span className="ms-3 text-[10px] font-body text-[hsl(var(--navy))]/40">snip.sa · dashboard</span>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Long URL */}
        <div>
          <p className="text-[10px] font-body font-bold uppercase tracking-wider text-[hsl(var(--navy))]/40 mb-2">
            {t("From long link", "من الرابط الطويل")}
          </p>
          <div className="px-3 py-2.5 rounded-xl bg-[hsl(var(--cream))] border border-[hsl(var(--navy))]/5 text-[11px] font-mono text-[hsl(var(--navy))]/55 break-all leading-relaxed h-[60px] overflow-hidden">
            {longUrl}
          </div>
        </div>

        {/* Arrow / morph indicator */}
        <div className="flex justify-center">
          <motion.div
            animate={{ y: step === 1 ? [0, 4, 0] : 0, scale: step === 1 ? [1, 1.15, 1] : 1 }}
            transition={{ duration: 0.6, repeat: step === 1 ? Infinity : 0 }}
            className="w-9 h-9 rounded-full bg-[hsl(var(--sky))] flex items-center justify-center shadow-soft"
          >
            <ArrowDown size={18} className="text-white" strokeWidth={2.5} />
          </motion.div>
        </div>

        {/* Short URL */}
        <div>
          <p className="text-[10px] font-body font-bold uppercase tracking-wider text-[hsl(var(--navy))]/40 mb-2">
            {t("To short link", "الى الرابط القصير")}
          </p>
          <AnimatePresence mode="wait">
            <motion.div
              key={step >= 2 ? "short" : "empty"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-[hsl(var(--sky))]/8 border border-[hsl(var(--sky))]/25"
            >
              <span className="font-display font-bold text-base sm:text-lg text-[hsl(var(--navy))]">
                snip.sa/<span className="text-[hsl(var(--sky))]">ramadan</span>
              </span>
              <span className="flex items-center gap-1 text-[10px] font-body font-bold text-[hsl(var(--sky))] bg-white px-2.5 py-1 rounded-full">
                <Copy size={11} />
                {t("Copy", "نسخ")}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Live analytics numbers */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          {[
            {
              label: t("Clicks", "نقرات"),
              value: clicks.toLocaleString("en-US"),
              icon: MousePointerClick,
              live: true,
            },
            {
              label: t("QR scans", "قراءات QR"),
              value: scans.toLocaleString("en-US"),
              icon: QrCode,
              live: true,
            },
            {
              label: t("Countries", "دول"),
              value: "12",
              icon: MapPin,
              live: false,
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-[hsl(var(--cream))] border border-[hsl(var(--navy))]/5"
            >
              <div className="flex items-center justify-between mb-1.5">
                <stat.icon size={11} className="text-[hsl(var(--sky))]" />
                {stat.live && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--sky))] opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[hsl(var(--sky))]" />
                  </span>
                )}
              </div>
              <motion.p
                key={stat.value}
                initial={{ opacity: 0.6, y: -3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="font-display font-bold text-base text-[hsl(var(--navy))] leading-none"
              >
                {stat.value}
              </motion.p>
              <p className="text-xs font-body text-[hsl(var(--navy))]/60 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};




export default HeroSection;
