const User = require('../models/User');
const Plan = require('../models/Plan');

class UsageTracker {
  // Check if user can perform action
  static async canPerformAction(userId, action, amount = 1) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return { allowed: false, reason: 'User not found' };
      }

      // Reset monthly usage if needed
      await this.resetMonthlyUsageIfNeeded(user);

      const plan = await Plan.getByName(user.plan);
      if (!plan) {
        return { allowed: false, reason: 'Invalid plan' };
      }

      // Check specific action limits
      switch (action) {
        case 'createUrl':
          if (plan.features.urlsPerMonth === -1) {
            return { allowed: true };
          }

          const canCreate = (user.usage.urlsCreatedThisMonth + amount) <= plan.features.urlsPerMonth;
          if (!canCreate) {
            return {
              allowed: false,
              reason: `Monthly URL limit reached (${plan.features.urlsPerMonth})`,
              limit: plan.features.urlsPerMonth,
              current: user.usage.urlsCreatedThisMonth
            };
          }
          return { allowed: true };

        case 'addCustomDomain':
          const canAddDomain = (user.usage.customDomainsCount + amount) <= plan.features.customDomains;
          if (!canAddDomain) {
            return {
              allowed: false,
              reason: `Custom domain limit reached (${plan.features.customDomains})`,
              limit: plan.features.customDomains,
              current: user.usage.customDomainsCount
            };
          }
          return { allowed: true };

        case 'apiCall':
          if (!plan.features.apiAccess) {
            return {
              allowed: false,
              reason: 'API access not available in your plan'
            };
          }
          return { allowed: true };

        case 'bulkOperation':
          if (!plan.features.bulkOperations) {
            return {
              allowed: false,
              reason: 'Bulk operations not available in your plan'
            };
          }
          return { allowed: true };

        case 'passwordProtection':
          if (!plan.features.passwordProtection) {
            return {
              allowed: false,
              reason: 'Password protection not available in your plan'
            };
          }
          return { allowed: true };

        default:
          return { allowed: true };
      }
    } catch (error) {
      console.error('Usage check error:', error);
      return { allowed: false, reason: 'Usage check failed' };
    }
  }

  // Track usage for an action
  static async trackUsage(userId, action, amount = 1) {
    try {
      const user = await User.findById(userId);
      if (!user) return false;

      await this.resetMonthlyUsageIfNeeded(user);

      const updateFields = {};

      switch (action) {
        case 'createUrl':
          updateFields['usage.urlsCreatedThisMonth'] = user.usage.urlsCreatedThisMonth + amount;
          updateFields['usage.urlsCreatedTotal'] = user.usage.urlsCreatedTotal + amount;
          break;

        case 'addCustomDomain':
          updateFields['usage.customDomainsCount'] = user.usage.customDomainsCount + amount;
          break;

        case 'removeCustomDomain':
          updateFields['usage.customDomainsCount'] = Math.max(0, user.usage.customDomainsCount - amount);
          break;

        case 'apiCall':
          updateFields['usage.apiCallsThisMonth'] = user.usage.apiCallsThisMonth + amount;
          break;
      }

      if (Object.keys(updateFields).length > 0) {
        await User.findByIdAndUpdate(userId, { $set: updateFields });
      }

      // Check if user needs usage warning
      await this.checkUsageWarnings(userId);

      return true;
    } catch (error) {
      console.error('Usage tracking error:', error);
      return false;
    }
  }

  // Reset monthly usage if new month
  static async resetMonthlyUsageIfNeeded(user) {
    const now = new Date();
    const lastReset = new Date(user.usage.lastResetDate);

    // Check if it's a new month
    if (now.getFullYear() !== lastReset.getFullYear() ||
        now.getMonth() !== lastReset.getMonth()) {

      await User.findByIdAndUpdate(user._id, {
        $set: {
          'usage.urlsCreatedThisMonth': 0,
          'usage.apiCallsThisMonth': 0,
          'usage.lastResetDate': now
        }
      });
    }
  }

  // Check if user needs usage warnings
  static async checkUsageWarnings(userId) {
    try {
      const user = await User.findById(userId);
      const plan = await Plan.getByName(user.plan);

      if (!plan || plan.features.urlsPerMonth === -1) return;

      const usagePercentage = (user.usage.urlsCreatedThisMonth / plan.features.urlsPerMonth) * 100;

      // Send warning at 80% and 95%
      if (usagePercentage >= 80 && usagePercentage < 95) {
        const emailService = require('../services/emailService');
        await emailService.sendUsageLimitWarning(user, Math.round(usagePercentage));
      }
    } catch (error) {
      console.error('Usage warning check error:', error);
    }
  }

  // Get user's current usage and limits
  static async getUserUsage(userId) {
    try {
      const user = await User.findById(userId);
      const plan = await Plan.getByName(user.plan);

      if (!user || !plan) return null;

      await this.resetMonthlyUsageIfNeeded(user);

      return {
        plan: {
          name: plan.name,
          displayName: plan.displayName,
          features: plan.features
        },
        usage: user.usage,
        limits: {
          urlsPerMonth: plan.features.urlsPerMonth,
          customDomains: plan.features.customDomains,
          urlsPercentage: plan.features.urlsPerMonth === -1 ? 0 :
            (user.usage.urlsCreatedThisMonth / plan.features.urlsPerMonth) * 100
        }
      };
    } catch (error) {
      console.error('Get usage error:', error);
      return null;
    }
  }
}

// Middleware to check usage before action
const checkUsageLimit = (action) => {
  return async (req, res, next) => {
    try {
      const check = await UsageTracker.canPerformAction(req.user.id, action);

      if (!check.allowed) {
        return res.status(403).json({
          success: false,
          message: check.reason,
          code: 'USAGE_LIMIT_EXCEEDED',
          data: {
            limit: check.limit,
            current: check.current,
            action: action
          }
        });
      }

      next();
    } catch (error) {
      console.error('Usage limit check error:', error);
      next(error);
    }
  };
};

module.exports = {
  UsageTracker,
  checkUsageLimit
};