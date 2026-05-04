import { BioBlock, BioTheme } from "@/types/bio";
import { bioThemes } from "./bioThemes";

export const sampleBlocks: BioBlock[] = [
  {
    id: "block-profile",
    type: "profile",
    visible: true,
    animation: "fade",
    data: {
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=snip",
      name: "اسمك هنا",
      nameEn: "Your Name",
      bio: "نبذة قصيرة عنك",
      bioEn: "A short bio about you",
      verified: false,
    },
  },
  {
    id: "block-socials",
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
  },
  {
    id: "block-link-1",
    type: "link",
    visible: true,
    animation: "slide",
    data: {
      title: "زر رابط أساسي",
      titleEn: "Primary Link",
      url: "#",
      icon: "globe",
      displayType: "button",
    },
  },
];

export const sampleBioPage = {
  id: "sample",
  username: "sample",
  title: "Sample Page",
  blocks: sampleBlocks,
  theme: bioThemes[0],
};

export const showcasePages = [sampleBioPage];
