const express = require('express');
const router = express.Router();
const bioPageController = require('../controllers/bioPageController');
const { authenticate } = require('../middleware/auth');

// Public routes — no authentication required
router.get('/public/:username', bioPageController.getPublicBioPage);
router.post('/public/:username/click/:linkId', bioPageController.trackLinkClick);
router.get('/check-username/:username', bioPageController.checkUsernameAvailability);

// AI background image generation (authenticated)
router.post('/generate-bg-image', require('../middleware/auth').authenticate, bioPageController.generateBgImage);

// Protected routes — authentication required
router.use(authenticate);

router.get('/', bioPageController.getUserBioPages);
router.post('/', bioPageController.createBioPage);
router.get('/:id', bioPageController.getBioPageById);
router.put('/:id', bioPageController.updateBioPage);
router.delete('/:id', bioPageController.deleteBioPage);
router.get('/:id/analytics', bioPageController.getBioPageAnalytics);

module.exports = router;
