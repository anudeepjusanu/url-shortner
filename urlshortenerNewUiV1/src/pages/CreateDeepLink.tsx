import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Smartphone,
  Info,
} from "lucide-react";
import { urlsAPI, appRegistrationAPI, deepLinkAPI } from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useBrandMetaTags } from "@/hooks/useBrandMetaTags";

interface AppRegistration {
  _id: string;
  name: string;
  bundleId?: string;
  packageName?: string;
  webFallbackUrl: string;
  screenMappings: Array<{
    name: string;
    path: string;
    params?: Array<{ key: string }>;
  }>;
}

interface ShortUrl {
  _id: string;
  shortCode: string;
  customCode?: string;
  title?: string;
  originalUrl: string;
  deepLink?: {
    enabled: boolean;
    appRegistration?: any;
    screen?: string;
    params?: Record<string, string>;
    webFallbackUrl?: string;
  };
}

interface ParamEntry {
  key: string;
  value: string;
}

export default function CreateDeepLink() {
  useBrandMetaTags();
  const navigate = useNavigate();
  const { urlId } = useParams<{ urlId?: string }>();
  const isEdit = !!urlId;
  const queryClient = useQueryClient();
  const { t, isAr } = useLanguage();
  const { toast } = useToast();

  // Form state
  const [selectedUrlId, setSelectedUrlId] = useState(urlId ?? "");
  const [selectedAppId, setSelectedAppId] = useState("");
  const [selectedScreen, setSelectedScreen] = useState("");
  const [params, setParams] = useState<ParamEntry[]>([{ key: "", value: "" }]);
  const [webFallbackOverride, setWebFallbackOverride] = useState("");
  const [formError, setFormError] = useState("");

  // In create mode: only show URLs that don't already have deep linking enabled.
  // In edit mode: fetch the specific URL by ID (avoids pagination misses).
  const { data: urlsData, isLoading: urlsLoading } = useQuery({
    queryKey: ["urls-for-deep-link-create"],
    queryFn: () => urlsAPI.list({ limit: 100, deepLinkEnabled: false }),
    enabled: !isEdit,
    staleTime: 30_000,
  });

  const { data: editUrlData, isLoading: editUrlLoading } = useQuery({
    queryKey: ["url-by-id", urlId],
    queryFn: () => urlsAPI.get(urlId!),
    enabled: isEdit,
    staleTime: 0,
    gcTime: 0,
  });

  const createUrls: ShortUrl[] = (urlsData as any)?.data?.urls ?? [];
  const editUrl: ShortUrl | null = isEdit
    ? ((editUrlData as any)?.data?.url ?? null)
    : null;
  const urls: ShortUrl[] = isEdit ? (editUrl ? [editUrl] : []) : createUrls;

  // Load app registrations
  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ["app-registrations"],
    queryFn: () => appRegistrationAPI.list(),
    staleTime: 30_000,
  });
  const apps: AppRegistration[] = (appsData as any)?.data ?? [];

  // Pre-fill form when editing — driven by the targeted URL fetch, not the list
  useEffect(() => {
    if (!isEdit || !editUrl?.deepLink?.enabled) return;
    setSelectedUrlId(urlId!);
    setSelectedAppId(
      (editUrl.deepLink.appRegistration as any)?._id ??
        editUrl.deepLink.appRegistration ??
        "",
    );
    // Map null/undefined screen back to empty string for the Select control
    setSelectedScreen(editUrl.deepLink.screen ?? "");
    setWebFallbackOverride(editUrl.deepLink.webFallbackUrl ?? "");
    if (
      editUrl.deepLink.params &&
      Object.keys(editUrl.deepLink.params).length > 0
    ) {
      setParams(
        Object.entries(editUrl.deepLink.params).map(([key, value]) => ({
          key,
          value: String(value),
        })),
      );
    }
  }, [editUrl, urlId, isEdit]);

  const selectedApp = apps.find((a) => a._id === selectedAppId);
  const screenOptions = selectedApp?.screenMappings ?? [];

  const saveMutation = useMutation({
    mutationFn: ({
      urlId,
      payload,
    }: {
      urlId: string;
      payload: {
        enabled: boolean;
        appRegistration?: string | null;
        screen?: string | null;
        params?: Record<string, string> | null;
        webFallbackUrl?: string | null;
      };
    }) => deepLinkAPI.updateDeepLink(urlId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deep-linked-urls"] });
      queryClient.invalidateQueries({ queryKey: ["urls-for-deep-link"] });
      toast({ title: t("Deep link saved", "تم حفظ الرابط العميق") });
      navigate("/dashboard/deep-links");
    },
    onError: (err: any) => {
      const msg = err?.message ?? t("Failed to save", "فشل الحفظ");
      setFormError(msg);
      toast({ variant: "destructive", title: msg });
    },
  });

  const handleSubmit = () => {
    setFormError("");

    if (!selectedUrlId) {
      setFormError(
        t(
          "Select a short URL to attach the deep link to",
          "اختر رابطاً مختصراً لإرفاق الرابط العميق به",
        ),
      );
      return;
    }
    if (!selectedAppId) {
      setFormError(t("Select an app registration", "اختر تسجيل تطبيق"));
      return;
    }

    if (webFallbackOverride) {
      try {
        new URL(webFallbackOverride);
      } catch {
        setFormError(
          t(
            "Web fallback override must be a valid URL",
            "يجب أن يكون رابط الاحتياطي صالحاً",
          ),
        );
        return;
      }
    }

    const paramsRecord: Record<string, string> = {};
    for (const { key, value } of params) {
      if (key.trim()) paramsRecord[key.trim()] = value.trim();
    }

    saveMutation.mutate({
      urlId: selectedUrlId,
      payload: {
        enabled: true,
        appRegistration: selectedAppId,
        // "_home" is a UI sentinel meaning "open home screen" — translate to null before saving
        screen:
          selectedScreen && selectedScreen !== "_home" ? selectedScreen : null,
        params: Object.keys(paramsRecord).length > 0 ? paramsRecord : null,
        webFallbackUrl: webFallbackOverride.trim() || null,
      },
    });
  };

  const addParam = () => setParams((prev) => [...prev, { key: "", value: "" }]);
  const removeParam = (i: number) =>
    setParams((prev) => prev.filter((_, idx) => idx !== i));
  const updateParam = (i: number, field: "key" | "value", val: string) =>
    setParams((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, [field]: val } : p)),
    );

  const getUrlLabel = (url: ShortUrl) => {
    const code = url.customCode || url.shortCode;
    return url.title
      ? `${url.title} (/${code})`
      : `/${code} — ${url.originalUrl.slice(0, 50)}`;
  };

  const isLoading = (isEdit ? editUrlLoading : urlsLoading) || appsLoading;

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto space-y-6">
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
                ? t("Edit Deep Link", "تعديل الرابط العميق")
                : t("New Deep Link", "رابط عميق جديد")}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t(
                "Attach deep link routing to an existing short URL",
                "أرفق توجيه الرابط العميق برابط مختصر موجود",
              )}
            </p>
          </div>
        </div>

        {/* No apps warning */}
        {!appsLoading && apps.length === 0 && (
          <div className="flex items-start gap-3 border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30 rounded-xl px-4 py-3">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="space-y-1.5">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {t(
                  "You need to register an app first before creating a deep link.",
                  "تحتاج إلى تسجيل تطبيق أولاً قبل إنشاء رابط عميق.",
                )}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate("/dashboard/deep-links/register-app")}
              >
                {t("Register an app", "تسجيل تطبيق")}
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="border rounded-xl p-5 bg-card space-y-5">
            {/* URL picker */}
            <div className="space-y-1.5">
              <Label>{t("Short URL", "الرابط المختصر")} *</Label>
              {isEdit ? (
                <div className="bg-muted rounded-lg px-3 py-2.5 text-sm font-mono">
                  {editUrl ? getUrlLabel(editUrl) : (urlId ?? "…")}
                </div>
              ) : (
                <Select value={selectedUrlId} onValueChange={setSelectedUrlId}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t(
                        "Select a short URL…",
                        "اختر رابطاً مختصراً…",
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {urls.map((url) => (
                      <SelectItem key={url._id} value={url._id}>
                        {getUrlLabel(url)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-muted-foreground">
                {t(
                  "The deep link will be accessible at /dl/{shortCode}",
                  "سيكون الرابط العميق متاحاً على /dl/{shortCode}",
                )}
              </p>
            </div>

            {/* App picker */}
            <div className="space-y-1.5">
              <Label>{t("App Registration", "تسجيل التطبيق")} *</Label>
              <Select
                value={selectedAppId}
                onValueChange={(val) => {
                  setSelectedAppId(val);
                  setSelectedScreen("");
                }}
                disabled={apps.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      apps.length === 0
                        ? t("No apps registered", "لا توجد تطبيقات مسجّلة")
                        : t("Select app…", "اختر تطبيقاً…")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {apps.map((app) => (
                    <SelectItem key={app._id} value={app._id}>
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />
                        {app.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Screen picker (only if app has screen mappings) */}
            {selectedApp && (
              <div className="space-y-1.5">
                <Label>
                  {t("Target Screen", "الشاشة المستهدفة")}
                  <span className="text-muted-foreground ms-1 font-normal text-xs">
                    {t("(optional)", "(اختياري)")}
                  </span>
                </Label>
                {screenOptions.length > 0 ? (
                  <Select
                    value={selectedScreen}
                    onValueChange={setSelectedScreen}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t(
                          "Home screen (default)",
                          "الشاشة الرئيسية (افتراضي)",
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_home">
                        {t(
                          "Home screen (default)",
                          "الشاشة الرئيسية (افتراضي)",
                        )}
                      </SelectItem>
                      {screenOptions.map((s) => (
                        <SelectItem key={s.name} value={s.name}>
                          {s.name} —{" "}
                          <span className="font-mono text-xs">{s.path}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-xs text-muted-foreground border rounded-lg px-3 py-2">
                    {t(
                      "No screens configured for this app. The app will open to its home screen.",
                      "لا توجد شاشات مهيأة لهذا التطبيق. سيفتح التطبيق على شاشته الرئيسية.",
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Params */}
            <div className="space-y-2">
              <Label>
                {t("Parameters", "المعاملات")}
                <span className="text-muted-foreground ms-1 font-normal text-xs">
                  {t("(optional)", "(اختياري)")}
                </span>
              </Label>
              {params.map((param, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={param.key}
                    onChange={(e) => updateParam(i, "key", e.target.value)}
                    placeholder={t("key", "المفتاح")}
                    className="flex-1 h-8 text-sm"
                    dir="ltr"
                  />
                  <Input
                    value={param.value}
                    onChange={(e) => updateParam(i, "value", e.target.value)}
                    placeholder={t("value", "القيمة")}
                    className="flex-1 h-8 text-sm"
                    dir="ltr"
                  />
                  {params.length > 1 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                      onClick={() => removeParam(i)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs gap-1"
                onClick={addParam}
              >
                <Plus className="w-3.5 h-3.5" />
                {t("Add parameter", "إضافة معامل")}
              </Button>
              <p className="text-xs text-muted-foreground">
                {t(
                  "Passed to the app after deferred link matching or Universal Link resolution",
                  "يتم تمريرها إلى التطبيق بعد مطابقة الرابط المؤجل أو حل Universal Link",
                )}
              </p>
            </div>

            {/* Web fallback override */}
            <div className="space-y-1.5">
              <Label>
                {t("Web Fallback Override", "تجاوز الصفحة الاحتياطية")}
                <span className="text-muted-foreground ms-1 font-normal text-xs">
                  {t("(optional)", "(اختياري)")}
                </span>
              </Label>
              <Input
                value={webFallbackOverride}
                onChange={(e) => setWebFallbackOverride(e.target.value)}
                placeholder={
                  selectedApp?.webFallbackUrl ??
                  "https://yourapp.com/specific-page"
                }
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground">
                {selectedApp
                  ? t(
                      `Leave empty to use the app's default: ${selectedApp.webFallbackUrl}`,
                      `اتركه فارغاً لاستخدام الافتراضي للتطبيق: ${selectedApp.webFallbackUrl}`,
                    )
                  : t(
                      "Override the app-level web fallback URL for this specific deep link",
                      "تجاوز رابط الصفحة الاحتياطية على مستوى التطبيق لهذا الرابط العميق تحديداً",
                    )}
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {formError && <p className="text-sm text-destructive">{formError}</p>}

        {/* Actions */}
        {!isLoading && (
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard/deep-links")}
            >
              {t("Cancel", "إلغاء")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saveMutation.isPending || apps.length === 0}
            >
              {saveMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin me-2" />
              )}
              {isEdit
                ? t("Save changes", "حفظ التغييرات")
                : t("Create Deep Link", "إنشاء رابط عميق")}
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
