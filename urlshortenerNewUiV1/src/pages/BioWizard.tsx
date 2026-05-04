import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import ManualWizard from "@/components/bio-wizard/manual/ManualWizard";
import PublishStep from "@/components/bio-wizard/PublishStep";
import {
  BioDraft,
  emptyDraft,
  buildBlocksFromDraft,
  buildThemeFromDraft,
  hydrateDraftFromBioPage,
} from "@/components/bio-wizard/draftTypes";
import { bioPageAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

type Stage = "loading" | "manual" | "publishing" | "published";

const BioWizard = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const { toast } = useToast();
  const { t } = useLanguage();

  const [stage, setStage] = useState<Stage>(isEdit ? "loading" : "manual");
  const [draft, setDraft] = useState<BioDraft>({ ...emptyDraft });
  const [publishedUsername, setPublishedUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState<string | undefined>(undefined);
  const [bioPageId, setBioPageId] = useState<string | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load existing bio page for edit mode
  useEffect(() => {
    if (!isEdit || !id) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await bioPageAPI.get(id) as any;
        if (cancelled) return;
        const bioPage = res?.data ?? res;
        const hydrated = hydrateDraftFromBioPage(bioPage);
        setDraft(hydrated);
        setBioPageId(bioPage._id || id);
        setOriginalUsername(bioPage.username);
        setStage("manual");
      } catch (err: any) {
        if (cancelled) return;
        setLoadError(err?.message || t("Failed to load bio page", "فشل تحميل الصفحة"));
        setStage("manual");
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id, isEdit, t]);

  const updateDraft = (patch: Partial<BioDraft>) =>
    setDraft((d) => ({ ...d, ...patch }));

  const buildPayload = (published: boolean) => ({
    username: draft.settings.username,
    title: draft.profile.displayName,
    description: draft.profile.bio,
    avatarUrl: draft.profile.photo,
    blocks: buildBlocksFromDraft(draft),
    design: draft.design,
    bioTheme: buildThemeFromDraft(draft),
    isPublished: published,
    quizPurpose: draft.quiz?.purpose ?? null,
    quizIndustry: draft.quiz?.industry ?? null,
  });

  const handlePublish = async () => {
    setStage("publishing");
    try {
      const payload = buildPayload(true);
      if (isEdit && bioPageId) {
        await bioPageAPI.update(bioPageId, payload);
      } else {
        await bioPageAPI.create(payload);
      }
      setPublishedUsername(draft.settings.username);
      setStage("published");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: t("Publish failed", "فشل النشر"),
        description: err?.message || t("Something went wrong", "حدث خطأ"),
      });
      setStage("manual");
    }
  };

  const handleSaveDraft = async () => {
    try {
      const payload = buildPayload(false);
      if (isEdit && bioPageId) {
        await bioPageAPI.update(bioPageId, payload);
      } else {
        await bioPageAPI.create(payload);
      }
      toast({ title: t("Draft saved", "تم حفظ المسودة") });
      navigate("/dashboard/bio-pages");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: t("Save failed", "فشل الحفظ"),
        description: err?.message || t("Something went wrong", "حدث خطأ"),
      });
    }
  };

  if (stage === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (stage === "publishing") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="text-destructive font-semibold">{loadError}</p>
        <button
          onClick={() => navigate("/dashboard/bio-pages")}
          className="text-sm text-primary hover:underline"
        >
          {t("Back to Bio Pages", "العودة إلى صفحات البايو")}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {stage === "manual" && (
          <motion.div
            key="manual"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <ManualWizard
              draft={draft}
              onUpdate={updateDraft}
              onBack={() => navigate("/dashboard/bio-pages")}
              onPublish={handlePublish}
              onSaveDraft={handleSaveDraft}
              originalUsername={originalUsername}
              isEdit={isEdit}
            />
          </motion.div>
        )}
        {stage === "published" && (
          <motion.div
            key="publish"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <PublishStep username={publishedUsername} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BioWizard;
