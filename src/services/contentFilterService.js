const ContentFilterSettings = require('../models/ContentFilterSettings');
const { BlockedDomain, BlockedKeyword, AllowedDomain, FilterLog } = require('../models/FilterList');
const url = require('url');

/**
 * Content Filter Service
 * Handles URL content filtering, domain/keyword blocking, and whitelisting
 */
class ContentFilterService {
  constructor() {
    // Common malicious patterns
    this.maliciousPatterns = [
      /malware/i,
      /virus/i,
      /trojan/i,
      /ransomware/i,
      /exploit/i,
      /backdoor/i
    ];

    // Common phishing patterns
    this.phishingPatterns = [
      /phishing/i,
      /verify.*account/i,
      /suspend.*account/i,
      /confirm.*identity/i,
      /security.*alert/i,
      /unusual.*activity/i,
      /click.*here.*login/i
    ];

    // Common spam patterns
    this.spamPatterns = [
      /free.*money/i,
      /win.*prize/i,
      /click.*here.*now/i,
      /limited.*time.*offer/i,
      /act.*now/i,
      /guaranteed/i
    ];

    // Known malicious domains (sample list)
    this.knownMaliciousDomains = [
      'malware.com',
      'phishing-site.com',
      'spam-url.com'
    ];
  }

  /**
   * Validate URL against content filters
   * @param {String} urlString - URL to validate
   * @param {String} userId - User ID
   * @returns {Object} Validation result
   */
  async validateUrl(urlString, userId) {
    // Get user settings
    const settings = await ContentFilterSettings.getOrCreate(userId);

    // If filtering is disabled, allow all
    if (!settings.enableContentFilter) {
      return { allowed: true, reason: null };
    }

    // Parse URL
    let parsedUrl;
    try {
      parsedUrl = new URL(urlString);
    } catch (error) {
      return {
        allowed: false,
        reason: 'invalid',
        message: 'Invalid URL format'
      };
    }

    const domain = parsedUrl.hostname.toLowerCase();
    const fullUrl = urlString.toLowerCase();

    // Check whitelist first
    if (settings.enableWhitelist) {
      const isWhitelisted = await this.isWhitelisted(domain, userId);
      if (isWhitelisted) {
        return { allowed: true, reason: 'whitelisted' };
      }
    }

    // Check blocked domains
    const blockedDomain = await this.isBlockedDomain(domain, userId);
    if (blockedDomain) {
      await this.logFilter(userId, urlString, 'domain', `Domain ${domain} is blocked`, {
        filterType: 'domain',
        severity: 'high'
      });
      return {
        allowed: false,
        reason: 'domain',
        message: `Domain ${domain} is in your blocked list`
      };
    }

    // Check custom keywords
    if (settings.customKeywordFiltering) {
      const blockedKeyword = await this.containsBlockedKeyword(fullUrl, userId);
      if (blockedKeyword) {
        await this.logFilter(userId, urlString, 'keyword', `URL contains blocked keyword: ${blockedKeyword}`, {
          filterType: 'keyword',
          severity: 'medium'
        });
        return {
          allowed: false,
          reason: 'keyword',
          message: `URL contains blocked keyword: ${blockedKeyword}`
        };
      }
    }

    // Check for malicious URLs
    if (settings.blockMaliciousUrls) {
      const isMalicious = this.checkMalicious(fullUrl, domain);
      if (isMalicious) {
        await this.logFilter(userId, urlString, 'malicious', 'URL detected as potentially malicious', {
          filterType: 'automatic',
          severity: 'critical'
        });
        return {
          allowed: false,
          reason: 'malicious',
          message: 'URL detected as potentially malicious'
        };
      }
    }

    // Check for phishing
    if (settings.blockPhishing) {
      const isPhishing = this.checkPhishing(fullUrl, domain);
      if (isPhishing) {
        await this.logFilter(userId, urlString, 'phishing', 'URL detected as potential phishing attempt', {
          filterType: 'automatic',
          severity: 'critical'
        });
        return {
          allowed: false,
          reason: 'phishing',
          message: 'URL detected as potential phishing attempt'
        };
      }
    }

    // Check for spam
    if (settings.blockSpam) {
      const isSpam = this.checkSpam(fullUrl);
      if (isSpam) {
        await this.logFilter(userId, urlString, 'spam', 'URL detected as spam', {
          filterType: 'automatic',
          severity: 'low'
        });
        return {
          allowed: false,
          reason: 'spam',
          message: 'URL detected as spam'
        };
      }
    }

    // Check for adult content
    if (settings.blockAdultContent) {
      const isAdult = this.checkAdultContent(fullUrl, domain);
      if (isAdult) {
        await this.logFilter(userId, urlString, 'adult', 'URL contains adult content', {
          filterType: 'automatic',
          severity: 'medium'
        });
        return {
          allowed: false,
          reason: 'adult',
          message: 'URL contains adult content'
        };
      }
    }

    // All checks passed
    return { allowed: true, reason: null };
  }

