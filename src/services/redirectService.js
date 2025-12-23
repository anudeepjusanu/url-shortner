const Url = require('../models/Url');
const analyticsService = require('./analyticsService');
const securityService = require('./securityService');
const { cacheGet } = require('../config/redis');
const config = require('../config/environment');

class RedirectService {
  async handleRedirect(shortCode, requestData) {
    try {
      console.log('\n========== REDIRECT SERVICE START ==========');
      const {
        ipAddress,
        userAgent,
        referer,
        language,
        screenResolution,
        password,
        domain,
        clickSource
      } = requestData;

      console.log('🔄 Redirect Service - handleRedirect:', {
        shortCode,
        shortCodeType: typeof shortCode,
        shortCodeLength: shortCode?.length,
        clickSource,
        domain,
        ipAddress,
        userAgent: userAgent?.substring(0, 50)
      });

      const blocked = await securityService.isIPBlocked(ipAddress);
      if (blocked.blocked) {
        console.error('🚫 IP Blocked:', { ipAddress, reason: blocked.reason });
        throw new Error(`IP blocked: ${blocked.reason}`);
      }
      console.log('✅ IP not blocked:', ipAddress);

      const url = await this.getUrlByShortCode(shortCode, domain);
      if (!url) {
        console.error('❌ URL not found for shortCode:', shortCode);
        console.log('========== REDIRECT SERVICE FAILED (URL NOT FOUND) ==========\n');
        throw new Error('URL not found');
      }
      console.log('✅ URL retrieved successfully');

      const validationResult = await this.validateRedirect(url, requestData);
      if (!validationResult.allowed) {
        console.error('❌ Validation failed:', validationResult.reason);
        console.log('========== REDIRECT SERVICE FAILED (VALIDATION) ==========\n');
        throw new Error(validationResult.reason);
      }
      console.log('✅ Validation passed');

      const clickData = {
        ipAddress,
        userAgent,
        referer,
        language,
        screenResolution,
        domain, // Pass the domain to analytics service
        clickSource: clickSource || 'unknown' // Pass the click source
      };
      
      try {
        await analyticsService.recordClick(shortCode, clickData);
      } catch (analyticsError) {
        console.error('Analytics recording failed:', analyticsError);
      }
      
      const redirectUrl = this.processRedirectUrl(url);

      console.log('🎯 Processing redirect:', {
        originalUrl: url.originalUrl,
        redirectUrl,
        hasUTM: redirectUrl !== url.originalUrl
      });

      await securityService.logSecurityEvent({
        type: 'URL_REDIRECT',
        level: 'INFO',
        ipAddress,
        userAgent,
        details: {
          shortCode,
          originalUrl: url.originalUrl,
          redirectUrl
        }
      });

      console.log('✅ Redirect successful:', {
        shortCode,
        redirectType: url.redirectType || 302,
        redirectUrl
      });
      console.log('========== REDIRECT SERVICE SUCCESS ==========\n');

      return {
        success: true,
        redirectUrl,
        redirectType: url.redirectType || 302,
        metadata: this.getRedirectMetadata(url)
      };
    } catch (error) {
      console.error('❌ REDIRECT SERVICE ERROR:');
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('ShortCode:', shortCode);
      console.error('RequestData:', {
        ipAddress: requestData.ipAddress,
        domain: requestData.domain,
        clickSource: requestData.clickSource
      });
      console.log('========== REDIRECT SERVICE ERROR ==========\n');

      await securityService.logSecurityEvent({
        type: 'REDIRECT_ERROR',
        level: 'WARNING',
        ipAddress: requestData.ipAddress,
        userAgent: requestData.userAgent,
        details: {
          shortCode,
          error: error.message
        }
      });

      throw error;
    }
  }
  
