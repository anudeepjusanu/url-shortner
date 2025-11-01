import React, { useState, useEffect } from 'react';
import { domainsAPI } from '../services/api';
import './CustomDomains.css';

const CustomDomains = () => {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newDomainName, setNewDomainName] = useState('');
  const [newSubdomain, setNewSubdomain] = useState('');
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('idle');
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await domainsAPI.getDomains();

      // Handle different response structures
      const domainsData = response.data?.data?.domains || response.data?.domains || response.domains || [];
      setDomains(domainsData);
      setError(null);
    } catch (err) {
      console.error('Error fetching domains:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch domains');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status, type = 'domain') => {
    const baseClasses = "inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full";

    switch (status) {
      case 'active':
      case 'verified':
        return (
          <span className={`${baseClasses} status-verified`}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {type === 'verification' ? 'Verified' : 'Active'}
          </span>
        );
      case 'pending':
        return (
          <span className={`${baseClasses} status-pending`}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Pending
          </span>
        );
      case 'failed':
        return (
          <span className={`${baseClasses} status-failed`}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Failed
          </span>
        );
      case 'inactive':
        return (
          <span className={`${baseClasses} status-inactive`}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Inactive
          </span>
        );
      default:
        return null;
    }
  };

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast('Copied to clipboard!');
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast('Copied to clipboard!');
    }
  };

  const handleAddDomain = async () => {
    try {
      setIsAddingDomain(true);
      const domainData = {
        domain: newDomainName.toLowerCase().trim(),
        subdomain: newSubdomain ? newSubdomain.toLowerCase().trim() : undefined,
        isDefault: false
      };

      await domainsAPI.createDomain(domainData);
      await fetchDomains();

      setWizardStep(2);
      showToast('Domain added successfully!');
    } catch (err) {
      console.error('Error adding domain:', err);
      setError(err.response?.data?.message || err.message || 'Failed to add domain');
    } finally {
      setIsAddingDomain(false);
    }
  };

  const handleVerifyDomain = async (domainId) => {
    const targetId = domainId || selectedDomain?.id;
    if (!targetId) return;

    try {
      setVerificationStatus('checking');

      const response = await domainsAPI.verifyDomain(targetId);

      if (response.data?.success || response.success) {
        setVerificationStatus('success');
        await fetchDomains();
        showToast('Domain verified successfully!');

        if (wizardStep === 2) {
          setWizardStep(3);
        }
      } else {
        setVerificationStatus('failed');
        setError(response.data?.message || response.message || 'DNS verification failed');
      }
    } catch (err) {
      console.error('Domain verification error:', err);
      setVerificationStatus('failed');

      if (err.response?.status === 403) {
        setError('Access denied. Please make sure you own this domain.');
      } else if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else {
        setError(err.response?.data?.message || err.message || 'DNS verification failed');
      }
    }
  };

  const handleSetDefault = async (domainId) => {
    try {
      await domainsAPI.setDefaultDomain(domainId);
      await fetchDomains();
      showToast('Default domain updated!');
    } catch (err) {
      console.error('Error setting default domain:', err);
      setError(err.response?.data?.message || err.message || 'Failed to set default domain');
    }
  };

  const handleDeleteDomain = async (domainId) => {
    if (!window.confirm('Are you sure you want to delete this domain?')) return;

    try {
      await domainsAPI.deleteDomain(domainId);
      await fetchDomains();
      showToast('Domain deleted successfully!');
    } catch (err) {
      console.error('Error deleting domain:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete domain');
    }
  };

  const resetModal = () => {
    setShowAddModal(false);
    setWizardStep(1);
    setNewDomainName('');
    setNewSubdomain('');
    setVerificationStatus('idle');
    setError(null);
  };

  const renderDomainTable = () => (
    <div className="domains-table-container">
      <div className="domains-table-header">
        <div className="header-content">
          <div>
            <h3 className="table-title">Connected Domains</h3>
            <p className="table-subtitle">Manage your branded domains and SSL certificates</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary add-domain-btn"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Domain
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="domains-table">
          <thead>
            <tr>
              <th>Domain Name</th>
              <th>Status</th>
              <th>Verification</th>
              <th>Default</th>
              <th>Date Added</th>
              <th>Added By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="loading-cell">
                  <div className="loading-content">
                    <div className="loading-spinner"></div>
                    Loading domains...
                  </div>
                </td>
              </tr>
            ) : domains.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-cell">
                  No domains found. Add your first domain to get started.
                </td>
              </tr>
            ) : (
              domains.map((domain) => (
                <tr key={domain.id || domain._id} className="domain-row">
                  <td>
                    <div className="domain-cell">
                      <div className="domain-info">
                        <svg className="w-4 h-4 domain-icon" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="domain-name">{domain.fullDomain || domain.domain}</p>
                          {domain.isDefault && (
                            <div className="default-badge">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              Default Domain
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="status-cell">
                      {getStatusBadge(domain.status, 'domain')}
                    </div>
                  </td>
                  <td>
                    <div className="status-cell">
                      {getStatusBadge(domain.verificationStatus || domain.verified ? 'verified' : 'pending', 'verification')}
                    </div>
                  </td>
                  <td>
                    <div className="default-cell">
                      {domain.isDefault ? (
                        <span className="default-yes">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          Yes
                        </span>
                      ) : (domain.verificationStatus === 'verified' || domain.verified) && domain.status === 'active' ? (
                        <button
                          onClick={() => handleSetDefault(domain.id || domain._id)}
                          className="set-default-btn"
                        >
                          Set as Default
                        </button>
                      ) : (
                        <span className="default-no">-</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="date-cell">
                      {new Date(domain.createdAt || domain.dateAdded).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div className="owner-cell">
                      {domain.owner?.email || domain.addedBy || 'Unknown'}
                    </div>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button
                        onClick={() => {
                          setSelectedDomain(domain);
                          setShowDetailModal(true);
                        }}
                        className="action-btn view-btn"
                        title="View Details"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      {(domain.verificationStatus === 'pending' || domain.verificationStatus === 'failed' || !domain.verified) && (
                        <button
                          onClick={() => handleVerifyDomain(domain.id || domain._id)}
                          className="action-btn verify-btn"
                          title="Verify DNS"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteDomain(domain.id || domain._id)}
                        className="action-btn delete-btn"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAddDomainWizard = () => (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-title-section">
            <h3 className="modal-title">Add New Domain</h3>
            <p className="modal-subtitle">Step {wizardStep} of 3</p>
          </div>
          <button
            onClick={resetModal}
            className="modal-close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="wizard-progress">
          <div className="progress-bar">
            <div className={`progress-step ${wizardStep >= 1 ? 'active' : ''} ${wizardStep > 1 ? 'completed' : ''}`}>1</div>
            <div className={`progress-line ${wizardStep > 1 ? 'completed' : ''}`}></div>
            <div className={`progress-step ${wizardStep >= 2 ? 'active' : ''} ${wizardStep > 2 ? 'completed' : ''}`}>2</div>
            <div className={`progress-line ${wizardStep > 2 ? 'completed' : ''}`}></div>
            <div className={`progress-step ${wizardStep >= 3 ? 'active' : ''}`}>3</div>
          </div>
        </div>

        <div className="modal-body">
          {wizardStep === 1 && (
            <div className="wizard-step">
              <h4 className="step-title">Enter Domain Information</h4>
              <div className="step-content">
                <div className="form-field">
                  <label className="form-label">Base Domain</label>
                  <input
                    type="text"
                    value={newDomainName}
                    onChange={(e) => setNewDomainName(e.target.value)}
                    placeholder="company.sa"
                    className="form-input"
                  />
                  <p className="form-help">
                    Enter your base domain (e.g., company.sa, ministry.gov.sa)
                  </p>
                </div>

                <div className="form-field">
                  <label className="form-label">Subdomain (Optional)</label>
                  <input
                    type="text"
                    value={newSubdomain}
                    onChange={(e) => setNewSubdomain(e.target.value)}
                    placeholder="links"
                    className="form-input"
                  />
                  <p className="form-help">
                    Optional: Add a subdomain for your short links (e.g., "links" for links.company.sa)
                  </p>
                </div>

                {(newDomainName || newSubdomain) && (
                  <div className="domain-preview">
                    <p className="preview-text">
                      Full domain: <span className="preview-domain">
                        {newSubdomain ? `${newSubdomain}.${newDomainName}` : newDomainName}
                      </span>
                    </p>
                  </div>
                )}

                <div className="info-box">
                  <div className="info-content">
                    <svg className="w-5 h-5 info-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h5 className="info-title">Custom Domain Setup</h5>
                      <p className="info-description">
                        Your domain will be configured with DNS verification and SSL certificate management.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="wizard-step">
              <h4 className="step-title">DNS Configuration</h4>
              <div className="step-content">
                <div className="dns-config">
                  <h5 className="dns-title">Please create the following DNS record:</h5>
                  <div className="dns-record">
                    <div className="dns-record-content">
                      <div className="dns-field">
                        <span className="dns-label">Type:</span>
                        <p className="dns-value">CNAME</p>
                      </div>
                      <div className="dns-field">
                        <span className="dns-label">Name:</span>
                        <p className="dns-value">{newSubdomain ? `${newSubdomain}.${newDomainName}` : newDomainName || 'links.company.sa'}</p>
                      </div>
                      <div className="dns-field">
                        <span className="dns-label">Value:</span>
                        <div className="dns-value-with-copy">
                          <p className="dns-value">laghhu.link</p>
                          <button
                            onClick={() => copyToClipboard('laghhu.link')}
                            className="copy-btn"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="warning-box">
                  <div className="warning-content">
                    <svg className="w-5 h-5 warning-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h5 className="warning-title">DNS Propagation</h5>
                      <p className="warning-description">
                        DNS changes can take up to 24 hours to propagate globally. We'll automatically verify your domain once the DNS record is detected.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="verify-section">
                  <button
                    onClick={() => handleVerifyDomain()}
                    disabled={verificationStatus === 'checking'}
                    className="btn btn-primary verify-now-btn"
                  >
                    {verificationStatus === 'checking' ? (
                      <div className="loading-spinner"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                    {verificationStatus === 'checking' ? 'Checking DNS...' : 'Check DNS Now'}
                  </button>

                  {verificationStatus === 'success' && (
                    <div className="success-message">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>DNS record verified!</span>
                    </div>
                  )}

                  {verificationStatus === 'failed' && (
                    <div className="error-message">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>DNS record not found. Please check your configuration.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {wizardStep === 3 && verificationStatus === 'success' && (
            <div className="wizard-step">
              <div className="success-content">
                <div className="success-icon">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h4 className="success-title">Domain Successfully Added!</h4>
                <p className="success-description">
                  {newDomainName || 'Your domain'} is now active and ready to use for creating branded short links.
                </p>

                <div className="domain-summary">
                  <div className="summary-content">
                    <div className="summary-info">
                      <p className="summary-domain">{newDomainName || 'links.company.sa'}</p>
                      <p className="summary-status">DNS Verified • Ready for Use</p>
                    </div>
                    <div className="summary-badge">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>Active</span>
                    </div>
                  </div>
                </div>

                <button className="btn btn-primary set-default-btn-large">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Set as Default Domain
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            onClick={() => {
              if (wizardStep > 1) {
                setWizardStep(wizardStep - 1);
              }
            }}
            disabled={wizardStep === 1}
            className="btn btn-secondary"
          >
            Previous
          </button>

          <button
            onClick={() => {
              if (wizardStep === 1) {
                if (!newDomainName.trim()) return;
                handleAddDomain();
              } else if (wizardStep === 2) {
                if (verificationStatus !== 'success') return;
                setWizardStep(3);
              } else if (wizardStep === 3) {
                resetModal();
              }
            }}
            disabled={
              (wizardStep === 1 && (!newDomainName.trim() || isAddingDomain)) ||
              (wizardStep === 2 && verificationStatus !== 'success')
            }
            className="btn btn-primary"
          >
            {isAddingDomain ? 'Adding...' :
             wizardStep === 1 ? 'Add Domain' :
             wizardStep === 3 && verificationStatus === 'success' ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderDomainDetailModal = () => {
    if (!selectedDomain) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-container detail-modal">
          <div className="modal-header">
            <div className="modal-title-section">
              <h3 className="modal-title">{selectedDomain.domain}</h3>
              <p className="modal-subtitle">Domain configuration and activity</p>
            </div>
            <button
              onClick={() => setShowDetailModal(false)}
              className="modal-close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="modal-body detail-body">
            {/* DNS Validation Section */}
            <div className="detail-section">
              <h4 className="detail-section-title">DNS Validation</h4>
              <div className="detail-section-content">
                <div className="detail-row">
                  <span className="detail-label">Verification Status</span>
                  {getStatusBadge(selectedDomain.verificationStatus || (selectedDomain.verified ? 'verified' : 'pending'), 'verification')}
                </div>
                <div className="dns-config">
                  <div className="dns-record">
                    <div className="dns-record-content">
                      <div className="dns-field">
                        <span className="dns-label">Type:</span>
                        <p className="dns-value">CNAME</p>
                      </div>
                      <div className="dns-field">
                        <span className="dns-label">Name:</span>
                        <p className="dns-value">{selectedDomain.fullDomain || selectedDomain.domain}</p>
                      </div>
                      <div className="dns-field">
                        <span className="dns-label">Value:</span>
                        <div className="dns-value-with-copy">
                          <p className="dns-value">{selectedDomain.cnameTarget || 'laghhu.link'}</p>
                          <button
                            onClick={() => copyToClipboard(selectedDomain.cnameTarget || 'laghhu.link')}
                            className="copy-btn"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <button className="btn btn-primary recheck-btn">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Re-check DNS
                </button>
              </div>
            </div>

            {/* Activity Log Section */}
            <div className="detail-section">
              <h4 className="detail-section-title">Activity Log</h4>
              <div className="detail-section-content">
                <div className="activity-log">
                  <div className="activity-item success">
                    <svg className="w-5 h-5 activity-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                    </svg>
                    <div className="activity-content">
                      <p className="activity-title">Domain Verified</p>
                      <p className="activity-description">{selectedDomain.dateAdded || selectedDomain.createdAt} • DNS configuration confirmed</p>
                    </div>
                  </div>
                  <div className="activity-item">
                    <svg className="w-5 h-5 activity-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <div className="activity-content">
                      <p className="activity-title">Domain Added</p>
                      <p className="activity-description">{selectedDomain.dateAdded || selectedDomain.createdAt} • Added by {selectedDomain.addedBy || selectedDomain.owner?.email || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="custom-domains-page">
      <div className="page-header">
        <div className="header-info">
          <h1 className="page-title">Domain Management</h1>
          <p className="page-subtitle">Manage your branded domains and SSL certificates</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="error-alert">
          <div className="error-content">
            <svg className="w-5 h-5 error-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="error-text">
              <h4 className="error-title">Error</h4>
              <p className="error-message">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="error-close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`toast ${toastMessage.type}`}>
          <div className="toast-content">
            <svg className={`w-5 h-5 toast-icon ${toastMessage.type}`} fill="currentColor" viewBox="0 0 20 20">
              {toastMessage.type === 'success' ? (
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              )}
            </svg>
            <p className="toast-message">{toastMessage.message}</p>
          </div>
        </div>
      )}

      {/* Warning Banners for Pending Domains */}
      {domains.some(d => d.verificationStatus === 'pending' || (!d.verified && d.status !== 'active')) && (
        <div className="pending-warnings">
          {domains
            .filter(d => d.verificationStatus === 'pending' || (!d.verified && d.status !== 'active'))
            .map(domain => (
              <div key={domain.id || domain._id} className="warning-banner">
                <div className="warning-content">
                  <svg className="w-5 h-5 warning-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <div className="warning-text">
                    <h4 className="warning-title">Domain Verification Pending</h4>
                    <p className="warning-description">
                      <strong>{domain.fullDomain || domain.domain}</strong> is waiting for DNS verification.
                      <button
                        onClick={() => handleVerifyDomain(domain.id || domain._id)}
                        className="warning-link"
                      >
                        Check DNS configuration
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {renderDomainTable()}
      {showAddModal && renderAddDomainWizard()}
      {showDetailModal && renderDomainDetailModal()}
    </div>
  );
};

export default CustomDomains;