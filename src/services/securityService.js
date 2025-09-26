const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { redis } = require('../config/redis');
const config = require('../config/environment');

class SecurityService {
  async validatePassword(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('Password validation error:', error);
      return false;
    }
  }
  
  async hashPassword(password) {
    try {
      const saltRounds = config.BCRYPT_ROUNDS || 12;
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      console.error('Password hashing error:', error);
      throw new Error('Failed to hash password');
    }
  }
  
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
  
  generateApiKey() {
    const timestamp = Date.now().toString(36);
    const randomBytes = crypto.randomBytes(16).toString('hex');
    return `sk_${timestamp}_${randomBytes}`;
  }
  
  hashSHA256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  async rateLimitCheck(key, limit, windowMs) {
    try {
      const current = await redis.incr(key);
      
      if (current === 1) {
        await redis.expire(key, Math.ceil(windowMs / 1000));
      }
      
      return {
        allowed: current <= limit,
        count: current,
        remaining: Math.max(0, limit - current),
        resetTime: Date.now() + windowMs
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      return { allowed: true, count: 0, remaining: limit, resetTime: Date.now() + windowMs };
    }
  }
  
  async blockIP(ipAddress, duration = 24 * 60 * 60 * 1000, reason = 'Suspicious activity') {
    try {
      const key = `blocked_ip:${ipAddress}`;
      const blockData = {
        ip: ipAddress,
        reason,
        blockedAt: new Date(),
        expiresAt: new Date(Date.now() + duration)
      };
      
      await redis.setex(key, Math.ceil(duration / 1000), JSON.stringify(blockData));
      
      console.log(`IP ${ipAddress} blocked for ${reason}`);
      return true;
    } catch (error) {
      console.error('Error blocking IP:', error);
      return false;
    }
  }
  
  async isIPBlocked(ipAddress) {
    try {
      const key = `blocked_ip:${ipAddress}`;
      const blockData = await redis.get(key);
      
      if (!blockData) {
        return { blocked: false };
      }
      
      const parsed = JSON.parse(blockData);
      return {
        blocked: true,
        reason: parsed.reason,
        blockedAt: parsed.blockedAt,
        expiresAt: parsed.expiresAt
      };
    } catch (error) {
      console.error('Error checking IP block status:', error);
      return { blocked: false };
    }
  }
  
  async unblockIP(ipAddress) {
    try {
      const key = `blocked_ip:${ipAddress}`;
      await redis.del(key);
      console.log(`IP ${ipAddress} unblocked`);
      return true;
    } catch (error) {
      console.error('Error unblocking IP:', error);
      return false;
    }
  }
  
  detectSuspiciousActivity(activityData) {
    const {
      ipAddress,
      userAgent,
      requestCount,
      timeWindow,
      endpoints,
      failedAttempts
    } = activityData;
    
    const suspiciousIndicators = [];
    
    if (requestCount > 100 && timeWindow < 60000) {
      suspiciousIndicators.push('HIGH_REQUEST_RATE');
    }
    
    if (failedAttempts > 5) {
      suspiciousIndicators.push('MULTIPLE_FAILED_ATTEMPTS');
    }
    
    if (this.isKnownBot(userAgent)) {
      suspiciousIndicators.push('KNOWN_BOT');
    }
    
    if (this.hasSuspiciousUserAgent(userAgent)) {
      suspiciousIndicators.push('SUSPICIOUS_USER_AGENT');
    }
    
    if (endpoints && this.hasSuspiciousEndpointPattern(endpoints)) {
      suspiciousIndicators.push('SUSPICIOUS_ENDPOINT_PATTERN');
    }
    
    const riskScore = this.calculateRiskScore(suspiciousIndicators, activityData);
    
    return {
      suspicious: suspiciousIndicators.length > 0,
      indicators: suspiciousIndicators,
      riskScore,
      recommended: this.getRecommendedAction(riskScore)
    };
  }
  
  isKnownBot(userAgent) {
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /curl/i, /wget/i, /python/i, /ruby/i, /php/i,
      /automated/i, /script/i
    ];
    
    return botPatterns.some(pattern => pattern.test(userAgent));
  }
  
  hasSuspiciousUserAgent(userAgent) {
    if (!userAgent || userAgent.length < 10) {
      return true;
    }
    
    const suspiciousPatterns = [
      /null/i,
      /undefined/i,
      /test/i,
      /^[a-z]$/i,
      /hack/i,
      /exploit/i,
      /injection/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }
  
  hasSuspiciousEndpointPattern(endpoints) {
    const suspiciousPatterns = [
      /admin/i,
      /config/i,
      /\.php$/i,
      /\.asp$/i,
      /wp-admin/i,
      /phpMyAdmin/i,
      /\.env$/i,
      /backup/i,
      /database/i
    ];
    
    return endpoints.some(endpoint => 
      suspiciousPatterns.some(pattern => pattern.test(endpoint))
    );
  }
  
  calculateRiskScore(indicators, activityData) {
    let score = 0;
    
    const scores = {
      'HIGH_REQUEST_RATE': 30,
      'MULTIPLE_FAILED_ATTEMPTS': 25,
      'KNOWN_BOT': 15,
      'SUSPICIOUS_USER_AGENT': 20,
      'SUSPICIOUS_ENDPOINT_PATTERN': 35
    };
    
    indicators.forEach(indicator => {
      score += scores[indicator] || 0;
    });
    
    if (activityData.requestCount > 500) score += 20;
    if (activityData.failedAttempts > 10) score += 15;
    
    return Math.min(100, score);
  }
  
  getRecommendedAction(riskScore) {
    if (riskScore >= 70) return 'BLOCK';
    if (riskScore >= 50) return 'RATE_LIMIT';
    if (riskScore >= 30) return 'MONITOR';
    return 'ALLOW';
  }
  
  async logSecurityEvent(event) {
    try {
      const logEntry = {
        timestamp: new Date(),
        level: event.level || 'INFO',
        type: event.type,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        userId: event.userId,
        details: event.details,
        action: event.action
      };
      
      const key = `security_log:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
      await redis.setex(key, 30 * 24 * 60 * 60, JSON.stringify(logEntry));
      
      console.log('Security Event:', logEntry);
      
      if (event.level === 'CRITICAL') {
        await this.handleCriticalSecurityEvent(logEntry);
      }
      
      return true;
    } catch (error) {
      console.error('Error logging security event:', error);
      return false;
    }
  }
  
  async handleCriticalSecurityEvent(event) {
    try {
      if (event.ipAddress) {
        await this.blockIP(event.ipAddress, 24 * 60 * 60 * 1000, event.type);
      }
      
      console.error('CRITICAL SECURITY EVENT:', event);
      
    } catch (error) {
      console.error('Error handling critical security event:', error);
    }
  }
  
  validateInput(input, type, options = {}) {
    const validators = {
      email: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      },
      
      url: (value) => {
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      
      shortCode: (value) => {
        const codeRegex = /^[a-zA-Z0-9_-]+$/;
        return codeRegex.test(value) && 
               value.length >= (options.minLength || 3) && 
               value.length <= (options.maxLength || 50);
      },
      
      alphanumeric: (value) => {
        const alphanumericRegex = /^[a-zA-Z0-9]+$/;
        return alphanumericRegex.test(value);
      },
      
      mongoId: (value) => {
        const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
        return mongoIdRegex.test(value);
      }
    };
    
    const validator = validators[type];
    if (!validator) {
      throw new Error(`Unknown validation type: ${type}`);
    }
    
    return validator(input);
  }
  
  sanitizeInput(input) {
    if (typeof input !== 'string') {
      return input;
    }
    
    return input
      .trim()
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
  }
  
  async checkPasswordStrength(password) {
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      noCommonPasswords: !await this.isCommonPassword(password)
    };
    
    const score = Object.values(checks).reduce((sum, check) => sum + (check ? 1 : 0), 0);
    
    let strength = 'weak';
    if (score >= 5) strength = 'strong';
    else if (score >= 3) strength = 'medium';
    
    return {
      strength,
      score,
      checks,
      suggestions: this.getPasswordSuggestions(checks)
    };
  }
  
  async isCommonPassword(password) {
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];
    
    return commonPasswords.includes(password.toLowerCase());
  }
  
  getPasswordSuggestions(checks) {
    const suggestions = [];
    
    if (!checks.length) suggestions.push('Use at least 8 characters');
    if (!checks.lowercase) suggestions.push('Include lowercase letters');
    if (!checks.uppercase) suggestions.push('Include uppercase letters');
    if (!checks.numbers) suggestions.push('Include numbers');
    if (!checks.symbols) suggestions.push('Include special characters');
    if (!checks.noCommonPasswords) suggestions.push('Avoid common passwords');
    
    return suggestions;
  }
  
  async generateCSRFToken(sessionId) {
    try {
      const token = this.generateSecureToken();
      const key = `csrf:${sessionId}`;
      
      await redis.setex(key, 60 * 60, token);
      
      return token;
    } catch (error) {
      console.error('Error generating CSRF token:', error);
      throw new Error('Failed to generate CSRF token');
    }
  }
  
  async validateCSRFToken(sessionId, token) {
    try {
      const key = `csrf:${sessionId}`;
      const storedToken = await redis.get(key);
      
      if (!storedToken || storedToken !== token) {
        return false;
      }
      
      await redis.del(key);
      return true;
    } catch (error) {
      console.error('Error validating CSRF token:', error);
      return false;
    }
  }
}

module.exports = new SecurityService();