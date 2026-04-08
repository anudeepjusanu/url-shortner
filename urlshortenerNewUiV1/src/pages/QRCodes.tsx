import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { QrCode, Download, Trash2, Plus, ExternalLink, Search, Loader2 } from "lucide-react";
import { useUrls, useDeleteUrl } from "@/hooks/useApi";
import { qrCodeAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const QRCodes = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: urlsResponse, isLoading, isError } = useUrls();
  const deleteUrl = useDeleteUrl();

  const allUrls: any[] = urlsResponse?.data?.urls ?? [];

  // Only show URLs that have a QR code generated
  const qrUrls = allUrls.filter((url) => url.qrCodeGenerated);

  const getShortUrl = (url: any) => {
    const domain = url.domain || "";
    const code = url.customCode || url.shortCode || "";
    return domain ? `${domain}/${code}` : code;
  };

  const filtered = qrUrls.filter((url) => {
    const name = url.title || url.shortCode || "";
    const short = getShortUrl(url);
    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      short.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleDownload = async (url: any) => {
    setDownloadingId(url._id);
    try {
      const blob = await qrCodeAPI.download(url._id, "png");
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `qr-${url.shortCode || url._id}.png`;
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

  const handleDelete = (id: string) => {
    deleteUrl.mutate(id);
  };

  return (
    <DashboardLayout>
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

      {/* Total + Search */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="bg-background border border-border rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 flex items-center gap-2 shrink-0">
          <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
          <span className="text-sm font-display font-bold text-foreground">{qrUrls.length}</span>
          <span className="text-[11px] sm:text-xs text-muted-foreground font-body">
            {t("QR Codes", "أكواد")}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 sm:px-4 bg-background border border-border rounded-lg flex-1">
          <Search size={14} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder={t("Search QR codes...", "ابحث في أكواد QR...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none py-2.5 sm:py-3 font-body text-xs sm:text-sm"
          />
        </div>
      </div>

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
            {qrUrls.length === 0
              ? t(
                  "No QR codes yet. Generate one from your links!",
                  "لا توجد أكواد QR بعد. أنشئ واحداً من روابطك!"
                )
              : t("No QR codes found", "لا توجد أكواد QR")}
          </p>
        </div>
      )}

      {/* QR Grid — 2 cols on mobile */}
      {!isLoading && !isError && filtered.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((url) => {
            const shortUrl = getShortUrl(url);
            const name = url.title || url.shortCode || "";
            const scans = url.qrScanCount || 0;

            return (
              <div
                key={url._id}
                className="bg-background border border-border rounded-xl p-3 sm:p-5 hover:shadow-md transition-shadow"
              >
                {/* QR Preview */}
                <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center mb-3 sm:mb-4 border border-border overflow-hidden">
                  {url.qrCode ? (
                    <img
                      src={url.qrCode}
                      alt={`QR code for ${name}`}
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <QrCode className="w-12 h-12 sm:w-20 sm:h-20 text-foreground/60" />
                  )}
                </div>

                <h3 className="font-display font-semibold text-foreground text-xs sm:text-sm mb-0.5 sm:mb-1 truncate">
                  {name}
                </h3>
                <p className="text-[10px] sm:text-xs text-primary font-body flex items-center gap-1 mb-2 sm:mb-3 truncate">
                  <ExternalLink size={9} className="shrink-0" />
                  <span className="truncate">{shortUrl}</span>
                </p>
                <div className="mb-2 sm:mb-4">
                  <span className="text-[10px] sm:text-xs text-muted-foreground font-body">
                    {scans} {t("scans", "مسح")}
                  </span>
                </div>
                <div className="flex gap-1.5 sm:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-7 sm:h-8 text-[10px] sm:text-xs px-2"
                    onClick={() => handleDownload(url)}
                    disabled={downloadingId === url._id}
                  >
                    {downloadingId === url._id ? (
                      <Loader2 className="w-3 h-3 me-0.5 sm:me-1 animate-spin" />
                    ) : (
                      <Download className="w-3 h-3 me-0.5 sm:me-1" />
                    )}
                    {t("Download", "تحميل")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 sm:h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(url._id)}
                    disabled={deleteUrl.isPending}
                  >
                    <Trash2 className="w-3 h-3" />
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
