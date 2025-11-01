import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { domainsAPI } from '../services/api';
import './CustomDomains.css';

const CustomDomains = () => {
  const navigate = useNavigate();
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Wizard states
  const [wizardStep, setWizardStep] = useState(1);
  const [newDomainName, setNewDomainName] = useState('');
  const [newSubdomain, setNewSubdomain] = useState('');

  // Action states
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('idle');
  const [verifyingDomain, setVerifyingDomain] = useState(null);
  const [deletingDomain, setDeletingDomain] = useState(null);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await domainsAPI.list();

      // Handle different response structures
      const domainsData = response.data?.domains || response.data?.data?.domains || [];
      setDomains(domainsData);
    } catch (err) {
      console.error('Failed to fetch domains:', err);
      setError(err.message || 'Failed to fetch domains. Please try again.');
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
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {type === 'verification' ? 'Verified' : 'Active'}
          </span>
        );
      case 'pending':
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M6 3V6L8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Pending
          </span>
        );
      case 'failed':
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800`}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="m8 4-4 4m0-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Failed
          </span>
        );
      case 'inactive':
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="m8 4-4 4m0-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Inactive
          </span>
        );
      default:
        return null;
    }
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!');
  };

  const handleAddDomain = async () => {
    try {
      setIsAddingDomain(true);
      const domainData = {
        domain: newDomainName.toLowerCase().trim(),
        subdomain: newSubdomain ? newSubdomain.toLowerCase().trim() : undefined,
        isDefault: false
      };

      await domainsAPI.add(domainData);
      await fetchDomains();

      setWizardStep(2);
      showToast('Domain added successfully!');
    } catch (err) {
      setError(err.message || 'Failed to add domain');
    } finally {
      setIsAddingDomain(false);
    }
  };

  const handleVerifyDomain = async (domainId) => {
    const targetId = domainId || selectedDomain?.id;
    if (!targetId) return;

    try {
      setVerificationStatus('checking');
      setVerifyingDomain(targetId);

      const response = await domainsAPI.verify(targetId);

      if (response.success || response.data?.success) {
        setVerificationStatus('success');
        await fetchDomains();
        showToast('Domain verified successfully!');

        if (wizardStep === 2) {
          setWizardStep(3);
        }
      } else {
        setVerificationStatus('failed');
        setError(response.message || response.data?.message || 'DNS verification failed');
      }
    } catch (err) {
      console.error('Domain verification error:', err);
      setVerificationStatus('failed');

      if (err.response?.status === 403) {
        setError('Access denied. Please make sure you own this domain.');
      } else if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else {
        setError(err.message || 'DNS verification failed');
      }
    } finally {
      setVerifyingDomain(null);
    }
  };

  const handleSetDefault = async (domainId) => {
    try {
      await domainsAPI.setDefaultDomain(domainId);
      await fetchDomains();
      showToast('Default domain updated!');
    } catch (err) {
      setError(err.message || 'Failed to set default domain');
    }
  };

  const handleDomainSettings = (domain) => {
    setSelectedDomain(domain);
    setShowDetailModal(true);
  };

  const handleRemoveDomain = async (domainId, domainName) => {
    if (!window.confirm(`Are you sure you want to remove ${domainName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingDomain(domainId);
      await domainsAPI.delete(domainId);
      await fetchDomains();
      showToast('Domain removed successfully!');
    } catch (err) {
      console.error('Failed to remove domain:', err);
      setError(err.message || 'Failed to remove domain. Please try again.');
    } finally {
      setDeletingDomain(null);
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderDomainTable = () => (
    <div className="domains-table-container">
      <div className="domains-table-header">
        <div>
          <h3 className="section-title">Connected Domains</h3>
          <p className="section-description">Manage your branded domains and SSL certificates</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="add-domain-btn-new"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 3.33334V12.6667M3.33334 8H12.6667" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Add New Domain
        </button>
      </div>

      <div className="domains-table">
        <div className="table-header">
          <div className="table-col">Domain Name</div>
          <div className="table-col">Status</div>
          <div className="table-col">Verification</div>
          <div className="table-col">Default</div>
          <div className="table-col">Date Added</div>
          <div className="table-col">Actions</div>
        </div>

        <div className="table-body">
          {loading ? (
            <div className="table-loading">
              <div className="loading-spinner"></div>
              <p>Loading domains...</p>
            </div>
          ) : domains.length === 0 ? (
            <div className="table-empty">
              <div className="empty-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="24" cy="24" r="20" fill="#F3F4F6"/>
                  <path d="M24 16V32M16 24H32" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h4>No domains found</h4>
              <p>Add your first domain to get started with branded short links.</p>
            </div>
          ) : (
            domains.map((domain) => {
              const domainId = domain.id || domain._id;
              const isVerified = domain.verificationStatus === 'verified';
              const isPending = domain.verificationStatus === 'pending';

              return (
                <div key={domainId} className="table-row">
                  <div className="table-col">
                    <div className="domain-name-cell">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 1L14.5 4.5V11.5C14.5 12.8807 11.7614 14 8 14C4.23858 14 1.5 12.8807 1.5 11.5V4.5L8 1Z" stroke="#6B7280" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <div>
                        <span className="domain-name">{domain.fullDomain || domain.domain}</span>
                        {domain.isDefault && (
                          <span className="default-badge">Default</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="table-col">
                    {getStatusBadge(domain.status || 'active', 'domain')}
                  </div>
                  <div className="table-col">
                    {getStatusBadge(domain.verificationStatus || 'pending', 'verification')}
                  </div>
                  <div className="table-col">
                    {domain.isDefault ? (
                      <span className="default-indicator">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6 1L7.854 4.708L12 5.354L9 8.292L9.708 12.5L6 10.646L2.292 12.5L3 8.292L0 5.354L4.146 4.708L6 1Z" fill="#3B82F6"/>
                        </svg>
                        Yes
                      </span>
                    ) : isVerified ? (
                      <button
                        onClick={() => handleSetDefault(domainId)}
                        className="set-default-btn"
                      >
                        Set as Default
                      </button>
                    ) : (
                      <span className="not-available">-</span>
                    )}
                  </div>
                  <div className="table-col">
                    <span className="date-text">{formatDate(domain.createdAt || domain.dateAdded)}</span>
                  </div>
                  <div className="table-col">
                    <div className="action-buttons">
                      <button
                        onClick={() => handleDomainSettings(domain)}
                        className="action-btn view-btn"
                        title="View Details"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 7s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      {isPending && (
                        <button
                          onClick={() => handleVerifyDomain(domainId)}
                          disabled={verifyingDomain === domainId}
                          className="action-btn verify-btn"
                          title="Verify DNS"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12.833 7A5.833 5.833 0 1 1 7 1.167" stroke="currentColor" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12.833 2.333L7 8.167L5.25 6.417" stroke="currentColor" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveDomain(domainId, domain.fullDomain || domain.domain)}
                        disabled={deletingDomain === domainId}
                        className="action-btn delete-btn"
                        title="Delete"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1.75 3.5H2.91667H12.25" stroke="currentColor" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M11.0833 3.5V11.6667C11.0833 12.0203 10.9428 12.3594 10.6927 12.6095C10.4426 12.8595 10.1036 13 9.75 13H4.25C3.89638 13 3.55724 12.8595 3.30719 12.6095C3.05714 12.3594 2.91667 12.0203 2.91667 11.6667V3.5M4.66667 3.5V2.33333C4.66667 1.97971 4.80714 1.64057 5.05719 1.39052C5.30724 1.14048 5.64638 1 6 1H8C8.35362 1 8.69276 1.14048 8.94281 1.39052C9.19286 1.64057 9.33333 1.97971 9.33333 2.33333V3.5" stroke="currentColor" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M6 6.41667V10.5" stroke="currentColor" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 6.41667V10.5" stroke="currentColor" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  const renderAddDomainWizard = () => (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Add New Domain</h3>
            <p className="modal-subtitle">Step {wizardStep} of 3</p>
          </div>
          <button onClick={resetModal} className="modal-close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="wizard-progress">
          <div className="progress-bar">
            <div className={`progress-step ${wizardStep >= 1 ? 'active' : ''}`}>1</div>
            <div className={`progress-line ${wizardStep > 1 ? 'active' : ''}`}></div>
            <div className={`progress-step ${wizardStep >= 2 ? 'active' : ''}`}>2</div>
            <div className={`progress-line ${wizardStep > 2 ? 'active' : ''}`}></div>
            <div className={`progress-step ${wizardStep >= 3 ? 'active' : ''}`}>3</div>
          </div>
        </div>

        <div className="modal-content">
          {wizardStep === 1 && (
            <div className="wizard-step">
              <h4>Enter Domain Information</h4>
              <div className="form-fields">
                <div className="form-field">
                  <label>Base Domain</label>
                  <input
                    type="text"
                    value={newDomainName}
                    onChange={(e) => setNewDomainName(e.target.value)}
                    placeholder="company.sa"
                    className="domain-input"
                  />
                  <p className="field-hint">Enter your base domain (e.g., company.sa, ministry.gov.sa)</p>
                </div>

                <div className="form-field">
                  <label>Subdomain (Optional)</label>
                  <input
                    type="text"
                    value={newSubdomain}
                    onChange={(e) => setNewSubdomain(e.target.value)}
                    placeholder="links"
                    className="domain-input"
                  />
                  <p className="field-hint">Optional: Add a subdomain for your short links (e.g., "links" for links.company.sa)</p>
                </div>

                {(newDomainName || newSubdomain) && (
                  <div className="domain-preview">
                    <p>Full domain: <strong>
                      {newSubdomain ? `${newSubdomain}.${newDomainName}` : newDomainName}
                    </strong></p>
                  </div>
                )}

                <div className="info-box">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V9H11V15ZM11 7H9V5H11V7Z" fill="#3B82F6"/>
                  </svg>
                  <div>
                    <h5>Custom Domain Setup</h5>
                    <p>Your domain will be configured with DNS verification and SSL certificate management.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="wizard-step">
              <h4>DNS Configuration</h4>
              <div className="dns-config">
                <div className="dns-instructions">
                  <h5>Please create the following DNS record:</h5>
                  <div className="dns-record-table">
                    <div className="dns-record-row">
                      <div className="dns-col">
                        <span className="dns-label">Type:</span>
                        <span className="dns-value">CNAME</span>
                      </div>
                      <div className="dns-col">
                        <span className="dns-label">Name:</span>
                        <span className="dns-value">{newSubdomain ? `${newSubdomain}.${newDomainName}` : newDomainName || 'links.company.sa'}</span>
                      </div>
                      <div className="dns-col">
                        <span className="dns-label">Value:</span>
                        <div className="dns-value-with-copy">
                          <span className="dns-value">laghhu.link</span>
                          <button onClick={() => copyToClipboard('laghhu.link')} className="copy-btn">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11.6667 5.25H6.41667C5.86438 5.25 5.41667 5.69772 5.41667 6.25V11.5C5.41667 12.0523 5.86438 12.5 6.41667 12.5H11.6667C12.219 12.5 12.6667 12.0523 12.6667 11.5V6.25C12.6667 5.69772 12.219 5.25 11.6667 5.25Z" stroke="#3B82F6" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M2.75 8.75H2.33333C1.96514 8.75 1.66667 8.45152 1.66667 8.08333V2.33333C1.66667 1.96514 1.96514 1.66667 2.33333 1.66667H8.08333C8.45152 1.66667 8.75 1.96514 8.75 2.33333V2.75" stroke="#3B82F6" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="warning-box">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 0L18.66 18H1.34L10 0ZM11 14H9V16H11V14ZM11 8H9V12H11V8Z" fill="#F59E0B"/>
                  </svg>
                  <div>
                    <h5>DNS Propagation</h5>
                    <p>DNS changes can take up to 24 hours to propagate globally. We'll automatically verify your domain once the DNS record is detected.</p>
                  </div>
                </div>

                <div className="verify-actions">
                  <button
                    onClick={() => handleVerifyDomain()}
                    disabled={verificationStatus === 'checking'}
                    className="verify-btn"
                  >
                    {verificationStatus === 'checking' ? (
                      <>
                        <div className="spinner-small"></div>
                        Checking DNS...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M14 8A6 6 0 1 1 8 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14 2L8 8L6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Check DNS Now
                      </>
                    )}
                  </button>

                  {verificationStatus === 'success' && (
                    <div className="status-message success">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      DNS record verified!
                    </div>
                  )}

                  {verificationStatus === 'failed' && (
                    <div className="status-message error">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      DNS record not found. Please check your configuration.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {wizardStep === 3 && verificationStatus === 'success' && (
            <div className="wizard-step success-step">
              <div className="success-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="24" cy="24" r="20" fill="#10B981"/>
                  <path d="M32 18L21 29L16 24" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h4>Domain Successfully Added!</h4>
              <p>
                {newDomainName || 'Your domain'} is now active and ready to use for creating branded short links.
              </p>

              <div className="domain-summary">
                <div className="summary-details">
                  <span className="summary-domain">{newDomainName || 'links.company.sa'}</span>
                  <span className="summary-status">DNS Verified • Ready for Use</span>
                </div>
                <div className="summary-icon">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16.5 8.5L7.5 17.5L3.5 13.5" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Active
                </div>
              </div>

              <button className="set-default-btn-modal">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 1L10.472 5.944L16 6.764L12 10.652L12.944 16.236L8 13.944L3.056 16.236L4 10.652L0 6.764L5.528 5.944L8 1Z" fill="currentColor"/>
                </svg>
                Set as Default Domain
              </button>
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
            className="btn-secondary"
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
            className="btn-primary"
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
        <div className="modal-container large">
          <div className="modal-header">
            <div>
              <h3 className="modal-title">{selectedDomain.domain}</h3>
              <p className="modal-subtitle">Domain configuration and activity</p>
            </div>
            <button onClick={() => setShowDetailModal(false)} className="modal-close">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="modal-content">
            <div className="detail-section">
              <h4>DNS Validation</h4>
              <div className="dns-validation">
                <div className="validation-status">
                  <span>Verification Status</span>
                  {getStatusBadge(selectedDomain.verificationStatus, 'verification')}
                </div>
                <div className="dns-record-display">
                  <div className="dns-record-row">
                    <div>
                      <span className="dns-label">Type:</span>
                      <span className="dns-value">CNAME</span>
                    </div>
                    <div>
                      <span className="dns-label">Name:</span>
                      <span className="dns-value">{selectedDomain.fullDomain}</span>
                    </div>
                    <div>
                      <span className="dns-label">Value:</span>
                      <div className="dns-value-with-copy">
                        <span className="dns-value">{selectedDomain.cnameTarget || 'laghhu.link'}</span>
                        <button onClick={() => copyToClipboard(selectedDomain.cnameTarget || 'laghhu.link')} className="copy-btn">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11.6667 5.25H6.41667C5.86438 5.25 5.41667 5.69772 5.41667 6.25V11.5C5.41667 12.0523 5.86438 12.5 6.41667 12.5H11.6667C12.219 12.5 12.6667 12.0523 12.6667 11.5V6.25C12.6667 5.69772 12.219 5.25 11.6667 5.25Z" stroke="#3B82F6" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2.75 8.75H2.33333C1.96514 8.75 1.66667 8.45152 1.66667 8.08333V2.33333C1.66667 1.96514 1.96514 1.66667 2.33333 1.66667H8.08333C8.45152 1.66667 8.75 1.96514 8.75 2.33333V2.75" stroke="#3B82F6" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <button className="recheck-btn">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 8A6 6 0 1 1 8 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 2L8 8L6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Re-check DNS
                </button>
              </div>
            </div>

            <div className="detail-section">
              <h4>Activity Log</h4>
              <div className="activity-log">
                <div className="activity-item success">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div>
                    <p>Domain Verified</p>
                    <span>{formatDate(selectedDomain.createdAt || selectedDomain.dateAdded)} • DNS configuration confirmed</span>
                  </div>
                </div>
                <div className="activity-item">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 3.33334V12.6667M3.33334 8H12.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div>
                    <p>Domain Added</p>
                    <span>{formatDate(selectedDomain.createdAt || selectedDomain.dateAdded)} • Added by {selectedDomain.owner?.email || 'User'}</span>
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
    <div className="dashboard-container">
      <Sidebar />

      <div className="main-area">
        {/* Header */}
        <header className="header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title">Custom Domains</h1>
              <div className="language-toggle">
                <button className="lang-btn active">EN</button>
                <button className="lang-btn">العربية</button>
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
            <span className="breadcrumb-item" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>Dashboard</span>
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L5 5L1 9" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="breadcrumb-item active">Custom Domains</span>
          </div>

          {/* Page Header */}
          <div className="page-header">
            <div>
              <h2 className="section-title">Domain Management</h2>
              <p className="section-description">Manage your branded domains and SSL certificates</p>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="error-banner">
              <div className="error-content">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 1C4.13438 1 1 4.13438 1 8C1 11.8656 4.13438 15 8 15C11.8656 15 15 11.8656 15 8C15 4.13438 11.8656 1 8 1ZM8 4C8.55312 4 9 4.44687 9 5V8C9 8.55312 8.55312 9 8 9C7.44688 9 7 8.55312 7 8V5C7 4.44687 7.44688 4 8 4ZM8 12C7.44688 12 7 11.5531 7 11C7 10.4469 7.44688 10 8 10C8.55312 10 9 10.4469 9 11C9 11.5531 8.55312 12 8 12Z" fill="#EF4444"/>
                </svg>
                <span>{error}</span>
                <button onClick={() => setError(null)}>×</button>
              </div>
            </div>
          )}

          {/* Toast Notification */}
          {toastMessage && (
            <div className="toast-notification">
              <div className="toast-content">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.5 4.5L6 12L2.5 8.5" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{toastMessage}</span>
              </div>
            </div>
          )}

          {/* Warning Banners for Pending Domains */}
          {domains.some(d => d.verificationStatus === 'pending') && (
            <div className="warning-banners">
              {domains
                .filter(d => d.verificationStatus === 'pending')
                .map(domain => (
                  <div key={domain.id} className="warning-banner">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M8 3V6L10 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <div>
                      <h4>Domain Verification Pending</h4>
                      <p>
                        <strong>{domain.fullDomain}</strong> is waiting for DNS verification.
                        <button onClick={() => handleVerifyDomain(domain.id)} className="verify-link">
                          Check DNS configuration
                        </button>
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {renderDomainTable()}
          {showAddModal && renderAddDomainWizard()}
          {showDetailModal && renderDomainDetailModal()}
        </main>
      </div>
    </div>
  );
};

export default CustomDomains;