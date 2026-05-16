import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Link2, MousePointer, CalendarDays, Search,
  Eye, Trash2, ExternalLink, Power, Loader2, BarChart3, ArrowUpDown,
  ChevronLeft, ChevronRight, Layout, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { adminService } from "@/services/jwtService";
import { useToast } from "@/hooks/use-toast";

interface AdminUrl {
  _id: string;
  shortCode: string;
  customCode?: string;
  originalUrl: string;
  title?: string;
  domain?: string;
  clickCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  creator?: { _id: string; firstName: string; lastName: string; email: string };
}

const PAGE_SIZE = 20;

const getSortParams = (sort: string): Record<string, string> => {
  switch (sort) {
    case "oldest":      return { sortBy: "createdAt", sortOrder: "asc" };
    case "most-clicked": return { sortBy: "clickCount", sortOrder: "desc" };
    default:            return { sortBy: "createdAt", sortOrder: "desc" };
  }
};

const getPublicBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3015/api";
  return apiUrl.replace(/\/api\/?$/, "");
};

const getShortUrl = (url: AdminUrl) => {
  const code = url.customCode || url.shortCode;
  if (url.domain) {
    const domain = url.domain.startsWith("http") ? url.domain : `https://${url.domain}`;
    return `${domain}/${code}`;
  }
  const base = getPublicBaseUrl();
  const domain = base.startsWith("http") ? base : `https://${base}`;
  return `${domain}/${code}`;
};

