const User = require('../models/User');
const Url = require('../models/Url');
const Domain = require('../models/Domain');
const { cacheGet, cacheSet, cacheDel } = require('../config/redis');
const userService = require('../services/userService');

/**
 * Get all users with filters (admin and super_admin only)
 */
const getAllUsers = async (req, res) => {
  try {
    const {
      page,
      limit,
      search,
      role,
      plan,
      isActive,
      sortBy,
      sortOrder
    } = req.query;

    // Determine organization filter
    const organizationId = (req.user.role === 'admin' && req.user.organization) 
      ? req.user.organization 
      : null;

    const result = await userService.getAllUsers(
      { search, role, plan, isActive, organizationId },
      { page, limit, sortBy, sortOrder }
    );

    console.log(`Found ${result.pagination.total} users`);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get single user details (admin and super_admin only)
 */
const getUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-password -passwordResetToken -emailVerificationToken')
      .populate('organization', 'name slug limits');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Admin can only view users in their organization
    if (req.user.role === 'admin') {
      if (!req.user.organization || user.organization?.toString() !== req.user.organization.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only view users in your organization'
        });
      }
    }

    // Get user's URL count
    const urlCount = await Url.countDocuments({ creator: userId });

    // Get user's domain count
    const domainCount = await Domain.countDocuments({ owner: userId });

    // Prepare user object with lastLogin fallback
    const userObj = user.toObject();
    // If lastLogin is null, use createdAt (registration date)
    if (!userObj.lastLogin) {
      userObj.lastLogin = userObj.createdAt;
    }

    res.json({
      success: true,
      data: {
        user: userObj,
        stats: {
          urlCount,
          domainCount,
          totalClicks: user.usage?.urlsCreatedTotal || 0
        }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details'
    });
  }
};

/**
 * Update user status (activate/deactivate) and plan
 */
const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive, plan } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Admin can only update users in their organization
    if (req.user.role === 'admin') {
      if (!req.user.organization || user.organization?.toString() !== req.user.organization.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only update users in your organization'
        });
      }

      // Admin cannot modify admin or super_admin
      if (user.role === 'admin' || user.role === 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'You cannot modify admin or super_admin users'
        });
      }
    }

    // Update fields
    if (typeof isActive === 'boolean') {
      user.isActive = isActive;
    }

    if (plan && ['free', 'pro', 'enterprise'].includes(plan)) {
      user.plan = plan;
    }

    await user.save();

    // Clear user cache
    await cacheDel(`user:${userId}`);

    res.json({
      success: true,
      message: 'User status updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
};

/**
 * Delete user and all associated data
 */
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Admin can only delete users in their organization
    if (req.user.role === 'admin') {
      if (!req.user.organization || user.organization?.toString() !== req.user.organization.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete users in your organization'
        });
      }

      // Admin cannot delete admin or super_admin
      if (user.role === 'admin' || user.role === 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'You cannot delete admin or super_admin users'
        });
      }
    }

    // Prevent self-deletion
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Delete user's URLs
    await Url.deleteMany({ creator: userId });

    // Delete user's domains
    await Domain.deleteMany({ owner: userId });

    // Delete the user
    await User.findByIdAndDelete(userId);

    // Clear user cache
    await cacheDel(`user:${userId}`);

    res.json({
      success: true,
      message: 'User and associated data deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

/**
 * Get user statistics
 */
const getUserStats = async (req, res) => {
  try {
    // Determine organization filter
    const organizationId = (req.user.role === 'admin' && req.user.organization) 
      ? req.user.organization 
      : null;

    const stats = await userService.getUserStats(organizationId);

    console.log('User stats:', stats);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAllUsers,
  getUser,
  updateUserStatus,
  deleteUser,
  getUserStats
};
