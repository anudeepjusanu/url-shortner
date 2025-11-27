const mongoose = require('mongoose');
const { domainToASCII, validateDomain } = require('../utils/punycode');

const domainSchema = new mongoose.Schema({
  domain: {
    type: String,
    required: [true, 'Domain name is required'],
    unique: true,
    lowercase: true,
    trim: true
    // Removed restrictive regex - validation now handled by custom validator
  },
  unicodeDomain: {
    type: String,
    trim: true,
    lowercase: true
    // Stores the original Unicode version (e.g., "مثال.com")
  },
  subdomain: {
    type: String,
    trim: true,
    lowercase: true,
    default: null
  },
  fullDomain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive', 'ssl_failed', 'verification_failed'],
    default: 'pending'
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'failed'],
    default: 'pending'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  cnameTarget: {
    type: String,
    required: true,
    default: 'laghhu.link'
  },
  verificationRecord: {
    type: {
      type: String,
      enum: ['CNAME', 'A', 'TXT'],
      default: 'CNAME'
    },
    name: String,
    value: String,
    verified: {
      type: Boolean,
      default: false
    },
    lastChecked: Date,
    nextCheck: Date
  },
  ssl: {
    enabled: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'failed', 'expired'],
      default: 'pending'
    },
    provider: {
      type: String,
      enum: ['letsencrypt', 'custom', 'cloudflare'],
      default: 'letsencrypt'
    },
    certificateId: String,
    expiresAt: Date,
    lastRenewal: Date,
    autoRenewal: {
      type: Boolean,
      default: true
    }
  },
  dnsProviders: [{
    name: String,
    detected: Boolean,
    lastChecked: Date
  }],
  statistics: {
    totalUrls: {
      type: Number,
      default: 0
    },
    totalClicks: {
      type: Number,
      default: 0
    },
    lastUrlCreated: Date,
    lastClick: Date
  },
  configuration: {
    redirectType: {
      type: Number,
      enum: [301, 302, 307],
      default: 302
    },
    allowWildcard: {
      type: Boolean,
      default: false
    },
    customErrorPage: String,
    customNotFoundPage: String,
    cors: {
      enabled: {
        type: Boolean,
        default: false
      },
      origins: [String],
      methods: [String]
    }
  },
  metadata: {
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters']
    }
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

domainSchema.virtual('isVerified').get(function() {
  return this.verificationStatus === 'verified' && this.verificationRecord.verified;
});

domainSchema.virtual('isActive').get(function() {
  return this.status === 'active' && this.isVerified;
});

domainSchema.virtual('sslActive').get(function() {
  return this.ssl.enabled && this.ssl.status === 'active';
});

domainSchema.virtual('shortUrl').get(function() {
  const protocol = this.sslActive ? 'https' : 'http';
  return `${protocol}://${this.fullDomain}`;
});

domainSchema.virtual('setupInstructions').get(function() {
  return {
    type: this.verificationRecord.type,
    name: this.verificationRecord.name || this.fullDomain,
    value: this.verificationRecord.value || this.cnameTarget,
    description: `Create a ${this.verificationRecord.type} record for ${this.fullDomain} pointing to ${this.cnameTarget}`
  };
});

// Pre-save hook to convert international domains to Punycode
domainSchema.pre('save', function(next) {
  // Store original Unicode domain before conversion
  if (this.isModified('domain') || this.isNew) {
    const originalDomain = this.domain;

    // Validate the domain
    const validation = validateDomain(originalDomain);
    if (!validation.isValid) {
      return next(new Error(validation.message));
    }

    // Store Unicode version for display purposes
    this.unicodeDomain = validation.unicodeDomain || originalDomain;

    // Convert to ASCII (Punycode) for storage and DNS compatibility
    this.domain = validation.normalizedDomain || domainToASCII(originalDomain);
  }

  // Handle subdomain conversion too
  if (this.isModified('subdomain') && this.subdomain) {
    this.subdomain = domainToASCII(this.subdomain);
  }

  if (this.subdomain && this.domain) {
    this.fullDomain = `${this.subdomain}.${this.domain}`;
  } else if (!this.subdomain && this.domain) {
    this.fullDomain = this.domain;
  }

  if (!this.verificationRecord.name) {
    this.verificationRecord.name = this.fullDomain;
  }

  if (!this.verificationRecord.value) {
    this.verificationRecord.value = this.cnameTarget;
  }

  if (this.metadata && !this.metadata.addedBy) {
    this.metadata.addedBy = this.owner;
  }

  next();
});

domainSchema.pre('save', async function(next) {
  if (this.isNew && this.isDefault) {
    await this.constructor.updateMany(
      {
        owner: this.owner,
        _id: { $ne: this._id }
      },
      { isDefault: false }
    );
  }
  next();
});

domainSchema.methods.setAsDefault = async function() {
  await this.constructor.updateMany(
    {
      owner: this.owner,
      _id: { $ne: this._id }
    },
    { isDefault: false }
  );

  this.isDefault = true;
  return this.save();
};

domainSchema.methods.updateStatistics = async function(urlCount = 0, clickCount = 0) {
  const update = {
    $inc: {
      'statistics.totalUrls': urlCount,
      'statistics.totalClicks': clickCount
    }
  };

  if (urlCount > 0) {
    update.$set = { 'statistics.lastUrlCreated': new Date() };
  }

  if (clickCount > 0) {
    update.$set = { ...update.$set, 'statistics.lastClick': new Date() };
  }

  return this.updateOne(update);
};

domainSchema.methods.markAsVerified = function(verifiedBy) {
  this.verificationStatus = 'verified';
  this.verificationRecord.verified = true;
  this.status = 'active';
  this.metadata.verifiedBy = verifiedBy;
  this.metadata.verifiedAt = new Date();
  return this.save();
};

domainSchema.methods.markVerificationFailed = function(reason) {
  this.verificationStatus = 'failed';
  this.verificationRecord.verified = false;
  this.status = 'verification_failed';
  this.verificationRecord.lastChecked = new Date();
  this.verificationRecord.nextCheck = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  if (reason) {
    this.metadata.notes = reason;
  }
  return this.save();
};

domainSchema.statics.getUserDomains = function(userId, organizationId = null) {
  const filter = { owner: userId };

  if (organizationId) {
    filter.$or = [
      { owner: userId },
      { organization: organizationId }
    ];
  }

  return this.find(filter)
    .populate('owner', 'firstName lastName email')
    .populate('organization', 'name slug')
    .populate('metadata.addedBy', 'firstName lastName email')
    .populate('metadata.verifiedBy', 'firstName lastName email')
    .sort({ isDefault: -1, createdAt: -1 });
};

domainSchema.statics.getDefaultDomain = function(userId, organizationId = null) {
  const filter = {
    owner: userId,
    isDefault: true,
    status: 'active'
  };

  if (organizationId) {
    filter.$or = [
      { owner: userId },
      { organization: organizationId }
    ];
  }

  return this.findOne(filter);
};

domainSchema.index({ domain: 1 });
domainSchema.index({ fullDomain: 1 }, { unique: true });
domainSchema.index({ owner: 1 });
domainSchema.index({ organization: 1 });
domainSchema.index({ status: 1 });
domainSchema.index({ verificationStatus: 1 });
domainSchema.index({ isDefault: 1 });
domainSchema.index({ 'verificationRecord.nextCheck': 1 });
domainSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Domain', domainSchema);