  /**
   * Check if domain is whitelisted
   * @param {String} domain - Domain to check
   * @param {String} userId - User ID
   * @returns {Boolean}
   */
  async isWhitelisted(domain, userId) {
    const allowed = await AllowedDomain.findOne({ user: userId, domain });
    return !!allowed;
  }

  /**
   * Check if domain is blocked
   * @param {String} domain - Domain to check
   * @param {String} userId - User ID
   * @returns {Boolean}
   */
  async isBlockedDomain(domain, userId) {
    const blocked = await BlockedDomain.findOne({ user: userId, domain });
    if (blocked) {
      await blocked.incrementBlockCount();
    }
    return !!blocked;
  }

  /**
   * Check if URL contains blocked keyword
   * @param {String} urlString - URL to check
   * @param {String} userId - User ID
   * @returns {String|null} Blocked keyword if found
   */
  async containsBlockedKeyword(urlString, userId) {
    const keywords = await BlockedKeyword.find({ user: userId });

    for (const keywordDoc of keywords) {
      const keyword = keywordDoc.keyword;
      const regex = keywordDoc.caseSensitive
        ? new RegExp(keyword, 'g')
        : new RegExp(keyword, 'gi');

      if (regex.test(urlString)) {
        await keywordDoc.incrementBlockCount();
        return keyword;
      }
    }

    return null;
  }

  /**
   * Check if URL is malicious
   * @param {String} urlString - URL to check
   * @param {String} domain - Domain
   * @returns {Boolean}
   */
  checkMalicious(urlString, domain) {
    // Check against known malicious domains
    if (this.knownMaliciousDomains.includes(domain)) {
      return true;
    }

    // Check against malicious patterns
    return this.maliciousPatterns.some(pattern => pattern.test(urlString));
  }

  /**
   * Check if URL is phishing
   * @param {String} urlString - URL to check
   * @param {String} domain - Domain
   * @returns {Boolean}
   */
  checkPhishing(urlString, domain) {
    // Check for suspicious TLDs
    const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.gq'];
    if (suspiciousTlds.some(tld => domain.endsWith(tld))) {
      return true;
    }

    // Check for phishing patterns
    return this.phishingPatterns.some(pattern => pattern.test(urlString));
  }

  /**
   * Check if URL is spam
   * @param {String} urlString - URL to check
   * @returns {Boolean}
   */
  checkSpam(urlString) {
    return this.spamPatterns.some(pattern => pattern.test(urlString));
  }

  /**
   * Check if URL contains adult content
   * @param {String} urlString - URL to check
   * @param {String} domain - Domain
   * @returns {Boolean}
   */
  checkAdultContent(urlString, domain) {
    const adultKeywords = ['adult', 'xxx', 'porn', 'sex', 'nsfw'];
    const lowerUrl = urlString.toLowerCase();
    const lowerDomain = domain.toLowerCase();

    return adultKeywords.some(keyword =>
      lowerUrl.includes(keyword) || lowerDomain.includes(keyword)
    );
  }

  /**
   * Log filter activity
   * @param {String} userId - User ID
   * @param {String} url - URL
   * @param {String} reason - Filter reason
   * @param {String} message - Log message
   * @param {Object} options - Additional options
   */
  async logFilter(userId, url, reason, message, options = {}) {
    try {
      await FilterLog.logFilter(userId, url, reason, message, options);

      // Update user settings
      const settings = await ContentFilterSettings.findOne({ user: userId });
      if (settings) {
        await settings.incrementFilterCount();
      }
    } catch (error) {
      console.error('Error logging filter:', error);
    }
  }

  /**
   * Get user filter settings
   * @param {String} userId - User ID
   * @returns {Object} Filter settings
   */
  async getSettings(userId) {
    return ContentFilterSettings.getOrCreate(userId);
  }

  /**
   * Update user filter settings
   * @param {String} userId - User ID
   * @param {Object} settings - Settings to update
   * @returns {Object} Updated settings
   */
  async updateSettings(userId, settings) {
    let userSettings = await ContentFilterSettings.getOrCreate(userId);

    // Update settings
    Object.keys(settings).forEach(key => {
      if (userSettings[key] !== undefined) {
        userSettings[key] = settings[key];
      }
    });

    await userSettings.save();
    return userSettings;
  }

