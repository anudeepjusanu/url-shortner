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

// Function to update meta tags based on language
const updateMetaTags = (lng) => {
  const metaTags = {
    ar: {
      title: 'اختصار الروابط مجانًا | أفضل موقع اختصار الروابط snip.sa',
      description: 'أفضل منصة اختصار الروابط للعرب. أنشئ روابط قصيرة تحمل علامتك التجارية مع تحليلات وتتبع الإحصاءات بسهولة. جرّب أداة اختصار الروابط مجانًا على snip.sa.'
    },
    en: {
      title: 'Snip - Saudi Arabia\'s Trusted URL Shortener | Link Management & Analytics',
      description: 'Snip is Saudi Arabia\'s leading URL shortener with advanced analytics, custom domains, QR codes, and PDPL compliance. Create short, branded links and track performance in real-time. Data hosted 100% in KSA.'
    }
  };

  const tags = metaTags[lng] || metaTags.en;
  
  // Update title
  document.title = tags.title;
  
  // Update meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', tags.description);
  }
  
  // Update meta title
  const metaTitle = document.querySelector('meta[name="title"]');
  if (metaTitle) {
    metaTitle.setAttribute('content', tags.title);
  }
  
  // Update Open Graph title
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    ogTitle.setAttribute('content', tags.title);
  }
  
  // Update Open Graph description
  const ogDescription = document.querySelector('meta[property="og:description"]');
  if (ogDescription) {
    ogDescription.setAttribute('content', tags.description);
  }
  
  // Update Twitter title
  const twitterTitle = document.querySelector('meta[property="twitter:title"]');
  if (twitterTitle) {
    twitterTitle.setAttribute('content', tags.title);
  }
  
  // Update Twitter description
  const twitterDescription = document.querySelector('meta[property="twitter:description"]');
  if (twitterDescription) {
    twitterDescription.setAttribute('content', tags.description);
  }
};

// Listen for language changes and update HTML attributes
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  localStorage.setItem('language', lng);
  updateMetaTags(lng);
});

// Set initial direction and meta tags
const currentLanguage = i18n.language;
document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = currentLanguage;
updateMetaTags(currentLanguage);

export default i18n;
