const { Click, DailySummary, MonthlySummary } = require('../models/Analytics');
const Url = require('../models/Url');
const crypto = require('crypto');
const geoip = require('geoip-lite');
const useragent = require('user-agent-parser');
const { cacheGet, cacheSet } = require('../config/redis');
const config = require('../config/environment');

class AnalyticsService {
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
        timestamp = new Date()
      } = clickData;
      
      const url = await Url.findOne({
        $or: [{ shortCode }, { customCode: shortCode }]
      });
      
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
        screenResolution
      };
      
      const click = await Click.createClick(clickRecord);
      console.log('✅ Click recorded:', {
        clickId: click._id,
        urlId: url._id,
        isUnique,
        isBot
      });
      
      await url.incrementClick(isUnique);
      console.log('✅ URL click count incremented:', {
        clickCount: url.clickCount + 1,
        uniqueClickCount: url.uniqueClickCount + (isUnique ? 1 : 0)
      });
      
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
        return {};
      }
      
      const geo = geoip.lookup(ipAddress);
      
      if (!geo) {
        return {};
      }
      
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
      console.error('Error getting location from IP:', error);
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
      
      const [clicks, topStats, timeSeriesData] = await Promise.all([
        this.getClicksInRange(urlId, dateRange),
        this.getTopStats(urlId, dateRange),
        this.getTimeSeriesData(urlId, dateRange, groupBy)
      ]);
      
      const analyticsData = {
        overview: {
          totalClicks: url.clickCount,
          uniqueClicks: url.uniqueClickCount,
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
      '7d': 7,
      '30d': 30,
      '90d': 90
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
              $match: { 'location.country': { $ne: null, $ne: '' } }
            },
            {
              $group: {
                _id: {
                  country: '$location.country',
                  countryName: '$location.countryName'
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
                _id: '$device.type',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } }
          ],
          browsers: [
            {
              $match: { 'device.browser.name': { $ne: null } }
            },
            {
              $group: {
                _id: '$device.browser.name',
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
      referrers: [],
      devices: [],
      browsers: []
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
      country: click.location.countryName,
      city: click.location.city,
      device: click.device.type,
      browser: click.device.browser.name,
      referer: click.referer
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
      
      const urls = await Url.find(filter).select('_id clickCount uniqueClickCount createdAt');
      const urlIds = urls.map(url => url._id);
      
      const dateRange = this.getDateRange(period);
      
      const [
        totalClicks,
        clicksByDay,
        topCountries,
        topDevices,
        topReferrers
      ] = await Promise.all([
        Click.countDocuments({
          url: { $in: urlIds },
          timestamp: dateRange,
          isBot: { $ne: true }
        }),
        this.getClicksByDay(urlIds, dateRange),
        this.getTopCountriesForUrls(urlIds, dateRange),
        this.getTopDevicesForUrls(urlIds, dateRange),
        this.getTopReferrersForUrls(urlIds, dateRange)
      ]);
      
      const totalUrls = urls.length;
      const totalUniqueClicks = urls.reduce((sum, url) => sum + (url.uniqueClickCount || 0), 0);
      
      return {
        overview: {
          totalUrls,
          totalClicks,
          totalUniqueClicks,
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
          devices: topDevices,
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
          'location.country': { $ne: null }
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
      countryName: item._id.countryName,
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
      city: click.location.city || '',
      deviceType: click.device.type || '',
      browser: click.device.browser.name || '',
      os: click.device.os.name || '',
      referer: click.referer || ''
    };
  }
}

module.exports = new AnalyticsService();