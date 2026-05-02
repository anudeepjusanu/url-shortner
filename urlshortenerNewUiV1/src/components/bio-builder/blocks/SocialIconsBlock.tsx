import { SocialBlockData, LinkBlockData } from "@/types/bio";
import { Instagram, Youtube, Linkedin, Facebook, Send, Globe } from "lucide-react";
import LinkBlock from "./LinkBlock";

const XIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z"/>
  </svg>
);

const TikTokIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.84a4.84 4.84 0 0 1-1-.15z" />
  </svg>
);

const SnapchatIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.07 2c3.09 0 5.13 2.17 5.37 5.57.02.33.04.67.04 1.01 0 .23-.01.46-.03.69.45.16.87.35 1.13.5.43.24.68.56.68.93 0 .56-.68.84-1.33 1.07-.23.08-.46.15-.66.24-.09.04-.15.1-.15.17 0 .04.02.09.05.14.61 1.05 1.42 1.87 2.4 2.42.24.13.43.33.43.59 0 .7-1.09 1.11-2.12 1.34-.08.02-.13.1-.15.18-.06.28-.15.55-.56.55-.22 0-.51-.07-.9-.18-.52-.14-.95-.21-1.33-.21-.24 0-.46.03-.68.1-.65.2-1.24.79-2.29.79h-.06c-1.05 0-1.64-.59-2.29-.79a2.48 2.48 0 0 0-.68-.1c-.38 0-.81.07-1.33.21-.39.11-.68.18-.9.18-.41 0-.5-.27-.56-.55-.02-.08-.07-.16-.15-.18C5.09 15.85 4 15.44 4 14.74c0-.26.19-.46.43-.59.98-.55 1.79-1.37 2.4-2.42.03-.05.05-.1.05-.14 0-.07-.06-.13-.15-.17-.2-.09-.43-.16-.66-.24C5.42 11.06 4.74 10.78 4.74 10.22c0-.37.25-.69.68-.93.26-.15.68-.34 1.13-.5a8.5 8.5 0 0 1-.03-.69c0-.34.02-.68.04-1.01C6.8 4.17 8.84 2 11.93 2h.14z" />
  </svg>
);

const PinterestIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.237 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.425 1.808-2.425.853 0 1.265.64 1.265 1.408 0 .858-.546 2.14-.828 3.33-.236.995.5 1.807 1.48 1.807 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.177-4.068-2.845 0-4.515 2.135-4.515 4.34 0 .859.331 1.781.745 2.282a.3.3 0 0 1 .069.288l-.278 1.133c-.044.183-.145.222-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.527-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z" />
  </svg>
);

const WhatsAppIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

const ThreadsIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.432 1.781 3.632 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.26 1.332-3.031.88-.735 2.088-1.17 3.498-1.258 1.066-.067 2.063.04 2.975.291.01-.453-.01-.89-.065-1.31-.145-1.1-.588-1.906-1.317-2.396-.775-.521-1.89-.788-3.312-.795h-.09c-1.072.006-2.003.272-2.69.77l-1.12-1.637C8.159 3.46 9.41 3.072 10.863 3.06h.114c1.834.012 3.327.425 4.436 1.226 1.175.85 1.86 2.092 2.042 3.696.086.755.1 1.58.041 2.455.748.378 1.404.862 1.94 1.446 1.022 1.112 1.588 2.537 1.64 4.122.062 1.882-.555 3.652-1.786 5.126C17.543 23.14 15.16 23.98 12.186 24zm1.638-8.478c-.925-.058-1.745.121-2.378.517-.558.35-.872.827-.886 1.345-.014.504.247.95.736 1.258.534.337 1.253.493 2.024.45 1.058-.058 1.9-.44 2.502-1.136.444-.514.744-1.188.893-2.011a8.065 8.065 0 0 0-2.891-.423z" />
  </svg>
);

export const allSocialPlatforms: Record<string, { label: string; labelAr: string; color: string; icon: React.ComponentType<any>; urlPrefix: string }> = {
  instagram: { label: "Instagram", labelAr: "انستقرام", color: "#E4405F", icon: Instagram, urlPrefix: "https://instagram.com/" },
  twitter: { label: "X", labelAr: "اكس", color: "#000000", icon: XIcon, urlPrefix: "https://x.com/" },
  tiktok: { label: "TikTok", labelAr: "تيك توك", color: "#000000", icon: TikTokIcon, urlPrefix: "https://tiktok.com/@" },
  snapchat: { label: "Snapchat", labelAr: "سناب شات", color: "#FFFC00", icon: SnapchatIcon, urlPrefix: "https://snapchat.com/add/" },
  youtube: { label: "YouTube", labelAr: "يوتيوب", color: "#FF0000", icon: Youtube, urlPrefix: "https://youtube.com/@" },
  linkedin: { label: "LinkedIn", labelAr: "لينكدإن", color: "#0077B5", icon: Linkedin, urlPrefix: "https://linkedin.com/in/" },
  facebook: { label: "Facebook", labelAr: "فيسبوك", color: "#1877F2", icon: Facebook, urlPrefix: "https://facebook.com/" },
  telegram: { label: "Telegram", labelAr: "تيليجرام", color: "#26A5E4", icon: Send, urlPrefix: "https://t.me/" },
  whatsapp: { label: "WhatsApp", labelAr: "واتساب", color: "#25D366", icon: WhatsAppIcon, urlPrefix: "https://wa.me/" },
  pinterest: { label: "Pinterest", labelAr: "بنترست", color: "#BD081C", icon: PinterestIcon, urlPrefix: "https://pinterest.com/" },
  threads: { label: "Threads", labelAr: "ثريدز", color: "#000000", icon: ThreadsIcon, urlPrefix: "https://threads.net/@" },
  website: { label: "Website", labelAr: "موقع إلكتروني", color: "#6B7280", icon: Globe, urlPrefix: "https://" },
};

