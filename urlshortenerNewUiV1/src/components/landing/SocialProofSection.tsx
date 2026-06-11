import { motion } from "framer-motion";

import { useLanguage } from "@/contexts/LanguageContext";

const SocialProofSection = () => {
  const { t } = useLanguage();

  const stats = [
    { value: "+2,500", en: "Active users", ar: "مستخدم نشط" },
    { value: "+85K", en: "Links shortened", ar: "رابط مختصر" },
    { value: "+1.2M", en: "Clicks tracked", ar: "ضغطة مُتتبَّعة" },
  ];


  return (
    <section className="section-cream-warm py-20 md:py-28">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <h2 className="font-display text-2xl md:text-4xl font-bold tracking-tight leading-[1.1] text-[hsl(var(--navy))]">
            {t(
              "Trusted by marketers and individuals across Saudi Arabia",
              "يثق به المسوّقون والأفراد في السعودية"
            )}
          </h2>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-4xl mx-auto mb-16">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <p className="font-display font-bold text-2xl md:text-4xl text-[hsl(var(--navy))] mb-2">
                {s.value}
              </p>
              <p className="font-body text-xs md:text-sm uppercase tracking-wider text-[hsl(var(--navy))]/50 font-semibold">
                {t(s.en, s.ar)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;
