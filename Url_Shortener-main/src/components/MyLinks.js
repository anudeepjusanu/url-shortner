







import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import MainHeader from './MainHeader';
import Toast from './Toast';
import { urlsAPI, qrCodeAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import './MyLinks.css';

// Reserved aliases that cannot be used for shortened URLs
const RESERVED_ALIASES = [
  // Frontend routes
  'admin', 'dashboard', 'analytics', 'profile', 'settings',
  'login', 'register', 'logout', 'signup', 'signin',
  'my-links', 'mylinks', 'links', 'urls',
  'create-short-link', 'create-link', 'create',
  'qr-codes', 'qr', 'qrcode', 'qrcodes',
  'utm-builder', 'utm', 'builder',
  'custom-domains', 'domains', 'domain',
  'subscription', 'billing', 'payment', 'pricing',
  'team-members', 'team', 'members', 'users',
  'content-filter', 'filter', 'content',

  // Backend/API routes
  'api', 'auth', 'v1', 'v2', 'v3',
  'graphql', 'webhook', 'webhooks',
  'oauth', 'callback', 'redirect',

  // Common system pages
  'about', 'contact', 'help', 'support',
  'terms', 'privacy', 'legal', 'policy',
  'docs', 'documentation', 'guide', 'tutorial',
  'blog', 'news', 'updates', 'changelog',
  'status', 'health', 'ping', 'test',

  // Security/Admin
  'root', 'administrator', 'superuser', 'moderator',
  'system', 'config', 'configuration', 'setup',
  'install', 'upgrade', 'migrate', 'backup',

  // Common reserved words
  'www', 'ftp', 'mail', 'smtp', 'pop3',
  'assets', 'static', 'public', 'cdn',
  'download', 'upload', 'file', 'files',
  'img', 'image', 'images', 'css', 'js',
  'favicon', 'robots', 'sitemap', 'feed', 'rss'
];


// Validation function for custom alias
const validateCustomCode = (code, t) => {
  // Empty is valid (will be auto-generated)
  console.log('Validating custom code:', code);
  if (!code || code.trim() === '') {
    return { valid: true, error: null };
  }

  const trimmedCode = code.trim();

  // Check length (minimum 3, maximum 50 characters)
  if (trimmedCode.length < 3) {
    return {
      valid: false,
      error: t('createLink.errors.aliasInvalidLength') || 'Custom alias must be between 3 and 50 characters'
    };
  }

  if (trimmedCode.length > 50) {
    return {
      valid: false,
      error: t('createLink.errors.aliasInvalidLength') || 'Custom alias must be between 3 and 50 characters'
    };
  }

  // Check format: Allow all Unicode letters, numbers, hyphens, underscores
  // Unicode-aware regex: \p{L} = any kind of letter from any language, \p{N} = any kind of numeric digit
  const validPattern = /^[\p{L}\p{N}_-]+$/u;
  if (!validPattern.test(trimmedCode)) {
    return {
      valid: false,
      error: t('createLink.errors.aliasInvalidFormat') || 'Custom alias can only contain letters (any language), numbers, hyphens, and underscores'
    };
  }

  // Must start with letter or number (including Arabic)
  // Must start with a letter or number (Unicode)
  const startsWithLetterOrNumber = /^[\p{L}\p{N}]/u;
  if (!startsWithLetterOrNumber.test(trimmedCode)) {
    return {
      valid: false,
      error: t('createLink.errors.aliasInvalidStart') || 'Custom alias must start with a letter or number'
    };
  }
  
  console.log('Custom code passed all validations:', trimmedCode);
  
  // Check if reserved
  if (RESERVED_ALIASES.includes(trimmedCode.toLowerCase())) {
    return {
      valid: false,
      error: t('createLink.errors.aliasReserved') || 'This alias is reserved and cannot be used'
    };
  }

  return { valid: true, error: null };
};

function MyLinks() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const [links, setLinks] = useState([]);
  const [showCreateShortLink, setShowCreateShortLink] = useState(false);
  // State for create short link form
  const [longUrl, setLongUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const [selectedDomainId, setSelectedDomainId] = useState('');
  const [availableDomains, setAvailableDomains] = useState([]);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [generateQR, setGenerateQR] = useState(false);
  const [, setShowUTMModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, linkId: null, linkUrl: '' });
  
  // Field-specific error states
  const [urlError, setUrlError] = useState('');
  const [customCodeError, setCustomCodeError] = useState('');

  // Toast notification state
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchLinks();
    fetchAvailableDomains();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      // Show error toast
      setToast({
        type: 'error',
        message: t('errors.failedToLoadDomains') || 'Failed to load available domains. Please refresh the page.'
      });
    } finally {
      setLoadingDomains(false);
    }
  };

  const fetchLinks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await urlsAPI.list({ page: 1, limit: 100 });
      const linksData = response.data?.urls || response.data?.data?.urls || [];
      setLinks(linksData);
        console.log(linksData, "232323232")

    } catch (err) {
      const errorMsg = err.message || t('errors.generic');
      setError(errorMsg);
      // Show error toast
      setToast({
        type: 'error',
        message: t('errors.failedToLoadLinks') || 'Failed to load links. Please try again.'
      });
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
      console.error('Failed to copy link:', err);
      // Show error toast instead of alert
      setToast({
        type: 'error',
        message: t('errors.failedToCopyLink') || 'Failed to copy link to clipboard. Please try again.'
      });
    }
  };

  const handleDeleteClick = (link) => {
    const linkId = link.id || link._id;
    const shortUrl = link.domain && link.domain !== 'laghhu.link'
      ? `${link.domain}/${link.shortCode}`
      : `laghhu.link/${link.shortCode}`;

    setDeleteDialog({
      isOpen: true,
      linkId: linkId,
      linkUrl: shortUrl
    });
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleteLoading(deleteDialog.linkId);
      await urlsAPI.delete(deleteDialog.linkId);
      setLinks(links.filter(link => (link.id || link._id) !== deleteDialog.linkId));
      setDeleteDialog({ isOpen: false, linkId: null, linkUrl: '' });

      // Show success toast
      setToast({
        type: 'success',
        message: t('myLinks.deleteSuccess') || 'Link deleted successfully'
      });
    } catch (err) {
      const errorMsg = t('errors.generic') || 'Failed to delete link';

      // Show error toast
      setToast({
        type: 'error',
        message: errorMsg
      });
    } finally {
      setDeleteLoading(null);
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
    if (diffDays === 0) return t('dates.today');
    if (diffDays === 1) return t('dates.yesterday');
    if (diffDays < 7) return t('dates.daysAgo', { count: diffDays });
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return t('dates.weeksAgo', { count: weeks });
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

  // Validate URL
  const validateUrl = (url) => {
    if (!url || url.trim() === '') {
      return { valid: false, error: t('createLink.errors.urlRequired') || 'URL is required' };
    }

    const trimmedUrl = url.trim();

    // Check length
    if (trimmedUrl.length > 2000) {
      return { valid: false, error: t('createLink.errors.urlTooLong') || 'URL is too long (max 2000 characters)' };
    }

    // Check if it's a valid URL format
    try {
      const urlObj = new URL(trimmedUrl);
      // Must start with http or https
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { valid: false, error: t('createLink.errors.invalidUrl') || 'URL must start with http:// or https://' };
      }
      return { valid: true, error: null };
    } catch (e) {
      return { valid: false, error: t('createLink.errors.invalidUrl') || 'Please enter a valid URL' };
    }
  };

  // Handle URL input change with validation
  const handleUrlChange = (e) => {
    const value = e.target.value;
    setLongUrl(value);

    // Clear general error when user starts typing
    if (error) setError(null);

    // Only validate if user has typed something (not empty)
    if (value.trim() !== '') {
      const validation = validateUrl(value);
      if (validation.valid) {
        setUrlError('');
      } else {
        setUrlError(validation.error);
      }
    } else {
      setUrlError('');
    }
  };

  // Handle URL blur (when user leaves the field)
  const handleUrlBlur = () => {
    console.log('URL blur triggered, value:', longUrl);
    const validation = validateUrl(longUrl);
    console.log('URL validation result:', validation);
    if (!validation.valid) {
      setUrlError(validation.error);
      console.log('Setting URL error:', validation.error);
    }
  };

  // Handle custom code input change with validation
  const handleCustomCodeChange = (e) => {
    const value = e.target.value;
    setCustomName(value);

    // Clear general error when user starts typing
    if (error) setError(null);

    // Validate the custom code in real-time (including when empty since it's optional)
    const validation = validateCustomCode(value, t);
    if (validation.valid) {
      setCustomCodeError('');
    } else {
      setCustomCodeError(validation.error);
    }
  };

  // Handle custom code blur
  const handleCustomCodeBlur = () => {
    if (customName) {
      const validation = validateCustomCode(customName, t);
      if (!validation.valid) {
        setCustomCodeError(validation.error);
      }
    }
  };

  // Handlers for create short link form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate all fields before submission
    let hasError = false;

    // Validate URL
    const urlValidation = validateUrl(longUrl);
    if (!urlValidation.valid) {
      setUrlError(urlValidation.error);
      hasError = true;
    }

    // Validate custom code
    if (customName) {
      const codeValidation = validateCustomCode(customName, t);
      console.log('Custom code validation result:', codeValidation.error);
      if (!codeValidation.valid) {
        setCustomCodeError(codeValidation.error);
        hasError = true;
      }
    }

    // If any validation failed, stop submission
    if (hasError) {
      setError(t('createLink.errors.fixErrors') || 'Please fix the errors below before submitting');
      return;
    }

    try {
      const response = await urlsAPI.createUrl({
        originalUrl: longUrl,
        customCode: customName || undefined,
        title: customName || undefined,
        domainId: selectedDomainId || undefined,
      });
      console.log('Create URL response:', response);
      if (response.success && response.data && response.data.url) {
        const createdUrl = response.data.url;
        const urlId = createdUrl._id || createdUrl.id;

        // Generate QR code if checkbox was checked
        if (generateQR && urlId) {
          try {
            await qrCodeAPI.generate(urlId, {
              size: 300,
              format: 'png',
              errorCorrection: 'M',
              foregroundColor: '#000000',
              backgroundColor: '#FFFFFF',
              includeMargin: true
            });
          } catch (qrErr) {
            console.error('Error generating QR code:', qrErr);
            // Show warning toast but don't fail the whole operation
            setToast({
              type: 'warning',
              message: t('errors.failedToGenerateQR') || 'Failed to generate QR code for this link.'
            });
          }
        }

        // Successfully created, refresh the list
        await fetchLinks();

        // Clear form and close modal
        setLongUrl('');
        setCustomName('');
        setGenerateQR(false);
        setShowCreateShortLink(false);
        setError(null);

        // Clear all field errors on success
        setUrlError('');
        setCustomCodeError('');

        // Show success toast
        setToast({
          type: 'success',
          message: t('createLink.success.created') || 'Short link created successfully!'
        });
      } else {
        const errorMsg = t('createLink.errors.general') || 'Failed to create link';
        setError(errorMsg);
        // Show error toast
        setToast({
          type: 'error',
          message: errorMsg
        });
      }
    } catch (err) {
      console.error('Error creating short link:', err);
      console.log('Error details:', err);
      console.log('Error message:', err.message);
      console.log('Error response data:', err.response);
      
      // Parse error message to determine which field has the error
      const errorMessage = err.response?.data?.errors?.[0]?.message || err.message || t('createLink.errors.general');
      const errorLower = errorMessage.toLowerCase();

      // Check if error is about URL
      if (errorLower.includes('url') && !errorLower.includes('alias')) {
        setUrlError(errorMessage);
      }
      // Check if error is about alias/custom code
      else if (errorLower.includes('alias') ||
               errorLower.includes('reserved') ||
               errorLower.includes('taken') ||
               errorLower.includes('exists') ||
               errorLower.includes('code')) {
        setCustomCodeError(errorMessage);
      }

      // Set general error as well
      setError(errorMessage);

      // Show error toast
      setToast({
        type: 'error',
        message: errorMessage
      });
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
    // Show success toast instead of alert
    setToast({
      type: 'success',
      message: t('notifications.draftSaved') || 'Draft saved!'
    });
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

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

        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          .page-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px;
          }

          .page-header > div {
            text-align: center !important;
          }

          .create-short-link-btn {
            width: 100% !important;
            min-width: auto !important;
          }

          .stats-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }

          .link-card {
            flex-direction: column !important;
            padding: 12px 16px !important;
            gap: 12px;
          }

          .link-info {
            width: 100%;
            text-align: ${isRTL ? 'right' : 'left'} !important;
          }

          .link-urls {
            align-items: ${isRTL ? 'flex-end' : 'flex-start'} !important;
          }

          .short-url {
            flex-direction: ${isRTL ? 'row-reverse' : 'row'} !important;
          }

          .link-actions {
            width: 100%;
            flex-direction: ${isRTL ? 'row-reverse' : 'row'} !important;
            margin: 0 !important;
            gap: 6px !important;
          }

          .link-actions button {
            flex: 1;
            padding: 8px 10px !important;
            font-size: 12px !important;
            justify-content: center;
          }

          .link-actions button svg {
            width: 12px;
            height: 12px;
          }
        }

        @media (max-width: 480px) {
          .link-actions {
            flex-wrap: wrap;
          }

          .link-actions button {
            min-width: calc(50% - 3px);
          }

          .link-actions button:nth-child(3) {
            width: 100%;
          }
        }
      `}</style>
      <div className="analytics-container">
        <MainHeader />
      <div className="analytics-layout">
        <Sidebar />
        <div className="analytics-main">
          <div className="analytics-content">
            <div className="page-header" style={{
              display: 'flex',
              // flexDirection: isRTL ? 'row-reverse' : 'row',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: showCreateShortLink ? '24px' : '24px'
            }}>
              {!showCreateShortLink && (
                <div style={{
                  margin: 0,
                  textAlign: isRTL ? 'right' : 'left'
                }}>
                  <h1 style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#111827',
                    marginBottom: '4px',
                    margin: '0 0 4px 0'
                  }}>{t('myLinks.title')}</h1>
                  <p style={{
                    color: '#6B7280',
                    fontSize: '14px',
                    margin: 0
                  }}>{t('myLinks.subtitle')}</p>
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
                  flexShrink: 0
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
                        {t('createLink.form.originalUrl')} *
                      </label>
                      <div className="input-container">
                        <input
                          type="url"
                          value={longUrl}
                          onChange={handleUrlChange}
                          onBlur={handleUrlBlur}
                          placeholder={t('createLink.form.originalUrlPlaceholder')}
                          className="url-input"
                          style={{
                            borderColor: urlError ? '#EF4444' : '#D1D5DB'
                          }}
                          required
                        />
                        <button type="button" className="paste-btn">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 1H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zM5 3h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                      {urlError && urlError.length > 0 && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginTop: '8px',
                          padding: '8px 12px',
                          backgroundColor: '#FEE2E2',
                          border: '1px solid #FCA5A5',
                          borderRadius: '6px',
                          color: '#DC2626',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span>{urlError}</span>
                        </div>
                      )}
                      {!urlError && (
                        <p style={{marginTop: '4px', color: '#6B7280', fontSize: '12px'}}>
                          {t('createLink.form.urlHint') || 'Enter the long URL you want to shorten'}
                        </p>
                      )}
                    </div>

                    {/* Domain Selection */}
                    {availableDomains.length > 0 && (
                      <div className="form-section">
                        <label className="form-label">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M1 7h12M7 1c1.5 0 3 2.5 3 6s-1.5 6-3 6-3-2.5-3-6 1.5-6 3-6z" stroke="currentColor" strokeWidth="1.5" />
                          </svg>
                          {t('createLink.form.domain') || 'Domain'}
                        </label>
                        <select
                          value={selectedDomainId}
                          onChange={(e) => setSelectedDomainId(e.target.value)}
                          disabled={loadingDomains}
                          className="url-input"
                          style={{
                            cursor: 'pointer',
                            paddingRight: '32px',
                            backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%236B7280\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 12px center',
                            appearance: 'none'
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
                            marginTop: '6px'
                          }}>
                            {t('createLink.success.yourLink') || 'Short URL'}: https://{availableDomains.find(d => d.id === selectedDomainId)?.fullDomain}/your-code
                          </p>
                        )}
                      </div>
                    )}

                    {/* Custom Link Input */}
                    <div className="form-section">
                      <label className="form-label">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {t('createLink.form.customAlias')}
                      </label>
                      <div className="custom-url-input">
                        <span className="url-prefix">
                          {availableDomains.find(d => d.id === selectedDomainId)?.fullDomain || 'laghhu.link'}/
                        </span>
                        <input
                          type="text"
                          value={customName}
                          onChange={handleCustomCodeChange}
                          onBlur={handleCustomCodeBlur}
                          placeholder={t('createLink.form.customAliasPlaceholder')}
                          className="custom-input"
                          style={{
                            borderColor: customCodeError ? '#EF4444' : '#D1D5DB'
                          }}
                        />
                      </div>
                      {customCodeError && customCodeError.length > 0 && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginTop: '8px',
                          padding: '8px 12px',
                          backgroundColor: '#FEE2E2',
                          border: '1px solid #FCA5A5',
                          borderRadius: '6px',
                          color: '#DC2626',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span>{customCodeError}</span>
                        </div>
                      )}
                      {!customCodeError && (
                        <p style={{marginTop: '4px', color: '#6B7280', fontSize: '12px'}}>
                          {t('createLink.form.aliasHint') || 'Leave empty for auto-generated code'}
                        </p>
                      )}
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
                      <button 
                        type="submit" 
                        className="create-link-btn"
                        disabled={!longUrl || urlError || customCodeError}
                      >
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
                          flexDirection: isRTL ? 'row-reverse' : 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'all 0.2s',
                          cursor: 'pointer'
                        }}>
                          <div className="link-info" style={{
                            flex: 1,
                            minWidth: 0,
                            textAlign: isRTL ? 'right' : 'left'
                          }}>
                            <div className="link-title" style={{
                              fontSize: '15px',
                              fontWeight: '600',
                              color: '#1F2937',
                              marginBottom: '8px'
                            }}>{link.title || t('myLinks.table.title')}</div>
                            <div className="link-urls" 
                            // style={{
                            //   display: 'flex',
                            //   flexDirection: 'column',
                            //   gap: '4px',
                            //   marginBottom: '8px',
                            //   alignItems: isRTL ? 'flex-end' : 'flex-start'
                            // }}
                            >
                              {/* <a
                                href={link.domain && link.domain !== 'laghhu.link' ? `http://${link.domain}/${link.shortCode}` : `https://laghhu.link/${link.shortCode}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="short-url"
                                style={{
                                  fontSize: '14px',
                                  color: '#3B82F6',
                                  fontWeight: '500',
                                  display: 'flex',
                                  // flexDirection: isRTL ? 'row-reverse' : 'row',
                                  alignItems: 'center',
                                  gap: '6px',
                                  textDecoration: 'none'
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                {link.domain && link.domain !== 'laghhu.link' ? `${link.domain}/${link.shortCode}` : `laghhu.link/${link.shortCode}`}
                              </a> */}
                              <a
                                href={link.originalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="short-url"
                                style={{
                                  fontSize: '14px',
                                  color: '#3B82F6',
                                  fontWeight: '500',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  textDecoration: 'none'
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                {link.domain && link.domain !== 'laghhu.link' ? `${link.domain}/${link.shortCode}` : `laghhu.link/${link.shortCode}`}
                              </a>
                              <a
                                href={link.originalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="original-url"
                                style={{
                                  fontSize: '13px',
                                  color: '#6B7280',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  textDecoration: 'none',
                                  direction: 'ltr',
                                  textAlign: isRTL ? 'right' : 'left',
                                  width: '100%'
                                }}
                              >{link.originalUrl}</a>
                            </div>
                            <div  
                            style={{
                              display: 'flex',
                              // flexDirection: isRTL ? 'row-reverse' : 'row',
                              gap: '16px',
                              fontSize: '12px',
                              color: '#9CA3AF',
                              // justifyContent: isRTL ? 'flex-end' : 'flex-start'
                            }}
                            >
                              <span 
                              style={{
                                display: 'flex',
                                // flexDirection: isRTL ? 'row-reverse' : 'row',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                  <line x1="16" y1="2" x2="16" y2="6"/>
                                  <line x1="8" y1="2" x2="8" y2="6"/>
                                  <line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                                {formatDate(link.createdAt)}
                              </span>
                              <span 
                              style={{
                                // display: 'flex',
                                // flexDirection: isRTL ? 'row-reverse' : 'row',
                                // alignItems: 'center',
                                gap: '4px'
                              }}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9"/>
                                </svg>
                                {link.clickCount || 0} {t('myLinks.table.clicks')}
                              </span>
                            </div>
                          </div>
                          <div className="link-actions" style={{
                            display: 'flex',
                            flexDirection: isRTL ? 'row-reverse' : 'row',
                            gap: '8px',
                            marginLeft: isRTL ? '0' : '16px',
                            marginRight: isRTL ? '16px' : '0'
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
                            <button onClick={() => navigate(`/analytics/${linkId}`)} style={{
                              padding: '8px 16px',
                              fontSize: '13px',
                              fontWeight: '500',
                              color: '#7C3AED',
                              backgroundColor: '#F3E8FF',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                              </svg>
                              {t('myLinks.actions.analytics')}
                            </button>
                            <button onClick={() => handleDeleteClick(link)} disabled={deleteLoading === linkId} style={{
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
                      disabled={deleteLoading === deleteDialog.linkId}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#DC2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: deleteLoading === deleteDialog.linkId ? 'not-allowed' : 'pointer',
                        opacity: deleteLoading === deleteDialog.linkId ? 0.6 : 1,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => { if (!deleteLoading) e.target.style.backgroundColor = '#B91C1C'; }}
                      onMouseLeave={(e) => { if (!deleteLoading) e.target.style.backgroundColor = '#DC2626'; }}
                    >
                      {deleteLoading === deleteDialog.linkId ? t('common.loading') : t('common.delete') || 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

export default MyLinks;

