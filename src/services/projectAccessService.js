const crypto = require("crypto");
const mongoose = require("mongoose");
const Organization = require("../models/Organization");
const Project = require("../models/Project");
const ProjectMembership = require("../models/ProjectMembership");
const ProjectInvitation = require("../models/ProjectInvitation");
const User = require("../models/User");
const Url = require("../models/Url");
const Domain = require("../models/Domain");
const QRCode = require("../models/QRCode");
const DynamicQRCode = require("../models/DynamicQRCode");
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

/**
 * Every shared project this user administers (accepted "admin" membership),
 * as string ids. Used to scope account-wide views (Team page, "Team URLs")
 * to only the projects an Admin actually manages, never the whole org.
 */
const getAdminProjectIds = async (userId, organizationId) => {
  const rows = await ProjectMembership.find({
    user: userId,
    organization: organizationId,
    role: "admin",
    acceptedAt: { $ne: null },
  }).select("project");
  return rows.map((r) => r.project.toString());
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

const slugify = (base) =>
  base
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const uniqueOrgSlug = async (base) => {
  let candidate = slugify(base) || "org";
  let suffix = 0;
  while (await Organization.exists({ slug: candidate })) {
    suffix += 1;
    candidate = `${slugify(base) || "org"}-${suffix}`;
  }
  return candidate;
};

/**
 * Retroactively assigns any of this user's own fully-untagged resources
 * (organization: null, project: null) into their personal project —
 * otherwise project-scoped list queries would make those links/domains/QR
 * codes disappear from view. Scoped strictly to resources this exact user
 * created; never touches anyone else's data.
 *
 * Deliberately safe to call repeatedly (matches nothing once nothing is left
 * untagged), not just once: a resource can be created by a concurrent
 * request in the brief window between this organization/project being
 * provisioned and that other request's own project-resolution step reading
 * it (e.g. a URL create that reads req.user before a slow safe-browsing/
 * reachability check, racing this user's first-ever /api/projects load) —
 * so the sweep has to be repeatable, not one-shot, or that resource is
 * orphaned forever.
 */
const backfillOwnResourcesToProject = async (
  userId,
  organizationId,
  projectId,
) => {
  const untagged = { organization: null, project: null };
  const update = { $set: { organization: organizationId, project: projectId } };
  await Promise.all([
    Url.updateMany({ ...untagged, creator: userId }, update),
    Domain.updateMany({ ...untagged, owner: userId }, update),
    QRCode.updateMany({ ...untagged, creator: userId }, update),
    DynamicQRCode.updateMany({ ...untagged, creator: userId }, update),
  ]);
};

/**
 * Ensures this user has an Organization (creating a personal one if they
 * don't already belong to any) and their own personal project in it.
 * Idempotent at every step — whatever already exists is reused as-is — so
 * it's safe to call on every `/api/projects` load. Deliberately does NOT
 * touch shared/"Main" projects or Account Owner status: every account is
 * entitled to a default personal project regardless of plan, but shared-
 * project capability is gated separately (see hasUnlockedSharedProjects) —
 * this is the plan-agnostic half of that split.
 */
const ensureOrganizationHome = async (userId, organizationName) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  let organization = user.organization
    ? await Organization.findById(user.organization)
    : null;
  const organizationCreated = !organization;

  if (!organization) {
    const name =
      organizationName ||
      `${user.firstName || user.email.split("@")[0]}'s Organization`;
    const slug = await uniqueOrgSlug(name);

    organization = await Organization.create({
      name,
      slug,
      owner: user._id,
    });

    user.organization = organization._id;
    await user.save();
  }

  const existingPersonalProject = await getPersonalProject(
    user._id,
    organization._id,
  );
  const personalProject =
    existingPersonalProject ||
    (await createPersonalProject(user._id, organization._id));

  await backfillOwnResourcesToProject(
    user._id,
    organization._id,
    personalProject._id,
  );

  return { organization, personalProject, organizationCreated };
};

/**
 * Ensures this organization has a default shared "Main" project. Split out
 * from ensureOrganizationHome so callers can decide *whether* to grant
 * shared-project capability (an Enterprise-plan feature) separately from
 * the plan-agnostic "give everyone a personal project" guarantee.
 */
const ensureMainProject = async (organizationId) => {
  let mainProject = await Project.findOne({
    organization: organizationId,
    isPersonal: false,
  });
  if (!mainProject) {
    mainProject = await Project.create({
      organization: organizationId,
      name: "Main",
      isPersonal: false,
    });
  }
  return mainProject;
};

