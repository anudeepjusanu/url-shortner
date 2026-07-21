import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBrand } from "@/contexts/BrandContext";
import {
  LayoutDashboard,
  Link2,
  BarChart3,
  QrCode,
  Globe,
  User,
  FileText,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Users,
  LinkIcon,
  Languages,
  Layers,
  ScanLine,
  LayoutList,
  Tag,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useProject } from "@/contexts/ProjectContext";
import ProjectSwitcher from "@/components/dashboard/ProjectSwitcher";
import logoIcon from "@/assets/logo.png";

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItemConfig {
  label: string;
  icon: any;
  path: string;
  external?: boolean;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { t, lang, setLang, isAr } = useLanguage();
  const brand = useBrand();
  const { user, logout } = useAuth();
  const { isEnterpriseAccount, canManageUsers, isPersonalActive, canEdit } =
    useProject();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isSuperAdmin = user?.role === "super_admin";
  // Owner/Admin team management — separate from the platform-wide,
  // super-admin-only "User Management" nav below.
  const showTeamNav =
    isEnterpriseAccount && canManageUsers && !isPersonalActive;

  const toggleLang = () => setLang(lang === "en" ? "ar" : "en");

  const mainNav = [
    {
      label: t("Dashboard", "لوحة التحكم"),
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    { label: t("My Links", "روابطي"), icon: Link2, path: "/dashboard/links" },
    // { label: t("Bulk Create", "إنشاء مجمّع"), icon: Layers, path: "/dashboard/bulk-create" },
    {
      label: t("Analytics", "التحليلات"),
      icon: BarChart3,
      path: "/dashboard/analytics",
    },
    {
      label: t("QR Codes", "أكواد QR"),
      icon: QrCode,
      path: "/dashboard/qr-codes",
    },
    // { label: t("Dynamic QR", "QR ديناميكي"), icon: ScanLine, path: "/dashboard/dynamic-qr" },
    // Bio Pages are personal by nature — never part of a shared/team project.
    ...(isEnterpriseAccount && !isPersonalActive
      ? []
      : [
          {
            label: t("Bio Pages", "صفحات البايو"),
            icon: LayoutList,
            path: "/dashboard/bio-pages",
          },
        ]),
    {
      label: t("UTM Builder", "منشئ UTM"),
      icon: Tag,
      path: "/dashboard/utm-builder",
    },
    // { label: t("Deep Links", "الروابط العميقة"), icon: Smartphone, path: "/dashboard/deep-links" },
  ];

  const adminNav = [
    {
      label: t("User Management", "إدارة المستخدمين"),
      icon: Users,
      path: "/dashboard/users",
    },
    {
      label: t("URL Management", "إدارة الروابط"),
      icon: LinkIcon,
      path: "/dashboard/urls",
    },
  ];

  const teamNav = [
    {
      label: t("Team", "الفريق"),
      icon: Users,
      path: "/dashboard/team",
    },
    // Owner sees org-wide links across every project; an Admin sees links
    // scoped to the project(s) they administer (same visibility rule as the
    // "Team" page above — showTeamNav already gates this whole section on
    // canManageUsers, so no extra condition is needed here).
    {
      label: t("Team URLs", "روابط الفريق"),
      icon: LinkIcon,
      path: "/dashboard/team-urls",
    },
  ];

  const settingsNav: NavItemConfig[] = [
    {
      label: t("Custom Domains", "الدومينات"),
      icon: Globe,
      path: "/dashboard/domains",
    },
    // A Viewer on the active project must not see the API key at all — hide
    // the nav entry entirely rather than link to a page that just tells them
    // no (the route itself is also guarded — see useRequireEditAccess in
    // ApiDocs.tsx).
    ...(canEdit
      ? [
          {
            label: t("API Key & Docs", "مفتاح API والمستندات"),
            icon: FileText,
            path: "/dashboard/api",
          },
        ]
      : []),
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === path;
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const NavItem = ({ item }: { item: NavItemConfig }) => {
    if (item.external) {
      return (
        <a
          href={item.path}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-all duration-200 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <item.icon className="w-4 h-4 shrink-0" />
          <span>{item.label}</span>
        </a>
      );
    }
    return (
      <Link
        to={item.path}
        onClick={() => setSidebarOpen(false)}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-all duration-200",
          isActive(item.path)
            ? "bg-primary text-primary-foreground font-medium"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <item.icon className="w-4 h-4 shrink-0" />
        <span>{item.label}</span>
        {isActive(item.path) &&
          (isAr ? (
            <ChevronLeft className="w-3 h-3 ms-auto" />
          ) : (
            <ChevronRight className="w-3 h-3 ms-auto" />
          ))}
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        <div>
          <p className="px-3 mb-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">
            {t("Main", "الرئيسية")}
          </p>
          <div className="space-y-1">
            {mainNav.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>
        </div>

        {isSuperAdmin && (
          <div>
            <p className="px-3 mb-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">
              {t("Admin", "الإدارة")}
            </p>
            <div className="space-y-1">
              {adminNav.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </div>
          </div>
        )}

        {showTeamNav && (
          <div>
            <p className="px-3 mb-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">
              {t("Enterprise", "المؤسسة")}
            </p>
            <div className="space-y-1">
              {teamNav.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="px-3 mb-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">
            {t("Settings", "الإعدادات")}
          </p>
          <div className="space-y-1">
            {settingsNav.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30 flex dashboard-light">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-background border-e border-border flex-col fixed inset-y-0 start-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute start-0 top-0 bottom-0 w-64 bg-background shadow-2xl">
            <div className="absolute end-2 top-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 lg:ms-64 overflow-x-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border px-4 lg:px-8 h-16 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <Link to="/dashboard" className="flex items-center gap-1">
            <img src={logoIcon} alt={brand.domain} className="h-8 md:h-10" />
            <span className="font-display font-bold text-lg text-foreground">
              {brand.name.toUpperCase()}
            </span>
          </Link>
          <ProjectSwitcher />
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-body text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Languages className="w-4 h-4" />
              <span>{lang === "en" ? "العربية" : "English"}</span>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                  <User className="w-4 h-4 text-primary" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link
                    to="/dashboard/profile"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <User className="w-4 h-4" />
                    {t("Profile", "الملف الشخصي")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await logout();
                    navigate("/login");
                  }}
                  className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  {t("Log out", "تسجيل خروج")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
