import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import logoIcon from "@/assets/logo.png";
import { useBrand } from "@/contexts/BrandContext";
import { useBrandMetaTags } from "@/hooks/useBrandMetaTags";

const APPEAL_EMAIL = "support@snip.sa";

export default function BlockedLinkPage() {
  useBrandMetaTags();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const brand = useBrand();

  const code = searchParams.get("code");
  const appealHref = `mailto:${APPEAL_EMAIL}?subject=${encodeURIComponent(
    `Link Review Request${code ? ` — ${code}` : ""}`,
  )}`;

  const emailLink = (
    <a
      href={appealHref}
      className="font-semibold text-foreground underline underline-offset-2"
    >
      {APPEAL_EMAIL}
    </a>
  );

  return (
    <div dir="ltr" className="min-h-screen bg-background flex items-center">
      <div className="w-full max-w-6xl mx-auto px-6 md:px-12 py-16 grid md:grid-cols-2 gap-12 md:gap-16 items-center">
        <div className="text-left">
          <div className="flex items-center gap-2 mb-10">
            <img src={logoIcon} alt={brand.name} className="h-6 w-6" />
            <span className="font-display font-bold text-lg text-foreground">
              {brand.name}
            </span>
          </div>

          <h1
            dir="rtl"
            className="text-left font-display font-bold text-4xl md:text-5xl leading-tight text-foreground"
          >
            تم حظر هذا الرابط
          </h1>
          <p className="mt-4 font-semibold text-base md:text-lg text-foreground">
            This Link Has Been Blocked
          </p>

          <p
            dir="rtl"
            className="mt-6 text-left font-semibold text-sm md:text-base text-foreground"
          >
            هذا الرابط يخالف سياسة الاستخدام المقبول لـ {brand.name}
          </p>
          <p className="mt-1 font-semibold text-sm md:text-base text-foreground">
            This link violates {brand.name}'s acceptable use policy
          </p>

          <p
            dir="rtl"
            className="mt-6 text-left text-sm md:text-base text-muted-foreground leading-relaxed"
          >
            قمنا بمراجعة هذا الرابط ووجدنا أنه يخالف سياساتنا. إذا كنت تعتقد أن
            الرابط تم حظره عن طريق الخطأ، يمكنك التواصل معنا عبر {emailLink}
          </p>
          <p className="mt-2 text-sm md:text-base text-muted-foreground leading-relaxed">
            We reviewed this link and found it violates our policies. If you
            believe this is a mistake, you can contact us at {emailLink}.
          </p>

          <button
            onClick={() => navigate("/")}
            className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Homepage / العودة للرئيسية</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          <span className="absolute top-4 left-8 w-2 h-2 rounded-full bg-secondary/20" />
          <span className="absolute top-16 right-4 w-1.5 h-1.5 rounded-full bg-secondary/20" />
          <span className="absolute bottom-8 left-4 w-2 h-2 rounded-full bg-secondary/20" />
          <div className="w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-full bg-secondary flex items-center justify-center">
            <ShieldAlert className="w-20 h-20 md:w-24 md:h-24 text-secondary-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}
