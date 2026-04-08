import { useLanguage } from "@/contexts/LanguageContext";

const RealUseCasesSection = () => {
  const { t } = useLanguage();

  const useCases = [
    {
      title: t("Marketing Agencies", "الوكالات التسويقية"),
      challenge: t("Managing 15 clients with 50+ campaigns. Can't prove which campaigns actually bring sales.", "إدارة 15 عميل مع أكثر من 50 حملة. ما تقدر تثبت أي حملة فعلاً تجيب مبيعات."),
      solution: t("Each client gets their own branded domain. Each campaign gets a unique short link. Clients get monthly reports showing exactly which campaigns performed.", "كل عميل يحصل نطاق خاص. كل حملة تحصل رابط مختصر فريد. العملاء يحصلون تقارير شهرية توضح أي حملة نجحت."),
      result: t("\"We reduced our clients' wasted ad spend by 35% by pausing underperforming campaigns.\"", "\"قللنا هدر ميزانية الإعلانات لعملائنا بـ 35% بإيقاف الحملات الضعيفة.\""),
      attribution: t("Marketing Agency, Riyadh", "وكالة تسويق، الرياض"),
    },
    {
      title: t("Ecommerce Stores", "المتاجر الإلكترونية"),
      challenge: t("Working with 10 Instagram influencers. No idea who brings real sales vs just clicks.", "نشتغل مع 10 إنفلونسرز على إنستقرام. ما ندري مين يجيب مبيعات فعلية ومين بس ضغطات."),
      solution: t("Each influencer gets a unique link. When customers buy, we see exactly which influencer they came from.", "كل إنفلونسر يحصل رابط فريد. لما العملاء يشترون، نشوف بالضبط من أي إنفلونسر جوا."),
      result: t("\"We discovered 2 influencers brought 80% of sales. We stopped working with the other 8 and doubled down on the winners. ROI increased 3x.\"", "\"اكتشفنا أن 2 إنفلونسرز جابوا 80% من المبيعات. وقفنا الباقي وركزنا على الفائزين. العائد زاد 3 أضعاف.\""),
      attribution: t("Fashion Store, Jeddah", "متجر أزياء، جدة"),
    },
    {
      title: t("Restaurants", "المطاعم"),
      challenge: t("Printed 10,000 flyers with a long website URL. Hard to type, hard to track.", "طبعنا 10,000 فلاير برابط طويل. صعب يُكتب وصعب يُتتبع."),
      solution: t("One QR code on every flyer pointing to 4r.sa/menu. Track exactly how many people scan it.", "QR Code واحد على كل فلاير يوجه لـ 4r.sa/menu. تتبع بالضبط كم شخص مسحه."),
      result: t("\"We know exactly which neighborhoods respond to flyers. We only print in areas with high scan rates now. Cut printing costs by 60%.\"", "\"عرفنا بالضبط أي أحياء تستجيب للفلايرات. الحين نطبع بس في المناطق اللي فيها مسح عالي. وفرنا 60% من تكاليف الطباعة.\""),
      attribution: t("Restaurant Chain, Eastern Province", "سلسلة مطاعم، المنطقة الشرقية"),
    },
    {
      title: t("App Developers", "مطوري التطبيقات"),
      challenge: t("Building a social app where users share content. Need short links that don't look spammy.", "نبني تطبيق اجتماعي يشارك فيه المستخدمين محتوى. نحتاج روابط مختصرة ما تبان سبام."),
      solution: t("API generates short links automatically when users share. Branded domain makes links trustworthy.", "الـ API يسوي روابط مختصرة تلقائياً لما المستخدمين يشاركون. النطاق المخصص يخلي الروابط موثوقة."),
      result: t("\"Share rate increased 40% when we switched from long URLs to short branded links. Users trust them more.\"", "\"نسبة المشاركة زادت 40% لما حولنا من روابط طويلة لروابط مختصرة بعلامتنا. المستخدمين يثقون فيها أكثر.\""),
      attribution: t("Mobile App Developer, Riyadh", "مطور تطبيقات، الرياض"),
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">
            {t("How Saudi businesses", "كيف الشركات السعودية")}
            <br />
            {t("use 4r.sa", "تستخدم 4r.sa")}
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {useCases.map((uc, i) => (
            <div key={i} className="bg-background border border-border rounded-xl p-7">
              <h3 className="font-display text-lg font-semibold text-foreground mb-4">{uc.title}</h3>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wide mb-1">{t("Challenge", "التحدي")}</p>
                  <p className="text-foreground font-body text-sm leading-relaxed">{uc.challenge}</p>
                </div>
                <div>
                  <p className="text-xs font-body font-medium text-muted-foreground uppercase tracking-wide mb-1">{t("Solution", "الحل")}</p>
                  <p className="text-foreground font-body text-sm leading-relaxed">{uc.solution}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-foreground font-body text-sm leading-relaxed italic">{uc.result}</p>
                  <p className="text-muted-foreground font-body text-xs mt-2">{uc.attribution}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RealUseCasesSection;
