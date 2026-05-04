import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Plus, Pencil, Trash2, Copy, ExternalLink, Eye,
  Loader2, Link2, MoreHorizontal, Check,
} from "lucide-react";
import { bioPageAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import BioThumbnail from "@/components/bio-builder/BioThumbnail";
import { BioTheme, BioBlock } from "@/types/bio";
import { bioThemes } from "@/data/bioThemes";

interface BioPage {
  _id: string;
  username: string;
  title: string;
  description: string;
  avatarUrl: string;
  totalViews: number;
  isPublished: boolean;
  createdAt: string;
  blocks?: BioBlock[];
  bioTheme?: BioTheme | null;
}

const fallbackTheme: BioTheme = bioThemes.find((t) => t.id === "minimal-light") || bioThemes[0];

const BioPages = () => {
  const { t } = useLanguage();
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

  const getPublicUrl = (page: BioPage) => `${window.location.origin}/bio/${page.username}`;

  const getDisplayUrl = (page: BioPage) => `${window.location.host}/bio/${page.username}`;

  const handleCopy = async (page: BioPage) => {
    try {
      await navigator.clipboard.writeText(getPublicUrl(page));
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">
              {t("Bio Pages", "صفحات البايو")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("Create and manage your link-in-bio pages", "أنشئ وأدر صفحات البايو")}
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

        {/* Pages list */}
        {!isLoading && pages.length > 0 && (
          <div className="flex flex-col gap-3">
            {pages.map((page) => {
              const theme = page.bioTheme || fallbackTheme;
              const blocks = page.blocks || [];
              return (
                <div
                  key={page._id}
                  className="bg-background border border-border rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/dashboard/bio-wizard/${page._id}/edit`)}
                >
                  {/* Thumbnail */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <BioThumbnail blocks={blocks} theme={theme} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{page.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{getDisplayUrl(page)}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="w-3.5 h-3.5" />
                        {page.totalViews ?? 0}
                      </span>
                      <Badge
                        variant={page.isPublished ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {page.isPublished ? t("Published", "منشور") : t("Draft", "مسودة")}
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={getPublicUrl(page)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={t("Open public page", "فتح الصفحة العامة")}
                    >
                      <Button variant="ghost" size="icon" className="w-8 h-8">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-8 h-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/dashboard/bio-wizard/${page._id}/edit`)}>
                          <Pencil className="w-4 h-4 me-2" />
                          {t("Edit", "تعديل")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopy(page)}>
                          {copiedId === page._id
                            ? <Check className="w-4 h-4 me-2 text-green-500" />
                            : <Copy className="w-4 h-4 me-2" />}
                          {copiedId === page._id ? t("Copied!", "تم النسخ!") : t("Copy URL", "نسخ الرابط")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteDialog({ open: true, id: page._id, title: page.title })}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 me-2" />
                          {t("Delete", "حذف")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
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
