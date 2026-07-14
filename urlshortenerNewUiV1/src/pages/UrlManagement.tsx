import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBrandMetaTags } from "@/hooks/useBrandMetaTags";
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
import { Badge } from "@/components/ui/badge";
import { adminService } from "@/services/jwtService";
import { useToast } from "@/hooks/use-toast";
import DateRangeFilter, { DatePreset } from "@/components/DateRangeFilter";
import {
  Link2,
  MousePointer,
  CalendarDays,
  Search,
  Eye,
  Trash2,
  ExternalLink,
  Power,
  Loader2,
  BarChart3,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Layout,
  FileText,
  Globe,
  ShieldAlert,
  QrCode,
} from "lucide-react";

type ContentType = "url" | "bio" | "utm";

type ModerationStatus =
  | "pending"
  | "safe"
  | "suspicious"
  | "blocked"
  | "could_not_verify"
  | "not_scanned";

interface ContentItem {
  _id: string;
  type: ContentType;
  identifier: string; // shortCode or username
  originalUrl?: string;
  title?: string;
  domain?: string;
  clickCount: number;
  isActive: boolean;
  isPublished?: boolean;
  createdAt: string;
  updatedAt: string;
  creator?: { _id: string; firstName: string; lastName: string; email: string };
  moderationStatus?: ModerationStatus;
  moderationVerdict?: Record<string, any> | null;
  qrCodeGenerated?: boolean;
  qrCodeGeneratedAt?: string;
  expiresAt?: string;
  fullTaggedUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

const PAGE_SIZE = 20;

const getSortParams = (sort: string): Record<string, string> => {
  switch (sort) {
    case "oldest":
      return { sortBy: "createdAt", sortOrder: "asc" };
    case "most-clicked":
      return { sortBy: "clickCount", sortOrder: "desc" };
    default:
      return { sortBy: "createdAt", sortOrder: "desc" };
  }
};

const getPublicBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3015/api";
  return apiUrl.replace(/\/api\/?$/, "");
};

const getUrlLink = (item: ContentItem) => {
  if (item.type === "utm") {
    return item.fullTaggedUrl || item.originalUrl || "";
  }
  if (item.type === "bio") {
    const base = getPublicBaseUrl();
    const domain = base.startsWith("http") ? base : `https://${base}`;
    return `${domain}/bio/${item.identifier}`;
  }
  if (item.domain) {
    const domain = item.domain.startsWith("http")
      ? item.domain
      : `https://${item.domain}`;
    return `${domain}/${item.identifier}`;
  }
  const base = getPublicBaseUrl();
  const domain = base.startsWith("http") ? base : `https://${base}`;
  return `${domain}/${item.identifier}`;
};

