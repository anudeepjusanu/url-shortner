const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  // Invoice identification
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
    // Format: INV-YYYYMM-00001
    match: /^INV-\d{6}-\d{5}$/
  },

  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Subscription/Transaction reference
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // References user.subscription
  },

  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },

  // Invoice status
  status: {
    type: String,
    enum: ['draft', 'pending', 'paid', 'partially_paid', 'overdue', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },

  // Billing information
  billingInfo: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    company: String,
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: {
        type: String,
        default: 'SA' // Saudi Arabia
      }
    },
    taxId: String, // VAT registration number
    phone: String
  },

  // Line items
  items: [{
    description: {
      type: String,
      required: true
    },
    planName: String, // e.g., "Pro Plan", "Enterprise Plan"
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 0
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100 // Percentage
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    }
  }],

  // Financial calculations
  currency: {
    type: String,
    required: true,
    enum: ['SAR', 'USD', 'AED', 'EUR', 'KWD', 'BHD', 'OMR'],
    default: 'SAR'
  },

  subtotal: {
    type: Number,
    required: true,
    min: 0
  },

  // Tax information (Saudi Arabia VAT)
  tax: {
    rate: {
      type: Number,
      default: 15, // 15% VAT in Saudi Arabia
      min: 0,
      max: 100
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    }
  },

  discount: {
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    value: {
      type: Number,
      default: 0,
      min: 0
    },
    amount: {
      type: Number,
      default: 0,
      min: 0
    },
    code: String // Discount/promo code if applicable
  },

  total: {
    type: Number,
    required: true,
    min: 0
  },

  // Payment tracking
  amountPaid: {
    type: Number,
    default: 0,
    min: 0
  },

  amountDue: {
    type: Number,
    required: true,
    min: 0
  },

  // Payment gateway information
  paymentGateway: {
    type: String,
    enum: ['stripe', 'moyasar', 'manual', 'other'],
    required: true
  },

  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'bank_transfer', 'mada', 'stcpay', 'apple_pay', 'other']
  },

  // Payment dates
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },

  dueDate: {
    type: Date,
    required: true
  },

  paidDate: Date,

  // Billing period
  billingPeriod: {
    start: Date,
    end: Date
  },

  // PDF generation
  pdfGenerated: {
    type: Boolean,
    default: false
  },

  pdfUrl: String,

  pdfGeneratedAt: Date,

  // Notes and metadata
  notes: String,

  internalNotes: String, // For admin use only

  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },

  // Email tracking
  emailSent: {
    type: Boolean,
    default: false
  },

  emailSentAt: Date,

  emailSentTo: [String],

  // Audit trail
  createdBy: {
    type: String,
    default: 'system'
  },

  updatedBy: String,

  cancelledBy: String,

  cancelledAt: Date,

  cancellationReason: String

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
invoiceSchema.index({ userId: 1, createdAt: -1 });
invoiceSchema.index({ status: 1, dueDate: 1 });
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ 'billingInfo.email': 1 });

// Virtual for invoice age (days since issue)
invoiceSchema.virtual('ageInDays').get(function() {
  if (!this.issueDate) return 0;
  const now = new Date();
  const diff = now - this.issueDate;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

// Virtual for overdue status
invoiceSchema.virtual('isOverdue').get(function() {
  if (this.status === 'paid' || this.status === 'cancelled') return false;
  if (!this.dueDate) return false;
  return new Date() > this.dueDate;
});

// Pre-save middleware to generate invoice number
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    this.invoiceNumber = await generateInvoiceNumber();
  }

  // Calculate item subtotals
  if (this.items && this.items.length > 0) {
    this.items.forEach(item => {
      const discountAmount = (item.unitPrice * item.quantity * item.discount) / 100;
      item.subtotal = (item.unitPrice * item.quantity) - discountAmount;
    });

    // Calculate invoice subtotal
    this.subtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0);
  }

  // Calculate discount amount
  if (this.discount && this.discount.value > 0) {
    if (this.discount.type === 'percentage') {
      this.discount.amount = (this.subtotal * this.discount.value) / 100;
    } else {
      this.discount.amount = this.discount.value;
    }
  }

  // Calculate tax
  const taxableAmount = this.subtotal - (this.discount?.amount || 0);
  this.tax.amount = (taxableAmount * this.tax.rate) / 100;

  // Calculate total
  this.total = taxableAmount + this.tax.amount;

  // Calculate amount due
  this.amountDue = this.total - (this.amountPaid || 0);

  // Update status based on payment
  if (this.amountPaid >= this.total) {
    this.status = 'paid';
    if (!this.paidDate) {
      this.paidDate = new Date();
    }
  } else if (this.amountPaid > 0) {
    this.status = 'partially_paid';
  } else if (this.isOverdue && this.status === 'pending') {
    this.status = 'overdue';
  }

  next();
});

// Static method to generate invoice number
async function generateInvoiceNumber() {
  const now = new Date();
  const yearMonth = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0');

  // Find the last invoice for this month
  const lastInvoice = await mongoose.model('Invoice').findOne({
    invoiceNumber: new RegExp(`^INV-${yearMonth}-`)
  }).sort({ invoiceNumber: -1 });

  let sequence = 1;
  if (lastInvoice) {
    const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
    sequence = lastSequence + 1;
  }

  return `INV-${yearMonth}-${sequence.toString().padStart(5, '0')}`;
}

// Instance method to mark as paid
invoiceSchema.methods.markAsPaid = function(paymentAmount, paymentDate = new Date()) {
  this.amountPaid += paymentAmount;
  if (this.amountPaid >= this.total) {
    this.status = 'paid';
    this.paidDate = paymentDate;
    this.amountDue = 0;
  } else {
    this.status = 'partially_paid';
    this.amountDue = this.total - this.amountPaid;
  }
  return this.save();
};

// Instance method to cancel invoice
invoiceSchema.methods.cancel = function(reason, cancelledBy = 'system') {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancelledBy = cancelledBy;
  this.cancellationReason = reason;
  return this.save();
};

// Instance method to send invoice email
invoiceSchema.methods.markEmailSent = function(recipients) {
  this.emailSent = true;
  this.emailSentAt = new Date();
  this.emailSentTo = Array.isArray(recipients) ? recipients : [recipients];
  return this.save();
};

// Static method to get overdue invoices
invoiceSchema.statics.getOverdueInvoices = function() {
  const now = new Date();
  return this.find({
    status: { $in: ['pending', 'partially_paid'] },
    dueDate: { $lt: now }
  }).populate('userId', 'email name');
};

// Static method to get user invoices
invoiceSchema.statics.getUserInvoices = function(userId, options = {}) {
  const query = { userId };

  if (options.status) {
    query.status = options.status;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 100)
    .skip(options.skip || 0);
};

// Static method to get invoice statistics
invoiceSchema.statics.getInvoiceStats = async function(userId = null) {
  const matchStage = userId ? { userId: new mongoose.Types.ObjectId(userId) } : {};

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$total' },
        totalPaid: { $sum: '$amountPaid' },
        totalDue: { $sum: '$amountDue' }
      }
    }
  ]);

  const result = {
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    cancelled: 0,
    totalRevenue: 0,
    totalOutstanding: 0
  };

  stats.forEach(stat => {
    result.total += stat.count;
    result[stat._id] = stat.count;
    if (stat._id === 'paid') {
      result.totalRevenue = stat.totalPaid;
    }
    if (stat._id === 'pending' || stat._id === 'partially_paid' || stat._id === 'overdue') {
      result.totalOutstanding += stat.totalDue;
    }
  });

  return result;
};

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;
