import { useLanguage } from "@/contexts/LanguageContext";
import { ProfileBlockData } from "@/types/bio";
import { getImageStyle } from "../ImageCropControl";

interface Props {
  data: ProfileBlockData;
  textColor?: string;
  fontScale?: number;
}

const ProfileBlock = ({ data, textColor, fontScale = 1 }: Props) => {
  const { lang } = useLanguage();
  const name = lang === "ar" ? data.name : data.nameEn;
  const bio = lang === "ar" ? data.bio : data.bioEn;

  return (
    <div className="flex flex-col items-center text-center px-4 py-6">
      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/30 shadow-lg mb-4">
        <img src={data.avatar} alt={name} style={getImageStyle(data.avatarTransform)} />
      </div>
      <h1 className="font-bold mb-2" style={{ color: textColor, fontSize: 20 * fontScale }}>
        {name}
      </h1>
      <p className="opacity-80 max-w-[280px]" style={{ color: textColor, fontSize: 14 * fontScale }}>
        {bio}
      </p>
    </div>
  );
};

export default ProfileBlock;
