const mongoose = require("mongoose");
const { Click, DailySummary } = require("../models/Analytics");
const Url = require("../models/Url");
const Domain = require("../models/Domain");
const { cacheGet, cacheSet } = require("../config/redis");
const config = require("../config/environment");
const logger = require("../config/logger");

// Shared helper — fetches, caches, and returns the full analytics data object.
// All sub-route controllers call this so they share the same cache entry.
const resolveAnalyticsData = async (id, query, user) => {
  const { period = "30d", startDate, endDate, groupBy = "day" } = query;

  let urlObjectId;
  try {
    urlObjectId = new mongoose.Types.ObjectId(id);
  } catch (err) {
    const e = new Error("Invalid URL ID format");
    e.status = 400;
    throw e;
  }

  const url = await Url.findById(urlObjectId);
  if (!url) {
    const e = new Error("URL not found");
    e.status = 404;
    throw e;
  }

  if (
    url.creator.toString() !== user.id &&
    (!user.organization ||
      url.organization?.toString() !== user.organization.toString())
  ) {
    const e = new Error("Access denied");
    e.status = 403;
    throw e;
  }

  const cacheKey = `analytics:${id}:${period}:${groupBy}`;
  const cachedData = await cacheGet(cacheKey);
  if (cachedData) {
    logger.info("📊 Returning CACHED analytics data for:", cacheKey);
    return cachedData;
  }

  logger.info("📊 No cache found, fetching fresh data for:", cacheKey);

  let dateRange = {};
  const now = new Date();

  if (startDate && endDate) {
    dateRange = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  } else {
    const days =
      {
        "24h": 1,
        "7d": 7,
        "30d": 30,
        "90d": 90,
        "1y": 365,
      }[period] || 30;
    const start = new Date(now);
    start.setDate(start.getDate() - days);
    dateRange = { $gte: start, $lte: now };
  }

  logger.info("📊 Analytics Query:", {
    urlId: urlObjectId,
    urlIdString: id,
    period,
    dateRange,
    groupBy,
  });

  const totalClicksEver = await Click.countDocuments({ url: urlObjectId });
  logger.info("📊 Total clicks ever for this URL:", totalClicksEver);

  const clicksByShortCode = await Click.countDocuments({
    shortCode: url.shortCode,
  });
  logger.info("📊 Clicks by shortCode:", clicksByShortCode);

  const [clicks, topStats, rawTimeSeriesData, clickCounts, rawPeakHours] =
    await Promise.all([
      Click.find({
        url: urlObjectId,
        timestamp: dateRange,
        isBot: { $ne: true },
      })
        .sort({ timestamp: -1 })
        .limit(1000),

      Click.getTopStats(urlObjectId, dateRange),

      Click.aggregate([
        {
          $match: {
            url: urlObjectId,
            timestamp: dateRange,
            isBot: { $ne: true },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: groupBy === "hour" ? "%Y-%m-%d-%H" : "%Y-%m-%d",
                date: "$timestamp",
              },
            },
            clicks: { $sum: 1 },
            uniqueClicks: { $addToSet: "$ipHash" },
          },
        },
        {
          $project: {
            date: "$_id",
            clicks: 1,
            uniqueClicks: { $size: "$uniqueClicks" },
          },
        },
        { $sort: { date: 1 } },
      ]),

      Click.aggregate([
        {
          $match: {
            url: urlObjectId,
            timestamp: dateRange,
            isBot: { $ne: true },
          },
        },
        {
          $group: {
            _id: null,
            totalClicks: { $sum: 1 },
            uniqueClicks: {
              $sum: { $cond: [{ $eq: ["$isUnique", true] }, 1, 0] },
            },
          },
        },
      ]),

      Click.aggregate([
        {
          $match: {
            url: urlObjectId,
            timestamp: dateRange,
            isBot: { $ne: true },
          },
        },
        {
          $group: {
            _id: { $hour: "$timestamp" },
            clicks: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

  logger.info("📊 Analytics Results:", {
    clicksFound: clicks.length,
    timeSeriesPoints: rawTimeSeriesData.length,
    rawTimeSeriesData: rawTimeSeriesData.slice(0, 5),
    clickCounts: clickCounts[0] || { totalClicks: 0, uniqueClicks: 0 },
  });

  const dataMap = new Map();
  rawTimeSeriesData.forEach((item) => {
    dataMap.set(item.date, {
      date: item.date,
      clicks: item.clicks,
      uniqueClicks: item.uniqueClicks,
    });
  });

  const timeSeriesData = [];
  const rangeStart = dateRange.$gte;
  const rangeEnd = dateRange.$lte || now;

  if (groupBy === "hour") {
    const current = new Date(rangeStart);
    while (current <= rangeEnd) {
      const dateStr = current.toISOString().slice(0, 13).replace("T", "-");
      const existing = dataMap.get(dateStr);
      timeSeriesData.push({
        date: dateStr,
        clicks: existing ? existing.clicks : 0,
        uniqueClicks: existing ? existing.uniqueClicks : 0,
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
        uniqueClicks: existing ? existing.uniqueClicks : 0,
      });
      current.setDate(current.getDate() + 1);
    }
  }

  const aggregatedCounts = clickCounts[0] || {
    totalClicks: 0,
    uniqueClicks: 0,
  };
  const daysDiff =
    Math.ceil((dateRange.$lte - dateRange.$gte) / (1000 * 60 * 60 * 24)) || 1;
  const totalClicks = aggregatedCounts.totalClicks;
  const uniqueClicks = aggregatedCounts.uniqueClicks;

  logger.info("📊 Final counts:", {
    aggregatedTotal: aggregatedCounts.totalClicks,
    aggregatedUnique: aggregatedCounts.uniqueClicks,
    urlModelTotal: url.clickCount,
    urlModelUnique: url.uniqueClickCount,
    finalTotal: totalClicks,
    finalUnique: uniqueClicks,
  });

  const raw = topStats[0] || {};
  const hourMap = new Map((rawPeakHours || []).map((h) => [h._id, h.clicks]));

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
      uniqueQrScanCount: url.uniqueQrScanCount || 0,
    },
    overview: {
      totalClicks,
      uniqueClicks,
      averageClicksPerDay: Math.round(totalClicks / daysDiff),
      lastClicked: url.lastClickedAt,
      allTimeTotalClicks: url.clickCount || 0,
      allTimeUniqueClicks: url.uniqueClickCount || 0,
    },
    timeSeries: timeSeriesData,
    peakHours: Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      clicks: hourMap.get(h) || 0,
    })),
    topStats: {
      countries: (raw.countries || []).map((item) => ({
        country: item._id?.country || "Unknown",
        countryName: item._id?.countryName || item._id?.country || "Unknown",
        clicks: item.count || 0,
      })),
      cities: (raw.cities || []).map((item) => ({
        city: item._id?.city || "Unknown",
        region: item._id?.region || "",
        country: item._id?.country || "",
        clicks: item.count || 0,
      })),
      devices: (raw.devices || []).map((item) => ({
        type: item._id || "unknown",
        clicks: item.count || 0,
      })),
      browsers: (raw.browsers || []).map((item) => ({
        browser: item._id || "Unknown",
        clicks: item.count || 0,
      })),
      operatingSystems: (raw.operatingSystems || []).map((item) => ({
        os: item._id || "Unknown",
        clicks: item.count || 0,
      })),
      referrers: (raw.referrers || []).map((item) => ({
        domain: item._id || "Direct",
        clicks: item.count || 0,
      })),
    },
    recentClicks: clicks.slice(0, 20).map((click) => ({
      timestamp: click.timestamp,
      country: click.location?.countryName || click.location?.country || "",
      countryName: click.location?.countryName || click.location?.country || "",
      region: click.location?.region || "",
      city: click.location?.city || "",
      device: click.device?.type || "",
      deviceType: click.device?.type || "",
      browser: click.device?.browser?.name || "",
      os: click.device?.os?.name || "",
      referer: click.referer || "",
      language: click.language || "",
      clickSource: click.clickSource || "unknown",
    })),
  };

  await cacheSet(cacheKey, analyticsData, config.CACHE_TTL.ANALYTICS_CACHE);
  return analyticsData;
};

