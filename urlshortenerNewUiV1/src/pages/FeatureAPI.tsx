import { useState } from "react";
import { useBrandMetaTags } from "@/hooks/useBrandMetaTags";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import CTASection from "@/components/landing/CTASection";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useSmartLink } from "@/hooks/useSmartLink";
import { toast } from "sonner";
import {
  Code2,
  Terminal,
  Zap,
  Lock,
  Webhook,
  Cpu,
  ArrowRight,
  Copy,
  Check,
  KeyRound,
  BookOpen,
  Shield,
  Gauge,
  Globe,
} from "lucide-react";

const SNIPPETS: Record<string, string> = {
  curl: `curl -X POST https://api.snip.sa/urls \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your_api_key_here" \\
  -d '{
    "originalUrl": "https://example.com/very-long-url",
    "customCode": "ramadan",
    "title": "Ramadan campaign",
    "tags": ["marketing", "campaign"]
  }'`,
  node: `import axios from "axios";

const { data } = await axios.post(
  "https://api.snip.sa/urls",
  {
    originalUrl: "https://example.com/very-long-url",
    customCode: "ramadan",
    title: "Ramadan campaign",
    tags: ["marketing", "campaign"],
  },
  { headers: { "X-API-Key": process.env.SNIP_API_KEY } }
);

// { success, message, data: { url: { shortCode, ... }, domain: { shortUrl } } }
const { url, domain } = data.data;
console.log(\`\${domain.shortUrl}/\${url.shortCode}\`);`,
  python: `import os, requests

r = requests.post(
    "https://api.snip.sa/urls",
    headers={"X-API-Key": os.environ["SNIP_API_KEY"]},
    json={
        "originalUrl": "https://example.com/very-long-url",
        "customCode": "ramadan",
        "title": "Ramadan campaign",
        "tags": ["marketing", "campaign"],
    },
)
body = r.json()
# { "success": true, "message": "...", "data": { "url": {...}, "domain": {...} } }
url = body["data"]["url"]
domain = body["data"]["domain"]
print(f"{domain['shortUrl']}/{url['shortCode']}")`,
  php: `<?php
$ch = curl_init("https://api.snip.sa/urls");
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    "X-API-Key: " . getenv("SNIP_API_KEY"),
    "Content-Type: application/json",
  ],
  CURLOPT_POSTFIELDS => json_encode([
    "originalUrl" => "https://example.com/very-long-url",
    "customCode"  => "ramadan",
    "title"       => "Ramadan campaign",
  ]),
]);
$res = json_decode(curl_exec($ch), true);
echo $res["data"]["domain"]["shortUrl"] . "/" . $res["data"]["url"]["shortCode"];`,
};

