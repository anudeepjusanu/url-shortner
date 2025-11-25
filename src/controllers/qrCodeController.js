const Url = require('../models/Url');
const QRCode = require('qrcode');
const QRCodeModel = require('../models/QRCode');

// Generate QR Code for a URL
const generateQRCode = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      size = 300,
      format = 'png',
      errorCorrection = 'M',
      foregroundColor = '#000000',
      backgroundColor = '#FFFFFF',
      includeMargin = true
    } = req.body;

    // Find the URL
    const url = await Url.findById(id);

    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }

    // Check if user owns this URL
    if (url.creator.toString() !== req.user.id &&
        (!req.user.organization || url.organization?.toString() !== req.user.organization.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Build the short URL with QR tracking parameter
    const shortUrl = `${process.env.SHORT_DOMAIN || 'https://laghhu.link'}/${url.shortCode}?qr=1`;

    // Generate QR Code options
    const qrOptions = {
      errorCorrectionLevel: errorCorrection,
      type: format === 'svg' ? 'svg' : 'image/png',
      quality: 0.92,
      margin: includeMargin ? 4 : 0,
      color: {
        dark: foregroundColor,
        light: backgroundColor
      },
      width: parseInt(size)
    };

    // Generate QR Code
    let qrCodeData;
    if (format === 'svg') {
      qrCodeData = await QRCode.toString(shortUrl, { ...qrOptions, type: 'svg' });
    } else {
      qrCodeData = await QRCode.toDataURL(shortUrl, qrOptions);
    }

    // Save QR customization to QRCode model
    const qrCodeDoc = await QRCodeModel.getOrCreate(
      url,
      {
        size: parseInt(size),
        format,
        errorCorrection,
        foregroundColor,
        backgroundColor,
        includeMargin
      },
      req.user.id,
      req.user.organization
    );

    // Update URL with QR code info and save the QR code data
    url.qrCodeGenerated = true;
    url.qrCodeGeneratedAt = new Date();
    url.qrCode = qrCodeData; // Save QR code SVG/data URL to Url model
    url.qrCodeSettings = {
      size: parseInt(size),
      format,
      errorCorrection,
      foregroundColor,
      backgroundColor,
      includeMargin
    };
    await url.save();

    res.json({
      success: true,
      data: {
        qrCode: qrCodeData,
        url: shortUrl,
        format: format
      }
    });
  } catch (error) {
    console.error('Generate QR Code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate QR Code'
    });
  }
};

