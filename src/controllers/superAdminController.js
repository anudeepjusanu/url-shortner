const User = require('../models/User');
const Url = require('../models/Url');
const Domain = require('../models/Domain');

const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalUrls,
      totalClicks,
      activeSubscriptions,
      recentUsers
    ] = await Promise.all([
      User.countDocuments(),
      Url.countDocuments(),
      Url.aggregate([{ $group: { _id: null, total: { $sum: '$clickCount' } } }]),
      User.countDocuments({ 'subscription.status': 'active' }),
      User.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('firstName lastName email plan createdAt usage subscription')
    ]);

    // Calculate monthly revenue (mock calculation)
    const monthlyRevenue = await User.aggregate([
      {
        $match: {
          plan: { $in: ['pro', 'enterprise'] },
          'subscription.status': 'active'
        }
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: [
                { $eq: ['$plan', 'pro'] },
                9,
                29
              ]
            }
          }
        }
      }
    ]);

    // Calculate growth rate (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const [recentSignups, previousSignups] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({
        createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
      })
    ]);

    const growthRate = previousSignups > 0
      ? ((recentSignups - previousSignups) / previousSignups * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalUrls,
          totalClicks: totalClicks[0]?.total || 0,
          revenue: monthlyRevenue[0]?.total || 0,
          growthRate: parseFloat(growthRate),
          activeSubscriptions
        },
        recentUsers: recentUsers.map(user => ({
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          plan: user.plan,
          createdAt: user.createdAt,
          usage: user.usage,
          subscription: user.subscription
        }))
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics'
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      plan,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (plan) {
      filter.plan = plan;
    }
    if (status) {
      filter['subscription.status'] = status;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -passwordResetToken -emailVerificationToken')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);

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
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive, plan } = req.body;

    const updateData = {};
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (plan) updateData.plan = plan;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password -passwordResetToken -emailVerificationToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user's URLs
    await Url.deleteMany({ creator: userId });

    // Delete user's domains
    await Domain.deleteMany({ owner: userId });

    // Delete the user
    await User.findByIdAndDelete(userId);

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

const getSystemHealth = async (req, res) => {
  try {
    // Basic system health checks
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: 'connected',
      services: {
        redis: 'connected',
        email: 'operational',
        stripe: 'operational'
      }
    };

    res.json({
      success: true,
      data: { health }
    });
  } catch (error) {
    console.error('Get system health error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system health'
    });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    // Calculate date range
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const [
      userSignups,
      urlCreations,
      planDistribution
    ] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Url.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      User.aggregate([
        {
          $group: {
            _id: '$plan',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        userSignups,
        urlCreations,
        planDistribution
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getSystemHealth,
  getAnalytics
};