const FeatureAPI = () => {
  useBrandMetaTags();
  const { t } = useLanguage();
  const { smartLink } = useSmartLink();
  const [tab, setTab] = useState<keyof typeof SNIPPETS>("node");
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(SNIPPETS[tab]);
    setCopied(true);
    toast.success(t("Copied to clipboard!", "تم النسخ!"));
    setTimeout(() => setCopied(false), 1500);
  };

  const stats = [
    { value: "<80ms", label: t("p95 response time", "زمن الاستجابة p95") },
    { value: "99.99%", label: t("API uptime", "وقت تشغيل الـ API") },
    { value: "5000/min", label: t("Rate limit", "حد الطلبات") },
    { value: "REST + Webhooks", label: t("Standards", "المعايير") },
  ];

  const benefits = [
    {
      icon: Zap,
      title: t("URL shortening", "اختصار الروابط"),
      desc: t(
        "Create shortened URLs with custom codes, expiration dates, and password protection.",
        "أنشئ روابط مختصرة مع رموز مخصصة وتواريخ انتهاء وحماية بكلمة مرور.",
      ),
    },
    {
      icon: Lock,
      title: t("Security features", "ميزات الأمان"),
      desc: t(
        "Password protection, geo restrictions, and device filtering on every link.",
        "حماية بكلمة مرور، قيود جغرافية، وتصفية حسب الجهاز لكل رابط.",
      ),
    },
    {
      icon: Gauge,
      title: t("Advanced analytics", "تحليلات متقدمة"),
      desc: t(
        "Track clicks, geographic data, devices, referrers, and campaign performance.",
        "تابع الضغطات والبيانات الجغرافية والأجهزة والمصادر وأداء الحملات.",
      ),
    },
    {
      icon: Code2,
      title: t("QR code generation", "توليد رموز QR"),
      desc: t(
        "Generate customizable QR codes for any shortened URL through a single endpoint.",
        "أنشئ رموز QR قابلة للتخصيص لأي رابط مختصر من خلال نقطة واحدة.",
      ),
    },
    {
      icon: Webhook,
      title: t("Custom domains & UTM", "نطاقات مخصصة و UTM"),
      desc: t(
        "Use your own branded domains and append UTM parameters for campaign tracking.",
        "استخدم نطاقاتك الخاصة وأضف معاملات UTM لتتبع الحملات.",
      ),
    },
    {
      icon: Globe,
      title: t("Hosted in Saudi Arabia", "مستضاف في السعودية"),
      desc: t(
        "Low latency for Gulf traffic and full PDPL compliance for your customers' data.",
        "زمن استجابة منخفض في الخليج والتزام كامل بنظام حماية البيانات.",
      ),
    },
  ];

  const endpoints = [
    {
      method: "POST",
      path: "/api/urls",
      desc: t("Create a shortened URL", "إنشاء رابط مختصر"),
    },
    {
      method: "GET",
      path: "/api/urls",
      desc: t("List all your URLs", "عرض جميع روابطك"),
    },
    {
      method: "GET",
      path: "/api/urls/:id",
      desc: t("Retrieve a URL", "استرجاع رابط"),
    },
    {
      method: "PATCH",
      path: "/api/urls/:id",
      desc: t(
        "Update destination, code, settings",
        "تحديث الوجهة أو الرمز أو الإعدادات",
      ),
    },
    {
      method: "DELETE",
      path: "/api/urls/:id",
      desc: t("Delete a URL", "حذف رابط"),
    },
    {
      method: "GET",
      path: "/api/analytics/:id",
      desc: t(
        "Click analytics & geo data",
        "تحليلات الضغطات والبيانات الجغرافية",
      ),
    },
    {
      method: "POST",
      path: "/api/qr-codes",
      desc: t("Generate a QR code", "إنشاء رمز QR"),
    },
    {
      method: "GET",
      path: "/api/domains",
      desc: t("List custom domains", "عرض النطاقات المخصصة"),
    },
  ];

  const tabs: { id: keyof typeof SNIPPETS; label: string }[] = [
    { id: "curl", label: "cURL" },
    { id: "node", label: "Node.js" },
    { id: "python", label: "Python" },
    { id: "php", label: "PHP" },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="section-cream pt-32 pb-20 md:pt-40 md:pb-28 relative overflow-hidden">
        <div className="absolute top-20 -start-32 w-96 h-96 bg-[hsl(var(--sky))]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -end-32 w-80 h-80 bg-[hsl(var(--navy))]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[hsl(var(--sky))]/10 text-[hsl(var(--sky))] text-xs font-bold font-body mb-6">
                <Code2 className="w-3.5 h-3.5" />
                {t("Developer API", "واجهة المطورين")}
              </span>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight leading-[1.1] text-[hsl(var(--navy))]">
                {t("Ship short links", "أطلق روابطك")}{" "}
                <br className="hidden md:block" />
                <span className="text-[hsl(var(--sky))]">
                  {t("in 3 lines of code.", "بثلاثة أسطر فقط.")}
                </span>
              </h1>
              <p className="font-body text-lg leading-relaxed mb-8 max-w-md text-[hsl(var(--navy))]/60">
                {t(
                  "A simple REST API to create, manage, and track shortened URLs with custom domains, QR codes, analytics, and more.",
                  "واجهة REST بسيطة لإنشاء وإدارة وتتبع الروابط المختصرة مع نطاقات مخصصة، رموز QR، تحليلات، والمزيد.",
                )}
              </p>

              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  className="bg-[hsl(var(--sky))] text-white font-body font-bold rounded-full hover:brightness-110 text-base px-7 py-6"
                >
                  <Link to={smartLink("/signup", "/dashboard/api")}>
                    <KeyRound className="w-4 h-4 me-1.5" />
                    {t("Get your API key", "احصل على مفتاحك")}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="font-body font-medium rounded-full border-2 border-[hsl(var(--navy))]/15 text-[hsl(var(--navy))] hover:bg-[hsl(var(--navy))]/5 bg-transparent py-6 px-7"
                >
                  <a href="#endpoints">
                    <BookOpen className="w-4 h-4 me-1.5" />
                    {t("Read the docs", "اقرأ الوثائق")}
                  </a>
                </Button>
              </div>
            </motion.div>

            {/* Code panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--sky))]/15 to-[hsl(var(--navy))]/10 rounded-3xl blur-2xl scale-105 pointer-events-none" />
              <div
                dir="ltr"
                className="relative bg-[hsl(var(--navy))] rounded-3xl overflow-hidden shadow-2xl"
              >
                <div className="flex items-center justify-between px-4 pt-3 border-b border-white/10">
                  <div className="flex items-center gap-1.5">
                    {tabs.map((tb) => (
                      <button
                        key={tb.id}
                        onClick={() => setTab(tb.id)}
                        className={`text-[11px] font-mono px-3 py-2 rounded-t-lg transition-colors ${
                          tab === tb.id
                            ? "bg-black/40 text-white"
                            : "text-white/40 hover:text-white/70"
                        }`}
                      >
                        {tb.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={copy}
                    className="flex items-center gap-1.5 text-white/40 hover:text-white/80 transition-colors text-xs font-body"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? t("Copied", "تم النسخ") : t("Copy", "نسخ")}
                  </button>
                </div>
                <pre className="p-5 text-xs font-mono text-white/85 leading-relaxed whitespace-pre-wrap break-words">
                  {SNIPPETS[tab]}
                </pre>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section-cream-warm py-14">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-2xl p-5 border border-[hsl(var(--navy))]/6 text-center"
              >
                <p className="font-display text-xl md:text-2xl font-bold text-[hsl(var(--sky))] mb-1">
                  {stat.value}
                </p>
                <p className="font-body text-xs text-[hsl(var(--navy))]/45">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section-cream-soft py-20 md:py-28 relative overflow-hidden">
        <div className="absolute top-1/2 start-0 w-72 h-72 bg-[hsl(var(--sky))]/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
        <div className="container mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[hsl(var(--navy))]/5 text-[hsl(var(--navy))]/60 text-xs font-bold font-body mb-4">
              {t("WHY OUR API", "ليش الـ API")}
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[hsl(var(--navy))] mb-4">
              {t("Made for production", "جاهز للإنتاج")}
            </h2>
            <p className="font-body text-lg text-[hsl(var(--navy))]/50 max-w-lg mx-auto">
              {t(
                "Everything you need to integrate short links into your stack, with none of the surprises.",
                "كل ما تحتاجه لدمج الروابط القصيرة في مشروعك، بدون مفاجآت.",
              )}
            </p>
          </motion.div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="bg-white rounded-2xl p-6 border border-[hsl(var(--navy))]/6 hover:shadow-card transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--sky))]/10 flex items-center justify-center mb-4">
                  <b.icon className="w-5 h-5 text-[hsl(var(--sky))]" />
                </div>
                <h3 className="font-display font-bold text-base text-[hsl(var(--navy))] mb-2">
                  {b.title}
                </h3>
                <p className="font-body text-sm text-[hsl(var(--navy))]/55 leading-relaxed">
                  {b.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section id="endpoints" className="section-cream py-20 md:py-28">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[hsl(var(--navy))]/5 text-[hsl(var(--navy))]/60 text-xs font-bold font-body mb-4">
                <Terminal className="w-3 h-3" />
                {t("REST ENDPOINTS", "نقاط REST")}
              </span>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[hsl(var(--navy))] mb-4 leading-[1.1]">
                {t("A clean, predictable surface.", "واجهة واضحة وثابتة.")}
              </h2>
              <p className="font-body text-lg text-[hsl(var(--navy))]/55 mb-6 leading-relaxed">
                {t(
                  "Base URL: https://api.snip.sa. Every response is a JSON envelope: { success, message, data }. ISO timestamps throughout.",
                  "الرابط الأساسي: https://api.snip.sa. كل استجابة مغلفة بصيغة JSON: { success, message, data }. مع توقيتات ISO.",
                )}
              </p>
              <div className="flex items-center gap-2 text-sm font-body text-[hsl(var(--navy))]/60">
                <Shield className="w-4 h-4 text-[hsl(var(--sky))]" />
                {t(
                  "X-API-Key or Bearer JWT auth · password protection · geo & device filtering",
                  "مصادقة X-API-Key أو Bearer JWT · حماية بكلمة مرور · تصفية جغرافية وجهازية",
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl border border-[hsl(var(--navy))]/8 overflow-hidden divide-y divide-[hsl(var(--navy))]/8"
              dir="ltr"
            >
              {endpoints.map((e, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-1 rounded shrink-0 ${
                      e.method === "GET"
                        ? "bg-emerald-100 text-emerald-700"
                        : e.method === "POST"
                          ? "bg-[hsl(var(--sky))]/15 text-[hsl(var(--sky))]"
                          : e.method === "PATCH"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {e.method}
                  </span>
                  <code className="font-mono text-sm text-[hsl(var(--navy))] shrink-0">
                    {e.path}
                  </code>
                  <span className="font-body text-xs text-[hsl(var(--navy))]/45 ms-auto text-end">
                    {e.desc}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <CTASection />
      <Footer />
    </div>
  );
};

export default FeatureAPI;
