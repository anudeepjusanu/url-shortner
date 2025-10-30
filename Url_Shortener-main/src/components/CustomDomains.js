import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomDomainsSidebar from './CustomDomainsSidebar';
import './CustomDomains.css';

const CustomDomains = () => {
  const navigate = useNavigate();
  const [domainName, setDomainName] = useState('');

  const handleAddDomain = () => {
    if (domainName.trim()) {
      console.log('Adding domain:', domainName);
      // Add domain logic here
      setDomainName('');
    }
  };

  const handleVerifyDomain = (domain) => {
    console.log('Verifying domain:', domain);
    // Verify domain logic here
  };

  const handleDomainSettings = (domain) => {
    console.log('Opening settings for:', domain);
    // Domain settings logic here
  };

  const handleRemoveDomain = (domain) => {
    console.log('Removing domain:', domain);
    // Remove domain logic here
  };

  return (
    <div className="dashboard-container">
      {/* Custom Domains Sidebar Component */}
      <CustomDomainsSidebar />

      {/* Main Content Area */}
      <div className="main-area">
        {/* Header */}
        <header className="header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title">Custom Domains</h1>
              <div className="language-toggle">
                <button className="lang-btn active">EN</button>
                <button className="lang-btn">AR</button>
              </div>
            </div>
            <div className="header-right">
              <div className="notification-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="18" viewBox="0 0 16 18" fill="none">
                  <g clipPath="url(#clip0_775_451)">
                    <path d="M7.87495 0C7.25268 0 6.74995 0.502734 6.74995 1.125V1.7543C4.20112 2.15859 2.24995 4.36641 2.24995 7.03125V8.20547C2.24995 9.80156 1.70502 11.352 0.710103 12.5965L0.186274 13.2539C-0.0176318 13.507 -0.0563037 13.8551 0.0843213 14.1469C0.224946 14.4387 0.520259 14.625 0.843696 14.625H14.9062C15.2296 14.625 15.5249 14.4387 15.6656 14.1469C15.8062 13.8551 15.7675 13.507 15.5636 13.2539L15.0398 12.6C14.0449 11.352 13.4999 9.80156 13.4999 8.20547V7.03125C13.4999 4.36641 11.5488 2.15859 8.99995 1.7543V1.125C8.99995 0.502734 8.49721 0 7.87495 0ZM7.87495 3.375H8.1562C10.1742 3.375 11.8124 5.01328 11.8124 7.03125V8.20547C11.8124 9.88945 12.3011 11.5312 13.2081 12.9375H2.54174C3.44877 11.5312 3.93745 9.88945 3.93745 8.20547V7.03125C3.93745 5.01328 5.57573 3.375 7.5937 3.375H7.87495ZM10.1249 15.75H7.87495H5.62495C5.62495 16.3477 5.86049 16.9207 6.28237 17.3426C6.70424 17.7645 7.27729 18 7.87495 18C8.4726 18 9.04565 17.7645 9.46752 17.3426C9.8894 16.9207 10.1249 16.3477 10.1249 15.75Z" fill="#6B7280"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_775_451">
                      <path d="M0 0H15.75V18H0V0Z" fill="white"/>
                    </clipPath>
                  </defs>
                </svg>
                <div className="notification-dot"></div>
              </div>
              <div className="user-avatar">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face&auto=format" alt="User" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="main-content">
          {/* Breadcrumb */}
          <div className="breadcrumb">
            <span className="breadcrumb-item" onClick={() => navigate('/dashboard')}>Dashboard</span>
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L5 5L1 9" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="breadcrumb-item active">Custom Domains</span>
          </div>

          {/* Page Description */}
          <div className="page-description">
            <p>Add your own branded domains to create professional short links that match your brand.</p>
          </div>

          {/* Add New Domain Section */}
          <div className="add-domain-section">
            <h3>Add New Domain</h3>
            <div className="add-domain-form">
              <div className="form-group">
                <label htmlFor="domainName">Domain Name</label>
                <input
                  type="text"
                  id="domainName"
                  placeholder="brand.sa"
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value)}
                  className="domain-input"
                />
              </div>
              <button className="add-domain-btn" onClick={handleAddDomain}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 3.33334V12.6667M3.33334 8H12.6667" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Add Domain
              </button>
            </div>
          </div>

          {/* DNS Configuration Section */}
          <div className="dns-configuration">
            <div className="dns-header">
              <h3>DNS Configuration</h3>
              <div className="dns-warning">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.00003 1.16666L12.8334 12.8333H1.16669L7.00003 1.16666Z" stroke="#F59E0B" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 5.25V7.58334" stroke="#F59E0B" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 9.91666H7.00584" stroke="#F59E0B" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Configure DNS records to verify domain ownership
              </div>
            </div>
            
            <div className="dns-record">
              <h4>One CNAME Record (Required for link redirection) needs to be added</h4>
              <div className="dns-table">
                <div className="dns-table-header">
                  <div className="dns-col">Type</div>
                  <div className="dns-col">Name</div>
                  <div className="dns-col">Value</div>
                </div>
                <div className="dns-table-row">
                  <div className="dns-col">
                    <span className="dns-type">CNAME</span>
                    <button className="copy-btn" title="Copy">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.6667 5.25H6.41667C5.86438 5.25 5.41667 5.69772 5.41667 6.25V11.5C5.41667 12.0523 5.86438 12.5 6.41667 12.5H11.6667C12.219 12.5 12.6667 12.0523 12.6667 11.5V6.25C12.6667 5.69772 12.219 5.25 11.6667 5.25Z" stroke="#3B82F6" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2.75 8.75H2.33333C1.96514 8.75 1.66667 8.45152 1.66667 8.08333V2.33333C1.66667 1.96514 1.96514 1.66667 2.33333 1.66667H8.08333C8.45152 1.66667 8.75 1.96514 8.75 2.33333V2.75" stroke="#3B82F6" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  <div className="dns-col">
                    <span className="dns-name">Marketing.sa</span>
                    <button className="copy-btn" title="Copy">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.6667 5.25H6.41667C5.86438 5.25 5.41667 5.69772 5.41667 6.25V11.5C5.41667 12.0523 5.86438 12.5 6.41667 12.5H11.6667C12.219 12.5 12.6667 12.0523 12.6667 11.5V6.25C12.6667 5.69772 12.219 5.25 11.6667 5.25Z" stroke="#3B82F6" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2.75 8.75H2.33333C1.96514 8.75 1.66667 8.45152 1.66667 8.08333V2.33333C1.66667 1.96514 1.96514 1.66667 2.33333 1.66667H8.08333C8.45152 1.66667 8.75 1.96514 8.75 2.33333V2.75" stroke="#3B82F6" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  <div className="dns-col">
                    <span className="dns-value">redirect.linksa.com</span>
                    <button className="copy-btn" title="Copy">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.6667 5.25H6.41667C5.86438 5.25 5.41667 5.69772 5.41667 6.25V11.5C5.41667 12.0523 5.86438 12.5 6.41667 12.5H11.6667C12.219 12.5 12.6667 12.0523 12.6667 11.5V6.25C12.6667 5.69772 12.219 5.25 11.6667 5.25Z" stroke="#3B82F6" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2.75 8.75H2.33333C1.96514 8.75 1.66667 8.45152 1.66667 8.08333V2.33333C1.66667 1.96514 1.96514 1.66667 2.33333 1.66667H8.08333C8.45152 1.66667 8.75 1.96514 8.75 2.33333V2.75" stroke="#3B82F6" strokeWidth="1.16667" strokeLineCap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="dns-instructions">
              <h4>How to add DNS records:</h4>
              <ul>
                <li>Log in to your domain registrar or DNS provider</li>
                <li>Navigate to DNS management or DNS settings</li>
                <li>Add the CNAME record for link redirection</li>
                <li>Save changes and wait for DNS propagation (up to 24 hours)</li>
                <li>Click "Verify Domain" button below</li>
              </ul>
            </div>
          </div>

          {/* Your Domains Section */}
          <div className="domains-section">
            <h3>Your Domains</h3>
            <div className="domains-list">
              {/* Verified Domain */}
              <div className="domain-item verified">
                <div className="domain-info">
                  <div className="domain-status">
                    <div className="status-icon verified-icon">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="domain-details">
                      <span className="domain-name">brand.sa</span>
                      <div className="domain-meta">
                        <span className="status-badge verified-badge">Verified</span>
                        <span className="domain-date">Added 3 days ago</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="domain-actions">
                  <button className="action-btn settings-btn" onClick={() => handleDomainSettings('brand.sa')}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" stroke="#6B7280" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12.9333 10C12.8441 10.2371 12.8183 10.4943 12.8585 10.7446C12.8988 10.9948 13.0036 11.2293 13.1622 11.4248C13.3208 11.6203 13.5277 11.7703 13.762 11.8601C13.9963 11.9498 14.2501 11.9762 14.4978 11.9367L14.6667 11.9067C14.8804 11.9062 15.0905 11.9729 15.2668 12.0987C15.4432 12.2245 15.5775 12.4035 15.6522 12.6108C15.727 12.8181 15.7384 13.0441 15.6848 13.2582C15.6312 13.4722 15.5151 13.6647 15.3511 13.8089L15.2444 13.9C15.0497 14.0762 14.9081 14.3043 14.8357 14.5585C14.7633 14.8127 14.7628 15.0824 14.8344 15.3369C14.906 15.5913 15.0469 15.8199 15.241 15.997C15.4351 16.1741 15.6741 16.2929 15.9289 16.34L16.0667 16.3667C16.2804 16.3993 16.4804 16.4921 16.6419 16.6339C16.8034 16.7758 16.9196 16.9605 16.9757 17.1666C17.0319 17.3727 17.0255 17.591 16.9574 17.7931C16.8894 17.9952 16.7627 18.1724 16.5933 18.3022L16.4622 18.4C16.2675 18.5762 16.1259 18.8043 16.0535 19.0585C15.9811 19.3127 15.9806 19.5824 16.0522 19.8369C16.1238 20.0913 16.2647 20.3199 16.4588 20.497C16.6529 20.6741 16.8919 20.7929 17.1467 20.84L17.2844 20.8667" stroke="#6B7280" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Settings
                  </button>
                  <button className="action-btn remove-btn" onClick={() => handleRemoveDomain('brand.sa')}>
                    Remove
                  </button>
                </div>
              </div>

              {/* Pending Domain */}
              <div className="domain-item pending">
                <div className="domain-info">
                  <div className="domain-status">
                    <div className="status-icon pending-icon">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="6" cy="6" r="5" stroke="white" strokeWidth="1.5"/>
                        <path d="M6 3V6L8 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="domain-details">
                      <span className="domain-name">marketing.sa</span>
                      <div className="domain-meta">
                        <span className="status-badge pending-badge">Pending</span>
                        <span className="domain-date">Added 1 hour ago</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="domain-actions">
                  <button className="action-btn verify-btn" onClick={() => handleVerifyDomain('marketing.sa')}>
                    Verify Domain
                  </button>
                  <button className="action-btn settings-btn" onClick={() => handleDomainSettings('marketing.sa')}>
                    Settings
                  </button>
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default CustomDomains;