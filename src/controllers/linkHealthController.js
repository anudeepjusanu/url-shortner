const LinkHealth = require('../models/LinkHealth');
const Url = require('../models/Url');
const { checkUrlHealth } = require('../services/linkHealthService');

// Enable health monitoring for a URL
const enableHealthMonitoring = async (req, res) => {
  try {
    const { urlId } = req.params;
    const { checkInterval, notifyOnFailure, failureThreshold } = req.body;

    // Verify URL belongs to user
    const url = await Url.findOne({
      _id: urlId,
      creator: req.user.id
    });

    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found or access denied'
      });
    }

    // Check if health monitoring already exists
    let linkHealth = await LinkHealth.findOne({ url: urlId });

    if (linkHealth) {
      // Update settings
      if (checkInterval) linkHealth.settings.checkInterval = checkInterval;
      if (notifyOnFailure !== undefined) linkHealth.settings.notifyOnFailure = notifyOnFailure;
      if (failureThreshold) linkHealth.settings.failureThreshold = failureThreshold;
      linkHealth.settings.enabled = true;
    } else {
      // Create new health monitoring
      linkHealth = new LinkHealth({
        url: urlId,
        originalUrl: url.originalUrl,
        settings: {
          checkInterval: checkInterval || 60,
          notifyOnFailure: notifyOnFailure !== undefined ? notifyOnFailure : true,
          failureThreshold: failureThreshold || 3,
          enabled: true
        }
      });
    }

    await linkHealth.save();

    // Perform initial health check
    const healthResult = await checkUrlHealth(url.originalUrl);
    await linkHealth.addCheck(healthResult);

    res.json({
      success: true,
      message: 'Health monitoring enabled',
      data: { linkHealth }
    });
  } catch (error) {
    console.error('Enable health monitoring error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enable health monitoring',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Disable health monitoring
const disableHealthMonitoring = async (req, res) => {
  try {
    const { urlId } = req.params;

    // Verify URL belongs to user
    const url = await Url.findOne({
      _id: urlId,
      creator: req.user.id
    });

    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found or access denied'
      });
    }

    const linkHealth = await LinkHealth.findOne({ url: urlId });

    if (!linkHealth) {
      return res.status(404).json({
        success: false,
        message: 'Health monitoring not found'
      });
    }

    linkHealth.settings.enabled = false;
    await linkHealth.save();

    res.json({
      success: true,
      message: 'Health monitoring disabled'
    });
  } catch (error) {
    console.error('Disable health monitoring error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disable health monitoring'
    });
  }
};

// Get health status for a URL
const getHealthStatus = async (req, res) => {
  try {
    const { urlId } = req.params;

    // Verify URL belongs to user
    const url = await Url.findOne({
      _id: urlId,
      creator: req.user.id
    });

    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found or access denied'
      });
    }

    const linkHealth = await LinkHealth.findOne({ url: urlId });

    if (!linkHealth) {
      return res.status(404).json({
        success: false,
        message: 'Health monitoring not enabled for this URL'
      });
    }

    // Get recent checks
    const recentChecks = linkHealth.getRecentChecks(10);

    // Get uptime for different periods
    const uptime7d = linkHealth.getUptimePercentage(7);
    const uptime30d = linkHealth.getUptimePercentage(30);

    res.json({
      success: true,
      data: {
        currentStatus: linkHealth.currentStatus,
        statistics: linkHealth.statistics,
        settings: linkHealth.settings,
        recentChecks,
        uptime: {
          last7Days: uptime7d,
          last30Days: uptime30d
        },
        unacknowledgedAlerts: linkHealth.alerts.filter(a => !a.acknowledged).length
      }
    });
  } catch (error) {
    console.error('Get health status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health status'
    });
  }
};

