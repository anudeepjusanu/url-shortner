import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "./Sidebar";
import MainHeader from "./MainHeader";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
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
      const response = await api.get("/urls/stats");
      if (response) {
        setAccountStats({
          totalLinks: response.totalLinks || 0,
          totalClicks: response.totalClicks || 0,
          customDomains: response.customDomains || 0,
          accountAge: response.accountAge || "New User",
          plan: response.plan || "Professional"
        });
      }
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
          language: response.language || "en",
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

  // Handle Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess("");

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError(t('auth.register.errorPasswordMismatch'));
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError(t('auth.register.errorPasswordLength'));
      setPasswordLoading(false);
      return;
    }

    try {
      await api.post("/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordSuccess(t('notifications.passwordChanged'));
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
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
      alert("Failed to regenerate API key: " + error.message);
    } finally {
      setApiKeyLoading(false);
    }
  };

  // Handle Copy API Key
  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    alert(t('common.copied'));
  };

  // Handle Preferences Update
  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setPreferencesLoading(true);

    try {
      await api.put("/auth/preferences", preferences);
      alert(t('notifications.settingsSaved'));
    } catch (error) {
      alert(t('errors.generic') + ": " + error.message);
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
                    <div>
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
                    </div>
                    <div>
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
                    </div>
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
                        onChange={(e) => setPersonalInfo({...personalInfo, jobTitle: e.target.value})}
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
                    }}>{t('profile.security.currentPassword')}</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        required
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#6B7280',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        {showPasswords.current ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
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
                      }}>{t('profile.security.newPassword')}</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                          required
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '1px solid #D1D5DB',
                            borderRadius: '8px',
                            fontSize: '14px'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: '#6B7280',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          {showPasswords.new ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>{t('profile.security.confirmPassword')}</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                          required
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '1px solid #D1D5DB',
                            borderRadius: '8px',
                            fontSize: '14px'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: '#6B7280',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
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
    </div>
  );
};

export default Profile;
