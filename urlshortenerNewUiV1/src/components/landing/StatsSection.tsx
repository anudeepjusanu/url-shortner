import { useLanguage } from "@/contexts/LanguageContext";

const StatsSection = () => {
  const { t } = useLanguage();

  const stats = [
    { value: t("10M+", "10 مليون+"), label: t("Links shortened", "رابط مختصر"), note: t("From agencies, shops, and developers", "من وكالات ومتاجر ومطورين") },
    { value: t("50K+", "50 ألف+"), label: t("Active users", "مستخدم نشط"), note: t("In Riyadh, Jeddah, Dammam, and beyond", "في الرياض وجدة والدمام وأكثر") },
    { value: "99.9%", label: t("Uptime", "وقت التشغيل"), note: t("Reliable service you can count on", "خدمة موثوقة تقدر تعتمد عليها") },
    { value: t("<150ms", "<150 ميلي ثانية"), label: t("Redirect time", "متوسط سرعة التحويل"), note: t("Fastest in the region", "الأسرع في المنطقة") },
  ];

  const testimonials = [
    {
      name: t("Mohammed Al Otaibi", "محمد العتيبي"),
      role: t("Marketing Manager, Riyadh", "مدير تسويق، الرياض"),
      quote: t(
        "We used 4r for our Ramadan campaign and knew exactly which ad brought sales. We saved 40% of our ad budget.",
        "استخدمنا 4r لحملة رمضان وعرفنا بالضبط أي إعلان جاب مبيعات. وفرنا 40% من ميزانية الإعلانات."
      ),
    },
    {
      name: t("Noura Al Salem", "نورة السالم"),
      role: t("App Developer, Jeddah", "مطورة تطبيقات، جدة"),
      quote: t(
        "The API is super easy. I built the integration in less than an hour. The documentation is clear and the examples actually work.",
        "الـ API سهل جداً. سويت integration في أقل من ساعة والـ docs واضحة بالعربي."
      ),
    },
    {
      name: t("Abdullah Al Ghamdi", "عبدالله الغامدي"),
      role: t("Ecommerce Store Owner, Dammam", "صاحب متجر إلكتروني، الدمام"),
      quote: t(
        "Every influencer we work with has their own short link. Now we know who brings real customers and who just has followers.",
        "كل إنفلونسر عندنا له رابط مختصر. الحين نعرف مين يجيب عملاء فعليين ومين لا."
      ),
    },
    {
      name: t("Sara Al Qahtani", "سارة القحطاني"),
      role: t("Restaurant Owner, Riyadh", "صاحبة مطعم، الرياض"),
      quote: t(
        "QR codes on our menu increased online orders by 60%. We can see which items people scan the most.",
        "QR Codes على قائمة الطعام زادت الطلبات الأونلاين 60%. نشوف أي أصناف الناس تمسحها أكثر."
      ),
    },
  ];

  return (
    <section className="py-16 bg-foreground">
      <div className="container mx-auto px-6">
        <p className="text-center text-background/50 font-body text-sm mb-8">
          {t("Trusted by marketers and developers across Saudi Arabia", "يثق فينا مسوقين ومطورين من كل السعودية")}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <p className="font-display text-3xl md:text-4xl font-bold text-background">{stat.value}</p>
              <p className="text-background/60 font-body text-sm mt-1">{stat.label}</p>
              <p className="text-background/40 font-body text-xs mt-0.5">{stat.note}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, i) => (
            <div key={i} className="bg-background/5 border border-background/10 rounded-xl p-6">
              <p className="text-background/80 font-body text-sm leading-relaxed mb-4">
                "{testimonial.quote}"
              </p>
              <div>
                <p className="text-background font-display font-semibold text-sm">{testimonial.name}</p>
                <p className="text-background/50 font-body text-xs">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
