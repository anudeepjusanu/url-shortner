import { useLanguage } from "@/contexts/LanguageContext";
import { LinkBlockData, ButtonStyle } from "@/types/bio";
import {
  Calendar, Briefcase, Play, ExternalLink, ShoppingBag, Star, Globe, Instagram, Youtube,
  Linkedin, Facebook, ArrowRight, Link as LinkIcon, Tag, MapPin, FileText, Mail, Phone, Music,
  Video, Image as ImageIcon, Heart, Gift, BookOpen, Coffee, Utensils, Headphones, Mic, Tv, Smile,
  Zap, Sparkles, Download,
} from "lucide-react";

const iconMap: Record<string, any> = {
  calendar: Calendar,
  briefcase: Briefcase,
  play: Play,
  "shopping-bag": ShoppingBag,
  star: Star,
  globe: Globe,
  link: LinkIcon,
  tag: Tag,
  "map-pin": MapPin,
  "file-text": FileText,
  download: Download,
  mail: Mail,
  phone: Phone,
  music: Music,
  video: Video,
  image: ImageIcon,
  heart: Heart,
  gift: Gift,
  "book-open": BookOpen,
  coffee: Coffee,
  utensils: Utensils,
  headphones: Headphones,
  mic: Mic,
  tv: Tv,
  smile: Smile,
  zap: Zap,
  sparkles: Sparkles,
};

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

const XIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z"/>
  </svg>
);

const WhatsAppIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

iconMap.instagram = Instagram;
iconMap.twitter = XIcon;
iconMap.tiktok = TikTokIcon;
iconMap.youtube = Youtube;
iconMap.snapchat = SnapchatIcon;
iconMap.linkedin = Linkedin;
iconMap.facebook = Facebook;
iconMap.whatsapp = WhatsAppIcon;

interface SocialDetection {
  icon: any;
  label: string;
}

const socialUrlPatterns: { pattern: RegExp; icon: any; label: string }[] = [
  { pattern: /instagram\.com/i, icon: Instagram, label: "Instagram" },
  { pattern: /(twitter\.com|x\.com)/i, icon: XIcon, label: "X" },
  { pattern: /tiktok\.com/i, icon: TikTokIcon, label: "TikTok" },
  { pattern: /snapchat\.com/i, icon: SnapchatIcon, label: "Snapchat" },
  { pattern: /youtube\.com|youtu\.be/i, icon: Youtube, label: "YouTube" },
  { pattern: /linkedin\.com/i, icon: Linkedin, label: "LinkedIn" },
  { pattern: /facebook\.com|fb\.com/i, icon: Facebook, label: "Facebook" },
  { pattern: /wa\.me|whatsapp\.com/i, icon: WhatsAppIcon, label: "WhatsApp" },
];

export function detectSocialFromUrl(url: string): SocialDetection | null {
  if (!url) return null;
  for (const s of socialUrlPatterns) {
    if (s.pattern.test(url)) return { icon: s.icon, label: s.label };
  }
  return null;
}

interface Props {
  data: LinkBlockData;
  buttonStyle?: ButtonStyle;
  buttonColor?: string;
  buttonTextColor?: string;
  borderRadius?: number;
  shadow?: string;
  fontScale?: number;
}

const FILL_TO_BUTTONSTYLE: Record<NonNullable<LinkBlockData["buttonStyle"]>, ButtonStyle> = {
  solid: "rounded",
  glass: "glass",
  outline: "outline",
};
const CORNER_TO_RADIUS: Record<NonNullable<LinkBlockData["cornerRadius"]>, number> = {
  square: 0,
  round: 8,
  rounder: 16,
  full: 999,
};
const SHADOW_TO_KEY: Record<NonNullable<LinkBlockData["shadow"]>, string> = {
  none: "none",
  soft: "sm",
  strong: "md",
  hard: "lg",
};

