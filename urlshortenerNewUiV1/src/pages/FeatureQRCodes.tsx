import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  QrCode, ArrowRight, Scan, Smartphone, Palette, BarChart3,
  Download, Globe, Check, Zap, Eye, RefreshCcw, Layers,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useRef } from "react";
import { useSmartLink } from "@/hooks/useSmartLink";

/* ── Animated QR Grid ── */
const AnimatedQRGrid = ({ size = 240, color = "hsl(350 54% 43%)" }: { size?: number; color?: string }) => {
  const grid = 21;
  const cell = size / grid;
  // Generate a deterministic QR-like pattern
  const pattern = useRef(
    Array.from({ length: grid }, (_, y) =>
      Array.from({ length: grid }, (_, x) => {
        // Finder patterns (top-left, top-right, bottom-left)
        const inFinder = (cx: number, cy: number) =>
          x >= cx && x < cx + 7 && y >= cy && y < cy + 7 &&
          !(x > cx && x < cx + 6 && y > cy && y < cy + 6 && !(x > cx + 1 && x < cx + 5 && y > cy + 1 && y < cy + 5));
        if (inFinder(0, 0) || inFinder(14, 0) || inFinder(0, 14)) return 1;
        // Timing patterns
        if (y === 6 && x > 7 && x < 13) return x % 2 === 0 ? 1 : 0;
        if (x === 6 && y > 7 && y < 13) return y % 2 === 0 ? 1 : 0;
        // Data area — seeded pseudo-random
        const seed = (x * 31 + y * 17 + x * y * 7) % 100;
        return seed < 45 ? 1 : 0;
      })
    )
  ).current;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-lg">
      <rect width={size} height={size} rx={size * 0.06} fill="white" />
      {pattern.map((row, y) =>
        row.map((val, x) =>
          val ? (
            <motion.rect
              key={`${x}-${y}`}
              x={x * cell + cell * 0.1}
              y={y * cell + cell * 0.1}
              width={cell * 0.8}
              height={cell * 0.8}
              rx={cell * 0.15}
              fill={color}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + (x + y) * 0.008, duration: 0.25, type: "spring", stiffness: 400 }}
            />
          ) : null
        )
      )}
    </svg>
  );
};

/* ── Orbiting dot ── */
const OrbitDot = ({ radius, duration, delay, size = 6 }: { radius: number; duration: number; delay: number; size?: number }) => (
  <motion.div
    className="absolute rounded-full bg-[hsl(var(--sky))]"
    style={{ width: size, height: size, top: "50%", left: "50%", marginTop: -size / 2, marginLeft: -size / 2 }}
    animate={{
      x: [radius, 0, -radius, 0, radius],
      y: [0, -radius, 0, radius, 0],
      opacity: [0.8, 0.4, 0.8, 0.4, 0.8],
    }}
    transition={{ repeat: Infinity, duration, delay, ease: "linear" }}
  />
);

