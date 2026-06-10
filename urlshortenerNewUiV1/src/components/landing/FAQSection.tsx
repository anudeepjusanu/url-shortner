import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const FAQSection = () => {
  const { t } = useLanguage();

  const faqs = [
    {
      q: t("Is my data stored inside Saudi Arabia?", "هل بياناتي محفوظة داخل السعودية؟"),
      a: t(
        "Yes. Our servers are inside the Kingdom of Saudi Arabia, and we comply with the Personal Data Protection Law (PDPL). Your data never leaves the Kingdom and is never shared with any external party.",
        "نعم. سيرفراتنا داخل المملكة العربية السعودية، وممتثلون لنظام حماية البيانات الشخصية (PDPL). بياناتك ما تخرج من المملكة، ولا تُشارك مع أي جهة خارجية."
      ),
    },
    {
      q: t("Can I use my own domain like go.mystore.sa?", "هل أقدر أستخدم نطاقي الخاص مثل go.متجري.sa؟"),
      a: t(
        "Absolutely. You can connect your own domain including .sa domains and use it in your short links. Free SSL certificate, setup takes two minutes with step-by-step instructions.",
        "بكل تأكيد. تقدر تربط نطاقك الخاص حتى نطاقات .sa وتستخدمه في روابطك المختصرة. شهادة SSL مجانية، والإعداد في دقيقتين مع تعليمات خطوة بخطوة."
      ),
    },
    {
      q: t("Is snip.sa really free?", "هل snip.sa مجاني فعلاً؟"),
      a: t(
        "Yes. Right now the entire platform is completely free. All services are available with no fees and no credit card.",
        "نعم، في المرحلة الحالية المنصة مجانية بالكامل. جميع الخدمات متاحة بدون رسوم ولا بطاقة بنكية."
      ),
    },
    {
      q: t("What information shows up in analytics?", "ايش المعلومات اللي تظهر في التحليلات؟"),
      a: t(
        "You see total clicks, unique visitors, country, city, device used, source, and timing of every click all in one clear dashboard.",
        "تشوف عدد الضغطات، الزوار الفريدين، الدولة، المدينة، الجهاز المستخدم، المصدر، وتوقيت كل ضغطة كل هذا في لوحة تحكم واضحة."
      ),
    },
    {
      q: t("Can I export my data?", "هل أقدر أصدّر بياناتي؟"),
      a: t(
        "Yes. Your data belongs to you. You can export all your links and analytics as a CSV file at any time no limits, no fees.",
        "نعم. بياناتك ملكك. تقدر تصدّر كل الروابط والتحليلات كملف CSV في أي وقت بدون قيود ولا رسوم."
      ),
    },
  ];


  return (
    <section id="faq" className="section-cream-warm py-28 md:py-36">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-2 lg:sticky lg:top-32 lg:self-start"
          >
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[hsl(var(--navy))] mb-4">
              {t("Questions before you start? Here are the answers", "أسئلة قبل ما تبدأ؟ هنا إجاباتها")}
            </h2>
            <p className="font-body text-base text-[hsl(var(--navy))]/60 leading-relaxed">
              {t(
                "Everything you need to know about snip.sa. Can't find an answer? Chat with us on WhatsApp.",
                "كل اللي تحتاج تعرفه عن snip.sa. ما لقيت جوابك؟ كلمنا على واتساب."
              )}
            </p>

          </motion.div>

          <div className="lg:col-span-3">
            <Accordion type="single" collapsible className="w-full space-y-3">
              {faqs.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                >
                  <AccordionItem value={`faq-${i}`} className="bg-white rounded-2xl border border-[hsl(var(--navy))]/10 px-6 shadow-soft">
                    <AccordionTrigger className="font-body text-sm font-bold text-start hover:no-underline py-5 text-[hsl(var(--navy))]">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="font-body text-sm leading-relaxed pb-5 text-[hsl(var(--navy))]/65">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;