import { BioBlock, BioTheme, ProfileBlockData } from "@/types/bio";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  blocks: BioBlock[];
  theme: BioTheme;
}

const BioThumbnail = ({ blocks, theme }: Props) => {
  const { lang } = useLanguage();

  const bgStyle =
    theme.backgroundType === "image"
      ? {
          backgroundImage: theme.background.startsWith("url(")
            ? theme.background
            : `url(${theme.background})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : theme.backgroundType === "gradient" || theme.background.includes("gradient")
      ? { background: theme.background }
      : { backgroundColor: theme.background };

  const profile = blocks.find((b) => b.type === "profile")?.data as
    | ProfileBlockData
    | undefined;
  const links = blocks.filter((b) => b.visible && b.type === "link").slice(0, 3);

  return (
    <div className="shrink-0 w-[60px] h-[96px] rounded-[10px] border-[2px] border-gray-800 bg-gray-800 shadow-md overflow-hidden p-[2px]">
      <div className="relative h-[6px] flex justify-center">
        <div className="w-5 h-[3px] bg-gray-900 rounded-b-md" />
      </div>
      <div
        className="rounded-[6px] overflow-hidden h-[calc(100%-6px)]"
        style={{ ...bgStyle, color: theme.textColor }}
        aria-hidden="true"
      >
        <div className="flex flex-col items-center justify-start h-full px-[3px] py-[3px] gap-[3px]">
          {profile?.avatar && (
            <img
              src={profile.avatar}
              alt=""
              className="w-4 h-4 rounded-full object-cover"
              loading="lazy"
              width={16}
              height={16}
            />
          )}
          <div className="flex flex-col gap-[2px] w-full items-center mt-[2px]">
            {links.map((_, i) => (
              <div
                key={i}
                className="w-full h-[4px] rounded-full"
                style={{ backgroundColor: theme.buttonColor, opacity: 0.9 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BioThumbnail;
