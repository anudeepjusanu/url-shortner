import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import {
  GripVertical, Trash2, Plus, Instagram, Youtube, Linkedin, Facebook,
  Globe, Heading, Link as LinkIcon, ShoppingBag, Calendar, MapPin, FileText, Mail, Phone, Music, Video,
  Image as ImageIcon, Heart, Star, Gift, Briefcase, BookOpen, Coffee, Utensils, Headphones, Mic, Tv,
  Smile, Zap, Sparkles, Tag, Download, Upload, ChevronDown, Sliders, X,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, Minus, ArrowLeftRight,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { BioDraft, DraftLink, uid } from "../draftTypes";
import { allSocialPlatforms } from "@/components/bio-builder/blocks/SocialIconsBlock";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Props {
  draft: BioDraft;
  onUpdate: (patch: Partial<BioDraft>) => void;
  onContinue: () => void;
}

const SnapchatIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12.166 2c1.853.005 3.638 1.013 4.6 2.582.516.842.612 1.79.578 2.745-.024.696-.115 1.39-.183 2.083.226.119.464.082.7-.005.244-.09.476-.218.74-.218.394.001.778.123 1.06.41.418.426.385 1.087-.115 1.448-.31.224-.665.36-1.018.49-.34.126-.696.21-1.018.382-.249.133-.272.295-.16.547.602 1.351 1.572 2.353 2.94 2.95.281.123.575.213.875.279.484.107.6.43.32.85-.3.448-.728.74-1.221.92-.59.215-1.205.336-1.825.42-.111.014-.18.06-.214.17-.094.305-.205.604-.31.906-.077.219-.198.293-.426.27-.622-.063-1.241-.087-1.853.073-.531.139-.987.41-1.39.781-.435.4-.886.78-1.412 1.04-1.36.673-2.74.668-4.099-.01-.51-.255-.95-.624-1.378-1.013-.4-.365-.85-.633-1.376-.776-.616-.167-1.24-.143-1.866-.082-.265.026-.388-.05-.471-.302-.1-.302-.21-.6-.302-.904-.034-.115-.103-.158-.215-.173-.598-.082-1.193-.197-1.764-.4-.523-.184-.973-.483-1.281-.957-.27-.412-.151-.728.328-.835 1.622-.36 2.85-1.246 3.681-2.681.187-.323.336-.668.502-1.002.119-.24.097-.41-.146-.547-.31-.176-.65-.275-.984-.398-.36-.133-.728-.27-1.043-.498-.504-.366-.534-1.027-.105-1.453.246-.244.566-.378.916-.394.305-.013.59.087.872.197.247.097.493.156.73.052-.013-.123-.02-.232-.036-.34-.135-.94-.234-1.881-.083-2.83.323-2.04 1.97-3.624 4.018-3.879.336-.042.677-.046 1.014-.067z" />
  </svg>
);

const XLogoIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.84a4.84 4.84 0 0 1-1-.15z" />
  </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

const QUICK_ADD = [
  { id: "whatsapp", icon: WhatsAppIcon, type: "whatsapp" as const, labelEn: "WhatsApp", labelAr: "واتساب", platform: "whatsapp" },
  { id: "instagram", icon: Instagram, type: "social" as const, labelEn: "Instagram", labelAr: "انستقرام", platform: "instagram" },
  { id: "tiktok", icon: TikTokIcon, type: "social" as const, labelEn: "TikTok", labelAr: "تيك توك", platform: "tiktok" },
  { id: "twitter", icon: XLogoIcon, type: "social" as const, labelEn: "X", labelAr: "اكس", platform: "twitter" },
  { id: "youtube", icon: Youtube, type: "social" as const, labelEn: "YouTube", labelAr: "يوتيوب", platform: "youtube" },
  { id: "snapchat", icon: SnapchatIcon, type: "social" as const, labelEn: "Snapchat", labelAr: "سناب", platform: "snapchat" },
  { id: "linkedin", icon: Linkedin, type: "social" as const, labelEn: "LinkedIn", labelAr: "لينكدإن", platform: "linkedin" },
  { id: "facebook", icon: Facebook, type: "social" as const, labelEn: "Facebook", labelAr: "فيسبوك", platform: "facebook" },
];

const ICON_LIBRARY = [
  { id: "instagram", icon: Instagram, label: "Instagram" },
  { id: "twitter", icon: XLogoIcon, label: "X" },
  { id: "tiktok", icon: TikTokIcon, label: "TikTok" },
  { id: "youtube", icon: Youtube, label: "YouTube" },
  { id: "snapchat", icon: SnapchatIcon, label: "Snapchat" },
  { id: "linkedin", icon: Linkedin, label: "LinkedIn" },
  { id: "facebook", icon: Facebook, label: "Facebook" },
  { id: "whatsapp", icon: WhatsAppIcon, label: "WhatsApp" },
  { id: "globe", icon: Globe, label: "Website" },
  { id: "link", icon: LinkIcon, label: "Link" },
  { id: "shopping-bag", icon: ShoppingBag, label: "Shop" },
  { id: "tag", icon: Tag, label: "Offer" },
  { id: "calendar", icon: Calendar, label: "Booking" },
  { id: "map-pin", icon: MapPin, label: "Location" },
  { id: "file-text", icon: FileText, label: "PDF / Doc" },
  { id: "download", icon: Download, label: "Download" },
  { id: "mail", icon: Mail, label: "Email" },
  { id: "phone", icon: Phone, label: "Phone" },
  { id: "music", icon: Music, label: "Music" },
  { id: "video", icon: Video, label: "Video" },
  { id: "image", icon: ImageIcon, label: "Gallery" },
  { id: "heart", icon: Heart, label: "Favorite" },
  { id: "star", icon: Star, label: "Featured" },
  { id: "gift", icon: Gift, label: "Gift" },
  { id: "briefcase", icon: Briefcase, label: "Work" },
  { id: "book-open", icon: BookOpen, label: "Read" },
  { id: "coffee", icon: Coffee, label: "Café" },
  { id: "utensils", icon: Utensils, label: "Menu" },
  { id: "headphones", icon: Headphones, label: "Podcast" },
  { id: "mic", icon: Mic, label: "Mic" },
  { id: "tv", icon: Tv, label: "Stream" },
  { id: "smile", icon: Smile, label: "Fun" },
  { id: "zap", icon: Zap, label: "Fast" },
  { id: "sparkles", icon: Sparkles, label: "Special" },
];

const getIconComponent = (iconId?: string) => {
  if (!iconId) return Globe;
  const fromLib = ICON_LIBRARY.find((i) => i.id === iconId);
  if (fromLib) return fromLib.icon;
  const fromQuick = QUICK_ADD.find((q) => q.id === iconId || q.platform === iconId);
  return fromQuick?.icon || Globe;
};

