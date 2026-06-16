import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowRight, QrCode, Link, BarChart3, MessageCircle } from "lucide-react";
import { Link as RouterLink } from "react-router-dom";
import { useSmartLink } from "@/hooks/useSmartLink";

const BioHeroSection = () => {
  const { t } = useLanguage();
  const { smartLink } = useSmartLink();

  return (
    <section className="section-cream py-20 md:py-32 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
              <span>✨</span>
              {t("NEW: Bio Pages", "جديد: صفحات البايو")}
            </div>

            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight tracking-tight">
              {t(
                "Your Links. Your Brand. Your Data in Saudi Arabia.",
                "روابطك. علامتك. بياناتك في السعودية."
              )}
            </h1>

            <p className="text-lg text-muted-foreground font-body mb-8 leading-relaxed">
              {t(
                "Create stunning bio pages, short links, and QR codes all in one platform built for Saudi businesses and creators.",
                "أنشئ صفحات بايو مذهلة، روابط مختصرة، وأكواد QR كل ذلك في منصة واحدة مصممة للشركات والمبدعين السعوديين."
              )}
            </p>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-primary text-primary-foreground font-medium">
                <RouterLink to={smartLink("/signup")}>
                  {t("Create Your Bio Page Free", "أنشئ صفحتك مجاناً")}
                  <ArrowRight className="w-4 h-4 ms-1.5 rtl:rotate-180" />
                </RouterLink>
              </Button>
              <Button asChild variant="outline" size="lg">
                <RouterLink to="/bio/khalid_designs">
                  {t("See Examples", "شاهد الأمثلة")}
                </RouterLink>
              </Button>
            </div>
          </div>

          {/* Phone Mockup */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              {/* Phone */}
              <div className="w-[280px] rounded-[36px] border-[5px] border-gray-800 bg-gray-800 shadow-2xl animate-float">
                <div className="relative h-6 bg-gray-800 rounded-t-[32px] flex justify-center">
                  <div className="w-28 h-4 bg-gray-900 rounded-b-xl" />
                </div>
                <div className="h-[480px] rounded-b-[28px] overflow-hidden bg-gradient-to-br from-purple-600 via-pink-500 to-purple-800">
                  <div className="flex flex-col items-center pt-10 px-6">
                    <div className="w-20 h-20 rounded-full bg-white/20 border-2 border-white/40 mb-3" />
                    <div className="w-24 h-3 bg-white/40 rounded mb-2" />
                    <div className="w-36 h-2 bg-white/20 rounded mb-8" />
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-full h-11 rounded-full bg-white/15 border border-white/20 mb-3 flex items-center px-4"
                      >
                        <div className="w-4 h-4 rounded bg-white/30 me-3" />
                        <div className="w-20 h-2.5 bg-white/30 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -start-8 w-16 h-16 bg-card rounded-xl shadow-lg flex items-center justify-center animate-float" style={{ animationDelay: "0.5s" }}>
                <QrCode className="w-8 h-8 text-primary" />
              </div>
              <div className="absolute top-20 -end-10 w-14 h-14 bg-card rounded-xl shadow-lg flex items-center justify-center animate-float" style={{ animationDelay: "1s" }}>
                <Link className="w-7 h-7 text-primary" />
              </div>
              <div className="absolute bottom-20 -start-6 w-14 h-14 bg-card rounded-xl shadow-lg flex items-center justify-center animate-float" style={{ animationDelay: "1.5s" }}>
                <BarChart3 className="w-7 h-7 text-primary" />
              </div>
              <div className="absolute bottom-8 -end-6 w-12 h-12 bg-[#25D366] rounded-full shadow-lg flex items-center justify-center animate-float" style={{ animationDelay: "2s" }}>
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BioHeroSection;
