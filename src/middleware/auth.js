const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { cacheGet } = require('../config/redis');
const config = require('../config/environment');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }
    
    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    let user = await cacheGet(`user:${decoded.userId}`);
    
    if (!user) {
      user = await User.findById(decoded.userId)
        .populate('organization', 'name slug limits')
        .select('-password -passwordResetToken -emailVerificationToken');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }
    }
    console.log('Authenticated user:', user);
    console.log('User isActive status:', user.isActive);
    console.log('User from cache?', !!await cacheGet(`user:${decoded.userId}`));

    // Temporarily disabled for debugging
    // if (!user.isActive) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Account deactivated'
    //   });
    // }

    // Ensure consistent user ID format
    const userId = user._id ? user._id.toString() : user.id?.toString();
    const orgId = user.organization?._id ? user.organization._id.toString() : user.organization?.toString();

    req.user = {
      id: userId,
      email: user.email,
      role: user.role,
      organization: orgId,
      isActive: user.isActive
    };

    console.log('Authenticated user:', {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      organization: req.user.organization,
      isActive: req.user.isActive
    });
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    let user = await cacheGet(`user:${decoded.userId}`);
    
    if (!user) {
      user = await User.findById(decoded.userId)
        .populate('organization', 'name slug')
        .select('-password -passwordResetToken -emailVerificationToken');
    }
    
    if (user && user.isActive) {
      req.user = {
        id: user._id || user.id,
        email: user.email,
        role: user.role,
        organization: user.organization?._id || user.organization
      };
    } else {
      req.user = null;
    }
    
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const userRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!userRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    next();
  };
};

const requireAdmin = requireRole(['admin']);

const apiKeyAuth = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key required'
      });
    }
    
    console.log('API Key auth attempt with key:', apiKey.substring(0, 8) + '...');
    
    const user = await User.findOne({
      'apiKeys.key': apiKey,
      'apiKeys.isActive': true
    }).populate('organization', 'name slug limits');
    
    if (!user) {
      console.log('No user found with this API key');
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }
    console.log('Authenticated user via API key:', user.email);
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account deactivated'
      });
    }
    
    const apiKeyObj = user.apiKeys.find(key => key.key === apiKey);
    apiKeyObj.lastUsed = new Date();
    await user.save();
    
    // Ensure consistent user ID format for API key auth
    const userId = user._id.toString();
    const orgId = user.organization?._id ? user.organization._id.toString() : null;

    req.user = {
      id: userId,
      email: user.email,
      role: user.role,
      organization: orgId,
      apiKey: true,
      isActive: user.isActive
    };
    
    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Combined auth middleware - accepts either Bearer token OR API key
const authenticateAny = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];
  
  // If API key is provided, use API key auth
  if (apiKey) {
    return apiKeyAuth(req, res, next);
  }
  
  // Otherwise, use Bearer token auth
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticate(req, res, next);
  }
  
  // No authentication provided
  return res.status(401).json({
    success: false,
    message: 'Authentication required. Provide either Bearer token or X-API-Key header.'
  });
};

const rateLimitByUser = (req, res, next) => {
  if (!req.user) {
    return next();
  }
  
  req.rateLimit = {
    keyGenerator: () => `user:${req.user.id}`,
    max: req.user.role === 'premium' ? 1000 : req.user.role === 'admin' ? 5000 : 100
  };
  
  next();
};

module.exports = {
  authenticate,
  optionalAuth,
  requireRole,
  requireAdmin,
  apiKeyAuth,
  authenticateAny,
  rateLimitByUser
};