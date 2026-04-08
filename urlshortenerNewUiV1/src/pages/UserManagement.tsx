import { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Users, UserPlus, Link2, CalendarDays, Trash2, Search, BarChart3 } from "lucide-react";

type Role = "super_admin" | "admin" | "editor" | "viewer";

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  signupDate: string;
  lastLogin: string;
  location: string;
  linksCount: number;
}

const mockUsers: MockUser[] = [
  { id: "1", name: "Ahmed Al-Saud", email: "ahmed@example.com", role: "super_admin", signupDate: "2024-11-15", lastLogin: "2025-03-08", location: "Riyadh, SA", linksCount: 42 },
  { id: "2", name: "Sara Mohammed", email: "sara@example.com", role: "admin", signupDate: "2025-01-03", lastLogin: "2025-03-07", location: "Jeddah, SA", linksCount: 28 },
  { id: "3", name: "Omar Hassan", email: "omar@example.com", role: "editor", signupDate: "2025-02-10", lastLogin: "2025-03-06", location: "Dammam, SA", linksCount: 15 },
  { id: "4", name: "Fatima Ali", email: "fatima@example.com", role: "viewer", signupDate: "2025-02-20", lastLogin: "2025-03-05", location: "Mecca, SA", linksCount: 3 },
  { id: "5", name: "Khalid Ibrahim", email: "khalid@example.com", role: "editor", signupDate: "2025-03-01", lastLogin: "2025-03-08", location: "Medina, SA", linksCount: 7 },
  { id: "6", name: "Noura Saleh", email: "noura@example.com", role: "viewer", signupDate: "2025-03-05", lastLogin: "2025-03-08", location: "Riyadh, SA", linksCount: 1 },
];

const roleLabels: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

const roleBadgeColors: Record<Role, string> = {
  super_admin: "bg-destructive/10 text-destructive",
  admin: "bg-primary/10 text-primary",
  editor: "bg-accent text-accent-foreground",
  viewer: "bg-muted text-muted-foreground",
};

const UserManagement = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [users, setUsers] = useState(mockUsers);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  const totalSignups = users.length;
  const usersWithLinks = users.filter((u) => u.linksCount > 0).length;
  const avgLinksPerUser = totalSignups > 0 ? (users.reduce((sum, u) => sum + u.linksCount, 0) / totalSignups).toFixed(1) : "0";
  const newUsersLast30 = users.filter((u) => {
    const d = new Date(u.signupDate);
    const now = new Date();
    return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= 30;
  }).length;

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleDelete = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setDeleteDialog(null);
  };

  const stats = [
    { label: t("Number of Signups", "عدد التسجيلات"), value: totalSignups, icon: Users },
    { label: t("Users with Links", "مستخدمون لديهم روابط"), value: usersWithLinks, icon: Link2 },
    { label: t("Avg Links per User", "متوسط الروابط لكل مستخدم"), value: avgLinksPerUser, icon: BarChart3 },
    { label: t("New Users (30d)", "مستخدمون جدد (30 يوم)"), value: newUsersLast30, icon: UserPlus },
  ];

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-display font-bold text-foreground mb-6">
        {t("User Management", "إدارة المستخدمين")}
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
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
            <SelectItem value="editor">{t("Editor", "محرر")}</SelectItem>
            <SelectItem value="viewer">{t("Viewer", "مشاهد")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((user) => (
          <div key={user.id} className="bg-background border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-display font-semibold text-foreground text-sm">{user.name}</h3>
                <p className="text-xs text-muted-foreground font-body mt-0.5">{user.email}</p>
              </div>
              <Select
                value={user.role}
                onValueChange={(v) =>
                  setUsers((prev) =>
                    prev.map((u) => (u.id === user.id ? { ...u, role: v as Role } : u))
                  )
                }
              >
                <SelectTrigger className={`h-auto w-auto border-0 px-2 py-1 text-[10px] font-semibold rounded-full ${roleBadgeColors[user.role]}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">{t("Super Admin", "مدير أعلى")}</SelectItem>
                  <SelectItem value="admin">{t("Admin", "مدير")}</SelectItem>
                  <SelectItem value="editor">{t("Editor", "محرر")}</SelectItem>
                  <SelectItem value="viewer">{t("Viewer", "مشاهد")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 text-xs font-body text-muted-foreground">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><CalendarDays className="w-3 h-3" /> {t("Signup", "تسجيل")}</span>
                <span className="text-foreground">{user.signupDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><CalendarDays className="w-3 h-3" /> {t("Last Login", "آخر دخول")}</span>
                <span className="text-foreground">{user.lastLogin}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t("Location", "الموقع")}</span>
                <span className="text-foreground">{user.location}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Link2 className="w-3 h-3" /> {t("Links", "روابط")}</span>
                <span className="text-foreground font-semibold">{user.linksCount}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 text-xs w-full"
                onClick={() => setDeleteDialog(user.id)}
              >
                <Trash2 className="w-3 h-3 me-1.5" />
                {t("Delete Account", "حذف الحساب")}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground font-body text-sm">
          {t("No users found.", "لا يوجد مستخدمون.")}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Delete Account", "حذف الحساب")}</DialogTitle>
            <DialogDescription>
              {t(
                "Are you sure you want to delete this account? This action cannot be undone.",
                "هل أنت متأكد من حذف هذا الحساب؟ لا يمكن التراجع عن هذا الإجراء."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              {t("Cancel", "إلغاء")}
            </Button>
            <Button variant="destructive" onClick={() => deleteDialog && handleDelete(deleteDialog)}>
              {t("Delete", "حذف")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
};

export default UserManagement;
