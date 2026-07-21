import { useLanguage } from "@/contexts/LanguageContext";
import { useBrand } from "@/contexts/BrandContext";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useSmartLink } from "@/hooks/useSmartLink";

const BioPricing = () => {
  const { t } = useLanguage();
  const brand = useBrand();
  const { smartLink } = useSmartLink();

  const plans = [
    {
      name: t("Free", "مجاني"),
      price: t("Free Forever", "مجاني للأبد"),
      priceAmount: "0",
      features: [
        t("1 bio page", "صفحة بايو واحدة"),
        t("5 links", "5 روابط"),
        t("Basic themes", "ثيمات أساسية"),
        t(`${brand.name} branding`, `شعار ${brand.name}`),
        t("Basic analytics", "تحليلات أساسية"),
      ],
      cta: t("Start Free", "ابدأ مجاناً"),
      popular: false,
    },
    {
      name: t("Pro", "احترافي"),
      price: t("79 SAR/month", "٧٩ ريال/شهر"),
      priceAmount: "79",
      badge: t("Most Popular", "الأكثر شعبية"),
      features: [
        t("Unlimited bio pages", "صفحات بايو غير محدودة"),
        t("Unlimited links", "روابط غير محدودة"),
        t("All themes + custom", "جميع الثيمات + مخصص"),
        t(`No ${brand.name} branding`, `بدون شعار ${brand.name}`),
        t("Custom domain", "نطاق مخصص"),
        t("Advanced analytics", "تحليلات متقدمة"),
        t("WhatsApp integration", "تكامل واتساب"),
        t("QR codes", "أكواد QR"),
      ],
      cta: t("Start Free", "ابدأ مجاناً"),
      popular: true,
    },
    {
      name: t("Business", "أعمال"),
      price: t("199 SAR/month", "١٩٩ ريال/شهر"),
      priceAmount: "199",
      features: [
        t("Everything in Pro", "كل ما في الاحترافي"),
        t("Team access (5 members)", "فريق عمل (5 أعضاء)"),
        t("Priority support", "دعم أولوي"),
        t("API access", "وصول API"),
        t("Retargeting pixels", "بكسلات إعادة الاستهداف"),
        t("A/B testing", "اختبار A/B"),
      ],
      cta: t("Start Free", "ابدأ مجاناً"),
      popular: false,
    },
  ];

  return (
    <section className="section-cream-warm py-20 md:py-28">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-xl mx-auto mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            {t("Simple, transparent pricing", "أسعار بسيطة وشفافة")}
          </h2>
          <p className="text-muted-foreground font-body">
            {t(
              "Start free, upgrade when you need more",
              "ابدأ مجاناً، وترقى عند الحاجة",
            )}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative rounded-2xl p-6 border transition-all hover:-translate-y-1 ${
                plan.popular
                  ? "border-primary bg-card shadow-card"
                  : "border-border bg-card hover:shadow-soft"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 start-1/2 -translate-x-1/2 rtl:translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    <Star className="w-3 h-3" />
                    {plan.badge}
                  </span>
                </div>
              )}

              <h3 className="font-display text-lg font-bold text-foreground mb-1">
                {plan.name}
              </h3>
              <p className="text-2xl font-bold text-foreground mb-6">
                {plan.price}
              </p>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, fi) => (
                  <li
                    key={fi}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={`w-full ${plan.popular ? "bg-primary text-primary-foreground" : ""}`}
                variant={plan.popular ? "default" : "outline"}
              >
                <Link to={smartLink("/signup")}>
                  {plan.cta}
                  <ArrowRight className="w-4 h-4 ms-1.5 rtl:rotate-180" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BioPricing;
