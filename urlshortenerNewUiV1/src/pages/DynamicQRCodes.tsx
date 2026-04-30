import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  QrCode,
  Plus,
  Download,
  Trash2,
  Edit2,
  Search,
  Loader2,
  ExternalLink,
  BarChart2,
  RefreshCw,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { dynamicQRCodeAPI } from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DynamicQR {
  _id: string;
  code: string;
  name: string;
  destinationUrl: string;
  scanUrl: string;
  isActive: boolean;
  scanCount: number;
  uniqueScanCount: number;
  lastScannedAt: string | null;
  qrCodeData: string | null;
  customization: {
    size: number;
    format: string;
    errorCorrection: string;
    foregroundColor: string;
    backgroundColor: string;
    includeMargin: boolean;
  };
  createdAt: string;
}

const DOWNLOAD_FORMATS = ["png", "jpeg", "webp", "svg", "pdf"] as const;

// ─── Component ───────────────────────────────────────────────────────────────

export default function DynamicQRCodes() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, isAr } = useLanguage();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  // Edit-destination dialog
  const [editTarget, setEditTarget] = useState<DynamicQR | null>(null);
  const [newDestination, setNewDestination] = useState("");
  const [destinationError, setDestinationError] = useState("");

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<DynamicQR | null>(null);

  // Analytics dialog
  const [analyticsTarget, setAnalyticsTarget] = useState<DynamicQR | null>(null);

  // Download format
  const [downloadFormat, setDownloadFormat] = useState<string>("png");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Copied code
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ── Debounced search ─────────────────────────────────────────────────────
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      clearTimeout((handleSearchChange as any)._timer);
      (handleSearchChange as any)._timer = setTimeout(() => {
        setDebouncedSearch(value);
        setPage(1);
      }, 400);
    },
    []
  );

  // ── Data fetching ────────────────────────────────────────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dynamic-qr", page, debouncedSearch],
    queryFn: () => dynamicQRCodeAPI.list({ page, limit: 12, search: debouncedSearch || undefined }),
    staleTime: 30_000,
  });

  const items: DynamicQR[] = (data as any)?.data ?? [];
  const pagination = (data as any)?.pagination;

  // Analytics query (only when dialog is open)
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ["dynamic-qr-analytics", analyticsTarget?._id],
    queryFn: () => dynamicQRCodeAPI.getAnalytics(analyticsTarget!._id),
    enabled: !!analyticsTarget,
    staleTime: 10_000,
  });
  const analytics = (analyticsData as any)?.data;

  // ── Mutations ────────────────────────────────────────────────────────────
  const updateDestMutation = useMutation({
    mutationFn: ({ id, url }: { id: string; url: string }) =>
      dynamicQRCodeAPI.updateDestination(id, url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dynamic-qr"] });
      setEditTarget(null);
      toast({ title: t("Destination updated", "تم تحديث الوجهة") });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: t("Update failed", "فشل التحديث"),
        description: err?.message ?? t("Please try again", "يرجى المحاولة مرة أخرى"),
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      dynamicQRCodeAPI.update(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dynamic-qr"] }),
    onError: () =>
      toast({ variant: "destructive", title: t("Action failed", "فشل الإجراء") }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dynamicQRCodeAPI.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dynamic-qr"] });
      setDeleteTarget(null);
      toast({ title: t("Deleted successfully", "تم الحذف بنجاح") });
    },
    onError: () =>
      toast({ variant: "destructive", title: t("Delete failed", "فشل الحذف") }),
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  const validateUrl = (url: string) => {
    try {
      const p = new URL(url);
      return p.protocol === "http:" || p.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleOpenEditDest = (item: DynamicQR) => {
    setEditTarget(item);
    setNewDestination(item.destinationUrl);
    setDestinationError("");
  };

  const handleSaveDest = () => {
    const url = newDestination.trim();
    if (!validateUrl(url)) {
      setDestinationError(
        t("Enter a valid http/https URL", "أدخل رابطاً صحيحاً يبدأ بـ http أو https")
      );
      return;
    }
    updateDestMutation.mutate({ id: editTarget!._id, url });
  };

  const handleCopyUrl = async (item: DynamicQR) => {
    try {
      await navigator.clipboard.writeText(item.scanUrl);
      setCopiedId(item._id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({ variant: "destructive", title: t("Copy failed", "فشل النسخ") });
    }
  };

  const handleDownload = async (item: DynamicQR) => {
    setDownloadingId(item._id);
    try {
      await dynamicQRCodeAPI.download(item._id, item.name, downloadFormat);
    } catch {
      toast({ variant: "destructive", title: t("Download failed", "فشل التحميل") });
    } finally {
      setDownloadingId(null);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("Dynamic QR Codes", "أكواد QR الديناميكية")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t(
                "Update the destination of a QR code anytime without reprinting",
                "حدّث وجهة كود QR في أي وقت دون إعادة طباعته"
              )}
            </p>
          </div>
          <Button onClick={() => navigate("/dashboard/dynamic-qr/create")} className="shrink-0">
            <Plus className="w-4 h-4 me-2" />
            {t("New Dynamic QR", "إنشاء QR ديناميكي")}
          </Button>
        </div>

        {/* Search + download format selector */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={t("Search by name, URL or code…", "ابحث بالاسم أو الرابط أو الكود…")}
              className="ps-9"
            />
          </div>
          <Select value={downloadFormat} onValueChange={setDownloadFormat}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t("Format", "الصيغة")} />
            </SelectTrigger>
            <SelectContent>
              {DOWNLOAD_FORMATS.map((f) => (
                <SelectItem key={f} value={f}>
                  {f.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
            {t("Failed to load dynamic QR codes", "فشل تحميل أكواد QR الديناميكية")}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && items.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <QrCode className="w-16 h-16 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground">
              {debouncedSearch
                ? t("No results found", "لا توجد نتائج")
                : t("No dynamic QR codes yet", "لا توجد أكواد QR ديناميكية بعد")}
            </p>
            {!debouncedSearch && (
              <Button onClick={() => navigate("/dashboard/dynamic-qr/create")}>
                <Plus className="w-4 h-4 me-2" />
                {t("Create your first", "أنشئ أول كود QR")}
              </Button>
            )}
          </div>
        )}

        {/* Cards grid */}
        {!isLoading && items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div
                key={item._id}
                className={cn(
                  "border rounded-xl p-4 space-y-3 bg-card shadow-sm",
                  !item.isActive && "opacity-60"
                )}
              >
                {/* QR preview + name */}
                <div className="flex gap-3 items-start">
                  <div className="shrink-0 w-16 h-16 rounded-lg border overflow-hidden bg-white flex items-center justify-center">
                    {item.qrCodeData ? (
                      <img
                        src={item.qrCodeData}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <QrCode className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm truncate">{item.name}</p>
                      <Badge variant={item.isActive ? "default" : "secondary"} className="text-[10px] shrink-0">
                        {item.isActive ? t("Active", "نشط") : t("Inactive", "معطّل")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {item.code}
                    </p>
                  </div>
                </div>

                {/* Destination URL */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t("Destination", "الوجهة")}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs truncate flex-1 text-foreground" title={item.destinationUrl}>
                      {item.destinationUrl}
                    </p>
                    <a
                      href={item.destinationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-muted-foreground hover:text-primary"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>
                    <span className="font-semibold text-foreground">{item.scanCount}</span>{" "}
                    {t("scans", "مسح")}
                  </span>
                  <span>
                    <span className="font-semibold text-foreground">{item.uniqueScanCount}</span>{" "}
                    {t("unique", "فريد")}
                  </span>
                </div>

                {/* Scan URL copy */}
                <div className="flex items-center gap-2 bg-muted rounded-md px-2 py-1.5">
                  <p className="text-[11px] font-mono truncate flex-1 text-muted-foreground">
                    {item.scanUrl}
                  </p>
                  <button
                    onClick={() => handleCopyUrl(item)}
                    className="shrink-0 text-muted-foreground hover:text-primary"
                    title={t("Copy scan URL", "نسخ رابط المسح")}
                  >
                    {copiedId === item._id ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenEditDest(item)}
                    className="flex-1 text-xs h-8"
                  >
                    <RefreshCw className="w-3.5 h-3.5 me-1" />
                    {t("Update Dest.", "تحديث الوجهة")}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(item)}
                    disabled={downloadingId === item._id}
                    className="flex-1 text-xs h-8"
                  >
                    {downloadingId === item._id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin me-1" />
                    ) : (
                      <Download className="w-3.5 h-3.5 me-1" />
                    )}
                    {t("Download", "تحميل")}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAnalyticsTarget(item)}
                    className="flex-1 text-xs h-8"
                  >
                    <BarChart2 className="w-3.5 h-3.5 me-1" />
                    {t("Stats", "إحصاءات")}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      toggleActiveMutation.mutate({ id: item._id, isActive: !item.isActive })
                    }
                    className="flex-1 text-xs h-8"
                  >
                    <Edit2 className="w-3.5 h-3.5 me-1" />
                    {item.isActive ? t("Disable", "تعطيل") : t("Enable", "تفعيل")}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteTarget(item)}
                    className="flex-1 text-xs h-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5 me-1" />
                    {t("Delete", "حذف")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              {t("Previous", "السابق")}
            </Button>
            <span className="flex items-center text-sm text-muted-foreground px-2">
              {page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
            >
              {t("Next", "التالي")}
            </Button>
          </div>
        )}
      </div>

      {/* ── Update Destination Dialog ─────────────────────────────────────── */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Update Destination URL", "تحديث رابط الوجهة")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {t(
                "All future scans of this QR code will redirect to the new URL instantly.",
                "ستتوجه جميع عمليات المسح القادمة لهذا الكود نحو الرابط الجديد فوراً."
              )}
            </p>
            <div className="space-y-1">
              <Input
                value={newDestination}
                onChange={(e) => {
                  setNewDestination(e.target.value);
                  setDestinationError("");
                }}
                placeholder="https://example.com/new-page"
                dir="ltr"
              />
              {destinationError && (
                <p className="text-xs text-destructive">{destinationError}</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              {t("Cancel", "إلغاء")}
            </Button>
            <Button
              onClick={handleSaveDest}
              disabled={updateDestMutation.isPending}
            >
              {updateDestMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin me-2" />
              )}
              {t("Save", "حفظ")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Analytics Dialog ──────────────────────────────────────────────── */}
      <Dialog open={!!analyticsTarget} onOpenChange={(open) => !open && setAnalyticsTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {analyticsTarget?.name} — {t("Scan Analytics", "إحصاءات المسح")}
            </DialogTitle>
          </DialogHeader>
          {analyticsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : analytics ? (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t("Total Scans", "إجمالي عمليات المسح"), value: analytics.scanCount },
                  { label: t("Unique Scans", "عمليات مسح فريدة"), value: analytics.uniqueScanCount },
                  {
                    label: t("Destination Changes", "تغييرات الوجهة"),
                    value: analytics.destinationChanges
                  },
                  {
                    label: t("Last Scanned", "آخر مسح"),
                    value: analytics.lastScannedAt
                      ? new Date(analytics.lastScannedAt).toLocaleDateString(
                          isAr ? "ar-SA" : "en-US"
                        )
                      : t("Never", "لم يُمسح بعد")
                  }
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-lg font-bold">{value}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t("Current Destination", "الوجهة الحالية")}</p>
                <p className="text-sm truncate font-mono">{analytics.destinationUrl}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t("Scan URL (permanent)", "رابط المسح (دائم)")}</p>
                <p className="text-sm truncate font-mono text-primary">{analytics.scanUrl}</p>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnalyticsTarget(null)}>
              {t("Close", "إغلاق")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm ────────────────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete Dynamic QR Code?", "حذف كود QR الديناميكي؟")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "This cannot be undone. Existing printed QR codes will stop working.",
                "لا يمكن التراجع عن هذا الإجراء. ستتوقف أكواد QR المطبوعة عن العمل."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel", "إلغاء")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
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
    </DashboardLayout>
  );
}
