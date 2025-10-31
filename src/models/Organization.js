const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
    maxlength: [100, 'Organization name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  website: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'Please enter a valid website URL']
  },
  logo: {
    type: String,
    default: null
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'viewer'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  invitations: [{
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['admin', 'member', 'viewer'],
      default: 'member'
    },
    token: {
      type: String,
      required: true
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'unpaid'],
      default: 'active'
    },
    startDate: Date,
    endDate: Date,
    billingEmail: String,
    stripeCustomerId: String,
    stripeSubscriptionId: String
  },
  limits: {
    maxUrls: {
      type: Number,
      default: 1000
    },
    maxMembers: {
      type: Number,
      default: 5
    },
    customDomains: {
      type: Number,
      default: 0
    },
    analyticsRetention: {
      type: Number,
      default: 90
    },
    apiCalls: {
      type: Number,
      default: 10000
    }
  },
  usage: {
    urlsCreated: {
      type: Number,
      default: 0
    },
    totalClicks: {
      type: Number,
      default: 0
    },
    apiCallsThisMonth: {
      type: Number,
      default: 0
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    }
  },
  domains: [{
    domain: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationToken: String,
    isDefault: {
      type: Boolean,
      default: false
    },
    sslEnabled: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  settings: {
    defaultExpiration: {
      type: Number,
      default: null
    },
    requirePassword: {
      type: Boolean,
      default: false
    },
    allowPublicUrls: {
      type: Boolean,
      default: true
    },
    brandingEnabled: {
      type: Boolean,
      default: false
    },
    customBranding: {
      primaryColor: String,
      logo: String,
      favicon: String
    }
  },
  isActive: {
    type: Boolean,
    default: true
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

organizationSchema.virtual('memberCount').get(function() {
  return this.members ? this.members.length : 0;
});

organizationSchema.virtual('activeInvitations').get(function() {
  if (!this.invitations) return 0;
  return this.invitations.filter(inv => inv.expiresAt > new Date()).length;
});

organizationSchema.virtual('isSubscriptionActive').get(function() {
  return this.subscription.status === 'active' && 
         (!this.subscription.endDate || this.subscription.endDate > new Date());
});

organizationSchema.pre('save', async function(next) {
  if (this.isNew && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    let counter = 1;
    let originalSlug = this.slug;
    
    while (await this.constructor.findOne({ slug: this.slug })) {
      this.slug = `${originalSlug}-${counter}`;
      counter++;
    }
  }
  
  if (this.domains && this.domains.length > 0) {
    const defaultDomains = this.domains.filter(d => d.isDefault);
    if (defaultDomains.length > 1) {
      this.domains.forEach((domain, index) => {
        if (index > 0 && domain.isDefault) {
          domain.isDefault = false;
        }
      });
    }
  }
  
  next();
});

organizationSchema.methods.addMember = function(userId, role = 'member', invitedBy = null) {
  const existingMember = this.members.find(m => m.user.toString() === userId.toString());
  if (existingMember) {
    throw new Error('User is already a member of this organization');
  }
  
  this.members.push({
    user: userId,
    role,
    invitedBy
  });
  
  return this.save();
};

organizationSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(m => m.user.toString() !== userId.toString());
  return this.save();
};

organizationSchema.methods.updateMemberRole = function(userId, newRole) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  if (!member) {
    throw new Error('User is not a member of this organization');
  }
  
  member.role = newRole;
  return this.save();
};

organizationSchema.methods.canUserPerformAction = function(userId, action) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  if (!member) return false;
  
  const rolePermissions = {
    owner: ['all'],
    admin: ['manage_members', 'manage_urls', 'view_analytics', 'manage_settings'],
    member: ['manage_urls', 'view_analytics'],
    viewer: ['view_analytics']
  };
  
  const permissions = rolePermissions[member.role] || [];
  return permissions.includes('all') || permissions.includes(action);
};

organizationSchema.methods.incrementUsage = function(type, amount = 1) {
  const now = new Date();
  const lastReset = new Date(this.usage.lastResetDate);
  
  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    this.usage.apiCallsThisMonth = 0;
    this.usage.lastResetDate = now;
  }
  
  switch (type) {
    case 'url':
      this.usage.urlsCreated += amount;
      break;
    case 'click':
      this.usage.totalClicks += amount;
      break;
    case 'api':
      this.usage.apiCallsThisMonth += amount;
      break;
  }
  
  return this.save();
};

organizationSchema.methods.isWithinLimits = function(type) {
  switch (type) {
    case 'urls':
      return this.usage.urlsCreated < this.limits.maxUrls;
    case 'members':
      return this.memberCount < this.limits.maxMembers;
    case 'api':
      return this.usage.apiCallsThisMonth < this.limits.apiCalls;
    case 'domains':
      return this.domains.length < this.limits.customDomains;
    default:
      return false;
  }
};

organizationSchema.index({ slug: 1 }, { unique: true });
organizationSchema.index({ owner: 1 });
organizationSchema.index({ 'members.user': 1 });
organizationSchema.index({ createdAt: -1 });
organizationSchema.index({ isActive: 1 });

module.exports = mongoose.model('Organization', organizationSchema);