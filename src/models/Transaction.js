const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // Transaction identification
  transactionId: {
    type: String,
    required: true,
    unique: true,
    // Format: TXN-YYYYMMDD-XXXXXX
    match: /^TXN-\d{8}-[A-Z0-9]{6}$/
  },

  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Invoice reference
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    index: true
  },

  // Payment gateway information
  paymentGateway: {
    type: String,
    enum: ['stripe', 'moyasar', 'manual', 'other'],
    required: true,
    index: true
  },

  // Gateway-specific transaction IDs
  gatewayTransactionId: {
    type: String,
    index: true
  },

  stripePaymentIntentId: String,
  stripeChargeId: String,
  moyasarPaymentId: String,

  // Transaction details
  type: {
    type: String,
    enum: ['payment', 'refund', 'partial_refund', 'chargeback', 'adjustment'],
    required: true,
    default: 'payment',
    index: true
  },

  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded'],
    required: true,
    default: 'pending',
    index: true
  },

  // Financial information
  currency: {
    type: String,
    required: true,
    enum: ['SAR', 'USD', 'AED', 'EUR', 'KWD', 'BHD', 'OMR'],
    default: 'SAR'
  },

  amount: {
    type: Number,
    required: true,
    min: 0
  },

  fee: {
    gatewayFee: {
      type: Number,
      default: 0,
      min: 0
    },
    platformFee: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      default: 0,
      min: 0
    }
  },

  netAmount: {
    type: Number,
    required: true,
    min: 0
  },

  // Refund information
  refundAmount: {
    type: Number,
    default: 0,
    min: 0
  },

  refundedAt: Date,

  refundReason: String,

  // Payment method details
  paymentMethod: {
    type: {
      type: String,
      enum: ['credit_card', 'debit_card', 'bank_transfer', 'mada', 'stcpay', 'apple_pay', 'google_pay', 'other']
    },
    brand: String, // visa, mastercard, mada, etc.
    last4: String, // Last 4 digits of card
    expiryMonth: Number,
    expiryYear: Number,
    country: String,
    fingerprint: String // Unique card identifier
  },

  // Customer billing information
  billingDetails: {
    name: String,
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    }
  },

  // Transaction metadata
  description: String,

  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },

  // Subscription reference (if applicable)
  subscriptionId: String,

  subscriptionPeriod: {
    start: Date,
    end: Date
  },

  // IP and device information for fraud detection
  ipAddress: String,

  userAgent: String,

  deviceFingerprint: String,

  // Risk and fraud assessment
  riskScore: {
    type: Number,
    min: 0,
    max: 100
  },

  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical']
  },

  fraudFlags: [String],

  // Gateway response
  gatewayResponse: {
    code: String,
    message: String,
    rawResponse: mongoose.Schema.Types.Mixed
  },

  // Error handling
  errorCode: String,

  errorMessage: String,

  errorDetails: mongoose.Schema.Types.Mixed,

  // Retry tracking
  retryCount: {
    type: Number,
    default: 0,
    min: 0
  },

  lastRetryAt: Date,

  // Webhook tracking
  webhookReceived: {
    type: Boolean,
    default: false
  },

  webhookReceivedAt: Date,

  webhookData: mongoose.Schema.Types.Mixed,

  // Settlement information
  settled: {
    type: Boolean,
    default: false
  },

  settledAt: Date,

  settlementId: String,

  // Timestamps
  initiatedAt: {
    type: Date,
    default: Date.now
  },

  completedAt: Date,

  failedAt: Date,

  // Notes and audit
  internalNotes: String,

  processedBy: {
    type: String,
    default: 'system'
  },

  // Notification tracking
  customerNotified: {
    type: Boolean,
    default: false
  },

  notificationSentAt: Date

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance and queries
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ paymentGateway: 1, status: 1 });
transactionSchema.index({ gatewayTransactionId: 1 });
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ invoiceId: 1 });
transactionSchema.index({ 'billingDetails.email': 1 });

// Virtual for transaction age
transactionSchema.virtual('ageInHours').get(function() {
  if (!this.initiatedAt) return 0;
  const now = new Date();
  const diff = now - this.initiatedAt;
  return Math.floor(diff / (1000 * 60 * 60));
});

// Virtual for success status
transactionSchema.virtual('isSuccessful').get(function() {
  return this.status === 'completed';
});

// Virtual for failure status
transactionSchema.virtual('isFailed').get(function() {
  return this.status === 'failed' || this.status === 'cancelled';
});

// Pre-save middleware to generate transaction ID
transactionSchema.pre('save', async function(next) {
  if (!this.transactionId) {
    this.transactionId = await generateTransactionId();
  }

  // Calculate net amount (amount - fees)
  this.fee.total = (this.fee.gatewayFee || 0) + (this.fee.platformFee || 0);
  this.netAmount = this.amount - this.fee.total;

  // Set completion/failure timestamps
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }

  if ((this.status === 'failed' || this.status === 'cancelled') && !this.failedAt) {
    this.failedAt = new Date();
  }

  next();
});

