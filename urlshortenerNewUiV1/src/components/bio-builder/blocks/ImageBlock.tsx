import { ImageBlockData } from "@/types/bio";
import { getImageStyle } from "../ImageCropControl";

interface Props {
  data: ImageBlockData;
}

const ImageBlock = ({ data }: Props) => (
  <div className="px-4 py-2">
    <div className="w-full rounded-lg overflow-hidden bg-black/5" style={{ aspectRatio: "16/9" }}>
      <img src={data.src} alt={data.alt} loading="lazy" style={getImageStyle(data.transform)} />
    </div>
  </div>
);

export default ImageBlock;