const getUrlAnalytics = async (req, res) => {
  try {
    const data = await resolveAnalyticsData(req.params.id, req.query, req.user);
    res.json({ success: true, data });
  } catch (error) {
    logger.error("Get URL analytics error:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch analytics",
    });
  }
};

const getUrlOverview = async (req, res) => {
  try {
    const data = await resolveAnalyticsData(req.params.id, req.query, req.user);
    res.json({
      success: true,
      data: {
        url: data.url,
        overview: data.overview,
        timeSeries: data.timeSeries,
      },
    });
  } catch (error) {
    logger.error("Get URL overview error:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch analytics overview",
    });
  }
};

const getDeviceAnalytics = async (req, res) => {
  try {
    const data = await resolveAnalyticsData(req.params.id, req.query, req.user);
    res.json({
      success: true,
      data: {
        devices: data.topStats.devices,
        browsers: data.topStats.browsers,
        operatingSystems: data.topStats.operatingSystems,
      },
    });
  } catch (error) {
    logger.error("Get device analytics error:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch device analytics",
    });
  }
};

const getGeographicAnalytics = async (req, res) => {
  try {
    const data = await resolveAnalyticsData(req.params.id, req.query, req.user);
    res.json({
      success: true,
      data: {
        countries: data.topStats.countries,
        cities: data.topStats.cities,
      },
    });
  } catch (error) {
    logger.error("Get geographic analytics error:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to fetch geographic analytics",
    });
  }
};

