const redirectService = require('../services/redirectService');
const geoLocation = require('../utils/geoLocation');

const redirectToOriginalUrl = async (req, res) => {
  try {
    // URL-decode the shortCode to handle international characters (Arabic, Chinese, etc.)
    let { shortCode } = req.params;
    shortCode = decodeURIComponent(shortCode);

    const requestDomain = req.get('host');

    console.log('🔗 Redirect Request:', {
      shortCode,
      shortCodeRaw: req.params.shortCode,
      shortCodeDecoded: shortCode,
      shortCodeBytes: Buffer.from(shortCode).toString('hex'),
      shortCodeLength: shortCode.length,
      requestDomain,
      ip: req.ip,
      userAgent: req.get('User-Agent')?.substring(0, 50),
      queryParams: req.query,
      qrParam: req.query.qr,
      fullUrl: req.originalUrl
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
    requestData.clickSource = detectClickSource(req);

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
    // URL-decode the shortCode to handle international characters
    let { shortCode } = req.params;
    shortCode = decodeURIComponent(shortCode);

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
    // URL-decode the shortCode to handle international characters
    let { shortCode } = req.params;
    shortCode = decodeURIComponent(shortCode);

    const {
      size,
      format,
      fgColor,
      bgColor,
      errorCorrection,
      margin
    } = req.query;

    const options = {};
    if (size) options.size = parseInt(size);
    if (format) options.format = format;
    if (fgColor) options.fgColor = fgColor;
    if (bgColor) options.bgColor = bgColor;
    if (errorCorrection) options.errorCorrection = errorCorrection;
    if (margin) options.margin = parseInt(margin);

    const qrData = await redirectService.generateQRCode(shortCode, options);

    res.json({
      success: true,
      data: qrData
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

// Helper function to detect click source
const detectClickSource = (req) => {
  const userAgent = req.get('user-agent') || '';
  const referer = req.get('referer') || '';

  console.log('🔍 Detecting Click Source:', {
    qrQueryParam: req.query.qr,
    sourceQueryParam: req.query.source,
    userAgent: userAgent.substring(0, 100),
    referer
  });

  // Check for QR tracking parameter (added when generating QR codes)
  if (req.query.qr === '1' || req.query.source === 'qr') {
    console.log('✅ QR Code detected via query parameter!');
    return 'qr_code';
  }

  // Check for QR code scanner apps in user-agent
  const qrScannerPatterns = [
    /qr/i,
    /scanner/i,
    /zxing/i,
    /barcode/i,
    /scan/i
  ];

  if (qrScannerPatterns.some(pattern => pattern.test(userAgent))) {
    console.log('✅ QR Code detected via user-agent!');
    return 'qr_code';
  }

  // Check if coming from API (no browser user-agent patterns)
  if (req.get('X-API-Key') || req.get('Authorization')?.includes('Bearer')) {
    console.log('📡 API request detected');
    return 'api';
  }

  // Check referer
  if (!referer || referer === '' || referer === 'direct') {
    console.log('🔗 Direct click detected');
    return 'direct';
  }

  // Default to browser
  console.log('🌐 Browser click detected');
  return 'browser';
};

// New function specifically for QR code redirects
const redirectFromQRCode = async (req, res) => {
  try {
    // URL-decode the shortCode to handle international characters
    let { shortCode } = req.params;
    shortCode = decodeURIComponent(shortCode);

    const requestDomain = req.get('host');

    console.log('📱 QR Code Scan Redirect:', {
      shortCode,
      shortCodeRaw: req.params.shortCode,
      shortCodeDecoded: shortCode,
      shortCodeBytes: Buffer.from(shortCode).toString('hex'),
      shortCodeLength: shortCode.length,
      requestDomain,
      ip: req.ip,
      userAgent: req.get('User-Agent')?.substring(0, 50),
      path: req.path
    });

    // Extract real IP address
    const getClientIP = () => {
      const cfConnectingIP = req.get('CF-Connecting-IP');
      const xRealIP = req.get('X-Real-IP');
      const xForwardedFor = req.get('X-Forwarded-For');
      const xClientIP = req.get('X-Client-IP');

      if (cfConnectingIP) return cfConnectingIP;
      if (xRealIP) return xRealIP;
      if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
      if (xClientIP) return xClientIP;

      return req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1';
    };

    const clientIP = getClientIP();

    const requestData = {
      ipAddress: clientIP,
      userAgent: req.get('User-Agent') || '',
      referer: req.get('Referer') || '',
      language: req.get('Accept-Language') || '',
      screenResolution: req.query.sr || '',
      password: req.query.password || req.body?.password,
      domain: requestDomain,
      clickSource: 'qr_code' // Always set as QR code for this route
    };

    try {
      const locationData = geoLocation.getLocationData(requestData.ipAddress);
      requestData.country = locationData?.country || 'US';
    } catch (err) {
      requestData.country = 'US';
    }

    requestData.deviceType = getDeviceType(requestData.userAgent);

    console.log('✅ Processing as QR Code scan (via /q/ route)');

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
    console.error('QR Code redirect error:', error);

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

module.exports = {
  redirectToOriginalUrl,
  redirectFromQRCode,
  getPreview,
  getRedirectStats,
  checkUrlSafety,
  generateQRCode
};