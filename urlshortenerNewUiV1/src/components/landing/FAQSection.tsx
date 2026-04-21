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
      q: t("Is my data really stored in Saudi Arabia?", "هل بياناتي فعلاً مخزنة في السعودية؟"),
      a: t("Yes. Our servers are physically located in Saudi data centers. Your data never leaves the Kingdom. We're PDPL compliant by design.", "نعم. سيرفراتنا موجودة فعلياً في مراكز بيانات سعودية. بياناتك ما تطلع من المملكة أبداً. نحن متوافقين مع نظام حماية البيانات الشخصية."),
    },
    {
      q: t("Can I use my own domain like go.mybrand.sa?", "أقدر أستخدم نطاقي الخاص مثل go.متجري.sa؟"),
      a: t("Absolutely. On Pro and Business plans, you can add custom domains. We provide DNS instructions and free SSL certificates.", "أكيد. في خطط Pro و Business تقدر تضيف نطاقات خاصة. نوفر تعليمات DNS وشهادات SSL مجانية."),
    },
    {
      q: t("How does pricing work?", "كيف يشتغل التسعير؟"),
      a: t("On the Free plan, you get 1,000 links per month. If you hit the limit, you can upgrade or wait until next month. We never delete your existing links.", "في الخطة المجانية تحصل 1,000 رابط شهرياً. لو وصلت الحد، تقدر تترقى أو تنتظر الشهر الجاي. ما نحذف روابطك الموجودة أبداً."),
    },
    {
      q: t("How fast are redirects?", "كم سرعة التحويلات؟"),
      a: t("From Saudi Arabia: 10 to 30ms average. From other GCC countries: 30 to 50ms. From anywhere else: less than 150ms.", "من السعودية: 10 إلى 30ms متوسط. من دول الخليج: 30 إلى 50ms. من أي مكان ثاني: أقل من 150ms."),
    },
    {
      q: t("Can I export my data if I want to leave?", "أقدر أصدّر بياناتي لو بغيت أطلع؟"),
      a: t("Yes. You own your data. Export everything (links, analytics, settings) as CSV anytime. No lock-in.", "نعم. بياناتك ملكك. صدّر كل شي (روابط، تحليلات، إعدادات) كـ CSV في أي وقت. بدون قيود."),
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
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[hsl(var(--navy))] mb-4">
              {t("Questions? Answered", "أسئلة شائعة")}
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