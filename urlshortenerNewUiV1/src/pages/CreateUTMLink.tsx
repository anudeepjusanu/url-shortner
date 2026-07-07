import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUTM } from "@/contexts/UTMContext";
import { useCreateUrl, useAvailableDomains } from "@/hooks/useApi";
import { urlsAPI } from "@/services/api";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Copy, Check, Tag, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRequireEditAccess } from "@/hooks/useRequireEditAccess";

const buildTaggedUrl = (
  dest: string,
  params: {
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmTerm?: string;
    utmContent?: string;
  },
): string | null => {
  if (!dest.trim()) return null;
  try {
    const url = new URL(dest.trim());
    if (params.utmSource?.trim())
      url.searchParams.set("utm_source", params.utmSource.trim());
    if (params.utmMedium?.trim())
      url.searchParams.set("utm_medium", params.utmMedium.trim());
    if (params.utmCampaign?.trim())
      url.searchParams.set("utm_campaign", params.utmCampaign.trim());
    if (params.utmTerm?.trim())
      url.searchParams.set("utm_term", params.utmTerm.trim());
    if (params.utmContent?.trim())
      url.searchParams.set("utm_content", params.utmContent.trim());
    return url.toString();
  } catch {
    return null;
  }
};

const isValidUrl = (value: string): boolean => {
  if (!value.trim()) return false;
  try {
    new URL(value.trim());
    return true;
  } catch {
    return false;
  }
};

