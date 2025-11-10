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
  }
}

module.exports = ScheduledTasks;