const FILL_STYLES = [
  { id: "solid", labelEn: "Solid", labelAr: "ممتلئ" },
  { id: "glass", labelEn: "Glass", labelAr: "زجاجي" },
  { id: "outline", labelEn: "Outline", labelAr: "خطّي" },
] as const;
const CORNER_OPTIONS = [
  { id: "square", labelEn: "Square", labelAr: "مربع", radius: 0 },
  { id: "round", labelEn: "Round", labelAr: "مدوّر", radius: 8 },
  { id: "rounder", labelEn: "Rounder", labelAr: "أكثر تدويراً", radius: 16 },
  { id: "full", labelEn: "Full", labelAr: "كبسولة", radius: 999 },
] as const;
const SHADOW_OPTIONS = [
  { id: "none", labelEn: "None", labelAr: "بدون", css: "none" },
  { id: "soft", labelEn: "Soft", labelAr: "خفيف", css: "0 2px 6px rgba(0,0,0,0.08)" },
  { id: "strong", labelEn: "Strong", labelAr: "قوي", css: "0 8px 20px rgba(0,0,0,0.18)" },
  { id: "hard", labelEn: "Hard", labelAr: "حاد", css: "4px 4px 0 rgba(0,0,0,0.9)" },
] as const;

const COLOR_PRESETS = ["#1a1a1a", "#FFFFFF", "#7a253a", "#a83244", "#006C35", "#D4AF37", "#0077B6", "#7C3AED", "#FF6B6B", "#0D9488"];

const FONT_FAMILIES = [
  { id: "", labelEn: "Default", labelAr: "افتراضي" },
  { id: "Inter, system-ui, sans-serif", labelEn: "Inter", labelAr: "إنتر" },
  { id: "'Space Grotesk', sans-serif", labelEn: "Space Grotesk", labelAr: "سبيس" },
  { id: "Georgia, serif", labelEn: "Serif", labelAr: "سيريف" },
  { id: "'Courier New', monospace", labelEn: "Mono", labelAr: "أحادي" },
  { id: "'Tajawal', sans-serif", labelEn: "Tajawal", labelAr: "تجوّل" },
  { id: "'Noto Kufi Arabic', sans-serif", labelEn: "Noto Kufi", labelAr: "نوتو كوفي" },
] as const;

const clampFontSize = (n: number) => Math.max(11, Math.min(18, Math.round(n)));

const DirectionToggle = ({
  value,
  onChange,
  isAr,
}: {
  value: "ltr" | "rtl";
  onChange: (v: "ltr" | "rtl") => void;
  isAr: boolean;
}) => (
  <div>
    <p className="text-[11px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
      <ArrowLeftRight className="w-3 h-3" />
      {isAr ? "اتجاه الزر" : "Button direction"}
    </p>
    <div className="grid grid-cols-2 gap-1.5">
      {([
        { id: "ltr" as const, labelEn: "Left → Right", labelAr: "يسار ← يمين" },
        { id: "rtl" as const, labelEn: "Right → Left", labelAr: "يمين ← يسار" },
      ]).map((d) => {
        const sel = value === d.id;
        return (
          <button
            key={d.id}
            type="button"
            onClick={() => onChange(d.id)}
            className={`px-2 py-1.5 rounded-lg border-2 text-[11px] font-semibold transition-colors ${sel ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:border-primary/40"}`}
          >
            {isAr ? d.labelAr : d.labelEn}
          </button>
        );
      })}
    </div>
  </div>
);

