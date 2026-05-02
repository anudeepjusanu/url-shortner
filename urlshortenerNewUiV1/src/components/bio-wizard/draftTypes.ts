import { BioBlock, BioTheme, ButtonStyle } from "@/types/bio";
import { bioThemes } from "@/data/bioThemes";

export type CreationMethod = "ai" | "manual";
export type LanguageMode = "ar" | "en" | "bilingual";

export interface DraftLink {
  id: string;
  type: "link" | "social" | "whatsapp" | "header" | "divider";
  platform?: string;
  title: string;
  titleEn?: string;
  url: string;
  icon?: string;
  iconImage?: string;
  iconColor?: string;
  trackClicks?: boolean;
  phone?: string;
  message?: string;
  messageEn?: string;
  displayType?: "tag" | "button";
  buttonStyle?: "solid" | "glass" | "outline";
  cornerRadius?: "square" | "round" | "rounder" | "full";
  shadow?: "none" | "soft" | "strong" | "hard";
  buttonColor?: string;
  buttonTextColor?: string;
  shake?: boolean;
  useBrandColors?: boolean;
  direction?: "ltr" | "rtl";
  iconAlign?:
    | "left"
    | "right"
    | "edge-left"
    | "edge-right"
    | "start"
    | "end"
    | "edge-start"
    | "edge-end";
  iconMatchText?: boolean;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right";
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  sectionStyle?: "text" | "text-line" | "line";
  lineColor?: string;
}

export interface DraftSettings {
  username: string;
  language: LanguageMode;
  direction: "rtl" | "ltr";
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
  searchable: boolean;
  passwordProtected: boolean;
  password: string;
  showBranding: boolean;
  trackPageViews: boolean;
  trackLinkClicks: boolean;
  trackGeo: boolean;
  pixelId: string;
}

export interface BioDraft {
  method: CreationMethod | null;
  profile: {
    displayName: string;
    bio: string;
    photo: string;
    location: string;
  };
  links: DraftLink[];
  design: {
    themeId: string | null;
    customColor: string | null;
    backgroundImage: string;
    buttonStyle: "solid" | "glass" | "outline";
    cornerRadius: "square" | "round" | "rounder" | "full";
    shadow: "none" | "soft" | "strong" | "hard";
    buttonColor: string;
    buttonTextColor: string;
    fontEn: string;
    fontAr: string;
    direction?: "ltr" | "rtl";
    textColor?: string;
    fontSize?: number;
    fontFamily?: string;
    textAlign?: "left" | "center" | "right";
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    wallpaperStyle?: "solid" | "gradient" | "mesh" | "pattern" | "noise" | null;
    wallpaperBackground?: string | null;
  };
  settings: DraftSettings;
}

const DEFAULT_AVATAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#f7e8ec"/>
  <circle cx="100" cy="78" r="32" fill="#a83244"/>
  <path d="M40 180c0-33 27-58 60-58s60 25 60 58z" fill="#a83244"/>