  async getUrlByShortCode(shortCode, requestDomain = null) {
    try {
      console.log('\n===== GET URL BY SHORT CODE START =====');
      // Normalize domain to ASCII (Punycode) for consistent database lookup
      const { domainToASCII } = require('../utils/punycode');
      const normalizedDomain = requestDomain ? domainToASCII(requestDomain.toLowerCase()) : null;

      console.log('🔍 Looking up URL:', {
        shortCode,
        shortCodeType: typeof shortCode,
        shortCodeLength: shortCode?.length,
        requestDomain,
        normalizedDomain,
        isMainDomain: this.isMainDomain(normalizedDomain)
      });

      let url = await cacheGet(`url:${shortCode}`);

      if (url) {
        console.log('💾 Cache HIT:', { shortCode, cacheKey: `url:${shortCode}` });
      } else {
        console.log('💾 Cache MISS - querying database');

        const query = {
          $or: [{ shortCode }, { customCode: shortCode }]
        };

        // If a custom domain is being used, ensure the URL belongs to that domain
        if (normalizedDomain && !this.isMainDomain(normalizedDomain)) {
          query.domain = normalizedDomain;
          console.log('🌐 Custom domain query:', JSON.stringify(query, null, 2));
        } else {
          console.log('🌐 Main domain query:', JSON.stringify(query, null, 2));
        }

        url = await Url.findOne(query)
          .populate('creator', 'firstName lastName email')
          .populate('organization', 'name slug');

        if (url) {
          console.log('✅ URL FOUND in database:', {
            _id: url._id,
            shortCode: url.shortCode,
            customCode: url.customCode,
            domain: url.domain,
            originalUrl: url.originalUrl,
            isActive: url.isActive
          });
        } else {
          console.log('❌ URL NOT FOUND in database');
          console.log('Query was:', JSON.stringify(query, null, 2));
        }

        if (url && url.isActive) {
          try {
            await cacheSet(`url:${shortCode}`, url, config.CACHE_TTL.URL_CACHE);
            console.log('💾 Cached URL:', { shortCode, ttl: config.CACHE_TTL.URL_CACHE });
          } catch (cacheError) {
            console.warn('⚠️  Cache set failed:', cacheError.message);
            // Continue anyway, just without caching
          }
        }
      }

      console.log('===== GET URL BY SHORT CODE END =====\n');
      return url;
    } catch (error) {
      console.error('❌ ERROR in getUrlByShortCode:');
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('ShortCode:', shortCode);
      console.log('===== GET URL BY SHORT CODE FAILED =====\n');
      return null;
    }
  }

