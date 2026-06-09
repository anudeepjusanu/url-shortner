import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  MessageCircle, Calendar, Briefcase, Instagram, Music, UtensilsCrossed,
  MapPin, Globe, BadgeCheck, Phone, ShoppingBag,
} from "lucide-react";
import avatarKhalid from "@/assets/avatar-khalid.jpg";
import avatarSarah from "@/assets/avatar-sarah-brand.jpg";
import brewLogo from "@/assets/brew-house-logo.png";

type Social = "instagram" | "tiktok" | "whatsapp" | "twitter" | "globe" | "phone";

const SocialDot = ({ kind }: { kind: Social }) => {
  const cls = "w-3.5 h-3.5";
  const Icon =
    kind === "instagram" ? Instagram :
    kind === "tiktok" ? Music :
    kind === "whatsapp" ? MessageCircle :
    kind === "globe" ? Globe :
    kind === "phone" ? Phone : Music;
  return (
    <div className="w-7 h-7 rounded-full bg-white/15 border border-white/25 flex items-center justify-center backdrop-blur-sm">
      <Icon className={`${cls} text-white`} />
    </div>
  );
};

const ROTATE_MS = 4500;

export const BioPreview = () => {
  const { t } = useLanguage();
  const [idx, setIdx] = useState(0);

  const personas = [
    {
      key: "creator",
      tag: t("Creator", "مبدع"),
      avatar: avatarKhalid,
      name: t("Khalid Al-Saud", "خالد آل سعود"),
      title: t("Graphic Designer · Riyadh", "مصمم جرافيك · الرياض"),
      bg: "linear-gradient(160deg, hsl(350 52% 26%) 0%, hsl(350 54% 38%) 55%, hsl(350 60% 50%) 100%)",
      buttons: [
        { icon: Briefcase, label: t("My Portfolio", "معرض أعمالي") },
        { icon: Calendar, label: t("Book Consultation", "حجز استشارة") },
        { icon: MessageCircle, label: t("WhatsApp Me", "تواصل واتساب") },
      ],
      socials: ["instagram", "tiktok", "whatsapp"] as Social[],
    },
    {
      key: "restaurant",
      tag: t("Restaurant", "مطعم"),
      avatar: brewLogo,
      name: t("Brew House", "بيت القهوة"),
      title: t("Specialty Coffee · Al Olaya", "قهوة مختصة · العليا"),
      bg: "linear-gradient(165deg, hsl(28 35% 16%) 0%, hsl(22 42% 26%) 55%, hsl(30 55% 38%) 100%)",
      buttons: [
        { icon: UtensilsCrossed, label: t("View Menu", "تصفح القائمة") },
        { icon: Calendar, label: t("Reserve a Table", "احجز طاولة") },
        { icon: MapPin, label: t("Get Directions", "الموقع على الخريطة") },
      ],
      socials: ["instagram", "whatsapp", "phone"] as Social[],
    },
    {
      key: "business",
      tag: t("Business", "أعمال"),
      avatar: avatarSarah,
      name: t("Nuqta Studio", "ستوديو نقطة"),
      title: t("Branding & Web Design", "هوية بصرية ومواقع"),
      bg: "linear-gradient(170deg, hsl(220 45% 18%) 0%, hsl(215 40% 28%) 55%, hsl(210 50% 40%) 100%)",
      buttons: [
        { icon: Briefcase, label: t("Our Services", "خدماتنا") },
        { icon: MessageCircle, label: t("Contact Sales", "تواصل مع المبيعات") },
        { icon: Globe, label: t("Visit Website", "زيارة الموقع") },
      ],
      socials: ["instagram", "globe", "whatsapp"] as Social[],
    },
  ];

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % personas.length), ROTATE_MS);
    return () => clearInterval(id);
  }, [personas.length]);

  const p = personas[idx];

  return (
    <div className="flex justify-center">
      <div className="relative">
        <div className="w-[260px] rounded-[32px] border-[4px] border-gray-800 bg-gray-800 shadow-elevated overflow-hidden">
          <div className="relative h-[460px] overflow-hidden">
            <div className="absolute inset-x-0 top-0 z-10 h-5 flex justify-center pointer-events-none">
              <div className="w-20 h-3 bg-gray-900 rounded-b-lg" />
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={p.key}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
                className="absolute inset-0 flex flex-col items-center px-5 pt-7"
                style={{ background: p.bg }}
              >
                <span className="px-2.5 py-0.5 rounded-full bg-white/15 border border-white/25 text-[9px] font-bold tracking-wide text-white uppercase mb-3 backdrop-blur-sm">
                  {p.tag}
                </span>

                <div className="relative mb-2">
                  <div className="absolute inset-0 rounded-full blur-md bg-white/30 scale-110" />
                  <img
                    src={p.avatar}
                    alt={p.name}
                    loading="lazy"
                    className="relative w-[68px] h-[68px] rounded-full object-cover ring-2 ring-white/70 shadow-lg"
                  />
                </div>

                <div className="flex items-center gap-1 mb-0.5">
                  <h3 className="text-[13px] font-bold text-white leading-tight">{p.name}</h3>
                  <BadgeCheck className="w-3.5 h-3.5 text-white" fill="hsl(350 54% 50%)" />
                </div>
                <p className="text-[10px] text-white/70 mb-4 text-center">{p.title}</p>

                <div className="w-full flex flex-col gap-2 mb-3">
                  {p.buttons.map((b, i) => {
                    const Icon = b.icon;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + i * 0.07 }}
                        className="w-full py-2 px-3.5 rounded-full flex items-center gap-2 bg-white/15 border border-white/25 backdrop-blur-sm hover:bg-white/20 transition-colors"
                      >
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                          <Icon className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-[11px] font-semibold text-white truncate">{b.label}</span>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 mt-auto mb-4">
                  {p.socials.map((s) => (
                    <SocialDot key={s} kind={s} />
                  ))}
                </div>

                <div className="text-[8px] font-bold tracking-[0.15em] text-white/45 mb-1">
                  {t("POWERED BY SNIP", "بدعم من SNIP")}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex justify-center gap-1.5 mt-4">
          {personas.map((_, i) => (
            <button
              key={i}
              aria-label={`Show persona ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === i ? "w-6 bg-[hsl(var(--sky))]" : "w-1.5 bg-[hsl(var(--navy))]/20 hover:bg-[hsl(var(--navy))]/40"
              }`}
            />
          ))}
        </div>

        <div className="absolute -top-3 -end-3 bg-[hsl(var(--sky))] text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg">
          {t("NEW", "جديد")} ✨
        </div>
      </div>
    </div>
  );
};
