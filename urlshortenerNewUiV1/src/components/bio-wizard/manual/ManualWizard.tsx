import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { BioDraft } from "../draftTypes";
import ManualHeader from "./ManualHeader";
import ProfileStep from "./ProfileStep";
import LinksStep from "./LinksStep";
import DesignStep from "./DesignStep";
import StyleQuizStep, { Purpose, Industry } from "./StyleQuizStep";
import ReviewStep from "./ReviewStep";
import MiniPreview from "../MiniPreview";

interface Props {
  draft: BioDraft;
  onUpdate: (patch: Partial<BioDraft>) => void;
  onBack: () => void;
  onPublish: () => void;
  onSaveDraft?: () => void;
  originalUsername?: string;
  isEdit?: boolean;
}

const ManualWizard = ({ draft, onUpdate, onBack, onPublish, onSaveDraft, originalUsername, isEdit }: Props) => {
  const [step, setStep] = useState(0);
  const [quizResult, setQuizResult] = useState<{ purpose: Purpose | null; industry: Industry | null; skipped: boolean } | null>(null);
  const [hasReachedLinks, setHasReachedLinks] = useState(isEdit ?? false);

  const goToStep = (s: number) => {
    if (s >= 3) setHasReachedLinks(true);
    if (isEdit && s === 1) {
      setStep(2);
      return;
    }
    setStep(s);
  };

  const goBack = () => {
    if (step === 0) onBack();
    else if (isEdit && step === 2) setStep(0);
    else setStep(step - 1);
  };

  const showPreview = step >= 2 && step < 4;

  return (
    <div className="min-h-screen bg-muted/20 overflow-x-clip">
      <ManualHeader step={step} onBack={goBack} isEdit={isEdit} />
      <div className={showPreview ? "max-w-7xl mx-auto px-4 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-8" : ""}>
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && (
                <ProfileStep
                  draft={draft}
                  onUpdate={onUpdate}
                  onContinue={() => goToStep(1)}
                  originalUsername={originalUsername}
                />
              )}
              {step === 1 && (
                <StyleQuizStep
                  draft={draft}
                  onUpdate={onUpdate}
                  onContinue={(result) => {
                    setQuizResult(result);
                    goToStep(2);
                  }}
                />
              )}
              {step === 2 && (
                <DesignStep
                  draft={draft}
                  onUpdate={onUpdate}
                  onContinue={() => goToStep(3)}
                  quizResult={quizResult}
                />
              )}
              {step === 3 && (
                <LinksStep
                  draft={draft}
                  onUpdate={onUpdate}
                  onContinue={() => goToStep(4)}
                />
              )}
              {step === 4 && <ReviewStep draft={draft} onPublish={onPublish} onSaveDraft={onSaveDraft} />}
            </motion.div>
          </AnimatePresence>
        </div>
        {showPreview && (
          <aside className="hidden lg:block">
            <div className="sticky top-16 pb-2">
              <div className="flex justify-center">
                <MiniPreview
                  draft={draft}
                  scale={0.95}
                  placeholders={!hasReachedLinks}
                />
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default ManualWizard;
