import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "./Sidebar";
import MainHeader from "./MainHeader";
import { useAuth } from "../contexts/AuthContext";
import api, { urlsAPI, analyticsAPI, domainsAPI } from "../services/api";
import "./Profile.css";
import "./DashboardLayout.css";

const Profile = () => {
  const { t } = useTranslation();
  const { updateUser } = useAuth();

  // Personal Information State
  const [personalInfo, setPersonalInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: ""
  });
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalLoading, setPersonalLoading] = useState(false);
  const [personalSuccess, setPersonalSuccess] = useState("");
  const [personalError, setPersonalError] = useState("");

  // Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // API Key State
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyLoading, setApiKeyLoading] = useState(false);

  // Preferences State
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    marketingEmails: false,
    weeklyReports: true,
    language: "en",
    timezone: "Asia/Riyadh"
  });
  const [preferencesLoading, setPreferencesLoading] = useState(false);

  // Modal State for success/error messages
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'success', // 'success' or 'error'
    title: '',
    message: ''
  });

  // Account Stats
  const [accountStats, setAccountStats] = useState({
    totalLinks: 0,
    totalClicks: 0,
    customDomains: 0,
    accountAge: "",
    plan: "Professional"
  });

  // Load user data on mount
  useEffect(() => {
    loadUserProfile();
    loadAccountStats();
    loadApiKey();
    loadPreferences();
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await api.get("/auth/profile");
      if (response) {
        setPersonalInfo({
          firstName: response.firstName || "",
          lastName: response.lastName || "",
          email: response.email || "",
          phone: response.phone || "",
          company: response.company || "",
          jobTitle: response.jobTitle || ""
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const loadAccountStats = async () => {
    try {
      // Fetch stats from multiple sources for accuracy
      const [statsResponse, analyticsResponse, domainsResponse] = await Promise.all([
        api.get("/urls/stats").catch(() => null),
        analyticsAPI.getOverview({ period: '30d' }).catch(() => null),
        domainsAPI.getDomains().catch(() => null)
      ]);

      // Get totalLinks and plan from stats endpoint
      const totalLinks = statsResponse?.totalLinks || 0;
      const accountAge = statsResponse?.accountAge || "New User";
      const plan = statsResponse?.plan || "Professional";

      // Get totalClicks from analytics dashboard (more accurate)
      const analyticsData = analyticsResponse?.data || analyticsResponse;
      const totalClicks = analyticsData?.overview?.totalClicks || statsResponse?.totalClicks || 0;

      // Get custom domains count
      const domains = domainsResponse?.data?.domains || domainsResponse?.domains || domainsResponse || [];
      const customDomainsCount = analyticsData?.overview?.totalCustomDomains || 
                                 (Array.isArray(domains) ? domains.filter(d => d.isActive !== false).length : 0) ||
                                 statsResponse?.customDomains || 0;

      setAccountStats({
        totalLinks,
        totalClicks,
        customDomains: customDomainsCount,
        accountAge,
        plan
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadApiKey = async () => {
    try {
      const response = await api.get("/auth/api-key");
      if (response && response.apiKey) {
        setApiKey(response.apiKey);
      }
    } catch (error) {
      console.error("Error loading API key:", error);
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await api.get("/auth/preferences");
      if (response) {
        setPreferences({
          emailNotifications: response.emailNotifications !== false,
          marketingEmails: response.marketingEmails || false,
          weeklyReports: response.weeklyReports !== false,
          language: response.language || "ar",
          timezone: response.timezone || "Asia/Riyadh"
        });
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  // Handle Personal Info Update
  const handlePersonalInfoSubmit = async (e) => {
    e.preventDefault();
    setPersonalLoading(true);
    setPersonalError("");
    setPersonalSuccess("");

    try {
      const response = await api.put("/auth/profile", personalInfo);
      if (response) {
        setPersonalSuccess(t('notifications.profileUpdated'));
        setIsEditingPersonal(false);
        if (updateUser) updateUser(response);
        setTimeout(() => setPersonalSuccess(""), 3000);
      }
    } catch (error) {
      setPersonalError(error.message || t('errors.generic'));
    } finally {
      setPersonalLoading(false);
    }
  };

  // Password field errors
  const [passwordFieldErrors, setPasswordFieldErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Handle Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess("");
    
    // Reset field errors
    const fieldErrors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    let hasError = false;
    let firstErrorField = null;

    // Validate current password
    if (!passwordData.currentPassword) {
      fieldErrors.currentPassword = t('profile.security.errorCurrentPasswordRequired') || 'Current password is required';
      hasError = true;
      if (!firstErrorField) firstErrorField = 'currentPassword';
    }

    // Validate new password
    if (!passwordData.newPassword) {
      fieldErrors.newPassword = t('profile.security.errorNewPasswordRequired') || 'New password is required';
      hasError = true;
      if (!firstErrorField) firstErrorField = 'newPassword';
    } else if (passwordData.newPassword.length < 8) {
      fieldErrors.newPassword = t('profile.security.errorPasswordLength') || 'Password must be at least 8 characters';
      hasError = true;
      if (!firstErrorField) firstErrorField = 'newPassword';
    }

    // Validate confirm password
    if (!passwordData.confirmPassword) {
      fieldErrors.confirmPassword = t('profile.security.errorConfirmPasswordRequired') || 'Please confirm your new password';
      hasError = true;
      if (!firstErrorField) firstErrorField = 'confirmPassword';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      fieldErrors.confirmPassword = t('profile.security.errorPasswordMismatch') || 'Passwords do not match';
      hasError = true;
      if (!firstErrorField) firstErrorField = 'confirmPassword';
    }

    setPasswordFieldErrors(fieldErrors);

    if (hasError) {
      setPasswordLoading(false);
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
      await api.post("/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordSuccess(t('notifications.passwordChanged'));
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordFieldErrors({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(""), 3000);
    } catch (error) {
      setPasswordError(error.message || t('errors.generic'));
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle API Key Regeneration
  const handleRegenerateApiKey = async () => {
    if (!window.confirm(t('profile.apiKeys.confirmRegenerate'))) {
      return;
    }

    setApiKeyLoading(true);
    try {
      const response = await api.post("/auth/regenerate-api-key");
      if (response && response.apiKey) {
        setApiKey(response.apiKey);
        setShowApiKey(true);
      }
    } catch (error) {
      setModalConfig({
        type: 'error',
        title: t('errors.error') || 'Error',
        message: "Failed to regenerate API key: " + error.message
      });
      setShowModal(true);
    } finally {
      setApiKeyLoading(false);
    }
  };

  // Handle Copy API Key
  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setModalConfig({
      type: 'success',
      title: t('notifications.success') || 'Success',
      message: t('common.copied') || 'Copied to clipboard!'
    });
    setShowModal(true);
  };

  // Handle Preferences Update
  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setPreferencesLoading(true);

    try {
      await api.put("/auth/preferences", preferences);
      setModalConfig({
        type: 'success',
        title: t('notifications.success') || 'Success',
        message: t('notifications.settingsSaved') || 'Settings saved successfully!'
      });
      setShowModal(true);
    } catch (error) {
      setModalConfig({
        type: 'error',
        title: t('errors.error') || 'Error',
        message: t('errors.generic') + ": " + error.message
      });
      setShowModal(true);
    } finally {
      setPreferencesLoading(false);
    }
  };

  return (
    <div className="analytics-container">
      <MainHeader />
      <div className="analytics-layout">
        <Sidebar />
        <div className="analytics-main">
          <div className="analytics-content">
            {/* Page Header */}
            <div className="page-header" style={{
              marginBottom: '24px'
            }}>
              <h1 style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '4px',
                margin: '0 0 4px 0'
              }}>{t('profile.title')}</h1>
              <p style={{
                color: '#6B7280',
                fontSize: '14px',
                margin: 0
              }}>{t('profile.subtitle')}</p>
            </div>

            {/* Account Statistics */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '16px',
                margin: '0 0 16px 0'
              }}>{t('profile.accountOverview')}</h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px'
              }}>
                <div style={{
                  background: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#3B82F6',
                    marginBottom: '8px'
                  }}>{accountStats.totalLinks}</div>
                  <div style={{
                    fontSize: '14px',
                    color: '#6B7280'
                  }}>{t('dashboard.stats.totalLinks')}</div>
                </div>
                <div style={{
                  background: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#10B981',
                    marginBottom: '8px'
                  }}>{accountStats.totalClicks.toLocaleString()}</div>
                  <div style={{
                    fontSize: '14px',
                    color: '#6B7280'
                  }}>{t('dashboard.stats.totalClicks')}</div>
                </div>
                <div style={{
                  background: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#7C3AED',
                    marginBottom: '8px'
                  }}>{accountStats.customDomains}</div>
                  <div style={{
                    fontSize: '14px',
                    color: '#6B7280'
                  }}>{t('header.customDomains')}</div>
                </div>
                <div style={{
                  background: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#F59E0B',
                    marginBottom: '8px'
                  }}>{accountStats.plan}</div>
                  <div style={{
                    fontSize: '14px',
                    color: '#6B7280'
                  }}>{t('profile.currentPlan')}</div>
                </div>
              </div>
            </section>

            {/* Personal Information */}
            <section style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: 0
                }}>{t('profile.general.personalInfo')}</h2>
                {!isEditingPersonal && (
                  <button
                    onClick={() => setIsEditingPersonal(true)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      border: '1px solid #E5E7EB',
                      background: '#fff',
                      color: '#374151',
                      cursor: 'pointer'
                    }}
                  >
                    {t('common.edit')} {t('common.profile')}
                  </button>
                )}
              </div>

              <div style={{
                background: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '24px 28px'
              }}>
                {personalSuccess && (
                  <div style={{
                    background: '#D1FAE5',
                    border: '1px solid #10B981',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '20px',
                    color: '#065F46',
                    fontSize: '14px'
                  }}>
                    {personalSuccess}
                  </div>
                )}
                {personalError && (
                  <div style={{
                    background: '#FEE2E2',
                    border: '1px solid #DC2626',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '20px',
                    color: '#991B1B',
                    fontSize: '14px'
                  }}>
                    {personalError}
                  </div>
                )}

                <form onSubmit={handlePersonalInfoSubmit}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '20px',
                    marginBottom: '20px'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>{t('profile.general.firstName')}</label>
                      <input
                        type="text"
                        value={personalInfo.firstName}
                        onChange={(e) => setPersonalInfo({...personalInfo, firstName: e.target.value})}
                        disabled={!isEditingPersonal}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '8px',
                          fontSize: '14px',
                          background: isEditingPersonal ? '#fff' : '#F9FAFB',
                          cursor: isEditingPersonal ? 'text' : 'not-allowed'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>{t('profile.general.lastName')}</label>
                      <input
                        type="text"
                        value={personalInfo.lastName}
                        onChange={(e) => setPersonalInfo({...personalInfo, lastName: e.target.value})}
                        disabled={!isEditingPersonal}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '8px',
                          fontSize: '14px',
                          background: isEditingPersonal ? '#fff' : '#F9FAFB',
                          cursor: isEditingPersonal ? 'text' : 'not-allowed'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>{t('profile.general.email')}</label>
                      <input
                        type="email"
                        value={personalInfo.email}
                        disabled
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '8px',
                          fontSize: '14px',
                          background: '#F9FAFB',
                          cursor: 'not-allowed'
                        }}
                      />
                    </div>
                    {/* <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>{t('profile.general.phone')}</label>
                      <input
                        type="tel"
                        value={personalInfo.phone}
                        onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})}
                        disabled={!isEditingPersonal}
                        placeholder="+966 XXX XXX XXX"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '8px',
                          fontSize: '14px',
                          background: isEditingPersonal ? '#fff' : '#F9FAFB',
                          cursor: isEditingPersonal ? 'text' : 'not-allowed'
                        }}
                      />
                    </div> */}
                    {/* <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>{t('profile.general.company')}</label>
                      <input
                        type="text"
                        value={personalInfo.company}
                        onChange={(e) => setPersonalInfo({...personalInfo, company: e.target.value})}
                        disabled={!isEditingPersonal}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '8px',
                          fontSize: '14px',
                          background: isEditingPersonal ? '#fff' : '#F9FAFB',
                          cursor: isEditingPersonal ? 'text' : 'not-allowed'
                        }}
                      />
                    </div> */}
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>{t('profile.general.jobTitle')}</label>
                      <input
                        type="text"
                        value={personalInfo.jobTitle}
                        readOnly
                        disabled
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '8px',
                          fontSize: '14px',
                          background: '#F9FAFB',
                          cursor: 'not-allowed',
                          color: '#6B7280'
                        }}
                      />
                    </div>
                  </div>

                  {isEditingPersonal && (
                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      justifyContent: 'flex-end'
                    }}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingPersonal(false);
                          loadUserProfile();
                        }}
                        style={{
                          padding: '10px 20px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          border: '1px solid #E5E7EB',
                          background: '#fff',
                          color: '#374151',
                          cursor: 'pointer'
                        }}
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={personalLoading}
                        style={{
                          padding: '10px 20px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          border: 'none',
                          background: personalLoading ? '#93C5FD' : '#3B82F6',
                          color: '#fff',
                          cursor: personalLoading ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {personalLoading ? t('profile.general.updating') : `${t('common.save')} Changes`}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </section>

            {/* Account Security */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '16px',
                margin: '0 0 16px 0'
              }}>{t('profile.tabs.security')}</h2>

              <div style={{
                background: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '24px 28px'
              }}>
                {passwordSuccess && (
                  <div style={{
                    background: '#D1FAE5',
                    border: '1px solid #10B981',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '20px',
                    color: '#065F46',
                    fontSize: '14px'
                  }}>
                    {passwordSuccess}
                  </div>
                )}
                {passwordError && (
                  <div style={{
                    background: '#FEE2E2',
                    border: '1px solid #DC2626',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '20px',
                    color: '#991B1B',
                    fontSize: '14px'
                  }}>
                    {passwordError}
                  </div>
                )}

                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '16px'
                }}>{t('profile.security.changePassword')}</h3>

                <form onSubmit={handlePasswordSubmit}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>{t('profile.security.currentPassword')} *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="currentPassword"
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => {
                          setPasswordData({...passwordData, currentPassword: e.target.value});
                          // Clear field error when user starts typing
                          if (passwordFieldErrors.currentPassword) {
                            setPasswordFieldErrors({...passwordFieldErrors, currentPassword: ''});
                          }
                          // Clear general error when user starts typing
                          if (passwordError) setPasswordError('');
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: passwordFieldErrors.currentPassword ? '1px solid #DC2626' : '1px solid #D1D5DB',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                  aria-label={showPasswords.current ? "Hide password" : "Show password"}
                >
                  <svg
                    width="18"
                    height="16"
                    viewBox="0 0 18 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ display: 'block', minWidth: '18px', minHeight: '16px' }}
                  >
                    <path
                      d="M1 8s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"
                      stroke="#9CA3AF"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ stroke: '#9CA3AF' }}
                    />
                    <circle
                      cx="9"
                      cy="8"
                      r="3"
                      stroke="#9CA3AF"
                      strokeWidth="2"
                      style={{ stroke: '#9CA3AF' }}
                    />
                  </svg>
                </button>
                    </div>
                    {passwordFieldErrors.currentPassword && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '6px',
                        color: '#DC2626',
                        fontSize: '13px'
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>{passwordFieldErrors.currentPassword}</span>
                      </div>
                    )}
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '20px',
                    marginBottom: '20px'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>{t('profile.security.newPassword')} *</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          id="newPassword"
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => {
                            setPasswordData({...passwordData, newPassword: e.target.value});
                            // Clear field error when user starts typing
                            if (passwordFieldErrors.newPassword) {
                              setPasswordFieldErrors({...passwordFieldErrors, newPassword: ''});
                            }
                            // Clear general error when user starts typing
                            if (passwordError) setPasswordError('');
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: passwordFieldErrors.newPassword ? '1px solid #DC2626' : '1px solid #D1D5DB',
                            borderRadius: '8px',
                            fontSize: '14px'
                          }}
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            // padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <svg
                            width="18"
                            height="16"
                            viewBox="0 0 18 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            style={{ display: 'block' }}
                          >
                            <path
                              d="M1 8s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"
                              stroke="#9CA3AF"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <circle
                              cx="9"
                              cy="8"
                              r="3"
                              stroke="#9CA3AF"
                              strokeWidth="2"
                            />
                          </svg>
                        </button>
                      </div>
                      {passwordFieldErrors.newPassword && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginTop: '6px',
                          color: '#DC2626',
                          fontSize: '13px'
                        }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span>{passwordFieldErrors.newPassword}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>{t('profile.security.confirmPassword')} *</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          id="confirmPassword"
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => {
                            setPasswordData({...passwordData, confirmPassword: e.target.value});
                            // Clear field error when user starts typing
                            if (passwordFieldErrors.confirmPassword) {
                              setPasswordFieldErrors({...passwordFieldErrors, confirmPassword: ''});
                            }
                            // Clear general error when user starts typing
                            if (passwordError) setPasswordError('');
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: passwordFieldErrors.confirmPassword ? '1px solid #DC2626' : '1px solid #D1D5DB',
                            borderRadius: '8px',
                            fontSize: '14px'
                          }}
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            // padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <svg
                            width="18"
                            height="16"
                            viewBox="0 0 18 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            style={{ display: 'block' }}
                          >
                            <path
                              d="M1 8s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z"
                              stroke="#9CA3AF"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <circle
                              cx="9"
                              cy="8"
                              r="3"
                              stroke="#9CA3AF"
                              strokeWidth="2"
                            />
                          </svg>
                        </button>
                      </div>
                      {passwordFieldErrors.confirmPassword && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginTop: '6px',
                          color: '#DC2626',
                          fontSize: '13px'
                        }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span>{passwordFieldErrors.confirmPassword}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        border: 'none',
                        background: passwordLoading ? '#93C5FD' : '#3B82F6',
                        color: '#fff',
                        cursor: passwordLoading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {passwordLoading ? t('profile.general.updating') : t('profile.security.updatePassword')}
                    </button>
                  </div>
                </form>
              </div>
            </section>

            {/* API Key Management */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '16px',
                margin: '0 0 16px 0'
              }}>{t('profile.apiKeys.title')}</h2>

              <div style={{
                background: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '24px 28px'
              }}>
                <p style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  marginBottom: '16px',
                  lineHeight: '1.6'
                }}>
                  {t('profile.apiKeys.description')}
                </p>

                <div style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey || "No API key generated"}
                    readOnly
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      border: '1px solid #D1D5DB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'monospace',
                      background: '#F9FAFB'
                    }}
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      border: '1px solid #E5E7EB',
                      background: '#fff',
                      color: '#374151',
                      cursor: 'pointer'
                    }}
                  >
                    {showApiKey ? t('common.hide') : t('common.show')}
                  </button>
                  <button
                    onClick={handleCopyApiKey}
                    disabled={!apiKey}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      border: '1px solid #E5E7EB',
                      background: '#fff',
                      color: '#374151',
                      cursor: apiKey ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {t('common.copy')}
                  </button>
                </div>

                <button
                  onClick={handleRegenerateApiKey}
                  disabled={apiKeyLoading}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none',
                    background: apiKeyLoading ? '#FBBF24' : '#F59E0B',
                    color: '#fff',
                    cursor: apiKeyLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {apiKeyLoading ? t('profile.apiKeys.regenerating') : t('profile.apiKeys.regenerateButton')}
                </button>
                <a
                  href="/api-docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: '1px solid #3B82F6',
                    background: '#fff',
                    color: '#3B82F6',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  📖 {t('profile.apiKeys.viewDocs') || 'View API Docs'}
                </a>
              </div>
            </section>

            {/* Preferences */}
            <section style={{ marginBottom: '24px' }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '16px',
                margin: '0 0 16px 0'
              }}>{t('profile.tabs.preferences')}</h2>

              <div style={{
                background: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '24px 28px'
              }}>
                <form onSubmit={handlePreferencesSubmit}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '16px'
                  }}>{t('profile.notifications.title')}</h3>

                  <div style={{ marginBottom: '20px' }}>
                    <label className="profile-checkbox-label">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications}
                        onChange={(e) => setPreferences({...preferences, emailNotifications: e.target.checked})}
                        className="profile-checkbox"
                      />
                      <div className="profile-checkbox-content">
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#111827'
                        }}>{t('profile.preferences.emailNotifications')}</div>
                        <div style={{
                          fontSize: '13px',
                          color: '#6B7280'
                        }}>{t('profile.preferences.emailNotificationsDesc')}</div>
                      </div>
                    </label>

                    <label className="profile-checkbox-label">
                      <input
                        type="checkbox"
                        checked={preferences.marketingEmails}
                        onChange={(e) => setPreferences({...preferences, marketingEmails: e.target.checked})}
                        className="profile-checkbox"
                      />
                      <div className="profile-checkbox-content">
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#111827'
                        }}>{t('profile.preferences.marketingEmails')}</div>
                        <div style={{
                          fontSize: '13px',
                          color: '#6B7280'
                        }}>{t('profile.preferences.marketingEmailsDesc')}</div>
                      </div>
                    </label>

                    <label className="profile-checkbox-label">
                      <input
                        type="checkbox"
                        checked={preferences.weeklyReports}
                        onChange={(e) => setPreferences({...preferences, weeklyReports: e.target.checked})}
                        className="profile-checkbox"
                      />
                      <div className="profile-checkbox-content">
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#111827'
                        }}>{t('profile.preferences.weeklyReports')}</div>
                        <div style={{
                          fontSize: '13px',
                          color: '#6B7280'
                        }}>{t('profile.preferences.weeklyReportsDesc')}</div>
                      </div>
                    </label>
                  </div>

                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '16px'
                  }}>{t('profile.regionalSettings')}</h3>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '20px',
                    marginBottom: '20px'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>{t('profile.preferences.language')}</label>
                      <select
                        value={preferences.language}
                        onChange={(e) => setPreferences({...preferences, language: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '8px',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="en">{t('common.english')}</option>
                        <option value="ar">{t('common.arabic')}</option>
                      </select>
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>{t('profile.preferences.timezone')}</label>
                      <select
                        value={preferences.timezone}
                        onChange={(e) => setPreferences({...preferences, timezone: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '8px',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="Asia/Riyadh">Asia/Riyadh (GMT+3)</option>
                        <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                        <option value="America/New_York">America/New York (GMT-5)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      type="submit"
                      disabled={preferencesLoading}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        border: 'none',
                        background: preferencesLoading ? '#93C5FD' : '#3B82F6',
                        color: '#fff',
                        cursor: preferencesLoading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {preferencesLoading ? t('profile.general.updating') : `${t('common.save')} ${t('profile.tabs.preferences')}`}
                    </button>
                  </div>
                </form>
              </div>
            </section>

          </div>
        </div>
      </div>

      {/* Professional Modal Dialog */}
      {showModal && (
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
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            animation: 'modalSlideIn 0.2s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              {modalConfig.type === 'success' ? (
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#DEF7EC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0E9F6E" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              ) : (
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: '#FDE8E8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C81E1E" strokeWidth="2">
                    <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
              <div style={{ flex: 1 }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827'
                }}>
                  {modalConfig.title}
                </h3>
              </div>
            </div>

            {/* Modal Body */}
            <p style={{
              margin: '0 0 24px 0',
              fontSize: '14px',
              color: '#6B7280',
              lineHeight: '1.5'
            }}>
              {modalConfig.message}
            </p>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: modalConfig.type === 'success' ? '#0E9F6E' : '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.target.style.opacity = '0.9'}
                onMouseOut={(e) => e.target.style.opacity = '1'}
              >
                {t('common.ok') || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Profile;
