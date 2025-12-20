const User = require('../models/User');
const { cacheDel } = require('../config/redis');

// Get all notification preferences
const getNotificationPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Build comprehensive preferences response with defaults
    const notifications = user.preferences?.notifications || {};
    const reportSettings = user.preferences?.reportSettings || {};

    res.json({
      success: true,
      data: {
        // Performance & Insights
        performance: {
          weeklyDigest: notifications.weeklyDigest !== false,
          monthlyReport: notifications.monthlyReport !== false,
          viralLinkAlert: notifications.viralLinkAlert !== false,
          performanceDropAlert: notifications.performanceDropAlert !== false,
          milestoneAlerts: notifications.milestoneAlerts !== false
        },
        // Engagement
        engagement: {
          inactivityReminder: notifications.inactivityReminder !== false,
          featureTips: notifications.featureTips !== false,
          productUpdates: notifications.productUpdates !== false
        },
        // Business Intelligence
        business: {
          competitorBenchmarks: notifications.competitorBenchmarks || false,
          predictiveAlerts: notifications.predictiveAlerts !== false
        },
        // Monetization
        monetization: {
          upgradeOpportunities: notifications.upgradeOpportunities !== false,
          specialOffers: notifications.specialOffers !== false,
          usageWarnings: notifications.usageWarnings !== false
        },
        // Operational
        operational: {
          securityAlerts: notifications.securityAlerts !== false,
          domainStatus: notifications.domainStatus !== false,
          linkExpiration: notifications.linkExpiration !== false,
          billingUpdates: notifications.billingUpdates !== false
        },
        // Marketing
        marketing: {
          newsletter: notifications.newsletter || false,
          marketingEmails: notifications.marketingEmails || false
        },
        // Report Settings
        reportSettings: {
          weeklyReportDay: reportSettings.weeklyReportDay || 'monday',
          monthlyReportDay: reportSettings.monthlyReportDay || 1,
          reportFormat: reportSettings.reportFormat || 'email',
          includeCharts: reportSettings.includeCharts !== false
        },
        // Regional Settings
        regional: {
          language: user.preferences?.language || 'en',
          timezone: user.preferences?.timezone || 'Asia/Riyadh',
          theme: user.preferences?.theme || 'light'
        }
      }
    });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification preferences'
    });
  }
};

