const Organization = require("../models/Organization");
const logger = require("../config/logger");

const requirePremium = (req, res, next) => {
  if (req.user.role === "admin") {
    return next();
  }

  if (req.user.role !== "premium") {
    return res.status(403).json({
      success: false,
      message: "Premium subscription required",
      code: "PREMIUM_REQUIRED",
    });
  }

  next();
};

const checkResourceLimits = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (req.user.role === "admin") {
        return next();
      }

      const userId = req.user.id;
      const organizationId = req.user.organization;

      if (organizationId) {
        const organization = await Organization.findById(organizationId);

        if (!organization.isWithinLimits(resourceType)) {
          return res.status(429).json({
            success: false,
            message: `Organization ${resourceType} limit exceeded`,
            code: "LIMIT_EXCEEDED",
          });
        }

        req.organization = organization;
      } else {
        const User = require("../models/User");
        const user = await User.findById(userId);

        let limitExceeded = false;

        switch (resourceType) {
          case "urls":
            const Url = require("../models/Url");
            const urlCount = await Url.countDocuments({ creator: userId });
            limitExceeded = urlCount >= (user.limits.monthlyUrls || 100);
            break;
          case "api":
            limitExceeded = false;
            break;
          default:
            limitExceeded = false;
        }

        if (limitExceeded) {
          return res.status(429).json({
            success: false,
            message: `User ${resourceType} limit exceeded`,
            code: "LIMIT_EXCEEDED",
          });
        }
      }

      next();
    } catch (error) {
      logger.error("Resource limit check error:", error);
      res.status(500).json({
        success: false,
        message: "Resource limit validation failed",
      });
    }
  };
};

const checkFeatureAccess = (feature) => {
  return (req, res, next) => {
    const featurePermissions = {
      custom_domains: ["pro", "enterprise"],
      analytics_export: ["pro", "enterprise"],
      bulk_operations: ["pro", "enterprise"],
      api_access: ["pro", "enterprise"],
      password_protection: ["pro", "enterprise"],
      utm_parameters: ["pro", "enterprise"],
      geo_restrictions: ["pro", "enterprise"],
      custom_branding: ["enterprise"],
    };

    const adminRoles = ["admin", "super_admin"];
    const requiredPlans = featurePermissions[feature];

    if (
      !requiredPlans ||
      adminRoles.includes(req.user.role) ||
      requiredPlans.includes(req.user.plan)
    ) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Feature '${feature}' requires premium subscription`,
      code: "FEATURE_RESTRICTED",
      feature,
    });
  };
};

const validateOwnership = (Model, idParam = "id") => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[idParam];
      const userId = req.user.id;

      const resource = await Model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: "Resource not found",
        });
      }

      if (req.user.role === "admin") {
        req.resource = resource;
        return next();
      }

      const isOwner =
        resource.creator?.toString() === userId ||
        resource.owner?.toString() === userId ||
        resource.user?.toString() === userId;

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: "Access denied - not the owner",
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      logger.error("Ownership validation error:", error);
      res.status(500).json({
        success: false,
        message: "Ownership validation failed",
      });
    }
  };
};

const requireVerifiedEmail = (req, res, next) => {
  if (!req.user.isEmailVerified && process.env.NODE_ENV === "production") {
    return res.status(403).json({
      success: false,
      message: "Email verification required",
      code: "EMAIL_NOT_VERIFIED",
    });
  }

  next();
};

const checkSubscriptionStatus = async (req, res, next) => {
  try {
    if (req.user.role === "admin") {
      return next();
    }

    const User = require("../models/User");
    const user = await User.findById(req.user.id).populate("organization");

    if (user.organization && !user.organization.isSubscriptionActive) {
      return res.status(402).json({
        success: false,
        message: "Organization subscription expired",
        code: "SUBSCRIPTION_EXPIRED",
      });
    }

    if (
      !user.organization &&
      user.subscription.plan !== "free" &&
      (!user.subscription.endDate || user.subscription.endDate < new Date())
    ) {
      return res.status(402).json({
        success: false,
        message: "User subscription expired",
        code: "SUBSCRIPTION_EXPIRED",
      });
    }

    next();
  } catch (error) {
    logger.error("Subscription check error:", error);
    res.status(500).json({
      success: false,
      message: "Subscription validation failed",
    });
  }
};

module.exports = {
  requirePremium,
  checkResourceLimits,
  checkFeatureAccess,
  validateOwnership,
  requireVerifiedEmail,
  checkSubscriptionStatus,
};