/**
 * Promotes an existing user into the full Account Owner of a brand-new (or
 * already-existing) Organization: a personal project, plus a default shared
 * "Main" project, unconditionally — no plan check. Used by the manual
 * staff-only action (see routes/superAdmin.js) and internally whenever the
 * caller has already decided shared-project capability applies (see
 * projectController.listProjects). Idempotent at every step.
 */
const promoteToAccountOwner = async (userId, organizationName) => {
  const { organization, personalProject, organizationCreated } =
    await ensureOrganizationHome(userId, organizationName);
  const mainProject = await ensureMainProject(organization._id);
  return { organization, mainProject, personalProject, organizationCreated };
};

/**
 * Whether this user's shared-project capability — the "Main" project, "All
 * projects", creating new projects, inviting people — is actually unlocked
 * on `organizationId`. True if they're on an Enterprise plan themselves, OR
 * their organization already has real other members (so it isn't just
 * their own self-serve solo setup — e.g. an Editor invited into someone
 * else's paying team keeps access regardless of their own plan). This is
 * what stops a plain Free/Pro solo account from self-serving its way into
 * shared-project UI the moment it gets a personal project.
 */
const hasUnlockedSharedProjects = async (user, organizationId) => {
  if (user.plan === "enterprise") return true;
  return !(await isTrivialSoloOrganization(organizationId, user.id));
};

const generateToken = () => crypto.randomBytes(32).toString("hex");

/**
 * Mirrors the prototype's inviteUser(email, projectIds[], role) helper, but
 * lets each selected project carry its own role instead of one role shared
 * across every project in the invite.
 * Creates one pending ProjectInvitation covering every selected project.
 */
const inviteUser = async ({
  actingUserId,
  organizationId,
  email,
  projectRoles,
  inviterName,
}) => {
  if (!projectRoles || projectRoles.length === 0) {
    throw new ValidationError("At least one project must be selected");
  }
  for (const { projectId, role } of projectRoles) {
    if (!projectId || !["admin", "editor", "viewer"].includes(role)) {
      throw new ValidationError("Invalid project or role");
    }
  }

  const isOwner = await isAccountOwner(actingUserId, organizationId);
  const normalizedEmail = email.toLowerCase().trim();
  // Look up by email (not just by a pending invitation) so we catch the
  // common case: the invitee already has an account and is already an
  // accepted member of one of the selected projects.
  const invitedUser = await User.findOne({ email: normalizedEmail }).select(
    "_id",
  );

  const resolvedProjects = [];
  for (const { projectId, role } of projectRoles) {
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

    if (invitedUser) {
      const existingMembership = await ProjectMembership.findOne({
        user: invitedUser._id,
        project: project._id,
        acceptedAt: { $ne: null },
      });
      if (existingMembership) {
        throw new ValidationError(
          `${normalizedEmail} is already a member of "${project.name}"`,
        );
      }
    }

    const existingInvitation = await ProjectInvitation.findOne({
      email: normalizedEmail,
      status: "pending",
      expiresAt: { $gt: new Date() },
      "projectRoles.project": project._id,
    });
    if (existingInvitation) {
      throw new ValidationError(
        `${normalizedEmail} already has a pending invitation for "${project.name}"`,
      );
    }

    resolvedProjects.push({ project, role });
  }

  const invitation = await ProjectInvitation.create({
    organization: organizationId,
    email: normalizedEmail,
    projectRoles: resolvedProjects.map(({ project, role }) => ({
      project: project._id,
      role,
    })),
    invitedBy: actingUserId,
    token: generateToken(),
    status: "pending",
    expiresAt: new Date(Date.now() + INVITATION_TTL_MS),
  });

  try {
    await emailService.sendInvitationEmail({
      toEmail: normalizedEmail,
      inviterName,
      projectRoles: resolvedProjects.map(({ project, role }) => ({
        projectName: project.name,
        role,
      })),
      token: invitation.token,
      expiryDays: Math.round(INVITATION_TTL_MS / (24 * 60 * 60 * 1000)),
    });
  } catch (error) {
    logger.error("Failed to send invitation email:", error);
  }

  return invitation;
};

/**
 * Cancels a still-pending invitation (soft: marks it "revoked" rather than
 * deleting, keeping an audit trail). Owner can cancel any invitation on the
 * account; an Admin can only cancel one where every selected project is one
 * they administer — an invitation spanning a project outside their scope is
 * left to the Owner.
 */
