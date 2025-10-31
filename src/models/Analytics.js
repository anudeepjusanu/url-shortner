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
    await mongoose.model('DailySummary').findOneAndUpdate(
      {
        url: clickData.url,
        date: today
      },
      {
        $inc: {
          totalClicks: 1,
          uniqueClicks: clickData.isUnique ? 1 : 0
        },
        $setOnInsert: {
          shortCode: clickData.shortCode
        }
      },
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
  
  return await this.aggregate(pipeline);
};

const Click = mongoose.model('Click', clickSchema);
const DailySummary = mongoose.model('DailySummary', dailySummarySchema);
const MonthlySummary = mongoose.model('MonthlySummary', monthlySummarySchema);

module.exports = {
  Click,
  DailySummary,
  MonthlySummary
};