// Download QR Code
const downloadQRCode = async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'png', size = 300 } = req.query;

    // Find the URL
    const url = await Url.findById(id);

    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }

    // Check if user owns this URL
    if (url.creator.toString() !== req.user.id &&
        (!req.user.organization || url.organization?.toString() !== req.user.organization.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Build the short URL with QR tracking parameter
    const shortUrl = `${process.env.SHORT_DOMAIN || 'https://laghhu.link'}/${url.shortCode}?qr=1`;

    // Generate QR Code
    const qrOptions = {
      errorCorrectionLevel: 'M',
      type: format === 'svg' ? 'svg' : 'image/png',
      quality: 0.92,
      margin: 4,
      width: parseInt(size)
    };

    if (format === 'svg') {
      const svg = await QRCode.toString(shortUrl, { ...qrOptions, type: 'svg' });
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', `attachment; filename="qr-${url.shortCode}.svg"`);
      res.send(svg);
    } else {
      const buffer = await QRCode.toBuffer(shortUrl, qrOptions);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="qr-${url.shortCode}.png"`);
      res.send(buffer);
    }

    // Track download in URL model
    url.qrCodeDownloads = (url.qrCodeDownloads || 0) + 1;
    url.lastQRCodeDownload = new Date();
    await url.save();

    // Track download in QRCode model
    const qrCodeDoc = await QRCodeModel.findByUrl(url._id);
    if (qrCodeDoc) {
      await qrCodeDoc.incrementDownload();
    }
  } catch (error) {
    console.error('Download QR Code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download QR Code'
    });
  }
};

// Get QR Code for a URL
const getUrlQRCode = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the URL
    const url = await Url.findById(id);

    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }

    // Check if user owns this URL
    if (url.creator.toString() !== req.user.id &&
        (!req.user.organization || url.organization?.toString() !== req.user.organization.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Build the short URL with QR tracking parameter
    const shortUrl = `${process.env.SHORT_DOMAIN || 'https://laghhu.link'}/${url.shortCode}?qr=1`;

    // Get QR customization from QRCode model
    const qrCodeDoc = await QRCodeModel.findByUrl(id);

    // Generate QR Code as data URL
    const qrCodeData = await QRCode.toDataURL(shortUrl, {
      errorCorrectionLevel: 'M',
      quality: 0.92,
      margin: 4,
      width: 300
    });

    res.json({
      success: true,
      data: {
        qrCode: qrCodeData,
        url: shortUrl,
        shortCode: url.shortCode,
        qrCodeGenerated: url.qrCodeGenerated,
        qrCodeGeneratedAt: url.qrCodeGeneratedAt,
        qrCodeDownloads: url.qrCodeDownloads || 0,
        qrCodeScans: url.qrScanCount || 0,
        uniqueQRScans: url.uniqueQrScanCount || 0,
        lastQRScanAt: url.lastQrScanAt,
        customization: qrCodeDoc?.customization || null,
        scanCount: qrCodeDoc?.scanCount || 0,
        uniqueScanCount: qrCodeDoc?.uniqueScanCount || 0
      }
    });
  } catch (error) {
    console.error('Get URL QR Code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get QR Code'
    });
  }
};

// Bulk generate QR Codes
const bulkGenerateQRCodes = async (req, res) => {
  try {
    const { urlIds, options = {} } = req.body;

    if (!urlIds || !Array.isArray(urlIds) || urlIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'URL IDs array is required'
      });
    }

    const {
      size = 300,
      format = 'png',
      errorCorrection = 'M'
    } = options;

    // Find all URLs
    const urls = await Url.find({
      _id: { $in: urlIds },
      $or: [
        { creator: req.user.id },
        ...(req.user.organization ? [{ organization: req.user.organization }] : [])
      ]
    });

    if (urls.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No URLs found'
      });
    }

    // Generate QR codes for all URLs
    const qrCodes = await Promise.all(
      urls.map(async (url) => {
        const shortUrl = `${process.env.SHORT_DOMAIN || 'https://laghhu.link'}/${url.shortCode}?qr=1`;

        const qrOptions = {
          errorCorrectionLevel: errorCorrection,
          type: format === 'svg' ? 'svg' : 'image/png',
          quality: 0.92,
          margin: 4,
          width: parseInt(size)
        };

        let qrCodeData;
        if (format === 'svg') {
          qrCodeData = await QRCode.toString(shortUrl, { ...qrOptions, type: 'svg' });
        } else {
          qrCodeData = await QRCode.toDataURL(shortUrl, qrOptions);
        }

        // Save QR customization to QRCode model
        await QRCodeModel.getOrCreate(
          url,
          {
            size: parseInt(size),
            format,
            errorCorrection
          },
          req.user.id,
          req.user.organization
        );

        // Update URL with QR code data
        url.qrCodeGenerated = true;
        url.qrCodeGeneratedAt = new Date();
        url.qrCode = qrCodeData; // Save QR code SVG/data URL to Url model
        url.qrCodeSettings = {
          size: parseInt(size),
          format,
          errorCorrection
        };
        await url.save();

        return {
          urlId: url._id,
          shortCode: url.shortCode,
          qrCode: qrCodeData,
          url: shortUrl
        };
      })
    );

    res.json({
      success: true,
      data: {
        qrCodes,
        count: qrCodes.length
      }
    });
  } catch (error) {
    console.error('Bulk generate QR codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate QR codes'
    });
  }
};

// Get QR Code statistics
const getQRCodeStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const organizationId = req.user.organization;

    const filter = {
      $or: [
        { creator: userId },
        ...(organizationId ? [{ organization: organizationId }] : [])
      ]
    };

    const [
      totalQRCodes,
      totalScans,
      uniqueScans,
      activeQRCodes,
      downloadsToday
    ] = await Promise.all([
      // Total QR codes generated
      Url.countDocuments({
        ...filter,
        qrCodeGenerated: true
      }),

      // Total QR scans (NOT regular clicks)
      Url.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$qrScanCount' } } }
      ]).then(result => result[0]?.total || 0),

      // Unique QR scans
      Url.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$uniqueQrScanCount' } } }
      ]).then(result => result[0]?.total || 0),

      // Active QR codes (generated in last 30 days)
      Url.countDocuments({
        ...filter,
        qrCodeGenerated: true,
        qrCodeGeneratedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),

      // Downloads today
      Url.countDocuments({
        ...filter,
        lastQRCodeDownload: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalQRCodes,
        totalScans,        // Now shows ONLY QR scans
        uniqueScans,       // NEW: Unique QR scans
        activeQRCodes,
        downloadsToday
      }
    });
  } catch (error) {
    console.error('Get QR code stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get QR code statistics'
    });
  }
};

// Update QR Code customization
const updateQRCodeCustomization = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      size = 300,
      format = 'png',
      errorCorrection = 'M',
      foregroundColor = '#000000',
      backgroundColor = '#FFFFFF',
      includeMargin = true
    } = req.body;

    // Find the URL
    const url = await Url.findById(id);

    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }

    // Check if user owns this URL
    if (url.creator.toString() !== req.user.id &&
        (!req.user.organization || url.organization?.toString() !== req.user.organization.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Build the short URL with QR tracking parameter
    const shortUrl = `${process.env.SHORT_DOMAIN || 'https://laghhu.link'}/${url.shortCode}?qr=1`;

    // Generate QR Code options
    const qrOptions = {
      errorCorrectionLevel: errorCorrection,
      type: format === 'svg' ? 'svg' : 'image/png',
      quality: 0.92,
      margin: includeMargin ? 4 : 0,
      color: {
        dark: foregroundColor,
        light: backgroundColor
      },
      width: parseInt(size)
    };

    // Generate new QR Code with updated settings
    let qrCodeData;
    if (format === 'svg') {
      qrCodeData = await QRCode.toString(shortUrl, { ...qrOptions, type: 'svg' });
    } else {
      qrCodeData = await QRCode.toDataURL(shortUrl, qrOptions);
    }

    // Find existing QR code document
    let qrCodeDoc = await QRCodeModel.findByUrl(id);

    if (qrCodeDoc) {
      // Update existing customization
      qrCodeDoc.customization = {
        size: parseInt(size),
        format,
        errorCorrection,
        foregroundColor,
        backgroundColor,
        includeMargin
      };
      qrCodeDoc.updatedAt = new Date();
      await qrCodeDoc.save();
    } else {
      // Create new if doesn't exist
      qrCodeDoc = await QRCodeModel.getOrCreate(
        url,
        {
          size: parseInt(size),
          format,
          errorCorrection,
          foregroundColor,
          backgroundColor,
          includeMargin
        },
        req.user.id,
        req.user.organization
      );
    }

    // Ensure URL has QR code flags set and save the updated QR code data
    url.qrCodeGenerated = true;
    url.qrCodeGeneratedAt = url.qrCodeGeneratedAt || new Date();
    url.qrCode = qrCodeData; // Save updated QR code SVG/data URL to Url model
    url.qrCodeSettings = {
      size: parseInt(size),
      format,
      errorCorrection,
      foregroundColor,
      backgroundColor,
      includeMargin
    };
    await url.save();

    res.json({
      success: true,
      message: 'QR Code customization updated successfully',
      data: {
        qrCode: qrCodeData,
        url: shortUrl,
        format: format,
        customization: qrCodeDoc.customization
      }
    });
  } catch (error) {
    console.error('Update QR Code customization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update QR Code customization'
    });
  }
};

module.exports = {
  generateQRCode,
  downloadQRCode,
  getUrlQRCode,
  bulkGenerateQRCodes,
  getQRCodeStats,
  updateQRCodeCustomization
};
