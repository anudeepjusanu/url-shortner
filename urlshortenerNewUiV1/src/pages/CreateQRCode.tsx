import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, QrCode, Palette, Maximize, Download } from "lucide-react";

const CreateQRCode = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [url, setUrl] = useState(searchParams.get("url") || "");
  const [label, setLabel] = useState("");
  const [size, setSize] = useState("512");
  const [format, setFormat] = useState("png");
  const [fgColor, setFgColor] = useState("#1a2744");
  const [bgColor, setBgColor] = useState("#ffffff");
  const handleCreate = () => {
    navigate("/dashboard/qr-codes");
  };

  return (
    <DashboardLayout>
      <Button
        variant="outline"
        className="mb-6"
        onClick={() => navigate("/dashboard/qr-codes")}
      >
        <ArrowLeft className="w-4 h-4 me-2" />
        {t("Back to QR Codes", "العودة لأكواد QR")}
      </Button>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        {/* Form */}
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground mb-2">
            {t("Create QR Code", "إنشاء كود QR")}
          </h1>
          <p className="text-muted-foreground font-body text-sm mb-8">
            {t(
              "Generate a QR code for any URL or short link",
              "أنشئ كود QR لأي رابط أو رابط مختصر"
            )}
          </p>

          <div className="space-y-6">
            {/* URL */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-foreground">
                <QrCode className="w-3.5 h-3.5" />
                {t("Destination URL", "رابط الوجهة")} *
              </Label>
              <Input
                placeholder="https://example.com/your-page"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="h-12"
              />
              <p className="text-xs text-muted-foreground font-body">
                {t(
                  "Enter the URL or short link you want to encode",
                  "أدخل الرابط اللي تبي تحوله لكود QR"
                )}
              </p>
            </div>

            {/* Label */}
            <div className="space-y-2">
              <Label className="text-foreground">
                {t("Label (Optional)", "الاسم (اختياري)")}
              </Label>
              <Input
                placeholder={t("e.g. Store promotion", "مثال: عرض المتجر")}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="h-12"
              />
            </div>

            {/* Size & Format */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-foreground">
                  <Maximize className="w-3.5 h-3.5" />
                  {t("Size (px)", "الحجم (بكسل)")}
                </Label>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="256">256 × 256</SelectItem>
                    <SelectItem value="512">512 × 512</SelectItem>
                    <SelectItem value="1024">1024 × 1024</SelectItem>
                    <SelectItem value="2048">2048 × 2048</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-foreground">
                  <Download className="w-3.5 h-3.5" />
                  {t("Format", "الصيغة")}
                </Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="svg">SVG</SelectItem>
                    <SelectItem value="jpg">JPG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Colors */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-foreground">
                  <Palette className="w-3.5 h-3.5" />
                  {t("Foreground Color", "لون الكود")}
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-12 h-12 rounded-lg border border-border cursor-pointer"
                  />
                  <Input
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="h-12 font-mono"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-foreground">
                  <Palette className="w-3.5 h-3.5" />
                  {t("Background Color", "لون الخلفية")}
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-12 h-12 rounded-lg border border-border cursor-pointer"
                  />
                  <Input
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-12 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleCreate}
                className="flex-1 h-12 text-base bg-primary text-primary-foreground"
                disabled={!url.trim()}
              >
                <QrCode className="w-4 h-4 me-2" />
                {t("Create QR Code", "إنشاء كود QR")}
              </Button>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-background border border-border rounded-xl p-6 h-fit sticky top-24">
          <h3 className="font-display font-semibold text-foreground text-sm mb-4">
            {t("Preview", "معاينة")}
          </h3>
          <div
            className="w-full aspect-square rounded-lg flex items-center justify-center border border-border mb-4"
            style={{ backgroundColor: bgColor }}
          >
            {url.trim() ? (
              <div className="text-center">
                <QrCode className="w-32 h-32 mx-auto" style={{ color: fgColor }} />
                <p className="text-xs text-muted-foreground font-body mt-3">
                  {size} × {size} • {format.toUpperCase()}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <QrCode className="w-16 h-16 mx-auto text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground font-body mt-3">
                  {t("Enter a URL to preview", "أدخل رابط للمعاينة")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateQRCode;
