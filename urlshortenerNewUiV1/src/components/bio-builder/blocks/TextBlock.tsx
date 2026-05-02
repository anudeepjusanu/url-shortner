import { useLanguage } from "@/contexts/LanguageContext";
import { TextBlockData } from "@/types/bio";

interface Props {
  data: TextBlockData;
  textColor?: string;
  fontScale?: number;
}

const TextBlock = ({ data, textColor, fontScale = 1 }: Props) => {
  const { lang } = useLanguage();
  const text = lang === "ar" ? data.text : data.textEn;

  if (data.variant === "section") {
    const style = data.sectionStyle || "text";
    const lineColor = data.lineColor || textColor || "currentColor";
    const resolvedTextColor = data.textColor || textColor;
    const labelStyle: React.CSSProperties = {
      color: resolvedTextColor,
      fontSize: (data.fontSize ?? 16) * fontScale,
      fontFamily: data.fontFamily,
      fontWeight: data.bold ? 700 : 600,
      fontStyle: data.italic ? "italic" : undefined,
      textDecoration: data.underline ? "underline" : undefined,
    };

    if (style === "line") {
      return (
        <div className="px-4 py-3">
          <div className="h-px w-full" style={{ backgroundColor: lineColor }} />
        </div>
      );
    }
    if (style === "text-line") {
      return (
        <div className="px-4 py-2 flex items-center gap-3">
          <div className="flex-1 h-px" style={{ backgroundColor: lineColor }} />
          <span className="whitespace-nowrap" style={labelStyle}>{text}</span>
          <div className="flex-1 h-px" style={{ backgroundColor: lineColor }} />
        </div>
      );
    }
    const align = data.textAlign || "center";
    return (
      <div className="px-4 py-2" style={{ textAlign: align }}>
        <span style={labelStyle}>{text}</span>
      </div>
    );
  }

  if (data.variant === "heading") {
    return (
      <h2 className="font-bold px-4 py-2" style={{ color: textColor, fontSize: 18 * fontScale }}>
        {text}
      </h2>
    );
  }

  return (
    <p className="px-4 py-2 opacity-80" style={{ color: textColor, fontSize: 14 * fontScale }}>
      {text}
    </p>
  );
};

export default TextBlock;
