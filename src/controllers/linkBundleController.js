const LinkBundle = require('../models/LinkBundle');
const Url = require('../models/Url');

// Create a new link bundle
const createBundle = async (req, res) => {
  try {
    const {
      name,
      description,
      slug,
      color,
      icon,
      links,
      tags,
      settings
    } = req.body;

    // Check if slug is available
    const isAvailable = await LinkBundle.isSlugAvailable(slug);
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'This bundle slug is already taken'
      });
    }

    // Verify all links belong to user
    if (links && links.length > 0) {
      const userLinks = await Url.find({
        _id: { $in: links },
        creator: req.user.id
      });

      if (userLinks.length !== links.length) {
        return res.status(403).json({
          success: false,
          message: 'Some links do not belong to you'
        });
      }
    }

    const bundle = new LinkBundle({
      user: req.user.id,
      organization: req.user.organization,
      name,
      description,
      slug,
      color,
      icon,
      links: links || [],
      tags: tags || [],
      settings
    });

    bundle.analytics.totalLinks = bundle.links.length;
    await bundle.save();

    const populatedBundle = await LinkBundle.findById(bundle._id).populate('links');

    res.status(201).json({
      success: true,
      message: 'Bundle created successfully',
      data: { bundle: populatedBundle }
    });
  } catch (error) {
    console.error('Create bundle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bundle',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all bundles for user
const getBundles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      tags,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    
    const filter = {
      user: req.user.id
    };

    if (req.user.organization) {
      filter.$or = [
        { user: req.user.id },
        { organization: req.user.organization }
      ];
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(',');
      filter.tags = { $in: tagArray.map(tag => tag.toLowerCase().trim()) };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [bundles, total] = await Promise.all([
      LinkBundle.find(filter)
        .populate('links')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      LinkBundle.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        bundles,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get bundles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bundles'
    });
  }
};

// Get single bundle
const getBundle = async (req, res) => {
  try {
    const { id } = req.params;

    const bundle = await LinkBundle.findById(id).populate('links');

    if (!bundle) {
      return res.status(404).json({
        success: false,
        message: 'Bundle not found'
      });
    }

    // Check access
    if (bundle.user.toString() !== req.user.id &&
        (!req.user.organization || bundle.organization?.toString() !== req.user.organization.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { bundle }
    });
  } catch (error) {
    console.error('Get bundle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bundle'
    });
  }
};

// Get bundle by slug (public if enabled)
const getBundleBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const bundle = await LinkBundle.findBySlug(slug);

    if (!bundle) {
      return res.status(404).json({
        success: false,
        message: 'Bundle not found'
      });
    }

    if (!bundle.settings.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'This bundle is private'
      });
    }

    res.json({
      success: true,
      data: { bundle }
    });
  } catch (error) {
    console.error('Get bundle by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bundle'
    });
  }
};

// Update bundle
const updateBundle = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      slug,
      color,
      icon,
      tags,
      settings
    } = req.body;

    const bundle = await LinkBundle.findById(id);

    if (!bundle) {
      return res.status(404).json({
        success: false,
        message: 'Bundle not found'
      });
    }

    // Check access
    if (bundle.user.toString() !== req.user.id &&
        (!req.user.organization || bundle.organization?.toString() !== req.user.organization.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if slug is being changed and if new slug is available
    if (slug && slug !== bundle.slug) {
      const isAvailable = await LinkBundle.isSlugAvailable(slug, bundle._id);
      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          message: 'This bundle slug is already taken'
        });
      }
      bundle.slug = slug;
    }

    // Update fields
    if (name !== undefined) bundle.name = name;
    if (description !== undefined) bundle.description = description;
    if (color !== undefined) bundle.color = color;
    if (icon !== undefined) bundle.icon = icon;
    if (tags !== undefined) bundle.tags = tags;
    if (settings) bundle.settings = { ...bundle.settings, ...settings };

    await bundle.save();

    const updatedBundle = await LinkBundle.findById(id).populate('links');

    res.json({
      success: true,
      message: 'Bundle updated successfully',
      data: { bundle: updatedBundle }
    });
  } catch (error) {
    console.error('Update bundle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bundle'
    });
  }
};

