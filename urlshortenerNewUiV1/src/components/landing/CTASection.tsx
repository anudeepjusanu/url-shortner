import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Link2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const CTASection = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [url, setUrl] = useState("");

  return (
    <section className="section-cream-rose py-28 md:py-36">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-[hsl(var(--navy))] rounded-3xl p-12 md:p-16 text-center max-w-4xl mx-auto"
        >
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight leading-[1.1]">
            <span className="text-white">{t("Jumpstart", "ابدأ")}</span>{" "}
            <span className="text-white/80">{t("your marketing today", "رحلة تسويقك اليوم")}</span>
          </h2>
          <p className="font-body text-lg mb-10 text-white/60 max-w-lg mx-auto">
            {t(
              "Join 50,000+ marketers and developers who stopped guessing and started knowing. Free to start, no credit card required.",
              "سواء تدير وكالة تسويقية مع 20 عميل، أو تبني تطبيق، ابدأ مجاناً وترقى لما تحتاج."
            )}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto">
            <div className="flex-1 w-full flex items-center gap-2 px-5 bg-white rounded-full">
              <Link2 size={16} className="opacity-30 shrink-0 text-[hsl(var(--navy))]" />
              <input
                type="url"
                placeholder="4r.sa/"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-transparent text-[hsl(var(--navy))] placeholder:text-[hsl(var(--navy))]/40 outline-none py-3.5 font-body text-sm"
              />
            </div>
            <Button
              size="lg"
              onClick={() => navigate("/signup")}
              className="bg-[hsl(var(--sky))] text-white font-body font-bold text-base px-8 rounded-full hover:brightness-110 transition-all shrink-0"
            >
              {t("Start Free Now", "ابدأ مجاناً")}
              <ArrowRight size={16} className="ms-1.5" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;