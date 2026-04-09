import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const UseCasesSection = () => {
  const [active, setActive] = useState(0);
  const { t } = useLanguage();

  const audiences = [
    {
      id: "agencies",
      title: t(
        "For marketing agencies, marketing managers, and ecommerce shop owners in Saudi Arabia",
        "لأصحاب الوكالات التسويقية، مديري التسويق، وأصحاب المتاجر الإلكترونية في السعودية"
      ),
      subtitle: t("Your campaigns deserve better tracking", "حملاتك تستاهل تتبع أفضل"),
      description: t(
        "Create branded short links for every client. Track which influencer, ad, or email brought real sales, not just clicks. Generate QR codes for print campaigns and prove ROI with professional reports your clients will actually understand.",
        "سوي روابط مختصرة لكل عميل. تتبع أي إنفلونسر، إعلان، أو إيميل جاب مبيعات فعلية، مو بس ضغطات. سوي QR Codes للحملات المطبوعة وأثبت النتائج لعملائك بتقارير احترافية."
      ),
      benefits: [
        t("Ramadan & seasonal campaigns: track your biggest sales season with dedicated links", "حملات رمضان والمواسم: تتبع أكبر موسم مبيعات بروابط مخصصة"),
        t("Influencer tracking: give each influencer a unique link, finally know who brings real customers", "تتبع الإنفلونسرز: كل إنفلونسر له رابط خاص، أخيراً تعرف مين يجيب عملاء فعليين"),
        t("WhatsApp & Instagram links: perfect for bio links and broadcasts, track which Stories convert", "روابط الواتساب والإنستقرام: مثالية للبايو والبرودكاست، تتبع أي ستوري يحول"),
        t("QR codes for restaurants & cafes: print QR codes for menus, see which branch gets most scans", "QR Codes للمطاعم والمقاهي: اطبع QR لقوائم الطعام، شوف أي فرع يحصل أكثر مسح"),
        t("Client ready reports: export CSV reports to show campaign performance clearly", "تقارير للعملاء بصيغة CSV: صدّر التقارير وأرسلها لعملائك"),
      ],
      cta: t("Start Free as a Marketer", "ابدأ مجاناً كمسوق"),
      image: "/images/marketing-team.png?v=2",
      imageAlt: t("Marketing team tracking campaign performance", "فريق تسويق يتتبع أداء الحملات"),
    },
    {
      id: "developers",
      title: t(
        "For developers and product builders in Saudi Arabia",
        "للمطورين وبناة المنتجات التقنية في السعودية"
      ),
      subtitle: t("Simple and fast API for your projects", "API بسيط وسريع لمشاريعك"),
      description: t(
        "Need to auto generate short links from your app? Pull click data into your custom dashboard? Trigger a webhook when someone scans a QR code? Our API makes everything simple.",
        "تبي تسوي روابط مختصرة تلقائياً من تطبيقك؟ تسحب بيانات الضغطات لداشبورد خاص؟ أو webhook لما أحد يمسح QR Code؟ الـ API حقنا يخلي كل شي سهل."
      ),
      benefits: [
        t("Simple REST API: no complicated OAuth flows, just use your API key", "REST API بسيط: بدون إعدادات معقدة، بس استخدم مفتاح الـ API"),
        t("SDKs for Node.js, Python, PHP with ready to use examples that actually work", "SDK بـ Node.js, Python, PHP: أمثلة جاهزة تشتغل على طول"),
        t("Webhooks for notifications: get notified on every click or QR scan", "Webhooks للإشعارات: توصلك إشعارات مع كل ضغطة أو مسح"),
        t("Bulk operations: create 1,000+ links in one request", "عمليات جماعية: سوي أكثر من 1,000 رابط في طلب واحد"),
        t("Documentation in English & Arabic with clear examples for every endpoint", "توثيق بالعربي والإنجليزي: أمثلة واضحة لكل endpoint"),
      ],
      cta: t("View API Docs", "شوف الـ API Docs"),
      image: "/images/developer-illustration.png?v=2",
      imageAlt: t("Developer integrating 4r.sa API with code and webhooks", "مطور يدمج API 4r.sa"),
    },
  ];

  const current = audiences[active] || audiences[0];

  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="max-w-lg mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
            {t("Built specifically for you", "مصمم خصيصًا لك")}
          </h2>
          <p className="text-muted-foreground font-body">
            {t("We built 4r for two audiences, and we're great at both.", "بنينا 4r لجمهورين، ونحن ممتازين في الاثنين.")}
          </p>
        </div>

        <div className="flex gap-2 mb-10">
          {audiences.map((a, i) => (
            <button
              key={a.id}
              onClick={() => setActive(i)}
              className={`px-5 py-2.5 rounded-lg font-body text-sm transition-colors ${
                active === i
                  ? "bg-primary text-primary-foreground font-medium"
                  : "bg-background border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {a.id === "agencies" ? t("Marketers & Agencies", "المسوقين والوكالات") : t("Developers", "المطورين")}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-primary font-body text-sm font-medium mb-2">{current.subtitle}</p>
            <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
              {current.title}
            </h3>
            <p className="text-muted-foreground font-body text-base leading-relaxed mb-6">
              {current.description}
            </p>
            <div className="space-y-3 mb-8">
              {current.benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>
                  <span className="text-foreground font-body text-sm">{b}</span>
                </div>
              ))}
            </div>
            <Button className="bg-primary text-primary-foreground font-body font-medium">
              {current.cta}
              <ArrowRight size={14} className="ms-1.5" />
            </Button>
          </div>

          <div>
            <img
              src={current.image}
              alt={current.imageAlt}
              className="w-full h-auto rounded-xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
