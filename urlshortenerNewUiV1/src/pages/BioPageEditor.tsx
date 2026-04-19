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
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Plus, Trash2, ArrowUp, ArrowDown, Loader2, CheckCircle2, XCircle,
  Save, Eye, Globe, Instagram, Twitter, Linkedin, Github, Youtube, Link2,
  Camera, MousePointerClick, Star, Share2, Copy, Check, ImageIcon,
} from "lucide-react";
import { bioPageAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ImageCropDialog } from "@/components/ImageCropDialog";

// ─── Types ───────────────────────────────────────────────────────────────────

interface BioLink {
  _id?: string;
  title: string;
  url: string;
  icon: string;
  thumbnail?: string;
  order: number;
  isActive: boolean;
  isFeatured?: boolean;
  clickCount?: number;
}

interface BioTheme {
  backgroundColor: string;
  backgroundGradient: string;
  backgroundImage: string;
  backgroundImageOpacity: number;
  buttonColor: string;
  buttonTextColor: string;
  buttonStyle: "pill" | "rounded" | "square";
  buttonVariant: "solid" | "outline" | "ghost";
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

interface ExtraSocialLink {
  platform: string;
  url: string;
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
  extraSocialLinks: ExtraSocialLink[];
  socialLinkImages: Record<string, string>;
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
    backgroundImage: "",
    backgroundImageOpacity: 0.15,
    buttonColor: "#111827",
    buttonTextColor: "#ffffff",
    buttonStyle: "pill",
    buttonVariant: "solid",
    textColor: "#111827",
    secondaryTextColor: "#6b7280",
    fontFamily: "Inter",
    preset: "default",
  },
  links: [],
  socialLinks: { instagram: "", twitter: "", tiktok: "", youtube: "", linkedin: "", github: "", facebook: "", website: "" },
  extraSocialLinks: [],
  socialLinkImages: {},
};

const KNOWN_SOCIAL_KEYS: (keyof BioSocialLinks)[] = [
  "instagram", "twitter", "tiktok", "youtube", "linkedin", "github", "facebook", "website",
];

const SOCIAL_DOMAINS: Record<string, string> = {
  instagram: "instagram.com",
  twitter:   "twitter.com",
  youtube:   "youtube.com",
  linkedin:  "linkedin.com",
  github:    "github.com",
  tiktok:    "tiktok.com",
  facebook:  "facebook.com",
};

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

// ─── Blocked image URL patterns ───────────────────────────────────────────
// These hosts either block cross-origin embedding or require auth/cookies.

