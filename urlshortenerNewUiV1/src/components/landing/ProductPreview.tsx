import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, QrCode, BarChart3, Copy, Eye, MousePointerClick, Globe, Smartphone, Download } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const INTERVAL = 4000;
const SCREENS = 3;

const ProductPreview = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = down, -1 = up
  const { t } = useLanguage();

  const labels = [
    t("Links", "الروابط"),
    t("QR Codes", "QR Codes"),
    t("Analytics", "التحليلات"),
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setActiveIndex((prev) => (prev + 1) % SCREENS);
    }, INTERVAL);
    return () => clearInterval(timer);
  }, []);

  const variants = {
    enter: (dir: number) => ({ y: dir > 0 ? "100%" : "-100%", opacity: 0.5 }),
    center: { y: 0, opacity: 1 },
    exit: (dir: number) => ({ y: dir > 0 ? "-100%" : "100%", opacity: 0.5 }),
  };

  return (
    <div className="flex justify-center">
      <div className="relative w-[280px] md:w-[300px]">
        {/* Glow layers behind phone */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-accent/30 blur-3xl animate-pulse" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-secondary/25 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-primary/20 blur-3xl" />

        {/* Phone shell */}
        <div className="relative rounded-[40px] bg-foreground/90 p-[6px] shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.4),0_8px_30px_-10px_hsl(var(--secondary)/0.3)]">
          {/* Dynamic Island */}
          <div className="absolute top-[6px] left-1/2 -translate-x-1/2 w-[100px] h-[26px] bg-foreground rounded-full z-20" />

          {/* Screen */}
          <div className="rounded-[34px] overflow-hidden relative bg-foreground/5">
            {/* Full-screen TikTok-style content */}
            <div className="relative h-[520px] md:h-[560px] overflow-hidden">
              <AnimatePresence mode="popLayout" custom={direction}>
                <motion.div
                  key={activeIndex}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
                  className="absolute inset-0"
                >
                  {activeIndex === 0 && <LinksScreen />}
                  {activeIndex === 1 && <QRScreen />}
                  {activeIndex === 2 && <AnalyticsScreen />}
                </motion.div>
              </AnimatePresence>

              {/* Side indicators (TikTok-style right rail) */}
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-10">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-[3px] rounded-full transition-all duration-300 ${
                      activeIndex === i ? "h-6 bg-primary" : "h-2 bg-foreground/20"
                    }`}
                  />
                ))}
              </div>

              {/* Current page label at top */}
              <div className="absolute top-10 left-0 right-0 z-10 flex justify-center">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={activeIndex}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.25 }}
                    className="text-[11px] font-display font-bold text-foreground/70 bg-background/60 backdrop-blur-none px-3 py-1 rounded-full border border-border/50"
                  >
                    {labels[activeIndex]}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>

            {/* Home indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-foreground/20 rounded-full z-10" />
          </div>
        </div>

        {/* Progress bar below phone */}
        <div className="flex justify-center gap-2 mt-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="relative w-8 h-1 rounded-full bg-border overflow-hidden">
              {activeIndex === i && (
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: INTERVAL / 1000, ease: "linear" }}
                  className="h-full bg-primary rounded-full"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Full-screen card styles ─── */

const LinksScreen = () => (
  <div className="h-full bg-card flex flex-col p-4 pt-16">
    <div className="space-y-2.5 flex-1">
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
          transition={{ delay: 0.15 + i * 0.06, duration: 0.35 }}
          className="flex items-center gap-2.5 p-2.5 rounded-xl bg-background border border-border"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <Link2 size={14} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-[11px] text-foreground truncate">{link.short}</p>
            <p className="text-[9px] text-muted-foreground truncate">{link.original}</p>
          </div>
          <span className="text-[9px] font-bold text-foreground bg-muted px-2 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
            <MousePointerClick size={9} /> {link.clicks}
          </span>
        </motion.div>
      ))}
    </div>
    <p className="text-center text-[9px] text-muted-foreground mt-2">5 of 24 links</p>
  </div>
);

const QRScreen = () => (
  <div className="h-full bg-card flex flex-col p-4 pt-16">
    <div className="grid grid-cols-2 gap-2.5 flex-1">
      {[
        { name: "Restaurant Menu", scans: "412" },
        { name: "Product Page", scans: "287" },
        { name: "Event Booth", scans: "198" },
        { name: "Business Card", scans: "156" },
      ].map((qr, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 + i * 0.08, duration: 0.35 }}
          className="p-3 rounded-xl bg-background border border-border text-center"
        >
          <div className="w-16 h-16 mx-auto mb-2 rounded-lg bg-foreground/5 border border-border p-1.5">
            <div className="w-full h-full grid grid-cols-7 grid-rows-7 gap-px">
              {Array.from({ length: 49 }).map((_, j) => (
                <div
                  key={j}
                  className={`rounded-[1px] ${
                    [0,1,2,6,7,8,13,14,36,42,43,44,48,35,41,47,21,22,23,24,25,26,27,28,29,30,31,15,16,17,18,19,20].includes(j)
                      ? "bg-foreground" : "bg-transparent"
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="font-display font-bold text-[10px] text-foreground">{qr.name}</p>
          <p className="text-[9px] text-muted-foreground mt-0.5 flex items-center justify-center gap-0.5">
            <Eye size={9} /> {qr.scans}
          </p>
        </motion.div>
      ))}
    </div>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="mt-2 p-2 rounded-xl bg-primary/10 border border-primary/20 text-center"
    >
      <p className="text-[9px] font-body text-foreground/70">Every scan is tracked like a click</p>
    </motion.div>
  </div>
);

