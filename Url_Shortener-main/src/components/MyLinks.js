import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import MainHeader from './MainHeader';
import { urlsAPI } from '../services/api';
import './MyLinks.css';


function MyLinks() {
  const { t } = useTranslation();
  const [links, setLinks] = useState([]);
  const [showCreateShortLink, setShowCreateShortLink] = useState(false);
  // State for create short link form
  const [longUrl, setLongUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const [generateQR, setGenerateQR] = useState(false);
  const [, setShowUTMModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery] = useState('');
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
      setError(err.message || t('errors.generic'));
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
      alert(t('errors.generic'));
    }
  };

  const handleDeleteLink = async (linkId) => {
    if (!window.confirm(t('myLinks.confirmDelete'))) return;
    try {
      setDeleteLoading(linkId);
      await urlsAPI.delete(linkId);
      setLinks(links.filter(link => (link.id || link._id) !== linkId));
    } catch (err) {
      alert(t('errors.generic'));
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

  // Handlers for create short link form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!longUrl.trim()) {
      setError(t('createLink.errors.invalidUrl'));
      return;
    }

    try {
      const response = await urlsAPI.createUrl({
        originalUrl: longUrl,
        customCode: customName || undefined,
        title: customName || undefined,
      });

      if (response.success && response.data && response.data.url) {
        // Successfully created, refresh the list
        await fetchLinks();

        // Clear form and close modal
        setLongUrl('');
        setCustomName('');
        setGenerateQR(false);
        setShowCreateShortLink(false);
        setError(null);
      } else {
        setError(t('createLink.errors.general'));
      }
    } catch (err) {
      console.error('Error creating short link:', err);
      setError(err.message || t('createLink.errors.general'));
    }
  };

  const handleSaveDraft = () => {
    // Save form data to local storage for later
    const draft = {
      longUrl,
      customName,
      generateQR,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('linkDraft', JSON.stringify(draft));
    alert('Draft saved!');
  };

  return (
    <>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .link-card {
          transition: all 0.2s ease;
        }
        .link-card:hover {
          border-color: #3B82F6 !important;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
        }
        .stats-card {
          transition: all 0.2s ease;
        }
        .stats-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }
        .link-actions button:hover {
          opacity: 0.85;
          transform: translateY(-1px);
        }
        .link-actions button:active {
          transform: translateY(0);
        }
        .create-short-link-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .create-short-link-btn:active {
          transform: translateY(0);
        }
      `}</style>
      <div className="analytics-container">
        <MainHeader />
      <div className="analytics-layout">
        <Sidebar />
        <div className="analytics-main">
          <div className="analytics-content" style={{
            padding: '24px',
            maxWidth: '1400px',
            margin: '0 auto'
          }}>
            <div className="page-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: showCreateShortLink ? '24px' : '20px',
              paddingBottom: '0'
            }}>
              {!showCreateShortLink && (
                <div className="header-info" style={{ margin: 0 }}>
                  <h1 className="page-title" style={{ marginBottom: '4px' }}>{t('myLinks.title')}</h1>
                  <p className="page-subtitle" style={{ margin: 0 }}>{t('myLinks.subtitle')}</p>
                </div>
              )}
              <button
                className="create-short-link-btn"
                onClick={() => setShowCreateShortLink((prev) => !prev)}
                style={{
                  minWidth: 180,
                  color: "white",
                  padding: "10px 16px",
                  background: "#3B82F6",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  marginLeft: showCreateShortLink ? '0' : 'auto'
                }}
              >
                {showCreateShortLink ? `← ${t('common.back')} ${t('myLinks.title')}` : t('createLink.title')}
              </button>
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
                  <h1 className="page-title">{t('createLink.title')}</h1>
                  <p className="page-description">
                    {t('createLink.subtitle')}
                  </p>
                </div>
                <div className="create-link-form">
                  {error && (
                    <div style={{
                      padding: '12px 16px',
                      marginBottom: '20px',
                      background: '#FEE2E2',
                      border: '1px solid #FCA5A5',
                      borderRadius: '8px',
                      color: '#DC2626',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM7 4h2v5H7V4zm0 6h2v2H7v-2z"/>
                      </svg>
                      {error}
                      <button
                        type="button"
                        onClick={() => setError(null)}
                        style={{
                          marginLeft: 'auto',
                          background: 'none',
                          border: 'none',
                          color: '#DC2626',
                          cursor: 'pointer',
                          fontSize: '18px',
                          padding: '0',
                          width: '20px',
                          height: '20px'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  )}
                  <form onSubmit={handleSubmit}>
                    {/* Long URL Input */}
                    <div className="form-section">
                      <label className="form-label">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10 3h4v4M6 11L14 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {t('createLink.form.originalUrl')}
                      </label>
                      <div className="input-container">
                        <input
                          type="url"
                          value={longUrl}
                          onChange={(e) => setLongUrl(e.target.value)}
                          placeholder={t('createLink.form.originalUrlPlaceholder')}
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
                        {t('createLink.form.customAlias')}
                      </label>
                      <div className="custom-url-input">
                        <span className="url-prefix">linksa.com/</span>
                        <input
                          type="text"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          placeholder={t('createLink.form.customAliasPlaceholder')}
                          className="custom-input"
                        />
                      </div>
                    </div>
                    {/* UTM Parameters Section */}
                    <div className="utm-section">
                      <div className="utm-header">
                        <div className="utm-label">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <div>
                            <span className="utm-title">{t('createLink.form.utmParameters')}</span>
                            <span className="utm-subtitle">{t('createLink.form.utmParameters')}</span>
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
                          {t('createLink.form.utmParameters')}
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
                          <h3>{t('qrCodes.generate.title')}</h3>
                          <p>{t('qrCodes.generate.customize')}</p>
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
                        {t('createLink.form.createButton')}
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        className="save-draft-btn"
                      >
                        <svg width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 4v9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4M10 1H4v3h6V1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {t('common.save')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <>
                <div className="stats-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '16px',
                  marginBottom: '20px'
                }}>
                  <div className="stats-card" style={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    padding: '20px'
                  }}>
                    <div className="stats-content">
                      <p className="stats-label" style={{
                        fontSize: '13px',
                        color: '#6B7280',
                        marginBottom: '8px',
                        fontWeight: '400'
                      }}>{t('dashboard.stats.totalLinks')}</p>
                      <h3 className="stats-value" style={{
                        fontSize: '28px',
                        fontWeight: '600',
                        color: '#1F2937',
                        margin: 0
                      }}>{links.length}</h3>
                      <p style={{
                        fontSize: '12px',
                        color: '#10B981',
                        marginTop: '6px',
                        marginBottom: 0
                      }}>↑ {links.length > 0 ? '100%' : '0%'} vs last period</p>
                    </div>
                  </div>
                  <div className="stats-card" style={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    padding: '20px'
                  }}>
                    <div className="stats-content">
                      <p className="stats-label" style={{
                        fontSize: '13px',
                        color: '#6B7280',
                        marginBottom: '8px',
                        fontWeight: '400'
                      }}>{t('dashboard.stats.totalClicks')}</p>
                      <h3 className="stats-value" style={{
                        fontSize: '28px',
                        fontWeight: '600',
                        color: '#1F2937',
                        margin: 0
                      }}>{links.reduce((sum, link) => sum + (link.clickCount || 0), 0).toLocaleString()}</h3>
                      <p style={{
                        fontSize: '12px',
                        color: '#10B981',
                        marginTop: '6px',
                        marginBottom: 0
                      }}>↑ +32.1% vs last period</p>
                    </div>
                  </div>
                </div>
                {error && (
                  <div className="error-message" style={{
                    backgroundColor: '#FEE2E2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '6px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ color: '#991B1B', fontSize: '14px' }}>{error}</span>
                    <button onClick={() => setError(null)} style={{
                      background: 'none',
                      border: 'none',
                      color: '#991B1B',
                      fontSize: '20px',
                      cursor: 'pointer',
                      padding: '0 4px'
                    }}>&times;</button>
                  </div>
                )}
                <div className="links-list" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {loading ? (
                    <div style={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      padding: '40px',
                      textAlign: 'center',
                      color: '#6B7280'
                    }}>
                      <div style={{
                        display: 'inline-block',
                        width: '24px',
                        height: '24px',
                        border: '3px solid #E5E7EB',
                        borderTopColor: '#3B82F6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      <p style={{ marginTop: '12px', marginBottom: 0 }}>{t('common.loading')}</p>
                    </div>
                  ) : filteredLinks.length === 0 ? (
                    <div style={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      padding: '48px 24px',
                      textAlign: 'center'
                    }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" style={{ margin: '0 auto 16px' }}>
                        <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>{t('myLinks.noLinks')}</h3>
                      <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>{t('myLinks.createFirstLink')}</p>
                    </div>
                  ) : (
                    filteredLinks.map((link) => {
                      const linkId = link.id || link._id;
                      return (
                        <div key={linkId} className="link-card" style={{
                          backgroundColor: 'white',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                          padding: '16px 20px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.2s',
                          cursor: 'pointer'
                        }}>
                          <div className="link-info" style={{ flex: 1, minWidth: 0 }}>
                            <div className="link-title" style={{
                              fontSize: '15px',
                              fontWeight: '600',
                              color: '#1F2937',
                              marginBottom: '8px'
                            }}>{link.title || t('myLinks.table.title')}</div>
                            <div className="link-urls" style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              marginBottom: '8px'
                            }}>
                              <span className="short-url" style={{
                                fontSize: '14px',
                                color: '#3B82F6',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                {link.domain && link.domain !== 'laghhu.link' ? `${link.domain}/${link.shortCode}` : `laghhu.link/${link.shortCode}`}
                              </span>
                              <span className="original-url" style={{
                                fontSize: '13px',
                                color: '#6B7280',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>{link.originalUrl}</span>
                            </div>
                            <div className="link-meta" style={{
                              display: 'flex',
                              gap: '16px',
                              fontSize: '12px',
                              color: '#9CA3AF'
                            }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                  <line x1="16" y1="2" x2="16" y2="6"/>
                                  <line x1="8" y1="2" x2="8" y2="6"/>
                                  <line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                                {formatDate(link.createdAt)}
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9"/>
                                </svg>
                                {link.clickCount || 0} {t('myLinks.table.clicks')}
                              </span>
                            </div>
                          </div>
                          <div className="link-actions" style={{
                            display: 'flex',
                            gap: '8px',
                            marginLeft: '16px'
                          }}>
                            <button onClick={() => handleCopyLink(link)} style={{
                              padding: '8px 16px',
                              fontSize: '13px',
                              fontWeight: '500',
                              color: copiedId === linkId ? '#10B981' : '#3B82F6',
                              backgroundColor: copiedId === linkId ? '#D1FAE5' : '#EFF6FF',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              {copiedId === linkId ? (
                                <>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12"/>
                                  </svg>
                                  {t('common.copied')}
                                </>
                              ) : (
                                <>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                  </svg>
                                  {t('common.copy')}
                                </>
                              )}
                            </button>
                            <button onClick={() => handleDeleteLink(linkId)} disabled={deleteLoading === linkId} style={{
                              padding: '8px 16px',
                              fontSize: '13px',
                              fontWeight: '500',
                              color: '#EF4444',
                              backgroundColor: '#FEE2E2',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: deleteLoading === linkId ? 'not-allowed' : 'pointer',
                              opacity: deleteLoading === linkId ? 0.6 : 1,
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                              </svg>
                              {deleteLoading === linkId ? t('common.loading') : t('common.delete')}
                            </button>
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
    </>
  );
}

export default MyLinks;
