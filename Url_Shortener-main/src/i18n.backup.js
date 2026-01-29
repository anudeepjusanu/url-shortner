import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslation from './locales/en.json';
import arTranslation from './locales/ar.json';

const resources = {
  en: {
    translation: enTranslation
  },
  ar: {
    translation: arTranslation
  }
};

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources,
    fallbackLng: 'ar', // Use Arabic if detected language is not available
    lng: localStorage.getItem('language') || 'ar', // Default language
    debug: false, // Set to true for development debugging

    interpolation: {
      escapeValue: false // React already escapes values
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

// Listen for language changes and update HTML attributes
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  localStorage.setItem('language', lng);
});

// Set initial direction
const currentLanguage = i18n.language;
document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = currentLanguage;

export default i18n;
