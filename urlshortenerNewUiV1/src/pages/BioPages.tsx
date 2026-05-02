import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
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
  Plus, Pencil, Trash2, Copy, ExternalLink, Eye, MousePointer,
  Loader2, Link2, Globe, Check,
} from "lucide-react";
import { bioPageAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface BioLink {
  _id: string;
  title: string;
  url: string;
  clickCount: number;
  isActive: boolean;
}

interface BioPage {
  _id: string;
  username: string;
  title: string;
  description: string;
  avatarUrl: string;
  totalViews: number;
  isPublished: boolean;
  links: BioLink[];
  createdAt: string;
  publicUrl?: string;
}

const BioPages = () => {
  const { t, isAr } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [pages, setPages] = useState<BioPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null; title: string }>({
    open: false, id: null, title: "",
  });
  const [deleting, setDeleting] = useState(false);

  const fetchPages = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await bioPageAPI.list() as any;
      setPages(res?.data ?? []);
    } catch {
      toast({ variant: "destructive", title: t("Error", "خطأ"), description: t("Failed to load bio pages", "فشل تحميل صفحات البايو") });
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const getPublicUrl = (page: BioPage) => {
    const base = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3015';
    const frontendBase = base.replace(':3015', ':5173');
    return `${frontendBase}/#/bio/${page.username}`;
  };

  const handleCopy = async (page: BioPage) => {
    const url = getPublicUrl(page);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(page._id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({ title: t("Copied!", "تم النسخ!"), description: t("Public URL copied to clipboard", "تم نسخ الرابط العام") });
    } catch {
      toast({ variant: "destructive", title: t("Error", "خطأ"), description: t("Could not copy URL", "تعذر نسخ الرابط") });
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.id) return;
    setDeleting(true);
    try {
      await bioPageAPI.delete(deleteDialog.id);
      setPages((prev) => prev.filter((p) => p._id !== deleteDialog.id));
      toast({ title: t("Deleted", "تم الحذف"), description: t("Bio page deleted successfully", "تم حذف صفحة البايو") });
    } catch (err: any) {
      toast({ variant: "destructive", title: t("Error", "خطأ"), description: err.message });
    } finally {
      setDeleting(false);
      setDeleteDialog({ open: false, id: null, title: "" });
    }
  };

  const totalClicks = (page: BioPage) =>
    page.links?.reduce((sum, l) => sum + (l.clickCount || 0), 0) ?? 0;

  const getInitials = (title: string) =>
    title.slice(0, 2).toUpperCase();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">
              {t("Link in Bio", "صفحات البايو")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("Create beautiful landing pages with all your links", "أنشئ صفحات جميلة بجميع روابطك")}
            </p>
          </div>
          <Button onClick={() => navigate("/dashboard/bio-wizard")} className="gap-2">
            <Plus className="w-4 h-4" />
            {t("Create Page", "إنشاء صفحة")}
          </Button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && pages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-2xl bg-muted/20">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Link2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t("No bio pages yet", "لا توجد صفحات بايو بعد")}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              {t(
                "Create your first link-in-bio page and share all your important links in one place.",
                "أنشئ صفحة بايو الأولى وشارك جميع روابطك المهمة في مكان واحد."
              )}
            </p>
            <Button onClick={() => navigate("/dashboard/bio-wizard")} className="gap-2">
              <Plus className="w-4 h-4" />
              {t("Create Your First Page", "إنشاء أول صفحة")}
            </Button>
          </div>
        )}

        {/* Pages grid */}
        {!isLoading && pages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pages.map((page) => (
              <div
                key={page._id}
                className="bg-background border border-border rounded-2xl p-5 flex flex-col gap-4 hover:shadow-md transition-shadow"
              >
                {/* Card header */}
                <div className="flex items-start gap-3">
                  {page.avatarUrl ? (
                    <img
                      src={page.avatarUrl}
                      alt={page.title}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">
                      {getInitials(page.title)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground truncate">{page.title}</h3>
                      <Badge variant={page.isPublished ? "default" : "secondary"} className="text-xs">
                        {page.isPublished ? t("Published", "منشور") : t("Draft", "مسودة")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      @{page.username}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {page.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{page.description}</p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 bg-muted/40 rounded-xl p-3">
                  <div className="text-center">
                    <p className="text-base font-bold text-foreground">{page.links?.length ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground">{t("Links", "روابط")}</p>
                  </div>
                  <div className="text-center border-x border-border">
                    <div className="flex items-center justify-center gap-1">
                      <Eye className="w-3 h-3 text-muted-foreground" />
                      <p className="text-base font-bold text-foreground">{page.totalViews ?? 0}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{t("Views", "مشاهدات")}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <MousePointer className="w-3 h-3 text-muted-foreground" />
                      <p className="text-base font-bold text-foreground">{totalClicks(page)}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{t("Clicks", "نقرات")}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5 text-xs"
                    onClick={() => navigate(`/dashboard/bio-wizard/${page._id}/edit`)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    {t("Edit", "تعديل")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1.5 text-xs"
                    onClick={() => handleCopy(page)}
                  >
                    {copiedId === page._id
                      ? <Check className="w-3.5 h-3.5 text-green-500" />
                      : <Copy className="w-3.5 h-3.5" />
                    }
                    {copiedId === page._id ? t("Copied!", "تم النسخ!") : t("Copy URL", "نسخ الرابط")}
                  </Button>
                  <a
                    href={getPublicUrl(page)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={t("Open public page", "فتح الصفحة العامة")}
                  >
                    <Button variant="outline" size="icon" className="w-8 h-8">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 text-destructive hover:bg-destructive/10 hover:border-destructive"
                    onClick={() => setDeleteDialog({ open: true, id: page._id, title: page.title })}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !deleting && setDeleteDialog({ open, id: null, title: "" })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete Bio Page", "حذف صفحة البايو")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                `Are you sure you want to delete "${deleteDialog.title}"? This action cannot be undone.`,
                `هل أنت متأكد من حذف "${deleteDialog.title}"؟ لا يمكن التراجع عن هذا الإجراء.`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("Cancel", "إلغاء")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : t("Delete", "حذف")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default BioPages;