interface Props {
  data: SocialBlockData;
  textColor?: string;
}

const SocialIconsBlock = ({ data, textColor }: Props) => {
  return (
    <div className="flex items-center justify-center gap-3 py-3 px-4 flex-wrap">
      {data.platforms.map((p) => {
        const social = allSocialPlatforms[p.platform];
        if (!social) return null;
        const href = p.url || (p.username ? `${social.urlPrefix}${p.username}` : "#");
        const IconComp = social.icon;
        const displayType = p.displayType || "tag";
        const label = p.label || social.label;
        const shakeClass = p.shake ? "animate-bio-shake" : "";
        const cornerToRadius: Record<string, string> = {
          square: "0px", round: "8px", rounder: "16px", full: "9999px",
        };
        const shadowToCss: Record<string, string> = {
          none: "none",
          soft: "0 2px 6px rgba(0,0,0,0.08)",
          strong: "0 8px 20px rgba(0,0,0,0.18)",
          hard: "4px 4px 0 rgba(0,0,0,0.9)",
        };
        const radius = p.cornerRadius ? cornerToRadius[p.cornerRadius] : undefined;
        const boxShadow = p.shadow ? shadowToCss[p.shadow] : undefined;
        const fillStyle = p.buttonStyle;
        const overrideBg = p.buttonColor;
        const overrideFg = p.buttonTextColor;
        const iconTint = p.iconColor;
        const customImg = p.iconImage;
        const useBrand = p.useBrandColors !== false;
        if (displayType === "button") {
          const brandBg = useBrand ? social.color : (textColor || "#1a1a1a");
          const brandFg = useBrand
            ? (social.color === "#FFFC00" ? "#000" : "#fff")
            : (textColor && textColor.toLowerCase() === "#ffffff" ? "#1a1a1a" : "#fff");
          const baseBg = overrideBg || brandBg;
          const baseFg = overrideFg || brandFg;
          const linkData: LinkBlockData = {
            title: label,
            titleEn: label,
            url: href,
            icon: p.platform,
            iconImage: customImg,
            iconColor: iconTint,
            displayType: "button",
            buttonStyle: fillStyle,
            cornerRadius: p.cornerRadius,
            shadow: p.shadow,
            buttonColor: baseBg,
            buttonTextColor: baseFg,
            shake: p.shake,
            iconAlign: p.iconAlign,
            iconMatchText: p.iconMatchText,
            direction: p.direction,
            textColor: p.textColor,
            fontSize: p.fontSize,
            fontFamily: p.fontFamily,
            textAlign: p.textAlign,
            bold: p.bold,
            italic: p.italic,
            underline: p.underline,
          };
          return <LinkBlock key={p.platform} data={linkData} buttonColor={baseBg} buttonTextColor={baseFg} borderRadius={Number.parseFloat(radius || "9999")} />;
        }
        const brandTagBg = useBrand ? social.color : `${textColor || '#ffffff'}20`;
        const brandTagFg = useBrand
          ? (social.color === "#FFFC00" ? "#000" : "#fff")
          : textColor;
        const tagBg = overrideBg || brandTagBg;
        const tagFg = iconTint || overrideFg || brandTagFg;
        let bg = tagBg;
        let border = "none";
        const tagBaseBg = useBrand ? social.color : (textColor || '#ffffff');
        if (fillStyle === "glass") {
          bg = `${overrideBg || tagBaseBg}33`;
          border = `1px solid ${overrideBg || tagBaseBg}55`;
        } else if (fillStyle === "outline") {
          bg = "transparent";
          border = `1.5px solid ${overrideBg || tagBaseBg}`;
        }
        return (
          <a
            key={p.platform}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-10 h-10 flex items-center justify-center transition-transform hover:scale-110 ${shakeClass}`}
            style={{
              backgroundColor: bg,
              color: tagFg,
              border,
              borderRadius: radius ?? "9999px",
              boxShadow,
              backdropFilter: fillStyle === "glass" ? "blur(8px)" : undefined,
            }}
            aria-label={social.label}
          >
            {customImg ? (
              <img src={customImg} alt="" className="w-5 h-5 object-contain" />
            ) : (
              <IconComp className="w-5 h-5" />
            )}
          </a>
        );
      })}
    </div>
  );
};

export default SocialIconsBlock;
