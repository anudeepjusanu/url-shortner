import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import MainHeader from './MainHeader';
import { urlsAPI, qrCodeAPI } from '../services/api';
import './CreateShortLink.css';

const CreateShortLink = () => {
  const { t } = useTranslation();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShortenedUrl('');
    setSuccessMessage('');

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
    } catch (err) {
      console.error('Error creating short link:', err);
      setError(err.message || t('createLink.errors.general'));
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

    const defaultDomain = availableDomains.find(d => d.isDefault);
    if (defaultDomain) {
      setSelectedDomainId(defaultDomain.id);
    }
  };

  return (
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
                    className="form-input"
                    value={originalUrl}
                    onChange={(e) => setOriginalUrl(e.target.value)}
                    placeholder={t('createLink.form.originalUrlPlaceholder')}
                    required
                  />
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
                      className="form-input"
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value)}
                      placeholder={t('createLink.form.customAliasPlaceholder')}
                    />
                    <p className="form-hint">{t('createLink.form.customAlias')}</p>
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
                      className="form-input"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={t('createLink.form.titlePlaceholder')}
                    />
                    <p className="form-hint">{t('createLink.form.title')}</p>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || !originalUrl}
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
  );
};

export default CreateShortLink;
