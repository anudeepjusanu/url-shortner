import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { bioPageAPI } from "@/services/api";
import { Loader2, Link2, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

// ─── Types ─────────────────────────────────────────────────────────────────

interface BioTheme {
  backgroundColor: string;
  backgroundGradient: string;
  backgroundImage?: string;
  backgroundImageOpacity?: number;
  buttonColor: string;
  buttonTextColor: string;
  buttonStyle: "pill" | "rounded" | "square";
  buttonVariant?: "solid" | "outline" | "ghost";
  textColor: string;
  secondaryTextColor: string;
  fontFamily: string;
}

interface BioLink {
  _id: string;
  title: string;
  url: string;
  icon: string;
  isFeatured?: boolean;
}

interface BioSocialLinks {
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  linkedin?: string;
  github?: string;
  facebook?: string;
  website?: string;
}

interface PublicPage {
  username: string;
  title: string;
  description: string;
  avatarUrl: string;
  theme: BioTheme;
  links: BioLink[];
  socialLinks: BioSocialLinks;
  socialLinkImages?: Record<string, string>;
}

// ─── Social platform map ────────────────────────────────────────────────────

const SOCIAL_CONFIG: Record<string, { label: string }> = {
  instagram: { label: "Instagram" },
  twitter:   { label: "Twitter / X" },
  youtube:   { label: "YouTube"   },
  linkedin:  { label: "LinkedIn"  },
  github:    { label: "GitHub"    },
  tiktok:    { label: "TikTok"    },
  facebook:  { label: "Facebook"  },
  website:   { label: "Website"   },
};

const SOCIAL_DOMAINS: Record<string, string> = {
  instagram: "instagram.com",
  twitter:   "twitter.com",
  youtube:   "youtube.com",
  linkedin:  "linkedin.com",
  github:    "github.com",
  tiktok:    "tiktok.com",
  facebook:  "facebook.com",
};

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

// Small component that renders a platform favicon with a Link2 fallback
const PlatformFavicon = ({ domain, label, color }: { domain: string; label: string; color: string }) => {
  const [err, setErr] = useState(false);
  if (!domain || err) return <Link2 className="w-5 h-5" style={{ color }} />;
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      alt={label}
      className="w-5 h-5 object-contain"
      onError={() => setErr(true)}
    />
  );
};

// ─── Animation variants ─────────────────────────────────────────────────────

const avatarVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  show:   { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] } },
};

const titleVariants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut", delay: 0.15 } },
};

const staggerContainer = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07, delayChildren: 0.28 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const socialStagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.06, delayChildren: 0.35 } },
};

const socialItem = {
  hidden: { opacity: 0, scale: 0.6 },
  show:   { opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] } },
};

// ─── SEO helper ─────────────────────────────────────────────────────────────

function useBioPageSEO(page: PublicPage | null) {
  const originalTitle = useRef(document.title);
  const injectedMetas = useRef<HTMLMetaElement[]>([]);

  useEffect(() => {
    if (!page) return;

    const setMeta = (attr: "property" | "name", key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      const created = !el;
      if (created) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
        injectedMetas.current.push(el);
      }
      el!.setAttribute("content", content);
    };

    const desc = page.description || `${page.title}'s link-in-bio page`;

    document.title = `${page.title} — Bio Page`;

    setMeta("property", "og:title",       page.title);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:type",        "profile");
    if (page.avatarUrl && !page.avatarUrl.startsWith("data:")) {
      setMeta("property", "og:image", page.avatarUrl);
    }
    setMeta("name", "description",        desc);
    setMeta("name", "twitter:card",       "summary");
    setMeta("name", "twitter:title",      page.title);
    setMeta("name", "twitter:description", desc);
    if (page.avatarUrl && !page.avatarUrl.startsWith("data:")) {
      setMeta("name", "twitter:image", page.avatarUrl);
    }

    return () => {
      document.title = originalTitle.current;
      // Remove metas we created; restore ones we overwrote to site defaults
      injectedMetas.current.forEach((el) => el.remove());
      injectedMetas.current = [];
      const restore = [
        ["property", "og:title",       "4r.sa — Smart URL Shortener for Saudi Arabia"],
        ["property", "og:description", "Shorten links, generate QR codes, and track real-time analytics."],
        ["name",     "description",    "The smartest URL shortener built for Saudi marketers and developers."],
      ] as const;
      restore.forEach(([attr, key, val]) => {
        const el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
        if (el) el.setAttribute("content", val);
      });
    };
  }, [page]);
}