// Delete bundle
const deleteBundle = async (req, res) => {
  try {
    const { id } = req.params;

    const bundle = await LinkBundle.findById(id);

    if (!bundle) {
      return res.status(404).json({
        success: false,
        message: 'Bundle not found'
      });
    }

    // Check access
    if (bundle.user.toString() !== req.user.id &&
        (!req.user.organization || bundle.organization?.toString() !== req.user.organization.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await LinkBundle.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Bundle deleted successfully'
    });
  } catch (error) {
    console.error('Delete bundle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete bundle'
    });
  }
};

// Add link to bundle
const addLinkToBundle = async (req, res) => {
  try {
    const { id } = req.params;
    const { linkId } = req.body;

    const bundle = await LinkBundle.findById(id);

    if (!bundle) {
      return res.status(404).json({
        success: false,
        message: 'Bundle not found'
      });
    }

    // Check access
    if (bundle.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Verify link belongs to user
    const link = await Url.findOne({
      _id: linkId,
      creator: req.user.id
    });

    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Link not found or access denied'
      });
    }

    await bundle.addLink(linkId);

    const updatedBundle = await LinkBundle.findById(id).populate('links');

    res.json({
      success: true,
      message: 'Link added to bundle',
      data: { bundle: updatedBundle }
    });
  } catch (error) {
    console.error('Add link to bundle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add link to bundle'
    });
  }
};

// Remove link from bundle
const removeLinkFromBundle = async (req, res) => {
  try {
    const { id, linkId } = req.params;

    const bundle = await LinkBundle.findById(id);

    if (!bundle) {
      return res.status(404).json({
        success: false,
        message: 'Bundle not found'
      });
    }

    // Check access
    if (bundle.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await bundle.removeLink(linkId);

    const updatedBundle = await LinkBundle.findById(id).populate('links');

    res.json({
      success: true,
      message: 'Link removed from bundle',
      data: { bundle: updatedBundle }
    });
  } catch (error) {
    console.error('Remove link from bundle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove link from bundle'
    });
  }
};

// Get bundle analytics
const getBundleAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    const bundle = await LinkBundle.findById(id).populate('links');

    if (!bundle) {
      return res.status(404).json({
        success: false,
        message: 'Bundle not found'
      });
    }

    // Check access
    if (bundle.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Calculate total clicks from all links
    const totalClicks = bundle.links.reduce((sum, link) => sum + (link.clickCount || 0), 0);

    // Get link performance
    const linkPerformance = bundle.links.map(link => ({
      id: link._id,
      title: link.title,
      shortCode: link.shortCode,
      clicks: link.clickCount,
      isActive: link.isActive
    })).sort((a, b) => b.clicks - a.clicks);

    res.json({
      success: true,
      data: {
        analytics: {
          ...bundle.analytics.toObject(),
          totalClicks
        },
        linkPerformance
      }
    });
  } catch (error) {
    console.error('Get bundle analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
};

// Export bundle
const exportBundle = async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'json' } = req.query;

    const bundle = await LinkBundle.findById(id).populate('links');

    if (!bundle) {
      return res.status(404).json({
        success: false,
        message: 'Bundle not found'
      });
    }

    // Check access
    if (bundle.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (!bundle.settings.allowExport) {
      return res.status(403).json({
        success: false,
        message: 'Export is not allowed for this bundle'
      });
    }

    if (format === 'csv') {
      // CSV format
      let csv = 'Title,Short URL,Original URL,Clicks,Created At\n';
      bundle.links.forEach(link => {
        const shortUrl = `${process.env.BASE_URL || 'https://laghhu.link'}/${link.shortCode}`;
        csv += `"${link.title || ''}","${shortUrl}","${link.originalUrl}",${link.clickCount},"${link.createdAt}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="bundle-${bundle.slug}.csv"`);
      res.send(csv);
    } else {
      // JSON format
      const exportData = {
        bundle: {
          name: bundle.name,
          description: bundle.description,
          slug: bundle.slug,
          tags: bundle.tags
        },
        links: bundle.links.map(link => ({
          title: link.title,
          shortCode: link.shortCode,
          originalUrl: link.originalUrl,
          clicks: link.clickCount,
          createdAt: link.createdAt
        })),
        exportedAt: new Date()
      };

      res.json({
        success: true,
        data: exportData
      });
    }
  } catch (error) {
    console.error('Export bundle error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export bundle'
    });
  }
};

module.exports = {
  createBundle,
  getBundles,
  getBundle,
  getBundleBySlug,
  updateBundle,
  deleteBundle,
  addLinkToBundle,
  removeLinkFromBundle,
  getBundleAnalytics,
  exportBundle
};