// Update notification preferences
const updateNotificationPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { performance, engagement, business, monetization, operational, marketing, reportSettings, regional } = req.body;

    // Initialize preferences if not exists
    if (!user.preferences) {
      user.preferences = {};
    }
    if (!user.preferences.notifications) {
      user.preferences.notifications = {};
    }
    if (!user.preferences.reportSettings) {
      user.preferences.reportSettings = {};
    }

    // Update Performance notifications
    if (performance) {
      if (performance.weeklyDigest !== undefined) user.preferences.notifications.weeklyDigest = performance.weeklyDigest;
      if (performance.monthlyReport !== undefined) user.preferences.notifications.monthlyReport = performance.monthlyReport;
      if (performance.viralLinkAlert !== undefined) user.preferences.notifications.viralLinkAlert = performance.viralLinkAlert;
      if (performance.performanceDropAlert !== undefined) user.preferences.notifications.performanceDropAlert = performance.performanceDropAlert;
      if (performance.milestoneAlerts !== undefined) user.preferences.notifications.milestoneAlerts = performance.milestoneAlerts;
    }

    // Update Engagement notifications
    if (engagement) {
      if (engagement.inactivityReminder !== undefined) user.preferences.notifications.inactivityReminder = engagement.inactivityReminder;
      if (engagement.featureTips !== undefined) user.preferences.notifications.featureTips = engagement.featureTips;
      if (engagement.productUpdates !== undefined) user.preferences.notifications.productUpdates = engagement.productUpdates;
    }

    // Update Business notifications
    if (business) {
      if (business.competitorBenchmarks !== undefined) user.preferences.notifications.competitorBenchmarks = business.competitorBenchmarks;
      if (business.predictiveAlerts !== undefined) user.preferences.notifications.predictiveAlerts = business.predictiveAlerts;
    }

    // Update Monetization notifications
    if (monetization) {
      if (monetization.upgradeOpportunities !== undefined) user.preferences.notifications.upgradeOpportunities = monetization.upgradeOpportunities;
      if (monetization.specialOffers !== undefined) user.preferences.notifications.specialOffers = monetization.specialOffers;
      if (monetization.usageWarnings !== undefined) user.preferences.notifications.usageWarnings = monetization.usageWarnings;
    }

    // Update Operational notifications
    if (operational) {
      if (operational.securityAlerts !== undefined) user.preferences.notifications.securityAlerts = operational.securityAlerts;
      if (operational.domainStatus !== undefined) user.preferences.notifications.domainStatus = operational.domainStatus;
      if (operational.linkExpiration !== undefined) user.preferences.notifications.linkExpiration = operational.linkExpiration;
      if (operational.billingUpdates !== undefined) user.preferences.notifications.billingUpdates = operational.billingUpdates;
    }

    // Update Marketing notifications
    if (marketing) {
      if (marketing.newsletter !== undefined) user.preferences.notifications.newsletter = marketing.newsletter;
      if (marketing.marketingEmails !== undefined) user.preferences.notifications.marketingEmails = marketing.marketingEmails;
    }

    // Update Report Settings
    if (reportSettings) {
      if (reportSettings.weeklyReportDay !== undefined) user.preferences.reportSettings.weeklyReportDay = reportSettings.weeklyReportDay;
      if (reportSettings.monthlyReportDay !== undefined) user.preferences.reportSettings.monthlyReportDay = reportSettings.monthlyReportDay;
      if (reportSettings.reportFormat !== undefined) user.preferences.reportSettings.reportFormat = reportSettings.reportFormat;
      if (reportSettings.includeCharts !== undefined) user.preferences.reportSettings.includeCharts = reportSettings.includeCharts;
    }

    // Update Regional Settings
    if (regional) {
      if (regional.language !== undefined) user.preferences.language = regional.language;
      if (regional.timezone !== undefined) user.preferences.timezone = regional.timezone;
      if (regional.theme !== undefined) user.preferences.theme = regional.theme;
    }

    await user.save();
    await cacheDel(`user:${user._id}`);

    res.json({
      success: true,
      message: 'Notification preferences updated successfully'
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences'
    });
  }
};

// Quick toggle for a single notification setting
const toggleNotification = async (req, res) => {
  try {
    const { category, setting } = req.params;
    const { enabled } = req.body;

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize preferences if not exists
    if (!user.preferences) {
      user.preferences = {};
    }
    if (!user.preferences.notifications) {
      user.preferences.notifications = {};
    }

    // Map category/setting to actual field
    const settingMap = {
      'performance.weeklyDigest': 'weeklyDigest',
      'performance.monthlyReport': 'monthlyReport',
      'performance.viralLinkAlert': 'viralLinkAlert',
      'performance.performanceDropAlert': 'performanceDropAlert',
      'performance.milestoneAlerts': 'milestoneAlerts',
      'engagement.inactivityReminder': 'inactivityReminder',
      'engagement.featureTips': 'featureTips',
      'engagement.productUpdates': 'productUpdates',
      'business.competitorBenchmarks': 'competitorBenchmarks',
      'business.predictiveAlerts': 'predictiveAlerts',
      'monetization.upgradeOpportunities': 'upgradeOpportunities',
      'monetization.specialOffers': 'specialOffers',
      'monetization.usageWarnings': 'usageWarnings',
      'operational.securityAlerts': 'securityAlerts',
      'operational.domainStatus': 'domainStatus',
      'operational.linkExpiration': 'linkExpiration',
      'operational.billingUpdates': 'billingUpdates',
      'marketing.newsletter': 'newsletter',
      'marketing.marketingEmails': 'marketingEmails'
    };

    const fieldKey = `${category}.${setting}`;
    const fieldName = settingMap[fieldKey];

    if (!fieldName) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification setting'
      });
    }

    user.preferences.notifications[fieldName] = enabled;
    await user.save();
    await cacheDel(`user:${user._id}`);

    res.json({
      success: true,
      message: `${setting} ${enabled ? 'enabled' : 'disabled'} successfully`,
      data: {
        [fieldName]: enabled
      }
    });
  } catch (error) {
    console.error('Toggle notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle notification setting'
    });
  }
};

