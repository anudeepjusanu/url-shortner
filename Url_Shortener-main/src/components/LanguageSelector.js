import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

const LanguageSelector = ({ variant = 'default', className = '' }) => {
  const { currentLanguage, changeLanguage } = useLanguage();
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const languageRef = useRef(null);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

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

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutsideButton = buttonRef.current && !buttonRef.current.contains(event.target);
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(event.target);
      
      if (isOutsideButton && isOutsideDropdown) {
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

  // Update dropdown position when menu opens
  useEffect(() => {
    if (languageMenuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 256; // w-64 = 256px
      
      if (isMobile) {
        // On mobile, center the dropdown or position from left edge with padding
        const leftPos = Math.max(16, Math.min(rect.left, window.innerWidth - dropdownWidth - 16));
        setDropdownStyle({
          position: 'fixed',
          top: rect.bottom + 8,
          left: leftPos,
          width: Math.min(dropdownWidth, window.innerWidth - 32),
          zIndex: 99999
        });
      } else {
        // On desktop, align to right edge of button
        setDropdownStyle({
          position: 'fixed',
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right,
          zIndex: 99999
        });
      }
    }
  }, [languageMenuOpen, isMobile]);

  const handleToggle = (e) => {
    e.stopPropagation();
    setLanguageMenuOpen(!languageMenuOpen);
  };

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

  const dropdownContent = languageMenuOpen ? (
    <div 
      ref={dropdownRef}
      className="bg-white rounded-xl py-2 max-h-80 overflow-y-auto"
      style={{
        ...dropdownStyle,
        width: isMobile ? dropdownStyle.width : 256,
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
        border: '1px solid #E5E7EB',
        animation: 'dropdownFadeIn 0.2s ease'
      }}
    >
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => {
            changeLanguage(lang.code);
            setLanguageMenuOpen(false);
          }}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
            "hover:bg-slate-100",
            currentLanguage === lang.code && "bg-blue-50"
          )}
          style={{ 
            border: 'none', 
            background: currentLanguage === lang.code ? '#EFF6FF' : 'transparent',
            cursor: 'pointer',
            borderRadius: '8px',
            margin: '2px 6px',
            width: 'calc(100% - 12px)'
          }}
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
  ) : null;

  return (
    <>
      <div ref={languageRef} className={cn("relative", className)}>
        <button
          ref={buttonRef}
          onClick={handleToggle}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-full border-2 transition-all duration-200",
            "hover:bg-slate-50 hover:border-slate-300",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            languageMenuOpen ? "border-blue-500 bg-blue-50" : "border-transparent"
          )}
          style={{ cursor: 'pointer' }}
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
      </div>
      {dropdownContent && createPortal(dropdownContent, document.body)}
    </>
  );
};

export default LanguageSelector;
