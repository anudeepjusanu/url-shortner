import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  User, Mail, Phone, Key, Copy, Check, Eye, EyeOff, RefreshCw, Loader2,
  Lock, Link2, MousePointer, Globe, ShieldCheck,
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

const Profile = () => {
  const { t } = useLanguage();
  const { toast } = useToast();

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

  // ── API Key ──────────────────────────────────────────────────────────────────
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isRegeneratingKey, setIsRegeneratingKey] = useState(false);
  const [regenConfirmOpen, setRegenConfirmOpen] = useState(false);

  // ── Delete account ───────────────────────────────────────────────────────────
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  // ── Load data ────────────────────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    try {
      const [profileRes, statsRes, apiKeyRes] = await Promise.all([
        profileService.getProfile(),
        myLinksService.getStats().catch(() => null),
        profileService.getApiKey().catch(() => null),
      ]);

      setProfile({
        firstName: profileRes?.firstName || profileRes?.data?.user?.firstName || "",
        lastName: profileRes?.lastName || profileRes?.data?.user?.lastName || "",
        email: profileRes?.email || profileRes?.data?.user?.email || "",
        phone: profileRes?.phone || profileRes?.data?.user?.phone || "",
        role: profileRes?.role || profileRes?.data?.user?.role || "",
        plan: profileRes?.plan || profileRes?.data?.user?.plan || "free",
        createdAt: profileRes?.createdAt || profileRes?.data?.user?.createdAt || "",
      });

      setAccountStats({
        totalLinks: statsRes?.totalLinks ?? statsRes?.data?.stats?.totalUrls ?? 0,
        totalClicks: statsRes?.totalClicks ?? statsRes?.data?.stats?.totalClicks ?? 0,
        customDomains: statsRes?.customDomains ?? 0,
        accountAge: statsRes?.accountAge || "",
        plan: profileRes?.plan || "free",
      });

      if (apiKeyRes?.apiKey) setApiKey(apiKeyRes.apiKey);
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

  useEffect(() => { loadProfile(); }, [loadProfile]);

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
      await profileService.updateProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
      });
      toast({ title: t("Profile updated", "تم تحديث الملف الشخصي") });
    } catch (err: any) {
      toast({ title: t("Update failed", "فشل التحديث"), description: err.message, variant: "destructive" });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    const errors = { currentPassword: "", newPassword: "", confirmPassword: "" };
    let hasError = false;

    if (!passwords.currentPassword) {
      errors.currentPassword = t("Current password is required", "كلمة المرور الحالية مطلوبة");
      hasError = true;
    }
    if (!passwords.newPassword) {
      errors.newPassword = t("New password is required", "كلمة المرور الجديدة مطلوبة");
      hasError = true;
    } else if (passwords.newPassword.length < 8) {
      errors.newPassword = t("Password must be at least 8 characters", "يجب أن تكون كلمة المرور 8 أحرف على الأقل");
      hasError = true;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      errors.confirmPassword = t("Passwords do not match", "كلمتا المرور غير متطابقتين");
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
      toast({ title: t("Password changed successfully", "تم تغيير كلمة المرور") });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast({ title: t("Failed to change password", "فشل تغيير كلمة المرور"), description: err.message, variant: "destructive" });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleRegenerateKey = async () => {
    setRegenConfirmOpen(false);
    setIsRegeneratingKey(true);
    try {
      const res = await profileService.regenerateApiKey();
      if (res?.apiKey) {
        setApiKey(res.apiKey);
        setShowKey(true);
        toast({ title: t("API key regenerated", "تم إعادة إنشاء مفتاح API") });
      }
    } catch (err: any) {
      toast({ title: t("Failed to regenerate key", "فشل إعادة إنشاء المفتاح"), description: err.message, variant: "destructive" });
    } finally {
      setIsRegeneratingKey(false);
    }
  };

  const handleCopyKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const statCards = [
    { label: t("Total Links", "إجمالي الروابط"), value: accountStats.totalLinks, icon: Link2 },
    { label: t("Total Clicks", "إجمالي الضغطات"), value: accountStats.totalClicks, icon: MousePointer },
    { label: t("Custom Domains", "دومينات مخصصة"), value: accountStats.customDomains, icon: Globe },
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
      {/* Regen confirm */}
      <AlertDialog open={regenConfirmOpen} onOpenChange={setRegenConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Regenerate API Key", "إعادة إنشاء مفتاح API")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "Your current API key will be invalidated. Any apps using it will stop working. Continue?",
                "سيتم إلغاء مفتاح API الحالي. أي تطبيقات تستخدمه ستتوقف عن العمل. هل تريد المتابعة؟"
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel", "إلغاء")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerateKey}>
              {t("Regenerate", "إعادة إنشاء")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete account confirm */}
      <AlertDialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete Account", "حذف الحساب")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "This will permanently delete your account and all associated data. This action cannot be undone.",
                "سيتم حذف حسابك وجميع بياناتك نهائيًا. لا يمكن التراجع عن هذا الإجراء."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel", "إلغاء")}</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("Delete Account", "حذف الحساب")}
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
            <div key={s.label} className="bg-background border border-border rounded-xl p-3 sm:p-4">
              <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                <s.icon className="w-3.5 h-3.5 text-primary" />
              </div>
              <p className="text-lg sm:text-xl font-display font-bold text-foreground capitalize">{s.value}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-body mt-0.5">{s.label}</p>
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
                  {profile.firstName} {profile.lastName}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground font-body truncate">{profile.email}</p>
                <p className="text-[10px] text-muted-foreground font-body capitalize">{profile.role}</p>
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
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                  className="font-body text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-medium text-foreground font-body">
                  {t("Last Name", "اسم العائلة")}
                </label>
                <Input
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
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
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
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
                  <><Loader2 className="w-4 h-4 me-2 animate-spin" />{t("Saving...", "جاري الحفظ...")}</>
                ) : t("Save Changes", "حفظ التغييرات")}
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
              {t("Use a strong password with uppercase, lowercase, and numbers", "استخدم كلمة مرور قوية تحتوي على أحرف كبيرة وصغيرة وأرقام")}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
            {(["currentPassword", "newPassword", "confirmPassword"] as const).map((field) => {
              const labels = {
                currentPassword: t("Current Password", "كلمة المرور الحالية"),
                newPassword: t("New Password", "كلمة المرور الجديدة"),
                confirmPassword: t("Confirm New Password", "تأكيد كلمة المرور الجديدة"),
              };
              return (
                <div key={field} className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-medium text-foreground font-body">
                    {labels[field]}
                  </label>
                  <div className="relative">
                    <Input
                      type={showPasswords[field === "currentPassword" ? "current" : field === "newPassword" ? "new" : "confirm"] ? "text" : "password"}
                      value={passwords[field]}
                      onChange={(e) => {
                        setPasswords({ ...passwords, [field]: e.target.value });
                        if (passwordErrors[field]) setPasswordErrors({ ...passwordErrors, [field]: "" });
                      }}
                      className={`font-body text-sm pe-10 ${passwordErrors[field] ? "border-destructive" : ""}`}
                    />
                    <button
                      type="button"
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        const k = field === "currentPassword" ? "current" : field === "newPassword" ? "new" : "confirm";
                        setShowPasswords({ ...showPasswords, [k]: !showPasswords[k as keyof typeof showPasswords] });
                      }}
                    >
                      {showPasswords[field === "currentPassword" ? "current" : field === "newPassword" ? "new" : "confirm"]
                        ? <EyeOff className="w-4 h-4" />
                        : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordErrors[field] && (
                    <p className="text-xs text-destructive font-body">{passwordErrors[field]}</p>
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
                  <><Loader2 className="w-4 h-4 me-2 animate-spin" />{t("Updating...", "جاري التحديث...")}</>
                ) : t("Update Password", "تحديث كلمة المرور")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* API Key */}
        <Card>
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 sm:pb-4">
            <CardTitle className="text-sm sm:text-base font-display flex items-center gap-2">
              <Key className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              {t("API Key", "مفتاح API")}
            </CardTitle>
            <CardDescription className="font-body text-xs sm:text-sm">
              {t(
                "Use your API key to integrate with our REST API. Keep it secret.",
                "استخدم مفتاح API لربط تطبيقاتك بواجهة البرمجة. حافظ على سريته."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            {!apiKey ? (
              <div className="text-center py-4 sm:py-6 space-y-3 sm:space-y-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Key className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-foreground font-body font-medium">
                    {t("No API key yet", "لا يوجد مفتاح API بعد")}
                  </p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground font-body mt-1">
                    {t(
                      "Generate an API key to start using our REST API for link shortening, QR codes, and analytics.",
                      "أنشئ مفتاح API للبدء باستخدام واجهة البرمجة لاختصار الروابط وأكواد QR والتحليلات."
                    )}
                  </p>
                </div>
                <Button
                  className="font-body text-sm"
                  disabled={isRegeneratingKey}
                  onClick={() => setRegenConfirmOpen(true)}
                >
                  {isRegeneratingKey ? (
                    <Loader2 className="w-4 h-4 me-1.5 animate-spin" />
                  ) : (
                    <Key className="w-4 h-4 me-1.5" />
                  )}
                  {t("Generate API Key", "إنشاء مفتاح API")}
                </Button>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Input
                      readOnly
                      value={showKey ? apiKey : "sk_•••••••••••••••••••••••••••••••••"}
                      className="font-mono text-xs sm:text-sm pe-20"
                    />
                    <div className="absolute end-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowKey(!showKey)}>
                        {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopyKey}>
                        {copiedKey ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-body text-xs shrink-0"
                    disabled={isRegeneratingKey}
                    onClick={() => setRegenConfirmOpen(true)}
                  >
                    {isRegeneratingKey ? (
                      <Loader2 className="w-3 h-3 me-1 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3 me-1" />
                    )}
                    {t("Regenerate", "إعادة إنشاء")}
                  </Button>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 border border-border">
                  <p className="text-[11px] sm:text-xs text-muted-foreground font-body leading-relaxed">
                    ⚠️ {t(
                      "Keep your API key secure. Do not share it publicly or commit it to version control. If compromised, regenerate it immediately.",
                      "حافظ على سرية مفتاح API. لا تشاركه علنًا أو تضعه في الكود المصدري. إذا تم اختراقه، أعد إنشاءه فورًا."
                    )}
                  </p>
                </div>
              </div>
            )}
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
                "حذف حسابك وجميع بياناتك المرتبطة نهائيًا. لا يمكن التراجع عن هذا الإجراء."
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
