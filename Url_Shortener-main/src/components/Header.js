import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/Button';
import logo from '../assets/logo.png';
import { Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';

const Header = ({ isLanding = false }) => {
  const { t } = useTranslation();
  const { currentLanguage, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId) => {
    if (location.pathname !== '/') {
      navigate('/#' + sectionId);
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { label: t('header.features') || 'Features', action: () => scrollToSection('features') },
    // { label: t('header.about') || 'About', action: () => scrollToSection('about') },
    { label: t('header.contact') || 'Contact', action: () => scrollToSection('contact') },
    { label: t('footer.api') || 'API', action: () => navigate('/api-docs') },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img src={logo} alt="Logo" className="h-8 w-auto" />
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link, idx) => (
              <button 
                key={idx} 
                onClick={link.action}
                className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={toggleLanguage} className="font-semibold">
               {currentLanguage === 'ar' ? 'English' : 'العربية'}
            </Button>
            <Button variant="ghost" onClick={() => navigate('/login')}>
              {t('header.signIn') || 'Sign In'}
            </Button>
            <Button onClick={() => navigate('/register')}>
              {t('landing.hero.cta') || 'Get Started'}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
             <Button variant="ghost" size="sm" onClick={toggleLanguage} className="font-semibold px-2">
               {currentLanguage === 'ar' ? 'EN' : 'AR'}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background p-4 shadow-lg absolute w-full">
          <nav className="flex flex-col space-y-4">
            {navLinks.map((link, idx) => (
              <button 
                key={idx} 
                onClick={link.action}
                className="text-left text-sm font-medium text-slate-600 hover:text-primary py-2"
              >
                {link.label}
              </button>
            ))}
            <div className="pt-4 flex flex-col gap-2">
              <Button variant="outline" onClick={() => navigate('/login')} className="w-full justify-center">
                {t('header.signIn') || 'Sign In'}
              </Button>
              <Button onClick={() => navigate('/register')} className="w-full justify-center">
                {t('landing.hero.cta') || 'Get Started'}
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;