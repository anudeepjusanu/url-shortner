const crypto = require("crypto");
const Organization = require("../models/Organization");
const Project = require("../models/Project");
const ProjectMembership = require("../models/ProjectMembership");
const ProjectInvitation = require("../models/ProjectInvitation");
const User = require("../models/User");
const emailService = require("./emailService");
const logger = require("../config/logger");

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

class ForbiddenError extends Error {
  constructor(message) {
    super(message);
    this.name = "ForbiddenError";
    this.statusCode = 403;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFoundError";
    this.statusCode = 404;
  }
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
  }
}

/**
 * Is this user the Account Owner of this organization?
 * The Account Owner is tracked exclusively via Organization.owner — never a
 * ProjectMembership row. Do not call this concept "Super Admin" anywhere;
 * that term is reserved for Snip's unrelated internal-staff role.
 */
const isAccountOwner = async (userId, organizationId) => {
  if (!userId || !organizationId) return false;
  const organization =
    await Organization.findById(organizationId).select("owner");
  return !!organization && organization.owner.toString() === userId.toString();
};

const getAccountOwnerId = async (organizationId) => {
  const organization =
    await Organization.findById(organizationId).select("owner");
  return organization ? organization.owner.toString() : null;
};

const getMembership = async (userId, projectId) => {
  return ProjectMembership.findOne({
    user: userId,
    project: projectId,
    acceptedAt: { $ne: null },
  });
};

/**
 * Resolve what role a user effectively holds on a project: 'owner' (Account
 * Owner, implicit and full-access), one of admin/editor/viewer, or null (no
 * access). Always resolves organization from the project itself so callers
 * don't need to trust req.user.organization.
 */
// Accepts either an already-resolved Project document or a bare id (string
// or ObjectId — note an ObjectId is also `typeof 'object'`, so we can't use
// that alone to detect "already a doc").
const isResolvedProjectDoc = (value) =>
  !!value && typeof value === "object" && "isPersonal" in value;

const getEffectiveRole = async (userId, project) => {
  const projectDoc = isResolvedProjectDoc(project)
    ? project
    : await Project.findById(project);
  if (!projectDoc) return null;

  if (projectDoc.isPersonal) {
    return projectDoc.personalOwnerUser.toString() === userId.toString()
      ? "personal-owner"
      : null;
  }

  if (await isAccountOwner(userId, projectDoc.organization)) {
    return "owner";
  }

  const membership = await getMembership(userId, projectDoc._id);
  return membership ? membership.role : null;
};

const hasAdminOn = async (userId, projectId) => {
  const role = await getEffectiveRole(userId, projectId);
  return role === "owner" || role === "admin";
};

const canEditProject = async (userId, projectId) => {
  const role = await getEffectiveRole(userId, projectId);
  return (
    role === "owner" ||
    role === "admin" ||
    role === "editor" ||
    role === "personal-owner"
  );
};

/**
 * Which roles can `actingUser` assign on this project?
 * Owner: admin/editor/viewer. Admin (on this project only): editor/viewer.
 * Anyone else: none.
 */
const assignableRolesForProject = async (actingUserId, projectId) => {
  const role = await getEffectiveRole(actingUserId, projectId);
  if (role === "owner") return ["admin", "editor", "viewer"];
  if (role === "admin") return ["editor", "viewer"];
  return [];
};

/**
 * General guard used throughout the API: can `actingUser` manage this
 * specific target membership (change its role / remove it)?
 */
const canManageMember = async (actingUserId, targetMembership) => {
  const actingRole = await getEffectiveRole(
    actingUserId,
    targetMembership.project,
  );
  if (actingRole === "owner") return true;
  if (actingRole === "admin") return targetMembership.role !== "admin";
  return false;
};

