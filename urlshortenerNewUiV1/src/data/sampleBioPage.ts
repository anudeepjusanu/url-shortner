import { BioBlock } from "@/types/bio";
import { bioThemes } from "./bioThemes";
import avatarSarah from "@/assets/avatar-sarah-brand.jpg";
import avatarAldeera from "@/assets/avatar-aldeera.jpg";
import avatarTechplus from "@/assets/avatar-techplus.jpg";

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

export const showcasePages = [
  {
    id: "showcase-1",
    name: "خالد | مصمم",
    nameEn: "Khalid | Designer",
    username: "khalid_designs",
    avatar: avatarSarah,
    bio: "مصمم جرافيك 🎨",
    bioEn: "Graphic Designer 🎨",
    theme: "riyadh-nights",
    category: "creator",
    categoryEn: "Creator",
    categoryAr: "مبدع",
    links: [
      { title: "حجز استشارة", titleEn: "Book Consultation", icon: "calendar" },
      { title: "معرض أعمالي", titleEn: "My Portfolio", icon: "briefcase" },
      { title: "واتساب", titleEn: "WhatsApp", icon: "message-circle" },
    ],
  },
  {
    id: "showcase-2",
    name: "مطعم الديرة",
    nameEn: "Al Deera Restaurant",
    username: "aldeera",
    avatar: avatarAldeera,
    bio: "أشهى المأكولات السعودية 🍖",
    bioEn: "Best Saudi Cuisine 🍖",
    theme: "desert-sand",
    category: "restaurant",
    categoryEn: "Restaurant",
    categoryAr: "مطعم",
    links: [
      { title: "قائمة الطعام", titleEn: "Menu", icon: "utensils" },
      { title: "اطلب توصيل", titleEn: "Order Delivery", icon: "truck" },
      { title: "موقعنا", titleEn: "Our Location", icon: "map-pin" },
    ],
  },
  {
    id: "showcase-3",
    name: "تقنية بلس",
    nameEn: "Tech Plus",
    username: "techplus",
    avatar: avatarTechplus,
    bio: "حلول تقنية للأعمال 💻",
    bioEn: "Tech Solutions for Business 💻",
    theme: "corporate",
    category: "business",
    categoryEn: "Business",
    categoryAr: "شركة",
    links: [
      { title: "خدماتنا", titleEn: "Our Services", icon: "settings" },
      { title: "تواصل معنا", titleEn: "Contact Us", icon: "phone" },
      { title: "واتساب", titleEn: "WhatsApp", icon: "message-circle" },
    ],
  },
];
