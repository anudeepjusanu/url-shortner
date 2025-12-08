import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import MainHeader from './MainHeader';
import AccessDenied from './AccessDenied';
import { urlsAPI, qrCodeAPI } from '../services/api';
import { usePermissions } from '../contexts/PermissionContext';
import './CreateShortLink.css';

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
  if (!code || code.trim() === '') {
    return { valid: true, error: null };
  }

  const trimmedCode = code.trim();

  // Check length (minimum 3, maximum 50 characters)
  if (trimmedCode.length < 3) {
    return {
      valid: false,
      error: t('createLink.errors.aliasInvalidLength')
    };
  }

  if (trimmedCode.length > 50) {
    return {
      valid: false,
      error: t('createLink.errors.aliasInvalidLength')
    };
  }

  // Check format: Unicode letters, numbers, hyphens, and underscores (supports Arabic, Chinese, etc.)
  if (!/^[\p{L}\p{N}_-]+$/u.test(trimmedCode)) {
    return {
      valid: false,
      error: t('createLink.errors.aliasInvalidFormat')
    };
  }

  // Must start with letter or number (not hyphen or underscore)
  if (!/^[a-zA-Z0-9]/.test(trimmedCode)) {
    return {
      valid: false,
      error: t('createLink.errors.aliasInvalidStart')
    };
  }

  // Check if reserved
  if (RESERVED_ALIASES.includes(trimmedCode.toLowerCase())) {
    return {
      valid: false,
      error: t('createLink.errors.aliasReserved')
    };
  }

  return { valid: true, error: null };
};

