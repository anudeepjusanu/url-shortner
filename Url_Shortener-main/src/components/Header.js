import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import HamburgerMenu from './HamburgerMenu';
import logo from '../assets/logo.png';

const Header = ({ isLanding = false, onGetStarted }) => {
  const { t } = useTranslation();
  const { currentLanguage, toggleLanguage } = useLanguage();

  const scrollToSection = (sectionId) => {
    // Check if we're on the landing page
    const isOnLandingPage = window.location.pathname === '/';
    const isOnPrivacyPage = window.location.pathname === '/privacy-policy';
    const isOnTermsPage = window.location.pathname === '/terms-and-conditions';

    // If we're on a different page, navigate to landing page with hash
    if (!isOnLandingPage && !isOnPrivacyPage && !isOnTermsPage) {
      window.location.href = `/#${sectionId}`;
      return;
    }

    // If we're on privacy or terms page and clicking features/about/pricing/contact
    // navigate to landing page
    if ((isOnPrivacyPage || isOnTermsPage) && 
        ['features', 'about', 'pricing', 'contact'].includes(sectionId)) {
      window.location.href = `/#${sectionId}`;
      return;
    }

    // Otherwise, scroll to the section on current page
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80; // Account for fixed header
      const elementPosition = element.offsetTop;
      const offsetPosition = elementPosition - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };
  if (isLanding) {
    const landingNavItems = [
      {
        label: t('header.navigation'),
        items: [
          { label: t('header.features'), path: 'features', icon: null },
          // { label: t('header.pricing'), path: 'pricing', icon: null },
          { label: t('header.about'), path: 'about', icon: null },
          { label: t('header.contact'), path: 'contact', icon: null }
        ]
      }
    ];

    const landingHeaderItems = (
      <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
        <div className="language-toggle">
          <button
            className={`language-btn ${currentLanguage === 'en' ? 'active' : ''}`}
            onClick={toggleLanguage}
          >
            EN
          </button>
          <button
            className={`language-btn ${currentLanguage === 'ar' ? 'active' : ''}`}
            onClick={toggleLanguage}
          >
            AR
          </button>
        </div>
        <button
          className="sign-in-btn mobile-sign-in"
          onClick={onGetStarted}
          style={{ width: '100%', marginTop: '12px' }}
        >
          {t('header.signIn')}
        </button>
      </div>
    );

    return (
      <header className="landing-header">
        <div className="landing-header-container">
          <div className="header-left">
            <div className="hamburger-wrapper hide-desktop">
              <HamburgerMenu
                sidebarItems={landingNavItems}
                headerItems={landingHeaderItems}
              />
            </div>
            <div className="logo-section">
              <img 
                src={logo} 
                alt="Snip Logo" 
                className="header-logo-img"
              />
            </div>
          </div>
          <div className="header-center">
            <nav className="landing-nav">
              <button onClick={() => scrollToSection('features')} className="nav-link">{t('header.features')}</button>
              <button onClick={() => scrollToSection('about')} className="nav-link">{t('header.about')}</button>
              {/* <button onClick={() => scrollToSection('pricing')} className="nav-link">{t('header.pricing')}</button> */}
              <button onClick={() => scrollToSection('contact')} className="nav-link">{t('header.contact')}</button>
            </nav>
          </div>
          <div className="create-link-header-right">
            {/* <div className="language-toggle landing">
              <button
                className={`language-btn ${currentLanguage === 'en' ? 'active' : ''}`}
                onClick={toggleLanguage}
              >
                EN
              </button>
              <button
                className={`language-btn ${currentLanguage === 'ar' ? 'active' : ''}`}
                onClick={toggleLanguage}
              >
                AR
              </button>
            </div> */}
                  <div className="create-link-language-toggle">
        <button
          className={`create-link-lang-btn ${currentLanguage === 'en' ? 'active' : ''}`}
          onClick={toggleLanguage}
        >
          EN
        </button>
        <button
          className={`create-link-lang-btn ${currentLanguage === 'ar' ? 'active' : ''}`}
          onClick={toggleLanguage}
        >
          AR
        </button>
      </div>


            <button className="sign-in-btn" onClick={onGetStarted}>
              {t('header.signIn')}
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo-section">
          <img 
            src={logo} 
            alt="Snip Logo" 
            className="header-logo-img"
          />
        </div>
        
        <div className="header-actions">
          <div className="language-toggle">
            <button
              className={`language-btn ${currentLanguage === 'en' ? 'active' : ''}`}
              onClick={toggleLanguage}
            >
              EN
            </button>
            <button
              className={`language-btn ${currentLanguage === 'ar' ? 'active' : ''}`}
              onClick={toggleLanguage}
            >
              AR
            </button>
          </div>
          <div className="user-profile">
            <div className="user-avatar">
              <img src="/api/placeholder/32/32" alt="User" />
            </div>
            <span className="user-name">Ahmed Al-Rashid</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;