const contentFilterService = require('../services/contentFilterService');

/**
 * Content Filter Controller
 * Handles HTTP requests for content filtering operations
 */

/**
 * Get filter settings
 * GET /api/content-filter/settings
 */
exports.getSettings = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const settings = await contentFilterService.getSettings(userId);

    res.status(200).json({
      success: true,
      data: settings,
      ...settings.toObject() // Also spread settings at root level for frontend compatibility
    });
  } catch (error) {
    console.error('Error getting filter settings:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get filter settings',
      error: error.message
    });
  }
};

/**
 * Update filter settings
 * PUT /api/content-filter/settings
 */
exports.updateSettings = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const settings = req.body;

    const updatedSettings = await contentFilterService.updateSettings(userId, settings);

    res.status(200).json({
      success: true,
      message: 'Filter settings updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    console.error('Error updating filter settings:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update filter settings',
      error: error.message
    });
  }
};

/**
 * Get blocked domains
 * GET /api/content-filter/blocked-domains
 */
exports.getBlockedDomains = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const domains = await contentFilterService.getBlockedDomains(userId);

    res.status(200).json(domains); // Return array directly for frontend compatibility
  } catch (error) {
    console.error('Error getting blocked domains:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get blocked domains',
      error: error.message
    });
  }
};

/**
 * Add blocked domain
 * POST /api/content-filter/blocked-domains
 */
exports.addBlockedDomain = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { domain, reason = 'manual' } = req.body;

    if (!domain) {
      return res.status(400).json({
        success: false,
        message: 'Domain is required'
      });
    }

    const blockedDomain = await contentFilterService.addBlockedDomain(userId, domain, reason);

    res.status(201).json({
      success: true,
      message: 'Domain added to blocked list',
      data: blockedDomain
    });
  } catch (error) {
    console.error('Error adding blocked domain:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add blocked domain',
      error: error.message
    });
  }
};

/**
 * Remove blocked domain
 * DELETE /api/content-filter/blocked-domains/:domain
 */
exports.removeBlockedDomain = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { domain } = req.params;

    const result = await contentFilterService.removeBlockedDomain(userId, decodeURIComponent(domain));

    res.status(200).json({
      success: true,
      message: 'Domain removed from blocked list',
      data: result
    });
  } catch (error) {
    console.error('Error removing blocked domain:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to remove blocked domain',
      error: error.message
    });
  }
};

/**
 * Get blocked keywords
 * GET /api/content-filter/blocked-keywords
 */
exports.getBlockedKeywords = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const keywords = await contentFilterService.getBlockedKeywords(userId);

    res.status(200).json(keywords); // Return array directly for frontend compatibility
  } catch (error) {
    console.error('Error getting blocked keywords:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get blocked keywords',
      error: error.message
    });
  }
};

/**
 * Add blocked keyword
 * POST /api/content-filter/blocked-keywords
 */
exports.addBlockedKeyword = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { keyword, caseSensitive = false } = req.body;

    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: 'Keyword is required'
      });
    }

    const blockedKeyword = await contentFilterService.addBlockedKeyword(userId, keyword, caseSensitive);

    res.status(201).json({
      success: true,
      message: 'Keyword added to blocked list',
      data: blockedKeyword
    });
  } catch (error) {
    console.error('Error adding blocked keyword:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add blocked keyword',
      error: error.message
    });
  }
};

/**
 * Remove blocked keyword
 * DELETE /api/content-filter/blocked-keywords/:keyword
 */
exports.removeBlockedKeyword = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { keyword } = req.params;

    const result = await contentFilterService.removeBlockedKeyword(userId, decodeURIComponent(keyword));

    res.status(200).json({
      success: true,
      message: 'Keyword removed from blocked list',
      data: result
    });
  } catch (error) {
    console.error('Error removing blocked keyword:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to remove blocked keyword',
      error: error.message
    });
  }
};

/**
 * Get allowed domains (whitelist)
 * GET /api/content-filter/allowed-domains
 */
exports.getAllowedDomains = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const domains = await contentFilterService.getAllowedDomains(userId);

    res.status(200).json(domains); // Return array directly for frontend compatibility
  } catch (error) {
    console.error('Error getting allowed domains:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get allowed domains',
      error: error.message
    });
  }
};

/**
 * Add allowed domain
 * POST /api/content-filter/allowed-domains
 */
exports.addAllowedDomain = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { domain, note = '' } = req.body;

    if (!domain) {
      return res.status(400).json({
        success: false,
        message: 'Domain is required'
      });
    }

    const allowedDomain = await contentFilterService.addAllowedDomain(userId, domain, note);

    res.status(201).json({
      success: true,
      message: 'Domain added to allowed list',
      data: allowedDomain
    });
  } catch (error) {
    console.error('Error adding allowed domain:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add allowed domain',
      error: error.message
    });
  }
};

/**
 * Remove allowed domain
 * DELETE /api/content-filter/allowed-domains/:domain
 */
exports.removeAllowedDomain = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { domain } = req.params;

    const result = await contentFilterService.removeAllowedDomain(userId, decodeURIComponent(domain));

    res.status(200).json({
      success: true,
      message: 'Domain removed from allowed list',
      data: result
    });
  } catch (error) {
    console.error('Error removing allowed domain:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to remove allowed domain',
      error: error.message
    });
  }
};

/**
 * Get filter logs
 * GET /api/content-filter/logs
 */
exports.getFilterLogs = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { limit, reason, startDate, endDate } = req.query;

    const options = {};
    if (limit) options.limit = parseInt(limit);
    if (reason) options.reason = reason;
    if (startDate) options.startDate = startDate;
    if (endDate) options.endDate = endDate;

    const logs = await contentFilterService.getFilterLogs(userId, options);

    res.status(200).json(logs); // Return array directly for frontend compatibility
  } catch (error) {
    console.error('Error getting filter logs:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get filter logs',
      error: error.message
    });
  }
};

/**
 * Get filter statistics
 * GET /api/content-filter/stats
 */
exports.getFilterStats = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const stats = await contentFilterService.getFilterStats(userId);

    res.status(200).json({
      success: true,
      data: stats,
      ...stats // Also spread stats at root level for frontend compatibility
    });
  } catch (error) {
    console.error('Error getting filter stats:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get filter statistics',
      error: error.message
    });
  }
};

/**
 * Validate URL
 * POST /api/content-filter/validate
 */
exports.validateUrl = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required'
      });
    }

    const result = await contentFilterService.validateUrl(url, userId);

    res.status(200).json({
      success: true,
      data: result,
      ...result // Also spread result at root level for frontend compatibility
    });
  } catch (error) {
    console.error('Error validating URL:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to validate URL',
      error: error.message
    });
  }
};
