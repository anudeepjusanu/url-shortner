const Url = require('../models/Url');
const analyticsService = require('./analyticsService');
const securityService = require('./securityService');
const { cacheGet } = require('../config/redis');
const config = require('../config/environment');

class RedirectService {
  async handleRedirect(shortCode, requestData) {
    try {
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

      const blocked = await securityService.isIPBlocked(ipAddress);
      if (blocked.blocked) {
        throw new Error(`IP blocked: ${blocked.reason}`);
      }

      const url = await this.getUrlByShortCode(shortCode, domain);
      if (!url) {
        throw new Error('URL not found');
      }

      const validationResult = await this.validateRedirect(url, requestData);
      if (!validationResult.allowed) {
        throw new Error(validationResult.reason);
      }

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
      
      return {
        success: true,
        redirectUrl,
        redirectType: url.redirectType || 302,
        metadata: this.getRedirectMetadata(url)
      };
    } catch (error) {
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
      console.log('getUrlByShortCode debug:', {
        shortCode,
        requestDomain,
        isMainDomain: this.isMainDomain(requestDomain)
      });

      let url = await cacheGet(`url:${shortCode}`);

      if (!url) {
        const query = {
          $or: [{ shortCode }, { customCode: shortCode }]
        };

        // If a custom domain is being used, ensure the URL belongs to that domain
        if (requestDomain && !this.isMainDomain(requestDomain)) {
          query.domain = requestDomain;
          console.log('Custom domain query:', query);
        } else {
          console.log('Main domain or no domain specified, query:', query);
        }

        url = await Url.findOne(query)
          .populate('creator', 'firstName lastName email')
          .populate('organization', 'name slug');

        console.log('Found URL:', url ? { shortCode: url.shortCode, domain: url.domain, originalUrl: url.originalUrl } : 'null');

        if (url && url.isActive) {
          try {
            await cacheSet(`url:${shortCode}`, url, config.CACHE_TTL.URL_CACHE);
          } catch (cacheError) {
            // Continue anyway, just without caching
          }
        }
      }

      return url;
    } catch (error) {
      console.error('Error fetching URL:', error);
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
      'localhost'
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

      const shortUrl = `${config.BASE_URL}/${shortCode}`;

      // Build QR code URL with customization parameters
      const qrParams = new URLSearchParams({
        size: `${size}x${size}`,
        data: shortUrl,
        format: format,
        color: fgColor,
        bgcolor: bgColor,
        ecc: errorCorrection,
        margin: margin.toString()
      });

      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?${qrParams.toString()}`;

      return {
        url: shortUrl,
        qrCodeUrl,
        shortCode,
        originalUrl: url.originalUrl,
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