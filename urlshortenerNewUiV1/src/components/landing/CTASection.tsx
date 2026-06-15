import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { useSmartLink } from "@/hooks/useSmartLink";

const CTASection = () => {
  const { t } = useLanguage();
  const { smartLink } = useSmartLink();

  return (
    <section className="section-cream-rose py-28 md:py-36 overflow-x-clip">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-[hsl(var(--navy))] rounded-3xl p-6 sm:p-10 md:p-16 text-center max-w-4xl mx-auto"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6 tracking-tight leading-[1.1] text-white">
            {t(
              "Your links deserve more than just a share",
              "روابطك تستحق أكثر من مجرد مشاركة"
            )}
          </h2>
          <p className="font-body text-lg mb-10 text-white/65 max-w-xl mx-auto leading-relaxed">
            {t(
              "Join thousands of marketers and individuals managing their links smartly start today and make every click count.",
              "انضم إلى آلاف المسوّقين والأفراد اللي يديرون روابطهم بذكاء ابدأ اليوم وخلّ كل ضغطة تحسب."
            )}
          </p>

          <Button
            asChild
            size="lg"
            className="bg-[hsl(var(--sky))] text-white font-body font-bold text-sm sm:text-base px-5 sm:px-9 py-5 sm:py-6 rounded-full hover:brightness-110 transition-all max-w-full h-auto whitespace-normal text-center leading-tight"
          >
            <Link to={smartLink("/signup")}>
              <span className="inline-flex items-center gap-1.5 flex-wrap justify-center">
                {t("Start free now no credit card", "ابدأ مجاناً الآن بدون بطاقة بنكية")}
                <ArrowRight size={16} className="rtl:rotate-180 shrink-0" />
              </span>
            </Link>
          </Button>

          <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-white/60 font-body text-sm">
            <span>✓ {t("Free", "مجاني")}</span>
            <span>✓ {t("Ready in 30 seconds", "جاهز في 30 ثانية")}</span>
            <span>✓ {t("Your data in Saudi Arabia", "بياناتك في السعودية")}</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
