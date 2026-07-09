const utmLinkService = require('../services/utmLinkService');

const createUtmLink = async (req, res) => {
  try {
    const utmLink = await utmLinkService.createUtmLink(
      req.user.id,
      req.user.organization,
      req.body,
    );
    res.status(201).json({
      success: true,
      message: 'UTM link saved successfully',
      data: { utmLink },
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const getUserUtmLinks = async (req, res) => {
  try {
    const utmLinks = await utmLinkService.getUserUtmLinks(req.user.id);
    res.json({ success: true, data: { utmLinks } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteUtmLink = async (req, res) => {
  try {
    await utmLinkService.deleteUtmLink(req.params.id, req.user.id);
    res.json({ success: true, message: 'UTM link deleted successfully' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createUtmLink,
  getUserUtmLinks,
  deleteUtmLink,
};
