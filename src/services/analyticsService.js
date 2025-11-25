const { Click, DailySummary, MonthlySummary } = require('../models/Analytics');
const Url = require('../models/Url');
const QRCodeModel = require('../models/QRCode');
const crypto = require('crypto');
const geoip = require('geoip-lite');
const useragent = require('user-agent-parser');
const { cacheGet, cacheSet } = require('../config/redis');
const config = require('../config/environment');

class AnalyticsService {
  // Helper method to check if a domain is a main/default domain
  isMainDomain(domain) {
    if (!domain) return true;
    const mainDomains = ['laghhu.link', 'www.laghhu.link', 'localhost:3015', 'localhost'];
    return mainDomains.includes(domain);
  }

  async recordClick(shortCode, clickData) {
    try {
      console.log('📊 Recording click for:', shortCode, {
        ip: clickData.ipAddress,
        trackingEnabled: config.ANALYTICS.TRACK_CLICKS
      });

      const {
        ipAddress,
        userAgent,
        referer,
        language,
        screenResolution,
        domain = null,
        clickSource = 'unknown',
        timestamp = new Date()
      } = clickData;

      // Build query with domain filtering for custom domains
      let query = {
        $or: [{ shortCode }, { customCode: shortCode }]
      };

      // Add domain filtering for custom domains to prevent duplicate counting
      if (domain && !this.isMainDomain(domain)) {
        query.domain = domain;
      }

      const url = await Url.findOne(query);
      
      if (!url) {
        console.error('❌ URL not found for click recording:', shortCode);
        throw new Error('URL not found');
      }
      
      console.log('✅ Found URL for click:', {
        id: url._id,
        shortCode: url.shortCode,
        domain: url.domain
      });
      
      if (!config.ANALYTICS.TRACK_CLICKS) {
        console.warn('⚠️ Click tracking is disabled');
        return null;
      }
      
      const ipHash = this.hashIP(ipAddress);
      const location = this.getLocationFromIP(ipAddress);
      const device = this.parseUserAgent(userAgent);
      const isBot = this.detectBot(userAgent);
      const isUnique = await this.isUniqueClick(url._id, ipHash);
      
      const clickRecord = {
        url: url._id,
        shortCode,
        ipAddress: ipAddress,
        ipHash,
        userAgent,
        referer,
        timestamp,
        location: config.ANALYTICS.TRACK_GEOLOCATION ? location : {},
        device: config.ANALYTICS.TRACK_USER_AGENT ? device : {},
        campaign: this.extractUTMParameters(referer),
        isUnique,
        isBot,
        language,
        screenResolution,
        clickSource: clickSource
      };
      
      const click = await Click.createClick(clickRecord);
      console.log('✅ Click recorded:', {
        clickId: click._id,
        urlId: url._id,
        isUnique,
        isBot,
        clickSource
      });

      // Handle QR code scans separately
      if (clickSource === 'qr_code') {
        await url.updateOne({
          $inc: {
            clickCount: 1,
            qrScanCount: 1,
            ...(isUnique && { uniqueClickCount: 1, uniqueQrScanCount: 1 })
          },
          lastClickedAt: new Date(),
          lastQrScanAt: new Date()
        });

        console.log('✅ QR scan tracked:', {
          clickCount: url.clickCount + 1,
          qrScanCount: (url.qrScanCount || 0) + 1,
          uniqueQrScanCount: (url.uniqueQrScanCount || 0) + (isUnique ? 1 : 0)
        });

        // Update QRCode model scan count
        try {
          const qrCode = await QRCodeModel.findOne({ url: url._id });
          if (qrCode) {
            await qrCode.incrementScan(isUnique);
            console.log('✅ QRCode model scan count updated');
          }
        } catch (qrError) {
          console.error('❌ Error updating QRCode model scan count:', qrError);
        }
      } else {
        await url.incrementClick(isUnique);
        console.log('✅ URL click count incremented:', {
          clickCount: url.clickCount + 1,
          uniqueClickCount: url.uniqueClickCount + (isUnique ? 1 : 0)
        });
      }
      
      this.updateAnalyticsSummaries(url._id, shortCode, clickRecord);
      
      return click;
    } catch (error) {
      console.error('Error recording click:', error);
      throw error;
    }
  }
  
  hashIP(ipAddress) {
    return crypto.createHash('sha256').update(ipAddress + config.JWT_SECRET).digest('hex');
  }
  
