const mongoose = require('mongoose');

const bioLinkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    default: 'link'
  },
  enabled: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  },
  thumbnail: {
    type: String,
    default: null
  },
  animation: {
    type: String,
    enum: ['none', 'fade', 'slide', 'bounce', 'pulse'],
    default: 'none'
  }
}, { _id: true });

const bioPageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9-_]+$/,
    minlength: 3,
    maxlength: 50,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 500
  },
  profileImage: {
    type: String,
    default: null
  },
  coverImage: {
    type: String,
    default: null
  },
  theme: {
    layout: {
      type: String,
      enum: ['classic', 'modern', 'minimal', 'card', 'gradient'],
      default: 'classic'
    },
    backgroundColor: {
      type: String,
      default: '#ffffff'
    },
    backgroundGradient: {
      enabled: {
        type: Boolean,
        default: false
      },
      startColor: {
        type: String,
        default: '#667eea'
      },
      endColor: {
        type: String,
        default: '#764ba2'
      },
      direction: {
        type: String,
        enum: ['to-top', 'to-bottom', 'to-left', 'to-right', 'to-top-right', 'to-bottom-right'],
        default: 'to-bottom'
      }
    },
    textColor: {
      type: String,
      default: '#000000'
    },
    buttonStyle: {
      type: String,
      enum: ['fill', 'outline', 'shadow', 'rounded', 'square'],
      default: 'fill'
    },
    buttonColor: {
      type: String,
      default: '#3B82F6'
    },
    buttonTextColor: {
      type: String,
      default: '#ffffff'
    },
    fontFamily: {
      type: String,
      enum: ['inter', 'roboto', 'poppins', 'montserrat', 'playfair', 'lato'],
      default: 'inter'
    },
    borderRadius: {
      type: Number,
      default: 8,
      min: 0,
      max: 50
    },
    customCSS: {
      type: String,
      maxlength: 5000
    }
  },
  links: [bioLinkSchema],
  socialLinks: {
    twitter: String,
    instagram: String,
    facebook: String,
    linkedin: String,
    youtube: String,
    tiktok: String,
    github: String,
    website: String
  },
  seo: {
    metaTitle: {
      type: String,
      maxlength: 60
    },
    metaDescription: {
      type: String,
      maxlength: 160
    },
    metaImage: String
  },
  analytics: {
    totalViews: {
      type: Number,
      default: 0
    },
    totalClicks: {
      type: Number,
      default: 0
    },
    uniqueVisitors: {
      type: Number,
      default: 0
    }
  },
  settings: {
    isPublished: {
      type: Boolean,
      default: true
    },
    showBranding: {
      type: Boolean,
      default: true
    },
    collectEmails: {
      type: Boolean,
      default: false
    },
    emailPlaceholder: {
      type: String,
      default: 'Enter your email'
    },
    customDomain: {
      type: String,
      default: null
    },
    password: {
      type: String,
      default: null
    },
    enableAnalytics: {
      type: Boolean,
      default: true
    },
    verifiedBadge: {
      type: Boolean,
      default: false
    }
  },
  emailSubscribers: [{
    email: {
      type: String,
      required: true
    },
    subscribedAt: {
      type: Date,
      default: Date.now
    },
    source: {
      type: String,
      default: 'bio-page'
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full URL
bioPageSchema.virtual('fullUrl').get(function() {
  const baseUrl = process.env.BASE_URL || 'https://laghhu.link';
  return `${baseUrl}/@${this.slug}`;
});

// Indexes
bioPageSchema.index({ user: 1, createdAt: -1 });
bioPageSchema.index({ slug: 1 }, { unique: true });
bioPageSchema.index({ 'settings.isPublished': 1 });

// Methods
bioPageSchema.methods.incrementView = async function() {
  this.analytics.totalViews += 1;
  await this.save();
};

bioPageSchema.methods.incrementLinkClick = async function(linkId) {
  const link = this.links.id(linkId);
  if (link) {
    link.clicks += 1;
    this.analytics.totalClicks += 1;
    await this.save();
  }
};

bioPageSchema.methods.addEmailSubscriber = async function(email) {
  const exists = this.emailSubscribers.some(sub => sub.email === email);
  if (!exists) {
    this.emailSubscribers.push({ email });
    await this.save();
  }
};

// Static methods
bioPageSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug: slug.toLowerCase() });
};

bioPageSchema.statics.isSlugAvailable = async function(slug, excludeId = null) {
  const query = { slug: slug.toLowerCase() };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const existing = await this.findOne(query);
  return !existing;
};

module.exports = mongoose.model('BioPage', bioPageSchema);
