import { ChevronLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import WizardProgress from "../WizardProgress";

interface Props {
  step: number;
  onBack: () => void;
  isEdit?: boolean;
}

const labelsCreate = [
  { en: "Profile", ar: "البروفايل" },
  { en: "Style", ar: "الأسلوب" },
  { en: "Design", ar: "التصميم" },
  { en: "Links", ar: "الروابط" },
  { en: "Publish", ar: "النشر" },
];
const labelsEdit = [
  { en: "Profile", ar: "البروفايل" },
  { en: "Style", ar: "الأسلوب" },
  { en: "Design", ar: "التصميم" },
  { en: "Links", ar: "الروابط" },
  { en: "Save", ar: "حفظ" },
];

const ManualHeader = ({ step, onBack, isEdit }: Props) => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const labels = isEdit ? labelsEdit : labelsCreate;
  const lbl = labels[step];
  const total = isEdit ? 4 : 5;
  const displayedStep = isEdit && step >= 2 ? step - 1 : step;
  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-6 py-3" dir="ltr">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
        >
          <ChevronLeft className="w-5 h-5" />
          {t("Back", "رجوع")}
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold text-foreground">{t(lbl.en, lbl.ar)}</div>
          <div className="text-[10px] text-muted-foreground">
            {t(`Step ${displayedStep + 1} of ${total}`, `الخطوة ${displayedStep + 1} من ${total}`)}
          </div>
        </div>
        <WizardProgress current={displayedStep} total={total} />
      </div>
    </div>
  );
};

export default ManualHeader;
