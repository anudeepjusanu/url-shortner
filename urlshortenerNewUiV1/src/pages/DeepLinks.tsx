import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBrandMetaTags } from "@/hooks/useBrandMetaTags";

// Derive the backend root URL from the API URL (strip /api suffix).
// In dev: http://localhost:3015/api → http://localhost:3015
// In prod: https://snip.sa/api → https://snip.sa
const SHORT_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:3015/api"
).replace(/\/api\/?$/, "");
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Plus,
  Smartphone,
  Apple,
  Edit2,
  Trash2,
  Search,
  Loader2,
  ExternalLink,
  Copy,
  CheckCircle2,
  Settings2,
} from "lucide-react";
import { urlsAPI, deepLinkAPI } from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface DeepLinkedUrl {
  _id: string;
  shortCode: string;
  customCode?: string;
  originalUrl: string;
  title?: string;
  shortUrl: string;
  isActive: boolean;
  clickCount: number;
  deepLink: {
    enabled: boolean;
    appRegistration?: {
      _id: string;
      name: string;
      bundleId?: string;
      packageName?: string;
    } | null;
    screen?: string | null;
    params?: Record<string, string> | null;
    webFallbackUrl?: string | null;
  };
  createdAt: string;
}

type ViewTab = "deep-links" | "apps";

