const mongoose = require('mongoose');
const Url = require('../models/Url');
const User = require('../models/User');
const Domain = require('../models/Domain');
const { generateShortCode, validateShortCode } = require('../utils/shortCodeGenerator');
const { validateUrl, checkUrlAccessibility } = require('../utils/urlValidator');
const { cacheGet, cacheSet, cacheDel } = require('../config/redis');
const { UsageTracker } = require('../middleware/usageTracker');
const config = require('../config/environment');
const safeBrowsingService = require('../services/safeBrowsingService');

// Single source of truth for the public short-link base URL.
// BASE_URL takes precedence; otherwise it is derived from BASE_DOMAIN so that
// both the QR path and response always reference the same host.
const getPublicBaseUrl = () =>
  process.env.BASE_URL || `https://${process.env.BASE_DOMAIN || 'snip.sa'}`;

// Derives the bare hostname from the canonical base URL so that both
// fullDomain and shortUrl in responses are always consistent with each other.
const getPublicBaseDomain = () => {
  if (process.env.BASE_DOMAIN) return process.env.BASE_DOMAIN;
  if (process.env.BASE_URL) {
    try { return new URL(process.env.BASE_URL).hostname; } catch {}
  }
  return 'snip.sa';
};

// Shared URL reachability check used by createUrl, updateUrl, and bulkCreate.
// Returns { allowed: true } when the URL should be accepted, or
// { allowed: false, message: '...' } when it must be rejected.
const checkUrlReachability = async (cleanUrl, timeout = 10000) => {
  const result = await checkUrlAccessibility(cleanUrl, timeout);
  if (result.accessible) return { allowed: true };

  const errorMsg = result.error || '';
  const status = result.status;

  if (errorMsg.includes('ENOTFOUND') || errorMsg.includes('getaddrinfo') || errorMsg.includes('EAI_AGAIN')) {
    return { allowed: false, message: 'URL does not exist. The domain could not be found. Please check the URL and try again.' };
  }
  if (errorMsg.includes('ECONNREFUSED')) {
    return { allowed: false, message: 'URL is not accessible. The server refused the connection. Please check the URL and try again.' };
  }
  if (status && status >= 400) {
    if (status === 401 || status === 403 || status === 405) return { allowed: true };
    if (status === 404) return { allowed: false, message: 'URL not found (HTTP 404). The page does not exist. Please check the URL.' };
    if (status >= 500) return { allowed: true };
    return { allowed: false, message: `URL is not accessible (HTTP ${status}). Please provide a valid, existing URL.` };
  }
  // Timeout / abort / ECONNRESET / ETIMEDOUT / ERR_BAD_RESPONSE — allow
  return { allowed: true };
};

// Run an array of async task functions with a bounded concurrency limit.
const runWithConcurrency = async (tasks, limit) => {
  const results = new Array(tasks.length);
  let index = 0;
  const runNext = async () => {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, runNext));
  return results;
};

// Reserved aliases that cannot be used for shortened URLs
const RESERVED_ALIASES = [
  // Frontend routes
  'admin', 'dashboard', 'analytics', 'profile', 'settings',
  'login', 'register', 'logout', 'signup', 'signin',
  'my-links', 'mylinks', 'links', 'urls',
  'create-short-link', 'create-link', 'create',
  'qr-codes', 'qr', 'qrcode', 'qrcodes',
  'utm-builder', 'utm', 'builder',
  'custom-domains', 'domains', 'domain',
  'subscription', 'billing', 'payment', 'pricing',
  'team-members', 'team', 'members', 'users',
  'content-filter', 'filter', 'content',
  'url-management', 'management', 'admin-urls',

  // Backend/API routes
  'api', 'auth', 'v1', 'v2', 'v3',
  'graphql', 'webhook', 'webhooks',
  'oauth', 'callback', 'redirect',

  // Common system pages
  'about', 'contact', 'help', 'support',
    'legal', 
  'terms-and-conditions', 'privacy-policy',
  'docs', 'documentation', 'guide', 'tutorial',
  'api-docs', 'api-documentation',
  'blog', 'news', 'updates', 'changelog',
  'status', 'health', 'ping', 'test',

  // Security/Admin
  'root', 'administrator', 'superuser', 'moderator',
  'system', 'config', 'configuration', 'setup',
  'install', 'upgrade', 'migrate', 'backup',

  // Common reserved words
  'www', 'ftp', 'mail', 'smtp', 'pop3',
  'assets', 'static', 'public', 'cdn',
  'download', 'upload', 'file', 'files',
  'img', 'image', 'images', 'css', 'js',
  'favicon', 'robots', 'sitemap', 'feed', 'rss'
];

