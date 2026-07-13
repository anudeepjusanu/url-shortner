import { motion } from "framer-motion";
import { Link2, QrCode, BarChart3, Tag, Globe, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBrand } from "@/contexts/BrandContext";

const SolutionSection = () => {
  const { t } = useLanguage();
  const brand = useBrand();

  const tools = [
    { icon: Link2, en: "Short links", ar: "اختصار الروابط" },
    { icon: QrCode, en: "QR codes", ar: "QR Code" },
    { icon: BarChart3, en: "Analytics", ar: "التحليلات" },
    { icon: Tag, en: "UTM Builder", ar: "UTM Builder" },
    { icon: Globe, en: "Custom domain", ar: "نطاق خاص" },
    { icon: User, en: "Bio page", ar: "صفحة Bio" },
  ];

  return (
    <section className="section-cream py-20 md:py-28">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[hsl(var(--sky))]/10 text-[hsl(var(--sky))] text-xs font-bold font-body mb-5">
            {brand.domain}
          </span>
          <h2 className="font-display text-2xl md:text-4xl font-bold tracking-tight leading-[1.1] text-[hsl(var(--navy))] mb-5">
            {t(
              "All your link management tools in one place",
              "كل أدوات إدارة روابطك في مكان واحد",
            )}
          </h2>
          <p className="font-body text-base md:text-lg text-[hsl(var(--navy))]/60 leading-relaxed">
            {t(
              "A Saudi platform built for marketers and individuals who want to share their links professionally, understand their audience, and make decisions backed by data without complexity.",
              "منصة سعودية مبنية للمسوّقين والأفراد اللي يبون يشاركون روابطهم باحترافية، يفهمون جمهورهم، ويحكمون قراراتهم بالبيانات بدون تعقيد.",
            )}
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
          {tools.map((tool, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-full shadow-soft border border-[hsl(var(--navy))]/5"
            >
              <tool.icon size={16} className="text-[hsl(var(--sky))]" />
              <span className="font-body font-semibold text-sm text-[hsl(var(--navy))]">
                {t(tool.en, tool.ar)}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
