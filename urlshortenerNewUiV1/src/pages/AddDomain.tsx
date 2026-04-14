import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Globe, CheckCircle, Copy, Check, AlertCircle, Loader2 } from "lucide-react";
import { useAddDomain } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import amplitudeService from "@/services/amplitude";

type Step = "enter" | "dns" | "done";

const AddDomain = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("enter");
  const [domain, setDomain] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [domainError, setDomainError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cnameTarget, setCnameTarget] = useState("snip.sa");

  const addDomain = useAddDomain();

  const fullDomain = subdomain.trim()
    ? `${subdomain.trim()}.${domain.trim()}`
    : domain.trim();

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const validateDomain = (d: string) => {
    if (!d.trim()) return t("Domain is required", "الدومين مطلوب");
    const re = /^([a-zA-Z0-9\u0600-\u06FF-]+\.)+[a-zA-Z\u0600-\u06FF]{2,}$/;
    if (!re.test(d.trim())) return t("Invalid domain format", "صيغة الدومين غير صحيحة");
    return "";
  };

  // Step 1 → Step 2: validate locally, do NOT call API yet
  const handleContinue = () => {
    const err = validateDomain(domain);
    if (err) { setDomainError(err); return; }
    if (!subdomain.trim()) { setDomainError(t("Subdomain is required", "النطاق الفرعي مطلوب")); return; }
    setDomainError("");
    setStep("dns");
  };

  // Step 2 → call API → Step 3
  const handleConfirmDNS = async () => {
    setIsSubmitting(true);
    try {
      const response = await addDomain.mutateAsync({
        domain: domain.trim(),
        subdomain: subdomain.trim() || undefined,
      });

      // Extract CNAME target if returned by backend
      const target =
        response?.data?.data?.cnameTarget ||
        response?.data?.cnameTarget ||
        response?.cnameTarget ||
        "snip.sa";
      setCnameTarget(target);

      amplitudeService.track('add custom-domain');
      toast({
        title: t("Domain added", "تمت إضافة الدومين"),
        description: t("Configure your DNS records to verify ownership.", "أضف سجلات DNS للتحقق من ملكيتك."),
      });
      setStep("done");
    } catch (error: any) {
      toast({
        title: t("Error", "خطأ"),
        description: error.message || t("Failed to add domain", "فشل إضافة الدومين"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const dnsRecords = [
    {
      type: "CNAME",
      name: fullDomain || t("your-subdomain.domain.sa", "نطاقك-الفرعي.دومينك.sa"),
      value: cnameTarget,
      description: t("Domain pointer", "توجيه الدومين"),
    },
  ];

  const steps = [
    { key: "enter", label: t("Enter Domain", "أدخل الدومين") },
    { key: "dns", label: t("Configure DNS", "إعداد DNS") },
    { key: "done", label: t("Complete", "اكتمل") },
  ];

  const stepIndex = steps.findIndex((s) => s.key === step);

  return (
    <DashboardLayout>
      <Button
        variant="outline"
        size="sm"
        className="mb-4 sm:mb-6 text-xs sm:text-sm"
        onClick={() => navigate("/dashboard/domains")}
      >
        <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 me-1.5" />
        {t("Back to Domains", "العودة للدومينات")}
      </Button>

      <div className="max-w-2xl">
        <h1 className="text-lg sm:text-2xl font-display font-bold text-foreground mb-1.5 sm:mb-2">
          {t("Add Custom Domain", "إضافة دومين مخصص")}
        </h1>
        <p className="text-muted-foreground font-body text-xs sm:text-sm mb-5 sm:mb-8">
          {t(
            "Use your own domain for branded short links",
            "استخدم دومينك الخاص لروابط مختصرة بعلامتك التجارية"
          )}
        </p>

        {/* Steps indicator */}
        <div className="flex items-center gap-1.5 sm:gap-3 mb-5 sm:mb-8">
          {steps.map((s, i) => {
            const isDone = i < stepIndex;
            const isActive = i === stepIndex;
            return (
              <div key={s.key} className="flex items-center gap-1.5 sm:gap-2">
                {i > 0 && (
                  <div className={`w-4 sm:w-8 h-px ${isDone || isActive ? "bg-primary" : "bg-border"}`} />
                )}
                <div className="flex items-center gap-1 sm:gap-2">
                  <div
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold ${
                      isDone
                        ? "bg-primary text-primary-foreground"
                        : isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isDone ? <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : i + 1}
                  </div>
                  <span
                    className={`text-[11px] sm:text-sm font-body ${
                      isActive || isDone ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Step 1: Enter domain ── */}
        {step === "enter" && (
          <div className="bg-background border border-border rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-foreground text-xs sm:text-sm">
                <Globe className="w-3.5 h-3.5" />
                {t("Root Domain", "الدومين الأساسي")} *
              </Label>
              <Input
                placeholder={t("e.g. mystore.sa", "مثال: متجري.sa")}
                value={domain}
                onChange={(e) => { setDomain(e.target.value); setDomainError(""); }}
                className={`h-10 sm:h-12 text-sm ${domainError ? "border-destructive" : ""}`}
              />
              <p className="text-[11px] sm:text-xs text-muted-foreground font-body">
                {t("Enter your root domain without www or subdomain", "أدخل الدومين الأساسي بدون www أو نطاق فرعي")}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-foreground text-xs sm:text-sm">
                <Globe className="w-3.5 h-3.5" />
                {t("Subdomain Prefix", "بادئة النطاق الفرعي")} *
              </Label>
              <div className="flex items-center gap-0">
                <Input
                  placeholder={t("e.g. go", "مثال: go")}
                  value={subdomain}
                  onChange={(e) => { setSubdomain(e.target.value); setDomainError(""); }}
                  className={`h-10 sm:h-12 text-sm rounded-e-none border-e-0 ${domainError ? "border-destructive" : ""}`}
                />
                <div className="h-10 sm:h-12 px-3 flex items-center bg-muted/50 border border-input rounded-e-md text-sm text-muted-foreground font-mono whitespace-nowrap">
                  .{domain.trim() || "domain.sa"}
                </div>
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground font-body">
                {t(
                  "Short links will use: ",
                  "الروابط المختصرة ستستخدم: "
                )}
                <span className="text-primary font-mono">
                  {subdomain.trim() && domain.trim() ? fullDomain : t("subdomain.domain.sa", "نطاق.دومين.sa")}
                </span>
              </p>
              {domainError && (
                <p className="text-xs text-destructive font-body">{domainError}</p>
              )}
            </div>

            <Button
              onClick={handleContinue}
              className="h-10 sm:h-12 w-full bg-primary text-primary-foreground text-sm"
              disabled={!domain.trim() || !subdomain.trim()}
            >
              {t("Continue", "متابعة")}
            </Button>
          </div>
        )}

        {/* ── Step 2: DNS configuration ── */}
        {step === "dns" && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-background border border-border rounded-xl p-4 sm:p-6">
              <div className="flex items-start gap-2.5 sm:gap-3 mb-4 sm:mb-5">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-display font-semibold text-foreground text-xs sm:text-sm">
                    {t("Configure DNS Records", "إعداد سجلات DNS")}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-muted-foreground font-body mt-1">
                    {t(
                      `Add the following DNS record at your registrar for ${fullDomain}. DNS propagation can take up to 72 hours.`,
                      `أضف سجل DNS التالي عند مزود ${fullDomain}. قد يستغرق التحديث حتى 72 ساعة.`
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {dnsRecords.map((record) => (
                  <div
                    key={record.name + record.type}
                    className="border border-border rounded-lg p-3 sm:p-4 bg-muted/30"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                          {record.type}
                        </span>
                        <span className="text-[11px] sm:text-xs text-muted-foreground font-body">
                          {record.description}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopy(record.value, record.name)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {copied === record.name ? (
                          <Check className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <div className="grid grid-cols-[60px_1fr] sm:grid-cols-[80px_1fr] gap-2 text-xs font-body">
                      <span className="text-muted-foreground">{t("Name:", "الاسم:")}</span>
                      <code className="text-foreground font-mono text-[11px] sm:text-xs break-all">{record.name}</code>
                      <span className="text-muted-foreground">{t("Value:", "القيمة:")}</span>
                      <code className="text-foreground font-mono text-[11px] sm:text-xs break-all">{record.value}</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-muted/50 border border-border rounded-xl p-3 sm:p-4">
              <p className="text-[11px] sm:text-xs text-muted-foreground font-body leading-relaxed">
                💡 {t(
                  "Make sure to remove any conflicting A or CNAME records for the same subdomain.",
                  "تأكد من حذف أي سجلات A أو CNAME متعارضة لنفس النطاق الفرعي."
                )}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button variant="outline" className="h-10 sm:h-12 text-sm" onClick={() => setStep("enter")}>
                {t("Back", "رجوع")}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard/domains")}
                className="h-10 sm:h-12 text-sm"
              >
                {t("I'll Add Later", "سأضيفها لاحقًا")}
              </Button>
              <Button
                onClick={handleConfirmDNS}
                className="flex-1 h-10 sm:h-12 bg-primary text-primary-foreground text-sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 me-2 animate-spin" />{t("Adding Domain...", "جاري الإضافة...")}</>
                ) : (
                  t("I've Added the Records", "أضفت السجلات")
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Done ── */}
        {step === "done" && (
          <div className="bg-background border border-border rounded-xl p-6 sm:p-8 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
            </div>
            <h3 className="font-display font-bold text-foreground text-base sm:text-lg mb-2">
              {t("Domain Submitted!", "تم إرسال الدومين!")}
            </h3>
            <p className="text-sm font-semibold text-primary mb-2">{fullDomain}</p>
            <p className="text-xs sm:text-sm text-muted-foreground font-body mb-5 sm:mb-6 max-w-md mx-auto">
              {t(
                "We're verifying your DNS records. This usually takes a few minutes but can take up to 72 hours. You can check the status in your domains list.",
                "نتحقق الآن من سجلات DNS. عادةً يستغرق دقائق لكن قد يصل إلى 72 ساعة. يمكنك متابعة الحالة في قائمة الدومينات."
              )}
            </p>
            <div className="flex gap-2 sm:gap-3 justify-center">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => navigate("/dashboard/domains")}>
                {t("Go to Domains", "الذهاب للدومينات")}
              </Button>
              <Button
                size="sm"
                className="text-xs sm:text-sm"
                onClick={() => {
                  setStep("enter");
                  setDomain("");
                  setSubdomain("");
                  setDomainError("");
                }}
              >
                {t("Add Another", "إضافة دومين آخر")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AddDomain;
