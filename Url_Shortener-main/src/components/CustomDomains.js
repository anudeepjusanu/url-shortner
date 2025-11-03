import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import MainHeader from './MainHeader';
import { domainsAPI } from '../services/api';
import './CustomDomains.css';

const CustomDomains = () => {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDomainName, setNewDomainName] = useState('');
  const [newSubdomain, setNewSubdomain] = useState('');
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [verificationStatus, setVerificationStatus] = useState('idle');
  const [addedDomain, setAddedDomain] = useState(null);

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

  const handleAddDomain = async () => {
    if (!newDomainName.trim() || !newSubdomain.trim()) return;

    try {
      setIsAddingDomain(true);
      const fullDomain = `${newSubdomain}.${newDomainName}`;
      const domainData = {
        domain: newDomainName.toLowerCase().trim(),
        subdomain: newSubdomain.toLowerCase().trim(),
        fullDomain: fullDomain.toLowerCase().trim(),
        isDefault: false
      };

      const response = await domainsAPI.createDomain(domainData);
      setAddedDomain(response.data || { ...domainData, id: Date.now() });
      await fetchDomains();
      setWizardStep(2);
      setError(null);
    } catch (err) {
      console.error('Error adding domain:', err);
      setError(err.response?.data?.message || err.message || 'Failed to add domain');
    } finally {
      setIsAddingDomain(false);
    }
  };

  const handleVerifyDomain = async (domainId) => {
    const targetId = domainId || addedDomain?.id;
    if (!targetId) return;

    try {
      setVerificationStatus('checking');
      const response = await domainsAPI.verifyDomain(targetId);

      if (response.data?.success || response.success) {
        setVerificationStatus('success');
        await fetchDomains();
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
      setError(err.response?.data?.message || err.message || 'DNS verification failed');
    }
  };

  const resetWizard = () => {
    setShowAddModal(false);
    setWizardStep(1);
    setNewDomainName('');
    setNewSubdomain('');
    setVerificationStatus('idle');
    setAddedDomain(null);
    setError(null);
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Copied to clipboard!');
    }
  };

  const handleDeleteDomain = async (domainId) => {
    if (!window.confirm('Are you sure you want to delete this domain?')) return;

    try {
      await domainsAPI.deleteDomain(domainId);
      await fetchDomains();
    } catch (err) {
      console.error('Error deleting domain:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete domain');
    }
  };

  const renderAddDomainModal = () => (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="modal-container" style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Modal Header */}
        <div className="modal-header" style={{
          padding: '24px 24px 0 24px',
          borderBottom: '1px solid #E5E7EB',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>
                Add New Domain
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: '#6B7280' }}>
                Step {wizardStep} of 3
              </p>
            </div>
            <button
              onClick={resetWizard}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '0.25rem',
                color: '#6B7280'
              }}
            >
              ×
            </button>
          </div>

          {/* Progress Bar */}
          <div className="progress-bar" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            padding: '24px 0 16px 0'
          }}>
            <div className={`progress-step ${wizardStep >= 1 ? 'active' : ''} ${wizardStep > 1 ? 'completed' : ''}`} style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: wizardStep >= 1 ? (wizardStep > 1 ? '#10B981' : '#3B82F6') : '#F3F4F6',
              color: wizardStep >= 1 ? 'white' : '#6B7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {wizardStep > 1 ? '✓' : '1'}
            </div>
            <div style={{
              width: '40px',
              height: '2px',
              background: wizardStep > 1 ? '#10B981' : '#E5E7EB',
              borderRadius: '1px'
            }}></div>
            <div className={`progress-step ${wizardStep >= 2 ? 'active' : ''} ${wizardStep > 2 ? 'completed' : ''}`} style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: wizardStep >= 2 ? (wizardStep > 2 ? '#10B981' : '#3B82F6') : '#F3F4F6',
              color: wizardStep >= 2 ? 'white' : '#6B7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {wizardStep > 2 ? '✓' : '2'}
            </div>
            <div style={{
              width: '40px',
              height: '2px',
              background: wizardStep > 2 ? '#10B981' : '#E5E7EB',
              borderRadius: '1px'
            }}></div>
            <div className={`progress-step ${wizardStep >= 3 ? 'active' : ''}`} style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: wizardStep >= 3 ? '#3B82F6' : '#F3F4F6',
              color: wizardStep >= 3 ? 'white' : '#6B7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              3
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '0 24px 24px 24px' }}>
          {wizardStep === 1 && (
            <div className="wizard-step">
              <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                Enter Domain Information
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                    Base Domain
                  </label>
                  <input
                    type="text"
                    value={newDomainName}
                    onChange={(e) => setNewDomainName(e.target.value)}
                    placeholder="company.com"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                    Enter your base domain (e.g., company.com, example.org)
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                    Subdomain <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={newSubdomain}
                    onChange={(e) => setNewSubdomain(e.target.value)}
                    placeholder="links"
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                    Add a subdomain for your short links (e.g., "links" for links.company.com)
                  </p>
                </div>

                {(newDomainName && newSubdomain) && (
                  <div style={{
                    padding: '12px',
                    background: '#F3F4F6',
                    borderRadius: '6px',
                    border: '1px solid #E5E7EB'
                  }}>
                    <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
                      Full domain: <strong>
                        {newSubdomain}.{newDomainName}
                      </strong>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="wizard-step">
              <h4 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                DNS Configuration
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
                  Please create the following DNS record in your domain's DNS settings:
                </p>

                <div style={{
                  padding: '16px',
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: '500', color: '#374151' }}>Type:</span>
                      <span style={{ fontFamily: 'monospace', color: '#111827' }}>CNAME</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: '500', color: '#374151' }}>Name:</span>
                      <span style={{ fontFamily: 'monospace', color: '#111827' }}>
                        {newSubdomain}.{newDomainName}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '500', color: '#374151' }}>Value:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'monospace', color: '#111827' }}>laghhu.link</span>
                        <button
                          onClick={() => copyToClipboard('laghhu.link')}
                          style={{
                            padding: '4px 8px',
                            background: '#3B82F6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: '12px',
                  background: '#FEF3CD',
                  border: '1px solid #F59E0B',
                  borderRadius: '6px'
                }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#92400E' }}>
                    <strong>Note:</strong> DNS changes can take up to 24 hours to propagate globally.
                    We'll automatically verify your domain once the DNS record is detected.
                  </p>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => handleVerifyDomain()}
                    disabled={verificationStatus === 'checking'}
                    style={{
                      padding: '12px 24px',
                      background: verificationStatus === 'checking' ? '#9CA3AF' : '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: verificationStatus === 'checking' ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {verificationStatus === 'checking' ? 'Checking DNS...' : 'Verify DNS Now'}
                  </button>

                  {verificationStatus === 'failed' && (
                    <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#DC2626' }}>
                      DNS record not found. Please check your configuration and try again.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {wizardStep === 3 && verificationStatus === 'success' && (
            <div className="wizard-step" style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: '#10B981',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px auto'
              }}>
                <span style={{ fontSize: '32px', color: 'white' }}>✓</span>
              </div>
              <h4 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                Domain Successfully Added!
              </h4>
              <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#6B7280' }}>
                {newSubdomain}.{newDomainName} is now active and ready to use for creating branded short links.
              </p>

              <div style={{
                padding: '16px',
                background: '#F0FDF4',
                border: '1px solid #10B981',
                borderRadius: '8px',
                marginBottom: '24px'
              }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#059669', textAlign: 'center' }}>
                  <strong>{newSubdomain}.{newDomainName}</strong>
                  <br />
                  DNS Verified • Ready for Use
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{
          padding: '16px 24px',
          borderTop: '1px solid #E5E7EB',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={() => {
              if (wizardStep > 1) {
                setWizardStep(wizardStep - 1);
              } else {
                resetWizard();
              }
            }}
            style={{
              padding: '8px 16px',
              background: 'white',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              color: '#374151'
            }}
          >
            {wizardStep === 1 ? 'Cancel' : 'Previous'}
          </button>

          <button
            onClick={() => {
              if (wizardStep === 1) {
                if (!newDomainName.trim() || !newSubdomain.trim()) return;
                handleAddDomain();
              } else if (wizardStep === 2) {
                if (verificationStatus !== 'success') return;
                setWizardStep(3);
              } else if (wizardStep === 3) {
                resetWizard();
              }
            }}
            disabled={
              (wizardStep === 1 && (!newDomainName.trim() || !newSubdomain.trim() || isAddingDomain)) ||
              (wizardStep === 2 && verificationStatus !== 'success')
            }
            style={{
              padding: '8px 16px',
              background: '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              opacity: (wizardStep === 1 && (!newDomainName.trim() || !newSubdomain.trim() || isAddingDomain)) ||
                       (wizardStep === 2 && verificationStatus !== 'success') ? 0.6 : 1
            }}
          >
            {isAddingDomain ? 'Adding...' :
             wizardStep === 1 ? 'Add Domain' :
             wizardStep === 2 ? 'Next' : 'Finish'}
          </button>
        </div>
      </div>
    </div>
  );


  return (
    <div className="analytics-container">
      <MainHeader />
      <div className="analytics-layout">
        <Sidebar />
        <div className="analytics-main">
          <div className="analytics-content">
            <div className="page-header">
              <button
                className="create-link-btn"
                onClick={() => setShowAddModal(true)}
                style={{
                  marginLeft: 'auto',
                  minWidth: 180,
                  color: "white",
                  padding: "8px 16px",
                  background: "#3B82F6",
                  border: "none",
                  borderRadius: "5px"
                }}
              >
                Add New Domain
              </button>
              <div className="header-info">
                <h1 className="page-title">Custom Domains</h1>
                <p className="page-subtitle">Manage your branded domains for short links</p>
              </div>
            </div>

            {error && (
              <div className="error-message">
                <span>{error}</span>
                <button onClick={() => setError(null)}>&times;</button>
              </div>
            )}

            <div className="links-container">
              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading domains...</p>
                </div>
              ) : domains.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <h3>No domains found</h3>
                  <p>Add your first custom domain to start creating branded short links</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="create-first-link-btn"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Your First Domain
                  </button>
                </div>
              ) : (
                <div className="links-list">
                  {domains.map((domain) => {
                    const domainId = domain.id || domain._id;
                    return (
                      <div key={domainId} className="link-card">
                        <div className="link-content">
                          <div className="link-header">
                            <div className="link-title-section">
                              <h3 className="link-title">{domain.fullDomain || domain.domain}</h3>
                              <div className="link-status">
                                <span className={`status-badge ${domain.status === 'active' ? 'active' : 'inactive'}`}>
                                  {domain.status === 'active' ? 'Active' : 'Inactive'}
                                </span>
                                {domain.isDefault && (
                                  <span className="status-badge active">Default</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="link-urls">
                            <div className="url-row">
                              <span className="url-label">Domain:</span>
                              <span className="short-url">{domain.fullDomain || domain.domain}</span>
                            </div>
                            <div className="url-row">
                              <span className="url-label">Status:</span>
                              <span className="original-url">
                                {domain.verified || domain.verificationStatus === 'verified' ? 'DNS Verified' : 'Pending Verification'}
                              </span>
                            </div>
                          </div>
                          <div className="link-meta">
                            <div className="meta-item">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m0 0v13a2 2 0 01-2 2H10a2 2 0 01-2-2V7z" />
                              </svg>
                              <span>Added {new Date(domain.createdAt || domain.dateAdded).toLocaleDateString()}</span>
                            </div>
                            <div className="meta-item">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span>{domain.owner?.email || domain.addedBy || 'Unknown'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="link-actions">
                          {(!domain.verified && domain.verificationStatus !== 'verified') && (
                            <button
                              onClick={() => handleVerifyDomain(domainId)}
                              className="action-btn analytics"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Verify
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteDomain(domainId)}
                            className="action-btn delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {showAddModal && renderAddDomainModal()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomDomains;