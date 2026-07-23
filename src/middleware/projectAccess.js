const Project = require("../models/Project");
const projectAccessService = require("../services/projectAccessService");
const logger = require("../config/logger");

/**
 * Enterprise RBAC guards (Account Owner / Admin / Editor / Viewer, scoped
 * per Project). Separate from the existing organization-wide roleCheck.js /
 * permissions.js middleware, which is untouched by this feature.
 */

const requireOrganizationContext = (req, res, next) => {
  if (!req.user.organization) {
    return res.status(400).json({
      success: false,
      message: "This action requires an enterprise account",
    });
  }
  next();
};

/**
 * Loads the project named by :projectId (or the id in the request body/query
 * as a fallback) into req.project, scoped to the caller's organization so a
 * project from a different account can never be addressed.
 */
const attachProjectById = async (req, res, next) => {
  try {
    const projectId =
      req.params.projectId || req.body.projectId || req.query.projectId;
    if (!projectId) {
      return res
        .status(400)
        .json({ success: false, message: "projectId is required" });
    }

    const project = await Project.findOne({
      _id: projectId,
      organization: req.user.organization,
    });
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    req.project = project;
    next();
  } catch (error) {
    logger.error("attachProjectById error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to resolve project" });
  }
};

/**
 * Requires the caller's effective role on req.project (attached by
 * attachProjectById) to be one of allowedRoles. Roles: 'owner' (Account
 * Owner, implicit), 'admin', 'editor', 'viewer', 'personal-owner'.
 */
const requireProjectRole = (allowedRoles) => {
  return [
    requireOrganizationContext,
    attachProjectById,
    async (req, res, next) => {
      try {
        const role = await projectAccessService.getEffectiveRole(
          req.user.id,
          req.project,
        );
        if (!role || !allowedRoles.includes(role)) {
          return res.status(403).json({
            success: false,
            message: "Insufficient permissions for this project",
          });
        }
        req.projectRole = role;
        next();
      } catch (error) {
        logger.error("requireProjectRole error:", error);
        res
          .status(500)
          .json({ success: false, message: "Permission validation failed" });
      }
    },
  ];
};

const requireAccountOwner = [
  requireOrganizationContext,
  async (req, res, next) => {
    try {
      const isOwner = await projectAccessService.isAccountOwner(
        req.user.id,
        req.user.organization,
      );
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: "Only the Account Owner can perform this action",
        });
      }
      // Shared-project capability (creating projects, inviting people) is an
      // Enterprise-plan feature for a self-serve solo Account Owner — see
      // hasUnlockedSharedProjects. A real multi-person org keeps access
      // regardless of the caller's own plan.
      const unlocked = await projectAccessService.hasUnlockedSharedProjects(
        req.user,
        req.user.organization,
      );
      if (!unlocked) {
        return res.status(403).json({
          success: false,
          message: "This action requires an Enterprise plan",
        });
      }
      next();
    } catch (error) {
      logger.error("requireAccountOwner error:", error);
      res
        .status(500)
        .json({ success: false, message: "Permission validation failed" });
    }
  },
];

/**
 * Gate for account-wide member management screens: the caller must be the
 * Account Owner, or Admin on at least one project. Fine-grained, per-project
 * filtering still happens in the controller.
 */
const requireOwnerOrAnyProjectAdmin = [
  requireOrganizationContext,
  async (req, res, next) => {
    try {
      const ProjectMembership = require("../models/ProjectMembership");
      const isOwner = await projectAccessService.isAccountOwner(
        req.user.id,
        req.user.organization,
      );
      if (isOwner) {
        // Same Enterprise-plan gate as requireAccountOwner — a plain
        // self-serve solo Owner with no real team doesn't get team-
        // management access just by owning their own personal-project host.
        const unlocked = await projectAccessService.hasUnlockedSharedProjects(
          req.user,
          req.user.organization,
        );
        if (!unlocked) {
          return res.status(403).json({
            success: false,
            message: "This action requires an Enterprise plan",
          });
        }
        req.isAccountOwner = true;
        return next();
      }

      const adminMembership = await ProjectMembership.findOne({
        user: req.user.id,
        organization: req.user.organization,
        role: "admin",
        acceptedAt: { $ne: null },
      });

      if (!adminMembership) {
        return res.status(403).json({
          success: false,
          message:
            "Only the Account Owner or a project Admin can perform this action",
        });
      }

      req.isAccountOwner = false;
      next();
    } catch (error) {
      logger.error("requireOwnerOrAnyProjectAdmin error:", error);
      res
        .status(500)
        .json({ success: false, message: "Permission validation failed" });
    }
  },
];

module.exports = {
  requireOrganizationContext,
  attachProjectById,
  requireProjectRole,
  requireAccountOwner,
  requireOwnerOrAnyProjectAdmin,
};
