/**
 * Google Analytics Routes
 * All routes are restricted to super_admin only
 */

const express = require('express');
const router = express.Router();
const googleAnalyticsController = require('../controllers/googleAnalyticsController');
const { authenticate } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/superAdmin');

// All routes require authentication and super_admin role
router.use(authenticate);
router.use(requireSuperAdmin);

// Check if GA is configured
router.get('/status', googleAnalyticsController.checkConfiguration);

// Get real-time active users
router.get('/realtime', googleAnalyticsController.getRealtime);

// Get overview metrics
router.get('/overview', googleAnalyticsController.getOverview);

// Get traffic over time (daily breakdown)
router.get('/traffic-over-time', googleAnalyticsController.getTrafficOverTime);

// Get traffic sources
router.get('/traffic-sources', googleAnalyticsController.getTrafficSources);

// Get top pages
router.get('/top-pages', googleAnalyticsController.getTopPages);

// Get geographic data
router.get('/geographic', googleAnalyticsController.getGeographic);

// Get device breakdown
router.get('/devices', googleAnalyticsController.getDevices);

// Get browser data
router.get('/browsers', googleAnalyticsController.getBrowsers);

// Get full dashboard data (all metrics in one call)
router.get('/dashboard', googleAnalyticsController.getDashboard);

module.exports = router;