const listSharedProjectsForUser = async (userId, organizationId) => {
  if (await isAccountOwner(userId, organizationId)) {
    return Project.find({
      organization: organizationId,
      isPersonal: false,
    }).sort({ createdAt: 1 });
  }

  const memberships = await ProjectMembership.find({
    user: userId,
    organization: organizationId,
    acceptedAt: { $ne: null },
  }).select("project");

  const projectIds = memberships.map((m) => m.project);
  return Project.find({ _id: { $in: projectIds }, isPersonal: false }).sort({
    createdAt: 1,
  });
};

/**
 * Personal projects are looked up independent of the caller's current
 * organization membership so they keep working even after the user is
 * removed from every shared project (spec 2.5 / user story 9).
 */
const getPersonalProject = async (userId, organizationId) => {
  return Project.findOne({
    personalOwnerUser: userId,
    organization: organizationId,
    isPersonal: true,
  });
};

const createPersonalProject = async (userId, organizationId) => {
  const existing = await getPersonalProject(userId, organizationId);
  if (existing) return existing;

  const user = await User.findById(userId).select("firstName");
  const name = user?.firstName
    ? `${user.firstName}'s Personal Project`
    : "Personal Project";

  try {
    return await Project.create({
      organization: organizationId,
      name,
      isPersonal: true,
      personalOwnerUser: userId,
    });
  } catch (error) {
    // Unique index race: another request created it concurrently.
    if (error.code === 11000) {
      return getPersonalProject(userId, organizationId);
    }
    throw error;
  }
};

const createProject = async (actingUserId, organizationId, name) => {
  if (!(await isAccountOwner(actingUserId, organizationId))) {
    throw new ForbiddenError("Only the Account Owner can create projects");
  }
  return Project.create({
    organization: organizationId,
    name,
    isPersonal: false,
  });
};

const generateToken = () => crypto.randomBytes(32).toString("hex");

/**
 * Mirrors the prototype's inviteUser(email, projectIds[], role) helper.
 * Creates one pending ProjectInvitation covering every selected project.
 */
const inviteUser = async ({
  actingUserId,
  organizationId,
  email,
  projectIds,
  role,
  inviterName,
}) => {
  if (!projectIds || projectIds.length === 0) {
    throw new ValidationError("At least one project must be selected");
  }
  if (!["admin", "editor", "viewer"].includes(role)) {
    throw new ValidationError("Invalid role");
  }

  const isOwner = await isAccountOwner(actingUserId, organizationId);

  for (const projectId of projectIds) {
    const project = await Project.findOne({
      _id: projectId,
      organization: organizationId,
      isPersonal: false,
    });
    if (!project) {
      throw new NotFoundError("One or more selected projects were not found");
    }
    if (!isOwner) {
      const assignable = await assignableRolesForProject(
        actingUserId,
        projectId,
      );
      if (!assignable.includes(role)) {
        throw new ForbiddenError(
          "You are not allowed to assign this role on one of the selected projects",
        );
      }
    }
  }

  const normalizedEmail = email.toLowerCase().trim();
  const invitation = await ProjectInvitation.create({
    organization: organizationId,
    email: normalizedEmail,
    role,
    projects: projectIds,
    invitedBy: actingUserId,
    token: generateToken(),
    status: "pending",
    expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
  });

  try {
    await emailService.sendInvitationEmail({
      toEmail: normalizedEmail,
      inviterName,
      role,
      token: invitation.token,
    });
  } catch (error) {
    logger.error("Failed to send invitation email:", error);
  }

  return invitation;
};

/**
 * Mirrors the prototype's changeMemberRole(userId, projectId, role) helper.
 */
const changeMemberRole = async ({
  actingUserId,
  userId,
  projectId,
  newRole,
}) => {
  const membership = await ProjectMembership.findOne({
    user: userId,
    project: projectId,
  });
  if (!membership) {
    throw new NotFoundError("Membership not found");
  }

  const assignable = await assignableRolesForProject(actingUserId, projectId);
  if (!assignable.includes(newRole)) {
    throw new ForbiddenError("You are not allowed to assign this role");
  }
  if (!(await canManageMember(actingUserId, membership))) {
    throw new ForbiddenError("You cannot manage this member");
  }

  membership.role = newRole;
  await membership.save();
  return membership;
};

