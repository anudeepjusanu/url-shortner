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
  urlCreationLimiter,
  checkResourceLimits('urls'),
  validateUrlCreation,
  urlController.createUrl
);

// Get all URLs - accepts both Bearer token and API key
router.get('/', 
  authenticateAny,
  apiLimiter,
  validatePagination, 
  urlController.getUrls
);

// Get URL stats - accepts both Bearer token and API key
router.get('/stats',
  authenticateAny,
  apiLimiter,
  urlController.getUrlStats
);

// Get available domains - accepts both Bearer token and API key
router.get('/domains/available',
  authenticateAny,
  apiLimiter,
  urlController.getAvailableDomains
);

// Get single URL - accepts both Bearer token and API key
router.get('/:id', 
  authenticateAny,
  apiLimiter,
  validateObjectId, 
  urlController.getUrl
);

// Update URL - accepts both Bearer token and API key
router.put('/:id', 
  authenticateAny,
  apiLimiter,
  validateObjectId, 
  validateUrlUpdate, 
  urlController.updateUrl
);

// Delete URL - accepts both Bearer token and API key
router.delete('/:id', 
  authenticateAny,
  apiLimiter,
  validateObjectId, 
  urlController.deleteUrl
);

// Bulk delete - accepts both Bearer token and API key
router.post('/bulk-delete', 
  authenticateAny,
  apiLimiter,
  checkFeatureAccess('bulk_operations'),
  validateBulkDelete, 
  urlController.bulkDelete
);

module.exports = router;