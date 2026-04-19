import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "ar";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (en: string, ar: string) => string;
  isAr: boolean;
}

const META = {
  en: {
    title: "snip.sa — Smart URL Shortener for Saudi Arabia",
    description:
      "The smartest URL shortener built for Saudi marketers and developers. Shorten links, generate QR codes, use custom domains, and track real-time analytics. Hosted in Saudi Arabia. PDPL compliant.",
  },
  ar: {
    title: "اختصار الروابط مجانًا | أفضل موقع اختصار الروابط snip.sa",
    description:
      "أفضل منصة اختصار الروابط للعرب. أنشئ روابط قصيرة تحمل علامتك التجارية مع تحليلات وتتبع الإحصاءات بسهولة. جرّب أداة اختصار الروابط مجانًا على snip.sa.",
  },
};

const applyMeta = (lang: Language) => {
  document.title = META[lang].title;
  const metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (metaDesc) metaDesc.content = META[lang].description;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>("en");

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = newLang;
    applyMeta(newLang);
  };

  // Apply on mount
  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    applyMeta(lang);
  }, []);

  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);
  const isAr = lang === "ar";

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isAr }}>
      <div dir={isAr ? "rtl" : "ltr"} className={isAr ? "font-arabic" : ""}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};