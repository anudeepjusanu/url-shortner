const mongoose = require('mongoose');
const crypto = require('crypto');

const screenMappingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },       // e.g. 'product'
    path: { type: String, required: true, trim: true },       // e.g. '/products/:id'
    params: [{ key: String, description: String }]            // param keys the screen expects
  },
  { _id: false }
);

const appRegistrationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'App name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },

    // iOS
    bundleId: { type: String, trim: true, default: null },     // e.g. com.company.appname
    iosStoreUrl: { type: String, trim: true, default: null },  // App Store link

    // Android
    packageName: { type: String, trim: true, default: null },         // e.g. com.company.appname
    sha256Fingerprint: { type: String, trim: true, default: null },   // signing cert SHA-256
    androidStoreUrl: { type: String, trim: true, default: null },     // Play Store link

    // Default fallback for desktop / in-app browsers
    webFallbackUrl: {
      type: String,
      required: [true, 'Web fallback URL is required'],
      trim: true
    },

    screenMappings: { type: [screenMappingSchema], default: [] },

    // Bearer token used by the mobile SDK and POST /api/v1/deferred-link
    apiKey: {
      type: String,
      unique: true,
      index: true
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
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Auto-generate API key on first save
appRegistrationSchema.pre('save', function (next) {
  if (this.isNew && !this.apiKey) {
    this.apiKey = crypto.randomBytes(24).toString('hex');
  }
  next();
});

appRegistrationSchema.index({ creator: 1, createdAt: -1 });
appRegistrationSchema.index({ organization: 1 });

module.exports = mongoose.model('AppRegistration', appRegistrationSchema);