/**
 * Mirrors the prototype's removeMemberFromProject(userId, projectId) helper.
 */
const removeMemberFromProject = async ({ actingUserId, userId, projectId }) => {
  const membership = await ProjectMembership.findOne({
    user: userId,
    project: projectId,
  });
  if (!membership) {
    throw new NotFoundError("Membership not found");
  }
  if (!(await canManageMember(actingUserId, membership))) {
    throw new ForbiddenError("You cannot manage this member");
  }
  await ProjectMembership.deleteOne({ _id: membership._id });
};

/**
 * Mirrors the prototype's removeUserFromAccount(userId) helper — deletes all
 * of a user's shared-project memberships. Their personal project is
 * untouched (spec 2.5 / user story 9).
 */
const removeUserFromAccount = async ({
  actingUserId,
  userId,
  organizationId,
}) => {
  if (!(await isAccountOwner(actingUserId, organizationId))) {
    throw new ForbiddenError(
      "Only the Account Owner can remove a user from the account",
    );
  }
  await ProjectMembership.deleteMany({
    user: userId,
    organization: organizationId,
  });

  const user = await User.findById(userId);
  if (
    user &&
    user.organization &&
    user.organization.toString() === organizationId.toString()
  ) {
    user.organization = null;
    await user.save();
  }
};

/**
 * Accept a pending invitation. Requires the accepting user's own account
 * email to match the invitation (case-insensitive) — this is the acceptance
 * gate, whether the invitee registered brand new or already had an account.
 */
const acceptInvitation = async ({ token, acceptingUser }) => {
  const invitation = await ProjectInvitation.findOne({ token });
  if (!invitation) {
    throw new NotFoundError("Invitation not found");
  }
  if (invitation.status !== "pending") {
    throw new ValidationError("Invitation is no longer pending");
  }
  if (invitation.expiresAt < new Date()) {
    throw new ValidationError("Invitation has expired");
  }
  if (invitation.email !== acceptingUser.email.toLowerCase().trim()) {
    throw new ForbiddenError(
      "This invitation was sent to a different email address",
    );
  }

  const user = await User.findById(acceptingUser.id);
  if (
    user.organization &&
    user.organization.toString() !== invitation.organization.toString()
  ) {
    throw new ForbiddenError(
      "This account already belongs to a different enterprise account",
    );
  }
  if (!user.organization) {
    user.organization = invitation.organization;
    await user.save();
  }

  const now = new Date();
  const memberships = [];
  for (const projectId of invitation.projects) {
    const membership = await ProjectMembership.findOneAndUpdate(
      { project: projectId, user: user._id },
      {
        $setOnInsert: {
          organization: invitation.organization,
          project: projectId,
          user: user._id,
          role: invitation.role,
          invitedBy: invitation.invitedBy,
          invitedAt: invitation.createdAt,
        },
        $set: { acceptedAt: now },
      },
      { upsert: true, new: true },
    );
    memberships.push(membership);
  }

  invitation.status = "accepted";
  invitation.acceptedAt = now;
  invitation.acceptedUser = user._id;
  await invitation.save();

  const personalProject = await createPersonalProject(
    user._id,
    invitation.organization,
  );

  return { memberships, personalProject };
};

module.exports = {
  ForbiddenError,
  NotFoundError,
  ValidationError,
  isAccountOwner,
  getAccountOwnerId,
  getMembership,
  getEffectiveRole,
  hasAdminOn,
  canEditProject,
  assignableRolesForProject,
  canManageMember,
  listSharedProjectsForUser,
  getPersonalProject,
  createPersonalProject,
  createProject,
  inviteUser,
  changeMemberRole,
  removeMemberFromProject,
  removeUserFromAccount,
  acceptInvitation,
};
