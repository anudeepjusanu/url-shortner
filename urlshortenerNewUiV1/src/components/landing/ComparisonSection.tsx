import { Check, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const renderCell = (value: boolean | string, highlight = false) => {
  if (value === true) return <div className={`w-7 h-7 rounded-full ${highlight ? "bg-[hsl(var(--sky))]/15" : "bg-[hsl(var(--navy))]/5"} flex items-center justify-center mx-auto`}><Check size={15} className="text-[hsl(var(--sky))]" /></div>;
  if (value === false) return <div className="w-7 h-7 rounded-full bg-[hsl(var(--navy))]/5 flex items-center justify-center mx-auto"><X size={15} className="text-[hsl(var(--navy))]/30" /></div>;
  if (value === "partial") return <span className="text-[hsl(var(--navy))]/60 text-sm">⚠️</span>;
  if (highlight) return <span className="inline-flex items-center bg-[hsl(var(--sky))]/10 text-[hsl(var(--sky))] font-body text-sm font-bold px-3 py-1 rounded-full">{value}</span>;
  return <span className="text-[hsl(var(--navy))] font-body text-sm font-semibold">{value}</span>;
};

const ComparisonSection = () => {
  const { t } = useLanguage();

  const comparisonData = [
    { feature: t("Pricing", "السعر"), fourr: t("Free", "مجاني"), bitly: t("132 SAR/mo", "132 ريال/شهر"), tinyurl: t("60 SAR/mo", "60 ريال/شهر") },
    { feature: t("Free Links/month", "روابط مجانية/شهر"), fourr: "1,000+", bitly: "500", tinyurl: "250" },
    { feature: t("QR codes/month", "QR Codes/شهر"), fourr: "100+", bitly: "10", tinyurl: false },
    { feature: t("Saudi hosting", "استضافة سعودية"), fourr: true, bitly: false, tinyurl: false },
    { feature: t("Arabic interface", "واجهة عربية"), fourr: true, bitly: false, tinyurl: false },
    { feature: t("WhatsApp support", "دعم واتساب"), fourr: true, bitly: false, tinyurl: false },
    { feature: t("Redirect speed from Saudi", "سرعة التحويل من السعودية"), fourr: "10-30ms", bitly: "200-300ms", tinyurl: "250ms+" },
    { feature: t("Hosted In KSA", "مستضاف في السعودية"), fourr: true, bitly: false, tinyurl: false },
  ];

  return (
    <section className="section-cream-rose py-28 md:py-36">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-[hsl(var(--navy))]">
            {t("How 4r.sa compares to Bitly and others", "كيف 4r.sa يتفوق على Bitly وغيرهم")}
          </h2>
        </motion.div>

        {/* Desktop table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="hidden sm:block overflow-x-auto"
        >
          <table className="w-full bg-white rounded-3xl overflow-hidden shadow-card">
            <thead>
              <tr className="border-b border-[hsl(var(--navy))]/10">
                <th className="text-start font-display font-bold text-[hsl(var(--navy))] text-sm py-5 px-6">{t("Feature", "الميزة")}</th>
                <th className="text-center py-5 px-4">
                  <span className="inline-flex items-center gap-1.5 bg-[hsl(var(--sky))] text-white font-display font-bold text-sm px-4 py-1.5 rounded-full">4r.sa</span>
                </th>
                <th className="text-center font-display font-bold text-[hsl(var(--navy))]/50 text-sm py-5 px-4">Bitly</th>
                <th className="text-center font-display font-bold text-[hsl(var(--navy))]/50 text-sm py-5 px-4">TinyURL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--navy))]/10">
              {comparisonData.map((row, i) => (
                <tr key={i} className="hover:bg-[hsl(var(--cream))]/50 transition-colors">
                  <td className="text-start text-[hsl(var(--navy))] font-body text-sm py-4 px-6">{row.feature}</td>
                  <td className="text-center py-4 px-4">{renderCell(row.fourr, true)}</td>
                  <td className="text-center py-4 px-4">{renderCell(row.bitly)}</td>
                  <td className="text-center py-4 px-4">{renderCell(row.tinyurl)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Mobile cards */}
        <div className="sm:hidden space-y-3">
          {comparisonData.map((row, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="bg-white rounded-2xl p-4 shadow-soft border border-[hsl(var(--navy))]/5"
            >
              <p className="font-body text-sm font-bold text-[hsl(var(--navy))] mb-3">{row.feature}</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <span className="text-[10px] font-display font-bold text-white bg-[hsl(var(--sky))] px-2 py-0.5 rounded-full">4r.sa</span>
                  <div className="mt-2">{renderCell(row.fourr)}</div>
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-display font-bold text-[hsl(var(--navy))]/50">Bitly</span>
                  <div className="mt-2">{renderCell(row.bitly)}</div>
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-display font-bold text-[hsl(var(--navy))]/50">TinyURL</span>
                  <div className="mt-2">{renderCell(row.tinyurl)}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
