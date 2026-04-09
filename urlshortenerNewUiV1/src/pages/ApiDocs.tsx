import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Link2, BarChart3, QrCode, ArrowRight, Globe, ShieldCheck, ChevronDown, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BASE_URL = "https://snip.sa/api";

type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface Endpoint {
  id: string;
  method: Method;
  path: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  icon: React.ElementType;
  auth: boolean;
  requestBody?: string;
  response: string;
}

const endpoints: Endpoint[] = [
  // ── URLs ─────────────────────────────────────────────────────────────────────
  {
    id: "create-url",
    method: "POST",
    path: "/urls",
    title: "Create Short URL",
    titleAr: "إنشاء رابط مختصر",
    description: "Shorten a URL with optional custom code, expiry, password, and QR generation.",
    descriptionAr: "اختصر رابطًا مع كود مخصص، انتهاء صلاحية، حماية بكلمة مرور، وتوليد QR.",
    icon: Link2,
    auth: true,
    requestBody: `{
  "originalUrl": "https://example.com/very-long-url",  // required
  "customCode": "mylink",                               // optional
  "title": "My Link",                                   // optional
  "description": "A description",                       // optional
  "tags": ["marketing"],                                // optional
  "expiresAt": "2026-12-31T23:59:59Z",                 // optional ISO 8601
  "password": "secret123",                              // optional
  "domainId": "base",                                   // optional
  "redirectType": 302,                                  // optional: 301|302|307
  "generateQRCode": false                               // optional
}`,
    response: `{
  "success": true,
  "message": "URL created successfully",
  "data": {
    "url": {
      "_id": "507f1f77bcf86cd799439011",
      "originalUrl": "https://example.com/very-long-url",
      "shortCode": "abc123",
      "title": "My Link",
      "clickCount": 0,
      "isActive": true,
      "createdAt": "2026-01-15T10:30:00.000Z"
    },
    "domain": {
      "fullDomain": "snip.sa",
      "shortUrl": "https://snip.sa/abc123"
    }
  }
}`,
  },
  {
    id: "list-urls",
    method: "GET",
    path: "/urls?limit=20&page=1&search=&sortBy=createdAt&sortOrder=desc",
    title: "List My URLs",
    titleAr: "جلب روابطي",
    description: "Get all short URLs created by the authenticated user. Supports pagination and search.",
    descriptionAr: "جلب جميع الروابط المختصرة للمستخدم الحالي. يدعم الترقيم والبحث.",
    icon: Link2,
    auth: true,
    response: `{
  "success": true,
  "data": {
    "urls": [ { "_id": "...", "shortCode": "abc123", "clickCount": 42, ... } ],
    "pagination": { "page": 1, "limit": 20, "total": 150, "pages": 8 }
  }
}`,
  },
  {
    id: "get-url",
    method: "GET",
    path: "/urls/:id",
    title: "Get URL",
    titleAr: "جلب رابط",
    description: "Get details for a single short URL by its ID.",
    descriptionAr: "جلب تفاصيل رابط مختصر واحد بمعرّفه.",
    icon: Link2,
    auth: true,
    response: `{
  "success": true,
  "data": {
    "url": { "_id": "...", "shortCode": "abc123", "originalUrl": "...", "clickCount": 42 }
  }
}`,
  },
  {
    id: "update-url",
    method: "PUT",
    path: "/urls/:id",
    title: "Update URL",
    titleAr: "تحديث رابط",
    description: "Update title, expiry, password, or active status of a URL.",
    descriptionAr: "تحديث عنوان الرابط، تاريخ الانتهاء، كلمة المرور، أو حالته.",
    icon: Link2,
    auth: true,
    requestBody: `{
  "title": "Updated Title",
  "expiresAt": "2027-01-01T00:00:00Z",
  "isActive": true
}`,
    response: `{ "success": true, "message": "URL updated successfully", "data": { "url": { ... } } }`,
  },
  {
    id: "delete-url",
    method: "DELETE",
    path: "/urls/:id",
    title: "Delete URL",
    titleAr: "حذف رابط",
    description: "Permanently delete a short URL.",
    descriptionAr: "حذف رابط مختصر نهائيًا.",
    icon: Link2,
    auth: true,
    response: `{ "success": true, "message": "URL deleted successfully" }`,
  },
  {
    id: "url-stats",
    method: "GET",
    path: "/urls/stats",
    title: "URL Stats",
    titleAr: "إحصائيات الروابط",
    description: "Get aggregated stats: total links, total clicks, and custom domains count.",
    descriptionAr: "إحصائيات مجمّعة: إجمالي الروابط، الضغطات، وعدد الدومينات المخصصة.",
    icon: BarChart3,
    auth: true,
    response: `{
  "success": true,
  "totalLinks": 42,
  "totalClicks": 1234,
  "customDomains": 2,
  "accountAge": "3 months"
}`,
  },

  // ── Analytics ─────────────────────────────────────────────────────────────────
  {
    id: "analytics-url",
    method: "GET",
    path: "/analytics/:id?period=30d",
    title: "URL Analytics",
    titleAr: "تحليلات الرابط",
    description: "Get click analytics for a specific URL. period: 24h | 7d | 30d | 90d | 1y",
    descriptionAr: "تحليلات الضغطات لرابط محدد. الفترة: 24h | 7d | 30d | 90d | 1y",
    icon: BarChart3,
    auth: true,
    response: `{
  "success": true,
  "data": {
    "overview": { "totalClicks": 142, "uniqueClicks": 98 },
    "timeSeries": [ { "date": "2026-01-15", "clicks": 12, "uniqueClicks": 8 } ],
    "topStats": {
      "countries": [ { "_id": { "country": "SA" }, "count": 87 } ],
      "devices": [ { "_id": "mobile", "count": 95 } ],
      "browsers": [ { "_id": "Chrome", "count": 110 } ]
    }
  }
}`,
  },
  {
    id: "analytics-dashboard",
    method: "GET",
    path: "/analytics/dashboard?period=30d",
    title: "Dashboard Analytics",
    titleAr: "تحليلات لوحة التحكم",
    description: "Get overview analytics across all your links.",
    descriptionAr: "تحليلات شاملة لجميع روابطك.",
    icon: BarChart3,
    auth: true,
    response: `{
  "success": true,
  "data": {
    "overview": { "totalUrls": 42, "totalClicks": 1234, "totalQRScans": 56 },
    "chartData": { "clicksByDay": [ { "date": "2026-01-15", "clicks": 45 } ] },
    "topStats": { "countries": [...], "devices": [...] }
  }
}`,
  },
  {
    id: "analytics-export",
    method: "GET",
    path: "/analytics/:id/export?format=csv&period=30d",
    title: "Export Analytics",
    titleAr: "تصدير التحليلات",
    description: "Export click analytics for a URL as a CSV file.",
    descriptionAr: "تصدير تحليلات الضغطات لرابط معين كملف CSV.",
    icon: BarChart3,
    auth: true,
    response: `// Returns a CSV file download (Content-Type: text/csv)
date,clicks,uniqueClicks
2026-01-15,12,8
2026-01-16,24,18
...`,
  },

  // ── QR Codes ─────────────────────────────────────────────────────────────────
  {
    id: "qr-generate",
    method: "POST",
    path: "/qr-codes/generate/:urlId",
    title: "Generate QR Code",
    titleAr: "إنشاء كود QR",
    description: "Generate a QR code for an existing short URL.",
    descriptionAr: "إنشاء كود QR لرابط مختصر موجود.",
    icon: QrCode,
    auth: true,
    requestBody: `{
  "size": 512,                  // optional: 100–2000 px
  "format": "png",              // optional: png | svg | jpeg | pdf
  "errorCorrectionLevel": "M",  // optional: L | M | Q | H
  "foregroundColor": "#000000", // optional hex
  "backgroundColor": "#ffffff", // optional hex
  "includeMargin": true         // optional
}`,
    response: `{
  "success": true,
  "data": {
    "qrCode": {
      "urlId": "507f1f77bcf86cd799439011",
      "qrCode": "data:image/png;base64,iVBORw0KGgo...",
      "format": "png",
      "size": 512
    }
  }
}`,
  },
  {
    id: "qr-download",
    method: "GET",
    path: "/qr-codes/download/:urlId?format=png",
    title: "Download QR Code",
    titleAr: "تنزيل كود QR",
    description: "Download QR code as a binary image file.",
    descriptionAr: "تنزيل كود QR كملف صورة ثنائي.",
    icon: QrCode,
    auth: true,
    response: `// Returns binary image (Content-Type: image/png | image/svg+xml | application/pdf)`,
  },
  {
    id: "qr-stats",
    method: "GET",
    path: "/qr-codes/stats",
    title: "QR Code Stats",
    titleAr: "إحصائيات QR",
    description: "Get QR code statistics for the authenticated user.",
    descriptionAr: "إحصائيات أكواد QR للمستخدم الحالي.",
    icon: QrCode,
    auth: true,
    response: `{
  "success": true,
  "data": {
    "totalQRCodes": 12,
    "totalQRScans": 340,
    "activeQRCodes": 10,
    "topQRCode": { "shortCode": "abc123", "scans": 120 }
  }
}`,
  },

  // ── Custom Domains ────────────────────────────────────────────────────────────
  {
    id: "domains-list",
    method: "GET",
    path: "/domains",
    title: "List Domains",
    titleAr: "جلب الدومينات",
    description: "Get all custom domains added by the authenticated user.",
    descriptionAr: "جلب جميع الدومينات المخصصة للمستخدم الحالي.",
    icon: Globe,
    auth: true,
    response: `{
  "success": true,
  "data": {
    "domains": [
      { "_id": "...", "domain": "go.mystore.sa", "status": "verified", "isDefault": false, "createdAt": "..." }
    ]
  }
}`,
  },
  {
    id: "domains-add",
    method: "POST",
    path: "/domains",
    title: "Add Domain",
    titleAr: "إضافة دومين",
    description: "Add a custom domain for branded short links.",
    descriptionAr: "إضافة دومين مخصص للروابط المختصرة.",
    icon: Globe,
    auth: true,
    requestBody: `{
  "domain": "mystore.sa",   // required: root domain
  "subdomain": "go"         // optional: prefix
}`,
    response: `{
  "success": true,
  "data": {
    "domain": { "_id": "...", "domain": "go.mystore.sa", "status": "pending", "cnameTarget": "snip.sa" }
  }
}`,
  },
  {
    id: "domains-verify",
    method: "POST",
    path: "/domains/:id/verify",
    title: "Verify Domain",
    titleAr: "التحقق من الدومين",
    description: "Trigger DNS verification for a pending domain.",
    descriptionAr: "بدء التحقق من سجلات DNS لدومين معلّق.",
    icon: Globe,
    auth: true,
    response: `{
  "success": true,
  "data": { "verified": true, "domain": { "_id": "...", "status": "verified" } }
}`,
  },
  {
    id: "domains-delete",
    method: "DELETE",
    path: "/domains/:id",
    title: "Delete Domain",
    titleAr: "حذف الدومين",
    description: "Remove a custom domain from your account.",
    descriptionAr: "إزالة دومين مخصص من حسابك.",
    icon: Globe,
    auth: true,
    response: `{ "success": true, "message": "Domain deleted successfully" }`,
  },
];

