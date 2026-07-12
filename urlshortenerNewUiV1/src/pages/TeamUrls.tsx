import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProject } from "@/contexts/ProjectContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
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
  Search,
  ExternalLink,
  Copy,
  Check,
  Edit2,
  Trash2,
  BarChart3,
  Loader2,
  Layers,
  AlertTriangle,
} from "lucide-react";
import { myLinksService } from "@/services/jwtService";
import { useToast } from "@/hooks/use-toast";

const PAGE_LIMIT = 100;

const TeamUrls = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAccountOwner, isLoading: isProjectLoading } = useProject();

  const [urls, setUrls] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string | null;
    shortUrl: string;
  }>({ open: false, id: null, shortUrl: "" });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [editDestTarget, setEditDestTarget] = useState<any | null>(null);
  const [editDestUrl, setEditDestUrl] = useState("");
  const [editDestError, setEditDestError] = useState("");
  const [editDestAcknowledged, setEditDestAcknowledged] = useState(false);
  const [editDestSaving, setEditDestSaving] = useState(false);

  // Account-Owner-only page — org-wide across every project, regardless of
  // the active project switcher selection, so projectId is never sent.
  useEffect(() => {
    if (isProjectLoading) return;
    if (!isAccountOwner) {
      navigate("/dashboard", { replace: true });
    }
  }, [isProjectLoading, isAccountOwner, navigate]);

  const fetchUrls = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const first = await myLinksService.getAll({ page: 1, limit: PAGE_LIMIT });
      const all = [...(first?.data?.urls ?? [])];
      const totalPages = first?.data?.pagination?.pages ?? 1;
      if (totalPages > 1) {
        const rest = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) =>
            myLinksService.getAll({ page: i + 2, limit: PAGE_LIMIT }),
          ),
        );
        rest.forEach((res: any) => all.push(...(res?.data?.urls ?? [])));
      }
      setUrls(all);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isProjectLoading || !isAccountOwner) return;
    fetchUrls();
  }, [isProjectLoading, isAccountOwner, fetchUrls]);

  const getShortUrl = (url: any) => {
    const code = url.customCode || url.shortCode || "";
    if (url.domain) {
      if (url.domain.startsWith("http")) return `${url.domain}/${code}`;
      const isLocal =
        url.domain.includes("localhost") || url.domain.startsWith("127.");
      return `${isLocal ? "http" : "https"}://${url.domain}/${code}`;
    }
    return `${window.location.origin}/${code}`;
  };

  const handleCopy = (url: any) => {
    navigator.clipboard.writeText(getShortUrl(url));
    setCopiedId(url._id);
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

  const validateDestUrl = (url: string) => {
    try {
      const p = new URL(url);
      return p.protocol === "http:" || p.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleOpenEditDest = (url: any) => {
    setEditDestTarget(url);
    setEditDestUrl(url.originalUrl || "");
    setEditDestError("");
    setEditDestAcknowledged(false);
  };

  const handleSaveEditDest = async () => {
    const trimmed = editDestUrl.trim();
    if (!validateDestUrl(trimmed)) {
      setEditDestError(
        t(
          "Enter a valid http/https URL",
          "أدخل رابطاً صحيحاً يبدأ بـ http أو https",
        ),
      );
      return;
    }
    setEditDestSaving(true);
    try {
      await myLinksService.update(editDestTarget._id, { originalUrl: trimmed });
      setUrls((prev) =>
        prev.map((u) =>
          u._id === editDestTarget._id ? { ...u, originalUrl: trimmed } : u,
        ),
      );
      setEditDestTarget(null);
      toast({ title: t("Destination updated", "تم تحديث الوجهة") });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: t("Update failed", "فشل التحديث"),
        description: err.message,
      });
    } finally {
      setEditDestSaving(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return urls;
    return urls.filter((url) => {
      const name = (url.title || url.shortCode || "").toLowerCase();
      const dest = (url.originalUrl || "").toLowerCase();
      return (
        name.includes(q) ||
        dest.includes(q) ||
        getShortUrl(url).toLowerCase().includes(q)
      );
    });
  }, [urls, search]);

  const groups = useMemo(() => {
    const byProject = new Map<string, { name: string; urls: any[] }>();
    filtered.forEach((url) => {
      const key = url.project?._id || "__unassigned__";
      const name =
        url.project?.name || t("Unassigned", "غير مخصص لمشروع");
      if (!byProject.has(key)) byProject.set(key, { name, urls: [] });
      byProject.get(key)!.urls.push(url);
    });
    return Array.from(byProject.values())
      .map((g) => ({
        ...g,
        urls: g.urls.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filtered, t]);

  if (isProjectLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAccountOwner) return null;

  return (
    <DashboardLayout>
      {/* Delete confirmation */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((d) => ({ ...d, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("Delete Link", "حذف الرابط")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                `Are you sure you want to delete "${deleteDialog.shortUrl}"? This action cannot be undone.`,
                `هل أنت متأكد من حذف "${deleteDialog.shortUrl}"؟ لا يمكن التراجع عن هذا الإجراء.`,
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

      {/* Edit Destination Dialog */}
      <Dialog
        open={!!editDestTarget}
        onOpenChange={(open) => !open && setEditDestTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("Change Destination URL", "تغيير رابط الوجهة")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {editDestTarget?.qrCodeGenerated && (
              <div className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 dark:border-amber-700 dark:bg-amber-950/30">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  {t(
                    "This short link has an associated QR code. Both the short link and its QR code will point to the new destination immediately.",
                    "يرتبط بهذا الرابط المختصر كود QR. سيشير كلٌّ من الرابط المختصر وكود QR إلى الوجهة الجديدة فوراً.",
                  )}
                </p>
              </div>
            )}
            <div className="space-y-1">
              <Input
                value={editDestUrl}
                onChange={(e) => {
                  setEditDestUrl(e.target.value);
                  setEditDestError("");
                }}
                placeholder="https://example.com/new-page"
                dir="ltr"
              />
              {editDestError && (
                <p className="text-xs text-destructive">{editDestError}</p>
              )}
            </div>
            {editDestTarget?.qrCodeGenerated && (
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={editDestAcknowledged}
                  onChange={(e) => setEditDestAcknowledged(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary cursor-pointer"
                />
                <span className="text-sm text-foreground">
                  {t(
                    "I understand that both the short link and its QR code will redirect to the new destination immediately",
                    "أفهم أن كلاً من الرابط المختصر وكود QR سيُوجَّهان إلى الوجهة الجديدة فوراً",
                  )}
                </span>
              </label>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditDestTarget(null)}>
              {t("Cancel", "إلغاء")}
            </Button>
            <Button
              onClick={handleSaveEditDest}
              disabled={
                editDestSaving ||
                (editDestTarget?.qrCodeGenerated && !editDestAcknowledged)
              }
            >
              {editDestSaving && (
                <Loader2 className="w-4 h-4 animate-spin me-2" />
              )}
              {t("Save", "حفظ")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-foreground">
          {t("Team URLs", "روابط الفريق")}
        </h1>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="bg-background border border-border rounded-lg px-4 py-2.5 flex items-center gap-2 shrink-0">
          <Layers className="w-4 h-4 text-primary" />
          <span className="text-sm font-display font-bold text-foreground">
            {filtered.length}
          </span>
          <span className="text-xs text-muted-foreground font-body">
            {t("Links", "روابط")}
          </span>
        </div>
        <div className="flex items-center gap-2 px-4 bg-background border border-border rounded-lg flex-1">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder={t(
              "Search links across all projects...",
              "ابحث في الروابط عبر كل المشاريع...",
            )}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none py-3 font-body text-sm"
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && !isLoading && (
        <div className="text-center py-12">
          <p className="text-sm text-destructive font-body">
            {t(
              "Failed to load links. Please try again.",
              "فشل تحميل الروابط. حاول مرة أخرى.",
            )}
          </p>
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="text-center py-12">
          <Layers className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground font-body">
            {t("No links found", "لا توجد روابط")}
          </p>
        </div>
      )}

      {!isLoading && !isError && groups.length > 0 && (
        <div className="space-y-8">
          {groups.map((group) => (
            <div key={group.name}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-display font-semibold text-foreground">
                  {group.name}
                </h2>
                <Badge variant="secondary" className="text-[10px]">
                  {group.urls.length}
                </Badge>
              </div>
              <div className="bg-background border border-border rounded-xl overflow-hidden overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("Short Link", "الرابط المختصر")}</TableHead>
                      <TableHead>{t("Destination", "الوجهة")}</TableHead>
                      <TableHead className="text-center">
                        {t("Clicks", "الضغطات")}
                      </TableHead>
                      <TableHead>{t("Created", "الإنشاء")}</TableHead>
                      <TableHead className="text-center">
                        {t("Actions", "الإجراءات")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.urls.map((url) => {
                      const shortUrl = getShortUrl(url);
                      return (
                        <TableRow key={url._id}>
                          <TableCell>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <a
                                href={shortUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-body font-medium text-primary text-sm flex items-center gap-1 hover:underline truncate max-w-[220px]"
                              >
                                <ExternalLink className="w-3 h-3 shrink-0" />
                                {shortUrl.replace(/^https?:\/\//, "")}
                              </a>
                              <button
                                onClick={() => handleCopy(url)}
                                className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                              >
                                {copiedId === url._id ? (
                                  <Check size={12} />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
                            </div>
                            {url.title && (
                              <p className="text-[11px] text-muted-foreground font-body truncate max-w-[220px] mt-0.5">
                                {url.title}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground font-body max-w-[240px] truncate block">
                              {url.originalUrl}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-display font-semibold text-foreground">
                              {url.clickCount || 0}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground font-body">
                              {formatDate(url.createdAt)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleOpenEditDest(url)}
                                title={t(
                                  "Change Destination URL",
                                  "تغيير رابط الوجهة",
                                )}
                              >
                                <Edit2 className="w-4 h-4 text-secondary" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  navigate(`/dashboard/analytics/${url._id}`)
                                }
                                title={t("Analytics", "التحليلات")}
                              >
                                <BarChart3 className="w-4 h-4 text-secondary" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openDeleteDialog(url)}
                                disabled={deletingId === url._id}
                              >
                                {deletingId === url._id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default TeamUrls;
