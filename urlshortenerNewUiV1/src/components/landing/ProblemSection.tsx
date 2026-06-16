import { motion } from "framer-motion";

import { useLanguage } from "@/contexts/LanguageContext";

const ProblemSection = () => {
  const { t } = useLanguage();

  const pains = [
    {
      title: t("A long link ruins your posts", "الرابط الطويل يُشوّه منشوراتك"),
      desc: t(
        "A random long URL in any post or message looks unprofessional and lowers your credibility.",
        "رابط عشوائي طويل في أي منشور أو رسالة يبدو غير احترافي ويُقلّل من مصداقيتك."
      ),
    },
    {
      title: t("You're walking blind in your campaigns", "تمشي أعمى في حملاتك التسويقية"),
      desc: t(
        "You don't know how many clicked, or where your audience came from decisions without real data.",
        "ما تعرف كم شخص ضغط، ولا من وين جاء جمهورك قرارات بدون بيانات حقيقية."
      ),
    },
    {
      title: t("Your data lives outside the Kingdom", "بياناتك خارج السعودية"),
      desc: t(
        "Foreign shortener platforms store your audience data abroad, far from PDPL regulations.",
        "منصات الاختصار الأجنبية تخزّن بيانات جمهورك خارج السعودية، بعيداً عن أنظمة PDPL."
      ),
    },
  ];

  return (
    <section className="section-cream-warm py-24 md:py-32">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] text-[hsl(var(--navy))]">
            {t(
              "You shared a link... and never knew if anyone clicked?",
              "شاركت رابط... وما عرفت إذا أحد ضغط عليه؟"
            )}
          </h2>
          <p className="mt-5 font-body text-base md:text-lg text-[hsl(var(--navy))]/60">
            {t(
              "Three problems every marketer faces every single day.",
              "ثلاث مشاكل يعاني منها كل مسوّق يومياً."
            )}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {pains.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="bg-[hsl(0,75%,98%)] rounded-3xl p-7 shadow-soft border border-[hsl(0,75%,55%)]/20"
            >
              <h3 className="font-display font-bold text-xl text-[hsl(var(--navy))] mb-3 leading-snug">
                {p.title}
              </h3>
              <p className="font-body text-sm leading-relaxed text-[hsl(var(--navy))]/65">
                {p.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
