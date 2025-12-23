import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import MainHeader from './MainHeader';
import Toast from './Toast';
import { healthAPI, urlsAPI } from '../services/api';
import './LinkHealth.css';

const LinkHealth = () => {
  const { t } = useTranslation();
  const [monitoredLinks, setMonitoredLinks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('monitored'); // monitored, alerts
  const [userLinks, setUserLinks] = useState([]);
  const [showEnableModal, setShowEnableModal] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);
  
  const [monitorSettings, setMonitorSettings] = useState({
    checkInterval: 60,
    notifyOnFailure: true,
    failureThreshold: 3
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'monitored') {
        const response = await healthAPI.getMonitored();
        if (response.success) {
          setMonitoredLinks(response.data.monitoredLinks);
        }
      } else {
        const response = await healthAPI.getAlerts({ acknowledged: false });
        if (response.success) {
          setAlerts(response.data.alerts);
        }
      }
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLinks = async () => {
    try {
      const response = await urlsAPI.list({ limit: 100 });
      if (response.success) {
        setUserLinks(response.data.urls);
      }
    } catch (error) {
      console.error('Failed to fetch links:', error);
    }
  };

  const handleEnableMonitoring = async () => {
    if (!selectedLink) return;
    
    try {
      await healthAPI.enable(selectedLink._id, monitorSettings);
      setShowEnableModal(false);
      setSelectedLink(null);
      fetchData();
      setToast({ type: 'success', message: 'Health monitoring enabled!' });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    }
  };

  const handleDisableMonitoring = async (urlId) => {
    if (!window.confirm('Disable health monitoring for this link?')) return;
    
    try {
      await healthAPI.disable(urlId);
      fetchData();
      setToast({ type: 'success', message: 'Health monitoring disabled' });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    }
  };

  const handleManualCheck = async (urlId) => {
    try {
      const response = await healthAPI.check(urlId);
      if (response.success) {
        fetchData();
        setToast({ 
          type: response.data.result.isHealthy ? 'success' : 'warning',
          message: response.data.result.isHealthy ? 'Link is healthy!' : 'Link has issues'
        });
      }
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    }
  };

  const handleAcknowledgeAlert = async (urlId, alertId) => {
    try {
      await healthAPI.acknowledgeAlert(urlId, alertId);
      fetchData();
      setToast({ type: 'success', message: 'Alert acknowledged' });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    }
  };

  const getStatusColor = (isHealthy) => {
    return isHealthy ? '#10B981' : '#DC2626';
  };

  const getUptimeColor = (uptime) => {
    if (uptime >= 99) return '#10B981';
    if (uptime >= 95) return '#F59E0B';
    return '#DC2626';
  };

  return (
    <>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      
      <div className="analytics-container">
        <MainHeader />
        <div className="analytics-layout">
          <Sidebar />
          <div className="analytics-main">
            <div className="analytics-content">
              <div className="page-header">
                <div>
                  <h1>Link Health Monitoring</h1>
                  <p>Monitor your links and get alerts when they go down</p>
                </div>
                <button
                  onClick={() => {
                    fetchUserLinks();
                    setShowEnableModal(true);
                  }}
                  className="btn-primary"
                >
                  + Enable Monitoring
                </button>
              </div>

              {/* Tabs */}
              <div className="tabs">
                <button
                  className={activeTab === 'monitored' ? 'tab active' : 'tab'}
                  onClick={() => setActiveTab('monitored')}
                >
                  Monitored Links ({monitoredLinks.length})
                </button>
                <button
                  className={activeTab === 'alerts' ? 'tab active' : 'tab'}
                  onClick={() => setActiveTab('alerts')}
                >
                  Alerts ({alerts.length})
                </button>
              </div>

              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading...</p>
                </div>
              ) : activeTab === 'monitored' ? (
                <div className="health-list">
                  {monitoredLinks.length === 0 ? (
                    <div className="empty-state">
                      <p>No links are being monitored yet. Enable monitoring to get started!</p>
                    </div>
                  ) : (
                    monitoredLinks.map((link) => (
                      <div key={link._id} className="health-card">
                        <div className="health-header">
                          <div className="health-status" style={{ backgroundColor: getStatusColor(link.currentStatus.isHealthy) }}>
                            {link.currentStatus.isHealthy ? '✓' : '✗'}
                          </div>
                          <div className="health-info">
                            <h3>{link.url.title || link.url.shortCode}</h3>
                            <p className="health-url">{link.originalUrl}</p>
                          </div>
                        </div>

                        <div className="health-stats">
                          <div className="health-stat">
                            <span className="stat-label">Uptime</span>
                            <span className="stat-value" style={{ color: getUptimeColor(link.statistics.uptime) }}>
                              {link.statistics.uptime.toFixed(1)}%
                            </span>
                          </div>
                          <div className="health-stat">
                            <span className="stat-label">Response Time</span>
                            <span className="stat-value">{link.statistics.averageResponseTime}ms</span>
                          </div>
                          <div className="health-stat">
                            <span className="stat-label">Last Checked</span>
                            <span className="stat-value">
                              {new Date(link.currentStatus.lastChecked).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="health-stat">
                            <span className="stat-label">Status Code</span>
                            <span className="stat-value">{link.currentStatus.lastStatusCode || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="health-actions">
                          <button
                            onClick={() => handleManualCheck(link.url._id)}
                            className="btn-secondary btn-sm"
                          >
                            Check Now
                          </button>
                          <button
                            onClick={() => handleDisableMonitoring(link.url._id)}
                            className="btn-secondary btn-sm"
                          >
                            Disable
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="alerts-list">
                  {alerts.length === 0 ? (
                    <div className="empty-state">
                      <p>No unacknowledged alerts. All systems operational! ✓</p>
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <div key={alert._id} className={`alert-card alert-${alert.type}`}>
                        <div className="alert-icon">
                          {alert.type === 'down' ? '⚠️' : alert.type === 'slow' ? '🐌' : '✅'}
                        </div>
                        <div className="alert-content">
                          <div className="alert-header">
                            <h4>{alert.url.title || alert.url.shortCode}</h4>
                            <span className="alert-time">
                              {new Date(alert.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="alert-message">{alert.message}</p>
                          <p className="alert-url">{alert.url.originalUrl}</p>
                        </div>
                        <button
                          onClick={() => handleAcknowledgeAlert(alert.url._id, alert._id)}
                          className="btn-secondary btn-sm"
                        >
                          Acknowledge
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Enable Monitoring Modal */}
              {showEnableModal && (
                <div className="modal-overlay" onClick={() => setShowEnableModal(false)}>
                  <div className="modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                      <h2>Enable Health Monitoring</h2>
                      <button onClick={() => setShowEnableModal(false)} className="close-btn">×</button>
                    </div>
                    <div className="modal-body">
                      <div className="form-section">
                        <label>Select Link</label>
                        <select
                          value={selectedLink?._id || ''}
                          onChange={(e) => {
                            const link = userLinks.find(l => l._id === e.target.value);
                            setSelectedLink(link);
                          }}
                        >
                          <option value="">Choose a link...</option>
                          {userLinks.map((link) => (
                            <option key={link._id} value={link._id}>
                              {link.title || link.shortCode} - {link.originalUrl}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-section">
                        <label>Check Interval (minutes)</label>
                        <input
                          type="number"
                          value={monitorSettings.checkInterval}
                          onChange={(e) => setMonitorSettings({
                            ...monitorSettings,
                            checkInterval: parseInt(e.target.value)
                          })}
                          min="15"
                          max="1440"
                        />
                      </div>

                      <div className="form-section">
                        <label>Failure Threshold</label>
                        <input
                          type="number"
                          value={monitorSettings.failureThreshold}
                          onChange={(e) => setMonitorSettings({
                            ...monitorSettings,
                            failureThreshold: parseInt(e.target.value)
                          })}
                          min="1"
                          max="10"
                        />
                        <p className="help-text">Number of consecutive failures before alert</p>
                      </div>

                      <div className="form-section">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={monitorSettings.notifyOnFailure}
                            onChange={(e) => setMonitorSettings({
                              ...monitorSettings,
                              notifyOnFailure: e.target.checked
                            })}
                          />
                          <span>Send email notifications on failure</span>
                        </label>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button onClick={() => setShowEnableModal(false)} className="btn-secondary">
                        Cancel
                      </button>
                      <button
                        onClick={handleEnableMonitoring}
                        disabled={!selectedLink}
                        className="btn-primary"
                      >
                        Enable Monitoring
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LinkHealth;