  isMainDomain(domain) {
    const mainDomains = [
      process.env.APP_URL?.replace(/https?:\/\//, ''),
      'laghhu.link',
      'www.laghhu.link',
      'shortener.laghhu.link',
      '20.193.155.139',
      'localhost:3015',
      'localhost',
      'snip.sa',
      'www.snip.sa',
      'shortener.snip.sa'
    ].filter(Boolean);

    console.log('isMainDomain check:', { domain, mainDomains, isMain: mainDomains.includes(domain) });
    return mainDomains.includes(domain);
  }
  
  async validateRedirect(url, requestData) {
    const { ipAddress, userAgent, password, country, deviceType } = requestData;
    
    if (!url) {
      return { allowed: false, reason: 'URL not found' };
    }
    
    if (!url.isActive) {
      return { allowed: false, reason: 'URL is deactivated' };
    }
    
    if (url.expiresAt && new Date() > new Date(url.expiresAt)) {
      return { allowed: false, reason: 'URL has expired' };
    }
    
    if (url.password && (!password || url.password !== password)) {
      return { allowed: false, reason: 'Password required' };
    }
    
    // Check restrictions
    if (url.restrictions) {
      if (url.restrictions.countries && url.restrictions.countries.length > 0) {
        const isAllowed = url.restrictions.allowedCountries 
          ? url.restrictions.countries.includes(country)
          : !url.restrictions.countries.includes(country);
        
        if (!isAllowed) {
          return { allowed: false, reason: 'Access restricted for your location or device' };
        }
      }
      
      if (url.restrictions.deviceTypes && url.restrictions.deviceTypes.length > 0) {
        if (!url.restrictions.deviceTypes.includes(deviceType)) {
          return { allowed: false, reason: 'Access restricted for your device type' };
        }
      }
      
      if (url.restrictions.maxClicks && url.clickCount >= url.restrictions.maxClicks) {
        return { allowed: false, reason: 'Maximum click limit reached' };
      }
    }
    
    const suspiciousActivity = securityService.detectSuspiciousActivity({
      ipAddress,
      userAgent,
      requestCount: 1,
      timeWindow: 60000,
      endpoints: [`/${url.shortCode}`],
      failedAttempts: 0
    });
    
    if (suspiciousActivity.riskScore > 70) {
      await securityService.logSecurityEvent({
        type: 'SUSPICIOUS_REDIRECT_ATTEMPT',
        level: 'WARNING',
        ipAddress,
        userAgent,
        details: {
          shortCode: url.shortCode,
          riskScore: suspiciousActivity.riskScore,
          indicators: suspiciousActivity.indicators
        }
      });
      
      return { allowed: false, reason: 'Access temporarily restricted' };
    }
    
    return { allowed: true };
  }
  
  processRedirectUrl(url) {
    try {
      if (url.utm && Object.keys(url.utm).length > 0) {
        return url.addUTMParameters();
      }
      
      return url.originalUrl;
    } catch (error) {
      console.error('Error processing redirect URL:', error);
      return url.originalUrl;
    }
  }
  
  getRedirectMetadata(url) {
    return {
      title: url.title,
      description: url.description,
      favicon: url.metaData?.favicon,
      ogImage: url.metaData?.ogImage,
      creator: url.creator?.firstName ? 
        `${url.creator.firstName} ${url.creator.lastName}` : 
        'Anonymous',
      createdAt: url.createdAt,
      clickCount: url.clickCount
    };
  }
  
  async generatePreviewPage(shortCode, requestData) {
    try {
      const url = await this.getUrlByShortCode(shortCode);
      
      if (!url) {
        throw new Error('URL not found');
      }
      
      const validationResult = await this.validateRedirect(url, requestData);
      if (!validationResult.allowed && validationResult.reason !== 'Password required') {
        throw new Error(validationResult.reason);
      }
      
      const previewData = {
        shortCode: url.shortCode,
        originalUrl: url.originalUrl,
        title: url.title || 'Shortened URL',
        description: url.description || 'Click to visit the destination',
        favicon: url.metaData?.favicon,
        ogImage: url.metaData?.ogImage,
        ogTitle: url.metaData?.ogTitle,
        ogDescription: url.metaData?.ogDescription,
        isPasswordProtected: !!url.password,
        creator: url.creator?.firstName ? 
          `${url.creator.firstName} ${url.creator.lastName}` : 
          'Anonymous',
        createdAt: url.createdAt,
        clickCount: url.clickCount,
        domain: this.extractDomain(url.originalUrl),
        isSecure: url.originalUrl.startsWith('https://'),
        redirectType: url.redirectType || 302
      };
      
      await securityService.logSecurityEvent({
        type: 'PREVIEW_PAGE_VIEW',
        level: 'INFO',
        ipAddress: requestData.ipAddress,
        userAgent: requestData.userAgent,
        details: {
          shortCode,
          originalUrl: url.originalUrl
        }
      });
      
      return previewData;
    } catch (error) {
      console.error('Error generating preview page:', error);
      throw error;
    }
  }
  
  extractDomain(url) {
    try {
      const parsed = new URL(url);
      return parsed.hostname;
    } catch (error) {
      return 'Unknown Domain';
    }
  }
  
  async handleBulkRedirect(shortCodes, requestData) {
    const results = [];
    
    for (const shortCode of shortCodes) {
      try {
        const result = await this.handleRedirect(shortCode, requestData);
        results.push({
          shortCode,
          success: true,
          ...result
        });
      } catch (error) {
        results.push({
          shortCode,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  async checkUrlSafety(originalUrl) {
    try {
      const domain = this.extractDomain(originalUrl);
      
      const knownMaliciousDomains = [
        'malware.com',
        'phishing.org',
        'suspicious.net'
      ];
      
      if (knownMaliciousDomains.includes(domain)) {
        return {
          safe: false,
          reason: 'Known malicious domain',
          riskLevel: 'HIGH'
        };
      }
      
      const suspiciousPatterns = [
        /bit\.ly\/bit\.ly/i,
        /tinyurl\.com\/tinyurl/i,
        /redirect.*redirect/i,
        /\.tk$/i,
        /\.ml$/i,
        /\.ga$/i,
        /\.cf$/i
      ];
      
      if (suspiciousPatterns.some(pattern => pattern.test(originalUrl))) {
        return {
          safe: false,
          reason: 'Suspicious URL pattern detected',
          riskLevel: 'MEDIUM'
        };
      }
      
      if (originalUrl.includes('javascript:') || originalUrl.includes('data:')) {
        return {
          safe: false,
          reason: 'Potentially dangerous URL scheme',
          riskLevel: 'HIGH'
        };
      }
      
      return {
        safe: true,
        riskLevel: 'LOW'
      };
    } catch (error) {
      console.error('Error checking URL safety:', error);
      return {
        safe: false,
        reason: 'Unable to verify URL safety',
        riskLevel: 'UNKNOWN'
      };
    }
  }
  
  async generateQRCode(shortCode, options = {}) {
    try {
      const {
        size = 300,
        format = 'png',
        fgColor = '000000',
        bgColor = 'ffffff',
        errorCorrection = 'M',
        margin = 1
      } = options;

      const url = await this.getUrlByShortCode(shortCode);
      if (!url) {
        throw new Error('URL not found');
      }

      // Properly encode the short code for international characters (Arabic, Chinese, etc.)
      const encodedShortCode = encodeURIComponent(shortCode);
      const shortUrl = `${config.BASE_URL}/${encodedShortCode}?qr=1`;

      console.log('🔗 Generating QR Code:', {
        shortCode,
        encodedShortCode,
        shortUrl,
        format,
        hasInternationalChars: /[^\x00-\x7F]/.test(shortCode)
      });

      // Generate QR code locally using the qrcode library
      const QRCode = require('qrcode');
      const sharp = require('sharp');

      const qrOptions = {
        errorCorrectionLevel: errorCorrection,
        margin: margin,
        width: parseInt(size),
        color: {
          dark: `#${fgColor}`,
          light: `#${bgColor}`
        }
      };

      let qrCodeData;
      let mimeType;

      if (format === 'svg') {
        // Generate SVG
        qrCodeData = await QRCode.toString(shortUrl, { ...qrOptions, type: 'svg' });
        mimeType = 'image/svg+xml';
        // Return SVG as data URL
        qrCodeData = `data:${mimeType};base64,${Buffer.from(qrCodeData).toString('base64')}`;
      } else if (format === 'pdf') {
        // Generate PDF with QR code
        const PDFDocument = require('pdfkit');
        const pngBuffer = await QRCode.toBuffer(shortUrl, { ...qrOptions, type: 'image/png' });
        
        // Create PDF
        const pdfBuffer = await new Promise((resolve, reject) => {
          try {
            const doc = new PDFDocument({
              size: [parseInt(size) + 100, parseInt(size) + 100],
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
            doc.image(pngBuffer, {
              fit: [parseInt(size), parseInt(size)],
              align: 'center',
              valign: 'center'
            });

            doc.end();
          } catch (error) {
            reject(error);
          }
        });
        
        mimeType = 'application/pdf';
        qrCodeData = `data:${mimeType};base64,${pdfBuffer.toString('base64')}`;
      } else {
        // Generate PNG buffer first
        const pngBuffer = await QRCode.toBuffer(shortUrl, { ...qrOptions, type: 'image/png' });

        // Convert to requested format using sharp
        let finalBuffer;
        switch (format.toLowerCase()) {
          case 'jpeg':
          case 'jpg':
            finalBuffer = await sharp(pngBuffer).jpeg({ quality: 92 }).toBuffer();
            mimeType = 'image/jpeg';
            break;
          case 'gif':
            finalBuffer = await sharp(pngBuffer).gif().toBuffer();
            mimeType = 'image/gif';
            break;
          case 'webp':
            finalBuffer = await sharp(pngBuffer).webp({ quality: 92 }).toBuffer();
            mimeType = 'image/webp';
            break;
          case 'png':
          default:
            finalBuffer = pngBuffer;
            mimeType = 'image/png';
            break;
        }

        // Return as data URL
        qrCodeData = `data:${mimeType};base64,${finalBuffer.toString('base64')}`;
      }

      return {
        url: shortUrl,
        qrCodeUrl: qrCodeData,
        shortCode,
        originalUrl: url.originalUrl,
        format,
        customization: {
          size,
          format,
          fgColor,
          bgColor,
          errorCorrection,
          margin
        }
      };
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }
  
  async getRedirectStats(shortCode) {
    try {
      const url = await this.getUrlByShortCode(shortCode);
      
      if (!url) {
        throw new Error('URL not found');
      }
      
      return {
        shortCode: url.shortCode,
        originalUrl: url.originalUrl,
        title: url.title,
        clickCount: url.clickCount,
        uniqueClickCount: url.uniqueClickCount,
        lastClickedAt: url.lastClickedAt,
        createdAt: url.createdAt,
        isActive: url.isActive,
        isExpired: url.isExpired,
        expiresAt: url.expiresAt
      };
    } catch (error) {
      console.error('Error getting redirect stats:', error);
      throw error;
    }
  }
}

module.exports = new RedirectService();