const CreateUTMLink = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  useRequireEditAccess("/dashboard/utm-builder");
  const { addUTMLink } = useUTM();
  const createUrl = useCreateUrl();
  const { data: domainsData } = useAvailableDomains();

  const availableDomains = useMemo(
    () =>
      Array.isArray(domainsData?.data?.domains)
        ? domainsData.data.domains.filter((d: any) => d && d.id && d.fullDomain)
        : [],
    [domainsData],
  );

  const defaultDomainId = useMemo(() => {
    if (availableDomains.length === 0) return "";
    const def = availableDomains.find((d: any) => d.isDefault);
    return def ? def.id : availableDomains[0].id;
  }, [availableDomains]);

  const [name, setName] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmTerm, setUtmTerm] = useState("");
  const [utmContent, setUtmContent] = useState("");
  const [shortenToggle, setShortenToggle] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [safetyError, setSafetyError] = useState("");

  // Validation state — only shown after first submit attempt
  const [touched, setTouched] = useState(false);

  const destError = useMemo(() => {
    if (!touched) return "";
    if (!destinationUrl.trim())
      return t("Destination URL is required", "رابط الوجهة مطلوب");
    if (!isValidUrl(destinationUrl))
      return t(
        "Please enter a valid URL (e.g. https://example.com)",
        "أدخل رابطاً صحيحاً مثل https://example.com",
      );
    return "";
  }, [touched, destinationUrl, t]);

  const taggedUrl = useMemo(
    () =>
      buildTaggedUrl(destinationUrl, {
        utmSource,
        utmMedium,
        utmCampaign,
        utmTerm,
        utmContent,
      }),
    [destinationUrl, utmSource, utmMedium, utmCampaign, utmTerm, utmContent],
  );

  const handleCopy = () => {
    if (!taggedUrl) return;
    navigator.clipboard.writeText(taggedUrl);
    setCopied(true);
    toast.success(t("Copied to clipboard!", "تم النسخ إلى الحافظة!"));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    setTouched(true);
    if (!destinationUrl.trim() || !isValidUrl(destinationUrl)) return;

    const finalTaggedUrl = taggedUrl ?? destinationUrl.trim();

    setIsSubmitting(true);
    try {
      const safety = await urlsAPI.checkSafety(finalTaggedUrl);
      if (!safety.isSafe) {
        setSafetyError(
          safety.message ||
            t(
              "This URL has been flagged as unsafe (phishing or malware) and cannot be used.",
              "تم تحديد هذا الرابط كغير آمن (تصيد أو برامج ضارة) ولا يمكن استخدامه.",
            ),
        );
        setIsSubmitting(false);
        return;
      }
      setSafetyError("");
    } catch {
      // Network failure — fail open so the flow still works
    }

    try {
      if (shortenToggle) {
        const payload: any = { originalUrl: finalTaggedUrl };
        if (name.trim()) payload.title = name.trim();
        if (defaultDomainId) payload.domainId = defaultDomainId;

        const response = await createUrl.mutateAsync(payload);
        if (response.success) {
          navigate("/dashboard/links");
        }
      } else {
        addUTMLink({
          name: name.trim() || undefined,
          destinationUrl: destinationUrl.trim(),
          utmSource: utmSource.trim() || undefined,
          utmMedium: utmMedium.trim() || undefined,
          utmCampaign: utmCampaign.trim() || undefined,
          utmTerm: utmTerm.trim() || undefined,
          utmContent: utmContent.trim() || undefined,
          fullTaggedUrl: finalTaggedUrl,
        });
        toast.success(t("UTM link saved!", "تم حفظ رابط UTM!"));
        navigate("/dashboard/utm-builder");
      }
    } catch (error: any) {
      toast.error(error.message || t("Something went wrong", "حدث خطأ ما"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <Button
        variant="outline"
        className="mb-6"
        onClick={() => navigate("/dashboard/utm-builder")}
      >
        <ArrowLeft className="w-4 h-4 me-2" />
        {t("Back to UTM Builder", "العودة لمنشئ UTM")}
      </Button>

      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Tag className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              {t("Create UTM Link", "إنشاء رابط UTM")}
            </h1>
            <p className="text-muted-foreground font-body text-sm">
              {t(
                "Build a tagged URL to track campaign performance",
                "أنشئ رابطاً موسوماً لتتبع أداء حملتك",
              )}
            </p>
          </div>
        </div>

        <div className="space-y-6 mt-8">
          {/* Name (optional) */}
          <div className="space-y-2">
            <Label className="text-foreground font-body">
              {t("Name", "الاسم")}{" "}
              <span className="text-muted-foreground text-xs">
                ({t("optional", "اختياري")})
              </span>
            </Label>
            <Input
              placeholder={t(
                "e.g. Spring Sale Email Campaign",
                "مثال: حملة البريد الربيعية",
              )}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground font-body">
              {t(
                "Helps you identify this link in the list",
                "يساعدك على التعرف على هذا الرابط في القائمة",
              )}
            </p>
          </div>

          {/* Destination URL (required) */}
          <div className="space-y-2">
            <Label className="text-foreground font-body">
              {t("Destination URL", "رابط الوجهة")}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="https://example.com/landing-page"
              value={destinationUrl}
              onChange={(e) => {
                setDestinationUrl(e.target.value);
                if (touched && e.target.value.trim()) setTouched(false);
                if (safetyError) setSafetyError("");
              }}
              onBlur={() => setTouched(true)}
              className={`h-11 ${destError || safetyError ? "border-destructive focus-visible:ring-destructive" : ""}`}
              disabled={isSubmitting}
            />
            {destError && (
              <p className="text-xs text-destructive font-body">{destError}</p>
            )}
            {safetyError && (
              <p className="text-xs text-destructive font-body">
                {safetyError}
              </p>
            )}
          </div>

          {/* UTM Parameters */}
          <div className="border border-border rounded-xl p-5 bg-background space-y-4">
            <p className="text-sm font-medium text-foreground font-body">
              {t("UTM Parameters", "معاملات UTM")}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm text-foreground font-body">
                  {t("Source", "المصدر")}{" "}
                  <span className="text-muted-foreground text-xs font-mono">
                    utm_source
                  </span>
                </Label>
                <Input
                  placeholder={t(
                    "google, newsletter, twitter",
                    "google, newsletter, twitter",
                  )}
                  value={utmSource}
                  onChange={(e) => setUtmSource(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-foreground font-body">
                  {t("Medium", "الوسيلة")}{" "}
                  <span className="text-muted-foreground text-xs font-mono">
                    utm_medium
                  </span>
                </Label>
                <Input
                  placeholder={t("cpc, email, social", "cpc, email, social")}
                  value={utmMedium}
                  onChange={(e) => setUtmMedium(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-foreground font-body">
                  {t("Campaign", "الحملة")}{" "}
                  <span className="text-muted-foreground text-xs font-mono">
                    utm_campaign
                  </span>
                </Label>
                <Input
                  placeholder={t(
                    "spring_sale, product_launch",
                    "spring_sale, product_launch",
                  )}
                  value={utmCampaign}
                  onChange={(e) => setUtmCampaign(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm text-foreground font-body">
                  {t("Term", "الكلمة المفتاحية")}{" "}
                  <span className="text-muted-foreground text-xs font-mono">
                    utm_term
                  </span>
                </Label>
                <Input
                  placeholder={t(
                    "running+shoes, seo+keyword",
                    "running+shoes, seo+keyword",
                  )}
                  value={utmTerm}
                  onChange={(e) => setUtmTerm(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-foreground font-body">
                {t("Content", "المحتوى")}{" "}
                <span className="text-muted-foreground text-xs font-mono">
                  utm_content
                </span>
              </Label>
              <Input
                placeholder={t(
                  "logolink, textlink, banner_top",
                  "logolink, textlink, banner_top",
                )}
                value={utmContent}
                onChange={(e) => setUtmContent(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Live preview */}
          <div className="border border-border rounded-xl p-5 bg-background space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground font-body flex items-center gap-2">
                <Link2 className="w-4 h-4 text-primary" />
                {t("Live Preview", "معاينة مباشرة")}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                disabled={!taggedUrl}
                className="h-7 gap-1.5 text-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    {t("Copied!", "تم النسخ!")}
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    {t("Copy", "نسخ")}
                  </>
                )}
              </Button>
            </div>

            <div className="min-h-[48px] p-3 rounded-lg bg-muted/50 border border-border">
              {taggedUrl ? (
                <p
                  className="text-xs font-mono text-foreground break-all leading-relaxed"
                  dir="ltr"
                >
                  {taggedUrl}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground font-body italic">
                  {destinationUrl.trim() && !isValidUrl(destinationUrl)
                    ? t(
                        "Enter a valid URL to see preview",
                        "أدخل رابطاً صحيحاً لرؤية المعاينة",
                      )
                    : t(
                        "Your tagged URL will appear here as you type…",
                        "سيظهر رابطك الموسوم هنا أثناء الكتابة...",
                      )}
                </p>
              )}
            </div>
          </div>

          {/* Shorten toggle */}
          <div className="border border-border rounded-xl p-5 bg-background">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body font-medium text-foreground">
                  {t("Shorten this link", "اختصر هذا الرابط")}
                </p>
                <p className="text-xs text-muted-foreground font-body mt-0.5">
                  {t(
                    "Creates a short link from the tagged URL and adds it to My Links",
                    "ينشئ رابطاً قصيراً من الرابط الموسوم ويضيفه إلى روابطي",
                  )}
                </p>
              </div>
              <Switch
                checked={shortenToggle}
                onCheckedChange={setShortenToggle}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="h-12 px-6"
              onClick={() => navigate("/dashboard/utm-builder")}
              disabled={isSubmitting}
            >
              {t("Cancel", "إلغاء")}
            </Button>
            <Button
              className="flex-1 h-12 text-base bg-primary text-primary-foreground"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 me-2 animate-spin" />
                  {shortenToggle
                    ? t("Shortening…", "جاري الاختصار...")
                    : t("Saving…", "جاري الحفظ...")}
                </>
              ) : shortenToggle ? (
                t("Shorten & Save", "اختصر واحفظ")
              ) : (
                t("Save UTM Link", "احفظ رابط UTM")
              )}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateUTMLink;
