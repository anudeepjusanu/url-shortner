import { lazy, Suspense, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMetaTags } from "@/hooks/useMetaTags";
// Above-the-fold sections loaded eagerly
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";

// Below-the-fold sections lazy-loaded — they only need to render after scroll
const FeaturesSection = lazy(() => import("@/components/landing/FeaturesSection"));
const BioShowcase = lazy(() => import("@/components/landing/BioShowcase"));
const AnalyticsSection = lazy(() => import("@/components/landing/AnalyticsSection"));
const DeveloperSection = lazy(() => import("@/components/landing/DeveloperSection"));
const ComparisonSection = lazy(() => import("@/components/landing/ComparisonSection"));
const BlogSection = lazy(() => import("@/components/landing/BlogSection"));
const FAQSection = lazy(() => import("@/components/landing/FAQSection"));
const CTASection = lazy(() => import("@/components/landing/CTASection"));
const Footer = lazy(() => import("@/components/landing/Footer"));

// Minimal height placeholder keeps layout stable while sections load
const SectionFallback = () => <div style={{ minHeight: "200px" }} />;

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
        <Suspense fallback={<SectionFallback />}>
          <FeaturesSection />
          <BioShowcase />
          <AnalyticsSection />
          <DeveloperSection />
          <ComparisonSection />
          <BlogSection />
          <FAQSection />
          <CTASection />
        </Suspense>
      </main>
      <Suspense fallback={<SectionFallback />}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Index;
