import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Globe, ChevronDown, Link2, QrCode, User, Tag, Globe2, Code2 } from "lucide-react";
import logoFull from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [mobileFeatures, setMobileFeatures] = useState(false);
  const { lang, setLang, t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleLang = () => setLang(lang === "en" ? "ar" : "en");

  const handleSectionNav = (sectionId: string) => {
    setIsOpen(false);
    if (location.pathname === "/") {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/", { state: { scrollTo: sectionId } });
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setFeaturesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const featureLinks = [
    { to: "/features/url-shortening", icon: Link2, label: t("URL Shortening", "اختصار الروابط"), desc: t("Shorten and track links", "اختصر وتتبع الروابط") },
    { to: "/features/qr-codes", icon: QrCode, label: t("QR Codes", "أكواد QR"), desc: t("Scannable codes with analytics", "أكواد قابلة للمسح مع تحليلات") },
    { to: "/features/link-in-bio", icon: User, label: t("Link in Bio", "رابط البايو"), desc: t("Beautiful bio pages", "صفحات بايو جميلة") },
    { to: "/features/utm-tracking", icon: Tag, label: t("UTM Tracking", "تتبع UTM"), desc: t("Campaign parameter builder", "منشئ معلمات الحملات") },
    { to: "/features/custom-domains", icon: Globe2, label: t("Custom Domains", "النطاقات المخصصة"), desc: t("Brand your short links", "ميّز روابطك بعلامتك") },
    { to: "/features/api", icon: Code2, label: t("Developer API", "واجهة المطورين"), desc: t("REST API, SDKs, webhooks", "REST API ومكتبات وويب هوكس") },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-2 lg:px-4 pt-4">
      <div className="mx-auto w-full lg:container">
        <div className="bg-white rounded-full px-3 lg:px-6 py-2 flex items-center justify-between shadow-card gap-2">
          <a href="/" className="flex items-center gap-2 lg:-ms-3 shrink-0">
            <img src={logoFull} alt="Snip" className="h-6 lg:h-8" />
            <span className="font-display font-bold text-lg lg:text-xl text-foreground">Snip</span>
          </a>

          <div className="hidden lg:flex items-center gap-1">
            {/* Features dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setFeaturesOpen(!featuresOpen)}
                className="flex items-center gap-1 text-[hsl(var(--navy))] hover:opacity-70 transition-opacity font-body text-sm font-medium px-4 py-1.5"
              >
                {t("Features", "الميزات")}
                <ChevronDown size={14} className={`transition-transform duration-200 ${featuresOpen ? "rotate-180" : ""}`} />
              </button>

              {featuresOpen && (
                <div className="absolute top-full mt-3 start-0 w-72 bg-white rounded-2xl shadow-elevated border border-[hsl(var(--navy))]/8 p-2 animate-fade-in">
                  {featureLinks.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setFeaturesOpen(false)}
                      className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-[hsl(var(--navy))]/4 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[hsl(var(--sky))]/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[hsl(var(--sky))]/15 transition-colors">
                        <item.icon className="w-4 h-4 text-[hsl(var(--sky))]" />
                      </div>
                      <div>
                        <span className="font-body text-sm font-semibold text-[hsl(var(--navy))] block">{item.label}</span>
                        <span className="font-body text-xs text-[hsl(var(--navy))]/45">{item.desc}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => handleSectionNav("analytics")}
              className="text-[hsl(var(--navy))] hover:opacity-70 transition-opacity font-body text-sm font-medium px-4 py-1.5"
            >
              {t("Analytics", "التحليلات")}
            </button>
            <button
              onClick={() => handleSectionNav("developers")}
              className="text-[hsl(var(--navy))] hover:opacity-70 transition-opacity font-body text-sm font-medium px-4 py-1.5"
            >
              {t("Developers", "المطورين")}
            </button>
            <Link to="/blog" className="text-[hsl(var(--navy))] hover:opacity-70 transition-opacity font-body text-sm font-medium px-4 py-1.5">
              {t("Blog", "المدونة")}
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 text-[hsl(var(--navy))]/60 hover:text-[hsl(var(--navy))] transition-colors font-body text-sm px-3 py-1.5"
            >
              <Globe size={14} />
              {lang === "en" ? "العربية" : "English"}
            </button>
            {isAuthenticated ? (
              <Button size="sm" className="bg-[hsl(var(--sky))] text-white font-body font-bold rounded-full px-6 hover:opacity-90 transition-all" asChild>
                <Link to="/dashboard">{t("Go to Dashboard", "لوحة التحكم")}</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="text-[hsl(var(--navy))] font-body font-semibold rounded-full px-5 border border-[hsl(var(--navy))]/20" asChild>
                  <Link to="/login">{t("Log in", "تسجيل الدخول")}</Link>
                </Button>
                <Button size="sm" className="bg-[hsl(var(--sky))] text-white font-body font-bold rounded-full px-6 hover:opacity-90 transition-all" asChild>
                  <Link to="/signup">{t("Sign up free", "سجّل مجاناً")}</Link>
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 lg:hidden shrink-0">
            {isAuthenticated ? (
              <Button size="sm" className="h-8 bg-[hsl(var(--sky))] text-white font-body font-bold rounded-full px-3 text-xs hover:opacity-90 transition-all" asChild>
                <Link to="/dashboard">{t("Dashboard", "لوحة التحكم")}</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="h-8 text-[hsl(var(--navy))] font-body font-semibold rounded-full px-3 text-xs border border-[hsl(var(--navy))]/20" asChild>
                  <Link to="/login">{t("Log in", "دخول")}</Link>
                </Button>
                <Button size="sm" className="h-8 bg-[hsl(var(--sky))] text-white font-body font-bold rounded-full px-3 text-xs hover:opacity-90 transition-all" asChild>
                  <Link to="/signup">{t("Sign up", "سجّل")}</Link>
                </Button>
              </>
            )}
            <button onClick={toggleLang} className="text-[hsl(var(--navy))]/60 hover:text-[hsl(var(--navy))] transition-colors p-1 shrink-0">
              <Globe size={18} />
            </button>
            <button onClick={() => setIsOpen(!isOpen)} className="text-[hsl(var(--navy))] p-1">
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden mx-4 mt-2 bg-white rounded-3xl shadow-card px-5 pb-4">
          <div className="flex flex-col gap-1 pt-3 font-body text-sm">
            {/* Mobile features accordion */}
            <button
              onClick={() => setMobileFeatures(!mobileFeatures)}
              className="flex items-center justify-between text-[hsl(var(--navy))]/70 hover:text-[hsl(var(--navy))] py-2.5 px-3 rounded-xl"
            >
              {t("Features", "الميزات")}
              <ChevronDown size={14} className={`transition-transform duration-200 ${mobileFeatures ? "rotate-180" : ""}`} />
            </button>
            {mobileFeatures && (
              <div className="ps-3 space-y-0.5 mb-1">
                {featureLinks.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => { setIsOpen(false); setMobileFeatures(false); }}
                    className="flex items-center gap-2.5 py-2 px-3 rounded-xl text-[hsl(var(--navy))]/60 hover:text-[hsl(var(--navy))] hover:bg-[hsl(var(--navy))]/4 transition-colors"
                  >
                    <item.icon className="w-3.5 h-3.5 text-[hsl(var(--sky))]" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
            <button onClick={() => handleSectionNav("analytics")} className="text-start text-[hsl(var(--navy))]/70 hover:text-[hsl(var(--navy))] py-2.5 px-3 rounded-xl">{t("Analytics", "التحليلات")}</button>
            <button onClick={() => handleSectionNav("developers")} className="text-start text-[hsl(var(--navy))]/70 hover:text-[hsl(var(--navy))] py-2.5 px-3 rounded-xl">{t("Developers", "المطورين")}</button>
            <Link to="/blog" className="text-[hsl(var(--navy))]/70 hover:text-[hsl(var(--navy))] py-2.5 px-3 rounded-xl">{t("Blog", "المدونة")}</Link>
            {isAuthenticated ? (
              <Button className="bg-[hsl(var(--sky))] text-white font-bold mt-3 rounded-full" asChild>
                <Link to="/dashboard">{t("Go to Dashboard", "لوحة التحكم")}</Link>
              </Button>
            ) : (
              <>
                <Button className="bg-[hsl(var(--sky))] text-white font-bold mt-3 rounded-full" asChild>
                  <Link to="/signup">{t("Sign up free", "سجّل مجاناً")}</Link>
                </Button>
                <Button variant="ghost" className="text-[hsl(var(--navy))]/70 rounded-full" asChild>
                  <Link to="/login">{t("Log in", "تسجيل الدخول")}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
