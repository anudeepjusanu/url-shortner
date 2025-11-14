import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../contexts/LanguageContext";
import Sidebar from "./Sidebar";
import MainHeader from "./MainHeader";
import { analyticsAPI } from "../services/api";
import "./Analytics.css";
import "./DashboardLayout.css";

const Analytics = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { id } = useParams(); // Get URL ID from route params
  const [timeFilter, setTimeFilter] = useState("7d");
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [linkData, setLinkData] = useState(null);

  useEffect(() => {
    if (id) {
      fetchAnalyticsData();
    } else {
      fetchDashboardAnalytics();
    }
  }, [id, timeFilter]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch URL-specific analytics
      const response = await analyticsAPI.getUrlAnalytics(id, {
        period: timeFilter,
        groupBy: timeFilter === '7d' ? 'hour' : 'day'
      });

      console.log('Analytics API Response:', response);

      // Transform backend data to frontend format
      const backendData = response.data;
      const transformedData = {
        totalClicks: backendData.overview?.totalClicks || 0,
        uniqueClicks: backendData.overview?.uniqueClicks || 0,
        clickThroughRate: backendData.overview?.clickThroughRate || '0%',
        averageTime: backendData.overview?.averageClicksPerDay ? `${backendData.overview.averageClicksPerDay}/day` : '0/day',
        
        // Transform time series data for chart
        clickActivity: backendData.timeSeries?.map(item => ({
          label: item.date || item._id,
          date: item.date || item._id,
          totalClicks: item.clicks || 0,
          uniqueClicks: item.uniqueClicks || 0
        })) || [],
        
        // Transform country data
        clicksByCountry: backendData.topStats?.countries?.map(item => ({
          country: item.countryName || item.country || 'Unknown',
          name: item.countryName || item.country || 'Unknown',
          clicks: item.clicks || 0
        })) || [],
        
        // Transform device data
        clicksByDevice: backendData.topStats?.devices?.reduce((acc, item) => {
          const deviceType = (item.type || item._id || 'unknown').toLowerCase();
          acc[deviceType] = item.clicks || 0;
          return acc;
        }, {}) || {},
        
        // Store URL info if available
        url: backendData.url || null
      };

      setAnalyticsData(transformedData);

      // Fetch URL details separately if not included
      if (!transformedData.url && id) {
        try {
          const urlResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3015/api'}/urls/${id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('accessToken')}`
            }
          });
          if (urlResponse.ok) {
            const urlData = await urlResponse.json();
            if (urlData.success && urlData.data) {
              setLinkData(urlData.data);
            }
          }
        } catch (urlErr) {
          console.error('Error fetching URL details:', urlErr);
        }
      } else if (transformedData.url) {
        setLinkData(transformedData.url);
      }
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard overview analytics
      const response = await analyticsAPI.getOverview({
        period: timeFilter
      });

      setAnalyticsData(response.data);
    } catch (err) {
      console.error('Error fetching dashboard analytics:', err);
      setError(err.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeFilterChange = (newFilter) => {
    setTimeFilter(newFilter);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(t('common.copied'));
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const exportData = async () => {
    try {
      // For now, create a simple CSV export from the current data
      let csvContent = '';

      if (id && analyticsData) {
        // Export URL-specific data
        csvContent = 'Metric,Value\n';
        csvContent += `Total Clicks,${analyticsData.totalClicks || 0}\n`;
        csvContent += `Unique Clicks,${analyticsData.uniqueClicks || 0}\n`;
        csvContent += `Click-through Rate,${analyticsData.clickThroughRate || '0%'}\n`;
        csvContent += `Average Time,${analyticsData.averageTime || '0s'}\n`;

        if (analyticsData.clicksByCountry) {
          csvContent += '\nCountry,Clicks\n';
          analyticsData.clicksByCountry.forEach(country => {
            csvContent += `${country.country || country.name},${country.clicks}\n`;
          });
        }

        if (analyticsData.clicksByDevice) {
          csvContent += '\nDevice,Clicks\n';
          Object.entries(analyticsData.clicksByDevice).forEach(([device, clicks]) => {
            csvContent += `${device},${clicks}\n`;
          });
        }
      } else if (analyticsData) {
        // Export dashboard overview data
        csvContent = 'Metric,Value\n';
        csvContent += `Total Clicks,${analyticsData.totalClicks || 0}\n`;
        csvContent += `Unique Clicks,${analyticsData.uniqueClicks || 0}\n`;
      }

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `analytics_${id || 'dashboard'}_${timeFilter}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting data:', err);
      alert(t('common.error'));
    }
  };

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
                <p>{t('common.loading')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-container">
        <MainHeader />
        <div className="analytics-layout">
          <Sidebar />
          <div className="analytics-main">
            <div className="analytics-content">
              <div className="error-state">
                <p>{t('common.error')}: {error}</p>
                <button onClick={() => window.location.reload()}>{t('common.refresh')}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .stats-card {
          transition: all 0.2s ease;
        }
        .stats-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }
        .link-info-card {
          transition: all 0.2s ease;
        }
        .link-info-card:hover {
          border-color: #3B82F6 !important;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
        }
        .action-btn:hover {
          background-color: #E5E7EB !important;
          transform: translateY(-1px);
        }
        .action-btn {
          transition: all 0.2s ease;
        }
        .export-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .export-btn {
          transition: all 0.2s ease;
        }
        .chart-card, .section-card {
          transition: all 0.2s ease;
        }
        .chart-card:hover, .section-card:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
      `}</style>
      <div className="analytics-container">
        <MainHeader />
        <div className="analytics-layout">
          <Sidebar />
          <div className="analytics-main">
            <div className="analytics-content">
              {/* Page Header */}
              <div className="page-header" style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '24px'
              }}>
                <div>
                  <h1 style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#111827',
                    marginBottom: '4px',
                    margin: '0 0 4px 0'
                  }}>{t('analytics.title')}</h1>
                  <p style={{
                    color: '#6B7280',
                    fontSize: '14px',
                    margin: 0
                  }}>{t('analytics.subtitle')}</p>
                </div>
                <button
                  onClick={exportData}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none',
                    background: '#3B82F6',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M5.33325 6.66669L7.99992 4.00002L10.6666 6.66669"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8 4V10"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {t('analytics.export.title')}
                </button>
              </div>

            {/* Link Info Card */}
            <div className="link-info-card" style={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '16px 20px',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: isRTL ? 'row-reverse' : 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div className="link-info-content" style={{
                display: 'flex',
                flexDirection: isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: '12px',
                flex: 1,
                minWidth: 0
              }}>
                <div className="link-icon" style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <svg
                    width="25"
                    height="20"
                    viewBox="0 0 25 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10 6H14M10 6C8.34315 6 7 7.34315 7 9C7 10.6569 8.34315 12 10 12H12M10 6C8.34315 6 7 4.65685 7 3C7 1.34315 8.34315 0 10 0H12M14 6C15.6569 6 17 7.34315 17 9C17 10.6569 15.6569 12 14 12H12M14 6C15.6569 6 17 4.65685 17 3C17 1.34315 15.6569 0 14 0H12M12 0V12"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="link-details" style={{
                  minWidth: 0,
                  flex: 1,
                  textAlign: isRTL ? 'right' : 'left'
                }}>
                  <h3 className="short-link" style={{
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#1F2937',
                    marginBottom: '4px',
                    margin: 0,
                    direction: 'ltr',
                    textAlign: isRTL ? 'right' : 'left'
                  }}>linksa.co/abc123</h3>
                  <p className="original-link" style={{
                    fontSize: '13px',
                    color: '#6B7280',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    direction: 'ltr',
                    textAlign: isRTL ? 'right' : 'left'
                  }}>
                    https://www.example.com/very-long-url-that-was-shortened
                  </p>
                </div>
              </div>
              <div className="link-actions" style={{
                display: 'flex',
                gap: '8px',
                marginLeft: isRTL ? 0 : '16px',
                marginRight: isRTL ? '16px' : 0,
                flexShrink: 0
              }}>
                <button className="action-btn copy-btn" style={{
                  width: '36px',
                  height: '36px',
                  padding: '8px',
                  backgroundColor: '#F3F4F6',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6B7280'
                }}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="4"
                      y="4"
                      width="8"
                      height="8"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M8 2H4C2.89543 2 2 2.89543 2 4V8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button className="action-btn share-btn" style={{
                  width: '36px',
                  height: '36px',
                  padding: '8px',
                  backgroundColor: '#F3F4F6',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6B7280'
                }}>
                  <svg
                    width="14"
                    height="16"
                    viewBox="0 0 14 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10 6L6 2L2 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M6 2V12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 12V13C14 13.5304 13.7893 14.0391 13.4142 14.4142C13.0391 14.7893 12.5304 15 12 15H2C1.46957 15 0.960859 14.7893 0.585786 14.4142C0.210714 14.0391 0 13.5304 0 13V12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button className="action-btn edit-btn" style={{
                  width: '36px',
                  height: '36px',
                  padding: '8px',
                  backgroundColor: '#F3F4F6',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6B7280'
                }}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7.33333 2.66669H2.66667C2.31304 2.66669 1.97391 2.80716 1.72386 3.05721C1.47381 3.30726 1.33333 3.64640 1.33333 4.00002V13.3334C1.33333 13.687 1.47381 14.0261 1.72386 14.2762C1.97391 14.5262 2.31304 14.6667 2.66667 14.6667H12C12.3536 14.6667 12.6928 14.5262 12.9428 14.2762C13.1929 14.0261 13.3333 13.687 13.3333 13.3334V8.66669"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12.3333 1.66669C12.5985 1.40148 12.9583 1.25244 13.3333 1.25244C13.7083 1.25244 14.0681 1.40148 14.3333 1.66669C14.5985 1.9319 14.7476 2.29171 14.7476 2.66669C14.7476 3.04167 14.5985 3.40148 14.3333 3.66669L8 10L5.33333 10.6667L6 8.00002L12.3333 1.66669Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
            {/* Link Info Card - Only show for individual URL analytics */}
            {linkData && (
              <div className="link-info-card" style={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '16px 20px',
                marginBottom: '20px',
                display: 'flex',
                flexDirection: isRTL ? 'row-reverse' : 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div className="link-info-content" style={{
                  display: 'flex',
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  gap: '12px',
                  flex: 1,
                  minWidth: 0
                }}>
                  <div className="link-icon" style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    backgroundColor: '#EFF6FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <svg
                      width="25"
                      height="20"
                      viewBox="0 0 25 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10 6H14M10 6C8.34315 6 7 7.34315 7 9C7 10.6569 8.34315 12 10 12H12M10 6C8.34315 6 7 4.65685 7 3C7 1.34315 8.34315 0 10 0H12M14 6C15.6569 6 17 7.34315 17 9C17 10.6569 15.6569 12 14 12H12M14 6C15.6569 6 17 4.65685 17 3C17 1.34315 15.6569 0 14 0H12M12 0V12"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="link-details" style={{
                    minWidth: 0,
                    flex: 1,
                    textAlign: isRTL ? 'right' : 'left'
                  }}>
                    <h3 className="short-link" style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: '#1F2937',
                      marginBottom: '4px',
                      margin: 0,
                      direction: 'ltr',
                      textAlign: isRTL ? 'right' : 'left'
                    }}>
                      {linkData.domain && linkData.domain !== 'laghhu.link'
                        ? `${linkData.domain}/${linkData.shortCode}`
                        : `laghhu.link/${linkData.shortCode}`}
                    </h3>
                    <p className="original-link" style={{
                      fontSize: '13px',
                      color: '#6B7280',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      direction: 'ltr',
                      textAlign: isRTL ? 'right' : 'left'
                    }}>
                      {linkData.originalUrl}
                    </p>
                  </div>
                </div>
                <div className="link-actions" style={{
                  display: 'flex',
                  gap: '8px',
                  marginLeft: isRTL ? 0 : '16px',
                  marginRight: isRTL ? '16px' : 0,
                  flexShrink: 0
                }}>
                  <button
                    className="action-btn copy-btn"
                    onClick={() => copyToClipboard(
                      linkData.domain && linkData.domain !== 'laghhu.link'
                        ? `https://${linkData.domain}/${linkData.shortCode}`
                        : `https://laghhu.link/${linkData.shortCode}`
                    )}
                    style={{
                      width: '36px',
                      height: '36px',
                      padding: '8px',
                      backgroundColor: '#F3F4F6',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#6B7280'
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        x="4"
                        y="4"
                        width="8"
                        height="8"
                        rx="2"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M8 2H4C2.89543 2 2 2.89543 2 4V8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button className="action-btn share-btn" style={{
                    width: '36px',
                    height: '36px',
                    padding: '8px',
                    backgroundColor: '#F3F4F6',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6B7280'
                  }}>
                    <svg
                      width="14"
                      height="16"
                      viewBox="0 0 14 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10 6L6 2L2 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M6 2V12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M14 12V13C14 13.5304 13.7893 14.0391 13.4142 14.4142C13.0391 14.7893 12.5304 15 12 15H2C1.46957 15 0.960859 14.7893 0.585786 14.4142C0.210714 14.0391 0 13.5304 0 13V12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button className="action-btn edit-btn" style={{
                    width: '36px',
                    height: '36px',
                    padding: '8px',
                    backgroundColor: '#F3F4F6',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6B7280'
                  }}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7.33333 2.66669H2.66667C2.31304 2.66669 1.97391 2.80716 1.72386 3.05721C1.47381 3.30726 1.33333 3.64640 1.33333 4.00002V13.3334C1.33333 13.687 1.47381 14.0261 1.72386 14.2762C1.97391 14.5262 2.31304 14.6667 2.66667 14.6667H12C12.3536 14.6667 12.6928 14.5262 12.9428 14.2762C13.1929 14.0261 13.3333 13.687 13.3333 13.3334V8.66669"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12.3333 1.66669C12.5985 1.40148 12.9583 1.25244 13.3333 1.25244C13.7083 1.25244 14.0681 1.40148 14.3333 1.66669C14.5985 1.9319 14.7476 2.29171 14.7476 2.66669C14.7476 3.04167 14.5985 3.40148 14.3333 3.66669L8 10L5.33333 10.6667L6 8.00002L12.3333 1.66669Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="stats-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              marginBottom: '20px',
              direction: isRTL ? 'rtl' : 'ltr'
            }}>
              <div className="stats-card" style={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <div className="stats-content" style={{
                  display: 'flex',
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px'
                }}>
                  <div className="stats-info" style={{
                    textAlign: isRTL ? 'right' : 'left',
                    flex: 1,
                    minWidth: 0
                  }}>
                    <p className="stats-label" style={{
                      fontSize: '13px',
                      color: '#6B7280',
                      marginBottom: '8px',
                      fontWeight: '400',
                      margin: 0
                    }}>{t('analytics.overview.totalClicks')}</p>
                    <h3 className="stats-value" style={{
                      fontSize: '28px',
                      fontWeight: '600',
                      color: '#1F2937',
                      margin: '8px 0'
                    }}>{analyticsData?.totalClicks || 0}</h3>
                    {analyticsData?.totalClicksChange && (
                      <div className={`stats-change ${analyticsData.totalClicksChange >= 0 ? 'positive' : 'negative'}`} style={{
                      display: 'flex',
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      color: '#10B981'
                    }}>
                        <svg
                          width="11"
                          height="14"
                          viewBox="0 0 11 14"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M5.5 1L1 5.5H4V13H7V5.5H10L5.5 1Z"
                            fill="currentColor"
                            style={{
                              transform: analyticsData.totalClicksChange < 0 ? 'rotate(180deg)' : 'none'
                            }}
                          />
                        </svg>
                        <span style={{ margin: 0 }}>{analyticsData.totalClicksChange >= 0 ? '+' : ''}{analyticsData.totalClicksChange}%</span>
                      </div>
                    )}
                  </div>
                  <div className="stats-icon blue" style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    backgroundColor: '#EFF6FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3B82F6'
                  }}>
                    <svg
                      width="13"
                      height="20"
                      viewBox="0 0 13 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1 7H12M1 7L5 3M1 7L5 11M12 7V15C12 15.5304 11.7893 16.0391 11.4142 16.4142C11.0391 16.7893 10.5304 17 10 17H2"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="stats-card" style={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <div className="stats-content" style={{
                  display: 'flex',
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px'
                }}>
                  <div className="stats-info" style={{
                    textAlign: isRTL ? 'right' : 'left',
                    flex: 1,
                    minWidth: 0
                  }}>
                    <p className="stats-label" style={{
                      fontSize: '13px',
                      color: '#6B7280',
                      marginBottom: '8px',
                      fontWeight: '400',
                      margin: 0
                    }}>{t('analytics.overview.uniqueClicks')}</p>
                    <h3 className="stats-value" style={{
                      fontSize: '28px',
                      fontWeight: '600',
                      color: '#1F2937',
                      margin: '8px 0'
                    }}>{analyticsData?.uniqueClicks || 0}</h3>
                    {analyticsData?.uniqueClicksChange && (
                      <div className={`stats-change ${analyticsData.uniqueClicksChange >= 0 ? 'positive' : 'negative'}`} style={{
                      display: 'flex',
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      color: '#10B981'
                    }}>
                        <svg
                          width="11"
                          height="14"
                          viewBox="0 0 11 14"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M5.5 1L1 5.5H4V13H7V5.5H10L5.5 1Z"
                            fill="currentColor"
                            style={{
                              transform: analyticsData.uniqueClicksChange < 0 ? 'rotate(180deg)' : 'none'
                            }}
                          />
                        </svg>
                        <span style={{ margin: 0 }}>{analyticsData.uniqueClicksChange >= 0 ? '+' : ''}{analyticsData.uniqueClicksChange}%</span>
                      </div>
                    )}
                  </div>
                  <div className="stats-icon green" style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    backgroundColor: '#D1FAE5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10B981'
                  }}>
                    <svg
                      width="25"
                      height="20"
                      viewBox="0 0 25 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="9"
                        cy="7"
                        r="4"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M1 21V19C1 16.7909 2.79086 15 5 15H13C15.2091 15 17 16.7909 17 19V21"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="20"
                        cy="8"
                        r="3"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M23 21V20C22.9993 18.1137 21.765 16.4604 20 15.85"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Additional stats cards for comprehensive analytics */}
              <div className="stats-card" style={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <div className="stats-content" style={{
                  display: 'flex',
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px'
                }}>
                  <div className="stats-info" style={{
                    textAlign: isRTL ? 'right' : 'left',
                    flex: 1,
                    minWidth: 0
                  }}>
                    <p className="stats-label" style={{
                      fontSize: '13px',
                      color: '#6B7280',
                      marginBottom: '8px',
                      fontWeight: '400',
                      margin: 0
                    }}>{t('analytics.overview.clickRate')}</p>
                    <h3 className="stats-value" style={{
                      fontSize: '28px',
                      fontWeight: '600',
                      color: '#1F2937',
                      margin: '8px 0'
                    }}>{analyticsData?.clickThroughRate || '0%'}</h3>
                    {analyticsData?.clickThroughRateChange && (
                      <div className={`stats-change ${analyticsData.clickThroughRateChange >= 0 ? 'positive' : 'negative'}`} style={{
                        display: 'flex',
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        color: '#10B981'
                      }}>
                        <svg
                          width="11"
                          height="14"
                          viewBox="0 0 11 14"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M5.5 1L1 5.5H4V13H7V5.5H10L5.5 1Z"
                            fill="currentColor"
                            style={{
                              transform: analyticsData.clickThroughRateChange < 0 ? 'rotate(180deg)' : 'none'
                            }}
                          />
                        </svg>
                        <span style={{ margin: 0 }}>{analyticsData.clickThroughRateChange >= 0 ? '+' : ''}{analyticsData.clickThroughRateChange}%</span>
                      </div>
                    )}
                  </div>
                  <div className="stats-icon orange" style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    backgroundColor: '#FEF3C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#F59E0B'
                  }}>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10 1L13 7L19 7L14.5 11L16 17L10 14L4 17L5.5 11L1 7L7 7L10 1Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="stats-card" style={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <div className="stats-content" style={{
                  display: 'flex',
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px'
                }}>
                  <div className="stats-info" style={{
                    textAlign: isRTL ? 'right' : 'left',
                    flex: 1,
                    minWidth: 0
                  }}>
                    <p className="stats-label" style={{
                      fontSize: '13px',
                      color: '#6B7280',
                      marginBottom: '8px',
                      fontWeight: '400',
                      margin: 0
                    }}>{t('analytics.overview.avgClicksPerDay')}</p>
                    <h3 className="stats-value" style={{
                      fontSize: '28px',
                      fontWeight: '600',
                      color: '#1F2937',
                      margin: '8px 0'
                    }}>{analyticsData?.averageTime || '0s'}</h3>
                    {analyticsData?.averageTimeChange && (
                      <div className={`stats-change ${analyticsData.averageTimeChange >= 0 ? 'positive' : 'negative'}`} style={{
                        display: 'flex',
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        color: '#10B981'
                      }}>
                        <svg
                          width="11"
                          height="14"
                          viewBox="0 0 11 14"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M5.5 1L1 5.5H4V13H7V5.5H10L5.5 1Z"
                            fill="currentColor"
                            style={{
                              transform: analyticsData.averageTimeChange < 0 ? 'rotate(180deg)' : 'none'
                            }}
                          />
                        </svg>
                        <span style={{ margin: 0 }}>{analyticsData.averageTimeChange >= 0 ? '+' : ''}{analyticsData.averageTimeChange}%</span>
                      </div>
                    )}
                  </div>
                  <div className="stats-icon purple" style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    backgroundColor: '#EDE9FE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#8B5CF6'
                  }}>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="10"
                        cy="10"
                        r="8"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M10 6V10L14 14"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Click Activity Chart */}
            <div className="chart-card" style={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <div className="chart-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h3 className="chart-title" style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#1F2937',
                  margin: 0
                }}>{t('analytics.charts.clicksOverTime')}</h3>
                <select
                  className="time-filter-select"
                  value={timeFilter}
                  onChange={(e) => handleTimeFilterChange(e.target.value)}
                  style={{
                    padding: '6px 28px 6px 10px',
                    fontSize: '13px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                    color: '#374151',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="24h">{t('analytics.filters.last7Days')}</option>
                  <option value="7d">{t('analytics.filters.last7Days')}</option>
                  <option value="30d">{t('analytics.filters.last30Days')}</option>
                  <option value="90d">{t('analytics.filters.last90Days')}</option>
                  <option value="1y">{t('analytics.filters.dateRange')}</option>
                </select>
              </div>
              <div className="chart-container" style={{ width: '100%', height: '280px' }}>
                <svg
                  width="100%"
                  height="280"
                  viewBox="0 0 800 280"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ display: 'block' }}
                >
                  {/* Y-axis grid lines */}
                  <g stroke="#F3F4F6" strokeWidth="1">
                    <line x1="50" y1="30" x2="750" y2="30" />
                    <line x1="50" y1="80" x2="750" y2="80" />
                    <line x1="50" y1="130" x2="750" y2="130" />
                    <line x1="50" y1="180" x2="750" y2="180" />
                    <line x1="50" y1="230" x2="750" y2="230" />
                  </g>

                  {/* Dynamic chart lines based on analytics data */}
                  {(() => {
                    // Use API data or fallback to dummy data
                    const dummyData = [
                      { label: 'Mon', totalClicks: 130, uniqueClicks: 90 },
                      { label: 'Tue', totalClicks: 190, uniqueClicks: 150 },
                      { label: 'Wed', totalClicks: 240, uniqueClicks: 190 },
                      { label: 'Thu', totalClicks: 320, uniqueClicks: 230 },
                      { label: 'Fri', totalClicks: 280, uniqueClicks: 200 },
                      { label: 'Sat', totalClicks: 450, uniqueClicks: 320 },
                      { label: 'Sun', totalClicks: 380, uniqueClicks: 280 }
                    ];

                    const chartData = (analyticsData?.clickActivity && analyticsData.clickActivity.length > 0)
                      ? analyticsData.clickActivity
                      : dummyData;

                    const maxClicks = Math.max(...chartData.map(p => Math.max(p.totalClicks || 0, p.uniqueClicks || 0)), 1);
                    const spacing = 700 / Math.max(1, chartData.length - 1);

                    return (
                      <>
                        {/* Total Clicks Line */}
                        <polyline
                          points={chartData.map((point, index) => {
                            const x = 50 + (index * spacing);
                            const y = 230 - ((point.totalClicks || 0) / maxClicks) * 200;
                            return `${x},${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke="#3B82F6"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Unique Clicks Line */}
                        <polyline
                          points={chartData.map((point, index) => {
                            const x = 50 + (index * spacing);
                            const y = 230 - ((point.uniqueClicks || 0) / maxClicks) * 200;
                            return `${x},${y}`;
                          }).join(' ')}
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Data points - Total Clicks */}
                        {chartData.map((point, index) => {
                          const x = 50 + (index * spacing);
                          const y = 230 - ((point.totalClicks || 0) / maxClicks) * 200;
                          return <circle key={`total-${index}`} cx={x} cy={y} r="4" fill="#3B82F6" />;
                        })}

                        {/* Data points - Unique Clicks */}
                        {chartData.map((point, index) => {
                          const x = 50 + (index * spacing);
                          const y = 230 - ((point.uniqueClicks || 0) / maxClicks) * 200;
                          return <circle key={`unique-${index}`} cx={x} cy={y} r="4" fill="#10B981" />;
                        })}
                      </>
                    );
                  })()}

                  {/* X-axis labels */}
                  <g
                    fill="#9CA3AF"
                    fontSize="12"
                    textAnchor="middle"
                    fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif"
                  >
                    {(() => {
                      const dummyData = [
                        { label: 'Mon' }, { label: 'Tue' }, { label: 'Wed' },
                        { label: 'Thu' }, { label: 'Fri' }, { label: 'Sat' }, { label: 'Sun' }
                      ];
                      const chartData = (analyticsData?.clickActivity && analyticsData.clickActivity.length > 0)
                        ? analyticsData.clickActivity
                        : dummyData;

                      const spacing = 700 / Math.max(1, chartData.length - 1);

                      return chartData.map((point, index) => {
                        const x = 50 + (index * spacing);
                        const label = point.label || point.date || `Day ${index + 1}`;
                        return (
                          <text key={index} x={x} y="260">
                            {label}
                          </text>
                        );
                      });
                    })()}
                  </g>

                  {/* Y-axis labels */}
                  <g
                    fill="#9CA3AF"
                    fontSize="12"
                    textAnchor="end"
                    fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif"
                  >
                    {(() => {
                      const dummyData = [
                        { totalClicks: 130, uniqueClicks: 90 },
                        { totalClicks: 190, uniqueClicks: 150 },
                        { totalClicks: 240, uniqueClicks: 190 },
                        { totalClicks: 320, uniqueClicks: 230 },
                        { totalClicks: 280, uniqueClicks: 200 },
                        { totalClicks: 450, uniqueClicks: 320 },
                        { totalClicks: 380, uniqueClicks: 280 }
                      ];
                      const chartData = (analyticsData?.clickActivity && analyticsData.clickActivity.length > 0)
                        ? analyticsData.clickActivity
                        : dummyData;

                      const maxClicks = Math.max(...chartData.map(p => Math.max(p.totalClicks || 0, p.uniqueClicks || 0)), 1);
                      const step = Math.ceil(maxClicks / 5);
                      return [0, 1, 2, 3, 4, 5].map((i) => {
                        const value = i * step;
                        const y = 235 - (i * 40);
                        return (
                          <text key={i} x="40" y={y}>
                            {value}
                          </text>
                        );
                      });
                    })()}
                  </g>

                  {/* Legend */}
                  <g fontSize="12" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif">
                    {isRTL ? (
                      <>
                        {/* RTL Layout - Right to Left */}
                        <circle cx="690" cy="20" r="4" fill="#3B82F6"  />
                        <text x="682" y="24" fill="#6B7280" textAnchor="end">
                          {t('analytics.overview.totalClicks')}
                        </text>
                        <circle cx="540" cy="20" r="4" fill="#10B981" />
                        <text x="532" y="24" fill="#6B7280" textAnchor="end">
                          {t('analytics.overview.uniqueClicks')}
                        </text>
                      </>
                    ) : (
                      <>
                        {/* LTR Layout - Left to Right */}
                        <circle cx="300" cy="20" r="4" fill="#3B82F6" />
                        <text x="310" y="24" fill="#6B7280" textAnchor="start">
                          {t('analytics.overview.totalClicks')}
                        </text>
                        <circle cx="450" cy="20" r="4" fill="#10B981" />
                        <text x="460" y="24" fill="#6B7280" textAnchor="start">
                          {t('analytics.overview.uniqueClicks')}
                        </text>
                      </>
                    )}
                  </g>
                </svg>
              </div>
            </div>

            {/* Bottom Section - Country and Device Stats */}
            <div className="bottom-section" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px'
            }}>
              {/* Clicks by Country */}
              <div className="section-card" style={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h3 className="section-title" style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#1F2937',
                  marginBottom: '16px',
                  margin: '0 0 16px 0'
                }}>{t('analytics.charts.topCountries')}</h3>
                <div className="country-stats" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  {(() => {
                    // Dummy data for countries
                    const dummyCountries = [
                      { country: 'Saudi Arabia', clicks: 1247 },
                      { country: 'UAE', clicks: 421 },
                      { country: 'United States', clicks: 318 },
                      { country: 'United Kingdom', clicks: 142 },
                      { country: 'Germany', clicks: 98 }
                    ];

                    const countryData = (analyticsData?.clicksByCountry && analyticsData.clicksByCountry.length > 0)
                      ? analyticsData.clicksByCountry.slice(0, 5)
                      : dummyCountries;

                    const maxClicks = Math.max(...countryData.map(c => c.clicks || c.count || 0));
                    const countryFlags = {
                      'Saudi Arabia': '🇸🇦', 'SA': '🇸🇦',
                      'UAE': '🇦🇪', 'AE': '🇦🇪', 'United Arab Emirates': '🇦🇪',
                      'United States': '🇺🇸', 'US': '🇺🇸', 'USA': '🇺🇸',
                      'United Kingdom': '🇬🇧', 'UK': '🇬🇧', 'GB': '🇬🇧',
                      'Germany': '🇩🇪', 'DE': '🇩🇪',
                      'India': '🇮🇳', 'IN': '🇮🇳',
                      'Canada': '🇨🇦', 'CA': '🇨🇦',
                      'Australia': '🇦🇺', 'AU': '🇦🇺',
                      'France': '🇫🇷', 'FR': '🇫🇷',
                      'Japan': '🇯🇵', 'JP': '🇯🇵',
                      'China': '🇨🇳', 'CN': '🇨🇳',
                    };

                    return countryData.map((country, index) => {
                      const countryName = country.country || country.name || 'Unknown';
                      const clicks = country.clicks || country.count || 0;
                      const percentage = maxClicks > 0 ? (clicks / maxClicks) * 100 : 0;
                      const flag = countryFlags[countryName] || '🌍';

                      return (
                        <div key={index} className="country-item" style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px'
                        }}>
                          <div className="country-info" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            minWidth: '130px',
                            flex: '0 0 auto'
                          }}>
                            <span className="country-flag" style={{ fontSize: '16px' }}>{flag}</span>
                            <span className="country-name" style={{
                              fontSize: '13px',
                              color: '#374151',
                              fontWeight: '500'
                            }}>{countryName}</span>
                          </div>
                          <div className="country-data" style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: '10px',
                            // flex: 1
                          }}>
                            <div style={{
                              flex: 1,
                              height: '3px',
                              backgroundColor: '#E5E7EB',
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}>
                              <div
                                className="progress-fill"
                                style={{
                                  width: `${percentage}%`,
                                  height: '100%',
                                  backgroundColor: '#3B82F6',
                                  borderRadius: '4px',
                                  transition: 'width 0.3s ease'
                                }}
                              ></div>
                            </div>
                            <span className="country-value" style={{
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#1F2937',
                              minWidth: '40px',
                              textAlign: 'right'
                            }}>{clicks.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Clicks by Device Type */}
              <div className="section-card" style={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '20px'
              }}>
                <h3 className="section-title" style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#1F2937',
                  marginBottom: '16px',
                  margin: '0 0 16px 0'
                }}>{t('analytics.charts.devices')}</h3>
                {(() => {
                  // Dummy data for devices
                  const dummyDeviceData = {
                    mobile: 1687,
                    desktop: 892,
                    tablet: 268
                  };

                  const deviceData = (analyticsData?.clicksByDevice && Object.keys(analyticsData.clicksByDevice).length > 0)
                    ? analyticsData.clicksByDevice
                    : dummyDeviceData;

                  const mobileClicks = deviceData.mobile || deviceData.Mobile || 0;
                  const desktopClicks = deviceData.desktop || deviceData.Desktop || 0;
                  const tabletClicks = deviceData.tablet || deviceData.Tablet || 0;
                  const totalClicks = mobileClicks + desktopClicks + tabletClicks;

                  if (totalClicks === 0) {
                    return (
                      <div style={{
                        textAlign: 'center',
                        padding: '40px 20px',
                        color: '#9CA3AF',
                        fontSize: '14px'
                      }}>
                        {t('myLinks.noLinks')}
                      </div>
                    );
                  }

                    const mobilePercent = (mobileClicks / totalClicks) * 100;
                    const desktopPercent = (desktopClicks / totalClicks) * 100;
                    const tabletPercent = (tabletClicks / totalClicks) * 100;

                    // Calculate SVG paths for donut chart
                    const radius = 90;
                    const centerX = 128;
                    const centerY = 128;
                    const innerRadius = 55;

                    const createArc = (startAngle, endAngle) => {
                      const start = polarToCartesian(centerX, centerY, radius, endAngle);
                      const end = polarToCartesian(centerX, centerY, radius, startAngle);
                      const innerStart = polarToCartesian(centerX, centerY, innerRadius, endAngle);
                      const innerEnd = polarToCartesian(centerX, centerY, innerRadius, startAngle);
                      const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

                      return [
                        "M", start.x, start.y,
                        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
                        "L", innerEnd.x, innerEnd.y,
                        "A", innerRadius, innerRadius, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
                        "Z"
                      ].join(" ");
                    };

                    const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
                      const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
                      return {
                        x: centerX + (radius * Math.cos(angleInRadians)),
                        y: centerY + (radius * Math.sin(angleInRadians))
                      };
                    };

                    let currentAngle = 0;
                    const mobileAngle = (mobilePercent / 100) * 360;
                    const desktopAngle = (desktopPercent / 100) * 360;
                    const tabletAngle = (tabletPercent / 100) * 360;

                    return (
                      <>
                        <div className="device-chart" style={{
                          display: 'flex',
                          justifyContent: 'center',
                          marginBottom: '20px'
                        }}>
                          <svg width="256" height="256" viewBox="0 0 256 256">
                            <defs>
                              <linearGradient id="mobileGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#3b82f6" />
                                <stop offset="100%" stopColor="#2563eb" />
                              </linearGradient>
                              <linearGradient id="desktopGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#10b981" />
                                <stop offset="100%" stopColor="#059669" />
                              </linearGradient>
                              <linearGradient id="tabletGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#f59e0b" />
                                <stop offset="100%" stopColor="#d97706" />
                              </linearGradient>
                            </defs>

                            {/* Mobile segment */}
                            {mobileClicks > 0 && (
                              <path
                                d={createArc(currentAngle, currentAngle + mobileAngle)}
                                fill="url(#mobileGradient)"
                              />
                            )}

                            {/* Desktop segment */}
                            {desktopClicks > 0 && (
                              <path
                                d={createArc(currentAngle + mobileAngle, currentAngle + mobileAngle + desktopAngle)}
                                fill="url(#desktopGradient)"
                              />
                            )}

                            {/* Tablet segment */}
                            {tabletClicks > 0 && (
                              <path
                                d={createArc(currentAngle + mobileAngle + desktopAngle, 360)}
                                fill="url(#tabletGradient)"
                              />
                            )}
                          </svg>
                        </div>
                        <div className="device-stats" style={{
                          display: 'flex',
                          justifyContent: 'center',
                          gap: '20px',
                          flexWrap: 'wrap'
                        }}>
                          <div className="device-item" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <div className="device-indicator" style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: '#3B82F6'
                            }}></div>
                            <div className="device-info">
                              <p className="device-label" style={{
                                fontSize: '11px',
                                color: '#6B7280',
                                margin: '0 0 2px 0'
                              }}>{t('analytics.devices.mobile')}</p>
                              <h4 className="device-value" style={{
                                fontSize: '15px',
                                fontWeight: '600',
                                color: '#1F2937',
                                margin: 0
                              }}>{mobileClicks.toLocaleString()}</h4>
                            </div>
                          </div>
                          <div className="device-item" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <div className="device-indicator" style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: '#10B981'
                            }}></div>
                            <div className="device-info">
                              <p className="device-label" style={{
                                fontSize: '11px',
                                color: '#6B7280',
                                margin: '0 0 2px 0'
                              }}>{t('analytics.devices.desktop')}</p>
                              <h4 className="device-value" style={{
                                fontSize: '15px',
                                fontWeight: '600',
                                color: '#1F2937',
                                margin: 0
                              }}>{desktopClicks.toLocaleString()}</h4>
                            </div>
                          </div>
                          <div className="device-item" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <div className="device-indicator" style={{
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: '#F59E0B'
                            }}></div>
                            <div className="device-info">
                              <p className="device-label" style={{
                                fontSize: '11px',
                                color: '#6B7280',
                                margin: '0 0 2px 0'
                              }}>{t('analytics.devices.tablet')}</p>
                              <h4 className="device-value" style={{
                                fontSize: '15px',
                                fontWeight: '600',
                                color: '#1F2937',
                                margin: 0
                              }}>{tabletClicks.toLocaleString()}</h4>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
              </div>
            </div>
      </div>
    </div>
    </div>
    </div>
    </>
  );
};



export default Analytics;
