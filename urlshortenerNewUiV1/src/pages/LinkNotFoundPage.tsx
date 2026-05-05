import { useSearchParams, useNavigate } from "react-router-dom";
import { Link2Off, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const STRINGS = {
  en: {
    title: "Link Not Found",
    subtitle: "This link is no longer available.",
    body: "The short link you followed has been deleted, deactivated, or never existed. Please check the link and try again, or contact the person who shared it.",
    goHome: "Go to Home",
    code: "Link",
    dir: "ltr" as const,
    fontClass: ""
  },
  ar: {
    title: "الرابط غير متاح",
    subtitle: "هذا الرابط لم يعد متاحاً.",
    body: "الرابط المختصر الذي اتبعته تم حذفه أو تعطيله أو أنه غير موجود أصلاً. يرجى التحقق من الرابط والمحاولة مرة أخرى، أو التواصل مع من أرسله إليك.",
    goHome: "الصفحة الرئيسية",
    code: "الرابط",
    dir: "rtl" as const,
    fontClass: "font-arabic"
  }
} as const;

type SupportedLang = keyof typeof STRINGS;

export default function LinkNotFoundPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
            <Link2Off className="w-12 h-12 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-foreground">{s.title}</h1>
          <p className="text-base font-medium text-muted-foreground">{s.subtitle}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
        </div>

        {code && (
          <div className="bg-muted rounded-lg px-4 py-3 inline-block">
            <p className="text-xs text-muted-foreground">
              {s.code}:{" "}
              <span className="font-mono font-semibold text-foreground">{code}</span>
            </p>
          </div>
        )}

        <div className="flex justify-center">
          <Button onClick={() => navigate("/")} className="gap-2">
            <Home className="w-4 h-4" />
            {s.goHome}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground/50">snip.sa</p>
      </div>
    </div>
  );
}
