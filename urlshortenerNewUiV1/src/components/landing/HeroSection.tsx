import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ArrowLeft, Link2, Check, Copy, MousePointerClick, QrCode, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import qrImage from "@/assets/qr-1.png";

const INTERVAL = 4000;
const SCREENS = 3;

const HeroSection = () => {
  const [url, setUrl] = useState("");
  const { t, isAr } = useLanguage();
  const [shortened, setShortened] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const navigate = useNavigate();

  const handleShorten = () => {
    navigate("/signup");
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
    <section className="relative section-cream min-h-[100vh] flex items-center pt-24 pb-8 md:pb-24 overflow-x-hidden">
      <div className="container mx-auto px-6 relative">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-20 items-center">
          <div className="text-center lg:text-start">
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-4 sm:mb-6 tracking-tight text-[hsl(var(--navy))]"
            >
              {t("Every click", "كل ضغطة")}
              <br />
              {t("tells a story.", "تحكي قصة.")}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-sm md:text-xl font-body leading-relaxed mb-6 sm:mb-10 max-w-lg mx-auto lg:mx-0 text-[hsl(var(--navy))]/70"
            >
              {t(
                "Short links with real time analytics. Hosted in Saudi Arabia.",
                "روابط مختصرة مع تحليلات لحظية. مستضاف في السعودية."
              )}
              <span className="hidden md:inline">
                {" "}{t(
                  "Whether you're running Instagram ads, Snapchat stories, or need a developer API, we've got you covered.",
                  "سواء تدير حملات على الإنستقرام أو سناب شات، أو تبي API يشتغل لك، كل شي موجود."
                )}
              </span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-lg mx-auto lg:mx-0"
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex items-center gap-2 px-5 bg-white rounded-full shadow-soft border-none">
                  <Link2 size={16} className="opacity-30 shrink-0 text-[hsl(var(--navy))]" aria-hidden="true" />
                  <input
                    id="hero-url-input"
                    type="url"
                    aria-label={t("Enter URL to shorten", "أدخل الرابط للاختصار")}
                    placeholder={t("Paste your campaign link here...", "الصق رابط الحملة هنا...")}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleShorten()}
                    className="w-full bg-transparent text-[hsl(var(--navy))] placeholder:text-[hsl(var(--navy))]/40 outline-none py-3.5 font-body text-sm"
                    dir="ltr"
                  />
                </div>
                <Button
                  onClick={handleShorten}
                  className="bg-[hsl(var(--navy))] text-white font-body font-bold px-8 shrink-0 rounded-full hover:opacity-90 transition-all text-base"
                >
                  {t("Shorten Link for Free", "اختصر الرابط مجاناً")}
                  {isAr ? <ArrowLeft size={16} className="ms-1.5" /> : <ArrowRight size={16} className="ms-1.5" />}
                </Button>
              </div>

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

              <p className="mt-5 text-sm font-body text-[hsl(var(--navy))]/75">
                {t(
                  "Free to try · No credit card · Hosted in Saudi Arabia",
                  "مجاني للتجربة · بدون بطاقة ائتمانية · مستضاف في السعودية"
                )}
              </p>
            </motion.div>
          </div>

          {/* Auto-scrolling dashboard card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative max-w-[320px] sm:max-w-md mx-auto lg:max-w-none"
          >
            <div className="bg-white rounded-2xl lg:rounded-3xl shadow-elevated overflow-hidden">
              {/* Tab header */}
              <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-[hsl(var(--navy))]/5">
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {labels.map((label, i) => (
                      <button
                        key={i}
                        onClick={() => { setDirection(i > activeIndex ? 1 : -1); setActiveIndex(i); }}
                        className={`font-body text-[10px] sm:text-xs font-bold px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full transition-all ${
                          activeIndex === i
                            ? "bg-[hsl(var(--sky))] text-white"
                            : "text-[hsl(var(--navy))]/50 hover:text-[hsl(var(--navy))]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1 mt-2.5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="relative flex-1 h-1 rounded-full bg-[hsl(var(--navy))]/10 overflow-hidden">
                      {activeIndex === i && (
                        <motion.div
                          key={`bar-${activeIndex}`}
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{ duration: INTERVAL / 1000, ease: "linear" }}
                          className="h-full bg-[hsl(var(--sky))] rounded-full"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Scrolling content */}
              <div className="relative h-[300px] sm:h-[430px] overflow-hidden">
                <AnimatePresence mode="popLayout" custom={direction}>
                  <motion.div
                    key={activeIndex}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                    className="absolute inset-0 p-4 sm:p-6"
                  >
                    {activeIndex === 0 && <LinksScreen />}
                    {activeIndex === 1 && <QRScreen />}
                    {activeIndex === 2 && <AnalyticsScreen />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

/* ─── Screen contents ─── */

const LinksScreen = () => (
  <div className="space-y-3">
    {[
      { short: "snip.sa/ramadan", original: "myshop.sa/ramadan-offers", clicks: "2,847" },
      { short: "snip.sa/menu", original: "restaurant.sa/full-menu", clicks: "1,203" },
      { short: "snip.sa/app", original: "apps.apple.com/sa/myapp", clicks: "956" },
      { short: "snip.sa/sale", original: "brand.sa/summer-sale", clicks: "734" },
      { short: "snip.sa/event", original: "events.sa/riyadh-season", clicks: "512" },
    ].map((link, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.05 + i * 0.06 }}
        className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(var(--cream))] border border-[hsl(var(--navy))]/5"
      >
        <div className="w-9 h-9 rounded-lg bg-[hsl(var(--sky))]/15 flex items-center justify-center shrink-0">
          <Link2 size={15} className="text-[hsl(var(--sky))]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm text-[hsl(var(--navy))] truncate">{link.short}</p>
          <p className="text-xs text-[hsl(var(--navy))]/40 truncate font-body">{link.original}</p>
        </div>
        <span className="text-xs font-bold text-[hsl(var(--navy))]/60 bg-white px-3 py-1 rounded-full flex items-center gap-1 shrink-0 font-body">
          <MousePointerClick size={10} /> {link.clicks}
        </span>
      </motion.div>
    ))}
  </div>
);

const QRScreen = () => (
  <div className="grid grid-cols-2 gap-3">
    {[
      { name: "Restaurant Menu", scans: "412" },
      { name: "Product Page", scans: "287" },
      { name: "Event Booth", scans: "198" },
      { name: "Business Card", scans: "156" },
    ].map((qr, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05 + i * 0.08 }}
        className="p-3 sm:p-5 rounded-2xl bg-[hsl(var(--cream))] border border-[hsl(var(--navy))]/5 text-center"
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 sm:mb-3 rounded-xl bg-white border border-[hsl(var(--navy))]/10 p-1.5 sm:p-2">
          <img src={qrImage} alt="QR Code" width="512" height="512" className="w-full h-full object-contain" loading="lazy" />
        </div>
        <p className="font-display font-bold text-xs sm:text-sm text-[hsl(var(--navy))]">{qr.name}</p>
        <p className="text-[10px] sm:text-xs text-[hsl(var(--navy))]/50 mt-1 flex items-center justify-center gap-1 font-body">
          <Eye size={10} /> {qr.scans} scans
        </p>
      </motion.div>
    ))}
  </div>
);

const AnalyticsScreen = () => {
  const chartPoints = [
    { clicks: 8, visitors: 5, qr: 2 },
    { clicks: 15, visitors: 10, qr: 7 },
    { clicks: 12, visitors: 8, qr: 5 },
    { clicks: 22, visitors: 15, qr: 10 },
    { clicks: 18, visitors: 12, qr: 8 },
    { clicks: 25, visitors: 16, qr: 12 },
    { clicks: 30, visitors: 20, qr: 14 },
  ];
  const maxVal = 32;
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const toPath = (key: "clicks" | "visitors" | "qr") => {
    const w = 280;
    const h = 70;
    return chartPoints.map((p, i) => {
      const x = (i / (chartPoints.length - 1)) * w;
      const y = h - (p[key] / maxVal) * h;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    }).join(" ");
  };

  return (
    <div className="space-y-3">
      {/* Stat cards — matching real analytics */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Clicks", value: "437", color: "hsl(217, 71%, 30%)", icon: MousePointerClick },
          { label: "Visitors", value: "284", color: "hsl(var(--navy))", icon: Eye },
          { label: "QR Scans", value: "156", color: "hsl(25, 95%, 53%)", icon: QrCode },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.06 }}
            className="p-2.5 rounded-xl bg-[hsl(var(--cream))] border border-[hsl(var(--navy))]/5"
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                <stat.icon size={10} style={{ color: stat.color }} />
              </div>
              <span className="text-[9px] text-[hsl(var(--navy))]/50 font-body">{stat.label}</span>
            </div>
            <p className="font-display font-bold text-sm text-[hsl(var(--navy))]">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Line chart — matching real analytics */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="p-4 rounded-2xl bg-[hsl(var(--cream))] border border-[hsl(var(--navy))]/5"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="font-display font-bold text-xs text-[hsl(var(--navy))]">Clicks Over Time</p>
          <div className="flex items-center gap-3">
            {[
              { label: "Clicks", color: "hsl(217, 71%, 30%)" },
              { label: "Visitors", color: "hsl(var(--navy))" },
              { label: "QR", color: "hsl(25, 95%, 53%)" },
            ].map((l, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: l.color }} />
                <span className="text-[8px] text-[hsl(var(--navy))]/40 font-body">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
        <svg viewBox="0 0 280 90" className="w-full" style={{ height: 80 }}>
          {/* Grid lines */}
          {[0, 1, 2, 3].map(i => (
            <line key={i} x1="0" y1={i * 23.3} x2="280" y2={i * 23.3} stroke="hsl(214, 32%, 91%)" strokeWidth="0.5" strokeDasharray="3 3" />
          ))}
          {/* Lines */}
          <motion.path
            d={toPath("clicks")}
            fill="none"
            stroke="hsl(217, 71%, 30%)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          />
          <motion.path
            d={toPath("visitors")}
            fill="none"
            stroke="hsl(220, 50%, 15%)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
          />
          <motion.path
            d={toPath("qr")}
            fill="none"
            stroke="hsl(25, 95%, 53%)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          />
          {/* X axis labels */}
          {days.map((d, i) => (
            <text key={i} x={(i / 6) * 280} y="88" fontSize="7" fill="hsl(215, 16%, 47%)" textAnchor="middle" fontFamily="sans-serif">{d}</text>
          ))}
        </svg>
      </motion.div>

      {/* Top countries — matching real analytics */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="p-3 rounded-2xl bg-[hsl(var(--cream))] border border-[hsl(var(--navy))]/5"
      >
        <p className="font-display font-bold text-xs text-[hsl(var(--navy))] mb-2">Top Countries</p>
        {[
          { name: "Saudi Arabia", pct: 68 },
          { name: "India", pct: 20 },
          { name: "France", pct: 7 },
        ].map((c, i) => (
          <div key={i} className="flex items-center justify-between py-1 border-b border-[hsl(var(--navy))]/5 last:border-0">
            <span className="text-[10px] text-[hsl(var(--navy))] font-body">{c.name}</span>
            <div className="flex items-center gap-2">
              <div className="w-14 h-1.5 rounded-full bg-[hsl(var(--navy))]/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${c.pct}%` }}
                  transition={{ duration: 0.5, delay: 0.55 + i * 0.08 }}
                  className="h-full rounded-full bg-[hsl(var(--sky))]"
                />
              </div>
              <span className="text-[9px] font-bold text-[hsl(var(--navy))]/50 font-body w-5 text-end">{c.pct}%</span>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default HeroSection;