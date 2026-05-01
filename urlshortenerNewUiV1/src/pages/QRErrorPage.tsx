import { useSearchParams, useNavigate } from "react-router-dom";
import { QrCode, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Translations ─────────────────────────────────────────────────────────────

const STRINGS = {
  en: {
    title: "QR Code Not Found",
    subtitle: "This QR code is unavailable or has been deactivated.",
    body: "The QR code you scanned is either inactive, expired, or does not exist. Please contact the person or business who provided this code.",
    goHome: "Go to Home",
    tryAgain: "Try Again",
    code: "Code",
    dir: "ltr" as const,
    fontClass: ""
  },
  ar: {
    title: "كود QR غير متاح",
    subtitle: "كود QR هذا غير متاح أو تم تعطيله.",
    body: "كود QR الذي قمت بمسحه إما غير نشط أو منتهي الصلاحية أو غير موجود. يرجى التواصل مع الشخص أو الجهة التي وفّرت هذا الكود.",
    goHome: "الصفحة الرئيسية",
    tryAgain: "حاول مجدداً",
    code: "الكود",
    dir: "rtl" as const,
    fontClass: "font-arabic"
  }
} as const;

type SupportedLang = keyof typeof STRINGS;

// ─── Component ────────────────────────────────────────────────────────────────

export default function QRErrorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Backend passes ?lang=ar or ?lang=en; fall back to browser preference
  const rawLang = searchParams.get("lang") ?? "";
  const lang: SupportedLang =
    rawLang === "ar" || rawLang === "en"
      ? rawLang
      : navigator.language.startsWith("ar")
      ? "ar"
      : "en";

  const s = STRINGS[lang];
  const code = searchParams.get("code");

  return (
    <div
      dir={s.dir}
      lang={lang}
      className={`min-h-screen bg-background flex items-center justify-center p-6 ${s.fontClass}`}
    >
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
            <QrCode className="w-12 h-12 text-muted-foreground" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-foreground">{s.title}</h1>
          <p className="text-base font-medium text-muted-foreground">{s.subtitle}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
        </div>

        {/* Code reference (helps user report the issue) */}
        {code && (
          <div className="bg-muted rounded-lg px-4 py-3 inline-block">
            <p className="text-xs text-muted-foreground">
              {s.code}:{" "}
              <span className="font-mono font-semibold text-foreground">{code}</span>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
            <Home className="w-4 h-4" />
            {s.goHome}
          </Button>
          <Button onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            {s.tryAgain}
          </Button>
        </div>

        {/* Branding */}
        <p className="text-xs text-muted-foreground/50">snip.sa</p>
      </div>
    </div>
  );
}
