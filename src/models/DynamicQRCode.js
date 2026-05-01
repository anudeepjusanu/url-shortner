const mongoose = require('mongoose');
const crypto = require('crypto');

const destinationHistorySchema = new mongoose.Schema(
  {
    url: { type: String, required: true, maxlength: 2048 },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { _id: false }
);

const dynamicQRCodeSchema = new mongoose.Schema(
  {
    // Permanent code encoded into the QR image — never changes
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      minlength: 6,
      maxlength: 20
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    // The URL scans are redirected to — this is what "dynamic" means
    destinationUrl: {
      type: String,
      required: true,
      maxlength: 2048
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    customization: {
      size: { type: Number, default: 300, min: 100, max: 2000 },
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
      includeMargin: { type: Boolean, default: true },
      logo: { type: String, default: null }
    },
    scanCount: { type: Number, default: 0 },
    uniqueScanCount: { type: Number, default: 0 },
    lastScannedAt: { type: Date, default: null },
    // Audit trail of destination changes
    destinationHistory: {
      type: [destinationHistorySchema],
      default: []
    },
    // Cached QR image as data URL; regenerated when customization changes
    qrCodeData: { type: String, default: null }
  },
  { timestamps: true }
);

dynamicQRCodeSchema.index({ creator: 1, createdAt: -1 });
dynamicQRCodeSchema.index({ organization: 1 });
dynamicQRCodeSchema.index({ scanCount: -1 });

// Generate a unique 8-char alphanumeric code using crypto
dynamicQRCodeSchema.statics.generateUniqueCode = async function () {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const length = 8;

  for (let attempt = 0; attempt < 10; attempt++) {
    const bytes = crypto.randomBytes(length);
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars[bytes[i] % chars.length];
    }

    const exists = await this.findOne({ code });
    if (!exists) return code;
  }

  throw new Error('Failed to generate a unique code after 10 attempts');
};

dynamicQRCodeSchema.methods.incrementScan = async function (isUnique = false) {
  const inc = { scanCount: 1 };
  if (isUnique) inc.uniqueScanCount = 1;
  return this.updateOne({ $inc: inc, $set: { lastScannedAt: new Date() } });
};

module.exports = mongoose.model('DynamicQRCode', dynamicQRCodeSchema);
