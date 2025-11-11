import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Sidebar from "./Sidebar";
import MainHeader from "./MainHeader";
import api from "../services/api";
import "./Analytics.css";
import "./ContentFilter.css";

const ContentFilter = () => {
  const { t } = useTranslation();

  // Filter Settings State
  const [filterSettings, setFilterSettings] = useState({
    enableContentFilter: true,
    blockMaliciousUrls: true,
    blockPhishing: true,
    blockAdultContent: false,
    blockSpam: true,
    customKeywordFiltering: true,
    pdplCompliance: true
  });

  // Blocked Domains
  const [blockedDomains, setBlockedDomains] = useState([]);
  const [newDomain, setNewDomain] = useState("");
  const [addingDomain, setAddingDomain] = useState(false);

  // Blocked Keywords
  const [blockedKeywords, setBlockedKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [addingKeyword, setAddingKeyword] = useState(false);

  // Allowed Domains (Whitelist)
  const [allowedDomains, setAllowedDomains] = useState([]);
  const [newAllowedDomain, setNewAllowedDomain] = useState("");
  const [addingAllowedDomain, setAddingAllowedDomain] = useState(false);

  // Filter Logs
  const [filterLogs, setFilterLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalFiltered: 0,
    maliciousBlocked: 0,
    phishingBlocked: 0,
    spamBlocked: 0
  });

  // Active Tab
  const [activeTab, setActiveTab] = useState('settings');

  // Loading & Messages
  const [, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadFilterSettings();
    loadBlockedDomains();
    loadBlockedKeywords();
    loadAllowedDomains();
    loadStats();
    loadFilterLogs();
  }, []);

  const loadFilterSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get("/content-filter/settings");
      if (response) {
        setFilterSettings({
          enableContentFilter: response.enableContentFilter !== false,
          blockMaliciousUrls: response.blockMaliciousUrls !== false,
          blockPhishing: response.blockPhishing !== false,
          blockAdultContent: response.blockAdultContent || false,
          blockSpam: response.blockSpam !== false,
          customKeywordFiltering: response.customKeywordFiltering !== false,
          pdplCompliance: response.pdplCompliance !== false
        });
      }
    } catch (error) {
      console.error("Error loading filter settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadBlockedDomains = async () => {
    try {
      const response = await api.get("/content-filter/blocked-domains");
      if (response && Array.isArray(response)) {
        setBlockedDomains(response);
      }
    } catch (error) {
      console.error("Error loading blocked domains:", error);
    }
  };

  const loadBlockedKeywords = async () => {
    try {
      const response = await api.get("/content-filter/blocked-keywords");
      if (response && Array.isArray(response)) {
        setBlockedKeywords(response);
      }
    } catch (error) {
      console.error("Error loading blocked keywords:", error);
    }
  };

  const loadAllowedDomains = async () => {
    try {
      const response = await api.get("/content-filter/allowed-domains");
      if (response && Array.isArray(response)) {
        setAllowedDomains(response);
      }
    } catch (error) {
      console.error("Error loading allowed domains:", error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get("/content-filter/stats");
      if (response) {
        setStats({
          totalFiltered: response.totalFiltered || 0,
          maliciousBlocked: response.maliciousBlocked || 0,
          phishingBlocked: response.phishingBlocked || 0,
          spamBlocked: response.spamBlocked || 0
        });
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadFilterLogs = async () => {
    setLoadingLogs(true);
    try {
      const response = await api.get("/content-filter/logs");
      if (response && Array.isArray(response)) {
        setFilterLogs(response);
      }
    } catch (error) {
      console.error("Error loading filter logs:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const saveFilterSettings = async () => {
    setSaveLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await api.put("/content-filter/settings", filterSettings);
      setSuccessMessage(t('notifications.settingsSaved'));
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setErrorMessage(t('errors.generic') + ": " + error.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const addBlockedDomain = async () => {
    if (!newDomain.trim()) {
      alert(t('errors.enterDomain'));
      return;
    }

    setAddingDomain(true);
    try {
      await api.post("/content-filter/blocked-domains", { domain: newDomain.trim() });
      setNewDomain("");
      loadBlockedDomains();
      loadStats();
    } catch (error) {
      alert(t('errors.failedToAddDomain', { error: error.message }));
    } finally {
      setAddingDomain(false);
    }
  };

  const removeBlockedDomain = async (domain) => {
    if (!window.confirm(t('contentFilter.blocked.confirmRemove', { domain }))) {
      return;
    }

    try {
      await api.delete(`/content-filter/blocked-domains/${encodeURIComponent(domain)}`);
      loadBlockedDomains();
      loadStats();
    } catch (error) {
      alert(t('errors.failedToRemoveDomain', { error: error.message }));
    }
  };

  const addBlockedKeyword = async () => {
    if (!newKeyword.trim()) {
      alert(t('errors.enterKeyword'));
      return;
    }

    setAddingKeyword(true);
    try {
      await api.post("/content-filter/blocked-keywords", { keyword: newKeyword.trim() });
      setNewKeyword("");
      loadBlockedKeywords();
      loadStats();
    } catch (error) {
      alert(t('errors.failedToAddKeyword', { error: error.message }));
    } finally {
      setAddingKeyword(false);
    }
  };

  const removeBlockedKeyword = async (keyword) => {
    if (!window.confirm(t('contentFilter.blocked.confirmRemoveKeyword', { keyword }))) {
      return;
    }

    try {
      await api.delete(`/content-filter/blocked-keywords/${encodeURIComponent(keyword)}`);
      loadBlockedKeywords();
      loadStats();
    } catch (error) {
      alert(t('errors.failedToRemoveKeyword', { error: error.message }));
    }
  };

  const addAllowedDomain = async () => {
    if (!newAllowedDomain.trim()) {
      alert(t('errors.enterDomain'));
      return;
    }

    setAddingAllowedDomain(true);
    try {
      await api.post("/content-filter/allowed-domains", { domain: newAllowedDomain.trim() });
      setNewAllowedDomain("");
      loadAllowedDomains();
    } catch (error) {
      alert(t('errors.failedToAddAllowedDomain', { error: error.message }));
    } finally {
      setAddingAllowedDomain(false);
    }
  };

  const removeAllowedDomain = async (domain) => {
    if (!window.confirm(t('contentFilter.whitelist.confirmRemove', { domain }))) {
      return;
    }

    try {
      await api.delete(`/content-filter/allowed-domains/${encodeURIComponent(domain)}`);
      loadAllowedDomains();
    } catch (error) {
      alert(t('errors.failedToRemoveAllowedDomain', { error: error.message }));
    }
  };

  const getReasonBadge = (reason) => {
    const colors = {
      malicious: '#DC2626',
      phishing: '#F59E0B',
      spam: '#7C3AED',
      keyword: '#3B82F6',
      adult: '#EF4444'
    };
    return colors[reason] || '#6B7280';
  };

  return (
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
              }}>{t('contentFilter.title')}</h1>
              <p style={{
                color: '#6B7280',
                fontSize: '14px',
                margin: 0
              }}>{t('contentFilter.subtitle')}</p>
            </div>

            {/* Stats Cards */}
            <section style={{ marginBottom: '24px' }}>
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
                  }}>{stats.totalFiltered}</div>
                  <div style={{
                    fontSize: '14px',
                    color: '#6B7280'
                  }}>{t('contentFilter.stats.totalFiltered')}</div>
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
                    color: '#DC2626',
                    marginBottom: '8px'
                  }}>{stats.maliciousBlocked}</div>
                  <div style={{
                    fontSize: '14px',
                    color: '#6B7280'
                  }}>{t('contentFilter.stats.maliciousBlocked')}</div>
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
                    color: '#F59E0B',
                    marginBottom: '8px'
                  }}>{stats.phishingBlocked}</div>
                  <div style={{
                    fontSize: '14px',
                    color: '#6B7280'
                  }}>{t('contentFilter.stats.phishingBlocked')}</div>
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
                  }}>{stats.spamBlocked}</div>
                  <div style={{
                    fontSize: '14px',
                    color: '#6B7280'
                  }}>{t('contentFilter.stats.spamBlocked')}</div>
                </div>
              </div>
            </section>

            {/* Tabs */}
            <section style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                gap: '8px',
                borderBottom: '1px solid #E5E7EB'
              }}>
                {['settings', 'blocked', 'whitelist', 'logs'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: '600',
                      border: 'none',
                      background: 'transparent',
                      color: activeTab === tab ? '#3B82F6' : '#6B7280',
                      borderBottom: activeTab === tab ? '2px solid #3B82F6' : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {t(`contentFilter.tabs.${tab}`)}
                  </button>
                ))}
              </div>
            </section>

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <section>
                <div style={{
                  background: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '24px 28px'
                }}>
                  {successMessage && (
                    <div style={{
                      background: '#D1FAE5',
                      border: '1px solid #10B981',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      marginBottom: '20px',
                      color: '#065F46',
                      fontSize: '14px'
                    }}>
                      {successMessage}
                    </div>
                  )}
                  {errorMessage && (
                    <div style={{
                      background: '#FEE2E2',
                      border: '1px solid #DC2626',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      marginBottom: '20px',
                      color: '#991B1B',
                      fontSize: '14px'
                    }}>
                      {errorMessage}
                    </div>
                  )}

                  <h2 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '20px'
                  }}>{t('contentFilter.settings.title')}</h2>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '16px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={filterSettings.enableContentFilter}
                        onChange={(e) => setFilterSettings({...filterSettings, enableContentFilter: e.target.checked})}
                        style={{
                          width: '18px',
                          height: '18px',
                          marginRight: '12px',
                          cursor: 'pointer'
                        }}
                      />
                      <div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#111827'
                        }}>{t('contentFilter.settings.enableContentFilter')}</div>
                        <div style={{
                          fontSize: '13px',
                          color: '#6B7280'
                        }}>{t('contentFilter.settings.enableDescription')}</div>
                      </div>
                    </label>

                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '16px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={filterSettings.blockMaliciousUrls}
                        onChange={(e) => setFilterSettings({...filterSettings, blockMaliciousUrls: e.target.checked})}
                        style={{
                          width: '18px',
                          height: '18px',
                          marginRight: '12px',
                          cursor: 'pointer'
                        }}
                      />
                      <div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#111827'
                        }}>{t('contentFilter.settings.blockMaliciousUrls')}</div>
                        <div style={{
                          fontSize: '13px',
                          color: '#6B7280'
                        }}>{t('contentFilter.settings.blockMaliciousDescription')}</div>
                      </div>
                    </label>

                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '16px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={filterSettings.blockPhishing}
                        onChange={(e) => setFilterSettings({...filterSettings, blockPhishing: e.target.checked})}
                        style={{
                          width: '18px',
                          height: '18px',
                          marginRight: '12px',
                          cursor: 'pointer'
                        }}
                      />
                      <div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#111827'
                        }}>{t('contentFilter.settings.blockPhishing')}</div>
                        <div style={{
                          fontSize: '13px',
                          color: '#6B7280'
                        }}>{t('contentFilter.settings.blockPhishingDescription')}</div>
                      </div>
                    </label>

                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '16px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={filterSettings.blockAdultContent}
                        onChange={(e) => setFilterSettings({...filterSettings, blockAdultContent: e.target.checked})}
                        style={{
                          width: '18px',
                          height: '18px',
                          marginRight: '12px',
                          cursor: 'pointer'
                        }}
                      />
                      <div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#111827'
                        }}>{t('contentFilter.settings.blockAdultContent')}</div>
                        <div style={{
                          fontSize: '13px',
                          color: '#6B7280'
                        }}>{t('contentFilter.settings.blockAdultDescription')}</div>
                      </div>
                    </label>

                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '16px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={filterSettings.blockSpam}
                        onChange={(e) => setFilterSettings({...filterSettings, blockSpam: e.target.checked})}
                        style={{
                          width: '18px',
                          height: '18px',
                          marginRight: '12px',
                          cursor: 'pointer'
                        }}
                      />
                      <div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#111827'
                        }}>{t('contentFilter.settings.blockSpam')}</div>
                        <div style={{
                          fontSize: '13px',
                          color: '#6B7280'
                        }}>{t('contentFilter.settings.blockSpamDescription')}</div>
                      </div>
                    </label>

                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '16px',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={filterSettings.customKeywordFiltering}
                        onChange={(e) => setFilterSettings({...filterSettings, customKeywordFiltering: e.target.checked})}
                        style={{
                          width: '18px',
                          height: '18px',
                          marginRight: '12px',
                          cursor: 'pointer'
                        }}
                      />
                      <div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#111827'
                        }}>{t('contentFilter.settings.customKeywordFiltering')}</div>
                        <div style={{
                          fontSize: '13px',
                          color: '#6B7280'
                        }}>{t('contentFilter.settings.customKeywordDescription')}</div>
                      </div>
                    </label>

                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={filterSettings.pdplCompliance}
                        onChange={(e) => setFilterSettings({...filterSettings, pdplCompliance: e.target.checked})}
                        style={{
                          width: '18px',
                          height: '18px',
                          marginRight: '12px',
                          cursor: 'pointer'
                        }}
                      />
                      <div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#111827'
                        }}>{t('contentFilter.settings.pdplCompliance')}</div>
                        <div style={{
                          fontSize: '13px',
                          color: '#6B7280'
                        }}>{t('contentFilter.settings.pdplDescription')}</div>
                      </div>
                    </label>
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      onClick={saveFilterSettings}
                      disabled={saveLoading}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        border: 'none',
                        background: saveLoading ? '#93C5FD' : '#3B82F6',
                        color: '#fff',
                        cursor: saveLoading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {saveLoading ? t('contentFilter.settings.saving') : t('contentFilter.settings.saveSettings')}
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Blocked Tab */}
            {activeTab === 'blocked' && (
              <section>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '16px'
                }}>
                  {/* Blocked Domains */}
                  <div style={{
                    background: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    padding: '24px 28px'
                  }}>
                    <h2 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '16px'
                    }}>{t('contentFilter.blocked.domains')}</h2>

                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      marginBottom: '20px'
                    }}>
                      <input
                        type="text"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        placeholder={t('contentFilter.blocked.domainPlaceholder')}
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && addBlockedDomain()}
                      />
                      <button
                        onClick={addBlockedDomain}
                        disabled={addingDomain}
                        style={{
                          padding: '10px 16px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          border: 'none',
                          background: addingDomain ? '#93C5FD' : '#3B82F6',
                          color: '#fff',
                          cursor: addingDomain ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {t('contentFilter.blocked.addDomain')}
                      </button>
                    </div>

                    <div style={{
                      maxHeight: '400px',
                      overflow: 'auto'
                    }}>
                      {blockedDomains.length === 0 ? (
                        <div style={{
                          padding: '40px 20px',
                          textAlign: 'center',
                          color: '#6B7280',
                          fontSize: '14px'
                        }}>
                          {t('contentFilter.blocked.noDomains')}
                        </div>
                      ) : (
                        blockedDomains.map((domain, index) => (
                          <div
                            key={index}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '12px',
                              border: '1px solid #E5E7EB',
                              borderRadius: '8px',
                              marginBottom: '8px'
                            }}
                          >
                            <span style={{
                              fontSize: '14px',
                              color: '#374151',
                              fontFamily: 'monospace'
                            }}>{domain.domain || domain}</span>
                            <button
                              onClick={() => removeBlockedDomain(domain.domain || domain)}
                              style={{
                                padding: '4px 12px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                border: 'none',
                                background: '#FEE2E2',
                                color: '#DC2626',
                                cursor: 'pointer'
                              }}
                            >
                              {t('contentFilter.blocked.remove')}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Blocked Keywords */}
                  <div style={{
                    background: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    padding: '24px 28px'
                  }}>
                    <h2 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: '16px'
                    }}>{t('contentFilter.blocked.keywords')}</h2>

                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      marginBottom: '20px'
                    }}>
                      <input
                        type="text"
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        placeholder={t('contentFilter.blocked.keywordPlaceholder')}
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && addBlockedKeyword()}
                      />
                      <button
                        onClick={addBlockedKeyword}
                        disabled={addingKeyword}
                        style={{
                          padding: '10px 16px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          border: 'none',
                          background: addingKeyword ? '#93C5FD' : '#3B82F6',
                          color: '#fff',
                          cursor: addingKeyword ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {t('contentFilter.blocked.addKeyword')}
                      </button>
                    </div>

                    <div style={{
                      maxHeight: '400px',
                      overflow: 'auto'
                    }}>
                      {blockedKeywords.length === 0 ? (
                        <div style={{
                          padding: '40px 20px',
                          textAlign: 'center',
                          color: '#6B7280',
                          fontSize: '14px'
                        }}>
                          {t('contentFilter.blocked.noKeywords')}
                        </div>
                      ) : (
                        blockedKeywords.map((keyword, index) => (
                          <div
                            key={index}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '12px',
                              border: '1px solid #E5E7EB',
                              borderRadius: '8px',
                              marginBottom: '8px'
                            }}
                          >
                            <span style={{
                              fontSize: '14px',
                              color: '#374151'
                            }}>{keyword.keyword || keyword}</span>
                            <button
                              onClick={() => removeBlockedKeyword(keyword.keyword || keyword)}
                              style={{
                                padding: '4px 12px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                border: 'none',
                                background: '#FEE2E2',
                                color: '#DC2626',
                                cursor: 'pointer'
                              }}
                            >
                              {t('contentFilter.blocked.remove')}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Whitelist Tab */}
            {activeTab === 'whitelist' && (
              <section>
                <div style={{
                  background: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '24px 28px'
                }}>
                  <h2 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '16px'
                  }}>{t('contentFilter.whitelist.title')}</h2>

                  <p style={{
                    fontSize: '14px',
                    color: '#6B7280',
                    marginBottom: '20px'
                  }}>
                    {t('contentFilter.whitelist.description')}
                  </p>

                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '20px'
                  }}>
                    <input
                      type="text"
                      value={newAllowedDomain}
                      onChange={(e) => setNewAllowedDomain(e.target.value)}
                      placeholder={t('contentFilter.whitelist.domainPlaceholder')}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && addAllowedDomain()}
                    />
                    <button
                      onClick={addAllowedDomain}
                      disabled={addingAllowedDomain}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        border: 'none',
                        background: addingAllowedDomain ? '#86EFAC' : '#10B981',
                        color: '#fff',
                        cursor: addingAllowedDomain ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {t('contentFilter.whitelist.addDomain')}
                    </button>
                  </div>

                  <div style={{
                    maxHeight: '400px',
                    overflow: 'auto'
                  }}>
                    {allowedDomains.length === 0 ? (
                      <div style={{
                        padding: '40px 20px',
                        textAlign: 'center',
                        color: '#6B7280',
                        fontSize: '14px'
                      }}>
                        {t('contentFilter.whitelist.noDomains')}
                      </div>
                    ) : (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '12px'
                      }}>
                        {allowedDomains.map((domain, index) => (
                          <div
                            key={index}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '12px',
                              border: '1px solid #D1FAE5',
                              background: '#ECFDF5',
                              borderRadius: '8px'
                            }}
                          >
                            <span style={{
                              fontSize: '14px',
                              color: '#065F46',
                              fontFamily: 'monospace'
                            }}>{domain.domain || domain}</span>
                            <button
                              onClick={() => removeAllowedDomain(domain.domain || domain)}
                              style={{
                                padding: '4px 12px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                border: 'none',
                                background: '#FEE2E2',
                                color: '#DC2626',
                                cursor: 'pointer'
                              }}
                            >
                              {t('contentFilter.whitelist.remove')}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Logs Tab */}
            {activeTab === 'logs' && (
              <section>
                <div style={{
                  background: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid #E5E7EB',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <h2 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#111827',
                      margin: 0
                    }}>{t('contentFilter.logs.title')}</h2>
                    <button
                      onClick={loadFilterLogs}
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
                      {t('contentFilter.logs.refresh')}
                    </button>
                  </div>

                  {loadingLogs ? (
                    <div style={{
                      padding: '40px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #E5E7EB',
                        borderTop: '4px solid #3B82F6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                      }}></div>
                      <p style={{ color: '#6B7280', fontSize: '14px' }}>{t('common.loading')}</p>
                    </div>
                  ) : filterLogs.length === 0 ? (
                    <div style={{
                      padding: '60px 20px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '48px',
                        marginBottom: '16px'
                      }}>🛡️</div>
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: '#111827',
                        marginBottom: '8px'
                      }}>{t('contentFilter.logs.noActivity')}</h3>
                      <p style={{
                        color: '#6B7280',
                        fontSize: '14px'
                      }}>{t('contentFilter.logs.noUrls')}</p>
                    </div>
                  ) : (
                    <div style={{
                      maxHeight: '600px',
                      overflow: 'auto'
                    }}>
                      {filterLogs.map((log, index) => (
                        <div
                          key={index}
                          style={{
                            padding: '16px 24px',
                            borderBottom: index < filterLogs.length - 1 ? '1px solid #E5E7EB' : 'none'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '8px'
                          }}>
                            <div style={{ flex: 1 }}>
                              <div style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#111827',
                                marginBottom: '4px'
                              }}>
                                {log.url || 'Unknown URL'}
                              </div>
                              <div style={{
                                fontSize: '13px',
                                color: '#6B7280'
                              }}>
                                {log.timestamp || new Date().toLocaleString()}
                              </div>
                            </div>
                            <div style={{
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: `${getReasonBadge(log.reason)}20`,
                              color: getReasonBadge(log.reason)
                            }}>
                              {(log.reason || 'filtered').toUpperCase()}
                            </div>
                          </div>
                          <div style={{
                            fontSize: '13px',
                            color: '#6B7280'
                          }}>
                            {log.message || t('contentFilter.logs.defaultMessage')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentFilter;
