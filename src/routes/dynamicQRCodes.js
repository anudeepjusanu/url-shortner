const express = require('express');
const router = express.Router();

const ctrl = require('../controllers/dynamicQRCodeController');
const { authenticate } = require('../middleware/auth');
const { apiLimiter, qrDownloadLimiter } = require('../middleware/rateLimiter');
const { validateObjectId, sanitizeInput } = require('../middleware/validation');

router.use(sanitizeInput);
router.use(authenticate);

// List all dynamic QR codes for the authenticated user
router.get('/', apiLimiter, ctrl.list);

// Create a new dynamic QR code
router.post('/', apiLimiter, ctrl.create);

// Get a single dynamic QR code
router.get('/:id', apiLimiter, validateObjectId, ctrl.get);

// Update name / customization / isActive
router.put('/:id', apiLimiter, validateObjectId, ctrl.update);

// Update destination URL (the core "dynamic" operation)
router.put('/:id/destination', apiLimiter, validateObjectId, ctrl.updateDestination);

// Scan analytics for a specific dynamic QR code
router.get('/:id/analytics', apiLimiter, validateObjectId, ctrl.getAnalytics);

// Download the QR image (authenticated)
router.get('/:id/download', qrDownloadLimiter, validateObjectId, ctrl.download);

// Delete a dynamic QR code
router.delete('/:id', apiLimiter, validateObjectId, ctrl.remove);

module.exports = router;
