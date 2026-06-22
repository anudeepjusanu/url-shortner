const User = require('../models/User');
const Url = require('../models/Url');
const Domain = require('../models/Domain');
const BioPage = require('../models/BioPage');
const Organization = require('../models/Organization');
const { Click } = require('../models/Analytics');
const QRCode = require('../models/QRCode');
const DynamicQRCode = require('../models/DynamicQRCode');
const { cacheDel } = require('../config/redis');
const { normalizeEmail } = require('../utils/normalizeEmail');

const getSystemStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalUrls,
      totalClicks,
      totalOrganizations,
      totalDomains,
      totalBioPages,
      activeUsers,
      usersWithLinks,
      recentUsers,
      topUrls,
      totalStaticQRCodes,
      totalDynamicQRCodes,
      sourceLanding,
      sourceDashboard,
      sourceApi,
      sourceBulk
    ] = await Promise.all([
      User.countDocuments(),
      Url.countDocuments(),
      Click.countDocuments({ isBot: { $ne: true } }),
      Organization.countDocuments(),
      Domain.countDocuments(),
      BioPage.countDocuments(),
      User.countDocuments({
        lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      Url.distinct('creator').then(ids => User.countDocuments({ _id: { $in: ids } })),
      User.find().sort({ createdAt: -1 }).limit(10).select('firstName lastName email createdAt'),
      Url.find().sort({ clickCount: -1 }).limit(10)
        .populate('creator', 'firstName lastName email')
        .select('title shortCode clickCount createdAt'),
      QRCode.countDocuments(),
      DynamicQRCode.countDocuments(),
      Url.distinct('creator', { source: 'landing' }).then(ids => ids.length),
      Url.distinct('creator', { source: 'dashboard' }).then(ids => ids.length),
      Url.distinct('creator', { source: 'api' }).then(ids => ids.length),
      Url.distinct('creator', { source: 'bulk' }).then(ids => ids.length)
    ]);
    const apiUsers = sourceApi;
    const avgLinksPerUser = totalUsers > 0
      ? Math.round((totalUrls / totalUsers) * 10) / 10
      : 0;
    
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const [
      newUsersLast30Days,
      newUrlsLast30Days,
      newBioPagesLast30Days,
      clicksLast30Days
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: last30Days } }),
      Url.countDocuments({ createdAt: { $gte: last30Days } }),
      BioPage.countDocuments({ createdAt: { $gte: last30Days } }),
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
          totalDomains,
          totalBioPages,
          activeUsers,
          usersWithLinks,
          avgLinksPerUser,
          totalQRCodes: totalStaticQRCodes + totalDynamicQRCodes,
          apiUsers,
          linkSources: {
            landing: sourceLanding,
            dashboard: sourceDashboard,
            api: sourceApi,
            bulk: sourceBulk
          }
        },
        growth: {
          newUsersLast30Days,
          newUrlsLast30Days,
          newBioPagesLast30Days,
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
      startDate,
      endDate,
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
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
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
    
    // Map users to include fallback lastLogin (use createdAt if never logged in)
    const usersWithLastLogin = users.map(user => {
      const userObj = user.toObject();
      // If lastLogin is null, use createdAt (registration date)
      if (!userObj.lastLogin) {
        userObj.lastLogin = userObj.createdAt;
      }
      return userObj;
    });
    
    res.json({
      success: true,
      data: {
        users: usersWithLastLogin,
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
    const { role, isActive, limits, email } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only super admins can edit another super admin's profile
    if (user.role === 'super_admin' && req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admins can edit super admin profiles'
      });
    }

    const updateData = {};
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (limits !== undefined) updateData.limits = { ...user.limits, ...limits };
    if (email !== undefined) updateData.email = normalizeEmail(email);

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

    if (user.role === 'super_admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete super admin user'
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

const bulkDeleteUsers = async (req, res) => {
  try {
    const { emails, ids } = req.body;

    const targetIds = new Set();
    const notFound = [];
    const errors = [];

    // Resolve emails to user IDs (case-insensitive exact match)
    if (emails && Array.isArray(emails) && emails.length > 0) {
      for (const email of emails) {
        const normalized = normalizeEmail(email);
        const user = await User.findOne({ email: normalized });
        if (user) {
          targetIds.add(String(user._id));
        } else {
          notFound.push({ type: 'email', value: email });
        }
      }
    }

    // Add direct IDs
    if (ids && Array.isArray(ids) && ids.length > 0) {
      for (const id of ids) {
        const user = await User.findById(id);
        if (user) {
          targetIds.add(String(user._id));
        } else {
          notFound.push({ type: 'id', value: id });
        }
      }
    }

    if (targetIds.size === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid users found to delete',
        data: { notFound }
      });
    }

    const deleted = [];

    for (const userId of targetIds) {
      try {
        const user = await User.findById(userId);
        if (!user) {
          notFound.push({ type: 'id', value: userId });
          continue;
        }

        if (user.role === 'super_admin') {
          errors.push({ id: userId, email: user.email, reason: 'Cannot delete super admin user' });
          continue;
        }

        await Promise.all([
          User.findByIdAndDelete(userId),
          Url.updateMany({ creator: userId }, { isActive: false }),
          BioPage.updateMany({ owner: userId }, { isActive: false })
        ]);

        deleted.push({ id: userId, email: user.email });
      } catch (err) {
        errors.push({ id: userId, reason: err.message });
      }
    }

    res.json({
      success: true,
      message: `${deleted.length} user(s) deleted successfully`,
      data: {
        deleted,
        notFound,
        errors
      }
    });
  } catch (error) {
    console.error('Bulk delete users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk delete users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      creator,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const skip = (page - 1) * limit;
    let filter = {};
    
    // Search across URL fields AND creator name/email
    if (search && search.trim()) {
      const searchTerm = search.trim();
      // Escape special regex characters to prevent regex injection
      const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Create a version with optional spaces between characters for flexible matching
      // This allows "JohnDoe" to match "John Doe" and vice versa
      const flexibleSearch = escapedSearch.split(/\s+/).join('\\s*');
      // Also create a version without any spaces for matching concatenated names
      const noSpaceSearch = searchTerm.replace(/\s+/g, '');
      const escapedNoSpaceSearch = noSpaceSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // First, find users matching the search term (search in full name or email)
      const matchingUsers = await User.find({
        $or: [
          { firstName: { $regex: escapedSearch, $options: 'i' } },
          { lastName: { $regex: escapedSearch, $options: 'i' } },
          { email: { $regex: escapedSearch, $options: 'i' } },
          // Search by combining first and last name with space (for "John Doe" type searches)
          { $expr: { 
            $regexMatch: { 
              input: { $concat: ['$firstName', ' ', '$lastName'] }, 
              regex: flexibleSearch, 
              options: 'i' 
            } 
          }},
          // Search by combining first and last name without space (for "JohnDoe" type searches)
          { $expr: { 
            $regexMatch: { 
              input: { $concat: ['$firstName', '$lastName'] }, 
              regex: escapedNoSpaceSearch, 
              options: 'i' 
            } 
          }}
        ]
      }).select('_id');
      
      const userIds = matchingUsers.map(u => u._id);
      
      // Build filter to search URL fields OR match creator
      filter.$or = [
        { title: { $regex: escapedSearch, $options: 'i' } },
        { originalUrl: { $regex: escapedSearch, $options: 'i' } },
        { shortCode: { $regex: escapedSearch, $options: 'i' } }
      ];
      
      // Add creator filter if matching users found
      if (userIds.length > 0) {
        filter.$or.push({ creator: { $in: userIds } });
      }
    }
    
    // Filter by specific creator ID (from dropdown)
    if (creator) {
      filter.creator = creator;
    }
    
    // Filter by status
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
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
    
    console.log('🔄 Admin updating URL:', {
      id,
      shortCode: url.shortCode,
      customCode: url.customCode,
      currentIsActive: url.isActive,
      newIsActive: isActive
    });
    
    const updateData = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    
    const updatedUrl = await Url.findByIdAndUpdate(id, updateData, { new: true })
      .populate('creator', 'firstName lastName email')
      .populate('organization', 'name slug');
    
    // Clear cache for this URL so deactivation takes effect immediately
    // Use lowercase for case-insensitive consistency
    const lowerShortCode = url.shortCode.toLowerCase();
    console.log('🗑️ Clearing cache for:', `url:${lowerShortCode}`);
    const cacheDelResult1 = await cacheDel(`url:${lowerShortCode}`);
    console.log('🗑️ Cache delete result for shortCode:', cacheDelResult1);
    
    if (url.customCode) {
      const lowerCustomCode = url.customCode.toLowerCase();
      console.log('🗑️ Clearing cache for customCode:', `url:${lowerCustomCode}`);
      const cacheDelResult2 = await cacheDel(`url:${lowerCustomCode}`);
      console.log('🗑️ Cache delete result for customCode:', cacheDelResult2);
    }
    
    console.log('✅ URL updated successfully:', {
      shortCode: updatedUrl.shortCode,
      isActive: updatedUrl.isActive
    });
    
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

const getAllBioPages = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      owner,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    const filter = {};

    if (search && search.trim()) {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escapedSearch, $options: 'i' } },
        { username: { $regex: escapedSearch, $options: 'i' } }
      ];
    }

    if (owner) {
      filter.owner = owner;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [bioPages, total] = await Promise.all([
      BioPage.find(filter)
        .populate('owner', 'firstName lastName email')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      BioPage.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        bioPages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all bio pages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bio pages'
    });
  }
};

