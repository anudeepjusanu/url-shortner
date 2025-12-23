const mongoose = require('mongoose');

const linkBundleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9-_]+$/,
    minlength: 3,
    maxlength: 50,
    index: true
  },
  color: {
    type: String,
    default: '#3B82F6',
    match: /^#[0-9A-Fa-f]{6}$/
  },
  icon: {
    type: String,
    default: 'folder'
  },
  links: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Url'
  }],
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  analytics: {
    totalClicks: {
      type: Number,
      default: 0
    },
    totalLinks: {
      type: Number,
      default: 0
    },
    lastClickedAt: {
      type: Date,
      default: null
    }
  },
  settings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    allowExport: {
      type: Boolean,
      default: true
    },
    notifyOnClick: {
      type: Boolean,
      default: false
    }
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['view', 'edit', 'admin'],
      default: 'view'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
linkBundleSchema.virtual('linkCount').get(function() {
  return this.links.length;
});

// Indexes
linkBundleSchema.index({ user: 1, createdAt: -1 });
linkBundleSchema.index({ slug: 1 }, { unique: true });
linkBundleSchema.index({ tags: 1 });
linkBundleSchema.index({ 'settings.isPublic': 1 });

// Methods
linkBundleSchema.methods.addLink = async function(linkId) {
  if (!this.links.includes(linkId)) {
    this.links.push(linkId);
    this.analytics.totalLinks = this.links.length;
    await this.save();
  }
};

linkBundleSchema.methods.removeLink = async function(linkId) {
  this.links = this.links.filter(id => id.toString() !== linkId.toString());
  this.analytics.totalLinks = this.links.length;
  await this.save();
};

linkBundleSchema.methods.updateAnalytics = async function(clicks) {
  this.analytics.totalClicks += clicks;
  this.analytics.lastClickedAt = new Date();
  await this.save();
};

linkBundleSchema.methods.shareWithUser = async function(userId, permission = 'view') {
  const existing = this.sharedWith.find(s => s.user.toString() === userId.toString());
  if (!existing) {
    this.sharedWith.push({ user: userId, permission });
    await this.save();
  }
};

// Static methods
linkBundleSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug: slug.toLowerCase() }).populate('links');
};

linkBundleSchema.statics.isSlugAvailable = async function(slug, excludeId = null) {
  const query = { slug: slug.toLowerCase() };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const existing = await this.findOne(query);
  return !existing;
};

module.exports = mongoose.model('LinkBundle', linkBundleSchema);
