const axios = require('axios');
const LinkHealth = require('../models/LinkHealth');
const Url = require('../models/Url');
const { sendEmail } = require('./emailService');

// Check URL health
const checkUrlHealth = async (url, timeout = 10000) => {
  const startTime = Date.now();
  const redirectChain = [];
  
  try {
    const response = await axios.get(url, {
      timeout,
      maxRedirects: 5,
      validateStatus: (status) => status < 500, // Don't throw on 4xx errors
      headers: {
        'User-Agent': 'LinkHealthMonitor/1.0'
      }
    });

    const responseTime = Date.now() - startTime;
    const statusCode = response.status;
    const isHealthy = statusCode >= 200 && statusCode < 400;

    // Track redirect chain
    if (response.request._redirectable && response.request._redirectable._redirectCount > 0) {
      // Note: Getting full redirect chain requires custom implementation
      redirectChain.push({
        url: response.request.res.responseUrl || url,
        statusCode
      });
    }

    return {
      statusCode,
      responseTime,
      isHealthy,
      errorMessage: isHealthy ? null : `HTTP ${statusCode}`,
      redirectChain
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    let statusCode = 0;
    let errorMessage = error.message;

    if (error.response) {
      // Server responded with error status
      statusCode = error.response.status;
      errorMessage = `HTTP ${statusCode}`;
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Domain not found';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection refused';
    }

    return {
      statusCode,
      responseTime,
      isHealthy: false,
      errorMessage,
      redirectChain
    };
  }
};

// Run health checks for all enabled URLs
const runHealthChecks = async () => {
  try {
    console.log('🏥 Starting health check cycle...');
    
    const linksToCheck = await LinkHealth.getLinksNeedingCheck();
    
    console.log(`Found ${linksToCheck.length} links to check`);

    for (const linkHealth of linksToCheck) {
      try {
        const healthResult = await checkUrlHealth(linkHealth.originalUrl);
        await linkHealth.addCheck(healthResult);
        
        console.log(`✓ Checked ${linkHealth.originalUrl}: ${healthResult.isHealthy ? 'Healthy' : 'Unhealthy'}`);

        // Send notification if link went down
        if (!healthResult.isHealthy && linkHealth.settings.notifyOnFailure) {
          const url = await Url.findById(linkHealth.url).populate('creator', 'email firstName');
          if (url && url.creator && url.creator.email) {
            await sendHealthAlert(url.creator.email, url, healthResult);
          }
        }
      } catch (error) {
        console.error(`Error checking ${linkHealth.originalUrl}:`, error.message);
      }
    }

    console.log('✓ Health check cycle completed');
  } catch (error) {
    console.error('Error running health checks:', error);
  }
};

// Send health alert email
const sendHealthAlert = async (email, url, healthResult) => {
  try {
    const subject = `⚠️ Link Health Alert: ${url.title || url.shortCode}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #DC2626;">Link Health Alert</h2>
        <p>Your shortened link is experiencing issues:</p>
        
        <div style="background: #FEE2E2; border-left: 4px solid #DC2626; padding: 16px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Short URL:</strong> ${process.env.BASE_URL}/${url.shortCode}</p>
          <p style="margin: 8px 0 0 0;"><strong>Destination:</strong> ${url.originalUrl}</p>
        </div>
        
        <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Issue Details:</h3>
          <p><strong>Status:</strong> ${healthResult.statusCode || 'Connection Failed'}</p>
          <p><strong>Error:</strong> ${healthResult.errorMessage}</p>
          <p><strong>Response Time:</strong> ${healthResult.responseTime}ms</p>
        </div>
        
        <p>Please check your destination URL and update it if necessary.</p>
        
        <a href="${process.env.BASE_URL}/my-links" 
           style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; margin: 20px 0;">
          View Link Details
        </a>
        
        <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
          You're receiving this because health monitoring is enabled for this link.
          You can disable notifications in your link settings.
        </p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject,
      html
    });
  } catch (error) {
    console.error('Error sending health alert email:', error);
  }
};

// Initialize health monitoring for a URL
const initializeHealthMonitoring = async (urlId, originalUrl, settings = {}) => {
  try {
    const linkHealth = new LinkHealth({
      url: urlId,
      originalUrl,
      settings: {
        checkInterval: settings.checkInterval || 60,
        enabled: settings.enabled !== undefined ? settings.enabled : true,
        notifyOnFailure: settings.notifyOnFailure !== undefined ? settings.notifyOnFailure : true,
        failureThreshold: settings.failureThreshold || 3
      }
    });

    // Perform initial check
    const healthResult = await checkUrlHealth(originalUrl);
    await linkHealth.addCheck(healthResult);

    await linkHealth.save();
    return linkHealth;
  } catch (error) {
    console.error('Error initializing health monitoring:', error);
    throw error;
  }
};

// Get health summary for user
const getHealthSummary = async (userId) => {
  try {
    // Get all user's URLs
    const userUrls = await Url.find({ creator: userId }).select('_id');
    const urlIds = userUrls.map(u => u._id);

    const monitoredLinks = await LinkHealth.find({
      url: { $in: urlIds },
      'settings.enabled': true
    });

    const summary = {
      totalMonitored: monitoredLinks.length,
      healthy: monitoredLinks.filter(l => l.currentStatus.isHealthy).length,
      unhealthy: monitoredLinks.filter(l => !l.currentStatus.isHealthy).length,
      averageUptime: 0,
      averageResponseTime: 0,
      unacknowledgedAlerts: 0
    };

    if (monitoredLinks.length > 0) {
      summary.averageUptime = monitoredLinks.reduce((sum, l) => sum + l.statistics.uptime, 0) / monitoredLinks.length;
      summary.averageResponseTime = monitoredLinks.reduce((sum, l) => sum + l.statistics.averageResponseTime, 0) / monitoredLinks.length;
      summary.unacknowledgedAlerts = monitoredLinks.reduce((sum, l) => sum + l.alerts.filter(a => !a.acknowledged).length, 0);
    }

    return summary;
  } catch (error) {
    console.error('Error getting health summary:', error);
    throw error;
  }
};

module.exports = {
  checkUrlHealth,
  runHealthChecks,
  sendHealthAlert,
  initializeHealthMonitoring,
  getHealthSummary
};
