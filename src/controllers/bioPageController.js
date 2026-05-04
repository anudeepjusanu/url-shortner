const bioPageService = require('../services/bioPageService');

const createBioPage = async (req, res) => {
  try {
    const bioPage = await bioPageService.createBioPage(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Bio page created successfully',
      data: bioPage,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const getUserBioPages = async (req, res) => {
  try {
    const bioPages = await bioPageService.getUserBioPages(req.user.id);
    res.json({ success: true, data: bioPages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBioPageById = async (req, res) => {
  try {
    const bioPage = await bioPageService.getBioPageById(req.params.id, req.user.id);
    res.json({ success: true, data: bioPage });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const updateBioPage = async (req, res) => {
  try {
    const bioPage = await bioPageService.updateBioPage(req.params.id, req.user.id, req.body);
    res.json({
      success: true,
      message: 'Bio page updated successfully',
      data: bioPage,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const deleteBioPage = async (req, res) => {
  try {
    await bioPageService.deleteBioPage(req.params.id, req.user.id);
    res.json({ success: true, message: 'Bio page deleted successfully' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const getPublicBioPage = async (req, res) => {
  try {
    const data = await bioPageService.getPublicBioPage(req.params.username);
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const trackLinkClick = async (req, res) => {
  try {
    const { url } = await bioPageService.trackLinkClick(
      req.params.username,
      req.params.linkId
    );
    res.json({ success: true, data: { url } });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const checkUsernameAvailability = async (req, res) => {
  try {
    const result = await bioPageService.checkUsernameAvailability(req.params.username);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBioPageAnalytics = async (req, res) => {
  try {
    const analytics = await bioPageService.getBioPageAnalytics(req.params.id, req.user.id);
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const generateBgImage = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }
    const result = await bioPageService.generateBgImage(prompt.trim());
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createBioPage,
  getUserBioPages,
  getBioPageById,
  updateBioPage,
  deleteBioPage,
  getPublicBioPage,
  trackLinkClick,
  checkUsernameAvailability,
  getBioPageAnalytics,
  generateBgImage,
};