const LinkBlock = ({ data, buttonStyle = "rounded", buttonColor, buttonTextColor, borderRadius = 12, shadow, fontScale = 1 }: Props) => {
  const { lang } = useLanguage();
  const title = lang === "ar" ? data.title : data.titleEn;

  const effectiveButtonStyle: ButtonStyle = data.buttonStyle
    ? FILL_TO_BUTTONSTYLE[data.buttonStyle]
    : buttonStyle;
  const effectiveBorderRadius = data.cornerRadius
    ? CORNER_TO_RADIUS[data.cornerRadius]
    : borderRadius;
  const effectiveShadow = data.shadow ? SHADOW_TO_KEY[data.shadow] : shadow;
  const effectiveButtonColor = data.buttonColor || buttonColor;
  const effectiveButtonTextColor = data.buttonTextColor || buttonTextColor;

  const social = detectSocialFromUrl(data.url);
  const Icon = social ? social.icon : (data.icon ? iconMap[data.icon] || ExternalLink : ExternalLink);
  const hasCustomImage = !!data.iconImage;
  const displayType = data.displayType || "button";

  const radiusMap: Record<ButtonStyle, number> = {
    rounded: effectiveBorderRadius,
    pill: 999,
    square: 0,
    outline: effectiveBorderRadius,
    filled: effectiveBorderRadius,
    glass: effectiveBorderRadius,
  };

  const isOutline = effectiveButtonStyle === "outline";
  const isGlass = effectiveButtonStyle === "glass";
  const shadowClass = effectiveShadow === "lg" ? "shadow-lg" : effectiveShadow === "md" ? "shadow-md" : effectiveShadow === "sm" ? "shadow-sm" : "";
  const shakeClass = data.shake ? "animate-bio-shake" : "";
  const textColor = data.textColor;
  const TEXT_MIN = 11;
  const TEXT_MAX = 18;
  const rawFontSize = typeof data.fontSize === "number" ? data.fontSize : 14;
  const clampedFontSize = Math.max(TEXT_MIN, Math.min(TEXT_MAX, rawFontSize));

  const fallbackIconColor = isOutline || isGlass ? effectiveButtonColor : effectiveButtonTextColor;
  const iconColor = data.iconMatchText
    ? (textColor || fallbackIconColor)
    : (data.iconColor || fallbackIconColor);

  const labelStyle: React.CSSProperties = {
    color: textColor || undefined,
    fontSize: clampedFontSize * fontScale,
    lineHeight: 1.2,
    fontFamily: data.fontFamily || undefined,
    textAlign: data.textAlign || undefined,
    fontWeight: data.bold ? 700 : undefined,
    fontStyle: data.italic ? "italic" : undefined,
    textDecoration: data.underline ? "underline" : undefined,
  };
  const isRtl = data.direction === "rtl";

  type IconLayout = "left" | "right" | "edge-left" | "edge-right";
  const normalizeIconAlign = (raw: typeof data.iconAlign): IconLayout => {
    switch (raw) {
      case "left":
      case "right":
      case "edge-left":
      case "edge-right":
        return raw;
      case "start":
        return isRtl ? "right" : "left";
      case "end":
        return isRtl ? "left" : "right";
      case "edge-start":
        return isRtl ? "edge-right" : "edge-left";
      case "edge-end":
        return isRtl ? "edge-left" : "edge-right";
      default:
        return isRtl ? "right" : "left";
    }
  };
  const iconLayout: IconLayout = normalizeIconAlign(data.iconAlign);
  const iconPinnedEdge: "left" | "right" | null =
    iconLayout === "edge-left" ? "left" : iconLayout === "edge-right" ? "right" : null;
  const inlineIconSide: "left" | "right" =
    iconLayout === "right" ? "right" : "left";

  if (displayType === "tag") {
    return (
      <a
        href={data.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={title}
        title={title}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${isGlass ? "backdrop-blur-md" : ""} ${shakeClass}`}
        style={{
          backgroundColor: isOutline ? "transparent" : isGlass ? `${effectiveButtonColor}33` : effectiveButtonColor,
          color: iconColor,
          border: isOutline ? `1.5px solid ${effectiveButtonColor}` : isGlass ? `1px solid ${effectiveButtonColor}55` : "none",
        }}
      >
        {hasCustomImage ? (
          <img src={data.iconImage} alt="" className="w-5 h-5 object-cover rounded" />
        ) : (
          <Icon className="w-5 h-5 shrink-0" />
        )}
      </a>
    );
  }

  const IconNode = hasCustomImage ? (
    <img src={data.iconImage} alt="" className="w-5 h-5 object-cover rounded shrink-0" />
  ) : (
    <Icon className="w-5 h-5 shrink-0" style={{ color: iconColor }} />
  );

  const ArrowNode = (
    <ArrowRight
      className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity ${isRtl ? "left-5 rotate-180" : "right-5"}`}
    />
  );

  const anchorClass = `group relative flex items-center px-5 w-full transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${shadowClass} ${isGlass ? "backdrop-blur-md" : ""} ${shakeClass}`;
  const anchorStyle: React.CSSProperties = {
    height: 48,
    borderRadius: radiusMap[effectiveButtonStyle],
    backgroundColor: isOutline ? "transparent" : isGlass ? `${effectiveButtonColor}33` : effectiveButtonColor,
    color: isOutline || isGlass ? effectiveButtonColor : effectiveButtonTextColor,
    border: isOutline ? `2px solid ${effectiveButtonColor}` : isGlass ? `1px solid ${effectiveButtonColor}55` : "none",
    fontSize: 14 * fontScale,
    overflow: "hidden",
  };
  const arrowReserve = 44;
  const iconReserve = 32;
  const iconGap = 8;
  const arrowSide = isRtl ? "left" : "right";
  const resolvedTextAlign: "left" | "center" | "right" =
    data.textAlign === "left" || data.textAlign === "right" || data.textAlign === "center"
      ? data.textAlign
      : isRtl ? "right" : "left";
  const contentJustify =
    resolvedTextAlign === "right" ? "flex-end" : resolvedTextAlign === "center" ? "center" : "flex-start";
  const arrowReserves = () => ({
    left: resolvedTextAlign === "center" || arrowSide === "left" ? arrowReserve : 0,
    right: resolvedTextAlign === "center" || arrowSide === "right" ? arrowReserve : 0,
  });
  const renderLabel = (className = "font-medium truncate min-w-0") => (
    <span className={className} style={labelStyle}>{title}</span>
  );

  if (iconPinnedEdge) {
    const iconOnLeft = iconPinnedEdge === "left";
    const iconSharesArrowSide = (iconOnLeft && arrowSide === "left") || (!iconOnLeft && arrowSide === "right");
    const iconOffset = iconSharesArrowSide ? 44 : 20;
    const reserved = arrowReserves();
    const reservedLeft = reserved.left + (resolvedTextAlign === "center" || iconOnLeft ? iconReserve : 0);
    const reservedRight = reserved.right + (resolvedTextAlign === "center" || !iconOnLeft ? iconReserve : 0);
    return (
      <a
        href={data.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${anchorClass} relative`}
        style={anchorStyle}
      >
        <span
          className="absolute top-1/2 -translate-y-1/2 flex items-center pointer-events-none"
          style={iconOnLeft ? { left: iconOffset } : { right: iconOffset }}
        >
          {IconNode}
        </span>
        <span
          className="flex flex-1 min-w-0"
          style={{ paddingLeft: reservedLeft, paddingRight: reservedRight, justifyContent: contentJustify }}
        >
          {renderLabel()}
        </span>
        {ArrowNode}
      </a>
    );
  }

  const iconSide: "left" | "right" = inlineIconSide;
  const iconAdjacentToText =
    (iconSide === "left" && resolvedTextAlign === "left") ||
    (iconSide === "right" && resolvedTextAlign === "right");

  if (iconAdjacentToText) {
    const reserved = arrowReserves();
    return (
      <a
        href={data.url}
        target="_blank"
        rel="noopener noreferrer"
        className={anchorClass}
        style={anchorStyle}
      >
        <span
          className="flex flex-1 min-w-0 items-center gap-2"
          style={{ paddingLeft: reserved.left, paddingRight: reserved.right, justifyContent: contentJustify }}
        >
          {iconSide === "left" ? IconNode : null}
          {renderLabel()}
          {iconSide === "right" ? IconNode : null}
        </span>
        {ArrowNode}
      </a>
    );
  }

  const iconAdjacentOffset = iconGap;
  const reserved = arrowReserves();
  const reservedLeft = reserved.left + (resolvedTextAlign === "center" || iconSide === "left" ? iconReserve : 0);
  const reservedRight = reserved.right + (resolvedTextAlign === "center" || iconSide === "right" ? iconReserve : 0);
  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${anchorClass} relative`}
      style={anchorStyle}
    >
      <span
        className="flex flex-1 min-w-0"
        style={{ paddingLeft: reservedLeft, paddingRight: reservedRight, justifyContent: contentJustify }}
      >
        <span className="relative inline-block min-w-0" style={{ maxWidth: `calc(100% - ${iconReserve}px)` }}>
          <span
            className="absolute top-1/2 -translate-y-1/2 flex items-center pointer-events-none"
            style={iconSide === "left" ? { right: `calc(100% + ${iconAdjacentOffset}px)` } : { left: `calc(100% + ${iconAdjacentOffset}px)` }}
          >
            {IconNode}
          </span>
          {renderLabel("block font-medium truncate min-w-0")}
        </span>
      </span>
      {ArrowNode}
    </a>
  );
};

export default LinkBlock;
