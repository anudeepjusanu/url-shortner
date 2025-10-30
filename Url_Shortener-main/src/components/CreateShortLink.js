import React, { useState } from 'react';
import CreateLinkSidebar from './CreateLinkSidebar';
import CreateLinkHeader from './CreateLinkHeader';
import './CreateShortLink.css';

const CreateShortLink = () => {
  const [longUrl, setLongUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const [generateQR, setGenerateQR] = useState(true);
  const [showUTMModal, setShowUTMModal] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log('Creating short link...', { longUrl, customName, generateQR });
  };

  const handleSaveDraft = () => {
    // Handle save as draft
    console.log('Saving as draft...', { longUrl, customName, generateQR });
  };

  return (
    <div className="dashboard-container">
      {/* Header takes full width */}
      <CreateLinkHeader />

      {/* Main layout with sidebar and content */}
      <div className="create-link-layout">
        {/* Sidebar */}
        <CreateLinkSidebar />

        {/* Main Content Area */}
        <div className="main-area">
          {/* Main Content */}
          <main className="main-content">
          {/* Breadcrumb */}
          <div className="breadcrumb">
            <span className="breadcrumb-item">Dashboard</span>
            <svg width="7.5" height="12" viewBox="0 0 7.5 12" className="breadcrumb-arrow">
              <path d="m1.5 1.5 4 4.5-4 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="breadcrumb-item current">Create Short Link</span>
          </div>

          {/* Page Header */}
          <div >
            <h1 className="page-title">Create Short Link</h1>
            <p className="page-description">
              Transform your long URLs into short, trackable links with custom UTM parameters
            </p>
          </div>

          {/* Main Form */}
          <div className="create-link-form">
            <form onSubmit={handleSubmit}>
              {/* Long URL Input */}
              <div className="form-section">
                <label className="form-label">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 3h4v4M6 11L14 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Enter your long URL
                </label>
                <div className="input-container">
                  <input
                    type="url"
                    value={longUrl}
                    onChange={(e) => setLongUrl(e.target.value)}
                    placeholder="https://example.com/your-very-long-url-here"
                    className="url-input"
                    required
                  />
                  <button type="button" className="paste-btn">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 1H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zM5 3h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Custom Link Input */}
              <div className="form-section">
                <label className="form-label">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Customize your link (optional)
                </label>
                <div className="custom-url-input">
                  <span className="url-prefix">linksa.com/</span>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="custom-name"
                    className="custom-input"
                  />
                </div>
                <p className="form-hint">Leave empty for auto-generated short link</p>
              </div>

              {/* UTM Parameters Section */}
              <div className="utm-section">
                <div className="utm-header">
                  <div className="utm-label">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <div>
                      <span className="utm-title">UTM Parameters</span>
                      <span className="utm-subtitle">(Track campaign performance)</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowUTMModal(true)}
                    className="add-utm-btn"
                  >
                    <svg width="12.25" height="14" viewBox="0 0 12.25 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6.125 1v12M1 7h10.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Add UTM Parameters
                  </button>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="qr-section">
                <div className="qr-content">
                  <div className="qr-icon">
                    <svg width="17.5" height="20" viewBox="0 0 17.5 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                      <rect x="10.5" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                      <rect x="1" y="13" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                      <rect x="11.5" y="11" width="2" height="2" fill="currentColor"/>
                      <rect x="14.5" y="11" width="2" height="2" fill="currentColor"/>
                      <rect x="11.5" y="14" width="2" height="2" fill="currentColor"/>
                      <rect x="14.5" y="17" width="2" height="2" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="qr-info">
                    <h3>Generate QR Code</h3>
                    <p>Auto-generate a QR code for your shortened link</p>
                  </div>
                  <div className="qr-toggle">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={generateQR}
                        onChange={(e) => setGenerateQR(e.target.checked)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <button type="submit" className="create-link-btn">
                  <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 8h18M12 1l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Create Short Link
                </button>
                <button type="button" onClick={handleSaveDraft} className="save-draft-btn">
                  <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 4v9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4M10 1H4v3h6V1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Save as Draft
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
    </div>
  );
};

export default CreateShortLink;