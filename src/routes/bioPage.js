const express = require('express');
const router = express.Router();
const bioPageController = require('../controllers/bioPageController');
const { authenticate } = require('../middleware/auth');
const { validateBioPage } = require('../middleware/validation');

// Public routes
router.get('/public/:slug', bioPageController.getBioPageBySlug);
router.post('/public/:slug/track/:linkId', bioPageController.trackLinkClick);
router.post('/public/:slug/subscribe', bioPageController.addEmailSubscriber);

// Protected routes
router.use(authenticate);

router.post('/', validateBioPage, bioPageController.createBioPage);
router.get('/me', bioPageController.getMyBioPage);
router.put('/', validateBioPage, bioPageController.updateBioPage);
router.delete('/', bioPageController.deleteBioPage);
router.get('/analytics', bioPageController.getBioPageAnalytics);
router.get('/check-slug/:slug', bioPageController.checkSlugAvailability);

module.exports = router;
