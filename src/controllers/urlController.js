const Url = require('../models/Url');
const User = require('../models/User');
const Domain = require('../models/Domain');
const { generateShortCode } = require('../utils/shortCodeGenerator');
const { validateUrl } = require('../utils/urlValidator');
const { cacheGet, cacheSet, cacheDel } = require('../config/redis');
const { UsageTracker } = require('../middleware/usageTracker');
const config = require('../config/environment');

const createUrl = async (req, res) => {
  try {
    const {
      originalUrl,
      customCode,
      title,
      description,
      tags,
      expiresAt,
      password,
      utm,
      restrictions,
      redirectType,
      domainId
    } = req.body;

    // Check usage limits before creating URL
    const usageCheck = await UsageTracker.canPerformAction(req.user.id, 'createUrl');
    if (!usageCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: usageCheck.reason,
        code: 'USAGE_LIMIT_EXCEEDED',
        data: {
          limit: usageCheck.limit,
          current: usageCheck.current,
          action: 'createUrl'
        }
      });
    }

    const urlValidation = validateUrl(originalUrl);
    if (!urlValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: urlValidation.message
      });
    }

    // Handle custom domain
    let selectedDomain = null;
    if (domainId) {
      selectedDomain = await Domain.findById(domainId);
      if (!selectedDomain) {
        return res.status(400).json({
          success: false,
          message: 'Selected domain not found'
        });
      }

      // Check if user has access to the domain
      if (selectedDomain.owner.toString() !== req.user.id &&
          (!req.user.organization || selectedDomain.organization?.toString() !== req.user.organization.toString())) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to selected domain'
        });
      }

      // Check if domain is verified and active
      if (!selectedDomain.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Selected domain is not active or verified'
        });
      }
    } else {
      // Get user's default domain if no domain is specified
      selectedDomain = await Domain.getDefaultDomain(req.user.id, req.user.organization);

      // If no default domain is set, create URLs without a specific domain (main domain)
      if (!selectedDomain) {
        console.log('No default domain found, creating URL for main domain');
      }
    }
    
    let shortCode = customCode;
    
    if (customCode) {
      const existingUrl = await Url.findOne({
        $or: [{ shortCode: customCode }, { customCode: customCode }]
      });
      
      if (existingUrl) {
        return res.status(400).json({
          success: false,
          message: 'Custom code already exists'
        });
      }
    } else {
      let attempts = 0;
      do {
        shortCode = generateShortCode();
        attempts++;
        if (attempts > 10) {
          throw new Error('Failed to generate unique short code');
        }
      } while (await Url.findOne({ shortCode }));
    }
    
    const urlData = {
      originalUrl: urlValidation.cleanUrl,
      shortCode,
      customCode,
      title: title || urlValidation.title,
      description,
      creator: req.user.id,
      organization: req.user.organization,
      domain: selectedDomain ? selectedDomain.fullDomain : null,
      tags: tags ? tags.map(tag => tag.toLowerCase().trim()) : [],
      expiresAt,
      password,
      utm: utm || {},
      restrictions: restrictions || {},
      redirectType: redirectType || 302
    };
    
    const url = new Url(urlData);
    await url.save();

    // Track usage after successful URL creation
    await UsageTracker.trackUsage(req.user.id, 'createUrl');

    // Update domain statistics if using custom domain
    if (selectedDomain) {
      await selectedDomain.updateStatistics(1, 0);
    }

    const populatedUrl = await Url.findById(url._id)
      .populate('creator', 'firstName lastName email')
      .populate('organization', 'name slug');

    await cacheSet(`url:${shortCode}`, populatedUrl, config.CACHE_TTL.URL_CACHE);

    res.status(201).json({
      success: true,
      message: 'URL created successfully',
      data: {
        url: populatedUrl,
        domain: selectedDomain ? {
          id: selectedDomain._id,
          fullDomain: selectedDomain.fullDomain,
          shortUrl: selectedDomain.shortUrl
        } : null
      }
    });
  } catch (error) {
    console.error('Create URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create URL',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getUrls = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      tags,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive
    } = req.query;
    
    const skip = (page - 1) * limit;
    
    const filter = {
      creator: req.user.id
    };
    
    if (req.user.organization) {
      filter.$or = [
        { creator: req.user.id },
        { organization: req.user.organization }
      ];
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { originalUrl: { $regex: search, $options: 'i' } },
        { shortCode: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      filter.tags = { $in: tagArray.map(tag => tag.toLowerCase().trim()) };
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
    console.error('Get URLs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch URLs'
    });
  }
};

