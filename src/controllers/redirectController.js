const redirectService = require('../services/redirectService');
const geoLocation = require('../utils/geoLocation');

const redirectToOriginalUrl = async (req, res) => {
  let shortCode = req.params.shortCode || '';
  try {
    // URL-decode the shortCode to handle international characters (Arabic, Chinese, etc.)
    shortCode = decodeURIComponent(shortCode);

    // Strip port from Host header to match domain stored in database
    const rawHost = req.get('host') || '';
    let requestDomain = rawHost.split(':')[0];

    // Fallback: nginx custom-domain catch-all may pass domain via X-Custom-Domain header
    if (!requestDomain && req.get('X-Custom-Domain')) {
      requestDomain = req.get('X-Custom-Domain').split(':')[0];
    }

    // Safety net: try X-Forwarded-Host if present (useful behind Cloudflare or multiple proxies)
    if (!requestDomain && req.get('X-Forwarded-Host')) {
      requestDomain = req.get('X-Forwarded-Host').split(':')[0];
    }

    console.log('🔗 Redirect Request:', {
      shortCode,
      shortCodeRaw: req.params.shortCode,
      shortCodeDecoded: shortCode,
      shortCodeBytes: Buffer.from(shortCode).toString('hex'),
      shortCodeLength: shortCode.length,
      rawHost,
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
      const locationData = await geoLocation.getLocationFromIP(requestData.ipAddress);
      requestData.country = locationData?.country || 'US';
    } catch (err) {
      requestData.country = 'US';
    }

    requestData.deviceType = getDeviceType(requestData.userAgent);
    requestData.clickSource = detectClickSource(req);

    const redirectResult = await redirectService.handleRedirect(shortCode, requestData);
    
    if (!redirectResult.success) {
      const frontendUrl = process.env.BASE_URL || 'https://snip.sa';
      return res.redirect(`${frontendUrl}/link-not-found?code=${encodeURIComponent(shortCode)}`);
    }

    // Perform the redirect
    const redirectType = redirectResult.redirectType || 302;
    res.status(redirectType).redirect(redirectResult.redirectUrl);

  } catch (error) {
    console.error('Redirect error:', error);
    const frontendUrl = process.env.BASE_URL || 'http://localhost:8080';

    if (error.message === 'URL not found') {
      return res.redirect(`${frontendUrl}/link-not-found?code=${encodeURIComponent(shortCode)}`);
    }

    if (error.message.includes('blocked') || error.message.includes('restricted')) {
      return res.redirect(`${frontendUrl}/link-not-found?code=${encodeURIComponent(shortCode)}`);
    }

    if (error.message === 'Password required') {
      return res.status(401).json({
        success: false,
        message: 'Password required to access this URL',
        error: 'PASSWORD_REQUIRED'
      });
    }

    res.redirect(`${frontendUrl}/link-not-found?code=${encodeURIComponent(shortCode)}`);
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

    const locationData = await geoLocation.getLocationFromIP(requestData.ipAddress);
    requestData.country = locationData?.country || 'US';

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
  let shortCode = req.params.shortCode || '';
  try {
    // URL-decode the shortCode to handle international characters
    shortCode = decodeURIComponent(shortCode);

    // Strip port from Host header to match domain stored in database
    const rawHost = req.get('host') || '';
    let requestDomain = rawHost.split(':')[0];

    // Fallback: nginx custom-domain catch-all may pass domain via X-Custom-Domain header
    if (!requestDomain && req.get('X-Custom-Domain')) {
      requestDomain = req.get('X-Custom-Domain').split(':')[0];
    }

    // Safety net: try X-Forwarded-Host if present (useful behind Cloudflare or multiple proxies)
    if (!requestDomain && req.get('X-Forwarded-Host')) {
      requestDomain = req.get('X-Forwarded-Host').split(':')[0];
    }

    console.log('📱 QR Code Scan Redirect:', {
      shortCode,
      shortCodeRaw: req.params.shortCode,
      shortCodeDecoded: shortCode,
      shortCodeBytes: Buffer.from(shortCode).toString('hex'),
      shortCodeLength: shortCode.length,
      rawHost,
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
      const locationData = await geoLocation.getLocationFromIP(requestData.ipAddress);
      requestData.country = locationData?.country || 'US';
    } catch (err) {
      requestData.country = 'US';
    }

    requestData.deviceType = getDeviceType(requestData.userAgent);

    console.log('✅ Processing as QR Code scan (via /q/ route)');

    const redirectResult = await redirectService.handleRedirect(shortCode, requestData);

    if (!redirectResult.success) {
      const frontendUrl = process.env.BASE_URL || 'http://localhost:8080';
      return res.redirect(`${frontendUrl}/link-not-found?code=${encodeURIComponent(shortCode)}`);
    }

    // Perform the redirect
    const redirectType = redirectResult.redirectType || 302;
    res.status(redirectType).redirect(redirectResult.redirectUrl);

  } catch (error) {
    console.error('QR Code redirect error:', error);
    const frontendUrl = process.env.BASE_URL || 'http://localhost:8080';

    if (error.message === 'URL not found') {
      return res.redirect(`${frontendUrl}/link-not-found?code=${encodeURIComponent(shortCode)}`);
    }

    if (error.message.includes('blocked') || error.message.includes('restricted')) {
      return res.redirect(`${frontendUrl}/link-not-found?code=${encodeURIComponent(shortCode)}`);
    }

    if (error.message === 'Password required') {
      return res.status(401).json({
        success: false,
        message: 'Password required to access this URL',
        error: 'PASSWORD_REQUIRED'
      });
    }

    res.redirect(`${process.env.BASE_URL || 'http://localhost:8080'}/link-not-found?code=${encodeURIComponent(shortCode)}`);
  }
};

/**
 * GET /dl/:shortCode
 *
 * Deep link redirect handler. Three paths:
 *   Flow A — iOS/Android, app installed     → OS intercepts BEFORE this runs (AASA/assetlinks).
 *            Any request that reaches here  → app NOT installed → Flow B.
 *   Flow B — app not installed              → store deferred payload + redirect to store.
 *   Flow C — desktop or in-app browser     → redirect to web fallback URL.
 */
const handleDeepLinkRedirect = async (req, res) => {
  const shortCode = decodeURIComponent(req.params.shortCode || '');
  const ua = req.get('User-Agent') || '';

  const deepLinkService = require('../services/deepLinkService');
  const deferredLinkService = require('../services/deferredLinkService');
  const Url = require('../models/Url');
  const analyticsService = require('../services/analyticsService');
  const geoLocation = require('../utils/geoLocation');

  try {
    const clientIP = deepLinkService.getClientIP(req);
    const platform = deepLinkService.detectPlatform(ua);

    // Look up the deep link record
    const url = await Url.findOne({
      $or: [
        { shortCode: { $regex: new RegExp(`^${shortCode}$`, 'i') } },
        { customCode: { $regex: new RegExp(`^${shortCode}$`, 'i') } }
      ],
      'deepLink.enabled': true,
      isActive: true
    }).populate('deepLink.appRegistration');

    if (!url || !url.deepLink?.appRegistration) {
      const frontendUrl = process.env.BASE_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/link-not-found?code=${encodeURIComponent(shortCode)}`);
    }

    const app = url.deepLink.appRegistration;
    // Priority: per-link override → app-level fallback → original URL destination
    const webFallback = url.deepLink.webFallbackUrl || app.webFallbackUrl || url.originalUrl;

    // Track the click (non-fatal)
    try {
      let country = 'US';
      try { const loc = await geoLocation.getLocationFromIP(clientIP); country = loc?.country || 'US'; } catch {}
      await analyticsService.recordClick(shortCode, {
        ipAddress: clientIP,
        userAgent: ua,
        referer: req.get('Referer') || '',
        language: req.get('Accept-Language') || '',
        country,
        deviceType: platform === 'ios' || platform === 'android' ? 'mobile' : 'desktop',
        clickSource: 'deep_link'
      });
    } catch (analyticsErr) {
      console.error('[deepLink] analytics error:', analyticsErr.message);
    }

    // ── Flow C — desktop or in-app browser ───────────────────────────────────
    if (platform === 'desktop' || platform === 'in-app-browser') {
      return res.redirect(webFallback);
    }

    // ── Flow B — iOS request reached server = app not installed ──────────────
    if (platform === 'ios') {
      const storeUrl = app.iosStoreUrl || webFallback;
      await deferredLinkService.storePayload(clientIP, ua, req, url);
      return res.redirect(storeUrl);
    }

    // ── Flow B — Android: serve intent page (tries to open app, falls to store) ─
    if (platform === 'android') {
      await deferredLinkService.storePayload(clientIP, ua, req, url);

      if (app.packageName && app.androidStoreUrl) {
        const storeEncoded = encodeURIComponent(app.androidStoreUrl);
        const intentUrl = `intent://${req.hostname}/dl/${encodeURIComponent(shortCode)}#Intent;scheme=https;package=${app.packageName};S.browser_fallback_url=${storeEncoded};end`;
        const html = deepLinkService.buildAndroidIntentPage(intentUrl, app.androidStoreUrl, app.name);
        return res.send(html);
      }

      return res.redirect(webFallback);
    }

    // Fallback
    return res.redirect(webFallback);
  } catch (err) {
    console.error('[deepLink] redirect error:', err.message);
    const frontendUrl = process.env.BASE_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/link-not-found?code=${encodeURIComponent(shortCode)}`);
  }
};

module.exports = {
  redirectToOriginalUrl,
  redirectFromQRCode,
  getPreview,
  getRedirectStats,
  checkUrlSafety,
  generateQRCode,
  handleDeepLinkRedirect
};