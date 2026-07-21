import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBrand } from "@/contexts/BrandContext";
import {
  MessageCircle,
  Calendar,
  Instagram,
  Music,
  UtensilsCrossed,
  MapPin,
  Globe,
  BadgeCheck,
  Phone,
  ShoppingBag,
  Image as ImageIcon,
  Mail,
  Star,
  Sparkles,
  Youtube,
  Eye,
  Heart,
  Users,
} from "lucide-react";
import avatarCreator from "@/assets/avatar-creator-designer.jpg";
import avatarStudio from "@/assets/avatar-nuqta-studio.jpg";
import brewLogo from "@/assets/brew-house-logo.png";
import bgCreator from "@/assets/bio-bg-creator.jpg";
import bgRestaurant from "@/assets/bio-bg-restaurant.jpg";
import bgStudio from "@/assets/bio-bg-studio.jpg";

type Social =
  | "instagram"
  | "tiktok"
  | "whatsapp"
  | "twitter"
  | "globe"
  | "phone"
  | "youtube";

const SocialDot = ({
  kind,
  tone = "light",
}: {
  kind: Social;
  tone?: "light" | "dark";
}) => {
  const Icon =
    kind === "instagram"
      ? Instagram
      : kind === "tiktok"
        ? Music
        : kind === "youtube"
          ? Youtube
          : kind === "whatsapp"
            ? MessageCircle
            : kind === "globe"
              ? Globe
              : kind === "phone"
                ? Phone
                : Music;
  const dark = tone === "dark";
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm ${
        dark
          ? "bg-black/8 border border-black/10"
          : "bg-white/18 border border-white/30"
      }`}
    >
      <Icon
        className={`w-3.5 h-3.5 ${dark ? "text-gray-800" : "text-white"}`}
      />
    </div>
  );
};

const ROTATE_MS = 5000;

type LinkRow = {
  icon: typeof ImageIcon;
  label: string;
  meta?: string;
  accent: string; // tailwind-ish hsl token for icon tile
};

type Persona = {
  key: string;
  tag: string;
  avatar: string;
  name: string;
  title: string;
  bg: string;
  accent: string; // for badge + button accent
  cardTone: "light" | "dark";
  buttons: LinkRow[];
  socials: Social[];
};

/**
 * Refreshed bio-page preview rendered inside a phone frame.
 * Auto-rotates between three personas with distinct, appealing layouts.
 */
export const BioPreview = () => {
  const { t } = useLanguage();
  const brand = useBrand();
  const [idx, setIdx] = useState(0);

  const personas: Persona[] = [
    {
      key: "creator",
      tag: t("Creator", "مبدع"),
      avatar: avatarCreator,
      name: t("Khalid Al-Qahtani", "خالد القحطاني"),
      title: t("Graphic Designer · Riyadh", "مصمم جرافيك · الرياض"),
      bg: `linear-gradient(180deg, hsl(350 50% 15% / 0.55) 0%, hsl(350 60% 25% / 0.7) 100%), url(${bgCreator}) center/cover`,
      accent: "hsl(15 85% 60%)",
      cardTone: "light",
      buttons: [
        {
          icon: ImageIcon,
          label: t("Latest Work", "أحدث الأعمال"),
          meta: t("New", "جديد"),
          accent: "hsl(15 85% 60%)",
        },
        {
          icon: Calendar,
          label: t("Book Consultation", "حجز استشارة"),
          accent: "hsl(280 55% 55%)",
        },
        {
          icon: Mail,
          label: t("Email Me", "راسلني"),
          accent: "hsl(200 80% 50%)",
        },
      ],
      socials: ["instagram", "tiktok", "youtube"],
    },
    {
      key: "restaurant",
      tag: t("Restaurant", "قهوة"),
      avatar: brewLogo,
      name: t("Coffee Shop", "محل قهوة"),
      title: t("Specialty Coffee · Al Olaya", "قهوة مختصة · العليا"),
      bg: `linear-gradient(180deg, hsl(28 40% 10% / 0.55) 0%, hsl(28 45% 18% / 0.7) 100%), url(${bgRestaurant}) center/cover`,
      accent: "hsl(35 80% 55%)",
      cardTone: "light",
      buttons: [
        {
          icon: ShoppingBag,
          label: t("Order Online", "اطلب أونلاين"),
          meta: t("Free delivery", "توصيل مجاني"),
          accent: "hsl(35 80% 50%)",
        },
        {
          icon: UtensilsCrossed,
          label: t("View Menu", "تصفح القائمة"),
          accent: "hsl(15 70% 50%)",
        },
        {
          icon: MapPin,
          label: t("Get Directions", "الموقع"),
          accent: "hsl(200 70% 50%)",
        },
      ],
      socials: ["instagram", "whatsapp", "phone"],
    },
    {
      key: "business",
      tag: t("Business", "أعمال"),
      avatar: avatarStudio,
      name: t("Studio", "ستوديو"),
      title: t("Branding & Web Design", "هوية بصرية ومواقع"),
      bg: `linear-gradient(180deg, hsl(220 55% 10% / 0.55) 0%, hsl(215 50% 18% / 0.7) 100%), url(${bgStudio}) center/cover`,
      accent: "hsl(195 85% 55%)",
      cardTone: "light",
      buttons: [
        {
          icon: Sparkles,
          label: t("Case Studies", "دراسات الحالة"),
          meta: t("12 new", "12 جديدة"),
          accent: "hsl(195 85% 50%)",
        },
        {
          icon: MessageCircle,
          label: t("Contact Sales", "تواصل مع المبيعات"),
          accent: "hsl(150 60% 45%)",
        },
        {
          icon: Calendar,
          label: t("Free Consultation", "استشارة مجانية"),
          accent: "hsl(280 55% 55%)",
        },
      ],
      socials: ["instagram", "globe", "whatsapp"],
    },
  ];

  useEffect(() => {
    const id = setInterval(
      () => setIdx((i) => (i + 1) % personas.length),
      ROTATE_MS,
    );
    return () => clearInterval(id);
  }, [personas.length]);

  const p = personas[idx];

  return (
    <div className="flex justify-center">
      <div className="relative">
        {/* Phone frame */}
        <div className="w-[270px] rounded-[36px] border-[5px] border-gray-900 bg-gray-900 shadow-elevated overflow-hidden">
          <div className="relative h-[500px] overflow-hidden">
            {/* Notch overlay */}
            <div className="absolute inset-x-0 top-0 z-20 h-5 flex justify-center pointer-events-none">
              <div className="w-20 h-3 bg-gray-900 rounded-b-lg" />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={p.key}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                className="absolute inset-0 flex flex-col"
              >
                {/* Full-bleed background */}
                <div
                  className="absolute inset-0"
                  style={{ background: p.bg }}
                />
                {/* Bottom darkening for legibility */}
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/65 via-black/30 to-transparent pointer-events-none" />
                {/* Top darkening for chips */}
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />

                {/* Top chips */}
                <div className="absolute top-6 inset-x-4 z-10 flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/15 border border-white/25 text-[9px] font-bold tracking-wide text-white uppercase backdrop-blur-md">
                    {p.tag}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-white/15 border border-white/25 flex items-center justify-center backdrop-blur-md">
                    <Globe className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>

                {/* Content overlay */}
                <div className="relative z-10 flex-1 flex flex-col px-4 pt-16 pb-3">
                  {/* Avatar */}
                  <div className="flex justify-center mb-2">
                    <div className="relative">
                      <div
                        className="absolute -inset-1 rounded-full blur-md opacity-60"
                        style={{ background: p.accent }}
                      />
                      <img
                        src={p.avatar}
                        alt={p.name}
                        loading="lazy"
                        className="relative w-[72px] h-[72px] rounded-full object-cover ring-[3px] ring-white/80 shadow-lg bg-white/10"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow">
                        <BadgeCheck
                          className="w-4 h-4"
                          style={{ color: p.accent }}
                          fill={p.accent}
                          stroke="white"
                          strokeWidth={2.5}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Name + title */}
                  <div className="text-center mb-3">
                    <h3 className="text-[14px] font-bold text-white leading-tight drop-shadow">
                      {p.name}
                    </h3>
                    <p className="text-[10px] text-white/80 mt-0.5 drop-shadow">
                      {p.title}
                    </p>
                  </div>

                  {/* Glass buttons */}
                  <div className="w-full flex flex-col gap-1.5 mt-auto">
                    {p.buttons.map((b, i) => {
                      const Icon = b.icon;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.18 + i * 0.07 }}
                          className="w-full py-2 ps-2 pe-3 rounded-2xl flex items-center gap-2 bg-white/15 border border-white/25 backdrop-blur-md shadow-sm hover:bg-white/20 transition-all"
                        >
                          <div className="w-6 h-6 rounded-full bg-white/20 border border-white/25 flex items-center justify-center shrink-0">
                            <Icon className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="text-[11px] font-semibold text-white truncate flex-1 drop-shadow">
                            {b.label}
                          </span>
                          {b.meta && (
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap bg-white/25 text-white">
                              {b.meta}
                            </span>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Social row */}
                  <div className="flex items-center justify-center gap-2 mt-3 mb-2">
                    {p.socials.map((s) => (
                      <SocialDot key={s} kind={s} tone="light" />
                    ))}
                  </div>

                  {/* Powered by */}
                  <div className="text-[8px] font-bold tracking-[0.15em] text-white/70 text-center">
                    {t(
                      `POWERED BY ${brand.name.toUpperCase()}`,
                      `بدعم من ${brand.name.toUpperCase()}`,
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Tab dots */}
        <div className="flex justify-center gap-1.5 mt-4">
          {personas.map((_, i) => (
            <button
              key={i}
              aria-label={`Show persona ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === i
                  ? "w-6 bg-[hsl(var(--sky))]"
                  : "w-1.5 bg-[hsl(var(--navy))]/20 hover:bg-[hsl(var(--navy))]/40"
              }`}
            />
          ))}
        </div>

        {/* Floating badge */}
        <div className="absolute -top-3 -end-3 bg-[hsl(var(--sky))] text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg">
          {t("NEW", "جديد")} ✨
        </div>
      </div>
    </div>
  );
};
