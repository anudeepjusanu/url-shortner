import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Copy,
  CheckCircle2,
  Loader2,
  Smartphone,
  Apple,
  AlertTriangle,
} from "lucide-react";
import { appRegistrationAPI } from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useBrandMetaTags } from "@/hooks/useBrandMetaTags";

interface ScreenMapping {
  name: string;
  path: string;
  params?: Array<{ key: string; description: string }>;
}

interface AppRegistration {
  _id: string;
  name: string;
  bundleId?: string;
  iosStoreUrl?: string;
  packageName?: string;
  sha256Fingerprint?: string;
  androidStoreUrl?: string;
  webFallbackUrl: string;
  screenMappings: ScreenMapping[];
  apiKey: string;
  isActive: boolean;
  createdAt: string;
}

export default function AppRegistrations() {
  useBrandMetaTags();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [deleteTarget, setDeleteTarget] = useState<AppRegistration | null>(
    null,
  );
  const [rotateTarget, setRotateTarget] = useState<AppRegistration | null>(
    null,
  );
  const [rotateAcknowledged, setRotateAcknowledged] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["app-registrations"],
    queryFn: () => appRegistrationAPI.list(),
    staleTime: 30_000,
  });

  const apps: AppRegistration[] = (data as any)?.data ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => appRegistrationAPI.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-registrations"] });
      setDeleteTarget(null);
      toast({ title: t("App registration deleted", "تم حذف تسجيل التطبيق") });
    },
    onError: () =>
      toast({ variant: "destructive", title: t("Delete failed", "فشل الحذف") }),
  });

  const rotateMutation = useMutation({
    mutationFn: (id: string) => appRegistrationAPI.rotateKey(id),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["app-registrations"] });
      setRotateTarget(null);
      setRotateAcknowledged(false);
      setNewApiKey(res?.apiKey ?? null);
    },
    onError: () =>
      toast({
        variant: "destructive",
        title: t("Key rotation failed", "فشل تدوير المفتاح"),
      }),
  });

  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      toast({ variant: "destructive", title: t("Copy failed", "فشل النسخ") });
    }
  };

  const openRotate = (app: AppRegistration) => {
    setRotateTarget(app);
    setRotateAcknowledged(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("App Registrations", "تسجيلات التطبيقات")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t(
                "Register your iOS and Android apps to enable deep linking",
                "سجّل تطبيقاتك لنظامي iOS وAndroid لتفعيل الروابط العميقة",
              )}
            </p>
          </div>
          <Button
            onClick={() => navigate("/dashboard/deep-links/register-app")}
            className="shrink-0"
          >
            <Plus className="w-4 h-4 me-2" />
            {t("Register App", "تسجيل تطبيق")}
          </Button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="text-center py-20 text-muted-foreground">
            {t(
              "Failed to load app registrations",
              "فشل تحميل تسجيلات التطبيقات",
            )}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && apps.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <Smartphone className="w-16 h-16 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground">
              {t("No apps registered yet", "لا توجد تطبيقات مسجّلة بعد")}
            </p>
            <Button
              onClick={() => navigate("/dashboard/deep-links/register-app")}
            >
              <Plus className="w-4 h-4 me-2" />
              {t("Register your first app", "سجّل أول تطبيق")}
            </Button>
          </div>
        )}

        {/* App cards */}
        {!isLoading && apps.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {apps.map((app) => (
              <div
                key={app._id}
                className="border rounded-xl p-5 space-y-4 bg-card shadow-sm"
              >
                {/* Name + status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {app.name}
                    </p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {app.bundleId && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] gap-1"
                        >
                          <Apple className="w-3 h-3" />
                          iOS
                        </Badge>
                      )}
                      {app.packageName && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] gap-1"
                        >
                          <Smartphone className="w-3 h-3" />
                          Android
                        </Badge>
                      )}
                      <Badge
                        variant={app.isActive ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {app.isActive
                          ? t("Active", "نشط")
                          : t("Inactive", "معطّل")}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() =>
                        navigate(
                          `/dashboard/deep-links/register-app/${app._id}/edit`,
                        )
                      }
                      title={t("Edit", "تعديل")}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(app)}
                      title={t("Delete", "حذف")}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Platform details */}
                {app.bundleId && (
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">
                      {t("Bundle ID", "معرف التطبيق iOS")}
                    </p>
                    <p className="text-xs font-mono">{app.bundleId}</p>
                  </div>
                )}
                {app.packageName && (
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">
                      {t("Package Name", "اسم الحزمة Android")}
                    </p>
                    <p className="text-xs font-mono">{app.packageName}</p>
                  </div>
                )}

                {/* Web fallback */}
                <div className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">
                    {t("Web Fallback", "الصفحة الاحتياطية")}
                  </p>
                  <p className="text-xs truncate text-foreground">
                    {app.webFallbackUrl}
                  </p>
                </div>

                {/* Screen mappings count */}
                {app.screenMappings?.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {app.screenMappings.length}{" "}
                    {t("screen mapping(s) configured", "تعيين شاشة مهيأ")}
                  </p>
                )}

                {/* API key (masked) */}
                <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
                  <p className="text-xs font-mono flex-1 truncate text-muted-foreground">
                    {t("API Key:", "مفتاح API:")} {app.apiKey}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1 shrink-0"
                    onClick={() => openRotate(app)}
                  >
                    <RotateCcw className="w-3 h-3" />
                    {t("Rotate", "تدوير")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("Delete App Registration?", "حذف تسجيل التطبيق؟")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "This will permanently delete the registration and revoke its API key. Any deep links using this app will stop routing to the app.",
                "سيؤدي هذا إلى حذف التسجيل بشكل دائم وإلغاء مفتاح API الخاص به. ستتوقف جميع الروابط العميقة التي تستخدم هذا التطبيق عن التوجيه إليه.",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel", "إلغاء")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget._id)
              }
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin me-2" />
              ) : null}
              {t("Delete", "حذف")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rotate key confirm */}
      <Dialog
        open={!!rotateTarget}
        onOpenChange={(open) => !open && setRotateTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Rotate API Key", "تدوير مفتاح API")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 dark:border-amber-700 dark:bg-amber-950/30">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {t(
                  "The old API key will stop working immediately. You must update your mobile app with the new key before deploying. This is only safe to do before the app ships.",
                  "سيتوقف مفتاح API القديم عن العمل فوراً. يجب عليك تحديث تطبيقك المحمول بالمفتاح الجديد قبل النشر. هذا الإجراء آمن فقط قبل نشر التطبيق.",
                )}
              </p>
            </div>
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rotateAcknowledged}
                onChange={(e) => setRotateAcknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-primary cursor-pointer"
              />
              <span className="text-sm text-foreground">
                {t(
                  "I understand the old key will stop working immediately",
                  "أفهم أن المفتاح القديم سيتوقف عن العمل فوراً",
                )}
              </span>
            </label>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRotateTarget(null)}>
              {t("Cancel", "إلغاء")}
            </Button>
            <Button
              variant="destructive"
              disabled={!rotateAcknowledged || rotateMutation.isPending}
              onClick={() =>
                rotateTarget && rotateMutation.mutate(rotateTarget._id)
              }
            >
              {rotateMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin me-2" />
              )}
              {t("Rotate Key", "تدوير المفتاح")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New API key display (copy-once dialog) */}
      <Dialog
        open={!!newApiKey}
        onOpenChange={(open) => !open && setNewApiKey(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("New API Key Generated", "تم إنشاء مفتاح API جديد")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {t(
                "Copy this key now — it will be masked after you close this dialog.",
                "انسخ هذا المفتاح الآن — سيتم إخفاؤه بعد إغلاق هذا الحوار.",
              )}
            </p>
            <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2.5">
              <p className="text-xs font-mono flex-1 break-all">{newApiKey}</p>
              <button
                onClick={() => newApiKey && handleCopyKey(newApiKey)}
                className="shrink-0 text-muted-foreground hover:text-primary"
              >
                {copiedKey ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setNewApiKey(null)}>
              {t("I've copied it", "لقد نسخته")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