const UrlManagement = () => {
  useBrandMetaTags();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [creatorFilter, setCreatorFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<ContentType | "all">("all");
  const [domainFilter, setDomainFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();

  const [content, setContent] = useState<ContentItem[]>([]);
  const [contentTotal, setContentTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const [globalStats, setGlobalStats] = useState({
    totalUrls: 0,
    totalBioPages: 0,
    totalClicks: 0,
    newUrlsLast30Days: 0,
    newBioPagesLast30Days: 0,
  });

  const [allCreators, setAllCreators] = useState<Map<string, string>>(
    new Map(),
  );

  const [viewItem, setViewItem] = useState<ContentItem | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string | null;
    name: string;
  }>({
    open: false,
    id: null,
    name: "",
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [reviewItem, setReviewItem] = useState<ContentItem | null>(null);
  const [reviewActionLoading, setReviewActionLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 400);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearch,
    creatorFilter,
    typeFilter,
    domainFilter,
    sortBy,
    fromDate,
    toDate,
  ]);

  const fetchStats = useCallback(async () => {
    try {
      const statsRes = await adminService.getStats();
      const overview = statsRes?.data?.overview ?? {};
      const growth = statsRes?.data?.growth ?? {};
      setGlobalStats({
        totalUrls: overview.totalUrls ?? 0,
        totalBioPages: overview.totalBioPages ?? 0,
        totalClicks: overview.totalClicks ?? 0,
        newUrlsLast30Days: growth.newUrlsLast30Days ?? 0,
        newBioPagesLast30Days: growth.newBioPagesLast30Days ?? 0,
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
        const users: Array<{
          _id: string;
          firstName: string;
          lastName?: string;
        }> = res?.data?.users ?? [];
        users.forEach((u) => {
          if (u._id)
            map.set(u._id, [u.firstName, u.lastName].filter(Boolean).join(" "));
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

  const fetchContent = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const BATCH = 500;
      const urlParams: Record<string, string | number> = {
        page: 1,
        limit: BATCH,
        ...getSortParams(sortBy),
      };
      const bioParams: Record<string, string | number> = {
        page: 1,
        limit: BATCH,
        ...getSortParams(sortBy),
      };
      const utmParams: Record<string, string | number> = {
        page: 1,
        limit: BATCH,
        ...getSortParams(sortBy),
      };

      if (debouncedSearch) {
        urlParams.search = debouncedSearch;
        bioParams.search = debouncedSearch;
        utmParams.search = debouncedSearch;
      }
      if (creatorFilter !== "all") {
        urlParams.creator = creatorFilter;
        bioParams.owner = creatorFilter;
        utmParams.creator = creatorFilter;
      }
      if (fromDate) {
        const startIso = new Date(
          fromDate.getFullYear(),
          fromDate.getMonth(),
          fromDate.getDate(),
          0,
          0,
          0,
          0,
        ).toISOString();
        urlParams.startDate = startIso;
        bioParams.startDate = startIso;
        utmParams.startDate = startIso;
      }
      if (toDate) {
        const endIso = new Date(
          toDate.getFullYear(),
          toDate.getMonth(),
          toDate.getDate(),
          23,
          59,
          59,
          999,
        ).toISOString();
        urlParams.endDate = endIso;
        bioParams.endDate = endIso;
        utmParams.endDate = endIso;
      }

      // Fetch first pages in parallel
      const [urlsRes, bioRes, utmRes] = await Promise.all([
        adminService.getUrls(urlParams),
        adminService.getBioPages(bioParams),
        adminService.getUtmLinks(utmParams),
      ]);

      const urlTotalPages: number = urlsRes?.data?.pagination?.pages ?? 1;
      const bioTotalPages: number = bioRes?.data?.pagination?.pages ?? 1;
      const utmTotalPages: number = utmRes?.data?.pagination?.pages ?? 1;

      // Fetch any remaining pages in parallel so all records are visible
      const [restUrlResults, restBioResults, restUtmResults] =
        await Promise.all([
          urlTotalPages > 1
            ? Promise.all(
                Array.from({ length: urlTotalPages - 1 }, (_, i) =>
                  adminService.getUrls({ ...urlParams, page: i + 2 }),
                ),
              )
            : Promise.resolve([]),
          bioTotalPages > 1
            ? Promise.all(
                Array.from({ length: bioTotalPages - 1 }, (_, i) =>
                  adminService.getBioPages({ ...bioParams, page: i + 2 }),
                ),
              )
            : Promise.resolve([]),
          utmTotalPages > 1
            ? Promise.all(
                Array.from({ length: utmTotalPages - 1 }, (_, i) =>
                  adminService.getUtmLinks({ ...utmParams, page: i + 2 }),
                ),
              )
            : Promise.resolve([]),
        ]);

      const fetchedUrls: Array<{
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
        creator?: {
          _id: string;
          firstName: string;
          lastName: string;
          email: string;
        };
        moderationStatus?: ModerationStatus;
        moderationVerdict?: Record<string, any> | null;
        qrCodeGenerated?: boolean;
        qrCodeGeneratedAt?: string;
        expiresAt?: string;
      }> = [
        ...(urlsRes?.data?.urls ?? []),
        ...restUrlResults.flatMap((r: any) => r?.data?.urls ?? []),
      ];
      const fetchedBioPages: Array<{
        _id: string;
        username: string;
        title?: string;
        totalViews: number;
        isActive: boolean;
        isPublished?: boolean;
        createdAt: string;
        updatedAt: string;
        owner?: {
          _id: string;
          firstName: string;
          lastName: string;
          email: string;
        };
      }> = [
        ...(bioRes?.data?.bioPages ?? []),
        ...restBioResults.flatMap((r: any) => r?.data?.bioPages ?? []),
      ];

      const fetchedUtmLinks: Array<{
        _id: string;
        name?: string;
        destinationUrl: string;
        fullTaggedUrl: string;
        utmSource?: string;
        utmMedium?: string;
        utmCampaign?: string;
        utmTerm?: string;
        utmContent?: string;
        createdAt: string;
        updatedAt: string;
        creator?: {
          _id: string;
          firstName: string;
          lastName: string;
          email: string;
        };
      }> = [
        ...(utmRes?.data?.utmLinks ?? []),
        ...restUtmResults.flatMap((r: any) => r?.data?.utmLinks ?? []),
      ];

      const urlItems: ContentItem[] = fetchedUrls.map((u) => ({
        _id: u._id,
        type: "url",
        identifier: u.customCode || u.shortCode,
        originalUrl: u.originalUrl,
        title: u.title,
        domain: u.domain,
        clickCount: u.clickCount,
        isActive: u.isActive,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        creator: u.creator,
        moderationStatus: u.moderationStatus,
        moderationVerdict: u.moderationVerdict,
        qrCodeGenerated: u.qrCodeGenerated,
        qrCodeGeneratedAt: u.qrCodeGeneratedAt,
        expiresAt: u.expiresAt,
      }));

      const bioItems: ContentItem[] = fetchedBioPages.map((b) => ({
        _id: b._id,
        type: "bio",
        identifier: b.username,
        title: b.title,
        clickCount: b.totalViews,
        isActive: b.isActive,
        isPublished: b.isPublished,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        creator: b.owner,
      }));

      const utmItems: ContentItem[] = fetchedUtmLinks.map((u) => ({
        _id: u._id,
        type: "utm",
        identifier: u.name || u.utmCampaign || u.destinationUrl,
        originalUrl: u.destinationUrl,
        title: u.name,
        clickCount: 0,
        isActive: true,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        creator: u.creator,
        fullTaggedUrl: u.fullTaggedUrl,
        utmSource: u.utmSource,
        utmMedium: u.utmMedium,
        utmCampaign: u.utmCampaign,
        utmTerm: u.utmTerm,
        utmContent: u.utmContent,
      }));

      const merged = [...urlItems, ...bioItems, ...utmItems];

      // Sort merged list
      merged.sort((a, b) => {
        if (sortBy === "most-clicked") {
          return b.clickCount - a.clickCount;
        }
        if (sortBy === "oldest") {
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        }
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      const total = merged.length;
      setContent(merged);
      setContentTotal(total);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, creatorFilter, sortBy, fromDate, toDate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);
  useEffect(() => {
    fetchAllCreators();
  }, [fetchAllCreators]);
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const creators = Array.from(allCreators.entries()).sort(([, a], [, b]) =>
    a.localeCompare(b),
  );

  const domainOptions = useMemo(() => {
    const custom = new Set<string>();
    let hasDefault = false;
    content.forEach((c) => {
      if (c.type !== "url") return;
      if (c.domain) custom.add(c.domain);
      else hasDefault = true;
    });
    return { custom: Array.from(custom).sort(), hasDefault };
  }, [content]);

  const typeFilteredContent = useMemo(() => {
    let result = content;
    if (typeFilter !== "all")
      result = result.filter((c) => c.type === typeFilter);
    if (domainFilter === "__default__")
      result = result.filter((c) => !c.domain);
    else if (domainFilter !== "all")
      result = result.filter((c) => c.domain === domainFilter);
    return result;
  }, [content, typeFilter, domainFilter]);

  const paginatedContent = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return typeFilteredContent.slice(start, start + PAGE_SIZE);
  }, [typeFilteredContent, currentPage]);

  const handleToggleStatus = async (item: ContentItem) => {
    setTogglingId(item._id);
    try {
      if (item.type === "url") {
        await adminService.updateUrl(item._id, { isActive: !item.isActive });
      } else {
        await adminService.updateBioPage(item._id, {
          isActive: !item.isActive,
        });
      }
      setContent((prev) =>
        prev.map((c) =>
          c._id === item._id ? { ...c, isActive: !c.isActive } : c,
        ),
      );
      toast({
        title: item.isActive
          ? item.type === "url"
            ? t("URL deactivated", "تم تعطيل الرابط")
            : t("Bio page deactivated", "تم تعطيل صفحة البايو")
          : item.type === "url"
            ? t("URL activated", "تم تفعيل الرابط")
            : t("Bio page activated", "تم تفعيل صفحة البايو"),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({
        title: t("Update failed", "فشل التحديث"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleModerationDecision = async (
    item: ContentItem,
    action: "ALLOW" | "BLOCK",
  ) => {
    setReviewActionLoading(true);
    try {
      await adminService.updateUrlModeration(item._id, action);
      const moderationStatus: ModerationStatus =
        action === "ALLOW" ? "safe" : "blocked";
      setContent((prev) =>
        prev.map((c) => (c._id === item._id ? { ...c, moderationStatus } : c)),
      );
      toast({
        title:
          action === "ALLOW"
            ? t("Link allowed", "تم السماح بالرابط")
            : t("Link blocked", "تم حظر الرابط"),
      });
      setReviewItem(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({
        title: t("Update failed", "فشل التحديث"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setReviewActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.id) return;
    setDeletingId(deleteDialog.id);
    setDeleteDialog((d) => ({ ...d, open: false }));
    try {
      const item = content.find((c) => c._id === deleteDialog.id);
      if (item?.type === "url") {
        await adminService.deleteUrl(deleteDialog.id);
      } else if (item?.type === "utm") {
        await adminService.deleteUtmLink(deleteDialog.id);
      } else {
        await adminService.deleteBioPage(deleteDialog.id);
      }
      setContent((prev) => prev.filter((c) => c._id !== deleteDialog.id));
      setContentTotal((n) => Math.max(0, n - 1));
      toast({
        title:
          item?.type === "url"
            ? t("URL deleted", "تم حذف الرابط")
            : item?.type === "utm"
              ? t("UTM link deleted", "تم حذف رابط UTM")
              : t("Bio page deleted", "تم حذف صفحة البايو"),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({
        title: t("Delete failed", "فشل الحذف"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const totalInteractions = typeFilteredContent.reduce(
    (sum, c) => sum + c.clickCount,
    0,
  );
  const filteredTotal = typeFilteredContent.length;

  const getDisplayDomain = (item: ContentItem) => {
    if (item.type === "bio" || item.type === "utm") return "—";
    if (!item.domain) return t("Default", "افتراضي");
    return item.domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  };

  // Extensible type label maps — add new types here without structural changes
  const typeLabels: Record<ContentType, { en: string; ar: string }> = {
    url: { en: "Short Link", ar: "رابط مختصر" },
    bio: { en: "Bio Page", ar: "صفحة بايو" },
    utm: { en: "UTM Link", ar: "رابط UTM" },
  };
  const getTypeLabel = (type: ContentType) =>
    t(typeLabels[type].en, typeLabels[type].ar);
  const typeBadgeVariants: Record<
    ContentType,
    "default" | "secondary" | "outline"
  > = {
    url: "default",
    bio: "secondary",
    utm: "outline",
  };

  const statCards = [
    {
      label: t("Total Content", "إجمالي المحتوى"),
      value: globalStats.totalUrls + globalStats.totalBioPages,
      icon: FileText,
    },
    {
      label: t("Total Interactions", "إجمالي التفاعلات"),
      value: totalInteractions,
      icon: MousePointer,
    },
    {
      label: t("New Content (30d)", "محتوى جديد (30 يوم)"),
      value: globalStats.newUrlsLast30Days + globalStats.newBioPagesLast30Days,
      icon: CalendarDays,
    },
    {
      label: t("Total Bio Pages", "إجمالي صفحات التعريف"),
      value: globalStats.totalBioPages,
      icon: Layout,
    },
  ];

  const getPageNumbers = (
    current: number,
    total: number,
  ): (number | "...")[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
    if (current >= total - 3)
      return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
    return [1, "...", current - 1, current, current + 1, "...", total];
  };

  const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));
  const startItem = filteredTotal === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, filteredTotal);

  return (
    <DashboardLayout>
      {/* Delete confirmation */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((d) => ({ ...d, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete", "حذف")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                `Are you sure you want to delete "${deleteDialog.name}"? This action cannot be undone.`,
                `هل أنت متأكد من حذف "${deleteDialog.name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
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

      {/* Date Filter */}
      <div className="mb-4 sm:mb-6">
        <DateRangeFilter
          value={datePreset}
          range={{ fromDate, toDate }}
          onChange={(preset, range) => {
            setDatePreset(preset);
            setFromDate(range.fromDate);
            setToDate(range.toDate);
          }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="bg-background border border-border rounded-xl p-3 sm:p-5"
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <s.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              </div>
            </div>
            <p className="text-lg sm:text-2xl font-display font-bold text-foreground">
              {s.value}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-body mt-1">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t(
              "Search by short code, URL, title, username, or creator...",
              "ابحث بالرمز أو الرابط أو العنوان أو اسم المستخدم...",
            )}
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="ps-9 text-sm"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as ContentType | "all")}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={t("Filter by type", "فلتر بالنوع")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("All Types", "جميع الأنواع")}
            </SelectItem>
            {(Object.keys(typeLabels) as ContentType[]).map((type) => (
              <SelectItem key={type} value={type}>
                {getTypeLabel(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={domainFilter} onValueChange={setDomainFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <Globe className="w-3.5 h-3.5 text-muted-foreground me-1.5 shrink-0" />
            <SelectValue placeholder={t("Filter by domain", "فلتر بالنطاق")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("All Domains", "كل النطاقات")}
            </SelectItem>
            {domainOptions.hasDefault && (
              <SelectItem value="__default__">
                {t("Default Domain", "النطاق الافتراضي")}
              </SelectItem>
            )}
            {domainOptions.custom.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={creatorFilter} onValueChange={setCreatorFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t("Filter by user", "فلتر بالمستخدم")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("All Users", "جميع المستخدمين")}
            </SelectItem>
            {creators.map(([id, name]) => (
              <SelectItem key={id} value={id}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-52">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground me-2 shrink-0" />
            <SelectValue placeholder={t("Sort by", "ترتيب حسب")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">
              {t("Newest first", "الأحدث أولاً")}
            </SelectItem>
            <SelectItem value="oldest">
              {t("Oldest first", "الأقدم أولاً")}
            </SelectItem>
            <SelectItem value="most-clicked">
              {t("Most interactions", "الأكثر تفاعلاً")}
            </SelectItem>
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
            {t(
              "Failed to load content. Please try again.",
              "فشل تحميل المحتوى. حاول مرة أخرى.",
            )}
          </p>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {paginatedContent.map((item) => (
              <div
                key={`${item.type}-${item._id}`}
                className="bg-background border border-border rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-display font-semibold text-foreground">
                        {item.title || item.identifier}
                      </p>
                      <Badge
                        variant={typeBadgeVariants[item.type]}
                        className="text-[9px] px-1.5 py-0 h-4"
                      >
                        {getTypeLabel(item.type)}
                      </Badge>
                      {item.type === "url" && item.qrCodeGenerated && (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1.5 py-0 h-4 gap-0.5"
                        >
                          <QrCode className="w-2.5 h-2.5" />
                          {t("QR", "QR")}
                        </Badge>
                      )}
                    </div>
                    <a
                      href={getUrlLink(item)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary font-body flex items-center gap-1 mt-0.5 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />{" "}
                      {item.identifier}
                    </a>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge
                      variant={item.isActive ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {item.isActive
                        ? t("Active", "نشط")
                        : t("Inactive", "غير نشط")}
                    </Badge>
                    {item.type === "url" && (
                      <ModerationBadge
                        status={item.moderationStatus}
                        t={t}
                        showSafe
                        onClick={() => setReviewItem(item)}
                      />
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground font-body truncate mb-2">
                  {item.type === "url" ? item.originalUrl : item.title || "—"}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-body">
                    {item.creator && (
                      <span>
                        {[item.creator.firstName, item.creator.lastName]
                          .filter(Boolean)
                          .join(" ")}
                      </span>
                    )}
                    <span>
                      {item.clickCount} {t("interactions", "تفاعل")}
                    </span>
                    <span className="truncate max-w-[100px]">
                      {getDisplayDomain(item)}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setViewItem(item)}
                    >
                      <Eye className="w-3.5 h-3.5 text-primary" />
                    </Button>
                    {item.type !== "utm" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleToggleStatus(item)}
                        disabled={togglingId === item._id}
                      >
                        {togglingId === item._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Power
                            className={`w-3.5 h-3.5 ${item.isActive ? "text-orange-500" : "text-green-500"}`}
                          />
                        )}
                      </Button>
                    )}
                    {item.type === "url" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          navigate(`/dashboard/analytics/${item._id}`)
                        }
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-primary" />
                      </Button>
                    )}
                    {item.type === "url" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setReviewItem(item)}
                        title={t("Review content scan", "مراجعة فحص المحتوى")}
                      >
                        <ShieldAlert
                          className={`w-3.5 h-3.5 ${
                            item.moderationStatus === "suspicious"
                              ? "text-amber-500"
                              : item.moderationStatus === "blocked"
                                ? "text-red-500"
                                : "text-muted-foreground"
                          }`}
                        />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        setDeleteDialog({
                          open: true,
                          id: item._id,
                          name: item.identifier,
                        })
                      }
                      disabled={deletingId === item._id}
                    >
                      {deletingId === item._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {paginatedContent.length === 0 && (
              <div className="text-center py-12 text-muted-foreground font-body text-sm">
                {t(
                  "No content matches your filters.",
                  "لا يوجد محتوى مطابق للمعايير.",
                )}
              </div>
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block bg-background border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Link Type", "نوع الرابط")}</TableHead>
                  <TableHead>{t("Identifier", "المعرف")}</TableHead>
                  <TableHead>{t("Title / URL", "العنوان / الرابط")}</TableHead>
                  <TableHead>{t("Creator", "المنشئ")}</TableHead>
                  <TableHead>{t("Domain", "الدومين")}</TableHead>
                  <TableHead className="text-center">
                    {t("Interactions", "التفاعلات")}
                  </TableHead>
                  <TableHead className="text-center">
                    {t("Status", "الحالة")}
                  </TableHead>
                  <TableHead className="text-center">
                    {t("Content Scan", "فحص المحتوى")}
                  </TableHead>
                  <TableHead>{t("Created", "الإنشاء")}</TableHead>
                  <TableHead className="text-center">
                    {t("Actions", "الإجراءات")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedContent.map((item) => (
                  <TableRow key={`${item.type}-${item._id}`}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Badge
                          variant={typeBadgeVariants[item.type]}
                          className="text-[10px]"
                        >
                          {getTypeLabel(item.type)}
                        </Badge>
                        {item.type === "url" && item.qrCodeGenerated && (
                          <Badge
                            variant="outline"
                            className="text-[10px] gap-0.5"
                          >
                            <QrCode className="w-3 h-3" />
                            {t("QR", "QR")}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <a
                        href={getUrlLink(item)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-display font-semibold text-primary text-sm flex items-center gap-1 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" /> {item.identifier}
                      </a>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground font-body max-w-[200px] truncate block">
                        {item.type === "url"
                          ? item.originalUrl
                          : item.title || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-body text-foreground">
                        {item.creator
                          ? [item.creator.firstName, item.creator.lastName]
                              .filter(Boolean)
                              .join(" ")
                          : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-body text-muted-foreground">
                        {getDisplayDomain(item)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-display font-semibold text-foreground">
                        {item.clickCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={item.isActive ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {item.isActive
                          ? t("Active", "نشط")
                          : t("Inactive", "غير نشط")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.type === "url" ? (
                        <ModerationBadge
                          status={item.moderationStatus}
                          t={t}
                          showSafe
                          onClick={() => setReviewItem(item)}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground font-body">
                        {formatDate(item.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setViewItem(item)}
                        >
                          <Eye className="w-4 h-4 text-secondary" />
                        </Button>
                        {item.type !== "utm" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleToggleStatus(item)}
                            disabled={togglingId === item._id}
                            title={
                              item.isActive
                                ? t("Deactivate", "تعطيل")
                                : t("Activate", "تفعيل")
                            }
                          >
                            {togglingId === item._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Power
                                className={`w-4 h-4 ${item.isActive ? "text-orange-500" : "text-green-500"}`}
                              />
                            )}
                          </Button>
                        )}
                        {item.type === "url" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              navigate(`/dashboard/analytics/${item._id}`)
                            }
                            title={t("Analytics", "التحليلات")}
                          >
                            <BarChart3 className="w-4 h-4 text-secondary" />
                          </Button>
                        )}
                        {item.type === "url" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setReviewItem(item)}
                            title={t(
                              "Review content scan",
                              "مراجعة فحص المحتوى",
                            )}
                          >
                            <ShieldAlert
                              className={`w-4 h-4 ${
                                item.moderationStatus === "suspicious"
                                  ? "text-amber-500"
                                  : item.moderationStatus === "blocked"
                                    ? "text-red-500"
                                    : "text-muted-foreground"
                              }`}
                            />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            setDeleteDialog({
                              open: true,
                              id: item._id,
                              name: item.identifier,
                            })
                          }
                          disabled={deletingId === item._id}
                        >
                          {deletingId === item._id ? (
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
            {paginatedContent.length === 0 && (
              <div className="text-center py-12 text-muted-foreground font-body text-sm">
                {t(
                  "No content matches your filters.",
                  "لا يوجد محتوى مطابق للمعايير.",
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
              <p className="text-xs text-muted-foreground font-body order-2 sm:order-1">
                {t(
                  `Showing ${startItem}–${endItem} of ${contentTotal} entries`,
                  `عرض ${startItem}–${endItem} من ${contentTotal} إدخال`,
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
                    <span
                      key={`ellipsis-${idx}`}
                      className="w-8 text-center text-xs text-muted-foreground"
                    >
                      …
                    </span>
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
                  ),
                )}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
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
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {viewItem?.type === "url"
                ? t("Link Details", "تفاصيل الرابط")
                : t("Bio Page Details", "تفاصيل صفحة البايو")}
            </DialogTitle>
          </DialogHeader>
          {viewItem && viewItem.type === "url" && (
            <div className="space-y-5 text-sm font-body">
              <Section label={t("Link Information", "معلومات الرابط")}>
                <Row
                  label={t("Short Code", "الرمز القصير")}
                  value={viewItem.identifier}
                />
                <Row
                  label={t("Original URL", "الرابط الأصلي")}
                  value={viewItem.originalUrl || "—"}
                  truncate
                />
                <Row
                  label={t("Title", "العنوان")}
                  value={viewItem.title || "—"}
                />
                <Row
                  label={t("Domain", "الدومين")}
                  value={viewItem.domain || "—"}
                />
                <Row
                  label={t("QR Code", "كود QR")}
                  value={
                    viewItem.qrCodeGenerated
                      ? t("Generated", "تم إنشاؤه") +
                        (viewItem.qrCodeGeneratedAt
                          ? ` (${formatDate(viewItem.qrCodeGeneratedAt)})`
                          : "")
                      : t("Not generated", "لم يتم إنشاؤه")
                  }
                />
              </Section>
              {viewItem.creator && (
                <Section label={t("Creator", "المنشئ")}>
                  <Row
                    label={t("Name", "الاسم")}
                    value={[
                      viewItem.creator.firstName,
                      viewItem.creator.lastName,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                  <Row
                    label={t("Email", "البريد")}
                    value={viewItem.creator.email}
                  />
                </Section>
              )}
              <Section label={t("Statistics", "الإحصائيات")}>
                <Row
                  label={t("Total Clicks", "إجمالي الضغطات")}
                  value={String(viewItem.clickCount)}
                />
                <Row
                  label={t("Status", "الحالة")}
                  value={
                    viewItem.isActive
                      ? t("Active", "نشط")
                      : t("Inactive", "غير نشط")
                  }
                />
              </Section>
              <Section label={t("Dates", "التواريخ")}>
                <Row
                  label={t("Created", "الإنشاء")}
                  value={formatDate(viewItem.createdAt)}
                />
                <Row
                  label={t("Last Updated", "آخر تحديث")}
                  value={formatDate(viewItem.updatedAt)}
                />
                <Row
                  label={t("Expires", "تاريخ الانتهاء")}
                  value={
                    viewItem.expiresAt
                      ? `${formatDate(viewItem.expiresAt)}${
                          new Date(viewItem.expiresAt) < new Date()
                            ? ` (${t("expired", "منتهي")})`
                            : ""
                        }`
                      : t("Never", "أبداً")
                  }
                />
              </Section>
            </div>
          )}
          {viewItem && viewItem.type === "bio" && (
            <div className="space-y-5 text-sm font-body">
              <Section label={t("Bio Page Information", "معلومات صفحة البايو")}>
                <Row
                  label={t("Username", "اسم المستخدم")}
                  value={viewItem.identifier}
                />
                <Row
                  label={t("Title", "العنوان")}
                  value={viewItem.title || "—"}
                />
                <Row
                  label={t("Public URL", "الرابط العام")}
                  value={getUrlLink(viewItem)}
                  truncate
                />
              </Section>
              {viewItem.creator && (
                <Section label={t("Creator", "المنشئ")}>
                  <Row
                    label={t("Name", "الاسم")}
                    value={[
                      viewItem.creator.firstName,
                      viewItem.creator.lastName,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                  <Row
                    label={t("Email", "البريد")}
                    value={viewItem.creator.email}
                  />
                </Section>
              )}
              <Section label={t("Statistics", "الإحصائيات")}>
                <Row
                  label={t("Total Views", "إجمالي المشاهدات")}
                  value={String(viewItem.clickCount)}
                />
                <Row
                  label={t("Status", "الحالة")}
                  value={
                    viewItem.isActive
                      ? t("Active", "نشط")
                      : t("Inactive", "غير نشط")
                  }
                />
                <Row
                  label={t("Published", "منشور")}
                  value={viewItem.isPublished ? t("Yes", "نعم") : t("No", "لا")}
                />
              </Section>
              <Section label={t("Dates", "التواريخ")}>
                <Row
                  label={t("Created", "الإنشاء")}
                  value={formatDate(viewItem.createdAt)}
                />
                <Row
                  label={t("Last Updated", "آخر تحديث")}
                  value={formatDate(viewItem.updatedAt)}
                />
              </Section>
            </div>
          )}
          {viewItem && viewItem.type === "utm" && (
            <div className="space-y-5 text-sm font-body">
              <Section label={t("UTM Link Information", "معلومات رابط UTM")}>
                <Row label={t("Name", "الاسم")} value={viewItem.title || "—"} />
                <Row
                  label={t("Destination URL", "رابط الوجهة")}
                  value={viewItem.originalUrl || "—"}
                  truncate
                />
                <Row
                  label={t("Tagged URL", "الرابط الموسوم")}
                  value={viewItem.fullTaggedUrl || "—"}
                  truncate
                />
              </Section>
              <Section label={t("UTM Parameters", "معاملات UTM")}>
                <Row label="utm_source" value={viewItem.utmSource || "—"} />
                <Row label="utm_medium" value={viewItem.utmMedium || "—"} />
                <Row label="utm_campaign" value={viewItem.utmCampaign || "—"} />
                <Row label="utm_term" value={viewItem.utmTerm || "—"} />
                <Row label="utm_content" value={viewItem.utmContent || "—"} />
              </Section>
              {viewItem.creator && (
                <Section label={t("Creator", "المنشئ")}>
                  <Row
                    label={t("Name", "الاسم")}
                    value={[
                      viewItem.creator.firstName,
                      viewItem.creator.lastName,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  />
                  <Row
                    label={t("Email", "البريد")}
                    value={viewItem.creator.email}
                  />
                </Section>
              )}
              <Section label={t("Dates", "التواريخ")}>
                <Row
                  label={t("Created", "الإنشاء")}
                  value={formatDate(viewItem.createdAt)}
                />
              </Section>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Moderation Review Dialog */}
      <Dialog
        open={!!reviewItem}
        onOpenChange={(open) => !open && setReviewItem(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {t("Review Content Scan", "مراجعة فحص المحتوى")}
            </DialogTitle>
          </DialogHeader>
          {reviewItem && (
            <div className="space-y-5 text-sm font-body">
              <Section label={t("Link", "الرابط")}>
                <Row
                  label={t("Short Code", "الرمز القصير")}
                  value={reviewItem.identifier}
                />
                <Row
                  label={t("Destination", "الوجهة")}
                  value={reviewItem.originalUrl || "—"}
                  truncate
                />
                <Row
                  label={t("Current Status", "الحالة الحالية")}
                  value={
                    reviewItem.moderationStatus
                      ? t(
                          MODERATION_LABELS[reviewItem.moderationStatus].en,
                          MODERATION_LABELS[reviewItem.moderationStatus].ar,
                        )
                      : "—"
                  }
                />
              </Section>
              <Section label={t("Scan Verdict", "نتيجة الفحص")}>
                <Row
                  label={t("Category", "الفئة")}
                  value={String(reviewItem.moderationVerdict?.category ?? "—")}
                />
                <Row
                  label={t("Confidence", "درجة الثقة")}
                  value={String(
                    reviewItem.moderationVerdict?.confidence ?? "—",
                  )}
                />
                <Row
                  label={t("Flags", "الإشارات")}
                  value={
                    Array.isArray(reviewItem.moderationVerdict?.flags) &&
                    reviewItem.moderationVerdict.flags.length > 0
                      ? reviewItem.moderationVerdict.flags.join(", ")
                      : "—"
                  }
                />
                <Row
                  label={t("Reason", "السبب")}
                  value={String(reviewItem.moderationVerdict?.reason ?? "—")}
                  truncate
                />
              </Section>
              {reviewItem.moderationVerdict?.pipelineTrace && (
                <Section label={t("Pipeline Trace", "تتبع خط المعالجة")}>
                  <Row
                    label={t("Safe Browsing", "التصفح الآمن")}
                    value={
                      reviewItem.moderationVerdict.pipelineTrace.safeBrowsing
                        ?.available
                        ? t("Checked", "تم الفحص")
                        : t("Unavailable", "غير متاح")
                    }
                  />
                  <Row
                    label={t("SafeBrowz", "SafeBrowz")}
                    value={
                      reviewItem.moderationVerdict.pipelineTrace.safebrowz
                        ?.verdict ?? t("Unavailable", "غير متاح")
                    }
                  />
                  <Row
                    label={t("Firecrawl", "Firecrawl")}
                    value={
                      reviewItem.moderationVerdict.pipelineTrace.firecrawl
                        ?.available
                        ? t("Content read", "تمت قراءة المحتوى")
                        : t("Unavailable", "غير متاح")
                    }
                  />
                  <Row
                    label={t("Claude", "Claude")}
                    value={
                      reviewItem.moderationVerdict.pipelineTrace.claude?.ran
                        ? t("Ran", "تم التشغيل")
                        : t("Skipped", "تم التخطي")
                    }
                  />
                </Section>
              )}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => handleModerationDecision(reviewItem, "BLOCK")}
                  disabled={reviewActionLoading}
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  {reviewActionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : null}
                  {t("Block Link", "حظر الرابط")}
                </Button>
                <Button
                  onClick={() => handleModerationDecision(reviewItem, "ALLOW")}
                  disabled={reviewActionLoading}
                >
                  {reviewActionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : null}
                  {t("Allow Link", "السماح بالرابط")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

const Section = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <h4 className="font-display font-semibold text-foreground mb-2 text-xs uppercase tracking-wider text-muted-foreground">
      {label}
    </h4>
    <div className="space-y-1.5 bg-muted/50 rounded-lg p-3">{children}</div>
  </div>
);

const Row = ({
  label,
  value,
  truncate,
}: {
  label: string;
  value: string;
  truncate?: boolean;
}) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-muted-foreground shrink-0">{label}</span>
    <span
      className={`text-foreground font-medium text-right ${truncate ? "truncate max-w-[220px]" : ""}`}
    >
      {value}
    </span>
  </div>
);

const MODERATION_LABELS: Record<
  ModerationStatus,
  { en: string; ar: string; className: string }
> = {
  pending: {
    en: "Scanning",
    ar: "قيد الفحص",
    className: "bg-muted text-muted-foreground",
  },
  safe: { en: "Safe", ar: "آمن", className: "bg-green-100 text-green-700" },
  suspicious: {
    en: "Flagged",
    ar: "مشتبه به",
    className: "bg-amber-100 text-amber-700",
  },
  blocked: { en: "Blocked", ar: "محظور", className: "bg-red-100 text-red-700" },
  could_not_verify: {
    en: "Unverified",
    ar: "غير مؤكد",
    className: "bg-muted text-muted-foreground",
  },
  not_scanned: {
    en: "Not Scanned",
    ar: "لم يُفحص",
    className: "bg-muted text-muted-foreground",
  },
};

// Every status is clickable when onClick is passed, so admins can open the
// review dialog and allow/block a link manually regardless of its current
// scan verdict, not just when it's flagged "suspicious".
const ModerationBadge = ({
  status,
  t,
  showSafe = false,
  onClick,
}: {
  status?: ModerationStatus;
  t: (en: string, ar: string) => string;
  showSafe?: boolean;
  onClick?: () => void;
}) => {
  if (!status)
    return showSafe ? (
      <span className="text-xs text-muted-foreground">—</span>
    ) : null;
  if (status === "safe" && !showSafe) return null;
  const info = MODERATION_LABELS[status];
  if (!onClick) {
    return (
      <Badge className={`text-[10px] border-0 ${info.className}`}>
        {t(info.en, info.ar)}
      </Badge>
    );
  }
  return (
    <Badge
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      title={t(
        "Click to review and allow/block this link",
        "انقر للمراجعة والسماح/الحظر لهذا الرابط",
      )}
      className={`text-[10px] border-0 cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring ${info.className}`}
    >
      {t(info.en, info.ar)}
    </Badge>
  );
};

export default UrlManagement;