// Helper function to check if alias is reserved
const isReservedAlias = (alias) => {
  if (!alias) return false;
  return RESERVED_ALIASES.includes(alias.toLowerCase().trim());
};

// Helper function to normalize short codes (preserve case for international characters)
const normalizeShortCode = (code) => {
  if (!code) return code;
  // Trim whitespace and preserve case for international characters
  return code.trim();
};

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
      domainId,
      generateQRCode = false // Option to auto-generate QR code
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

    // Check URL safety with Google Safe Browsing API
    const safetyCheck = await safeBrowsingService.checkUrl(urlValidation.cleanUrl);
    if (!safetyCheck.isSafe) {
      console.log('🚨 Blocked unsafe URL creation attempt:', urlValidation.cleanUrl);
      return res.status(400).json({
        success: false,
        message: safetyCheck.message || 'The link provided has been flagged by Google Safe Browsing as unsafe. Please use a different link.',
        code: 'UNSAFE_URL',
        threats: safetyCheck.threats
      });
    }

    // Check if the URL actually exists and is accessible
    const reachabilityCheck = await checkUrlReachability(urlValidation.cleanUrl);
    console.log('Accessibility check result:', reachabilityCheck);
    if (!reachabilityCheck.allowed) {
      return res.status(400).json({ success: false, message: reachabilityCheck.message });
    }

    // Handle custom domain
    let selectedDomain = null;
    let useBaseDomain = false;
    
    if (domainId) {
      // Check if user selected the base/system domain
      if (domainId === 'base') {
        useBaseDomain = true;
        console.log('Using base domain for URL creation');
      } else {
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
      }
    } else {
      // Get user's default domain if no domain is specified
      selectedDomain = await Domain.getDefaultDomain(req.user.id, req.user.organization);

      // If no default domain is set, use base domain
      if (!selectedDomain) {
        useBaseDomain = true;
        console.log('No default domain found, using base domain');
      }
    }
    
    let shortCode = customCode ? normalizeShortCode(customCode) : null;
    
    if (shortCode) {
      // Check if the custom code is a reserved alias
      if (isReservedAlias(shortCode)) {
        return res.status(400).json({
          success: false,
          message: 'This alias is reserved for system use. Please choose a different alias.'
        });
      }

      // Validate the short code format
      const validation = validateShortCode(shortCode);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.reason
        });
      }

      // Case-insensitive check for existing aliases
      const existingUrl = await Url.findOne({
        $or: [
          { shortCode: { $regex: new RegExp(`^${shortCode}$`, 'i') } },
          { customCode: { $regex: new RegExp(`^${shortCode}$`, 'i') } }
        ]
      });
      
      if (existingUrl) {
        return res.status(400).json({
          success: false,
          message: 'This alias already exists (case-insensitive). Please choose a different alias.'
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
      domain: useBaseDomain ? null : (selectedDomain ? selectedDomain.fullDomain : null),
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

    await cacheSet(`url:${shortCode.toLowerCase()}`, populatedUrl, config.CACHE_TTL.URL_CACHE);

    // Auto-generate QR code if requested
    let qrCodeData = null;
    if (generateQRCode) {
      try {
        const QRCode = require('qrcode');
        const { domainToASCII } = require('../utils/punycode');
        
        // Build the short URL with QR tracking parameter
        const urlCode = populatedUrl.customCode || populatedUrl.shortCode;
        let shortUrl;
        if (populatedUrl.domain) {
          const asciiDomain = domainToASCII(populatedUrl.domain);
          const protocol = asciiDomain.includes('localhost') ? 'http://' : 'https://';
          shortUrl = `${protocol}${asciiDomain}/${urlCode}?qr=1`;
        } else {
          shortUrl = `${getPublicBaseUrl()}/${urlCode}?qr=1`;
        }
        
        // Generate QR code
        const qrOptions = {
          errorCorrectionLevel: 'M',
          type: 'image/png',
          quality: 0.92,
          margin: 4,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          width: 300
        };
        
        const qrBuffer = await QRCode.toBuffer(shortUrl, qrOptions);
        qrCodeData = `data:image/png;base64,${qrBuffer.toString('base64')}`;
        
        // Update URL with QR code info
        populatedUrl.qrCodeGenerated = true;
        populatedUrl.qrCodeGeneratedAt = new Date();
        populatedUrl.qrCode = qrCodeData;
        populatedUrl.qrCodeSettings = {
          size: 300,
          format: 'png',
          errorCorrection: 'M',
          foregroundColor: '#000000',
          backgroundColor: '#FFFFFF',
          includeMargin: true
        };
        await populatedUrl.save();
        
        console.log('✅ QR code auto-generated for URL:', shortCode);
      } catch (qrError) {
        console.error('⚠️ Failed to auto-generate QR code:', qrError.message);
        // Continue without QR code - don't fail the URL creation
      }
    }

    // Prepare domain info for response — both values derived from the same source
    const baseUrl = getPublicBaseUrl();
    const baseDomain = getPublicBaseDomain();

    const domainInfo = useBaseDomain ? {
      id: 'base',
      fullDomain: baseDomain,
      shortUrl: baseUrl,
      isSystemDomain: true
    } : (selectedDomain ? {
      id: selectedDomain._id,
      fullDomain: selectedDomain.fullDomain,
      shortUrl: selectedDomain.shortUrl,
      isSystemDomain: false
    } : {
      id: 'base',
      fullDomain: baseDomain,
      shortUrl: baseUrl,
      isSystemDomain: true
    });

    res.status(201).json({
      success: true,
      message: 'URL created successfully',
      data: {
        url: populatedUrl,
        domain: domainInfo,
        ...(qrCodeData && { qrCode: qrCodeData })
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
      originalUrl,
      title,
      description,
      tags,
      expiresAt,
      isActive,
      password,
      utm,
      restrictions,
      redirectType,
      customCode
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

    // Validate and check accessibility of new originalUrl if provided
    if (originalUrl !== undefined && originalUrl !== url.originalUrl) {
      const urlValidation = validateUrl(originalUrl);
      if (!urlValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: urlValidation.message
        });
      }

      // Check URL safety with Google Safe Browsing API
      const safetyCheck = await safeBrowsingService.checkUrl(urlValidation.cleanUrl);
      if (!safetyCheck.isSafe) {
        console.log('🚨 Blocked unsafe URL update attempt:', urlValidation.cleanUrl);
        return res.status(400).json({
          success: false,
          message: safetyCheck.message || 'The link provided has been flagged by Google Safe Browsing as unsafe. Please use a different link.',
          code: 'UNSAFE_URL',
          threats: safetyCheck.threats
        });
      }

      // Check if the URL actually exists and is accessible
      const reachabilityCheck = await checkUrlReachability(urlValidation.cleanUrl);
      console.log('Update URL accessibility check result:', reachabilityCheck);
      if (!reachabilityCheck.allowed) {
        return res.status(400).json({ success: false, message: reachabilityCheck.message });
      }
    }
    
    // Check if custom code is being updated and if it's already taken
    if (customCode !== undefined && customCode !== url.shortCode && customCode !== url.customCode) {
      const normalizedCode = normalizeShortCode(customCode);

      // Check if the custom code is a reserved alias
      if (isReservedAlias(normalizedCode)) {
        return res.status(400).json({
          success: false,
          message: 'This alias is reserved for system use. Please choose a different alias.'
        });
      }

      // Validate the short code format
      const validation = validateShortCode(normalizedCode);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.reason
        });
      }

      // Case-insensitive check if the code is already in use (check both shortCode and customCode)
      const existingUrl = await Url.findOne({
        $or: [
          { shortCode: { $regex: new RegExp(`^${normalizedCode}$`, 'i') } },
          { customCode: { $regex: new RegExp(`^${normalizedCode}$`, 'i') } }
        ],
        _id: { $ne: id }
      });

      if (existingUrl) {
        return res.status(400).json({
          success: false,
          message: 'This alias already exists (case-insensitive). Please choose a different alias.'
        });
      }
    }

    const updateData = {};
    if (originalUrl !== undefined) {
      const urlValidation = validateUrl(originalUrl);
      updateData.originalUrl = urlValidation.cleanUrl;
    }
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = tags.map(tag => tag.toLowerCase().trim());
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password !== undefined) updateData.password = password;
    if (utm !== undefined) updateData.utm = utm;
    if (restrictions !== undefined) updateData.restrictions = restrictions;
    if (redirectType !== undefined) updateData.redirectType = redirectType;
    
    // When updating customCode, also update shortCode to match
    if (customCode !== undefined) {
      const normalizedCode = normalizeShortCode(customCode);
      updateData.customCode = normalizedCode;
      updateData.shortCode = normalizedCode; // Update shortCode as well
    }
    
    // Store old shortCode before updating for cache clearing
    const oldShortCode = url.shortCode;
    const oldCustomCode = url.customCode;
    
    const updatedUrl = await Url.findByIdAndUpdate(id, updateData, { new: true })
      .populate('creator', 'firstName lastName email')
      .populate('organization', 'name slug');

    // Clear cache for old short codes
    await cacheDel(`url:${oldShortCode.toLowerCase()}`);
    if (oldCustomCode) {
      await cacheDel(`url:${oldCustomCode.toLowerCase()}`);
    }

    // If custom code was changed, clear the old cache
    if (customCode !== undefined && customCode !== oldShortCode) {
      await cacheDel(`url:${oldShortCode.toLowerCase()}`);
    }

    // Clear analytics cache for this URL (all periods and groupBy combinations)
    const analyticsPeriods = ['7d', '30d', '90d', '1y', 'all'];
    const analyticsGroupBy = ['hour', 'day', 'week', 'month'];
    for (const period of analyticsPeriods) {
      for (const groupBy of analyticsGroupBy) {
        await cacheDel(`analytics:${id}:${period}:${groupBy}`);
      }
    }

    // Cache the updated URL with new shortCode
    if (updatedUrl.isActive) {
      await cacheSet(`url:${updatedUrl.shortCode.toLowerCase()}`, updatedUrl, config.CACHE_TTL.URL_CACHE);
      if (updatedUrl.customCode) {
        await cacheSet(`url:${updatedUrl.customCode.toLowerCase()}`, updatedUrl, config.CACHE_TTL.URL_CACHE);
      }
    } else {
      // Also clear custom code cache if URL is deactivated
      if (updatedUrl.customCode) {
        await cacheDel(`url:${updatedUrl.customCode.toLowerCase()}`);
      }
      await cacheDel(`url:${updatedUrl.shortCode.toLowerCase()}`);
    }
    
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
    await cacheDel(`url:${url.shortCode.toLowerCase()}`);
    if (url.customCode) {
      await cacheDel(`url:${url.customCode.toLowerCase()}`);
    }
    
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
    const customCodes = urls.filter(url => url.customCode).map(url => url.customCode);
    
    await Url.deleteMany({ _id: { $in: ids } });
    
    for (const shortCode of shortCodes) {
      await cacheDel(`url:${shortCode.toLowerCase()}`);
    }
    for (const customCode of customCodes) {
      await cacheDel(`url:${customCode.toLowerCase()}`);
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

    // Convert to ObjectId for aggregate pipeline (Mongoose does NOT auto-cast in aggregate)
    let userObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format' });
    }
    let orgObjectId = null;
    if (organizationId) {
      try { orgObjectId = new mongoose.Types.ObjectId(organizationId); } catch (_) {}
    }

    // filter for find/countDocuments (Mongoose auto-casts strings)
    const filter = {
      $or: [
        { creator: userId },
        ...(organizationId ? [{ organization: organizationId }] : [])
      ]
    };

    // filter for aggregate pipeline (must use ObjectId)
    const aggregateFilter = {
      $or: [
        { creator: userObjectId },
        ...(orgObjectId ? [{ organization: orgObjectId }] : [])
      ]
    };

    // Get user for plan and account age
    const user = await User.findById(userId);

    // Get custom domains count
    const customDomainsCount = await Domain.countDocuments({
      $or: [
        { owner: userId },
        ...(organizationId ? [{ organization: organizationId }] : [])
      ],
      isActive: true
    });

    const [
      totalUrls,
      activeUrls,
      totalClicks,
      topUrls
    ] = await Promise.all([
      Url.countDocuments(filter),
      Url.countDocuments({ ...filter, isActive: true }),
      Url.aggregate([
        { $match: aggregateFilter },
        { $group: { _id: null, total: { $sum: '$clickCount' }, qrScans: { $sum: '$qrScanCount' } } }
      ]),
      Url.find(filter)
        .sort({ clickCount: -1 })
        .limit(5)
        .select('title originalUrl shortCode clickCount createdAt')
    ]);
    
    // Calculate account age
    let accountAge = 'New User';
    if (user && user.createdAt) {
      const now = new Date();
      const created = new Date(user.createdAt);
      const diffTime = Math.abs(now - created);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 30) {
        accountAge = `${diffDays} days`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        accountAge = `${months} month${months > 1 ? 's' : ''}`;
      } else {
        const years = Math.floor(diffDays / 365);
        accountAge = `${years} year${years > 1 ? 's' : ''}`;
      }
    }
    
    // Get plan name
    const planNames = {
      'free': 'Free',
      'pro': 'Professional',
      'enterprise': 'Enterprise'
    };
    const plan = planNames[user?.plan] || 'Professional';
    
    const totalClicksValue = totalClicks[0]?.total || 0;
    const totalQRScansValue = totalClicks[0]?.qrScans || 0;

    // Return data in format expected by frontend Profile page
    res.json({
      success: true,
      totalLinks: totalUrls,
      totalClicks: totalClicksValue,
      totalQRScans: totalQRScansValue,
      customDomains: customDomainsCount,
      accountAge: accountAge,
      plan: plan,
      data: {
        stats: {
          totalUrls,
          activeUrls,
          totalClicks: totalClicksValue,
          totalQRScans: totalQRScansValue,
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

const bulkCreate = async (req, res) => {
  try {
    const { urls } = req.body;

    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ success: false, message: 'URLs array is required' });
    }
    if (urls.length > 1000) {
      return res.status(400).json({ success: false, message: 'Maximum 1000 URLs per batch' });
    }

    const today = new Date();
    const bulkTag = `bulk upload ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`.toLowerCase();
    const bulkImportId = `bulk_${today.toISOString().split('T')[0]}_${Date.now()}`;
    const baseUrl = getPublicBaseUrl();

    // Pre-check quota for the entire batch before processing any rows
    const usageCheck = await UsageTracker.canPerformAction(req.user.id, 'createUrl', urls.length);
    if (!usageCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: usageCheck.reason,
        code: 'USAGE_LIMIT_EXCEEDED',
        data: { limit: usageCheck.limit, current: usageCheck.current, requested: urls.length }
      });
    }

    // --- Pre-flight checks (run before the main loop for efficiency) ---

    // 1. Collect all original URLs for batch Safe Browsing check
    const allOriginalUrls = urls
      .map(e => { const v = validateUrl(e.originalUrl); return v.isValid ? v.cleanUrl : null; })
      .filter(Boolean);

    // 2. Batch Safe Browsing check — ONE API call for all URLs
    const safeBrowsingResults = await safeBrowsingService.checkUrlsBatch(allOriginalUrls);

    // 3. Reachability check — same policy as createUrl/updateUrl, with bounded concurrency.
    //    Deduplicate by cleanUrl so each unique destination is only checked once.
    const reachabilityMap = new Map(); // cleanUrl → { allowed, message }
    const uniqueUrlsToCheck = [];
    for (const entry of urls) {
      const v = validateUrl(entry.originalUrl);
      if (v.isValid && !reachabilityMap.has(v.cleanUrl)) {
        reachabilityMap.set(v.cleanUrl, null); // reserve slot
        uniqueUrlsToCheck.push(v.cleanUrl);
      }
    }
    const reachabilityTasks = uniqueUrlsToCheck.map((cleanUrl) => async () => {
      // Use a shorter timeout (5 s) for bulk to keep total request time bounded.
      const result = await checkUrlReachability(cleanUrl, 5000);
      reachabilityMap.set(cleanUrl, result);
    });
    await runWithConcurrency(reachabilityTasks, 5);

    // --- End pre-flight ---

    const successful = [];
    const failed = [];

    for (let i = 0; i < urls.length; i++) {
      const entry = urls[i];
      try {
        // Validate URL format
        const urlValidation = validateUrl(entry.originalUrl);
        if (!urlValidation.isValid) {
          failed.push({ row: i + 1, originalUrl: entry.originalUrl, customCode: entry.customCode || '', title: entry.title || '', error: urlValidation.message });
          continue;
        }

        // Reachability check — same policy as createUrl/updateUrl
        const reachability = reachabilityMap.get(urlValidation.cleanUrl) || { allowed: true };
        if (!reachability.allowed) {
          failed.push({ row: i + 1, originalUrl: entry.originalUrl, customCode: entry.customCode || '', title: entry.title || '', error: reachability.message || 'URL is not reachable' });
          continue;
        }

        // Build final URL with UTM params appended if provided
        let finalUrl = urlValidation.cleanUrl;
        const utm = entry.utm || {};
        const hasUtm = utm.source || utm.medium || utm.campaign || utm.term || utm.content;
        if (hasUtm) {
          try {
            const urlObj = new URL(finalUrl);
            if (utm.source) urlObj.searchParams.set('utm_source', utm.source);
            if (utm.medium) urlObj.searchParams.set('utm_medium', utm.medium);
            if (utm.campaign) urlObj.searchParams.set('utm_campaign', utm.campaign);
            if (utm.term) urlObj.searchParams.set('utm_term', utm.term);
            if (utm.content) urlObj.searchParams.set('utm_content', utm.content);
            finalUrl = urlObj.toString();
          } catch (_) { /* keep original if URL construction fails */ }
        }

        // Check pre-computed Safe Browsing result for this URL
        const safetyCheck = safeBrowsingResults.get(urlValidation.cleanUrl) || { isSafe: true };
        if (!safetyCheck.isSafe) {
          failed.push({ row: i + 1, originalUrl: entry.originalUrl, customCode: entry.customCode || '', title: entry.title || '', error: safetyCheck.message || 'URL flagged as unsafe by Safe Browsing' });
          continue;
        }

        // Handle custom alias
        let shortCode;
        const rawAlias = entry.customCode ? entry.customCode.trim() : null;
        if (rawAlias) {
          if (rawAlias.length < 3 || rawAlias.length > 50) {
            failed.push({ row: i + 1, originalUrl: entry.originalUrl, customCode: rawAlias, title: entry.title || '', error: 'Custom alias must be between 3 and 50 characters' });
            continue;
          }
          if (!/^[\p{L}\p{N}_-]+$/u.test(rawAlias)) {
            failed.push({ row: i + 1, originalUrl: entry.originalUrl, customCode: rawAlias, title: entry.title || '', error: 'Custom alias can only contain letters, numbers, hyphens, and underscores' });
            continue;
          }
          if (isReservedAlias(rawAlias)) {
            failed.push({ row: i + 1, originalUrl: entry.originalUrl, customCode: rawAlias, title: entry.title || '', error: 'Alias is reserved for system use' });
            continue;
          }
          const existing = await Url.findOne({
            $or: [
              { shortCode: { $regex: new RegExp(`^${rawAlias}$`, 'i') } },
              { customCode: { $regex: new RegExp(`^${rawAlias}$`, 'i') } }
            ]
          });
          if (existing) {
            failed.push({ row: i + 1, originalUrl: entry.originalUrl, customCode: rawAlias, title: entry.title || '', error: 'Alias already taken' });
            continue;
          }
          shortCode = rawAlias;
        } else {
          let attempts = 0;
          do {
            shortCode = generateShortCode();
            attempts++;
            if (attempts > 10) throw new Error('Failed to generate unique short code');
          } while (await Url.findOne({ shortCode }));
        }

        // Merge user-provided tags with auto bulk tag
        const userTags = Array.isArray(entry.tags) ? entry.tags.map(t => String(t).toLowerCase().trim()).filter(Boolean) : [];
        const tags = [...new Set([...userTags, bulkTag])];

        const urlDoc = new Url({
          originalUrl: finalUrl,
          shortCode,
          customCode: rawAlias || undefined,
          title: entry.title || '',
          creator: req.user.id,
          organization: req.user.organization,
          tags,
          utm: hasUtm ? utm : {},
          bulkImportId,
          redirectType: 302
        });

        await urlDoc.save();
        await UsageTracker.trackUsage(req.user.id, 'createUrl');
        await cacheSet(`url:${shortCode.toLowerCase()}`, urlDoc, config.CACHE_TTL.URL_CACHE);

        successful.push({
          row: i + 1,
          originalUrl: entry.originalUrl,
          shortUrl: `${baseUrl}/${shortCode}`,
          shortCode,
          customCode: rawAlias || null,
          title: entry.title || ''
        });
      } catch (err) {
        failed.push({ row: i + 1, originalUrl: entry.originalUrl || '', customCode: entry.customCode || '', title: entry.title || '', error: err.message });
      }
    }

    res.status(207).json({
      success: true,
      message: `Processed ${urls.length} URL(s): ${successful.length} created, ${failed.length} failed`,
      data: {
        successful,
        failed,
        totalProcessed: urls.length,
        successCount: successful.length,
        errorCount: failed.length,
        bulkImportId
      }
    });
  } catch (error) {
    console.error('Bulk create error:', error);
    res.status(500).json({ success: false, message: 'Failed to process bulk creation' });
  }
};

