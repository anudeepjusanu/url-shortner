const mongoose = require('mongoose');
const { Click, DailySummary } = require('../models/Analytics');
const Url = require('../models/Url');
const Domain = require('../models/Domain');
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
    
    // Convert string ID to ObjectId for MongoDB queries
    let urlObjectId;
    try {
      urlObjectId = new mongoose.Types.ObjectId(id);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL ID format'
      });
    }
    
    const url = await Url.findById(urlObjectId);
    
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
      console.log('📊 Returning CACHED analytics data for:', cacheKey);
      console.log('📊 Cached overview:', cachedData.overview);
      return res.json({
        success: true,
        data: cachedData
      });
    }
    
    console.log('📊 No cache found, fetching fresh data for:', cacheKey);
    
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
    
    console.log('📊 Analytics Query:', {
      urlId: urlObjectId,
      urlIdString: id,
      period,
      dateRange,
      groupBy
    });
    
    // First, check if there are any clicks for this URL at all (without date filter)
    const totalClicksEver = await Click.countDocuments({ url: urlObjectId });
    console.log('📊 Total clicks ever for this URL:', totalClicksEver);
    
    // Also try with shortCode in case url field has issues
    const clicksByShortCode = await Click.countDocuments({ shortCode: url.shortCode });
    console.log('📊 Clicks by shortCode:', clicksByShortCode);
    
    const [clicks, topStats, rawTimeSeriesData, clickCounts] = await Promise.all([
      Click.find({
        url: urlObjectId,
        timestamp: dateRange,
        isBot: { $ne: true }
      }).sort({ timestamp: -1 }).limit(1000),
      
      Click.getTopStats(urlObjectId, dateRange),
      
      Click.aggregate([
        {
          $match: {
            url: urlObjectId,
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
      ]),
      
      // Get accurate click counts within the date range
      Click.aggregate([
        {
          $match: {
            url: urlObjectId,
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
    
    console.log('📊 Analytics Results:', {
      clicksFound: clicks.length,
      timeSeriesPoints: rawTimeSeriesData.length,
      rawTimeSeriesData: rawTimeSeriesData.slice(0, 5), // Log first 5 entries
      clickCounts: clickCounts[0] || { totalClicks: 0, uniqueClicks: 0 }
    });

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
    
    // Use accurate counts from aggregation for the selected period
    // Fall back to URL model counts if aggregation returns nothing
    const aggregatedCounts = clickCounts[0] || { totalClicks: 0, uniqueClicks: 0 };
    const daysDiff = Math.ceil((dateRange.$lte - dateRange.$gte) / (1000 * 60 * 60 * 24)) || 1;
    
    // Use aggregated counts if available, otherwise use URL model counts
    const totalClicks = aggregatedCounts.totalClicks > 0 ? aggregatedCounts.totalClicks : (url.clickCount || 0);
    const uniqueClicks = aggregatedCounts.uniqueClicks > 0 ? aggregatedCounts.uniqueClicks : (url.uniqueClickCount || 0);
    
    console.log('📊 Final counts:', {
      aggregatedTotal: aggregatedCounts.totalClicks,
      aggregatedUnique: aggregatedCounts.uniqueClicks,
      urlModelTotal: url.clickCount,
      urlModelUnique: url.uniqueClickCount,
      finalTotal: totalClicks,
      finalUnique: uniqueClicks
    });
    
    const analyticsData = {
      url: {
        _id: url._id,
        shortCode: url.shortCode,
        customCode: url.customCode,
        originalUrl: url.originalUrl,
        title: url.title,
        domain: url.domain,
        createdAt: url.createdAt,
        clickCount: url.clickCount || 0,
        uniqueClickCount: url.uniqueClickCount || 0,
        qrScanCount: url.qrScanCount || 0,
        uniqueQrScanCount: url.uniqueQrScanCount || 0
      },
      overview: {
        totalClicks: totalClicks,
        uniqueClicks: uniqueClicks,
        averageClicksPerDay: Math.round(totalClicks / daysDiff),
        lastClicked: url.lastClickedAt,
        // Include all-time stats as well
        allTimeTotalClicks: url.clickCount || 0,
        allTimeUniqueClicks: url.uniqueClickCount || 0
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
        country: click.location?.countryName || click.location?.country || '',
        countryName: click.location?.countryName || click.location?.country || '',
        region: click.location?.region || '',
        city: click.location?.city || '',
        device: click.device?.type || '',
        deviceType: click.device?.type || '',
        browser: click.device?.browser?.name || '',
        os: click.device?.os?.name || '',
        referer: click.referer || '',
        language: click.language || '',
        clickSource: click.clickSource || 'unknown'
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
    const { period = '30d', startDate: startDateParam, endDate: endDateParam } = req.query;
    const userId = req.user.id;
    const organizationId = req.user.organization;

    // Convert user ID to ObjectId for proper MongoDB queries
    let userObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    let orgObjectId = null;
    if (organizationId) {
      try {
        orgObjectId = new mongoose.Types.ObjectId(organizationId);
      } catch (err) {
        // Ignore invalid org ID, just don't filter by it
      }
    }

    const filter = {
      $or: [
        { creator: userObjectId },
        ...(orgObjectId ? [{ organization: orgObjectId }] : [])
      ]
    };

    // Build date range: prefer explicit startDate/endDate from the frontend
    // (which encode the exact client-selected window) over the coarse period string.
    const now = new Date();
    let dateRange;
    if (startDateParam && endDateParam) {
      dateRange = {
        $gte: new Date(startDateParam),
        $lte: new Date(endDateParam)
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

    console.log('📊 Dashboard Analytics Query:', {
      userId: userObjectId,
      organizationId: orgObjectId,
      period,
      dateRange
    });

    const urls = await Url.find(filter).select('_id clickCount uniqueClickCount qrScanCount uniqueQrScanCount createdAt');
    const urlIds = urls.map(url => url._id);

    // Get custom domains count for the user
    const customDomainsFilter = {
      $or: [
        { owner: userObjectId },
        ...(orgObjectId ? [{ organization: orgObjectId }] : [])
      ]
    };
    const totalCustomDomains = await Domain.countDocuments(customDomainsFilter);

    console.log('📊 Found URLs:', urlIds.length, 'Custom Domains:', totalCustomDomains);

    const [
      totalClicks,
      clicksByDay,
      clicksByHour,
      topCountries,
      topCities,
      topDevices,
      topBrowsers,
      topOS,
      topReferrers,
      periodStats
    ] = await Promise.all([
      // Period-filtered total clicks
      Click.countDocuments({
        url: { $in: urlIds },
        timestamp: dateRange,
        isBot: { $ne: true }
      }),

      // Daily click series (filtered to selected range)
      Click.aggregate([
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
      ]),

      // Peak hours filtered to selected range
      Click.aggregate([
        {
          $match: {
            url: { $in: urlIds },
            timestamp: dateRange,
            isBot: { $ne: true }
          }
        },
        {
          $group: {
            _id: { $hour: '$timestamp' },
            clicks: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Top countries — filtered to selected range
      Click.aggregate([
        {
          $match: {
            url: { $in: urlIds },
            timestamp: dateRange,
            isBot: { $ne: true },
            'location.country': { $exists: true, $ne: null, $nin: ['', null] }
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

      // Top cities — filtered to selected range
      Click.aggregate([
        {
          $match: {
            url: { $in: urlIds },
            timestamp: dateRange,
            isBot: { $ne: true },
            'location.city': { $exists: true, $ne: null, $nin: ['', null] }
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

      // Top devices — filtered to selected range
      Click.aggregate([
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
      ]),

      // Top browsers — filtered to selected range
      Click.aggregate([
        {
          $match: {
            url: { $in: urlIds },
            timestamp: dateRange,
            isBot: { $ne: true },
            'device.browser.name': { $exists: true, $ne: null, $nin: ['', null] }
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

      // Top operating systems — filtered to selected range
      Click.aggregate([
        {
          $match: {
            url: { $in: urlIds },
            timestamp: dateRange,
            isBot: { $ne: true },
            'device.os.name': { $exists: true, $ne: null, $nin: ['', null] }
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

      // Top referrers — filtered to selected range
      Click.aggregate([
        {
          $match: {
            url: { $in: urlIds },
            timestamp: dateRange,
            isBot: { $ne: true },
            referer: { $exists: true, $ne: null, $nin: ['', null] }
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
      ]),

      // Period-specific unique clicks and QR scans (derived from click records)
      Click.aggregate([
        {
          $match: {
            url: { $in: urlIds },
            timestamp: dateRange,
            isBot: { $ne: true }
          }
        },
        {
          $group: {
            _id: null,
            uniqueClicks: { $sum: { $cond: [{ $eq: ['$isUnique', true] }, 1, 0] } },
            qrScans: { $sum: { $cond: [{ $eq: ['$clickSource', 'qr_code'] }, 1, 0] } }
          }
        }
      ])
    ]);

    const totalUrls = urls.length;
    const totalClicksAllTime = urls.reduce((sum, url) => sum + (url.clickCount || 0), 0);
    const totalUniqueClicks = urls.reduce((sum, url) => sum + (url.uniqueClickCount || 0), 0);
    const totalQRScans = urls.reduce((sum, url) => sum + (url.qrScanCount || 0), 0);
    const totalUniqueQRScans = urls.reduce((sum, url) => sum + (url.uniqueQrScanCount || 0), 0);

    const periodClicks = totalClicks;
    const periodUniqueClicks = periodStats[0]?.uniqueClicks || 0;
    const periodQRScans = periodStats[0]?.qrScans || 0;

    console.log('📊 Dashboard Analytics Results:', {
      totalUrls,
      totalClicksAllTime,
      periodClicks,
      periodUniqueClicks,
      periodQRScans,
      clicksByDayCount: clicksByDay.length,
      topCountriesCount: topCountries.length
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalUrls,
          totalClicks: totalClicksAllTime,
          periodClicks,
          periodUniqueClicks,
          periodQRScans,
          totalUniqueClicks,
          totalQRScans,
          totalUniqueQRScans,
          totalCustomDomains,
          averageClicksPerUrl: totalUrls > 0 ? Math.round(totalClicksAllTime / totalUrls) : 0
        },
        chartData: {
          clicksByDay: clicksByDay.map(item => ({
            date: item._id,
            clicks: item.clicks
          })),
          clicksByHour: clicksByHour.map(item => ({
            hour: item._id,
            clicks: item.clicks
          }))
        },
        topStats: {
          countries: topCountries.map(item => ({
            country: item._id?.country || 'Unknown',
            countryName: item._id?.countryName || item._id?.country || 'Unknown',
            clicks: item.clicks
          })),
          cities: topCities.map(item => ({
            city: item._id?.city || 'Unknown',
            region: item._id?.region || '',
            country: item._id?.country || '',
            clicks: item.clicks
          })),
          devices: topDevices.map(item => ({
            type: item._id || 'unknown',
            clicks: item.clicks
          })),
          browsers: topBrowsers.map(item => ({
            browser: item._id || 'Unknown',
            clicks: item.clicks
          })),
          operatingSystems: topOS.map(item => ({
            os: item._id || 'Unknown',
            clicks: item.clicks
          })),
          referrers: topReferrers.map(item => ({
            domain: item._id || 'Direct',
            clicks: item.clicks
          }))
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    console.error('Error stack:', error.stack);
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
    
    // Convert string ID to ObjectId
    let urlObjectId;
    try {
      urlObjectId = new mongoose.Types.ObjectId(id);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL ID format'
      });
    }
    
    const url = await Url.findById(urlObjectId);
    
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
      url: urlObjectId,
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