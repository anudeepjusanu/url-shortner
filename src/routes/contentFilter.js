const express = require('express');
const router = express.Router();
const contentFilterController = require('../controllers/contentFilterController');
const { authenticate } = require('../middleware/auth');

/**
 * Content Filter Routes
 * All routes require authentication
 */

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/content-filter/settings
 * @desc    Get content filter settings for the authenticated user
 * @access  Private
 */
router.get('/settings', contentFilterController.getSettings);

/**
 * @route   PUT /api/content-filter/settings
 * @desc    Update content filter settings
 * @access  Private
 */
router.put('/settings', contentFilterController.updateSettings);

/**
 * @route   GET /api/content-filter/blocked-domains
 * @desc    Get blocked domains list
 * @access  Private
 */
router.get('/blocked-domains', contentFilterController.getBlockedDomains);

/**
 * @route   POST /api/content-filter/blocked-domains
 * @desc    Add domain to blocked list
 * @access  Private
 */
router.post('/blocked-domains', contentFilterController.addBlockedDomain);

/**
 * @route   DELETE /api/content-filter/blocked-domains/:domain
 * @desc    Remove domain from blocked list
 * @access  Private
 */
router.delete('/blocked-domains/:domain', contentFilterController.removeBlockedDomain);

/**
 * @route   GET /api/content-filter/blocked-keywords
 * @desc    Get blocked keywords list
 * @access  Private
 */
router.get('/blocked-keywords', contentFilterController.getBlockedKeywords);

/**
 * @route   POST /api/content-filter/blocked-keywords
 * @desc    Add keyword to blocked list
 * @access  Private
 */
router.post('/blocked-keywords', contentFilterController.addBlockedKeyword);

/**
 * @route   DELETE /api/content-filter/blocked-keywords/:keyword
 * @desc    Remove keyword from blocked list
 * @access  Private
 */
router.delete('/blocked-keywords/:keyword', contentFilterController.removeBlockedKeyword);

/**
 * @route   GET /api/content-filter/allowed-domains
 * @desc    Get allowed domains list (whitelist)
 * @access  Private
 */
router.get('/allowed-domains', contentFilterController.getAllowedDomains);

/**
 * @route   POST /api/content-filter/allowed-domains
 * @desc    Add domain to allowed list
 * @access  Private
 */
router.post('/allowed-domains', contentFilterController.addAllowedDomain);

/**
 * @route   DELETE /api/content-filter/allowed-domains/:domain
 * @desc    Remove domain from allowed list
 * @access  Private
 */
router.delete('/allowed-domains/:domain', contentFilterController.removeAllowedDomain);

/**
 * @route   GET /api/content-filter/logs
 * @desc    Get filter activity logs
 * @access  Private
 */
router.get('/logs', contentFilterController.getFilterLogs);

/**
 * @route   GET /api/content-filter/stats
 * @desc    Get filter statistics
 * @access  Private
 */
router.get('/stats', contentFilterController.getFilterStats);

/**
 * @route   POST /api/content-filter/validate
 * @desc    Validate URL against content filters
 * @access  Private
 */
router.post('/validate', contentFilterController.validateUrl);

module.exports = router;
