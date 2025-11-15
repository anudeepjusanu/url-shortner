
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import MainHeader from './MainHeader';
import { urlsAPI, analyticsAPI, authAPI } from '../services/api';
import './Dashboard.css';
import './DashboardLayout.css';

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [longUrl, setLongUrl] = useState('');
  const [customBackhalf, setCustomBackhalf] = useState('');
  const [campaign, setCampaign] = useState('');
  const [selectedDomainId, setSelectedDomainId] = useState('');
  const [availableDomains, setAvailableDomains] = useState([]);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [timeFilter, setTimeFilter] = useState('Last 7 days');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClicks: 0,
    uniqueVisitors: 0,
    clickRate: 0,
    totalLinks: 0
  });
  const [recentLinks, setRecentLinks] = useState([]);
  const [userName, setUserName] = useState('User');
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, linkId: null, linkUrl: '' });
  const [editDialog, setEditDialog] = useState({ isOpen: false, link: null });
  const [copySuccess, setCopySuccess] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchAvailableDomains();
  }, [timeFilter]);

  const fetchAvailableDomains = async () => {
    try {
      setLoadingDomains(true);
      const response = await urlsAPI.getAvailableDomains();
      const domains = response.data?.domains || response.domains || [];
      setAvailableDomains(domains);

      // Set default domain
      const defaultDomain = domains.find(d => d.isDefault);
      if (defaultDomain) {
        setSelectedDomainId(defaultDomain.id || defaultDomain._id);
      }
    } catch (err) {
      console.error('Failed to fetch domains:', err);
    } finally {
      setLoadingDomains(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch user profile
      try {
        const profileResponse = await authAPI.getProfile();
        if (profileResponse && profileResponse.data && profileResponse.data.user) {
          const user = profileResponse.data.user;
          setUserName(user.name || user.username || user.email?.split('@')[0] || 'User');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }

      // Fetch analytics overview
      try {
        const period = timeFilter === 'Last 7 days' ? '7d' : timeFilter === 'Last 30 days' ? '30d' : '90d';
        const analyticsResponse = await analyticsAPI.getOverview({ period });
        if (analyticsResponse && analyticsResponse.data) {
          setStats({
            totalClicks: analyticsResponse.data.totalClicks || 0,
            uniqueVisitors: analyticsResponse.data.uniqueClicks || 0,
            clickRate: analyticsResponse.data.clickThroughRate || 0,
            totalLinks: analyticsResponse.data.totalUrls || 0
          });
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
      }

      // Fetch recent links
      try {
        const linksResponse = await urlsAPI.list({ page: 1, limit: 3, sortBy: 'createdAt', sortOrder: 'desc' });
        if (linksResponse && linksResponse.data) {
          const links = linksResponse.data.urls || linksResponse.data.data?.urls || [];
          setRecentLinks(links);
        }
      } catch (err) {
        console.error('Error fetching recent links:', err);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleShortenUrl = async (e) => {
    e.preventDefault();
    try {
      const response = await urlsAPI.createUrl({
        originalUrl: longUrl,
        customCode: customBackhalf || undefined,
        title: campaign || undefined,
        domainId: selectedDomainId || undefined,
      });

      if (response.success) {
        // Clear form
        setLongUrl('');
        setCustomBackhalf('');
        setCampaign('');
        // Refresh data
        fetchDashboardData();
        // Navigate to my links
        navigate('/my-links');
      }
    } catch (err) {
      console.error('Error creating short link:', err);
      alert(err.message || 'Failed to create short link');
    }
  };

  const handleAdvancedSettings = () => {
    console.log('Opening advanced settings');
    // Handle advanced settings modal/dropdown
  };

  // Copy functionality
  const handleCopyLink = async (link) => {
    try {
      const shortUrl = `https://${getShortUrl(link)}`;
      await navigator.clipboard.writeText(shortUrl);
      setCopySuccess(link.id || link._id);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert(t('common.copyFailed') || 'Failed to copy link');
    }
  };

  // Edit functionality
  const handleEditLink = (link) => {
    setEditDialog({ isOpen: true, link: link });
  };

  const handleSaveEdit = async (linkId, updatedData) => {
    try {
      const response = await urlsAPI.updateUrl(linkId, updatedData);
      if (response.success) {
        // Refresh the dashboard data
        await fetchDashboardData();
        setEditDialog({ isOpen: false, link: null });
      }
    } catch (err) {
      console.error('Error updating link:', err);
      alert(err.message || 'Failed to update link');
    }
  };

  // Delete functionality
  const handleDeleteClick = (link) => {
    setDeleteDialog({
      isOpen: true,
      linkId: link.id || link._id,
      linkUrl: getShortUrl(link)
    });
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await urlsAPI.deleteUrl(deleteDialog.linkId);
      if (response.success || response.data) {
        // Refresh the dashboard data
        await fetchDashboardData();
        setDeleteDialog({ isOpen: false, linkId: null, linkUrl: '' });
      }
    } catch (err) {
      console.error('Error deleting link:', err);
      alert(err.message || 'Failed to delete link');
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialog({ isOpen: false, linkId: null, linkUrl: '' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    }
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  };

  const getShortUrl = (link) => {
    const domain = link.domain || 'laghhu.link';
    return `${domain}/${link.shortCode}`;
  };


  return (
    <div className="analytics-container">
      {/* Full-width header at the top */}
      <MainHeader />
      <div className="analytics-layout">
        {/* Sidebar on the left */}
        <Sidebar />
        <div className="analytics-main">
          <div className="analytics-content">
            {/* Welcome Banner */}
            <div className="welcome-banner" style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              borderRadius: '12px',
              padding: '24px 28px',
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div className="welcome-content">
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: 'white',
                  margin: '0 0 6px 0'
                }}>{t('dashboard.welcome')}, {userName}!</h2>
                <p style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  margin: 0
                }}>{t('dashboard.welcomeMessage')}</p>
              </div>
              <div className="welcome-avatar" style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                👋
              </div>
            </div>

            {/* Action Cards */}
            <div className="action-cards" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div className="action-card blue-card" style={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div className="card-header" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <div className="card-icon blue-icon" style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: '#EFF6FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="17.5" height="20" viewBox="0 0 17.5 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 10L10 2l8 8M10 2v16" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1F2937',
                    margin: 0
                  }}>{t('dashboard.createShortLink')}</h3>
                </div>
                <p style={{
                  fontSize: '13px',
                  color: '#6B7280',
                  margin: '0 0 16px 0',
                  flex: 1
                }}>{t('dashboard.createShortLinkDesc')}</p>
                <button
                  className="card-btn blue-btn"
                  onClick={() => handleNavigation('/my-links')}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    backgroundColor: '#3B82F6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >{t('dashboard.getStarted')}</button>
              </div>

              <div className="action-card green-card" style={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div className="card-header" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <div className="card-icon green-icon" style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: '#D1FAE5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="17.5" height="20" viewBox="0 0 17.5 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="1" y="1" width="6" height="6" rx="1" stroke="#10B981" strokeWidth="2"/>
                      <rect x="10.5" y="1" width="6" height="6" rx="1" stroke="#10B981" strokeWidth="2"/>
                      <rect x="1" y="12" width="6" height="6" rx="1" stroke="#10B981" strokeWidth="2"/>
                      <rect x="10.5" y="12" width="6" height="6" rx="1" stroke="#10B981" strokeWidth="2"/>
                    </svg>
                  </div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1F2937',
                    margin: 0
                  }}>{t('dashboard.generateQRCode')}</h3>
                </div>
                <p style={{
                  fontSize: '13px',
                  color: '#6B7280',
                  margin: '0 0 16px 0',
                  flex: 1
                }}>{t('dashboard.generateQRCodeDesc')}</p>
                <button
                  className="card-btn green-btn"
                  onClick={() => handleNavigation('/qr-codes')}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    backgroundColor: '#10B981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >{t('dashboard.createQR')}</button>
              </div>

              <div className="action-card purple-card" style={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div className="card-header" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <div className="card-icon purple-icon" style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: '#EDE9FE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="10" cy="10" r="8" stroke="#7C3AED" strokeWidth="2"/>
                      <path d="M2 10h16M10 2c2 0 4 3.5 4 8s-2 8-4 8-4-3.5-4-8 2-8 4-8z" stroke="#7C3AED" strokeWidth="2"/>
                    </svg>
                  </div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1F2937',
                    margin: 0
                  }}>{t('dashboard.addCustomDomain')}</h3>
                </div>
                <p style={{
                  fontSize: '13px',
                  color: '#6B7280',
                  margin: '0 0 16px 0',
                  flex: 1
                }}>{t('dashboard.addCustomDomainDesc')}</p>
                <button
                  className="card-btn purple-btn"
                  onClick={() => handleNavigation('/custom-domains')}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    backgroundColor: '#7C3AED',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >{t('dashboard.setupDomain')}</button>
              </div>
            </div>

            {/* URL Shortener Section */}
            <div className="url-shortener-section" style={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1F2937',
                margin: '0 0 20px 0'
              }}>{t('dashboard.shortenYourURL')}</h2>
              <form className="shortener-form" onSubmit={handleShortenUrl} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div className="form-group full-width" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="longUrl" style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#374151'
                  }}>{t('dashboard.longURL')}</label>
                  <input
                    type="url"
                    id="longUrl"
                    value={longUrl}
                    onChange={(e) => setLongUrl(e.target.value)}
                    placeholder={t('dashboard.longURLPlaceholder')}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Domain Selection */}
                {availableDomains.length > 0 && (
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label htmlFor="domain" style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      <svg style={{ width: '14px', height: '14px', display: 'inline-block', marginRight: '6px', verticalAlign: 'middle' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {t('createLink.form.domain') || 'Domain'}
                    </label>
                    <select
                      id="domain"
                      value={selectedDomainId}
                      onChange={(e) => setSelectedDomainId(e.target.value)}
                      disabled={loadingDomains}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      {loadingDomains ? (
                        <option>{t('common.loading') || 'Loading...'}</option>
                      ) : (
                        availableDomains.map((domain) => (
                          <option key={domain.id} value={domain.id}>
                            {domain.fullDomain} {domain.isDefault ? '(Default)' : ''}
                          </option>
                        ))
                      )}
                    </select>
                    {selectedDomainId && !loadingDomains && (
                      <p style={{
                        fontSize: '12px',
                        color: '#6B7280',
                        margin: '4px 0 0 0'
                      }}>
                        Short URL: {availableDomains.find(d => d.id === selectedDomainId)?.shortUrl}/your-code
                      </p>
                    )}
                  </div>
                )}

                <div className="form-row" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '16px'
                }}>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label htmlFor="customBackhalf" style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#374151'
                    }}>{t('dashboard.customBackhalf')}</label>
                    <input
                      type="text"
                      id="customBackhalf"
                      value={customBackhalf}
                      onChange={(e) => setCustomBackhalf(e.target.value)}
                      placeholder={t('dashboard.customBackhalfPlaceholder')}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label htmlFor="campaign" style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#374151'
                    }}>{t('dashboard.campaign')}</label>
                    <input
                      type="text"
                      id="campaign"
                      value={campaign}
                      onChange={(e) => setCampaign(e.target.value)}
                      placeholder={t('dashboard.campaignPlaceholder')}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div className="form-actions" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '8px'
                }}>
                  <button type="button" className="advanced-settings-btn" onClick={handleAdvancedSettings} style={{
                    padding: '10px 16px',
                    backgroundColor: 'transparent',
                    color: '#3B82F6',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8" cy="2" r="1" fill="#3B82F6"/>
                    <circle cx="8" cy="8" r="1" fill="#3B82F6"/>
                    <circle cx="8" cy="14" r="1" fill="#3B82F6"/>
                  </svg>
                  {t('dashboard.advancedSettings')}
                </button>
                <button type="submit" className="shorten-btn" style={{
                  padding: '10px 24px',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>{t('dashboard.shortenURL')}</button>
              </div>
            </form>
          </div>

          {/* Analytics & Stats Section */}
          <div className="analytics-stats-section" style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {/* Analytics Overview */}
            <div className="analytics-overview" style={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <div className="analytics-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h2 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1F2937',
                  margin: 0
                }}>{t('dashboard.analytics.title')}</h2>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="filter-select"
                  style={{
                    padding: '8px 32px 8px 12px',
                    fontSize: '13px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    color: '#374151',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="Last 7 days">{t('dashboard.last7Days')}</option>
                  <option value="Last 30 days">{t('dashboard.last30Days')}</option>
                  <option value="Last 90 days">{t('dashboard.last90Days')}</option>
                </select>
              </div>
              <div className="chart-container">
                <svg width="100%" height="240" viewBox="0 0 600 240" className="analytics-chart">
                  <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.1"/>
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  {/* Chart line */}
                  <polyline
                    points="50,180 120,160 190,140 260,120 330,100 400,85 470,70 540,60"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {/* Data points */}
                  <circle cx="50" cy="180" r="4" fill="#3B82F6"/>
                  <circle cx="120" cy="160" r="4" fill="#3B82F6"/>
                  <circle cx="190" cy="140" r="4" fill="#3B82F6"/>
                  <circle cx="260" cy="120" r="4" fill="#3B82F6"/>
                  <circle cx="330" cy="100" r="4" fill="#3B82F6"/>
                  <circle cx="400" cy="85" r="4" fill="#3B82F6"/>
                  <circle cx="470" cy="70" r="4" fill="#3B82F6"/>
                  <circle cx="540" cy="60" r="4" fill="#3B82F6"/>
                  {/* X-axis labels */}
                  <text x="50" y="210" fontSize="12" fill="#9CA3AF" textAnchor="middle">{t('dashboard.mon')}</text>
                  <text x="120" y="210" fontSize="12" fill="#9CA3AF" textAnchor="middle">{t('dashboard.tue')}</text>
                  <text x="190" y="210" fontSize="12" fill="#9CA3AF" textAnchor="middle">{t('dashboard.wed')}</text>
                  <text x="260" y="210" fontSize="12" fill="#9CA3AF" textAnchor="middle">{t('dashboard.thu')}</text>
                  <text x="330" y="210" fontSize="12" fill="#9CA3AF" textAnchor="middle">{t('dashboard.fri')}</text>
                  <text x="400" y="210" fontSize="12" fill="#9CA3AF" textAnchor="middle">{t('dashboard.sat')}</text>
                  <text x="470" y="210" fontSize="12" fill="#9CA3AF" textAnchor="middle">{t('dashboard.sun')}</text>
                  {/* Y-axis labels */}
                  <text x="30" y="185" fontSize="12" fill="#9CA3AF" textAnchor="end">100</text>
                  <text x="30" y="155" fontSize="12" fill="#9CA3AF" textAnchor="end">125</text>
                  <text x="30" y="125" fontSize="12" fill="#9CA3AF" textAnchor="end">150</text>
                  <text x="30" y="95" fontSize="12" fill="#9CA3AF" textAnchor="end">175</text>
                  <text x="30" y="65" fontSize="12" fill="#9CA3AF" textAnchor="end">200</text>
                  <text x="30" y="35" fontSize="12" fill="#9CA3AF" textAnchor="end">225</text>
                </svg>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-cards" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div className="stats-card" style={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <div className="stats-content">
                  <div className="stats-label" style={{
                    fontSize: '13px',
                    color: '#6B7280',
                    marginBottom: '8px'
                  }}>{t('dashboard.stats.totalClicks')}</div>
                  <div className="stats-number" style={{
                    fontSize: '28px',
                    fontWeight: '600',
                    color: '#1F2937',
                    marginBottom: '6px'
                  }}>{loading ? '...' : stats.totalClicks.toLocaleString()}</div>
                  <div className="stats-change positive" style={{
                    fontSize: '12px',
                    color: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>↑ {timeFilter}</div>
                </div>
                <div className="stats-icon green" style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: '#D1FAE5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981'
                }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 4v8M4 8h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>

              <div className="stats-card" style={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <div className="stats-content">
                  <div className="stats-label" style={{
                    fontSize: '13px',
                    color: '#6B7280',
                    marginBottom: '8px'
                  }}>{t('dashboard.uniqueVisitors')}</div>
                  <div className="stats-number" style={{
                    fontSize: '28px',
                    fontWeight: '600',
                    color: '#1F2937',
                    marginBottom: '6px'
                  }}>{loading ? '...' : stats.uniqueVisitors.toLocaleString()}</div>
                  <div className="stats-change positive" style={{
                    fontSize: '12px',
                    color: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>↑ {timeFilter}</div>
                </div>
                <div className="stats-icon blue" style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: '#DBEAFE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#3B82F6'
                }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.5 7.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm8 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" fill="currentColor"/>
                  </svg>
                </div>
              </div>

              <div className="stats-card" style={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <div className="stats-content">
                  <div className="stats-label" style={{
                    fontSize: '13px',
                    color: '#6B7280',
                    marginBottom: '8px'
                  }}>{t('dashboard.stats.totalLinks')}</div>
                  <div className="stats-number" style={{
                    fontSize: '28px',
                    fontWeight: '600',
                    color: '#1F2937',
                    marginBottom: '6px'
                  }}>{loading ? '...' : stats.totalLinks.toLocaleString()}</div>
                  <div className="stats-change positive" style={{
                    fontSize: '12px',
                    color: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>↑ {timeFilter}</div>
                </div>
                <div className="stats-icon yellow" style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: '#FEF3C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#F59E0B'
                }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4l2-4z" fill="currentColor"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Links Section */}
          <div className="recent-links" style={{
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <div className="recent-links-header" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              width: '100%'
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1F2937',
                margin: 0
              }}>{t('dashboard.recentLinks.title')}</h2>
              <button className="view-all-btn" onClick={() => handleNavigation('/my-links')} style={{
                padding: '8px 16px',
                backgroundColor: 'transparent',
                color: '#3B82F6',
                border: '1px solid #3B82F6',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer'
              }}>{t('dashboard.viewAll')}</button>
            </div>
            <div className="links-list" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#6B7280' }}>
                  Loading recent links...
                </div>
              ) : recentLinks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                  <p>No links created yet. Create your first short link above!</p>
                </div>
              ) : recentLinks.map((link, index) => (
                <div key={index} className="link-item" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  backgroundColor: '#FAFAFA',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  <div className="link-info" style={{ 
                    flex: 1, 
                    minWidth: 0,
                    textAlign: 'left'
                  }}>
                    <a href={`https://${getShortUrl(link)}`} target="_blank" rel="noopener noreferrer" className="short-url" style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#3B82F6',
                      textDecoration: 'none',
                      display: 'block',
                      marginBottom: '4px'
                    }}>{getShortUrl(link)}</a>
                    <a href={link.originalUrl} target="_blank" rel="noopener noreferrer" className="original-url" style={{
                      fontSize: '13px',
                      color: '#6B7280',
                      textDecoration: 'none',
                      display: 'block',
                      marginBottom: '8px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>{link.originalUrl}</a>
                    <div className="link-meta" style={{
                      display: 'flex',
                      gap: '16px',
                      fontSize: '12px',
                      color: '#9CA3AF'
                    }}>
                      <span>{link.clickCount || 0} clicks</span>
                      <span>{formatDate(link.createdAt)}</span>
                    </div>
                  </div>
                  <div className="link-actions" style={{
                    display: 'flex',
                    gap: '8px',
                    marginLeft: '16px',
                    alignItems: 'center',
                    flexShrink: 0
                  }}>
                    <button
                      className=" copy-btn"
                      onClick={() => handleCopyLink(link)}
                      style={{
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: '#DBEAFE',
                        color: '#1E40AF',
                        border: '1px solid #BFDBFE',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#1E40AF';
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#DBEAFE';
                        e.target.style.color = '#1E40AF';
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <span>{copySuccess === (link.id || link._id) ? (t('common.copied') || 'Copied!') : t('common.copy')}</span>
                    </button>
                    
                    <button
                      className=" edit-btn"
                      onClick={() => handleEditLink(link)}
                      style={{
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: '#FEF3C7',
                        color: '#D97706',
                        border: '1px solid #FDE68A',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#D97706';
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#FEF3C7';
                        e.target.style.color = '#D97706';
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <span>{t('common.edit')}</span>
                    </button>
                    
                    <button
                      className=" delete-btn"
                      onClick={() => handleDeleteClick(link)}
                      style={{
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: '#FEE2E2',
                        color: '#DC2626',
                        border: '1px solid #FECACA',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#DC2626';
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#FEE2E2';
                        e.target.style.color = '#DC2626';
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2"/>
                        <line x1="10" y1="11" x2="10" y2="17" stroke="currentColor" strokeWidth="2"/>
                        <line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <span>{t('common.delete')}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade Promotion */}
          <div className="upgrade-promotion" style={{
            background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
            borderRadius: '12px',
            padding: '32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <div className="promotion-content" style={{ flex: 1 }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: 'white',
                marginBottom: '12px',
                margin: '0 0 12px 0'
              }}>{t('dashboard.upgradeTitle')}</h2>
              <p style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '20px',
                margin: '0 0 20px 0'
              }}>{t('dashboard.upgradeDescription')}</p>
              <button className="upgrade-promo-btn" onClick={() => handleNavigation('/subscription')} style={{
                padding: '12px 24px',
                backgroundColor: 'white',
                color: '#7C3AED',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                {t('dashboard.upgradeToPro')}
              </button>
            </div>
            <div className="promotion-image" style={{ marginLeft: '40px' }}>
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Background */}
                <rect width="120" height="120" rx="8" fill="#F4F3FF"/>
                
                {/* Chart bars */}
                <rect x="15" y="85" width="8" height="20" rx="4" fill="#5B21B6"/>
                <rect x="27" y="75" width="8" height="30" rx="4" fill="#5B21B6"/>
                <rect x="39" y="65" width="8" height="40" rx="4" fill="#5B21B6"/>
                <rect x="51" y="55" width="8" height="50" rx="4" fill="#5B21B6"/>
                <rect x="63" y="45" width="8" height="60" rx="4" fill="#5B21B6"/>
                <rect x="75" y="35" width="8" height="70" rx="4" fill="#5B21B6"/>
                <rect x="87" y="25" width="8" height="80" rx="4" fill="#5B21B6"/>
                
                {/* Trend line */}
                <path d="M19 89 L31 79 L43 69 L55 59 L67 49 L79 39 L91 29" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round"/>
                
                {/* Trend arrow */}
                <path d="M87 25 L91 29 L95 25" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                
                {/* Plant pot */}
                <ellipse cx="95" cy="95" rx="12" ry="8" fill="#F97316"/>
                <rect x="87" y="87" width="16" height="8" rx="2" fill="white"/>
                
                {/* Plant leaves */}
                <path d="M92 87 Q88 82 92 80 Q96 82 92 87" fill="#22C55E"/>
                <path d="M95 85 Q99 80 103 82 Q99 86 95 85" fill="#22C55E"/>
                <path d="M97 87 Q101 82 105 84 Q101 88 97 87" fill="#16A34A"/>
                
                {/* Plant stem */}
                <rect x="94" y="87" width="2" height="8" fill="#22C55E"/>
              </svg>
            </div>
          </div>

          {/* Delete Confirmation Dialog */}
          {deleteDialog.isOpen && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999
            }} onClick={handleCancelDelete}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '400px',
                width: '90%',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
              }} onClick={(e) => e.stopPropagation()}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#FEE2E2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '16px'
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1F2937',
                    margin: 0
                  }}>{t('common.deleteConfirmTitle') || 'Delete Link?'}</h3>
                </div>
                <p style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  marginBottom: '20px',
                  lineHeight: '1.5'
                }}>
                  {t('common.deleteConfirmMessage') || 'Are you sure you want to delete this link?'} <br />
                  <strong style={{ color: '#3B82F6' }}>{deleteDialog.linkUrl}</strong>
                </p>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={handleCancelDelete}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#F3F4F6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#E5E7EB'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#F3F4F6'}
                  >
                    {t('common.cancel') || 'Cancel'}
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#DC2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#B91C1C'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#DC2626'}
                  >
                    {t('common.delete') || 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Dialog */}
          {editDialog.isOpen && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999
            }} onClick={() => setEditDialog({ isOpen: false, link: null })}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '500px',
                width: '90%',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
              }} onClick={(e) => e.stopPropagation()}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1F2937',
                  marginBottom: '20px'
                }}>{t('common.editLink') || 'Edit Link'}</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const updatedData = {
                    title: formData.get('title'),
                    customCode: formData.get('customCode')
                  };
                  handleSaveEdit(editDialog.link.id || editDialog.link._id, updatedData);
                }}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>{t('dashboard.campaign') || 'Title/Campaign'}</label>
                    <input
                      type="text"
                      name="title"
                      defaultValue={editDialog.link.title}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>{t('dashboard.customBackhalf') || 'Custom Back-half'}</label>
                    <input
                      type="text"
                      name="customCode"
                      defaultValue={editDialog.link.shortCode}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      type="button"
                      onClick={() => setEditDialog({ isOpen: false, link: null })}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#F3F4F6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {t('common.cancel') || 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#3B82F6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {t('common.save') || 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

    </div>
  );
};

export default Dashboard;