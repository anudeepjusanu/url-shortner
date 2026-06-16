import { useLanguage } from "@/contexts/LanguageContext";
import { User, Link, QrCode } from "lucide-react";

const FeaturesGrid = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: User,
      title: t("Bio Pages", "صفحات البايو"),
      titleBadge: t("NEW", "جديد"),
      description: t(
        "Create beautiful link-in-bio pages with Arabic support, custom themes, and WhatsApp integration.",
        "أنشئ صفحات بايو جميلة مع دعم العربية، ثيمات مخصصة، وتكامل مع الواتساب."
      ),
    },
    {
      icon: Link,
      title: t("Short Links", "الروابط المختصرة"),
      description: t(
        "Shorten, brand, and track your links with powerful analytics and custom domains.",
        "اختصر روابطك وتتبعها بتحليلات قوية ونطاقات مخصصة."
      ),
    },
    {
      icon: QrCode,
      title: t("QR Codes", "أكواد QR"),
      description: t(
        "Generate dynamic QR codes for your business with scan analytics and custom designs.",
        "أنشئ أكواد QR ديناميكية لعملك مع تحليلات المسح وتصاميم مخصصة."
      ),
    },
  ];

  return (
    <section className="section-cream-warm py-20 md:py-28">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-xl mx-auto mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            {t("Everything you need in one platform", "كل ما تحتاجه في منصة واحدة")}
          </h2>
          <p className="text-muted-foreground font-body">
            {t(
              "Bio pages, short links, and QR codes built specifically for the Saudi market.",
              "صفحات بايو، روابط مختصرة، وأكواد QR مصممة خصيصاً للسوق السعودي."
            )}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group relative p-8 rounded-2xl bg-card border border-border hover:shadow-card hover:border-primary/20 transition-all duration-300"
            >
              {feature.titleBadge && (
                <span className="absolute top-4 end-4 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                  {feature.titleBadge}
                </span>
              )}
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