const bulkCreateTemplate = (req, res) => {
  const rows = [
    ['Destination URL', 'Custom Alias', 'Title', 'Tags', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'UTM Term', 'UTM Content'],
    ['https://example.com/page', 'my-alias', 'My Page Title', 'marketing,social', 'google', 'cpc', 'summer-sale', '', ''],
    ['https://example.com/another', '', 'Another Page', 'newsletter', 'email', 'newsletter', 'weekly', '', '']
  ];
  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="bulk-links-template.csv"');
  res.send(csv);
};

const getAvailableDomains = async (req, res) => {
  try {
    const domains = await Domain.getUserDomains(req.user.id, req.user.organization);
    const activeDomains = domains.filter(domain => domain.isActive);

    // Always include the base/default system domain
    const baseUrl = getPublicBaseUrl();
    const baseDomain = getPublicBaseDomain();
    
    const domainList = [
      // Base domain (always first and default if user has no custom domains)
      {
        id: 'base',
        fullDomain: baseDomain,
        domain: baseDomain,
        subdomain: null,
        isDefault: activeDomains.length === 0 || !activeDomains.some(d => d.isDefault),
        shortUrl: baseUrl,
        status: 'active',
        isSystemDomain: true
      },
      // User's custom domains
      ...activeDomains.map(domain => ({
        id: domain._id.toString(),
        fullDomain: domain.fullDomain,
        domain: domain.domain,
        subdomain: domain.subdomain,
        isDefault: domain.isDefault,
        shortUrl: domain.shortUrl,
        status: domain.status,
        isSystemDomain: false
      }))
    ];

    res.json({
      success: true,
      data: {
        domains: domainList
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
  bulkCreate,
  bulkCreateTemplate,
  getUrlStats,
  getAvailableDomains
};