const FeatureQRCodes = () => {
  const { t } = useLanguage();
  const { smartLink } = useSmartLink();
  const [activeUseCase, setActiveUseCase] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const bentoRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const { scrollYProgress: bentoProgress } = useScroll({ target: bentoRef, offset: ["start end", "end start"] });
  const bentoBlob1Y = useTransform(bentoProgress, [0, 1], [80, -80]);
  const bentoBlob2Y = useTransform(bentoProgress, [0, 1], [-60, 60]);
  const bentoBlob3Y = useTransform(bentoProgress, [0, 1], [40, -40]);

  const useCases = [
    { emoji: "🍽️", title: t("Restaurant menus", "قوائم المطاعم"), desc: t("Customers scan to see your digital menu. Update dishes and prices anytime without reprinting.", "العملاء يمسحون لرؤية القائمة الرقمية. حدّث الأطباق والأسعار في أي وقت بدون إعادة طباعة."), url: "menu.restaurant.sa" },
    { emoji: "📦", title: t("Product packaging", "تغليف المنتجات"), desc: t("Link to product details, usage instructions, or warranty registration directly from the box.", "وصّل لتفاصيل المنتج أو تعليمات الاستخدام أو تسجيل الضمان مباشرة من العلبة."), url: "product.sa/warranty" },
    { emoji: "🎪", title: t("Events & expos", "الفعاليات والمعارض"), desc: t("Visitors scan for your portfolio, catalog, or contact form at your booth.", "الزوار يمسحون لمعرض أعمالك أو الكتالوج أو نموذج التواصل في ستاندك."), url: "expo.company.sa" },
    { emoji: "💳", title: t("Business cards", "كروت العمل"), desc: t("Add a QR code to your card linking to your full digital profile.", "أضف كود QR لكرت العمل يوصل لملفك الرقمي الكامل."), url: "snip.sa/ahmed" },
  ];

  const bentoItems = [
    {
      title: t("Brand colors & logo", "ألوان وشعار البراند"),
      desc: t("Match your brand identity perfectly", "طابق هوية علامتك بالكامل"),
      icon: Palette,
      span: "md:col-span-1 md:row-span-2",
      visual: (
        <div className="mt-auto pt-6">
          <div className="flex gap-2 mb-4">
            {["hsl(350 54% 43%)", "hsl(220 70% 55%)", "hsl(150 60% 45%)", "hsl(30 80% 55%)"].map((c, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.08, type: "spring" }}
                className={`w-8 h-8 rounded-full cursor-pointer hover:scale-110 transition-transform ${i === 0 ? "ring-2 ring-offset-2 ring-[hsl(var(--navy))]/25" : ""}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="bg-[hsl(var(--sky))]/5 rounded-xl p-4 flex items-center justify-center">
            <motion.div animate={{ rotateY: [0, 8, -8, 0] }} transition={{ repeat: Infinity, duration: 5 }}>
              <QrCode className="w-16 h-16 text-[hsl(var(--sky))]" />
            </motion.div>
          </div>
        </div>
      ),
    },
    {
      title: t("Scan analytics", "تحليلات المسح"),
      desc: t("Track every scan in real time", "تتبع كل مسح لحظياً"),
      icon: BarChart3,
      span: "md:col-span-1",
      visual: (
        <div className="mt-auto pt-4">
          <div className="flex items-end gap-1 h-16">
            {[30, 50, 35, 65, 45, 75, 55, 85, 60, 95].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                whileInView={{ height: `${h}%` }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.04, duration: 0.4 }}
                className="flex-1 rounded-t bg-[hsl(var(--sky))]"
                style={{ opacity: 0.35 + (h / 100) * 0.65 }}
              />
            ))}
          </div>
        </div>
      ),
    },
    {
      title: t("Dynamic QR codes", "أكواد QR ديناميكية"),
      desc: t("Change destination without reprinting", "غيّر الوجهة بدون إعادة طباعة"),
      icon: RefreshCcw,
      span: "md:col-span-1",
      visual: (
        <div className="mt-auto pt-4">
          <div className="bg-[hsl(var(--navy))]/3 rounded-lg px-3 py-2 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-[hsl(var(--navy))]/30 shrink-0" />
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="font-mono text-[11px] text-[hsl(var(--navy))]/50 truncate"
            >
              mysite.sa/new-menu
            </motion.span>
            <span className="text-[8px] px-1.5 py-0.5 rounded bg-green-100 text-green-600 font-bold shrink-0">
              {t("LIVE", "مباشر")}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: t("Export PNG · SVG", "تصدير PNG · SVG"),
      desc: t("Print ready at any resolution", "جاهز للطباعة بأي دقة"),
      icon: Download,
      span: "md:col-span-1",
      visual: (
        <div className="mt-auto pt-4 flex gap-2">
          {["PNG", "SVG"].map((f, i) => (
            <motion.div
              key={f}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex-1 bg-[hsl(var(--sky))]/5 rounded-lg py-2 text-center hover:bg-[hsl(var(--sky))]/10 transition-colors cursor-pointer"
            >
              <p className="font-display font-bold text-xs text-[hsl(var(--navy))]">{f}</p>
            </motion.div>
          ))}
        </div>
      ),
    },
    {
      title: t("Mobile optimized", "محسّن للجوال"),
      desc: t("Perfect scans from any device", "مسح مثالي من أي جهاز"),
      icon: Smartphone,
      span: "md:col-span-1",
      visual: (
        <div className="mt-auto pt-4 flex justify-center">
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-10 h-16 rounded-lg border-2 border-[hsl(var(--navy))]/10 bg-[hsl(var(--navy))]/3 flex items-center justify-center"
          >
            <Scan className="w-5 h-5 text-[hsl(var(--sky))]" />
          </motion.div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* ═══ HERO — Immersive centered layout ═══ */}
      <section ref={heroRef} className="section-cream min-h-[100vh] flex items-center relative overflow-hidden">
        {/* Ambient */}
        <div className="absolute top-1/4 start-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[hsl(var(--sky))]/6 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 start-0 w-72 h-72 bg-[hsl(var(--navy))]/4 rounded-full blur-[80px] pointer-events-none" />

        <motion.div style={{ scale: heroScale, opacity: heroOpacity }} className="container mx-auto px-6 relative py-32 md:py-40">
          <div className="max-w-5xl mx-auto text-center">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[hsl(var(--sky))]/10 text-[hsl(var(--sky))] text-xs font-bold font-body mb-8"
            >
              <QrCode className="w-3.5 h-3.5" />
              {t("QR Codes", "أكواد QR")}
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.92] text-[hsl(var(--navy))] mb-6"
            >
              {t("Print. Scan.", "اطبع. امسح.")}
              <br />
              <span className="text-[hsl(var(--sky))]">{t("Track. Done.", "تابع. انجز.")}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-body text-lg md:text-xl text-[hsl(var(--navy))]/45 max-w-lg mx-auto mb-12 leading-relaxed"
            >
              {t(
                "Branded QR codes with real time analytics. Free, customizable, and built for the Saudi market.",
                "أكواد QR بعلامتك التجارية مع تحليلات لحظية. مجاناً، قابلة للتخصيص، ومبنية للسوق السعودي."
              )}
            </motion.p>

            {/* Central QR visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.35, type: "spring" }}
              className="relative inline-flex items-center justify-center mb-14"
            >
              {/* Orbit ring */}
              <div className="absolute w-[320px] h-[320px] md:w-[400px] md:h-[400px] rounded-full border border-[hsl(var(--sky))]/12" />
              <div className="absolute w-[380px] h-[380px] md:w-[480px] md:h-[480px] rounded-full border border-dashed border-[hsl(var(--sky))]/8" />

              <OrbitDot radius={160} duration={8} delay={0} size={8} />
              <OrbitDot radius={200} duration={12} delay={2} size={5} />
              <OrbitDot radius={200} duration={10} delay={5} size={6} />

              {/* QR */}
              <div className="relative z-10 rounded-3xl p-5 bg-white shadow-elevated border border-[hsl(var(--navy))]/6">
                <AnimatedQRGrid size={200} />
                <div className="mt-3 text-center">
                  <p className="font-mono text-xs text-[hsl(var(--sky))] font-bold">snip.sa/menu</p>
                </div>
              </div>

              {/* Floating chips */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2, type: "spring" }}
                className="absolute top-4 -end-2 md:top-6 md:-end-16 bg-white rounded-xl px-4 py-2.5 shadow-card border border-[hsl(var(--navy))]/5 flex items-center gap-2.5"
              >
                <div className="w-7 h-7 rounded-full bg-[hsl(var(--sky))]/10 flex items-center justify-center">
                  <Scan className="w-3.5 h-3.5 text-[hsl(var(--sky))]" />
                </div>
                <div>
                  <p className="font-display text-[11px] font-bold text-[hsl(var(--navy))]">{t("Riyadh", "الرياض")}</p>
                  <p className="text-[9px] font-body text-[hsl(var(--navy))]/35">iPhone 15</p>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.6, type: "spring" }}
                className="absolute bottom-8 -start-2 md:bottom-12 md:-start-20 bg-[hsl(var(--navy))] rounded-xl px-4 py-2.5 shadow-lg flex items-center gap-2.5"
              >
                <BarChart3 className="w-4 h-4 text-[hsl(var(--sky))]" />
                <div>
                  <span className="font-display text-sm font-bold text-white">+23%</span>
                  <span className="text-[10px] text-white/45 font-body ms-1.5">{t("this week", "هالأسبوع")}</span>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-4 items-center justify-center"
            >
              <Link to={smartLink("/signup", "/dashboard/qr-codes")}>
                <Button className="bg-[hsl(var(--sky))] text-white font-body font-bold rounded-full px-10 py-6 text-base hover:brightness-110 transition-all shadow-lg shadow-[hsl(var(--sky))]/25">
                  {t("Create free QR code", "أنشئ كود QR مجاناً")}
                  <ArrowRight size={16} className="ms-1.5 rtl:rotate-180" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ═══ HOW IT WORKS — Horizontal scroll cards ═══ */}
      <section className="section-cream py-24 md:py-32 overflow-hidden">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[hsl(var(--navy))]/5 text-[hsl(var(--navy))]/60 text-xs font-bold font-body mb-4">
              {t("HOW IT WORKS", "كيف يعمل")}
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-[hsl(var(--navy))]">
              {t("Three steps. That's it.", "ثلاث خطوات. بس.")}
            </h2>
          </motion.div>

          <div className="max-w-5xl mx-auto relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--sky))]/20 to-transparent -translate-y-1/2 z-0" />

            <div className="grid md:grid-cols-3 gap-6 relative z-10">
              {[
                {
                  num: "01",
                  icon: Globe,
                  title: t("Paste your link", "الصق رابطك"),
                  desc: t("Enter any URL. Short link, menu, form, anything.", "أدخل أي رابط. رابط مختصر، قائمة، نموذج، أي شي."),
                },
                {
                  num: "02",
                  icon: Palette,
                  title: t("Customize design", "خصّص التصميم"),
                  desc: t("Pick your brand colors and add your logo.", "اختر ألوان علامتك وأضف شعارك."),
                },
                {
                  num: "03",
                  icon: Download,
                  title: t("Download & track", "حمّل وتتبّع"),
                  desc: t("Export as PNG or SVG. Every scan tracked automatically.", "صدّر بصيغة PNG أو SVG. كل مسح يتتبع تلقائياً."),
                },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="group"
                >
                  <div className="bg-white rounded-2xl p-7 border border-[hsl(var(--navy))]/6 hover:shadow-elevated transition-all duration-500 hover:-translate-y-1 relative overflow-hidden">
                    {/* Step number watermark */}
                    <span className="absolute -top-3 -end-2 font-display text-[80px] font-bold text-[hsl(var(--sky))]/[0.04] leading-none select-none">
                      {step.num}
                    </span>

                    <div className="flex items-center gap-3 mb-5">
                      <motion.div
                        whileInView={{ rotate: [0, -10, 10, 0] }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
                        className="w-12 h-12 rounded-xl bg-[hsl(var(--sky))]/8 flex items-center justify-center"
                      >
                        <step.icon className="w-5 h-5 text-[hsl(var(--sky))]" />
                      </motion.div>
                      <span className="font-display text-sm font-bold text-[hsl(var(--sky))]/40">{step.num}</span>
                    </div>

                    <h3 className="font-display text-xl font-bold text-[hsl(var(--navy))] mb-2">{step.title}</h3>
                    <p className="font-body text-sm text-[hsl(var(--navy))]/40 leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CAPABILITIES — Bento grid ═══ */}
      <section ref={bentoRef} className="section-cream-warm py-24 md:py-32 relative overflow-hidden">
        <motion.div style={{ y: bentoBlob1Y }} className="absolute top-1/4 end-0 w-96 h-96 bg-[hsl(var(--sky))]/5 rounded-full blur-[100px] pointer-events-none" />
        <motion.div style={{ y: bentoBlob2Y }} className="absolute bottom-1/4 start-0 w-72 h-72 bg-[hsl(var(--navy))]/4 rounded-full blur-[90px] pointer-events-none" />
        <motion.div style={{ y: bentoBlob3Y }} className="absolute top-1/2 start-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[hsl(var(--sky))]/3 rounded-full blur-[140px] pointer-events-none" />

        <div className="container mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-[hsl(var(--navy))]">
              {t("More than a QR code", "أكثر من مجرد كود QR")}
            </h2>
            <p className="font-body text-base text-[hsl(var(--navy))]/40 mt-4 max-w-md mx-auto">
              {t("Everything you need to create, customize, and track your QR codes.", "كل اللي تحتاجه لإنشاء وتخصيص وتتبع أكوادك.")}
            </p>
          </motion.div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
            {bentoItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`bg-white rounded-2xl p-6 border border-[hsl(var(--navy))]/6 hover:shadow-card transition-all duration-400 hover:-translate-y-0.5 flex flex-col ${item.span}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-[hsl(var(--sky))]/8 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-[hsl(var(--sky))]" />
                  </div>
                  <h3 className="font-display font-bold text-sm text-[hsl(var(--navy))]">{item.title}</h3>
                </div>
                <p className="font-body text-xs text-[hsl(var(--navy))]/40 leading-relaxed">{item.desc}</p>
                {item.visual}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ USE CASES — Interactive cards ═══ */}
      <section className="section-cream py-24 md:py-32">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight text-[hsl(var(--navy))]">
              {t("Built for every industry", "مبني لكل مجال")}
            </h2>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            {/* Tab buttons */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 justify-center flex-wrap">
              {useCases.map((uc, i) => (
                <motion.button
                  key={i}
                  onClick={() => setActiveUseCase(i)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`px-5 py-3 rounded-xl font-body text-sm transition-all duration-200 flex items-center gap-2.5 shrink-0 ${
                    activeUseCase === i
                      ? "bg-[hsl(var(--navy))] text-white shadow-lg shadow-[hsl(var(--navy))]/15"
                      : "bg-white text-[hsl(var(--navy))]/60 border border-[hsl(var(--navy))]/8 hover:border-[hsl(var(--navy))]/20"
                  }`}
                >
                  <span className="text-lg">{uc.emoji}</span>
                  <span className="font-display font-semibold">{uc.title}</span>
                </motion.button>
              ))}
            </div>

            {/* Content card */}
            <motion.div
              key={activeUseCase}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="bg-white rounded-3xl p-8 md:p-12 border border-[hsl(var(--navy))]/6 shadow-card"
            >
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="text-4xl mb-4 block">{useCases[activeUseCase].emoji}</span>
                  <h3 className="font-display text-2xl md:text-3xl font-bold text-[hsl(var(--navy))] mb-3">
                    {useCases[activeUseCase].title}
                  </h3>
                  <p className="font-body text-base text-[hsl(var(--navy))]/45 leading-relaxed">
                    {useCases[activeUseCase].desc}
                  </p>
                </div>

                {/* Visual flow */}
                <div className="flex items-center justify-center gap-5">
                  <motion.div
                    initial={{ scale: 0.85 }}
                    animate={{ scale: 1 }}
                    className="bg-[hsl(var(--navy))]/[0.03] rounded-2xl p-5 flex flex-col items-center gap-3"
                  >
                    <QrCode className="w-14 h-14 text-[hsl(var(--navy))]/20" />
                    <span className="font-mono text-[10px] text-[hsl(var(--navy))]/35">snip.sa/...</span>
                  </motion.div>
                  <motion.div animate={{ x: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                    <ArrowRight className="w-5 h-5 text-[hsl(var(--sky))]/50 rtl:rotate-180" />
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0.85 }}
                    animate={{ scale: 1 }}
                    className="bg-[hsl(var(--sky))]/[0.06] rounded-2xl p-5 flex flex-col items-center gap-3"
                  >
                    <Smartphone className="w-10 h-10 text-[hsl(var(--sky))]" />
                    <span className="font-mono text-[10px] text-[hsl(var(--sky))]/50">{useCases[activeUseCase].url}</span>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="section-cream-warm py-24 md:py-32">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div
              whileInView={{ rotate: [0, -8, 8, 0] }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-16 h-16 rounded-2xl bg-[hsl(var(--sky))]/10 flex items-center justify-center mx-auto mb-8"
            >
              <QrCode className="w-8 h-8 text-[hsl(var(--sky))]" />
            </motion.div>
            <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[hsl(var(--navy))] mb-5 leading-tight">
              {t("Your first QR code is", "أول كود QR لك")}{" "}
              <span className="text-[hsl(var(--sky))]">{t("free.", "مجاناً.")}</span>
            </h2>
            <p className="font-body text-base md:text-lg text-[hsl(var(--navy))]/40 mb-10">
              {t("No credit card. No limits. Start now.", "بدون بطاقة ائتمان. بدون حدود. ابدأ الحين.")}
            </p>
            <Link to={smartLink("/signup", "/dashboard/qr-codes")}>
              <Button className="bg-[hsl(var(--sky))] text-white font-body font-bold rounded-full px-10 py-7 text-lg hover:brightness-110 transition-all shadow-lg shadow-[hsl(var(--sky))]/25">
                {t("Get started", "ابدأ الحين")}
                <ArrowRight size={18} className="ms-2 rtl:rotate-180" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FeatureQRCodes;
