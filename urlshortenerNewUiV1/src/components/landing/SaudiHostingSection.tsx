import { Zap, Shield, Building2, HeadphonesIcon, DollarSign, Lock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const SaudiHostingSection = () => {
  const { t } = useLanguage();

  const benefits = [
    {
      icon: Zap,
      title: t("Lightning fast redirects", "تحويلات سريعة جداً"),
      description: t("10 to 30ms redirect time from Saudi Arabia. US hosted services? 200 to 300ms delay.", "10-30ms وقت التحويل من السعودية. الخدمات الأمريكية؟ 200-300ms تأخير."),
    },
    {
      icon: Shield,
      title: t("PDPL compliant out of the box", "متوافق مع نظام حماية البيانات"),
      description: t("Your data never leaves Saudi Arabia. No cross border data transfer headaches.", "بياناتك ما تطلع من السعودية. بدون مشاكل نقل بيانات عبر الحدود."),
    },
    {
      icon: Building2,
      title: t("Enterprise & government ready", "جاهز للشركات والجهات الحكومية"),
      description: t("Meet local data residency requirements. No approval issues for sensitive projects.", "يلبي متطلبات إقامة البيانات المحلية. بدون مشاكل موافقات."),
    },
    {
      icon: HeadphonesIcon,
      title: t("Local support team", "فريق دعم محلي"),
      description: t("WhatsApp support in Arabic and English. We understand Saudi business hours and holidays.", "دعم واتساب بالعربي والإنجليزي. نفهم أوقات العمل والإجازات السعودية."),
    },
    {
      icon: DollarSign,
      title: t("Lower latency = higher conversions", "سرعة أعلى = تحويلات أكثر"),
      description: t("Every 100ms of delay costs you 1% in conversions. We're 5 to 10x faster than international competitors.", "كل 100ms تأخير تكلفك 1% من التحويلات. نحن أسرع 5 إلى 10 مرات من المنافسين الدوليين."),
    },
    {
      icon: Lock,
      title: t("Your customers' privacy protected", "خصوصية عملائك محمية"),
      description: t("Saudi privacy laws are among the strictest. We comply with all local regulations.", "قوانين الخصوصية السعودية من الأقوى. نحن نلتزم بكل الأنظمة المحلية."),
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            {t("Why hosting in Saudi Arabia", "ليش الاستضافة في السعودية")}
            <br />
            {t("matters for your business", "مهمة لعملك")}
          </h2>
          <p className="text-muted-foreground font-body text-lg leading-relaxed">
            {t(
              "We're not just another link shortener. We're built specifically for the Saudi market with servers located right here in the Kingdom.",
              "مو مجرد خدمة اختصار روابط. بنينا الخدمة خصيصًا للسوق السعودي بسيرفرات موجودة هنا في المملكة."
            )}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 hover:bg-muted/40 transition-colors">
              <b.icon size={20} className="text-primary mb-4" strokeWidth={1.5} />
              <h3 className="font-display text-base font-semibold text-foreground mb-2">{b.title}</h3>
              <p className="text-muted-foreground font-body text-sm leading-relaxed">{b.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SaudiHostingSection;
