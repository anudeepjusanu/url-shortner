import { Link2, QrCode, Globe, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LinksPreview, QRCodesPreview, DomainsPreview } from "./PreviewMockups";

const FeaturesSection = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: Link2,
      title: t("Shorten links", "اختصر روابطك"),
      description: t(
        "Turn any long URL into a short, clean link in seconds. Easy to share on social media, SMS, email, or anywhere you need a link that's simple and memorable.",
        "حوّل أي رابط طويل إلى رابط قصير ونظيف في ثواني. سهل تشاركه على السوشال ميديا، الرسائل، الإيميل، أو أي مكان تحتاج فيه رابط بسيط وسهل الحفظ."
      ),
      visual: <LinksPreview />,
    },
    {
      icon: QrCode,
      title: t("QR codes for print and events", "QR Codes للمطبوعات والفعاليات"),
      description: t(
        "Generate QR codes for your restaurant menu, product packaging, or event booth. Every scan gets tracked just like a click. Perfect for when customers can't type a link.",
        "سوي QR Codes لفلاير المطعم، تغليف المنتج، أو ستاند المعرض. كل مسح يتتبع مثل الضغطات."
      ),
      visual: <QRCodesPreview />,
    },
    {
      icon: Globe,
      title: t("Use your own domain", "استخدم نطاقك الخاص"),
      description: t(
        "Make links with your domain instead of 4r.sa. Like go.yourshop.sa/ramadanoffer. Free SSL included, setup takes 2 minutes.",
        "خلي الروابط بنطاقك مو 4r.sa. مثلاً: go.متجرك.sa/عرض_رمضان. SSL مجاني والإعداد يخلص في دقيقتين."
      ),
      visual: <DomainsPreview />,
    },
  ];

  const creamShades = ["section-cream-soft", "section-cream-warm", "section-cream-rose", "section-cream-blush"];

  return (
    <section id="features">
      {features.map((feature, i) => {
        const isReversed = i % 2 === 1;
        return (
          <div key={i} className={`${creamShades[i]} py-24 md:py-32`}>
            <div className="container mx-auto px-6">
              <div className={`grid lg:grid-cols-2 gap-16 items-center ${isReversed ? "direction-normal" : ""}`}>
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className={isReversed ? "lg:order-2" : ""}
                >
                  <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-5 tracking-tight leading-[1.1] text-[hsl(var(--navy))]">
                    {feature.title}
                  </h2>
                  <p className="font-body text-lg leading-relaxed mb-8 max-w-md text-[hsl(var(--navy))]/65">
                    {feature.description}
                  </p>
                  <Button className="bg-[hsl(var(--sky))] text-white font-body font-bold rounded-full px-8 py-6 text-base hover:brightness-110 transition-all">
                    {t("Get started for free", "ابدأ مجاناً")}
                    <ArrowRight size={16} className="ms-1.5" />
                  </Button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  className={isReversed ? "lg:order-1" : ""}
                >
                  {feature.visual}
                </motion.div>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
};

export default FeaturesSection;
