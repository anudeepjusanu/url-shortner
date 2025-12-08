const User = require('../models/User');

/**
 * User Service - Business logic for user operations
 */
class UserService {
  /**
   * Get all users with filters
   */
  async getAllUsers(filters = {}, options = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      plan,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      organizationId
    } = { ...filters, ...options };

    const skip = (page - 1) * limit;
    const query = {};

    // Organization filter
    if (organizationId) {
      query.organization = organizationId;
    }

    // Search filter
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Role filter
    if (role) {
      query.role = role;
    }

    // Plan filter
    if (plan) {
      query.plan = plan;
    }

    // Active status filter
    if (isActive !== undefined) {
      query.isActive = isActive === 'true' || isActive === true;
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    try {
      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password -passwordResetToken -emailVerificationToken -apiKeys')
          .sort(sortOptions)
          .skip(skip)
          .limit(parseInt(limit))
          .populate('organization', 'name slug')
          .lean(),
        User.countDocuments(query)
      ]);

      return {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('UserService.getAllUsers error:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    try {
      const user = await User.findById(userId)
        .select('-password -passwordResetToken -emailVerificationToken')
        .populate('organization', 'name slug limits')
        .lean();

      return user;
    } catch (error) {
      console.error('UserService.getUserById error:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(organizationId = null) {
    try {
      const filter = {};
      if (organizationId) {
        filter.organization = organizationId;
      }

      const [
        totalUsers,
        activeUsers,
        roleDistribution,
        planDistribution,
        recentSignups
      ] = await Promise.all([
        User.countDocuments(filter),
        User.countDocuments({ ...filter, isActive: true }),
        User.aggregate([
          { $match: filter },
          { $group: { _id: '$role', count: { $sum: 1 } } }
        ]),
        User.aggregate([
          { $match: filter },
          { $group: { _id: '$plan', count: { $sum: 1 } } }
        ]),
        User.countDocuments({
          ...filter,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        })
      ]);

      // Format distributions
      const roleStats = {};
      roleDistribution.forEach(item => {
        roleStats[item._id] = item.count;
      });

      const planStats = {};
      planDistribution.forEach(item => {
        planStats[item._id] = item.count;
      });

      return {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        roleDistribution: roleStats,
        planDistribution: planStats,
        recentSignups
      };
    } catch (error) {
      console.error('UserService.getUserStats error:', error);
      throw error;
    }
  }

  /**
   * Update user status
   */
  async updateUserStatus(userId, updates) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      if (updates.isActive !== undefined) {
        user.isActive = updates.isActive;
      }

      if (updates.plan) {
        user.plan = updates.plan;
      }

      await user.save();
      return user;
    } catch (error) {
      console.error('UserService.updateUserStatus error:', error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      await User.findByIdAndDelete(userId);
      return true;
    } catch (error) {
      console.error('UserService.deleteUser error:', error);
      throw error;
    }
  }

  /**
   * Count users by role
   */
  async countUsersByRole() {
    try {
      const counts = await User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);

      const result = {
        super_admin: 0,
        admin: 0,
        editor: 0,
        viewer: 0,
        user: 0
      };

      counts.forEach(item => {
        result[item._id] = item.count;
      });

      return result;
    } catch (error) {
      console.error('UserService.countUsersByRole error:', error);
      throw error;
    }
  }
}

module.exports = new UserService();
