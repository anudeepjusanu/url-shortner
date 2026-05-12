import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "ar";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (en: string, ar: string) => string;
  isAr: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "preferred_lang";

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved === "en" || saved === "ar") ? saved : "ar";
  });

  const setLang = (newLang: Language) => {
    localStorage.setItem(STORAGE_KEY, newLang);
    setLangState(newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = newLang;
  };

  // Apply direction and language on mount
  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
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