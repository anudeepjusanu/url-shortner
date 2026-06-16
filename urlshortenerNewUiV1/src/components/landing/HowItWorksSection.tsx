import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { UserPlus, Link2, Share2 } from "lucide-react";

const HowItWorksSection = () => {
  const { t } = useLanguage();

  const steps = [
    {
      number: "1",
      icon: UserPlus,
      title: t("Sign up free", "سجّل مجاناً"),
      description: t(
        "Create your account in seconds with email or Google. No credit card, no commitments.",
        "أنشئ حسابك في ثوانٍ بإيميلك أو حساب Google. بدون بطاقة بنكية، بدون التزامات."
      ),
    },
    {
      number: "2",
      icon: Link2,
      title: t("Paste your link and shorten it", "الصق رابطك واختصره"),
      description: t(
        "Paste any link and turn it into a short URL or QR code with one click, customize it with your name or domain.",
        "ألصق أي رابط وحوّله إلى رابط قصير أو QR Code بضغطة واحدة. خصّصه باسمك أو نطاقك إذا أردت."
      ),
    },
    {
      number: "3",
      icon: Share2,
      title: t("Share and track performance live", "شارك وتابع الأداء مباشرة"),
      description: t(
        "Share your link anywhere, and watch every click in your dashboard — who clicked, from where, on what device, in real time.",
        "شارك رابطك أينما تريد، وراقب كل ضغطة في لوحة التحكم. كم شخص ضغط، من وين، وبأي جهاز، في الوقت الفعلي."
      ),
    },
  ];

  return (
    <section className="section-cream py-24 md:py-32">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-xl mx-auto mb-14"
        >
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-[hsl(var(--navy))]">
            {t("How it works", "كيف يشتغل")}
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 lg:gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-white rounded-2xl p-7 border border-[hsl(var(--navy))]/6 shadow-soft"
            >
              {/* Number badge + icon row */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-7 h-7 rounded-full bg-[hsl(var(--sky))] flex items-center justify-center shrink-0">
                  <span className="text-xs font-display font-black text-white">{step.number}</span>
                </div>
                <step.icon size={18} className="text-[hsl(var(--sky))]/70" />
              </div>
              <h3 className="font-display text-lg font-bold text-[hsl(var(--navy))] mb-2">{step.title}</h3>
              <p className="font-body text-sm text-[hsl(var(--navy))]/55 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
