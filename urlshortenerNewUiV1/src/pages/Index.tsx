import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMetaTags } from "@/hooks/useMetaTags";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import AnalyticsSection from "@/components/landing/AnalyticsSection";
import DeveloperSection from "@/components/landing/DeveloperSection";
import ComparisonSection from "@/components/landing/ComparisonSection";
import BlogSection from "@/components/landing/BlogSection";
import FAQSection from "@/components/landing/FAQSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  const location = useLocation();
  const { lang } = useLanguage();

  useMetaTags({
    title:
      lang === "ar"
        ? "اختصار الروابط مجانًا | أفضل موقع اختصار روابط snip"
        : "snip — Smart URL Shortener for Saudi Arabia",
    description:
      lang === "ar"
        ? "أفضل منصة اختصار روابط للعرب. أنشئ روابط قصيرة تحمل علامتك التجارية مع تحليلات وتتبع الإحصاءات بسهولة. جرّب أداة اختصار الروابط مجانًا على snip."
        : "The smartest URL shortener built for Saudi marketers and developers. Shorten links, generate QR codes, use custom domains, and track real-time analytics. Hosted in Saudi Arabia. PDPL compliant.",
    keywords:
      "URL shortener, Saudi Arabia, link shortener, QR code generator, custom domain, link analytics, snip, رابط مختصر, اختصار الروابط, السعودية",
    ogTitle:
      lang === "ar"
        ? "اختصار الروابط مجانًا | أفضل موقع اختصار روابط snip"
        : "snip — Smart URL Shortener for Saudi Arabia",
    ogDescription:
      lang === "ar"
        ? "أفضل منصة اختصار روابط للعرب. أنشئ روابط قصيرة تحمل علامتك التجارية مع تحليلات وتتبع الإحصاءات بسهولة. جرّب أداة اختصار الروابط مجانًا."
        : "Shorten links, generate QR codes, and track real-time analytics. Built for the Saudi market. Hosted in Saudi Arabia.",
    ogUrl: "https://snip.sa/",
    ogImage: "https://snip.sa/og-image.png",
    twitterTitle:
      lang === "ar"
        ? "اختصار الروابط مجانًا | أفضل موقع اختصار روابط snip"
        : "snip — Smart URL Shortener for Saudi Arabia",
    twitterDescription:
      lang === "ar"
        ? "أفضل منصة اختصار روابط للعرب. أنشئ روابط قصيرة تحمل علامتك التجارية مع تحليلات وتتبع الإحصاءات بسهولة."
        : "Shorten links, generate QR codes, and track real-time analytics. Built for the Saudi market.",
    twitterImage: "https://snip.sa/og-image.png",
    canonical: "https://snip.sa/",
  });

  useEffect(() => {
    const scrollTo = (location.state as { scrollTo?: string } | null)?.scrollTo;
    if (scrollTo) {
      // Small delay to ensure all sections have mounted before scrolling
      const timer = setTimeout(() => {
        document.getElementById(scrollTo)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <AnalyticsSection />
        <DeveloperSection />
        <ComparisonSection />
        <BlogSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
