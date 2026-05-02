import { BioBlock, BioTheme } from "@/types/bio";
import ProfileBlock from "./blocks/ProfileBlock";
import LinkBlock from "./blocks/LinkBlock";
import SocialIconsBlock from "./blocks/SocialIconsBlock";
import WhatsAppBlock from "./blocks/WhatsAppBlock";
import DividerBlock from "./blocks/DividerBlock";
import TextBlock from "./blocks/TextBlock";
import ImageBlock from "./blocks/ImageBlock";
import VideoBlock from "./blocks/VideoBlock";
import MapBlock from "./blocks/MapBlock";
import ContactFormBlock from "./blocks/ContactFormBlock";
import QRCodeBlock from "./blocks/QRCodeBlock";

interface Props {
  block: BioBlock;
  theme: BioTheme;
  isSelected?: boolean;
  onClick?: () => void;
}

const fontSizeScale = {
  small: 0.85,
  medium: 1,
  large: 1.2,
};

const BlockRenderer = ({ block, theme, isSelected, onClick }: Props) => {
  if (!block.visible) return null;

  const scale = fontSizeScale[theme.fontSize || "medium"];

  const renderBlock = () => {
    switch (block.type) {
      case "profile":
        return <ProfileBlock data={block.data as any} textColor={theme.textColor} fontScale={scale} />;
      case "link":
        return (
          <LinkBlock
            data={block.data as any}
            buttonStyle={theme.buttonStyle}
            buttonColor={theme.buttonColor}
            buttonTextColor={theme.buttonTextColor}
            borderRadius={theme.borderRadius}
            shadow={theme.shadow}
            fontScale={scale}
          />
        );
      case "social":
        return <SocialIconsBlock data={block.data as any} textColor={theme.textColor} />;
      case "whatsapp":
        return (
          <WhatsAppBlock
            data={block.data as any}
            textColor={theme.textColor}
          />
        );
      case "divider":
        return <DividerBlock data={block.data as any} textColor={theme.textColor} />;
      case "text":
        return <TextBlock data={block.data as any} textColor={theme.textColor} fontScale={scale} />;
      case "image":
        return <ImageBlock data={block.data as any} />;
      case "video":
        return <VideoBlock data={block.data as any} />;
      case "map":
        return <MapBlock data={block.data as any} />;
      case "contact":
        return (
          <ContactFormBlock
            textColor={theme.textColor}
            buttonColor={theme.buttonColor}
            buttonTextColor={theme.buttonTextColor}
            borderRadius={theme.borderRadius}
          />
        );
      case "qrcode":
        return <QRCodeBlock data={block.data as any} textColor={theme.textColor} />;
      default:
        return null;
    }
  };

  return (
    <div
      onClick={onClick}
      className={`transition-all cursor-pointer ${isSelected ? "ring-2 ring-blue-400 ring-offset-2 rounded-lg" : ""}`}
    >
      {renderBlock()}
    </div>
  );
};

export default BlockRenderer;
