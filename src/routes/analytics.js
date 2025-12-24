const express = require('express');
const router = express.Router();

const analyticsController = require('../controllers/analyticsController');
const { authenticate, authenticateAny } = require('../middleware/auth');
const { checkFeatureAccess } = require('../middleware/roleCheck');
const { apiLimiter } = require('../middleware/rateLimiter');
const {
  validateObjectId,
  validateAnalyticsQuery,
  validateExportQuery,
  sanitizeInput
} = require('../middleware/validation');

router.use(sanitizeInput);
router.use(authenticateAny);  // Accept both Bearer token and API key
// TEMPORARILY DISABLED - Rate limiting paused until going live
// router.use(apiLimiter);

router.get('/dashboard', 
  validateAnalyticsQuery, 
  analyticsController.getDashboardAnalytics
);

router.get('/:id', 
  validateObjectId, 
  validateAnalyticsQuery, 
  analyticsController.getUrlAnalytics
);

router.get('/:id/export', 
  validateObjectId, 
  checkFeatureAccess('analytics_export'),
  validateExportQuery, 
  analyticsController.exportAnalytics
);

module.exports = router;