// Get all monitored URLs for user
const getMonitoredUrls = async (req, res) => {
  try {
    const { status } = req.query; // 'healthy', 'unhealthy', 'all'

    // Get all user's URLs
    const userUrls = await Url.find({ creator: req.user.id }).select('_id');
    const urlIds = userUrls.map(u => u._id);

    // Build filter
    const filter = {
      url: { $in: urlIds },
      'settings.enabled': true
    };

    if (status === 'healthy') {
      filter['currentStatus.isHealthy'] = true;
    } else if (status === 'unhealthy') {
      filter['currentStatus.isHealthy'] = false;
    }

    const monitoredLinks = await LinkHealth.find(filter)
      .populate('url', 'shortCode originalUrl title clickCount')
      .sort({ 'currentStatus.lastChecked': -1 });

    // Calculate summary statistics
    const summary = {
      total: monitoredLinks.length,
      healthy: monitoredLinks.filter(l => l.currentStatus.isHealthy).length,
      unhealthy: monitoredLinks.filter(l => !l.currentStatus.isHealthy).length,
      averageUptime: monitoredLinks.reduce((sum, l) => sum + l.statistics.uptime, 0) / (monitoredLinks.length || 1)
    };

    res.json({
      success: true,
      data: {
        monitoredLinks,
        summary
      }
    });
  } catch (error) {
    console.error('Get monitored URLs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monitored URLs'
    });
  }
};

// Get alerts for user's URLs
const getAlerts = async (req, res) => {
  try {
    const { acknowledged } = req.query;

    // Get all user's URLs
    const userUrls = await Url.find({ creator: req.user.id }).select('_id');
    const urlIds = userUrls.map(u => u._id);

    const monitoredLinks = await LinkHealth.find({
      url: { $in: urlIds },
      'settings.enabled': true
    }).populate('url', 'shortCode originalUrl title');

    // Collect all alerts
    let allAlerts = [];
    monitoredLinks.forEach(link => {
      link.alerts.forEach(alert => {
        allAlerts.push({
          ...alert.toObject(),
          url: link.url,
          linkHealthId: link._id
        });
      });
    });

    // Filter by acknowledged status if specified
    if (acknowledged === 'true') {
      allAlerts = allAlerts.filter(a => a.acknowledged);
    } else if (acknowledged === 'false') {
      allAlerts = allAlerts.filter(a => !a.acknowledged);
    }

    // Sort by timestamp (newest first)
    allAlerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      data: {
        alerts: allAlerts,
        total: allAlerts.length,
        unacknowledged: allAlerts.filter(a => !a.acknowledged).length
      }
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts'
    });
  }
};

// Acknowledge an alert
const acknowledgeAlert = async (req, res) => {
  try {
    const { urlId, alertId } = req.params;

    // Verify URL belongs to user
    const url = await Url.findOne({
      _id: urlId,
      creator: req.user.id
    });

    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found or access denied'
      });
    }

    const linkHealth = await LinkHealth.findOne({ url: urlId });

    if (!linkHealth) {
      return res.status(404).json({
        success: false,
        message: 'Health monitoring not found'
      });
    }

    await linkHealth.acknowledgeAlert(alertId);

    res.json({
      success: true,
      message: 'Alert acknowledged'
    });
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to acknowledge alert'
    });
  }
};

// Manually trigger health check
const triggerHealthCheck = async (req, res) => {
  try {
    const { urlId } = req.params;

    // Verify URL belongs to user
    const url = await Url.findOne({
      _id: urlId,
      creator: req.user.id
    });

    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found or access denied'
      });
    }

    let linkHealth = await LinkHealth.findOne({ url: urlId });

    if (!linkHealth) {
      // Create health monitoring if it doesn't exist
      linkHealth = new LinkHealth({
        url: urlId,
        originalUrl: url.originalUrl,
        settings: { enabled: true }
      });
      await linkHealth.save();
    }

    // Perform health check
    const healthResult = await checkUrlHealth(url.originalUrl);
    await linkHealth.addCheck(healthResult);

    res.json({
      success: true,
      message: 'Health check completed',
      data: {
        result: healthResult,
        currentStatus: linkHealth.currentStatus
      }
    });
  } catch (error) {
    console.error('Trigger health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform health check',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  enableHealthMonitoring,
  disableHealthMonitoring,
  getHealthStatus,
  getMonitoredUrls,
  getAlerts,
  acknowledgeAlert,
  triggerHealthCheck
};
