import { useState, useEffect, useCallback, useMemo } from "react";
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
  Users, UserPlus, Link2, CalendarDays, Trash2, Search,
  BarChart3, Loader2, MapPin, Globe, Phone, ChevronLeft, ChevronRight, LogIn, QrCode, Code2,
} from "lucide-react";
import { adminService } from "@/services/jwtService";
import { useToast } from "@/hooks/use-toast";
import DateRangeFilter, { DatePreset } from "@/components/DateRangeFilter";

type Role = "super_admin" | "admin" | "user" | "viewer";

interface AdminUser {
  _id: string;
  firstName: string;
  lastName?: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  phone?: string;
  googleId?: string;
  urlCount?: number;
  registrationLocation?: {
    country?: string;
    city?: string;
  };
  usage?: {
    urlsCreatedTotal?: number;
  };
}

const PAGE_SIZE = 12;

const getPageNumbers = (current: number, total: number): (number | "...")[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
};

const roleBadgeColors: Record<string, string> = {
  super_admin: "bg-destructive/10 text-destructive",
  admin: "bg-primary/10 text-primary",
  user: "bg-accent text-accent-foreground",
  viewer: "bg-muted text-muted-foreground",
};

const UserManagement = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [linksSort, setLinksSort] = useState<"default" | "most" | "least" | "latest">("default");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const [globalStats, setGlobalStats] = useState({
    totalDomains: 0,
    totalQRCodes: 0,
    apiUsers: 0,
    linkSources: { landing: 0, dashboard: 0, api: 0, bulk: 0 },
  });

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null; name: string }>({
    open: false, id: null, name: "",
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const BATCH = 500;
      // First batch + stats in parallel
      const [firstRes, statsRes] = await Promise.all([
        adminService.getUsers({ limit: BATCH, page: 1 }),
        adminService.getStats(),
      ]);

      const firstUsers: AdminUser[] = firstRes?.data?.users ?? [];
      const totalPages: number = firstRes?.data?.pagination?.pages ?? 1;

      // Fetch all remaining pages in parallel so we never miss users beyond page 1
      let allUsers: AdminUser[] = [...firstUsers];
      if (totalPages > 1) {
        const rest = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) =>
            adminService.getUsers({ limit: BATCH, page: i + 2 })
          )
        );
        rest.forEach((res) => {
          allUsers = allUsers.concat(res?.data?.users ?? []);
        });
      }

      setUsers(allUsers);
      const overview = statsRes?.data?.overview ?? {};
      setGlobalStats({
        totalDomains: overview.totalDomains ?? 0,
        totalQRCodes: overview.totalQRCodes ?? 0,
        apiUsers: overview.apiUsers ?? 0,
        linkSources: {
          landing: overview.linkSources?.landing ?? 0,
          dashboard: overview.linkSources?.dashboard ?? 0,
          api: overview.linkSources?.api ?? 0,
          bulk: overview.linkSources?.bulk ?? 0,
        },
      });
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => { setCurrentPage(1); }, [search, roleFilter, linksSort, fromDate, toDate]);

  const filtered = useMemo(() => {
    const result = users.filter((u) => {
      const name = [u.firstName, u.lastName].filter(Boolean).join(' ');
      const matchSearch =
        name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "all" || u.role === roleFilter;

      let matchDate = true;
      if (fromDate || toDate) {
        const userDate = new Date(u.createdAt);
        userDate.setHours(0, 0, 0, 0);
        if (fromDate) {
          const from = new Date(fromDate);
          from.setHours(0, 0, 0, 0);
          if (userDate < from) matchDate = false;
        }
        if (toDate) {
          const to = new Date(toDate);
          to.setHours(23, 59, 59, 999);
          if (userDate > to) matchDate = false;
        }
      }

      return matchSearch && matchRole && matchDate;
    });

    if (linksSort === "most") {
      result.sort((a, b) => {
        const aLinks = a.usage?.urlsCreatedTotal ?? a.urlCount ?? 0;
        const bLinks = b.usage?.urlsCreatedTotal ?? b.urlCount ?? 0;
        return bLinks - aLinks;
      });
    } else if (linksSort === "least") {
      result.sort((a, b) => {
        const aLinks = a.usage?.urlsCreatedTotal ?? a.urlCount ?? 0;
        const bLinks = b.usage?.urlsCreatedTotal ?? b.urlCount ?? 0;
        return aLinks - bLinks;
      });
    } else if (linksSort === "latest") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [users, search, roleFilter, linksSort, fromDate, toDate]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const filteredStats = useMemo(() => {
    const totalUsers = filtered.length;
    const activeUsers = filtered.filter(u => u.isActive).length;
    const usersWithLinks = filtered.filter(u => (u.usage?.urlsCreatedTotal ?? u.urlCount ?? 0) > 0).length;
    const totalLinks = filtered.reduce((sum, u) => sum + (u.usage?.urlsCreatedTotal ?? u.urlCount ?? 0), 0);
    const avgLinksPerUser = totalUsers > 0 ? Math.round((totalLinks / totalUsers) * 10) / 10 : 0;
    const googleSSOUsers = filtered.filter(u => u.googleId).length;
    return { totalUsers, activeUsers, usersWithLinks, avgLinksPerUser, totalLinks, googleSSOUsers };
  }, [filtered]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      await adminService.updateUser(userId, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole as Role } : u))
      );
      toast({ title: t("Role updated", "تم تحديث الدور") });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({
        title: t("Update failed", "فشل التحديث"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.id) return;
    setDeletingId(deleteDialog.id);
    setDeleteDialog((d) => ({ ...d, open: false }));
    try {
      await adminService.deleteUser(deleteDialog.id);
      setUsers((prev) => prev.filter((u) => u._id !== deleteDialog.id));
      toast({ title: t("User deleted", "تم حذف المستخدم") });
    } catch (err) {
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

  const formatDate = (d?: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const statCards = [
    { label: t("Number of Signups", "عدد المُسجّلين"), value: filteredStats.totalUsers, icon: Users },
    { label: t("Users With Links", "مستخدمون لديهم روابط"), value: filteredStats.usersWithLinks, icon: Link2 },
    { label: t("Avg Links per User", "متوسط الروابط لكل مستخدم"), value: filteredStats.avgLinksPerUser, icon: BarChart3 },
    // { label: t("Active Users", "المستخدمون النشطون"), value: filteredStats.activeUsers, icon: UserPlus },
    { label: t("Total Domains", "إجمالي النطاقات"), value: globalStats.totalDomains, icon: Globe },
    { label: t("Google SSO Users", "مستخدمو Google SSO"), value: filteredStats.googleSSOUsers, icon: LogIn },
    { label: t("Total QR Codes Created", "إجمالي QR Codes المُنشأة"), value: globalStats.totalQRCodes, icon: QrCode },
    { label: t("Users Using API", "المستخدمون عبر API"), value: globalStats.apiUsers, icon: Code2 },
  ];

  return (
    <DashboardLayout>
      {/* Delete confirmation */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((d) => ({ ...d, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete Account", "حذف الحساب")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                `Are you sure you want to delete "${deleteDialog.name}"? This action cannot be undone.`,
                `هل أنت متأكد من حذف "${deleteDialog.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
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

      <h1 className="text-2xl font-display font-bold text-foreground mb-6">
        {t("User Management", "إدارة المستخدمين")}
      </h1>

      {/* Date Filter — placed above stats */}
      <div className="mb-6">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        {statCards.map((s) => (
          <div key={s.label} className="bg-background border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <s.icon className="w-4 h-4 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground font-body mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Link Creation Sources Breakdown */}
      {(() => {
        const sources = [
          { key: "landing",   label: t("Landing Page", "الصفحة الرئيسية"),  color: "bg-[hsl(var(--sky))]" },
          { key: "dashboard", label: t("My Links (Dashboard)", "روابطي"),    color: "bg-[hsl(var(--navy))]" },
          { key: "api",       label: t("API", "API"),                         color: "bg-violet-500" },
          { key: "bulk",      label: t("Bulk Import", "استيراد مجمّع"),       color: "bg-amber-500" },
        ] as const;
        const data = globalStats.linkSources;
        const total = data.landing + data.dashboard + data.api + data.bulk;
        return (
          <div className="bg-background border border-border rounded-xl p-5 mb-6">
            <p className="text-sm font-body font-semibold text-foreground mb-4">
              {t("Link Creation Sources", "مصادر إنشاء الروابط")}
              <span className="ms-2 text-xs font-normal text-muted-foreground">
                {t("unique users per channel", "مستخدمون فريدون لكل قناة")}
              </span>
            </p>
            <div className="space-y-3">
              {sources.map(({ key, label, color }) => {
                const count = data[key];
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-36 shrink-0 text-xs font-body text-muted-foreground truncate">{label}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${color}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs font-body font-semibold text-foreground tabular-nums">{pct}%</span>
                    <span className="w-10 text-right text-xs font-body text-muted-foreground tabular-nums">{count.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
            {total === 0 && (
              <p className="text-xs text-muted-foreground mt-3 text-center">
                {t("No data yet — links created going forward will appear here.", "لا توجد بيانات بعد — الروابط المُنشأة من الآن ستظهر هنا.")}
              </p>
            )}
          </div>
        );
      })()}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t("Search by name or email...", "ابحث بالاسم أو البريد...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder={t("Filter by role", "فلتر بالدور")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All Roles", "جميع الأدوار")}</SelectItem>
            <SelectItem value="super_admin">{t("Super Admin", "مدير أعلى")}</SelectItem>
            <SelectItem value="admin">{t("Admin", "مدير")}</SelectItem>
            <SelectItem value="user">{t("User", "مستخدم")}</SelectItem>
            <SelectItem value="viewer">{t("Viewer", "مشاهد")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={linksSort} onValueChange={(v) => setLinksSort(v as typeof linksSort)}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder={t("Sort by links", "رتّب حسب الروابط")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">{t("Default Order", "الترتيب الافتراضي")}</SelectItem>
            <SelectItem value="most">{t("Most Links", "الأكثر روابط")}</SelectItem>
            <SelectItem value="latest">{t("Latest Links", "أحدث الروابط")}</SelectItem>
            <SelectItem value="least">{t("Least Links", "الأقل روابط")}</SelectItem>
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
            {t("Failed to load users. Please try again.", "فشل تحميل المستخدمين. حاول مرة أخرى.")}
          </p>
        </div>
      )}

      {/* User Cards */}
      {!isLoading && !isError && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedUsers.map((user) => {
              const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
              return (
                <div
                  key={user._id}
                  className="bg-background border border-border rounded-xl p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-display font-semibold text-foreground text-sm">{fullName}</h3>
                      <p className="text-xs text-muted-foreground font-body mt-0.5">{user.email}</p>
                      {user.googleId && (
                        <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800">
                          <svg className="w-2.5 h-2.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Google SSO
                        </span>
                      )}
                    </div>
                    <Select
                      value={user.role}
                      onValueChange={(v) => handleRoleChange(user._id, v)}
                      disabled={updatingId === user._id}
                    >
                      <SelectTrigger
                        className={`h-auto w-auto border-0 px-2 py-1 text-[10px] font-semibold rounded-full ${roleBadgeColors[user.role] ?? "bg-muted text-muted-foreground"}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="super_admin">{t("Super Admin", "مدير أعلى")}</SelectItem>
                        <SelectItem value="admin">{t("Admin", "مدير")}</SelectItem>
                        <SelectItem value="user">{t("User", "مستخدم")}</SelectItem>
                        <SelectItem value="viewer">{t("Viewer", "مشاهد")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 text-xs font-body text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3" /> {t("Phone", "الهاتف")}
                      </span>
                      <span className="text-foreground">{user.phone || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="w-3 h-3" /> {t("Signup", "تسجيل")}
                      </span>
                      <span className="text-foreground">{formatDate(user.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="w-3 h-3" /> {t("Last Login", "آخر دخول")}
                      </span>
                      <span className="text-foreground">{formatDate(user.lastLogin)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" /> {t("Location", "الموقع")}
                      </span>
                      <span className="text-foreground">
                        {user.registrationLocation?.city && user.registrationLocation?.country
                          ? `${user.registrationLocation.city}, ${user.registrationLocation.country}`
                          : user.registrationLocation?.country || user.registrationLocation?.city || "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Link2 className="w-3 h-3" /> {t("Total Links", "إجمالي الروابط")}
                      </span>
                      <span className="text-foreground">
                        {user.usage?.urlsCreatedTotal ?? user.urlCount ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{t("Status", "الحالة")}</span>
                      <span className={user.isActive ? "text-green-600" : "text-destructive"}>
                        {user.isActive ? t("Active", "نشط") : t("Inactive", "غير نشط")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 text-xs w-full"
                      onClick={() => setDeleteDialog({ open: true, id: user._id, name: fullName })}
                      disabled={deletingId === user._id}
                    >
                      {deletingId === user._id ? (
                        <Loader2 className="w-3 h-3 me-1.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3 me-1.5" />
                      )}
                      {t("Delete Account", "حذف الحساب")}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground font-body text-sm">
              {users.length === 0
                ? t("No users found.", "لا يوجد مستخدمون.")
                : t("No users match your filters.", "لا يوجد مستخدمون مطابقون للمعايير.")}
            </div>
          )}

          {(() => {
            const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
            const startItem = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
            const endItem = Math.min(currentPage * PAGE_SIZE, filtered.length);
            return totalPages > 1 ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
                <p className="text-xs text-muted-foreground font-body order-2 sm:order-1">
                  {t(
                    `Showing ${startItem}–${endItem} of ${filtered.length} users`,
                    `عرض ${startItem}–${endItem} من ${filtered.length} مستخدم`
                  )}
                </p>
                <div className="flex items-center gap-1 order-1 sm:order-2">
                  <Button
                    variant="outline" size="icon" className="h-8 w-8"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {getPageNumbers(currentPage, totalPages).map((page, idx) =>
                    page === "..." ? (
                      <span key={`ellipsis-${idx}`} className="w-8 text-center text-xs">…</span>
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
                    variant="outline" size="icon" className="h-8 w-8"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null;
          })()}
        </>
      )}
    </DashboardLayout>
  );
};

export default UserManagement;
