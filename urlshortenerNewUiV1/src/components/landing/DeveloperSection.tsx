import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Copy, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const codeExample = `// Shorten a URL with one API call
const response = await axios.post('https://snip.sa/api/urls', {
  originalUrl: 'https://example.com/very-long-url',
  customCode: 'mylink',
  title: 'My Custom Link',
  tags: ['marketing', 'campaign']
}, {
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your_api_key_here'
  }
});`;

const DeveloperSection = () => {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

  const handleCopy = () => {
    navigator.clipboard.writeText(codeExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="developers" className="section-cream-soft py-28 md:py-36">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Code block */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-black rounded-3xl overflow-hidden order-2 lg:order-1"
            dir="ltr"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--sky))]/60" />
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--sky))]/40" />
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--sky))]/20" />
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors text-xs font-body"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="p-6 text-xs font-mono text-white/75 leading-relaxed whitespace-pre-wrap break-all">
              {codeExample}
            </pre>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="order-1 lg:order-2"
          >
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight leading-[1.1] text-[hsl(var(--navy))]">
              {t("Build faster with our API", "ابنِ مشاريعك بشكل أسرع باستخدام API")}
            </h2>
            <p className="font-body text-lg mb-8 leading-relaxed text-[hsl(var(--navy))]/65">
              {t(
                "Whether you're developing an ecommerce platform, mobile app, or marketing tool, our API lets you create and manage short links, QR codes, and analytics programmatically.",
                "سواء كنت تطوّر منصة تجارة إلكترونية، تطبيقًا للهواتف، أو أداة تسويق، تتيح لك واجهة البرمجة لدينا إنشاء وإدارة الروابط المختصرة، رموز QR، وتحليلات الأداء بشكل برمجي."
              )}
            </p>

            <div className="flex flex-wrap gap-3">
              <Button className="bg-[hsl(var(--sky))] text-white font-body font-bold rounded-full hover:brightness-110 transition-all text-base px-8 py-6">
                {t("Read API Documentation", "شوف الـ API Docs")}
                <ArrowRight size={14} className="ms-1.5" />
              </Button>
              <Button variant="outline" className="font-body font-medium rounded-full border-2 border-[hsl(var(--navy))]/20 text-[hsl(var(--navy))] hover:bg-[hsl(var(--navy))]/5 bg-transparent py-6 px-8">
                {t("Get Your API Key", "احصل على مفتاح API")}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DeveloperSection;
