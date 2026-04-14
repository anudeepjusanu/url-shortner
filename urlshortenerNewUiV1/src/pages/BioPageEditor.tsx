import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Trash2, ArrowUp, ArrowDown, Loader2, CheckCircle2, XCircle,
  Save, Eye, Globe, Instagram, Twitter, Linkedin, Github, Youtube, Link2,
} from "lucide-react";
import { bioPageAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface BioLink {
  _id?: string;
  title: string;
  url: string;
  icon: string;
  order: number;
  isActive: boolean;
  clickCount?: number;
}

interface BioTheme {
  backgroundColor: string;
  backgroundGradient: string;
  buttonColor: string;
  buttonTextColor: string;
  buttonStyle: "pill" | "rounded" | "square";
  textColor: string;
  secondaryTextColor: string;
  fontFamily: string;
  preset: string;
}

interface BioSocialLinks {
  instagram: string;
  twitter: string;
  tiktok: string;
  youtube: string;
  linkedin: string;
  github: string;
  facebook: string;
  website: string;
}

interface FormData {
  username: string;
  title: string;
  description: string;
  avatarUrl: string;
  isPublished: boolean;
  theme: BioTheme;
  links: BioLink[];
  socialLinks: BioSocialLinks;
}

// ─── Theme presets ─────────────────────────────────────────────────────────

const PRESETS: { id: string; label: string; bg: string; theme: Partial<BioTheme> }[] = [
  { id: "default",  label: "Classic",  bg: "bg-white border",         theme: { backgroundColor: "#ffffff", buttonColor: "#111827", buttonTextColor: "#ffffff", textColor: "#111827", buttonStyle: "pill", backgroundGradient: "" } },
  { id: "dark",     label: "Dark",     bg: "bg-gray-900",             theme: { backgroundColor: "#111827", buttonColor: "#ffffff", buttonTextColor: "#111827", textColor: "#ffffff", buttonStyle: "pill", backgroundGradient: "" } },
  { id: "ocean",    label: "Ocean",    bg: "bg-blue-500",             theme: { backgroundColor: "#dbeafe", buttonColor: "#2563eb", buttonTextColor: "#ffffff", textColor: "#1e3a8a", buttonStyle: "pill", backgroundGradient: "" } },
  { id: "forest",   label: "Forest",   bg: "bg-green-500",            theme: { backgroundColor: "#dcfce7", buttonColor: "#16a34a", buttonTextColor: "#ffffff", textColor: "#14532d", buttonStyle: "rounded", backgroundGradient: "" } },
  { id: "sunset",   label: "Sunset",   bg: "bg-orange-400",           theme: { backgroundColor: "#fff7ed", buttonColor: "#ea580c", buttonTextColor: "#ffffff", textColor: "#7c2d12", buttonStyle: "rounded", backgroundGradient: "" } },
  { id: "purple",   label: "Purple",   bg: "bg-purple-500",           theme: { backgroundColor: "#faf5ff", buttonColor: "#7c3aed", buttonTextColor: "#ffffff", textColor: "#3b0764", buttonStyle: "pill", backgroundGradient: "" } },
  { id: "rose",     label: "Rose",     bg: "bg-rose-400",             theme: { backgroundColor: "#fff1f2", buttonColor: "#e11d48", buttonTextColor: "#ffffff", textColor: "#881337", buttonStyle: "pill", backgroundGradient: "" } },
  { id: "gradient", label: "Gradient", bg: "bg-gradient-to-br from-purple-500 to-pink-500", theme: { backgroundColor: "#ffffff", buttonColor: "#7c3aed", buttonTextColor: "#ffffff", textColor: "#1f1535", buttonStyle: "pill", backgroundGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" } },
];

const DEFAULT_FORM: FormData = {
  username: "",
  title: "",
  description: "",
  avatarUrl: "",
  isPublished: true,
  theme: {
    backgroundColor: "#ffffff",
    backgroundGradient: "",
    buttonColor: "#111827",
    buttonTextColor: "#ffffff",
    buttonStyle: "pill",
    textColor: "#111827",
    secondaryTextColor: "#6b7280",
    fontFamily: "Inter",
    preset: "default",
  },
  links: [],
  socialLinks: { instagram: "", twitter: "", tiktok: "", youtube: "", linkedin: "", github: "", facebook: "", website: "" },
};

// ─── Phone Preview ─────────────────────────────────────────────────────────

const PhonePreview = ({ form }: { form: FormData }) => {
  const { theme, links, socialLinks } = form;

  const bgStyle: React.CSSProperties = theme.backgroundGradient
    ? { background: theme.backgroundGradient }
    : { backgroundColor: theme.backgroundColor };

  const btnRadius = theme.buttonStyle === "pill" ? "9999px" : theme.buttonStyle === "rounded" ? "10px" : "4px";
  const btnStyle: React.CSSProperties = {
    backgroundColor: theme.buttonColor,
    color: theme.buttonTextColor,
    borderRadius: btnRadius,
  };

  const activeSocial = Object.entries(socialLinks).filter(([, v]) => v);
  const activeLinks = links.filter((l) => l.isActive);

  return (
    <div className="flex flex-col items-center">
      {/* Phone frame */}
      <div className="relative w-[260px] h-[540px] bg-gray-900 rounded-[36px] p-3 shadow-2xl ring-1 ring-white/10">
        {/* Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-900 rounded-full z-10" />
        {/* Screen */}
        <div
          className="w-full h-full rounded-[28px] overflow-hidden overflow-y-auto"
          style={bgStyle}
        >
          <div className="flex flex-col items-center px-4 py-8 gap-3 min-h-full">
            {/* Avatar */}
            {form.avatarUrl ? (
              <img
                src={form.avatarUrl}
                alt={form.title}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-white/30 flex-shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
                style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor }}
              >
                {form.title ? form.title.slice(0, 2).toUpperCase() : "AB"}
              </div>
            )}

            {/* Title + description */}
            <div className="text-center">
              <p className="font-bold text-sm leading-tight" style={{ color: theme.textColor }}>
                {form.title || "Your Name"}
              </p>
              {form.description && (
                <p className="text-[10px] mt-1 opacity-70" style={{ color: theme.textColor }}>
                  {form.description}
                </p>
              )}
            </div>

            {/* Links */}
            <div className="w-full space-y-2 mt-1">
              {activeLinks.length === 0 && (
                <div className="text-center text-[10px] opacity-40" style={{ color: theme.textColor }}>
                  Add links to see them here
                </div>
              )}
              {activeLinks.slice(0, 8).map((link, i) => (
                <div
                  key={i}
                  className="w-full py-2 px-3 text-center text-[11px] font-medium truncate"
                  style={btnStyle}
                >
                  {link.icon && <span className="mr-1">{link.icon}</span>}
                  {link.title || "Link Title"}
                </div>
              ))}
            </div>

            {/* Social icons */}
            {activeSocial.length > 0 && (
              <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
                {activeSocial.map(([key]) => (
                  <div
                    key={key}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold"
                    style={{ backgroundColor: theme.buttonColor + "20", color: theme.buttonColor }}
                  >
                    {key.slice(0, 2).toUpperCase()}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
        <Eye className="w-3 h-3" />
        Live preview
      </p>
    </div>
  );
};

// ─── Main Editor ───────────────────────────────────────────────────────────

const BioPageEditor = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const isEditMode = !!id;

  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPage, setIsLoadingPage] = useState(isEditMode);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const usernameTimer = useRef<ReturnType<typeof setTimeout>>();

  // Load existing page for edit mode
  useEffect(() => {
    if (!isEditMode) return;
    (async () => {
      try {
        const res = await bioPageAPI.get(id!) as any;
        const p = res.data;
        setForm({
          username: p.username || "",
          title: p.title || "",
          description: p.description || "",
          avatarUrl: p.avatarUrl || "",
          isPublished: p.isPublished ?? true,
          theme: { ...DEFAULT_FORM.theme, ...(p.theme || {}) },
          links: (p.links || []).map((l: any) => ({
            _id: l._id,
            title: l.title || "",
            url: l.url || "",
            icon: l.icon || "",
            order: l.order ?? 0,
            isActive: l.isActive ?? true,
            clickCount: l.clickCount || 0,
          })),
          socialLinks: { ...DEFAULT_FORM.socialLinks, ...(p.socialLinks || {}) },
        });
      } catch {
        toast({ variant: "destructive", title: t("Error", "خطأ"), description: t("Failed to load bio page", "فشل تحميل الصفحة") });
        navigate("/dashboard/bio-pages");
      } finally {
        setIsLoadingPage(false);
      }
    })();
  }, [id, isEditMode, navigate, toast, t]);

  // Username availability check (debounced)
  const checkUsername = useCallback(
    (value: string) => {
      if (!value || (isEditMode && value === form.username)) {
        setUsernameStatus("idle");
        return;
      }
      clearTimeout(usernameTimer.current);
      setUsernameStatus("checking");
      usernameTimer.current = setTimeout(async () => {
        try {
          const res = await bioPageAPI.checkUsername(value) as any;
          setUsernameStatus(res.data?.available ? "available" : "taken");
        } catch {
          setUsernameStatus("idle");
        }
      }, 600);
    },
    [form.username, isEditMode]
  );

  const setField = (key: keyof FormData, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setTheme = (patch: Partial<BioTheme>) =>
    setForm((prev) => ({ ...prev, theme: { ...prev.theme, ...patch } }));

  const setSocial = (key: keyof BioSocialLinks, value: string) =>
    setForm((prev) => ({ ...prev, socialLinks: { ...prev.socialLinks, [key]: value } }));

  const addLink = () =>
    setForm((prev) => ({
      ...prev,
      links: [...prev.links, { title: "", url: "", icon: "", order: prev.links.length, isActive: true }],
    }));

  const removeLink = (index: number) =>
    setForm((prev) => ({ ...prev, links: prev.links.filter((_, i) => i !== index) }));

  const updateLink = (index: number, patch: Partial<BioLink>) =>
    setForm((prev) => {
      const links = [...prev.links];
      links[index] = { ...links[index], ...patch };
      return { ...prev, links };
    });

  const moveLink = (index: number, direction: "up" | "down") => {
    setForm((prev) => {
      const links = [...prev.links];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= links.length) return prev;
      [links[index], links[target]] = [links[target], links[index]];
      return { ...prev, links: links.map((l, i) => ({ ...l, order: i })) };
    });
  };

  const applyPreset = (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (preset) setTheme({ ...preset.theme, preset: presetId });
  };

  const handleSave = async () => {
    if (!form.username.trim()) {
      toast({ variant: "destructive", title: t("Validation Error", "خطأ"), description: t("Username is required", "اسم المستخدم مطلوب") });
      return;
    }
    if (!form.title.trim()) {
      toast({ variant: "destructive", title: t("Validation Error", "خطأ"), description: t("Title is required", "العنوان مطلوب") });
      return;
    }
    if (usernameStatus === "taken") {
      toast({ variant: "destructive", title: t("Error", "خطأ"), description: t("Username is already taken", "اسم المستخدم مستخدم بالفعل") });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...form,
        links: form.links.map((l, i) => ({ ...l, order: i })),
      };
      if (isEditMode) {
        await bioPageAPI.update(id!, payload);
      } else {
        await bioPageAPI.create(payload);
      }
      toast({
        title: t("Saved!", "تم الحفظ!"),
        description: isEditMode
          ? t("Bio page updated successfully", "تم تحديث الصفحة بنجاح")
          : t("Bio page created successfully", "تم إنشاء الصفحة بنجاح"),
      });
      navigate("/dashboard/bio-pages");
    } catch (err: any) {
      toast({ variant: "destructive", title: t("Error", "خطأ"), description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingPage) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">
              {isEditMode ? t("Edit Bio Page", "تعديل صفحة البايو") : t("Create Bio Page", "إنشاء صفحة بايو")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("Customize your link-in-bio page", "خصص صفحتك للروابط")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/dashboard/bio-pages")}>
              {t("Cancel", "إلغاء")}
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? t("Saving…", "جاري الحفظ…") : t("Save", "حفظ")}
            </Button>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-start">
          {/* Left: Tabs editor */}
          <Tabs defaultValue="page" className="space-y-4">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="page">{t("Page", "الصفحة")}</TabsTrigger>
              <TabsTrigger value="theme">{t("Theme", "التصميم")}</TabsTrigger>
              <TabsTrigger value="links">{t("Links", "الروابط")}</TabsTrigger>
              <TabsTrigger value="social">{t("Social", "التواصل")}</TabsTrigger>
            </TabsList>

            {/* ── Page Info Tab ── */}
            <TabsContent value="page" className="space-y-5 bg-background border border-border rounded-2xl p-6">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">{t("Username", "اسم المستخدم")} *</Label>
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
                  <Input
                    id="username"
                    value={form.username}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, "");
                      setField("username", val);
                      checkUsername(val);
                    }}
                    placeholder="johndoe"
                    className="ps-8"
                  />
                  {usernameStatus !== "idle" && (
                    <span className="absolute end-3 top-1/2 -translate-y-1/2">
                      {usernameStatus === "checking" && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                      {usernameStatus === "available" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      {usernameStatus === "taken" && <XCircle className="w-4 h-4 text-destructive" />}
                    </span>
                  )}
                </div>
                {usernameStatus === "available" && (
                  <p className="text-xs text-green-600">{t("Username is available", "اسم المستخدم متاح")}</p>
                )}
                {usernameStatus === "taken" && (
                  <p className="text-xs text-destructive">{t("Username is already taken", "اسم المستخدم مستخدم بالفعل")}</p>
                )}
                {form.username && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {t("Your public URL:", "رابطك العام:")} /#/bio/{form.username}
                  </p>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">{t("Display Name / Title", "الاسم / العنوان")} *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  placeholder={t("Your Name or Brand", "اسمك أو علامتك التجارية")}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">{t("Bio / Description", "نبذة تعريفية")}</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder={t("A short bio about you or your brand…", "نبذة قصيرة عنك أو عن علامتك…")}
                  rows={3}
                  maxLength={300}
                />
                <p className="text-xs text-muted-foreground text-end">{form.description.length}/300</p>
              </div>

              {/* Avatar URL */}
              <div className="space-y-2">
                <Label htmlFor="avatar">{t("Avatar / Profile Image URL", "رابط صورة الملف الشخصي")}</Label>
                <Input
                  id="avatar"
                  value={form.avatarUrl}
                  onChange={(e) => setField("avatarUrl", e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <Separator />

              {/* Published toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t("Published", "منشور")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("Make this page publicly visible", "اجعل هذه الصفحة مرئية للجمهور")}
                  </p>
                </div>
                <Switch
                  checked={form.isPublished}
                  onCheckedChange={(v) => setField("isPublished", v)}
                />
              </div>
            </TabsContent>

            {/* ── Theme Tab ── */}
            <TabsContent value="theme" className="space-y-5 bg-background border border-border rounded-2xl p-6">
              {/* Presets */}
              <div className="space-y-3">
                <Label>{t("Theme Presets", "قوالب التصميم")}</Label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset.id)}
                      className={cn(
                        "relative h-14 rounded-xl overflow-hidden transition-all",
                        preset.bg,
                        form.theme.preset === preset.id
                          ? "ring-2 ring-primary ring-offset-2"
                          : "ring-1 ring-border hover:ring-2 hover:ring-primary/50"
                      )}
                      title={preset.label}
                    >
                      <span className="absolute inset-x-0 bottom-1 text-[9px] font-medium text-center" style={{ color: preset.theme.textColor || "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Custom colors */}
              <div className="space-y-4">
                <Label>{t("Custom Colors", "ألوان مخصصة")}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: "backgroundColor", label: t("Background", "الخلفية") },
                    { key: "buttonColor", label: t("Button Color", "لون الزر") },
                    { key: "buttonTextColor", label: t("Button Text", "نص الزر") },
                    { key: "textColor", label: t("Text Color", "لون النص") },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-3">
                      <input
                        type="color"
                        value={(form.theme as any)[key]}
                        onChange={(e) => setTheme({ [key]: e.target.value } as any)}
                        className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground font-mono">{(form.theme as any)[key]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Button style */}
              <div className="space-y-3">
                <Label>{t("Button Style", "شكل الزر")}</Label>
                <div className="flex gap-3">
                  {(["pill", "rounded", "square"] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => setTheme({ buttonStyle: style })}
                      className={cn(
                        "flex-1 py-2 text-sm font-medium border transition-all",
                        style === "pill" ? "rounded-full" : style === "rounded" ? "rounded-xl" : "rounded-sm",
                        form.theme.buttonStyle === style
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-border hover:border-primary"
                      )}
                    >
                      {t(style.charAt(0).toUpperCase() + style.slice(1), style === "pill" ? "دائري" : style === "rounded" ? "منحنى" : "مربع")}
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* ── Links Tab ── */}
            <TabsContent value="links" className="space-y-4 bg-background border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t("Links", "الروابط")}</p>
                  <p className="text-xs text-muted-foreground">{t("Add up to 50 links", "أضف حتى 50 رابطاً")}</p>
                </div>
                <Button size="sm" variant="outline" onClick={addLink} disabled={form.links.length >= 50} className="gap-1.5">
                  <Plus className="w-4 h-4" />
                  {t("Add Link", "إضافة رابط")}
                </Button>
              </div>

              {form.links.length === 0 && (
                <div className="text-center py-10 border border-dashed rounded-xl">
                  <Link2 className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">{t("No links yet. Click \"Add Link\" to get started.", "لا توجد روابط. اضغط \"إضافة رابط\" للبدء.")}</p>
                </div>
              )}

              <div className="space-y-3">
                {form.links.map((link, i) => (
                  <div key={i} className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      {/* Move buttons */}
                      <div className="flex flex-col gap-1">
                        <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => moveLink(i, "up")} disabled={i === 0}>
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => moveLink(i, "down")} disabled={i === form.links.length - 1}>
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                      </div>

                      <div className="flex-1 grid grid-cols-[60px_1fr] gap-2">
                        <Input
                          value={link.icon}
                          onChange={(e) => updateLink(i, { icon: e.target.value })}
                          placeholder="🔗"
                          className="text-center text-base"
                          maxLength={6}
                          title={t("Emoji / Icon", "رمز / أيقونة")}
                        />
                        <Input
                          value={link.title}
                          onChange={(e) => updateLink(i, { title: e.target.value })}
                          placeholder={t("Link Title", "عنوان الرابط")}
                        />
                      </div>

                      <Switch
                        checked={link.isActive}
                        onCheckedChange={(v) => updateLink(i, { isActive: v })}
                        title={t("Active", "نشط")}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-destructive hover:bg-destructive/10"
                        onClick={() => removeLink(i)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <Input
                      value={link.url}
                      onChange={(e) => updateLink(i, { url: e.target.value })}
                      placeholder="https://example.com"
                      type="url"
                    />

                    {link.url && !link.url.startsWith("http") && (
                      <p className="text-xs text-amber-500">{t("URL should start with https://", "يجب أن يبدأ الرابط بـ https://")}</p>
                    )}
                    {link.clickCount !== undefined && link.clickCount > 0 && (
                      <Badge variant="secondary" className="text-xs">{link.clickCount} {t("clicks", "نقرة")}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* ── Social Tab ── */}
            <TabsContent value="social" className="space-y-4 bg-background border border-border rounded-2xl p-6">
              <div>
                <p className="font-medium">{t("Social Media Links", "روابط التواصل الاجتماعي")}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("Add your social media profile URLs (leave blank to hide)", "أضف روابط حساباتك (اتركها فارغة لإخفائها)")}
                </p>
              </div>

              {[
                { key: "instagram", icon: Instagram, placeholder: "https://instagram.com/yourhandle", label: "Instagram" },
                { key: "twitter", icon: Twitter, placeholder: "https://twitter.com/yourhandle", label: "Twitter / X" },
                { key: "youtube", icon: Youtube, placeholder: "https://youtube.com/@channel", label: "YouTube" },
                { key: "linkedin", icon: Linkedin, placeholder: "https://linkedin.com/in/yourprofile", label: "LinkedIn" },
                { key: "github", icon: Github, placeholder: "https://github.com/yourhandle", label: "GitHub" },
                { key: "tiktok", icon: Link2, placeholder: "https://tiktok.com/@yourhandle", label: "TikTok" },
                { key: "facebook", icon: Link2, placeholder: "https://facebook.com/yourpage", label: "Facebook" },
                { key: "website", icon: Globe, placeholder: "https://yourwebsite.com", label: t("Website", "الموقع") },
              ].map(({ key, icon: Icon, placeholder, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs text-muted-foreground">{label}</Label>
                    <Input
                      value={(form.socialLinks as any)[key]}
                      onChange={(e) => setSocial(key as keyof BioSocialLinks, e.target.value)}
                      placeholder={placeholder}
                      type="url"
                    />
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>

          {/* Right: Live preview */}
          <div className="hidden xl:flex flex-col items-center sticky top-24">
            <PhonePreview form={form} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BioPageEditor;
