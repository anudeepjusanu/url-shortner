import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import MainHeader from './MainHeader';
import { domainsAPI } from '../services/api';
import './CustomDomains.css';

const CustomDomains = () => {
  const { t } = useTranslation();
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAddingDomain, setIsAddingDomain] = useState(false);

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [baseDomain, setBaseDomain] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [wizardStep, setWizardStep] = useState(1);
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
      setError(err.response?.data?.message || err.message || t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  // Reset wizard state
  // const resetWizard = () => {
  //   setCurrentStep(1);
  //   setBaseDomain('');
  //   setSubdomain('');
  //   setNewDomainName('');
  // };

  // Wizard navigation
  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAddDomain = async () => {
    // Validate input
    if (!baseDomain.trim()) {
      setError(t('errors.validationError'));
      return;
    }

    try {
      setIsAddingDomain(true);

      // Construct full domain from subdomain and base domain
      const fullDomain = subdomain.trim()
        ? `${subdomain.toLowerCase().trim()}.${baseDomain.toLowerCase().trim()}`
        : baseDomain.toLowerCase().trim();

      const domainData = {
        domain: baseDomain.toLowerCase().trim(),
        subdomain: subdomain.trim() ? subdomain.toLowerCase().trim() : undefined,
        fullDomain: fullDomain,
        isDefault: false
      };

      const response = await domainsAPI.createDomain(domainData);
      const addedDomainData = response.data?.data || response.data || { ...domainData, id: Date.now() };
      setAddedDomain(addedDomainData);
      await fetchDomains();
      setWizardStep(2);
      setError(null);
    } catch (err) {
      console.error('Error adding domain:', err);
      setError(err.response?.data?.message || err.message || t('errors.generic'));
    } finally {
      setIsAddingDomain(false);
    }
  };

  const handleVerifyDomain = async (domainId) => {
    const targetId = domainId || addedDomain?.id;
    if (!targetId) return;

    try {
      const response = await domainsAPI.verifyDomain(targetId);

      if (response.data?.success || response.success) {
        await fetchDomains();
        if (wizardStep === 2) {
          setWizardStep(3);
        }
      } else {
        setError(response.data?.message || response.message || t('errors.generic'));
      }
    } catch (err) {
      console.error('Domain verification error:', err);
      setError(err.response?.data?.message || err.message || t('errors.generic'));
    }
  };

  const resetWizard = () => {
    setShowAddModal(false);
    setWizardStep(1);
    setCurrentStep(1);
    setBaseDomain('');
    setSubdomain('');
    setAddedDomain(null);
    setError(null);
  };

  const handleDeleteDomain = async (domainId) => {
    if (!window.confirm(t('myLinks.confirmDelete'))) return;

    try {
      await domainsAPI.deleteDomain(domainId);
      await fetchDomains();
    } catch (err) {
      console.error('Error deleting domain:', err);
      setError(err.response?.data?.message || err.message || t('errors.generic'));
    }
  };

  // Step indicator component
  const renderStepIndicator = () => (
    <div style={{ marginBottom: '2rem' }}>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
        Step {currentStep} of 3
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {[1, 2, 3].map((step) => (
          <React.Fragment key={step}>
            <div
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                backgroundColor: currentStep >= step ? '#3B82F6' : '#E5E7EB',
                color: currentStep >= step ? 'white' : '#9CA3AF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                fontSize: '0.875rem'
              }}
            >
              {step}
            </div>
            {step < 3 && (
              <div
                style={{
                  flex: 1,
                  height: '2px',
                  backgroundColor: currentStep > step ? '#3B82F6' : '#E5E7EB'
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  // Step 1: Enter Domain Information
  const renderStep1 = () => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
        {t('customDomains.addDomain.title')}
      </h3>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
          {t('customDomains.addDomain.domainName')}
        </label>
        <input
          type="text"
          value={baseDomain}
          onChange={(e) => setBaseDomain(e.target.value)}
          placeholder={t('customDomains.addDomain.domainPlaceholder')}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '1rem',
            boxSizing: 'border-box'
          }}
          required
        />
        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
          {t('customDomains.addDomain.domainName')}
        </p>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
          {t('customDomains.addDomain.subdomain')}
        </label>
        <input
          type="text"
          value={subdomain}
          onChange={(e) => setSubdomain(e.target.value)}
          placeholder={t('customDomains.addDomain.subdomainPlaceholder')}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '1rem',
            boxSizing: 'border-box'
          }}
        />
        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
          {t('customDomains.addDomain.subdomain')}
        </p>
      </div>

      <div style={{
        backgroundColor: '#EFF6FF',
        border: '1px solid #BFDBFE',
        borderRadius: '6px',
        padding: '1rem',
        display: 'flex',
        gap: '0.75rem'
      }}>
        <div style={{ flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ color: '#3B82F6' }}>
            <path
              d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V9H11V15ZM11 7H9V5H11V7Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div>
          <p style={{ fontWeight: '600', fontSize: '0.875rem', color: '#1E40AF', marginBottom: '0.25rem' }}>
            {t('customDomains.addDomain.title')}
          </p>
          <p style={{ fontSize: '0.875rem', color: '#1E40AF', margin: 0 }}>
            {t('customDomains.verification.instructions')}
          </p>
        </div>
      </div>
    </div>
  );

  // Step 2: DNS Configuration
  const renderStep2 = () => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
        {t('customDomains.verification.title')}
      </h3>

      <div style={{
        backgroundColor: '#FEF3C7',
        border: '1px solid #FDE68A',
        borderRadius: '6px',
        padding: '1rem',
        marginBottom: '1.5rem'
      }}>
        <p style={{ fontSize: '0.875rem', color: '#92400E', margin: 0 }}>
          {t('customDomains.verification.instructions')}
        </p>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
          {t('customDomains.table.domain')}:
        </p>
        <div style={{
          padding: '0.75rem',
          backgroundColor: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '1rem',
          color: '#1F2937'
        }}>
          {subdomain.trim() ? `${subdomain}.${baseDomain}` : baseDomain || t('customDomains.addDomain.domainPlaceholder')}
        </div>
      </div>
    </div>
  );

  // Step 3: Review and Confirm
  const renderStep3 = () => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
        {t('common.confirm')}
      </h3>

      <div style={{
        backgroundColor: '#F9FAFB',
        border: '1px solid #E5E7EB',
        borderRadius: '6px',
        padding: '1.5rem'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
            {t('customDomains.table.domain')}
          </p>
          <p style={{ fontSize: '1rem', fontWeight: '600', color: '#1F2937' }}>
            {subdomain.trim() ? `${subdomain}.${baseDomain}` : baseDomain || t('customDomains.addDomain.domainPlaceholder')}
          </p>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
            {t('customDomains.addDomain.domainName')}
          </p>
          <p style={{ fontSize: '1rem', fontWeight: '500', color: '#1F2937' }}>
            {baseDomain || t('customDomains.addDomain.domainPlaceholder')}
          </p>
        </div>

        {subdomain.trim() && (
          <div>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              {t('customDomains.addDomain.subdomain')}
            </p>
            <p style={{ fontSize: '1rem', fontWeight: '500', color: '#1F2937' }}>
              {subdomain}
            </p>
          </div>
        )}
      </div>

      <div style={{
        backgroundColor: '#DCFCE7',
        border: '1px solid #BBF7D0',
        borderRadius: '6px',
        padding: '1rem',
        marginTop: '1.5rem'
      }}>
        <p style={{ fontSize: '0.875rem', color: '#166534', margin: 0 }}>
          {t('customDomains.verification.instructions')}
        </p>
      </div>
    </div>
  );

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
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>{t('customDomains.addDomain.title')}</h3>
          <button
            onClick={() => {
              setShowAddModal(false);
              resetWizard();
            }}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.25rem',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        {renderStepIndicator()}

        <form onSubmit={(e) => {
          e.preventDefault();
          if (currentStep === 3) {
            handleAddDomain();
          }
        }}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', marginTop: '2rem' }}>
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              style={{
                padding: '0.5rem 1.5rem',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                borderRadius: '4px',
                cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
                opacity: currentStep === 1 ? 0.5 : 1,
                fontSize: '0.875rem'
              }}
            >
              {t('common.back')}
            </button>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={currentStep === 1 && !baseDomain.trim()}
                style={{
                  padding: '0.5rem 1.5rem',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (currentStep === 1 && !baseDomain.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (currentStep === 1 && !baseDomain.trim()) ? 0.6 : 1,
                  fontSize: '0.875rem'
                }}
              >
                {t('common.next')}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isAddingDomain || !baseDomain.trim()}
                style={{
                  padding: '0.5rem 1.5rem',
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (isAddingDomain || !baseDomain.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (isAddingDomain || !baseDomain.trim()) ? 0.6 : 1,
                  fontSize: '0.875rem'
                }}
              >
                {isAddingDomain ? t('customDomains.addDomain.adding') : t('customDomains.addDomain.addButton')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );


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
        .create-link-btn:hover,
        .create-first-link-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .create-link-btn,
        .create-first-link-btn {
          transition: all 0.2s ease;
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
              flexDirection: 'row',
              justifyContent: 'space-between',
              // alignItems: 'flex-start',
              marginBottom: '20px'
            }}>
              <div className="header-info" style={{ margin: 0 }}>
                <h1 className="page-title" style={{ marginBottom: '4px' }}>{t('customDomains.title')}</h1>
                <p className="page-subtitle" style={{ margin: 0 }}>{t('customDomains.subtitle')}</p>
              </div>
              <button
                // className="create-link-btn"
                onClick={() => setShowAddModal(true)}
                style={{
                  // minWidth: 180,
                  color: "white",
                  padding: "10px 16px",
                  background: "#3B82F6",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500"
                }}
              >
                {t('customDomains.addDomain.title')}
              </button>
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

            <div className="links-container" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {loading ? (
                <div className="loading-state" style={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '40px',
                  textAlign: 'center',
                  color: '#6B7280'
                }}>
                  <div className="spinner" style={{
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
              ) : domains.length === 0 ? (
                <div className="empty-state" style={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '48px 24px',
                  textAlign: 'center'
                }}>
                  <div className="empty-icon" style={{ margin: '0 auto 16px' }}>
                    <svg className="w-12 h-12" width="48" height="48" fill="none" stroke="#9CA3AF" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>{t('customDomains.noDomains')}</h3>
                  <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '20px' }}>{t('customDomains.addFirst')}</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="create-first-link-btn"
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <svg className="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {t('customDomains.addDomain.title')}
                  </button>
                </div>
              ) : (
                <div className="links-list" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
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
                                  {domain.status === 'active' ? t('customDomains.status.active') : t('customDomains.status.inactive')}
                                </span>
                                {domain.isDefault && (
                                  <span className="status-badge active">{t('customDomains.actions.setDefault')}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="link-urls">
                            <div className="url-row">
                              <span className="url-label">{t('customDomains.table.domain')}:</span>
                              <span className="short-url">{domain.fullDomain || domain.domain}</span>
                            </div>
                            <div className="url-row">
                              <span className="url-label">{t('customDomains.table.status')}:</span>
                              <span className="original-url">
                                {domain.verified || domain.verificationStatus === 'verified' ? t('customDomains.status.verified') : t('customDomains.status.pending')}
                              </span>
                            </div>
                          </div>
                          <div className="link-meta">
                            <div className="meta-item">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m0 0v13a2 2 0 01-2 2H10a2 2 0 01-2-2V7z" />
                              </svg>
                              <span>{t('customDomains.table.created')} {new Date(domain.createdAt || domain.dateAdded).toLocaleDateString()}</span>
                            </div>
                            <div className="meta-item">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span>{domain.owner?.email || domain.addedBy || t('common.loading')}</span>
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
                              {t('customDomains.actions.verify')}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteDomain(domainId)}
                            className="action-btn delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            {t('customDomains.actions.delete')}
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
    </>
  );
};

export default CustomDomains;
