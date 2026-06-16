import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { UserPlus, Link2, Share2 } from "lucide-react";

const HowItWorks = () => {
  const { t } = useLanguage();

  const steps = [
    {
      num: "1",
      icon: UserPlus,
      title: t("Sign up free", "سجّل مجاناً"),
      description: t(
        "Create your account in seconds with email or Google. No credit card, no commitments.",
        "أنشئ حسابك في ثوانٍ بإيميلك أو حساب Google. بدون بطاقة بنكية، بدون التزامات."
      ),
    },
    {
      num: "2",
      icon: Link2,
      title: t("Paste your link and shorten it", "الصق رابطك واختصره"),
      description: t(
        "Paste any link and turn it into a short URL or QR code with one click customize it with your name or domain.",
        "ألصق أي رابط وحوّله إلى رابط قصير أو QR Code بضغطة واحدة خصّصه باسمك أو نطاقك إذا أردت."
      ),
    },
    {
      num: "3",
      icon: Share2,
      title: t("Share and track performance live", "شارك وتابع الأداء مباشرة"),
      description: t(
        "Share your link anywhere, and watch every click in your dashboard who clicked, from where, on what device, in real time.",
        "شارك رابطك أينما تريد، وراقب كل ضغطة في لوحة التحكم كم شخص ضغط، من وين، وبأي جهاز، في الوقت الفعلي."
      ),
    },
  ];

  return (
    <section className="section-cream-soft py-24 md:py-32">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] text-[hsl(var(--navy))]">
            {t("How it works", "كيف يشتغل")}
          </h2>
        </motion.div>

        <div className="relative grid md:grid-cols-3 gap-6 lg:gap-10 max-w-5xl mx-auto">
          {/* Timeline connector */}
          <div className="hidden md:block absolute top-[60px] left-[16.66%] right-[16.66%] h-0.5 bg-gradient-to-r from-[hsl(var(--sky))]/30 via-[hsl(var(--sky))]/50 to-[hsl(var(--sky))]/30 -z-0" />
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="relative bg-white rounded-3xl p-7 shadow-soft border border-[hsl(var(--navy))]/5"
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="w-9 h-9 rounded-full bg-[hsl(var(--sky))] text-white font-display font-bold flex items-center justify-center">
                  {step.num}
                </span>
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--sky))]/10 flex items-center justify-center">
                  <step.icon className="w-5 h-5 text-[hsl(var(--sky))]" />
                </div>
              </div>
              <h3 className="font-display font-bold text-xl text-[hsl(var(--navy))] mb-3 leading-snug">
                {step.title}
              </h3>
              <p className="font-body text-sm leading-relaxed text-[hsl(var(--navy))]/65">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
