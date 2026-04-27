const axios = require('axios');

/**
 * Google Safe Browsing Service
 * Checks URLs against Google's Safe Browsing API to detect malicious content
 * 
 * API Documentation: https://developers.google.com/safe-browsing/v4
 */
class SafeBrowsingService {
  constructor() {
    this.apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
    this.apiUrl = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';
    this.enabled = !!this.apiKey;
    
    // Threat types to check for
    this.threatTypes = [
      'MALWARE',
      'SOCIAL_ENGINEERING', // Phishing
      'UNWANTED_SOFTWARE',
      'POTENTIALLY_HARMFUL_APPLICATION'
    ];
    
    // Platform types
    this.platformTypes = [
      'ANY_PLATFORM'
    ];
    
    // Threat entry types
    this.threatEntryTypes = [
      'URL'
    ];
  }

  /**
   * Check if a URL is safe using Google Safe Browsing API
   * @param {string} url - The URL to check
   * @returns {Promise<{isSafe: boolean, threats: Array, error: string}>}
   */
  async checkUrl(url) {
    // If API key is not configured, skip the check
    if (!this.enabled) {
      console.warn('⚠️ Google Safe Browsing API key not configured. Skipping safety check.');
      return {
        isSafe: true,
        threats: [],
        skipped: true,
        message: 'Safety check skipped - API not configured'
      };
    }

    try {
      const requestBody = {
        client: {
          clientId: 'url-shortener',
          clientVersion: '1.0.0'
        },
        threatInfo: {
          threatTypes: this.threatTypes,
          platformTypes: this.platformTypes,
          threatEntryTypes: this.threatEntryTypes,
          threatEntries: [
            { url: url }
          ]
        }
      };

      const response = await axios.post(
        `${this.apiUrl}?key=${this.apiKey}`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 5000 // 5 second timeout
        }
      );

      // If matches are found, the URL is unsafe
      if (response.data && response.data.matches && response.data.matches.length > 0) {
        const threats = response.data.matches.map(match => ({
          threatType: match.threatType,
          platformType: match.platformType,
          threatEntryType: match.threatEntryType
        }));

        console.log('🚨 Unsafe URL detected:', url, threats);

        return {
          isSafe: false,
          threats: threats,
          message: this.formatThreatMessage(threats)
        };
      }

      // No matches found - URL is safe
      console.log('✅ URL passed safety check:', url);
      return {
        isSafe: true,
        threats: [],
        message: 'URL is safe'
      };

    } catch (error) {
      console.error('❌ Google Safe Browsing API error:', error.message);

      // Handle specific error cases
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;

        if (status === 400) {
          console.error('Bad request to Safe Browsing API:', errorData);
          return {
            isSafe: true, // Allow URL on API error (fail open)
            threats: [],
            error: 'Invalid request to safety check service',
            skipped: true
          };
        }

        if (status === 401 || status === 403) {
          console.error('Authentication error with Safe Browsing API');
          return {
            isSafe: true, // Allow URL on auth error
            threats: [],
            error: 'Safety check service authentication failed',
            skipped: true
          };
        }

        if (status === 429) {
          console.error('Rate limit exceeded for Safe Browsing API');
          return {
            isSafe: true, // Allow URL on rate limit
            threats: [],
            error: 'Safety check service rate limit exceeded',
            skipped: true
          };
        }
      }

