const mongoose = require('mongoose');
const { domainToASCII } = require('../utils/punycode');

const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: [true, 'Original URL is required'],
    trim: true,
    maxlength: [2048, 'URL cannot exceed 2048 characters']
  },
  shortCode: {
    type: String,
    required: [true, 'Short code is required'],
    unique: true,
    trim: true,
    match: [/^[\p{L}\p{N}_-]+$/u, 'Short code can only contain letters (any language), numbers, hyphens, and underscores']
  },
  customCode: {
    type: String,
    default: null,
    trim: true,
    sparse: true,
    match: [/^[\p{L}\p{N}_-]+$/u, 'Custom code can only contain letters (any language), numbers, hyphens, and underscores']
  },
    title: {
    type: String,
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  domain: {
    type: String,
    default: null,
    trim: true,
    lowercase: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  password: {
    type: String,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  },
  clickCount: {
    type: Number,
    default: 0
  },
  uniqueClickCount: {
    type: Number,
    default: 0
  },
  lastClickedAt: {
    type: Date,
    default: null
  },
  qrCode: {
    type: String,
    default: null
  },
  qrCodeGenerated: {
    type: Boolean,
    default: false
  },
  qrCodeGeneratedAt: {
    type: Date,
    default: null
  },
  qrCodeDownloads: {
    type: Number,
    default: 0
  },
  lastQRCodeDownload: {
    type: Date,
    default: null
  },
  // QR Scan tracking - separate from regular clicks
  qrScanCount: {
    type: Number,
    default: 0
  },
  uniqueQrScanCount: {
    type: Number,
    default: 0
  },
  lastQrScanAt: {
    type: Date,
    default: null
  },
  // Store QR customization settings
  qrCodeSettings: {
    size: {
      type: Number,
      default: 300
    },
    format: {
      type: String,
      enum: ['png', 'jpeg', 'jpg', 'gif', 'webp', 'svg', 'pdf'],
      default: 'png'
    },
    errorCorrection: {
      type: String,
      enum: ['L', 'M', 'Q', 'H'],
      default: 'M'
    },
    foregroundColor: {
      type: String,
      default: '#000000'
    },
    backgroundColor: {
      type: String,
      default: '#FFFFFF'
    },
    includeMargin: {
      type: Boolean,
      default: true
    }
  },
  metaData: {
    favicon: String,
    ogTitle: String,
    ogDescription: String,
    ogImage: String,
    ogType: String
  },
  utm: {
    source: String,
    medium: String,
    campaign: String,
    term: String,
    content: String
  },
  restrictions: {
    countries: [{
      type: String,
      uppercase: true,
      length: 2
    }],
    allowedCountries: {
      type: Boolean,
      default: true
    },
    deviceTypes: [{
      type: String,
      enum: ['mobile', 'tablet', 'desktop']
    }],
    maxClicks: {
      type: Number,
      default: null
    }
  },
  redirectType: {
    type: Number,
    enum: [301, 302, 307],
    default: 302
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  bulkImportId: {
    type: String,
    default: null
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

urlSchema.virtual('shortUrl').get(function() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const domain = this.domain || baseUrl;
  return `${domain}/${this.customCode || this.shortCode}`;
});

urlSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

urlSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiresAt) return null;
  const diff = this.expiresAt.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

urlSchema.pre('save', function(next) {
  // Convert international domains to Punycode for consistent storage
  if (this.isModified('domain') && this.domain) {
    try {
      this.domain = domainToASCII(this.domain.toLowerCase());
    } catch (error) {
      console.error('Error converting domain to ASCII:', error);
    }
  }

  // Auto-generate title from URL if not provided
  if (this.isNew && !this.title && this.originalUrl) {
    try {
      const url = new URL(this.originalUrl);
      this.title = url.hostname;
    } catch (error) {
      this.title = 'Untitled';
    }
  }
  next();
});

urlSchema.methods.incrementClick = async function(isUnique = false, isQrScan = false) {
  const update = {
    $inc: { clickCount: 1 },
    lastClickedAt: new Date()
  };

  if (isUnique) {
    update.$inc.uniqueClickCount = 1;
  }

  // Also increment QR scan count if this click came from a QR code
  if (isQrScan) {
    update.$inc.qrScanCount = 1;
    update.lastQrScanAt = new Date();
    if (isUnique) {
      update.$inc.uniqueQrScanCount = 1;
    }
  }

  return this.updateOne(update);
};

urlSchema.methods.isClickAllowed = function(country, deviceType) {
  if (!this.isActive || this.isExpired) return false;
  
  if (this.restrictions.maxClicks && this.clickCount >= this.restrictions.maxClicks) {
    return false;
  }
  
  if (this.restrictions.countries && this.restrictions.countries.length > 0) {
    const isCountryInList = this.restrictions.countries.includes(country?.toUpperCase());
    if (this.restrictions.allowedCountries && !isCountryInList) return false;
    if (!this.restrictions.allowedCountries && isCountryInList) return false;
  }
  
  if (this.restrictions.deviceTypes && this.restrictions.deviceTypes.length > 0) {
    if (!this.restrictions.deviceTypes.includes(deviceType)) return false;
  }
  
  return true;
};

urlSchema.methods.addUTMParameters = function() {
  if (!this.utm.source && !this.utm.medium && !this.utm.campaign) return this.originalUrl;
  
  try {
    const url = new URL(this.originalUrl);
    const params = url.searchParams;
    
    if (this.utm.source) params.set('utm_source', this.utm.source);
    if (this.utm.medium) params.set('utm_medium', this.utm.medium);
    if (this.utm.campaign) params.set('utm_campaign', this.utm.campaign);
    if (this.utm.term) params.set('utm_term', this.utm.term);
    if (this.utm.content) params.set('utm_content', this.utm.content);
    
    return url.toString();
  } catch (error) {
    return this.originalUrl;
  }
};

urlSchema.index({ shortCode: 1 }, { unique: true });
urlSchema.index({ customCode: 1 }, { unique: true, sparse: true });
urlSchema.index({ creator: 1 });
urlSchema.index({ organization: 1 });
urlSchema.index({ isActive: 1 });
urlSchema.index({ expiresAt: 1 });
urlSchema.index({ createdAt: -1 });
urlSchema.index({ tags: 1 });
urlSchema.index({ clickCount: -1 });
urlSchema.index({ domain: 1 });
// QR code related indexes
urlSchema.index({ qrCodeGenerated: 1 });
urlSchema.index({ qrScanCount: -1 });
urlSchema.index({ qrCodeGeneratedAt: -1 });

module.exports = mongoose.model('Url', urlSchema);