// Enable/disable all notifications in a category
const toggleCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { enabled } = req.body;

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize preferences if not exists
    if (!user.preferences) {
      user.preferences = {};
    }
    if (!user.preferences.notifications) {
      user.preferences.notifications = {};
    }

    // Define category settings
    const categorySettings = {
      performance: ['weeklyDigest', 'monthlyReport', 'viralLinkAlert', 'performanceDropAlert', 'milestoneAlerts'],
      engagement: ['inactivityReminder', 'featureTips', 'productUpdates'],
      business: ['competitorBenchmarks', 'predictiveAlerts'],
      monetization: ['upgradeOpportunities', 'specialOffers', 'usageWarnings'],
      operational: ['securityAlerts', 'domainStatus', 'linkExpiration', 'billingUpdates'],
      marketing: ['newsletter', 'marketingEmails']
    };

    const settings = categorySettings[category];
    if (!settings) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    // Update all settings in the category
    settings.forEach(setting => {
      user.preferences.notifications[setting] = enabled;
    });

    await user.save();
    await cacheDel(`user:${user._id}`);

    res.json({
      success: true,
      message: `All ${category} notifications ${enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('Toggle category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle category notifications'
    });
  }
};

// Get email report preview
const getReportPreview = async (req, res) => {
  try {
    const { type } = req.params; // 'weekly' or 'monthly'
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // This would generate a preview of what the report email would look like
    // For now, return sample data structure
    res.json({
      success: true,
      data: {
        type,
        previewAvailable: true,
        sampleContent: {
          subject: type === 'weekly' 
            ? `Your Weekly Performance Report - ${new Date().toLocaleDateString()}`
            : `Your Monthly Business Report - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
          sections: [
            'Performance Summary',
            'Top Performing Links',
            'Geographic Insights',
            'Device Breakdown',
            'Recommendations'
          ]
        }
      }
    });
  } catch (error) {
    console.error('Get report preview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report preview'
    });
  }
};

// Send test notification
const sendTestNotification = async (req, res) => {
  try {
    const { type } = req.body; // 'weekly', 'monthly', 'viral', etc.
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Import email service
    const emailService = require('../services/emailService');

    // Check if email service is configured
    if (!emailService.isAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'Email service not configured. Please add SMTP_HOST, SMTP_USER, and SMTP_PASS to your .env file and restart the server.',
        error: 'EMAIL_NOT_CONFIGURED'
      });
    }

    // Send test email based on type
    let result;
    switch (type) {
      case 'weekly':
        result = await emailService.sendWeeklyDigest(user);
        break;
      case 'monthly':
        result = await emailService.sendMonthlyReport(user);
        break;
      case 'viral':
        result = await emailService.sendViralAlert(user, {
          linkTitle: 'Test Link',
          shortUrl: 'https://example.com/test',
          clicks: 1000,
          timeframe: '1 hour'
        });
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid notification type'
        });
    }

    res.json({
      success: true,
      message: `Test ${type} notification sent to ${user.email}`
    });
  } catch (error) {
    console.error('Send test notification error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to send test notification';
    let errorCode = 'UNKNOWN_ERROR';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Gmail authentication failed. Please use an App Password instead of your regular password. Go to https://myaccount.google.com/apppasswords to generate one.';
      errorCode = 'AUTH_FAILED';
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Could not connect to email server. Check your SMTP_HOST and SMTP_PORT settings.';
      errorCode = 'CONNECTION_FAILED';
    } else if (error.code === 'EMAIL_NOT_CONFIGURED') {
      errorMessage = error.message;
      errorCode = 'EMAIL_NOT_CONFIGURED';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: errorCode
    });
  }
};

module.exports = {
  getNotificationPreferences,
  updateNotificationPreferences,
  toggleNotification,
  toggleCategory,
  getReportPreview,
  sendTestNotification
};