const cancelInvitation = async ({
  actingUserId,
  organizationId,
  invitationId,
}) => {
  const invitation = await ProjectInvitation.findOne({
    _id: invitationId,
    organization: organizationId,
  });
  if (!invitation) {
    throw new NotFoundError("Invitation not found");
  }
  if (invitation.status !== "pending") {
    throw new ValidationError("Only pending invitations can be cancelled");
  }

  if (!(await isAccountOwner(actingUserId, organizationId))) {
    const adminProjectIds = await getAdminProjectIds(
      actingUserId,
      organizationId,
    );
    const withinAdminScope = invitation.projectRoles.every((pr) =>
      adminProjectIds.includes(pr.project.toString()),
    );
    if (!withinAdminScope) {
      throw new ForbiddenError("You cannot cancel this invitation");
    }
  }

  invitation.status = "revoked";
  await invitation.save();
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
 * of a user's shared-project memberships. `user.organization` is
 * deliberately left as-is: their personal project lives there and must
 * remain their default fallback (spec 2.5 / user story 9 — "personal
 * project survives removal", which for a full account removal means
 * survives as the account's new default, not just "still exists somewhere
 * unreachable").
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
};

/**
 * True if `organizationId` is just `userId`'s own self-serve solo setup —
 * they own it and nobody else has ever accepted a membership on any project
 * in it — making it safe to abandon in favor of joining a real inviting
 * organization. Every account now gets an organization like this by default
 * (see promoteToAccountOwner), so without this check almost every invite
 * acceptance would hit the cross-org guard below.
 */
const isTrivialSoloOrganization = async (organizationId, userId) => {
  const organization =
    await Organization.findById(organizationId).select("owner");
  if (!organization || organization.owner.toString() !== userId.toString()) {
    return false;
  }
  const hasOtherMembers = await ProjectMembership.exists({
    organization: organizationId,
    user: { $ne: userId },
  });
  return !hasOtherMembers;
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
  const switchingOrganization =
    user.organization &&
    user.organization.toString() !== invitation.organization.toString();
  if (switchingOrganization) {
    const canSwitch = await isTrivialSoloOrganization(
      user.organization,
      user._id,
    );
    if (!canSwitch) {
      throw new ForbiddenError(
        "This account already belongs to a different enterprise account",
      );
    }
  }
  if (!user.organization || switchingOrganization) {
    user.organization = invitation.organization;
    await user.save();
  }

  const now = new Date();
  const memberships = [];
  for (const { project: projectId, role } of invitation.projectRoles) {
    const membership = await ProjectMembership.findOneAndUpdate(
      { project: projectId, user: user._id },
      {
        $setOnInsert: {
          organization: invitation.organization,
          project: projectId,
          user: user._id,
          role,
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

  const existingPersonalProject = await getPersonalProject(
    user._id,
    invitation.organization,
  );
  const personalProject =
    existingPersonalProject ||
    (await createPersonalProject(user._id, invitation.organization));

  await backfillOwnResourcesToProject(
    user._id,
    invitation.organization,
    personalProject._id,
  );

  return { memberships, personalProject };
};

/**
 * Resolve how a list/read endpoint (links, QR codes, domains, analytics)
 * should be scoped for this request. A no-op for solo (non-enterprise)
 * accounts, who keep today's unrestricted, organization-less behavior.
 *
 * - No `user.organization`: not an enterprise account — returns {}.
 * - `requestedProjectId` given: caller must have at least Viewer access on
 *   it; returns { project: requestedProjectId }.
 * - No `requestedProjectId`: only the Account Owner may omit it, to see the
 *   "All projects" aggregate; returns { organization: user.organization }.
 *   Anyone else omitting it is rejected — the frontend always sends the
 *   active project for non-owners (only the Owner is ever offered an
 *   "All projects" view).
 */
/**
 * Loads a client-supplied projectId, scoped to the caller's own
 * organization — a project id belonging to a different organization 404s
 * exactly like attachProjectById, rather than leaking whether it exists.
 */
const loadOwnProject = async (user, projectId) => {
  // A malformed id can never match a real project — treat it the same as
  // "not found" rather than letting Mongoose's CastError bubble up as a 500.
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new NotFoundError("Project not found");
  }
  const project = await Project.findOne({
    _id: projectId,
    organization: user.organization,
  });
  if (!project) {
    throw new NotFoundError("Project not found");
  }
  return project;
};

const resolveReadScope = async (user, requestedProjectId) => {
  if (!user.organization) return {};

  if (requestedProjectId) {
    const project = await loadOwnProject(user, requestedProjectId);
    const role = await getEffectiveRole(user.id, project);
    if (!role) {
      throw new ForbiddenError("You do not have access to this project");
    }
    return { project: project._id };
  }

  if (await isAccountOwner(user.id, user.organization)) {
    // Personal projects are private even from the Account Owner (spec 2.5 /
    // user story 8) — exclude them from the "All projects" aggregate.
    // Resources with no project set at all (pre-migration legacy rows) are
    // intentionally left in scope; see assertCanViewResource.
    const personalProjects = await Project.find({
      organization: user.organization,
      isPersonal: true,
    }).select("_id");
    return {
      organization: user.organization,
      project: { $nin: personalProjects.map((p) => p._id) },
    };
  }

  const adminProjectIds = await getAdminProjectIds(user.id, user.organization);
  if (adminProjectIds.length > 0) {
    return { project: { $in: adminProjectIds } };
  }

  throw new ValidationError("projectId is required");
};

/**
 * Validates + resolves the project a brand-new resource (link, QR code,
 * domain) should be created in. A no-op for solo accounts (returns null).
 *
 * For enterprise accounts, an explicit requestedProjectId (or, for a
 * project-scoped API key — see auth.js#apiKeyAuth — user.apiKeyProjectId)
 * is validated against a write-capable role (owner/admin/editor/
 * personal-owner) on it — Viewers are rejected here.
 *
 * If neither is given (e.g. a caller that predates project-scoping, like the
 * public landing-page shorten flow), falls back to the caller's own personal
 * project rather than failing — every account has one regardless of plan,
 * so it's always a safe, unambiguous default target. Only fails if even that
 * is missing, which should not happen for a real user.
 */
const resolveWriteProject = async (user, requestedProjectId) => {
  if (!user.organization) return null;

  let projectId = requestedProjectId || user.apiKeyProjectId;
  if (!projectId) {
    const personalProject = await getPersonalProject(
      user.id,
      user.organization,
    );
    if (!personalProject) {
      throw new ValidationError("projectId is required");
    }
    projectId = personalProject._id;
  }
  const project = await loadOwnProject(user, projectId);
  const role = await getEffectiveRole(user.id, project);
  if (!["owner", "admin", "editor", "personal-owner"].includes(role)) {
    throw new ForbiddenError("You do not have edit access to this project");
  }
  return project._id;
};

/**
 * Guards viewing an existing project-scoped resource. Derives the access
 * check from the resource's own `project` field, never from a client-
 * supplied projectId. No-op for solo accounts. A resource with no project
 * set (a pre-migration legacy row) is only visible to the Account Owner,
 * fail-closed for everyone else, until it's backfilled.
 */
const assertCanViewResource = async (user, resource) => {
  if (!user.organization) return;
  if (!resource.project) {
    if (await isAccountOwner(user.id, user.organization)) return;
    throw new ForbiddenError(
      "This resource has not been assigned to a project yet",
    );
  }
  const role = await getEffectiveRole(user.id, resource.project);
  if (!role) {
    throw new ForbiddenError("You do not have access to this project");
  }
};

/**
 * Guards mutating (edit/delete) an existing project-scoped resource. Same
 * derive-from-the-resource's-own-project rule as assertCanViewResource —
 * this is what stops an Editor on Project A from spoofing edit rights over
 * a resource that actually lives in Project B by passing a different
 * projectId in the request body.
 */
const assertCanEditResource = async (user, resource) => {
  if (!user.organization) return;
  if (!resource.project) {
    if (await isAccountOwner(user.id, user.organization)) return;
    throw new ForbiddenError(
      "This resource has not been assigned to a project yet",
    );
  }
  if (!(await canEditProject(user.id, resource.project))) {
    throw new ForbiddenError("You do not have edit access to this project");
  }
};

/**
 * Guards account-level (not project-owned) sensitive actions — namely the
 * project-scoped API key — that still need to respect per-project roles.
 * No-op for solo accounts. Enterprise accounts must always supply a
 * projectId: a key belongs to one specific project, so there is no "All
 * projects" equivalent to check against (unlike resolveReadScope/
 * resolveWriteProject). Requires a write-capable role on that project.
 */
const assertAccountLevelEditAccess = async (user, projectId) => {
  if (!user.organization) return;

  if (!projectId) {
    throw new ValidationError("projectId is required");
  }
  const project = await loadOwnProject(user, projectId);
  const role = await getEffectiveRole(user.id, project);
  if (!["owner", "admin", "editor", "personal-owner"].includes(role)) {
    throw new ForbiddenError("You do not have edit access to this project");
  }
};

module.exports = {
  ForbiddenError,
  NotFoundError,
  ValidationError,
  isAccountOwner,
  getAccountOwnerId,
  getAdminProjectIds,
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
  ensureOrganizationHome,
  ensureMainProject,
  promoteToAccountOwner,
  hasUnlockedSharedProjects,
  inviteUser,
  cancelInvitation,
  changeMemberRole,
  removeMemberFromProject,
  removeUserFromAccount,
  acceptInvitation,
  resolveReadScope,
  resolveWriteProject,
  assertCanViewResource,
  assertCanEditResource,
  assertAccountLevelEditAccess,
};
