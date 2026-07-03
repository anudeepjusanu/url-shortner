import { useSearchParams, useNavigate } from "react-router-dom";
import { ShieldAlert, Home, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const APPEAL_EMAIL = "support@snip.sa";

const STRINGS = {
  ar: {
    title: "تم حظر هذا الرابط",
    subtitle: "لا يمكن الوصول إلى هذا الرابط.",
    body: "تم حظر هذا الرابط لمخالفته سياسات الاستخدام الخاصة بمنصة Snip. إذا كنت تعتقد أن هذا حدث عن طريق الخطأ، يمكنك التواصل معنا لتقديم طلب مراجعة.",
    appeal: "تقديم طلب مراجعة",
    goHome: "الصفحة الرئيسية",
    code: "الرابط",
    dir: "rtl" as const,
    fontClass: "font-arabic",
  },
  en: {
    title: "This Link Has Been Blocked",
    subtitle: "This link is not accessible.",
    body: "This link was blocked for violating Snip's usage policies. If you believe this is a mistake, you can contact us to request a review.",
    appeal: "Request a Review",
    goHome: "Go to Home",
    code: "Link",
    dir: "ltr" as const,
    fontClass: "",
  },
} as const;

type SupportedLang = keyof typeof STRINGS;

export default function BlockedLinkPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const rawLang = searchParams.get("lang") ?? "";
  // Arabic primary: default to Arabic unless the visitor explicitly asked for English.
  const lang: SupportedLang = rawLang === "en" ? "en" : "ar";

  const s = STRINGS[lang];
  const code = searchParams.get("code");

  const appealHref = `mailto:${APPEAL_EMAIL}?subject=${encodeURIComponent(
    `Link Review Request${code ? ` — ${code}` : ""}`
  )}`;

  return (
    <div
      dir={s.dir}
      lang={lang}
      className={`min-h-screen bg-background flex items-center justify-center p-6 ${s.fontClass}`}
    >
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center">
            <ShieldAlert className="w-12 h-12 text-red-600" />
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
              {s.code}: <span className="font-mono font-semibold text-foreground">{code}</span>
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button asChild variant="outline" className="gap-2">
            <a href={appealHref}>
              <Mail className="w-4 h-4" />
              {s.appeal}
            </a>
          </Button>
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
