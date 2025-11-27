const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema({
  url: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Url',
    required: true,
    index: true
  },
  shortCode: {
    type: String,
    required: true,
    index: true
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
  // QR Code customization settings
  customization: {
    size: {
      type: Number,
      default: 300,
      min: 100,
      max: 2000
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
      default: '#000000',
      match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    },
    backgroundColor: {
      type: String,
      default: '#FFFFFF',
      match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
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
  // QR Code statistics
  scanCount: {
    type: Number,
    default: 0
  },
  uniqueScanCount: {
    type: Number,
    default: 0
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  lastScannedAt: {
    type: Date,
    default: null
  },
  lastDownloadedAt: {
    type: Date,
    default: null
  },
  // QR Code data/image
  qrCodeData: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
qrCodeSchema.index({ url: 1, creator: 1 });
qrCodeSchema.index({ shortCode: 1 });
qrCodeSchema.index({ creator: 1, createdAt: -1 });
qrCodeSchema.index({ organization: 1 });
qrCodeSchema.index({ scanCount: -1 });

// Method to increment scan count
qrCodeSchema.methods.incrementScan = async function(isUnique = false) {
  const update = {
    $inc: { scanCount: 1 },
    lastScannedAt: new Date()
  };

  if (isUnique) {
    update.$inc.uniqueScanCount = 1;
  }

  return this.updateOne(update);
};

// Method to increment download count
qrCodeSchema.methods.incrementDownload = async function() {
  return this.updateOne({
    $inc: { downloadCount: 1 },
    lastDownloadedAt: new Date()
  });
};

// Static method to get QR code by URL ID
qrCodeSchema.statics.findByUrl = async function(urlId) {
  return this.findOne({ url: urlId, isActive: true });
};

// Static method to get or create QR code
qrCodeSchema.statics.getOrCreate = async function(urlData, customization, creator, organization) {
  let qrCode = await this.findOne({ url: urlData._id });

  if (!qrCode) {
    qrCode = new this({
      url: urlData._id,
      shortCode: urlData.shortCode,
      creator: creator,
      organization: organization,
      customization: customization
    });
    await qrCode.save();
  } else {
    // Update customization if provided
    if (customization) {
      qrCode.customization = { ...qrCode.customization, ...customization };
      await qrCode.save();
    }
  }

  return qrCode;
};

module.exports = mongoose.model('QRCode', qrCodeSchema);
