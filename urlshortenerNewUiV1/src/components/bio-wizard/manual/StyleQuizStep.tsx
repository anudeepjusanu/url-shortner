import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import {
  SkipForward,
  ChevronLeft,
  User,
  Briefcase,
  Video,
  FolderOpen,
  MoreHorizontal,
  Music,
  GraduationCap,
  UtensilsCrossed,
  HeartPulse,
  Cpu,
  Palette,
  Shirt,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { BioDraft } from "../draftTypes";
import { bioThemes } from "@/data/bioThemes";

export type Purpose = "personal" | "business" | "creator" | "portfolio" | "other";
export type Industry =
  | "fashion"
  | "entertainment"
  | "business"
  | "education"
  | "food"
  | "health"
  | "tech"
  | "art"
  | "other";

export const scoreThemeFor = (
  theme: typeof bioThemes[number],
  purpose: Purpose | null,
  industry: Industry | null,
) => {
  let score = 0;
  const isColorful = theme.backgroundType === "gradient" && !["ramadan"].includes(theme.id);

  if (purpose === "personal" && ["minimal-light", "pastel", "desert-sand"].includes(theme.id)) score += 3;
  if (purpose === "business" && ["corporate", "minimal-light", "minimal-dark"].includes(theme.id)) score += 3;
  if (purpose === "creator" && (isColorful || ["neon", "creative", "eid"].includes(theme.id))) score += 3;
  if (purpose === "portfolio" && ["minimal-dark", "minimal-light", "corporate"].includes(theme.id)) score += 3;

  if (industry === "fashion" && ["pastel", "minimal-light", "creative"].includes(theme.id)) score += 3;
  if (industry === "entertainment" && (isColorful || ["neon", "riyadh-nights"].includes(theme.id))) score += 3;
  if (industry === "business" && ["corporate", "minimal-dark", "minimal-light"].includes(theme.id)) score += 3;
  if (industry === "education" && ["minimal-light", "ocean-blue", "corporate"].includes(theme.id)) score += 3;
  if (industry === "food" && ["desert-sand", "creative", "pastel"].includes(theme.id)) score += 3;
  if (industry === "health" && ["minimal-light", "ocean-blue", "pastel"].includes(theme.id)) score += 3;
  if (industry === "tech" && ["minimal-dark", "neon", "corporate"].includes(theme.id)) score += 3;
  if (industry === "art" && ["creative", "neon", "eid", "pastel"].includes(theme.id)) score += 3;

  return score;
};

export const rankThemes = (purpose: Purpose | null, industry: Industry | null) =>
  [...bioThemes]
    .map((th) => ({ th, s: scoreThemeFor(th, purpose, industry) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.th);

interface Props {
  draft: BioDraft;
  onUpdate: (patch: Partial<BioDraft>) => void;
  onContinue: (result: { purpose: Purpose | null; industry: Industry | null; skipped: boolean }) => void;
}

type IconOption<T extends string> = {
  id: T;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  tone: string;
};

const IconOptionGrid = <T extends string>({
  options,
  value,
  onChange,
  cols,
}: {
  options: IconOption<T>[];
  value: T | null;
  onChange: (v: T) => void;
  cols: string;
}) => (
  <div className={`grid ${cols} gap-3`}>
    {options.map((o) => {
      const sel = value === o.id;
      const Icon = o.Icon;
      return (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`group flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all text-center ${
            sel
              ? "border-primary bg-primary/5 shadow-elevated"
              : "border-border hover:border-primary/40 hover:bg-muted/40"
          }`}
        >
          <span
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${o.tone}`}
          >
            <Icon className="w-6 h-6" />
          </span>
          <span className="text-sm font-semibold text-foreground leading-tight">{o.label}</span>
        </button>
      );
    })}
  </div>
);

const StyleQuizStep = ({ draft, onUpdate, onContinue }: Props) => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const [page, setPage] = useState<0 | 1>(0);
  const [purpose, setPurpose] = useState<Purpose | null>(null);
  const [industry, setIndustry] = useState<Industry | null>(null);

  const applyTopMatch = (p: Purpose | null, i: Industry | null) => {
    const ranked = rankThemes(p, i);
    const top = ranked[0];
    if (top) {
      const ts = top.buttonStyle;
      const fill: "solid" | "glass" | "outline" =
        ts === "outline" ? "outline" : "solid";
      const corner: "square" | "round" | "rounder" | "full" =
        ts === "pill" ? "full" : ts === "square" ? "square" : "round";
      onUpdate({
        design: {
          ...draft.design,
          themeId: top.id,
          customColor: null,
          buttonStyle: fill,
          cornerRadius: corner,
          buttonColor: top.buttonColor || draft.design.buttonColor,
          buttonTextColor: top.buttonTextColor || draft.design.buttonTextColor,
        },
      });
    }
    onContinue({ purpose: p, industry: i, skipped: false });
  };

  const skip = () => onContinue({ purpose: null, industry: null, skipped: true });

  const purposeOptions: IconOption<Purpose>[] = [
    { id: "personal", label: t("Personal Brand", "علامة شخصية"), Icon: User, tone: "bg-rose-100 text-rose-700" },
    { id: "business", label: t("Business", "أعمال"), Icon: Briefcase, tone: "bg-blue-100 text-blue-700" },
    { id: "creator", label: t("Creator / Content", "صانع محتوى"), Icon: Video, tone: "bg-purple-100 text-purple-700" },
    { id: "portfolio", label: t("Portfolio", "أعمالي"), Icon: FolderOpen, tone: "bg-amber-100 text-amber-700" },
    { id: "other", label: t("Other", "أخرى"), Icon: MoreHorizontal, tone: "bg-muted text-muted-foreground" },
  ];

  const industryOptions: IconOption<Industry>[] = [
    { id: "fashion", label: t("Fashion & Beauty", "أزياء وجمال"), Icon: Shirt, tone: "bg-pink-100 text-pink-700" },
    { id: "entertainment", label: t("Entertainment", "ترفيه"), Icon: Music, tone: "bg-fuchsia-100 text-fuchsia-700" },
    { id: "business", label: t("Business & Consulting", "أعمال واستشارات"), Icon: Briefcase, tone: "bg-blue-100 text-blue-700" },
    { id: "education", label: t("Education", "تعليم"), Icon: GraduationCap, tone: "bg-indigo-100 text-indigo-700" },
    { id: "food", label: t("Food & Lifestyle", "طعام ونمط حياة"), Icon: UtensilsCrossed, tone: "bg-orange-100 text-orange-700" },
    { id: "health", label: t("Health & Fitness", "صحة ولياقة"), Icon: HeartPulse, tone: "bg-emerald-100 text-emerald-700" },
    { id: "tech", label: t("Tech", "تقنية"), Icon: Cpu, tone: "bg-slate-200 text-slate-700" },
    { id: "art", label: t("Art & Design", "فن وتصميم"), Icon: Palette, tone: "bg-violet-100 text-violet-700" },
    { id: "other", label: t("Other", "أخرى"), Icon: MoreHorizontal, tone: "bg-muted text-muted-foreground" },
  ];

  const totalPages = 2;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 pb-32" dir={isAr ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between mb-6 text-sm">
        {page === 1 ? (
          <button
            onClick={() => setPage(0)}
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            <ChevronLeft className="w-4 h-4" /> {t("Previous", "السابق")}
          </button>
        ) : (
          <span />
        )}
        <span className="text-xs font-semibold text-muted-foreground tracking-wide">
          {t(`Question ${page + 1} of ${totalPages}`, `سؤال ${page + 1} من ${totalPages}`)}
        </span>
      </div>

      <div className="flex gap-1.5 mb-8">
        {Array.from({ length: totalPages }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= page ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {page === 0 && (
          <motion.div
            key="q1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t("What is this page for?", "لمن هذه الصفحة؟")}
            </h1>
            <p className="text-muted-foreground mb-8">
              {t("Pick the option that best fits.", "اختر الأنسب لك.")}
            </p>
            <IconOptionGrid
              options={purposeOptions}
              value={purpose}
              onChange={(v) => {
                setPurpose(v);
                setTimeout(() => setPage(1), 200);
              }}
              cols="grid-cols-2 sm:grid-cols-3"
            />
          </motion.div>
        )}

        {page === 1 && (
          <motion.div
            key="q2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t("What's your field or industry?", "ما هو مجالك؟")}
            </h1>
            <p className="text-muted-foreground mb-8">
              {t("We'll match a theme to your field.", "سنطابق التيمة مع مجالك.")}
            </p>
            <IconOptionGrid
              options={industryOptions}
              value={industry}
              onChange={(v) => {
                setIndustry(v);
                setTimeout(() => applyTopMatch(purpose, v), 250);
              }}
              cols="grid-cols-2 sm:grid-cols-3"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-center mt-10">
        <button
          onClick={skip}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <SkipForward className="w-4 h-4" /> {t("Skip — show all themes", "تخطي — اعرض كل التيمات")}
        </button>
      </div>
    </div>
  );
};

export default StyleQuizStep;
