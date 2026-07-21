const mongoose = require("mongoose");

// Enterprise RBAC: an API key belongs to a project, not to an individual —
// every member with write access to that project shares the same active
// key. `project` is null only for solo (no-organization) accounts, where
// there is no Project entity to bind to and the key is scoped to `user`
// instead. `user` is always populated, but for a project-scoped key it is
// audit-only (who last generated it), not part of the key's ownership scope.
// Regenerating deactivates the previous key for that same scope (project,
// or user+null-project for solo) rather than deleting it, preserving audit
// history.
const apiKeySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

// Two independent lookup patterns now, not a combined one: enterprise keys
// are found by project alone, solo keys by user alone (with project: null).
apiKeySchema.index({ project: 1, isActive: 1 });
apiKeySchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model("ApiKey", apiKeySchema);
