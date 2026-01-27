import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import logo from '../assets/logo.png';
import "./PrivacyPolicy.css";

const PrivacyPolicy = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  
  const scrollToSection = (sectionId) => {
    // Check if we're on the landing page
    const isOnLandingPage = window.location.pathname === '/';
    const isOnPrivacyPage = window.location.pathname === '/privacy-policy';
    const isOnTermsPage = window.location.pathname === '/terms-and-conditions';

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


  return (
    <div className={`privacy-page ${isRTL ? 'rtl' : 'ltr'}`}>
      <Header isLanding={true} onGetStarted={() => navigate("/login")} />
      
      <div className="privacy-container">
        <div className="privacy-content">
          <h1 className="privacy-title">{t('privacy.title')}</h1>
          <p className="privacy-updated">{t('privacy.lastUpdated')}</p>

          {/* Clause 1: Introduction */}
          <section id="introduction" className="privacy-section">
            <h2>{t('privacy.intro.title')}</h2>
            <p>{t('privacy.intro.content')}</p>
          </section>

          {/* Clause 2: Data Collection */}
          <section id="data-collection" className="privacy-section">
            <h2>{t('privacy.dataCollection.title')}</h2>
            <ul>
              <li>{t('privacy.dataCollection.item1')}</li>
              <li>{t('privacy.dataCollection.item2')}</li>
              <li>{t('privacy.dataCollection.item3')}</li>
            </ul>
          </section>

          {/* Clause 3: Purpose */}
          <section id="purpose" className="privacy-section">
            <h2>{t('privacy.purpose.title')}</h2>
            <p>{t('privacy.purpose.intro')}</p>
            <ul>
              <li>{t('privacy.purpose.item1')}</li>
              <li>{t('privacy.purpose.item2')}</li>
              <li>{t('privacy.purpose.item3')}</li>
              <li>{t('privacy.purpose.item4')}</li>
              <li>{t('privacy.purpose.item5')}</li>
            </ul>
          </section>

          {/* Clause 4: Methods */}
          <section id="methods" className="privacy-section">
            <h2>{t('privacy.methods.title')}</h2>
            <ul>
              <li>{t('privacy.methods.item1')}</li>
              <li>{t('privacy.methods.item2')}</li>
            </ul>
          </section>

          {/* Clause 5: Storage */}
          <section id="storage" className="privacy-section">
            <h2>{t('privacy.storage.title')}</h2>
            <p>{t('privacy.storage.content')}</p>
          </section>

          {/* Clause 6: Legal Basis */}
          <section id="legal-basis" className="privacy-section">
            <h2>{t('privacy.legalBasis.title')}</h2>
            <p>{t('privacy.legalBasis.content')}</p>
            <ul>
              <li>{t('privacy.legalBasis.email')}</li>
              <li>{t('privacy.legalBasis.phone')}</li>
            </ul>
          </section>

          {/* Clause 7: Rights */}
          <section id="rights" className="privacy-section">
            <h2>{t('privacy.rights.title')}</h2>
            
            <div className="privacy-subsection">
              <h3>{t('privacy.rights.rightToKnow.title')}</h3>
              <p>{t('privacy.rights.rightToKnow.content')}</p>
            </div>

            <div className="privacy-subsection">
              <h3>{t('privacy.rights.rightToAccess.title')}</h3>
              <p>{t('privacy.rights.rightToAccess.content')}</p>
            </div>

            <div className="privacy-subsection">
              <h3>{t('privacy.rights.rightToCorrect.title')}</h3>
              <p>{t('privacy.rights.rightToCorrect.content')}</p>
            </div>

            <div className="privacy-subsection">
              <h3>{t('privacy.rights.rightToDelete.title')}</h3>
              <p>{t('privacy.rights.rightToDelete.content')}</p>
            </div>

            <div className="privacy-subsection">
              <h3>{t('privacy.rights.rightToWithdraw.title')}</h3>
              <p>{t('privacy.rights.rightToWithdraw.content')}</p>
            </div>

            <p className="privacy-note">{t('privacy.rights.note')}</p>
          </section>

          {/* Clause 8: Sharing */}
          <section id="sharing" className="privacy-section">
            <h2>{t('privacy.sharing.title')}</h2>
            <p>{t('privacy.sharing.content')}</p>
          </section>

          {/* Clause 9: Exercising Rights */}
          <section id="exercising" className="privacy-section">
            <h2>{t('privacy.exercising.title')}</h2>
            <p>{t('privacy.exercising.content')}</p>
            <ul>
              <li>{t('privacy.exercising.email')}</li>
              <li>{t('privacy.exercising.phone')}</li>
            </ul>
          </section>

          {/* Clause 10: Complaints */}
          <section id="complaints" className="privacy-section">
            <h2>{t('privacy.complaints.title')}</h2>
            <p>{t('privacy.complaints.content')}</p>
            <ul>
              <li>{t('privacy.complaints.email')}</li>
              <li>{t('privacy.complaints.phone')}</li>
            </ul>
          </section>

          {/* Clause 11: Updates */}
          <section id="updates" className="privacy-section">
            <h2>{t('privacy.updates.title')}</h2>
            <p>{t('privacy.updates.content')}</p>
          </section>
        </div>
      </div>

      {/* Footer */}
      {/* <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="brand-logo">
                <span className="brand-name">Snip</span>
              </div>
              <p className="footer-description">{t('footer.description')}</p>
            </div>

            <div className="footer-section">
              <h4>{t('footer.product')}</h4>
              <ul>
                <li><a href="/#features">{t('footer.features')}</a></li>
                <li><a href="/#pricing">{t('footer.pricing')}</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>{t('footer.legal')}</h4>
              <ul>
                <li><a href="/privacy-policy">{t('footer.privacy')}</a></li>
                <li><a href="/terms-and-conditions">{t('footer.terms')}</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>{t('footer.company')}</h4>
              <ul>
                <li><a href="/#about">{t('footer.about')}</a></li>
                <li><a href="/#contact">{t('footer.contact')}</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>{t('footer.copyright')}</p>
          </div>
        </div>
      </footer> */}
      <footer id="contact" className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <div>
                <div className="brand-logo footer-brand-logo">
                  <img 
                    src={logo} 
                    alt="Snip Logo" 
                    className="footer-logo-img"
                  />
                </div>
                <p className="footer-description">
                  {t('footer.description')}
                </p>
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <div className="social-links">
                  <a href="https://www.facebook.com/snip.saa/" className="social-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M13.5 9H16V6h-2.5C11.6 6 10 7.6 10 9.5V12H8v3h2v7h3v-7h2.5l.5-3H13V9.5c0-.3.2-.5.5-.5z"
                      fill="currentColor"
                    />
                  </svg>

                  </a>
                  <a href="https://x.com/snipsaweb" className="social-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M18.9 2H22l-7.1 8.1L23 22h-6.3l-5-6.6L6 22H2.9l7.6-8.7L1 2h6.4l4.6 6L18.9 2z"
                        fill="currentColor"
                      />
                    </svg>
                  </a>
                  <a href="https://www.linkedin.com/company/snipweb" className="social-link">
                    <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                      <path
                        d="M12.8 0H1.2C.5 0 0 .5 0 1.2v13.6c0 .7.5 1.2 1.2 1.2h13.6c.7 0 1.2-.5 1.2-1.2V1.2c0-.7-.5-1.2-1.2-1.2zM4.7 13.6H2.4V6h2.4v7.6zM3.6 5c-.8 0-1.4-.7-1.4-1.4S2.8 2.1 3.6 2.1s1.4.7 1.4 1.4-.6 1.5-1.4 1.5zm8.8 8.6H10V9.9c0-.9 0-2-1.2-2s-1.4.9-1.4 1.9v3.8H5V6h2.3v1c.3-.6 1.1-1.2 2.2-1.2 2.4 0 2.8 1.6 2.8 3.6v4.2z"
                        fill="currentColor"
                      />
                    </svg>
                  </a>
                  <a href="https://www.instagram.com/snip.saa/" className="social-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M7 2h10c2.8 0 5 2.2 5 5v10c0 2.8-2.2 5-5 5H7c-2.8 0-5-2.2-5-5V7c0-2.8 2.2-5 5-5zm10 2H7c-1.7 0-3 1.3-3 3v10c0 1.7 1.3 3 3 3h10c1.7 0 3-1.3 3-3V7c0-1.7-1.3-3-3-3z"
                        fill="currentColor"
                      />
                      <path
                        d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"
                        fill="currentColor"
                      />
                      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
                    </svg>

                  </a>
                </div>
              </div>
            </div>

            <div className="footer-section">
              <h4>{t('footer.product')}</h4>
              <ul>
                <li>
                  <button onClick={() => scrollToSection('features')} style={{background: 'none', border: 'none', padding: 0, color: '#9ca3af', fontSize: "16px", cursor: 'pointer',  textAlign: 'left'}}>{t('footer.features')}</button>
                </li>
                {/* <li>
                  <button onClick={() => scrollToSection('pricing')} style={{background: 'none', border: 'none', padding: 0, color: 'inherit', cursor: 'pointer', font: 'inherit', textAlign: 'left'}}>{t('footer.pricing')}</button>
                </li> */}
                <li>
                  <a href="/api-docs">{t('footer.api')}</a>
                </li>
                {/* <li>
                  <button onClick={() => scrollToSection('features')} style={{background: 'none', border: 'none', padding: 0, color: 'inherit', cursor: 'pointer', font: 'inherit', textAlign: 'left'}}>{t('footer.integrations')}</button>
                </li> */}
              </ul>
            </div>

            {/* <div className="footer-section">
              <h4>{t('footer.company')}</h4>
              <ul>
                <li>
                  <a href="#">{t('footer.about')}</a>
                </li>
                <li>
                  <a href="#">{t('footer.careers')}</a>
                </li>
                <li>
                  <a href="#">{t('footer.blog')}</a>
                </li>
                <li>
                  <a href="#">{t('footer.contact')}</a>
                </li>
              </ul>
            </div> */}

            <div className="footer-section">
              <h4>{t('footer.legal')}</h4>
              <ul>
                <li>
                  <a href="/privacy-policy">{t('footer.privacy')}</a>
                </li>
                <li>
                  <a href="/terms-and-conditions">{t('footer.terms')}</a>
                </li>
                {/* <li>
                  <a href="#">{t('footer.pdplCompliance')}</a>
                </li>
                <li>
                  <a href="#">{t('footer.security')}</a>
                </li> */}
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>
              {t('footer.copyright')}
            </p>
            <a href="tel:+9660115108347" className="footer-phone">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              +966 0115108347
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default PrivacyPolicy;
