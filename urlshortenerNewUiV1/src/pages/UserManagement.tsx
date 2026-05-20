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
  BarChart3, Loader2, MapPin, Globe, Phone,
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
  urlCount?: number;
  registrationLocation?: {
    country?: string;
    city?: string;
  };
  usage?: {
    urlsCreatedTotal?: number;
  };
}

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
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const [globalStats, setGlobalStats] = useState({
    totalDomains: 0,
  });

  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null; name: string }>({
    open: false, id: null, name: "",
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const [usersRes, statsRes] = await Promise.all([
        adminService.getUsers({ limit: 500 }),
        adminService.getStats(),
      ]);
      setUsers(usersRes?.data?.users ?? []);
      const overview = statsRes?.data?.overview ?? {};
      setGlobalStats({
        totalDomains: overview.totalDomains ?? 0,
      });
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
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
  }, [users, search, roleFilter, fromDate, toDate]);

  const filteredStats = useMemo(() => {
    const totalUsers = filtered.length;
    const activeUsers = filtered.filter(u => u.isActive).length;
    const usersWithLinks = filtered.filter(u => (u.usage?.urlsCreatedTotal ?? u.urlCount ?? 0) > 0).length;
    const totalLinks = filtered.reduce((sum, u) => sum + (u.usage?.urlsCreatedTotal ?? u.urlCount ?? 0), 0);
    const avgLinksPerUser = totalUsers > 0 ? Math.round((totalLinks / totalUsers) * 10) / 10 : 0;
    return { totalUsers, activeUsers, usersWithLinks, avgLinksPerUser, totalLinks };
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
    { label: t("Active Users", "المستخدمون النشطون"), value: filteredStats.activeUsers, icon: UserPlus },
    { label: t("Total Domains", "إجمالي النطاقات"), value: globalStats.totalDomains, icon: Globe },
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
            {filtered.map((user) => {
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
        </>
      )}
    </DashboardLayout>
  );
};

export default UserManagement;
