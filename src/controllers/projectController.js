const ProjectMembership = require("../models/ProjectMembership");
const projectAccessService = require("../services/projectAccessService");
const { cacheDel } = require("../config/redis");
const logger = require("../config/logger");

const serializeProject = (project, role) => ({
  id: project._id,
  name: project.name,
  isPersonal: project.isPersonal,
  role,
  createdAt: project.createdAt,
});

// GET /api/projects — the top-bar project switcher's data source.
const listProjects = async (req, res) => {
  try {
    // Every account is entitled to a default (personal) project and its own
    // organization, self-serve — no plan/subscription required. Idempotent:
    // an existing organization/projects are reused as-is, so this only
    // fills the gap for accounts that had none yet.
    const { organization, organizationCreated } =
      await projectAccessService.promoteToAccountOwner(req.user.id);
    if (organizationCreated) {
      // req.user (and any cached copy) was loaded before this organization
      // existed — invalidate so the very next request sees it.
      await cacheDel(`user:${req.user.id}`);
    }
    const organizationId = organization._id;

    const isOwner = await projectAccessService.isAccountOwner(
      req.user.id,
      organizationId,
    );

    const sharedProjectDocs =
      await projectAccessService.listSharedProjectsForUser(
        req.user.id,
        organizationId,
      );
    const personalProjectDoc = await projectAccessService.getPersonalProject(
      req.user.id,
      organizationId,
    );

    const sharedProjects = await Promise.all(
      sharedProjectDocs.map(async (project) => {
        const role = isOwner
          ? "owner"
          : await projectAccessService.getEffectiveRole(req.user.id, project);
        return serializeProject(project, role);
      }),
    );

    res.json({
      success: true,
      data: {
        isAccountOwner: isOwner,
        sharedProjects,
        personalProject: personalProjectDoc
          ? serializeProject(personalProjectDoc, "personal-owner")
          : null,
      },
    });
  } catch (error) {
    logger.error("listProjects error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to list projects" });
  }
};

// POST /api/projects — Account Owner only.
const createProject = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Project name is required" });
    }

    const project = await projectAccessService.createProject(
      req.user.id,
      req.user.organization,
      name.trim(),
    );
    res
      .status(201)
      .json({ success: true, data: serializeProject(project, "owner") });
  } catch (error) {
    if (error.statusCode) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    logger.error("createProject error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create project" });
  }
};

const getProject = async (req, res) => {
  res.json({
    success: true,
    data: serializeProject(req.project, req.projectRole),
  });
};

// GET /api/projects/:projectId/members — Owner/Admin only (see requireProjectRole on the route).
const listProjectMembers = async (req, res) => {
  try {
    const memberships = await ProjectMembership.find({
      project: req.project._id,
    })
      .populate("user", "firstName lastName email")
      .populate("invitedBy", "firstName lastName email")
      .sort({ createdAt: 1 });

    res.json({ success: true, data: memberships });
  } catch (error) {
    logger.error("listProjectMembers error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to list project members" });
  }
};

// POST /api/projects/:projectId/members — "Add to project" for an existing
// account member (no email invite round-trip needed).
const addExistingUserToProject = async (req, res) => {
  try {
    const { userId, role } = req.body;
    if (!userId || !role) {
      return res
        .status(400)
        .json({ success: false, message: "userId and role are required" });
    }

    const assignable = await projectAccessService.assignableRolesForProject(
      req.user.id,
      req.project._id,
    );
    if (!assignable.includes(role)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to assign this role",
      });
    }

    const membership = await ProjectMembership.findOneAndUpdate(
      { project: req.project._id, user: userId },
      {
        $setOnInsert: {
          organization: req.project.organization,
          project: req.project._id,
          user: userId,
          invitedBy: req.user.id,
          invitedAt: new Date(),
        },
        $set: { role, acceptedAt: new Date() },
      },
      { upsert: true, new: true },
    );

    res.status(201).json({ success: true, data: membership });
  } catch (error) {
    logger.error("addExistingUserToProject error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to add user to project" });
  }
};

const changeMemberRole = async (req, res) => {
  try {
    const { role } = req.body;
    const membership = await projectAccessService.changeMemberRole({
      actingUserId: req.user.id,
      userId: req.params.userId,
      projectId: req.project._id,
      newRole: role,
    });
    res.json({ success: true, data: membership });
  } catch (error) {
    if (error.statusCode) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    logger.error("changeMemberRole error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to change member role" });
  }
};

const removeMember = async (req, res) => {
  try {
    await projectAccessService.removeMemberFromProject({
      actingUserId: req.user.id,
      userId: req.params.userId,
      projectId: req.project._id,
    });
    res.json({ success: true, message: "Member removed from project" });
  } catch (error) {
    if (error.statusCode) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    logger.error("removeMember error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to remove member" });
  }
};

module.exports = {
  listProjects,
  createProject,
  getProject,
  listProjectMembers,
  addExistingUserToProject,
  changeMemberRole,
  removeMember,
};
