const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stripePaymentMethodId: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['card', 'bank_account', 'paypal'],
    default: 'card'
  },
  card: {
    brand: String,
    last4: String,
    expMonth: Number,
    expYear: Number,
    fingerprint: String
  },
  billing: {
    name: String,
    email: String,
    phone: String,
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    }
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsed: Date
}, {
  timestamps: true
});

// Indexes
paymentMethodSchema.index({ user: 1 });
paymentMethodSchema.index({ stripePaymentMethodId: 1 });
paymentMethodSchema.index({ isDefault: 1, user: 1 });

// Ensure only one default payment method per user
paymentMethodSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    // Set all other payment methods for this user to not default
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

// Method to mark as used
paymentMethodSchema.methods.markAsUsed = function() {
  this.lastUsed = new Date();
  return this.save();
};

// Static method to get default payment method
paymentMethodSchema.statics.getDefaultForUser = function(userId) {
  return this.findOne({ user: userId, isDefault: true, isActive: true });
};

// Static method to get all payment methods for user
paymentMethodSchema.statics.getAllForUser = function(userId) {
  return this.find({ user: userId, isActive: true }).sort({ isDefault: -1, createdAt: -1 });
};

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
