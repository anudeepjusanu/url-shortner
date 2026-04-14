import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { bioPageAPI } from "@/services/api";
import { Loader2, Instagram, Twitter, Linkedin, Github, Youtube, Globe, Link2, ExternalLink } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

interface BioTheme {
  backgroundColor: string;
  backgroundGradient: string;
  buttonColor: string;
  buttonTextColor: string;
  buttonStyle: "pill" | "rounded" | "square";
  textColor: string;
  secondaryTextColor: string;
  fontFamily: string;
}

interface BioLink {
  _id: string;
  title: string;
  url: string;
  icon: string;
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
}

// ─── Social icon map ────────────────────────────────────────────────────────

const SOCIAL_CONFIG: Record<string, { Icon: any; label: string }> = {
  instagram: { Icon: Instagram, label: "Instagram" },
  twitter: { Icon: Twitter, label: "Twitter" },
  youtube: { Icon: Youtube, label: "YouTube" },
  linkedin: { Icon: Linkedin, label: "LinkedIn" },
  github: { Icon: Github, label: "GitHub" },
  tiktok: { Icon: Link2, label: "TikTok" },
  facebook: { Icon: Link2, label: "Facebook" },
  website: { Icon: Globe, label: "Website" },
};

// ─── Component ──────────────────────────────────────────────────────────────

const PublicBioPage = () => {
  const { username } = useParams<{ username: string }>();
  const { t } = useLanguage();

  const [page, setPage] = useState<PublicPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

  const handleLinkClick = async (link: BioLink, e: React.MouseEvent) => {
    e.preventDefault();
    // Fire-and-forget click tracking
    bioPageAPI.trackClick(username!, link._id).catch(() => {});
    // Open in new tab
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

  const activeSocials = Object.entries(socialLinks).filter(([, v]) => !!v);

  return (
    <div className="min-h-screen w-full" style={bgStyle}>
      <div className="max-w-sm mx-auto px-4 py-12 flex flex-col items-center gap-5">
        {/* Avatar */}
        {page.avatarUrl ? (
          <img
            src={page.avatarUrl}
            alt={page.title}
            className="w-24 h-24 rounded-full object-cover shadow-md ring-4 ring-white/20 flex-shrink-0"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              const sibling = target.nextElementSibling as HTMLElement | null;
              if (sibling) sibling.style.display = "flex";
            }}
          />
        ) : null}
        {/* Fallback initials avatar (shown if avatarUrl fails or is empty) */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold shadow-md ring-4 ring-white/20 flex-shrink-0"
          style={{
            backgroundColor: theme.buttonColor,
            color: theme.buttonTextColor,
            display: page.avatarUrl ? "none" : "flex",
          }}
        >
          {page.title.slice(0, 2).toUpperCase()}
        </div>

        {/* Title */}
        <div className="text-center space-y-1.5">
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
        </div>

        {/* Social icons */}
        {activeSocials.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap justify-center">
            {activeSocials.map(([key, url]) => {
              const cfg = SOCIAL_CONFIG[key];
              if (!cfg) return null;
              const { Icon, label } = cfg;
              return (
                <a
                  key={key}
                  href={url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{
                    backgroundColor: theme.buttonColor + "20",
                    color: theme.buttonColor,
                    border: `1.5px solid ${theme.buttonColor}40`,
                  }}
                >
                  <Icon className="w-4.5 h-4.5" />
                </a>
              );
            })}
          </div>
        )}

        {/* Links */}
        {links.length > 0 && (
          <div className="w-full space-y-3 mt-1">
            {links.map((link) => (
              <a
                key={link._id}
                href={link.url}
                onClick={(e) => handleLinkClick(link, e)}
                className="flex items-center justify-center gap-2 w-full py-3.5 px-6 font-medium text-sm shadow-sm hover:opacity-90 active:scale-[0.98] transition-all duration-150"
                style={{
                  backgroundColor: theme.buttonColor,
                  color: theme.buttonTextColor,
                  borderRadius: btnRadius,
                  fontFamily: theme.fontFamily,
                }}
              >
                {link.icon && <span className="text-base">{link.icon}</span>}
                <span>{link.title}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60 ms-auto" />
              </a>
            ))}
          </div>
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
        <div className="mt-8 flex items-center gap-1.5 opacity-50">
          <div
            className="text-xs"
            style={{ color: theme.textColor }}
          >
            {t("Powered by", "مدعوم من")}
          </div>
          <Link
            to="/"
            className="text-xs font-semibold hover:opacity-80 transition-opacity"
            style={{ color: theme.textColor }}
          >
            FORSA
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PublicBioPage;
