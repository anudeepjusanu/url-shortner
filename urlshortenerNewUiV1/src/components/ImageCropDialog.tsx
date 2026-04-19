import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  onConfirm: (croppedDataUrl: string) => void;
  aspectRatio?: number;
  title?: string;
}

export const ImageCropDialog = ({
  open,
  onOpenChange,
  file,
  onConfirm,
  aspectRatio = 1,
  title,
}: ImageCropDialogProps) => {
  const { t } = useLanguage();
  const [imageUrl, setImageUrl] = useState<string>("");
  const [zoom, setZoom] = useState(100);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setZoom(100);
      setPosition({ x: 0, y: 0 });
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  }, [position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleConfirm = async () => {
    if (!imageRef.current || !containerRef.current) return;
    
    setIsProcessing(true);
    try {
      const container = containerRef.current;
      const img = imageRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const scale = zoom / 100;
      
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      
      const outputWidth = 800;
      const outputHeight = Math.round(outputWidth / aspectRatio);
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      
      const imgNaturalWidth = img.naturalWidth;
      const imgNaturalHeight = img.naturalHeight;
      
      const displayWidth = containerRect.width * scale;
      const displayHeight = (imgNaturalHeight / imgNaturalWidth) * displayWidth;
      
      const scaleRatio = imgNaturalWidth / displayWidth;
      
      const sourceX = (-position.x) * scaleRatio;
      const sourceY = (-position.y) * scaleRatio;
      const sourceWidth = containerRect.width * scaleRatio;
      const sourceHeight = containerRect.height * scaleRatio;
      
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputWidth,
        outputHeight
      );
      
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      onConfirm(dataUrl);
      onOpenChange(false);
    } catch (error) {
      console.error("Crop failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {title || t("Crop and Position Image", "اقتصاص وضبط موضع الصورة")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div
            ref={containerRef}
            className="relative bg-muted rounded-lg overflow-hidden cursor-move select-none"
            style={{
              width: "100%",
              aspectRatio: aspectRatio,
              maxHeight: "400px",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {imageUrl && (
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Crop preview"
                className="absolute pointer-events-none"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${zoom / 100})`,
                  transformOrigin: "top left",
                  maxWidth: "none",
                  width: "100%",
                }}
                draggable={false}
              />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ZoomOut className="w-4 h-4" />
                <span>{t("Zoom", "التكبير")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium">{zoom}%</span>
                <ZoomIn className="w-4 h-4" />
              </div>
            </div>
            <Slider
              min={100}
              max={300}
              step={5}
              value={[zoom]}
              onValueChange={([v]) => setZoom(v)}
            />
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {t(
              "Drag the image to reposition · Use the slider to zoom in or out",
              "اسحب الصورة لتغيير الموضع · استخدم المنزلق للتكبير أو التصغير"
            )}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isProcessing}>
            {t("Cancel", "إلغاء")}
          </Button>
          <Button onClick={handleConfirm} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {t("Processing…", "جاري المعالجة…")}
              </>
            ) : (
              t("Confirm", "تأكيد")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};