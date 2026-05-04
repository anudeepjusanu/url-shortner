export type BlockType =
  | "profile"
  | "link"
  | "social"
  | "whatsapp"
  | "divider"
  | "text"
  | "image"
  | "video"
  | "map"
  | "contact"
  | "qrcode";

export interface BioBlock {
  id: string;
  type: BlockType;
  visible: boolean;
  animation?: "none" | "fade" | "slide" | "bounce";
  data: Record<string, any>;
}

export interface ImageTransformData {
  scale?: number;
  posX?: number;
  posY?: number;
  fit?: "cover" | "contain";
}

export interface ProfileBlockData {
  avatar: string;
  avatarTransform?: ImageTransformData;
  name: string;
  nameEn: string;
  bio: string;
  bioEn: string;
  verified: boolean;
}

export interface LinkBlockData {
  title: string;
  titleEn: string;
  url: string;
  icon?: string;
  iconImage?: string;
  iconColor?: string;
  displayType?: "tag" | "button";
  buttonStyle?: "solid" | "glass" | "outline";
  cornerRadius?: "square" | "round" | "rounder" | "full";
  shadow?: "none" | "soft" | "strong" | "hard";
  buttonColor?: string;
  buttonTextColor?: string;
  shake?: boolean;
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
  useBrandColors?: boolean;
  brandPlatform?: string;
  direction?: "ltr" | "rtl";
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right";
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export interface SocialBlockData {
  platforms: {
    platform: string;
    username: string;
    url?: string;
    label?: string;
    displayType?: "tag" | "button";
    iconImage?: string;
    iconColor?: string;
    buttonStyle?: "solid" | "glass" | "outline";
    cornerRadius?: "square" | "round" | "rounder" | "full";
    shadow?: "none" | "soft" | "strong" | "hard";
    buttonColor?: string;
    buttonTextColor?: string;
    shake?: boolean;
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
    useBrandColors?: boolean;
    direction?: "ltr" | "rtl";
    textColor?: string;
    fontSize?: number;
    fontFamily?: string;
    textAlign?: "left" | "center" | "right";
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  }[];
}

export interface WhatsAppBlockData {
  title: string;
  titleEn: string;
  phone: string;
  message: string;
  messageEn: string;
  displayType?: "tag" | "button";
}

export interface DividerBlockData {
  style: "line" | "space" | "dots";
}

export interface TextBlockData {
  text: string;
  textEn: string;
  variant: "heading" | "paragraph" | "section";
  sectionStyle?: "text" | "text-line" | "line";
  lineColor?: string;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right";
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export interface ImageBlockData {
  src: string;
  alt: string;
  transform?: ImageTransformData;
}

export interface VideoBlockData {
  url: string;
  platform: "youtube" | "tiktok";
}

export interface MapBlockData {
  lat: number;
  lng: number;
  label: string;
}

export interface ContactFormBlockData {
  email: string;
  fields: ("name" | "email" | "message")[];
}

export interface QRCodeBlockData {
  url: string;
}

export type ButtonStyle = "rounded" | "pill" | "square" | "outline" | "filled" | "glass";
export type AnimationStyle = "none" | "fade" | "slide-up" | "stagger";

export interface BioTheme {
  id: string;
  name: string;
  nameAr: string;
  background: string;
  backgroundType: "solid" | "gradient" | "mesh" | "pattern" | "noise" | "image";
  backgroundTransform?: ImageTransformData;
  buttonStyle: ButtonStyle;
  buttonColor: string;
  buttonTextColor: string;
  textColor: string;
  fontEn: string;
  fontAr: string;
  fontSize: "small" | "medium" | "large";
  borderRadius: number;
  shadow: "none" | "sm" | "md" | "lg";
  animation: AnimationStyle;
}

export interface BioPage {
  id: string;
  username: string;
  title: string;
  description: string;
  language: "ar" | "en";
  theme: BioTheme;
  blocks: BioBlock[];
  settings: BioPageSettings;
  createdAt: string;
  updatedAt: string;
  published: boolean;
}

export interface BioPageSettings {
  slug: string;
  seoTitle: string;
  seoDescription: string;
  favicon: string;
  primaryLanguage: "ar" | "en";
  analyticsEnabled: boolean;
  gaId: string;
  fbPixel: string;
  snapPixel: string;
  tiktokPixel: string;
  customCss: string;
  customDomain: string;
  passwordProtected: boolean;
  password: string;
  scheduledPublish: string;
  expirationDate: string;
  ogImage: string;
  ogTitle: string;
  ogDescription: string;
}
