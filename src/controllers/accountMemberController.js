const ProjectMembership = require('../models/ProjectMembership');
const ProjectInvitation = require('../models/ProjectInvitation');
const Project = require('../models/Project');
const User = require('../models/User');
const projectAccessService = require('../services/projectAccessService');
const logger = require('../config/logger');

// Projects this caller is allowed to see members/invitations for: every
// shared project for the Account Owner, or just the ones they administer.
const getVisibleProjectIds = async (req) => {
  if (req.isAccountOwner) {
    const projects = await Project.find({ organization: req.user.organization, isPersonal: false }).select('_id');
    return projects.map((p) => p._id.toString());
  }

  const rows = await ProjectMembership.find({
    user: req.user.id,
    organization: req.user.organization,
    role: 'admin',
    acceptedAt: { $ne: null }
  }).select('project');
  return rows.map((r) => r.project.toString());
};

// GET /api/account/members — one row per account member (User Management overview).
const getOverview = async (req, res) => {
  try {
    const visibleProjectIds = await getVisibleProjectIds(req);

    const memberships = await ProjectMembership.find({ project: { $in: visibleProjectIds } })
      .populate('user', 'firstName lastName email')
      .populate('project', 'name');

    const membersByUser = new Map();
    for (const membership of memberships) {
      if (!membership.user) continue;
      const key = membership.user._id.toString();
      if (!membersByUser.has(key)) {
        membersByUser.set(key, {
          userId: key,
          firstName: membership.user.firstName,
          lastName: membership.user.lastName,
          email: membership.user.email,
          roles: []
        });
      }
      membersByUser.get(key).roles.push({
        projectId: membership.project._id,
        projectName: membership.project.name,
        role: membership.role
      });
    }

    const invitations = await ProjectInvitation.find({
      status: 'pending',
      expiresAt: { $gt: new Date() },
      projects: { $in: visibleProjectIds }
    }).populate('projects', 'name');

    res.json({
      success: true,
      data: {
        isAccountOwner: !!req.isAccountOwner,
        members: Array.from(membersByUser.values()).map((m) => ({ ...m, projectCount: m.roles.length })),
        pendingInvitations: invitations.map((inv) => ({
          id: inv._id,
          email: inv.email,
          role: inv.role,
          projects: inv.projects.map((p) => ({ id: p._id, name: p.name })),
          invitedAt: inv.createdAt,
          expiresAt: inv.expiresAt
        }))
      }
    });
  } catch (error) {
    logger.error('getOverview error:', error);
    res.status(500).json({ success: false, message: 'Failed to load account members' });
  }
};

// GET /api/account/members/:userId — per-user page: every project + role for that user.
const getMemberDetail = async (req, res) => {
  try {
    const { userId } = req.params;
    const visibleProjectIds = await getVisibleProjectIds(req);

    const memberships = await ProjectMembership.find({
      user: userId,
      project: { $in: visibleProjectIds }
    }).populate('project', 'name');

    const projects = await Promise.all(
      memberships.map(async (membership) => ({
        membershipId: membership._id,
        projectId: membership.project._id,
        projectName: membership.project.name,
        role: membership.role,
        assignableRoles: await projectAccessService.assignableRolesForProject(req.user.id, membership.project._id)
      }))
    );

    const targetUser = await User.findById(userId).select('firstName lastName email');
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: { user: targetUser, projects } });
  } catch (error) {
    logger.error('getMemberDetail error:', error);
    res.status(500).json({ success: false, message: 'Failed to load member detail' });
  }
};

// POST /api/account/invitations — Owner (any project) or Admin (their own project(s)).
const inviteMember = async (req, res) => {
  try {
    const { email, projectIds, role } = req.body;
    if (!email || !Array.isArray(projectIds) || projectIds.length === 0 || !role) {
      return res.status(400).json({ success: false, message: 'email, projectIds and role are required' });
    }

    const inviter = await User.findById(req.user.id).select('firstName lastName');
    const invitation = await projectAccessService.inviteUser({
      actingUserId: req.user.id,
      organizationId: req.user.organization,
      email,
      projectIds,
      role,
      inviterName: inviter ? `${inviter.firstName} ${inviter.lastName || ''}`.trim() : undefined
    });

    res.status(201).json({ success: true, data: invitation });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    logger.error('inviteMember error:', error);
    res.status(500).json({ success: false, message: 'Failed to send invitation' });
  }
};

// DELETE /api/account/members/:userId — Account Owner only, page-level "Remove from account".
const removeFromAccount = async (req, res) => {
  try {
    await projectAccessService.removeUserFromAccount({
      actingUserId: req.user.id,
      userId: req.params.userId,
      organizationId: req.user.organization
    });
    res.json({ success: true, message: 'User removed from the account' });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    logger.error('removeFromAccount error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove user from account' });
  }
};

// POST /api/account/invitations/:token/accept
const acceptInvitation = async (req, res) => {
  try {
    const result = await projectAccessService.acceptInvitation({
      token: req.params.token,
      acceptingUser: req.user
    });
    res.json({ success: true, data: result });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    logger.error('acceptInvitation error:', error);
    res.status(500).json({ success: false, message: 'Failed to accept invitation' });
  }
};

module.exports = {
  getOverview,
  getMemberDetail,
  inviteMember,
  removeFromAccount,
  acceptInvitation
};
