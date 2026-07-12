const utmLinkService = require("../services/utmLinkService");
const projectAccessService = require("../services/projectAccessService");

// Enterprise RBAC: projectAccessService throws ForbiddenError/NotFoundError/
// ValidationError (each carrying a .statusCode). See urlController.js for
// the same pattern.
const createUtmLink = async (req, res) => {
  try {
    const { projectId, ...data } = req.body;

    // Enterprise RBAC: resolves to null for solo accounts; for enterprise
    // accounts, requires projectId + a write-capable role and 403s Viewers.
    const resolvedProjectId = await projectAccessService.resolveWriteProject(
      req.user,
      projectId,
    );

    const utmLink = await utmLinkService.createUtmLink(
      req.user.id,
      req.user.organization,
      resolvedProjectId,
      data,
    );
    res.status(201).json({
      success: true,
      message: "UTM link saved successfully",
      data: { utmLink },
    });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};

const getUserUtmLinks = async (req, res) => {
  try {
    // Enterprise RBAC: {} for solo accounts (unchanged below), { project }
    // for a specific project, or { organization } for the Account Owner's
    // "All projects" aggregate.
    const scope = await projectAccessService.resolveReadScope(
      req.user,
      req.query.projectId,
    );
    const filter = { ...scope };
    if (!req.user.organization) {
      filter.creator = req.user.id;
    }

    const utmLinks = await utmLinkService.getUtmLinks(filter);
    res.json({ success: true, data: { utmLinks } });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};

const deleteUtmLink = async (req, res) => {
  try {
    await utmLinkService.deleteUtmLink(req.params.id, req.user);
    res.json({ success: true, message: "UTM link deleted successfully" });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};

module.exports = {
  createUtmLink,
  getUserUtmLinks,
  deleteUtmLink,
};
