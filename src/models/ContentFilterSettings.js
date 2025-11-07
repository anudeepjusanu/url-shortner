const mongoose = require('mongoose');

/**
 * Content Filter Settings Schema
 * Stores user-specific content filtering preferences
 */
const contentFilterSettingsSchema = new mongoose.Schema({
  // User reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },

  // Filter settings
  enableContentFilter: {
    type: Boolean,
    default: true
  },

  blockMaliciousUrls: {
    type: Boolean,
    default: true
  },

  blockPhishing: {
    type: Boolean,
    default: true
  },

  blockAdultContent: {
    type: Boolean,
    default: false
  },

  blockSpam: {
    type: Boolean,
    default: true
  },

  customKeywordFiltering: {
    type: Boolean,
    default: true
  },

  pdplCompliance: {
    type: Boolean,
    default: true
  },

  // Advanced settings
  enableWhitelist: {
    type: Boolean,
    default: true
  },

  strictMode: {
    type: Boolean,
    default: false
  },

  // Notification settings
  notifyOnBlock: {
    type: Boolean,
    default: true
  },

  // Statistics
  totalFiltered: {
    type: Number,
    default: 0
  },

  lastFilteredAt: {
    type: Date,
    default: null
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update timestamp before save
contentFilterSettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Methods
contentFilterSettingsSchema.methods = {
  // Increment filter count
  incrementFilterCount: async function() {
    this.totalFiltered += 1;
    this.lastFilteredAt = new Date();
    return this.save();
  },

  // Check if filtering is enabled
  isFilteringEnabled: function() {
    return this.enableContentFilter;
  },

  // Get active filters
  getActiveFilters: function() {
    const filters = [];
    if (this.blockMaliciousUrls) filters.push('malicious');
    if (this.blockPhishing) filters.push('phishing');
    if (this.blockAdultContent) filters.push('adult');
    if (this.blockSpam) filters.push('spam');
    if (this.customKeywordFiltering) filters.push('keyword');
    return filters;
  }
};

// Static methods
contentFilterSettingsSchema.statics = {
  // Get or create settings for user
  getOrCreate: async function(userId) {
    let settings = await this.findOne({ user: userId });

    if (!settings) {
      settings = await this.create({
        user: userId
      });
    }

    return settings;
  },

  // Get settings for user
  getUserSettings: async function(userId) {
    return this.findOne({ user: userId });
  }
};

const ContentFilterSettings = mongoose.model('ContentFilterSettings', contentFilterSettingsSchema);

module.exports = ContentFilterSettings;
