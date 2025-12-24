const express = require('express');
const router = express.Router();

const urlController = require('../controllers/urlController');
const { authenticate, apiKeyAuth, authenticateAny } = require('../middleware/auth');
const { urlCreationLimiter, apiLimiter } = require('../middleware/rateLimiter');
const { checkResourceLimits, checkFeatureAccess } = require('../middleware/roleCheck');
const {
  validateUrlCreation,
  validateUrlUpdate,
  validateBulkDelete,
  validateObjectId,
  validatePagination,
  sanitizeInput
} = require('../middleware/validation');

router.use(sanitizeInput);

// Create URL - accepts both Bearer token and API key
router.post('/',
  authenticateAny,
  // TEMPORARILY DISABLED - Rate limiting paused until going live
  // urlCreationLimiter,
  checkResourceLimits('urls'),
  validateUrlCreation,
  urlController.createUrl
);

// Get all URLs - accepts both Bearer token and API key
router.get('/', 
  authenticateAny, 
  validatePagination, 
  urlController.getUrls
);

// Get URL stats - accepts both Bearer token and API key
router.get('/stats',
  authenticateAny,
  urlController.getUrlStats
);

// Get available domains - accepts both Bearer token and API key
router.get('/domains/available',
  authenticateAny,
  urlController.getAvailableDomains
);

// Get single URL - accepts both Bearer token and API key
router.get('/:id', 
  authenticateAny, 
  validateObjectId, 
  urlController.getUrl
);

// Update URL - accepts both Bearer token and API key
router.put('/:id', 
  authenticateAny, 
  validateObjectId, 
  validateUrlUpdate, 
  urlController.updateUrl
);

// Delete URL - accepts both Bearer token and API key
router.delete('/:id', 
  authenticateAny, 
  validateObjectId, 
  urlController.deleteUrl
);

// Bulk delete - accepts both Bearer token and API key
router.post('/bulk-delete', 
  authenticateAny, 
  checkFeatureAccess('bulk_operations'),
  validateBulkDelete, 
  urlController.bulkDelete
);

module.exports = router;