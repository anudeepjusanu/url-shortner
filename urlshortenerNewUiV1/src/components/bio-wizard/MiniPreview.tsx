import { motion } from "framer-motion";
import { BioDraft, buildBlocksFromDraft, buildThemeFromDraft } from "./draftTypes";
import PhoneMockup from "@/components/bio-builder/PhoneMockup";

interface Props {
  draft: BioDraft;
  scale?: number;
  placeholders?: boolean;
}

const MiniPreview = ({ draft, scale = 0.85, placeholders = false }: Props) => {
  const theme = buildThemeFromDraft(draft);
  const blocks = buildBlocksFromDraft(draft, { placeholders });
  const baseW = 332;
  const baseH = 600;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      style={{ width: baseW * scale, height: baseH * scale }}
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: baseW, height: baseH }}>
        <PhoneMockup
          blocks={blocks}
          theme={theme}
          selectedBlockId={null}
          onSelectBlock={() => {}}
        />
      </div>
    </motion.div>
  );
};

export default MiniPreview;
