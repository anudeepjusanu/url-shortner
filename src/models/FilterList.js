const mongoose = require('mongoose');

/**
 * Blocked Domain Schema
 * Stores user-specific blocked domains
 */
const blockedDomainSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  domain: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  reason: {
    type: String,
    enum: ['malicious', 'phishing', 'spam', 'adult', 'manual', 'other'],
    default: 'manual'
  },
  addedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  blockedCount: {
    type: Number,
    default: 0
  },
  lastBlockedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for user and domain (unique)
blockedDomainSchema.index({ user: 1, domain: 1 }, { unique: true });

// Methods
blockedDomainSchema.methods = {
  incrementBlockCount: async function() {
    this.blockedCount += 1;
    this.lastBlockedAt = new Date();
    return this.save();
  }
};

/**
 * Blocked Keyword Schema
 * Stores user-specific blocked keywords
 */
const blockedKeywordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  keyword: {
    type: String,
    required: true,
    trim: true
  },
  caseSensitive: {
    type: Boolean,
    default: false
  },
  addedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  blockedCount: {
    type: Number,
    default: 0
  },
  lastBlockedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for user and keyword (unique)
blockedKeywordSchema.index({ user: 1, keyword: 1 }, { unique: true });

// Methods
blockedKeywordSchema.methods = {
  incrementBlockCount: async function() {
    this.blockedCount += 1;
    this.lastBlockedAt = new Date();
    return this.save();
  }
};

/**
 * Allowed Domain Schema (Whitelist)
 * Stores user-specific whitelisted domains
 */
const allowedDomainSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  domain: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  note: {
    type: String,
    default: ''
  },
  addedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for user and domain (unique)
allowedDomainSchema.index({ user: 1, domain: 1 }, { unique: true });

/**
 * Filter Log Schema
 * Stores filtering activity logs
 */
const filterLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  url: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    enum: ['malicious', 'phishing', 'spam', 'adult', 'keyword', 'domain', 'other'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  filterType: {
    type: String,
    enum: ['domain', 'keyword', 'automatic', 'manual'],
    default: 'automatic'
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false
});

// Index for efficient log queries
filterLogSchema.index({ user: 1, timestamp: -1 });
filterLogSchema.index({ reason: 1 });

// TTL index to automatically delete logs older than 90 days
filterLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Static methods for Filter Log
filterLogSchema.statics = {
  // Create filter log entry
  logFilter: async function(userId, url, reason, message, options = {}) {
    return this.create({
      user: userId,
      url,
      reason,
      message,
      filterType: options.filterType || 'automatic',
      severity: options.severity || 'medium',
      metadata: options.metadata || {}
    });
  },

  // Get recent logs for user
  getUserLogs: async function(userId, options = {}) {
    const { limit = 50, reason, startDate, endDate } = options;
    const query = { user: userId };

    if (reason) {
      query.reason = reason;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    return this.find(query)
      .sort({ timestamp: -1 })
      .limit(limit);
  },

  // Get filter statistics
  getStats: async function(userId) {
    const stats = await this.aggregate([
      { $match: { user: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$reason',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      totalFiltered: 0,
      maliciousBlocked: 0,
      phishingBlocked: 0,
      spamBlocked: 0,
      adultBlocked: 0,
      keywordBlocked: 0
    };

    stats.forEach(stat => {
      result.totalFiltered += stat.count;
      switch (stat._id) {
        case 'malicious':
          result.maliciousBlocked = stat.count;
          break;
        case 'phishing':
          result.phishingBlocked = stat.count;
          break;
        case 'spam':
          result.spamBlocked = stat.count;
          break;
        case 'adult':
          result.adultBlocked = stat.count;
          break;
        case 'keyword':
          result.keywordBlocked = stat.count;
          break;
      }
    });

    return result;
  }
};

// Export models
const BlockedDomain = mongoose.model('BlockedDomain', blockedDomainSchema);
const BlockedKeyword = mongoose.model('BlockedKeyword', blockedKeywordSchema);
const AllowedDomain = mongoose.model('AllowedDomain', allowedDomainSchema);
const FilterLog = mongoose.model('FilterLog', filterLogSchema);

module.exports = {
  BlockedDomain,
  BlockedKeyword,
  AllowedDomain,
  FilterLog
};
