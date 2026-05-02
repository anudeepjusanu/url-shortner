import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  current: number;
  total: number;
}

const WizardProgress = ({ current, total }: Props) => {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          initial={false}
          animate={{
            width: i === current ? 28 : 8,
            backgroundColor:
              i < current
                ? "hsl(var(--primary))"
                : i === current
                ? "hsl(var(--primary))"
                : "hsl(var(--muted))",
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cn("h-2 rounded-full")}
        />
      ))}
    </div>
  );
};

export default WizardProgress;
