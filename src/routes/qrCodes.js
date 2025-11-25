const express = require('express');
const router = express.Router();

const qrCodeController = require('../controllers/qrCodeController');
const { authenticate } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const { validateObjectId, sanitizeInput } = require('../middleware/validation');
const { checkFeatureAccess } = require('../middleware/roleCheck');

// Apply middleware
router.use(sanitizeInput);
router.use(authenticate);
router.use(apiLimiter);

// Get QR code statistics
router.get('/stats', qrCodeController.getQRCodeStats);

// Generate QR code for a URL
router.post('/generate/:id',
  validateObjectId,
  qrCodeController.generateQRCode
);

// Download QR code
router.get('/download/:id',
  validateObjectId,
  qrCodeController.downloadQRCode
);

// Get QR code for a URL
router.get('/:id',
  validateObjectId,
  qrCodeController.getUrlQRCode
);

// Update QR code customization
router.put('/customize/:id',
  validateObjectId,
  qrCodeController.updateQRCodeCustomization
);

// Bulk generate QR codes
router.post('/bulk-generate',
  checkFeatureAccess('bulk_operations'),
  qrCodeController.bulkGenerateQRCodes
);

module.exports = router;
