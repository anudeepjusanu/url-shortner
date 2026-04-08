import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Phone, Building2, Key, Copy, Check, Eye, EyeOff, RefreshCw, Loader2 } from "lucide-react";
import { useProfile, useUpdateProfile } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [apiKeyRequested, setApiKeyRequested] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: profileData, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });

  // Load profile data from API
  useEffect(() => {
    if (profileData?.data) {
      const data = profileData.data;
      setProfile({
        name: data.name || data.username || "",
        email: data.email || "",
        phone: data.phone || "",
        company: data.company || "",
      });
      if (data.apiKey) {
        setApiKeyRequested(true);
      }
    } else if (user) {
      setProfile({
        name: user.name || user.username || "",
        email: user.email || "",
        phone: user.phone || "",
        company: user.company || "",
      });
    }
  }, [profileData, user]);

  const apiKey = profileData?.data?.apiKey || "sk_live_4r_a1b2c3d4e5f6g7h8i9j0k1l2m3n4";

  // const handleCopyKey = () => {
  //   navigator.clipboard.writeText(apiKey);
  //   setCopied(true);
  //   setTimeout(() => setCopied(false), 2000);
  // };

  const handleSaveChanges = async () => {
    setIsUpdating(true);
    try {
      await updateProfile.mutateAsync(profile);
      toast({
        title: t("Success", "نجح"),
        description: t("Profile updated successfully", "تم تحديث الملف الشخصي بنجاح"),
      });
    } catch (error: any) {
      toast({
        title: t("Error", "خطأ"),
        description: error.message || t("Failed to update profile", "فشل تحديث الملف الشخصي"),
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getInitials = () => {
    if (profile.name) {
      const parts = profile.name.split(" ");
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return profile.name.substring(0, 2).toUpperCase();
    }
    return profile.email ? profile.email.substring(0, 2).toUpperCase() : "U";
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-5 sm:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-lg sm:text-2xl font-display font-bold text-foreground">
            {t("Profile", "الملف الشخصي")}
          </h1>
          <p className="text-muted-foreground font-body text-xs sm:text-sm mt-1">
            {t("Manage your account settings", "إدارة إعدادات حسابك")}
          </p>
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
                <h2 className="text-sm sm:text-lg font-display font-semibold text-foreground">{profile.name}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground font-body truncate">{profile.email}</p>
              </div>
              <Button variant="outline" size="sm" className="font-body text-xs shrink-0">
                {t("Change Photo", "تغيير الصورة")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card>
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 sm:pb-4">
            <CardTitle className="text-sm sm:text-base font-display">{t("Personal Information", "المعلومات الشخصية")}</CardTitle>
            <CardDescription className="font-body text-xs sm:text-sm">{t("Update your personal details", "حدّث بياناتك الشخصية")}</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium text-foreground font-body flex items-center gap-1.5">
                  <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
                  {t("Full Name", "الاسم الكامل")}
                </label>
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="font-body text-sm"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium text-foreground font-body flex items-center gap-1.5">
                  <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
                  {t("Email", "البريد الإلكتروني")}
                </label>
                <Input
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="font-body text-sm"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium text-foreground font-body flex items-center gap-1.5">
                  <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
                  {t("Phone", "الهاتف")}
                </label>
                <Input
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="font-body text-sm"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium text-foreground font-body flex items-center gap-1.5">
                  <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
                  {t("Company", "الشركة")}
                </label>
                <Input
                  value={profile.company}
                  onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                  className="font-body text-sm"
                />
              </div>
            </div>
            <div className="pt-1 sm:pt-2">
              <Button 
                className="font-body text-sm"
                onClick={handleSaveChanges}
                disabled={isUpdating}
              >
                {isUpdating ? (
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

        {/* API Key Section */}
        <Card>
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 sm:pb-4">
            <CardTitle className="text-sm sm:text-base font-display flex items-center gap-2">
              <Key className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              {t("API Key", "مفتاح API")}
            </CardTitle>
            <CardDescription className="font-body text-xs sm:text-sm">
              {t(
                "Use your API key to integrate 4r.sa into your applications. Keep it secret.",
                "استخدم مفتاح API لربط 4r.sa بتطبيقاتك. حافظ على سريته."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            {!apiKeyRequested ? (
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
                <Button onClick={() => setApiKeyRequested(true)} className="font-body text-sm">
                  <Key className="w-4 h-4 me-1.5" />
                  {t("Generate API Key", "إنشاء مفتاح API")}
                </Button>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Input
                      readOnly
                      value={showKey ? apiKey : "sk_live_••••••••••••••••••••••••••••"}
                      className="font-mono text-xs sm:text-sm pe-20"
                    />
                    <div className="absolute end-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowKey(!showKey)}>
                        {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopyKey}>
                        {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] sm:text-xs text-muted-foreground font-body">
                    {t("Created: March 8, 2026", "تاريخ الإنشاء: 8 مارس 2026")}
                  </p>
                  <Button variant="outline" size="sm" className="font-body text-[11px] sm:text-xs">
                    <RefreshCw className="w-3 h-3 me-1.5" />
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
            <CardTitle className="text-sm sm:text-base font-display text-destructive">{t("Danger Zone", "منطقة الخطر")}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-muted-foreground font-body">
              {t("Permanently delete your account and all data.", "حذف حسابك وجميع بياناتك نهائيًا.")}
            </p>
            <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10 font-body text-xs shrink-0">
              {t("Delete Account", "حذف الحساب")}
            </Button>
          </CardContent>
        </Card>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Profile;