const express = require('express');
const router = express.Router();
const qrCodeController = require('../controllers/qrCodeController');
const { authenticate } = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');

/**
 * QR Code Routes
 * All routes require authentication
 */

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/qr-codes/stats
 * @desc    Get QR code statistics for the authenticated user
 * @access  Private
 */
router.get('/stats', qrCodeController.getQRCodeStats);

/**
 * @route   GET /api/qr-codes
 * @desc    Get all QR codes for the authenticated user
 * @access  Private
 */
router.get('/', qrCodeController.getUserQRCodes);

/**
 * @route   POST /api/qr-codes/generate/:linkId
 * @desc    Generate QR code for a specific URL
 * @access  Private
 */
router.post('/generate/:linkId', rateLimiter.createUrl, qrCodeController.generateQRCode);

/**
 * @route   GET /api/qr-codes/download/:linkId
 * @desc    Get QR code download URL
 * @access  Private
 */
router.get('/download/:linkId', qrCodeController.downloadQRCode);

/**
 * @route   POST /api/qr-codes/bulk-generate
 * @desc    Bulk generate QR codes for multiple URLs
 * @access  Private
 */
router.post('/bulk-generate', rateLimiter.createUrl, qrCodeController.bulkGenerateQRCodes);

/**
 * @route   GET /api/qr-codes/:linkId
 * @desc    Get QR code details for a specific URL
 * @access  Private
 */
router.get('/:linkId', qrCodeController.getQRCodeDetails);

/**
 * @route   PUT /api/qr-codes/:linkId
 * @desc    Update QR code options
 * @access  Private
 */
router.put('/:linkId', qrCodeController.updateQRCode);

/**
 * @route   DELETE /api/qr-codes/:linkId
 * @desc    Delete QR code
 * @access  Private
 */
router.delete('/:linkId', qrCodeController.deleteQRCode);

module.exports = router;
