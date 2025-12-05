const mongoose = require('mongoose');

const clickSchema = new mongoose.Schema({
  url: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Url',
    required: true
  },
  shortCode: {
    type: String,
    required: true,
    index: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  ipHash: {
    type: String,
    required: true,
    index: true
  },
  userAgent: {
    type: String,
    required: true
  },
  referer: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  location: {
    country: {
      type: String,
      uppercase: true,
      length: 2
    },
    countryName: String,
    region: String,
    city: String,
    timezone: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  device: {
    type: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'bot', 'unknown'],
      default: 'unknown'
    },
    os: {
      name: String,
      version: String
    },
    browser: {
      name: String,
      version: String
    },
    model: String,
    vendor: String
  },
  campaign: {
    source: String,
    medium: String,
    campaign: String,
    term: String,
    content: String
  },
  isUnique: {
    type: Boolean,
    default: false
  },
  isBot: {
    type: Boolean,
    default: false
  },
  clickSource: {
    type: String,
    enum: ['browser', 'qr_code', 'api', 'direct', 'unknown'],
    default: 'unknown',
    index: true
  },
  language: String,
  screenResolution: String
}, {
  timestamps: false,
  collection: 'analytics_clicks'
});

const dailySummarySchema = new mongoose.Schema({
  url: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Url',
    required: true
  },
  shortCode: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  totalClicks: {
    type: Number,
    default: 0
  },
  uniqueClicks: {
    type: Number,
    default: 0
  },
  qrCodeScans: {
    type: Number,
    default: 0
  },
  uniqueQRScans: {
    type: Number,
    default: 0
  },
  topCountries: [{
    country: String,
    countryName: String,
    clicks: Number
  }],
  topReferrers: [{
    domain: String,
    clicks: Number
  }],
  topDevices: [{
    type: String,
    clicks: Number
  }],
  topBrowsers: [{
    name: String,
    clicks: Number
  }],
  topOS: [{
    name: String,
    clicks: Number
  }],
  hourlyDistribution: [{
    hour: Number,
    clicks: Number
  }]
}, {
  timestamps: true,
  collection: 'analytics_daily'
});

const monthlySummarySchema = new mongoose.Schema({
  url: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Url',
    required: true
  },
  shortCode: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  totalClicks: {
    type: Number,
    default: 0
  },
  uniqueClicks: {
    type: Number,
    default: 0
  },
  qrCodeScans: {
    type: Number,
    default: 0
  },
  uniqueQRScans: {
    type: Number,
    default: 0
  },
  topCountries: [{
    country: String,
    countryName: String,
    clicks: Number
  }],
  topReferrers: [{
    domain: String,
    clicks: Number
  }],
  topDevices: [{
    type: String,
    clicks: Number
  }],
  dailyBreakdown: [{
    date: Date,
    clicks: Number,
    uniqueClicks: Number
  }]
}, {
  timestamps: true,
  collection: 'analytics_monthly'
});

clickSchema.index({ url: 1, timestamp: -1 });
clickSchema.index({ shortCode: 1, timestamp: -1 });
clickSchema.index({ ipHash: 1, url: 1 });
clickSchema.index({ timestamp: -1 });
clickSchema.index({ 'location.country': 1 });
clickSchema.index({ 'device.type': 1 });
clickSchema.index({ isBot: 1 });

dailySummarySchema.index({ url: 1, date: -1 });
dailySummarySchema.index({ shortCode: 1, date: -1 });
dailySummarySchema.index({ date: -1 });

monthlySummarySchema.index({ url: 1, year: -1, month: -1 });
monthlySummarySchema.index({ shortCode: 1, year: -1, month: -1 });
monthlySummarySchema.index({ year: -1, month: -1 });

clickSchema.statics.createClick = async function(clickData) {
  try {
    const click = new this(clickData);
    await click.save();
    
    await this.updateDailySummary(clickData);
    
    return click;
  } catch (error) {
    console.error('Error creating click record:', error);
    throw error;
  }
};

clickSchema.statics.updateDailySummary = async function(clickData) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const updateData = {
      $inc: {
        totalClicks: 1,
        uniqueClicks: clickData.isUnique ? 1 : 0
      },
      $setOnInsert: {
        shortCode: clickData.shortCode
      }
    };

    // Track QR code scans separately
    if (clickData.clickSource === 'qr_code') {
      updateData.$inc.qrCodeScans = 1;
      if (clickData.isUnique) {
        updateData.$inc.uniqueQRScans = 1;
      }
    }

    await mongoose.model('DailySummary').findOneAndUpdate(
      {
        url: clickData.url,
        date: today
      },
      updateData,
      {
        upsert: true,
        new: true
      }
    );
  } catch (error) {
    console.error('Error updating daily summary:', error);
  }
};

clickSchema.statics.getTopStats = async function(urlId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  console.log('📊 getTopStats called:', { urlId, days, startDate });
  
  const pipeline = [
    {
      $match: {
        url: urlId,
        timestamp: { $gte: startDate },
        isBot: { $ne: true }
      }
    },
    {
      $facet: {
        countries: [
          {
            $match: { 
              'location.country': { $exists: true, $ne: null, $ne: '' }
            }
          },
          {
            $group: {
              _id: {
                country: '$location.country',
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
              'location.city': { $exists: true, $ne: null, $ne: '' }
            }
          },
          {
            $group: {
              _id: {
                city: '$location.city',
                region: '$location.region',
                country: { $ifNull: ['$location.countryName', '$location.country'] }
              },
              count: { $sum: 1 }
            }
          },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ],
        referrers: [
          {
            $match: { referer: { $exists: true, $ne: null, $ne: '' } }
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
            $match: { 'device.browser.name': { $exists: true, $ne: null, $ne: '' } }
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
            $match: { 'device.os.name': { $exists: true, $ne: null, $ne: '' } }
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
  
  const results = await this.aggregate(pipeline);
  console.log('📊 getTopStats results:', {
    countries: results[0]?.countries?.length || 0,
    cities: results[0]?.cities?.length || 0,
    devices: results[0]?.devices?.length || 0,
    browsers: results[0]?.browsers?.length || 0,
    operatingSystems: results[0]?.operatingSystems?.length || 0
  });
  return results;
};

const Click = mongoose.model('Click', clickSchema);
const DailySummary = mongoose.model('DailySummary', dailySummarySchema);
const MonthlySummary = mongoose.model('MonthlySummary', monthlySummarySchema);

module.exports = {
  Click,
  DailySummary,
  MonthlySummary
};