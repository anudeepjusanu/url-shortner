import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import MainHeader from './MainHeader';
import { urlsAPI } from '../services/api';
import './MyLinks.css';


function MyLinks() {
  const navigate = useNavigate();
  const [links, setLinks] = useState([]);
  const [showCreateShortLink, setShowCreateShortLink] = useState(false);
  // State for create short link form
  const [longUrl, setLongUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const [generateQR, setGenerateQR] = useState(false);
  const [showUTMModal, setShowUTMModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    fetchLinks();
    // eslint-disable-next-line
  }, []);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await urlsAPI.list({ page: 1, limit: 100 });
      const linksData = response.data?.urls || response.data?.data?.urls || [];
      setLinks(linksData);
    } catch (err) {
      setError(err.message || 'Failed to fetch links. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async (link) => {
    try {
      let shortUrl;
      if (link.domain && link.domain !== 'laghhu.link') {
        shortUrl = `http://${link.domain}/${link.shortCode}`;
      } else {
        shortUrl = `https://laghhu.link/${link.shortCode}`;
      }
      await navigator.clipboard.writeText(shortUrl);
      setCopiedId(link.id || link._id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      alert('Failed to copy link');
    }
  };

  const handleDeleteLink = async (linkId) => {
    if (!window.confirm('Are you sure you want to delete this link? This action cannot be undone.')) return;
    try {
      setDeleteLoading(linkId);
      await urlsAPI.delete(linkId);
      setLinks(links.filter(link => (link.id || link._id) !== linkId));
    } catch (err) {
      alert('Failed to delete link. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const filteredLinks = links.filter(link => {
    const query = searchQuery.toLowerCase();
    return (
      link.shortCode?.toLowerCase().includes(query) ||
      link.originalUrl?.toLowerCase().includes(query) ||
      link.title?.toLowerCase().includes(query)
    );
  });

  // Handlers for create short link form (dummy for now)
  const handleSubmit = (e) => {
    e.preventDefault();
    // Implement create short link logic here
    alert('Short link created!');
    setShowCreateShortLink(false);
  };
  const handleSaveDraft = () => {
    // Implement save draft logic here
    alert('Draft saved!');
  };

  return (
    <div className="analytics-container">
      <MainHeader />
      <div className="analytics-layout">
        <Sidebar />
        <div className="analytics-main">
          <div className="analytics-content">
            <div className="page-header" >
                            <button
                className="create-short-link-btn"
                onClick={() => setShowCreateShortLink((prev) => !prev)}
                style={{ marginLeft: 'auto', minWidth: 180 , color: "white", padding: "8px 6px", background: "#3B82F6", border: "none", borderRadius: "5px" }}
              >
                {showCreateShortLink ? 'Go Back to My Links' : 'Create Short Link'}
              </button>
                              {showCreateShortLink ? null : (

              <div className="header-info">
                <h1 className="page-title">My Links</h1>
                <p className="page-subtitle">Manage and track all your shortened links in one place</p>
                
              </div>
                              )}
            </div>
            {showCreateShortLink ? (
              <div className="create-short-link-content">
                {/* <div className="breadcrumb">
                  <span className="breadcrumb-item">Dashboard</span>
                  <svg width="7.5" height="12" viewBox="0 0 7.5 12" className="breadcrumb-arrow">
                    <path d="m1.5 1.5 4 4.5-4 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="breadcrumb-item current">Create Short Link</span>
                </div> */}
                <div className='header-info'>
                  <h1 className="page-title">Create Short Link</h1>
                  <p className="page-description">
                    Transform your long URLs into short, trackable links with custom UTM parameters
                  </p>
                </div>
                <div className="create-link-form">
                  <form onSubmit={handleSubmit}>
                    {/* Long URL Input */}
                    <div className="form-section">
                      <label className="form-label">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10 3h4v4M6 11L14 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
                            <path d="M9 1H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zM5 3h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {/* Custom Link Input */}
                    <div className="form-section">
                      <label className="form-label">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
                            <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                            <path d="M6.125 1v12M1 7h10.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
                            <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                            <rect x="10.5" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                            <rect x="1" y="13" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                            <rect x="11.5" y="11" width="2" height="2" fill="currentColor" />
                            <rect x="14.5" y="11" width="2" height="2" fill="currentColor" />
                            <rect x="11.5" y="14" width="2" height="2" fill="currentColor" />
                            <rect x="14.5" y="17" width="2" height="2" fill="currentColor" />
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
                          <path d="M1 8h18M12 1l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Create Short Link
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        className="save-draft-btn"
                      >
                        <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 4v9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4M10 1H4v3h6V1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Save as Draft
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <>
                <div className="stats-grid" style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
                  <div className="stats-card" style={{ flex: 1 }}>
                    <div className="stats-content">
                      <p className="stats-label">Total Links</p>
                      <h3 className="stats-value">{links.length}</h3>
                    </div>
                  </div>
                  <div className="stats-card" style={{ flex: 1 }}>
                    <div className="stats-content">
                      <p className="stats-label">Total Clicks</p>
                      <h3 className="stats-value">{links.reduce((sum, link) => sum + (link.clickCount || 0), 0)}</h3>
                    </div>
                  </div>
                </div>
                {error && (
                  <div className="error-message">
                    <span>{error}</span>
                    <button onClick={() => setError(null)}>&times;</button>
                  </div>
                )}
                <div className="links-list">
                  {loading ? (
                    <div>Loading...</div>
                  ) : filteredLinks.length === 0 ? (
                    <div>No links found.</div>
                  ) : (
                    filteredLinks.map((link) => {
                      const linkId = link.id || link._id;
                      return (
                        <div key={linkId} className="link-card">
                          <div className="link-info">
                            <div className="link-title">{link.title || 'Untitled Link'}</div>
                            <div className="link-urls">
                              <span className="short-url">{link.domain && link.domain !== 'laghhu.link' ? `${link.domain}/${link.shortCode}` : `laghhu.link/${link.shortCode}`}</span>
                              <span className="original-url">{link.originalUrl}</span>
                            </div>
                            <div className="link-meta">
                              <span>{formatDate(link.createdAt)}</span>
                              <span>{link.clickCount || 0} clicks</span>
                            </div>
                          </div>
                          <div className="link-actions">
                            <button onClick={() => handleCopyLink(link)}>{copiedId === linkId ? 'Copied' : 'Copy'}</button>
                            <button onClick={() => handleDeleteLink(linkId)} disabled={deleteLoading === linkId}>Delete</button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyLinks;