// Static method to generate transaction ID
async function generateTransactionId() {
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

  const txnId = `TXN-${dateStr}-${randomCode}`;

  // Check if this ID already exists (very unlikely but just in case)
  const existing = await mongoose.model('Transaction').findOne({ transactionId: txnId });
  if (existing) {
    // Recursively generate a new one
    return generateTransactionId();
  }

  return txnId;
}

// Instance method to mark as completed
transactionSchema.methods.markAsCompleted = function(gatewayTransactionId, gatewayResponse = {}) {
  this.status = 'completed';
  this.completedAt = new Date();
  if (gatewayTransactionId) {
    this.gatewayTransactionId = gatewayTransactionId;
  }
  if (gatewayResponse) {
    this.gatewayResponse = gatewayResponse;
  }
  return this.save();
};

// Instance method to mark as failed
transactionSchema.methods.markAsFailed = function(errorCode, errorMessage, errorDetails = null) {
  this.status = 'failed';
  this.failedAt = new Date();
  this.errorCode = errorCode;
  this.errorMessage = errorMessage;
  if (errorDetails) {
    this.errorDetails = errorDetails;
  }
  return this.save();
};

// Instance method to process refund
transactionSchema.methods.processRefund = function(refundAmount, reason = '') {
  this.refundAmount += refundAmount;
  this.refundedAt = new Date();
  this.refundReason = reason;

  if (this.refundAmount >= this.amount) {
    this.status = 'refunded';
  } else {
    this.status = 'partially_refunded';
  }

  return this.save();
};

// Instance method to increment retry count
transactionSchema.methods.incrementRetry = function() {
  this.retryCount += 1;
  this.lastRetryAt = new Date();
  return this.save();
};

// Static method to get user transactions
transactionSchema.statics.getUserTransactions = function(userId, options = {}) {
  const query = { userId };

  if (options.status) {
    query.status = options.status;
  }

  if (options.type) {
    query.type = options.type;
  }

  if (options.paymentGateway) {
    query.paymentGateway = options.paymentGateway;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 100)
    .skip(options.skip || 0)
    .populate('invoiceId');
};

// Static method to get failed transactions for retry
transactionSchema.statics.getFailedTransactions = function(maxRetries = 3) {
  return this.find({
    status: 'failed',
    retryCount: { $lt: maxRetries },
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
  }).sort({ createdAt: -1 });
};

// Static method to get transaction statistics
transactionSchema.statics.getTransactionStats = async function(userId = null, dateRange = {}) {
  const matchStage = {};

  if (userId) {
    matchStage.userId = new mongoose.Types.ObjectId(userId);
  }

  if (dateRange.start || dateRange.end) {
    matchStage.createdAt = {};
    if (dateRange.start) matchStage.createdAt.$gte = new Date(dateRange.start);
    if (dateRange.end) matchStage.createdAt.$lte = new Date(dateRange.end);
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          status: '$status',
          gateway: '$paymentGateway'
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalFees: { $sum: '$fee.total' },
        totalNet: { $sum: '$netAmount' },
        totalRefunded: { $sum: '$refundAmount' }
      }
    }
  ]);

  const result = {
    total: 0,
    completed: 0,
    failed: 0,
    pending: 0,
    refunded: 0,
    totalRevenue: 0,
    totalFees: 0,
    totalNet: 0,
    totalRefunded: 0,
    byGateway: {}
  };

  stats.forEach(stat => {
    result.total += stat.count;
    result[stat._id.status] = (result[stat._id.status] || 0) + stat.count;

    if (stat._id.status === 'completed') {
      result.totalRevenue += stat.totalAmount;
      result.totalFees += stat.totalFees;
      result.totalNet += stat.totalNet;
    }

    result.totalRefunded += stat.totalRefunded;

    if (!result.byGateway[stat._id.gateway]) {
      result.byGateway[stat._id.gateway] = {
        count: 0,
        amount: 0,
        fees: 0
      };
    }

    result.byGateway[stat._id.gateway].count += stat.count;
    result.byGateway[stat._id.gateway].amount += stat.totalAmount;
    result.byGateway[stat._id.gateway].fees += stat.totalFees;
  });

  return result;
};

// Static method to calculate gateway fees
transactionSchema.statics.calculateGatewayFee = function(amount, gateway, currency = 'SAR') {
  let feePercentage = 0;
  let fixedFee = 0;

  // Fee structures (these should be configured based on actual gateway pricing)
  if (gateway === 'stripe') {
    feePercentage = 2.9; // 2.9%
    fixedFee = currency === 'SAR' ? 1 : 0.30; // Fixed fee varies by currency
  } else if (gateway === 'moyasar') {
    feePercentage = 2.5; // 2.5% for Moyasar
    fixedFee = currency === 'SAR' ? 0 : 0; // No fixed fee for Moyasar
  }

  const percentageFee = (amount * feePercentage) / 100;
  const totalFee = percentageFee + fixedFee;

  return {
    gatewayFee: totalFee,
    platformFee: 0, // Can be configured if needed
    total: totalFee
  };
};

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
