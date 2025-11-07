const mongoose = require('mongoose');

/**
 * QR Code Schema
 * Stores QR code generation data and customization options for URLs
 */
const qrCodeSchema = new mongoose.Schema({
  // Reference to the URL
  url: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Url',
    required: true,
    index: true
  },

  // Owner of the QR code
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // QR Code customization options
  options: {
    size: {
      type: Number,
      default: 300,
      min: 100,
      max: 2000
    },
    format: {
      type: String,
      enum: ['png', 'svg', 'pdf', 'jpg'],
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
    },
    logo: {
      type: String,
      default: null
    }
  },

  // Generated QR code data
  qrCodeData: {
    type: String, // Base64 encoded or URL
    default: null
  },

  // Download statistics
  downloadCount: {
    type: Number,
    default: 0
  },

  lastDownloadedAt: {
    type: Date,
    default: null
  },

  // Scan statistics (from URL clicks)
  scanCount: {
    type: Number,
    default: 0
  },

  lastScannedAt: {
    type: Date,
    default: null
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
qrCodeSchema.index({ creator: 1, createdAt: -1 });
qrCodeSchema.index({ url: 1 }, { unique: true });
qrCodeSchema.index({ isActive: 1 });

// Virtual for generating QR code URL
qrCodeSchema.virtual('qrCodeUrl').get(function() {
  // This will be populated by the service
  return this.qrCodeData;
});

// Update timestamp before save
qrCodeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Methods
qrCodeSchema.methods = {
  // Increment download count
  incrementDownloadCount: async function() {
    this.downloadCount += 1;
    this.lastDownloadedAt = new Date();
    return this.save();
  },

  // Increment scan count
  incrementScanCount: async function() {
    this.scanCount += 1;
    this.lastScannedAt = new Date();
    return this.save();
  },

  // Generate QR code URL for external service
  getQRCodeServiceUrl: function(shortUrl) {
    const { size, foregroundColor, backgroundColor } = this.options;
    const fgColor = foregroundColor.replace('#', '');
    const bgColor = backgroundColor.replace('#', '');
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(shortUrl)}&color=${fgColor}&bgcolor=${bgColor}`;
  }
};

// Static methods
qrCodeSchema.statics = {
  // Get QR codes for a user
  getUserQRCodes: async function(userId, options = {}) {
    const { page = 1, limit = 50, isActive } = options;
    const query = { creator: userId };

    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    const qrCodes = await this.find(query)
      .populate('url', 'shortCode originalUrl title domain clickCount')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await this.countDocuments(query);

    return {
      qrCodes,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  },

  // Get QR code statistics for a user
  getUserStats: async function(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, active, downloadsToday, totalScans] = await Promise.all([
      this.countDocuments({ creator: userId }),
      this.countDocuments({ creator: userId, isActive: true }),
      this.countDocuments({
        creator: userId,
        lastDownloadedAt: { $gte: today }
      }),
      this.aggregate([
        { $match: { creator: mongoose.Types.ObjectId(userId) } },
        { $group: { _id: null, totalScans: { $sum: '$scanCount' } } }
      ])
    ]);

    return {
      totalQRCodes: total,
      activeQRCodes: active,
      downloadsToday,
      totalScans: totalScans[0]?.totalScans || 0
    };
  },

  // Get or create QR code for URL
  getOrCreate: async function(urlId, userId, options = {}) {
    let qrCode = await this.findOne({ url: urlId, creator: userId });

    if (!qrCode) {
      qrCode = await this.create({
        url: urlId,
        creator: userId,
        options: {
          ...qrCode?.options,
          ...options
        }
      });
    }

    return qrCode;
  }
};

const QRCode = mongoose.model('QRCode', qrCodeSchema);

module.exports = QRCode;
