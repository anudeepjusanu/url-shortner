import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomDomainsSidebar from './CustomDomainsSidebar';
import { domainsAPI } from '../services/api';
import './CustomDomains.css';

const CustomDomains = () => {
  const navigate = useNavigate();
  const [domainName, setDomainName] = useState('');
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [addingDomain, setAddingDomain] = useState(false);
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

  const handleAddDomain = async () => {
    if (!domainName.trim()) {
      setError('Please enter a domain name');
      return;
    }

    try {
      setAddingDomain(true);
      setError(null);

      const domainData = {
        domain: domainName.toLowerCase().trim(),
      };

      await domainsAPI.add(domainData);
      setSuccessMessage('Domain added successfully! Please configure DNS records.');
      setDomainName('');

      // Refresh domains list
      await fetchDomains();

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Failed to add domain:', err);
      setError(err.message || 'Failed to add domain. Please try again.');
    } finally {
      setAddingDomain(false);
    }
  };

  const handleVerifyDomain = async (domainId) => {
    try {
      setVerifyingDomain(domainId);
      setError(null);

      const response = await domainsAPI.verify(domainId);

      if (response.success) {
        setSuccessMessage('Domain verified successfully!');
        await fetchDomains();
      } else {
        setError(response.message || 'DNS verification failed. Please check your DNS records.');
      }

      setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 5000);
    } catch (err) {
      console.error('Failed to verify domain:', err);
      setError(err.message || 'Failed to verify domain. Please check DNS records and try again.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setVerifyingDomain(null);
    }
  };

  const handleDomainSettings = (domain) => {
    // For now, just show an alert. You can implement a modal later
    alert(`Settings for: ${domain.fullDomain || domain.domain}`);
  };

  const handleRemoveDomain = async (domainId, domainName) => {
    if (!window.confirm(`Are you sure you want to remove ${domainName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingDomain(domainId);
      setError(null);

      await domainsAPI.delete(domainId);
      setSuccessMessage('Domain removed successfully!');

      // Refresh domains list
      await fetchDomains();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to remove domain:', err);
      setError(err.message || 'Failed to remove domain. Please try again.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setDeletingDomain(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  return (
    <div className="dashboard-container">
      {/* Custom Domains Sidebar Component */}
      <CustomDomainsSidebar />

      {/* Main Content Area */}
      <div className="main-area">
        {/* Header */}
        <header className="header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title">Custom Domains</h1>
              <div className="language-toggle">
                <button className="lang-btn active">EN</button>
                <button className="lang-btn">AR</button>
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

          {/* Page Description */}
          <div className="page-description">
            <p>Add your own branded domains to create professional short links that match your brand.</p>
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

          {/* Add New Domain Section */}
          <div className="add-domain-section">
            <h3>Add New Domain</h3>
            <div className="add-domain-form">
              <div className="form-group">
                <label htmlFor="domainName">Domain Name</label>
                <input
                  type="text"
                  id="domainName"
                  placeholder="brand.sa"
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value)}
                  className="domain-input"
                  disabled={addingDomain}
                />
              </div>
              <button
                className="add-domain-btn"
                onClick={handleAddDomain}
                disabled={addingDomain}
              >
                {addingDomain ? (
                  <>
                    <div style={{
                      width: '1rem',
                      height: '1rem',
                      border: '2px solid white',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }}></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 3.33334V12.6667M3.33334 8H12.6667" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Add Domain
                  </>
                )}
              </button>
            </div>
          </div>

          {/* DNS Configuration Section */}
          <div className="dns-configuration">
            <div className="dns-header">
              <h3>DNS Configuration</h3>
              <div className="dns-warning">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.00003 1.16666L12.8334 12.8333H1.16669L7.00003 1.16666Z" stroke="#F59E0B" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 5.25V7.58334" stroke="#F59E0B" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 9.91666H7.00584" stroke="#F59E0B" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Configure DNS records to verify domain ownership
              </div>
            </div>

            <div className="dns-record">
              <h4>One CNAME Record (Required for link redirection) needs to be added</h4>
              <div className="dns-table">
                <div className="dns-table-header">
                  <div className="dns-col">Type</div>
                  <div className="dns-col">Name</div>
                  <div className="dns-col">Value</div>
                </div>
                <div className="dns-table-row">
                  <div className="dns-col">
                    <span className="dns-type">CNAME</span>
                    <button className="copy-btn" title="Copy">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.6667 5.25H6.41667C5.86438 5.25 5.41667 5.69772 5.41667 6.25V11.5C5.41667 12.0523 5.86438 12.5 6.41667 12.5H11.6667C12.219 12.5 12.6667 12.0523 12.6667 11.5V6.25C12.6667 5.69772 12.219 5.25 11.6667 5.25Z" stroke="#3B82F6" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2.75 8.75H2.33333C1.96514 8.75 1.66667 8.45152 1.66667 8.08333V2.33333C1.66667 1.96514 1.96514 1.66667 2.33333 1.66667H8.08333C8.45152 1.66667 8.75 1.96514 8.75 2.33333V2.75" stroke="#3B82F6" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  <div className="dns-col">
                    <span className="dns-name">your-domain.sa</span>
                    <button className="copy-btn" title="Copy">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.6667 5.25H6.41667C5.86438 5.25 5.41667 5.69772 5.41667 6.25V11.5C5.41667 12.0523 5.86438 12.5 6.41667 12.5H11.6667C12.219 12.5 12.6667 12.0523 12.6667 11.5V6.25C12.6667 5.69772 12.219 5.25 11.6667 5.25Z" stroke="#3B82F6" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2.75 8.75H2.33333C1.96514 8.75 1.66667 8.45152 1.66667 8.08333V2.33333C1.66667 1.96514 1.96514 1.66667 2.33333 1.66667H8.08333C8.45152 1.66667 8.75 1.96514 8.75 2.33333V2.75" stroke="#3B82F6" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  <div className="dns-col">
                    <span className="dns-value">laghhu.link</span>
                    <button className="copy-btn" title="Copy" onClick={() => {
                      navigator.clipboard.writeText('laghhu.link');
                      setSuccessMessage('Copied to clipboard!');
                      setTimeout(() => setSuccessMessage(null), 2000);
                    }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.6667 5.25H6.41667C5.86438 5.25 5.41667 5.69772 5.41667 6.25V11.5C5.41667 12.0523 5.86438 12.5 6.41667 12.5H11.6667C12.219 12.5 12.6667 12.0523 12.6667 11.5V6.25C12.6667 5.69772 12.219 5.25 11.6667 5.25Z" stroke="#3B82F6" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2.75 8.75H2.33333C1.96514 8.75 1.66667 8.45152 1.66667 8.08333V2.33333C1.66667 1.96514 1.96514 1.66667 2.33333 1.66667H8.08333C8.45152 1.66667 8.75 1.96514 8.75 2.33333V2.75" stroke="#3B82F6" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="dns-instructions">
              <h4>How to add DNS records:</h4>
              <ul>
                <li>Log in to your domain registrar or DNS provider</li>
                <li>Navigate to DNS management or DNS settings</li>
                <li>Add the CNAME record for link redirection</li>
                <li>Save changes and wait for DNS propagation (up to 24 hours)</li>
                <li>Click "Verify Domain" button below</li>
              </ul>
            </div>
          </div>

          {/* Your Domains Section */}
          <div className="domains-section">
            <h3>Your Domains</h3>

            {loading ? (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '3rem'
              }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  border: '3px solid #E5E7EB',
                  borderTopColor: '#3B82F6',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }}></div>
              </div>
            ) : domains.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#6B7280'
              }}>
                <p>No domains added yet. Add your first domain above to get started!</p>
              </div>
            ) : (
              <div className="domains-list">
                {domains.map((domain) => {
                  const domainId = domain.id || domain._id;
                  const isVerified = domain.verificationStatus === 'verified';
                  const isPending = domain.verificationStatus === 'pending';

                  return (
                    <div key={domainId} className={`domain-item ${isVerified ? 'verified' : 'pending'}`}>
                      <div className="domain-info">
                        <div className="domain-status">
                          <div className={`status-icon ${isVerified ? 'verified-icon' : 'pending-icon'}`}>
                            {isVerified ? (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="6" cy="6" r="5" stroke="white" strokeWidth="1.5"/>
                                <path d="M6 3V6L8 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          <div className="domain-details">
                            <span className="domain-name">{domain.fullDomain || domain.domain}</span>
                            <div className="domain-meta">
                              <span className={`status-badge ${isVerified ? 'verified-badge' : 'pending-badge'}`}>
                                {isVerified ? 'Verified' : 'Pending'}
                              </span>
                              <span className="domain-date">
                                Added {formatDate(domain.createdAt || domain.dateAdded)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="domain-actions">
                        {isPending && (
                          <button
                            className="action-btn verify-btn"
                            onClick={() => handleVerifyDomain(domainId)}
                            disabled={verifyingDomain === domainId}
                          >
                            {verifyingDomain === domainId ? 'Verifying...' : 'Verify Domain'}
                          </button>
                        )}
                        <button
                          className="action-btn settings-btn"
                          onClick={() => handleDomainSettings(domain)}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" stroke="#6B7280" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Settings
                        </button>
                        <button
                          className="action-btn remove-btn"
                          onClick={() => handleRemoveDomain(domainId, domain.fullDomain || domain.domain)}
                          disabled={deletingDomain === domainId}
                        >
                          {deletingDomain === domainId ? 'Removing...' : 'Remove'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
};

export default CustomDomains;
