const { Click, DailySummary } = require('../models/Analytics');
const Url = require('../models/Url');
const { cacheGet, cacheSet } = require('../config/redis');
const config = require('../config/environment');

const getUrlAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      period = '30d',
      startDate,
      endDate,
      groupBy = 'day'
    } = req.query;
    
    const url = await Url.findById(id);
    
    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }
    
    if (url.creator.toString() !== req.user.id && 
        (!req.user.organization || url.organization?.toString() !== req.user.organization.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const cacheKey = `analytics:${id}:${period}:${groupBy}`;
    const cachedData = await cacheGet(cacheKey);
    
    if (cachedData) {
      return res.json({
        success: true,
        data: cachedData
      });
    }
    
    let dateRange = {};
    const now = new Date();

    if (startDate && endDate) {
      dateRange = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      const days = {
        '24h': 1,
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365
      }[period] || 30;
      const start = new Date(now);
      start.setDate(start.getDate() - days);
      dateRange = { $gte: start, $lte: now };
    }
    
    const [clicks, topStats, rawTimeSeriesData] = await Promise.all([
      Click.find({
        url: id,
        timestamp: dateRange,
        isBot: { $ne: true }
      }).sort({ timestamp: -1 }).limit(1000),
      
      Click.getTopStats(id, 30),
      
      Click.aggregate([
        {
          $match: {
            url: url._id,
            timestamp: dateRange,
            isBot: { $ne: true }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: groupBy === 'hour' ? '%Y-%m-%d-%H' : '%Y-%m-%d',
                date: '$timestamp'
              }
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
      ])
    ]);

    // Fill in missing dates with zero values
    const dataMap = new Map();
    rawTimeSeriesData.forEach(item => {
      dataMap.set(item.date, {
        date: item.date,
        clicks: item.clicks,
        uniqueClicks: item.uniqueClicks
      });
    });

    const timeSeriesData = [];
    const rangeStart = dateRange.$gte;
    const rangeEnd = dateRange.$lte || now;

    if (groupBy === 'hour') {
      const current = new Date(rangeStart);
      while (current <= rangeEnd) {
        const dateStr = current.toISOString().slice(0, 13).replace('T', '-');
        const existing = dataMap.get(dateStr);
        timeSeriesData.push({
          date: dateStr,
          clicks: existing ? existing.clicks : 0,
          uniqueClicks: existing ? existing.uniqueClicks : 0
        });
        current.setHours(current.getHours() + 1);
      }
    } else {
      const current = new Date(rangeStart);
      current.setHours(0, 0, 0, 0);
      const end = new Date(rangeEnd);
      end.setHours(23, 59, 59, 999);
      
      while (current <= end) {
        const dateStr = current.toISOString().slice(0, 10);
        const existing = dataMap.get(dateStr);
        timeSeriesData.push({
          date: dateStr,
          clicks: existing ? existing.clicks : 0,
          uniqueClicks: existing ? existing.uniqueClicks : 0
        });
        current.setDate(current.getDate() + 1);
      }
    }
    
    const analyticsData = {
      url: {
        _id: url._id,
        shortCode: url.shortCode,
        customCode: url.customCode,
        originalUrl: url.originalUrl,
        title: url.title,
        domain: url.domain,
        createdAt: url.createdAt
      },
      overview: {
        totalClicks: url.clickCount,
        uniqueClicks: url.uniqueClickCount,
        averageClicksPerDay: Math.round(clicks.length / 30),
        lastClicked: url.lastClickedAt
      },
      timeSeries: timeSeriesData,
      topStats: topStats[0] || {
        countries: [],
        cities: [],
        referrers: [],
        devices: [],
        browsers: [],
        operatingSystems: []
      },
      recentClicks: clicks.slice(0, 20).map(click => ({
        timestamp: click.timestamp,
        country: click.location.countryName || '',
        region: click.location.region || '',
        city: click.location.city || '',
        device: click.device.type || '',
        browser: click.device.browser.name || '',
        os: click.device.os.name || '',
        referer: click.referer || ''
      }))
    };
    
    await cacheSet(cacheKey, analyticsData, config.CACHE_TTL.ANALYTICS_CACHE);
    
    res.json({
      success: true,
      data: analyticsData
    });
  } catch (error) {
    console.error('Get URL analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
};

const getDashboardAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const userId = req.user.id;
    const organizationId = req.user.organization;
    
    const filter = {
      $or: [
        { creator: userId },
        ...(organizationId ? [{ organization: organizationId }] : [])
      ]
    };

    const days = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[period] || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const urls = await Url.find(filter).select('_id clickCount uniqueClickCount createdAt');
    const urlIds = urls.map(url => url._id);
    
    const [
      totalClicks,
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
        timestamp: { $gte: startDate },
        isBot: { $ne: true }
      }),
      
      Click.aggregate([
        {
          $match: {
            url: { $in: urlIds },
            timestamp: { $gte: startDate },
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
      ]),
      
      Click.aggregate([
        {
          $match: {
            url: { $in: urlIds },
            timestamp: { $gte: startDate },
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
      ]),
      
      Click.aggregate([
        {
          $match: {
            url: { $in: urlIds },
            timestamp: { $gte: startDate },
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
      ]),
      
      Click.aggregate([
        {
          $match: {
            url: { $in: urlIds },
            timestamp: { $gte: startDate },
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
      ]),
      
      Click.aggregate([
        {
          $match: {
            url: { $in: urlIds },
            timestamp: { $gte: startDate },
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
      ]),
      
      Click.aggregate([
        {
          $match: {
            url: { $in: urlIds },
            timestamp: { $gte: startDate },
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
      ]),
      
      Click.aggregate([
        {
          $match: {
            url: { $in: urlIds },
            timestamp: { $gte: startDate },
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
      ])
    ]);
    
    const totalUrls = urls.length;
    const totalUniqueClicks = urls.reduce((sum, url) => sum + (url.uniqueClickCount || 0), 0);
    
    res.json({
      success: true,
      data: {
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
          countries: topCountries.map(item => ({
            country: item._id.country,
            countryName: item._id.countryName || item._id.country,
            clicks: item.clicks
          })),
          cities: topCities.map(item => ({
            city: item._id.city,
            region: item._id.region,
            country: item._id.country,
            clicks: item.clicks
          })),
          devices: topDevices.map(item => ({
            type: item._id,
            clicks: item.clicks
          })),
          browsers: topBrowsers.map(item => ({
            browser: item._id,
            clicks: item.clicks
          })),
          operatingSystems: topOS.map(item => ({
            os: item._id,
            clicks: item.clicks
          })),
          referrers: topReferrers.map(item => ({
            domain: item._id,
            clicks: item.clicks
          }))
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics'
    });
  }
};

const exportAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'json', period = '30d' } = req.query;
    
    const url = await Url.findById(id);
    
    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'URL not found'
      });
    }
    
    if (url.creator.toString() !== req.user.id && 
        (!req.user.organization || url.organization?.toString() !== req.user.organization.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const days = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[period] || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const clicks = await Click.find({
      url: id,
      timestamp: { $gte: startDate },
      isBot: { $ne: true }
    }).sort({ timestamp: -1 });
    
    const exportData = {
      url: {
        shortCode: url.shortCode,
        originalUrl: url.originalUrl,
        title: url.title,
        createdAt: url.createdAt
      },
      period: period,
      totalClicks: clicks.length,
      clicks: clicks.map(click => ({
        timestamp: click.timestamp,
        country: click.location.countryName || '',
        region: click.location.region || '',
        city: click.location.city || '',
        deviceType: click.device.type || '',
        browser: click.device.browser.name || '',
        os: click.device.os.name || '',
        referer: click.referer || '',
        language: click.language || ''
      }))
    };
    
    if (format === 'csv') {
      const csvHeader = 'Timestamp,Country,Region,City,Device,Browser,OS,Language,Referer\n';
      const csvData = exportData.clicks.map(click => 
        `${click.timestamp},${click.country},${click.region},${click.city},${click.deviceType},${click.browser},${click.os},${click.language},"${click.referer}"`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${url.shortCode}-${period}.csv"`);
      res.send(csvHeader + csvData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${url.shortCode}-${period}.json"`);
      res.json(exportData);
    }
  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export analytics'
    });
  }
};

module.exports = {
  getUrlAnalytics,
  getDashboardAnalytics,
  exportAnalytics
};