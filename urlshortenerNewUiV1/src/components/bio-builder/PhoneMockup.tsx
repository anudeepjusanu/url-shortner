import { BioBlock, BioTheme, LinkBlockData, SocialBlockData, WhatsAppBlockData } from "@/types/bio";
import { useLanguage } from "@/contexts/LanguageContext";
import BlockRenderer from "./BlockRenderer";
import { getImageStyle } from "./ImageCropControl";
import { allSocialPlatforms } from "./blocks/SocialIconsBlock";
import logoIcon from "@/assets/logo-icon.png";

interface Props {
  blocks: BioBlock[];
  theme: BioTheme;
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
}

const PhoneMockup = ({ blocks, theme, selectedBlockId, onSelectBlock }: Props) => {
  const { lang, t } = useLanguage();

  const isImageBackground = theme.backgroundType === "image" && theme.background.startsWith("url(");
  const imageUrl = isImageBackground
    ? theme.background.replace(/^url\((['"]?)(.*)\1\)$/, "$2")
    : "";

  let bgStyle: React.CSSProperties;
  if (isImageBackground) {
    bgStyle = { backgroundColor: "#000" };
  } else if (
    theme.backgroundType === "gradient" ||
    theme.backgroundType === "mesh" ||
    theme.backgroundType === "pattern" ||
    theme.backgroundType === "noise" ||
    theme.background.includes("gradient")
  ) {
    bgStyle = { background: theme.background };
  } else if (theme.background.startsWith("#") || theme.background.startsWith("rgb") || theme.background.startsWith("hsl")) {
    bgStyle = { backgroundColor: theme.background };
  } else {
    bgStyle = { backgroundColor: "#ffffff" };
  }

  const fontFamily = lang === "ar" ? theme.fontAr : theme.fontEn;

  return (
    <div className="flex justify-center">
      <div className="relative w-[320px]">
        <div className="rounded-[40px] border-[6px] border-gray-800 bg-gray-800 shadow-2xl overflow-hidden">
          <div
            className="relative h-[580px] overflow-hidden"
            style={{
              ...bgStyle,
              fontFamily,
            }}
          >
            {isImageBackground && (
              <img
                src={imageUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0"
                style={getImageStyle({ ...theme.backgroundTransform, fit: "cover" })}
              />
            )}

            <div className="absolute inset-x-0 top-0 z-10 h-7 flex justify-center pointer-events-none">
              <div className="w-32 h-5 bg-gray-900 rounded-b-2xl" />
            </div>

            <div className="relative z-0 h-full overflow-y-auto overflow-x-hidden scrollbar-hide">
              <div className="space-y-1.5 pb-4 pt-7 min-h-full flex flex-col">
                {(() => {
                  const visible = blocks.filter(b => b.visible);
                  const linkLikeTypes = new Set(["link", "social", "whatsapp"]);

                  const socialHref = (platform: string, username?: string, url?: string) => {
                    const social = allSocialPlatforms[platform];
                    if (url) return url;
                    return username && social ? `${social.urlPrefix}${username.replace(/^@/, "")}` : "#";
                  };

                  type Item = { block: BioBlock; sourceId: string };
                  const tagBuckets = new Map<string, Item[]>();
                  const buttonBuckets = new Map<string, Item[]>();
                  const pushTag = (id: string, item: Item) => {
                    const arr = tagBuckets.get(id) || [];
                    arr.push(item);
                    tagBuckets.set(id, arr);
                  };
                  const pushButton = (id: string, item: Item) => {
                    const arr = buttonBuckets.get(id) || [];
                    arr.push(item);
                    buttonBuckets.set(id, arr);
                  };

                  visible.forEach((block) => {
                    if (block.type === "link") {
                      const linkData = block.data as Partial<LinkBlockData>;
                      if (linkData.displayType === "tag") {
                        pushTag(block.id, { block, sourceId: block.id });
                      } else {
                        pushButton(block.id, { block, sourceId: block.id });
                      }
                    }

                    if (block.type === "social") {
                      const socialData = block.data as Partial<SocialBlockData>;
                      const platforms = socialData.platforms || [];
                      const tagPlatforms = platforms.filter(p => (p.displayType || "tag") === "tag");
                      if (tagPlatforms.length) {
                        pushTag(block.id, { block: { ...block, data: { ...block.data, platforms: tagPlatforms } }, sourceId: block.id });
                      }
                      platforms
                        .filter(p => (p.displayType || "tag") === "button")
                        .forEach((p, idx) => {
                          const social = allSocialPlatforms[p.platform];
                          if (!social) return;
                          const useBrand = p.useBrandColors !== false;
                          const brandFg = social.color === "#FFFC00" ? "#000" : "#fff";
                          pushButton(block.id, {
                            sourceId: block.id,
                            block: {
                              id: `${block.id}-${p.platform}-${idx}-button`,
                              type: "link",
                              visible: true,
                              animation: block.animation,
                              data: {
                                title: p.label || social.labelAr,
                                titleEn: p.label || social.label,
                                url: socialHref(p.platform, p.username, p.url),
                                displayType: "button",
                                icon: p.platform,
                                iconImage: p.iconImage,
                                iconColor: p.iconColor,
                                buttonStyle: p.buttonStyle,
                                cornerRadius: p.cornerRadius,
                                shadow: p.shadow,
                                buttonColor: p.buttonColor || (useBrand ? social.color : undefined),
                                buttonTextColor: p.buttonTextColor || (useBrand ? brandFg : undefined),
                                shake: p.shake,
                                useBrandColors: useBrand,
                                brandPlatform: p.platform,
                                iconAlign: p.iconAlign,
                                iconMatchText: p.iconMatchText,
                                direction: p.direction,
                                textColor: p.textColor,
                                fontSize: p.fontSize,
                                fontFamily: p.fontFamily,
                                textAlign: p.textAlign,
                                bold: p.bold,
                                italic: p.italic,
                                underline: p.underline,
                              },
                            },
                          });
                        });
                    }

                    if (block.type === "whatsapp") {
                      const whatsappData = block.data as Partial<WhatsAppBlockData>;
                      const displayType = whatsappData.displayType || "tag";
                      if (displayType === "tag") {
                        pushTag(block.id, { block, sourceId: block.id });
                      } else {
                        const phone = String(whatsappData.phone || "").replace(/\D/g, "");
                        const message = String(whatsappData.message || "");
                        pushButton(block.id, {
                          sourceId: block.id,
                          block: {
                            id: `${block.id}-button`,
                            type: "link",
                            visible: true,
                            animation: block.animation,
                            data: {
                              title: whatsappData.title || "WhatsApp",
                              titleEn: whatsappData.titleEn || "WhatsApp",
                              url: `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
                              displayType: "button",
                            },
                          },
                        });
                      }
                    }
                  });

                  const renderItem = ({ block, sourceId }: { block: BioBlock; sourceId: string }) => (
                    <BlockRenderer
                      key={block.id}
                      block={block}
                      theme={theme}
                      isSelected={selectedBlockId === sourceId}
                      onClick={() => onSelectBlock(sourceId)}
                    />
                  );

                  const nodes: React.ReactNode[] = [];
                  let i = 0;
                  while (i < visible.length) {
                    const block = visible[i];
                    if (linkLikeTypes.has(block.type)) {
                      const runTags: Item[] = [];
                      const runButtons: Item[] = [];
                      let j = i;
                      while (j < visible.length && linkLikeTypes.has(visible[j].type)) {
                        const id = visible[j].id;
                        const tItems = tagBuckets.get(id);
                        if (tItems) runTags.push(...tItems);
                        const bItems = buttonBuckets.get(id);
                        if (bItems) runButtons.push(...bItems);
                        j++;
                      }
                      if (runTags.length) {
                        nodes.push(
                          <div key={`tag-row-${i}`} className="flex items-center justify-center flex-wrap gap-2 px-4">
                            {runTags.map(renderItem)}
                          </div>
                        );
                      }
                      runButtons.forEach((item) => nodes.push(renderItem(item)));
                      i = j;
                      continue;
                    }
                    nodes.push(
                      <BlockRenderer
                        key={block.id}
                        block={block}
                        theme={theme}
                        isSelected={selectedBlockId === block.id}
                        onClick={() => onSelectBlock(block.id)}
                      />
                    );
                    i++;
                  }
                  return nodes;
                })()}
                <div className="mt-auto pt-3 flex items-center justify-center">
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-xs font-semibold transition-all hover:scale-105"
                    style={{ color: theme.textColor }}
                  >
                    <img src={logoIcon} alt="logo" className="w-4 h-4 object-contain" />
                    <span>{t("Create your page", "أنشئ صفحتك")}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-gray-600 rounded-full" />
      </div>
    </div>
  );
};

export default PhoneMockup;
