import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslation from './locales/en.json';
import arTranslation from './locales/ar.json';
import zhCNTranslation from './locales/zh-CN.json';
import esTranslation from './locales/es.json';
import hiTranslation from './locales/hi.json';
import frTranslation from './locales/fr.json';
import ptTranslation from './locales/pt.json';
import ruTranslation from './locales/ru.json';
import nlTranslation from './locales/nl.json';
import elTranslation from './locales/el.json';


const resources = {
  en: {
    translation: enTranslation
  },
  ar: {
    translation: arTranslation
  },
  'zh-CN': {
    translation: zhCNTranslation
  },
  es: {
    translation: esTranslation
  },
  hi: {
    translation: hiTranslation
  },
  fr: {
    translation: frTranslation
  },
  pt: {
    translation: ptTranslation
  },
  ru: {
    translation: ruTranslation
  },
  nl: {
    translation: nlTranslation
  },
  el: {
    translation: elTranslation
  }
};

// RTL languages list
const rtlLanguages = ['ar', 'he', 'ur', 'fa'];

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources,
    fallbackLng: 'en', // Use English if detected language is not available
    lng: localStorage.getItem('language') || 'en', // Default language
    supportedLngs: ['en', 'ar', 'zh-CN', 'es', 'hi', 'fr', 'pt', 'ru', 'nl', 'el'],
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
  document.documentElement.dir = rtlLanguages.includes(lng) ? 'rtl' : 'ltr';
  localStorage.setItem('language', lng);
});

// Set initial direction
const currentLanguage = i18n.language;
document.documentElement.dir = rtlLanguages.includes(currentLanguage) ? 'rtl' : 'ltr';
document.documentElement.lang = currentLanguage;

export default i18n;