const errorCodes = [
  { code: "400", desc: "Bad Request — validation error or missing required field", descAr: "طلب غير صالح — خطأ في التحقق أو حقل مطلوب مفقود" },
  { code: "401", desc: "Unauthorized — missing or invalid API key / JWT", descAr: "غير مصرّح — مفتاح API أو JWT مفقود أو غير صالح" },
  { code: "403", desc: "Forbidden — insufficient permissions", descAr: "محظور — صلاحيات غير كافية" },
  { code: "404", desc: "Not Found — resource does not exist", descAr: "غير موجود — المورد غير موجود" },
  { code: "409", desc: "Conflict — e.g. custom code already taken", descAr: "تعارض — مثال: الكود المخصص مأخوذ مسبقًا" },
  { code: "429", desc: "Too Many Requests — rate limit exceeded", descAr: "طلبات كثيرة — تجاوزت حد الاستخدام" },
  { code: "500", desc: "Internal Server Error", descAr: "خطأ داخلي في الخادم" },
];

const methodColor: Record<Method, string> = {
  GET: "bg-green-100 text-green-700",
  POST: "bg-primary/10 text-primary",
  PUT: "bg-orange-100 text-orange-700",
  DELETE: "bg-destructive/10 text-destructive",
  PATCH: "bg-yellow-100 text-yellow-700",
};

