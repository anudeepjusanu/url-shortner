import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, Loader2, RotateCcw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface CropBox { x: number; y: number; w: number; h: number; }
type Handle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "move" | "pan";

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  onConfirm: (croppedDataUrl: string) => void;
  aspectRatio?: number;
  title?: string;
}

const MIN_SIZE = 40;
const HANDLE_PX = 10;

const HANDLE_CURSORS: Record<Handle, string> = {
  pan: "grabbing", move: "move",
  nw: "nwse-resize", se: "nwse-resize",
  ne: "nesw-resize", sw: "nesw-resize",
  n: "ns-resize",   s: "ns-resize",
  e: "ew-resize",   w: "ew-resize",
};

export const ImageCropDialog = ({
  open,
  onOpenChange,
  file,
  onConfirm,
  aspectRatio = 1,
  title,
}: ImageCropDialogProps) => {
  const { t } = useLanguage();
  const [imageUrl, setImageUrl]     = useState<string>("");
  const [zoom, setZoom]             = useState(100);
  const [position, setPosition]     = useState({ x: 0, y: 0 });
  const [cropBox, setCropBox]       = useState<CropBox>({ x: 0, y: 0, w: 0, h: 0 });
  const [activeHandle, setActiveHandle] = useState<Handle | null>(null);
  const [pointerStart, setPointerStart] = useState({ x: 0, y: 0 });
  const [initState, setInitState]   = useState<{ pos: { x: number; y: number }; crop: CropBox }>({
    pos: { x: 0, y: 0 }, crop: { x: 0, y: 0, w: 0, h: 0 },
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef     = useRef<HTMLImageElement>(null);

  // Load file as object URL
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setZoom(100);
      setPosition({ x: 0, y: 0 });
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  // Reset crop box to 80% of container, centered
  const resetCropBox = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { offsetWidth: cW, offsetHeight: cH } = el;
    const pad = 0.1;
    setCropBox({
      x: Math.round(cW * pad),
      y: Math.round(cH * pad),
      w: Math.round(cW * (1 - 2 * pad)),
      h: Math.round(cH * (1 - 2 * pad)),
    });
  }, []);

  // Init crop box after dialog/image is ready
  useEffect(() => {
    if (open && imageUrl) {
      const id = setTimeout(resetCropBox, 80);
      return () => clearTimeout(id);
    }
  }, [open, imageUrl, resetCropBox]);

  // ── Pointer helpers ──────────────────────────────────────────────────────

  const getPointer = (e: React.MouseEvent | React.TouchEvent) => {
    if ("touches" in e) {
      const touch = e.touches[0] ?? e.changedTouches[0];
      return { x: touch.clientX, y: touch.clientY };
    }
    return { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
  };

  const containerSize = (): { w: number; h: number } => {
    const el = containerRef.current;
    return el ? { w: el.offsetWidth, h: el.offsetHeight } : { w: 0, h: 0 };
  };

  const clampCrop = (box: CropBox): CropBox => {
    const { w: cW, h: cH } = containerSize();
    const w = Math.max(MIN_SIZE, Math.min(cW, box.w));
    const h = Math.max(MIN_SIZE, Math.min(cH, box.h));
    return {
      x: Math.max(0, Math.min(cW - w, box.x)),
      y: Math.max(0, Math.min(cH - h, box.y)),
      w,
      h,
    };
  };

  // ── Event handlers ───────────────────────────────────────────────────────

  // Container mousedown: pan the image (unless pointer is inside crop box)
  const onContainerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const p    = getPointer(e);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const rx = p.x - rect.left;
    const ry = p.y - rect.top;
    const inCrop =
      rx >= cropBox.x && rx <= cropBox.x + cropBox.w &&
      ry >= cropBox.y && ry <= cropBox.y + cropBox.h;
    setActiveHandle(inCrop ? "move" : "pan");
    setPointerStart(p);
    setInitState({ pos: { ...position }, crop: { ...cropBox } });
  }, [cropBox, position]);

  // Handle mousedown: resize or move (stops propagation so container doesn't also fire)
  const onHandleDown = useCallback(
    (handle: Handle) => (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      const p = getPointer(e);
      setActiveHandle(handle);
      setPointerStart(p);
      setInitState({ pos: { ...position }, crop: { ...cropBox } });
    },
    [position, cropBox],
  );

  const onMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!activeHandle) return;
    const p  = getPointer(e);
    const dx = p.x - pointerStart.x;
    const dy = p.y - pointerStart.y;
    const { w: cW, h: cH } = containerSize();

    if (activeHandle === "pan") {
      setPosition({ x: initState.pos.x + dx, y: initState.pos.y + dy });
      return;
    }

    if (activeHandle === "move") {
      setCropBox({
        ...initState.crop,
        x: Math.max(0, Math.min(cW - initState.crop.w, initState.crop.x + dx)),
        y: Math.max(0, Math.min(cH - initState.crop.h, initState.crop.y + dy)),
      });
      return;
    }

    // Resize: compute new box based on which edge/corner is being dragged
    const { x: ox, y: oy, w: ow, h: oh } = initState.crop;
    let nx = ox, ny = oy, nw = ow, nh = oh;

    if (activeHandle.includes("e")) {
      nw = Math.max(MIN_SIZE, Math.min(cW - ox, ow + dx));
    }
    if (activeHandle.includes("s")) {
      nh = Math.max(MIN_SIZE, Math.min(cH - oy, oh + dy));
    }
    if (activeHandle.includes("w")) {
      const rightEdge = ox + ow;
      nx = Math.max(0, Math.min(rightEdge - MIN_SIZE, ox + dx));
      nw = rightEdge - nx;
    }
    if (activeHandle.includes("n")) {
      const bottomEdge = oy + oh;
      ny = Math.max(0, Math.min(bottomEdge - MIN_SIZE, oy + dy));
      nh = bottomEdge - ny;
    }

    setCropBox(clampCrop({ x: nx, y: ny, w: nw, h: nh }));
  }, [activeHandle, pointerStart, initState]);

  const onUp = useCallback(() => setActiveHandle(null), []);

  // ── Confirm: render only the selected crop area to canvas ────────────────

  const handleConfirm = async () => {
    if (!imageRef.current || !containerRef.current || cropBox.w <= 0) return;
    setIsProcessing(true);
    try {
      const img = imageRef.current;
      const cW  = containerRef.current.offsetWidth;
      const s   = zoom / 100;
      // natural pixels per 1 display pixel at scale=1
      const r = img.naturalWidth / cW;

      // Convert crop box (container coords) → image natural coords
      const sx = (cropBox.x - position.x) / s * r;
      const sy = (cropBox.y - position.y) / s * r;
      const sw = cropBox.w / s * r;
      const sh = cropBox.h / s * r;

      const outW = 800;
      const outH = Math.round(outW * sh / sw);
      const canvas = document.createElement("canvas");
      canvas.width  = outW;
      canvas.height = outH;
      canvas.getContext("2d")!.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

      onConfirm(canvas.toDataURL("image/jpeg", 0.85));
      onOpenChange(false);
    } catch (err) {
      console.error("Crop error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Derive 8 handle positions ────────────────────────────────────────────

  const handles: { id: Handle; cx: number; cy: number; cursor: string }[] =
    cropBox.w > 0
      ? [
          { id: "nw", cx: cropBox.x,                   cy: cropBox.y,                   cursor: "nwse-resize" },
          { id: "n",  cx: cropBox.x + cropBox.w / 2,   cy: cropBox.y,                   cursor: "ns-resize"   },
          { id: "ne", cx: cropBox.x + cropBox.w,        cy: cropBox.y,                   cursor: "nesw-resize" },
          { id: "e",  cx: cropBox.x + cropBox.w,        cy: cropBox.y + cropBox.h / 2,   cursor: "ew-resize"   },
          { id: "se", cx: cropBox.x + cropBox.w,        cy: cropBox.y + cropBox.h,       cursor: "nwse-resize" },
          { id: "s",  cx: cropBox.x + cropBox.w / 2,   cy: cropBox.y + cropBox.h,       cursor: "ns-resize"   },
          { id: "sw", cx: cropBox.x,                   cy: cropBox.y + cropBox.h,       cursor: "nesw-resize" },
          { id: "w",  cx: cropBox.x,                   cy: cropBox.y + cropBox.h / 2,   cursor: "ew-resize"   },
        ]
      : [];

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {title || t("Crop and Position Image", "اقتصاص وضبط موضع الصورة")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* ── Image canvas + crop overlay ── */}
          <div
            ref={containerRef}
            className="relative bg-muted rounded-lg overflow-hidden select-none"
            style={{
              width: "100%",
              aspectRatio: String(aspectRatio),
              maxHeight: "400px",
              cursor: activeHandle ? HANDLE_CURSORS[activeHandle] : "grab",
            }}
            onMouseDown={onContainerDown}
            onMouseMove={onMove}
            onMouseUp={onUp}
            onMouseLeave={onUp}
            onTouchStart={onContainerDown}
            onTouchMove={onMove}
            onTouchEnd={onUp}
          >
            {/* Zoomable / pannable image */}
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
                onLoad={resetCropBox}
              />
            )}

            {/* Crop selection overlay */}
            {cropBox.w > 0 && (
              <div className="absolute inset-0" style={{ pointerEvents: "none" }}>

                {/* Dark mask: 4 strips surrounding the crop box */}
                <div className="absolute bg-black/55" style={{ top: 0, left: 0, right: 0, height: cropBox.y }} />
                <div className="absolute bg-black/55" style={{ top: cropBox.y + cropBox.h, left: 0, right: 0, bottom: 0 }} />
                <div className="absolute bg-black/55" style={{ top: cropBox.y, left: 0, width: cropBox.x, height: cropBox.h }} />
                <div className="absolute bg-black/55" style={{ top: cropBox.y, left: cropBox.x + cropBox.w, right: 0, height: cropBox.h }} />

                {/* Crop frame border — also handles move drag */}
                <div
                  className="absolute border-2 border-white/90"
                  style={{
                    left: cropBox.x,
                    top: cropBox.y,
                    width: cropBox.w,
                    height: cropBox.h,
                    pointerEvents: "auto",
                    cursor: "move",
                  }}
                  onMouseDown={onHandleDown("move")}
                  onTouchStart={onHandleDown("move")}
                />

                {/* Rule-of-thirds guide lines */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: cropBox.x + 2,
                    top: cropBox.y + 2,
                    width: cropBox.w - 4,
                    height: cropBox.h - 4,
                    backgroundImage:
                      "linear-gradient(to right, rgba(255,255,255,0.22) 1px, transparent 1px)," +
                      "linear-gradient(to bottom, rgba(255,255,255,0.22) 1px, transparent 1px)",
                    backgroundSize: `${(cropBox.w - 4) / 3}px ${(cropBox.h - 4) / 3}px`,
                  }}
                />

                {/* 8 resize handles */}
                {handles.map(({ id, cx, cy, cursor }) => (
                  <div
                    key={id}
                    className="absolute bg-white rounded-sm"
                    style={{
                      width: HANDLE_PX,
                      height: HANDLE_PX,
                      left: cx - HANDLE_PX / 2,
                      top: cy - HANDLE_PX / 2,
                      cursor,
                      pointerEvents: "auto",
                      zIndex: 10,
                      boxShadow: "0 0 0 1.5px rgba(0,0,0,0.35)",
                    }}
                    onMouseDown={onHandleDown(id)}
                    onTouchStart={onHandleDown(id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Zoom slider ── */}
          <div className="space-y-1.5">
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

          {/* ── Instructions + Reset ── */}
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              {t(
                "Drag handles to resize crop · Drag inside box to move · Drag outside to pan image",
                "اسحب المقابض لتغيير حجم الاقتصاص · اسحب داخل الإطار للتحريك · اسحب خارجه لتحريك الصورة",
              )}
            </p>
            <button
              type="button"
              onClick={resetCropBox}
              className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              {t("Reset", "إعادة تعيين")}
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            {t("Cancel", "إلغاء")}
          </Button>
          <Button onClick={handleConfirm} disabled={isProcessing || cropBox.w <= 0}>
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
