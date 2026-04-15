import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  Search, Loader2,
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
      const res = await myLinksService.getAll({ limit: 100 });
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

  useEffect(() => {
    fetchUrls();
  }, [fetchUrls]);

  // Refetch when tab becomes visible again
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) fetchUrls();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchUrls]);

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
    // Prefer the virtual shortUrl from the model (always has the full URL)
    if (url.shortUrl) {
      return url.shortUrl.replace(/^https?:\/\//, "");
    }
    // Fallback: build from domain + code
    const domain = url.domain || "";
    const code = url.customCode || url.shortCode || "";
    return domain ? `${domain}/${code}` : code;
  };

  const filtered = allUrls.filter((url) => {
    if (!url.qrCodeGenerated) return false;
    const name = url.title || url.shortCode || "";
    const short = getShortUrl(url);
    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      short.toLowerCase().includes(search.toLowerCase()) ||
      (url.originalUrl || "").toLowerCase().includes(search.toLowerCase())
    );
  });

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
      await qrCodeService.delete(deleteDialog.id);
      setAllUrls((prev) =>
        prev.map((u) =>
          u._id === deleteDialog.id
            ? { ...u, qrCode: undefined, qrCodeGenerated: false }
            : u
        )
      );
      toast({ title: t("QR code deleted successfully", "تم حذف كود QR بنجاح") });
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
            <AlertDialogTitle>{t("Delete QR Code", "حذف كود QR")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                `This will remove the QR code for "${deleteDialog.shortUrl}". The short link will remain active.`,
                `سيتم حذف كود QR للرابط "${deleteDialog.shortUrl}". سيبقى الرابط المختصر نشطاً.`
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-foreground">
          {t("QR Codes", "أكواد QR")}
        </h1>
        <Button
          className="bg-primary text-primary-foreground"
          onClick={() => navigate("/dashboard/qr-codes/create")}
        >
          <Plus className="w-4 h-4 me-1.5" />
          {t("New QR Code", "كود QR جديد")}
        </Button>
      </div>

      {/* ── Tab bar + search ── */}
      <div className="flex items-center gap-4 border-b border-border mb-6">
        <div className="flex items-center gap-2 pb-3 border-b-2 border-primary -mb-px">
          <QrCode className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {t("QR Codes", "أكواد QR")}
          </span>
          {qrCount > 0 && (
            <span className="text-xs bg-primary/10 text-primary font-medium px-1.5 py-0.5 rounded-full">
              {qrCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 px-3 bg-background border border-border rounded-lg ms-auto mb-3" style={{ minWidth: 220 }}>
          <Search size={14} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder={t("Search QR codes...", "ابحث في أكواد QR...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none py-2 font-body text-sm"
          />
        </div>
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* ── Error ── */}
      {isError && !isLoading && (
        <div className="text-center py-16">
          <p className="text-sm text-destructive font-body">
            {t(
              "Failed to load QR codes. Please try again.",
              "فشل تحميل أكواد QR. حاول مرة أخرى."
            )}
          </p>
        </div>
      )}

      {/* ── Empty ── */}
      {!isLoading && !isError && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <QrCode className="w-12 h-12 text-muted-foreground/25" />
          <p className="text-sm text-muted-foreground font-body">
            {allUrls.length === 0
              ? t("No links yet. Create a link first!", "لا توجد روابط بعد. أنشئ رابطاً أولاً!")
              : t("No QR codes found", "لا توجد أكواد QR")}
          </p>
          {allUrls.length === 0 && (
            <Button
              size="sm"
              className="bg-primary text-primary-foreground mt-1"
              onClick={() => navigate("/dashboard/qr-codes/create")}
            >
              <Plus className="w-4 h-4 me-1.5" />
              {t("New QR Code", "كود QR جديد")}
            </Button>
          )}
        </div>
      )}

      {/* ── Card grid ── */}
      {!isLoading && !isError && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((url) => {
            const shortUrl = getShortUrl(url);
            const name = url.title || url.shortCode || "";
            const scans = url.qrScanCount || 0;
            const hasQR = !!url.qrCodeGenerated;

            return (
              <div
                key={url._id}
                className="bg-background border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* QR preview area */}
                <div className="bg-muted/40 aspect-square flex items-center justify-center p-8">
                  {url.qrCode ? (
                    <img
                      src={url.qrCode}
                      alt={`QR ${name}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <QrCode className="w-24 h-24 text-muted-foreground/30" />
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => openGenerateModal(url)}
                      >
                        <QrCode className="w-3.5 h-3.5 me-1.5" />
                        {t("Generate", "إنشاء")}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="px-4 pt-3 pb-1">
                  <h3 className="font-display font-semibold text-foreground text-sm truncate">
                    {name}
                  </h3>
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-xs text-primary font-body flex items-center gap-1 mt-0.5 cursor-default w-full min-w-0">
                          <ExternalLink size={10} className="shrink-0" />
                          <span className="truncate">{shortUrl}</span>
                        </p>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs break-all">
                        {shortUrl}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {hasQR && (
                    <p className="text-xs text-muted-foreground font-body mt-0.5">
                      {scans} {t("scans", "مسح")}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="px-4 pb-4 pt-3 flex items-center gap-2">
                  {hasQR && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-9"
                      onClick={() => handleDownload(url)}
                      disabled={downloadingId === url._id}
                    >
                      {downloadingId === url._id ? (
                        <Loader2 className="w-3.5 h-3.5 me-1.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5 me-1.5" />
                      )}
                      {t("Download", "تحميل")}
                    </Button>
                  )}
                  {hasQR && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-9 px-3"
                      onClick={() => openCustomizeModal(url)}
                    >
                      {t("Edit", "تعديل")}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 text-destructive hover:text-destructive hover:bg-destructive/10 ms-auto"
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
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
};

export default QRCodes;
