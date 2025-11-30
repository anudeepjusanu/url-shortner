const User = require('../models/User');

/**
 * Get user's own permissions
 */
const getMyPermissions = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('role permissions');

    if (!user) {
      return res.status(404).json({
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

    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve permissions'
    });
  }
};

/**
 * Get all available roles and their default permissions
 * Admin only
 */
const getAllRoles = async (req, res) => {
  try {
    const roles = {
      super_admin: {
        name: 'Super Admin',
        description: 'Full system access with all permissions',
        level: 5,
        permissions: {
          urls: { create: true, read: true, update: true, delete: true },
          domains: { create: true, read: true, update: true, delete: true, verify: true },
          analytics: { view: true, export: true },
          qrCodes: { create: true, download: true, customize: true },
          users: { create: true, read: true, update: true, delete: true },
          settings: { update: true }
        }
      },
      admin: {
        name: 'Admin',
        description: 'Full access within organization/account',
        level: 4,
        permissions: {
          urls: { create: true, read: true, update: true, delete: true },
          domains: { create: true, read: true, update: true, delete: true, verify: true },
          analytics: { view: true, export: true },
          qrCodes: { create: true, download: true, customize: true },
          users: { create: true, read: true, update: true, delete: true },
          settings: { update: true }
        }
      },
      editor: {
        name: 'Editor',
        description: 'Can create, edit, and delete URLs, domains, and QR codes',
        level: 3,
        permissions: {
          urls: { create: true, read: true, update: true, delete: true },
          domains: { create: true, read: true, update: true, delete: true, verify: true },
          analytics: { view: true, export: true },
          qrCodes: { create: true, download: true, customize: true },
          users: { create: false, read: false, update: false, delete: false },
          settings: { update: true }
        }
      },
      viewer: {
        name: 'Viewer',
        description: 'Read-only access to view URLs and analytics',
        level: 2,
        permissions: {
          urls: { create: false, read: true, update: false, delete: false },
          domains: { create: false, read: true, update: false, delete: false, verify: false },
          analytics: { view: true, export: false },
          qrCodes: { create: false, download: true, customize: false },
          users: { create: false, read: false, update: false, delete: false },
          settings: { update: false }
        }
      },
      user: {
        name: 'User',
        description: 'Basic user access with standard permissions',
        level: 1,
        permissions: {
          urls: { create: true, read: true, update: true, delete: true },
          domains: { create: false, read: true, update: false, delete: false, verify: false },
          analytics: { view: true, export: false },
          qrCodes: { create: true, download: true, customize: true },
          users: { create: false, read: false, update: false, delete: false },
          settings: { update: true }
        }
      }
    };

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve roles'
    });
  }
};

/**
 * Update user role
 * Admin only - can update roles of users in their organization
 * Super admin can update any user's role
 */
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    const validRoles = ['user', 'viewer', 'editor', 'admin', 'super_admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    // Find target user
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Permission checks
    if (req.user.role === 'admin') {
      // Admin can only update users in their organization
      if (!req.user.organization || targetUser.organization?.toString() !== req.user.organization.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only update roles for users in your organization'
        });
      }

      // Admin cannot assign super_admin role
      if (role === 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Admins cannot assign super_admin role'
        });
      }

      // Admin cannot modify another admin's role
      if (targetUser.role === 'admin' || targetUser.role === 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'You cannot modify admin or super_admin roles'
        });
      }
    }

    // Super admin can update anyone except they cannot demote themselves
    if (req.user.role === 'super_admin' && req.user.id === userId && role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Super admins cannot demote themselves'
      });
    }

    // Update role
    targetUser.role = role;
    await targetUser.save(); // This will trigger setDefaultPermissions via pre-save hook

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: {
        userId: targetUser._id,
        email: targetUser.email,
        role: targetUser.role,
        permissions: targetUser.permissions
      }
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role'
    });
  }
};

/**
 * Update user permissions (custom permissions)
 * Admin only - for fine-grained permission control
 */
const updateUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body;

    // Find target user
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Permission checks
    if (req.user.role === 'admin') {
      // Admin can only update users in their organization
      if (!req.user.organization || targetUser.organization?.toString() !== req.user.organization.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only update permissions for users in your organization'
        });
      }

      // Admin cannot modify admin or super_admin permissions
      if (targetUser.role === 'admin' || targetUser.role === 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'You cannot modify admin or super_admin permissions'
        });
      }
    }

    // Update permissions
    if (permissions) {
      targetUser.permissions = {
        ...targetUser.permissions,
        ...permissions
      };
      await targetUser.save();
    }

    res.json({
      success: true,
      message: 'User permissions updated successfully',
      data: {
        userId: targetUser._id,
        email: targetUser.email,
        role: targetUser.role,
        permissions: targetUser.permissions
      }
    });
  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user permissions'
    });
  }
};

/**
 * Get all users with their roles (for admin panel)
 * Admin and Super Admin only
 */
const getUsersWithRoles = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;

    const query = {};

    // Admin can only see users in their organization
    if (req.user.role === 'admin') {
      if (!req.user.organization) {
        return res.json({
          success: true,
          data: {
            users: [],
            pagination: { page: 1, limit: 20, total: 0, pages: 0 }
          }
        });
      }
      query.organization = req.user.organization;
    }

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Search by email or name
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .select('email firstName lastName role isActive createdAt lastLogin organization')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('organization', 'name slug');

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get users with roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users'
    });
  }
};

module.exports = {
  getMyPermissions,
  getAllRoles,
  updateUserRole,
  updateUserPermissions,
  getUsersWithRoles
};
