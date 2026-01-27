import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import "./TermsAndConditions.css";
import logo from '../assets/logo.png';


const TermsAndConditions = () => {
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
    <div className={`terms-page ${isRTL ? 'rtl' : 'ltr'}`}>
      <Header isLanding={true} onGetStarted={() => navigate("/login")} />
      
      <div className="terms-container">
        <div className="terms-content">
          <h1 className="terms-title">{t('terms.title')}</h1>
          <p className="terms-updated">{t('terms.lastUpdated')}</p>

          {/* Preamble */}
          <section id="preamble" className="terms-section">
            <h2>{t('terms.preamble.title')}</h2>
            <p>{t('terms.preamble.content')}</p>
          </section>

          {/* Introduction */}
          <section id="introduction" className="terms-section">
            <h2>{t('terms.introduction.title')}</h2>
            <p>{t('terms.introduction.content')}</p>
          </section>

          {/* 1. Definitions */}
          <section id="definitions" className="terms-section">
            <h2>{t('terms.definitions.title')}</h2>
            <ul>
              <li>{t('terms.definitions.services')}</li>
              <li>{t('terms.definitions.client')}</li>
              <li>{t('terms.definitions.applications')}</li>
              <li>{t('terms.definitions.website')}</li>
              <li>{t('terms.definitions.document')}</li>
            </ul>
          </section>

          {/* 2. Acceptance */}
          <section id="acceptance" className="terms-section">
            <h2>{t('terms.acceptance.title')}</h2>
            <p>{t('terms.acceptance.content')}</p>
          </section>

          {/* 3. Access */}
          <section id="access" className="terms-section">
            <h2>{t('terms.access.title')}</h2>
            <p>{t('terms.access.content')}</p>
          </section>

          {/* 4. Usage */}
          <section id="usage" className="terms-section">
            <h2>{t('terms.usage.title')}</h2>
            <ul>
              <li>{t('terms.usage.item1')}</li>
              <li>{t('terms.usage.item2')}</li>
              <li>{t('terms.usage.item3')}</li>
              <li>{t('terms.usage.item4')}</li>
            </ul>
          </section>

          {/* 5. Commencement */}
          <section className="terms-section">
            <h2>{t('terms.commencement.title')}</h2>
            <p>{t('terms.commencement.content')}</p>
          </section>

          {/* 6. Intellectual Property */}
          <section id="intellectual-property" className="terms-section">
            <h2>{t('terms.intellectualProperty.title')}</h2>
            <ul>
              <li>{t('terms.intellectualProperty.item1')}</li>
              <li>{t('terms.intellectualProperty.item2')}</li>
              <li>{t('terms.intellectualProperty.item3')}</li>
            </ul>
          </section>

          {/* 7. Pricing */}
          <section id="pricing" className="terms-section">
            <h2>{t('terms.pricing.title')}</h2>
            <ul>
              <li>{t('terms.pricing.pricingDesc')}</li>
              <li>{t('terms.pricing.paymentDesc')}</li>
            </ul>
          </section>

          {/* 8. Obligations */}
          <section id="obligations" className="terms-section">
            <h2>{t('terms.obligations.title')}</h2>
            <div className="terms-subsection">
              <h3>{t('terms.obligations.ourObligations')}</h3>
              <p>{t('terms.obligations.ourObligationsDesc')}</p>
            </div>
            <div className="terms-subsection">
              <h3>{t('terms.obligations.clientResponsibility')}</h3>
              <ul>
                <li>{t('terms.obligations.item1')}</li>
                <li>{t('terms.obligations.item2')}</li>
                <li>{t('terms.obligations.item3')}</li>
                <li>{t('terms.obligations.item4')}</li>
                <li>{t('terms.obligations.item5')}</li>
              </ul>
            </div>
          </section>

          {/* 9. Data Protection */}
          <section className="terms-section">
            <h2>{t('terms.dataProtection.title')}</h2>
            <ul>
              <li>{t('terms.dataProtection.item1')}</li>
              <li>{t('terms.dataProtection.item2')}</li>
              <li>{t('terms.dataProtection.item3')}</li>
              <li>{t('terms.dataProtection.item4')}</li>
              <li>{t('terms.dataProtection.item5')}</li>
            </ul>
          </section>

          {/* 10. Modifications */}
          <section className="terms-section">
            <h2>{t('terms.modifications.title')}</h2>
            <ul>
              <li>{t('terms.modifications.item1')}</li>
              <li>{t('terms.modifications.item2')}</li>
            </ul>
          </section>

          {/* 11. Support */}
          <section className="terms-section">
            <h2>{t('terms.support.title')}</h2>
            <ul>
              <li>{t('terms.support.item1')}</li>
              <li>{t('terms.support.item2')}</li>
            </ul>
          </section>

          {/* 12. Limitations */}
          <section className="terms-section">
            <h2>{t('terms.limitations.title')}</h2>
            <ul>
              <li>{t('terms.limitations.item1')}</li>
              <li>{t('terms.limitations.item2')}</li>
            </ul>
          </section>

          {/* 13. Termination */}
          <section className="terms-section">
            <h2>{t('terms.termination.title')}</h2>
            <ul>
              <li>{t('terms.termination.item1')}</li>
              <li>{t('terms.termination.item2')}</li>
            </ul>
          </section>

          {/* 14. Force Majeure */}
          <section className="terms-section">
            <h2>{t('terms.forceMajeure.title')}</h2>
            <p>{t('terms.forceMajeure.content')}</p>
          </section>

          {/* 15. Laws */}
          <section id="laws" className="terms-section">
            <h2>{t('terms.laws.title')}</h2>
            <ul>
              <li>{t('terms.laws.item1')}</li>
              <li>{t('terms.laws.item2')}</li>
              <li>{t('terms.laws.item3')}</li>
            </ul>
          </section>

          {/* 16. Delivery */}
          <section className="terms-section">
            <h2>{t('terms.delivery.title')}</h2>
            <ul>
              <li>{t('terms.delivery.item1')}</li>
              <li>{t('terms.delivery.item2')}</li>
            </ul>
          </section>

          {/* 17. Communication */}
          <section id="contact" className="terms-section">
            <h2>{t('terms.communication.title')}</h2>
            <p>{t('terms.communication.intro')}</p>
            <ul>
              <li>{t('terms.communication.email')}</li>
              <li>{t('terms.communication.phone')}</li>
            </ul>
          </section>

          {/* 18. External Links */}
          <section className="terms-section">
            <h2>{t('terms.externalLinks.title')}</h2>
            <p>{t('terms.externalLinks.content')}</p>
          </section>

          {/* 19. Refund */}
          <section id="refund" className="terms-section">
            <h2>{t('terms.refund.title')}</h2>
            <ul>
              <li>{t('terms.refund.item1')}</li>
              <li>{t('terms.refund.item2')}</li>
              <li>{t('terms.refund.item3')}</li>
              <li>{t('terms.refund.item4')}</li>
              <li>{t('terms.refund.item5')}</li>
            </ul>
          </section>

          {/* 20. Notices */}
          <section className="terms-section">
            <h2>{t('terms.notices.title')}</h2>
            <ul>
              <li>{t('terms.notices.item1')}</li>
              <li>{t('terms.notices.item2')}</li>
            </ul>
          </section>

          {/* Special Terms */}
          <section className="terms-section">
            <h2>{t('terms.specialTerms.title')}</h2>
            <p>{t('terms.specialTerms.content')}</p>
          </section>
        {/* </div> */}
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
    </div>
  );
};

export default TermsAndConditions;
