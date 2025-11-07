const qrCodeService = require('../services/qrCodeService');

/**
 * QR Code Controller
 * Handles HTTP requests for QR code operations
 */

/**
 * Generate QR code for a URL
 * POST /api/qr-codes/generate/:linkId
 */
exports.generateQRCode = async (req, res) => {
  try {
    const { linkId } = req.params;
    const userId = req.user._id || req.user.id;
    const options = req.body;

    const result = await qrCodeService.generateQRCode(linkId, userId, options);

    res.status(200).json({
      success: true,
      message: 'QR code generated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to generate QR code',
      error: error.message
    });
  }
};

/**
 * Get QR code for download
 * GET /api/qr-codes/download/:linkId
 */
exports.downloadQRCode = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { format = 'png' } = req.query;
    const userId = req.user._id || req.user.id;

    const result = await qrCodeService.getQRCodeForDownload(linkId, userId, format);

    res.status(200).json({
      success: true,
      message: 'QR code download URL generated',
      data: result,
      downloadUrl: result.downloadUrl
    });
  } catch (error) {
    console.error('Error downloading QR code:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to download QR code',
      error: error.message
    });
  }
};

/**
 * Bulk generate QR codes
 * POST /api/qr-codes/bulk-generate
 */
exports.bulkGenerateQRCodes = async (req, res) => {
  try {
    const { linkIds, options = {} } = req.body;
    const userId = req.user._id || req.user.id;

    if (!linkIds || !Array.isArray(linkIds) || linkIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'linkIds array is required'
      });
    }

    const result = await qrCodeService.bulkGenerateQRCodes(linkIds, userId, options);

    res.status(200).json({
      success: true,
      message: `Generated ${result.generated} QR codes successfully`,
      data: result
    });
  } catch (error) {
    console.error('Error bulk generating QR codes:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to bulk generate QR codes',
      error: error.message
    });
  }
};

/**
 * Delete QR code
 * DELETE /api/qr-codes/:linkId
 */
exports.deleteQRCode = async (req, res) => {
  try {
    const { linkId } = req.params;
    const userId = req.user._id || req.user.id;

    const result = await qrCodeService.deleteQRCode(linkId, userId);

    res.status(200).json({
      success: true,
      message: 'QR code deleted successfully',
      data: result
    });
  } catch (error) {
    console.error('Error deleting QR code:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete QR code',
      error: error.message
    });
  }
};

/**
 * Get user's QR codes
 * GET /api/qr-codes
 */
exports.getUserQRCodes = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { page, limit, isActive } = req.query;

    const options = {};
    if (page) options.page = parseInt(page);
    if (limit) options.limit = parseInt(limit);
    if (isActive !== undefined) options.isActive = isActive === 'true';

    const result = await qrCodeService.getUserQRCodes(userId, options);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting user QR codes:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get QR codes',
      error: error.message
    });
  }
};

/**
 * Get QR code statistics
 * GET /api/qr-codes/stats
 */
exports.getQRCodeStats = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    const stats = await qrCodeService.getQRCodeStats(userId);

    res.status(200).json({
      success: true,
      data: stats,
      ...stats // Also spread stats at root level for frontend compatibility
    });
  } catch (error) {
    console.error('Error getting QR code stats:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get QR code statistics',
      error: error.message
    });
  }
};

/**
 * Get single QR code details
 * GET /api/qr-codes/:linkId
 */
exports.getQRCodeDetails = async (req, res) => {
  try {
    const { linkId } = req.params;
    const userId = req.user._id || req.user.id;

    const QRCode = require('../models/QRCode');
    const qrCode = await QRCode.findOne({ url: linkId, creator: userId })
      .populate('url', 'shortCode originalUrl title domain clickCount');

    if (!qrCode) {
      return res.status(404).json({
        success: false,
        message: 'QR code not found'
      });
    }

    res.status(200).json({
      success: true,
      data: qrCode
    });
  } catch (error) {
    console.error('Error getting QR code details:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get QR code details',
      error: error.message
    });
  }
};

/**
 * Update QR code options
 * PUT /api/qr-codes/:linkId
 */
exports.updateQRCode = async (req, res) => {
  try {
    const { linkId } = req.params;
    const userId = req.user._id || req.user.id;
    const options = req.body;

    // Regenerate with new options
    const result = await qrCodeService.generateQRCode(linkId, userId, options);

    res.status(200).json({
      success: true,
      message: 'QR code updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error updating QR code:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update QR code',
      error: error.message
    });
  }
};