// ─── Component ──────────────────────────────────────────────────────────────

const PublicBioPage = () => {
  const { username } = useParams<{ username: string }>();
  const { t } = useLanguage();

  const [page, setPage]       = useState<PublicPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound]   = useState(false);

  useEffect(() => {
    if (!username) return;
    (async () => {
      try {
        const res = await bioPageAPI.getPublic(username) as any;
        setPage(res.data);
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [username]);

  useBioPageSEO(page);

  const handleLinkClick = async (link: BioLink, e: React.MouseEvent) => {
    e.preventDefault();
    bioPageAPI.trackClick(username!, link._id).catch(() => {});
    window.open(link.url, "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
          <Link2 className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          {t("Page Not Found", "الصفحة غير موجودة")}
        </h1>
        <p className="text-muted-foreground max-w-sm">
          {t(
            `The bio page "@${username}" does not exist or has been unpublished.`,
            `صفحة البايو "@${username}" غير موجودة أو تم إلغاء نشرها.`
          )}
        </p>
        <Link
          to="/"
          className="mt-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {t("Go Home", "العودة للرئيسية")}
        </Link>
      </div>
    );
  }

  const { theme, links, socialLinks } = page;

  const bgStyle: React.CSSProperties = theme.backgroundGradient
    ? { background: theme.backgroundGradient }
    : { backgroundColor: theme.backgroundColor };

  const btnRadius =
    theme.buttonStyle === "pill"
      ? "9999px"
      : theme.buttonStyle === "rounded"
      ? "14px"
      : "6px";

  const variant = theme.buttonVariant ?? "solid";
  const getBtnStyle = (featured = false): React.CSSProperties => {
    const base: React.CSSProperties = {
      borderRadius: btnRadius,
      fontFamily: theme.fontFamily,
      transition: "opacity 0.15s, transform 0.15s",
    };
    if (variant === "outline") {
      return {
        ...base,
        backgroundColor: "transparent",
        color: theme.buttonColor,
        border: `2px solid ${theme.buttonColor}`,
        boxShadow: featured ? `0 4px 20px ${theme.buttonColor}33` : undefined,
      };
    }
    if (variant === "ghost") {
      return {
        ...base,
        backgroundColor: "transparent",
        color: theme.buttonColor,
        textDecoration: "underline",
        textUnderlineOffset: "3px",
      };
    }
    // solid (default)
    return {
      ...base,
      backgroundColor: theme.buttonColor,
      color: theme.buttonTextColor,
      boxShadow: featured ? `0 4px 20px ${theme.buttonColor}55` : undefined,
    };
  };

  const activeSocials = Object.entries(socialLinks ?? {}).filter(([, v]) => !!v);
  const socialLinkImages = page.socialLinkImages ?? {};

  return (
    <div className="min-h-screen w-full relative" style={bgStyle}>
      {/* Optional background image overlay */}
      {theme.backgroundImage && (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none"
          style={{
            backgroundImage: `url(${theme.backgroundImage})`,
            opacity: theme.backgroundImageOpacity ?? 0.4,
          }}
        />
      )}
      <div className="relative z-10 max-w-sm mx-auto px-4 py-12 flex flex-col items-center gap-5">

        {/* Avatar */}
        <motion.div
          variants={avatarVariants}
          initial="hidden"
          animate="show"
          className="flex-shrink-0"
        >
          {page.avatarUrl ? (
            <img
              src={page.avatarUrl}
              alt={page.title}
              className="w-24 h-24 rounded-full object-cover shadow-md ring-4 ring-white/20"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const sibling = target.nextElementSibling as HTMLElement | null;
                if (sibling) sibling.style.display = "flex";
              }}
            />
          ) : null}
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold shadow-md ring-4 ring-white/20"
            style={{
              backgroundColor: theme.buttonColor,
              color: theme.buttonTextColor,
              display: page.avatarUrl ? "none" : "flex",
            }}
          >
            {page.title.slice(0, 2).toUpperCase()}
          </div>
        </motion.div>

        {/* Title + bio */}
        <motion.div
          variants={titleVariants}
          initial="hidden"
          animate="show"
          className="text-center space-y-1.5"
        >
          <h1
            className="text-2xl font-bold leading-tight"
            style={{ color: theme.textColor, fontFamily: theme.fontFamily }}
          >
            {page.title}
          </h1>
          {page.description && (
            <p
              className="text-sm leading-relaxed opacity-80"
              style={{ color: theme.textColor, fontFamily: theme.fontFamily }}
            >
              {page.description}
            </p>
          )}
        </motion.div>

        {/* Social icons */}
        {activeSocials.length > 0 && (
          <motion.div
            variants={socialStagger}
            initial="hidden"
            animate="show"
            className="flex items-center gap-3 flex-wrap justify-center"
          >
            {activeSocials.map(([key, url]) => {
              const cfg = SOCIAL_CONFIG[key];
              const label = cfg?.label ?? key;
              const customImg = socialLinkImages[key];
              const domain = SOCIAL_DOMAINS[key] || extractDomain(url as string);
              return (
                <motion.a
                  key={key}
                  variants={socialItem}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.92 }}
                  href={url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
                  style={{
                    backgroundColor: theme.buttonColor + "20",
                    border: `1.5px solid ${theme.buttonColor}40`,
                  }}
                >
                  {customImg ? (
                    <img src={customImg} alt={label} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <PlatformFavicon domain={domain} label={label} color={theme.buttonColor} />
                  )}
                </motion.a>
              );
            })}
          </motion.div>
        )}

        {/* Links */}
        {links.length > 0 && (
          <motion.div
            className="w-full space-y-3 mt-1"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            {[...links].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0)).map((link) => (
              <motion.a
                key={link._id}
                variants={staggerItem}
                whileHover={{ scale: 1.02, opacity: 0.93 }}
                whileTap={{ scale: 0.97 }}
                href={link.url}
                onClick={(e) => handleLinkClick(link, e)}
                className="flex items-center justify-center gap-2 w-full font-medium relative"
                style={{
                  ...getBtnStyle(link.isFeatured),
                  padding: link.isFeatured ? "16px 24px" : "14px 24px",
                  fontSize: link.isFeatured ? "1rem" : "0.875rem",
                }}
              >
                {link.isFeatured && (
                  <span className="absolute top-1.5 end-2.5 text-[10px] font-semibold opacity-70 tracking-wide uppercase">
                    ★
                  </span>
                )}
                {link.icon && <span className={link.isFeatured ? "text-lg" : "text-base"}>{link.icon}</span>}
                <span>{link.title}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60 ms-auto" />
              </motion.a>
            ))}
          </motion.div>
        )}

        {links.length === 0 && (
          <p
            className="text-sm opacity-50 text-center py-6"
            style={{ color: theme.textColor }}
          >
            {t("No links added yet.", "لم تتم إضافة روابط بعد.")}
          </p>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.9, duration: 0.4 }}
          className="mt-8 flex items-center gap-1.5"
        >
          <div className="text-xs" style={{ color: theme.textColor }}>
            {t("Powered by", "مدعوم من")}
          </div>
          <Link
            to="/"
            className="text-xs font-semibold hover:opacity-80 transition-opacity"
            style={{ color: theme.textColor }}
          >
            FORSA
          </Link>
        </motion.div>

      </div>
    </div>
  );
};

export default PublicBioPage;