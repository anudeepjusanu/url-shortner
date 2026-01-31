import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

const LanguageSelector = ({ variant = 'default', className = '' }) => {
  const { currentLanguage, changeLanguage } = useLanguage();
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const languageRef = useRef(null);

  // Language options with flags and native names
  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
    { code: 'zh-CN', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
    { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
    { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
    { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
    { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
    { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' }
  ];

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setLanguageMenuOpen(false);
      }
    };

    if (languageMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [languageMenuOpen]);

  if (variant === 'simple') {
    // Simple variant for mobile/compact views
    return (
      <button
        onClick={() => changeLanguage(currentLanguage === 'en' ? 'ar' : 'en')}
        className={cn("flex items-center gap-2 text-sm font-medium transition-colors", className)}
      >
        <Globe className="h-4 w-4" />
        {currentLanguage === 'en' ? 'العربية' : 'English'}
      </button>
    );
  }

  return (
    <div ref={languageRef} className={cn("relative", className)}>
      <button
        onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 relative z-[101]",
          "hover:border-blue-300 hover:bg-blue-50",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          languageMenuOpen && "border-blue-500 bg-blue-50"
        )}
      >
        <span className="text-xl">{currentLang.flag}</span>
        <span className="text-sm font-medium text-slate-700">{currentLang.nativeName}</span>
        <ChevronDown 
          className={cn(
            "h-4 w-4 text-slate-500 transition-transform duration-200",
            languageMenuOpen && "rotate-180"
          )} 
        />
      </button>

      {languageMenuOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-[9999] max-h-96 overflow-y-auto">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                changeLanguage(lang.code);
                setLanguageMenuOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                "hover:bg-blue-50",
                currentLanguage === lang.code && "bg-blue-50"
              )}
            >
              <span className="text-xl">{lang.flag}</span>
              <div className="flex-1">
                <div className={cn(
                  "text-sm font-medium",
                  currentLanguage === lang.code ? "text-blue-600" : "text-slate-900"
                )}>
                  {lang.nativeName}
                </div>
                <div className="text-xs text-slate-500">{lang.name}</div>
              </div>
              {currentLanguage === lang.code && (
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
