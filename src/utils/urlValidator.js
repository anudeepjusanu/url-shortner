const url = require('url');

class UrlValidator {
  constructor() {
    this.allowedProtocols = ['http:', 'https:'];
    this.blockedDomains = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '10.0.0.0/8',
      '172.16.0.0/12',
      '192.168.0.0/16'
    ];
    
    this.maliciousDomains = [
      'malware.com',
      'phishing.org',
      'spam.net'
    ];
    
    this.shortenerDomains = [
      'bit.ly',
      'tinyurl.com',
      'goo.gl',
      't.co',
      'ow.ly',
      'short.link',
      'tiny.cc'
    ];
  }
  
  validateUrl(inputUrl) {
    try {
      if (!inputUrl || typeof inputUrl !== 'string') {
        return {
          isValid: false,
          message: 'URL is required and must be a string'
        };
      }
      
      const trimmedUrl = inputUrl.trim();
      
      if (trimmedUrl.length > 2048) {
        return {
          isValid: false,
          message: 'URL exceeds maximum length of 2048 characters'
        };
      }
      
      let cleanUrl = this.normalizeUrl(trimmedUrl);
      
      const parsedUrl = new url.URL(cleanUrl);
      
      if (!this.allowedProtocols.includes(parsedUrl.protocol)) {
        return {
          isValid: false,
          message: 'Only HTTP and HTTPS URLs are allowed'
        };
      }
      
      const domainCheck = this.validateDomain(parsedUrl.hostname);
      if (!domainCheck.isValid) {
        return domainCheck;
      }
      
      const contentCheck = this.validateUrlContent(parsedUrl);
      if (!contentCheck.isValid) {
        return contentCheck;
      }
      
      const securityCheck = this.performSecurityChecks(parsedUrl);
      if (!securityCheck.isValid) {
        return securityCheck;
      }
      
      return {
        isValid: true,
        cleanUrl: cleanUrl,
        title: this.extractTitle(parsedUrl),
        domain: parsedUrl.hostname,
        protocol: parsedUrl.protocol,
        warnings: this.getWarnings(parsedUrl)
      };
      
    } catch (error) {
      return {
        isValid: false,
        message: `Invalid URL format: ${error.message}`
      };
    }
  }
  
  normalizeUrl(inputUrl) {
    let url = inputUrl.trim();
    
    if (!url.match(/^https?:\/\//)) {
      url = 'https://' + url;
    }
    
    url = url.replace(/\s+/g, '');
    
    if (url.endsWith('/') && url.split('/').length === 4) {
      url = url.slice(0, -1);
    }
    
    return url;
  }
  
  validateDomain(hostname) {
    if (!hostname) {
      return {
        isValid: false,
        message: 'Invalid hostname'
      };
    }
    
    if (hostname.length > 253) {
      return {
        isValid: false,
        message: 'Domain name too long'
      };
    }
    
    // Check that hostname has at least one dot (requires a TLD)
    // Exception: allow localhost in non-production environments
    if (!hostname.includes('.')) {
      if (hostname === 'localhost' && process.env.NODE_ENV !== 'production') {
        // Allow localhost in development
      } else {
        return {
          isValid: false,
          message: 'Invalid URL: domain must include a valid TLD (e.g., .com, .org, .net)'
        };
      }
    }
    
    // Validate domain format - must have valid characters
    if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(hostname)) {
      return {
        isValid: false,
        message: 'Invalid domain name format'
      };
    }
    
    // Ensure TLD is at least 2 characters (e.g., .co, .io, .com)
    const parts = hostname.split('.');
    const tld = parts[parts.length - 1];
    if (tld && tld.length < 2) {
      return {
        isValid: false,
        message: 'Invalid URL: TLD must be at least 2 characters'
      };
    }
    
    if (this.isBlockedDomain(hostname)) {
      return {
        isValid: false,
        message: 'Domain is not allowed'
      };
    }
    
    if (this.isMaliciousDomain(hostname)) {
      return {
        isValid: false,
        message: 'Domain is flagged as malicious'
      };
    }
    
    return { isValid: true };
  }
  
  validateUrlContent(parsedUrl) {
    const pathname = parsedUrl.pathname.toLowerCase();
    const search = parsedUrl.search.toLowerCase();
    const hash = parsedUrl.hash.toLowerCase();
    
    const suspiciousPatterns = [
      /javascript:/,
      /data:/,
      /vbscript:/,
      /file:/,
      /\.exe(\?|$)/,
      /\.scr(\?|$)/,
      /\.bat(\?|$)/,
      /\.cmd(\?|$)/,
      /malware/,
      /phishing/,
      /virus/
    ];
    
    const fullUrl = parsedUrl.href.toLowerCase();
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(fullUrl) || pattern.test(pathname) || pattern.test(search) || pattern.test(hash)) {
        return {
          isValid: false,
          message: 'URL contains suspicious content'
        };
      }
    }
    
    if (pathname.includes('..') || pathname.includes('//')) {
      return {
        isValid: false,
        message: 'URL contains path traversal attempts'
      };
    }
    
    return { isValid: true };
  }
  
  performSecurityChecks(parsedUrl) {
    if (parsedUrl.username || parsedUrl.password) {
      return {
        isValid: false,
        message: 'URLs with embedded credentials are not allowed'
      };
    }
    
    // Punycode domains are now supported for international domain names (IDN)
    // Example: xn--mgbal82c.com represents مثال.com in ASCII-compatible encoding
    // This allows QR codes and URLs to work universally across all devices

    const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    if (ipRegex.test(parsedUrl.hostname)) {
      const octets = parsedUrl.hostname.split('.').map(Number);
      
      if (octets.some(octet => octet > 255)) {
        return {
          isValid: false,
          message: 'Invalid IP address'
        };
      }
      
      if (this.isPrivateIP(parsedUrl.hostname)) {
        return {
          isValid: false,
          message: 'Private IP addresses are not allowed'
        };
      }
    }
    
    return { isValid: true };
  }
  
  isBlockedDomain(hostname) {
    const domain = hostname.toLowerCase();
    
    if (process.env.NODE_ENV !== 'production') {
      return false;
    }
    
    return this.blockedDomains.some(blocked => {
      if (blocked.includes('/')) {
        return this.isInSubnet(hostname, blocked);
      }
      return domain === blocked || domain.endsWith('.' + blocked);
    });
  }
  
  isMaliciousDomain(hostname) {
    const domain = hostname.toLowerCase();
    return this.maliciousDomains.some(malicious => 
      domain === malicious || domain.endsWith('.' + malicious)
    );
  }
  
  isPrivateIP(ip) {
    const octets = ip.split('.').map(Number);
    
    return (
      octets[0] === 10 ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168) ||
      (octets[0] === 127)
    );
  }
  
  isInSubnet(ip, subnet) {
    try {
      const [subnetIP, prefixLength] = subnet.split('/');
      const subnetOctets = subnetIP.split('.').map(Number);
      const ipOctets = ip.split('.').map(Number);
      
      const subnetInt = (subnetOctets[0] << 24) + (subnetOctets[1] << 16) + (subnetOctets[2] << 8) + subnetOctets[3];
      const ipInt = (ipOctets[0] << 24) + (ipOctets[1] << 16) + (ipOctets[2] << 8) + ipOctets[3];
      
      const mask = (~0 << (32 - parseInt(prefixLength))) >>> 0;
      
      return (subnetInt & mask) === (ipInt & mask);
    } catch (error) {
      return false;
    }
  }
  
  extractTitle(parsedUrl) {
    const hostname = parsedUrl.hostname;
    
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const domain = parts[parts.length - 2];
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    }
    
    return hostname;
  }
  
  getWarnings(parsedUrl) {
    const warnings = [];
    
    if (parsedUrl.protocol === 'http:') {
      warnings.push({
        type: 'INSECURE_PROTOCOL',
        message: 'URL uses HTTP instead of HTTPS'
      });
    }
    
    if (this.isShortenerDomain(parsedUrl.hostname)) {
      warnings.push({
        type: 'NESTED_SHORTENER',
        message: 'URL points to another URL shortening service'
      });
    }
    
    if (parsedUrl.pathname.length > 100) {
      warnings.push({
        type: 'LONG_PATH',
        message: 'URL has a very long path'
      });
    }
    
    if (parsedUrl.search && parsedUrl.search.length > 200) {
      warnings.push({
        type: 'LONG_QUERY',
        message: 'URL has a very long query string'
      });
    }
    
    return warnings;
  }
  
  isShortenerDomain(hostname) {
    const domain = hostname.toLowerCase();
    return this.shortenerDomains.some(shortener => 
      domain === shortener || domain.endsWith('.' + shortener)
    );
  }
  
  validateBulkUrls(urls) {
    if (!Array.isArray(urls)) {
      return {
        isValid: false,
        message: 'URLs must be provided as an array'
      };
    }
    
    if (urls.length === 0) {
      return {
        isValid: false,
        message: 'At least one URL is required'
      };
    }
    
    if (urls.length > 100) {
      return {
        isValid: false,
        message: 'Cannot validate more than 100 URLs at once'
      };
    }
    
    const results = {
      valid: [],
      invalid: [],
      warnings: []
    };
    
    urls.forEach((url, index) => {
      const validation = this.validateUrl(url);
      
      if (validation.isValid) {
        results.valid.push({
          index,
          url: validation.cleanUrl,
          warnings: validation.warnings
        });
        
        if (validation.warnings && validation.warnings.length > 0) {
          results.warnings.push({
            index,
            url: validation.cleanUrl,
            warnings: validation.warnings
          });
        }
      } else {
        results.invalid.push({
          index,
          url,
          error: validation.message
        });
      }
    });
    
    return {
      isValid: results.invalid.length === 0,
      results,
      summary: {
        total: urls.length,
        valid: results.valid.length,
        invalid: results.invalid.length,
        warnings: results.warnings.length
      }
    };
  }
  
  checkUrlAccessibility(url, timeout = 5000) {
    return new Promise(async (resolve) => {
      try {
        // Use axios for more reliable HTTP requests in Node.js
        const axios = require('axios');
        
        // First try HEAD request (faster, less bandwidth)
        let response;
        let method = 'HEAD';
        
        try {
          response = await axios.head(url, {
            timeout: timeout,
            maxRedirects: 5,
            validateStatus: () => true, // Don't throw on any status code
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': '*/*',
              'Accept-Encoding': 'gzip, deflate, br',
              'Connection': 'keep-alive'
            }
          });
          
          // If HEAD returns 405 (Method Not Allowed) or 501 (Not Implemented), try GET instead
          if (response.status === 405 || response.status === 501) {
            console.log(`HEAD request returned ${response.status} for ${url}, trying GET...`);
            method = 'GET';
            response = await axios.get(url, {
              timeout: timeout,
              maxRedirects: 5,
              validateStatus: () => true,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive'
              },
              // Only fetch headers and minimal body
              maxContentLength: 2048, // Limit to 2KB
              responseType: 'stream' // Stream to avoid loading entire response
            });
            
            // Destroy the stream immediately to stop downloading
            if (response.data && response.data.destroy) {
              response.data.destroy();
            }
          }
        } catch (headError) {
          // If HEAD fails, try GET
          console.log(`${method} request failed for ${url} with ${headError.code || headError.message}, trying GET...`);
          
          try {
            method = 'GET';
            response = await axios.get(url, {
              timeout: timeout,
              maxRedirects: 5,
              validateStatus: () => true,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive'
              },
              maxContentLength: 2048,
              responseType: 'stream'
            });
            
            // Destroy the stream immediately
            if (response.data && response.data.destroy) {
              response.data.destroy();
            }
          } catch (getError) {
            // Both HEAD and GET failed, throw the GET error
            throw getError;
          }
        }
        
        console.log(`URL check for ${url}: ${method} returned ${response.status}`);
        
        resolve({
          accessible: response.status >= 200 && response.status < 400,
          status: response.status,
          statusText: response.statusText,
          redirected: response.request?.res?.responseUrl !== url,
          finalUrl: response.request?.res?.responseUrl || url,
          method: method
        });
      } catch (error) {
        // Extract meaningful error message
        let errorMessage = error.message || 'Unknown error';
        
        // Handle axios-specific error codes
        if (error.code) {
          errorMessage = error.code;
        }
        
        console.log(`URL accessibility check failed for ${url}: ${errorMessage}`);
        
        resolve({
          accessible: false,
          error: errorMessage,
          code: error.code,
          status: error.response?.status
        });
      }
    });
  }
}

const validator = new UrlValidator();

module.exports = {
  validateUrl: validator.validateUrl.bind(validator),
  validateBulkUrls: validator.validateBulkUrls.bind(validator),
  checkUrlAccessibility: validator.checkUrlAccessibility.bind(validator),
  normalizeUrl: validator.normalizeUrl.bind(validator)
};