import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { usePermissions } from '../contexts/PermissionContext';
import { googleAnalyticsAPI } from '../services/api';
import Sidebar from './Sidebar';
import MainHeader from './MainHeader';
import './GoogleAnalyticsDashboard.css';
import './DashboardLayout.css';

function GoogleAnalyticsDashboard() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { hasRole } = usePermissions();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [dateRange, setDateRange] = useState('30daysAgo');
  const [realtimeData, setRealtimeData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const dateRangeOptions = [
    { value: '7daysAgo', label: t('googleAnalytics.dateRange.7days') || 'Last 7 days' },
    { value: '30daysAgo', label: t('googleAnalytics.dateRange.30days') || 'Last 30 days' },
    { value: '90daysAgo', label: t('googleAnalytics.dateRange.90days') || 'Last 90 days' }
  ];

  const checkConfiguration = useCallback(async () => {
    try {
      const response = await googleAnalyticsAPI.checkStatus();
      if (response.success) {
        setIsConfigured(response.data.configured);
        return response.data.configured;
      }
      return false;
    } catch (err) {
      console.error('Error checking GA configuration:', err);
      return false;
    }
  }, []);

  const loadRealtimeData = useCallback(async () => {
    try {
      const response = await googleAnalyticsAPI.getRealtime();
      if (response.success) {
        setRealtimeData(response.data);
      }
    } catch (err) {
      console.error('Error loading realtime data:', err);
    }
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setRefreshing(true);
      const response = await googleAnalyticsAPI.getDashboard({
        startDate: dateRange,
        endDate: 'today'
      });
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setRefreshing(false);
    }
  }, [dateRange]);

  useEffect(() => {
    const initializeDashboard = async () => {
      setLoading(true);
      const configured = await checkConfiguration();
      if (configured) {
        await Promise.all([loadRealtimeData(), loadDashboardData()]);
      }
      setLoading(false);
    };

    if (hasRole(['super_admin'])) {
      initializeDashboard();
    } else {
      setLoading(false);
    }
  }, [hasRole, checkConfiguration, loadRealtimeData, loadDashboardData]);

  useEffect(() => {
    if (isConfigured) {
      loadDashboardData();
    }
  }, [dateRange, isConfigured, loadDashboardData]);

  // Auto-refresh realtime data every 30 seconds
  useEffect(() => {
    if (!isConfigured) return;
    
    const interval = setInterval(() => {
      loadRealtimeData();
    }, 30000);

    return () => clearInterval(interval);
  }, [isConfigured, loadRealtimeData]);

  const handleRefresh = async () => {
    await Promise.all([loadRealtimeData(), loadDashboardData()]);
  };

  // Only super_admin can access
  if (!hasRole(['super_admin'])) {
    return null;
  }

  if (loading) {
    return (
      <div className="analytics-container">
        <MainHeader />
        <div className="analytics-layout">
          <Sidebar />
          <div className="analytics-main">
            <div className="analytics-content">
              <div className="loading-state">
                <div className="spinner"></div>
                <p>{t('googleAnalytics.loading') || 'Loading Google Analytics...'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="analytics-container">
        <MainHeader />
        <div className="analytics-layout">
          <Sidebar />
          <div className="analytics-main">
            <div className="analytics-content">
              <div className="ga-not-configured">
                <div className="ga-not-configured-icon">📊</div>
                <h2>{t('googleAnalytics.notConfigured.title') || 'Google Analytics Not Configured'}</h2>
                <p>{t('googleAnalytics.notConfigured.description') || 'Please configure Google Analytics credentials in the server environment variables.'}</p>
                <div className="ga-config-instructions">
                  <h3>{t('googleAnalytics.notConfigured.instructions') || 'Required Environment Variables:'}</h3>
                  <code>
                    GA_PROPERTY_ID=your_property_id<br/>
                    GA_CLIENT_EMAIL=your_service_account_email<br/>
                    GA_PRIVATE_KEY="your_private_key"
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <MainHeader />
      <div className="analytics-layout">
        <Sidebar />
        <div className="analytics-main">
          <div className="analytics-content" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            {/* Page Header */}
            <div className="ga-page-header">
              <div className="ga-header-left">
                <h1>{t('googleAnalytics.title') || 'Google Analytics'}</h1>
                <p>{t('googleAnalytics.subtitle') || 'Website traffic and user behavior insights'}</p>
              </div>
              <div className="ga-header-right">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="ga-date-select"
                >
                  {dateRangeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button 
                  className="ga-refresh-btn"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  {refreshing ? '⟳' : '↻'} {t('googleAnalytics.refresh') || 'Refresh'}
                </button>
              </div>
            </div>

            {error && (
              <div className="ga-error-alert">
                <span>⚠️ {error}</span>
                <button onClick={() => setError(null)}>×</button>
              </div>
            )}

            {/* Realtime Widget */}
            {realtimeData && (
              <div className="ga-realtime-card">
                <div className="ga-realtime-indicator">
                  <span className="ga-live-dot"></span>
                  {t('googleAnalytics.realtime.live') || 'LIVE'}
                </div>
                <div className="ga-realtime-content">
                  <div className="ga-realtime-number">{realtimeData.activeUsers}</div>
                  <div className="ga-realtime-label">
                    {t('googleAnalytics.realtime.activeUsers') || 'Active Users Right Now'}
                  </div>
                </div>
              </div>
            )}

            {/* Overview Stats */}
            {dashboardData?.overview && (
              <div className="ga-stats-grid">
                <div className="ga-stat-card">
                  <div className="ga-stat-icon">👥</div>
                  <div className="ga-stat-content">
                    <div className="ga-stat-value">{dashboardData.overview.activeUsers.toLocaleString()}</div>
                    <div className="ga-stat-label">{t('googleAnalytics.metrics.activeUsers') || 'Active Users'}</div>
                  </div>
                </div>
                <div className="ga-stat-card">
                  <div className="ga-stat-icon">🆕</div>
                  <div className="ga-stat-content">
                    <div className="ga-stat-value">{dashboardData.overview.newUsers.toLocaleString()}</div>
                    <div className="ga-stat-label">{t('googleAnalytics.metrics.newUsers') || 'New Users'}</div>
                  </div>
                </div>
                <div className="ga-stat-card">
                  <div className="ga-stat-icon">📊</div>
                  <div className="ga-stat-content">
                    <div className="ga-stat-value">{dashboardData.overview.sessions.toLocaleString()}</div>
                    <div className="ga-stat-label">{t('googleAnalytics.metrics.sessions') || 'Sessions'}</div>
                  </div>
                </div>
                <div className="ga-stat-card">
                  <div className="ga-stat-icon">📄</div>
                  <div className="ga-stat-content">
                    <div className="ga-stat-value">{dashboardData.overview.pageViews.toLocaleString()}</div>
                    <div className="ga-stat-label">{t('googleAnalytics.metrics.pageViews') || 'Page Views'}</div>
                  </div>
                </div>
                <div className="ga-stat-card">
                  <div className="ga-stat-icon">⏱️</div>
                  <div className="ga-stat-content">
                    <div className="ga-stat-value">{Math.round(dashboardData.overview.avgSessionDuration)}s</div>
                    <div className="ga-stat-label">{t('googleAnalytics.metrics.avgDuration') || 'Avg. Duration'}</div>
                  </div>
                </div>
                <div className="ga-stat-card">
                  <div className="ga-stat-icon">📈</div>
                  <div className="ga-stat-content">
                    <div className="ga-stat-value">{dashboardData.overview.engagementRate}%</div>
                    <div className="ga-stat-label">{t('googleAnalytics.metrics.engagementRate') || 'Engagement Rate'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Charts Row */}
            <div className="ga-charts-row">
              {/* Traffic Over Time */}
              {dashboardData?.trafficOverTime && (
                <div className="ga-chart-card ga-chart-wide">
                  <h3>{t('googleAnalytics.charts.trafficOverTime') || 'Traffic Over Time'}</h3>
                  <div className="ga-simple-chart">
                    {dashboardData.trafficOverTime.slice(-14).map((day, index) => (
                      <div key={index} className="ga-chart-bar-container">
                        <div 
                          className="ga-chart-bar"
                          style={{ 
                            height: `${Math.max(5, (day.users / Math.max(...dashboardData.trafficOverTime.map(d => d.users))) * 100)}%` 
                          }}
                          title={`${day.date}: ${day.users} users`}
                        ></div>
                        <span className="ga-chart-label">{day.date.slice(-2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Data Tables Row */}
            <div className="ga-tables-row">
              {/* Traffic Sources */}
              {dashboardData?.trafficSources && (
                <div className="ga-table-card">
                  <h3>{t('googleAnalytics.tables.trafficSources') || 'Traffic Sources'}</h3>
                  <table className="ga-data-table">
                    <thead>
                      <tr>
                        <th>{t('googleAnalytics.tables.source') || 'Source'}</th>
                        <th>{t('googleAnalytics.tables.sessions') || 'Sessions'}</th>
                        <th>{t('googleAnalytics.tables.users') || 'Users'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.trafficSources.map((source, index) => (
                        <tr key={index}>
                          <td>{source.source}</td>
                          <td>{source.sessions.toLocaleString()}</td>
                          <td>{source.users.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Top Pages */}
              {dashboardData?.topPages && (
                <div className="ga-table-card">
                  <h3>{t('googleAnalytics.tables.topPages') || 'Top Pages'}</h3>
                  <table className="ga-data-table">
                    <thead>
                      <tr>
                        <th>{t('googleAnalytics.tables.page') || 'Page'}</th>
                        <th>{t('googleAnalytics.tables.views') || 'Views'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.topPages.slice(0, 8).map((page, index) => (
                        <tr key={index}>
                          <td className="ga-page-path" title={page.path}>{page.path}</td>
                          <td>{page.pageViews.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Device & Location Row */}
            <div className="ga-tables-row">
              {/* Devices */}
              {dashboardData?.devices && (
                <div className="ga-table-card ga-table-small">
                  <h3>{t('googleAnalytics.tables.devices') || 'Devices'}</h3>
                  <div className="ga-device-list">
                    {dashboardData.devices.map((device, index) => (
                      <div key={index} className="ga-device-item">
                        <span className="ga-device-icon">
                          {device.device === 'desktop' ? '🖥️' : device.device === 'mobile' ? '📱' : '📟'}
                        </span>
                        <span className="ga-device-name">{device.device}</span>
                        <span className="ga-device-value">{device.users.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Browsers */}
              {dashboardData?.browsers && (
                <div className="ga-table-card ga-table-small">
                  <h3>{t('googleAnalytics.tables.browsers') || 'Browsers'}</h3>
                  <div className="ga-browser-list">
                    {dashboardData.browsers.slice(0, 5).map((browser, index) => (
                      <div key={index} className="ga-browser-item">
                        <span className="ga-browser-name">{browser.browser}</span>
                        <span className="ga-browser-value">{browser.users.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Geographic */}
              {dashboardData?.geographic && (
                <div className="ga-table-card">
                  <h3>{t('googleAnalytics.tables.locations') || 'Top Locations'}</h3>
                  <table className="ga-data-table">
                    <thead>
                      <tr>
                        <th>{t('googleAnalytics.tables.country') || 'Country'}</th>
                        <th>{t('googleAnalytics.tables.city') || 'City'}</th>
                        <th>{t('googleAnalytics.tables.users') || 'Users'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.geographic.slice(0, 8).map((loc, index) => (
                        <tr key={index}>
                          <td>{loc.country}</td>
                          <td>{loc.city}</td>
                          <td>{loc.users.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GoogleAnalyticsDashboard;
