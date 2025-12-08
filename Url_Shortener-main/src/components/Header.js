import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import HamburgerMenu from './HamburgerMenu';

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
          { label: t('header.pricing'), path: 'pricing', icon: null },
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
              <div className="logo-icon">
                <svg width="23" height="18" viewBox="0 0 23 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_775_2665)">
                    <path d="M20.3836 9.41132C22.37 7.42499 22.37 4.2082 20.3836 2.22187C18.6258 0.464055 15.8555 0.23554 13.834 1.68046L13.7778 1.71913C13.2715 2.08124 13.1555 2.78437 13.5176 3.2871C13.8797 3.78984 14.5829 3.90937 15.0856 3.54726L15.1418 3.50859C16.2704 2.70351 17.8137 2.83007 18.7911 3.81093C19.8985 4.91835 19.8985 6.71132 18.7911 7.81874L14.8465 11.7703C13.7391 12.8777 11.9461 12.8777 10.8387 11.7703C9.85786 10.7894 9.7313 9.24609 10.5364 8.12109L10.575 8.06484C10.9372 7.55859 10.8176 6.85546 10.3149 6.49687C9.81216 6.13827 9.10552 6.25429 8.74692 6.75702L8.70825 6.81327C7.25981 8.83124 7.48833 11.6016 9.24614 13.3594C11.2325 15.3457 14.4493 15.3457 16.4356 13.3594L20.3836 9.41132ZM2.11646 8.58867C0.130127 10.575 0.130127 13.7918 2.11646 15.7781C3.87427 17.5359 6.64458 17.7644 8.66606 16.3195L8.72231 16.2809C9.22857 15.9187 9.34458 15.2156 8.98247 14.7129C8.62036 14.2101 7.91724 14.0906 7.4145 14.4527L7.35825 14.4914C6.22974 15.2965 4.68638 15.1699 3.70903 14.1891C2.60161 13.0781 2.60161 11.2851 3.70903 10.1777L7.65356 6.22968C8.76099 5.12226 10.554 5.12226 11.6614 6.22968C12.6422 7.21054 12.7688 8.7539 11.9637 9.88241L11.925 9.93867C11.5629 10.4449 11.6825 11.148 12.1852 11.5066C12.6879 11.8652 13.3946 11.7492 13.7532 11.2465L13.7918 11.1902C15.2403 9.16874 15.0118 6.39843 13.254 4.64062C11.2676 2.65429 8.05083 2.65429 6.0645 4.64062L2.11646 8.58867Z" fill="#2f4f97"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_775_2665">
                      <path d="M0 0H22.5V18H0V0Z" fill="white"/>
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <span className="logo-text landing">LinkSA</span>
            </div>
          </div>
          <div className="header-center">
            <nav className="landing-nav">
              <button onClick={() => scrollToSection('features')} className="nav-link">{t('header.features')}</button>
              <button onClick={() => scrollToSection('about')} className="nav-link">{t('header.about')}</button>
              <button onClick={() => scrollToSection('pricing')} className="nav-link">{t('header.pricing')}</button>
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
          <div className="logo-icon">
            <svg width="17.5" height="14" viewBox="0 0 17.5 14" fill="none">
              <path d="M8.75 7L1.75 1L15.75 1L8.75 7Z" fill="white" />
            </svg>
          </div>
          <span className="logo-text">LinkSA</span>
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