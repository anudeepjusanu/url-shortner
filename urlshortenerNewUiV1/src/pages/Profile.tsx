import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  User,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Link2,
  MousePointer,
  Globe,
  ShieldCheck,
} from "lucide-react";
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
import { profileService, myLinksService } from "@/services/jwtService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import amplitudeService from "@/services/amplitude";

const Profile = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { logout } = useAuth();

  // ── Profile state ────────────────────────────────────────────────────────────
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    plan: "free",
    createdAt: "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // ── Account stats ────────────────────────────────────────────────────────────
  const [accountStats, setAccountStats] = useState({
    totalLinks: 0,
    totalClicks: 0,
    customDomains: 0,
    accountAge: "",
    plan: "free",
  });

  // ── Password change ──────────────────────────────────────────────────────────
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // ── Delete account ───────────────────────────────────────────────────────────
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await profileService.deleteAccount();
      amplitudeService.track("Delete Account");
      // Clear auth state and tokens, then go to login
      await logout();
      navigate("/login", { replace: true });
    } catch (err: any) {
      toast({
        title: t("Failed to delete account", "فشل حذف الحساب"),
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsDeletingAccount(false);
      setDeleteAccountOpen(false);
    }
  };

  // ── Load data ────────────────────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    try {
      const [profileRes, statsRes] = await Promise.all([
        profileService.getProfile(),
        myLinksService.getStats().catch(() => null),
      ]);

      setProfile({
        firstName:
          profileRes?.firstName || profileRes?.data?.user?.firstName || "",
        lastName:
          profileRes?.lastName || profileRes?.data?.user?.lastName || "",
        email: profileRes?.email || profileRes?.data?.user?.email || "",
        phone: profileRes?.phone || profileRes?.data?.user?.phone || "",
        role: profileRes?.role || profileRes?.data?.user?.role || "",
        plan: profileRes?.plan || profileRes?.data?.user?.plan || "free",
        createdAt:
          profileRes?.createdAt || profileRes?.data?.user?.createdAt || "",
      });

      setAccountStats({
        totalLinks:
          statsRes?.totalLinks ?? statsRes?.data?.stats?.totalUrls ?? 0,
        totalClicks:
          statsRes?.totalClicks ?? statsRes?.data?.stats?.totalClicks ?? 0,
        customDomains: statsRes?.customDomains ?? 0,
        accountAge: statsRes?.accountAge || "",
        plan: profileRes?.plan || "free",
      });
    } catch (err: any) {
      toast({
        title: t("Failed to load profile", "فشل تحميل الملف الشخصي"),
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingProfile(false);
    }
  }, [toast, t]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getInitials = () => {
    const f = profile.firstName?.[0] || "";
    const l = profile.lastName?.[0] || "";
    return (f + l).toUpperCase() || (profile.email?.[0] || "U").toUpperCase();
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      const res = await profileService.updateProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
      });
      setProfile((prev) => ({
        ...prev,
        firstName: res?.firstName || prev.firstName,
        lastName: res?.lastName ?? "",
        phone: res?.phone ?? prev.phone,
      }));
      toast({ title: t("Profile updated", "تم تحديث الملف الشخصي") });
    } catch (err: any) {
      toast({
        title: t("Update failed", "فشل التحديث"),
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    const errors = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    };
    let hasError = false;

    if (!passwords.currentPassword) {
      errors.currentPassword = t(
        "Current password is required",
        "كلمة المرور الحالية مطلوبة",
      );
      hasError = true;
    }
    if (!passwords.newPassword) {
      errors.newPassword = t(
        "New password is required",
        "كلمة المرور الجديدة مطلوبة",
      );
      hasError = true;
    } else if (passwords.newPassword.length < 8) {
      errors.newPassword = t(
        "Password must be at least 8 characters",
        "يجب أن تكون كلمة المرور 8 أحرف على الأقل",
      );
      hasError = true;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      errors.confirmPassword = t(
        "Passwords do not match",
        "كلمتا المرور غير متطابقتين",
      );
      hasError = true;
    }

    setPasswordErrors(errors);
    if (hasError) return;

    setIsSavingPassword(true);
    try {
      await profileService.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast({
        title: t("Password changed successfully", "تم تغيير كلمة المرور"),
      });
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: any) {
      toast({
        title: t("Failed to change password", "فشل تغيير كلمة المرور"),
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const statCards = [
    {
      label: t("Total Links", "إجمالي الروابط"),
      value: accountStats.totalLinks,
      icon: Link2,
    },
    {
      label: t("Total Clicks", "إجمالي الضغطات"),
      value: accountStats.totalClicks,
      icon: MousePointer,
    },
    {
      label: t("Custom Domains", "دومينات مخصصة"),
      value: accountStats.customDomains,
      icon: Globe,
    },
    { label: t("Plan", "الخطة"), value: accountStats.plan, icon: ShieldCheck },
  ];

  if (isLoadingProfile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Delete account confirm */}
      <AlertDialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("Delete Account", "حذف الحساب")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "This will permanently delete your account and all associated data. This action cannot be undone.",
                "سيتم حذف حسابك وجميع بياناتك نهائيًا. لا يمكن التراجع عن هذا الإجراء.",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAccount}>
              {t("Cancel", "إلغاء")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount}
            >
              {isDeletingAccount ? (
                <>
                  <Loader2 className="w-4 h-4 me-2 animate-spin" />
                  {t("Deleting...", "جاري الحذف...")}
                </>
              ) : (
                t("Delete Account", "حذف الحساب")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="max-w-3xl mx-auto space-y-5 sm:space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-lg sm:text-2xl font-display font-bold text-foreground">
            {t("Profile", "الملف الشخصي")}
          </h1>
          <p className="text-muted-foreground font-body text-xs sm:text-sm mt-1">
            {t("Manage your account settings", "إدارة إعدادات حسابك")}
          </p>
        </div>

        {/* Account Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="bg-background border border-border rounded-xl p-3 sm:p-4"
            >
              <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                <s.icon className="w-3.5 h-3.5 text-primary" />
              </div>
              <p className="text-lg sm:text-xl font-display font-bold text-foreground capitalize">
                {s.value}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-body mt-0.5">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Avatar & Name */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-5">
              <Avatar className="w-12 h-12 sm:w-16 sm:h-16">
                <AvatarFallback className="bg-primary/10 text-primary text-base sm:text-xl font-display font-bold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm sm:text-lg font-display font-semibold text-foreground">
                  {[profile.firstName, profile.lastName]
                    .filter(Boolean)
                    .join(" ")}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground font-body truncate">
                  {profile.email}
                </p>
                <p className="text-[10px] text-muted-foreground font-body capitalize">
                  {profile.role}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 sm:pb-4">
            <CardTitle className="text-sm sm:text-base font-display flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              {t("Personal Information", "المعلومات الشخصية")}
            </CardTitle>
            <CardDescription className="font-body text-xs sm:text-sm">
              {t("Update your personal details", "حدّث بياناتك الشخصية")}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-medium text-foreground font-body">
                  {t("First Name", "الاسم الأول")}
                </label>
                <Input
                  value={profile.firstName}
                  onChange={(e) =>
                    setProfile({ ...profile, firstName: e.target.value })
                  }
                  className="font-body text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-medium text-foreground font-body">
                  {t("Last Name", "اسم العائلة")}
                </label>
                <Input
                  value={profile.lastName}
                  onChange={(e) =>
                    setProfile({ ...profile, lastName: e.target.value })
                  }
                  className="font-body text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-medium text-foreground font-body flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-muted-foreground" />
                  {t("Email", "البريد الإلكتروني")}
                </label>
                <Input
                  value={profile.email}
                  disabled
                  className="font-body text-sm bg-muted/30 text-muted-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-medium text-foreground font-body flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-muted-foreground" />
                  {t("Phone", "الهاتف")}
                </label>
                <Input
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                  className="font-body text-sm"
                  placeholder="+966XXXXXXXXX"
                />
              </div>
            </div>
            <div className="pt-1 sm:pt-2">
              <Button
                className="font-body text-sm"
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 me-2 animate-spin" />
                    {t("Saving...", "جاري الحفظ...")}
                  </>
                ) : (
                  t("Save Changes", "حفظ التغييرات")
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 sm:pb-4">
            <CardTitle className="text-sm sm:text-base font-display flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              {t("Change Password", "تغيير كلمة المرور")}
            </CardTitle>
            <CardDescription className="font-body text-xs sm:text-sm">
              {t(
                "Use a strong password with uppercase, lowercase, and numbers",
                "استخدم كلمة مرور قوية تحتوي على أحرف كبيرة وصغيرة وأرقام",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
            {(
              ["currentPassword", "newPassword", "confirmPassword"] as const
            ).map((field) => {
              const labels = {
                currentPassword: t("Current Password", "كلمة المرور الحالية"),
                newPassword: t("New Password", "كلمة المرور الجديدة"),
                confirmPassword: t(
                  "Confirm New Password",
                  "تأكيد كلمة المرور الجديدة",
                ),
              };
              return (
                <div key={field} className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-medium text-foreground font-body">
                    {labels[field]}
                  </label>
                  <div className="relative">
                    <Input
                      type={
                        showPasswords[
                          field === "currentPassword"
                            ? "current"
                            : field === "newPassword"
                              ? "new"
                              : "confirm"
                        ]
                          ? "text"
                          : "password"
                      }
                      value={passwords[field]}
                      onChange={(e) => {
                        setPasswords({ ...passwords, [field]: e.target.value });
                        if (passwordErrors[field])
                          setPasswordErrors({ ...passwordErrors, [field]: "" });
                      }}
                      className={`font-body text-sm pe-10 ${passwordErrors[field] ? "border-destructive" : ""}`}
                    />
                    <button
                      type="button"
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        const k =
                          field === "currentPassword"
                            ? "current"
                            : field === "newPassword"
                              ? "new"
                              : "confirm";
                        setShowPasswords({
                          ...showPasswords,
                          [k]: !showPasswords[k as keyof typeof showPasswords],
                        });
                      }}
                    >
                      {showPasswords[
                        field === "currentPassword"
                          ? "current"
                          : field === "newPassword"
                            ? "new"
                            : "confirm"
                      ] ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {passwordErrors[field] && (
                    <p className="text-xs text-destructive font-body">
                      {passwordErrors[field]}
                    </p>
                  )}
                </div>
              );
            })}
            <div className="pt-1 sm:pt-2">
              <Button
                className="font-body text-sm"
                onClick={handleChangePassword}
                disabled={isSavingPassword}
              >
                {isSavingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 me-2 animate-spin" />
                    {t("Updating...", "جاري التحديث...")}
                  </>
                ) : (
                  t("Update Password", "تحديث كلمة المرور")
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/30">
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 sm:pb-4">
            <CardTitle className="text-sm sm:text-base font-display text-destructive">
              {t("Danger Zone", "منطقة الخطر")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-muted-foreground font-body">
              {t(
                "Permanently delete your account and all associated data. This action cannot be undone.",
                "حذف حسابك وجميع بياناتك المرتبطة نهائيًا. لا يمكن التراجع عن هذا الإجراء.",
              )}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/10 font-body text-xs shrink-0"
              onClick={() => setDeleteAccountOpen(true)}
            >
              {t("Delete Account", "حذف الحساب")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
