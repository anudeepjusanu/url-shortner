const Url = require('../models/Url');
const QRCode = require('qrcode');

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

    // Validate format
    const supportedFormats = ['png', 'svg'];
    if (!supportedFormats.includes(format.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Unsupported format: ${format}. Supported formats are: ${supportedFormats.join(', ')}`,
        supportedFormats
      });
    }

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

    // Build the short URL
    const shortUrl = `${process.env.SHORT_DOMAIN || 'https://laghhu.link'}/${url.shortCode}`;

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

    // Store the generated QR code and customization options
    url.qrCode = qrCodeData;
    url.qrCodeGenerated = true;
    url.qrCodeGeneratedAt = new Date();
    url.qrCodeCustomization = {
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

    // Validate format
    const supportedFormats = ['png', 'svg'];
    if (!supportedFormats.includes(format.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Unsupported format: ${format}. Supported formats are: ${supportedFormats.join(', ')}`,
        supportedFormats
      });
    }

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

    // Build the short URL
    const shortUrl = `${process.env.SHORT_DOMAIN || 'https://laghhu.link'}/${url.shortCode}`;

    // Use stored customization if available, otherwise use defaults
    const customization = url.qrCodeCustomization || {};
    const qrOptions = {
      errorCorrectionLevel: customization.errorCorrection || 'M',
      type: format === 'svg' ? 'svg' : 'image/png',
      quality: 0.92,
      margin: customization.includeMargin !== undefined ? (customization.includeMargin ? 4 : 0) : 4,
      color: {
        dark: customization.foregroundColor || '#000000',
        light: customization.backgroundColor || '#FFFFFF'
      },
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

    // Track download
    url.qrCodeDownloads = (url.qrCodeDownloads || 0) + 1;
    url.lastQRCodeDownload = new Date();
    await url.save();
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

    // Build the short URL
    const shortUrl = `${process.env.SHORT_DOMAIN || 'https://laghhu.link'}/${url.shortCode}`;

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
        qrCodeDownloads: url.qrCodeDownloads || 0
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
      errorCorrection = 'M',
      foregroundColor = '#000000',
      backgroundColor = '#FFFFFF',
      includeMargin = true
    } = options;

    // Validate format
    const supportedFormats = ['png', 'svg'];
    if (!supportedFormats.includes(format.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Unsupported format: ${format}. Supported formats are: ${supportedFormats.join(', ')}`,
        supportedFormats
      });
    }

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
        const shortUrl = `${process.env.SHORT_DOMAIN || 'https://laghhu.link'}/${url.shortCode}`;

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

        let qrCodeData;
        if (format === 'svg') {
          qrCodeData = await QRCode.toString(shortUrl, { ...qrOptions, type: 'svg' });
        } else {
          qrCodeData = await QRCode.toDataURL(shortUrl, qrOptions);
        }

        // Store the generated QR code and customization
        url.qrCode = qrCodeData;
        url.qrCodeGenerated = true;
        url.qrCodeGeneratedAt = new Date();
        url.qrCodeCustomization = {
          size: parseInt(size),
          format,
          errorCorrection,
          foregroundColor,
          backgroundColor,
          includeMargin
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
      activeQRCodes,
      downloadsToday
    ] = await Promise.all([
      // Total QR codes generated
      Url.countDocuments({
        ...filter,
        qrCodeGenerated: true
      }),

      // Total scans (clicks from QR codes)
      Url.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$clickCount' } } }
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
        totalScans,
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

module.exports = {
  generateQRCode,
  downloadQRCode,
  getUrlQRCode,
  bulkGenerateQRCodes,
  getQRCodeStats
};
