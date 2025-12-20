const cron = require('node-cron');
const User = require('../models/User');
const emailService = require('./emailService');

class ScheduledTasks {
  // Send payment reminders 3 days before billing
  static async sendPaymentReminders() {
    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const users = await User.find({
        'subscription.status': { $in: ['active', 'trialing'] },
        'subscription.currentPeriodEnd': {
          $gte: new Date(),
          $lte: threeDaysFromNow
        },
        'preferences.emailNotifications.paymentReminders': true
      });

      console.log(`Sending payment reminders to ${users.length} users`);

      for (const user of users) {
        const daysUntilDue = Math.ceil(
          (new Date(user.subscription.currentPeriodEnd) - new Date()) / (1000 * 60 * 60 * 24)
        );

        // Calculate amount based on plan (you'd get this from Stripe in production)
        const amount = user.plan === 'pro' ? 9 : user.plan === 'enterprise' ? 29 : 0;

        if (amount > 0) {
          await emailService.sendPaymentReminder(user, daysUntilDue, amount);
          console.log(`Sent payment reminder to ${user.email}`);
        }
      }
    } catch (error) {
      console.error('Error sending payment reminders:', error);
    }
  }

  // Send weekly digest reports
  static async sendWeeklyDigests() {
    try {
      const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' });
      
      // Find users who have weekly digest enabled and prefer this day
      const users = await User.find({
        'preferences.notifications.weeklyDigest': true,
        $or: [
          { 'preferences.reportSettings.weeklyReportDay': dayOfWeek },
          { 'preferences.reportSettings.weeklyReportDay': { $exists: false } } // Default to Monday
        ]
      });

      console.log(`Sending weekly digests to ${users.length} users`);

      for (const user of users) {
        try {
          // Get user's link statistics for the past week
          const Url = require('../models/Url');
          const { Click } = require('../models/Analytics');
          
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

          // Get user's links
          const userLinks = await Url.find({ userId: user._id });
          const linkIds = userLinks.map(link => link._id);

          // Get analytics for the past week
          const weeklyAnalytics = await Click.aggregate([
            {
              $match: {
                url: { $in: linkIds },
                timestamp: { $gte: oneWeekAgo }
              }
            },
            {
              $group: {
                _id: '$url',
                clicks: { $sum: 1 },
                uniqueVisitors: { $addToSet: '$ipHash' }
              }
            }
          ]);

          // Calculate stats
          const totalClicks = weeklyAnalytics.reduce((sum, item) => sum + item.clicks, 0);
          const uniqueVisitors = weeklyAnalytics.reduce((sum, item) => sum + item.uniqueVisitors.length, 0);
          const newLinks = userLinks.filter(link => new Date(link.createdAt) >= oneWeekAgo).length;

          // Get top performing links
          const topLinks = weeklyAnalytics
            .sort((a, b) => b.clicks - a.clicks)
            .slice(0, 3)
            .map(item => {
              const link = userLinks.find(l => l._id.toString() === item._id.toString());
              return {
                title: link?.title || link?.shortCode || 'Untitled',
                clicks: item.clicks,
                shortCode: link?.shortCode
              };
            });

          // Get top countries
          const countryAnalytics = await Click.aggregate([
            {
              $match: {
                url: { $in: linkIds },
                timestamp: { $gte: oneWeekAgo }
              }
            },
            {
              $group: {
                _id: '$location.countryName',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 3 }
          ]);

          const topCountries = countryAnalytics.map(c => ({
            name: c._id || 'Unknown',
            percentage: Math.round((c.count / totalClicks) * 100) || 0
          }));

          const stats = {
            totalClicks,
            uniqueVisitors,
            newLinks,
            topLinks: topLinks.length > 0 ? topLinks : [{ title: 'No data', clicks: 0, shortCode: '-' }],
            topCountries: topCountries.length > 0 ? topCountries : [{ name: 'No data', percentage: 0 }],
            changeFromLastWeek: 0 // Would need historical data to calculate
          };

          await emailService.sendWeeklyDigest(user, stats);
          console.log(`Sent weekly digest to ${user.email}`);
        } catch (userError) {
          console.error(`Error sending weekly digest to ${user.email}:`, userError);
        }
      }
    } catch (error) {
      console.error('Error sending weekly digests:', error);
    }
  }

  // Send monthly reports
  static async sendMonthlyReports() {
    try {
      const dayOfMonth = new Date().getDate();
      
      // Find users who have monthly report enabled and prefer this day
      const users = await User.find({
        'preferences.notifications.monthlyReport': true,
        $or: [
          { 'preferences.reportSettings.monthlyReportDay': dayOfMonth },
          { 'preferences.reportSettings.monthlyReportDay': { $exists: false } } // Default to 1st
        ]
      });

      console.log(`Sending monthly reports to ${users.length} users`);

      for (const user of users) {
        try {
          // Get user's link statistics for the past month
          const Url = require('../models/Url');
          const { Click } = require('../models/Analytics');
          
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

          // Get user's links
          const userLinks = await Url.find({ userId: user._id });
          const linkIds = userLinks.map(link => link._id);

          // Get analytics for the past month
          const monthlyAnalytics = await Click.aggregate([
            {
              $match: {
                url: { $in: linkIds },
                timestamp: { $gte: oneMonthAgo }
              }
            },
            {
              $group: {
                _id: '$url',
                clicks: { $sum: 1 },
                uniqueVisitors: { $addToSet: '$ipHash' }
              }
            }
          ]);

          // Calculate stats
          const totalClicks = monthlyAnalytics.reduce((sum, item) => sum + item.clicks, 0);
          const uniqueVisitors = monthlyAnalytics.reduce((sum, item) => sum + item.uniqueVisitors.length, 0);
          const totalLinks = userLinks.length;

          // Get QR scans
          const qrScans = await Click.countDocuments({
            url: { $in: linkIds },
            timestamp: { $gte: oneMonthAgo },
            clickSource: 'qr_code'
          });

          // Get top performing links
          const topLinks = monthlyAnalytics
            .sort((a, b) => b.clicks - a.clicks)
            .slice(0, 5)
            .map(item => {
              const link = userLinks.find(l => l._id.toString() === item._id.toString());
              return {
                title: link?.title || link?.shortCode || 'Untitled',
                clicks: item.clicks,
                shortCode: link?.shortCode
              };
            });

          // Get device breakdown
          const deviceAnalytics = await Click.aggregate([
            {
              $match: {
                url: { $in: linkIds },
                timestamp: { $gte: oneMonthAgo }
              }
            },
            {
              $group: {
                _id: '$device.type',
                count: { $sum: 1 }
              }
            }
          ]);

          const deviceBreakdown = {
            mobile: 0,
            desktop: 0,
            tablet: 0
          };
          deviceAnalytics.forEach(d => {
            const device = (d._id || 'desktop').toLowerCase();
            if (device.includes('mobile') || device.includes('phone')) {
              deviceBreakdown.mobile += d.count;
            } else if (device.includes('tablet') || device.includes('ipad')) {
              deviceBreakdown.tablet += d.count;
            } else {
              deviceBreakdown.desktop += d.count;
            }
          });
          const totalDevices = deviceBreakdown.mobile + deviceBreakdown.desktop + deviceBreakdown.tablet || 1;
          deviceBreakdown.mobile = Math.round((deviceBreakdown.mobile / totalDevices) * 100);
          deviceBreakdown.desktop = Math.round((deviceBreakdown.desktop / totalDevices) * 100);
          deviceBreakdown.tablet = Math.round((deviceBreakdown.tablet / totalDevices) * 100);

          // Get top countries
          const countryAnalytics = await Click.aggregate([
            {
              $match: {
                url: { $in: linkIds },
                timestamp: { $gte: oneMonthAgo }
              }
            },
            {
              $group: {
                _id: '$location.countryName',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
          ]);

          const topCountries = countryAnalytics.map(c => ({
            name: c._id || 'Unknown',
            clicks: c.count,
            percentage: Math.round((c.count / totalClicks) * 100) || 0
          }));

          const daysInMonth = 30;
          const stats = {
            totalClicks,
            uniqueVisitors,
            totalLinks,
            qrScans,
            topLinks: topLinks.length > 0 ? topLinks : [{ title: 'No data', clicks: 0, shortCode: '-' }],
            deviceBreakdown,
            topCountries: topCountries.length > 0 ? topCountries : [{ name: 'No data', clicks: 0, percentage: 0 }],
            changeFromLastMonth: 0, // Would need historical data to calculate
            avgClicksPerDay: Math.round(totalClicks / daysInMonth)
          };

          await emailService.sendMonthlyReport(user, stats);
          console.log(`Sent monthly report to ${user.email}`);
        } catch (userError) {
          console.error(`Error sending monthly report to ${user.email}:`, userError);
        }
      }
    } catch (error) {
      console.error('Error sending monthly reports:', error);
    }
  }

  // Check for viral links and send alerts
  static async checkViralLinks() {
    try {
      const Url = require('../models/Url');
      const { Click } = require('../models/Analytics');
      
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      // Find links with unusual traffic in the last hour
      const viralLinks = await Click.aggregate([
        {
          $match: {
            timestamp: { $gte: oneHourAgo }
          }
        },
        {
          $group: {
            _id: '$url',
            clicks: { $sum: 1 }
          }
        },
        {
          $match: {
            clicks: { $gte: 100 } // Threshold for viral alert
          }
        }
      ]);

      for (const viral of viralLinks) {
        try {
          const url = await Url.findById(viral._id).populate('userId');
          if (!url || !url.userId) continue;

          const user = url.userId;
          
          // Check if user has viral alerts enabled
          if (!user.preferences?.notifications?.viralLinkAlert) continue;

          // Check if we already sent an alert for this link recently
          const lastAlertKey = `viral_alert_${url._id}`;
          if (user.lastAlerts && user.lastAlerts[lastAlertKey]) {
            const lastAlert = new Date(user.lastAlerts[lastAlertKey]);
            const hoursSinceLastAlert = (new Date() - lastAlert) / (1000 * 60 * 60);
            if (hoursSinceLastAlert < 6) continue; // Don't spam alerts
          }

          // Get top source
          const topSource = await Click.aggregate([
            {
              $match: {
                url: url._id,
                timestamp: { $gte: oneHourAgo }
              }
            },
            {
              $group: {
                _id: '$referer',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 1 }
          ]);

          const linkData = {
            linkTitle: url.title,
            shortUrl: `https://laghhu.link/${url.shortCode}`,
            clicks: viral.clicks,
            timeframe: '1 hour',
            topSource: topSource[0]?._id || 'Direct traffic',
            linkId: url._id
          };

          await emailService.sendViralAlert(user, linkData);
          
          // Update last alert time
          await User.findByIdAndUpdate(user._id, {
            $set: { [`lastAlerts.${lastAlertKey}`]: new Date() }
          });

          console.log(`Sent viral alert for ${url.shortCode} to ${user.email}`);
        } catch (linkError) {
          console.error(`Error processing viral link:`, linkError);
        }
      }
    } catch (error) {
      console.error('Error checking viral links:', error);
    }
  }

  // Send trial ending notifications
  static async sendTrialEndingNotifications() {
    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      // Find users with trials ending in 3 or 7 days
      const users = await User.find({
        'subscription.status': 'trialing',
        'subscription.trialEnd': {
          $gte: new Date(),
          $lte: sevenDaysFromNow
        }
      });

      console.log(`Checking ${users.length} users for trial ending notifications`);

      for (const user of users) {
        const daysRemaining = Math.ceil(
          (new Date(user.subscription.trialEnd) - new Date()) / (1000 * 60 * 60 * 24)
        );

        // Send notification at 7 days and 3 days before trial ends
        if (daysRemaining === 7 || daysRemaining === 3) {
          await emailService.sendTrialEndingNotification(user, daysRemaining);
          console.log(`Sent trial ending notification to ${user.email} (${daysRemaining} days)`);
        }
      }
    } catch (error) {
      console.error('Error sending trial ending notifications:', error);
    }
  }

  // Check for usage overages
  static async checkUsageOverages() {
    try {
      const Plan = require('../models/Plan');
      const paymentService = require('./paymentService');

      const users = await User.find({
        plan: { $ne: 'free' },
        'subscription.status': { $in: ['active', 'trialing'] }
      });

      for (const user of users) {
        const plan = await Plan.getByName(user.plan);

        // Check URL overage
        if (plan.features.urlsPerMonth !== -1) {
          const overage = user.usage.urlsCreatedThisMonth - plan.features.urlsPerMonth;
          if (overage > 0) {
            // Only charge once per month
            if (!user.usage.overageChargedThisMonth) {
              await paymentService.recordOverage(user._id, 'urls', overage);
              await User.findByIdAndUpdate(user._id, {
                'usage.overageChargedThisMonth': true
              });
              console.log(`Recorded URL overage for ${user.email}: ${overage} URLs`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking usage overages:', error);
    }
  }

  // Reset monthly usage counters
  static async resetMonthlyUsage() {
    try {
      const users = await User.find({});

      for (const user of users) {
        await User.findByIdAndUpdate(user._id, {
          'usage.urlsCreatedThisMonth': 0,
          'usage.apiCallsThisMonth': 0,
          'usage.overageCharges': 0,
          'usage.overageChargedThisMonth': false,
          'usage.lastResetDate': new Date()
        });
      }

      console.log(`Reset monthly usage for ${users.length} users`);
    } catch (error) {
      console.error('Error resetting monthly usage:', error);
    }
  }

  // Handle expired subscriptions
  static async handleExpiredSubscriptions() {
    try {
      const users = await User.find({
        'subscription.status': 'past_due',
        'subscription.currentPeriodEnd': {
          $lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        }
      });

      console.log(`Handling ${users.length} expired subscriptions`);

      for (const user of users) {
        // Downgrade to free plan
        await User.findByIdAndUpdate(user._id, {
          plan: 'free',
          'subscription.status': 'cancelled'
        });

        console.log(`Downgraded ${user.email} to free plan due to expired subscription`);
      }
    } catch (error) {
      console.error('Error handling expired subscriptions:', error);
    }
  }

  // Initialize all cron jobs
  static initializeCronJobs() {
    console.log('Initializing scheduled tasks...');

    // Payment reminders - daily at 9 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('Running payment reminder task...');
      await this.sendPaymentReminders();
    });

    // Trial ending notifications - daily at 10 AM
    cron.schedule('0 10 * * *', async () => {
      console.log('Running trial ending notification task...');
      await this.sendTrialEndingNotifications();
    });

    // Weekly digest - every day at 8 AM (checks user's preferred day)
    cron.schedule('0 8 * * *', async () => {
      console.log('Running weekly digest task...');
      await this.sendWeeklyDigests();
    });

    // Monthly reports - every day at 7 AM (checks user's preferred day)
    cron.schedule('0 7 * * *', async () => {
      console.log('Running monthly report task...');
      await this.sendMonthlyReports();
    });

    // Viral link alerts - every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      console.log('Checking for viral links...');
      await this.checkViralLinks();
    });

    // Check usage overages - daily at 11 PM
    cron.schedule('0 23 * * *', async () => {
      console.log('Running usage overage check...');
      await this.checkUsageOverages();
    });

    // Reset monthly usage - 1st of every month at midnight
    cron.schedule('0 0 1 * *', async () => {
      console.log('Running monthly usage reset...');
      await this.resetMonthlyUsage();
    });

    // Handle expired subscriptions - daily at midnight
    cron.schedule('0 0 * * *', async () => {
      console.log('Running expired subscription check...');
      await this.handleExpiredSubscriptions();
    });

    console.log('✓ Scheduled tasks initialized');
    console.log('  - Payment reminders: daily at 9 AM');
    console.log('  - Trial ending notifications: daily at 10 AM');
    console.log('  - Weekly digests: daily at 8 AM (user preference)');
    console.log('  - Monthly reports: daily at 7 AM (user preference)');
    console.log('  - Viral link alerts: every 15 minutes');
    console.log('  - Usage overage check: daily at 11 PM');
    console.log('  - Monthly usage reset: 1st of month at midnight');
    console.log('  - Expired subscription check: daily at midnight');
  }
}

module.exports = ScheduledTasks;