export default function DeepLinks() {
  useBrandMetaTags();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [tab, setTab] = useState<ViewTab>("deep-links");
  const [search, setSearch] = useState("");
  const [disableTarget, setDisableTarget] = useState<DeepLinkedUrl | null>(
    null,
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["deep-linked-urls"],
    queryFn: () => urlsAPI.list({ deepLinkEnabled: true, limit: 100 }),
    staleTime: 30_000,
  });

  const allItems: DeepLinkedUrl[] =
    (data as any)?.data?.urls ?? (data as any)?.data ?? [];
  const items = search.trim()
    ? allItems.filter(
        (item) =>
          item.title?.toLowerCase().includes(search.toLowerCase()) ||
          item.shortCode?.toLowerCase().includes(search.toLowerCase()) ||
          item.originalUrl?.toLowerCase().includes(search.toLowerCase()) ||
          item.deepLink?.screen?.toLowerCase().includes(search.toLowerCase()),
      )
    : allItems;

  const disableMutation = useMutation({
    mutationFn: (item: DeepLinkedUrl) =>
      deepLinkAPI.updateDeepLink(item._id, {
        enabled: false,
        // Preserve the existing config so "Disable" is a reversible toggle
        appRegistration: item.deepLink.appRegistration?._id ?? null,
        screen: item.deepLink.screen ?? null,
        params: item.deepLink.params ?? null,
        webFallbackUrl: item.deepLink.webFallbackUrl ?? null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deep-linked-urls"] });
      setDisableTarget(null);
      toast({ title: t("Deep link disabled", "تم تعطيل الرابط العميق") });
    },
    onError: () =>
      toast({
        variant: "destructive",
        title: t("Action failed", "فشل الإجراء"),
      }),
  });

  const handleCopyLink = async (item: DeepLinkedUrl) => {
    const code = item.customCode || item.shortCode;
    const dlUrl = `${SHORT_BASE}/dl/${code}`;
    try {
      await navigator.clipboard.writeText(dlUrl);
      setCopiedId(item._id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({ variant: "destructive", title: t("Copy failed", "فشل النسخ") });
    }
  };

  const getCode = (item: DeepLinkedUrl) => item.customCode || item.shortCode;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("Deep Links", "الروابط العميقة")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t(
                "Route users directly into your app screen, with a store redirect for non-installed apps",
                "وجّه المستخدمين مباشرةً إلى شاشة التطبيق، مع إعادة التوجيه إلى المتجر إذا لم يكن التطبيق مثبتاً",
              )}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard/deep-links/apps")}
            >
              <Settings2 className="w-4 h-4 me-2" />
              {t("App Registrations", "تسجيلات التطبيقات")}
            </Button>
            <Button onClick={() => navigate("/dashboard/deep-links/create")}>
              <Plus className="w-4 h-4 me-2" />
              {t("New Deep Link", "رابط عميق جديد")}
            </Button>
          </div>
        </div>

        {/* Info banner */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 px-4 py-3 space-y-1">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
            {t("How deep links work", "كيف تعمل الروابط العميقة")}
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            {t(
              "Share /dl/{code} links. iOS/Android users with the app installed open the exact screen. Users without the app are sent to the store, and the app opens the right screen on first launch. Desktop and in-app browsers (Instagram, WhatsApp) see the web fallback page.",
              "شارك روابط /dl/{code}. يفتح المستخدمون الذين لديهم التطبيق مثبتاً الشاشة المحددة مباشرةً. يُوجَّه المستخدمون بدون التطبيق إلى المتجر، ويفتح التطبيق الشاشة الصحيحة عند أول تشغيل. يرى مستخدمو سطح المكتب والمتصفحات الداخلية صفحة الاحتياطية.",
            )}
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Search deep links…", "ابحث في الروابط العميقة…")}
            className="ps-9"
          />
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
            {t("Failed to load deep links", "فشل تحميل الروابط العميقة")}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && items.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <Smartphone className="w-16 h-16 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground">
              {search
                ? t("No results found", "لا توجد نتائج")
                : t(
                    "No deep links configured yet",
                    "لا توجد روابط عميقة مهيأة بعد",
                  )}
            </p>
            {!search && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => navigate("/dashboard/deep-links/apps")}
                >
                  <Settings2 className="w-4 h-4 me-2" />
                  {t("1. Register your app first", "1. سجّل تطبيقك أولاً")}
                </Button>
                <Button
                  onClick={() => navigate("/dashboard/deep-links/create")}
                >
                  <Plus className="w-4 h-4 me-2" />
                  {t("2. Create a deep link", "2. أنشئ رابطاً عميقاً")}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Cards */}
        {!isLoading && items.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {items.map((item) => {
              const code = getCode(item);
              const dlUrl = `${SHORT_BASE}/dl/${code}`;
              return (
                <div
                  key={item._id}
                  className={cn(
                    "border rounded-xl p-4 space-y-3 bg-card shadow-sm",
                    !item.isActive && "opacity-60",
                  )}
                >
                  {/* Title + actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {item.title || item.shortCode}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                        {item.originalUrl}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() =>
                          navigate(`/dashboard/deep-links/${item._id}/edit`)
                        }
                        title={t("Edit", "تعديل")}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDisableTarget(item)}
                        title={t("Disable deep link", "تعطيل الرابط العميق")}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* App registration */}
                  {item.deepLink?.appRegistration && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {t("App:", "التطبيق:")}
                      </span>
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        {item.deepLink.appRegistration.bundleId && (
                          <Apple className="w-3 h-3" />
                        )}
                        {item.deepLink.appRegistration.packageName && (
                          <Smartphone className="w-3 h-3" />
                        )}
                        {item.deepLink.appRegistration.name}
                      </Badge>
                    </div>
                  )}

                  {/* Screen + params */}
                  {item.deepLink?.screen && (
                    <div className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">
                        {t("Screen", "الشاشة")}
                      </p>
                      <p className="text-xs font-mono">
                        {item.deepLink.screen}
                      </p>
                    </div>
                  )}
                  {item.deepLink?.params &&
                    Object.keys(item.deepLink.params).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(item.deepLink.params).map(([k, v]) => (
                          <span
                            key={k}
                            className="text-[11px] font-mono bg-muted px-1.5 py-0.5 rounded"
                          >
                            {k}={String(v)}
                          </span>
                        ))}
                      </div>
                    )}

                  {/* Deep link URL + copy */}
                  <div className="flex items-center gap-2 bg-muted rounded-md px-2.5 py-2">
                    <p className="text-[11px] font-mono truncate flex-1 text-muted-foreground">
                      {dlUrl}
                    </p>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleCopyLink(item)}
                        className="text-muted-foreground hover:text-primary"
                        title={t("Copy deep link", "نسخ الرابط العميق")}
                      >
                        {copiedId === item._id ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <a
                        href={dlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary"
                        title={t("Open", "فتح")}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Web fallback */}
                  {item.deepLink?.webFallbackUrl && (
                    <div className="text-xs text-muted-foreground truncate">
                      <span className="font-medium">
                        {t("Web fallback:", "الاحتياطي:")}
                      </span>{" "}
                      {item.deepLink.webFallbackUrl}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Disable confirm */}
      <AlertDialog
        open={!!disableTarget}
        onOpenChange={(open) => !open && setDisableTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("Disable Deep Link?", "تعطيل الرابط العميق؟")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "The /dl/ route will stop routing this link to the app. The underlying short URL and its destination remain unchanged.",
                "سيتوقف مسار /dl/ عن توجيه هذا الرابط إلى التطبيق. يبقى الرابط المختصر الأصلي ووجهته دون تغيير.",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel", "إلغاء")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                disableTarget && disableMutation.mutate(disableTarget)
              }
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {disableMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin me-2" />
              ) : null}
              {t("Disable", "تعطيل")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
