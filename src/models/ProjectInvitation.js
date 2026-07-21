const mongoose = require("mongoose");

// A pending email invitation to one or more projects, each with its own role.
// Converted into ProjectMembership rows (one per project) on acceptance.
// Kept separate from ProjectMembership because the invitee may not have a
// User account yet — see claude-implementation-docs/Architecture/rbac-enterprise-project-roles.md
const projectInvitationSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    projectRoles: [
      {
        _id: false,
        project: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Project",
          required: true,
        },
        role: {
          type: String,
          enum: ["admin", "editor", "viewer"],
          required: true,
        },
      },
    ],
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "revoked"],
      default: "pending",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    acceptedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

projectInvitationSchema.virtual("isExpired").get(function () {
  return this.expiresAt < new Date();
});

projectInvitationSchema.index({ email: 1, organization: 1 });

module.exports = mongoose.model("ProjectInvitation", projectInvitationSchema);
