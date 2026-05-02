import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import ManualWizard from "@/components/bio-wizard/manual/ManualWizard";
import PublishStep from "@/components/bio-wizard/PublishStep";
import { BioDraft, emptyDraft, buildBlocksFromDraft, buildThemeFromDraft } from "@/components/bio-wizard/draftTypes";
import { bioPageAPI } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

type Stage = "manual" | "publishing" | "published";

const BioWizard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stage, setStage] = useState<Stage>("manual");
  const [draft, setDraft] = useState<BioDraft>({ ...emptyDraft });
  const [publishedUsername, setPublishedUsername] = useState("");

  const updateDraft = (patch: Partial<BioDraft>) =>
    setDraft((d) => ({ ...d, ...patch }));

  const handlePublish = async () => {
    setStage("publishing");
    try {
      const blocks = buildBlocksFromDraft(draft);
      const bioTheme = buildThemeFromDraft(draft);
      const payload = {
        username: draft.settings.username,
        title: draft.profile.displayName,
        description: draft.profile.bio,
        avatarUrl: draft.profile.photo,
        blocks,
        design: draft.design,
        bioTheme,
        isPublished: true,
      };
      await bioPageAPI.create(payload);
      setPublishedUsername(draft.settings.username);
      setStage("published");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Publish failed",
        description: err?.response?.data?.message || err?.message || "Something went wrong",
      });
      setStage("manual");
    }
  };

  const handleSaveDraft = async () => {
    try {
      const blocks = buildBlocksFromDraft(draft);
      const bioTheme = buildThemeFromDraft(draft);
      const payload = {
        username: draft.settings.username,
        title: draft.profile.displayName,
        description: draft.profile.bio,
        avatarUrl: draft.profile.photo,
        blocks,
        design: draft.design,
        bioTheme,
        isPublished: false,
      };
      await bioPageAPI.create(payload);
      toast({ title: "Draft saved" });
      navigate("/dashboard/bio-pages");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: err?.response?.data?.message || err?.message || "Something went wrong",
      });
    }
  };

  if (stage === "publishing") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {stage === "manual" && (
          <motion.div key="manual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <ManualWizard
              draft={draft}
              onUpdate={updateDraft}
              onBack={() => navigate("/dashboard/bio-pages")}
              onPublish={handlePublish}
              onSaveDraft={handleSaveDraft}
            />
          </motion.div>
        )}
        {stage === "published" && (
          <motion.div key="publish" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <PublishStep username={publishedUsername} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BioWizard;
