const QRCode = require('../models/QRCode');
const Url = require('../models/Url');
const qrcode = require('qrcode');
const axios = require('axios');

/**
 * QR Code Service
 * Handles QR code generation, customization, and management
 */
class QRCodeService {
  /**
   * Generate QR code for a URL
   * @param {String} urlId - URL ID
   * @param {String} userId - User ID
   * @param {Object} options - QR code customization options
   * @returns {Object} Generated QR code data
   */
  async generateQRCode(urlId, userId, options = {}) {
    // Verify URL exists and belongs to user
    const url = await Url.findOne({ _id: urlId, creator: userId });
    if (!url) {
      throw new Error('URL not found or access denied');
    }

    // Check if QR code already exists
    let qrCodeDoc = await QRCode.findOne({ url: urlId, creator: userId });

    // Construct short URL
    const shortUrl = this.getShortUrl(url);

    // Merge options with defaults
    const qrOptions = {
      size: options.size || 300,
      format: options.format || 'png',
      errorCorrection: options.errorCorrection || 'M',
      foregroundColor: options.foregroundColor || '#000000',
      backgroundColor: options.backgroundColor || '#FFFFFF',
      includeMargin: options.includeMargin !== undefined ? options.includeMargin : true,
      logo: options.logo || null
    };

    // Generate QR code
    let qrCodeData;

    if (qrOptions.format === 'png' || qrOptions.format === 'jpg') {
      // Generate using qrcode library
      qrCodeData = await this.generateQRCodeImage(shortUrl, qrOptions);
    } else if (qrOptions.format === 'svg') {
      // Generate SVG
      qrCodeData = await this.generateQRCodeSVG(shortUrl, qrOptions);
    } else {
      // For other formats, use external service
      qrCodeData = this.generateQRCodeServiceUrl(shortUrl, qrOptions);
    }

    // Update or create QR code document
    if (qrCodeDoc) {
      qrCodeDoc.options = qrOptions;
      qrCodeData && (qrCodeDoc.qrCodeData = qrCodeData);
      qrCodeDoc.updatedAt = new Date();
      await qrCodeDoc.save();
    } else {
      qrCodeDoc = await QRCode.create({
        url: urlId,
        creator: userId,
        options: qrOptions,
        qrCodeData: qrCodeData || null
      });
    }

    return {
      success: true,
      qrCode: qrCodeDoc,
      shortUrl,
      downloadUrl: this.generateQRCodeServiceUrl(shortUrl, qrOptions)
    };
  }

  /**
   * Generate QR code image (PNG/JPG)
   * @param {String} data - Data to encode
   * @param {Object} options - QR code options
   * @returns {String} Base64 encoded image
   */
  async generateQRCodeImage(data, options) {
    try {
      const qrOptions = {
        errorCorrectionLevel: options.errorCorrection || 'M',
        type: 'image/png',
        quality: 1,
        margin: options.includeMargin ? 4 : 0,
        width: options.size || 300,
        color: {
          dark: options.foregroundColor || '#000000',
          light: options.backgroundColor || '#FFFFFF'
        }
      };

      const qrCodeDataUrl = await qrcode.toDataURL(data, qrOptions);
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code image:', error);
      throw new Error('Failed to generate QR code image');
    }
  }

  /**
   * Generate QR code SVG
   * @param {String} data - Data to encode
   * @param {Object} options - QR code options
   * @returns {String} SVG string
   */
  async generateQRCodeSVG(data, options) {
    try {
      const qrOptions = {
        errorCorrectionLevel: options.errorCorrection || 'M',
        type: 'svg',
        margin: options.includeMargin ? 4 : 0,
        width: options.size || 300,
        color: {
          dark: options.foregroundColor || '#000000',
          light: options.backgroundColor || '#FFFFFF'
        }
      };

      const svgString = await qrcode.toString(data, qrOptions);
      return svgString;
    } catch (error) {
      console.error('Error generating QR code SVG:', error);
      throw new Error('Failed to generate QR code SVG');
    }
  }