const AnalyticsScreen = () => {
  const barData = [35, 52, 45, 68, 82, 73, 91];
  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const maxBar = Math.max(...barData);

  return (
    <div className="h-full bg-card flex flex-col p-4 pt-16 gap-2.5">
      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35 }}
        className="grid grid-cols-3 gap-1.5"
      >
        {[
          { label: "Clicks", value: "5,006", icon: MousePointerClick, color: "text-primary" },
          { label: "Countries", value: "12", icon: Globe, color: "text-sky" },
          { label: "Devices", value: "3", icon: Smartphone, color: "text-lilac" },
        ].map((stat, i) => (
          <div key={i} className="p-2 rounded-lg bg-background border border-border text-center">
            <stat.icon size={12} className={`mx-auto mb-1 ${stat.color}`} />
            <p className="font-display font-black text-sm text-foreground leading-none">{stat.value}</p>
            <p className="text-[8px] text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Bar chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35 }}
        className="p-2.5 rounded-xl bg-background border border-border flex-1"
      >
        <p className="text-[10px] font-display font-bold text-foreground mb-2">This Week</p>
        <div className="flex items-end gap-1.5" style={{ height: 100 }}>
          {barData.map((val, i) => {
            const h = Math.round((val / maxBar) * 100);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <span className="text-[7px] font-bold text-muted-foreground">{val}</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: h }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.06, ease: [0.16, 1, 0.3, 1] as const }}
                  className={`w-full rounded-md ${i % 3 === 0 ? 'bg-primary/80' : i % 3 === 1 ? 'bg-accent/80' : 'bg-secondary/80'}`}
                />
                <span className="text-[8px] text-muted-foreground">{days[i]}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Top cities */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.35 }}
        className="p-2.5 rounded-xl bg-background border border-border"
      >
        <p className="text-[10px] font-display font-bold text-foreground mb-1.5">Top Cities</p>
        {["Riyadh", "Jeddah", "Dammam"].map((city, i) => (
          <div key={i} className="flex items-center justify-between py-1 border-b border-border last:border-0">
            <span className="text-[9px] text-foreground">{city}</span>
            <div className="flex items-center gap-1.5">
              <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${[42, 28, 18][i]}%` }}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.08 }}
                  className="h-full rounded-full bg-primary/60"
                />
              </div>
              <span className="text-[9px] font-bold text-muted-foreground">{[42, 28, 18][i]}%</span>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default ProductPreview;
