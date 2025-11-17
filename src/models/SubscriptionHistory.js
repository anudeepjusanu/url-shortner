const mongoose = require('mongoose');

const subscriptionHistorySchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Event identification
  eventId: {
    type: String,
    required: true,
    unique: true,
    // Format: SUB-YYYYMMDD-XXXXXX
    match: /^SUB-\d{8}-[A-Z0-9]{6}$/
  },

  // Event type
  eventType: {
    type: String,
    required: true,
    enum: [
      'subscription_created',
      'subscription_activated',
      'subscription_upgraded',
      'subscription_downgraded',
      'subscription_renewed',
      'subscription_cancelled',
      'subscription_expired',
      'subscription_paused',
      'subscription_resumed',
      'payment_succeeded',
      'payment_failed',
      'payment_method_updated',
      'trial_started',
      'trial_ended',
      'plan_changed',
      'custom_domain_added',
      'custom_domain_removed',
      'url_limit_increased',
      'url_limit_decreased',
      'feature_enabled',
      'feature_disabled'
    ],
    index: true
  },

  // Subscription details at the time of event
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'pro', 'enterprise'],
      required: true
    },

    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly', 'lifetime']
    },

    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired', 'trial', 'paused', 'past_due']
    },

    // Previous values (for change events)
    previousPlan: {
      type: String,
      enum: ['free', 'basic', 'pro', 'enterprise']
    },

    previousBillingCycle: {
      type: String,
      enum: ['monthly', 'yearly', 'lifetime']
    },

    previousStatus: {
      type: String,
      enum: ['active', 'cancelled', 'expired', 'trial', 'paused', 'past_due']
    },

    // Pricing at the time of event
    price: {
      amount: Number,
      currency: {
        type: String,
        enum: ['SAR', 'USD', 'AED', 'EUR', 'KWD', 'BHD', 'OMR'],
        default: 'SAR'
      }
    },

    // Subscription period
    currentPeriodStart: Date,
    currentPeriodEnd: Date,

    // Trial information
    trialStart: Date,
    trialEnd: Date,

    // Features snapshot
    features: {
      maxUrls: Number,
      maxCustomDomains: Number,
      analyticsEnabled: Boolean,
      qrCodesEnabled: Boolean,
      customBrandingEnabled: Boolean,
      apiAccessEnabled: Boolean,
      bulkOperationsEnabled: Boolean
    }
  },

  // Payment information (if applicable)
  payment: {
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    },

    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice'
    },

    amount: Number,

    currency: {
      type: String,
      enum: ['SAR', 'USD', 'AED', 'EUR', 'KWD', 'BHD', 'OMR']
    },

    paymentGateway: {
      type: String,
      enum: ['stripe', 'moyasar', 'manual', 'other']
    },

    paymentMethod: {
      type: String,
      enum: ['credit_card', 'debit_card', 'bank_transfer', 'mada', 'stcpay', 'apple_pay', 'google_pay', 'other']
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded']
    }
  },

  // Change details
  changes: {
    type: Map,
    of: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed
    }
  },

  // Metadata and context
  metadata: {
    reason: String, // User-provided reason for change (e.g., "Upgrading for more features")
    notes: String, // Admin notes
    ipAddress: String,
    userAgent: String,
    source: {
      type: String,
      enum: ['user', 'admin', 'system', 'api', 'webhook'],
      default: 'system'
    }
  },

  // Event timestamp
  eventTimestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },

  // Action performed by
  performedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userType: {
      type: String,
      enum: ['user', 'admin', 'super_admin', 'system'],
      default: 'user'
    },
    email: String,
    name: String
  },

  // Webhook/API tracking
  webhookEvent: {
    provider: String,
    eventId: String,
    eventType: String,
    receivedAt: Date
  },

  // Notification tracking
  notificationSent: {
    type: Boolean,
    default: false
  },

  notificationDetails: {
    email: Boolean,
    sms: Boolean,
    inApp: Boolean,
    sentAt: Date
  },

  // Additional context
  additionalData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
subscriptionHistorySchema.index({ userId: 1, eventTimestamp: -1 });
subscriptionHistorySchema.index({ eventType: 1, eventTimestamp: -1 });
subscriptionHistorySchema.index({ 'subscription.plan': 1 });
subscriptionHistorySchema.index({ 'payment.transactionId': 1 });
subscriptionHistorySchema.index({ eventId: 1 });

