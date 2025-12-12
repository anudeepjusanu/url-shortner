const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters']
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  phone: {
    type: String,
    trim: true,
    sparse: true,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number in E.164 format']
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'super_admin', 'editor', 'viewer'],
    default: 'user'
  },
  plan: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free'
  },
  subscription: {
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    stripePriceId: String,
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled', 'past_due', 'trialing', 'paused'],
      default: 'inactive'
    },
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    },
    trialEnd: Date,
    trialStart: Date,
    pausedAt: Date,
    resumeAt: Date,
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly'
    },
    discountCode: String,
    discountPercentage: Number
  },
  usage: {
    urlsCreatedThisMonth: {
      type: Number,
      default: 0
    },
    urlsCreatedTotal: {
      type: Number,
      default: 0
    },
    customDomainsCount: {
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
    },
    overageCharges: {
      type: Number,
      default: 0
    }
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: {
    type: Date,
    default: null
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  preferences: {
    defaultExpiration: {
      type: Number,
      default: null
    },
    allowAnalytics: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    language: {
      type: String,
      enum: ['en', 'ar'],
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'Asia/Riyadh'
    },
    emailNotifications: {
      paymentReminders: {
        type: Boolean,
        default: true
      },
      usageAlerts: {
        type: Boolean,
        default: true
      },
      newsletter: {
        type: Boolean,
        default: false
      }
    }
  },
  limits: {
    monthlyUrls: {
      type: Number,
      default: 100
    },
    customDomain: {
      type: Boolean,
      default: false
    },
    analyticsRetention: {
      type: Number,
      default: 30
    }
  },
  apiKeys: [{
    name: String,
    key: String,
    lastUsed: Date,
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.passwordResetToken;
      delete ret.emailVerificationToken;
      delete ret.__v;
      return ret;
    }
  }
});

userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

userSchema.methods.incLoginAttempts = function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: {
        loginAttempts: 1,
        lockUntil: 1
      }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = {
      lockUntil: Date.now() + 2 * 60 * 60 * 1000
    };
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockUntil: 1
    }
  });
};

userSchema.methods.canCreateUrl = function() {
  if (this.role === 'admin') return true;

  return true;
};

// Check if user has specific permission
userSchema.methods.hasPermission = function(resource, action) {
  // Admin and super_admin have all permissions
  if (this.role === 'admin' || this.role === 'super_admin') {
    return true;
  }

  // Define role-based permissions
  const rolePermissions = {
    editor: {
      urls: { create: true, read: true, update: true, delete: true },
      domains: { create: true, read: true, update: true, delete: true, verify: true },
      analytics: { view: true, export: true },
      qrCodes: { create: true, download: true, customize: true },
      users: { create: false, read: false, update: false, delete: false },
      settings: { update: true }
    },
    viewer: {
      urls: { create: false, read: true, update: false, delete: false },
      domains: { create: false, read: true, update: false, delete: false, verify: false },
      analytics: { view: true, export: false },
      qrCodes: { create: false, download: true, customize: false },
      users: { create: false, read: false, update: false, delete: false },
      settings: { update: false }
    },
    user: {
      urls: { create: true, read: true, update: true, delete: true },
      domains: { create: false, read: true, update: false, delete: false, verify: false },
      analytics: { view: true, export: false },
      qrCodes: { create: true, download: true, customize: true },
      users: { create: false, read: false, update: false, delete: false },
      settings: { update: true }
    }
  };

  // Check custom permissions first (if set)
  if (this.permissions && this.permissions[resource] && this.permissions[resource][action] !== undefined) {
    return this.permissions[resource][action];
  }

  // Check role-based permissions
  if (rolePermissions[this.role] && rolePermissions[this.role][resource]) {
    return rolePermissions[this.role][resource][action] || false;
  }

  return false;
};

userSchema.index({ email: 1 });
userSchema.index({ organization: 1 });
userSchema.index({ 'apiKeys.key': 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);