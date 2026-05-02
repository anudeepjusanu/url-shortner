import { MapBlockData } from "@/types/bio";

interface Props {
  data: MapBlockData;
}

const MapBlock = ({ data }: Props) => (
  <div className="px-4 py-2">
    <div className="rounded-lg overflow-hidden aspect-video">
      <iframe
        src={`https://maps.google.com/maps?q=${data.lat},${data.lng}&z=15&output=embed`}
        className="w-full h-full border-0"
        loading="lazy"
        title={data.label}
        allowFullScreen
      />
    </div>
  </div>
);

export default MapBlock;
