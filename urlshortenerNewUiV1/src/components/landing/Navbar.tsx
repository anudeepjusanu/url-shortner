import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Globe } from "lucide-react";
import logoFull from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleLang = () => setLang(lang === "en" ? "ar" : "en");

  const scrollToSection = (id: string) => {
    if (location.pathname === "/") {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/", { state: { scrollTo: id } });
    }
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <div className="container mx-auto">
        <div className="bg-white rounded-full px-6 py-2 flex items-center justify-between shadow-card">
          <a href="/" className="flex items-center gap-1 -ms-3">
            <img src={logoFull} alt="snip" className="h-8 md:h-10" />
            <span className="font-display font-bold text-lg md:text-xl text-foreground">SNIP</span>
          </a>

          <div className="hidden md:flex items-center gap-1">
            {[
              { id: "features", label: t("Features", "الميزات") },
              { id: "analytics", label: t("Analytics", "التحليلات") },
              { id: "developers", label: t("Developers", "المطورين") },
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="text-[hsl(var(--navy))] hover:opacity-70 transition-opacity font-body text-sm font-medium px-4 py-1.5"
              >
                {link.label}
              </button>
            ))}
            <Link to="/blog" className="text-[hsl(var(--navy))] hover:opacity-70 transition-opacity font-body text-sm font-medium px-4 py-1.5">
              {t("Blog", "المدونة")}
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 text-[hsl(var(--navy))]/60 hover:text-[hsl(var(--navy))] transition-colors font-body text-sm px-3 py-1.5"
            >
              <Globe size={14} />
              {lang === "en" ? "العربية" : "English"}
            </button>
            {!isLoading && (
              isAuthenticated ? (
                <Button size="sm" className="bg-[hsl(var(--sky))] text-white font-body font-bold rounded-full px-6 hover:opacity-90 transition-all" asChild>
                  <Link to="/dashboard">{t("Dashboard", "لوحة التحكم")}</Link>
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
              )
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            {!isLoading && (
              isAuthenticated ? (
                <Button size="sm" className="bg-[hsl(var(--sky))] text-white font-body font-bold rounded-full px-4 text-xs hover:opacity-90 transition-all" asChild>
                  <Link to="/dashboard">{t("Dashboard", "لوحة التحكم")}</Link>
                </Button>
              ) : (
                <Button size="sm" className="bg-[hsl(var(--sky))] text-white font-body font-bold rounded-full px-4 text-xs hover:opacity-90 transition-all" asChild>
                  <Link to="/login">{t("Sign in", "دخول")}</Link>
                </Button>
              )
            )}
            <button onClick={toggleLang} className="text-[hsl(var(--navy))]/60 hover:text-[hsl(var(--navy))] transition-colors p-1.5">
              <Globe size={18} />
            </button>
            <button onClick={() => setIsOpen(!isOpen)} className="text-[hsl(var(--navy))]">
              {isOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden mx-4 mt-2 bg-white rounded-3xl shadow-card px-5 pb-4">
          <div className="flex flex-col gap-1 pt-3 font-body text-sm">
            <button onClick={() => { scrollToSection("features"); setIsOpen(false); }} className="text-[hsl(var(--navy))]/70 hover:text-[hsl(var(--navy))] py-2.5 px-3 rounded-xl text-start">{t("Features", "الميزات")}</button>
            <button onClick={() => { scrollToSection("analytics"); setIsOpen(false); }} className="text-[hsl(var(--navy))]/70 hover:text-[hsl(var(--navy))] py-2.5 px-3 rounded-xl text-start">{t("Analytics", "التحليلات")}</button>
            <button onClick={() => { scrollToSection("developers"); setIsOpen(false); }} className="text-[hsl(var(--navy))]/70 hover:text-[hsl(var(--navy))] py-2.5 px-3 rounded-xl text-start">{t("Developers", "المطورين")}</button>
            <Link to="/blog" className="text-[hsl(var(--navy))]/70 hover:text-[hsl(var(--navy))] py-2.5 px-3 rounded-xl">{t("Blog", "المدونة")}</Link>
            {!isLoading && (
              isAuthenticated ? (
                <Button className="bg-[hsl(var(--sky))] text-white font-bold mt-3 rounded-full" asChild>
                  <Link to="/dashboard">{t("Dashboard", "لوحة التحكم")}</Link>
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
              )
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;