import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { AnalyticsPreview } from "./PreviewMockups";

const AnalyticsSection = () => {
  const { t } = useLanguage();

  const stats = [
    { value: t("> 2s", "> 2 ثانية"), label: t("Data delay", "وصول البيانات") },
    { value: "195", label: t("Countries", "دولة") },
    { value: "∞", label: t("Data retention", "احتفاظ بالبيانات") },
    { value: "CSV", label: t("Export", "تصدير") },
  ];

  return (
    <section id="analytics" className="section-cream-warm py-28 md:py-36 relative overflow-hidden">
      <div className="container mx-auto px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-5 tracking-tight leading-[1.1] text-[hsl(var(--navy))]">
            {t("See exactly where your clicks are coming from", "شوف بالضبط من وين عملائك جايين")}
          </h2>
          <p className="font-body text-lg leading-relaxed text-[hsl(var(--navy))]/75 max-w-xl mx-auto mb-8">
            {t(
              "Every link you shorten becomes a data source. Track clicks by country, city, device, browser, and platform.",
              "كل رابط تختصره يصير مصدر بيانات. تتبع الضغطات حسب الدولة، المدينة، الجهاز، المتصفح، والمصدر."
            )}
          </p>
          <Button className="bg-[hsl(var(--sky))] text-white font-body font-bold rounded-full px-8 py-6 text-base hover:brightness-110 transition-all" asChild>
            <Link to="/signup">
              {t("Get started for free", "ابدأ مجاناً")}
              <ArrowRight size={16} className="ms-1.5" />
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative max-w-2xl mx-auto mb-16"
        >
          <AnalyticsPreview />
        </motion.div>

        <div className="grid w-full max-w-4xl mx-auto grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="bg-secondary rounded-2xl border border-secondary-foreground/10 px-5 py-5 text-center text-secondary-foreground"
            >
              <span className="block font-display text-2xl md:text-3xl font-black text-secondary-foreground">{stat.value}</span>
              <span className="mt-1 block text-sm font-body text-secondary-foreground/70">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AnalyticsSection;