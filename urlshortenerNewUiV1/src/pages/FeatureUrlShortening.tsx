import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import CTASection from "@/components/landing/CTASection";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link2, ArrowRight, Zap, BarChart3, Shield, Globe, MousePointerClick, Smartphone, Check, Tag, Copy, TrendingUp, Mail, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { LinksPreview } from "@/components/landing/PreviewMockups";
import { UTMPreview } from "@/components/landing/UTMPreviewMockup";
import { useState } from "react";
import { toast } from "sonner";

const FeatureUrlShortening = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [inputUrl, setInputUrl] = useState("");
  const [shortenedUrl, setShortenedUrl] = useState("");

  const handleShorten = () => {
    if (!inputUrl.trim()) return;
    navigate("/shorten", { state: { url: inputUrl.trim() } });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shortenedUrl);
    toast.success(t("Copied to clipboard!", "تم النسخ!"));
  };

  const stats = [
    { value: "50K+", label: t("Links created", "رابط تم إنشاؤه") },
    { value: "2M+", label: t("Clicks tracked", "نقرة تم تتبعها") },
    { value: "<1s", label: t("Shortening time", "وقت الاختصار") },
    { value: "99.9%", label: t("Uptime", "وقت التشغيل") },
  ];

  const benefits = [
    {
      icon: Zap,
      title: t("Instant shortening", "اختصار فوري"),
      desc: t("Paste any URL and get a short link in under a second. No signup required to try.", "الصق أي رابط واحصل على رابط قصير في أقل من ثانية. بدون تسجيل للتجربة."),
      num: "01",
    },
    {
      icon: BarChart3,
      title: t("Click analytics", "تحليلات الضغطات"),
      desc: t("Track every click with detailed analytics: location, device, browser, and referral source.", "تتبع كل نقرة بتحليلات مفصلة: الموقع، الجهاز، المتصفح، ومصدر الإحالة."),
      num: "02",
    },
    {
      icon: Shield,
      title: t("Saudi hosted", "استضافة سعودية"),
      desc: t("Your data stays in Saudi Arabia. Fully compliant with local regulations and PDPL.", "بياناتك تبقى في السعودية. متوافق تماماً مع الأنظمة المحلية ونظام حماية البيانات."),
      num: "03",
    },
    {
      icon: Globe,
      title: t("Custom domains", "نطاقات مخصصة"),
      desc: t("Use your own brand domain instead of snip.sa. Like go.yourshop.sa/offer. Free SSL included.", "استخدم نطاق علامتك التجارية بدلاً من snip.sa. مثل go.متجرك.sa/عرض. SSL مجاني."),
      num: "04",
    },
    {
      icon: MousePointerClick,
      title: t("Custom aliases", "أسماء مخصصة"),
      desc: t("Choose memorable link names like snip.sa/ramadan instead of random codes.", "اختر أسماء روابط سهلة الحفظ مثل snip.sa/رمضان بدلاً من أكواد عشوائية."),
      num: "05",
    },
  ];

  const useCases = [
    {
      icon: TrendingUp,
      title: t("Marketing campaigns", "الحملات التسويقية"),
      desc: t("Track which ads, posts, and emails drive the most clicks with UTM-tagged short links.", "تتبع أي الإعلانات والمنشورات والإيميلات تجلب أكثر ضغطات مع روابط UTM قصيرة."),
      stat: "3.2x",
      statLabel: t("more conversions", "تحويلات أكثر"),
      gradient: "from-[hsl(var(--sky))]/10 to-transparent",
    },
    {
      icon: Link2,
      title: t("Social media bios", "بايو السوشال ميديا"),
      desc: t("One clean link in your bio instead of a long messy URL. Change the destination anytime.", "رابط واحد نظيف في البايو بدلاً من رابط طويل فوضوي. غيّر الوجهة في أي وقت."),
      stat: "47%",
      statLabel: t("higher click rate", "معدل نقر أعلى"),
      gradient: "from-purple-500/10 to-transparent",
    },
    {
      icon: MessageSquare,
      title: t("SMS & WhatsApp", "الرسائل والواتساب"),
      desc: t("Short links save characters in SMS and look professional in WhatsApp messages.", "الروابط القصيرة توفر حروف في الرسائل وتبان احترافية في رسائل الواتساب."),
      stat: "60%",
      statLabel: t("shorter messages", "رسائل أقصر"),
      gradient: "from-emerald-500/10 to-transparent",
    },
  ];

  const comparisonItems = [
    t("No character limits on destination URLs", "بدون حد لطول رابط الوجهة"),
    t("Unlimited free short links", "روابط قصيرة مجانية غير محدودة"),
    t("Real time click analytics", "تحليلات ضغطات بالوقت الحقيقي"),
    t("Custom branded domains", "نطاقات مخصصة بعلامتك"),
    t("Saudi Arabia hosted servers", "خوادم مستضافة في السعودية"),
    t("API access included free", "وصول API مجاني"),
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="section-cream pt-32 pb-20 md:pt-40 md:pb-28 relative overflow-hidden">
        <div className="absolute top-20 -start-32 w-96 h-96 bg-[hsl(var(--sky))]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -end-32 w-80 h-80 bg-[hsl(var(--navy))]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[hsl(var(--sky))]/10 text-[hsl(var(--sky))] text-xs font-bold font-body mb-6">
                <Link2 className="w-3.5 h-3.5" />
                {t("URL Shortening", "اختصار الروابط")}
              </span>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight leading-[1.1] text-[hsl(var(--navy))]">
                {t("Shorten links.", "اختصر روابطك.")}{" "}
                <br className="hidden md:block" />
                <span className="text-[hsl(var(--sky))]">{t("Track everything.", "تتبع كل شيء.")}</span>
              </h1>
              <p className="font-body text-lg leading-relaxed mb-8 max-w-md text-[hsl(var(--navy))]/60">
                {t(
                  "Turn any long URL into a short, clean link in seconds. Track clicks, locations, and devices. All hosted in Saudi Arabia.",
                  "حوّل أي رابط طويل إلى رابط قصير ونظيف في ثواني. تتبع الضغطات والمواقع والأجهزة. كل شيء مستضاف في السعودية."
                )}
              </p>

              {/* Shortener CTA */}
              <div className="bg-white rounded-2xl border border-[hsl(var(--navy))]/8 p-5 shadow-card max-w-lg">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => { setInputUrl(e.target.value); setShortenedUrl(""); }}
                    placeholder={t("Paste your long URL here...", "الصق رابطك الطويل هنا...")}
                    className="flex-1 bg-[hsl(var(--navy))]/4 rounded-xl px-4 py-3 text-sm font-body text-[hsl(var(--navy))] placeholder:text-[hsl(var(--navy))]/30 outline-none focus:ring-2 focus:ring-[hsl(var(--sky))]/30 transition-all"
                    onKeyDown={(e) => e.key === "Enter" && handleShorten()}
                  />
                  <Button
                    onClick={handleShorten}
                    className="bg-[hsl(var(--sky))] text-white font-body font-bold rounded-xl px-6 py-3 text-sm hover:brightness-110 transition-all shadow-md shadow-[hsl(var(--sky))]/20 shrink-0"
                  >
                    {t("Shorten", "اختصر")}
                  </Button>
                </div>

                {shortenedUrl && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 flex items-center justify-between bg-[hsl(var(--sky))]/8 border border-[hsl(var(--sky))]/15 rounded-xl px-4 py-3"
                  >
                    <div>
                      <span className="text-[10px] font-body text-[hsl(var(--sky))] block mb-0.5">{t("Your short link", "رابطك القصير")}</span>
                      <span className="text-sm font-display font-bold text-[hsl(var(--navy))]">{shortenedUrl}</span>
                    </div>
                    <button
                      onClick={handleCopy}
                      className="w-9 h-9 rounded-lg bg-[hsl(var(--sky))]/15 flex items-center justify-center hover:bg-[hsl(var(--sky))]/25 transition-colors"
                    >
                      <Copy className="w-4 h-4 text-[hsl(var(--sky))]" />
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--sky))]/10 to-[hsl(var(--navy))]/5 rounded-3xl blur-2xl scale-105 pointer-events-none" />
              <div className="relative">
                <LinksPreview />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="section-cream-warm py-14">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-5 border border-[hsl(var(--navy))]/6 text-center"
              >
                <p className="font-display text-2xl md:text-3xl font-bold text-[hsl(var(--sky))] mb-1">{stat.value}</p>
                <p className="font-body text-xs text-[hsl(var(--navy))]/45">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits — Bento grid */}
      <section className="section-cream-soft py-20 md:py-28 relative overflow-hidden">
        <div className="absolute top-1/2 start-0 w-72 h-72 bg-[hsl(var(--sky))]/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
        <div className="absolute bottom-20 end-0 w-64 h-64 bg-[hsl(var(--navy))]/3 rounded-full blur-3xl pointer-events-none" />
        <div className="container mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[hsl(var(--navy))]/5 text-[hsl(var(--navy))]/60 text-xs font-bold font-body mb-4">
              {t("FEATURES", "الميزات")}
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[hsl(var(--navy))] mb-4">
              {t("Everything you need", "كل اللي تحتاجه")}
            </h2>
            <p className="font-body text-lg text-[hsl(var(--navy))]/50 max-w-lg mx-auto">
              {t("Simple tools that just work, built for the Saudi market.", "أدوات بسيطة تشتغل، مبنية للسوق السعودي.")}
            </p>
          </motion.div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1 — Instant shortening (tall) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:row-span-2 bg-white rounded-2xl p-6 border border-[hsl(var(--navy))]/6 hover:shadow-card transition-all duration-300 hover:-translate-y-0.5 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-[hsl(var(--sky))]/8 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-[hsl(var(--sky))]" />
                </div>
                <h3 className="font-display font-bold text-sm text-[hsl(var(--navy))]">{t("Instant shortening", "اختصار فوري")}</h3>
              </div>
              <p className="font-body text-xs text-[hsl(var(--navy))]/40 leading-relaxed mb-auto">{t("Paste any URL and get a short link in under a second.", "الصق أي رابط واحصل على رابط قصير في أقل من ثانية.")}</p>
              <div className="mt-6 bg-[hsl(var(--navy))]/[0.03] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-red-300/60" />
                  <div className="w-2 h-2 rounded-full bg-yellow-300/60" />
                  <div className="w-2 h-2 rounded-full bg-green-300/60" />
                </div>
                <div className="bg-white rounded-lg px-3 py-2.5 flex items-center gap-2 mb-2 border border-[hsl(var(--navy))]/5">
                  <Globe className="w-3.5 h-3.5 text-[hsl(var(--navy))]/25 shrink-0" />
                  <motion.span
                    initial={{ width: 0 }}
                    whileInView={{ width: "auto" }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="font-mono text-[11px] text-[hsl(var(--navy))]/50 overflow-hidden whitespace-nowrap"
                  >
                    mystore.com/products/item
                  </motion.span>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.2 }}
                  className="bg-[hsl(var(--sky))]/5 rounded-lg px-3 py-2.5 flex items-center justify-between"
                >
                  <span className="font-mono text-[11px] text-[hsl(var(--sky))] font-bold">snip.sa/store</span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-green-100 text-green-600 font-bold">{t("READY", "جاهز")}</span>
                </motion.div>
              </div>
            </motion.div>

            {/* Card 2 — Click analytics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 }}
              className="bg-white rounded-2xl p-6 border border-[hsl(var(--navy))]/6 hover:shadow-card transition-all duration-300 hover:-translate-y-0.5 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-[hsl(var(--sky))]/8 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-[hsl(var(--sky))]" />
                </div>
                <h3 className="font-display font-bold text-sm text-[hsl(var(--navy))]">{t("Click analytics", "تحليلات الضغطات")}</h3>
              </div>
              <p className="font-body text-xs text-[hsl(var(--navy))]/40 leading-relaxed">{t("Track every click with detailed analytics.", "تتبع كل نقرة بتحليلات مفصلة.")}</p>
              <div className="mt-auto pt-4 flex items-end gap-1 h-14">
                {[30, 50, 35, 65, 45, 75, 55, 85, 60, 95].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.04, duration: 0.4 }}
                    className="flex-1 rounded-t bg-[hsl(var(--sky))]"
                    style={{ opacity: 0.3 + (h / 100) * 0.7 }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Card 3 — Saudi hosted */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.16 }}
              className="bg-white rounded-2xl p-6 border border-[hsl(var(--navy))]/6 hover:shadow-card transition-all duration-300 hover:-translate-y-0.5 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-[hsl(var(--sky))]/8 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-[hsl(var(--sky))]" />
                </div>
                <h3 className="font-display font-bold text-sm text-[hsl(var(--navy))]">{t("Saudi hosted", "استضافة سعودية")}</h3>
              </div>
              <p className="font-body text-xs text-[hsl(var(--navy))]/40 leading-relaxed">{t("Your data stays in Saudi Arabia. Fully compliant.", "بياناتك تبقى في السعودية. متوافق تماماً.")}</p>
              <div className="mt-auto pt-4 flex justify-center">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="w-12 h-12 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center"
                >
                  <Shield className="w-5 h-5 text-green-500" />
                </motion.div>
              </div>
            </motion.div>

            {/* Card 4 — Custom domains */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.24 }}
              className="bg-white rounded-2xl p-6 border border-[hsl(var(--navy))]/6 hover:shadow-card transition-all duration-300 hover:-translate-y-0.5 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-[hsl(var(--sky))]/8 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-[hsl(var(--sky))]" />
                </div>
                <h3 className="font-display font-bold text-sm text-[hsl(var(--navy))]">{t("Custom domains", "نطاقات مخصصة")}</h3>
              </div>
              <p className="font-body text-xs text-[hsl(var(--navy))]/40 leading-relaxed">{t("Use your own brand domain. Free SSL included.", "استخدم نطاق علامتك. SSL مجاني.")}</p>
              <div className="mt-auto pt-4">
                <div className="bg-[hsl(var(--navy))]/[0.03] rounded-lg px-3 py-2 flex items-center gap-2">
                  <Globe className="w-3 h-3 text-[hsl(var(--navy))]/25 shrink-0" />
                  <span className="font-mono text-[11px] text-[hsl(var(--navy))]/50">go.yourshop.sa/offer</span>
                </div>
              </div>
            </motion.div>

            {/* Card 5 — Custom aliases */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.32 }}
              className="bg-white rounded-2xl p-6 border border-[hsl(var(--navy))]/6 hover:shadow-card transition-all duration-300 hover:-translate-y-0.5 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-[hsl(var(--sky))]/8 flex items-center justify-center">
                  <MousePointerClick className="w-4 h-4 text-[hsl(var(--sky))]" />
                </div>
                <h3 className="font-display font-bold text-sm text-[hsl(var(--navy))]">{t("Custom aliases", "أسماء مخصصة")}</h3>
              </div>
              <p className="font-body text-xs text-[hsl(var(--navy))]/40 leading-relaxed">{t("Choose memorable link names instead of random codes.", "اختر أسماء روابط سهلة الحفظ بدلاً من أكواد عشوائية.")}</p>
              <div className="mt-auto pt-4 flex gap-2">
                {["snip.sa/sale", "snip.sa/menu"].map((alias, i) => (
                  <motion.div
                    key={alias}
                    initial={{ opacity: 0, x: -6 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="flex-1 bg-[hsl(var(--sky))]/5 rounded-lg py-2 text-center"
                  >
                    <span className="font-mono text-[10px] text-[hsl(var(--sky))] font-bold">{alias}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Use cases — horizontal cards with stats */}
      <section className="section-cream-rose py-20 md:py-28">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[hsl(var(--sky))]/10 text-[hsl(var(--sky))] text-xs font-bold font-body mb-4">
              {t("USE CASES", "حالات الاستخدام")}
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[hsl(var(--navy))] mb-4">
              {t("Built for real use cases", "مبني لاستخدامات حقيقية")}
            </h2>
          </motion.div>

          <div className="space-y-4 max-w-3xl mx-auto">
            {useCases.map((uc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative bg-white rounded-2xl border border-[hsl(var(--navy))]/6 overflow-hidden hover:shadow-elevated transition-all duration-300"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${uc.gradient} pointer-events-none`} />
                <div className="relative flex flex-col md:flex-row items-start md:items-center gap-5 p-6 md:p-7">
                  <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--sky))]/8 flex items-center justify-center shrink-0">
                    <uc.icon className="w-6 h-6 text-[hsl(var(--sky))]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-[hsl(var(--navy))] mb-1.5 text-lg">{uc.title}</h3>
                    <p className="font-body text-sm text-[hsl(var(--navy))]/50 leading-relaxed">{uc.desc}</p>
                  </div>
                  <div className="shrink-0 text-end md:text-center px-4 py-3 rounded-xl bg-[hsl(var(--navy))]/3">
                    <p className="font-display text-2xl font-bold text-[hsl(var(--sky))]">{uc.stat}</p>
                    <p className="font-body text-[10px] text-[hsl(var(--navy))]/40 whitespace-nowrap">{uc.statLabel}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why snip.sa checklist */}
      <section className="section-cream-warm py-20 md:py-28">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[hsl(var(--sky))]/10 text-[hsl(var(--sky))] text-xs font-bold font-body mb-4">
                {t("WHY snip.sa", "ليش snip.sa")}
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-[hsl(var(--navy))] mb-6">
                {t("The only URL shortener built for Saudi Arabia", "مختصر الروابط الوحيد المبني للسعودية")}
              </h2>
              <p className="font-body text-base text-[hsl(var(--navy))]/50 leading-relaxed">
                {t(
                  "While others charge monthly fees and host your data overseas, snip.sa gives you everything for free with your data staying in Saudi Arabia.",
                  "بينما غيرنا يفرضون رسوم شهرية ويستضيفون بياناتك برا، snip.sa يعطيك كل شيء مجاناً مع بقاء بياناتك في السعودية."
                )}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-3"
            >
              {comparisonItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3 bg-white rounded-xl px-5 py-3.5 border border-[hsl(var(--navy))]/6"
                >
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <span className="font-body text-sm text-[hsl(var(--navy))]">{item}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* UTM Builder section */}
      <section className="section-cream-blush py-20 md:py-28 relative overflow-hidden">
        <div className="absolute top-0 end-0 w-80 h-80 bg-[hsl(var(--sky))]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="container mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[hsl(var(--sky))]/10 text-[hsl(var(--sky))] text-xs font-bold font-body mb-5">
                <Tag className="w-3.5 h-3.5" />
                {t("UTM TRACKING", "تتبع UTM")}
              </span>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[hsl(var(--navy))] mb-5 leading-[1.1]">
                {t("UTM tracking built in", "تتبع UTM مدمج")}
              </h2>
              <p className="font-body text-lg leading-relaxed mb-6 max-w-md text-[hsl(var(--navy))]/60">
                {t(
                  "Add UTM parameters to any link with our visual builder. Track which campaigns, sources, and mediums drive the most clicks. No spreadsheets needed.",
                  "أضف معلمات UTM لأي رابط عبر أداتنا البصرية. تتبع أي الحملات والمصادر والوسائط تجلب أكثر ضغطات. بدون جداول بيانات."
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {["utm_source", "utm_medium", "utm_campaign"].map(tag => (
                  <span key={tag} className="px-3 py-1.5 rounded-full bg-[hsl(var(--navy))]/5 text-[hsl(var(--navy))]/60 text-xs font-mono font-bold">{tag}</span>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
            >
              <UTMPreview />
            </motion.div>
          </div>
        </div>
      </section>

      <CTASection />
      <Footer />
    </div>
  );
};

export default FeatureUrlShortening;
