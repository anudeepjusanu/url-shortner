const mongoose = require('mongoose');

const countryCodeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    minlength: 2,
    maxlength: 3
  },
  dialCode: {
    type: String,
    required: true,
    trim: true,
    match: [/^\+\d{1,4}$/, 'Dial code must start with + followed by 1-4 digits']
  },
  flag: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for fast lookups
countryCodeSchema.index({ isActive: 1, priority: -1, name: 1 });
countryCodeSchema.index({ code: 1 }, { unique: true });
countryCodeSchema.index({ dialCode: 1 });

module.exports = mongoose.model('CountryCode', countryCodeSchema);