      // Network or timeout errors - fail open (allow the URL)
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        console.error('Timeout checking URL safety');
        return {
          isSafe: true,
          threats: [],
          error: 'Safety check timed out',
          skipped: true
        };
      }

      // Unknown error - fail open
      return {
        isSafe: true,
        threats: [],
        error: error.message,
        skipped: true
      };
    }
  }

  /**
   * Format threat information into a user-friendly message
   * @param {Array} threats - Array of threat objects
   * @returns {string} - Formatted message
   */
  formatThreatMessage(threats) {
    if (!threats || threats.length === 0) {
      return 'URL is flagged as unsafe';
    }

    const threatTypes = threats.map(t => t.threatType);
    const uniqueThreats = [...new Set(threatTypes)];

    const threatMessages = {
      'MALWARE': 'malware',
      'SOCIAL_ENGINEERING': 'phishing or social engineering',
      'UNWANTED_SOFTWARE': 'unwanted software',
      'POTENTIALLY_HARMFUL_APPLICATION': 'potentially harmful applications'
    };

    const messages = uniqueThreats.map(type => threatMessages[type] || 'unsafe content');
    
    if (messages.length === 1) {
      return `This URL has been flagged by Google Safe Browsing as containing ${messages[0]}`;
    } else {
      const lastMessage = messages.pop();
      return `This URL has been flagged by Google Safe Browsing as containing ${messages.join(', ')} and ${lastMessage}`;
    }
  }

  /**
   * Check multiple URLs in a single API request (true batch mode).
   * Returns a Map of url → { isSafe, threats, message }.
   * Falls back to individual checks when the API is unavailable.
   * @param {Array<string>} urls - URLs to check
   * @returns {Promise<Map<string, {isSafe: boolean, threats: Array, message: string}>>}
   */
  async checkUrlsBatch(urls) {
    if (!Array.isArray(urls) || urls.length === 0) {
      return new Map();
    }

    // Build a safe result map (all safe) as the default
    const resultMap = new Map();
    urls.forEach(url => resultMap.set(url, { isSafe: true, threats: [], message: 'URL is safe' }));

    if (!this.enabled) {
      console.warn('⚠️ Google Safe Browsing API key not configured. Skipping batch safety check.');
      return resultMap;
    }

    // Google Safe Browsing API supports up to 500 URLs per request
    const maxBatchSize = 500;

    for (let i = 0; i < urls.length; i += maxBatchSize) {
      const batch = urls.slice(i, i + maxBatchSize);

      try {
        const requestBody = {
          client: { clientId: 'url-shortener', clientVersion: '1.0.0' },
          threatInfo: {
            threatTypes: this.threatTypes,
            platformTypes: this.platformTypes,
            threatEntryTypes: this.threatEntryTypes,
            threatEntries: batch.map(url => ({ url }))
          }
        };

        const response = await axios.post(
          `${this.apiUrl}?key=${this.apiKey}`,
          requestBody,
          { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
        );

        if (response.data && response.data.matches) {
          // Group matches by URL
          const matchesByUrl = new Map();
          response.data.matches.forEach(match => {
            const url = match.threat.url;
            if (!matchesByUrl.has(url)) matchesByUrl.set(url, []);
            matchesByUrl.get(url).push({
              threatType: match.threatType,
              platformType: match.platformType,
              threatEntryType: match.threatEntryType
            });
          });

          matchesByUrl.forEach((threats, url) => {
            console.log('🚨 Unsafe URL detected (batch):', url, threats);
            resultMap.set(url, {
              isSafe: false,
              threats,
              message: this.formatThreatMessage(threats)
            });
          });
        }
      } catch (error) {
        console.error('❌ Safe Browsing batch check error:', error.message);
        // Fail open — keep defaults (isSafe: true) for this batch on API error
      }
    }

    return resultMap;
  }

  /**
   * Check multiple URLs in batch (legacy — individual calls in parallel)
   * @param {Array<string>} urls - Array of URLs to check
   * @returns {Promise<Array>} - Array of check results
   */
  async checkUrls(urls) {
    if (!Array.isArray(urls) || urls.length === 0) {
      return [];
    }
    return Promise.all(urls.map(url => this.checkUrl(url)));
  }

  /**
   * Check if the service is properly configured
   * @returns {boolean}
   */
  isConfigured() {
    return this.enabled;
  }

  /**
   * Get service status
   * @returns {Object}
   */
  getStatus() {
    return {
      enabled: this.enabled,
      configured: !!this.apiKey,
      threatTypes: this.threatTypes
    };
  }
}

// Create singleton instance
const safeBrowsingService = new SafeBrowsingService();

module.exports = safeBrowsingService;
