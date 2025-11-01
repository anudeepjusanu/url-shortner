const User = require('../models/User');
const Url = require('../models/Url');
const Organization = require('../models/Organization');
const { Click } = require('../models/Analytics');

const getSystemStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalUrls,
      totalClicks,
      totalOrganizations,
      activeUsers,
      recentUsers,
      topUrls
    ] = await Promise.all([
      User.countDocuments(),
      Url.countDocuments(),
      Click.countDocuments({ isBot: { $ne: true } }),
      Organization.countDocuments(),
      User.countDocuments({ 
        lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      User.find().sort({ createdAt: -1 }).limit(10).select('firstName lastName email createdAt'),
      Url.find().sort({ clickCount: -1 }).limit(10)
        .populate('creator', 'firstName lastName email')
        .select('title shortCode clickCount createdAt')
    ]);
    
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const [
      newUsersLast30Days,
      newUrlsLast30Days,
      clicksLast30Days
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: last30Days } }),
      Url.countDocuments({ createdAt: { $gte: last30Days } }),
      Click.countDocuments({ 
        timestamp: { $gte: last30Days },
        isBot: { $ne: true }
      })
    ]);
    
    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalUrls,
          totalClicks,
          totalOrganizations,
          activeUsers
        },
        growth: {
          newUsersLast30Days,
          newUrlsLast30Days,
          clicksLast30Days
        },
        recentUsers,
        topUrls
      }
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system statistics'
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (page - 1) * limit;
    const filter = {};
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      filter.role = role;
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('organization', 'name slug')
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
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, isActive, limits } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const updateData = {};
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (limits !== undefined) updateData.limits = { ...user.limits, ...limits };
    
    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true })
      .populate('organization', 'name slug');
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin user'
      });
    }
    
    await Promise.all([
      User.findByIdAndDelete(id),
      Url.updateMany({ creator: id }, { isActive: false })
    ]);
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

const getAllUrls = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (page - 1) * limit;
    const filter = {};
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { originalUrl: { $regex: search, $options: 'i' } },
        { shortCode: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const [urls, total] = await Promise.all([
      Url.find(filter)
        .populate('creator', 'firstName lastName email')
        .populate('organization', 'name slug')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Url.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      data: {
        urls,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all URLs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch URLs'
    });
  }
};

const updateUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, title, description } = req.body;
    
    const url = await Url.findById(id);
    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }
    
    const updateData = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    
    const updatedUrl = await Url.findByIdAndUpdate(id, updateData, { new: true })
      .populate('creator', 'firstName lastName email')
      .populate('organization', 'name slug');
    
    res.json({
      success: true,
      message: 'URL updated successfully',
      data: { url: updatedUrl }
    });
  } catch (error) {
    console.error('Update URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update URL'
    });
  }
};

const deleteUrl = async (req, res) => {
  try {
    const { id } = req.params;
    
    const url = await Url.findById(id);
    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }
    
    await Url.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'URL deleted successfully'
    });
  } catch (error) {
    console.error('Delete URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete URL'
    });
  }
};

const getOrganizations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (page - 1) * limit;
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const [organizations, total] = await Promise.all([
      Organization.find(filter)
        .populate('owner', 'firstName lastName email')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Organization.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      data: {
        organizations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organizations'
    });
  }
};

module.exports = {
  getSystemStats,
  getUsers,
  updateUser,
  deleteUser,
  getAllUrls,
  updateUrl,
  deleteUrl,
  getOrganizations
};