import { useLanguage } from "@/contexts/LanguageContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-dark.png";

const Footer = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (id: string) => {
    if (location.pathname === "/") {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/", { state: { scrollTo: id } });
    }
  };

  return (
    <footer className="section-navy py-10 md:py-14">
      <div className="container mx-auto px-6">
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <img src={logo} alt="snip.sa" width="512" height="503" className="h-16 w-auto" />
          </div>
          <p className="text-[hsl(var(--cream))]/70 text-sm font-body max-w-sm">
            {t("Shorten your links. Track your campaigns.", "اختصار روابطك، تتبع حملاتك.")}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="font-display font-bold text-sm mb-4 text-[hsl(var(--cream))]">{t("Product", "المنتج")}</h3>
            <ul className="space-y-2.5 text-sm font-body text-[hsl(var(--cream))]/70">
              <li>
                <button onClick={() => scrollToSection("features")} className="hover:text-[hsl(var(--cream))]/90 transition-colors text-start">
                  {t("Features", "الميزات")}
                </button>
              </li>
              <li>
                <a href="https://docs.snip.sa" target="_blank" rel="noopener noreferrer" className="hover:text-[hsl(var(--cream))]/90 transition-colors">
                  {t("API Documentation", "وثائق الـ API")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-bold text-sm mb-4 text-[hsl(var(--cream))]">{t("For Developers", "للمطورين")}</h3>
            <ul className="space-y-2.5 text-sm font-body text-[hsl(var(--cream))]/70">
              <li>
                <a href="https://docs.snip.sa" target="_blank" rel="noopener noreferrer" className="hover:text-[hsl(var(--cream))]/90 transition-colors">
                  {t("API Documentation", "وثائق الـ API")}
                </a>
              </li>
              <li>
                <Link to="/blog" className="hover:text-[hsl(var(--cream))]/90 transition-colors">
                  {t("Blog", "المدونة")}
                </Link>
              </li>
              <li>
                <button onClick={() => scrollToSection("faq")} className="hover:text-[hsl(var(--cream))]/90 transition-colors text-start">
                  {t("FAQ", "أسئلة شائعة")}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-bold text-sm mb-4 text-[hsl(var(--cream))]">{t("Resources", "الموارد")}</h3>
            <ul className="space-y-2.5 text-sm font-body text-[hsl(var(--cream))]/70">
              <li>
                <Link to="/blog" className="hover:text-[hsl(var(--cream))]/90 transition-colors">
                  {t("Blog", "المدونة")}
                </Link>
              </li>
              <li>
                <button onClick={() => scrollToSection("faq")} className="hover:text-[hsl(var(--cream))]/90 transition-colors text-start">
                  {t("FAQ", "أسئلة شائعة")}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-bold text-sm mb-4 text-[hsl(var(--cream))]">{t("Company", "الشركة")}</h3>
            <ul className="space-y-2.5 text-sm font-body text-[hsl(var(--cream))]/70">
              <li><Link to="/privacy-policy" className="hover:text-[hsl(var(--cream))]/90 transition-colors">{t("Privacy Policy", "الخصوصية")}</Link></li>
              <li><Link to="/terms" className="hover:text-[hsl(var(--cream))]/90 transition-colors">{t("Terms of Service", "شروط الاستخدام")}</Link></li>
              <li><a href="mailto:support@snip.sa" className="hover:text-[hsl(var(--cream))]/90 transition-colors">support@snip.sa</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[hsl(var(--cream))]/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 mt:order-1">
            <Button variant="ghost" className="text-[hsl(var(--cream))] font-body font-semibold rounded-full px-5 border border-[hsl(var(--cream))]/20 hover:bg-[hsl(var(--cream))]/10" asChild>
              <Link to="/login">{t("Log in", "تسجيل الدخول")}</Link>
            </Button>
            <Button className="bg-[hsl(var(--sky))] text-white font-body font-bold rounded-full px-6 hover:brightness-110" asChild>
              <Link to="/signup">{t("Get started for free", "ابدأ مجاناً")}</Link>
            </Button>
          </div>

          <p className="text-[hsl(var(--cream))]/70 text-sm font-body mt:order-2">
            {t("© 2026 snip.sa · All rights reserved", "© 2026 snip.sa · جميع الحقوق محفوظة")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
