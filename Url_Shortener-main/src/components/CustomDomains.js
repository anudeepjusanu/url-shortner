import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import Sidebar from './Sidebar';
import MainHeader from './MainHeader';
import Toast from './Toast';
import AccessDenied from './AccessDenied';
import { domainsAPI } from '../services/api';
import { usePermissions } from '../contexts/PermissionContext';
import { getCurrentDomain } from '../utils/domainUtils';
import './CustomDomains.css';

const CustomDomains = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { hasPermission } = usePermissions();
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const [deniedAction, setDeniedAction] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [showDNSModal, setShowDNSModal] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(null);

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, domainId: null, domainName: '' });

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [baseDomain, setBaseDomain] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [addedDomain, setAddedDomain] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('idle'); // 'idle' | 'checking' | 'success' | 'failed'
  const [copiedField, setCopiedField] = useState(null); // Track which field was copied
  const [cnameTarget, setCnameTarget] = useState('snip.sa'); // Default CNAME target

  // Toast notification state
  const [toast, setToast] = useState(null);

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000); // Clear after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [error]);

  // Clear error when opening add modal
  useEffect(() => {
    if (showAddModal) {
      setError(null);
    }
  }, [showAddModal]);

  // Clear error when opening DNS modal
  useEffect(() => {
    if (showDNSModal) {
      setError(null);
    }
  }, [showDNSModal]);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors when fetching
      const response = await domainsAPI.getDomains();

      // Handle different response structures
      const domainsData = response.data?.data?.domains || response.data?.domains || response.domains || [];
      setDomains(domainsData);
      setError(null);
    } catch (err) {
      console.error('Error fetching domains:', err);
      const errorMsg = err.response?.data?.message || err.message || t('errors.generic');
      setError(errorMsg);
      // Show error toast
      setToast({
        type: 'error',
        message: t('errors.failedToLoadDomains') || 'Failed to load domains. Please refresh the page.'
      });
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
  const handleNext = async () => {
    console.log('Next button clicked. Current step:', currentStep);

    if (currentStep === 1) {
      // Step 1 -> Step 2: Just validate domain format, don't create yet
      const validation = validateDomainFormat(baseDomain);
      
      if (!validation.isValid) {
        setDomainFieldError(validation.error);
        setError(validation.error);
        // Focus the domain input field
        const element = document.getElementById('baseDomain');
        if (element) {
          element.focus();
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return; // Don't proceed to next step
      }

      // Clear any previous errors
      setDomainFieldError('');
      setError(null);

      // Just move to step 2 to show DNS configuration
      // Domain will be created in step 3
      setCurrentStep(2);
      console.log('Moving to step 2 - DNS Configuration (domain not created yet)');
      
    } else if (currentStep === 2) {
      // Step 2 -> Step 3: Just move to review step
      setCurrentStep(3);
      console.log('Moving to step 3 - Review and Confirm');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAddDomain = async () => {
    console.log('handleAddDomain called. Current step:', currentStep);

    // Check permission before adding domain
    if (!hasPermission('domains', 'create')) {
      setDeniedAction('add custom domains');
      setShowAccessDenied(true);
      return false;
    }

    console.log('Creating domain...');
    // Validate input
    if (!baseDomain.trim()) {
      setDomainFieldError(t('customDomains.errors.domainRequired') || 'Domain name is required');
      setError(t('customDomains.errors.domainRequired') || 'Domain name is required');
      return false;
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

      console.log('⚠️ Creating domain with data:', domainData);
      const response = await domainsAPI.createDomain(domainData);
      console.log('✅ Domain created successfully');
      const addedDomainData = response.data?.data || response.data || { ...domainData, id: Date.now() };
      setAddedDomain(addedDomainData);

      // Extract CNAME target from response
      const target = response.data?.data?.cnameTarget || response.data?.cnameTarget || 'laghhu.link';
      setCnameTarget(target);
      console.log('CNAME Target set to:', target);

      await fetchDomains();
      setError(null);

      // Show success toast
      setToast({
        type: 'success',
        message: t('customDomains.domainAdded') || 'Domain added successfully!'
      });

      return true; // Return success
    } catch (err) {
      console.error('Error adding domain:', err);
      const errorMsg = err.response?.data?.message || err.message || t('errors.generic');
      setError(errorMsg);

      // Show error toast
      setToast({
        type: 'error',
        message: errorMsg
      });

      return false; // Return failure
    } finally {
      setIsAddingDomain(false);
    }
  };

  const handleCopyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy:', err);
      // Show error toast
      setToast({
        type: 'error',
        message: t('errors.failedToCopyText') || 'Failed to copy to clipboard. Please copy manually.'
      });
    }
  };

  const handleVerifyDomain = async (domainId) => {
    // Check permission before verifying domain
    if (!hasPermission('domains', 'update')) {
      setDeniedAction('verify domains');
      setShowAccessDenied(true);
      return;
    }

    const targetId = domainId || addedDomain?.id;
    if (!targetId) {
      console.warn('No domain ID provided for verification');
      return;
    }

    try {
      // Clear previous errors when starting new verification
      setError(null);
      setVerificationStatus('checking');
      console.log('Verifying domain:', targetId);

      const response = await domainsAPI.verifyDomain(targetId);
      console.log('Verification response:', response);

      if (response.data?.success || response.success) {
        setVerificationStatus('success');
        await fetchDomains();
        setError(null);
        console.log('✅ Domain verified successfully');

        // Show success toast
        setToast({
          type: 'success',
          message: t('customDomains.verificationSuccess') || 'Domain verified successfully!'
        });
      } else {
        setVerificationStatus('failed');
        const errorMsg = response.data?.message || response.message || t('errors.generic');
        setError(errorMsg);
        console.error('❌ Verification failed:', errorMsg);

        // Show error toast
        setToast({
          type: 'error',
          message: t('customDomains.verificationFailed') || 'Domain verification failed'
        });
      }
    } catch (err) {
      console.error('Domain verification error:', err);
      setVerificationStatus('failed');
      const errorMsg = err.response?.data?.message || err.message || t('errors.generic');
      setError(errorMsg);

      // Show error toast
      setToast({
        type: 'error',
        message: errorMsg
      });
    }
  };

  const resetWizard = () => {
    setShowAddModal(false);
    setCurrentStep(1);
    setBaseDomain('');
    setSubdomain('');
    setAddedDomain(null);
    setVerificationStatus('idle');
    setCopiedField(null);
    setError(null);
    setDomainFieldError('');
    setCnameTarget('snip.sa'); // Reset to default
    console.log('Wizard reset');
  };

  const handleDeleteClick = (domain) => {
    const domainId = domain.id || domain._id;
    const domainName = domain.fullDomain || domain.domain;

    setDeleteDialog({
      isOpen: true,
      domainId: domainId,
      domainName: domainName
    });
  };

  const handleConfirmDelete = async () => {
    // Check permission before deleting domain
    if (!hasPermission('domains', 'delete')) {
      setDeniedAction('delete domains');
      setShowAccessDenied(true);
      setDeleteDialog({ isOpen: false, domainId: null, domainName: '' });
      return;
    }

    try {
      await domainsAPI.deleteDomain(deleteDialog.domainId);
      await fetchDomains();
      setDeleteDialog({ isOpen: false, domainId: null, domainName: '' });

      // Show success toast
      setToast({
        type: 'success',
        message: t('customDomains.deleteSuccess') || 'Domain deleted successfully'
      });
    } catch (err) {
      console.error('Error deleting domain:', err);
      const errorMsg = err.response?.data?.message || err.message || t('errors.generic');
      setError(errorMsg);

      // Show error toast
      setToast({
        type: 'error',
        message: errorMsg
      });
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialog({ isOpen: false, domainId: null, domainName: '' });
  };

  // Step indicator component
  const renderStepIndicator = () => (
    <div style={{ marginBottom: '2rem' }}>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
        {t('customDomains.wizard.step', { current: currentStep, total: 3 })}
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

  // Domain field error state
  const [domainFieldError, setDomainFieldError] = useState('');

  // Client-side domain validation function
  const validateDomainFormat = (domain) => {
    if (!domain || !domain.trim()) {
      return {
        isValid: false,
        error: t('customDomains.errors.domainRequired') || 'Domain name is required'
      };
    }

    const trimmedDomain = domain.trim().toLowerCase();

    // Check length
    if (trimmedDomain.length > 253) {
      return {
        isValid: false,
        error: t('customDomains.errors.domainTooLong') || 'Domain name is too long (max 253 characters)'
      };
    }

    // Must have at least one dot (e.g., example.com)
    if (!trimmedDomain.includes('.')) {
      return {
        isValid: false,
        error: t('customDomains.errors.invalidFormat') || 'Domain must include a TLD (e.g., example.com)'
      };
    }

    // Validate domain format - accepts international characters
    // Must have valid structure: letters/numbers, hyphens, dots
    const domainRegex = /^([a-zA-Z0-9\u0600-\u06FF\u0750-\u077F]([a-zA-Z0-9\u0600-\u06FF\u0750-\u077F\-]{0,61}[a-zA-Z0-9\u0600-\u06FF\u0750-\u077F])?\.)+[a-zA-Z0-9\u0600-\u06FF\u0750-\u077F]([a-zA-Z0-9\u0600-\u06FF\u0750-\u077F\-]{0,61}[a-zA-Z0-9\u0600-\u06FF\u0750-\u077F])?$/;

    if (!domainRegex.test(trimmedDomain)) {
      return {
        isValid: false,
        error: t('customDomains.errors.invalidFormat') || 'Invalid domain format. Use letters, numbers, hyphens, and dots only'
      };
    }

    // Check each label (part between dots)
    const labels = trimmedDomain.split('.');
    for (const label of labels) {
      if (label.length > 63) {
        return {
          isValid: false,
          error: t('customDomains.errors.labelTooLong') || 'Domain label is too long (max 63 characters per part)'
        };
      }
      
      // Label cannot start or end with hyphen
      if (label.startsWith('-') || label.endsWith('-')) {
        return {
          isValid: false,
          error: t('customDomains.errors.invalidLabel') || 'Domain parts cannot start or end with a hyphen'
        };
      }
    }

    return {
      isValid: true,
      error: null
    };
  };

  // Step 1: Enter Domain Information
  const renderStep1 = () => (
    <div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
        {t('customDomains.addDomain.title')}
      </h3>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
          {t('customDomains.addDomain.domainName')} *
        </label>
        <input
          id="baseDomain"
          type="text"
          value={baseDomain}
          onChange={(e) => {
            setBaseDomain(e.target.value);
            // Clear error when user starts typing
            if (domainFieldError) setDomainFieldError('');
            if (error) setError(null);
          }}
          onBlur={() => {
            // Validate on blur (when user leaves the field)
            if (baseDomain.trim()) {
              const validation = validateDomainFormat(baseDomain);
              if (!validation.isValid) {
                setDomainFieldError(validation.error);
              }
            }
          }}
          placeholder={t('customDomains.addDomain.domainPlaceholder')}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: domainFieldError ? '1px solid #DC2626' : '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '1rem',
            boxSizing: 'border-box'
          }}
        />
        {domainFieldError ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '0.5rem',
            color: '#DC2626',
            fontSize: '0.8125rem'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{domainFieldError}</span>
          </div>
        ) : (
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
            {/* {t('customDomains.addDomain.domainName')} */}
          </p>
        )}
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
          {t('customDomains.addDomain.subdomain')}
        </label>
        <input
          id="subdomain"
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
        {/* <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
          {t('customDomains.addDomain.subdomain')}
        </p> */}
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
          Review the DNS configuration below. You'll need to add these records to your DNS provider after creating the domain in the next step.
        </p>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
          DNS Configuration Required:
        </h4>
        <div style={{
          backgroundColor: '#F9FAFB',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          padding: '1rem',
          overflow: 'auto'
        }}>
          {/* DNS Record Type */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '0.75rem',
            gap: '16px'
          }}>
            <span style={{
              fontSize: '0.875rem',
              color: '#6B7280',
              minWidth: '60px',
              fontWeight: '500'
            }}>Type:</span>
            <span style={{
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              color: '#1F2937',
              flex: 1,
              padding: '6px 12px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '4px'
            }}>CNAME</span>
          </div>

          {/* DNS Record Name */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '0.75rem',
            gap: '16px'
          }}>
            <span style={{
              fontSize: '0.875rem',
              color: '#6B7280',
              minWidth: '60px',
              fontWeight: '500'
            }}>Name:</span>
            <span style={{
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              color: '#1F2937',
              flex: 1,
              padding: '6px 12px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '4px',
              wordBreak: 'break-all'
            }}>
              {subdomain.trim() ? `${subdomain}.${baseDomain}` : baseDomain || 'your-domain.com'}
            </span>
          </div>

          {/* DNS Record Value */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <span style={{
              fontSize: '0.875rem',
              color: '#6B7280',
              minWidth: '60px',
              fontWeight: '500'
            }}>Value:</span>
            <span style={{
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              color: '#1F2937',
              flex: 1,
              padding: '6px 12px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '4px'
            }}>{cnameTarget}</span>
            <button
              onClick={() => handleCopyToClipboard(cnameTarget, 'value')}
              style={{
                padding: '6px 10px',
                backgroundColor: copiedField === 'value' ? '#10B981' : '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s',
                minWidth: '70px',
                justifyContent: 'center'
              }}
            >
              {copiedField === 'value' ? (
                <>
                  <svg width="14" height="14" fill="none" stroke="#FFFFFF" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span style={{ fontSize: '0.75rem', color: '#FFFFFF', fontWeight: '500' }}>{t('customDomains.dnsModal.copied') || 'Copied'}</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" fill="none" stroke="#6B7280" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>{t('customDomains.dnsModal.copy') || 'Copy'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {addedDomain && (
        <div style={{ marginTop: '1.5rem' }}>
          <button
            onClick={() => handleVerifyDomain(addedDomain.id)}
            disabled={verificationStatus === 'checking'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: verificationStatus === 'checking' ? '#9CA3AF' : '#3B82F6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: verificationStatus === 'checking' ? 'not-allowed' : 'pointer',
              opacity: verificationStatus === 'checking' ? 0.7 : 1
            }}
          >
            {verificationStatus === 'checking' ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Checking DNS...
              </>
            ) : (
              <>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Check DNS Configuration
              </>
            )}
          </button>

          {verificationStatus === 'success' && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: '#DCFCE7',
              border: '1px solid #BBF7D0',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="20" height="20" fill="none" stroke="#16A34A" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span style={{ fontSize: '0.875rem', color: '#166534', fontWeight: '500' }}>
                DNS record verified successfully!
              </span>
            </div>
          )}

          {verificationStatus === 'failed' && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: '#FEE2E2',
              border: '1px solid #FCA5A5',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="20" height="20" fill="none" stroke="#DC2626" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span style={{ fontSize: '0.875rem', color: '#991B1B' }}>
                DNS record not found. Please check your configuration.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Step 3: Review and Confirm
  const renderStep3 = () => {
    console.log('📋 Rendering Step 3 (PREVIEW ONLY - no API call yet)');
    console.log('Domain to be created:', { baseDomain, subdomain, fullDomain: subdomain.trim() ? `${subdomain}.${baseDomain}` : baseDomain });
    return (
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
        backgroundColor: '#EFF6FF',
        border: '1px solid #BFDBFE',
        borderRadius: '6px',
        padding: '1rem',
        marginTop: '1.5rem',
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
            Ready to create your custom domain
          </p>
          <p style={{ fontSize: '0.875rem', color: '#1E40AF', margin: 0 }}>
            Click "Add Domain" below to create this domain. After creation, configure the DNS records shown in Step 2 at your DNS provider, then verify the domain.
          </p>
        </div>
      </div>
    </div>
    );
  };

  const renderDNSModal = () => {
    if (!selectedDomain) return null;

    const domainName = selectedDomain.fullDomain || selectedDomain.domain;

    return (
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
          overflow: 'auto',
          direction: isRTL ? 'rtl' : 'ltr'
        }}>
          <div style={{ display: 'flex', flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#1F2937', textAlign: isRTL ? 'right' : 'left' }}>
              {t('customDomains.dnsModal.title') || 'Domain Verification'}
            </h3>
            <button
              onClick={() => {
                setShowDNSModal(false);
                setSelectedDomain(null);
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

          <div style={{
            backgroundColor: '#FEF3C7',
            border: '1px solid #FDE68A',
            borderRadius: '6px',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <p style={{ fontSize: '0.875rem', color: '#92400E', margin: 0, textAlign: isRTL ? 'right' : 'left' }}>
              {t('customDomains.dnsModal.instruction') || 'Add the following DNS record to verify your domain:'}
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: '#1F2937', textAlign: isRTL ? 'right' : 'left' }}>
              {t('customDomains.dnsModal.configTitle') || 'DNS Configuration Required:'}
            </h4>
            <div style={{
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '1rem',
              overflow: 'auto'
            }}>
              {/* DNS Record Type */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '0.75rem',
                gap: '16px',
                // flexDirection: isRTL ? 'row-reverse' : 'row'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  color: '#6B7280',
                  minWidth: '60px',
                  fontWeight: '500',
                  textAlign: isRTL ? 'right' : 'left'
                }}>{t('customDomains.dnsModal.type') || 'Type'}:</span>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  color: '#1F2937',
                  flex: 1,
                  padding: '6px 12px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '4px'
                }}>CNAME</span>
              </div>

              {/* DNS Record Name */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '0.75rem',
                gap: '16px',
                // flexDirection: isRTL ? 'row-reverse' : 'row'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  color: '#6B7280',
                  minWidth: '60px',
                  fontWeight: '500',
                  textAlign: isRTL ? 'right' : 'left'
                }}>{t('customDomains.dnsModal.name') || 'Name'}:</span>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  color: '#1F2937',
                  flex: 1,
                  padding: '6px 12px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '4px',
                  wordBreak: 'break-all'
                }}>
                  {domainName}
                </span>
              </div>

              {/* DNS Record Value */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                // flexDirection: isRTL ? 'row-reverse' : 'row'
              }}>
                <span style={{
                  fontSize: '0.875rem',
                  color: '#6B7280',
                  minWidth: '60px',
                  fontWeight: '500',
                  textAlign: isRTL ? 'right' : 'left'
                }}>{t('customDomains.dnsModal.value') || 'Value'}:</span>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  color: '#1F2937',
                  flex: 1,
                  padding: '6px 12px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '4px'
                }}>{cnameTarget}</span>
                <button
                  onClick={() => handleCopyToClipboard(cnameTarget, 'modal-value')}
                  style={{
                    padding: '6px 10px',
                    backgroundColor: copiedField === 'modal-value' ? '#10B981' : '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s',
                    minWidth: '70px',
                    justifyContent: 'center'
                  }}
                >
                  {copiedField === 'modal-value' ? (
                    <>
                      <svg width="14" height="14" fill="none" stroke="#FFFFFF" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span style={{ fontSize: '0.75rem', color: '#FFFFFF', fontWeight: '500' }}>{t('customDomains.dnsModal.copied') || 'Copied'}</span>
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" fill="none" stroke="#6B7280" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>{t('customDomains.dnsModal.copy') || 'Copy'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '12px', justifyContent: isRTL ? 'flex-start' : 'flex-end', flexDirection: isRTL ? 'row-reverse' : 'row' }}>
            <button
              onClick={() => handleVerifyDomain(selectedDomain.id || selectedDomain._id)}
              disabled={verificationStatus === 'checking'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: verificationStatus === 'checking' ? '#9CA3AF' : '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: verificationStatus === 'checking' ? 'not-allowed' : 'pointer',
                opacity: verificationStatus === 'checking' ? 0.7 : 1
              }}
            >
              {verificationStatus === 'checking' ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid white',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Checking DNS...
                </>
              ) : (
                <>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Check DNS Configuration
                </>
              )}
            </button>
          </div>

          {verificationStatus === 'success' && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: '#DCFCE7',
              border: '1px solid #BBF7D0',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="20" height="20" fill="none" stroke="#16A34A" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span style={{ fontSize: '0.875rem', color: '#166534', fontWeight: '500' }}>
                DNS record verified successfully!
              </span>
            </div>
          )}

          {verificationStatus === 'failed' && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: '#FEE2E2',
              border: '1px solid #FCA5A5',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="20" height="20" fill="none" stroke="#DC2626" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span style={{ fontSize: '0.875rem', color: '#991B1B' }}>
                DNS record not found. Please check your configuration.
              </span>
            </div>
          )}
        </div>
      </div>
    );
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

        <form onSubmit={async (e) => {
          e.preventDefault();
          console.log('Form submitted! Current step:', currentStep);
          // Handle submit on step 3 - create domain and close wizard
          if (currentStep === 3) {
            console.log('Step 3: Creating domain now...');
            const success = await handleAddDomain();
            if (success) {
              console.log('Domain created successfully, closing wizard');
              // Wait a moment to show success message, then close
              setTimeout(() => {
                resetWizard();
              }, 1500);
            }
          } else {
            console.log('Step is NOT 3, ignoring submit. Current step:', currentStep);
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
                {currentStep === 1 ? t('common.next') : t('common.next')}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isAddingDomain}
                style={{
                  padding: '0.5rem 1.5rem',
                  backgroundColor: isAddingDomain ? '#9CA3AF' : '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isAddingDomain ? 'not-allowed' : 'pointer',
                  opacity: isAddingDomain ? 0.7 : 1,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isAddingDomain ? (
                  <>
                    <div style={{
                      width: '14px',
                      height: '14px',
                      border: '2px solid white',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    {t('common.creating') || 'Creating...'}
                  </>
                ) : (
                  t('customDomains.addDomain.addButton') || 'Add Domain'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );


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
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-10px); }
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

        /* Responsive styles for tablets and mobile */
        @media (max-width: 1024px) {
          .analytics-content {
            padding: 16px !important;
          }
          .page-header {
            flex-direction: column !important;
            gap: 16px;
            align-items: stretch !important;
          }
          .page-header button {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 768px) {
          .analytics-content {
            padding: 12px !important;
          }
          .page-title {
            font-size: 1.5rem !important;
          }
          .page-subtitle {
            font-size: 0.875rem !important;
          }
          .link-card {
            flex-direction: column !important;
            gap: 16px !important;
          }
          .link-actions {
            width: 100%;
            justify-content: stretch !important;
            flex-direction: column !important;
          }
          .link-actions button {
            width: 100% !important;
            min-width: auto !important;
            justify-content: center !important;
          }
          .link-meta {
            flex-direction: column !important;
            gap: 8px !important;
            align-items: flex-start !important;
          }
          .meta-item {
            width: 100%;
          }
          .url-row {
            flex-direction: column !important;
            gap: 4px !important;
            align-items: flex-start !important;
          }
          .url-label {
            min-width: auto !important;
          }
          .short-url, .original-url {
            word-break: break-all !important;
            width: 100%;
          }
          .link-status {
            flex-wrap: wrap !important;
          }
        }

        @media (max-width: 480px) {
          .analytics-content {
            padding: 8px !important;
          }
          .page-title {
            font-size: 1.25rem !important;
          }
          .page-subtitle {
            font-size: 0.8125rem !important;
          }
          .link-card {
            padding: 16px !important;
          }
          .link-title {
            font-size: 14px !important;
          }
          .status-badge {
            font-size: 11px !important;
            padding: 3px 10px !important;
          }
          .url-row {
            font-size: 13px !important;
          }
          .link-meta {
            font-size: 12px !important;
          }
          .link-actions button {
            padding: 8px 12px !important;
            font-size: 13px !important;
          }
          .modal-overlay > div {
            width: 95% !important;
            padding: 1.5rem !important;
            max-height: 95vh !important;
          }
          .modal-overlay h3 {
            font-size: 1.125rem !important;
          }
          .modal-overlay button {
            font-size: 13px !important;
            padding: 8px 12px !important;
          }
        }

        /* Modal responsive styles */
        @media (max-width: 768px) {
          .modal-overlay > div {
            width: 95% !important;
            padding: 1.5rem !important;
          }
          .empty-state {
            padding: 32px 16px !important;
          }
          .empty-state h3 {
            font-size: 14px !important;
          }
          .empty-state p {
            font-size: 13px !important;
          }
        }

        /* Tablet specific adjustments */
        @media (min-width: 769px) and (max-width: 1024px) {
          .link-card {
            flex-wrap: wrap;
          }
          .link-actions {
            width: 100%;
            justify-content: flex-start !important;
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
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              direction: isRTL ? 'rtl' : 'ltr'
            }}>
              <div className="header-info" style={{ margin: 0, textAlign: isRTL ? 'right' : 'left' }}>
                <h1 className="page-title" style={{ marginBottom: '4px' }}>{t('customDomains.title')}</h1>
                <p className="page-subtitle" style={{ margin: 0 }}>{t('customDomains.subtitle')}</p>
              </div>
              <button
                // className="create-link-btn"
                onClick={() => {
                  if (!hasPermission('domains', 'create')) {
                    setDeniedAction('add custom domains');
                    setShowAccessDenied(true);
                    return;
                  }
                  setShowAddModal(true);
                }}
                disabled={!hasPermission('domains', 'create')}
                style={{
                  // minWidth: 180,
                  color: "white",
                  padding: "10px 16px",
                  background: "#3B82F6",
                  border: "none",
                  borderRadius: "6px",
                  cursor: hasPermission('domains', 'create') ? "pointer" : "not-allowed",
                  fontSize: "14px",
                  fontWeight: "500",
                  opacity: hasPermission('domains', 'create') ? 1 : 0.6
                }}
                title={!hasPermission('domains', 'create') ? "You don't have permission to add custom domains" : ""}
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
                alignItems: 'center',
                animation: 'fadeIn 0.3s ease-in'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z" fill="#991B1B"/>
                  </svg>
                  <span style={{ color: '#991B1B', fontSize: '14px' }}>{error}</span>
                </div>
                <button 
                  onClick={() => setError(null)} 
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#991B1B',
                    fontSize: '20px',
                    cursor: 'pointer',
                    padding: '0 4px',
                    marginLeft: '8px',
                    flexShrink: 0
                  }}
                  title="Dismiss"
                >
                  &times;
                </button>
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
                      <div key={domainId} className="link-card" style={{
                        display: 'flex',
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '16px',
                        padding: '20px',
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        transition: 'all 0.2s ease'
                      }}>
                        <div className="link-content" style={{
                          flex: 1,
                          minWidth: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          textAlign: isRTL ? 'right' : 'left'
                        }}>
                          <div className="link-header">
                            <div className="link-title-section">
                              <h3 className="link-title" style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                color: '#1F2937',
                                margin: '0 0 8px 0',
                                wordBreak: 'break-all',
                                textAlign: isRTL ? 'right' : 'left'
                              }}>{domain.fullDomain || domain.domain}</h3>
                              <div className="link-status" style={{
                                display: 'flex',
                                gap: '8px',
                                flexWrap: 'wrap',
                                justifyContent: isRTL ? 'flex-end' : 'flex-start'
                              }}>
                                <span className={`status-badge ${domain.status === 'active' ? 'active' : 'inactive'}`} style={{
                                  padding: '4px 12px',
                                  borderRadius: '12px',
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}>
                                  {domain.status === 'active' ? t('customDomains.status.active') : t('customDomains.status.inactive')}
                                </span>
                                {domain.isDefault && (
                                  <span className="status-badge active" style={{
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: '500'
                                  }}>{t('customDomains.actions.setDefault')}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="link-urls">
                            <div className="url-row" style={{
                              display: 'flex',
                              gap: isRTL ? '16px' : '8px',
                              fontSize: '14px',
                              marginBottom: '8px',
                              // flexDirection: isRTL ? 'row-reverse' : 'row',
                              textAlign: isRTL ? 'right' : 'left',
                              alignItems: 'flex-start'
                            }}>
                              <span className="url-label" style={{
                                color: '#6B7280',
                                flexShrink: 0,
                                minWidth: isRTL ? '60px' : 'auto',
                                fontWeight: '500'
                              }}>{t('customDomains.table.domain')}:</span>
                              <span className="short-url" style={{
                                color: '#1F2937',
                                wordBreak: 'break-all',
                                flex: 1
                              }}>{domain.fullDomain || domain.domain}</span>
                            </div>
                            <div className="url-row" style={{
                              display: 'flex',
                              gap: isRTL ? '16px' : '8px',
                              fontSize: '14px',
                              marginBottom: '8px',
                              // flexDirection: isRTL ? 'row-reverse' : 'row',
                              textAlign: isRTL ? 'right' : 'left',
                              alignItems: 'flex-start'
                            }}>
                              <span className="url-label" style={{
                                color: '#6B7280',
                                flexShrink: 0,
                                minWidth: isRTL ? '60px' : 'auto',
                                fontWeight: '500'
                              }}>{t('customDomains.table.status')}:</span>
                              <span className="original-url" style={{
                                color: '#1F2937',
                                flex: 1
                              }}>
                                {domain.verified || domain.verificationStatus === 'verified' ? t('customDomains.status.verified') : t('customDomains.status.pending')}
                              </span>
                            </div>
                          </div>
                          <div  style={{
                            display: 'flex',
                            gap: isRTL ? '20px' : '16px',
                            flexWrap: 'wrap',
                            fontSize: '13px',
                            color: '#6B7280',
                            flexDirection: isRTL ? 'row-reverse' : 'row',
                            justifyContent: isRTL ? 'flex-end' : 'flex-start',
                            marginTop: '4px'
                          }}>
                            <div className="meta-item" style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: isRTL ? '8px' : '6px',
                              flexDirection: isRTL ? 'row-reverse' : 'row'
                            }}>
                              <svg className="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m0 0v13a2 2 0 01-2 2H10a2 2 0 01-2-2V7z" />
                              </svg>
                              <span>{t('customDomains.table.created')} {new Date(domain.createdAt || domain.dateAdded).toLocaleDateString()}</span>
                            </div>
                            <div className="meta-item" style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: isRTL ? '8px' : '6px',
                              flexDirection: isRTL ? 'row-reverse' : 'row'
                            }}>
                              <svg className="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>{domain.owner?.email || domain.addedBy || t('common.loading')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="link-actions" style={{
                          display: 'flex',
                          flexDirection: isRTL ? 'row-reverse' : 'row',
                          gap: '8px',
                          flexShrink: 0,
                          minWidth: 'fit-content',
                          alignItems: 'center',
                          flexWrap: 'wrap'
                        }}>
                          <button
                            onClick={() => {
                              setError(null); // Clear error when opening DNS modal
                              setVerificationStatus('idle'); // Reset verification status
                              setSelectedDomain(domain);
                              setShowDNSModal(true);
                            }}
                            className="action-btn dns"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              padding: '8px 16px',
                              backgroundColor: '#EFF6FF',
                              color: '#3B82F6',
                              border: '1px solid #BFDBFE',
                              borderRadius: '6px',
                              fontSize: '14px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              minWidth: '100px',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <svg className="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2 12h20M12 2c2.5 0 4.5 4.5 4.5 10s-2 10-4.5 10-4.5-4.5-4.5-10S9.5 2 12 2z"/>
                            </svg>
                            <span>DNS</span>
                          </button>
                          {(!domain.verified && domain.verificationStatus !== 'verified') && (
                            <button
                              onClick={() => {
                                if (!hasPermission('domains', 'update')) {
                                  setDeniedAction('verify domains');
                                  setShowAccessDenied(true);
                                  return;
                                }
                                handleVerifyDomain(domainId);
                              }}
                              disabled={!hasPermission('domains', 'update')}
                              className="action-btn analytics"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                backgroundColor: '#3B82F6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: hasPermission('domains', 'update') ? 'pointer' : 'not-allowed',
                                whiteSpace: 'nowrap',
                                minWidth: '100px',
                                transition: 'all 0.2s ease',
                                opacity: hasPermission('domains', 'update') ? 1 : 0.6
                              }}
                              title={!hasPermission('domains', 'update') ? "You don't have permission to verify domains" : ""}
                            >
                              <svg className="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <span>{t('customDomains.actions.verify')}</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (!hasPermission('domains', 'delete')) {
                                setDeniedAction('delete domains');
                                setShowAccessDenied(true);
                                return;
                              }
                              handleDeleteClick(domain);
                            }}
                            disabled={!hasPermission('domains', 'delete')}
                            className="action-btn delete"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              padding: '8px 16px',
                              backgroundColor: 'white',
                              color: '#EF4444',
                              border: '1px solid #FEE2E2',
                              borderRadius: '6px',
                              fontSize: '14px',
                              fontWeight: '500',
                              cursor: hasPermission('domains', 'delete') ? 'pointer' : 'not-allowed',
                              whiteSpace: 'nowrap',
                              minWidth: '100px',
                              transition: 'all 0.2s ease',
                              opacity: hasPermission('domains', 'delete') ? 1 : 0.6
                            }}
                            title={!hasPermission('domains', 'delete') ? "You don't have permission to delete domains" : ""}
                          >
                            <svg className="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>{t('customDomains.actions.delete')}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {showAddModal && renderAddDomainModal()}
            {showDNSModal && renderDNSModal()}

            {/* Delete Confirmation Dialog */}
            {deleteDialog.isOpen && (
              <div
                style={{
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
                }}
                onClick={handleCancelDelete}
              >
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    padding: '32px',
                    maxWidth: '450px',
                    width: '90%',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      backgroundColor: '#FEE2E2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '20px'
                    }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    </div>

                    <h2 style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: '#111827',
                      marginBottom: '12px',
                      margin: '0 0 12px 0'
                    }}>
                      {t('common.deleteDomainTitle') || 'Delete Domain?'}
                    </h2>

                    <p style={{
                      fontSize: '14px',
                      color: '#6B7280',
                      marginBottom: '8px',
                      margin: '0 0 8px 0'
                    }}>
                      {t('common.deleteDomainMessage') || 'Are you sure you want to delete this custom domain?'}
                    </p>

                    <p style={{
                      fontSize: '13px',
                      color: '#3B82F6',
                      marginBottom: '24px',
                      margin: '0 0 24px 0',
                      wordBreak: 'break-all'
                    }}>
                      {deleteDialog.domainName}
                    </p>

                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      width: '100%'
                    }}>
                      <button
                        onClick={handleCancelDelete}
                        style={{
                          flex: 1,
                          padding: '10px 20px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          border: '1px solid #E5E7EB',
                          backgroundColor: '#ffffff',
                          color: '#374151',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#F9FAFB'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
                      >
                        {t('common.cancel') || 'Cancel'}
                      </button>
                      <button
                        onClick={handleConfirmDelete}
                        style={{
                          flex: 1,
                          padding: '10px 20px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          border: 'none',
                          backgroundColor: '#DC2626',
                          color: '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#B91C1C'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#DC2626'}
                      >
                        {t('common.delete') || 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

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

export default CustomDomains;