const UrlManagement = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [creatorFilter, setCreatorFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [datePopupOpen, setDatePopupOpen] = useState(false);
  const [pickingFrom, setPickingFrom] = useState(true);
  const [dateError, setDateError] = useState("");

  const [urls, setUrls] = useState<AdminUrl[]>([]);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const [stats, setStats] = useState({
    totalUrls: 0,
    totalClicks: 0,
    newUrlsLast30Days: 0,
    totalBioPages: 0,
  });

  const [allCreators, setAllCreators] = useState<Map<string, string>>(new Map());

  const [viewUrl, setViewUrl] = useState<AdminUrl | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null; code: string }>({
    open: false, id: null, code: "",
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 400);
  };

  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, creatorFilter, sortBy, fromDate, toDate]);

  const fetchStats = useCallback(async () => {
    try {
      const statsRes = await adminService.getStats();
      const overview = statsRes?.data?.overview ?? {};
      const growth = statsRes?.data?.growth ?? {};
      setStats({
        totalUrls: overview.totalUrls ?? 0,
        totalClicks: overview.totalClicks ?? 0,
        newUrlsLast30Days: growth.newUrlsLast30Days ?? 0,
        totalBioPages: overview.totalBioPages ?? 0,
      });
    } catch {
      // silently ignore stats fetch errors
    }
  }, []);

  const fetchAllCreators = useCallback(async () => {
    try {
      const PAGE_LIMIT = 500;
      let page = 1;
      const map = new Map<string, string>();
      while (true) {
        const res = await adminService.getUsers({ limit: PAGE_LIMIT, page });
        const users: Array<{ _id: string; firstName: string; lastName?: string }> = res?.data?.users ?? [];
        users.forEach((u) => {
          if (u._id) map.set(u._id, [u.firstName, u.lastName].filter(Boolean).join(' '));
        });
        const pagination = res?.data?.pagination ?? {};
        if (!pagination.pages || page >= pagination.pages) break;
        page++;
      }
      setAllCreators(map);
    } catch {
      // silently ignore creator fetch errors
    }
  }, []);

  const fetchUrls = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        limit: PAGE_SIZE,
        ...getSortParams(sortBy),
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (creatorFilter !== "all") params.creator = creatorFilter;
      if (fromDate) params.startDate = new Date(
        fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate(), 0, 0, 0, 0
      ).toISOString();
      if (toDate) params.endDate = new Date(
        toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59, 999
      ).toISOString();

      const urlsRes = await adminService.getUrls(params);
      const fetchedUrls: AdminUrl[] = urlsRes?.data?.urls ?? [];
      const pagination = urlsRes?.data?.pagination ?? {};

      setUrls(fetchedUrls);
      setFilteredTotal(pagination.total ?? 0);
      setTotalPages(pagination.pages ?? 1);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, creatorFilter, sortBy, fromDate, toDate]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchAllCreators(); }, [fetchAllCreators]);
  useEffect(() => { fetchUrls(); }, [fetchUrls]);

  const creators = Array.from(allCreators.entries()).sort(([, a], [, b]) => a.localeCompare(b));

  const handleToggleStatus = async (url: AdminUrl) => {
    setTogglingId(url._id);
    try {
      await adminService.updateUrl(url._id, { isActive: !url.isActive });
      setUrls((prev) =>
        prev.map((u) => (u._id === url._id ? { ...u, isActive: !url.isActive } : u))
      );
      toast({ title: url.isActive ? t("URL deactivated", "تم تعطيل الرابط") : t("URL activated", "تم تفعيل الرابط") });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: t("Update failed", "فشل التحديث"), description: message, variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.id) return;
    setDeletingId(deleteDialog.id);
    setDeleteDialog((d) => ({ ...d, open: false }));
    try {
      await adminService.deleteUrl(deleteDialog.id);
      setUrls((prev) => prev.filter((u) => u._id !== deleteDialog.id));
      setFilteredTotal((n) => Math.max(0, n - 1));
      toast({ title: t("URL deleted", "تم حذف الرابط") });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: t("Delete failed", "فشل الحذف"), description: message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const getShortDisplay = (url: AdminUrl) => url.customCode || url.shortCode;

  const hasDateFilter = !!(fromDate || toDate);

  const handleFromSelect = (date: Date | undefined) => {
    setDateError("");
    setFromDate(date);
    if (date && toDate && date > toDate) {
      setDateError(t(
        "Start date cannot be after end date.",
        "تاريخ البداية لا يمكن أن يكون بعد تاريخ النهاية."
      ));
      return;
    }
    if (!date) {
      setDatePopupOpen(false);
      return;
    }
    setPickingFrom(false);
  };

  const handleToSelect = (date: Date | undefined) => {
    setDateError("");
    setToDate(date);
    if (fromDate && date && fromDate > date) {
      setDateError(t(
        "End date cannot be before start date.",
        "تاريخ النهاية لا يمكن أن يكون قبل تاريخ البداية."
      ));
      return;
    }
    if (date) {
      setDatePopupOpen(false);
    }
  };

  const clearDateFilter = () => {
    setFromDate(undefined);
    setToDate(undefined);
    setDateError("");
    setDatePopupOpen(false);
    setPickingFrom(true);
  };

  const statCards = [
    { label: t("Total URLs", "إجمالي الروابط"), value: stats.totalUrls, icon: Link2 },
    { label: t("Total Clicks", "إجمالي الضغطات"), value: stats.totalClicks, icon: MousePointer },
    { label: t("New URLs (30d)", "روابط جديدة (30 يوم)"), value: stats.newUrlsLast30Days, icon: CalendarDays },
    { label: t("Total Bio Pages", "إجمالي صفحات التعريف"), value: stats.totalBioPages, icon: Layout },
  ];

  const getPageNumbers = (current: number, total: number): (number | "...")[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
    if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
    return [1, "...", current - 1, current, current + 1, "...", total];
  };

  const startItem = filteredTotal === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, filteredTotal);

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  return (
    <DashboardLayout>
      {/* Delete confirmation */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((d) => ({ ...d, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete URL", "حذف الرابط")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                `Are you sure you want to delete "${deleteDialog.code}"? This action cannot be undone.`,
                `هل أنت متأكد من حذف "${deleteDialog.code}"؟ لا يمكن التراجع عن هذا الإجراء.`
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

      <h1 className="text-lg sm:text-2xl font-display font-bold text-foreground mb-4 sm:mb-6">
        {t("URL Management", "إدارة الروابط")}
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {statCards.map((s) => (
          <div key={s.label} className="bg-background border border-border rounded-xl p-3 sm:p-5">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <s.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              </div>
            </div>
            <p className="text-lg sm:text-2xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-body mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("Search by short code, URL, title, or creator...", "ابحث بالرمز أو الرابط أو العنوان...")}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="ps-9 text-sm"
          />
        </div>
        <Select value={creatorFilter} onValueChange={setCreatorFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t("Filter by user", "فلتر بالمستخدم")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All Users", "جميع المستخدمين")}</SelectItem>
            {creators.map(([id, name]) => (
              <SelectItem key={id} value={id}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-52">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground me-2 shrink-0" />
            <SelectValue placeholder={t("Sort by", "ترتيب حسب")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t("Newest first", "الأحدث أولاً")}</SelectItem>
            <SelectItem value="oldest">{t("Oldest first", "الأقدم أولاً")}</SelectItem>
            <SelectItem value="most-clicked">{t("Most clicked", "الأكثر ضغطاً")}</SelectItem>
          </SelectContent>
        </Select>
        <Popover open={datePopupOpen} onOpenChange={setDatePopupOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full sm:w-auto justify-start gap-2 font-body text-sm",
                hasDateFilter && "border-primary text-primary"
              )}
            >
              <CalendarDays className="w-4 h-4" />
              {hasDateFilter
                ? `${fromDate ? format(fromDate, "MMM d, yyyy") : "…"} – ${toDate ? format(toDate, "MMM d, yyyy") : "…"}`
                : t("Filter by date", "فلتر بالتاريخ")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Button
                  variant={pickingFrom ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => setPickingFrom(true)}
                >
                  {t("From", "من")}
                </Button>
                <Button
                  variant={!pickingFrom ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => setPickingFrom(false)}
                >
                  {t("To", "إلى")}
                </Button>
                {hasDateFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-8 ms-auto text-muted-foreground hover:text-foreground"
                    onClick={clearDateFilter}
                  >
                    <X className="w-3 h-3 me-1" />
                    {t("Clear", "مسح")}
                  </Button>
                )}
              </div>
            </div>
            <Calendar
              mode="single"
              selected={pickingFrom ? fromDate : toDate}
              onSelect={pickingFrom ? handleFromSelect : handleToSelect}
              disabled={(date: Date) => {
                if (date > today) return true;
                if (!pickingFrom && fromDate && date < fromDate) return true;
                return false;
              }}
              initialFocus
            />
            {dateError && (
              <p className="text-xs text-destructive px-3 pb-3 font-body">{dateError}</p>
            )}
          </PopoverContent>
        </Popover>
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
            {t("Failed to load URLs. Please try again.", "فشل تحميل الروابط. حاول مرة أخرى.")}
          </p>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {urls.map((url) => (
              <div key={url._id} className="bg-background border border-border rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-display font-semibold text-foreground">
                      {url.title || getShortDisplay(url)}
                    </p>
                    <a
                      href={getShortUrl(url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary font-body flex items-center gap-1 mt-0.5 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" /> {getShortDisplay(url)}
                    </a>
                  </div>
                  <Badge
                    variant={url.isActive ? "default" : "secondary"}
                    className="text-[10px] shrink-0"
                  >
                    {url.isActive ? t("Active", "نشط") : t("Inactive", "غير نشط")}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground font-body truncate mb-2">
                  {url.originalUrl}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-body">
                    {url.creator && (
                      <span>{[url.creator.firstName, url.creator.lastName].filter(Boolean).join(' ')}</span>
                    )}
                    <span>{url.clickCount} {t("clicks", "ضغطات")}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewUrl(url)}>
                      <Eye className="w-3.5 h-3.5 text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleToggleStatus(url)}
                      disabled={togglingId === url._id}
                    >
                      {togglingId === url._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Power className={`w-3.5 h-3.5 ${url.isActive ? "text-orange-500" : "text-green-500"}`} />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => navigate(`/dashboard/analytics/${url._id}`)}
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setDeleteDialog({ open: true, id: url._id, code: getShortDisplay(url) })}
                      disabled={deletingId === url._id}
                    >
                      {deletingId === url._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {urls.length === 0 && (
              <div className="text-center py-12 text-muted-foreground font-body text-sm">
                {t("No URLs match your filters.", "لا توجد روابط مطابقة للمعايير.")}
              </div>
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block bg-background border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Short Code", "الرمز القصير")}</TableHead>
                  <TableHead>{t("Original URL", "الرابط الأصلي")}</TableHead>
                  <TableHead>{t("Creator", "المنشئ")}</TableHead>
                  <TableHead className="text-center">{t("Clicks", "الضغطات")}</TableHead>
                  <TableHead className="text-center">{t("Status", "الحالة")}</TableHead>
                  <TableHead>{t("Created", "الإنشاء")}</TableHead>
                  <TableHead className="text-center">{t("Actions", "الإجراءات")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {urls.map((url) => (
                  <TableRow key={url._id}>
                    <TableCell>
                      <a
                        href={getShortUrl(url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-display font-semibold text-primary text-sm flex items-center gap-1 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" /> {getShortDisplay(url)}
                      </a>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground font-body max-w-[200px] truncate block">
                        {url.originalUrl}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-body text-foreground">
                        {url.creator ? [url.creator.firstName, url.creator.lastName].filter(Boolean).join(' ') : "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-display font-semibold text-foreground">{url.clickCount}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={url.isActive ? "default" : "secondary"} className="text-[10px]">
                        {url.isActive ? t("Active", "نشط") : t("Inactive", "غير نشط")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground font-body">{formatDate(url.createdAt)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewUrl(url)}>
                          <Eye className="w-4 h-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleStatus(url)}
                          disabled={togglingId === url._id}
                          title={url.isActive ? t("Deactivate", "تعطيل") : t("Activate", "تفعيل")}
                        >
                          {togglingId === url._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Power className={`w-4 h-4 ${url.isActive ? "text-orange-500" : "text-green-500"}`} />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => navigate(`/dashboard/analytics/${url._id}`)}
                          title={t("Analytics", "التحليلات")}
                        >
                          <BarChart3 className="w-4 h-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setDeleteDialog({ open: true, id: url._id, code: getShortDisplay(url) })}
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
                ))}
              </TableBody>
            </Table>
            {urls.length === 0 && (
              <div className="text-center py-12 text-muted-foreground font-body text-sm">
                {t("No URLs match your filters.", "لا توجد روابط مطابقة للمعايير.")}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
              <p className="text-xs text-muted-foreground font-body order-2 sm:order-1">
                {t(
                  `Showing ${startItem}–${endItem} of ${filteredTotal} URLs`,
                  `عرض ${startItem}–${endItem} من ${filteredTotal} رابط`
                )}
              </p>
              <div className="flex items-center gap-1 order-1 sm:order-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {getPageNumbers(currentPage, totalPages).map((page, idx) =>
                  page === "..." ? (
                    <span key={`ellipsis-${idx}`} className="w-8 text-center text-xs text-muted-foreground">…</span>
                  ) : (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8 text-xs font-body"
                      onClick={() => setCurrentPage(page as number)}
                    >
                      {page}
                    </Button>
                  )
                )}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewUrl} onOpenChange={() => setViewUrl(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("Link Details", "تفاصيل الرابط")}</DialogTitle>
          </DialogHeader>
          {viewUrl && (
            <div className="space-y-5 text-sm font-body">
              <Section label={t("Link Information", "معلومات الرابط")}>
                <Row label={t("Short Code", "الرمز القصير")} value={getShortDisplay(viewUrl)} />
                <Row label={t("Original URL", "الرابط الأصلي")} value={viewUrl.originalUrl} truncate />
                <Row label={t("Title", "العنوان")} value={viewUrl.title || "—"} />
                <Row label={t("Domain", "الدومين")} value={viewUrl.domain || "—"} />
              </Section>
              {viewUrl.creator && (
                <Section label={t("Creator", "المنشئ")}>
                  <Row label={t("Name", "الاسم")} value={[viewUrl.creator.firstName, viewUrl.creator.lastName].filter(Boolean).join(' ')} />
                  <Row label={t("Email", "البريد")} value={viewUrl.creator.email} />
                </Section>
              )}
              <Section label={t("Statistics", "الإحصائيات")}>
                <Row label={t("Total Clicks", "إجمالي الضغطات")} value={String(viewUrl.clickCount)} />
                <Row label={t("Status", "الحالة")} value={viewUrl.isActive ? t("Active", "نشط") : t("Inactive", "غير نشط")} />
              </Section>
              <Section label={t("Dates", "التواريخ")}>
                <Row label={t("Created", "الإنشاء")} value={formatDate(viewUrl.createdAt)} />
                <Row label={t("Last Updated", "آخر تحديث")} value={formatDate(viewUrl.updatedAt)} />
              </Section>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <h4 className="font-display font-semibold text-foreground mb-2 text-xs uppercase tracking-wider text-muted-foreground">
      {label}
    </h4>
    <div className="space-y-1.5 bg-muted/50 rounded-lg p-3">{children}</div>
  </div>
);

const Row = ({ label, value, truncate }: { label: string; value: string; truncate?: boolean }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-muted-foreground shrink-0">{label}</span>
    <span className={`text-foreground font-medium text-right ${truncate ? "truncate max-w-[220px]" : ""}`}>
      {value}
    </span>
  </div>
);

export default UrlManagement;
