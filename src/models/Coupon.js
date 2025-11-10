const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  maxDiscount: {
    type: Number, // Maximum discount amount for percentage coupons
    default: null
  },
  validFor: {
    type: [String],
    enum: ['free', 'pro', 'enterprise'],
    default: ['pro', 'enterprise']
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  maxUses: {
    type: Number,
    default: null // null means unlimited
  },
  usedCount: {
    type: Number,
    default: 0
  },
  maxUsesPerUser: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  stripeCouponId: String,
  metadata: {
    campaign: String,
    source: String
  },
  usedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    usedAt: {
      type: Date,
      default: Date.now
    },
    subscription: String
  }]
}, {
  timestamps: true
});

// Indexes
couponSchema.index({ code: 1 });
couponSchema.index({ validUntil: 1 });
couponSchema.index({ isActive: 1 });

// Virtual to check if coupon is valid
couponSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.isActive &&
         now >= this.validFrom &&
         now <= this.validUntil &&
         (this.maxUses === null || this.usedCount < this.maxUses);
});

// Method to validate coupon for a user and plan
couponSchema.methods.validateForUser = async function(userId, planName) {
  // Check if coupon is valid
  if (!this.isValid) {
    throw new Error('Coupon is not valid or has expired');
  }

  // Check if plan is valid for this coupon
  if (!this.validFor.includes(planName)) {
    throw new Error(`Coupon is not valid for the ${planName} plan`);
  }

  // Check per-user usage limit
  const userUsage = this.usedBy.filter(u => u.user.toString() === userId.toString()).length;
  if (userUsage >= this.maxUsesPerUser) {
    throw new Error('You have already used this coupon the maximum number of times');
  }

  return true;
};

// Method to apply coupon
couponSchema.methods.applyCoupon = async function(userId, subscriptionId) {
  await this.validateForUser(userId);

  // Add to used by list
  this.usedBy.push({
    user: userId,
    subscription: subscriptionId,
    usedAt: new Date()
  });

  // Increment used count
  this.usedCount += 1;

  await this.save();

  return this;
};

// Static method to find valid coupon
couponSchema.statics.findValidCoupon = async function(code) {
  const coupon = await this.findOne({
    code: code.toUpperCase(),
    isActive: true,
    validFrom: { $lte: new Date() },
    validUntil: { $gte: new Date() }
  });

  if (!coupon) {
    throw new Error('Invalid or expired coupon code');
  }

  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    throw new Error('Coupon has reached its maximum usage limit');
  }

  return coupon;
};

// Calculate discount amount
couponSchema.methods.calculateDiscount = function(price) {
  if (this.discountType === 'percentage') {
    const discount = price * (this.discountValue / 100);
    return this.maxDiscount ? Math.min(discount, this.maxDiscount) : discount;
  } else {
    return Math.min(this.discountValue, price);
  }
};

module.exports = mongoose.model('Coupon', couponSchema);
