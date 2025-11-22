const redirectService = require('../services/redirectService');
const geoLocation = require('../utils/geoLocation');

const redirectToOriginalUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const requestDomain = req.get('host');

    console.log('🔗 Redirect Request:', {
      shortCode,
      requestDomain,
      ip: req.ip,
      userAgent: req.get('User-Agent')?.substring(0, 50)
    });

    // Extract real IP address from various headers (for proxies, load balancers, CDNs)
    const getClientIP = () => {
      // Check common proxy headers in order of reliability
      const xForwardedFor = req.get('X-Forwarded-For');
      const xRealIP = req.get('X-Real-IP');
      const cfConnectingIP = req.get('CF-Connecting-IP'); // Cloudflare
      const xClientIP = req.get('X-Client-IP');
      
      if (cfConnectingIP) return cfConnectingIP;
      if (xRealIP) return xRealIP;
      if (xForwardedFor) {
        // X-Forwarded-For can contain multiple IPs, get the first one (original client)
        return xForwardedFor.split(',')[0].trim();
      }
      if (xClientIP) return xClientIP;
      
      // Fallback to Express req.ip (works with trust proxy)
      return req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1';
    };

    const clientIP = getClientIP();
    console.log('📍 Client IP detected:', clientIP);

    const requestData = {
      ipAddress: clientIP,
      userAgent: req.get('User-Agent') || '',
      referer: req.get('Referer') || '',
      language: req.get('Accept-Language') || '',
      screenResolution: req.query.sr || '',
      password: req.query.password || req.body?.password,
      domain: requestDomain
    };

    try {
      const locationData = geoLocation.getLocationData(requestData.ipAddress);
      requestData.country = locationData?.country || 'US';
    } catch (err) {
      requestData.country = 'US';
    }
    
    requestData.deviceType = getDeviceType(requestData.userAgent);

    const redirectResult = await redirectService.handleRedirect(shortCode, requestData);
    
    if (!redirectResult.success) {
      return res.status(404).json({
        success: false,
        message: 'URL not found or access denied'
      });
    }

    // Perform the redirect
    const redirectType = redirectResult.redirectType || 302;
    res.status(redirectType).redirect(redirectResult.redirectUrl);

  } catch (error) {
    console.error('Redirect error:', error);
    
    if (error.message === 'URL not found') {
      return res.status(404).json({
        success: false,
        message: 'The requested URL was not found',
        error: 'URL_NOT_FOUND'
      });
    }
    
    if (error.message.includes('blocked') || error.message.includes('restricted')) {
      return res.status(403).json({
        success: false,
        message: 'Access to this URL is restricted',
        error: 'ACCESS_RESTRICTED'
      });
    }
    
    if (error.message === 'Password required') {
      return res.status(401).json({
        success: false,
        message: 'Password required to access this URL',
        error: 'PASSWORD_REQUIRED'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error during redirect',
      error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
    });
  }
};

const getPreview = async (req, res) => {
  try {
    const { shortCode } = req.params;
    
    const requestData = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || '',
      referer: req.get('Referer') || '',
      language: req.get('Accept-Language') || ''
    };

    const locationData = geoLocation.getLocationData(requestData.ipAddress);
    requestData.country = locationData.country;

    const previewData = await redirectService.generatePreviewPage(shortCode, requestData);
    
    res.json({
      success: true,
      data: previewData
    });

  } catch (error) {
    console.error('Preview error:', error);
    
    if (error.message === 'URL not found') {
      return res.status(404).json({
        success: false,
        message: 'The requested URL was not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate preview',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getRedirectStats = async (req, res) => {
  try {
    const { shortCode } = req.params;
    
    const stats = await redirectService.getRedirectStats(shortCode);
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Stats error:', error);
    
    if (error.message === 'URL not found') {
      return res.status(404).json({
        success: false,
        message: 'The requested URL was not found'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to get redirect stats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const checkUrlSafety = async (req, res) => {
  try {
    const { shortCode } = req.params;
    
    const url = await redirectService.getUrlByShortCode(shortCode);
    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }
    
    const safetyCheck = await redirectService.checkUrlSafety(url.originalUrl);
    
    res.json({
      success: true,
      data: {
        shortCode,
        originalUrl: url.originalUrl,
        safety: safetyCheck
      }
    });

  } catch (error) {
    console.error('Safety check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check URL safety',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const generateQRCode = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const {
      size = 300,
      format = 'png',
      fgColor = '000000',
      bgColor = 'ffffff',
      errorCorrection = 'M',
      margin = 1
    } = req.query;

    // Validate format
    const supportedFormats = ['png', 'svg'];
    if (!supportedFormats.includes(format.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Unsupported format: ${format}. Supported formats are: ${supportedFormats.join(', ')}`,
        supportedFormats
      });
    }

    // Find URL by shortCode
    const url = await redirectService.getUrlByShortCode(shortCode);
    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'The requested URL was not found'
      });
    }

    const QRCode = require('qrcode');
    const shortUrl = `${process.env.SHORT_DOMAIN || 'https://laghhu.link'}/${shortCode}`;

    // Build QR code options
    const qrOptions = {
      errorCorrectionLevel: errorCorrection,
      type: format === 'svg' ? 'svg' : 'image/png',
      quality: 0.92,
      margin: parseInt(margin) || 1,
      color: {
        dark: `#${fgColor.replace('#', '')}`,
        light: `#${bgColor.replace('#', '')}`
      },
      width: parseInt(size)
    };

    // Generate QR code
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
      foregroundColor: `#${fgColor.replace('#', '')}`,
      backgroundColor: `#${bgColor.replace('#', '')}`,
      includeMargin: parseInt(margin) > 0
    };
    await url.save();

    res.json({
      success: true,
      data: {
        qrCodeUrl: qrCodeData,
        url: shortUrl,
        shortCode,
        originalUrl: url.originalUrl,
        customization: url.qrCodeCustomization
      }
    });

  } catch (error) {
    console.error('QR code generation error:', error);

    if (error.message === 'URL not found') {
      return res.status(404).json({
        success: false,
        message: 'The requested URL was not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to generate QR code',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to detect device type
const getDeviceType = (userAgent) => {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  } else {
    return 'desktop';
  }
};

module.exports = {
  redirectToOriginalUrl,
  getPreview,
  getRedirectStats,
  checkUrlSafety,
  generateQRCode
};