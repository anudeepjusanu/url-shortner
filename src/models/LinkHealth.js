const mongoose = require('mongoose');

const healthCheckSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  statusCode: {
    type: Number,
    required: true
  },
  responseTime: {
    type: Number, // in milliseconds
    required: true
  },
  isHealthy: {
    type: Boolean,
    required: true
  },
  errorMessage: {
    type: String,
    default: null
  },
  redirectChain: [{
    url: String,
    statusCode: Number
  }]
});

const linkHealthSchema = new mongoose.Schema({
  url: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Url',
    required: true,
    unique: true,
    index: true
  },
  originalUrl: {
    type: String,
    required: true
  },
  currentStatus: {
    isHealthy: {
      type: Boolean,
      default: true
    },
    lastChecked: {
      type: Date,
      default: Date.now
    },
    lastStatusCode: {
      type: Number,
      default: null
    },
    lastResponseTime: {
      type: Number,
      default: null
    },
    consecutiveFailures: {
      type: Number,
      default: 0
    }
  },
  statistics: {
    totalChecks: {
      type: Number,
      default: 0
    },
    successfulChecks: {
      type: Number,
      default: 0
    },
    failedChecks: {
      type: Number,
      default: 0
    },
    averageResponseTime: {
      type: Number,
      default: 0
    },
    uptime: {
      type: Number, // percentage
      default: 100
    },
    lastDowntime: {
      type: Date,
      default: null
    },
    totalDowntime: {
      type: Number, // in minutes
      default: 0
    }
  },
  checks: [healthCheckSchema],
  settings: {
    checkInterval: {
      type: Number, // in minutes
      default: 60
    },
    enabled: {
      type: Boolean,
      default: true
    },
    notifyOnFailure: {
      type: Boolean,
      default: true
    },
    failureThreshold: {
      type: Number, // consecutive failures before alert
      default: 3
    }
  },
  alerts: [{
    type: {
      type: String,
      enum: ['down', 'slow', 'recovered'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    acknowledged: {
      type: Boolean,
      default: false
    },
    acknowledgedAt: {
      type: Date,
      default: null
    }
  }]
}, {
  timestamps: true
});

// Indexes
linkHealthSchema.index({ url: 1 }, { unique: true });
linkHealthSchema.index({ 'currentStatus.isHealthy': 1 });
linkHealthSchema.index({ 'currentStatus.lastChecked': 1 });
linkHealthSchema.index({ 'settings.enabled': 1 });

// Keep only last 100 checks to prevent document bloat
linkHealthSchema.pre('save', function(next) {
  if (this.checks.length > 100) {
    this.checks = this.checks.slice(-100);
  }
  next();
});

// Methods
linkHealthSchema.methods.addCheck = async function(checkResult) {
  const { statusCode, responseTime, isHealthy, errorMessage, redirectChain } = checkResult;
  
  // Add new check
  this.checks.push({
    statusCode,
    responseTime,
    isHealthy,
    errorMessage,
    redirectChain
  });
  
  // Update current status
  this.currentStatus.lastChecked = new Date();
  this.currentStatus.lastStatusCode = statusCode;
  this.currentStatus.lastResponseTime = responseTime;
  
  if (isHealthy) {
    this.currentStatus.consecutiveFailures = 0;
    if (!this.currentStatus.isHealthy) {
      // Recovered from failure
      this.currentStatus.isHealthy = true;
      this.alerts.push({
        type: 'recovered',
        message: `Link recovered and is now accessible (Status: ${statusCode})`
      });
    }
  } else {
    this.currentStatus.consecutiveFailures += 1;
    
    // Check if we should mark as unhealthy and send alert
    if (this.currentStatus.consecutiveFailures >= this.settings.failureThreshold) {
      if (this.currentStatus.isHealthy) {
        this.currentStatus.isHealthy = false;
        this.statistics.lastDowntime = new Date();
        
        if (this.settings.notifyOnFailure) {
          this.alerts.push({
            type: 'down',
            message: `Link is down after ${this.settings.failureThreshold} consecutive failures (Status: ${statusCode})`
          });
        }
      }
    }
  }
  
  // Update statistics
  this.statistics.totalChecks += 1;
  if (isHealthy) {
    this.statistics.successfulChecks += 1;
  } else {
    this.statistics.failedChecks += 1;
  }
  
  // Calculate uptime percentage
  this.statistics.uptime = (this.statistics.successfulChecks / this.statistics.totalChecks) * 100;
  
  // Calculate average response time
  const recentChecks = this.checks.slice(-20); // Last 20 checks
  const totalResponseTime = recentChecks.reduce((sum, check) => sum + check.responseTime, 0);
  this.statistics.averageResponseTime = Math.round(totalResponseTime / recentChecks.length);
  
  // Check for slow response
  if (isHealthy && responseTime > 5000 && this.settings.notifyOnFailure) {
    this.alerts.push({
      type: 'slow',
      message: `Link is responding slowly (${responseTime}ms)`
    });
  }
  
  await this.save();
};

linkHealthSchema.methods.acknowledgeAlert = async function(alertId) {
  const alert = this.alerts.id(alertId);
  if (alert) {
    alert.acknowledged = true;
    alert.acknowledgedAt = new Date();
    await this.save();
  }
};

linkHealthSchema.methods.getRecentChecks = function(limit = 10) {
  return this.checks.slice(-limit).reverse();
};

linkHealthSchema.methods.getUptimePercentage = function(days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const recentChecks = this.checks.filter(check => check.timestamp >= cutoffDate);
  if (recentChecks.length === 0) return 100;
  
  const successfulChecks = recentChecks.filter(check => check.isHealthy).length;
  return (successfulChecks / recentChecks.length) * 100;
};

// Static methods
linkHealthSchema.statics.getUnhealthyLinks = function() {
  return this.find({ 
    'currentStatus.isHealthy': false,
    'settings.enabled': true
  }).populate('url');
};

linkHealthSchema.statics.getLinksNeedingCheck = function() {
  const now = new Date();
  return this.find({
    'settings.enabled': true,
    $or: [
      { 'currentStatus.lastChecked': null },
      {
        $expr: {
          $lt: [
            '$currentStatus.lastChecked',
            { $subtract: [now, { $multiply: ['$settings.checkInterval', 60000] }] }
          ]
        }
      }
    ]
  }).populate('url');
};

module.exports = mongoose.model('LinkHealth', linkHealthSchema);
