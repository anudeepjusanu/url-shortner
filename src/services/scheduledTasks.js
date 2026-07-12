const cron = require("node-cron");
const User = require("../models/User");
const emailService = require("./emailService");
const Domain = require("../models/Domain");
const logger = require("../config/logger");

class ScheduledTasks {
  // Send payment reminders 3 days before billing
  static async sendPaymentReminders() {
    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const users = await User.find({
        "subscription.status": { $in: ["active", "trialing"] },
        "subscription.currentPeriodEnd": {
          $gte: new Date(),
          $lte: threeDaysFromNow,
        },
        "preferences.emailNotifications.paymentReminders": true,
      });

      logger.info(`Sending payment reminders to ${users.length} users`);

      for (const user of users) {
        const daysUntilDue = Math.ceil(
          (new Date(user.subscription.currentPeriodEnd) - new Date()) /
            (1000 * 60 * 60 * 24),
        );

        // Calculate amount based on plan (you'd get this from Stripe in production)
        const amount =
          user.plan === "pro" ? 9 : user.plan === "enterprise" ? 29 : 0;

        if (amount > 0) {
          await emailService.sendPaymentReminder(user, daysUntilDue, amount);
          logger.info(`Sent payment reminder to ${user.email}`);
        }
      }
    } catch (error) {
      logger.error("Error sending payment reminders:", error);
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
        "subscription.status": "trialing",
        "subscription.trialEnd": {
          $gte: new Date(),
          $lte: sevenDaysFromNow,
        },
      });

      logger.info(
        `Checking ${users.length} users for trial ending notifications`,
      );

      for (const user of users) {
        const daysRemaining = Math.ceil(
          (new Date(user.subscription.trialEnd) - new Date()) /
            (1000 * 60 * 60 * 24),
        );

        // Send notification at 7 days and 3 days before trial ends
        if (daysRemaining === 7 || daysRemaining === 3) {
          await emailService.sendTrialEndingNotification(user, daysRemaining);
          logger.info(
            `Sent trial ending notification to ${user.email} (${daysRemaining} days)`,
          );
        }
      }
    } catch (error) {
      logger.error("Error sending trial ending notifications:", error);
    }
  }

  // Check for usage overages
  static async checkUsageOverages() {
    try {
      const Plan = require("../models/Plan");
      const paymentService = require("./paymentService");

      const users = await User.find({
        plan: { $ne: "free" },
        "subscription.status": { $in: ["active", "trialing"] },
      });

      for (const user of users) {
        const plan = await Plan.getByName(user.plan);

        // Check URL overage
        if (plan.features.urlsPerMonth !== -1) {
          const overage =
            user.usage.urlsCreatedThisMonth - plan.features.urlsPerMonth;
          if (overage > 0) {
            // Only charge once per month
            if (!user.usage.overageChargedThisMonth) {
              await paymentService.recordOverage(user._id, "urls", overage);
              await User.findByIdAndUpdate(user._id, {
                "usage.overageChargedThisMonth": true,
              });
              logger.info(
                `Recorded URL overage for ${user.email}: ${overage} URLs`,
              );
            }
          }
        }
      }
    } catch (error) {
      logger.error("Error checking usage overages:", error);
    }
  }

  // Reset monthly usage counters
  static async resetMonthlyUsage() {
    try {
      const users = await User.find({});

      for (const user of users) {
        await User.findByIdAndUpdate(user._id, {
          "usage.urlsCreatedThisMonth": 0,
          "usage.apiCallsThisMonth": 0,
          "usage.overageCharges": 0,
          "usage.overageChargedThisMonth": false,
          "usage.lastResetDate": new Date(),
        });
      }

      logger.info(`Reset monthly usage for ${users.length} users`);
    } catch (error) {
      logger.error("Error resetting monthly usage:", error);
    }
  }

  // Handle expired subscriptions
  static async handleExpiredSubscriptions() {
    try {
      const users = await User.find({
        "subscription.status": "past_due",
        "subscription.currentPeriodEnd": {
          $lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        },
      });

      logger.info(`Handling ${users.length} expired subscriptions`);

      for (const user of users) {
        // Downgrade to free plan
        await User.findByIdAndUpdate(user._id, {
          plan: "free",
          "subscription.status": "cancelled",
        });

        logger.info(
          `Downgraded ${user.email} to free plan due to expired subscription`,
        );
      }
    } catch (error) {
      logger.error("Error handling expired subscriptions:", error);
    }
  }

  // Retry SSL provisioning for all verified domains with pending or failed SSL.
  // Runs every hour so no domain stays stuck forever without human intervention.
  static async retryFailedSSL() {
    try {
      const sslProvisioningService = require("./sslProvisioningService");

      const domains = await Domain.find({
        verificationStatus: "verified",
        "ssl.status": { $in: ["pending", "failed"] },
      });

      if (domains.length === 0) return;

      logger.info(
        `[SSL] Hourly retry: found ${domains.length} domain(s) needing SSL`,
      );

      for (const domain of domains) {
        logger.info(`[SSL] Retrying SSL for ${domain.fullDomain}...`);
        try {
          const result = await sslProvisioningService.provision(
            domain._id.toString(),
          );
          if (result.success) {
            logger.info(
              `[SSL] ✅ ${domain.fullDomain} — SSL provisioned successfully`,
            );
          } else {
            logger.info(
              `[SSL] ❌ ${domain.fullDomain} — still failing: ${result.error}`,
            );
          }
        } catch (err) {
          logger.error(`[SSL] ❌ ${domain.fullDomain} — error: ${err.message}`);
        }
      }
    } catch (error) {
      logger.error("[SSL] Hourly retry task failed:", error.message);
    }
  }

  // Re-scan links whose destination could have changed since their last check,
  // and sweep up links stuck in 'pending' (either a scan that silently failed
  // to write back — e.g. a server restart mid-scan — or a legacy link created
  // before the scanner existed, which never got queued at all). 'suspicious'/
  // 'blocked' are excluded: those already await/have an admin decision.
  static async reScanActiveLinks() {
    try {
      const Url = require("../models/Url");
      const { scanAndPersist } = require("./urlScanner/scanTrigger");

      const batchSize = parseInt(process.env.URL_RESCAN_BATCH_SIZE, 10) || 200;
      const intervalDays =
        parseInt(process.env.URL_RESCAN_INTERVAL_DAYS, 10) || 7;
      const cutoff = new Date(Date.now() - intervalDays * 24 * 60 * 60 * 1000);
      // A 'pending' link is expected to resolve within ~30s (the pipeline's
      // own worst case). Past an hour it's not "in flight" anymore — it's stuck.
      const stuckPendingCutoff = new Date(Date.now() - 60 * 60 * 1000);

      const candidates = await Url.find({
        isActive: true,
        $or: [
          {
            moderationStatus: { $in: ["safe", "could_not_verify"] },
            $or: [
              { moderationCheckedAt: null },
              { moderationCheckedAt: { $lte: cutoff } },
            ],
          },
          {
            moderationStatus: "pending",
            createdAt: { $lte: stuckPendingCutoff },
          },
        ],
      })
        .sort({ moderationCheckedAt: 1 }) // most overdue (or never-checked) first
        .limit(batchSize);

      if (candidates.length === 0) {
        logger.info("[urlScanner] Re-scan: no links due for re-check");
        return;
      }

      logger.info(
        `[urlScanner] Re-scan: found ${candidates.length} link(s) due for re-check`,
      );

      // Small concurrency window — re-scanning is a background maintenance
      // task, not a race; keeps Firecrawl/Anthropic rate limits and cost sane.
      const CONCURRENCY = 3;
      for (let i = 0; i < candidates.length; i += CONCURRENCY) {
        const batch = candidates.slice(i, i + CONCURRENCY);
        await Promise.all(batch.map((url) => scanAndPersist(url)));
      }

      logger.info(
        `[urlScanner] Re-scan complete: ${candidates.length} link(s) processed`,
      );
    } catch (error) {
      logger.error("[urlScanner] Re-scan task failed:", error.message);
    }
  }

  // Initialize all cron jobs
  static initializeCronJobs() {
    logger.info("Initializing scheduled tasks...");

    // Payment reminders - daily at 9 AM
    cron.schedule("0 9 * * *", async () => {
      logger.info("Running payment reminder task...");
      await this.sendPaymentReminders();
    });

    // Trial ending notifications - daily at 10 AM
    cron.schedule("0 10 * * *", async () => {
      logger.info("Running trial ending notification task...");
      await this.sendTrialEndingNotifications();
    });

    // Check usage overages - daily at 11 PM
    cron.schedule("0 23 * * *", async () => {
      logger.info("Running usage overage check...");
      await this.checkUsageOverages();
    });

    // Reset monthly usage - 1st of every month at midnight
    cron.schedule("0 0 1 * *", async () => {
      logger.info("Running monthly usage reset...");
      await this.resetMonthlyUsage();
    });

    // Handle expired subscriptions - daily at midnight
    cron.schedule("0 0 * * *", async () => {
      logger.info("Running expired subscription check...");
      await this.handleExpiredSubscriptions();
    });

    // Retry failed/pending SSL — every hour
    // Catches domains where certbot failed due to DNS lag, timeouts, or rate limits.
    // Keeps retrying automatically until SSL is active — no manual intervention needed.
    cron.schedule("0 * * * *", async () => {
      await ScheduledTasks.retryFailedSSL();
    });

    // Re-scan link destinations — daily at 3 AM (off-peak)
    // Snip URL Scanner only checks a destination once, at creation.
    cron.schedule("0 3 * * *", async () => {
      logger.info("Running url-scanner re-scan task...");
      await ScheduledTasks.reScanActiveLinks();
    });

    logger.info("✓ Scheduled tasks initialized");
  }
}

module.exports = ScheduledTasks;
