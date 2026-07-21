const mongoose = require('mongoose');

// A Project is a container scoped to an enterprise Organization ("account").
// Every Organization gets shared projects (created by the Account Owner) plus
// exactly one auto-created, private "personal" project per accepted member.
// See claude-implementation-docs/Architecture/rbac-enterprise-project-roles.md
const projectSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  isPersonal: {
    type: Boolean,
    default: false
  },
  // Set only for personal projects — the sole user who can access it.
  // Never set for shared projects.
  personalOwnerUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

projectSchema.pre('validate', function (next) {
  if (this.isPersonal && !this.personalOwnerUser) {
    return next(new Error('personalOwnerUser is required for personal projects'));
  }
  if (!this.isPersonal && this.personalOwnerUser) {
    return next(new Error('personalOwnerUser must not be set on shared projects'));
  }
  next();
});

projectSchema.index({ organization: 1, isPersonal: 1 });
projectSchema.index(
  { organization: 1, personalOwnerUser: 1 },
  { unique: true, partialFilterExpression: { isPersonal: true } }
);

module.exports = mongoose.model('Project', projectSchema);