const updateBioPage = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const bioPage = await BioPage.findById(id);
    if (!bioPage) {
      return res.status(404).json({
        success: false,
        message: 'Bio page not found'
      });
    }

    const updateData = {};
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedBioPage = await BioPage.findByIdAndUpdate(id, updateData, { new: true })
      .populate('owner', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Bio page updated successfully',
      data: { bioPage: updatedBioPage }
    });
  } catch (error) {
    console.error('Update bio page error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bio page'
    });
  }
};

const deleteBioPage = async (req, res) => {
  try {
    const { id } = req.params;

    const bioPage = await BioPage.findById(id);
    if (!bioPage) {
      return res.status(404).json({
        success: false,
        message: 'Bio page not found'
      });
    }

    await BioPage.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Bio page deleted successfully'
    });
  } catch (error) {
    console.error('Delete bio page error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete bio page'
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

const getApiUsers = async (req, res) => {
  try {
    const results = await Url.aggregate([
      { $match: { source: 'api' } },
      {
        $group: {
          _id: '$creator',
          apiLinkCount: { $sum: 1 },
          lastCreatedAt: { $max: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          email: '$user.email',
          firstName: '$user.firstName',
          lastName: '$user.lastName',
          plan: '$user.plan',
          apiLinkCount: 1,
          lastCreatedAt: 1
        }
      },
      { $sort: { apiLinkCount: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        total: results.length,
        users: results
      }
    });
  } catch (error) {
    console.error('Get API users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch API users'
    });
  }
};

module.exports = {
  getSystemStats,
  getUsers,
  updateUser,
  deleteUser,
  bulkDeleteUsers,
  getAllUrls,
  updateUrl,
  deleteUrl,
  getAllBioPages,
  updateBioPage,
  deleteBioPage,
  getOrganizations,
  getApiUsers
};