const mongoose = require('mongoose');

const LinkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Link title is required'],
    trim: true,
    maxlength: [100, 'Title must be at most 100 characters'],
  },
  url: {
    type: String,
    required: [true, 'Link URL is required'],
    trim: true,
  },
  icon: {
    type: String,
    default: '',
    maxlength: [10, 'Icon must be at most 10 characters'],
  },
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  clickCount: {
    type: Number,
    default: 0,
  },
});

const ThemeSchema = new mongoose.Schema(
  {
    backgroundColor: { type: String, default: '#ffffff' },
    backgroundGradient: { type: String, default: '' },
    buttonColor: { type: String, default: '#3b82f6' },
    buttonTextColor: { type: String, default: '#ffffff' },
    buttonStyle: {
      type: String,
      enum: ['rounded', 'square', 'pill'],
      default: 'pill',
    },
    buttonVariant: {
      type: String,
      enum: ['solid', 'outline', 'ghost'],
      default: 'solid',
    },
    backgroundImage: { type: String, default: '' },
    backgroundImageOpacity: { type: Number, default: 0.15, min: 0, max: 1 },
    textColor: { type: String, default: '#111827' },
    secondaryTextColor: { type: String, default: '#6b7280' },
    fontFamily: { type: String, default: 'Inter' },
    preset: { type: String, default: 'default' },
  },
  { _id: false }
);

const SocialLinksSchema = new mongoose.Schema(
  {
    instagram: { type: String, default: '' },
    twitter: { type: String, default: '' },
    tiktok: { type: String, default: '' },
    youtube: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    facebook: { type: String, default: '' },
    website: { type: String, default: '' },
  },
  { _id: false }
);

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
    theme: {
      type: ThemeSchema,
      default: () => ({}),
    },
    links: {
      type: [LinkSchema],
      default: [],
      validate: {
        validator: (links) => links.length <= 50,
        message: 'A bio page can have a maximum of 50 links',
      },
    },
    socialLinks: {
      type: SocialLinksSchema,
      default: () => ({}),
    },
    socialLinkImages: {
      type: Map,
      of: String,
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
  },
  { timestamps: true }
);

BioPageSchema.index({ owner: 1, isActive: 1 });

BioPageSchema.virtual('totalLinkClicks').get(function () {
  return this.links.reduce((sum, link) => sum + (link.clickCount || 0), 0);
});

BioPageSchema.virtual('publicUrl').get(function () {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${baseUrl}/#/bio/${this.username}`;
});

BioPageSchema.set('toJSON', { virtuals: true });
BioPageSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('BioPage', BioPageSchema);
