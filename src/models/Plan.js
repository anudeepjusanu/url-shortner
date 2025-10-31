const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['free', 'pro', 'enterprise']
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    monthly: {
      type: Number,
      required: true,
      default: 0
    },
    yearly: {
      type: Number,
      required: true,
      default: 0
    }
  },
  features: {
    urlsPerMonth: {
      type: Number,
      default: -1 // -1 means unlimited
    },
    customDomains: {
      type: Number,
      default: 0
    },
    analytics: {
      type: String,
      enum: ['basic', 'advanced', 'enterprise'],
      default: 'basic'
    },
    apiAccess: {
      type: Boolean,
      default: false
    },
    bulkOperations: {
      type: Boolean,
      default: false
    },
    passwordProtection: {
      type: Boolean,
      default: false
    },
    teamMembers: {
      type: Number,
      default: 1
    },
    support: {
      type: String,
      enum: ['community', 'standard', 'priority', 'dedicated'],
      default: 'community'
    },
    whiteLabel: {
      type: Boolean,
      default: false
    }
  },
  stripePriceId: {
    monthly: String,
    yearly: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for checking if plan is free
planSchema.virtual('isFree').get(function() {
  return this.name === 'free';
});

// Method to check if user can perform action
planSchema.methods.canPerformAction = function(action, currentUsage = {}) {
  switch (action) {
    case 'createUrl':
      if (this.features.urlsPerMonth === -1) return true;
      return (currentUsage.urlsThisMonth || 0) < this.features.urlsPerMonth;

    case 'addCustomDomain':
      return (currentUsage.customDomains || 0) < this.features.customDomains;

    case 'useApi':
      return this.features.apiAccess;

    case 'bulkOperations':
      return this.features.bulkOperations;

    case 'passwordProtection':
      return this.features.passwordProtection;

    default:
      return true;
  }
};

// Static method to get plan by name
planSchema.statics.getByName = function(name) {
  return this.findOne({ name: name.toLowerCase(), isActive: true });
};

// Static method to get all active plans
planSchema.statics.getActivePlans = function() {
  return this.find({ isActive: true }).sort({ 'price.monthly': 1 });
};

// Static method to get all plans (alias for consistency)
planSchema.statics.getAllPlans = function() {
  return this.getActivePlans();
};

module.exports = mongoose.model('Plan', planSchema);