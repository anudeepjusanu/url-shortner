const Url = require('../models/Url');
const QRCode = require('qrcode');
const QRCodeModel = require('../models/QRCode');
const sharp = require('sharp');
const PDFDocument = require('pdfkit');
const { domainToASCII } = require('../utils/punycode');

// Helper function to get the correct protocol for a domain
const getProtocolForDomain = (domain) => {
  // If domain already has protocol, don't add one
  if (domain.startsWith('http://') || domain.startsWith('https://')) {
    return '';
  }

  // For localhost or domains with ports (development), use http://
  if (domain.includes('localhost') || domain.match(/:\d+$/)) {
    return 'http://';
  }

  // For production domains, use https://
  return 'https://';
};

// Helper function to convert PNG buffer to other image formats
const convertImageFormat = async (pngBuffer, format) => {
  const sharpInstance = sharp(pngBuffer);

  switch (format.toLowerCase()) {
    case 'jpeg':
    case 'jpg':
      return await sharpInstance.jpeg({ quality: 92 }).toBuffer();
    case 'gif':
      return await sharpInstance.gif().toBuffer();
    case 'webp':
      return await sharpInstance.webp({ quality: 92 }).toBuffer();
    case 'png':
    default:
      return pngBuffer;
  }
};

// Helper function to get content type for format
const getContentType = (format) => {
  const contentTypes = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'pdf': 'application/pdf'
  };
  return contentTypes[format.toLowerCase()] || 'image/png';
};

// Helper function to generate PDF with QR code
const generateQRCodePDF = async (qrCodeBuffer, shortCode, size) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: [size + 100, size + 100],
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Add title
      doc.fontSize(16).text(`QR Code: ${shortCode}`, { align: 'center' });
      doc.moveDown();

      // Add QR code image
      doc.image(qrCodeBuffer, {
        fit: [size, size],
        align: 'center',
        valign: 'center'
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

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

    // Build the short URL with QR tracking parameter using the URL's actual domain
    // Convert to ASCII (Punycode) for international domain support in QR codes
    const urlDomain = url.domain || process.env.SHORT_DOMAIN || 'laghhu.link';
    const asciiDomain = domainToASCII(urlDomain);
    const protocol = getProtocolForDomain(asciiDomain);
    const shortUrl = `${protocol}${asciiDomain}/${url.shortCode}?qr=1`;

    console.log('📱 Generating QR Code:', {
      urlId: id,
      shortCode: url.shortCode,
      domain: url.domain,
      shortUrl: shortUrl,
      hasQrParam: shortUrl.includes('?qr=1')
    });

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
    } else if (format === 'pdf') {
      // For PDF, generate PNG buffer first, convert to PDF, then to base64
      const pngBuffer = await QRCode.toBuffer(shortUrl, qrOptions);
      const pdfBuffer = await generateQRCodePDF(pngBuffer, url.shortCode, parseInt(size));
      qrCodeData = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
    } else {
      // For other image formats, generate PNG first then convert
      const pngBuffer = await QRCode.toBuffer(shortUrl, qrOptions);
      const convertedBuffer = await convertImageFormat(pngBuffer, format);
      const mimeType = getContentType(format);
      qrCodeData = `data:${mimeType};base64,${convertedBuffer.toString('base64')}`;
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

    // Build the short URL with QR tracking parameter using the URL's actual domain
    // Convert to ASCII (Punycode) for international domain support in QR codes
    const urlDomain = url.domain || process.env.SHORT_DOMAIN || 'laghhu.link';
    const asciiDomain = domainToASCII(urlDomain);
    const protocol = getProtocolForDomain(asciiDomain);
    const shortUrl = `${protocol}${asciiDomain}/${url.shortCode}?qr=1`;

    // Generate QR Code
    const qrOptions = {
      errorCorrectionLevel: 'M',
      type: format === 'svg' ? 'svg' : 'image/png',
      quality: 0.92,
      margin: 4,
      width: parseInt(size)
    };

    let finalBuffer;
    let fileExtension = format.toLowerCase();

    if (format === 'svg') {
      // Handle SVG format
      const svg = await QRCode.toString(shortUrl, { ...qrOptions, type: 'svg' });
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', `attachment; filename="qr-${url.shortCode}.svg"`);
      res.send(svg);
    } else if (format === 'pdf') {
      // Handle PDF format
      const pngBuffer = await QRCode.toBuffer(shortUrl, qrOptions);
      finalBuffer = await generateQRCodePDF(pngBuffer, url.shortCode, parseInt(size));
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="qr-${url.shortCode}.pdf"`);
      res.send(finalBuffer);
    } else {
      // Handle image formats (PNG, JPEG, GIF, WebP)
      const pngBuffer = await QRCode.toBuffer(shortUrl, qrOptions);
      finalBuffer = await convertImageFormat(pngBuffer, format);

      // Normalize extension for JPEG
      if (format === 'jpg') fileExtension = 'jpeg';

      res.setHeader('Content-Type', getContentType(format));
      res.setHeader('Content-Disposition', `attachment; filename="qr-${url.shortCode}.${fileExtension}"`);
      res.send(finalBuffer);
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

    // Build the short URL with QR tracking parameter using the URL's actual domain
    // Convert to ASCII (Punycode) for international domain support in QR codes
    const urlDomain = url.domain || process.env.SHORT_DOMAIN || 'laghhu.link';
    const asciiDomain = domainToASCII(urlDomain);
    const protocol = getProtocolForDomain(asciiDomain);
    const shortUrl = `${protocol}${asciiDomain}/${url.shortCode}?qr=1`;

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
        const urlDomain = url.domain || process.env.SHORT_DOMAIN || 'laghhu.link';
        const asciiDomain = domainToASCII(urlDomain);
        const protocol = getProtocolForDomain(asciiDomain);
        const shortUrl = `${protocol}${asciiDomain}/${url.shortCode}?qr=1`;

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
        } else if (format === 'pdf') {
          const pngBuffer = await QRCode.toBuffer(shortUrl, qrOptions);
          const pdfBuffer = await generateQRCodePDF(pngBuffer, url.shortCode, parseInt(size));
          qrCodeData = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
        } else {
          const pngBuffer = await QRCode.toBuffer(shortUrl, qrOptions);
          const convertedBuffer = await convertImageFormat(pngBuffer, format);
          const mimeType = getContentType(format);
          qrCodeData = `data:${mimeType};base64,${convertedBuffer.toString('base64')}`;
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

    // Build the short URL with QR tracking parameter using the URL's actual domain
    // Convert to ASCII (Punycode) for international domain support in QR codes
    const urlDomain = url.domain || process.env.SHORT_DOMAIN || 'laghhu.link';
    const asciiDomain = domainToASCII(urlDomain);
    const protocol = getProtocolForDomain(asciiDomain);
    const shortUrl = `${protocol}${asciiDomain}/${url.shortCode}?qr=1`;

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
    } else if (format === 'pdf') {
      const pngBuffer = await QRCode.toBuffer(shortUrl, qrOptions);
      const pdfBuffer = await generateQRCodePDF(pngBuffer, url.shortCode, parseInt(size));
      qrCodeData = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
    } else {
      const pngBuffer = await QRCode.toBuffer(shortUrl, qrOptions);
      const convertedBuffer = await convertImageFormat(pngBuffer, format);
      const mimeType = getContentType(format);
      qrCodeData = `data:${mimeType};base64,${convertedBuffer.toString('base64')}`;
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
