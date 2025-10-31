import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateLinkSidebar from './CreateLinkSidebar';
import CreateLinkHeader from './CreateLinkHeader';
import { urlsAPI } from '../services/api';
import './CreateShortLink.css';

const CreateShortLink = () => {
  const navigate = useNavigate();
  const [longUrl, setLongUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const [generateQR, setGenerateQR] = useState(true);
  const [showUTMModal, setShowUTMModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Prepare the data for API
      const linkData = {
        originalUrl: longUrl,
      };

      // Add custom code if provided
      if (customName.trim()) {
        linkData.customCode = customName.trim();
      }

      // Create the short link
      const response = await urlsAPI.create(linkData);

      // Show success message
      setSuccessMessage('Short link created successfully!');

      // Clear form
      setLongUrl('');
      setCustomName('');

      // Redirect to My Links page after 1.5 seconds
      setTimeout(() => {
        navigate('/my-links');
      }, 1500);
    } catch (err) {
      console.error('Failed to create short link:', err);
      setError(err.message || 'Failed to create short link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => {
    // Save to local storage as draft
    const draftData = {
      longUrl,
      customName,
      generateQR,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('linkDraft', JSON.stringify(draftData));
    setSuccessMessage('Draft saved successfully!');
    setTimeout(() => setSuccessMessage(null), 3000);
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

          {/* Success Message */}
          {successMessage && (
            <div style={{
              padding: '1rem',
              background: '#ECFDF5',
              border: '1px solid #6EE7B7',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              color: '#065F46',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z" fill="#10B981"/>
              </svg>
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '1rem',
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              color: '#991B1B',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z" fill="#EF4444"/>
              </svg>
              {error}
            </div>
          )}

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
                <button type="submit" className="create-link-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <div style={{
                        width: '1rem',
                        height: '1rem',
                        border: '2px solid white',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                      }}></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 8h18M12 1l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Create Short Link
                    </>
                  )}
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