const CreateShortLink = () => {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const [originalUrl, setOriginalUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [title, setTitle] = useState('');
  const [selectedDomainId, setSelectedDomainId] = useState('');
  const [availableDomains, setAvailableDomains] = useState([]);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [shortenedUrl, setShortenedUrl] = useState('');
  const [createdUrlId, setCreatedUrlId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [downloadingQR, setDownloadingQR] = useState(false);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [deniedAction, setDeniedAction] = useState('');

  // Field-specific error states
  const [urlError, setUrlError] = useState('');
  const [customCodeError, setCustomCodeError] = useState('');
  const [titleError, setTitleError] = useState('');

  // Debug: Log error states whenever they change
  useEffect(() => {
    console.log('Error states updated:', { urlError, customCodeError, titleError });
  }, [urlError, customCodeError, titleError]);

  useEffect(() => {
    fetchAvailableDomains();
  }, []);

  const fetchAvailableDomains = async () => {
    try {
      setLoadingDomains(true);
      const response = await urlsAPI.getAvailableDomains();

      console.log('Domains response:', response); // Debug log

      // Response structure: { success: true, data: { domains: [...] } }
      const domains = response.data?.domains || response.domains || [];
      setAvailableDomains(domains);

      // Set default domain
      const defaultDomain = domains.find(d => d.isDefault);
      if (defaultDomain) {
        setSelectedDomainId(defaultDomain.id || defaultDomain._id);
      }
    } catch (err) {
      console.error('Failed to fetch domains:', err);
      setError(t('createLink.errors.general'));
    } finally {
      setLoadingDomains(false);
    }
  };

  // Validate URL
  const validateUrl = (url) => {
    if (!url || url.trim() === '') {
      return { valid: false, error: t('createLink.errors.urlRequired') };
    }

    const trimmedUrl = url.trim();

    // Check length
    if (trimmedUrl.length > 2000) {
      return { valid: false, error: t('createLink.errors.urlTooLong') };
    }

    // Check if it's a valid URL format
    try {
      const urlObj = new URL(trimmedUrl);
      // Must start with http or https
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { valid: false, error: t('createLink.errors.invalidUrl') };
      }
      return { valid: true, error: null };
    } catch (e) {
      return { valid: false, error: t('createLink.errors.invalidUrl') };
    }
  };

  // Validate title
  const validateTitle = (titleValue) => {
    if (!titleValue || titleValue.trim() === '') {
      return { valid: true, error: null }; // Title is optional
    }

    const trimmedTitle = titleValue.trim();

    // Check length
    if (trimmedTitle.length > 100) {
      return { valid: false, error: t('createLink.errors.titleTooLong') };
    }

    // Check for invalid characters (allow letters, numbers, spaces, and common punctuation)
    if (!/^[a-zA-Z0-9\s\u0600-\u06FF\u0750-\u077F.,!?'"\-_()]+$/.test(trimmedTitle)) {
      return { valid: false, error: t('createLink.errors.titleInvalidChars') };
    }

    return { valid: true, error: null };
  };

  // Handle URL input change with validation
  const handleUrlChange = (e) => {
    const value = e.target.value;
    setOriginalUrl(value);

    // Clear general error when user starts typing
    if (error) setError('');

    // Clear field error immediately when user starts typing
    // Validation will happen on blur or submit
    if (urlError) setUrlError('');
  };

  // Handle URL blur (when user leaves the field)
  const handleUrlBlur = () => {
    console.log('URL blur triggered, value:', originalUrl);
    const validation = validateUrl(originalUrl);
    console.log('URL validation result:', validation);
    if (!validation.valid) {
      setUrlError(validation.error);
      console.log('Setting URL error:', validation.error);
    }
  };

  // Handle custom code input change with validation
  const handleCustomCodeChange = (e) => {
    const value = e.target.value;
    setCustomCode(value);

    // Clear general error when user starts typing
    if (error) setError('');

    // Clear field error immediately when user starts typing
    // Validation will happen on blur or submit
    if (customCodeError) setCustomCodeError('');
  };

  // Handle custom code blur
  const handleCustomCodeBlur = () => {
    if (customCode) {
      const validation = validateCustomCode(customCode, t);
      if (!validation.valid) {
        setCustomCodeError(validation.error);
      }
    }
  };

  // Handle title input change with validation
  const handleTitleChange = (e) => {
    const value = e.target.value;
    setTitle(value);

    // Clear general error when user starts typing
    if (error) setError('');

    // Clear field error immediately when user starts typing
    // Validation will happen on blur or submit
    if (titleError) setTitleError('');
  };

  // Handle title blur
  const handleTitleBlur = () => {
    if (title) {
      const validation = validateTitle(title);
      if (!validation.valid) {
        setTitleError(validation.error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check permission before creating
    if (!hasPermission('urls', 'create')) {
      setDeniedAction('create URLs');
      setShowAccessDenied(true);
      return;
    }

    setLoading(true);
    setError('');
    setShortenedUrl('');
    setSuccessMessage('');

    // Validate all fields before submission
    let hasError = false;
    let firstErrorField = null;

    // Validate URL (required field)
    const urlValidation = validateUrl(originalUrl);
    if (!urlValidation.valid) {
      setUrlError(urlValidation.error || t('common.fieldRequired') || 'This field is required');
      hasError = true;
      if (!firstErrorField) firstErrorField = 'originalUrl';
    }

    // Validate custom code
    if (customCode) {
      const codeValidation = validateCustomCode(customCode, t);
      if (!codeValidation.valid) {
        setCustomCodeError(codeValidation.error);
        hasError = true;
        if (!firstErrorField) firstErrorField = 'customCode';
      }
    }

    // Validate title
    if (title) {
      const titleValidation = validateTitle(title);
      if (!titleValidation.valid) {
        setTitleError(titleValidation.error);
        hasError = true;
        if (!firstErrorField) firstErrorField = 'title';
      }
    }

    // If any validation failed, focus the first error field and stop submission
    if (hasError) {
      setError(t('createLink.errors.fixErrors') || 'Please fix the errors below before submitting');
      setLoading(false);
      // Focus the first field with an error
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        if (element) {
          element.focus();
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    try {
      const response = await urlsAPI.createUrl({
        originalUrl: originalUrl,
        customCode: customCode || undefined,
        title: title || undefined,
        domainId: selectedDomainId || undefined,
      });

      console.log('API Response:', response); // Debug log

      // Response structure: { success: true, data: { url: {...}, domain: {...} } }
      if (!response.success || !response.data || !response.data.url) {
        throw new Error('Invalid response from server');
      }

      const createdUrl = response.data.url;
      const domainInfo = response.data.domain;

      // Use the domain from response or selected domain
      const baseUrl = domainInfo?.shortUrl || (availableDomains.find(d => d.id === selectedDomainId)?.shortUrl) || window.location.origin;
      const shortUrl = `${baseUrl}/${createdUrl.shortCode}`;

      setShortenedUrl(shortUrl);
      setCreatedUrlId(createdUrl._id || createdUrl.id);
      setSuccessMessage(t('createLink.success.title'));

      // Clear all field errors on success
      setUrlError('');
      setCustomCodeError('');
      setTitleError('');
    } catch (err) {
      console.error('Error creating short link:', err);

      // Parse error message to determine which field has the error
      const errorMessage = err.message || t('createLink.errors.general');
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
      // Check if error is about title
      else if (errorLower.includes('title')) {
        setTitleError(errorMessage);
      }

      // Set general error as well
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shortenedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shortenedUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadQRCode = async () => {
    if (!createdUrlId) return;

    try {
      setDownloadingQR(true);

      // First, generate the QR code if it doesn't exist
      await qrCodeAPI.generate(createdUrlId, {
        size: 300,
        format: 'png',
        errorCorrection: 'M',
        foregroundColor: '#000000',
        backgroundColor: '#FFFFFF',
        includeMargin: true
      });

      // Then download it
      const downloadUrl = `${process.env.REACT_APP_API_URL || 'https://laghhu.link/api'}/qr-codes/download/${createdUrlId}?format=png`;
      const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken');

      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `qrcode-${createdUrlId}.png`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Download failed');
      }
    } catch (err) {
      console.error('Error downloading QR code:', err);
      setError(err.message || 'Failed to download QR code');
    } finally {
      setDownloadingQR(false);
    }
  };

  const reset = () => {
    setOriginalUrl('');
    setCustomCode('');
    setTitle('');
    setShortenedUrl('');
    setCreatedUrlId(null);
    setError('');
    setSuccessMessage('');
    setCopied(false);
    setDownloadingQR(false);

    // Clear all field-specific errors
    setUrlError('');
    setCustomCodeError('');
    setTitleError('');

    const defaultDomain = availableDomains.find(d => d.isDefault);
    if (defaultDomain) {
      setSelectedDomainId(defaultDomain.id);
    }
  };

  return (
    <>
    <div className="analytics-container">
      <MainHeader />
      <div className="analytics-layout">
        <Sidebar />
        <div className="analytics-main">
          <div className="create-link-content">
            <div className="page-header">
              <div className="header-info">
                <h1 className="page-title">{t('createLink.title')}</h1>
                <p className="page-subtitle">{t('createLink.subtitle')}</p>
              </div>
            </div>

            <div className="create-link-form-container">
              <form onSubmit={handleSubmit} className="create-link-form">
                {error && (
                  <div className="alert alert-error">
                    <svg className="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                    <button type="button" onClick={() => setError('')} className="alert-close">×</button>
                  </div>
                )}

                {successMessage && !error && (
                  <div className="alert alert-success">
                    <svg className="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{successMessage}</span>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="originalUrl" className="form-label">
                    <svg className="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    {t('createLink.form.originalUrl')} *
                  </label>
                  <input
                    id="originalUrl"
                    type="url"
                    className={`form-input ${urlError ? 'form-input-error' : ''}`}
                    value={originalUrl}
                    onChange={handleUrlChange}
                    onBlur={handleUrlBlur}
                    placeholder={t('createLink.form.originalUrlPlaceholder')}
                    required
                  />
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
                    <p className="form-hint" style={{marginTop: '4px', color: '#6B7280', fontSize: '14px'}}>
                      Enter the long URL you want to shorten
                    </p>
                  )}
                </div>

                {availableDomains.length > 0 && (
                  <div className="form-group">
                    <label htmlFor="domain" className="form-label">
                      <svg className="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {t('createLink.form.domain')}
                    </label>
                    <select
                      id="domain"
                      className="form-input"
                      value={selectedDomainId}
                      onChange={(e) => setSelectedDomainId(e.target.value)}
                      disabled={loadingDomains}
                    >
                      {loadingDomains ? (
                        <option>{t('common.loading')}</option>
                      ) : (
                        availableDomains.map((domain) => (
                          <option key={domain.id} value={domain.id}>
                            {domain.fullDomain} {domain.isDefault ? `(${t('customDomains.status.active')})` : ''}
                          </option>
                        ))
                      )}
                    </select>
                    {selectedDomainId && (
                      <p className="form-hint">
                        {t('createLink.success.yourLink')} {availableDomains.find(d => d.id === selectedDomainId)?.shortUrl}/your-code
                      </p>
                    )}
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="customCode" className="form-label">
                      <svg className="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      {t('createLink.form.customAlias')}
                    </label>
                    <input
                      id="customCode"
                      type="text"
                      className={`form-input ${customCodeError ? 'form-input-error' : ''}`}
                      value={customCode}
                      onChange={handleCustomCodeChange}
                      onBlur={handleCustomCodeBlur}
                      placeholder={t('createLink.form.customAliasPlaceholder')}
                    />
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
                      <p className="form-hint" style={{marginTop: '4px', color: '#6B7280', fontSize: '14px'}}>
                        Leave empty for auto-generated code
                      </p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="title" className="form-label">
                      <svg className="label-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {t('createLink.form.title')}
                    </label>
                    <input
                      id="title"
                      type="text"
                      className={`form-input ${titleError ? 'form-input-error' : ''}`}
                      value={title}
                      onChange={handleTitleChange}
                      onBlur={handleTitleBlur}
                      placeholder={t('createLink.form.titlePlaceholder')}
                    />
                    {titleError && titleError.length > 0 && (
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
                        <span>{titleError}</span>
                      </div>
                    )}
                    {!titleError && (
                      <p className="form-hint" style={{marginTop: '4px', color: '#6B7280', fontSize: '14px'}}>
                        Optional: Add a descriptive title for your link
                      </p>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || urlError || customCodeError || titleError}
                  >
                    {loading ? (
                      <>
                        <svg className="btn-spinner" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {t('createLink.form.creating')}
                      </>
                    ) : (
                      <>
                        <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {t('createLink.form.createButton')}
                      </>
                    )}
                  </button>

                  {shortenedUrl && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={reset}
                    >
                      <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      {t('createLink.success.createAnother')}
                    </button>
                  )}
                </div>
              </form>

              {shortenedUrl && (
                <div className="success-result">
                  <div className="result-header">
                    <svg className="result-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="result-title">{t('createLink.success.title')}</h3>
                  </div>

                  <div className="result-url-container">
                    <div className="result-url">
                      <span className="url-text">{shortenedUrl}</span>
                    </div>
                    <div className="result-actions">
                      <button
                        onClick={copyToClipboard}
                        className="btn-action btn-action-copy"
                      >
                        {copied ? (
                          <>
                            <svg className="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {t('common.copied')}
                          </>
                        ) : (
                          <>
                            <svg className="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            {t('common.copy')}
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => window.open(shortenedUrl, '_blank')}
                        className="btn-action btn-action-visit"
                      >
                        <svg className="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        {t('common.viewMore')}
                      </button>

                      <button
                        onClick={downloadQRCode}
                        className="btn-action btn-action-qr"
                        disabled={downloadingQR}
                      >
                        {downloadingQR ? (
                          <>
                            <svg className="action-icon btn-spinner" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Downloading...
                          </>
                        ) : (
                          <>
                            <svg className="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                            QR Code
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Access Denied Modal */}
      {showAccessDenied && (
        <AccessDenied
          action={deniedAction}
          onClose={() => setShowAccessDenied(false)}
        />
      )}
    </>
  );
};

export default CreateShortLink;