import React from 'react';
import './AnalyticsHeader.css';

const AnalyticsHeader = () => {
  return (
    <header className="analytics-header">
      <div className="header-content">
        <div className="header-left">
          <div className="header-brand">
            <div className="brand-icon">
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="14" viewBox="0 0 18 14" fill="none">
  <g clip-path="url(#clip0_775_1012)">
    <path d="M15.8538 7.31992C17.3987 5.775 17.3987 3.27305 15.8538 1.72812C14.4866 0.360937 12.3319 0.183202 10.7597 1.30703L10.7159 1.33711C10.3222 1.61875 10.2319 2.16562 10.5136 2.55664C10.7952 2.94766 11.3421 3.04062 11.7331 2.75898L11.7769 2.72891C12.6546 2.10273 13.855 2.20117 14.6151 2.96406C15.4765 3.82539 15.4765 5.21992 14.6151 6.08125L11.5472 9.15469C10.6858 10.016 9.29131 10.016 8.42998 9.15469C7.66709 8.3918 7.56865 7.19141 8.19482 6.31641L8.2249 6.27266C8.50654 5.87891 8.41357 5.33203 8.02256 5.05312C7.63154 4.77422 7.08193 4.86445 6.80303 5.25547L6.77295 5.29922C5.64639 6.86875 5.82412 9.02344 7.19131 10.3906C8.73623 11.9355 11.2382 11.9355 12.7831 10.3906L15.8538 7.31992ZM1.646 6.68008C0.101074 8.225 0.101074 10.727 1.646 12.2719C3.01318 13.6391 5.16787 13.8168 6.74014 12.693L6.78389 12.6629C7.17764 12.3812 7.26787 11.8344 6.98623 11.4434C6.70459 11.0523 6.15771 10.9594 5.7667 11.241L5.72295 11.2711C4.84521 11.8973 3.64482 11.7988 2.88467 11.0359C2.02334 10.1719 2.02334 8.77734 2.88467 7.91602L5.95264 4.84531C6.81396 3.98398 8.2085 3.98398 9.06982 4.84531C9.83272 5.6082 9.93115 6.80859 9.30498 7.68633L9.2749 7.73008C8.99326 8.12383 9.08623 8.6707 9.47725 8.94961C9.86826 9.22851 10.4179 9.13828 10.6968 8.74726L10.7269 8.70352C11.8534 7.13125 11.6757 4.97656 10.3085 3.60937C8.76357 2.06445 6.26162 2.06445 4.7167 3.60937L1.646 6.68008Z" fill="white"/>
  </g>
  <defs>
    <clipPath id="clip0_775_1012">
      <path d="M0 0H17.5V14H0V0Z" fill="white"/>
    </clipPath>
  </defs>
</svg>
            </div>
            <span className="brand-text">LinkSA</span>
          </div>
        </div>
        <div className="header-right">
          <div className="language-toggle">
            <button className="lang-btn active">EN</button>
            <button className="lang-btn">AR</button>
          </div>
          <div className="user-avatar">
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face&auto=format" alt="User" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AnalyticsHeader;