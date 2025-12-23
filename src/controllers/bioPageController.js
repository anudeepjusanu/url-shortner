const BioPage = require('../models/BioPage');
const User = require('../models/User');
const { Click } = require('../models/Analytics');

// Create a new bio page
const createBioPage = async (req, res) => {
  try {
    const {
      slug,
      title,
      bio,
      profileImage,
      coverImage,
      theme,
      links,
      socialLinks,
      seo,
      settings
    } = req.body;

    // Check if slug is available
    const isAvailable = await BioPage.isSlugAvailable(slug);
    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'This username is already taken'
      });
    }

    // Check if user already has a bio page
    const existingPage = await BioPage.findOne({ user: req.user.id });
    if (existingPage) {
      return res.status(400).json({
        success: false,
        message: 'You already have a bio page. Please update it instead.'
      });
    }

    const bioPage = new BioPage({
      user: req.user.id,
      slug,
      title,
      bio,
      profileImage,
      coverImage,
      theme,
      links: links || [],
      socialLinks,
      seo,
      settings
    });

    await bioPage.save();

    res.status(201).json({
      success: true,
      message: 'Bio page created successfully',
      data: { bioPage }
    });
  } catch (error) {
    console.error('Create bio page error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bio page',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's bio page
const getMyBioPage = async (req, res) => {
  try {
    const bioPage = await BioPage.findOne({ user: req.user.id });
    
    if (!bioPage) {
      return res.status(404).json({
        success: false,
        message: 'Bio page not found'
      });
    }

    res.json({
      success: true,
      data: { bioPage }
    });
  } catch (error) {
    console.error('Get bio page error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bio page'
    });
  }
};

// Get bio page by slug (public)
const getBioPageBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const bioPage = await BioPage.findBySlug(slug)
      .populate('user', 'firstName lastName email');
    
    if (!bioPage) {
      return res.status(404).json({
        success: false,
        message: 'Bio page not found'
      });
    }

    if (!bioPage.settings.isPublished) {
      return res.status(403).json({
        success: false,
        message: 'This bio page is not published'
      });
    }

    // Increment view count
    await bioPage.incrementView();

    res.json({
      success: true,
      data: { bioPage }
    });
  } catch (error) {
    console.error('Get bio page by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bio page'
    });
  }
};

// Update bio page
const updateBioPage = async (req, res) => {
  try {
    const {
      slug,
      title,
      bio,
      profileImage,
      coverImage,
      theme,
      links,
      socialLinks,
      seo,
      settings
    } = req.body;

    const bioPage = await BioPage.findOne({ user: req.user.id });
    
    if (!bioPage) {
      return res.status(404).json({
        success: false,
        message: 'Bio page not found'
      });
    }

    // Check if slug is being changed and if new slug is available
    if (slug && slug !== bioPage.slug) {
      const isAvailable = await BioPage.isSlugAvailable(slug, bioPage._id);
      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          message: 'This username is already taken'
        });
      }
      bioPage.slug = slug;
    }

    // Update fields
    if (title !== undefined) bioPage.title = title;
    if (bio !== undefined) bioPage.bio = bio;
    if (profileImage !== undefined) bioPage.profileImage = profileImage;
    if (coverImage !== undefined) bioPage.coverImage = coverImage;
    if (theme) bioPage.theme = { ...bioPage.theme, ...theme };
    if (links !== undefined) bioPage.links = links;
    if (socialLinks) bioPage.socialLinks = { ...bioPage.socialLinks, ...socialLinks };
    if (seo) bioPage.seo = { ...bioPage.seo, ...seo };
    if (settings) bioPage.settings = { ...bioPage.settings, ...settings };

    await bioPage.save();

    res.json({
      success: true,
      message: 'Bio page updated successfully',
      data: { bioPage }
    });
  } catch (error) {
    console.error('Update bio page error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bio page',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete bio page
const deleteBioPage = async (req, res) => {
  try {
    const bioPage = await BioPage.findOne({ user: req.user.id });
    
    if (!bioPage) {
      return res.status(404).json({
        success: false,
        message: 'Bio page not found'
      });
    }

    await BioPage.findByIdAndDelete(bioPage._id);

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

// Track link click
const trackLinkClick = async (req, res) => {
  try {
    const { slug, linkId } = req.params;
    
    const bioPage = await BioPage.findBySlug(slug);
    
    if (!bioPage) {
      return res.status(404).json({
        success: false,
        message: 'Bio page not found'
      });
    }

    await bioPage.incrementLinkClick(linkId);

    res.json({
      success: true,
      message: 'Click tracked successfully'
    });
  } catch (error) {
    console.error('Track link click error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track click'
    });
  }
};

// Add email subscriber
const addEmailSubscriber = async (req, res) => {
  try {
    const { slug } = req.params;
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Valid email is required'
      });
    }

    const bioPage = await BioPage.findBySlug(slug);
    
    if (!bioPage) {
      return res.status(404).json({
        success: false,
        message: 'Bio page not found'
      });
    }

    if (!bioPage.settings.collectEmails) {
      return res.status(403).json({
        success: false,
        message: 'Email collection is not enabled for this page'
      });
    }

    await bioPage.addEmailSubscriber(email);

    res.json({
      success: true,
      message: 'Email added successfully'
    });
  } catch (error) {
    console.error('Add email subscriber error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add email'
    });
  }
};

// Get bio page analytics
const getBioPageAnalytics = async (req, res) => {
  try {
    const bioPage = await BioPage.findOne({ user: req.user.id });
    
    if (!bioPage) {
      return res.status(404).json({
        success: false,
        message: 'Bio page not found'
      });
    }

    // Get link performance
    const linkPerformance = bioPage.links.map(link => ({
      id: link._id,
      title: link.title,
      url: link.url,
      clicks: link.clicks,
      enabled: link.enabled
    })).sort((a, b) => b.clicks - a.clicks);

    res.json({
      success: true,
      data: {
        analytics: bioPage.analytics,
        linkPerformance,
        emailSubscribers: bioPage.emailSubscribers.length,
        totalLinks: bioPage.links.length,
        activeLinks: bioPage.links.filter(l => l.enabled).length
      }
    });
  } catch (error) {
    console.error('Get bio page analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
};

// Check slug availability
const checkSlugAvailability = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const isAvailable = await BioPage.isSlugAvailable(slug);
    
    res.json({
      success: true,
      data: { available: isAvailable }
    });
  } catch (error) {
    console.error('Check slug availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check availability'
    });
  }
};

module.exports = {
  createBioPage,
  getMyBioPage,
  getBioPageBySlug,
  updateBioPage,
  deleteBioPage,
  trackLinkClick,
  addEmailSubscriber,
  getBioPageAnalytics,
  checkSlugAvailability
};
