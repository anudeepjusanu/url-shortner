import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, QrCode, ChevronDown, ChevronUp } from "lucide-react";
import { dynamicQRCodeAPI } from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

// ─── Constants ───────────────────────────────────────────────────────────────

const ERROR_CORRECTIONS = [
  { value: "L", label: "L — Low (7%)" },
  { value: "M", label: "M — Medium (15%)" },
  { value: "Q", label: "Q — Quartile (25%)" },
  { value: "H", label: "H — High (30%)" },
] as const;

const FORMATS = ["png", "jpeg", "webp", "svg", "pdf"] as const;

interface FormState {
  name: string;
  destinationUrl: string;
  size: number;
  format: string;
  errorCorrection: string;
  foregroundColor: string;
  backgroundColor: string;
  includeMargin: boolean;
}

interface FormErrors {
  name?: string;
  destinationUrl?: string;
}

const DEFAULT_FORM: FormState = {
  name: "",
  destinationUrl: "",
  size: 300,
  format: "png",
  errorCorrection: "M",
  foregroundColor: "#000000",
  backgroundColor: "#FFFFFF",
  includeMargin: true,
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function CreateDynamicQRCode() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ── Mutation ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: () =>
      dynamicQRCodeAPI.create({
        name: form.name.trim(),
        destinationUrl: form.destinationUrl.trim(),
        customization: {
          size: form.size,
          format: form.format,
          errorCorrection: form.errorCorrection,
          foregroundColor: form.foregroundColor,
          backgroundColor: form.backgroundColor,
          includeMargin: form.includeMargin,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dynamic-qr"] });
      toast({ title: t("Dynamic QR code created!", "تم إنشاء كود QR الديناميكي!") });
      navigate("/dashboard/dynamic-qr");
    },
    onError: (err: any) => {
      const serverErrors = err?.errors;
      if (Array.isArray(serverErrors)) {
        const mapped: FormErrors = {};
        serverErrors.forEach((e: any) => {
          if (e.path === "name") mapped.name = e.msg;
          if (e.path === "destinationUrl") mapped.destinationUrl = e.msg;
        });
        setErrors(mapped);
      } else {
        toast({
          variant: "destructive",
          title: t("Creation failed", "فشل الإنشاء"),
          description: err?.message ?? t("Please try again", "يرجى المحاولة مرة أخرى"),
        });
      }
    },
  });

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const next: FormErrors = {};

    if (!form.name.trim()) {
      next.name = t("Name is required", "الاسم مطلوب");
    }

    if (!form.destinationUrl.trim()) {
      next.destinationUrl = t("Destination URL is required", "رابط الوجهة مطلوب");
    } else {
      try {
        const p = new URL(form.destinationUrl.trim());
        if (p.protocol !== "http:" && p.protocol !== "https:") {
          next.destinationUrl = t(
            "URL must start with http:// or https://",
            "يجب أن يبدأ الرابط بـ http:// أو https://"
          );
        }
      } catch {
        next.destinationUrl = t("Enter a valid URL", "أدخل رابطاً صحيحاً");
      }
    }

    if (form.size < 100 || form.size > 2000) {
      // Non-blocking, silently clamp
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) createMutation.mutate();
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/dynamic-qr")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {t("Create Dynamic QR Code", "إنشاء كود QR ديناميكي")}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t(
                "The QR code is permanent — only the destination changes.",
                "كود QR دائم — الوجهة هي التي تتغير."
              )}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">
              {t("Name", "الاسم")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => {
                set("name", e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder={t("e.g. Summer Campaign 2025", "مثال: حملة صيف 2025")}
              maxLength={100}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Destination URL */}
          <div className="space-y-1.5">
            <Label htmlFor="destination">
              {t("Destination URL", "رابط الوجهة")}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="destination"
              type="url"
              value={form.destinationUrl}
              onChange={(e) => {
                set("destinationUrl", e.target.value);
                if (errors.destinationUrl)
                  setErrors((prev) => ({ ...prev, destinationUrl: undefined }));
              }}
              placeholder="https://example.com/landing-page"
              dir="ltr"
            />
            {errors.destinationUrl && (
              <p className="text-xs text-destructive">{errors.destinationUrl}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {t(
                "You can update this URL anytime without changing the QR image.",
                "يمكنك تحديث هذا الرابط في أي وقت دون تغيير صورة QR."
              )}
            </p>
          </div>

          <Separator />

          {/* Advanced customization toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAdvanced ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {t("Advanced Customization", "خيارات التخصيص المتقدمة")}
          </button>

          {showAdvanced && (
            <div className="space-y-4 ps-2 border-s-2 border-muted">
              {/* Size */}
              <div className="space-y-1.5">
                <Label htmlFor="size">
                  {t("Size (px)", "الحجم (بكسل)")}
                </Label>
                <Input
                  id="size"
                  type="number"
                  min={100}
                  max={2000}
                  value={form.size}
                  onChange={(e) => set("size", Math.max(100, Math.min(2000, Number(e.target.value))))}
                  dir="ltr"
                />
              </div>

              {/* Format */}
              <div className="space-y-1.5">
                <Label>{t("Download Format", "صيغة التحميل")}</Label>
                <Select value={form.format} onValueChange={(v) => set("format", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMATS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Error correction */}
              <div className="space-y-1.5">
                <Label>{t("Error Correction", "مستوى تصحيح الخطأ")}</Label>
                <Select
                  value={form.errorCorrection}
                  onValueChange={(v) => set("errorCorrection", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ERROR_CORRECTIONS.map((ec) => (
                      <SelectItem key={ec.value} value={ec.value}>
                        {ec.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fg">{t("Foreground", "لون QR")}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="fg"
                      value={form.foregroundColor}
                      onChange={(e) => set("foregroundColor", e.target.value)}
                      className="h-9 w-9 rounded border cursor-pointer"
                    />
                    <Input
                      value={form.foregroundColor}
                      onChange={(e) => set("foregroundColor", e.target.value)}
                      className="font-mono text-sm"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bg">{t("Background", "لون الخلفية")}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="bg"
                      value={form.backgroundColor}
                      onChange={(e) => set("backgroundColor", e.target.value)}
                      className="h-9 w-9 rounded border cursor-pointer"
                    />
                    <Input
                      value={form.backgroundColor}
                      onChange={(e) => set("backgroundColor", e.target.value)}
                      className="font-mono text-sm"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              {/* Margin */}
              <div className="flex items-center gap-3">
                <Switch
                  id="margin"
                  checked={form.includeMargin}
                  onCheckedChange={(v) => set("includeMargin", v)}
                />
                <Label htmlFor="margin">{t("Include margin (quiet zone)", "تضمين هامش")}</Label>
              </div>
            </div>
          )}

          {/* Info box */}
          <div className="rounded-lg bg-muted p-4 flex gap-3">
            <QrCode className="w-5 h-5 shrink-0 text-primary mt-0.5" />
            <p className="text-sm text-muted-foreground">
              {t(
                "A permanent scan URL will be generated and encoded into the QR image. You can change the destination anytime from the dashboard — no need to reprint.",
                "سيتم إنشاء رابط مسح دائم وتضمينه في صورة QR. يمكنك تغيير الوجهة في أي وقت من لوحة التحكم دون الحاجة لإعادة الطباعة."
              )}
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard/dynamic-qr")}
              className="flex-1"
            >
              {t("Cancel", "إلغاء")}
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="flex-1">
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin me-2" />
              ) : (
                <QrCode className="w-4 h-4 me-2" />
              )}
              {t("Create QR Code", "إنشاء كود QR")}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
