import { Link2, QrCode, Globe, ArrowRight, User, Tag, BarChart3 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { LinksPreview, QRCodesPreview, DomainsPreview } from "./PreviewMockups";
import { BioPreview } from "./BioPreviewMockup";
import { UTMPreview } from "./UTMPreviewMockup";
import HeroDashboardMockup from "./HeroDashboardMockup";

const FeaturesSection = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: Link2,
      title: t("Shorten links", "اختصار الروابط"),
      description: t(
        "Turn any long URL into a clean, short link in seconds easy to share on WhatsApp, Twitter, SMS, or anywhere else.",
        "حوّل أي رابط طويل إلى رابط قصير نظيف في ثوانٍ سهل المشاركة على واتساب، تويتر، الرسائل، وأي مكان ثاني."
      ),
      visual: <LinksPreview />,
      link: "/features/url-shortening",
    },
    {
      icon: QrCode,
      title: t("Instant, trackable QR codes", "QR Code فوري وقابل للتتبع"),
      description: t(
        "Generate a QR code for any link in seconds and download it ready for print for your business card, menu, or event booth. Every scan is logged in your analytics.",
        "أنشئ QR Code لأي رابط في ثوانٍ وحمّله جاهزاً للطباعة لبطاقتك التجارية، المنيو حقك، أو بوث المعرض. وكل مسح يُسجَّل في تحليلاتك."
      ),
      visual: <QRCodesPreview />,
      link: "/features/qr-codes",
    },
    {
      icon: BarChart3,
      title: t("Detailed real-time analytics", "تحليلات مفصّلة في الوقت الفعلي"),
      description: t(
        "Know exactly how many clicked, from which country or city, on which device, and at what time a clear dashboard that helps you decide based on real data.",
        "اعرف بالضبط كم شخص ضغط، من أي  دولة او مدينة، بأي جهاز، وفي أي وقت لوحة تحكم واضحة تساعدك تتخذ قرارات بناءً على بيانات حقيقية."
      ),
      visual: <HeroDashboardMockup />,
      link: "/features/url-shortening",
    },
    {
      icon: Tag,
      title: t("UTM Builder built in", "UTM Builder مدمج"),
      description: t(
        "Track your campaigns precisely build UTM parameters in a few simple steps and know which campaign actually delivers results.",
        "تابع أداء حملاتك التسويقية بدقة أنشئ UTM parameters بخطوات بسيطة واعرف أي حملة تجيب نتائج حقيقية."
      ),
      visual: <UTMPreview />,
      link: "/features/utm-tracking",
    },
    {
      icon: Globe,
      title: t("Your own custom domain", "نطاقك الخاص (Custom Domain)"),
      description: t(
        "Use your own domain in your short links like go.yourshop.sa/offer and strengthen your brand identity in every share. Setup takes two minutes.",
        "استخدم نطاقك في روابطك المختصرة مثل go.yourshop.sa/عرض وعزّز هوية علامتك في كل مشاركة. الإعداد في دقيقتين فقط."
      ),
      visual: <DomainsPreview />,
      link: "/features/custom-domains",
    },
    {
      icon: User,
      title: t("Bio page all your links in one place", "صفحة Bio كل روابطك في مكان واحد"),
      description: t(
        "Build a clean personal page that gathers all your links accounts, store, contact and share it in your bio instead of ten scattered links.",
        "أنشئ صفحة شخصية أنيقة تجمع كل روابطك حساباتك، متجرك، تواصلك وشاركها في البايو بدل عشرة روابط متفرقة."
      ),
      visual: <BioPreview />,
      link: "/features/link-in-bio",
    },
  ];

  const creamShades = ["section-cream-soft", "section-cream-warm", "section-cream-rose", "section-cream-blush", "section-cream", "section-cream-soft"];


  return (
    <section id="features">
      {features.map((feature, i) => {
        const isReversed = i % 2 === 1;
        return (
          <div key={i} className={`${creamShades[i]} py-24 md:py-32 overflow-x-clip`}>
            <div className="container mx-auto px-6">
              <div className={`grid lg:grid-cols-2 gap-16 items-center ${isReversed ? "direction-normal" : ""}`}>
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className={`min-w-0 ${isReversed ? "lg:order-2" : ""}`}
                >
                  {(feature as { badge?: string }).badge && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[hsl(var(--sky))]/15 text-[hsl(var(--sky))] text-xs font-bold font-body mb-4">
                      ✨ {(feature as { badge?: string }).badge}
                    </span>
                  )}
                  <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-5 tracking-tight leading-[1.1] text-[hsl(var(--navy))]">
                    {feature.title}
                  </h2>
                  <p className="font-body text-lg leading-relaxed mb-8 max-w-md text-[hsl(var(--navy))]/65">
                    {feature.description}
                  </p>
                  {feature.link ? (
                    <Link to={feature.link}>
                      <Button className="bg-[hsl(var(--sky))] text-white font-body font-bold rounded-full px-8 py-6 text-base hover:brightness-110 transition-all">
                        {t("Learn more", "اعرف أكثر")}
                        <ArrowRight size={16} className="ms-1.5 rtl:rotate-180" />
                      </Button>
                    </Link>
                  ) : (
                    <Button className="bg-[hsl(var(--sky))] text-white font-body font-bold rounded-full px-8 py-6 text-base hover:brightness-110 transition-all">
                      {t("Get started for free", "ابدأ مجاناً")}
                      <ArrowRight size={16} className="ms-1.5 rtl:rotate-180" />
                    </Button>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  className={`min-w-0 w-full ${isReversed ? "lg:order-1" : ""}`}
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
