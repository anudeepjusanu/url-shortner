const User = require('../models/User');

/**
 * Middleware to check if user has specific permission
 * @param {string} resource - Resource name (e.g., 'urls', 'domains')
 * @param {string} action - Action name (e.g., 'create', 'read', 'update', 'delete')
 */
const checkPermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Fetch full user object with permissions
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user has the required permission
      if (!user.hasPermission(resource, action)) {
        return res.status(403).json({
          success: false,
          message: `You don't have permission to ${action} ${resource}`,
          requiredPermission: `${resource}.${action}`,
          userRole: user.role
        });
      }

      // Attach user permissions to request for later use
      req.userPermissions = user.permissions;
      req.userRole = user.role;

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission validation failed'
      });
    }
  };
};

/**
 * Middleware to check if user has any of the specified roles
 * @param {string[]} roles - Array of allowed roles
 */
const requireRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions - role not authorized',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Middleware to require super_admin role
 */
const requireSuperAdmin = requireRoles(['super_admin']);

/**
 * Middleware to require admin or super_admin role
 */
const requireAdminOrAbove = requireRoles(['admin', 'super_admin']);

/**
 * Middleware to require at least editor role
 */
const requireEditorOrAbove = requireRoles(['editor', 'admin', 'super_admin']);

/**
 * Check if user can access a specific resource based on ownership
 * Admins can access any resource, others only their own
 */
const checkOwnership = (Model, idParam = 'id', ownerField = 'creator') => {
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

      // Admins and super admins can access any resource
      if (req.user.role === 'admin' || req.user.role === 'super_admin') {
        req.resource = resource;
        return next();
      }

      // Check ownership
      const ownerId = resource[ownerField]?.toString() || resource.user?.toString() || resource.owner?.toString();

      if (ownerId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - you do not own this resource'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        message: 'Ownership validation failed'
      });
    }
  };
};

/**
 * Get user's effective permissions
 * Returns all permissions for the current user
 */
const getUserPermissions = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const user = await User.findById(req.user.id).select('role permissions');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Build complete permission set
    const permissions = {
      role: user.role,
      permissions: user.permissions || {},
      canAccess: {
        urls: {
          create: user.hasPermission('urls', 'create'),
          read: user.hasPermission('urls', 'read'),
          update: user.hasPermission('urls', 'update'),
          delete: user.hasPermission('urls', 'delete')
        },
        domains: {
          create: user.hasPermission('domains', 'create'),
          read: user.hasPermission('domains', 'read'),
          update: user.hasPermission('domains', 'update'),
          delete: user.hasPermission('domains', 'delete'),
          verify: user.hasPermission('domains', 'verify')
        },
        analytics: {
          view: user.hasPermission('analytics', 'view'),
          export: user.hasPermission('analytics', 'export')
        },
        qrCodes: {
          create: user.hasPermission('qrCodes', 'create'),
          download: user.hasPermission('qrCodes', 'download'),
          customize: user.hasPermission('qrCodes', 'customize')
        },
        users: {
          create: user.hasPermission('users', 'create'),
          read: user.hasPermission('users', 'read'),
          update: user.hasPermission('users', 'update'),
          delete: user.hasPermission('users', 'delete')
        },
        settings: {
          update: user.hasPermission('settings', 'update')
        }
      }
    };

    req.userPermissions = permissions;
    next();
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve permissions'
    });
  }
};

module.exports = {
  checkPermission,
  requireRoles,
  requireSuperAdmin,
  requireAdminOrAbove,
  requireEditorOrAbove,
  checkOwnership,
  getUserPermissions
};
