import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Image as ImageIcon, Upload, RotateCcw, Maximize2, Minimize2, Pencil, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ImageTransform {
  scale?: number;
  posX?: number;
  posY?: number;
  fit?: "cover" | "contain";
}

interface Props {
  value: string;
  transform?: ImageTransform;
  onChange: (value: string) => void;
  onTransformChange: (t: ImageTransform) => void;
  onCommit?: (value: string, transform: ImageTransform) => void;
  shape?: "rect" | "circle";
  label?: string;
  aspect?: string;
  showUrlInput?: boolean;
}

const defaults: Required<ImageTransform> = { scale: 1, posX: 0, posY: 0, fit: "cover" };
const editorDefaults: Required<ImageTransform> = { scale: 1, posX: 0, posY: 0, fit: "contain" };

export const getImageStyle = (t?: ImageTransform): React.CSSProperties => {
  const m = { ...defaults, ...(t || {}) };
  return {
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: m.fit,
    objectPosition: `${50 + m.posX}% ${50 + m.posY}%`,
    transform: m.scale !== 1 ? `scale(${m.scale})` : undefined,
    transformOrigin: "center",
  };
};

export const getBackgroundStyle = (url: string, t?: ImageTransform): React.CSSProperties => {
  const m = { ...defaults, ...(t || {}) };
  const clean = url.replace(/^url\((['"]?)(.*)\1\)$/, "$2");
  const baseSize = m.fit === "contain" ? "contain" : "cover";
  const sized = m.scale === 1 ? baseSize : `${m.scale * 100}%`;
  return {
    backgroundImage: `url(${clean})`,
    backgroundSize: sized,
    backgroundRepeat: "no-repeat",
    backgroundPosition: `${50 + m.posX}% ${50 + m.posY}%`,
  };
};

const ImageCropControl = ({
  value,
  transform,
  onChange,
  onTransformChange,
  onCommit,
  shape = "rect",
  label,
  aspect = "16/9",
  showUrlInput = true,
}: Props) => {
  const { t } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);
  const merged = { ...defaults, ...(transform || {}) };

  const [pendingSrc, setPendingSrc] = useState<string | null>(null);
  const [pendingTransform, setPendingTransform] = useState<Required<ImageTransform>>(defaults);
  const [urlDraft, setUrlDraft] = useState("");

  const openEditor = (src: string, baseTransform?: ImageTransform) => {
    setPendingSrc(src);
    setPendingTransform(
      baseTransform ? { ...defaults, ...baseTransform } : { ...editorDefaults }
    );
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => openEditor(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleUrlAdd = () => {
    const url = urlDraft.trim();
    if (!url) return;
    openEditor(url);
    setUrlDraft("");
  };

  const handleEditExisting = () => {
    if (!value) return;
    openEditor(value, transform);
  };

  const handleRemove = () => {
    if (onCommit) {
      onCommit("", {});
    } else {
      onChange("");
      onTransformChange({});
    }
  };

  const updatePending = (patch: Partial<ImageTransform>) =>
    setPendingTransform((p) => ({ ...p, ...patch }));

  const handleConfirm = () => {
    if (!pendingSrc) return;
    if (onCommit) {
      onCommit(pendingSrc, pendingTransform);
    } else {
      onChange(pendingSrc);
      onTransformChange(pendingTransform);
    }
    setPendingSrc(null);
  };

  const handleCancel = () => setPendingSrc(null);

  return (
    <div className="space-y-2.5">
      {label && (
        <label className="text-[11px] font-medium text-muted-foreground">{label}</label>
      )}

      {value ? (
        <div className="space-y-2">
          <div
            className={cn(
              "relative bg-muted overflow-hidden border border-border mx-auto",
              shape === "circle" ? "rounded-full w-24 h-24" : "rounded-lg w-full"
            )}
            style={shape === "rect" ? { aspectRatio: aspect } : undefined}
          >
            <img src={value} alt="" style={getImageStyle(merged)} />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 flex-1 text-xs gap-1.5"
              onClick={handleEditExisting}
            >
              <Pencil className="w-3.5 h-3.5" />
              {t("Adjust", "تعديل")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 text-xs gap-1.5"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-3.5 h-3.5" />
              {t("Replace", "استبدال")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
              onClick={handleRemove}
              aria-label={t("Remove image", "إزالة الصورة")}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div
            className={cn(
              "flex items-center justify-center bg-muted border border-dashed border-border text-muted-foreground",
              shape === "circle" ? "rounded-full w-24 h-24 mx-auto" : "rounded-lg w-full h-24"
            )}
          >
            <ImageIcon className="w-6 h-6 opacity-40" />
          </div>
          <div className="flex gap-2">
            {showUrlInput && (
              <Input
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleUrlAdd();
                  }
                }}
                className="h-8 text-sm flex-1"
                placeholder="https://"
              />
            )}
            {showUrlInput && urlDraft.trim() && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 shrink-0 text-xs"
                onClick={handleUrlAdd}
              >
                {t("Use", "استخدم")}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn("h-8 shrink-0 text-xs gap-1.5", !showUrlInput && "flex-1")}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-3.5 h-3.5" />
              {t("Upload", "رفع")}
            </Button>
          </div>
        </>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      <CropDialog
        open={!!pendingSrc}
        src={pendingSrc}
        transform={pendingTransform}
        shape={shape}
        aspect={aspect}
        onUpdate={updatePending}
        onReset={() => setPendingTransform(editorDefaults)}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  );
};

const CropDialog = ({
  open, src, transform, shape, aspect,
  onUpdate, onReset, onConfirm, onCancel,
}: {
  open: boolean;
  src: string | null;
  transform: Required<ImageTransform>;
  shape: "rect" | "circle";
  aspect: string;
  onUpdate: (patch: Partial<ImageTransform>) => void;
  onReset: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  const { t } = useLanguage();

  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);

  useEffect(() => {
    if (!open) setDragging(false);
  }, [open]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStart.current = { x: e.clientX, y: e.clientY, posX: transform.posX, posY: transform.posY };
    setDragging(true);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const nx = Math.max(-50, Math.min(50, dragStart.current.posX - dx * 0.25));
    const ny = Math.max(-50, Math.min(50, dragStart.current.posY - dy * 0.25));
    onUpdate({ posX: Math.round(nx), posY: Math.round(ny) });
  };
  const onPointerUp = () => {
    setDragging(false);
    dragStart.current = null;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("Adjust image", "اضبط الصورة")}</DialogTitle>
        </DialogHeader>

        {src && (
          <div className="space-y-4">
            <div
              className={cn(
                "relative overflow-hidden border border-border mx-auto select-none",
                shape === "circle" ? "rounded-full w-56 h-56" : "rounded-lg w-full",
                dragging ? "cursor-grabbing" : "cursor-grab"
              )}
              style={{
                ...(shape === "rect" ? { aspectRatio: aspect } : {}),
                backgroundImage:
                  "linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%), " +
                  "linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%), " +
                  "linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%), " +
                  "linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)",
                backgroundSize: "16px 16px",
                backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
                backgroundColor: "hsl(var(--background))",
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <img
                src={src}
                alt=""
                draggable={false}
                style={getImageStyle(transform)}
              />
            </div>
            <p className="text-[11px] text-center text-muted-foreground">
              {t(
                "Full image shown. Drag, zoom, or switch to Fill to crop.",
                "الصورة كاملة. اسحب أو كبّر أو اختر تعبئة للاقتصاص."
              )}
            </p>

            <div className="space-y-3 p-3 rounded-lg bg-muted/40 border border-border/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  {t("Crop & Position", "اقتصاص وموضع")}
                </span>
                <button
                  type="button"
                  onClick={onReset}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="w-3 h-3" />
                  {t("Reset", "إعادة")}
                </button>
              </div>

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => onUpdate({ fit: "cover" })}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[11px] font-medium border transition-colors",
                    transform.fit === "cover"
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Maximize2 className="w-3 h-3" />
                  {t("Fill", "تعبئة")}
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate({ fit: "contain" })}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[11px] font-medium border transition-colors",
                    transform.fit === "contain"
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Minimize2 className="w-3 h-3" />
                  {t("Fit", "احتواء")}
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>{t("Zoom", "تكبير")}</span>
                  <span>{transform.scale.toFixed(2)}x</span>
                </div>
                <Slider
                  min={0.5} max={3} step={0.05}
                  value={[transform.scale]}
                  onValueChange={([v]) => onUpdate({ scale: v })}
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>{t("Horizontal", "أفقي")}</span>
                  <span>{transform.posX > 0 ? `+${transform.posX}` : transform.posX}</span>
                </div>
                <Slider
                  min={-50} max={50} step={1}
                  value={[transform.posX]}
                  onValueChange={([v]) => onUpdate({ posX: v })}
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>{t("Vertical", "عمودي")}</span>
                  <span>{transform.posY > 0 ? `+${transform.posY}` : transform.posY}</span>
                </div>
                <Slider
                  min={-50} max={50} step={1}
                  value={[transform.posY]}
                  onValueChange={([v]) => onUpdate({ posY: v })}
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2 sticky bottom-0 bg-background pt-3 -mx-6 px-6 -mb-6 pb-6 border-t border-border">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("Cancel", "إلغاء")}
          </Button>
          <Button type="button" onClick={onConfirm} className="font-semibold">
            {t("Save image", "حفظ الصورة")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropControl;