  /**
   * Get blocked domains
   * @param {String} userId - User ID
   * @returns {Array} Blocked domains
   */
  async getBlockedDomains(userId) {
    return BlockedDomain.find({ user: userId }).sort({ addedAt: -1 });
  }

  /**
   * Add blocked domain
   * @param {String} userId - User ID
   * @param {String} domain - Domain to block
   * @param {String} reason - Reason for blocking
   * @returns {Object} Created domain
   */
  async addBlockedDomain(userId, domain, reason = 'manual') {
    // Normalize domain
    const normalizedDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    // Check if already exists
    const existing = await BlockedDomain.findOne({ user: userId, domain: normalizedDomain });
    if (existing) {
      throw new Error('Domain already in blocked list');
    }

    return BlockedDomain.create({
      user: userId,
      domain: normalizedDomain,
      reason
    });
  }

  /**
   * Remove blocked domain
   * @param {String} userId - User ID
   * @param {String} domain - Domain to unblock
   * @returns {Object} Deletion result
   */
  async removeBlockedDomain(userId, domain) {
    const result = await BlockedDomain.deleteOne({ user: userId, domain });
    if (result.deletedCount === 0) {
      throw new Error('Domain not found in blocked list');
    }
    return { success: true, message: 'Domain removed from blocked list' };
  }

  /**
   * Get blocked keywords
   * @param {String} userId - User ID
   * @returns {Array} Blocked keywords
   */
  async getBlockedKeywords(userId) {
    return BlockedKeyword.find({ user: userId }).sort({ addedAt: -1 });
  }

  /**
   * Add blocked keyword
   * @param {String} userId - User ID
   * @param {String} keyword - Keyword to block
   * @param {Boolean} caseSensitive - Case sensitive flag
   * @returns {Object} Created keyword
   */
  async addBlockedKeyword(userId, keyword, caseSensitive = false) {
    const normalizedKeyword = keyword.trim();

    // Check if already exists
    const existing = await BlockedKeyword.findOne({ user: userId, keyword: normalizedKeyword });
    if (existing) {
      throw new Error('Keyword already in blocked list');
    }

    return BlockedKeyword.create({
      user: userId,
      keyword: normalizedKeyword,
      caseSensitive
    });
  }

  /**
   * Remove blocked keyword
   * @param {String} userId - User ID
   * @param {String} keyword - Keyword to unblock
   * @returns {Object} Deletion result
   */
  async removeBlockedKeyword(userId, keyword) {
    const result = await BlockedKeyword.deleteOne({ user: userId, keyword });
    if (result.deletedCount === 0) {
      throw new Error('Keyword not found in blocked list');
    }
    return { success: true, message: 'Keyword removed from blocked list' };
  }

  /**
   * Get allowed domains (whitelist)
   * @param {String} userId - User ID
   * @returns {Array} Allowed domains
   */
  async getAllowedDomains(userId) {
    return AllowedDomain.find({ user: userId }).sort({ addedAt: -1 });
  }

  /**
   * Add allowed domain
   * @param {String} userId - User ID
   * @param {String} domain - Domain to allow
   * @param {String} note - Optional note
   * @returns {Object} Created domain
   */
  async addAllowedDomain(userId, domain, note = '') {
    // Normalize domain
    const normalizedDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    // Check if already exists
    const existing = await AllowedDomain.findOne({ user: userId, domain: normalizedDomain });
    if (existing) {
      throw new Error('Domain already in allowed list');
    }

    return AllowedDomain.create({
      user: userId,
      domain: normalizedDomain,
      note
    });
  }

  /**
   * Remove allowed domain
   * @param {String} userId - User ID
   * @param {String} domain - Domain to remove
   * @returns {Object} Deletion result
   */
  async removeAllowedDomain(userId, domain) {
    const result = await AllowedDomain.deleteOne({ user: userId, domain });
    if (result.deletedCount === 0) {
      throw new Error('Domain not found in allowed list');
    }
    return { success: true, message: 'Domain removed from allowed list' };
  }

  /**
   * Get filter logs
   * @param {String} userId - User ID
   * @param {Object} options - Query options
   * @returns {Array} Filter logs
   */
  async getFilterLogs(userId, options = {}) {
    return FilterLog.getUserLogs(userId, options);
  }

  /**
   * Get filter statistics
   * @param {String} userId - User ID
   * @returns {Object} Filter statistics
   */
  async getFilterStats(userId) {
    return FilterLog.getStats(userId);
  }
}

module.exports = new ContentFilterService();
