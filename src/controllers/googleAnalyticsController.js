/**
 * Google Analytics Controller
 * Handles API requests for Google Analytics data
 * All endpoints are restricted to super_admin only
 */

const googleAnalyticsService = require('../services/googleAnalyticsService');
const { isConfigured } = require('../config/googleAnalytics');

/**
 * Check if GA is configured
 */
const checkConfiguration = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        configured: isConfigured()
      }
    });
  } catch (error) {
    console.error('Error checking GA configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check Google Analytics configuration'
    });
  }
};

/**
 * Get real-time active users
 */
const getRealtime = async (req, res) => {
  try {
    if (!isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Google Analytics is not configured'
      });
    }

    const data = await googleAnalyticsService.getRealtimeData();
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching realtime data:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch realtime data'
    });
  }
};

/**
 * Get overview metrics
 */
const getOverview = async (req, res) => {
  try {
    if (!isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Google Analytics is not configured'
      });
    }

    const { startDate = '30daysAgo', endDate = 'today' } = req.query;
    const data = await googleAnalyticsService.getOverview(startDate, endDate);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching overview:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch overview data'
    });
  }
};

/**
 * Get traffic over time
 */
const getTrafficOverTime = async (req, res) => {
  try {
    if (!isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Google Analytics is not configured'
      });
    }

    const { startDate = '30daysAgo', endDate = 'today' } = req.query;
    const data = await googleAnalyticsService.getTrafficOverTime(startDate, endDate);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching traffic over time:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch traffic data'
    });
  }
};

/**
 * Get traffic sources
 */
const getTrafficSources = async (req, res) => {
  try {
    if (!isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Google Analytics is not configured'
      });
    }

    const { startDate = '30daysAgo', endDate = 'today' } = req.query;
    const data = await googleAnalyticsService.getTrafficSources(startDate, endDate);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching traffic sources:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch traffic sources'
    });
  }
};

/**
 * Get top pages
 */
const getTopPages = async (req, res) => {
  try {
    if (!isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Google Analytics is not configured'
      });
    }

    const { startDate = '30daysAgo', endDate = 'today', limit = 10 } = req.query;
    const data = await googleAnalyticsService.getTopPages(startDate, endDate, parseInt(limit, 10));
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching top pages:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch top pages'
    });
  }
};

/**
 * Get geographic data
 */
const getGeographic = async (req, res) => {
  try {
    if (!isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Google Analytics is not configured'
      });
    }

    const { startDate = '30daysAgo', endDate = 'today' } = req.query;
    const data = await googleAnalyticsService.getGeographicData(startDate, endDate);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching geographic data:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch geographic data'
    });
  }
};

/**
 * Get device breakdown
 */
const getDevices = async (req, res) => {
  try {
    if (!isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Google Analytics is not configured'
      });
    }

    const { startDate = '30daysAgo', endDate = 'today' } = req.query;
    const data = await googleAnalyticsService.getDeviceData(startDate, endDate);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching device data:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch device data'
    });
  }
};

/**
 * Get browser data
 */
const getBrowsers = async (req, res) => {
  try {
    if (!isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Google Analytics is not configured'
      });
    }

    const { startDate = '30daysAgo', endDate = 'today' } = req.query;
    const data = await googleAnalyticsService.getBrowserData(startDate, endDate);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching browser data:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch browser data'
    });
  }
};

/**
 * Get full dashboard data
 */
const getDashboard = async (req, res) => {
  try {
    if (!isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Google Analytics is not configured'
      });
    }

    const { startDate = '30daysAgo', endDate = 'today' } = req.query;
    const data = await googleAnalyticsService.getDashboardData(startDate, endDate);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch dashboard data'
    });
  }
};

module.exports = {
  checkConfiguration,
  getRealtime,
  getOverview,
  getTrafficOverTime,
  getTrafficSources,
  getTopPages,
  getGeographic,
  getDevices,
  getBrowsers,
  getDashboard
};
