const mongoose = require('mongoose');

// One row per user-per-project-role assignment. Never contains role "owner" —
// the Account Owner is tracked exclusively via Organization.owner, never as a
// membership row. See claude-implementation-docs/Architecture/rbac-enterprise-project-roles.md
const projectMembershipSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'editor', 'viewer'],
    required: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invitedAt: {
    type: Date,
    default: Date.now
  },
  // Null while the invite is pending.
  acceptedAt: {
    type: Date,
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

projectMembershipSchema.index({ project: 1, user: 1 }, { unique: true });
projectMembershipSchema.index({ organization: 1, user: 1 });
projectMembershipSchema.index({ user: 1 });

module.exports = mongoose.model('ProjectMembership', projectMembershipSchema);