const getUrl = async (req, res) => {
  try {
    const { id } = req.params;
    
    const url = await Url.findById(id)
      .populate('creator', 'firstName lastName email')
      .populate('organization', 'name slug');
    
    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }
    
    if (url.creator._id.toString() !== req.user.id && 
        (!req.user.organization || url.organization?._id.toString() !== req.user.organization.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: { url }
    });
  } catch (error) {
    console.error('Get URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch URL'
    });
  }
};

const updateUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      tags,
      expiresAt,
      isActive,
      password,
      utm,
      restrictions,
      redirectType
    } = req.body;
    
    const url = await Url.findById(id);
    
    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }
    
    if (url.creator.toString() !== req.user.id && 
        (!req.user.organization || url.organization?.toString() !== req.user.organization.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = tags.map(tag => tag.toLowerCase().trim());
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password !== undefined) updateData.password = password;
    if (utm !== undefined) updateData.utm = utm;
    if (restrictions !== undefined) updateData.restrictions = restrictions;
    if (redirectType !== undefined) updateData.redirectType = redirectType;
    
    const updatedUrl = await Url.findByIdAndUpdate(id, updateData, { new: true })
      .populate('creator', 'firstName lastName email')
      .populate('organization', 'name slug');
    
    await cacheDel(`url:${url.shortCode}`);
    await cacheSet(`url:${url.shortCode}`, updatedUrl, config.CACHE_TTL.URL_CACHE);
    
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
    
    if (url.creator.toString() !== req.user.id && 
        (!req.user.organization || url.organization?.toString() !== req.user.organization.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    await Url.findByIdAndDelete(id);
    await cacheDel(`url:${url.shortCode}`);
    
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

const bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL IDs provided'
      });
    }
    
    const urls = await Url.find({
      _id: { $in: ids },
      $or: [
        { creator: req.user.id },
        ...(req.user.organization ? [{ organization: req.user.organization }] : [])
      ]
    });
    
    if (urls.length !== ids.length) {
      return res.status(403).json({
        success: false,
        message: 'Some URLs not found or access denied'
      });
    }
    
    const shortCodes = urls.map(url => url.shortCode);
    
    await Url.deleteMany({ _id: { $in: ids } });
    
    for (const shortCode of shortCodes) {
      await cacheDel(`url:${shortCode}`);
    }
    
    res.json({
      success: true,
      message: `${urls.length} URLs deleted successfully`
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete URLs'
    });
  }
};

const getUrlStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.user.organization;
    
    const filter = {
      $or: [
        { creator: userId },
        ...(organizationId ? [{ organization: organizationId }] : [])
      ]
    };
    
    const [
      totalUrls,
      activeUrls,
      totalClicks,
      topUrls
    ] = await Promise.all([
      Url.countDocuments(filter),
      Url.countDocuments({ ...filter, isActive: true }),
      Url.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$clickCount' } } }
      ]),
      Url.find(filter)
        .sort({ clickCount: -1 })
        .limit(5)
        .select('title originalUrl shortCode clickCount createdAt')
    ]);
    
    res.json({
      success: true,
      data: {
        stats: {
          totalUrls,
          activeUrls,
          totalClicks: totalClicks[0]?.total || 0,
          topUrls
        }
      }
    });
  } catch (error) {
    console.error('Get URL stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch URL statistics'
    });
  }
};

const getAvailableDomains = async (req, res) => {
  try {
    const domains = await Domain.getUserDomains(req.user.id, req.user.organization);
    const activeDomains = domains.filter(domain => domain.isActive);

    res.json({
      success: true,
      data: {
        domains: activeDomains.map(domain => ({
          id: domain._id,
          fullDomain: domain.fullDomain,
          domain: domain.domain,
          subdomain: domain.subdomain,
          isDefault: domain.isDefault,
          shortUrl: domain.shortUrl,
          status: domain.status
        }))
      }
    });
  } catch (error) {
    console.error('Get available domains error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available domains'
    });
  }
};

module.exports = {
  createUrl,
  getUrls,
  getUrl,
  updateUrl,
  deleteUrl,
  bulkDelete,
  getUrlStats,
  getAvailableDomains
};