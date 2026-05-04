import { DividerBlockData } from "@/types/bio";

interface Props {
  data: DividerBlockData;
  textColor?: string;
}

const DividerBlock = ({ data, textColor }: Props) => {
  if (data.style === "space") {
    return <div className="h-6" />;
  }

  if (data.style === "dots") {
    return (
      <div className="flex items-center justify-center gap-1.5 py-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: `${textColor || '#888'}40` }} />
        ))}
      </div>
    );
  }

  return (
    <div className="px-8 py-4">
      <div className="h-px w-full" style={{ backgroundColor: `${textColor || '#888'}20` }} />
    </div>
  );
};

export default DividerBlock;
