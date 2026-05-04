import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { bioPageAPI } from "@/services/api";
import { Loader2, Link2, Share2, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { BioBlock, BioTheme } from "@/types/bio";
import { bioThemes } from "@/data/bioThemes";
import BlockRenderer from "@/components/bio-builder/BlockRenderer";
import { getImageStyle } from "@/components/bio-builder/ImageCropControl";
import logoIcon from "@/assets/logo-icon.png";

interface PublicPage {
  username: string;
  title: string;
  description: string;
  avatarUrl: string;
  blocks: BioBlock[];
  bioTheme: BioTheme | null;
  totalViews: number;
}

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
    setMeta("property", "og:title", page.title);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:type", "profile");
    if (page.avatarUrl && !page.avatarUrl.startsWith("data:")) {
      setMeta("property", "og:image", page.avatarUrl);
    }
    setMeta("name", "description", desc);
    setMeta("name", "twitter:card", "summary");
    setMeta("name", "twitter:title", page.title);
    setMeta("name", "twitter:description", desc);

    return () => {
      document.title = originalTitle.current;
      injectedMetas.current.forEach((el) => el.remove());
      injectedMetas.current = [];
    };
  }, [page]);
}

const PublicBioPage = () => {
  const { username } = useParams<{ username: string }>();
  const { t } = useLanguage();
  const [page, setPage] = useState<PublicPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    if (!username) return;
    (async () => {
      try {
        const res = await bioPageAPI.getPublic(username) as any;
        setPage(res.data);
        // Track view
        bioPageAPI.trackClick(username, "view").catch(() => {});
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [username]);

  useBioPageSEO(page);

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

  // Resolve the theme: use bioTheme from API, fallback to minimal-light preset
  const theme: BioTheme = page.bioTheme ||
    bioThemes.find((t) => t.id === "minimal-light") ||
    bioThemes[0];

  const isImageBg = theme.backgroundType === "image" && theme.background.startsWith("url(");
  const imageBgUrl = isImageBg
    ? theme.background.replace(/^url\((['"]?)(.*)\1\)$/, "$2")
    : "";

  const bgStyle: React.CSSProperties = isImageBg
    ? { backgroundColor: "#000" }
    : theme.backgroundType === "gradient" ||
      theme.backgroundType === "mesh" ||
      theme.backgroundType === "pattern" ||
      theme.backgroundType === "noise" ||
      theme.background.includes("gradient")
    ? { background: theme.background }
    : theme.background.startsWith("#") || theme.background.startsWith("rgb") || theme.background.startsWith("hsl")
    ? { backgroundColor: theme.background }
    : { backgroundColor: "#ffffff" };

  const hasWhatsApp = page.blocks.some(
    (b) => b.type === "whatsapp" && b.visible !== false
  );
  const whatsAppBlock = page.blocks.find(
    (b) => b.type === "whatsapp" && b.visible !== false
  );

  const handleLinkClick = (blockId: string) => {
    bioPageAPI.trackClick(username!, blockId).catch(() => {});
  };

  const visibleBlocks = page.blocks.filter((b) => b.visible !== false);

  return (
    <div
      className="min-h-screen w-full relative"
      style={{ ...bgStyle, fontFamily: theme.fontEn }}
    >
      {isImageBg && (
        <img
          src={imageBgUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full"
          style={getImageStyle({ ...theme.backgroundTransform, fit: "cover" })}
        />
      )}
      <div className="relative z-10 w-full max-w-[480px] mx-auto px-4 py-8 flex flex-col min-h-screen">
        {/* Blocks */}
        <div className="space-y-2 flex-1">
          {visibleBlocks.map((block, i) => (
            <motion.div
              key={block.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.35, ease: "easeOut" }}
              onClick={() => handleLinkClick(block.id)}
            >
              <BlockRenderer block={block} theme={theme} />
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 flex flex-col items-center gap-3 shrink-0">
          <button
            onClick={() => setShowShare(true)}
            className="flex items-center gap-1.5 text-xs opacity-50 hover:opacity-80 transition-opacity"
            style={{ color: theme.textColor }}
          >
            <Share2 className="w-3.5 h-3.5" />
            {t("Share", "مشاركة")}
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-sm font-semibold transition-all hover:scale-105 shadow-sm"
            style={{ color: theme.textColor }}
          >
            <img src={logoIcon} alt="logo" className="w-5 h-5 object-contain" />
            {t("Create your page", "أنشئ صفحتك")}
          </Link>
        </div>
      </div>

      {/* Floating WhatsApp */}
      {hasWhatsApp && whatsAppBlock && (
        <a
          href={`https://wa.me/${(whatsAppBlock.data?.phone || "").replace(/\D/g, "")}${whatsAppBlock.data?.message ? `?text=${encodeURIComponent(whatsAppBlock.data.message)}` : ""}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 end-6 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50"
          aria-label="WhatsApp"
          onClick={() => handleLinkClick(whatsAppBlock.id)}
        >
          <MessageCircle className="w-7 h-7 text-white" />
        </a>
      )}

      {/* Share modal */}
      {showShare && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
          onClick={() => setShowShare(false)}
        >
          <div
            className="w-full max-w-[480px] rounded-t-2xl p-6"
            style={{ backgroundColor: isImageBg || theme.backgroundType === "gradient" ? "#fff" : theme.background }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-foreground mb-4">
              {t("Share this page", "شارك هذه الصفحة")}
            </h3>
            <div className="flex gap-3 justify-center mb-4">
              {[
                { label: "WhatsApp", action: () => window.open(`https://wa.me/?text=${encodeURIComponent(window.location.href)}`, "_blank") },
                { label: "Twitter", action: () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`, "_blank") },
                {
                  label: t("Copy Link", "نسخ الرابط"),
                  action: () => {
                    navigator.clipboard.writeText(window.location.href).catch(() => {});
                    setShowShare(false);
                  }
                },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="px-4 py-2 rounded-lg bg-muted text-sm text-foreground hover:bg-muted/80 transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowShare(false)}
              className="w-full py-2.5 text-sm text-muted-foreground"
            >
              {t("Close", "إغلاق")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicBioPage;
