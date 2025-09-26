const Organization = require('../models/Organization');

const checkUrlAccess = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const Url = require('../models/Url');
    const url = await Url.findById(id);
    
    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }
    
    const hasAccess = url.creator.toString() === userId ||
                     (req.user.organization && url.organization?.toString() === req.user.organization.toString()) ||
                     req.user.role === 'admin';
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    req.url = url;
    next();
  } catch (error) {
    console.error('URL access check error:', error);
    res.status(500).json({
      success: false,
      message: 'Access validation failed'
    });
  }
};

const checkOrganizationAccess = (requiredActions = []) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const organizationId = req.user.organization || req.params.organizationId || req.body.organizationId;
      
      if (!organizationId) {
        return res.status(400).json({
          success: false,
          message: 'Organization ID required'
        });
      }
      
      if (req.user.role === 'admin') {
        return next();
      }
      
      const organization = await Organization.findById(organizationId);
      
      if (!organization) {
        return res.status(404).json({
          success: false,
          message: 'Organization not found'
        });
      }
      
      const member = organization.members.find(m => m.user.toString() === userId);
      
      if (!member) {
        return res.status(403).json({
          success: false,
          message: 'Not a member of this organization'
        });
      }
      
      for (const action of requiredActions) {
        if (!organization.canUserPerformAction(userId, action)) {
          return res.status(403).json({
            success: false,
            message: `Insufficient permissions for action: ${action}`
          });
        }
      }
      
      req.organization = organization;
      req.memberRole = member.role;
      next();
    } catch (error) {
      console.error('Organization access check error:', error);
      res.status(500).json({
        success: false,
        message: 'Organization access validation failed'
      });
    }
  };
};

const requirePremium = (req, res, next) => {
  if (req.user.role === 'admin') {
    return next();
  }
  
  if (req.user.role !== 'premium') {
    return res.status(403).json({
      success: false,
      message: 'Premium subscription required',
      code: 'PREMIUM_REQUIRED'
    });
  }
  
  next();
};

const checkResourceLimits = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (req.user.role === 'admin') {
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
            code: 'LIMIT_EXCEEDED'
          });
        }
        
        req.organization = organization;
      } else {
        const User = require('../models/User');
        const user = await User.findById(userId);
        
        let limitExceeded = false;
        
        switch (resourceType) {
          case 'urls':
            const Url = require('../models/Url');
            const urlCount = await Url.countDocuments({ creator: userId });
            limitExceeded = urlCount >= (user.limits.monthlyUrls || 100);
            break;
          case 'api':
            limitExceeded = false;
            break;
          default:
            limitExceeded = false;
        }
        
        if (limitExceeded) {
          return res.status(429).json({
            success: false,
            message: `User ${resourceType} limit exceeded`,
            code: 'LIMIT_EXCEEDED'
          });
        }
      }
      
      next();
    } catch (error) {
      console.error('Resource limit check error:', error);
      res.status(500).json({
        success: false,
        message: 'Resource limit validation failed'
      });
    }
  };
};

const checkFeatureAccess = (feature) => {
  return (req, res, next) => {
    const featurePermissions = {
      'custom_domains': ['premium', 'admin'],
      'analytics_export': ['premium', 'admin'],
      'bulk_operations': ['premium', 'admin'],
      'api_access': ['premium', 'admin'],
      'password_protection': ['premium', 'admin'],
      'utm_parameters': ['premium', 'admin'],
      'geo_restrictions': ['premium', 'admin'],
      'custom_branding': ['premium', 'admin']
    };
    
    const requiredRoles = featurePermissions[feature];
    
    if (!requiredRoles || requiredRoles.includes(req.user.role)) {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: `Feature '${feature}' requires premium subscription`,
      code: 'FEATURE_RESTRICTED',
      feature
    });
  };
};

const validateOwnership = (Model, idParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[idParam];
      const userId = req.user.id;
      
      const resource = await Model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }
      
      if (req.user.role === 'admin') {
        req.resource = resource;
        return next();
      }
      
      const isOwner = resource.creator?.toString() === userId ||
                     resource.owner?.toString() === userId ||
                     resource.user?.toString() === userId;
      
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - not the owner'
        });
      }
      
      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Ownership validation failed'
      });
    }
  };
};

const requireVerifiedEmail = (req, res, next) => {
  if (!req.user.isEmailVerified && process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: 'Email verification required',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }
  
  next();
};

const checkSubscriptionStatus = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      return next();
    }
    
    const User = require('../models/User');
    const user = await User.findById(req.user.id).populate('organization');
    
    if (user.organization && !user.organization.isSubscriptionActive) {
      return res.status(402).json({
        success: false,
        message: 'Organization subscription expired',
        code: 'SUBSCRIPTION_EXPIRED'
      });
    }
    
    if (!user.organization && user.subscription.plan !== 'free' && 
        (!user.subscription.endDate || user.subscription.endDate < new Date())) {
      return res.status(402).json({
        success: false,
        message: 'User subscription expired',
        code: 'SUBSCRIPTION_EXPIRED'
      });
    }
    
    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    res.status(500).json({
      success: false,
      message: 'Subscription validation failed'
    });
  }
};

module.exports = {
  checkUrlAccess,
  checkOrganizationAccess,
  requirePremium,
  checkResourceLimits,
  checkFeatureAccess,
  validateOwnership,
  requireVerifiedEmail,
  checkSubscriptionStatus
};