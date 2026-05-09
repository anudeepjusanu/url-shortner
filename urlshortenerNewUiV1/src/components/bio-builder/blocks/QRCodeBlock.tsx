import { QRCodeBlockData } from "@/types/bio";
import { QRCodeSVG } from "qrcode.react";

interface Props {
  data: QRCodeBlockData;
  textColor?: string;
}

const QRCodeBlock = ({ data, textColor }: Props) => (
  <div className="flex flex-col items-center py-4 px-4">
    <div className="w-32 h-32 bg-white rounded-xl p-2 flex items-center justify-center shadow-md">
      <QRCodeSVG
        value={data.url || "https://snip.sa"}
        size={96}
        level="M"
        includeMargin={false}
      />
    </div>
    <p className="text-xs mt-2 opacity-60" style={{ color: textColor }}>
      {data.url || "yourpage/username"}
    </p>
  </div>
);

export default QRCodeBlock;