// Virtual for event age
subscriptionHistorySchema.virtual('eventAge').get(function() {
  if (!this.eventTimestamp) return null;
  const now = new Date();
  const diff = now - this.eventTimestamp;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Pre-save middleware to generate event ID
subscriptionHistorySchema.pre('save', async function(next) {
  if (!this.eventId) {
    this.eventId = await generateEventId();
  }
  next();
});

// Static method to generate event ID
async function generateEventId() {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
                  (now.getMonth() + 1).toString().padStart(2, '0') +
                  now.getDate().toString().padStart(2, '0');

  // Generate random 6-character alphanumeric code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomCode = '';
  for (let i = 0; i < 6; i++) {
    randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const eventId = `SUB-${dateStr}-${randomCode}`;

  // Check if this ID already exists (very unlikely but just in case)
  const existing = await mongoose.model('SubscriptionHistory').findOne({ eventId });
  if (existing) {
    // Recursively generate a new one
    return generateEventId();
  }

  return eventId;
}

// Static method to log subscription event
subscriptionHistorySchema.statics.logEvent = async function(eventData) {
  const {
    userId,
    eventType,
    subscription,
    payment,
    changes,
    metadata,
    performedBy,
    webhookEvent,
    additionalData
  } = eventData;

  const history = new this({
    userId,
    eventType,
    subscription,
    payment,
    changes,
    metadata,
    performedBy,
    webhookEvent,
    additionalData,
    eventTimestamp: new Date()
  });

  await history.save();
  return history;
};

// Static method to get user subscription history
subscriptionHistorySchema.statics.getUserHistory = function(userId, options = {}) {
  const query = { userId };

  if (options.eventType) {
    if (Array.isArray(options.eventType)) {
      query.eventType = { $in: options.eventType };
    } else {
      query.eventType = options.eventType;
    }
  }

  if (options.plan) {
    query['subscription.plan'] = options.plan;
  }

  if (options.startDate || options.endDate) {
    query.eventTimestamp = {};
    if (options.startDate) query.eventTimestamp.$gte = new Date(options.startDate);
    if (options.endDate) query.eventTimestamp.$lte = new Date(options.endDate);
  }

  return this.find(query)
    .sort({ eventTimestamp: -1 })
    .limit(options.limit || 100)
    .skip(options.skip || 0)
    .populate('payment.transactionId')
    .populate('payment.invoiceId')
    .populate('performedBy.userId', 'email name');
};

// Static method to get subscription timeline
subscriptionHistorySchema.statics.getTimeline = async function(userId) {
  const history = await this.find({ userId })
    .sort({ eventTimestamp: 1 })
    .select('eventType eventTimestamp subscription.plan subscription.status payment.amount');

  const timeline = [];
  let currentPlan = 'free';
  let currentStatus = 'active';

  history.forEach(event => {
    const item = {
      date: event.eventTimestamp,
      type: event.eventType,
      plan: event.subscription?.plan || currentPlan,
      status: event.subscription?.status || currentStatus,
      amount: event.payment?.amount || null
    };

    timeline.push(item);

    if (event.subscription?.plan) currentPlan = event.subscription.plan;
    if (event.subscription?.status) currentStatus = event.subscription.status;
  });

  return timeline;
};

// Static method to get subscription statistics
subscriptionHistorySchema.statics.getSubscriptionStats = async function(options = {}) {
  const matchStage = {};

  if (options.userId) {
    matchStage.userId = new mongoose.Types.ObjectId(options.userId);
  }

  if (options.startDate || options.endDate) {
    matchStage.eventTimestamp = {};
    if (options.startDate) matchStage.eventTimestamp.$gte = new Date(options.startDate);
    if (options.endDate) matchStage.eventTimestamp.$lte = new Date(options.endDate);
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          eventType: '$eventType',
          plan: '$subscription.plan'
        },
        count: { $sum: 1 },
        totalRevenue: {
          $sum: {
            $cond: [
              { $eq: ['$payment.paymentStatus', 'completed'] },
              '$payment.amount',
              0
            ]
          }
        }
      }
    }
  ]);

  const result = {
    totalEvents: 0,
    eventsByType: {},
    eventsByPlan: {},
    totalRevenue: 0
  };

  stats.forEach(stat => {
    result.totalEvents += stat.count;
    result.eventsByType[stat._id.eventType] = (result.eventsByType[stat._id.eventType] || 0) + stat.count;
    result.eventsByPlan[stat._id.plan] = (result.eventsByPlan[stat._id.plan] || 0) + stat.count;
    result.totalRevenue += stat.totalRevenue || 0;
  });

  return result;
};

// Static method to get recent events
subscriptionHistorySchema.statics.getRecentEvents = function(limit = 50) {
  return this.find()
    .sort({ eventTimestamp: -1 })
    .limit(limit)
    .populate('userId', 'email name')
    .populate('performedBy.userId', 'email name');
};

// Static method to get upgrade/downgrade patterns
subscriptionHistorySchema.statics.getUpgradeDowngradePatterns = async function() {
  const patterns = await this.aggregate([
    {
      $match: {
        eventType: { $in: ['subscription_upgraded', 'subscription_downgraded', 'plan_changed'] }
      }
    },
    {
      $group: {
        _id: {
          from: '$subscription.previousPlan',
          to: '$subscription.plan'
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  return patterns.map(p => ({
    from: p._id.from,
    to: p._id.to,
    count: p.count
  }));
};

// Static method to get churn analysis
subscriptionHistorySchema.statics.getChurnAnalysis = async function(dateRange = {}) {
  const matchStage = {
    eventType: 'subscription_cancelled'
  };

  if (dateRange.start || dateRange.end) {
    matchStage.eventTimestamp = {};
    if (dateRange.start) matchStage.eventTimestamp.$gte = new Date(dateRange.start);
    if (dateRange.end) matchStage.eventTimestamp.$lte = new Date(dateRange.end);
  }

  const churnData = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          plan: '$subscription.plan',
          reason: '$metadata.reason'
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  return churnData.map(d => ({
    plan: d._id.plan,
    reason: d._id.reason || 'Not specified',
    count: d.count
  }));
};

const SubscriptionHistory = mongoose.model('SubscriptionHistory', subscriptionHistorySchema);

module.exports = SubscriptionHistory;
