import { motion } from "framer-motion";
import {
  Check, Palette, ImagePlus, X, Grid3x3, Wallpaper,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, Type, ArrowLeftRight, Minus, Plus,
  Sparkles, Loader2, AlertCircle, RefreshCw,
} from "lucide-react";
import { useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { BioDraft } from "../draftTypes";
import { bioThemes } from "@/data/bioThemes";
import { Purpose, Industry, rankThemes, scoreThemeFor } from "./StyleQuizStep";
import { bioPageAPI } from "@/services/api";

interface Props {
  draft: BioDraft;
  onUpdate: (patch: Partial<BioDraft>) => void;
  onContinue: () => void;
  quizResult?: { purpose: Purpose | null; industry: Industry | null; skipped: boolean } | null;
}

const PRESET_COLORS = ["#7a253a", "#a83244", "#0D9488", "#7C3AED", "#1B2A4A", "#0F172A", "#0077B6", "#006C35", "#D4AF37", "#FF6B6B", "#5D4037", "#FFFBF5"];
const BUTTON_FILL_STYLES = [
  { id: "solid", label: { en: "Solid", ar: "ممتلئ" } },
  { id: "glass", label: { en: "Glass", ar: "زجاجي" } },
  { id: "outline", label: { en: "Outline", ar: "خطّي" } },
] as const;
const CORNER_OPTIONS = [
  { id: "square", label: { en: "Square", ar: "مربع" }, radius: 0 },
  { id: "round", label: { en: "Round", ar: "مدوّر" }, radius: 8 },
  { id: "rounder", label: { en: "Rounder", ar: "أكثر تدويراً" }, radius: 16 },
  { id: "full", label: { en: "Full", ar: "كبسولة" }, radius: 999 },
] as const;
const SHADOW_OPTIONS = [
  { id: "none", label: { en: "None", ar: "بدون" }, css: "none" },
  { id: "soft", label: { en: "Soft", ar: "خفيف" }, css: "0 2px 6px rgba(0,0,0,0.08)" },
  { id: "strong", label: { en: "Strong", ar: "قوي" }, css: "0 8px 20px rgba(0,0,0,0.18)" },
  { id: "hard", label: { en: "Hard", ar: "حاد" }, css: "4px 4px 0 rgba(0,0,0,0.9)" },
] as const;
const BUTTON_COLOR_PRESETS = ["#1a1a1a", "#FFFFFF", "#7a253a", "#a83244", "#006C35", "#D4AF37", "#0077B6", "#7C3AED", "#FF6B6B", "#0D9488"];

const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
const parseHex = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [parseInt(full.slice(0, 2), 16) || 0, parseInt(full.slice(2, 4), 16) || 0, parseInt(full.slice(4, 6), 16) || 0];
};
const toHex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("");
const shade = (hex: string, amount: number): string => {
  if (!hex.startsWith("#")) return hex;
  const [r, g, b] = parseHex(hex);
  if (amount >= 0) return toHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
  const k = 1 + amount;
  return toHex(r * k, g * k, b * k);
};
const withAlpha = (hex: string, alpha: number): string => {
  const [r, g, b] = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const buildWallpaper = (style: string, baseColor: string): string => {
  switch (style) {
    case "gradient":
      return `linear-gradient(180deg, ${shade(baseColor, 0.75)} 0%, ${baseColor} 40%, ${shade(baseColor, -0.85)} 100%)`;
    case "mesh":
      return `radial-gradient(at 20% 20%, ${withAlpha(shade(baseColor, 0.4), 0.85)} 0px, transparent 50%), radial-gradient(at 80% 0%, ${withAlpha(shade(baseColor, 0.6), 0.7)} 0px, transparent 50%), radial-gradient(at 0% 80%, ${withAlpha(shade(baseColor, -0.3), 0.7)} 0px, transparent 50%), radial-gradient(at 80% 80%, ${withAlpha(shade(baseColor, -0.5), 0.7)} 0px, transparent 50%), ${baseColor}`;
    default:
      return baseColor;
  }
};

type WallpaperStyleOption = "solid" | "gradient" | "mesh" | "image";

const WALLPAPER_STYLES: { id: WallpaperStyleOption; labelEn: string; labelAr: string }[] = [
  { id: "solid", labelEn: "Solid", labelAr: "لون ثابت" },
  { id: "gradient", labelEn: "Gradient", labelAr: "تدرج" },
  { id: "mesh", labelEn: "Mesh", labelAr: "شبكي" },
  { id: "image", labelEn: "Image", labelAr: "صورة" },
];

const DesignStep = ({ draft, onUpdate, onContinue, quizResult }: Props) => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const bgRef = useRef<HTMLInputElement>(null);

  const hasQuiz = !!(quizResult && !quizResult.skipped && (quizResult.purpose || quizResult.industry));
  const ranked = hasQuiz ? rankThemes(quizResult!.purpose, quizResult!.industry) : bioThemes;
  const suggestedIds = hasQuiz ? new Set(ranked.slice(0, 6).map((t) => t.id)) : new Set<string>();
  const [showAll, setShowAll] = useState(!hasQuiz);
  const themesToShow = showAll ? bioThemes : ranked.slice(0, 6);

  // Derive active wallpaper style from draft state
  const activeWallpaperStyle: WallpaperStyleOption = draft.design.backgroundImage
    ? "image"
    : draft.design.wallpaperStyle === "gradient"
    ? "gradient"
    : draft.design.wallpaperStyle === "mesh"
    ? "mesh"
    : "solid";

  // AI image generation state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const setTheme = (id: string) => {
    const theme = bioThemes.find((t) => t.id === id);
    const themeStyle = theme?.buttonStyle;
    const fillFromTheme: BioDraft["design"]["buttonStyle"] | undefined =
      themeStyle === "outline" ? "outline" : themeStyle ? "solid" : undefined;
    const cornerFromTheme: BioDraft["design"]["cornerRadius"] | undefined =
      themeStyle === "pill" ? "full" : themeStyle === "square" ? "square" : themeStyle ? "round" : undefined;
    onUpdate({
      design: {
        ...draft.design,
        themeId: id,
        customColor: null,
        buttonStyle: fillFromTheme || draft.design.buttonStyle,
        cornerRadius: cornerFromTheme || draft.design.cornerRadius,
        buttonColor: theme?.buttonColor || draft.design.buttonColor,
        buttonTextColor: theme?.buttonTextColor || draft.design.buttonTextColor,
        wallpaperStyle: null,
        wallpaperBackground: null,
      },
    });
  };

  const setColor = (color: string) => {
    const style = draft.design.wallpaperStyle;
    const wallpaperBackground = style && style !== "solid"
      ? buildWallpaper(style as string, color)
      : null;
    onUpdate({ design: { ...draft.design, themeId: null, customColor: color, wallpaperBackground } });
  };

  const setButtonStyle = (s: BioDraft["design"]["buttonStyle"]) =>
    onUpdate({ design: { ...draft.design, buttonStyle: s } });
  const setCornerRadius = (c: BioDraft["design"]["cornerRadius"]) =>
    onUpdate({ design: { ...draft.design, cornerRadius: c } });
  const setShadow = (s: BioDraft["design"]["shadow"]) =>
    onUpdate({ design: { ...draft.design, shadow: s } });
  const setButtonColor = (color: string) => {
    const h = color.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    onUpdate({ design: { ...draft.design, buttonColor: color, buttonTextColor: luma > 0.6 ? "#1a1a1a" : "#ffffff" } });
  };

  const setWallpaperStyle = (style: WallpaperStyleOption) => {
    if (style === "image") {
      // Clear color-based wallpaper; leave backgroundImage as-is or trigger upload
      onUpdate({
        design: {
          ...draft.design,
          themeId: null,
          wallpaperStyle: null,
          wallpaperBackground: null,
        },
      });
    } else {
      const baseColor = draft.design.customColor || "#FFFBF5";
      if (style === "solid") {
        onUpdate({
          design: {
            ...draft.design,
            themeId: null,
            backgroundImage: "",
            customColor: baseColor,
            wallpaperStyle: null,
            wallpaperBackground: null,
          },
        });
      } else {
        onUpdate({
          design: {
            ...draft.design,
            themeId: null,
            backgroundImage: "",
            customColor: baseColor,
            wallpaperStyle: style,
            wallpaperBackground: buildWallpaper(style, baseColor),
          },
        });
      }
    }
  };

  const handleBgFile = (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return; // 5 MB max
    const reader = new FileReader();
    reader.onload = () =>
      onUpdate({ design: { ...draft.design, backgroundImage: reader.result as string, themeId: null, wallpaperStyle: null, wallpaperBackground: null } });
    reader.readAsDataURL(file);
  };

  const handleAiGenerate = async () => {
    const prompt = aiPrompt.trim();
    if (!prompt || aiLoading) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await (bioPageAPI as any).generateBgImage(prompt) as any;
      const url = res?.data?.url;
      if (!url) throw new Error(t("No image returned", "لم يتم إرجاع صورة"));
      onUpdate({ design: { ...draft.design, backgroundImage: url, themeId: null, wallpaperStyle: null, wallpaperBackground: null } });
    } catch (err: any) {
      setAiError(err?.message || t("Generation failed. Please try again.", "فشل الإنشاء. حاول مرة أخرى."));
    } finally {
      setAiLoading(false);
    }
  };

  const isColorStyle = activeWallpaperStyle === "solid" || activeWallpaperStyle === "gradient" || activeWallpaperStyle === "mesh";

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 pb-32" dir={isAr ? "rtl" : "ltr"}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{t("Design your page", "صمم صفحتك")}</h1>
            <p className="text-muted-foreground">
              {hasQuiz
                ? t("We've suggested themes for you. Tweak anything below.", "اقترحنا تيمات لك. عدّل ما تشاء.")
                : t("Pick a theme and customize your colors.", "اختر تيمة وخصّص الألوان.")}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Themes ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <h3 className="text-sm font-bold text-foreground">
          {showAll ? t("All themes", "كل التيمات") : t("Suggested themes", "التيمات المقترحة")}
        </h3>
        {hasQuiz && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/15 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Grid3x3 className="w-3.5 h-3.5" />
            {showAll ? t("Show suggestions", "اعرض الاقتراحات") : t("All themes", "كل التيمات")}
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-8">
        {themesToShow.map((theme) => {
          const sel = draft.design.themeId === theme.id;
          const isSuggested = hasQuiz && suggestedIds.has(theme.id);
          const isDimmed = showAll && hasQuiz && !isSuggested;
          const score = hasQuiz ? scoreThemeFor(theme, quizResult!.purpose, quizResult!.industry) : 0;
          return (
            <motion.button
              key={theme.id}
              whileHover={{ scale: isDimmed ? 1.02 : 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setTheme(theme.id)}
              className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                sel
                  ? "border-primary shadow-elevated opacity-100"
                  : isDimmed
                  ? "border-border opacity-40 hover:opacity-70"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <div className="h-20 flex items-center justify-center" style={{ background: theme.background }}>
                <div className="w-12 h-3 rounded" style={{ background: theme.buttonColor }} />
              </div>
              <div className="bg-card text-[10px] font-semibold p-1.5 truncate text-foreground">
                {isAr ? theme.nameAr : theme.name}
              </div>
              {sel && (
                <div className="absolute top-1.5 end-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                </div>
              )}
              {!sel && hasQuiz && !showAll && score > 0 && (
                <div className="absolute top-1.5 start-1.5 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-2.5 h-2.5 text-primary" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* ── Wallpaper Style + Background ───────────────────────────────────── */}
      <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
        <Wallpaper className="w-4 h-4" />
        {t("Wallpaper Style & Background", "نمط الخلفية والألوان")}
      </h3>
      <p className="text-xs text-muted-foreground mb-3">
        {t("Choose a style, then set color or image.", "اختر نمطاً ثم اضبط اللون أو الصورة.")}
      </p>
      <div className="bg-card border border-border rounded-2xl p-5 shadow-soft mb-8 space-y-5">
        {/* Style selector */}
        <div className="grid grid-cols-4 gap-2">
          {WALLPAPER_STYLES.map((ws) => {
            const sel = activeWallpaperStyle === ws.id;
            const baseColor = draft.design.customColor || "#FFFBF5";
            let previewBg = baseColor;
            if (ws.id === "gradient") previewBg = buildWallpaper("gradient", baseColor);
            else if (ws.id === "mesh") previewBg = buildWallpaper("mesh", baseColor);
            else if (ws.id === "image") previewBg = draft.design.backgroundImage || "#e2e8f0";

            return (
              <button
                key={ws.id}
                type="button"
                onClick={() => setWallpaperStyle(ws.id)}
                className={`flex flex-col items-center gap-1.5 p-1.5 rounded-lg border-2 text-[11px] font-medium transition-all ${
                  sel
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                <div
                  className="w-full aspect-[3/4] rounded-md border border-border/60 overflow-hidden"
                  style={ws.id === "image" && draft.design.backgroundImage
                    ? { backgroundImage: `url(${draft.design.backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }
                    : { background: previewBg }}
                  aria-hidden
                />
                <span>{isAr ? ws.labelAr : ws.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Color picker — shown for Solid, Gradient, Mesh */}
        {isColorStyle && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" />
              {t("Background color", "لون الخلفية")}
            </p>
            <div className="grid grid-cols-6 md:grid-cols-12 gap-2 mb-3">
              {PRESET_COLORS.map((c) => {
                const sel = draft.design.customColor === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`aspect-square rounded-lg border-2 ${sel ? "border-primary scale-110" : "border-border"} transition-transform`}
                    style={{ background: c }}
                  >
                    {sel && <Check className="w-4 h-4 m-auto text-white drop-shadow" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={draft.design.customColor || "#7a253a"}
                onChange={(e) => setColor(e.target.value)}
                className="w-14 h-14 rounded-lg border border-border cursor-pointer"
              />
              <input
                type="text"
                value={draft.design.customColor || ""}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#7a253a"
                className="flex-1 px-3 py-3 rounded-xl border border-border bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                dir="ltr"
                maxLength={7}
              />
            </div>
          </div>
        )}

        {/* Image panel — shown only when Image style is selected */}
        {activeWallpaperStyle === "image" && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
              <ImagePlus className="w-3.5 h-3.5" />
              {t("Background image", "صورة الخلفية")}
            </p>

            {draft.design.backgroundImage ? (
              <div className="relative rounded-xl overflow-hidden h-40 group mb-3">
                <img src={draft.design.backgroundImage} alt="background" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => onUpdate({ design: { ...draft.design, backgroundImage: "" } })}
                  className="absolute top-2 end-2 w-8 h-8 rounded-full bg-background/90 backdrop-blur flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => bgRef.current?.click()}
                  className="absolute bottom-2 end-2 bg-background/90 backdrop-blur text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-background"
                >
                  {t("Replace", "استبدال")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => bgRef.current?.click()}
                className="w-full h-28 rounded-xl border-2 border-dashed border-border hover:border-primary bg-muted/30 flex flex-col items-center justify-center transition-colors mb-3"
              >
                <ImagePlus className="w-7 h-7 text-muted-foreground mb-1.5" />
                <span className="text-sm font-medium text-foreground">{t("Upload background image", "رفع صورة خلفية")}</span>
                <span className="text-xs text-muted-foreground mt-0.5">{t("PNG, JPG up to 5 MB", "PNG أو JPG حتى 5 ميجا")}</span>
              </button>
            )}
            <input
              ref={bgRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { handleBgFile(e.target.files?.[0]); e.target.value = ""; }}
            />

            {/* AI generation */}
            <div className="mt-3 pt-4 border-t border-border space-y-2">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                {t("Generate with AI", "إنشاء بالذكاء الاصطناعي")}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {t("Describe the background you want. AI will create a unique image.", "صف الخلفية التي تريدها. سيصنع الذكاء الاصطناعي صورة فريدة.")}
              </p>
              <div className="flex items-stretch gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => { setAiPrompt(e.target.value); setAiError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleAiGenerate()}
                  placeholder={t("e.g. soft pink bokeh with gold glitter", "مثال: خلفية وردية ناعمة مع بريق ذهبي")}
                  disabled={aiLoading}
                  className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-60"
                  dir={isAr ? "rtl" : "ltr"}
                  maxLength={400}
                />
                <button
                  type="button"
                  onClick={handleAiGenerate}
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5 shrink-0"
                >
                  {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {aiLoading ? t("Generating…", "جاري الإنشاء…") : t("Generate", "أنشئ")}
                </button>
              </div>
              {aiError && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-destructive font-medium">{aiError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAiGenerate}
                    className="text-xs font-semibold text-destructive hover:underline inline-flex items-center gap-1 shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {t("Retry", "إعادة المحاولة")}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Default Button Style ────────────────────────────────────────────── */}
      <h3 className="text-sm font-bold text-foreground mb-3">{t("Default Button Style", "النمط الافتراضي للأزرار")}</h3>
      <div className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-5">
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">{t("Button style", "نمط الزر")}</p>
          <div className="grid grid-cols-3 gap-2">
            {BUTTON_FILL_STYLES.map((s) => {
              const sel = draft.design.buttonStyle === s.id;
              const baseColor = draft.design.buttonColor || "#1a1a1a";
              const textColor = draft.design.buttonTextColor || "#ffffff";
              const previewStyle: React.CSSProperties =
                s.id === "solid"
                  ? { background: baseColor, color: textColor, border: "1px solid transparent" }
                  : s.id === "glass"
                  ? { background: `${baseColor}33`, color: baseColor, border: `1px solid ${baseColor}55`, backdropFilter: "blur(6px)" }
                  : { background: "transparent", color: baseColor, border: `2px solid ${baseColor}` };
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setButtonStyle(s.id)}
                  className={`flex flex-col items-center gap-2 p-2 rounded-xl border-2 text-xs font-medium transition-colors ${sel ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:border-primary/40"}`}
                >
                  <span className="px-3 py-1.5 rounded-md text-[11px] font-semibold w-full text-center" style={previewStyle}>Aa</span>
                  {isAr ? s.label.ar : s.label.en}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">{t("Corner roundness", "تدوير الزوايا")}</p>
          <div className="grid grid-cols-4 gap-2">
            {CORNER_OPTIONS.map((c) => {
              const sel = draft.design.cornerRadius === c.id;
              const baseColor = draft.design.buttonColor || "#1a1a1a";
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCornerRadius(c.id)}
                  className={`flex flex-col items-center gap-2 p-2 rounded-xl border-2 text-xs font-medium transition-colors ${sel ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:border-primary/40"}`}
                >
                  <span className="w-full h-6" style={{ background: baseColor, borderRadius: c.radius }} />
                  {isAr ? c.label.ar : c.label.en}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">{t("Shadow", "الظل")}</p>
          <div className="grid grid-cols-4 gap-2">
            {SHADOW_OPTIONS.map((s) => {
              const sel = draft.design.shadow === s.id;
              const baseColor = draft.design.buttonColor || "#1a1a1a";
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setShadow(s.id)}
                  className={`flex flex-col items-center gap-2 p-2 rounded-xl border-2 text-xs font-medium transition-colors ${sel ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:border-primary/40"}`}
                >
                  <span className="w-full h-6 rounded-md" style={{ background: baseColor, boxShadow: s.css }} />
                  {isAr ? s.label.ar : s.label.en}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            {t("Button direction", "اتجاه الزر")}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {([
              { id: "ltr" as const, labelEn: "Left → Right", labelAr: "يسار ← يمين" },
              { id: "rtl" as const, labelEn: "Right → Left", labelAr: "يمين ← يسار" },
            ]).map((d) => {
              const sel = (draft.design.direction || "ltr") === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onUpdate({ design: { ...draft.design, direction: d.id } })}
                  className={`px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-colors ${sel ? "border-primary bg-primary/5 text-primary" : "border-border text-foreground hover:border-primary/40"}`}
                >
                  {isAr ? d.labelAr : d.labelEn}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" />
            {t("Button color", "لون الأزرار")}
          </p>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2 mb-3">
            {BUTTON_COLOR_PRESETS.map((c) => {
              const sel = draft.design.buttonColor?.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setButtonColor(c)}
                  className={`aspect-square rounded-lg border-2 ${sel ? "border-primary scale-110" : "border-border"} transition-transform`}
                  style={{ background: c }}
                  aria-label={c}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={draft.design.buttonColor || "#1a1a1a"}
              onChange={(e) => setButtonColor(e.target.value)}
              className="w-12 h-12 rounded-lg border border-border cursor-pointer"
            />
            <input
              type="text"
              value={draft.design.buttonColor || ""}
              onChange={(e) => setButtonColor(e.target.value)}
              placeholder="#1a1a1a"
              className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              dir="ltr"
              maxLength={7}
            />
          </div>
        </div>
      </div>

      {/* ── Text Style ─────────────────────────────────────────────────────── */}
      <h3 className="text-sm font-bold text-foreground mt-8 mb-3 flex items-center gap-2">
        <Type className="w-4 h-4" /> {t("Default Text Style", "النمط الافتراضي للنص")}
      </h3>
      <div className="bg-card border border-border rounded-2xl p-5 shadow-soft space-y-5">
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">{t("Font color", "لون الخط")}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="color"
              value={draft.design.textColor || "#000000"}
              onChange={(e) => onUpdate({ design: { ...draft.design, textColor: e.target.value } })}
              className="w-10 h-10 rounded-md border border-border cursor-pointer"
            />
            {BUTTON_COLOR_PRESETS.map((c) => {
              const sel = (draft.design.textColor || "").toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => onUpdate({ design: { ...draft.design, textColor: c } })}
                  className={`w-7 h-7 rounded-md border-2 ${sel ? "border-primary scale-110" : "border-border"}`}
                  style={{ background: c }}
                  aria-label={c}
                />
              );
            })}
            {draft.design.textColor && (
              <button
                type="button"
                onClick={() => onUpdate({ design: { ...draft.design, textColor: undefined } })}
                className="text-[11px] text-muted-foreground hover:text-foreground underline"
              >
                {t("Reset", "افتراضي")}
              </button>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">{t("Font size", "حجم الخط")}</p>
          <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => onUpdate({ design: { ...draft.design, fontSize: Math.max(10, (draft.design.fontSize ?? 14) - 1) } })}
              className="w-8 h-8 rounded-md hover:bg-muted text-foreground inline-flex items-center justify-center"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-3 text-sm font-semibold text-foreground tabular-nums w-10 text-center">
              {draft.design.fontSize ?? 14}
            </span>
            <button
              type="button"
              onClick={() => onUpdate({ design: { ...draft.design, fontSize: Math.min(28, (draft.design.fontSize ?? 14) + 1) } })}
              className="w-8 h-8 rounded-md hover:bg-muted text-foreground inline-flex items-center justify-center"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">{t("Text alignment", "محاذاة النص")}</p>
          <div className="inline-flex rounded-lg border border-border bg-background p-1 gap-0.5">
            {([
              { id: "left" as const, Icon: AlignLeft },
              { id: "center" as const, Icon: AlignCenter },
              { id: "right" as const, Icon: AlignRight },
            ]).map(({ id, Icon }) => {
              const sel = (draft.design.textAlign || "center") === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onUpdate({ design: { ...draft.design, textAlign: id } })}
                  className={`w-9 h-8 rounded-md inline-flex items-center justify-center transition-colors ${sel ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"}`}
                  aria-label={id}
                  aria-pressed={sel}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">{t("Font family", "نوع الخط")}</p>
          <select
            value={draft.design.fontFamily || ""}
            onChange={(e) => onUpdate({ design: { ...draft.design, fontFamily: e.target.value || undefined } })}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            style={{ fontFamily: draft.design.fontFamily || undefined }}
          >
            {[
              { id: "", labelEn: "Default", labelAr: "افتراضي" },
              { id: "Inter, system-ui, sans-serif", labelEn: "Inter", labelAr: "إنتر" },
              { id: "'Space Grotesk', sans-serif", labelEn: "Space Grotesk", labelAr: "سبيس" },
              { id: "Georgia, serif", labelEn: "Serif", labelAr: "سيريف" },
              { id: "'Courier New', monospace", labelEn: "Mono", labelAr: "أحادي" },
              { id: "'Tajawal', sans-serif", labelEn: "Tajawal", labelAr: "تجوّل" },
              { id: "'Noto Kufi Arabic', sans-serif", labelEn: "Noto Kufi", labelAr: "نوتو كوفي" },
            ].map((f) => (
              <option key={f.id} value={f.id} style={{ fontFamily: f.id || undefined }}>
                {isAr ? f.labelAr : f.labelEn}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">{t("Format", "تنسيق")}</p>
          <div className="inline-flex rounded-lg border border-border bg-background p-1 gap-0.5">
            {([
              { id: "bold" as const, Icon: Bold, active: !!draft.design.bold },
              { id: "italic" as const, Icon: Italic, active: !!draft.design.italic },
              { id: "underline" as const, Icon: Underline, active: !!draft.design.underline },
            ]).map(({ id, Icon, active }) => (
              <button
                key={id}
                type="button"
                onClick={() => onUpdate({ design: { ...draft.design, [id]: !active } })}
                className={`w-9 h-8 rounded-md inline-flex items-center justify-center transition-colors ${active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"}`}
                aria-pressed={active}
                aria-label={id}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Continue bar ───────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t border-border px-6 py-2 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-end gap-3" dir="ltr">
          <button
            type="button"
            onClick={onContinue}
            className="bg-primary text-primary-foreground font-semibold text-sm px-6 py-2 rounded-lg hover:opacity-90 shadow-elevated"
          >
            {t("Add your links", "أضف روابطك")} →
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesignStep;