const BLOCKED_IMAGE_DOMAINS = [
  { pattern: /encrypted-tbn\d*\.gstatic\.com/i,  reason: "Google image search cache — not embeddable" },
  { pattern: /googleusercontent\.com/i,           reason: "Google user content — CORS restricted"     },
  { pattern: /lh\d\.googleusercontent\.com/i,     reason: "Google Photos — CORS restricted"           },
  { pattern: /facebook\.com\/photo/i,             reason: "Facebook photos — login required"          },
  { pattern: /instagram\.com\/(p|reel)\//i,       reason: "Instagram post image — login required"     },
  { pattern: /pbs\.twimg\.com/i,                  reason: "Twitter/X media — may be restricted"       },
  { pattern: /private/i,                          reason: "URL contains 'private' — may require auth" },
];

function getAvatarUrlWarning(url: string): string | null {
  if (!url || url.startsWith("data:")) return null;
  const match = BLOCKED_IMAGE_DOMAINS.find(({ pattern }) => pattern.test(url));
  return match ? match.reason : null;
}

// ─── Image compression helper ──────────────────────────────────────────────

function compressImage(file: File, maxSize = 320, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = ev.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// ─── Social favicon button ─────────────────────────────────────────────────

const SocialFaviconButton = ({
  socialKey, url, customImage, buttonColor,
}: { socialKey: string; url: string; customImage?: string; buttonColor: string }) => {
  const [faviconError, setFaviconError] = useState(false);
  const domain = SOCIAL_DOMAINS[socialKey] || extractDomain(url);
  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
      style={{ backgroundColor: buttonColor + "20", border: `1px solid ${buttonColor}30` }}
    >
      {customImage ? (
        <img src={customImage} alt={socialKey} className="w-full h-full rounded-full object-cover" />
      ) : domain && !faviconError ? (
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
          alt={socialKey}
          className="w-3.5 h-3.5 object-contain"
          onError={() => setFaviconError(true)}
        />
      ) : (
        <Link2 className="w-3 h-3" style={{ color: buttonColor }} />
      )}
    </div>
  );
};

// ─── Phone Preview ─────────────────────────────────────────────────────────

const PhonePreview = ({ form }: { form: FormData }) => {
  const { theme, links, socialLinks, socialLinkImages } = form;

  const bgStyle: React.CSSProperties = theme.backgroundGradient
    ? { background: theme.backgroundGradient }
    : { backgroundColor: theme.backgroundColor };

  const btnRadius = theme.buttonStyle === "pill" ? "9999px" : theme.buttonStyle === "rounded" ? "10px" : "4px";
  const variant = theme.buttonVariant ?? "solid";
  const btnStyle: React.CSSProperties =
    variant === "outline"
      ? { backgroundColor: "transparent", color: theme.buttonColor, border: `1.5px solid ${theme.buttonColor}`, borderRadius: btnRadius }
      : variant === "ghost"
      ? { backgroundColor: "transparent", color: theme.buttonColor, textDecoration: "underline", borderRadius: btnRadius }
      : { backgroundColor: theme.buttonColor, color: theme.buttonTextColor, borderRadius: btnRadius };

  const activeSocial = Object.entries(socialLinks).filter(([, v]) => v);
  const activeLinks = links.filter((l) => l.isActive);
  const sortedLinks = [...activeLinks].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));

  return (
    <div className="flex flex-col items-center">
      {/* Phone frame */}
      <div className="relative w-[260px] h-[540px] bg-gray-900 rounded-[36px] p-3 shadow-2xl ring-1 ring-white/10">
        {/* Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-900 rounded-full z-10" />
        {/* Screen */}
        <div
          className="w-full h-full rounded-[28px] overflow-hidden overflow-y-auto relative"
          style={bgStyle}
        >
          {/* Background image overlay — only render when URL is present */}
          {theme.backgroundImage && (
            <div
              className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
              style={{
                backgroundImage: `url(${theme.backgroundImage})`,
                opacity: theme.backgroundImageOpacity ?? 0.4,
              }}
            />
          )}
          <div className="relative z-10 flex flex-col items-center px-4 py-8 gap-3 min-h-full">
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
            <div className="w-full space-y-2 mt-1 relative z-10">
              {sortedLinks.length === 0 && (
                <div className="text-center text-[10px] opacity-40" style={{ color: theme.textColor }}>
                  Add links to see them here
                </div>
              )}
              {sortedLinks.slice(0, 8).map((link, i) => (
                <div
                  key={i}
                  className="w-full text-center text-[11px] font-medium truncate relative flex items-center justify-center gap-2"
                  style={{
                    ...btnStyle,
                    padding: link.isFeatured ? "9px 12px" : "7px 12px",
                    fontSize: link.isFeatured ? "12px" : "11px",
                  }}
                >
                  {link.isFeatured && <span className="absolute top-0.5 right-1.5 text-[8px] opacity-60">★</span>}
                  {link.thumbnail && (
                    <img
                      src={link.thumbnail}
                      alt=""
                      className="w-5 h-5 rounded object-cover flex-shrink-0"
                    />
                  )}
                  {link.icon && !link.thumbnail && <span className="flex-shrink-0">{link.icon}</span>}
                  <span className="truncate">
                    {link.title || "Link Title"}
                  </span>
                </div>
              ))}
            </div>

            {/* Social icons */}
            {activeSocial.length > 0 && (
              <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
                {activeSocial.map(([key, url]) => (
                  <SocialFaviconButton
                    key={key}
                    socialKey={key}
                    url={url as string}
                    customImage={socialLinkImages?.[key]}
                    buttonColor={theme.buttonColor}
                  />
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
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [bgImageStatus, setBgImageStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [uploadingSocialKey, setUploadingSocialKey] = useState<string | null>(null);
  const [avatarCropFile, setAvatarCropFile] = useState<File | null>(null);
  const [bgCropFile, setBgCropFile] = useState<File | null>(null);
  const [showAvatarCrop, setShowAvatarCrop] = useState(false);
  const [showBgCrop, setShowBgCrop] = useState(false);
  const [colorErrors, setColorErrors] = useState<Record<string, string>>({});
  const [bgUploadError, setBgUploadError] = useState<string>("");
  const [uploadingLinkThumbnail, setUploadingLinkThumbnail] = useState<number | null>(null);
  const usernameTimer = useRef<ReturnType<typeof setTimeout>>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const socialImageInputRef = useRef<HTMLInputElement>(null);
  const linkThumbnailInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: t("Invalid file", "ملف غير صالح"), description: t("Please select an image file", "يرجى اختيار ملف صورة") });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: t("File too large", "الملف كبير جداً"), description: t("Max image size is 10 MB", "الحجم الأقصى للصورة هو 10 ميغابايت") });
      return;
    }
    setAvatarCropFile(file);
    setShowAvatarCrop(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAvatarCropConfirm = (croppedDataUrl: string) => {
    setField("avatarUrl", croppedDataUrl);
    setAvatarLoadError(false);
  };

  const handleBgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
   
    setBgUploadError("");
   
    if (!file.type.startsWith("image/")) {
      const errorMsg = t("Please select an image file (JPG, PNG, WebP)", "يرجى اختيار ملف صورة (JPG, PNG, WebP)");
      setBgUploadError(errorMsg);
      toast({ variant: "destructive", title: t("Invalid file", "ملف غير صالح"), description: errorMsg });
      if (bgFileInputRef.current) bgFileInputRef.current.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      const errorMsg = t("Max image size is 10 MB", "الحجم الأقصى للصورة هو 10 ميغابايت");
      setBgUploadError(errorMsg);
      toast({ variant: "destructive", title: t("File too large", "الملف كبير جداً"), description: errorMsg });
      if (bgFileInputRef.current) bgFileInputRef.current.value = "";
      return;
    }
    setBgCropFile(file);
    setShowBgCrop(true);
    if (bgFileInputRef.current) bgFileInputRef.current.value = "";
  };

  const handleBgCropConfirm = (croppedDataUrl: string) => {
    setTheme({ backgroundImage: croppedDataUrl });
    setBgImageStatus("ok");
    setBgUploadError("");
  };

  const validateHexColor = (value: string): boolean => {
    const hexRegex = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(value);
  };

  const normalizeHexColor = (value: string): string => {
    let normalized = value.trim();
    if (!normalized.startsWith("#")) {
      normalized = "#" + normalized;
    }
    return normalized.toUpperCase();
  };

  const handleColorInputChange = (key: string, value: string) => {
    const trimmed = value.trim();
   
    if (!trimmed) {
      setColorErrors((prev) => ({ ...prev, [key]: "" }));
      return;
    }

    if (validateHexColor(trimmed)) {
      const normalized = normalizeHexColor(trimmed);
      setTheme({ [key]: normalized } as any);
      setColorErrors((prev) => ({ ...prev, [key]: "" }));
    } else {
      setColorErrors((prev) => ({
        ...prev,
        [key]: t("Invalid hex color (e.g., #FF5733 or FF5733)", "لون hex غير صالح (مثال: #FF5733 أو FF5733)"),
      }));
    }
  };

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
            isFeatured: l.isFeatured ?? false,
            clickCount: l.clickCount || 0,
          })),
          socialLinks: { ...DEFAULT_FORM.socialLinks, ...Object.fromEntries(KNOWN_SOCIAL_KEYS.map((k) => [k, (p.socialLinks || {})[k] || ""])) } as BioSocialLinks,
          extraSocialLinks: Object.entries(p.socialLinks || {})
            .filter(([k, v]) => !KNOWN_SOCIAL_KEYS.includes(k as keyof BioSocialLinks) && v)
            .map(([platform, url]) => ({ platform, url: url as string })),
          socialLinkImages: p.socialLinkImages || {},
        });
      } catch {
        toast({ variant: "destructive", title: t("Error", "خطأ"), description: t("Failed to load bio page", "فشل تحميل الصفحة") });
        navigate("/dashboard/bio-pages");
      } finally {
        setIsLoadingPage(false);
      }
    })();
  }, [id, isEditMode, navigate, toast, t]);

  // Background image URL validation — preload test
  useEffect(() => {
    const url = form.theme.backgroundImage;
    if (!url) { setBgImageStatus("idle"); return; }
    setBgImageStatus("loading");
    const img = new Image();
    img.onload = () => setBgImageStatus("ok");
    img.onerror = () => setBgImageStatus("error");
    img.src = url;
    // Cleanup if URL changes before image loads
    return () => { img.onload = null; img.onerror = null; };
  }, [form.theme.backgroundImage]);

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

  const addExtraSocial = () =>
    setForm((prev) => ({ ...prev, extraSocialLinks: [...prev.extraSocialLinks, { platform: "", url: "" }] }));

  const removeExtraSocial = (index: number) =>
    setForm((prev) => ({ ...prev, extraSocialLinks: prev.extraSocialLinks.filter((_, i) => i !== index) }));

  const updateExtraSocial = (index: number, patch: Partial<ExtraSocialLink>) =>
    setForm((prev) => {
      const extraSocialLinks = [...prev.extraSocialLinks];
      extraSocialLinks[index] = { ...extraSocialLinks[index], ...patch };
      return { ...prev, extraSocialLinks };
    });

  const setSocialImage = (key: string, dataUrl: string) =>
    setForm((prev) => ({ ...prev, socialLinkImages: { ...prev.socialLinkImages, [key]: dataUrl } }));

  const removeSocialImage = (key: string) =>
    setForm((prev) => {
      const { [key]: _, ...rest } = prev.socialLinkImages;
      return { ...prev, socialLinkImages: rest };
    });

  const triggerSocialImageUpload = (key: string) => {
    setUploadingSocialKey(key);
    socialImageInputRef.current?.click();
  };

  const handleSocialImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingSocialKey) return;
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: t("Invalid file", "ملف غير صالح"), description: t("Please select an image file", "يرجى اختيار ملف صورة") });
      setUploadingSocialKey(null);
      return;
    }
    try {
      const compressed = await compressImage(file, 128, 0.85);
      setSocialImage(uploadingSocialKey, compressed);
    } catch {
      toast({ variant: "destructive", title: t("Upload failed", "فشل الرفع"), description: t("Could not process the image", "تعذّر معالجة الصورة") });
    } finally {
      setUploadingSocialKey(null);
      if (socialImageInputRef.current) socialImageInputRef.current.value = "";
    }
  };

  const triggerLinkThumbnailUpload = (index: number) => {
    setUploadingLinkThumbnail(index);
    linkThumbnailInputRef.current?.click();
  };

  const handleLinkThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploadingLinkThumbnail === null) return;
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: t("Invalid file", "ملف غير صالح"), description: t("Please select an image file", "يرجى اختيار ملف صورة") });
      setUploadingLinkThumbnail(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: t("File too large", "الملف كبير جداً"), description: t("Max image size is 5 MB", "الحجم الأقصى للصورة هو 5 ميغابايت") });
      setUploadingLinkThumbnail(null);
      return;
    }
    try {
      const compressed = await compressImage(file, 128, 0.85);
      updateLink(uploadingLinkThumbnail, { thumbnail: compressed });
    } catch {
      toast({ variant: "destructive", title: t("Upload failed", "فشل الرفع"), description: t("Could not process the image", "تعذّر معالجة الصورة") });
    } finally {
      setUploadingLinkThumbnail(null);
      if (linkThumbnailInputRef.current) linkThumbnailInputRef.current.value = "";
    }
  };

  const removeLinkThumbnail = (index: number) => {
    updateLink(index, { thumbnail: undefined });
  };

  const addLink = () =>
    setForm((prev) => ({
      ...prev,
      links: [...prev.links, { title: "", url: "", icon: "", order: prev.links.length, isActive: true, isFeatured: false }],
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

  // Only one link can be featured at a time
  const toggleFeatured = (index: number) => {
    setForm((prev) => ({
      ...prev,
      links: prev.links.map((l, i) => ({
        ...l,
        isFeatured: i === index ? !l.isFeatured : false,
      })),
    }));
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
      const { extraSocialLinks: _extra, ...formRest } = form;
      const payload = {
        ...formRest,
        links: form.links.map((l, i) => ({ ...l, order: i })),
        socialLinks: {
          ...form.socialLinks,
          ...Object.fromEntries(
            form.extraSocialLinks
              .filter(({ platform }) => platform.trim())
              .map(({ platform, url }) => [platform.trim().toLowerCase().replace(/\s+/g, "_"), url])
          ),
        },
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
            {/* QR / Share dialog — only shown once a username exists */}
            {form.username && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Share2 className="w-4 h-4" />
                    {t("Share", "مشاركة")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xs text-center">
                  <DialogHeader>
                    <DialogTitle>{t("Share your bio page", "شارك صفحتك")}</DialogTitle>
                  </DialogHeader>
                  {/* QR code via qrserver.com — no library needed */}
                  <div className="flex justify-center my-2">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(
                        `${window.location.origin}${window.location.pathname}#/bio/${form.username}`
                      )}`}
                      alt="QR Code"
                      className="w-48 h-48 rounded-xl border border-border"
                    />
                  </div>
                  {/* Public URL + copy button */}
                  <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm font-mono break-all">
                    <span className="flex-1 text-start text-xs text-muted-foreground truncate">
                      {window.location.origin}{window.location.pathname}#/bio/{form.username}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 flex-shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${window.location.origin}${window.location.pathname}#/bio/${form.username}`
                        );
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("Scan or copy the link to share your bio page", "امسح أو انسخ الرابط لمشاركة صفحتك")}
                  </p>
                </DialogContent>
              </Dialog>
            )}
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

              {/* Avatar upload */}
              <div className="space-y-3">
                <Label>{t("Avatar / Profile Image", "صورة الملف الشخصي")}</Label>

                {/* Preview + upload button row */}
                <div className="flex items-center gap-4">
                  {/* Current avatar preview */}
                  <div className="flex-shrink-0">
                    {form.avatarUrl && !avatarLoadError ? (
                      <img
                        src={form.avatarUrl}
                        alt="avatar preview"
                        className="w-16 h-16 rounded-full object-cover ring-2 ring-border"
                        onError={() => setAvatarLoadError(true)}
                      />
                    ) : (
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold ring-2 ring-border"
                        style={{ backgroundColor: form.theme.buttonColor, color: form.theme.buttonTextColor }}
                      >
                        {form.title ? form.title.slice(0, 2).toUpperCase() : "AB"}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    {/* Hidden file input — avatar */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    {/* Hidden file input — social link images */}
                    <input
                      ref={socialImageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleSocialImageUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2 w-full"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="w-4 h-4" />
                      {t("Upload Photo", "رفع صورة")}
                    </Button>
                    {form.avatarUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full text-destructive hover:bg-destructive/10 text-xs"
                        onClick={() => setField("avatarUrl", "")}
                      >
                        {t("Remove photo", "إزالة الصورة")}
                      </Button>
                    )}
                  </div>
                </div>

                {/* URL fallback input */}
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">{t("Or paste an image URL", "أو الصق رابط صورة")}</p>
                  <Input
                    value={form.avatarUrl.startsWith("data:") ? "" : form.avatarUrl}
                    onChange={(e) => {
                      setAvatarLoadError(false);
                      setField("avatarUrl", e.target.value);
                    }}
                    placeholder="https://example.com/avatar.jpg"
                    className={cn(
                      (getAvatarUrlWarning(form.avatarUrl) || avatarLoadError) && "border-amber-400 focus-visible:ring-amber-400"
                    )}
                  />
                  {/* Blocked-domain warning */}
                  {getAvatarUrlWarning(form.avatarUrl) && (
                    <p className="text-xs text-amber-600 flex items-start gap-1.5">
                      <span className="mt-0.5">⚠</span>
                      <span>
                        {t("This URL may not load:", "هذا الرابط قد لا يعمل:")} {getAvatarUrlWarning(form.avatarUrl)}.{" "}
                        {t("Upload a photo instead.", "استخدم زر رفع الصورة عوضاً عن ذلك.")}
                      </span>
                    </p>
                  )}
                  {/* Generic load failure (CORS / 403 / network) */}
                  {avatarLoadError && !getAvatarUrlWarning(form.avatarUrl) && (
                    <p className="text-xs text-amber-600 flex items-start gap-1.5">
                      <span className="mt-0.5">⚠</span>
                      <span>
                        {t(
                          "Image failed to load — the server may block cross-origin requests. Try uploading the photo directly.",
                          "تعذّر تحميل الصورة — قد يمنع الخادم الطلبات من مصادر خارجية. حاول رفع الصورة مباشرةً."
                        )}
                      </span>
                    </p>
                  )}
                </div>
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
                    <div key={key} className="space-y-2">
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={(form.theme as any)[key]}
                          onChange={(e) => {
                            setTheme({ [key]: e.target.value } as any);
                            setColorErrors((prev) => ({ ...prev, [key]: "" }));
                          }}
                          className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium mb-1">{label}</p>
                          <Input
                            value={(form.theme as any)[key]}
                            onChange={(e) => handleColorInputChange(key, e.target.value)}
                            placeholder="#FF5733"
                            className={cn(
                              "font-mono text-xs h-8",
                              colorErrors[key] && "border-destructive focus-visible:ring-destructive"
                            )}
                          />
                        </div>
                      </div>
                      {colorErrors[key] && (
                        <p className="text-xs text-destructive flex items-start gap-1 pl-[52px]">
                          <span className="mt-0.5">⚠</span>
                          <span>{colorErrors[key]}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Background image */}
              <div className="space-y-3">
                <Label className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  {t("Background Image", "صورة الخلفية")}
                </Label>
                <p className="text-xs text-muted-foreground -mt-1">
                  {t(
                    "Upload an image or paste a direct image URL ending in .jpg, .png, .webp, etc. — not a webpage link.",
                    "ارفع صورة أو الصق رابطاً مباشراً للصورة ينتهي بـ .jpg أو .png أو .webp — وليس رابط صفحة ويب."
                  )}
                </p>

                {/* Upload button */}
                <input
                  ref={bgFileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleBgImageUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "gap-2 w-full",
                    bgUploadError && "border-destructive"
                  )}
                  onClick={() => {
                    setBgUploadError("");
                    bgFileInputRef.current?.click();
                  }}
                >
                  <Camera className="w-4 h-4" />
                  {t("Upload Background Image", "رفع صورة الخلفية")}
                </Button>

                {bgUploadError && (
                  <p className="text-xs text-destructive flex items-start gap-1.5">
                    <span className="mt-0.5">⚠</span>
                    <span>{bgUploadError}</span>
                  </p>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  {t("Or paste an image URL below", "أو الصق رابط صورة أدناه")}
                </p>

                {/* Input with live status indicator */}
                <div className="relative">
                  <Input
                    value={form.theme.backgroundImage.startsWith("data:") ? "" : form.theme.backgroundImage}
                    onChange={(e) => {
                      setBgImageStatus("idle");
                      setTheme({ backgroundImage: e.target.value });
                    }}
                    placeholder="https://example.com/background.jpg"
                    className={cn(
                      bgImageStatus === "error" && "border-destructive focus-visible:ring-destructive",
                      bgImageStatus === "ok"    && "border-green-500 focus-visible:ring-green-500"
                    )}
                  />
                  {/* Inline status icon */}
                  <span className="absolute end-3 top-1/2 -translate-y-1/2">
                    {bgImageStatus === "loading" && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                    {bgImageStatus === "ok"      && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    {bgImageStatus === "error"   && <XCircle className="w-4 h-4 text-destructive" />}
                  </span>
                </div>

                {/* Error explanation */}
                {bgImageStatus === "error" && (
                  <p className="text-xs text-destructive flex items-start gap-1.5">
                    <span className="mt-0.5">✕</span>
                    <span>
                      {t(
                        "Could not load this image. Make sure it's a direct image URL (not a webpage). Try right-clicking an image → \"Copy image address\".",
                        "تعذّر تحميل هذه الصورة. تأكد أن الرابط مباشر للصورة (وليس صفحة ويب). جرّب النقر بزر الفأرة الأيمن على الصورة ← \"نسخ عنوان الصورة\"."
                      )}
                    </span>
                  </p>
                )}

                {/* Opacity slider + preview — only shown when image loads successfully */}
                {form.theme.backgroundImage && bgImageStatus === "ok" && (
                  <div className="space-y-3">
                    {/* Mini preview strip */}
                    <div
                      className="w-full h-16 rounded-lg border border-border overflow-hidden relative"
                      style={{ backgroundColor: form.theme.backgroundColor }}
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${form.theme.backgroundImage})`,
                          opacity: form.theme.backgroundImageOpacity,
                        }}
                      />
                      <div className="relative z-10 flex items-center justify-center h-full">
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-black/30 text-white">
                          {t("Preview", "معاينة")}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{t("Image opacity", "شفافية الصورة")}</span>
                        <span className="font-mono font-medium">{Math.round(form.theme.backgroundImageOpacity * 100)}%</span>
                      </div>
                      <Slider
                        min={5}
                        max={100}
                        step={5}
                        value={[Math.round(form.theme.backgroundImageOpacity * 100)]}
                        onValueChange={([v]) => setTheme({ backgroundImageOpacity: v / 100 })}
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-destructive hover:bg-destructive/10 h-7"
                      onClick={() => { setTheme({ backgroundImage: "" }); setBgImageStatus("idle"); }}
                    >
                      {t("Remove background image", "إزالة صورة الخلفية")}
                    </Button>
                  </div>
                )}

                {/* Show slider even while loading so it doesn't disappear */}
                {form.theme.backgroundImage && bgImageStatus === "loading" && (
                  <p className="text-xs text-muted-foreground">{t("Checking image…", "جاري التحقق من الصورة…")}</p>
                )}
              </div>

              <Separator />

              {/* Button shape */}
              <div className="space-y-3">
                <Label>{t("Button Shape", "شكل الزر")}</Label>
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

              <Separator />

              {/* Button fill variant */}
              <div className="space-y-3">
                <Label>{t("Button Style", "نمط الزر")}</Label>
                <div className="flex gap-3">
                  {(["solid", "outline", "ghost"] as const).map((variant) => {
                    const labels: Record<string, [string, string]> = {
                      solid:   [t("Solid",   "ممتلئ"),  "bg-foreground text-background"],
                      outline: [t("Outline", "محيط"),   "border-2 border-foreground bg-transparent text-foreground"],
                      ghost:   [t("Ghost",   "شفاف"),   "bg-transparent text-foreground underline underline-offset-2"],
                    };
                    const [label, previewCls] = labels[variant];
                    return (
                      <button
                        key={variant}
                        onClick={() => setTheme({ buttonVariant: variant })}
                        className={cn(
                          "flex-1 py-2 text-xs font-medium border rounded-lg transition-all flex flex-col items-center gap-1.5 pt-3 pb-2",
                          form.theme.buttonVariant === variant
                            ? "ring-2 ring-primary border-primary"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <span className={cn("text-[10px] px-3 py-1 rounded", previewCls)}>{label}</span>
                        <span className="text-muted-foreground text-[10px]">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* ── Links Tab ── */}
            <TabsContent value="links" className="space-y-4 bg-background border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t("Links", "الروابط")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("Add up to 50 links · ⭐ star one to feature it", "أضف حتى 50 رابطاً · ⭐ ميّز رابطاً واحداً")}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={addLink} disabled={form.links.length >= 50} className="gap-1.5">
                  <Plus className="w-4 h-4" />
                  {t("Add Link", "إضافة رابط")}
                </Button>
              </div>

              {/* Total clicks summary — only in edit mode when there is data */}
              {isEditMode && form.links.some((l) => (l.clickCount ?? 0) > 0) && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/8 border border-primary/20">
                  <MousePointerClick className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {form.links.reduce((acc, l) => acc + (l.clickCount ?? 0), 0).toLocaleString()}{" "}
                      {t("total clicks across all links", "إجمالي النقرات على جميع الروابط")}
                    </p>
                  </div>
                </div>
              )}

              {form.links.length === 0 && (
                <div className="text-center py-10 border border-dashed rounded-xl">
                  <Link2 className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">{t("No links yet. Click \"Add Link\" to get started.", "لا توجد روابط. اضغط \"إضافة رابط\" للبدء.")}</p>
                </div>
              )}

              <div className="space-y-3">
                {/* Hidden file input for link thumbnails */}
                <input
                  ref={linkThumbnailInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={handleLinkThumbnailUpload}
                />
               
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
                        className={cn(
                          "w-8 h-8 transition-colors",
                          link.isFeatured
                            ? "text-amber-500 hover:text-amber-600"
                            : "text-muted-foreground hover:text-amber-400"
                        )}
                        onClick={() => toggleFeatured(i)}
                        title={t("Featured link", "رابط مميز")}
                      >
                        <Star className={cn("w-4 h-4", link.isFeatured && "fill-amber-500")} />
                      </Button>
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

                    {/* Thumbnail upload section */}
                    <div className="flex items-center gap-3 pt-2 border-t border-border">
                      <Label className="text-xs text-muted-foreground flex-shrink-0">
                        {t("Thumbnail", "صورة مصغرة")}
                      </Label>
                      <div className="flex items-center gap-2 flex-1">
                        {link.thumbnail ? (
                          <div className="relative">
                            <img
                              src={link.thumbnail}
                              alt="thumbnail"
                              className="w-10 h-10 rounded object-cover ring-1 ring-border"
                            />
                            <button
                              type="button"
                              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center text-[10px] leading-none"
                              onClick={() => removeLinkThumbnail(i)}
                              title={t("Remove thumbnail", "إزالة الصورة المصغرة")}
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="w-10 h-10 rounded border border-dashed border-border flex items-center justify-center hover:border-primary transition-colors"
                            onClick={() => triggerLinkThumbnailUpload(i)}
                            title={t("Upload thumbnail", "رفع صورة مصغرة")}
                          >
                            <ImageIcon className="w-4 h-4 text-muted-foreground" />
                          </button>
                        )}
                        {link.thumbnail && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => triggerLinkThumbnailUpload(i)}
                          >
                            {t("Replace", "استبدال")}
                          </Button>
                        )}
                        {!link.thumbnail && (
                          <p className="text-xs text-muted-foreground">
                            {t("Optional square image for this link", "صورة مربعة اختيارية لهذا الرابط")}
                          </p>
                        )}
                      </div>
                    </div>

                    {isEditMode && (
                      <div className="flex items-center gap-1.5">
                        <MousePointerClick className="w-3 h-3 text-muted-foreground" />
                        <span className={cn(
                          "text-xs font-medium",
                          (link.clickCount ?? 0) > 0 ? "text-primary" : "text-muted-foreground"
                        )}>
                          {(link.clickCount ?? 0).toLocaleString()} {t("clicks", "نقرة")}
                        </span>
                      </div>
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
              ].map(({ key, icon: Icon, placeholder, label }) => {
                const customImg = form.socialLinkImages[key];
                return (
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
                    {/* Per-button custom image */}
                    <div className="flex-shrink-0">
                      {customImg ? (
                        <div className="relative w-8 h-8">
                          <img src={customImg} alt={key} className="w-8 h-8 rounded-full object-cover ring-1 ring-border" />
                          <button
                            type="button"
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center text-[10px] leading-none"
                            onClick={() => removeSocialImage(key)}
                            title={t("Remove custom image", "إزالة الصورة المخصصة")}
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="w-8 h-8 rounded-full border border-dashed border-border flex items-center justify-center hover:border-primary transition-colors"
                          onClick={() => triggerSocialImageUpload(key)}
                          title={t("Upload custom logo", "رفع شعار مخصص")}
                        >
                          <Camera className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Extra / custom social links */}
              {form.extraSocialLinks.map((item, i) => {
                const extraKey = item.platform.trim().toLowerCase().replace(/\s+/g, "_") || `extra_${i}`;
                const customImg = form.socialLinkImages[extraKey];
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Link2 className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <Input
                        value={item.platform}
                        onChange={(e) => updateExtraSocial(i, { platform: e.target.value })}
                        placeholder={t("Platform name (e.g. Snapchat)", "اسم المنصة (مثال: Snapchat)")}
                        className="h-7 text-xs"
                      />
                      <Input
                        value={item.url}
                        onChange={(e) => updateExtraSocial(i, { url: e.target.value })}
                        placeholder="https://..."
                        type="url"
                      />
                      {item.url && !item.url.startsWith("http") && (
                        <p className="text-xs text-amber-500">{t("URL should start with https://", "يجب أن يبدأ الرابط بـ https://")}</p>
                      )}
                    </div>
                    {/* Per-button custom image */}
                    <div className="flex-shrink-0">
                      {customImg ? (
                        <div className="relative w-8 h-8">
                          <img src={customImg} alt={extraKey} className="w-8 h-8 rounded-full object-cover ring-1 ring-border" />
                          <button
                            type="button"
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center text-[10px] leading-none"
                            onClick={() => removeSocialImage(extraKey)}
                            title={t("Remove custom image", "إزالة الصورة المخصصة")}
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="w-8 h-8 rounded-full border border-dashed border-border flex items-center justify-center hover:border-primary transition-colors"
                          onClick={() => triggerSocialImageUpload(extraKey)}
                          title={t("Upload custom logo", "رفع شعار مخصص")}
                        >
                          <Camera className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-destructive hover:bg-destructive/10 flex-shrink-0"
                      onClick={() => removeExtraSocial(i)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={addExtraSocial}
              >
                <Plus className="w-4 h-4" />
                {t("Add More", "إضافة المزيد")}
              </Button>
            </TabsContent>
          </Tabs>

          {/* Right: Live preview */}
          <div className="hidden xl:flex flex-col items-center sticky top-24">
            <PhonePreview form={form} />
          </div>
        </div>

        {/* Image Crop Dialogs */}
        <ImageCropDialog
          open={showAvatarCrop}
          onOpenChange={setShowAvatarCrop}
          file={avatarCropFile}
          onConfirm={handleAvatarCropConfirm}
          aspectRatio={1}
          title={t("Crop Avatar Image", "اقتصاص صورة الملف الشخصي")}
        />
        <ImageCropDialog
          open={showBgCrop}
          onOpenChange={setShowBgCrop}
          file={bgCropFile}
          onConfirm={handleBgCropConfirm}
          aspectRatio={9 / 16}
          title={t("Crop Background Image", "اقتصاص صورة الخلفية")}
        />
      </div>
    </DashboardLayout>
  );
};

export default BioPageEditor;