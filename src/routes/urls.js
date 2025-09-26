const express = require('express');
const router = express.Router();

const urlController = require('../controllers/urlController');
const { authenticate, apiKeyAuth } = require('../middleware/auth');
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

router.post('/', 
  authenticate, 
  urlCreationLimiter, 
  checkResourceLimits('urls'),
  validateUrlCreation, 
  urlController.createUrl
);

router.get('/', 
  authenticate, 
  validatePagination, 
  urlController.getUrls
);

router.get('/stats',
  authenticate,
  urlController.getUrlStats
);

router.get('/domains/available',
  authenticate,
  urlController.getAvailableDomains
);

router.get('/:id', 
  authenticate, 
  validateObjectId, 
  urlController.getUrl
);

router.put('/:id', 
  authenticate, 
  validateObjectId, 
  validateUrlUpdate, 
  urlController.updateUrl
);

router.delete('/:id', 
  authenticate, 
  validateObjectId, 
  urlController.deleteUrl
);

router.post('/bulk-delete', 
  authenticate, 
  checkFeatureAccess('bulk_operations'),
  validateBulkDelete, 
  urlController.bulkDelete
);

module.exports = router;