import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSmartLink } from "@/hooks/useSmartLink";

const FreePricingSection = () => {
  const { t } = useLanguage();
  const { smartLink } = useSmartLink();

  const perks = [
    t("All features included", "جميع الميزات"),
    t("No credit card", "بدون بطاقة بنكية"),
    t("Ready in 30 seconds", "جاهز في 30 ثانية"),
  ];

  return (
    <section id="pricing" className="section-cream-blush py-24 md:py-32">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] text-[hsl(var(--navy))]">
            {t("Start free no need to think about it", "ابدأ مجاناً من غير ما تفكّر")}
          </h2>
          <p className="mt-5 font-body text-base md:text-lg text-[hsl(var(--navy))]/65">
            {t(
              "Core features are always free, and advanced plans are there when you need them.",
              "الميزات الأساسية مجانية دايماً، والباقات المتقدمة لما تحتاجها."
            )}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-xl mx-auto bg-white rounded-3xl p-10 shadow-card border border-[hsl(var(--sky))]/20 text-center"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[hsl(var(--sky))]/12 text-[hsl(var(--sky))] text-xs font-bold font-body mb-4">
            ✓ {t("Free now", "مجاني الآن")}
          </span>
          <div className="flex items-baseline justify-center gap-2 mb-6">
            <span className="font-display text-6xl font-bold text-[hsl(var(--navy))]">
              {t("Free", "مجاني")}
            </span>
          </div>

          <ul className="space-y-3 mb-8 text-start max-w-xs mx-auto">
            {perks.map((p, i) => (
              <li key={i} className="flex items-center gap-3 font-body text-sm text-[hsl(var(--navy))]/80">
                <span className="w-5 h-5 rounded-full bg-[hsl(var(--sky))]/15 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-[hsl(var(--sky))]" />
                </span>
                {p}
              </li>
            ))}
          </ul>

          <Button asChild size="lg" className="bg-[hsl(var(--sky))] text-white font-body font-bold rounded-full px-8 hover:brightness-110">
            <Link to={smartLink("/signup")}>
              {t("Start free now", "ابدأ مجاناً الآن")}
              <ArrowRight size={16} className="ms-1.5 rtl:rotate-180" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default FreePricingSection;
