import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
  QrCode, Download, Trash2, Plus, ExternalLink,
  Search, Loader2, Settings2, BarChart2, ScanLine, Zap, ArrowDownToLine,
} from "lucide-react";
import { myLinksService, qrCodeService } from "@/services/jwtService";
import { useToast } from "@/hooks/use-toast";

interface QROptions {
  size: number;
  format: "png" | "jpeg" | "gif" | "webp" | "svg" | "pdf";
  errorCorrection: "L" | "M" | "Q" | "H";
  foregroundColor: string;
  backgroundColor: string;
  includeMargin: boolean;
}

const DEFAULT_QR_OPTIONS: QROptions = {
  size: 300,
  format: "png",
  errorCorrection: "M",
  foregroundColor: "#000000",
  backgroundColor: "#FFFFFF",
  includeMargin: true,
};

const QRCodes = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [allUrls, setAllUrls] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalQRCodes: 0,
    totalScans: 0,
    activeQRCodes: 0,
    downloadsToday: 0,
  });

  // Bulk select
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Generate / Customize modal
  const [showModal, setShowModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedLink, setSelectedLink] = useState<any>(null);
  const [qrOptions, setQrOptions] = useState<QROptions>(DEFAULT_QR_OPTIONS);
  const [generateLoading, setGenerateLoading] = useState(false);

  // Download
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string | null;
    shortUrl: string;
  }>({ open: false, id: null, shortUrl: "" });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ─── Data fetching ───────────────────────────────────────────────────────

  const fetchUrls = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await myLinksService.getAll({ limit: 500 });
      setAllUrls(res?.data?.urls ?? []);
    } catch {
      setIsError(true);
      toast({
        title: t("Failed to load links", "فشل تحميل الروابط"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await qrCodeService.getStats();
      if (res?.success && res?.data) {
        setStats({
          totalQRCodes: res.data.totalQRCodes || 0,
          totalScans: res.data.totalScans || 0,
          activeQRCodes: res.data.activeQRCodes || 0,
          downloadsToday: res.data.downloadsToday || 0,
        });
      }
    } catch {
      // non-critical — silently ignore
    }
  }, []);

  useEffect(() => {
    fetchUrls();
    loadStats();
  }, [fetchUrls, loadStats]);

  // Refetch when tab becomes visible again
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) {
        fetchUrls();
        loadStats();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchUrls, loadStats]);

  // Fetch missing QR images for generated-but-null records
  useEffect(() => {
    const missing = allUrls.filter((u) => u.qrCodeGenerated && !u.qrCode);
    if (missing.length === 0) return;

    const fetchMissing = async () => {
      const results = await Promise.allSettled(
        missing.map(async (url) => {
          const res = await qrCodeService.get(url._id);
          return { id: url._id, qrCode: res?.data?.qrCode as string | undefined };
        })
      );
      setAllUrls((prev) =>
        prev.map((url) => {
          const match = results.find(
            (r) => r.status === "fulfilled" && r.value.id === url._id
          );
          if (match && match.status === "fulfilled" && match.value.qrCode) {
            return { ...url, qrCode: match.value.qrCode };
          }
          return url;
        })
      );
    };
    fetchMissing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allUrls.length]);

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const getShortUrl = (url: any) => {
    const domain = url.domain || "";
    const code = url.customCode || url.shortCode || "";
    return domain ? `${domain}/${code}` : code;
  };

  const filtered = allUrls.filter((url) => {
    const name = url.title || url.shortCode || "";
    const short = getShortUrl(url);
    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      short.toLowerCase().includes(search.toLowerCase()) ||
      (url.originalUrl || "").toLowerCase().includes(search.toLowerCase())
    );
  });

  // ─── Bulk select ─────────────────────────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((u) => u._id));
    }
  };

  const handleBulkGenerate = async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      await qrCodeService.bulkGenerate(selectedIds, {
        size: 300,
        format: "png",
        errorCorrectionLevel: "M",
      });
      setSelectedIds([]);
      await fetchUrls();
      await loadStats();
      toast({ title: t("QR codes generated", "تم إنشاء أكواد QR") });
    } catch (err: any) {
      toast({
        title: t("Bulk generate failed", "فشل الإنشاء الجماعي"),
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setBulkLoading(false);
    }
  };

  // ─── Generate / Customize ────────────────────────────────────────────────

  const openGenerateModal = (link: any) => {
    setSelectedLink(link);
    setIsUpdating(false);
    setQrOptions({ ...DEFAULT_QR_OPTIONS, ...link.qrCodeSettings });
    setShowModal(true);
  };

  const openCustomizeModal = async (link: any) => {
    setSelectedLink(link);
    setIsUpdating(true);
    // Load existing customization from API
    try {
      const res = await qrCodeService.get(link._id);
      const customization = res?.data?.customization;
      setQrOptions(
        customization
          ? {
              size: customization.size || 300,
              format: customization.format || "png",
              errorCorrection: customization.errorCorrection || "M",
              foregroundColor: customization.foregroundColor || "#000000",
              backgroundColor: customization.backgroundColor || "#FFFFFF",
              includeMargin: customization.includeMargin ?? true,
            }
          : { ...DEFAULT_QR_OPTIONS }
      );
    } catch {
      setQrOptions({ ...DEFAULT_QR_OPTIONS });
    }
    setShowModal(true);
  };

  const handleGenerateOrUpdate = async () => {
    if (!selectedLink) return;
    setGenerateLoading(true);
    try {
      let res;
      if (isUpdating) {
        res = await qrCodeService.updateCustomization(selectedLink._id, {
          ...qrOptions,
          errorCorrectionLevel: qrOptions.errorCorrection,
        } as any);
      } else {
        res = await qrCodeService.generate(selectedLink._id, {
          ...qrOptions,
          errorCorrectionLevel: qrOptions.errorCorrection,
        } as any);
      }

      if (res?.data?.qrCode) {
        setAllUrls((prev) =>
          prev.map((u) =>
            u._id === selectedLink._id
              ? { ...u, qrCode: res.data.qrCode, qrCodeGenerated: true }
              : u
          )
        );
      }

      setShowModal(false);
      setSelectedLink(null);
      loadStats();
      toast({
        title: isUpdating
          ? t("QR code updated", "تم تحديث كود QR")
          : t("QR code generated", "تم إنشاء كود QR"),
      });
    } catch (err: any) {
      toast({
        title: t("Failed", "فشل"),
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setGenerateLoading(false);
    }
  };

  // ─── Download ────────────────────────────────────────────────────────────

  const handleDownload = async (url: any) => {
    setDownloadingId(url._id);
    try {
      const blob = await qrCodeService.download(url._id, qrOptions.format || "png");
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `qr-${url.shortCode || url._id}.${qrOptions.format || "png"}`;
      a.click();
      URL.revokeObjectURL(blobUrl);
      loadStats();
    } catch (err: any) {
      toast({
        title: t("Download Failed", "فشل التحميل"),
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────

  const openDeleteDialog = (url: any) => {
    setDeleteDialog({ open: true, id: url._id, shortUrl: getShortUrl(url) });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.id) return;
    setDeletingId(deleteDialog.id);
    setDeleteDialog((d) => ({ ...d, open: false }));
    try {
      await myLinksService.delete(deleteDialog.id);
      setAllUrls((prev) => prev.filter((u) => u._id !== deleteDialog.id));
      loadStats();
      toast({ title: t("Deleted successfully", "تم الحذف بنجاح") });
    } catch (err: any) {
      toast({
        title: t("Delete failed", "فشل الحذف"),
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const qrCount = allUrls.filter((u) => u.qrCodeGenerated).length;

  return (
    <DashboardLayout>
      {/* Delete confirmation */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((d) => ({ ...d, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete Link", "حذف الرابط")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                `Are you sure you want to delete "${deleteDialog.shortUrl}"? This cannot be undone.`,
                `هل أنت متأكد من حذف "${deleteDialog.shortUrl}"؟ لا يمكن التراجع.`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel", "إلغاء")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("Delete", "حذف")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Generate / Customize modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isUpdating
                ? t("Customize QR Code", "تخصيص كود QR")
                : t("Generate QR Code", "إنشاء كود QR")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Size */}
            <div className="grid grid-cols-2 items-center gap-3">
              <Label>{t("Size (px)", "الحجم (px)")}</Label>
              <input
                type="number"
                min={100}
                max={2000}
                value={qrOptions.size}
                onChange={(e) =>
                  setQrOptions((o) => ({ ...o, size: Number(e.target.value) }))
                }
                className="border border-border rounded-md px-3 py-1.5 text-sm bg-background text-foreground w-full"
              />
            </div>

            {/* Format */}
            <div className="grid grid-cols-2 items-center gap-3">
              <Label>{t("Format", "الصيغة")}</Label>
              <Select
                value={qrOptions.format}
                onValueChange={(v) =>
                  setQrOptions((o) => ({ ...o, format: v as QROptions["format"] }))
                }
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["png", "jpeg", "gif", "webp", "svg", "pdf"].map((f) => (
                    <SelectItem key={f} value={f}>
                      {f.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Error correction */}
            <div className="grid grid-cols-2 items-center gap-3">
              <Label>{t("Error Correction", "تصحيح الخطأ")}</Label>
              <Select
                value={qrOptions.errorCorrection}
                onValueChange={(v) =>
                  setQrOptions((o) => ({
                    ...o,
                    errorCorrection: v as QROptions["errorCorrection"],
                  }))
                }
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">L – Low (7%)</SelectItem>
                  <SelectItem value="M">M – Medium (15%)</SelectItem>
                  <SelectItem value="Q">Q – Quartile (25%)</SelectItem>
                  <SelectItem value="H">H – High (30%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 items-center gap-3">
              <Label>{t("Foreground", "اللون الأمامي")}</Label>
              <input
                type="color"
                value={qrOptions.foregroundColor}
                onChange={(e) =>
                  setQrOptions((o) => ({ ...o, foregroundColor: e.target.value }))
                }
                className="h-9 w-full rounded-md border border-border cursor-pointer"
              />
            </div>
            <div className="grid grid-cols-2 items-center gap-3">
              <Label>{t("Background", "لون الخلفية")}</Label>
              <input
                type="color"
                value={qrOptions.backgroundColor}
                onChange={(e) =>
                  setQrOptions((o) => ({ ...o, backgroundColor: e.target.value }))
                }
                className="h-9 w-full rounded-md border border-border cursor-pointer"
              />
            </div>

            {/* Include margin */}
            <div className="flex items-center gap-3">
              <Checkbox
                id="includeMargin"
                checked={qrOptions.includeMargin}
                onCheckedChange={(checked) =>
                  setQrOptions((o) => ({ ...o, includeMargin: !!checked }))
                }
              />
              <Label htmlFor="includeMargin">{t("Include Margin", "تضمين الهامش")}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              {t("Cancel", "إلغاء")}
            </Button>
            <Button onClick={handleGenerateOrUpdate} disabled={generateLoading}>
              {generateLoading && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
              {isUpdating ? t("Update", "تحديث") : t("Generate", "إنشاء")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-2xl font-display font-bold text-foreground">
          {t("QR Codes", "أكواد QR")}
        </h1>
        <Button
          className="bg-primary text-primary-foreground text-xs sm:text-sm"
          size="sm"
          onClick={() => navigate("/dashboard/qr-codes/create")}
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 me-1.5" />
          {t("New QR Code", "كود QR جديد")}
        </Button>
      </div>

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          {
            icon: <QrCode className="w-5 h-5 text-primary" />,
            value: stats.totalQRCodes,
            label: t("Total QR Codes", "إجمالي أكواد QR"),
          },
          {
            icon: <ScanLine className="w-5 h-5 text-emerald-500" />,
            value: stats.totalScans,
            label: t("Total Scans", "إجمالي المسح"),
          },
          {
            icon: <Zap className="w-5 h-5 text-violet-500" />,
            value: stats.activeQRCodes,
            label: t("Active QR Codes", "أكواد QR النشطة"),
          },
          {
            icon: <ArrowDownToLine className="w-5 h-5 text-amber-500" />,
            value: stats.downloadsToday,
            label: t("Downloads Today", "تحميلات اليوم"),
          },
        ].map((card, i) => (
          <div
            key={i}
            className="bg-background border border-border rounded-xl px-4 py-3 flex items-center gap-3"
          >
            <div className="shrink-0">{card.icon}</div>
            <div>
              <p className="text-lg font-display font-bold text-foreground leading-none">
                {card.value.toLocaleString()}
              </p>
              <p className="text-[11px] text-muted-foreground font-body mt-0.5">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search + bulk actions ── */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4">
        <div className="bg-background border border-border rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2 shrink-0">
          <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          <span className="text-sm font-display font-bold text-foreground">{qrCount}</span>
          <span className="text-[11px] sm:text-xs text-muted-foreground font-body">
            {t("Generated", "تم إنشاؤه")}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 sm:px-4 bg-background border border-border rounded-lg flex-1">
          <Search size={14} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder={t("Search links...", "ابحث في الروابط...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none py-2.5 sm:py-3 font-body text-xs sm:text-sm"
          />
        </div>
        {selectedIds.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkGenerate}
            disabled={bulkLoading}
            className="shrink-0 text-xs sm:text-sm"
          >
            {bulkLoading ? (
              <Loader2 className="w-3.5 h-3.5 me-1.5 animate-spin" />
            ) : (
              <QrCode className="w-3.5 h-3.5 me-1.5" />
            )}
            {t(`Bulk Generate (${selectedIds.length})`, `إنشاء جماعي (${selectedIds.length})`)}
          </Button>
        )}
      </div>

      {/* ── Select all row ── */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-2 mb-3 px-1">
          <Checkbox
            id="select-all"
            checked={selectedIds.length === filtered.length && filtered.length > 0}
            onCheckedChange={toggleSelectAll}
          />
          <Label htmlFor="select-all" className="text-xs text-muted-foreground font-body cursor-pointer">
            {selectedIds.length === filtered.length && filtered.length > 0
              ? t("Deselect all", "إلغاء تحديد الكل")
              : t("Select all", "تحديد الكل")}
          </Label>
          {selectedIds.length > 0 && (
            <span className="text-xs text-muted-foreground font-body">
              ({selectedIds.length} {t("selected", "محدد")})
            </span>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <div className="text-center py-12">
          <p className="text-sm text-destructive font-body">
            {t(
              "Failed to load QR codes. Please try again.",
              "فشل تحميل أكواد QR. حاول مرة أخرى."
            )}
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && filtered.length === 0 && (
        <div className="text-center py-12">
          <QrCode className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground font-body">
            {allUrls.length === 0
              ? t("No links yet. Create a link first!", "لا توجد روابط بعد. أنشئ رابطاً أولاً!")
              : t("No links found", "لا توجد روابط")}
          </p>
        </div>
      )}

      {/* ── Link list (ALL links, not just QR-enabled) ── */}
      {!isLoading && !isError && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((url) => {
            const shortUrl = getShortUrl(url);
            const name = url.title || url.shortCode || "";
            const scans = url.qrScanCount || 0;
            const hasQR = !!url.qrCodeGenerated;

            return (
              <div
                key={url._id}
                className="bg-background border border-border rounded-xl p-3 sm:p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Checkbox */}
                  <Checkbox
                    checked={selectedIds.includes(url._id)}
                    onCheckedChange={() => toggleSelect(url._id)}
                  />

                  {/* QR preview thumbnail */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-muted rounded-lg flex items-center justify-center border border-border shrink-0 overflow-hidden">
                    {url.qrCode ? (
                      <img
                        src={url.qrCode}
                        alt={`QR ${name}`}
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <QrCode className="w-7 h-7 text-muted-foreground/40" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-body font-medium text-foreground text-sm truncate">
                      {name}
                    </h3>
                    <p className="text-xs text-primary font-body flex items-center gap-1 mt-0.5">
                      <ExternalLink size={10} className="shrink-0" />
                      <span className="truncate">{shortUrl}</span>
                    </p>
                    {hasQR && (
                      <p className="text-[11px] text-muted-foreground font-body mt-0.5">
                        {scans} {t("scans", "مسح")}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {hasQR ? (
                      <>
                        {/* Download */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-xs"
                          onClick={() => handleDownload(url)}
                          disabled={downloadingId === url._id}
                        >
                          {downloadingId === url._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          <span className="hidden sm:inline ms-1.5">{t("Download", "تحميل")}</span>
                        </Button>
                        {/* Customize */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5"
                          onClick={() => openCustomizeModal(url)}
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    ) : (
                      /* Generate for links without QR */
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2.5 text-xs"
                        onClick={() => openGenerateModal(url)}
                      >
                        <QrCode className="w-3.5 h-3.5 me-1.5" />
                        {t("Generate", "إنشاء")}
                      </Button>
                    )}
                    {/* Analytics */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5"
                      onClick={() => navigate(`/dashboard/analytics/${url._id}`)}
                    >
                      <BarChart2 className="w-3.5 h-3.5" />
                    </Button>
                    {/* Delete */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => openDeleteDialog(url)}
                      disabled={deletingId === url._id}
                    >
                      {deletingId === url._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default QRCodes;