const groups = [
  { label: "URLs", labelAr: "الروابط", ids: ["create-url", "list-urls", "get-url", "update-url", "delete-url", "url-stats"] },
  { label: "Analytics", labelAr: "التحليلات", ids: ["analytics-url", "analytics-dashboard", "analytics-export"] },
  { label: "QR Codes", labelAr: "أكواد QR", ids: ["qr-generate", "qr-download", "qr-stats"] },
  { label: "Custom Domains", labelAr: "الدومينات المخصصة", ids: ["domains-list", "domains-add", "domains-verify", "domains-delete"] },
];

const ApiDocs = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [copiedIdx, setCopiedIdx] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(id);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const endpointMap = Object.fromEntries(endpoints.map((e) => [e.id, e]));

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-lg sm:text-2xl font-display font-bold text-foreground">
              {t("API Documentation", "مستندات API")}
            </h1>
            <p className="text-muted-foreground font-body text-xs sm:text-sm mt-1">
              {t("Integrate with our REST API using your API key.", "ادمج مع واجهة البرمجة باستخدام مفتاح API.")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="font-body text-xs self-start sm:self-auto"
            onClick={() => navigate("/dashboard/profile")}
          >
            {t("Get API Key", "احصل على مفتاح API")}
            <ArrowRight className="w-3.5 h-3.5 ms-1.5" />
          </Button>
        </div>

        {/* Authentication & Base URL */}
        <Card>
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base font-display flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              {t("Authentication", "المصادقة")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <p className="text-[10px] text-muted-foreground font-body mb-1">{t("Base URL", "الرابط الأساسي")}</p>
                <code className="text-xs sm:text-sm font-mono text-foreground" dir="ltr">{BASE_URL}</code>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 border border-border">
                <p className="text-[10px] text-muted-foreground font-body mb-1">{t("Auth Header", "ترويسة المصادقة")}</p>
                <code className="text-[11px] sm:text-sm font-mono text-foreground break-all" dir="ltr">
                  Authorization: Bearer YOUR_API_KEY
                </code>
              </div>
            </div>
            <div className="relative rounded-lg bg-foreground overflow-hidden" dir="ltr">
              <button
                onClick={() => handleCopy(`curl ${BASE_URL}/urls \\
  -H "Authorization: Bearer YOUR_API_KEY"`, "auth-example")}
                className="absolute top-2.5 end-2.5 text-background/40 hover:text-background/70 transition-colors"
              >
                {copiedIdx === "auth-example" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <pre className="p-3 sm:p-4 text-[10px] sm:text-xs font-mono text-background/80 leading-relaxed overflow-x-auto">{`curl ${BASE_URL}/urls \\
  -H "Authorization: Bearer YOUR_API_KEY"`}</pre>
            </div>
          </CardContent>
        </Card>

        {/* Endpoint groups */}
        {groups.map((group) => (
          <div key={group.label} className="space-y-3">
            <h2 className="text-sm sm:text-base font-display font-semibold text-foreground border-b border-border pb-2">
              {t(group.label, group.labelAr)}
            </h2>
            {group.ids.map((id) => {
              const ep = endpointMap[id];
              if (!ep) return null;
              const isOpen = !!expanded[id];
              return (
                <Card key={id} className="overflow-hidden">
                  <button
                    className="w-full text-left"
                    onClick={() => toggle(id)}
                  >
                    <CardHeader className="px-4 sm:px-5 py-3 sm:py-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <ep.icon className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${methodColor[ep.method]}`}>
                              {ep.method}
                            </span>
                            <code className="text-[10px] sm:text-xs font-mono text-muted-foreground break-all" dir="ltr">
                              {ep.path}
                            </code>
                          </div>
                          <p className="text-xs sm:text-sm font-display font-medium text-foreground mt-0.5">
                            {t(ep.title, ep.titleAr)}
                          </p>
                        </div>
                        {ep.auth && (
                          <span className="text-[9px] font-body px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0 hidden sm:block">
                            {t("Auth required", "يتطلب مصادقة")}
                          </span>
                        )}
                        {isOpen
                          ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                          : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                      </div>
                    </CardHeader>
                  </button>

                  {isOpen && (
                    <CardContent className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 space-y-3 border-t border-border">
                      <p className="text-xs sm:text-sm text-muted-foreground font-body pt-3">
                        {t(ep.description, ep.descriptionAr)}
                      </p>

                      {ep.requestBody && (
                        <div>
                          <p className="text-[10px] font-body font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                            {t("Request Body", "جسم الطلب")}
                          </p>
                          <div className="relative rounded-lg bg-foreground overflow-hidden" dir="ltr">
                            <button
                              onClick={() => handleCopy(ep.requestBody!, `req-${id}`)}
                              className="absolute top-2.5 end-2.5 text-background/40 hover:text-background/70 transition-colors"
                            >
                              {copiedIdx === `req-${id}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <pre className="p-3 sm:p-4 text-[10px] sm:text-xs font-mono text-background/80 leading-relaxed overflow-x-auto">
                              {ep.requestBody}
                            </pre>
                          </div>
                        </div>
                      )}

                      <div>
                        <p className="text-[10px] font-body font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                          {t("Response", "الاستجابة")}
                        </p>
                        <div className="relative rounded-lg bg-muted/50 border border-border overflow-hidden" dir="ltr">
                          <button
                            onClick={() => handleCopy(ep.response, `res-${id}`)}
                            className="absolute top-2.5 end-2.5 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {copiedIdx === `res-${id}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <pre className="p-3 sm:p-4 text-[10px] sm:text-xs font-mono text-foreground/70 leading-relaxed overflow-x-auto">
                            {ep.response}
                          </pre>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        ))}

        {/* Error Codes */}
        <Card>
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 sm:pb-4">
            <CardTitle className="text-sm sm:text-base font-display">
              {t("Error Codes", "رموز الأخطاء")}
            </CardTitle>
            <CardDescription className="font-body text-xs sm:text-sm">
              {t("All error responses include a message field with details.", "جميع استجابات الخطأ تحتوي على حقل message للتفاصيل.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="space-y-2">
              {errorCodes.map((e) => (
                <div key={e.code} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                    e.code.startsWith("4") ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                  }`}>
                    {e.code}
                  </span>
                  <p className="text-xs text-foreground font-body">{t(e.desc, e.descAr)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rate Limits */}
        <Card>
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 sm:pb-4">
            <CardTitle className="text-sm sm:text-base font-display">
              {t("Rate Limits", "حدود الاستخدام")}
            </CardTitle>
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
