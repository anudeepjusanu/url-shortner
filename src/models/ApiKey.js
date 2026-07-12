const mongoose = require("mongoose");

// Enterprise RBAC: an API key belongs to a specific (user, project) pair —
// project is null for solo accounts, or for an Account Owner managing their
// key while in the "All projects" aggregate view (no single active project).
// Regenerating deactivates the previous key for that same (user, project)
// pair rather than deleting it, preserving audit history.
const apiKeySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true,
    },
    name: {
      type: String,
      trim: true,
      default: "Default API Key",
    },
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUsed: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

apiKeySchema.index({ user: 1, project: 1, isActive: 1 });

module.exports = mongoose.model("ApiKey", apiKeySchema);
