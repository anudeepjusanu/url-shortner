import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import "./PrivacyPolicy.css";

const PrivacyPolicy = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';

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
              <div >
                <div className="brand-logo">
                  {/* <div className="logo-icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="23"
                      height="18"
                      viewBox="0 0 23 18"
                      fill="none"
                    >
                      <g clip-path="url(#clip0_775_2784)">
                        <path
                          d="M20.3836 9.41141C22.37 7.42509 22.37 4.20829 20.3836 2.22196C18.6258 0.464147 15.8555 0.235631 13.834 1.68055L13.7778 1.71922C13.2715 2.08133 13.1555 2.78446 13.5176 3.28719C13.8797 3.78993 14.5829 3.90946 15.0856 3.54735L15.1418 3.50868C16.2704 2.7036 17.8137 2.83016 18.7911 3.81102C19.8985 4.91844 19.8985 6.71141 18.7911 7.81883L14.8465 11.7704C13.7391 12.8778 11.9461 12.8778 10.8387 11.7704C9.85786 10.7895 9.7313 9.24618 10.5364 8.12118L10.575 8.06493C10.9372 7.55868 10.8176 6.85555 10.3149 6.49696C9.81216 6.13837 9.10552 6.25438 8.74692 6.75712L8.70825 6.81337C7.25981 8.83134 7.48833 11.6016 9.24614 13.3595C11.2325 15.3458 14.4493 15.3458 16.4356 13.3595L20.3836 9.41141ZM2.11646 8.58876C0.130127 10.5751 0.130127 13.7919 2.11646 15.7782C3.87427 17.536 6.64458 17.7645 8.66606 16.3196L8.72231 16.2809C9.22857 15.9188 9.34458 15.2157 8.98247 14.713C8.62036 14.2102 7.91724 14.0907 7.4145 14.4528L7.35825 14.4915C6.22974 15.2966 4.68638 15.17 3.70903 14.1891C2.60161 13.0782 2.60161 11.2852 3.70903 10.1778L7.65356 6.22977C8.76099 5.12235 10.554 5.12235 11.6614 6.22977C12.6422 7.21063 12.7688 8.75399 11.9637 9.88251L11.925 9.93876C11.5629 10.445 11.6825 11.1481 12.1852 11.5067C12.6879 11.8653 13.3946 11.7493 13.7532 11.2466L13.7918 11.1903C15.2403 9.16883 15.0118 6.39852 13.254 4.64071C11.2676 2.65438 8.05083 2.65438 6.0645 4.64071L2.11646 8.58876Z"
                          fill="white"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_775_2784">
                          <path d="M0 0H22.5V18H0V0Z" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                  </div> */}
                  <span className="brand-name">Snip</span>
                </div>
                <p className="footer-description">
                  {t('footer.description')}
                </p>
                {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                <div className="social-links">
                  <a href="#" className="social-link">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M16 8.05A8.02 8.02 0 008.05 16v-5.61h1.62l.31-2h-1.93V6.75c0-.44.22-.87.91-.87h.87V4.29s-.79-.13-1.54-.13c-1.57 0-2.6.95-2.6 2.68v1.51H3.84v2h1.85V16A8.02 8.02 0 0016 8.05z"
                        fill="currentColor"
                      />
                    </svg>
                  </a>
                  <a href="#" className="social-link">
                    <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                      <path
                        d="M14 2.4c-.5.2-1.1.4-1.6.4.6-.4 1-.9 1.2-1.6-.5.3-1.1.5-1.8.7C11.3.9 10.5.5 9.7.5c-1.6 0-2.9 1.3-2.9 2.9 0 .2 0 .4.1.6C4.5 3.8 2.4 2.7.98 1c-.2.4-.3.8-.3 1.3 0 1 .5 1.9 1.3 2.4-.5 0-.9-.2-1.3-.4v.04c0 1.4 1 2.6 2.3 2.8-.2.1-.5.1-.8.1-.2 0-.4 0-.6-.1.4 1.3 1.6 2.2 3 2.2-1.1.9-2.5 1.4-4 1.4-.3 0-.5 0-.8-.04C1.4 11.2 3.1 11.7 5 11.7c6 0 9.3-5 9.3-9.3v-.4c.6-.5 1.2-1.1 1.7-1.8z"
                        fill="currentColor"
                      />
                    </svg>
                  </a>
                  <a href="#" className="social-link">
                    <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                      <path
                        d="M12.8 0H1.2C.5 0 0 .5 0 1.2v13.6c0 .7.5 1.2 1.2 1.2h13.6c.7 0 1.2-.5 1.2-1.2V1.2c0-.7-.5-1.2-1.2-1.2zM4.7 13.6H2.4V6h2.4v7.6zM3.6 5c-.8 0-1.4-.7-1.4-1.4S2.8 2.1 3.6 2.1s1.4.7 1.4 1.4-.6 1.5-1.4 1.5zm8.8 8.6H10V9.9c0-.9 0-2-1.2-2s-1.4.9-1.4 1.9v3.8H5V6h2.3v1c.3-.6 1.1-1.2 2.2-1.2 2.4 0 2.8 1.6 2.8 3.6v4.2z"
                        fill="currentColor"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <div className="footer-section">
              <h4>{t('footer.product')}</h4>
              <ul>
                <li>
                  <a href="#">{t('footer.features')}</a>
                </li>
                {/* <li>
                  <a href="#">{t('footer.pricing')}</a>
                </li> */}
                <li>
                  <a href="#">{t('footer.api')}</a>
                </li>
                <li>
                  <a href="#">{t('footer.integrations')}</a>
                </li>
              </ul>
            </div>

            <div className="footer-section">
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
            </div>

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
          </div>
        </div>
      </footer>

    </div>
  );
};

export default PrivacyPolicy;
