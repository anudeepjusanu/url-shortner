const express = require('express');
const router = express.Router();

const qrCodeController = require('../controllers/qrCodeController');
const { authenticate, authenticateAny } = require('../middleware/auth');
const { apiLimiter, qrDownloadLimiter } = require('../middleware/rateLimiter');
const { validateObjectId, sanitizeInput } = require('../middleware/validation');
const { checkFeatureAccess } = require('../middleware/roleCheck');

// Apply middleware
router.use(sanitizeInput);
router.use(authenticateAny);  // Accept both Bearer token and API key

// Get QR code statistics
router.get('/stats', apiLimiter, qrCodeController.getQRCodeStats);

// Generate QR code for a URL
router.post('/generate/:id',
  apiLimiter,
  validateObjectId,
  qrCodeController.generateQRCode
);

// Download QR code - use more lenient rate limiter
router.get('/download/:id',
  qrDownloadLimiter,
  validateObjectId,
  qrCodeController.downloadQRCode
);

// Get QR code for a URL
router.get('/:id',
  apiLimiter,
  validateObjectId,
  qrCodeController.getUrlQRCode
);

// Update QR code customization
router.put('/customize/:id',
  apiLimiter,
  validateObjectId,
  qrCodeController.updateQRCodeCustomization
);

// Bulk generate QR codes
router.post('/bulk-generate',
  apiLimiter,
  checkFeatureAccess('bulk_operations'),
  qrCodeController.bulkGenerateQRCodes
);

module.exports = router;
