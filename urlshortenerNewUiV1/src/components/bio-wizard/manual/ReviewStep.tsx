import { motion } from "framer-motion";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { BioDraft } from "../draftTypes";
import MiniPreview from "../MiniPreview";

interface Props {
  draft: BioDraft;
  onPublish: () => void;
  onSaveDraft?: () => void;
}

const ReviewStep = ({ draft, onPublish, onSaveDraft }: Props) => {
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const link = `${window.location.host}/bio/${draft.settings.username || "yourname"}`;

  const handleSaveDraft = () => {
    try {
      localStorage.setItem("bio_draft", JSON.stringify(draft));
    } catch {}
    toast.success(t("Draft saved", "تم حفظ المسودة"));
    onSaveDraft?.();
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 pb-32 text-center" dir={isAr ? "rtl" : "ltr"}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          🎉 {t("Ready to publish!", "جاهز للنشر!")}
        </h1>
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary font-semibold rounded-full px-4 py-2 mb-6 shadow-soft">
          <span aria-hidden>✨</span>
          <span className="text-sm md:text-base">
            {t(
              "Don't stress, you can tweak your page anytime after publishing!",
              "لا تشيل هم، تقدر تعدّل صفحتك متى ما تبي بعد النشر!"
            )}
          </span>
        </div>
        <p className="text-muted-foreground mb-8">
          {t("Your page will be live at:", "صفحتك راح تكون مباشرة على:")}
        </p>

        <div className="bg-card border border-border rounded-2xl p-4 shadow-soft inline-block mb-8">
          <code className="text-lg font-mono font-bold text-primary">{link}</code>
        </div>
      </motion.div>

      <div className="flex justify-center mb-8">
        <MiniPreview draft={draft} scale={0.85} />
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t border-border px-6 py-4 z-20">
        <div className="max-w-3xl mx-auto flex flex-col-reverse sm:flex-row justify-end items-stretch sm:items-center gap-3">
          <button
            onClick={handleSaveDraft}
            className="inline-flex items-center justify-center gap-2 border border-border bg-card text-foreground font-semibold px-6 py-3 rounded-xl hover:bg-muted transition-colors"
          >
            <Save className="w-4 h-4" /> {t("Save as draft", "حفظ كمسودة")}
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onPublish}
            className="bg-primary text-primary-foreground font-bold px-8 py-3 rounded-xl hover:opacity-90 shadow-elevated"
          >
            🚀 {t("Publish now", "انشر الآن")}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;