</svg>`;
export const DEFAULT_PROFILE_PHOTO = `data:image/svg+xml;utf8,${encodeURIComponent(DEFAULT_AVATAR_SVG)}`;

export const emptyDraft: BioDraft = {
  method: null,
  profile: { displayName: "", bio: "", photo: DEFAULT_PROFILE_PHOTO, location: "" },
  links: [],
  design: {
    themeId: "minimal-light",
    customColor: null,
    backgroundImage: "",
    buttonStyle: "solid",
    cornerRadius: "round",
    shadow: "soft",
    buttonColor: "#1a1a1a",
    buttonTextColor: "#ffffff",
    fontEn: "Inter",
    fontAr: "Tajawal",
    direction: "ltr",
    textAlign: "center",
    fontSize: 14,
    bold: false,
    italic: false,
    underline: false,
    wallpaperStyle: null,
    wallpaperBackground: null,
  },
  settings: {
    username: "",
    language: "bilingual",
    direction: "rtl",
    seoTitle: "",
    seoDescription: "",
    ogImage: "",
    searchable: true,
    passwordProtected: false,
    password: "",
    showBranding: true,
    trackPageViews: true,
    trackLinkClicks: true,
    trackGeo: false,
    pixelId: "",
  },
};

const getContrast = (hex: string): "light" | "dark" => {
  const h = hex.replace("#", "");
  if (h.length < 6) return "light";
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luma > 0.6 ? "dark" : "light";
};

export const buildThemeFromDraft = (draft: BioDraft): BioTheme => {
  const preset = draft.design.themeId
    ? bioThemes.find((t) => t.id === draft.design.themeId)
    : null;

  const fillToButtonStyle: Record<typeof draft.design.buttonStyle, ButtonStyle> = {
    solid: "rounded",
    glass: "glass",
    outline: "outline",
  };
  const cornerToRadius: Record<typeof draft.design.cornerRadius, number> = {
    square: 0,
    round: 8,
    rounder: 16,
    full: 999,
  };
  const shadowToTheme: Record<typeof draft.design.shadow, BioTheme["shadow"]> = {
    none: "none",
    soft: "sm",
    strong: "md",
    hard: "lg",
  };
  const draftButtonStyle = fillToButtonStyle[draft.design.buttonStyle] || "rounded";
  const draftBorderRadius = cornerToRadius[draft.design.cornerRadius] ?? 12;
  const draftShadow = shadowToTheme[draft.design.shadow] ?? "sm";

  let base: BioTheme;
  if (preset) {
    base = {
      ...preset,
      buttonStyle: draftButtonStyle,
      buttonColor: draft.design.buttonColor || preset.buttonColor,
      buttonTextColor: draft.design.buttonTextColor || preset.buttonTextColor,
      borderRadius: draftBorderRadius,
      shadow: draftShadow,
    };
  } else if (draft.design.customColor) {
    const isLight = getContrast(draft.design.customColor) === "dark";
    base = {
      id: "custom",
      name: "Custom",
      nameAr: "مخصص",
      background: draft.design.customColor,
      backgroundType: "solid",
      buttonStyle: draftButtonStyle,
      buttonColor: draft.design.buttonColor || (isLight ? "#1a1a1a" : "#ffffff"),
      buttonTextColor: draft.design.buttonTextColor || (isLight ? "#ffffff" : "#1a1a1a"),
      textColor: isLight ? "#1a1a1a" : "#ffffff",
      fontEn: draft.design.fontEn,
      fontAr: draft.design.fontAr,
      borderRadius: draftBorderRadius,
      fontSize: "medium",
      shadow: draftShadow,
      animation: "fade",
    };
  } else {
    base = bioThemes[0];
  }

  if (draft.design.backgroundImage) {
    return {
      ...base,
      background: `url(${draft.design.backgroundImage})`,
      backgroundType: "image",
    };
  }
  if (draft.design.wallpaperStyle && draft.design.wallpaperStyle !== "solid" && draft.design.wallpaperBackground) {
    return {
      ...base,
      background: draft.design.wallpaperBackground,
      backgroundType: draft.design.wallpaperStyle as BioTheme["backgroundType"],
    };
  }
  return base;
};

export const buildBlocksFromDraft = (
  draft: BioDraft,
  options: { placeholders?: boolean } = {},
): BioBlock[] => {
  const d = draft.design;
  const def = {
    direction: d.direction ?? "ltr",
    textColor: d.textColor,
    fontSize: d.fontSize,
    fontFamily: d.fontFamily,
    textAlign: d.textAlign ?? "center",
    bold: d.bold,
    italic: d.italic,
    underline: d.underline,
  } as const;
  const blocks: BioBlock[] = [
    {
      id: "block-profile",
      type: "profile",
      visible: true,
      animation: "fade",
      data: {
        avatar: draft.profile.photo,
        name: draft.profile.displayName,
        nameEn: draft.profile.displayName,
        bio: draft.profile.bio,
        bioEn: draft.profile.bio,
        verified: false,
      },
    },
  ];

  const isSocialLike = (l: DraftLink) =>
    (l.type === "social" || l.type === "whatsapp") && (l.url || l.phone || "").trim().length > 0;

  let socialRun: DraftLink[] = [];
  let socialRunIdx = 0;
  const flushSocialRun = () => {
    if (!socialRun.length) return;
    const run = socialRun;
    socialRun = [];
    blocks.push({
      id: `block-socials-${socialRunIdx++}`,
      type: "social",
      visible: true,
      animation: "fade",
      data: {
        platforms: run.map((s) => ({
          platform: s.type === "whatsapp" ? "whatsapp" : (s.platform || "instagram"),
          username:
            s.type === "whatsapp"
              ? (s.phone || s.url || "").replace(/[^\d]/g, "")
              : s.url.replace(/^@/, "").trim(),
          displayType: s.displayType || "tag",
          iconImage: s.iconImage,
          iconColor: s.iconColor,
          buttonStyle: s.buttonStyle,
          cornerRadius: s.cornerRadius,
          shadow: s.shadow,
          buttonColor: s.buttonColor,
          buttonTextColor: s.buttonTextColor,
          shake: s.shake,
          useBrandColors: s.useBrandColors !== false,
          iconAlign: s.iconAlign,
          iconMatchText: s.iconMatchText,
          label: s.title || s.titleEn,
          direction: s.direction ?? def.direction,
          textColor: s.textColor ?? def.textColor,
          fontSize: s.fontSize ?? def.fontSize,
          fontFamily: s.fontFamily ?? def.fontFamily,
          textAlign: s.textAlign ?? def.textAlign,
          bold: s.bold ?? def.bold,
          italic: s.italic ?? def.italic,
          underline: s.underline ?? def.underline,
        })),
      },
    });
  };

  draft.links.forEach((l, i) => {
    if (l.type === "social" || l.type === "whatsapp") {
      if (isSocialLike(l)) socialRun.push(l);
      return;
    }
    flushSocialRun();
    if (l.type === "header") {
      blocks.push({
        id: `block-${l.id}`,
        type: "text",
        visible: true,
        animation: "fade",
        data: {
          text: l.title,
          textEn: l.titleEn || l.title,
          variant: "section",
          sectionStyle: l.sectionStyle || "text",
          lineColor: l.lineColor,
          textColor: l.textColor ?? def.textColor,
          fontSize: l.fontSize ?? def.fontSize,
          fontFamily: l.fontFamily ?? def.fontFamily,
          textAlign: l.textAlign,
          bold: l.bold ?? def.bold,
          italic: l.italic ?? def.italic,
          underline: l.underline ?? def.underline,
        },
      });
      return;
    }
    if (l.type === "divider") {
      blocks.push({
        id: `block-${l.id}`,
        type: "divider",
        visible: true,
        data: { style: "line" },
      });
      return;
    }
    let url = l.url.trim();
    if (url && !/^(https?:|mailto:|tel:|sms:)/i.test(url)) url = `https://${url}`;
    blocks.push({
      id: `block-${l.id}-${i}`,
      type: "link",
      visible: true,
      animation: "slide",
      data: {
        title: l.title || l.titleEn || "Link",
        titleEn: l.titleEn || l.title || "Link",
        url,
        icon: l.icon || "globe",
        iconImage: l.iconImage,
        iconColor: l.iconColor,
        displayType: l.displayType || "button",
        buttonStyle: l.buttonStyle,
        cornerRadius: l.cornerRadius,
        shadow: l.shadow,
        buttonColor: l.buttonColor,
        buttonTextColor: l.buttonTextColor,
        shake: l.shake,
        iconAlign: l.iconAlign,
        iconMatchText: l.iconMatchText,
        direction: l.direction ?? def.direction,
        textColor: l.textColor ?? def.textColor,
        fontSize: l.fontSize ?? def.fontSize,
        fontFamily: l.fontFamily ?? def.fontFamily,
        textAlign: l.textAlign ?? def.textAlign,
        bold: l.bold ?? def.bold,
        italic: l.italic ?? def.italic,
        underline: l.underline ?? def.underline,
      },
    });
  });
  flushSocialRun();

  const userHasContent = draft.links.some(
    (l) => l.type === "header" || l.type === "divider" || (l.url || l.phone || "").trim().length > 0,
  );
  if (options.placeholders && !userHasContent) {
    blocks.push({
      id: "placeholder-socials",
      type: "social",
      visible: true,
      animation: "fade",
      data: {
        platforms: [
          { platform: "instagram", username: "yourhandle", displayType: "tag", useBrandColors: true },
          { platform: "tiktok", username: "yourhandle", displayType: "tag", useBrandColors: true },
          { platform: "twitter", username: "yourhandle", displayType: "tag", useBrandColors: true },
        ],
      },
    });
    const sampleLinks = [
      { title: "زر رابط أساسي", titleEn: "Primary link", icon: "globe" },
      { title: "متجري", titleEn: "Shop", icon: "shopping-bag" },
      { title: "تواصل معي", titleEn: "Contact me", icon: "mail" },
    ];
    sampleLinks.forEach((s, i) => {
      blocks.push({
        id: `placeholder-link-${i}`,
        type: "link",
        visible: true,
        animation: "slide",
        data: {
          title: s.title,
          titleEn: s.titleEn,
          url: "#",
          icon: s.icon,
          displayType: "button",
          direction: def.direction,
          textColor: def.textColor,
          fontSize: def.fontSize,
          fontFamily: def.fontFamily,
          textAlign: def.textAlign,
          bold: def.bold,
          italic: def.italic,
          underline: def.underline,
        },
      });
    });
  }

  return blocks;
};

export const uid = () => `l${Math.random().toString(36).slice(2, 9)}`;
