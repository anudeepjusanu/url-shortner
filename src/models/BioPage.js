const mongoose = require('mongoose');

const BioPageSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must be at most 30 characters'],
      match: [
        /^[a-z0-9][a-z0-9._-]*[a-z0-9]$|^[a-z0-9]{2,}$/,
        'Username can only contain lowercase letters, numbers, dots, underscores, and hyphens',
      ],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title must be at most 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description must be at most 300 characters'],
      default: '',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // New blocks-based content (array of BioBlock objects from the enhanced editor)
    blocks: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
    // Design settings from the wizard (draft design preferences)
    design: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // Enhanced theme object (BioTheme from bioThemes.ts)
    bioTheme: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // Per-block click counts: blockId -> count
    blockClickCounts: {
      type: Map,
      of: Number,
      default: () => ({}),
    },
    totalViews: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Style quiz answers — used for theme suggestions
    quizPurpose: {
      type: String,
      enum: ['personal', 'business', 'creator', 'portfolio', 'other', null],
      default: null,
    },
    quizIndustry: {
      type: String,
      enum: ['fashion', 'entertainment', 'business', 'education', 'food', 'health', 'tech', 'art', 'other', null],
      default: null,
    },
  },
  { timestamps: true }
);

BioPageSchema.index({ owner: 1, isActive: 1 });

BioPageSchema.virtual('publicUrl').get(function () {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${baseUrl}/bio/${this.username}`;
});

BioPageSchema.set('toJSON', { virtuals: true });
BioPageSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('BioPage', BioPageSchema);
