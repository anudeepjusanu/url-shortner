import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "../contexts/LanguageContext";
import Sidebar from "./Sidebar";
import MainHeader from "./MainHeader";
import { analyticsAPI, urlsAPI } from "../services/api";
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
  const [copySuccess, setCopySuccess] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState({ title: '', customCode: '' });

  useEffect(() => {
    if (id) {
      fetchAnalyticsData();
    } else {
      fetchDashboardAnalytics();
    }
  }, [id, timeFilter]);

  // Update the fetchAnalyticsData function to properly extract recentClicks
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
      
      // Extract recent clicks
      const recentClicks = backendData.recentClicks || backendData.clicks || [];
      
      // Extract totals with multiple fallback options
      const overviewTotals = {
        totalClicks: backendData.overview?.totalClicks || backendData.summary?.totalClicks || backendData.stats?.totalClicks || backendData.totalClicks || 0,
        uniqueClicks: backendData.overview?.uniqueClicks || backendData.summary?.uniqueClicks || backendData.stats?.uniqueClicks || backendData.uniqueClicks || 0,
        clickThroughRate: backendData.overview?.clickThroughRate || '0%',
        averageTime: backendData.overview?.averageClicksPerDay ? `${backendData.overview.averageClicksPerDay}/day` : '0/day'
      };

      // Extract time series data with multiple fallback options
      let timeSeries = backendData.timeSeries || backendData.clickActivity || backendData.activity || [];

      // Transform time series data
      let clickActivity = timeSeries.map(item => {
        const dateStr = item.date || item._id;
        return {
          label: formatDateLabel(dateStr),
          date: dateStr,
          totalClicks: item.clicks || item.totalClicks || 0,
          uniqueClicks: item.uniqueClicks || item.unique || 0
        };
      }).sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
      });

      // Calculate totals from time series data
      const chartTotalClicks = clickActivity.reduce((sum, item) => sum + (item.totalClicks || 0), 0);
      const chartUniqueClicks = clickActivity.reduce((sum, item) => sum + (item.uniqueClicks || 0), 0);

      console.log('Data Validation:', {
        overviewTotals,
        chartCalculated: { total: chartTotalClicks, unique: chartUniqueClicks },
        timeSeriesLength: clickActivity.length,
        recentClicksLength: recentClicks.length,
        mismatch: {
          total: overviewTotals.totalClicks !== chartTotalClicks,
          unique: overviewTotals.uniqueClicks !== chartUniqueClicks
        }
      });

      // Only create synthetic data if there's NO time series data at all
      // DO NOT create synthetic data based on totals mismatch - this causes Bug #3
      // where clicks from past dates show up as today's date
      if (clickActivity.length === 0 && overviewTotals.totalClicks > 0) {
        console.log('No time series data available, but clicks exist. Using historical placeholder.');

        // Create a single data point showing that clicks exist, but we don't have daily breakdown
        // Use a date from 7 days ago to indicate these are historical clicks
        const date = new Date();
        date.setDate(date.getDate() - 7);

        clickActivity = [{
          label: 'Historical',
          date: date.toISOString().split('T')[0],
          totalClicks: overviewTotals.totalClicks,
          uniqueClicks: overviewTotals.uniqueClicks
        }];
      }

      // Aggregate countries from recentClicks
      const countryMap = {};
      recentClicks.forEach(click => {
        const country = click.countryName || click.country || 'Unknown';
        if (!countryMap[country]) {
          countryMap[country] = { country, name: country, clicks: 0 };
        }
        countryMap[country].clicks++;
      });
      const clicksByCountry = Object.values(countryMap)
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);

      // Aggregate devices from recentClicks
      const deviceMap = {};
      recentClicks.forEach(click => {
        const deviceType = (click.deviceType || click.device || 'unknown').toLowerCase();
        deviceMap[deviceType] = (deviceMap[deviceType] || 0) + 1;
      });

      const transformedData = {
        totalClicks: overviewTotals.totalClicks,
        uniqueClicks: overviewTotals.uniqueClicks,
        clickThroughRate: overviewTotals.clickThroughRate,
        averageTime: overviewTotals.averageTime,
        clickActivity: clickActivity,
        clicksByCountry: clicksByCountry,
        clicksByDevice: deviceMap,
        recentClicks: recentClicks, // Store recentClicks for other sections
       
       
       
       
        url: backendData.url || null
      };

      console.log('Transformed Analytics Data:', transformedData);
      console.log('Recent Clicks:', recentClicks.length);

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

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    try {
      // Handle hour format (YYYY-MM-DD-HH)
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}-\d{2}$/)) {
        const [year, month, day, hour] = dateStr.split('-');
        return `${hour}:00`;
      }
      // Handle day format (YYYY-MM-DD)
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const fetchDashboardAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all links to calculate total clicks (same as MyLinks page)
      const linksResponse = await urlsAPI.list({ page: 1, limit: 100 });
      const linksData = linksResponse.data?.urls || linksResponse.data?.data?.urls || [];
      const allTimeClicks = linksData.reduce((sum, link) => sum + (link.clickCount || 0), 0);

      // Fetch dashboard overview analytics
      const response = await analyticsAPI.getOverview({
        period: timeFilter
      });

      // Transform backend data to match frontend expectations
      const backendData = response.data;
      
      // Transform devices array to object format for compatibility
      const deviceMap = {};
      if (backendData.topStats?.devices && Array.isArray(backendData.topStats.devices)) {
        backendData.topStats.devices.forEach(device => {
          const deviceType = (device.type || 'unknown').toLowerCase();
          deviceMap[deviceType] = device.clicks || 0;
        });
      }

      const transformedData = {
        ...backendData,
        totalClicks: allTimeClicks,
        uniqueClicks: backendData.overview?.totalUniqueClicks || 0,
        totalUrls: linksData.length || backendData.overview?.totalUrls || 0,
        clickActivity: backendData.chartData?.clicksByDay?.map(item => ({
          date: item.date,
          label: formatDateLabel(item.date),
          totalClicks: item.clicks || 0,
          uniqueClicks: 0 // Dashboard doesn't track unique clicks per day yet
        })) || [],
        clicksByCountry: backendData.topStats?.countries || [],
        clicksByDevice: deviceMap,
        topStats: {
          browsers: backendData.topStats?.browsers || [],
          operatingSystems: backendData.topStats?.operatingSystems || [],
          cities: backendData.topStats?.cities || [],
          referrers: backendData.topStats?.referrers || []
        }
      };

      console.log('Dashboard Analytics Transformed Data:', transformedData);
      setAnalyticsData(transformedData);
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
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert(t('common.copyFailed') || 'Failed to copy link');
    }
  };

  const handleShare = async () => {
    if (!linkData) return;

    const shareUrl = linkData.domain && linkData.domain !== 'laghhu.link'
      ? `https://${linkData.domain}/${linkData.shortCode}`
      : `https://laghhu.link/${linkData.shortCode}`;

    // Check if Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: linkData.title || 'Shortened Link',
          text: `Check out this link: ${shareUrl}`,
          url: shareUrl
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      // Fallback: copy to clipboard
      copyToClipboard(shareUrl);
    }
  };

  const handleEditClick = () => {
    if (!linkData) return;

    setEditFormData({
      title: linkData.title || '',
      customCode: linkData.shortCode || ''
    });
    setShowEditDialog(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      // Use the proper API client with authentication
      const response = await urlsAPI.update(id, {
        title: editFormData.title,
        customCode: editFormData.customCode
      });

      if (response && response.success) {
        // Refresh link data with updated information
        // Extract the url object from response.data.url (backend wraps it)
        setLinkData(response.data.url);
        setShowEditDialog(false);

        // Refresh analytics data to show updated title
        if (id) {
          fetchAnalyticsData();
        }

        // Show success message instead of alert
        console.log('Link updated successfully:', response.data.url);
      } else {
        const errorMessage = response?.message || t('errors.generic') || 'Failed to update link';
        alert(errorMessage);
      }
    } catch (err) {
      console.error('Error updating link:', err);
      const errorMessage = err.message || t('errors.generic') || 'Failed to update link. Please check your connection and try again.';
      alert(errorMessage);
    }
  };

  const handleCancelEdit = () => {
    setShowEditDialog(false);
    setEditFormData({ title: '', customCode: '' });
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

            {/* Link Info Card - Only show for individual URL analytics */}
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
                    className=" copy-btn"
                    onClick={() => copyToClipboard(
                      linkData.domain && linkData.domain !== 'laghhu.link'
                        ? `https://${linkData.domain}/${linkData.shortCode}`
                        : `https://laghhu.link/${linkData.shortCode}`
                    )}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: copySuccess ? '#D1FAE5' : '#F3F4F6',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      color: copySuccess ? '#10B981' : '#6B7280',
                      transition: 'all 0.2s',
                      fontSize: '13px',
                      fontWeight: '500',
                      flexDirection: isRTL ? 'row-reverse' : 'row'
                    }}
                    title={copySuccess ? 'Copied!' : 'Copy link'}
                  >
                    {copySuccess ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M13.5 4.5L6 12L2.5 8.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
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
                    )}
                    <span>{t('common.copy') || 'Copy'}</span>
                  </button>
                  <button
                    className=" share-btn"
                    onClick={handleShare}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#F3F4F6',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      color: '#6B7280',
                      transition: 'all 0.2s',
                      fontSize: '13px',
                      fontWeight: '500',
                      flexDirection: isRTL ? 'row-reverse' : 'row'
                    }}
                    title="Share link"
                  >
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
                    <span>{t('common.share') || 'Share'}</span>
                  </button>
                  <button
                    className="edit-btn"
                    onClick={handleEditClick}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#F3F4F6',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      color: '#6B7280',
                      transition: 'all 0.2s ease',
                      fontSize: '13px',
                      fontWeight: '500',
                      flexDirection: isRTL ? 'row-reverse' : 'row'
                    }}
                    title="Edit link"
                  >
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
                    <span>{t('common.edit') || 'Edit'}</span>
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
                  <option value="24h">{t('analytics.filters.last24Hours') || 'Last 24 Hours'}</option>
                  <option value="7d">{t('analytics.filters.last7Days')}</option>
                  <option value="30d">{t('analytics.filters.last30Days')}</option>
                  <option value="90d">{t('analytics.filters.last90Days')}</option>
                  <option value="1y">{t('analytics.filters.last1Year') || 'Last 1 Year'}</option>
                </select>
              </div>
              {(analyticsData?.clickActivity && analyticsData.clickActivity.length > 0) ? (
              <div className="chart-container" style={{ width: '100%', height: '320px' }}>
                <svg
                  width="100%"
                  height="320"
                  viewBox="0 0 800 320"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ display: 'block' }}
                >
                  {/* Axes */}
                  <g stroke="#E5E7EB" strokeWidth="1.5">
                    {/* Y-axis */}
                    <line x1="60" y1="40" x2="60" y2="250" />
                    {/* X-axis */}
                    <line x1="60" y1="250" x2="760" y2="250" />
                  </g>

                  {/* Y-axis grid lines */}
                  <g stroke="#F3F4F6" strokeWidth="1">
                    <line x1="60" y1="40" x2="760" y2="40" />
                    <line x1="60" y1="82" x2="760" y2="82" />
                    <line x1="60" y1="124" x2="760" y2="124" />
                    <line x1="60" y1="166" x2="760" y2="166" />
                    <line x1="60" y1="208" x2="760" y2="208" />
                    <line x1="60" y1="250" x2="760" y2="250" />
                  </g>

                  {/* Dynamic chart lines based on analytics data */}
                  {(() => {
                    const chartData = (analyticsData?.clickActivity && analyticsData.clickActivity.length > 0)
                      ? analyticsData.clickActivity
                      : [];

                    if (chartData.length === 0) return null;

                    console.log('Chart Rendering - Data Points:', chartData);

                    // Find the maximum value in the chart data
                    const maxClicks = Math.max(
                      ...chartData.map(p => Math.max(p.totalClicks || 0, p.uniqueClicks || 0)),
                      1 // Minimum value of 1
                    );
                    
                    console.log('Y-axis calculation - maxClicks:', maxClicks);

                    // Calculate appropriate Y-axis maximum and step size
                    let yAxisMax;
                    
                    if (maxClicks <= 5) {
                      yAxisMax = 10; // Give some headroom
                    } else if (maxClicks <= 10) {
                      yAxisMax = 10;
                    } else if (maxClicks <= 20) {
                      yAxisMax = 20;
                    } else if (maxClicks <= 50) {
                      yAxisMax = 50;
                    } else if (maxClicks <= 100) {
                      yAxisMax = 100;
                    } else {
                      // For larger values, round up to next nice number
                      yAxisMax = Math.ceil(maxClicks / 50) * 50;
                    }

                    console.log('Y-axis scale:', { maxClicks, yAxisMax });

                    const chartWidth = 700; // 760 - 60 (margin)
                    const chartHeight = 210; // 250 - 40 (margin)
                    const spacing = chartData.length > 1 ? chartWidth / (chartData.length - 1) : 0;

                    console.log('Chart Scale:', {
                      maxClicks,
                      yAxisMax,
                      chartWidth,
                      chartHeight,
                      spacing,
                      dataPoints: chartData.length,
                      totalClicksSum: chartData.reduce((sum, p) => sum + (p.totalClicks || 0), 0),
                      uniqueClicksSum: chartData.reduce((sum, p) => sum + (p.uniqueClicks || 0), 0)
                    });

                    return (
                      <>
                        {/* Total Clicks Line */}
                        <polyline
                          points={chartData.map((point, index) => {
                            const x = 60 + (index * spacing);
                            const y = 250 - ((point.totalClicks || 0) / yAxisMax) * chartHeight;
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
                            const x = 60 + (index * spacing);
                            const y = 250 - ((point.uniqueClicks || 0) / yAxisMax) * chartHeight;
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
                          const x = 60 + (index * spacing);
                          const y = 250 - ((point.totalClicks || 0) / yAxisMax) * chartHeight;
                          return <circle key={`total-${index}`} cx={x} cy={y} r="4" fill="#3B82F6" />;
                        })}

                        {/* Data points - Unique Clicks */}
                        {chartData.map((point, index) => {
                          const x = 60 + (index * spacing);
                          const y = 250 - ((point.uniqueClicks || 0) / yAxisMax) * chartHeight;
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
                      // Use only real API data, no dummy data
                      const chartData = (analyticsData?.clickActivity && analyticsData.clickActivity.length > 0)
                        ? analyticsData.clickActivity
                        : [];

                      const chartWidth = 700;
                      const spacing = chartData.length > 1 ? chartWidth / (chartData.length - 1) : chartWidth;

                      return chartData.map((point, index) => {
                        const x = 60 + (index * spacing);
                        const label = point.label || point.date || `Day ${index + 1}`;
                        return (
                          <text key={index} x={x} y="270">
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
                      // Use only real API data, no dummy data
                      const chartData = (analyticsData?.clickActivity && analyticsData.clickActivity.length > 0)
                        ? analyticsData.clickActivity
                        : [];

                      const maxClicks = Math.max(...chartData.map(p => Math.max(p.totalClicks || 0, p.uniqueClicks || 0)), 1);
                      const chartHeight = 210; // 250 - 40

                      // Use the SAME Y-axis calculation as chart rendering for consistency
                      let yAxisMax;
                      
                      if (maxClicks <= 5) {
                        yAxisMax = 10; // Give some headroom
                      } else if (maxClicks <= 10) {
                        yAxisMax = 10;
                      } else if (maxClicks <= 20) {
                        yAxisMax = 20;
                      } else if (maxClicks <= 50) {
                        yAxisMax = 50;
                      } else if (maxClicks <= 100) {
                        yAxisMax = 100;
                      } else {
                        // For larger values, round up to next nice number
                        yAxisMax = Math.ceil(maxClicks / 50) * 50;
                      }

                      console.log('Y-axis Labels:', { maxClicks, yAxisMax });

                      const step = yAxisMax / 5;

                      return [0, 1, 2, 3, 4, 5].map((i) => {
                        const value = Math.round(i * step);
                        const y = 250 - (i * (chartHeight / 5));
                        console.log(`Y-label ${i}: value=${value}, y=${y}`);
                        return (
                          <text key={i} x="55" y={y + 4}>
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
                        <circle cx="720" cy="300" r="4" fill="#3B82F6"  />
                        <text x="712" y="304" fill="#6B7280" textAnchor="end">
                          {t('analytics.overview.totalClicks')}
                        </text>
                        <circle cx="570" cy="300" r="4" fill="#10B981" />
                        <text x="562" y="304" fill="#6B7280" textAnchor="end">
                          {t('analytics.overview.uniqueClicks')}
                        </text>
                      </>
                    ) : (
                      <>
                        {/* LTR Layout - Left to Right */}
                        <circle cx="300" cy="300" r="4" fill="#3B82F6" />
                        <text x="310" y="304" fill="#6B7280" textAnchor="start">
                          {t('analytics.overview.totalClicks')}
                        </text>
                        <circle cx="450" cy="300" r="4" fill="#10B981" />
                        <text x="460" y="304" fill="#6B7280" textAnchor="start">
                          {t('analytics.overview.uniqueClicks')}
                        </text>
                      </>
                    )}
                  </g>
                </svg>
              </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '320px',
                  textAlign: 'center',
                  color: '#9CA3AF'
                }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ marginBottom: '16px' }}>
                    <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7 12l4-4 4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p style={{ fontSize: '15px', fontWeight: '500', color: '#6B7280', margin: '0 0 8px 0' }}>
                    {t('analytics.noData.title') || 'No Click Activity Data Available'}
                  </p>
                  <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0, maxWidth: '400px' }}>
                    {t('analytics.noData.chartDescription') || 'Start sharing your links to see click trends and activity over time.'}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Section - Country and Device Stats */}
            <div className="bottom-section" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px',
              marginBottom: '16px'
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
                    // Get country data from API or aggregate from recentClicks
                    let countryData = [];

                    if (analyticsData?.clicksByCountry && analyticsData.clicksByCountry.length > 0) {
                      countryData = analyticsData.clicksByCountry.slice(0, 5);
                    } else if (analyticsData?.recentClicks && analyticsData.recentClicks.length > 0) {
                      // Aggregate from recent clicks
                      const countryCounts = {};
                      analyticsData.recentClicks.forEach(click => {
                        const country = click.country || 'Unknown';
                        countryCounts[country] = (countryCounts[country] || 0) + 1;
                      });
                      countryData = Object.entries(countryCounts)
                        .map(([country, clicks]) => ({ country, clicks }))
                        .sort((a, b) => b.clicks - a.clicks)
                        .slice(0, 5);
                    }

                    // No dummy data - show "no data" message if empty
                    if (countryData.length === 0) {
                      return (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '40px 20px',
                          textAlign: 'center',
                          color: '#9CA3AF'
                        }}>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ marginBottom: '12px' }}>
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          <p style={{ fontSize: '14px', fontWeight: '500', color: '#6B7280', margin: '0 0 6px 0' }}>
                            {t('analytics.noData.countries') || 'No Geographic Data'}
                          </p>
                          <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                            {t('analytics.noData.countriesDescription') || 'Country data will appear once your links are clicked.'}
                          </p>
                        </div>
                      );
                    }

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
                  // Get device data from API or aggregate from recentClicks
                  let deviceData = {};
                  
                  if (analyticsData?.clicksByDevice && Object.keys(analyticsData.clicksByDevice).length > 0) {
                    deviceData = analyticsData.clicksByDevice;
                  } else if (analyticsData?.recentClicks && analyticsData.recentClicks.length > 0) {
                    // Aggregate from recent clicks
                    analyticsData.recentClicks.forEach(click => {
                      const device = (click.device || 'unknown').toLowerCase();
                      deviceData[device] = (deviceData[device] || 0) + 1;
                    });
                  }

                  let mobileClicks = deviceData.mobile || deviceData.Mobile || 0;
                  let desktopClicks = deviceData.desktop || deviceData.Desktop || 0;
                  let tabletClicks = deviceData.tablet || deviceData.Tablet || 0;
                  let totalClicks = mobileClicks + desktopClicks + tabletClicks;

                  // No dummy data - show "no data" message if empty
                  if (totalClicks === 0) {
                    return (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '40px 20px',
                        textAlign: 'center',
                        color: '#9CA3AF'
                      }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ marginBottom: '12px' }}>
                          <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <path d="M12 18h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        <p style={{ fontSize: '14px', fontWeight: '500', color: '#6B7280', margin: '0 0 6px 0' }}>
                          {t('analytics.noData.devices') || 'No Device Data'}
                        </p>
                        <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                          {t('analytics.noData.devicesDescription') || 'Device breakdown will show after clicks are recorded.'}
                        </p>
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

            {/* Additional Analytics Sections - Browsers, OS, Cities, Referrers */}
            <div className="additional-stats-section" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px',
              marginBottom: '20px'
            }}>
              {/* Browsers */}
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
                }}>
                  {t('analytics.charts.browsers') || 'Top Browsers'}
                </h3>
                <div className="browser-stats" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  {(() => {
                    // Get browser data from recentClicks if topStats is empty
                    let browserData = [];
                    
                    if (analyticsData?.topStats?.browsers && analyticsData.topStats.browsers.length > 0) {
                      browserData = analyticsData.topStats.browsers.slice(0, 5);
                    } else if (analyticsData?.recentClicks && analyticsData.recentClicks.length > 0) {
                      // Aggregate from recent clicks
                      const browserCounts = {};
                      analyticsData.recentClicks.forEach(click => {
                        const browser = click.browser || 'Unknown';
                        browserCounts[browser] = (browserCounts[browser] || 0) + 1;
                      });
                      browserData = Object.entries(browserCounts)
                        .map(([browser, count]) => ({ browser, count }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 5);
                    }

                    // No dummy data - show "no data" message if empty
                    if (browserData.length === 0) {
                      return (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '40px 20px',
                          textAlign: 'center',
                          color: '#9CA3AF'
                        }}>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ marginBottom: '12px' }}>
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                            <circle cx="12" cy="12" r="3" fill="currentColor"/>
                            <path d="M12 2v4M12 18v4M22 12h-4M6 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                          <p style={{ fontSize: '14px', fontWeight: '500', color: '#6B7280', margin: '0 0 6px 0' }}>
                            {t('analytics.noData.browsers') || 'No Browser Data'}
                          </p>
                          <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                            {t('analytics.noData.browsersDescription') || 'Browser statistics will appear after your links are clicked.'}
                          </p>
                        </div>
                      );
                    }

                    const maxCount = Math.max(...browserData.map(b => b.count || b.clicks || 0));
                    const browserIcons = {
                      'Chrome': '🌐',
                      'Safari': '🧭',
                      'Firefox': '🦊',
                      'Edge': '🌊',
                      'Opera': '🎭'
                    };

                    return browserData.map((browser, index) => {
                      const browserName = browser.browser || browser._id || 'Unknown';
                      const count = browser.count || browser.clicks || 0;
                      const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                      const icon = browserIcons[browserName] || '🌐';

                      return (
                        <div key={index} className="browser-item" style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px'
                        }}>
                          <div className="browser-info" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            minWidth: '100px',
                            flex: '0 0 auto'
                          }}>
                            <span style={{ fontSize: '16px' }}>{icon}</span>
                            <span style={{
                              fontSize: '13px',
                              color: '#374151',
                              fontWeight: '500'
                            }}>{browserName}</span>
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            flex: 1
                          }}>
                            <div style={{
                              flex: 1,
                              height: '6px',
                              backgroundColor: '#E5E7EB',
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${percentage}%`,
                                height: '100%',
                                backgroundColor: '#8B5CF6',
                                borderRadius: '4px',
                                transition: 'width 0.3s ease'
                              }}></div>
                            </div>
                            <span style={{
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#1F2937',
                              minWidth: '30px',
                              textAlign: 'right'
                            }}>{count}</span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Operating Systems */}
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
                }}>
                  {t('analytics.charts.operatingSystems') || 'Operating Systems'}
                </h3>
                <div className="os-stats" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  {(() => {
                    // Get OS data from recentClicks if topStats is empty
                    let osData = [];
                    
                    if (analyticsData?.topStats?.operatingSystems && analyticsData.topStats.operatingSystems.length > 0) {
                      osData = analyticsData.topStats.operatingSystems.slice(0, 5);
                    } else if (analyticsData?.recentClicks && analyticsData.recentClicks.length > 0) {
                      // Aggregate from recent clicks
                      const osCounts = {};
                      analyticsData.recentClicks.forEach(click => {
                        const os = click.os || 'Unknown';
                        osCounts[os] = (osCounts[os] || 0) + 1;
                      });
                      osData = Object.entries(osCounts)
                        .map(([os, count]) => ({ os, count }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 5);
                    }

                    // No dummy data - show "no data" message if empty
                    if (osData.length === 0) {
                      return (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '40px 20px',
                          textAlign: 'center',
                          color: '#9CA3AF'
                        }}>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ marginBottom: '12px' }}>
                            <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                            <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                          <p style={{ fontSize: '14px', fontWeight: '500', color: '#6B7280', margin: '0 0 6px 0' }}>
                            {t('analytics.noData.os') || 'No Operating System Data'}
                          </p>
                          <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                            {t('analytics.noData.osDescription') || 'OS distribution will be visible after clicks are tracked.'}
                          </p>
                        </div>
                      );
                    }

                    const maxCount = Math.max(...osData.map(o => o.count || o.clicks || 0));
                    const osIcons = {
                      'Windows': '🪟',
                      'Mac OS X': '🍎',
                      'macOS': '🍎',
                      'iOS': '📱',
                      'Android': '🤖',
                      'Linux': '🐧'
                    };

                    return osData.map((os, index) => {
                      const osName = os.os || os._id || 'Unknown';
                      const count = os.count || os.clicks || 0;
                      const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                      const icon = osIcons[osName] || '💻';

                      return (
                        <div key={index} className="os-item" style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px'
                        }}>
                          <div className="os-info" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            minWidth: '100px',
                            flex: '0 0 auto'
                          }}>
                            <span style={{ fontSize: '16px' }}>{icon}</span>
                            <span style={{
                              fontSize: '13px',
                              color: '#374151',
                              fontWeight: '500'
                            }}>{osName}</span>
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            flex: 1
                          }}>
                            <div style={{
                              flex: 1,
                              height: '6px',
                              backgroundColor: '#E5E7EB',
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${percentage}%`,
                                height: '100%',
                                backgroundColor: '#10B981',
                                borderRadius: '4px',
                                transition: 'width 0.3s ease'
                              }}></div>
                            </div>
                            <span style={{
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#1F2937',
                              minWidth: '30px',
                              textAlign: 'right'
                            }}>{count}</span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Cities */}
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
                }}>
                  {t('analytics.charts.topCities') || 'Top Cities'}
                </h3>
                <div className="city-stats" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  {(() => {
                    // Get city data from recentClicks if topStats is empty
                    let cityData = [];
                    
                    if (analyticsData?.topStats?.cities && analyticsData.topStats.cities.length > 0) {
                      cityData = analyticsData.topStats.cities.slice(0, 5);
                    } else if (analyticsData?.recentClicks && analyticsData.recentClicks.length > 0) {
                      // Aggregate from recent clicks
                      const cityCounts = {};
                      analyticsData.recentClicks.forEach(click => {
                        if (click.city) {
                          const key = `${click.city}, ${click.country || ''}`;
                          cityCounts[key] = (cityCounts[key] || 0) + 1;
                        }
                      });
                      cityData = Object.entries(cityCounts)
                        .map(([city, count]) => ({ city, count }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 5);
                    }

                    // No dummy data - show "no data" message if empty
                    if (cityData.length === 0) {
                      return (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '40px 20px',
                          textAlign: 'center',
                          color: '#9CA3AF'
                        }}>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ marginBottom: '12px' }}>
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <p style={{ fontSize: '14px', fontWeight: '500', color: '#6B7280', margin: '0 0 6px 0' }}>
                            {t('analytics.noData.cities') || 'No City Data'}
                          </p>
                          <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                            {t('analytics.noData.citiesDescription') || 'City-level analytics will be available once clicks are recorded.'}
                          </p>
                        </div>
                      );
                    }

                    const maxCount = Math.max(...cityData.map(c => c.count || c.clicks || 0));

                    return cityData.map((city, index) => {
                      const cityName = city.city || city._id?.city || 'Unknown';
                      const count = city.count || city.clicks || 0;
                      const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

                      return (
                        <div key={index} className="city-item" style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px'
                        }}>
                          <div className="city-info" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            minWidth: '120px',
                            flex: '0 0 auto'
                          }}>
                            <span style={{ fontSize: '16px' }}>🏙️</span>
                            <span style={{
                              fontSize: '13px',
                              color: '#374151',
                              fontWeight: '500'
                            }}>{cityName}</span>
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            flex: 1
                          }}>
                            <div style={{
                              flex: 1,
                              height: '6px',
                              backgroundColor: '#E5E7EB',
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${percentage}%`,
                                height: '100%',
                                backgroundColor: '#F59E0B',
                                borderRadius: '4px',
                                transition: 'width 0.3s ease'
                              }}></div>
                            </div>
                            <span style={{
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#1F2937',
                              minWidth: '30px',
                              textAlign: 'right'
                            }}>{count}</span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Referrers */}
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
                }}>
                  {t('analytics.charts.topReferrers') || 'Top Referrers'}
                </h3>
                <div className="referrer-stats" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  {(() => {
                    // Get referrer data from recentClicks if topStats is empty
                    let referrerData = [];
                    
                    if (analyticsData?.topStats?.referrers && analyticsData.topStats.referrers.length > 0) {
                      referrerData = analyticsData.topStats.referrers.slice(0, 5);
                    } else if (analyticsData?.recentClicks && analyticsData.recentClicks.length > 0) {
                      // Aggregate from recent clicks
                      const referrerCounts = {};
                      analyticsData.recentClicks.forEach(click => {
                        const referrer = click.referer || 'Direct';
                        if (referrer && referrer !== '') {
                          try {
                            const url = new URL(referrer);
                            const domain = url.hostname.replace('www.', '');
                            referrerCounts[domain] = (referrerCounts[domain] || 0) + 1;
                          } catch {
                            referrerCounts['Direct'] = (referrerCounts['Direct'] || 0) + 1;
                          }
                        } else {
                          referrerCounts['Direct'] = (referrerCounts['Direct'] || 0) + 1;
                        }
                      });
                      referrerData = Object.entries(referrerCounts)
                        .map(([domain, count]) => ({ domain, count }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 5);
                    }

                    // No dummy data - show "no data" message if empty
                    if (referrerData.length === 0) {
                      return (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '40px 20px',
                          textAlign: 'center',
                          color: '#9CA3AF'
                        }}>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ marginBottom: '12px' }}>
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <p style={{ fontSize: '14px', fontWeight: '500', color: '#6B7280', margin: '0 0 6px 0' }}>
                            {t('analytics.noData.referrers') || 'No Referrer Data'}
                          </p>
                          <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                            {t('analytics.noData.referrersDescription') || 'Traffic sources will be tracked when visitors click your links.'}
                          </p>
                        </div>
                      );
                    }

                    const maxCount = Math.max(...referrerData.map(r => r.count || r.clicks || 0));

                    return referrerData.map((referrer, index) => {
                      const domain = referrer.domain || referrer._id || 'Direct';
                      const count = referrer.count || referrer.clicks || 0;
                      const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

                      return (
                        <div key={index} className="referrer-item" style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px'
                        }}>
                          <div className="referrer-info" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            minWidth: '120px',
                            flex: '0 0 auto'
                          }}>
                            <span style={{ fontSize: '16px' }}>🔗</span>
                            <span style={{
                              fontSize: '13px',
                              color: '#374151',
                              fontWeight: '500',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>{domain}</span>
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            flex: 1
                          }}>
                            <div style={{
                              flex: 1,
                              height: '6px',
                              backgroundColor: '#E5E7EB',
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${percentage}%`,
                                height: '100%',
                                backgroundColor: '#EF4444',
                                borderRadius: '4px',
                                transition: 'width 0.3s ease'
                              }}></div>
                            </div>
                            <span style={{
                              fontSize: '13px',
                              fontWeight: '600',
                              color: '#1F2937',
                              minWidth: '30px',
                              textAlign: 'right'
                            }}>{count}</span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            {/* Edit Link Dialog */}
            {showEditDialog && linkData && (
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
                onClick={handleCancelEdit}
              >
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    padding: '32px',
                    maxWidth: '500px',
                    width: '90%',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#111827',
                    marginBottom: '20px',
                    margin: '0 0 20px 0'
                  }}>
                    {t('myLinks.editLink') || 'Edit Link'}
                  </h2>

                  <form onSubmit={handleEditSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        {t('myLinks.table.title') || 'Title'}
                      </label>
                      <input
                        type="text"
                        value={editFormData.title}
                        onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                        placeholder={t('myLinks.table.title') || 'Enter link title'}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '8px',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        {t('createLink.customCode') || 'Custom Short Code'}
                      </label>
                      <input
                        type="text"
                        value={editFormData.customCode}
                        onChange={(e) => setEditFormData({ ...editFormData, customCode: e.target.value })}
                        placeholder={t('createLink.customCodePlaceholder') || 'Enter custom code'}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #D1D5DB',
                          borderRadius: '8px',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      justifyContent: 'flex-end'
                    }}>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        style={{
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
                        type="submit"
                        style={{
                          padding: '10px 20px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          border: 'none',
                          backgroundColor: '#3B82F6',
                          color: '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#2563EB'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#3B82F6'}
                      >
                        {t('common.save') || 'Save Changes'}
                      </button>
                    </div>
                  </form>
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



export default Analytics;
