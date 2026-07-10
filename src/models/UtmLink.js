const mongoose = require('mongoose');

const utmLinkSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
    },
    name: { type: String, trim: true, default: null },
    destinationUrl: { type: String, required: true, trim: true },
    utmSource: { type: String, trim: true, default: null },
    utmMedium: { type: String, trim: true, default: null },
    utmCampaign: { type: String, trim: true, default: null },
    utmTerm: { type: String, trim: true, default: null },
    utmContent: { type: String, trim: true, default: null },
    fullTaggedUrl: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

utmLinkSchema.index({ creator: 1, createdAt: -1 });

module.exports = mongoose.model('UtmLink', utmLinkSchema);