  /**
   * Generate QR code service URL (fallback)
   * @param {String} data - Data to encode
   * @param {Object} options - QR code options
   * @returns {String} QR code service URL
   */
  generateQRCodeServiceUrl(data, options) {
    const size = options.size || 300;
    const fgColor = (options.foregroundColor || '#000000').replace('#', '');
    const bgColor = (options.backgroundColor || '#FFFFFF').replace('#', '');
    const format = options.format || 'png';

    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&color=${fgColor}&bgcolor=${bgColor}&format=${format}`;
  }

  /**
   * Get short URL from URL document
   * @param {Object} url - URL document
   * @returns {String} Short URL
   */
  getShortUrl(url) {
    const baseUrl = process.env.BASE_URL || 'https://laghhu.link';
    const domain = url.domain || baseUrl.replace(/^https?:\/\//, '');
    return `${domain.startsWith('http') ? '' : 'https://'}${domain}/${url.shortCode}`;
  }

  /**
   * Get QR code for download
   * @param {String} urlId - URL ID
   * @param {String} userId - User ID
   * @param {String} format - Download format
   * @returns {Object} Download data
   */
  async getQRCodeForDownload(urlId, userId, format = 'png') {
    // Get URL and QR code
    const url = await Url.findOne({ _id: urlId, creator: userId });
    if (!url) {
      throw new Error('URL not found or access denied');
    }

    let qrCodeDoc = await QRCode.findOne({ url: urlId, creator: userId });

    // Generate if not exists
    if (!qrCodeDoc) {
      const result = await this.generateQRCode(urlId, userId, { format });
      qrCodeDoc = result.qrCode;
    }

    // Increment download count
    await qrCodeDoc.incrementDownloadCount();

    const shortUrl = this.getShortUrl(url);
    const downloadUrl = this.generateQRCodeServiceUrl(shortUrl, {
      ...qrCodeDoc.options,
      format
    });

    return {
      success: true,
      downloadUrl,
      qrCodeData: qrCodeDoc.qrCodeData,
      format,
      shortUrl
    };
  }

  /**
   * Bulk generate QR codes
   * @param {Array} urlIds - Array of URL IDs
   * @param {String} userId - User ID
   * @param {Object} options - QR code options
   * @returns {Object} Bulk generation result
   */
  async bulkGenerateQRCodes(urlIds, userId, options = {}) {
    const results = {
      success: [],
      failed: []
    };

    for (const urlId of urlIds) {
      try {
        const result = await this.generateQRCode(urlId, userId, options);
        results.success.push({
          urlId,
          qrCode: result.qrCode
        });
      } catch (error) {
        results.failed.push({
          urlId,
          error: error.message
        });
      }
    }

    return {
      success: true,
      total: urlIds.length,
      generated: results.success.length,
      failed: results.failed.length,
      results
    };
  }

  /**
   * Delete QR code
   * @param {String} urlId - URL ID
   * @param {String} userId - User ID
   * @returns {Object} Deletion result
   */
  async deleteQRCode(urlId, userId) {
    const qrCode = await QRCode.findOne({ url: urlId, creator: userId });

    if (!qrCode) {
      throw new Error('QR code not found');
    }

    await QRCode.deleteOne({ _id: qrCode._id });

    return {
      success: true,
      message: 'QR code deleted successfully'
    };
  }

  /**
   * Get user QR codes
   * @param {String} userId - User ID
   * @param {Object} options - Query options
   * @returns {Object} QR codes list
   */
  async getUserQRCodes(userId, options = {}) {
    return QRCode.getUserQRCodes(userId, options);
  }

  /**
   * Get QR code statistics
   * @param {String} userId - User ID
   * @returns {Object} QR code statistics
   */
  async getQRCodeStats(userId) {
    return QRCode.getUserStats(userId);
  }

  /**
   * Update QR code scan count (called from redirect service)
   * @param {String} urlId - URL ID
   */
  async updateScanCount(urlId) {
    try {
      const qrCode = await QRCode.findOne({ url: urlId });
      if (qrCode) {
        await qrCode.incrementScanCount();
      }
    } catch (error) {
      console.error('Error updating QR code scan count:', error);
      // Don't throw error, this is a non-critical operation
    }
  }
}

module.exports = new QRCodeService();
