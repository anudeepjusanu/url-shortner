import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Link2, BarChart3, QrCode, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const endpoints = [
  {
    method: "POST",
    path: "/api/v1/links",
    title: "Create Short Link",
    titleAr: "إنشاء رابط مختصر",
    description: "Shorten a URL with optional custom code and tags.",
    descriptionAr: "اختصر رابطًا مع إمكانية إضافة كود مخصص ووسوم.",
    icon: Link2,
    code: `curl -X POST https://4r.sa/api/v1/links \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com/long-url",
    "customCode": "mylink",
    "tags": ["marketing"]
  }'`,
    response: `{
  "id": "lnk_abc123",
  "shortUrl": "https://4r.sa/mylink",
  "originalUrl": "https://example.com/long-url",
  "clicks": 0,
  "createdAt": "2026-03-08T12:00:00Z"
}`,
  },
  {
    method: "GET",
    path: "/api/v1/links/:id/analytics",
    title: "Get Link Analytics",
    titleAr: "تحليلات الرابط",
    description: "Retrieve click analytics for a specific link.",
    descriptionAr: "استرجاع تحليلات الضغطات لرابط محدد.",
    icon: BarChart3,
    code: `curl https://4r.sa/api/v1/links/lnk_abc123/analytics \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
    response: `{
  "totalClicks": 142,
  "uniqueClicks": 98,
  "topCountries": [
    { "country": "SA", "clicks": 87 },
    { "country": "AE", "clicks": 31 }
  ]
}`,
  },
  {
    method: "POST",
    path: "/api/v1/qr",
    title: "Generate QR Code",
    titleAr: "إنشاء كود QR",
    description: "Generate a QR code for any URL or short link.",
    descriptionAr: "أنشئ كود QR لأي رابط.",
    icon: QrCode,
    code: `curl -X POST https://4r.sa/api/v1/qr \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://4r.sa/mylink",
    "size": 512,
    "format": "png"
  }'`,
    response: `{
  "id": "qr_xyz789",
  "imageUrl": "https://4r.sa/qr/qr_xyz789.png",
  "size": 512,
  "format": "png"
}`,
  },
];

const ApiDocs = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const methodColor: Record<string, string> = {
    GET: "bg-green-100 text-green-700",
    POST: "bg-primary/10 text-primary",
    DELETE: "bg-destructive/10 text-destructive",
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-5 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-lg sm:text-2xl font-display font-bold text-foreground">
              {t("API Documentation", "مستندات API")}
            </h1>
            <p className="text-muted-foreground font-body text-xs sm:text-sm mt-1">
              {t("Integrate 4r.sa into your apps with our REST API.", "ادمج 4r.sa في تطبيقاتك عبر واجهة البرمجة.")}
            </p>
          </div>
          <Button variant="outline" size="sm" className="font-body text-xs self-start sm:self-auto" onClick={() => navigate("/dashboard/profile")}>
            {t("Get API Key", "احصل على مفتاح API")}
            <ArrowRight className="w-3.5 h-3.5 ms-1.5" />
          </Button>
        </div>

        {/* Base URL */}
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-[11px] sm:text-xs text-muted-foreground font-body mb-0.5">{t("Base URL", "الرابط الأساسي")}</p>
                <code className="text-xs sm:text-sm font-mono text-foreground">https://4r.sa/api/v1</code>
              </div>
              <div>
                <p className="text-[11px] sm:text-xs text-muted-foreground font-body mb-0.5">{t("Auth Header", "ترويسة المصادقة")}</p>
                <code className="text-[11px] sm:text-sm font-mono text-foreground break-all">Authorization: Bearer YOUR_API_KEY</code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <div className="space-y-4 sm:space-y-6">
          {endpoints.map((ep, idx) => (
            <Card key={idx}>
              <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 sm:pb-3">
                <div className="flex items-start gap-2.5 sm:gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <ep.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm sm:text-base font-display flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${methodColor[ep.method]}`}>
                        {ep.method}
                      </span>
                      <code className="text-[11px] sm:text-sm font-mono text-muted-foreground break-all">{ep.path}</code>
                    </CardTitle>
                    <CardDescription className="font-body text-xs sm:text-sm mt-0.5">
                      {t(ep.description, ep.descriptionAr)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3">
                {/* Request */}
                <div>
                  <p className="text-[10px] font-body font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    {t("Request", "الطلب")}
                  </p>
                  <div className="relative rounded-lg bg-foreground overflow-hidden" dir="ltr">
                    <button
                      onClick={() => handleCopy(ep.code, idx)}
                      className="absolute top-2.5 end-2.5 text-background/40 hover:text-background/70 transition-colors"
                    >
                      {copiedIdx === idx ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <pre className="p-3 sm:p-4 text-[10px] sm:text-xs font-mono text-background/80 leading-relaxed overflow-x-auto">
                      {ep.code}
                    </pre>
                  </div>
                </div>
                {/* Response */}
                <div>
                  <p className="text-[10px] font-body font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    {t("Response", "الاستجابة")}
                  </p>
                  <div className="rounded-lg bg-muted/50 border border-border overflow-hidden" dir="ltr">
                    <pre className="p-3 sm:p-4 text-[10px] sm:text-xs font-mono text-foreground/70 leading-relaxed overflow-x-auto">
                      {ep.response}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Rate Limits */}
        <Card>
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 sm:pb-4">
            <CardTitle className="text-sm sm:text-base font-display">{t("Rate Limits", "حدود الاستخدام")}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
              {[
                { plan: t("Free", "مجاني"), limit: "100 req/hr" },
                { plan: t("Pro", "احترافي"), limit: "1,000 req/hr" },
                { plan: t("Enterprise", "مؤسسي"), limit: t("Unlimited", "غير محدود") },
              ].map((item) => (
                <div key={item.plan} className="rounded-lg border border-border p-3 sm:p-4">
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-body">{item.plan}</p>
                  <p className="text-sm sm:text-lg font-display font-bold text-foreground mt-1">{item.limit}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ApiDocs;