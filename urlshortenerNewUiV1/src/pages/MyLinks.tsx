import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
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
  Copy, BarChart3, Trash2, Link2, ExternalLink,
  Search, Check, QrCode, Loader2, Tag,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { myLinksService } from "@/services/jwtService";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const MyLinks = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"latest" | "oldest" | "most-clicked">("latest");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedDest, setExpandedDest] = useState<Set<string>>(new Set());

  const toggleDest = (id: string) => {
    setExpandedDest((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const [urls, setUrls] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [availableDomains, setAvailableDomains] = useState<any[]>([]);

  // Delete confirmation dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string | null;
    shortUrl: string;
  }>({ open: false, id: null, shortUrl: "" });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUrls = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await myLinksService.getAll({ limit: 100 });
      setUrls(res?.data?.urls ?? []);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUrls();
    myLinksService.getAvailableDomains().then((res: any) => {
      setAvailableDomains(res?.data?.domains ?? []);
    }).catch(() => {});
  }, [fetchUrls]);

  // Refetch when tab becomes visible again
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) fetchUrls();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchUrls]);

  const getShortUrl = (url: any) => {
    const code = url.customCode || url.shortCode || "";
    if (url.domain) {
      const domain = url.domain.startsWith("http") ? url.domain : `https://${url.domain}`;
      return `${domain}/${code}`;
    }
    const baseDomain = availableDomains.find((d: any) => d.id === "base");
    const baseUrl = baseDomain?.shortUrl || window.location.origin;
    return `${baseUrl}/${code}`;
  };

  const handleCopy = (url: any) => {
    const shortUrl = getShortUrl(url);
    navigator.clipboard.writeText(shortUrl);
    setCopiedId(url.customCode || url.shortCode || "");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openDeleteDialog = (url: any) => {
    setDeleteDialog({ open: true, id: url._id, shortUrl: getShortUrl(url) });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.id) return;
    setDeletingId(deleteDialog.id);
    setDeleteDialog((d) => ({ ...d, open: false }));
    try {
      await myLinksService.delete(deleteDialog.id);
      setUrls((prev) => prev.filter((u) => u._id !== deleteDialog.id));
      toast({ title: t("Link deleted", "تم حذف الرابط") });
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

  const filtered = urls
    .filter((url) => {
      const name = url.title || url.shortCode || "";
      const short = getShortUrl(url);
      return (
        name.toLowerCase().includes(search.toLowerCase()) ||
        short.toLowerCase().includes(search.toLowerCase()) ||
        (url.originalUrl || "").toLowerCase().includes(search.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (sort === "most-clicked") return (b.clickCount || 0) - (a.clickCount || 0);
      if (sort === "oldest")
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getRelativeTime = (dateStr: string) => {
    const now = Date.now();
    const diff = now - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return t("Today", "اليوم");
    if (days === 1) return t("1 day ago", "منذ يوم");
    if (days < 7) return t(`${days} days ago`, `منذ ${days} أيام`);
    const weeks = Math.floor(days / 7);
    if (weeks === 1) return t("1 week ago", "منذ أسبوع");
    if (weeks < 5) return t(`${weeks} weeks ago`, `منذ ${weeks} أسابيع`);
    const months = Math.floor(days / 30);
    if (months === 1) return t("1 month ago", "منذ شهر");
    return t(`${months} months ago`, `منذ ${months} أشهر`);
  };

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
                `Are you sure you want to delete "${deleteDialog.shortUrl}"? This action cannot be undone.`,
                `هل أنت متأكد من حذف "${deleteDialog.shortUrl}"؟ لا يمكن التراجع عن هذا الإجراء.`
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

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-foreground">
          {t("My Links", "روابطي")}
        </h1>
        <Button
          className="bg-primary text-primary-foreground"
          onClick={() => navigate("/dashboard/create-link")}
          type="button"
        >
          + {t("New Link", "رابط جديد")}
        </Button>
      </div>

      {/* Search + Total */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-background border border-border rounded-lg px-4 py-2.5 flex items-center gap-2 shrink-0">
          <Link2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-display font-bold text-foreground">{urls.length}</span>
          <span className="text-xs text-muted-foreground font-body">{t("Links", "روابط")}</span>
        </div>
        <div className="flex items-center gap-2 px-4 bg-background border border-border rounded-lg flex-1">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder={t("Search links...", "ابحث في الروابط...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none py-3 font-body text-sm"
          />
        </div>
        <Select
          value={sort}
          onValueChange={(v) => setSort(v as "latest" | "oldest" | "most-clicked")}
        >
          <SelectTrigger className="w-auto shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">{t("Latest", "الأحدث")}</SelectItem>
            <SelectItem value="oldest">{t("Oldest", "الأقدم")}</SelectItem>
            <SelectItem value="most-clicked">{t("Most Clicked", "الأكثر ضغطاً")}</SelectItem>
          </SelectContent>
        </Select>
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
            {t("Failed to load links. Please try again.", "فشل تحميل الروابط. حاول مرة أخرى.")}
          </p>
        </div>
      )}

      {/* Links */}
      {!isLoading && !isError && (
        <div className="space-y-3">
          {filtered.map((url) => {
            const shortUrl = getShortUrl(url);
            const name = url.title || url.shortCode || "";
            const dest = url.originalUrl || "";
            const clicks = url.clickCount || 0;
            const date = formatDate(url.createdAt);
            const relative = getRelativeTime(url.createdAt);

            return (
              <div
                key={url._id}
                className="bg-background border border-border rounded-xl px-5 py-5 hover:shadow-md transition-all overflow-hidden"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 min-w-0">
                  <div className="flex items-center gap-4 flex-1 min-w-0 overflow-hidden">
                    <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <Link2 className="w-4 h-4 text-primary" />
                    </div>

                    <div className="min-w-0 flex-1 overflow-hidden">
                      <h3 className="font-body font-medium text-foreground text-sm truncate">{name}</h3>
                      <p className="text-xs text-primary font-body flex items-center gap-1 mt-1 min-w-0">
                        <ExternalLink size={10} className="shrink-0" />
                        <a
                          href={shortUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline truncate min-w-0"
                        >
                          {shortUrl}
                        </a>
                        <button
                          onClick={() => handleCopy(url)}
                          className="ml-1 text-muted-foreground hover:text-primary transition-colors"
                        >
                          {copiedId === (url.customCode || url.shortCode || "") ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </p>
                      <p
                        className={`text-[11px] text-muted-foreground font-body mt-0.5 cursor-pointer hover:text-foreground transition-colors ${
                          expandedDest.has(url._id) ? "break-all" : "truncate"
                        }`}
                        onClick={() => toggleDest(url._id)}
                        title={expandedDest.has(url._id) ? t("Click to collapse", "اضغط للطي") : t("Click to expand", "اضغط للتوسيع")}
                      >
                        {dest}
                      </p>
                      {url.utm && (url.utm.source || url.utm.medium || url.utm.campaign) && (
                        <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-body font-medium">
                          <Tag className="w-2.5 h-2.5" />
                          UTM
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between lg:justify-end w-full lg:w-auto">
                    <div className="text-center">
                      <p className="text-lg font-display font-bold text-foreground">{clicks}</p>
                      <p className="text-[10px] text-muted-foreground font-body">
                        {t("clicks", "ضغطات")}
                      </p>
                    </div>
                    <div className="text-center hidden sm:block">
                      <p className="text-xs font-body text-muted-foreground">{date}</p>
                      <p className="text-[10px] text-muted-foreground font-body">{relative}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "h-8 px-2.5",
                          url.qrCodeGenerated && "text-primary border-primary/40 hover:bg-primary/5"
                        )}
                        onClick={() => {
                          if (url.qrCodeGenerated) {
                            // QR already exists — go to QR codes page
                            navigate("/dashboard/qr-codes");
                          } else {
                            // QR not yet created — go to creation page with this link pre-selected
                            navigate(`/dashboard/qr-codes/create?urlId=${encodeURIComponent(url._id)}`);
                          }
                        }}
                        title={
                          url.qrCodeGenerated
                            ? t("View QR Code", "عرض كود QR")
                            : t("Generate QR Code", "إنشاء كود QR")
                        }
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2.5"
                        onClick={() => navigate(`/dashboard/analytics/${url._id}`)}
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                      </Button>
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
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="text-center py-12">
          <Link2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground font-body">
            {urls.length === 0
              ? t("No links yet. Create your first link!", "لا توجد روابط بعد. أنشئ رابطك الأول!")
              : t("No links found", "لا توجد روابط")}
          </p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyLinks;