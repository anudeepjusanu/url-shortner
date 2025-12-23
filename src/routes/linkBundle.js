const express = require('express');
const router = express.Router();
const linkBundleController = require('../controllers/linkBundleController');
const { authenticate } = require('../middleware/auth');
const { validateLinkBundle } = require('../middleware/validation');

// Public routes
router.get('/public/:slug', linkBundleController.getBundleBySlug);

// Protected routes
router.use(authenticate);

router.post('/', validateLinkBundle, linkBundleController.createBundle);
router.get('/', linkBundleController.getBundles);
router.get('/:id', linkBundleController.getBundle);
router.put('/:id', validateLinkBundle, linkBundleController.updateBundle);
router.delete('/:id', linkBundleController.deleteBundle);

// Link management
router.post('/:id/links', linkBundleController.addLinkToBundle);
router.delete('/:id/links/:linkId', linkBundleController.removeLinkFromBundle);

// Analytics and export
router.get('/:id/analytics', linkBundleController.getBundleAnalytics);
router.get('/:id/export', linkBundleController.exportBundle);

module.exports = router;