export interface TextStyleValue {
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right";
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

const TextStylePanel = ({
  value,
  onChange,
  isAr,
  defaultFontSize = 14,
}: {
  value: TextStyleValue;
  onChange: (patch: TextStyleValue) => void;
  isAr: boolean;
  defaultFontSize?: number;
}) => {
  const fontSize = value.fontSize ?? defaultFontSize;
  const setFontSize = (n: number) => onChange({ fontSize: clampFontSize(n) });
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
          {isAr ? "لون الخط" : "Font color"}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="color"
            value={value.textColor || "#000000"}
            onChange={(e) => onChange({ textColor: e.target.value })}
            className="w-9 h-9 rounded-md border border-border cursor-pointer"
          />
          {COLOR_PRESETS.map((c) => {
            const sel = (value.textColor || "").toLowerCase() === c.toLowerCase();
            return (
              <button
                key={c}
                type="button"
                onClick={() => onChange({ textColor: c })}
                className={`w-6 h-6 rounded-md border-2 ${sel ? "border-primary scale-110" : "border-border"}`}
                style={{ background: c }}
                aria-label={c}
              />
            );
          })}
          {value.textColor && (
            <button
              type="button"
              onClick={() => onChange({ textColor: undefined })}
              className="text-[10px] text-muted-foreground hover:text-foreground underline"
            >
              {isAr ? "افتراضي" : "Reset"}
            </button>
          )}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
          {isAr ? "حجم الخط" : "Font size"}
        </p>
        <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-background p-1">
          <button
            type="button"
            onClick={() => setFontSize(fontSize - 1)}
            className="w-7 h-7 rounded-md hover:bg-muted text-foreground inline-flex items-center justify-center"
            aria-label={isAr ? "تصغير" : "Decrease"}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 text-xs font-semibold text-foreground tabular-nums w-8 text-center">{fontSize}</span>
          <button
            type="button"
            onClick={() => setFontSize(fontSize + 1)}
            className="w-7 h-7 rounded-md hover:bg-muted text-foreground inline-flex items-center justify-center"
            aria-label={isAr ? "تكبير" : "Increase"}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
          {isAr ? "محاذاة النص" : "Text alignment"}
        </p>
        <div className="inline-flex rounded-lg border border-border bg-background p-1 gap-0.5">
          {([
            { id: "left" as const, Icon: AlignLeft },
            { id: "center" as const, Icon: AlignCenter },
            { id: "right" as const, Icon: AlignRight },
          ]).map(({ id, Icon }) => {
            const sel = (value.textAlign || "center") === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onChange({ textAlign: id })}
                className={`w-8 h-7 rounded-md inline-flex items-center justify-center transition-colors ${sel ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"}`}
                aria-label={id}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
          {isAr ? "نوع الخط" : "Font family"}
        </p>
        <select
          value={value.fontFamily || ""}
          onChange={(e) => onChange({ fontFamily: e.target.value || undefined })}
          className="w-full px-2 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          style={{ fontFamily: value.fontFamily || undefined }}
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.id} value={f.id} style={{ fontFamily: f.id || undefined }}>
              {isAr ? f.labelAr : f.labelEn}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
          {isAr ? "تنسيق" : "Format"}
        </p>
        <div className="inline-flex rounded-lg border border-border bg-background p-1 gap-0.5">
          {([
            { id: "bold" as const, Icon: Bold, active: !!value.bold },
            { id: "italic" as const, Icon: Italic, active: !!value.italic },
            { id: "underline" as const, Icon: Underline, active: !!value.underline },
          ]).map(({ id, Icon, active }) => (
            <button
              key={id}
              type="button"
              onClick={() => onChange({ [id]: !active } as TextStyleValue)}
              className={`w-8 h-7 rounded-md inline-flex items-center justify-center transition-colors ${active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"}`}
              aria-pressed={active}
              aria-label={id}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const ButtonStylePanel = ({
  link,
  onChange,
  isAr,
  defaults,
  isBrandPlatform,
  brandColor,
}: {
  link: DraftLink;
  onChange: (l: DraftLink) => void;
  isAr: boolean;
  defaults: {
    buttonStyle: "solid" | "glass" | "outline";
    cornerRadius: "square" | "round" | "rounder" | "full";
    shadow: "none" | "soft" | "strong" | "hard";
    buttonColor: string;
    buttonTextColor: string;
  };
  isBrandPlatform?: boolean;
  brandColor?: string;
}) => {
  const [tab, setTab] = useState<"icon" | "button" | "text">("icon");
  const fileRef = useRef<HTMLInputElement>(null);
  const hasCustomImage = !!link.iconImage;
  const Current = getIconComponent(link.icon);

  const brandActive =
    !!isBrandPlatform &&
    !!brandColor &&
    link.useBrandColors !== false &&
    !link.buttonStyle &&
    !link.buttonColor &&
    !link.buttonTextColor;
  const brandTextColor = brandColor === "#FFFC00" ? "#000000" : "#FFFFFF";

  const fill = link.buttonStyle ?? (brandActive ? "solid" : defaults.buttonStyle);
  const corner = link.cornerRadius ?? defaults.cornerRadius;
  const shadow = link.shadow ?? defaults.shadow;
  const buttonColor =
    link.buttonColor ?? (brandActive && brandColor ? brandColor : defaults.buttonColor);
  const buttonTextColor =
    link.buttonTextColor ?? (brandActive ? brandTextColor : defaults.buttonTextColor);
  const iconColor = link.iconColor ?? buttonTextColor;

  const handleFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange({ ...link, iconImage: reader.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
      <div className="flex items-center gap-1 p-1 bg-muted/60 border-b border-border">
        <button
          type="button"
          onClick={() => setTab("icon")}
          className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${tab === "icon" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          {isAr ? "الأيقونة" : "Icon"}
        </button>
        <button
          type="button"
          onClick={() => setTab("button")}
          className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${tab === "button" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          {isAr ? "الزر" : "Button"}
        </button>
        <button
          type="button"
          onClick={() => setTab("text")}
          className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${tab === "text" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          {isAr ? "النص" : "Text"}
        </button>
      </div>

      {tab === "text" && (
        <div className="p-3">
          <TextStylePanel
            value={{
              textColor: link.textColor,
              fontSize: link.fontSize,
              fontFamily: link.fontFamily,
              textAlign: link.textAlign,
              bold: link.bold,
              italic: link.italic,
              underline: link.underline,
            }}
            onChange={(patch) => onChange({ ...link, ...patch })}
            isAr={isAr}
          />
        </div>
      )}

      {tab === "icon" && (
        <div className="p-3 space-y-3">
          {!isBrandPlatform && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                {isAr ? "صورة مخصصة" : "Custom image"}
              </p>
              {hasCustomImage ? (
                <div className="flex items-center gap-2">
                  <img src={link.iconImage} alt="" className="w-10 h-10 rounded-lg object-cover border border-border" />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="text-[11px] font-semibold text-foreground px-2.5 py-1.5 rounded-md border border-border hover:bg-muted"
                  >
                    {isAr ? "استبدال" : "Replace"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...link, iconImage: undefined })}
                    className="text-[11px] font-semibold text-destructive px-2.5 py-1.5 rounded-md border border-border hover:bg-destructive/10 inline-flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> {isAr ? "إزالة" : "Remove"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 text-xs font-semibold text-foreground transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {isAr ? "ارفع صورة بدلاً من الأيقونة" : "Upload an image instead of an icon"}
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  handleFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
          )}

          {!isBrandPlatform && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                {isAr ? "اختر أيقونة" : "Choose icon"}
              </p>
              <div className="max-h-32 overflow-y-auto grid grid-cols-8 gap-1.5 p-1 rounded-lg bg-background border border-border">
                {ICON_LIBRARY.map((i) => {
                  const sel = link.icon === i.id && !hasCustomImage;
                  const Icn = i.icon;
                  return (
                    <button
                      key={i.id}
                      type="button"
                      title={i.label}
                      onClick={() => onChange({ ...link, icon: i.id, iconImage: undefined })}
                      className={`aspect-square flex items-center justify-center rounded-md border transition-colors ${sel ? "border-primary bg-primary/10 text-primary" : "border-transparent hover:bg-muted text-foreground"}`}
                    >
                      <Icn className="w-3.5 h-3.5" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground">
                {isAr ? "لون الأيقونة" : "Icon color"}
              </p>
              <label className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="accent-primary w-3 h-3"
                  checked={!!link.iconMatchText}
                  onChange={(e) =>
                    onChange({
                      ...link,
                      iconMatchText: e.target.checked || undefined,
                      iconColor: e.target.checked ? undefined : link.iconColor,
                    })
                  }
                />
                {isAr ? "مطابقة لون النص" : "Match text color"}
              </label>
            </div>
            <div className={`flex items-center gap-2 ${link.iconMatchText ? "opacity-40 pointer-events-none" : ""}`}>
              <input
                type="color"
                value={iconColor}
                onChange={(e) => onChange({ ...link, iconColor: e.target.value })}
                className="w-9 h-9 rounded-md border border-border cursor-pointer"
              />
              <div className="flex flex-wrap gap-1.5">
                {COLOR_PRESETS.map((c) => {
                  const sel = (link.iconColor || "").toLowerCase() === c.toLowerCase();
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => onChange({ ...link, iconColor: c })}
                      className={`w-6 h-6 rounded-md border-2 ${sel ? "border-primary scale-110" : "border-border"}`}
                      style={{ background: c }}
                      aria-label={c}
                    />
                  );
                })}
              </div>
              {link.iconColor && (
                <button
                  type="button"
                  onClick={() => onChange({ ...link, iconColor: undefined })}
                  className="text-[10px] text-muted-foreground hover:text-foreground underline ms-auto"
                >
                  {isAr ? "افتراضي" : "Reset"}
                </button>
              )}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
              {isAr ? "محاذاة الأيقونة" : "Icon alignment"}
            </p>
            {(() => {
              const linkIsRtl = link.direction === "rtl";
              const normalizeToPhysical = (
                v: typeof link.iconAlign | undefined,
              ): "left" | "right" | "edge-left" | "edge-right" => {
                switch (v) {
                  case "left":
                  case "right":
                  case "edge-left":
                  case "edge-right":
                    return v;
                  case "start":
                    return linkIsRtl ? "right" : "left";
                  case "end":
                    return linkIsRtl ? "left" : "right";
                  case "edge-start":
                    return linkIsRtl ? "edge-right" : "edge-left";
                  case "edge-end":
                    return linkIsRtl ? "edge-left" : "edge-right";
                  default:
                    return linkIsRtl ? "right" : "left";
                }
              };
              const current = normalizeToPhysical(link.iconAlign);
              const options = [
                { id: "left" as const, labelEn: "Left of text", labelAr: "يسار النص" },
                { id: "right" as const, labelEn: "Right of text", labelAr: "يمين النص" },
                { id: "edge-left" as const, labelEn: "Pinned far left", labelAr: "مثبّت يساراً" },
                { id: "edge-right" as const, labelEn: "Pinned far right", labelAr: "مثبّت يميناً" },
              ];
              return (
                <div className="grid grid-cols-2 gap-1.5">
                  {options.map((a) => {
                    const sel = current === a.id;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => onChange({ ...link, iconAlign: a.id })}
                        className={`px-2 py-1.5 rounded-lg border-2 text-[11px] font-semibold transition-colors ${sel ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:border-primary/40"}`}
                      >
                        {isAr ? a.labelAr : a.labelEn}
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>{isAr ? "معاينة:" : "Preview:"}</span>
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: buttonColor }}>
              {hasCustomImage ? (
                <img src={link.iconImage} alt="" className="w-4 h-4 object-cover rounded-sm" />
              ) : (
                <Current className="w-4 h-4" style={{ color: iconColor }} />
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "button" && (
        <div className="p-3 space-y-3">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
              {isAr ? "نمط الزر" : "Button style"}
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {FILL_STYLES.map((s) => {
                const sel = fill === s.id;
                const previewStyle: React.CSSProperties =
                  s.id === "solid"
                    ? { background: buttonColor, color: buttonTextColor, border: "1px solid transparent" }
                    : s.id === "glass"
                    ? { background: `${buttonColor}33`, color: buttonColor, border: `1px solid ${buttonColor}55`, backdropFilter: "blur(6px)" }
                    : { background: "transparent", color: buttonColor, border: `2px solid ${buttonColor}` };
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onChange({ ...link, buttonStyle: s.id })}
                    className={`flex flex-col items-center gap-1.5 p-1.5 rounded-lg border-2 text-[10px] font-medium transition-colors ${sel ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:border-primary/40"}`}
                  >
                    <span className="w-full text-center px-2 py-1 rounded text-[10px] font-semibold" style={previewStyle}>
                      Aa
                    </span>
                    {isAr ? s.labelAr : s.labelEn}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
              {isAr ? "تدوير الزوايا" : "Corner roundness"}
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {CORNER_OPTIONS.map((c) => {
                const sel = corner === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onChange({ ...link, cornerRadius: c.id })}
                    className={`flex flex-col items-center gap-1.5 p-1.5 rounded-lg border-2 text-[10px] font-medium transition-colors ${sel ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:border-primary/40"}`}
                  >
                    <span className="w-full h-4" style={{ background: buttonColor, borderRadius: c.radius }} />
                    {isAr ? c.labelAr : c.labelEn}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
              {isAr ? "الظل" : "Shadow"}
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {SHADOW_OPTIONS.map((s) => {
                const sel = shadow === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onChange({ ...link, shadow: s.id })}
                    className={`flex flex-col items-center gap-1.5 p-1.5 rounded-lg border-2 text-[10px] font-medium transition-colors ${sel ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:border-primary/40"}`}
                  >
                    <span className="w-full h-4 rounded-sm" style={{ background: buttonColor, boxShadow: s.css }} />
                    {isAr ? s.labelAr : s.labelEn}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
              {isAr ? "لون الزر" : "Button color"}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="color"
                value={buttonColor}
                onChange={(e) => onChange({ ...link, buttonColor: e.target.value })}
                className="w-9 h-9 rounded-md border border-border cursor-pointer"
              />
              {COLOR_PRESETS.map((c) => {
                const sel = (link.buttonColor || "").toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onChange({ ...link, buttonColor: c })}
                    className={`w-6 h-6 rounded-md border-2 ${sel ? "border-primary scale-110" : "border-border"}`}
                    style={{ background: c }}
                    aria-label={c}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
            <div>
              <p className="text-[11px] font-semibold text-foreground">
                {isAr ? "اهتزاز الزر" : "Shake button"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {isAr ? "حركة خفيفة لجذب الانتباه" : "Adds a subtle attention-grabbing motion"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!!link.shake}
              onClick={() => onChange({ ...link, shake: !link.shake })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${link.shake ? "bg-primary" : "bg-muted-foreground/30"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${link.shake ? "translate-x-[18px] rtl:-translate-x-[18px]" : "translate-x-0.5 rtl:-translate-x-0.5"}`}
              />
            </button>
          </div>

          <DirectionToggle
            value={link.direction || "ltr"}
            onChange={(v) => onChange({ ...link, direction: v })}
            isAr={isAr}
          />
        </div>
      )}
    </div>
  );
};

const LinkRow = ({ link, onChange, onDelete, isAr, isOpen, onToggle, designDefaults, showUrlErrors }: {
  link: DraftLink;
  onChange: (l: DraftLink) => void;
  onDelete: () => void;
  isAr: boolean;
  isOpen: boolean;
  onToggle: () => void;
  showUrlErrors: boolean;
  designDefaults: {
    buttonStyle: "solid" | "glass" | "outline";
    cornerRadius: "square" | "round" | "rounder" | "full";
    shadow: "none" | "soft" | "strong" | "hard";
    buttonColor: string;
    buttonTextColor: string;
  };
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 1 };
  const [stylePanelOpen, setStylePanelOpen] = useState(false);

  if (link.type === "header") {
    const sectionStyle = link.sectionStyle || "text";
    const lineColor = link.lineColor || "#cbd5e1";
    const showText = sectionStyle !== "line";
    const STYLE_OPTIONS: { id: NonNullable<DraftLink["sectionStyle"]>; labelEn: string; labelAr: string }[] = [
      { id: "text", labelEn: "Text only", labelAr: "نص فقط" },
      { id: "text-line", labelEn: "Text with line", labelAr: "نص مع خط" },
      { id: "line", labelEn: "Line only", labelAr: "خط فقط" },
    ];
    const SectionPreview = ({ id }: { id: NonNullable<DraftLink["sectionStyle"]> }) => {
      if (id === "line") return <div className="h-px w-full" style={{ backgroundColor: lineColor }} />;
      if (id === "text-line") {
        return (
          <div className="flex items-center gap-2 w-full">
            <div className="flex-1 h-px" style={{ backgroundColor: lineColor }} />
            <span className="text-[10px] font-semibold text-foreground">Aa</span>
            <div className="flex-1 h-px" style={{ backgroundColor: lineColor }} />
          </div>
        );
      }
      return <span className="text-[10px] font-semibold text-foreground">Aa</span>;
    };
    const sectionLabel = isAr ? "قسم" : "Section";
    return (
      <div ref={setNodeRef} style={style} className="bg-card border border-border rounded-2xl p-4 shadow-soft">
        <div className="flex items-center gap-2">
          <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground touch-none">
            <GripVertical className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="flex-1 flex items-center gap-2 text-start min-w-0"
            aria-expanded={isOpen}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 text-primary">
              <Heading className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide truncate">
              {sectionStyle === "line" ? sectionLabel : (link.title || sectionLabel)}
            </span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
          <button onClick={onDelete} className="text-muted-foreground hover:text-destructive shrink-0">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {isOpen && (
          <div className="mt-3 pt-3 border-t border-border space-y-3">
            {showText && (
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                  {isAr ? "نص العنوان" : "Section title"}
                </p>
                <input
                  value={link.title}
                  onChange={(e) => onChange({ ...link, title: e.target.value })}
                  placeholder={isAr ? "عنوان قسم" : "Section header"}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            )}

            <div>
              <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                {isAr ? "نمط القسم" : "Section style"}
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {STYLE_OPTIONS.map((opt) => {
                  const sel = sectionStyle === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onChange({ ...link, sectionStyle: opt.id })}
                      className={`p-2 rounded-lg border-2 transition-colors flex flex-col items-center gap-1.5 ${sel ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                    >
                      <div className="w-full h-5 flex items-center justify-center px-1">
                        <SectionPreview id={opt.id} />
                      </div>
                      <span className="text-[10px] font-semibold text-foreground leading-none">
                        {isAr ? opt.labelAr : opt.labelEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {sectionStyle !== "text" && (
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                  {isAr ? "لون الخط" : "Line color"}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="color"
                    value={link.lineColor || "#cbd5e1"}
                    onChange={(e) => onChange({ ...link, lineColor: e.target.value })}
                    className="w-9 h-9 rounded-md border border-border cursor-pointer"
                  />
                  {COLOR_PRESETS.map((c) => {
                    const sel = (link.lineColor || "").toLowerCase() === c.toLowerCase();
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => onChange({ ...link, lineColor: c })}
                        className={`w-6 h-6 rounded-md border-2 ${sel ? "border-primary scale-110" : "border-border"}`}
                        style={{ background: c }}
                        aria-label={c}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {showText && (
              <>
                <div className="h-px bg-border" />
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                    {isAr ? "لون الخط" : "Font color"}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="color"
                      value={link.textColor || "#000000"}
                      onChange={(e) => onChange({ ...link, textColor: e.target.value })}
                      className="w-9 h-9 rounded-md border border-border cursor-pointer"
                    />
                    {COLOR_PRESETS.map((c) => {
                      const sel = (link.textColor || "").toLowerCase() === c.toLowerCase();
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => onChange({ ...link, textColor: c })}
                          className={`w-6 h-6 rounded-md border-2 ${sel ? "border-primary scale-110" : "border-border"}`}
                          style={{ background: c }}
                          aria-label={c}
                        />
                      );
                    })}
                    {link.textColor && (
                      <button
                        type="button"
                        onClick={() => onChange({ ...link, textColor: undefined })}
                        className="text-[10px] text-muted-foreground hover:text-foreground underline"
                      >
                        {isAr ? "افتراضي" : "Reset"}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                    {isAr ? "حجم الخط" : "Font size"}
                  </p>
                  <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-background p-1">
                    <button
                      type="button"
                      onClick={() => onChange({ ...link, fontSize: clampFontSize((link.fontSize ?? 16) - 1) })}
                      className="w-7 h-7 rounded-md hover:bg-muted text-foreground inline-flex items-center justify-center"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 text-xs font-semibold text-foreground tabular-nums w-8 text-center">{link.fontSize ?? 16}</span>
                    <button
                      type="button"
                      onClick={() => onChange({ ...link, fontSize: clampFontSize((link.fontSize ?? 16) + 1) })}
                      className="w-7 h-7 rounded-md hover:bg-muted text-foreground inline-flex items-center justify-center"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                    {isAr ? "نوع الخط" : "Font family"}
                  </p>
                  <select
                    value={link.fontFamily || ""}
                    onChange={(e) => onChange({ ...link, fontFamily: e.target.value || undefined })}
                    className="w-full px-2 py-1.5 text-xs rounded-lg border border-border bg-background"
                    style={{ fontFamily: link.fontFamily || undefined }}
                  >
                    {FONT_FAMILIES.map((f) => (
                      <option key={f.id} value={f.id} style={{ fontFamily: f.id || undefined }}>
                        {isAr ? f.labelAr : f.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                    {isAr ? "تنسيق" : "Format"}
                  </p>
                  <div className="inline-flex rounded-lg border border-border bg-background p-1 gap-0.5">
                    {([
                      { id: "bold" as const, Icon: Bold, active: !!link.bold },
                      { id: "italic" as const, Icon: Italic, active: !!link.italic },
                      { id: "underline" as const, Icon: Underline, active: !!link.underline },
                    ]).map(({ id, Icon, active }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onChange({ ...link, [id]: !active } as DraftLink)}
                        className={`w-8 h-7 rounded-md inline-flex items-center justify-center transition-colors ${active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>
                </div>

                {sectionStyle === "text" ? (
                  <div>
                    <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                      {isAr ? "محاذاة النص" : "Text alignment"}
                    </p>
                    <div className="inline-flex rounded-lg border border-border bg-background p-1 gap-0.5">
                      {([
                        { id: "left" as const, Icon: AlignLeft },
                        { id: "center" as const, Icon: AlignCenter },
                        { id: "right" as const, Icon: AlignRight },
                      ]).map(({ id, Icon }) => {
                        const sel = (link.textAlign || "center") === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => onChange({ ...link, textAlign: id })}
                            className={`w-8 h-7 rounded-md inline-flex items-center justify-center transition-colors ${sel ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"}`}
                            aria-label={id}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground italic">
                    {isAr
                      ? "المحاذاة ثابتة في الوسط لأن النص بين خطّين."
                      : "Alignment is locked to center since the text sits between two lines."}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  const isWhatsApp = link.type === "whatsapp";
  const isSocial = link.type === "social";
  const platformLabel = QUICK_ADD.find((q) => q.platform === link.platform);
  const socialLabel = platformLabel ? (isAr ? platformLabel.labelAr : platformLabel.labelEn) : link.platform;
  const Icon = isSocial || isWhatsApp
    ? (QUICK_ADD.find((q) => q.platform === link.platform)?.icon || Globe)
    : getIconComponent(link.icon);
  const displayType = link.displayType || (isSocial || isWhatsApp ? "tag" : "button");
  const brandColor = (isSocial || isWhatsApp) && link.platform
    ? allSocialPlatforms[link.platform]?.color
    : undefined;
  const hasCustomizations =
    link.useBrandColors === false ||
    !!link.buttonStyle ||
    !!link.cornerRadius ||
    !!link.shadow ||
    !!link.buttonColor ||
    !!link.buttonTextColor ||
    !!link.iconColor ||
    !!link.iconImage ||
    !!link.iconAlign ||
    !!link.iconMatchText;
  const brandActive = (isSocial || isWhatsApp) && !!brandColor && !hasCustomizations;
  const headerIconBg = brandActive && brandColor ? `${brandColor}1a` : undefined;
  const headerIconFg = brandActive && brandColor
    ? (brandColor === "#FFFC00" ? "#000" : brandColor)
    : undefined;

  const hasAnyOverride =
    !!link.buttonStyle ||
    !!link.cornerRadius ||
    !!link.shadow ||
    !!link.buttonColor ||
    !!link.buttonTextColor ||
    !!link.iconColor ||
    !!link.iconAlign ||
    !!link.iconMatchText ||
    !!link.direction ||
    !!link.textColor ||
    typeof link.fontSize === "number" ||
    !!link.fontFamily ||
    !!link.textAlign ||
    !!link.bold ||
    !!link.italic ||
    !!link.underline ||
    link.useBrandColors === true;
  const isDefault = (isSocial || isWhatsApp) && brandColor
    ? link.useBrandColors === false && !hasAnyOverride
    : !hasAnyOverride;

  const resetThisLinkToDefault = () => {
    onChange({
      ...link,
      buttonStyle: undefined,
      cornerRadius: undefined,
      shadow: undefined,
      buttonColor: undefined,
      buttonTextColor: undefined,
      iconColor: undefined,
      iconAlign: undefined,
      iconMatchText: undefined,
      direction: undefined,
      textColor: undefined,
      fontSize: undefined,
      fontFamily: undefined,
      textAlign: undefined,
      bold: undefined,
      italic: undefined,
      underline: undefined,
      useBrandColors: (isSocial || isWhatsApp) ? false : undefined,
    });
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-card border border-border rounded-2xl p-4 shadow-soft">
      <div className="flex items-center gap-2">
        <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground touch-none">
          <GripVertical className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="flex-1 flex items-center gap-2 text-start min-w-0"
          aria-expanded={isOpen}
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${brandActive && brandColor ? "" : "bg-primary/10 text-primary"}`}
            style={brandActive && brandColor ? { backgroundColor: headerIconBg, color: headerIconFg } : undefined}
          >
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-foreground uppercase tracking-wide truncate">
            {link.title || (isWhatsApp ? "WhatsApp" : isSocial ? socialLabel : (isAr ? "رابط" : "Link"))}
          </span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
        {(isSocial || isWhatsApp) && brandColor && (
          <button
            type="button"
            role="switch"
            aria-checked={brandActive}
            title={
              brandActive
                ? (isAr ? "ألوان الهوية الرسمية مفعّلة" : "Brand colors active")
                : (isAr
                    ? "اضغط لاستعادة ألوان الهوية الرسمية (سيتم استبدال تخصيصاتك)"
                    : "Click to restore brand defaults (overwrites your customizations)")
            }
            onClick={(e) => {
              e.stopPropagation();
              if (brandActive) return;
              onChange({
                ...link,
                useBrandColors: true,
                buttonStyle: undefined,
                cornerRadius: undefined,
                shadow: undefined,
                buttonColor: undefined,
                buttonTextColor: undefined,
                iconColor: undefined,
                iconImage: undefined,
                iconAlign: undefined,
                iconMatchText: undefined,
              });
            }}
            className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-semibold transition-colors ${
              brandActive
                ? "border-transparent"
                : "border-dashed border-border bg-transparent text-muted-foreground opacity-60 hover:opacity-100 hover:text-foreground"
            }`}
            style={brandActive ? { backgroundColor: `${brandColor}1a`, color: brandColor === "#FFFC00" ? "#000" : brandColor } : undefined}
          >
            <span
              className="inline-block w-2.5 h-2.5 rounded-full border border-black/10"
              style={{ backgroundColor: brandActive ? brandColor : "transparent" }}
            />
            {isAr ? "هوية" : "Brand"}
          </button>
        )}
        <button
          type="button"
          role="switch"
          aria-checked={isDefault}
          title={
            isDefault
              ? (isAr ? "يتبع النمط العام تلقائياً" : "Follows the global default")
              : (isAr
                  ? "اضغط لإعادة الضبط إلى النمط الافتراضي"
                  : "Click to reset to the default style")
          }
          onClick={(e) => {
            e.stopPropagation();
            if (isDefault) return;
            resetThisLinkToDefault();
          }}
          className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-semibold transition-colors ${
            isDefault
              ? "border-transparent bg-primary/10 text-primary"
              : "border-dashed border-border bg-transparent text-muted-foreground opacity-60 hover:opacity-100 hover:text-foreground"
          }`}
        >
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full border border-black/10 ${isDefault ? "bg-primary" : ""}`}
          />
          {isAr ? "افتراضي" : "Default"}
        </button>
        <button onClick={onDelete} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {isOpen && (
        <div className="space-y-2 ps-9 mt-3">
          <input
            value={link.title}
            onChange={(e) => onChange({ ...link, title: e.target.value, titleEn: e.target.value })}
            placeholder={
              isWhatsApp
                ? (isAr ? "اسم زر واتساب" : "WhatsApp button label")
                : isSocial
                ? (isAr ? "اسم العرض" : "Display name")
                : (isAr ? "عنوان الزر" : "Button title")
            }
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          {isSocial ? (
            <>
              <label className="text-[11px] font-semibold text-muted-foreground block">
                {isAr ? `اسم المستخدم في ${socialLabel}` : `${socialLabel} username`}
              </label>
              <div dir="ltr" className={`flex items-stretch border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary bg-background ${showUrlErrors && !link.url.trim() ? "border-destructive" : "border-border"}`}>
                <span className="px-3 flex items-center text-sm text-muted-foreground bg-muted font-mono">@</span>
                <input
                  value={link.url.replace(/^@/, "")}
                  onChange={(e) => onChange({ ...link, url: e.target.value.replace(/^@/, "").trim() })}
                  placeholder="yourname"
                  dir="ltr"
                  className="flex-1 px-3 py-2 bg-background text-sm focus:outline-none font-mono"
                  aria-invalid={showUrlErrors && !link.url.trim()}
                />
              </div>
              {showUrlErrors && !link.url.trim() && (
                <p className="text-xs text-destructive font-medium" role="alert">
                  {isAr ? "اسم المستخدم مطلوب" : "Username is required"}
                </p>
              )}
            </>
          ) : (
            <>
              <input
                value={link.url}
                onChange={(e) => {
                  const raw = e.target.value;
                  const next = isWhatsApp
                    ? (raw.startsWith("+") ? "+" : "") + raw.replace(/[^\d]/g, "")
                    : raw;
                  onChange({ ...link, url: next });
                }}
                inputMode={isWhatsApp ? "tel" : "url"}
                placeholder={isWhatsApp ? "+9665XXXXXXXX" : "https://..."}
                dir="ltr"
                className={`w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${showUrlErrors && !link.url.trim() ? "border-destructive" : "border-border"}`}
                aria-invalid={showUrlErrors && !link.url.trim()}
              />
              {showUrlErrors && !link.url.trim() && (
                <p className="text-xs text-destructive font-medium" role="alert">
                  {isWhatsApp
                    ? (isAr ? "رقم الهاتف مطلوب" : "Phone number is required")
                    : (isAr ? "الرابط مطلوب" : "URL is required")}
                </p>
              )}
              {showUrlErrors && isWhatsApp && link.url.trim() && link.url.replace(/\D/g, "").length < 8 && (
                <p className="text-xs text-destructive font-medium" role="alert">
                  {isAr ? "رقم الهاتف غير صحيح" : "Invalid phone number"}
                </p>
              )}
            </>
          )}
          {isWhatsApp && (
            <input
              value={link.message || ""}
              onChange={(e) => onChange({ ...link, message: e.target.value })}
              placeholder={isAr ? "رسالة ترحيبية (اختياري)" : "Welcome message (optional)"}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          )}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setStylePanelOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors"
              aria-expanded={stylePanelOpen}
            >
              <span className="inline-flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-primary" />
                {isAr ? "النمط" : "Style"}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${stylePanelOpen ? "rotate-180" : ""}`} />
            </button>
            {stylePanelOpen && (
              <div className="mt-2">
                <ButtonStylePanel
                  link={link}
                  onChange={onChange}
                  isAr={isAr}
                  defaults={designDefaults}
                  isBrandPlatform={isSocial || isWhatsApp}
                  brandColor={brandColor}
                />
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
            <span className="text-[11px] font-semibold text-muted-foreground">
              {isAr ? "نوع العرض" : "Display"}
            </span>
            <div className="inline-flex p-0.5 rounded-md bg-muted">
              <button
                type="button"
                onClick={() => onChange({ ...link, displayType: "tag" })}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-colors ${displayType === "tag" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                {isAr ? "وسم" : "Tag"}
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...link, displayType: "button" })}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-colors ${displayType === "button" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                {isAr ? "زر" : "Button"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LinksStep = ({ draft, onUpdate, onContinue }: Props) => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [aiOpen, setAiOpen] = useState(false);
  const [openLinkId, setOpenLinkId] = useState<string | null>(null);
  const [sectionPickerOpen, setSectionPickerOpen] = useState(false);
  const [showUrlErrors, setShowUrlErrors] = useState(false);

  const handleNext = () => {
    const emptyLinks = draft.links.filter((l) => l.type !== "header" && !l.url.trim());
    if (emptyLinks.length > 0) {
      setShowUrlErrors(true);
      setOpenLinkId(emptyLinks[0].id);
      return;
    }
    setShowUrlErrors(false);
    onContinue();
  };

  const updateLinks = (links: DraftLink[]) => onUpdate({ links });

  const addQuick = (q: typeof QUICK_ADD[0]) => {
    const newLink: DraftLink = {
      id: uid(),
      type: q.type,
      platform: q.platform,
      title: isAr ? q.labelAr : q.labelEn,
      titleEn: q.labelEn,
      url: "",
      icon: q.id,
    };
    updateLinks([...draft.links, newLink]);
    setOpenLinkId(newLink.id);
  };

  const addCustomLink = () => {
    const id = uid();
    updateLinks([...draft.links, { id, type: "link", title: isAr ? "رابط جديد" : "New link", titleEn: "New link", url: "", icon: "link" }]);
    setOpenLinkId(id);
  };

  const addWebsiteLink = () => {
    const id = uid();
    updateLinks([...draft.links, { id, type: "link", title: isAr ? "موقعي" : "My website", titleEn: "My website", url: "", icon: "globe" }]);
    setOpenLinkId(id);
  };

  const addHeader = () => setSectionPickerOpen(true);

  const addHeaderWithStyle = (style: NonNullable<DraftLink["sectionStyle"]>) => {
    const id = uid();
    updateLinks([
      ...draft.links,
      {
        id,
        type: "header",
        title: style === "line" ? "" : (isAr ? "عنوان قسم" : "Section header"),
        url: "",
        sectionStyle: style,
        lineColor: "#cbd5e1",
      },
    ]);
    setOpenLinkId(id);
    setSectionPickerOpen(false);
  };

  const buildSuggestions = (): DraftLink[] => {
    const text = `${draft.profile.bio} ${draft.profile.displayName}`.toLowerCase();
    const has = (...keys: string[]) => keys.some((k) => text.includes(k));
    const out: DraftLink[] = [];
    const push = (l: Omit<DraftLink, "id">) => out.push({ id: uid(), ...l });

    push({ type: "link", title: isAr ? "موقعي الرسمي" : "My website", titleEn: "My website", url: "", icon: "globe" });
    push({ type: "whatsapp", platform: "whatsapp", title: "WhatsApp", titleEn: "WhatsApp", url: "", icon: "whatsapp" });

    if (has("shop", "store", "متجر", "تسوق", "ecom", "boutique")) {
      push({ type: "link", title: isAr ? "تسوّق المنتجات" : "Shop now", titleEn: "Shop now", url: "", icon: "shopping-bag" });
      push({ type: "link", title: isAr ? "عروض اليوم" : "Today's offers", titleEn: "Today's offers", url: "", icon: "tag" });
    }
    if (has("restaurant", "cafe", "coffee", "menu", "مطعم", "كافيه", "قهوة", "قائمة")) {
      push({ type: "link", title: isAr ? "قائمة الطعام" : "View menu", titleEn: "View menu", url: "", icon: "utensils" });
      push({ type: "link", title: isAr ? "احجز طاولة" : "Book a table", titleEn: "Book a table", url: "", icon: "calendar" });
      push({ type: "link", title: isAr ? "موقعنا" : "Find us", titleEn: "Find us", url: "", icon: "map-pin" });
    }
    if (has("designer", "design", "creative", "portfolio", "مصمم", "تصميم", "أعمال")) {
      push({ type: "link", title: isAr ? "أعمالي" : "Portfolio", titleEn: "Portfolio", url: "", icon: "briefcase" });
      push({ type: "link", title: isAr ? "اطلب تصميم" : "Hire me", titleEn: "Hire me", url: "", icon: "mail" });
    }
    if (has("podcast", "بودكاست", "music", "song", "موسيقى", "أغنية", "مغني", "singer", "artist", "فنان")) {
      push({ type: "link", title: isAr ? "استمع الآن" : "Listen now", titleEn: "Listen now", url: "", icon: "headphones" });
    }
    if (has("writer", "blog", "author", "كاتب", "مدونة", "مؤلف")) {
      push({ type: "link", title: isAr ? "اقرأ المدونة" : "Read the blog", titleEn: "Read the blog", url: "", icon: "book-open" });
    }
    if (has("event", "conference", "workshop", "فعالية", "ورشة", "مؤتمر")) {
      push({ type: "link", title: isAr ? "احجز مقعدك" : "Get tickets", titleEn: "Get tickets", url: "", icon: "calendar" });
    }
    if (has("youtube", "creator", "vlog", "يوتيوب", "صانع محتوى")) {
      push({ type: "link", title: isAr ? "قناتي على يوتيوب" : "My YouTube", titleEn: "My YouTube", url: "", icon: "video" });
    }
    if (out.length <= 2) {
      push({ type: "link", title: isAr ? "تواصل معي" : "Contact me", titleEn: "Contact me", url: "", icon: "mail" });
      push({ type: "link", title: isAr ? "أحدث الأخبار" : "Latest news", titleEn: "Latest news", url: "", icon: "star" });
    }
    return out;
  };

  const applySuggestions = () => {
    const suggestions = buildSuggestions();
    const existingTitles = new Set(draft.links.map((l) => (l.titleEn || l.title || "").toLowerCase()));
    const fresh = suggestions.filter((s) => !existingTitles.has((s.titleEn || s.title || "").toLowerCase()));
    updateLinks([...draft.links, ...fresh]);
    setAiOpen(false);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const from = draft.links.findIndex((l) => l.id === active.id);
      const to = draft.links.findIndex((l) => l.id === over.id);
      const arr = [...draft.links];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      updateLinks(arr);
    }
  };

  const handleDragStart = (_e: DragStartEvent) => {
    setOpenLinkId(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 pb-32" dir={isAr ? "rtl" : "ltr"}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t("Add your links", "ضيف روابطك")}
          </h1>
          <p className="text-muted-foreground">
            {t("Drag to reorder. Tap a quick-add chip to start.", "اسحب للترتيب. اضغط على أي أيقونة للإضافة السريعة.")}
          </p>
        </div>
      </motion.div>

      <div className="bg-card border border-border rounded-2xl p-5 shadow-soft mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
          {t("Quick add", "إضافة سريعة")}
        </h3>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {QUICK_ADD.map((q) => (
            <button
              key={q.id}
              onClick={() => addQuick(q)}
              className="flex flex-col items-center gap-1 p-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-colors text-foreground"
            >
              <q.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{isAr ? q.labelAr : q.labelEn}</span>
            </button>
          ))}
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <SortableContext items={draft.links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            <AnimatePresence>
              {draft.links.map((link) => (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <LinkRow
                    link={link}
                    isAr={isAr}
                    onChange={(l) => updateLinks(draft.links.map((x) => (x.id === l.id ? l : x)))}
                    onDelete={() => updateLinks(draft.links.filter((x) => x.id !== link.id))}
                    isOpen={openLinkId === link.id}
                    onToggle={() => setOpenLinkId((cur) => (cur === link.id ? null : link.id))}
                    showUrlErrors={showUrlErrors}
                    designDefaults={{
                      buttonStyle: draft.design.buttonStyle,
                      cornerRadius: draft.design.cornerRadius,
                      shadow: draft.design.shadow,
                      buttonColor: draft.design.buttonColor,
                      buttonTextColor: draft.design.buttonTextColor,
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>

      {draft.links.length === 0 && (
        <div className="border-2 border-dashed border-border rounded-2xl p-10 text-center text-muted-foreground">
          {t("No links yet. Add one from the quick-add above.", "ما فيه روابط بعد. ضيف واحد من الأعلى.")}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
        <button
          onClick={addCustomLink}
          className="flex items-center justify-center gap-2 bg-card border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors rounded-xl py-3 text-sm font-medium text-foreground"
        >
          <Plus className="w-4 h-4" /> {t("Add link", "ضيف رابط")}
        </button>
        <button
          onClick={addWebsiteLink}
          className="flex items-center justify-center gap-2 bg-card border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors rounded-xl py-3 text-sm font-medium text-foreground"
        >
          <Globe className="w-4 h-4" /> {t("Add website link", "ضيف رابط موقع")}
        </button>
        <button
          onClick={addHeader}
          className="flex items-center justify-center gap-2 bg-card border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors rounded-xl px-4 py-3 text-sm font-medium text-foreground"
        >
          <Heading className="w-4 h-4" /> {t("Section", "قسم")}
        </button>
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t border-border px-6 py-2 z-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between" dir="ltr">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {t(`${draft.links.length} link${draft.links.length === 1 ? "" : "s"}`, `${draft.links.length} رابط`)}
            </span>
            <button
              onClick={() => setAiOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t("Suggest links", "اقترح روابط")}
            </button>
          </div>
          <button
            type="button"
            onClick={handleNext}
            disabled={draft.links.filter((l) => l.type !== "header").length === 0}
            className="bg-primary text-primary-foreground font-semibold text-sm px-6 py-2 rounded-lg hover:opacity-90 shadow-elevated disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t("Next", "التالي")} →
          </button>
        </div>
      </div>

      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              {t("AI link suggestions", "اقتراحات الروابط الذكية")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "We'll add a starter set of links tailored to your bio. You fill in the URLs.",
                "بنضيف لك مجموعة روابط جاهزة بناءً على نبذتك. أنت تعبّي الروابط."
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {buildSuggestions().map((s, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm text-foreground">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                {isAr ? s.title : (s.titleEn || s.title)}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setAiOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              {t("Cancel", "إلغاء")}
            </button>
            <button
              onClick={applySuggestions}
              className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-lg hover:opacity-90 text-sm flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t("Add suggestions", "أضف الاقتراحات")}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={sectionPickerOpen} onOpenChange={setSectionPickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heading className="w-4 h-4 text-primary" />
              {t("Choose a section style", "اختر نمط القسم")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "You can edit colors and text style after adding it.",
                "يمكنك تعديل الألوان والنص بعد الإضافة."
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {([
              { id: "text" as const, labelEn: "Text only", labelAr: "نص فقط" },
              { id: "text-line" as const, labelEn: "Text with line", labelAr: "نص مع خط" },
              { id: "line" as const, labelEn: "Line only", labelAr: "خط فقط" },
            ]).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => addHeaderWithStyle(opt.id)}
                className="p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center gap-3 text-center"
              >
                <div className="w-full h-8 flex items-center justify-center px-2">
                  {opt.id === "line" && (
                    <div className="h-px w-full" style={{ backgroundColor: "#cbd5e1" }} />
                  )}
                  {opt.id === "text-line" && (
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex-1 h-px" style={{ backgroundColor: "#cbd5e1" }} />
                      <span className="text-sm font-bold text-foreground">Aa</span>
                      <div className="flex-1 h-px" style={{ backgroundColor: "#cbd5e1" }} />
                    </div>
                  )}
                  {opt.id === "text" && (
                    <span className="text-sm font-bold text-foreground">Aa</span>
                  )}
                </div>
                <span className="text-xs font-semibold text-foreground">
                  {isAr ? opt.labelAr : opt.labelEn}
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LinksStep;