// Paginated click log — runs its own DB query so page/limit work correctly.
const getClickAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      period = "30d",
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    let urlObjectId;
    try {
      urlObjectId = new mongoose.Types.ObjectId(id);
    } catch (err) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid URL ID format" });
    }

    const url = await Url.findById(urlObjectId);
    if (!url) {
      return res.status(404).json({ success: false, message: "URL not found" });
    }

    if (
      url.creator.toString() !== req.user.id &&
      (!req.user.organization ||
        url.organization?.toString() !== req.user.organization.toString())
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const now = new Date();
    let dateRange = {};
    if (startDate && endDate) {
      dateRange = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else {
      const days =
        { "24h": 1, "7d": 7, "30d": 30, "90d": 90, "1y": 365 }[period] || 30;
      const start = new Date(now);
      start.setDate(start.getDate() - days);
      dateRange = { $gte: start, $lte: now };
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const matchFilter = {
      url: urlObjectId,
      timestamp: dateRange,
      isBot: { $ne: true },
    };

    const [clicks, total] = await Promise.all([
      Click.find(matchFilter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum),
      Click.countDocuments(matchFilter),
    ]);

    res.json({
      success: true,
      data: {
        clicks: clicks.map((click) => ({
          timestamp: click.timestamp,
          country: click.location?.countryName || click.location?.country || "",
          region: click.location?.region || "",
          city: click.location?.city || "",
          device: click.device?.type || "",
          browser: click.device?.browser?.name || "",
          os: click.device?.os?.name || "",
          referer: click.referer || "",
          language: click.language || "",
          clickSource: click.clickSource || "unknown",
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    logger.error("Get click analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch click analytics",
    });
  }
};

const getDashboardAnalytics = async (req, res) => {
  try {
    const {
      period = "30d",
      startDate: startDateParam,
      endDate: endDateParam,
    } = req.query;
    const userId = req.user.id;
    const organizationId = req.user.organization;

    let userObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
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
        ...(orgObjectId ? [{ organization: orgObjectId }] : []),
      ],
    };

    const now = new Date();
    let dateRange;
    if (startDateParam && endDateParam) {
      dateRange = {
        $gte: new Date(startDateParam),
        $lte: new Date(endDateParam),
      };
    } else {
      const days =
        {
          "24h": 1,
          "7d": 7,
          "30d": 30,
          "90d": 90,
          "1y": 365,
        }[period] || 30;
      const start = new Date(now);
      start.setDate(start.getDate() - days);
      dateRange = { $gte: start, $lte: now };
    }

    logger.info("📊 Dashboard Analytics Query:", {
      userId: userObjectId,
      organizationId: orgObjectId,
      period,
      dateRange,
    });

    const urls = await Url.find(filter).select(
      "_id clickCount uniqueClickCount qrScanCount uniqueQrScanCount createdAt",
    );
    const urlIds = urls.map((url) => url._id);

    const customDomainsFilter = {
      $or: [
        { owner: userObjectId },
        ...(orgObjectId ? [{ organization: orgObjectId }] : []),
      ],
    };
    const totalCustomDomains = await Domain.countDocuments(customDomainsFilter);

    logger.info(
      "📊 Found URLs:",
      urlIds.length,
      "Custom Domains:",
      totalCustomDomains,
    );

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
      periodStats,
    ] = await Promise.all([
      Click.countDocuments({
        url: { $in: urlIds },
        timestamp: dateRange,
        isBot: { $ne: true },
      }),

      Click.aggregate([
        {
          $match: {
            url: { $in: urlIds },
            timestamp: dateRange,
            isBot: { $ne: true },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
            },
            clicks: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Click.aggregate([
        {
          $match: {
            url: { $in: urlIds },
            timestamp: dateRange,
            isBot: { $ne: true },
          },
        },
        {
          $group: {
            _id: { $hour: "$timestamp" },
            clicks: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Click.aggregate([
        {
          $match: {
            url: { $in: urlIds },
            timestamp: dateRange,
            isBot: { $ne: true },
            "location.country": { $exists: true, $ne: null, $nin: ["", null] },
          },
        },
        {
          $group: {
            _id: {
              country: "$location.country",
              countryName: "$location.countryName",
            },
            clicks: { $sum: 1 },
          },
        },
        { $sort: { clicks: -1 } },
        { $limit: 10 },
      ]),

      Click.aggregate([
        {
          $match: {
            url: { $in: urlIds },
            timestamp: dateRange,
            isBot: { $ne: true },
            "location.city": { $exists: true, $ne: null, $nin: ["", null] },
          },
        },
        {
          $group: {
            _id: {
              city: "$location.city",
              region: "$location.region",
              country: "$location.countryName",
            },
            clicks: { $sum: 1 },
          },
        },
        { $sort: { clicks: -1 } },
        { $limit: 10 },
      ]),

      Click.aggregate([
        {
          $match: {
            url: { $in: urlIds },
            timestamp: dateRange,
            isBot: { $ne: true },
          },
        },
        {
          $group: {
            _id: "$device.type",
            clicks: { $sum: 1 },
          },
        },
        { $sort: { clicks: -1 } },
      ]),

      Click.aggregate([
        {
          $match: {
            url: { $in: urlIds },
            timestamp: dateRange,
            isBot: { $ne: true },
            "device.browser.name": {
              $exists: true,
              $ne: null,
              $nin: ["", null],
            },
          },
        },
        {
          $group: {
            _id: "$device.browser.name",
            clicks: { $sum: 1 },
          },
        },
        { $sort: { clicks: -1 } },
        { $limit: 10 },
      ]),

      Click.aggregate([
        {
          $match: {
            url: { $in: urlIds },
            timestamp: dateRange,
            isBot: { $ne: true },
            "device.os.name": { $exists: true, $ne: null, $nin: ["", null] },
          },
        },
        {
          $group: {
            _id: "$device.os.name",
            clicks: { $sum: 1 },
          },
        },
        { $sort: { clicks: -1 } },
        { $limit: 10 },
      ]),

      Click.aggregate([
        {
          $match: {
            url: { $in: urlIds },
            timestamp: dateRange,
            isBot: { $ne: true },
            referer: { $exists: true, $ne: null, $nin: ["", null] },
          },
        },
        {
          $addFields: {
            domain: {
              $regexFind: {
                input: "$referer",
                regex: /https?:\/\/([^\/]+)/,
              },
            },
          },
        },
        {
          $match: { "domain.match": { $ne: null } },
        },
        {
          $group: {
            _id: { $arrayElemAt: ["$domain.captures", 0] },
            clicks: { $sum: 1 },
          },
        },
        { $sort: { clicks: -1 } },
        { $limit: 10 },
      ]),

      Click.aggregate([
        {
          $match: {
            url: { $in: urlIds },
            timestamp: dateRange,
            isBot: { $ne: true },
          },
        },
        {
          $group: {
            _id: null,
            uniqueClicks: {
              $sum: { $cond: [{ $eq: ["$isUnique", true] }, 1, 0] },
            },
            qrScans: {
              $sum: { $cond: [{ $eq: ["$clickSource", "qr_code"] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const totalUrls = urls.length;
    const totalClicksAllTime = urls.reduce(
      (sum, url) => sum + (url.clickCount || 0),
      0,
    );
    const totalUniqueClicks = urls.reduce(
      (sum, url) => sum + (url.uniqueClickCount || 0),
      0,
    );
    const totalQRScans = urls.reduce(
      (sum, url) => sum + (url.qrScanCount || 0),
      0,
    );
    const totalUniqueQRScans = urls.reduce(
      (sum, url) => sum + (url.uniqueQrScanCount || 0),
      0,
    );

    const periodClicks = totalClicks;
    const periodUniqueClicks = periodStats[0]?.uniqueClicks || 0;
    const periodQRScans = periodStats[0]?.qrScans || 0;

    logger.info("📊 Dashboard Analytics Results:", {
      totalUrls,
      totalClicksAllTime,
      periodClicks,
      periodUniqueClicks,
      periodQRScans,
      clicksByDayCount: clicksByDay.length,
      topCountriesCount: topCountries.length,
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
          averageClicksPerUrl:
            totalUrls > 0 ? Math.round(totalClicksAllTime / totalUrls) : 0,
        },
        chartData: {
          clicksByDay: clicksByDay.map((item) => ({
            date: item._id,
            clicks: item.clicks,
          })),
          clicksByHour: clicksByHour.map((item) => ({
            hour: item._id,
            clicks: item.clicks,
          })),
        },
        topStats: {
          countries: topCountries.map((item) => ({
            country: item._id?.country || "Unknown",
            countryName:
              item._id?.countryName || item._id?.country || "Unknown",
            clicks: item.clicks,
          })),
          cities: topCities.map((item) => ({
            city: item._id?.city || "Unknown",
            region: item._id?.region || "",
            country: item._id?.country || "",
            clicks: item.clicks,
          })),
          devices: topDevices.map((item) => ({
            type: item._id || "unknown",
            clicks: item.clicks,
          })),
          browsers: topBrowsers.map((item) => ({
            browser: item._id || "Unknown",
            clicks: item.clicks,
          })),
          operatingSystems: topOS.map((item) => ({
            os: item._id || "Unknown",
            clicks: item.clicks,
          })),
          referrers: topReferrers.map((item) => ({
            domain: item._id || "Direct",
            clicks: item.clicks,
          })),
        },
      },
    });
  } catch (error) {
    logger.error("Get dashboard analytics error:", error);
    logger.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard analytics",
    });
  }
};

const exportAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { format = "json", period = "30d" } = req.query;

    let urlObjectId;
    try {
      urlObjectId = new mongoose.Types.ObjectId(id);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Invalid URL ID format",
      });
    }

    const url = await Url.findById(urlObjectId);
    if (!url) {
      return res.status(404).json({
        success: false,
        message: "URL not found",
      });
    }

    if (
      url.creator.toString() !== req.user.id &&
      (!req.user.organization ||
        url.organization?.toString() !== req.user.organization.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const days =
      {
        "24h": 1,
        "7d": 7,
        "30d": 30,
        "90d": 90,
        "1y": 365,
      }[period] || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const clicks = await Click.find({
      url: urlObjectId,
      timestamp: { $gte: startDate },
      isBot: { $ne: true },
    }).sort({ timestamp: -1 });

    const exportData = {
      url: {
        shortCode: url.shortCode,
        originalUrl: url.originalUrl,
        title: url.title,
        createdAt: url.createdAt,
      },
      period: period,
      totalClicks: clicks.length,
      clicks: clicks.map((click) => ({
        timestamp: click.timestamp,
        country: click.location.countryName || "",
        region: click.location.region || "",
        city: click.location.city || "",
        deviceType: click.device.type || "",
        browser: click.device.browser.name || "",
        os: click.device.os.name || "",
        referer: click.referer || "",
        language: click.language || "",
      })),
    };

    if (format === "csv") {
      const csvHeader =
        "Timestamp,Country,Region,City,Device,Browser,OS,Language,Referer\n";
      const csvData = exportData.clicks
        .map(
          (click) =>
            `${click.timestamp},${click.country},${click.region},${click.city},${click.deviceType},${click.browser},${click.os},${click.language},"${click.referer}"`,
        )
        .join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="analytics-${url.shortCode}-${period}.csv"`,
      );
      res.send(csvHeader + csvData);
    } else {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="analytics-${url.shortCode}-${period}.json"`,
      );
      res.json(exportData);
    }
  } catch (error) {
    logger.error("Export analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export analytics",
    });
  }
};

module.exports = {
  getUrlAnalytics,
  getUrlOverview,
  getDeviceAnalytics,
  getGeographicAnalytics,
  getClickAnalytics,
  getDashboardAnalytics,
  exportAnalytics,
};
