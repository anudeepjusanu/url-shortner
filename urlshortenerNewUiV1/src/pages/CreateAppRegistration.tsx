import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Apple,
  Smartphone,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { appRegistrationAPI } from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useBrandMetaTags } from "@/hooks/useBrandMetaTags";

interface ScreenParam {
  key: string;
  description: string;
}
interface ScreenMapping {
  name: string;
  path: string;
  params: ScreenParam[];
}

const TABS = ["ios", "android", "screens"] as const;
type Tab = (typeof TABS)[number];

const emptyMapping = (): ScreenMapping => ({ name: "", path: "", params: [] });

export default function CreateAppRegistration() {
  useBrandMetaTags();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const queryClient = useQueryClient();
  const { t, isAr } = useLanguage();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>("ios");

  // Form state
  const [name, setName] = useState("");
  const [bundleId, setBundleId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [iosStoreUrl, setIosStoreUrl] = useState("");
  const [packageName, setPackageName] = useState("");
  const [sha256, setSha256] = useState("");
  const [androidStoreUrl, setAndroidStoreUrl] = useState("");
  const [webFallbackUrl, setWebFallbackUrl] = useState("");
  const [screenMappings, setScreenMappings] = useState<ScreenMapping[]>([
    emptyMapping(),
  ]);

  const [formError, setFormError] = useState("");
  const [successKey, setSuccessKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Load existing record if editing
  const { data: editData } = useQuery({
    queryKey: ["app-registration", id],
    queryFn: () => appRegistrationAPI.get(id!),
    enabled: isEdit,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
  });

  useEffect(() => {
    const app = (editData as any)?.data;
    if (!app) return;
    setName(app.name ?? "");
    setBundleId(app.bundleId ?? "");
    setTeamId(app.teamId ?? "");
    setIosStoreUrl(app.iosStoreUrl ?? "");
    setPackageName(app.packageName ?? "");
    setSha256(app.sha256Fingerprint ?? "");
    setAndroidStoreUrl(app.androidStoreUrl ?? "");
    setWebFallbackUrl(app.webFallbackUrl ?? "");
    if (app.screenMappings?.length) {
      setScreenMappings(
        app.screenMappings.map((s: any) => ({
          name: s.name ?? "",
          path: s.path ?? "",
          params: s.params ?? [],
        })),
      );
    }
  }, [editData]);

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      isEdit
        ? appRegistrationAPI.update(id!, data)
        : appRegistrationAPI.create(data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["app-registrations"] });
      if (!isEdit && res?.data?.apiKey) {
        setSuccessKey(res.data.apiKey);
      } else {
        toast({ title: t("Saved successfully", "تم الحفظ بنجاح") });
        navigate("/dashboard/deep-links");
      }
    },
    onError: (err: any) => {
      const msg = err?.message ?? t("Failed to save", "فشل الحفظ");
      setFormError(msg);
      toast({ variant: "destructive", title: msg });
    },
  });

  const handleSubmit = () => {
    setFormError("");
    if (!name.trim()) {
      setFormError(t("App name is required", "اسم التطبيق مطلوب"));
      return;
    }
    if (!webFallbackUrl.trim()) {
      setFormError(
        t("Web fallback URL is required", "رابط الصفحة الاحتياطية مطلوب"),
      );
      return;
    }
    if (!bundleId.trim() && !packageName.trim()) {
      setFormError(
        t(
          "At least one of Bundle ID (iOS) or Package Name (Android) is required",
          "يجب تحديد معرف تطبيق iOS أو اسم حزمة Android على الأقل",
        ),
      );
      return;
    }

    try {
      new URL(webFallbackUrl);
    } catch {
      setFormError(
        t(
          "Web fallback URL must be a valid URL",
          "يجب أن يكون رابط الصفحة الاحتياطية صالحاً",
        ),
      );
      return;
    }

    const validMappings = screenMappings.filter(
      (m) => m.name.trim() && m.path.trim(),
    );

    createMutation.mutate({
      name: name.trim(),
      bundleId: bundleId.trim() || undefined,
      teamId: teamId.trim() || undefined,
      iosStoreUrl: iosStoreUrl.trim() || undefined,
      packageName: packageName.trim() || undefined,
      sha256Fingerprint: sha256.trim() || undefined,
      androidStoreUrl: androidStoreUrl.trim() || undefined,
      webFallbackUrl: webFallbackUrl.trim(),
      screenMappings: validMappings,
    });
  };

  const addMapping = () =>
    setScreenMappings((prev) => [...prev, emptyMapping()]);
  const removeMapping = (i: number) =>
    setScreenMappings((prev) => prev.filter((_, idx) => idx !== i));
  const updateMapping = (i: number, field: keyof ScreenMapping, value: any) =>
    setScreenMappings((prev) =>
      prev.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)),
    );

  const addParam = (i: number) =>
    setScreenMappings((prev) =>
      prev.map((m, idx) =>
        idx === i
          ? { ...m, params: [...m.params, { key: "", description: "" }] }
          : m,
      ),
    );
  const removeParam = (mi: number, pi: number) =>
    setScreenMappings((prev) =>
      prev.map((m, idx) =>
        idx === mi ? { ...m, params: m.params.filter((_, i) => i !== pi) } : m,
      ),
    );
  const updateParam = (
    mi: number,
    pi: number,
    field: keyof ScreenParam,
    value: string,
  ) =>
    setScreenMappings((prev) =>
      prev.map((m, idx) =>
        idx === mi
          ? {
              ...m,
              params: m.params.map((p, i) =>
                i === pi ? { ...p, [field]: value } : p,
              ),
            }
          : m,
      ),
    );

  const handleCopyKey = async () => {
    if (!successKey) return;
    try {
      await navigator.clipboard.writeText(successKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      toast({ variant: "destructive", title: t("Copy failed", "فشل النسخ") });
    }
  };

  const tabLabels: Record<Tab, string> = {
    ios: t("iOS", "iOS"),
    android: t("Android", "Android"),
    screens: t("Screens", "الشاشات"),
  };

  const ChevronNav = isAr ? ChevronLeft : ChevronRight;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/deep-links")}
          >
            {isAr ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isEdit
                ? t("Edit App Registration", "تعديل تسجيل التطبيق")
                : t("Register App", "تسجيل تطبيق")}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t(
                "Configure iOS / Android deep linking for your app",
                "اضبط إعدادات الروابط العميقة لنظامي iOS وAndroid",
              )}
            </p>
          </div>
        </div>

        {/* App name + web fallback (always visible) */}
        <div className="border rounded-xl p-5 bg-card space-y-4">
          <div className="space-y-1.5">
            <Label>{t("App Name", "اسم التطبيق")} *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("My Super App", "تطبيقي الرائع")}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("Web Fallback URL", "رابط الصفحة الاحتياطية")} *</Label>
            <Input
              value={webFallbackUrl}
              onChange={(e) => setWebFallbackUrl(e.target.value)}
              placeholder="https://yourapp.com/download"
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              {t(
                "Where users land when the app is not installed (desktop or in-app browser)",
                "الصفحة التي يصل إليها المستخدمون عند عدم تثبيت التطبيق (سطح المكتب أو المتصفح الداخلي)",
              )}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border rounded-xl overflow-hidden bg-card">
          <div className="flex border-b">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {tab === "ios" && <Apple className="w-4 h-4" />}
                {tab === "android" && <Smartphone className="w-4 h-4" />}
                {tabLabels[tab]}
              </button>
            ))}
          </div>

          <div className="p-5 space-y-4">
            {/* iOS tab */}
            {activeTab === "ios" && (
              <>
                <div className="space-y-1.5">
                  <Label>{t("Bundle ID", "معرف التطبيق")}</Label>
                  <Input
                    value={bundleId}
                    onChange={(e) => setBundleId(e.target.value)}
                    placeholder="com.yourcompany.app"
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t(
                      "Found in Xcode → Targets → General → Bundle Identifier",
                      "موجود في Xcode → Targets → General → Bundle Identifier",
                    )}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("Apple Team ID", "معرف فريق Apple")}</Label>
                  <Input
                    value={teamId}
                    onChange={(e) =>
                      setTeamId(
                        e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                      )
                    }
                    placeholder="ABCDE12345"
                    maxLength={10}
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t(
                      "10-character ID from Apple Developer → Membership. Required for Universal Links to work.",
                      "المعرف المكون من 10 أحرف من Apple Developer → Membership. مطلوب لعمل Universal Links.",
                    )}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("App Store URL", "رابط App Store")}</Label>
                  <Input
                    value={iosStoreUrl}
                    onChange={(e) => setIosStoreUrl(e.target.value)}
                    placeholder="https://apps.apple.com/app/id123456789"
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t(
                      "Where to send users if the app is not installed (iOS only)",
                      "حيث يتم إرسال المستخدمين إذا لم يكن التطبيق مثبتاً (iOS فقط)",
                    )}
                  </p>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 px-4 py-3 space-y-1">
                  <p className="text-xs font-semibold text-blue-800 dark:text-blue-200">
                    {t(
                      "Apple App Site Association",
                      "ملف Apple App Site Association",
                    )}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {t(
                      "The AASA file is automatically served at /.well-known/apple-app-site-association once you save this registration.",
                      "يتم تقديم ملف AASA تلقائياً على /.well-known/apple-app-site-association بمجرد حفظ هذا التسجيل.",
                    )}
                  </p>
                </div>
              </>
            )}

            {/* Android tab */}
            {activeTab === "android" && (
              <>
                <div className="space-y-1.5">
                  <Label>{t("Package Name", "اسم الحزمة")}</Label>
                  <Input
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                    placeholder="com.yourcompany.app"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>
                    {t("SHA-256 Certificate Fingerprint", "بصمة شهادة SHA-256")}
                  </Label>
                  <Input
                    value={sha256}
                    onChange={(e) => setSha256(e.target.value)}
                    placeholder="AA:BB:CC:..."
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t(
                      'Run: keytool -list -v -keystore <keystore> | grep "SHA256:"',
                      'نفّذ: keytool -list -v -keystore <keystore> | grep "SHA256:"',
                    )}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("Play Store URL", "رابط Play Store")}</Label>
                  <Input
                    value={androidStoreUrl}
                    onChange={(e) => setAndroidStoreUrl(e.target.value)}
                    placeholder="https://play.google.com/store/apps/details?id=com.yourcompany.app"
                    dir="ltr"
                  />
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 px-4 py-3 space-y-1">
                  <p className="text-xs font-semibold text-green-800 dark:text-green-200">
                    {t("Android Asset Links", "Android Asset Links")}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    {t(
                      "The assetlinks.json file is automatically served at /.well-known/assetlinks.json once you save this registration.",
                      "يتم تقديم ملف assetlinks.json تلقائياً على /.well-known/assetlinks.json بمجرد حفظ هذا التسجيل.",
                    )}
                  </p>
                </div>
              </>
            )}

            {/* Screen mappings tab */}
            {activeTab === "screens" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t(
                    "Define which screens deep links can route to. The mobile app uses these names to navigate after a deferred link match.",
                    "حدّد الشاشات التي يمكن للروابط العميقة التوجيه إليها. يستخدم التطبيق هذه الأسماء للتنقل بعد مطابقة الرابط المؤجل.",
                  )}
                </p>
                {screenMappings.map((mapping, mi) => (
                  <div
                    key={mi}
                    className="border rounded-lg p-4 space-y-3 bg-muted/30"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {t("Screen", "الشاشة")} {mi + 1}
                      </p>
                      {screenMappings.length > 1 && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => removeMapping(mi)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">
                          {t("Screen name", "اسم الشاشة")}
                        </Label>
                        <Input
                          value={mapping.name}
                          onChange={(e) =>
                            updateMapping(mi, "name", e.target.value)
                          }
                          placeholder="product"
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
                          {t("Route path", "مسار الشاشة")}
                        </Label>
                        <Input
                          value={mapping.path}
                          onChange={(e) =>
                            updateMapping(mi, "path", e.target.value)
                          }
                          placeholder="/product/:id"
                          className="h-8 text-sm"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {/* Params */}
                    {mapping.params.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          {t("Parameters", "المعاملات")}
                        </p>
                        {mapping.params.map((param, pi) => (
                          <div key={pi} className="flex items-center gap-2">
                            <Input
                              value={param.key}
                              onChange={(e) =>
                                updateParam(mi, pi, "key", e.target.value)
                              }
                              placeholder={t("key", "المفتاح")}
                              className="h-7 text-xs flex-1"
                            />
                            <Input
                              value={param.description}
                              onChange={(e) =>
                                updateParam(
                                  mi,
                                  pi,
                                  "description",
                                  e.target.value,
                                )
                              }
                              placeholder={t("description", "الوصف")}
                              className="h-7 text-xs flex-1"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                              onClick={() => removeParam(mi, pi)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs gap-1"
                      onClick={() => addParam(mi)}
                    >
                      <Plus className="w-3 h-3" />
                      {t("Add param", "إضافة معامل")}
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={addMapping}
                >
                  <Plus className="w-4 h-4" />
                  {t("Add screen", "إضافة شاشة")}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {formError && <p className="text-sm text-destructive">{formError}</p>}

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/deep-links")}
          >
            {t("Cancel", "إلغاء")}
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending && (
              <Loader2 className="w-4 h-4 animate-spin me-2" />
            )}
            {isEdit
              ? t("Save changes", "حفظ التغييرات")
              : t("Register", "تسجيل")}
          </Button>
        </div>
      </div>

      {/* Copy-once API key dialog */}
      <Dialog
        open={!!successKey}
        onOpenChange={(open) => {
          if (!open) {
            setSuccessKey(null);
            navigate("/dashboard/deep-links");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("App Registered!", "تم تسجيل التطبيق!")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {t(
                "Your API key is shown below. Copy it now and store it securely — it will be masked after you close this dialog.",
                "مفتاح API الخاص بك معروض أدناه. انسخه الآن واحفظه بأمان — سيتم إخفاؤه بعد إغلاق هذا الحوار.",
              )}
            </p>
            <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-3">
              <p className="text-xs font-mono flex-1 break-all">{successKey}</p>
              <button
                onClick={handleCopyKey}
                className="shrink-0 text-muted-foreground hover:text-primary"
              >
                {copiedKey ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t(
                "Use this key in your mobile app as a Bearer token when calling POST /api/v1/deferred-link on first launch.",
                "استخدم هذا المفتاح في تطبيقك المحمول كـ Bearer token عند استدعاء POST /api/v1/deferred-link عند التشغيل الأول.",
              )}
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setSuccessKey(null);
                navigate("/dashboard/deep-links");
              }}
            >
              {t("Done", "تم")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