  getLocationFromIP(ipAddress) {
    try {
      if (!config.ANALYTICS.TRACK_GEOLOCATION) {
        console.warn('⚠️ Geolocation tracking is disabled');
        return {};
      }
      
      // Skip localhost/private IPs
      if (!ipAddress || ipAddress === '127.0.0.1' || ipAddress === '::1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.')) {
        console.warn('⚠️ Cannot geolocate private/localhost IP:', ipAddress);
        return {};
      }
      
      const geo = geoip.lookup(ipAddress);
      
      if (!geo) {
        console.warn('⚠️ No geolocation data found for IP:', ipAddress);
        return {};
      }
      
      console.log('✅ Geolocation found:', {
        ip: ipAddress,
        country: geo.country,
        region: geo.region,
        city: geo.city
      });
      
      return {
        country: geo.country,
        countryName: geo.country,
        region: geo.region,
        city: geo.city,
        timezone: geo.timezone,
        coordinates: {
          latitude: geo.ll[0],
          longitude: geo.ll[1]
        }
      };
    } catch (error) {
      console.error('❌ Error getting location from IP:', ipAddress, error);
      return {};
    }
  }
  
  parseUserAgent(userAgent) {
    try {
      if (!config.ANALYTICS.TRACK_USER_AGENT) {
        return {};
      }
      
      const parsed = useragent(userAgent);
      
      const deviceType = this.determineDeviceType(userAgent);
      
      return {
        type: deviceType,
        os: {
          name: parsed.os?.name,
          version: parsed.os?.version
        },
        browser: {
          name: parsed.browser?.name,
          version: parsed.browser?.version
        },
        model: parsed.device?.model,
        vendor: parsed.device?.vendor
      };
    } catch (error) {
      console.error('Error parsing user agent:', error);
      return { type: 'unknown' };
    }
  }
  
  determineDeviceType(userAgent) {
    const ua = userAgent.toLowerCase();
    
    if (/bot|crawler|spider|scraper/i.test(ua)) {
      return 'bot';
    }
    
    if (/mobile|android|iphone|ipod|blackberry|nokia|opera mini/i.test(ua)) {
      return 'mobile';
    }
    
    if (/tablet|ipad|android(?!.*mobile)/i.test(ua)) {
      return 'tablet';
    }
    
    return 'desktop';
  }
  
  detectBot(userAgent) {
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /googlebot/i, /bingbot/i, /facebookexternalhit/i,
      /twitterbot/i, /linkedinbot/i, /whatsapp/i,
      /curl/i, /wget/i, /python/i, /ruby/i, /php/i
    ];
    
    return botPatterns.some(pattern => pattern.test(userAgent));
  }
  
  async isUniqueClick(urlId, ipHash) {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const existingClick = await Click.findOne({
        url: urlId,
        ipHash,
        timestamp: { $gte: twentyFourHoursAgo }
      });
      
      return !existingClick;
    } catch (error) {
      console.error('Error checking unique click:', error);
      return false;
    }
  }
  
  extractUTMParameters(referer) {
    try {
      if (!referer || !config.ANALYTICS.TRACK_REFERRER) {
        return {};
      }
      
      const url = new URL(referer);
      const params = url.searchParams;
      
      return {
        source: params.get('utm_source'),
        medium: params.get('utm_medium'),
        campaign: params.get('utm_campaign'),
        term: params.get('utm_term'),
        content: params.get('utm_content')
      };
    } catch (error) {
      return {};
    }
  }
  
  async updateAnalyticsSummaries(urlId, shortCode, clickData) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      await DailySummary.findOneAndUpdate(
        { url: urlId, date: today },
        {
          $inc: {
            totalClicks: 1,
            uniqueClicks: clickData.isUnique ? 1 : 0
          },
          $setOnInsert: { shortCode }
        },
        { upsert: true, new: true }
      );
      
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      
      await MonthlySummary.findOneAndUpdate(
        { url: urlId, year, month },
        {
          $inc: {
            totalClicks: 1,
            uniqueClicks: clickData.isUnique ? 1 : 0
          },
          $setOnInsert: { shortCode }
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error updating analytics summaries:', error);
    }
  }
  
  async getUrlAnalytics(urlId, options = {}) {
    try {
      const {
        period = '30d',
        startDate,
        endDate,
        groupBy = 'day'
      } = options;
      
      const cacheKey = `analytics:${urlId}:${period}:${groupBy}`;
      const cachedData = await cacheGet(cacheKey);
      
      if (cachedData) {
        return cachedData;
      }
      
      const url = await Url.findById(urlId);
      if (!url) {
        throw new Error('URL not found');
      }
      
      const dateRange = this.getDateRange(period, startDate, endDate);

      const [clicks, topStats, timeSeriesData, clickCounts] = await Promise.all([
        this.getClicksInRange(urlId, dateRange),
        this.getTopStats(urlId, dateRange),
        this.getTimeSeriesData(urlId, dateRange, groupBy),
        // Get total and unique clicks within date range (Bug #17 fix)
        Click.aggregate([
          {
            $match: {
              url: urlId,
              timestamp: dateRange,
              isBot: { $ne: true }
            }
          },
          {
            $group: {
              _id: null,
              totalClicks: { $sum: 1 },
              uniqueClicks: {
                $sum: { $cond: [{ $eq: ['$isUnique', true] }, 1, 0] }
              }
            }
          }
        ])
      ]);

      const counts = clickCounts[0] || { totalClicks: 0, uniqueClicks: 0 };

      const analyticsData = {
        overview: {
          totalClicks: counts.totalClicks,
          uniqueClicks: counts.uniqueClicks,
          averageClicksPerDay: this.calculateAverageClicksPerDay(clicks, dateRange),
          lastClicked: url.lastClickedAt
        },
        timeSeries: timeSeriesData,
        topStats,
        recentClicks: clicks.slice(0, 20).map(this.formatClickForResponse)
      };
      
      await cacheSet(cacheKey, analyticsData, config.CACHE_TTL.ANALYTICS_CACHE);
      
      return analyticsData;
    } catch (error) {
      console.error('Error getting URL analytics:', error);
      throw error;
    }
  }
  
  getDateRange(period, startDate, endDate) {
    if (startDate && endDate) {
      return {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const now = new Date();
    const days = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[period] || 30;

    const start = new Date(now);
    start.setDate(start.getDate() - days);

    return { $gte: start };
  }
  
  async getClicksInRange(urlId, dateRange) {
    return await Click.find({
      url: urlId,
      timestamp: dateRange,
      isBot: { $ne: true }
    }).sort({ timestamp: -1 }).limit(1000);
  }
  
  async getTopStats(urlId, dateRange) {
    const pipeline = [
      {
        $match: {
          url: urlId,
          timestamp: dateRange,
          isBot: { $ne: true }
        }
      },
      {
        $facet: {
          countries: [
            {
              $match: { 
                $or: [
                  { 'location.country': { $exists: true, $ne: null, $ne: '' } },
                  { 'location.countryName': { $exists: true, $ne: null, $ne: '' } }
                ]
              }
            },
            {
              $group: {
                _id: {
                  country: { $ifNull: ['$location.country', 'Unknown'] },
                  countryName: { $ifNull: ['$location.countryName', '$location.country'] }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          cities: [
            {
              $match: { 
                'location.city': { $ne: null, $ne: '' },
                'location.country': { $ne: null, $ne: '' }
              }
            },
            {
              $group: {
                _id: {
                  city: '$location.city',
                  region: '$location.region',
                  country: '$location.countryName'
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          referrers: [
            {
              $match: { referer: { $ne: null, $ne: '' } }
            },
            {
              $addFields: {
                domain: {
                  $regexFind: {
                    input: '$referer',
                    regex: /https?:\/\/([^\/]+)/
                  }
                }
              }
            },
            {
              $match: { 'domain.match': { $ne: null } }
            },
            {
              $group: {
                _id: { $arrayElemAt: ['$domain.captures', 0] },
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          devices: [
            {
              $group: {
                _id: { $ifNull: ['$device.type', 'unknown'] },
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } }
          ],
          browsers: [
            {
              $match: { 
                'device.browser.name': { $exists: true, $ne: null, $ne: '' }
              }
            },
            {
              $group: {
                _id: '$device.browser.name',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          operatingSystems: [
            {
              $match: { 'device.os.name': { $ne: null, $ne: '' } }
            },
            {
              $group: {
                _id: '$device.os.name',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ]
        }
      }
    ];
    
    const results = await Click.aggregate(pipeline);
    return results[0] || {
      countries: [],
      cities: [],
      referrers: [],
      devices: [],
      browsers: [],
      operatingSystems: []
    };
  }
  
  async getTimeSeriesData(urlId, dateRange, groupBy) {
    const format = groupBy === 'hour' ? '%Y-%m-%d-%H' : '%Y-%m-%d';
    
    return await Click.aggregate([
      {
        $match: {
          url: urlId,
          timestamp: dateRange,
          isBot: { $ne: true }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format, date: '$timestamp' }
          },
          clicks: { $sum: 1 },
          uniqueClicks: {
            $addToSet: '$ipHash'
          }
        }
      },
      {
        $project: {
          date: '$_id',
          clicks: 1,
          uniqueClicks: { $size: '$uniqueClicks' }
        }
      },
      { $sort: { date: 1 } }
    ]);
  }
  
  calculateAverageClicksPerDay(clicks, dateRange) {
    if (clicks.length === 0) return 0;
    
    const startDate = dateRange.$gte || new Date(clicks[clicks.length - 1].timestamp);
    const endDate = dateRange.$lte || new Date();
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    return Math.round(clicks.length / Math.max(daysDiff, 1));
  }
  
  formatClickForResponse(click) {
    return {
      timestamp: click.timestamp,
      country: click.location.countryName || '',
      region: click.location.region || '',
      city: click.location.city || '',
      device: click.device.type || '',
      browser: click.device.browser.name || '',
      os: click.device.os.name || '',
      referer: click.referer || '',
      language: click.language || ''
    };
  }
  
  async getDashboardAnalytics(userId, organizationId, options = {}) {
    try {
      const { period = '30d' } = options;
      
      const filter = { creator: userId };
      if (organizationId) {
        filter.$or = [
          { creator: userId },
          { organization: organizationId }
        ];
      }
      
      const urls = await Url.find(filter).select('_id clickCount uniqueClickCount qrScanCount uniqueQrScanCount createdAt');
      const urlIds = urls.map(url => url._id);

      const dateRange = this.getDateRange(period);

      const [
        totalClicks,
        uniqueClicksData,
        clicksByDay,
        topCountries,
        topCities,
        topDevices,
        topBrowsers,
        topOS,
        topReferrers
      ] = await Promise.all([
        Click.countDocuments({
          url: { $in: urlIds },
          timestamp: dateRange,
          isBot: { $ne: true }
        }),
        // Count unique clicks within the date range (Bug #17 fix)
        Click.aggregate([
          {
            $match: {
              url: { $in: urlIds },
              timestamp: dateRange,
              isBot: { $ne: true },
              isUnique: true
            }
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 }
            }
          }
        ]),
        this.getClicksByDay(urlIds, dateRange),
        this.getTopCountriesForUrls(urlIds, dateRange),
        this.getTopCitiesForUrls(urlIds, dateRange),
        this.getTopDevicesForUrls(urlIds, dateRange),
        this.getTopBrowsersForUrls(urlIds, dateRange),
        this.getTopOSForUrls(urlIds, dateRange),
        this.getTopReferrersForUrls(urlIds, dateRange)
      ]);

      const totalUrls = urls.length;
      const totalUniqueClicks = uniqueClicksData[0]?.count || 0;
      const totalQRScans = urls.reduce((sum, url) => sum + (url.qrScanCount || 0), 0);
      const totalUniqueQRScans = urls.reduce((sum, url) => sum + (url.uniqueQrScanCount || 0), 0);

      return {
        overview: {
          totalUrls,
          totalClicks,
          totalUniqueClicks,
          totalQRScans,           // NEW: Total QR scans
          totalUniqueQRScans,     // NEW: Unique QR scans
          averageClicksPerUrl: totalUrls > 0 ? Math.round(totalClicks / totalUrls) : 0
        },
        chartData: {
          clicksByDay: clicksByDay.map(item => ({
            date: item._id,
            clicks: item.clicks
          }))
        },
        topStats: {
          countries: topCountries,
          cities: topCities,
          devices: topDevices,
          browsers: topBrowsers,
          operatingSystems: topOS,
          referrers: topReferrers
        }
      };
    } catch (error) {
      console.error('Error getting dashboard analytics:', error);
      throw error;
    }
  }
  
  async getClicksByDay(urlIds, dateRange) {
    return await Click.aggregate([
      {
        $match: {
          url: { $in: urlIds },
          timestamp: dateRange,
          isBot: { $ne: true }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          clicks: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  }
  
  async getTopCountriesForUrls(urlIds, dateRange) {
    const results = await Click.aggregate([
      {
        $match: {
          url: { $in: urlIds },
          timestamp: dateRange,
          isBot: { $ne: true },
          'location.country': { $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: {
            country: '$location.country',
            countryName: '$location.countryName'
          },
          clicks: { $sum: 1 }
        }
      },
      { $sort: { clicks: -1 } },
      { $limit: 10 }
    ]);
    
    return results.map(item => ({
      country: item._id.country,
      countryName: item._id.countryName || item._id.country,
      clicks: item.clicks
    }));
  }
  
  async getTopCitiesForUrls(urlIds, dateRange) {
    const results = await Click.aggregate([
      {
        $match: {
          url: { $in: urlIds },
          timestamp: dateRange,
          isBot: { $ne: true },
          'location.city': { $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: {
            city: '$location.city',
            region: '$location.region',
            country: '$location.countryName'
          },
          clicks: { $sum: 1 }
        }
      },
      { $sort: { clicks: -1 } },
      { $limit: 10 }
    ]);
    
    return results.map(item => ({
      city: item._id.city,
      region: item._id.region,
      country: item._id.country,
      clicks: item.clicks
    }));
  }
  
  async getTopBrowsersForUrls(urlIds, dateRange) {
    const results = await Click.aggregate([
      {
        $match: {
          url: { $in: urlIds },
          timestamp: dateRange,
          isBot: { $ne: true },
          'device.browser.name': { $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$device.browser.name',
          clicks: { $sum: 1 }
        }
      },
      { $sort: { clicks: -1 } },
      { $limit: 10 }
    ]);
    
    return results.map(item => ({
      browser: item._id,
      clicks: item.clicks
    }));
  }
  
  async getTopOSForUrls(urlIds, dateRange) {
    const results = await Click.aggregate([
      {
        $match: {
          url: { $in: urlIds },
          timestamp: dateRange,
          isBot: { $ne: true },
          'device.os.name': { $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$device.os.name',
          clicks: { $sum: 1 }
        }
      },
      { $sort: { clicks: -1 } },
      { $limit: 10 }
    ]);
    
    return results.map(item => ({
      os: item._id,
      clicks: item.clicks
    }));
  }
  
  async getTopDevicesForUrls(urlIds, dateRange) {
    const results = await Click.aggregate([
      {
        $match: {
          url: { $in: urlIds },
          timestamp: dateRange,
          isBot: { $ne: true }
        }
      },
      {
        $group: {
          _id: '$device.type',
          clicks: { $sum: 1 }
        }
      },
      { $sort: { clicks: -1 } }
    ]);
    
    return results.map(item => ({
      type: item._id,
      clicks: item.clicks
    }));
  }
  
  async getTopReferrersForUrls(urlIds, dateRange) {
    const results = await Click.aggregate([
      {
        $match: {
          url: { $in: urlIds },
          timestamp: dateRange,
          isBot: { $ne: true },
          referer: { $ne: null, $ne: '' }
        }
      },
      {
        $addFields: {
          domain: {
            $regexFind: {
              input: '$referer',
              regex: /https?:\/\/([^\/]+)/
            }
          }
        }
      },
      {
        $match: { 'domain.match': { $ne: null } }
      },
      {
        $group: {
          _id: { $arrayElemAt: ['$domain.captures', 0] },
          clicks: { $sum: 1 }
        }
      },
      { $sort: { clicks: -1 } },
      { $limit: 10 }
    ]);
    
    return results.map(item => ({
      domain: item._id,
      clicks: item.clicks
    }));
  }
  
  async exportAnalytics(urlId, options = {}) {
    try {
      const { period = '30d', format = 'json' } = options;
      
      const url = await Url.findById(urlId);
      if (!url) {
        throw new Error('URL not found');
      }
      
      const dateRange = this.getDateRange(period);
      const clicks = await this.getClicksInRange(urlId, dateRange);
      
      const exportData = {
        url: {
          shortCode: url.shortCode,
          originalUrl: url.originalUrl,
          title: url.title,
          createdAt: url.createdAt
        },
        period,
        totalClicks: clicks.length,
        clicks: clicks.map(this.formatClickForExport)
      };
      
      return exportData;
    } catch (error) {
      console.error('Error exporting analytics:', error);
      throw error;
    }
  }
  
  formatClickForExport(click) {
    return {
      timestamp: click.timestamp,
      country: click.location.countryName || '',
      region: click.location.region || '',
      city: click.location.city || '',
      deviceType: click.device.type || '',
      browser: click.device.browser.name || '',
      os: click.device.os.name || '',
      referer: click.referer || '',
      language: click.language || ''
    };
  }
}

module.exports = new AnalyticsService();