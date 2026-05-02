import { VideoBlockData } from "@/types/bio";

interface Props {
  data: VideoBlockData;
}

const getEmbedUrl = (url: string) => {
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&]+)/);
  if (ytMatch) return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;
  return url;
};

const VideoBlock = ({ data }: Props) => (
  <div className="px-4 py-2">
    <div className="rounded-lg overflow-hidden aspect-video bg-black/10">
      <iframe
        src={getEmbedUrl(data.url)}
        className="w-full h-full"
        allowFullScreen
        loading="lazy"
        title="Video"
      />
    </div>
  </div>
);

export default VideoBlock;
