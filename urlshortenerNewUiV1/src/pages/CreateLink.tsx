import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ArrowRight, QrCode, Pencil, Plus, Globe, Loader2, Tag, Copy, Check } from "lucide-react";
import { useCreateUrl, useAvailableDomains } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import amplitudeService from "@/services/amplitude";

const CreateLink = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [originalUrl, setOriginalUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [title, setTitle] = useState("");
  const [generateQR, setGenerateQR] = useState(false);
  const [selectedDomainId, setSelectedDomainId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [copiedUtmUrl, setCopiedUtmUrl] = useState(false);

  // UTM state
  const [utmEnabled, setUtmEnabled] = useState(false);
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmTerm, setUtmTerm] = useState("");
  const [utmContent, setUtmContent] = useState("");

  // Fetch available domains from API
  const { data: domainsData, isLoading: domainsLoading, isError: domainsError } = useAvailableDomains();
  const createUrl = useCreateUrl();

  // Extract domains array from response
  const availableDomains = Array.isArray(domainsData?.data?.domains)
    ? domainsData.data.domains.filter((d: any) => d && d.id && d.fullDomain)
    : [];

  // Set default domain when domains are loaded
  useEffect(() => {
    if (availableDomains.length > 0) {
      const defaultDomain = availableDomains.find((d: any) => d.isDefault);
      if (defaultDomain) {
        setSelectedDomainId(defaultDomain.id);
      } else {
        setSelectedDomainId(availableDomains[0].id);
      }
    }
  }, [availableDomains]);

  // Show error if domains fail to load
  useEffect(() => {
    if (domainsError) {
      toast({
        title: t("Warning", "تحذير"),
        description: t("Failed to load domains. You can still create links.", "فشل تحميل النطاقات. يمكنك إنشاء الروابط."),
        variant: "destructive",
      });
    }
  }, [domainsError, toast, t]);

  // Build live destination URL preview with UTM params appended
  const utmPreviewUrl = useMemo(() => {
    if (!utmEnabled || !originalUrl.trim()) return null;
    const hasAnyUtm = utmSource.trim() || utmMedium.trim() || utmCampaign.trim() || utmTerm.trim() || utmContent.trim();
    if (!hasAnyUtm) return null;
    try {
      const url = new URL(originalUrl.trim());
      const params = url.searchParams;
      if (utmSource.trim()) params.set("utm_source", utmSource.trim());
      if (utmMedium.trim()) params.set("utm_medium", utmMedium.trim());
      if (utmCampaign.trim()) params.set("utm_campaign", utmCampaign.trim());
      if (utmTerm.trim()) params.set("utm_term", utmTerm.trim());
      if (utmContent.trim()) params.set("utm_content", utmContent.trim());
      return url.toString();
    } catch {
      return null;
    }
  }, [utmEnabled, originalUrl, utmSource, utmMedium, utmCampaign, utmTerm, utmContent]);

  const handleSubmit = async () => {
    if (!originalUrl.trim()) {
      toast({
        title: t("Error", "خطأ"),
        description: t("Please enter a URL", "الرجاء إدخال رابط"),
        variant: "destructive",
      });
      return;
    }

    // Validate URL format
    try {
      new URL(originalUrl);
    } catch {
      toast({
        title: t("Error", "خطأ"),
        description: t("Please enter a valid URL", "الرجاء إدخال رابط صحيح"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        originalUrl: originalUrl.trim(),
      };

      if (customAlias.trim()) {
        payload.customCode = customAlias.trim();
      }

      if (title.trim()) {
        payload.title = title.trim();
      }

      if (selectedDomainId) {
        payload.domainId = selectedDomainId;
      }

      if (generateQR) {
        payload.generateQRCode = true;
      }

      // Only include UTM params if the toggle is on at save time (req 8)
      if (utmEnabled) {
        const utm: Record<string, string> = {};
        if (utmSource.trim()) utm.source = utmSource.trim();
        if (utmMedium.trim()) utm.medium = utmMedium.trim();
        if (utmCampaign.trim()) utm.campaign = utmCampaign.trim();
        if (utmTerm.trim()) utm.term = utmTerm.trim();
        if (utmContent.trim()) utm.content = utmContent.trim();
        if (Object.keys(utm).length > 0) {
          payload.utm = utm;
        }
      }

      const response = await createUrl.mutateAsync(payload);

      if (response.success) {
        amplitudeService.track('Link Creation');
        toast({
          title: t("Success", "نجح"),
          description: t("Link created successfully", "تم إنشاء الرابط بنجاح"),
        });
        navigate("/dashboard/links");
      }
    } catch (error: any) {
      toast({
        title: t("Error", "خطأ"),
        description: error.message || t("Failed to create link", "فشل إنشاء الرابط"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <Button
        variant="outline"
        className="mb-6"
        onClick={() => navigate("/dashboard/links")}
      >
        <ArrowLeft className="w-4 h-4 me-2" />
        {t("Back My Links", "العودة لروابطي")}
      </Button>

      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">
          {t("Create Short Link", "أنشئ رابط قصير")}
        </h1>
        <p className="text-muted-foreground font-body mb-8">
          {t("Convert your long URL into a short, shareable link", "حوّل رابطك الطويل إلى رابط قصير قابل للمشاركة")}
        </p>

        <div className="space-y-6">
          {/* Original URL */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-foreground">
              <Pencil className="w-3.5 h-3.5" />
              {t("Original URL", "الرابط الأصلي")} *
            </Label>
            <Input
              placeholder="https://example.com/your-long-url"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              className="h-12"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground font-body">
              {t("Enter the long URL you want to shorten", "أدخل الرابط الطويل اللي تبي تختصره")}
            </p>
          </div>

          {/* Title (Optional) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-foreground">
              <Pencil className="w-3.5 h-3.5" />
              {t("Title (Optional)", "العنوان (اختياري)")}
            </Label>
            <Input
              placeholder={t("My Link", "رابطي")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-12"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground font-body">
              {t("Give your link a memorable name", "أعط رابطك اسماً يسهل تذكره")}
            </p>
          </div>

          {/* Domain */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-foreground">
              <Plus className="w-3.5 h-3.5" />
              {t("Domain", "الدومين")}
            </Label>
            {domainsLoading ? (
              <div className="flex items-center justify-center h-12 border border-border rounded-md">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : availableDomains.length > 0 ? (
              <select
                value={selectedDomainId}
                onChange={(e) => setSelectedDomainId(e.target.value)}
                className="w-full h-12 rounded-md border border-input bg-background px-3 py-2 text-sm font-body text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={isSubmitting}
              >
                {availableDomains.map((domain: any) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.fullDomain} {domain.isDefault ? `(${t("Default", "افتراضي")})` : ''}
                  </option>
                ))}
              </select>
            ) : domainsError ? (
              <div className="flex items-center justify-center h-12 border border-border rounded-md text-sm text-muted-foreground">
                {t("Failed to load domains", "فشل تحميل النطاقات")}
              </div>
            ) : (
              <div className="flex items-center justify-center h-12 border border-border rounded-md text-sm text-muted-foreground">
                {t("No domains available", "لا توجد نطاقات متاحة")}
              </div>
            )}
            <p className="text-xs text-muted-foreground font-body">
              {t("Your Short Link:", "رابطك القصير:")}{" "}
              <span className="text-primary">
                {selectedDomainId
                  ? `${availableDomains.find((d: any) => d.id === selectedDomainId)?.shortUrl || 'https://...'}/${customAlias || "your-code"}`
                  : `https://.../${customAlias || "your-code"}`
                }
              </span>
            </p>
            <div className="flex items-center gap-2 mt-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <Globe className="w-4 h-4 text-primary shrink-0" />
              <p className="text-xs font-body text-foreground/70">
                {t("Want to use your own brand domain?", "تبي تستخدم دومين علامتك التجارية؟")}{" "}
                <Link to="/dashboard/domains" className="text-primary font-semibold hover:underline">
                  {t("Add a custom domain", "أضف دومين مخصص")}
                </Link>
              </p>
            </div>
          </div>

          {/* Custom Alias */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-foreground">
              <Plus className="w-3.5 h-3.5" />
              {t("Custom Alias (Optional)", "اسم مخصص (اختياري)")}
            </Label>
            <div className="flex">
              <div className="flex items-center px-3 bg-muted border border-e-0 border-border rounded-s-md text-sm text-muted-foreground font-body">
                {selectedDomainId
                  ? `${availableDomains.find((d: any) => d.id === selectedDomainId)?.fullDomain || '...'}/`
                  : '.../'}
              </div>
              <Input
                placeholder={t("mycustomlink", "رابطي_المخصص")}
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value)}
                className="h-12 rounded-s-none"
                disabled={isSubmitting}
              />
            </div>
            <p className="text-xs text-muted-foreground font-body">
              {t("Leave empty for auto generated code", "اتركه فاضي لكود تلقائي")}
            </p>
          </div>

          {/* QR Code toggle */}
          <div className="border border-border rounded-xl p-5 bg-background">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-body font-medium text-foreground">
                    {t("Generate QR Code", "إنشاء كود QR")}
                  </p>
                  <p className="text-xs text-muted-foreground font-body">
                    {t("Customize Settings", "تخصيص الإعدادات")}
                  </p>
                </div>
              </div>
              <Switch checked={generateQR} onCheckedChange={setGenerateQR} />
            </div>
          </div>

          {/* UTM Parameters toggle */}
          <div className="border border-border rounded-xl p-5 bg-background">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Tag className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-body font-medium text-foreground">
                    {t("Add UTM Parameters", "إضافة معاملات UTM")}
                  </p>
                  <p className="text-xs text-muted-foreground font-body">
                    {t("Track campaign performance in analytics", "تتبع أداء الحملة في التحليلات")}
                  </p>
                </div>
              </div>
              <Switch
                checked={utmEnabled}
                onCheckedChange={setUtmEnabled}
                disabled={isSubmitting}
              />
            </div>

            {/* UTM Fields — visible only when toggle is on (req 4, 6) */}
            {utmEnabled && (
              <div className="mt-5 pt-5 border-t border-border space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* UTM Source */}
                  <div className="space-y-1.5">
                    <Label className="text-sm text-foreground font-body">
                      {t("Source", "المصدر")}{" "}
                      <span className="text-muted-foreground text-xs font-mono">utm_source</span>
                    </Label>
                    <Input
                      placeholder={t("google, newsletter, twitter", "google, newsletter, twitter")}
                      value={utmSource}
                      onChange={(e) => setUtmSource(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* UTM Medium */}
                  <div className="space-y-1.5">
                    <Label className="text-sm text-foreground font-body">
                      {t("Medium", "الوسيلة")}{" "}
                      <span className="text-muted-foreground text-xs font-mono">utm_medium</span>
                    </Label>
                    <Input
                      placeholder={t("cpc, email, social", "cpc, email, social")}
                      value={utmMedium}
                      onChange={(e) => setUtmMedium(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* UTM Campaign */}
                  <div className="space-y-1.5">
                    <Label className="text-sm text-foreground font-body">
                      {t("Campaign", "الحملة")}{" "}
                      <span className="text-muted-foreground text-xs font-mono">utm_campaign</span>
                    </Label>
                    <Input
                      placeholder={t("spring_sale, product_launch", "spring_sale, product_launch")}
                      value={utmCampaign}
                      onChange={(e) => setUtmCampaign(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* UTM Term */}
                  <div className="space-y-1.5">
                    <Label className="text-sm text-foreground font-body">
                      {t("Term", "الكلمة المفتاحية")}{" "}
                      <span className="text-muted-foreground text-xs font-mono">utm_term</span>
                    </Label>
                    <Input
                      placeholder={t("running+shoes, seo+keyword", "running+shoes, seo+keyword")}
                      value={utmTerm}
                      onChange={(e) => setUtmTerm(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* UTM Content — full width */}
                <div className="space-y-1.5">
                  <Label className="text-sm text-foreground font-body">
                    {t("Content", "المحتوى")}{" "}
                    <span className="text-muted-foreground text-xs font-mono">utm_content</span>
                  </Label>
                  <Input
                    placeholder={t("logolink, textlink, banner_top", "logolink, textlink, banner_top")}
                    value={utmContent}
                    onChange={(e) => setUtmContent(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Live destination URL preview with copy button */}
                {utmPreviewUrl && (
                  <div className="p-3 rounded-lg bg-muted/60 border border-border">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-medium text-muted-foreground">
                        {t("Destination URL Preview", "معاينة رابط الوجهة")}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(utmPreviewUrl);
                          setCopiedUtmUrl(true);
                          setTimeout(() => setCopiedUtmUrl(false), 2000);
                        }}
                        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                        title={t("Copy URL", "نسخ الرابط")}
                      >
                        {copiedUtmUrl ? (
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
                      </button>
                    </div>
                    <p className="text-xs font-mono text-foreground break-all leading-relaxed">
                      {utmPreviewUrl}
                    </p>
                  </div>
                )}

                <p className="text-xs text-muted-foreground font-body">
                  {t(
                    "UTM parameters will be appended to the destination URL when the link is visited.",
                    "ستضاف معاملات UTM إلى رابط الوجهة عند زيارة الرابط."
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1 h-12 text-base bg-primary text-primary-foreground"
              onClick={handleSubmit}
              disabled={isSubmitting || !originalUrl.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 me-2 animate-spin" />
                  {t("Creating...", "جاري الإنشاء...")}
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 me-2" />
                  {t("Create Short Link", "أنشئ الرابط القصير")}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateLink;
