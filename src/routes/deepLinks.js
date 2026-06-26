const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { handleDeferredLink } = require('../controllers/deferredLinkController');
const { resolveDeepLink } = require('../controllers/appRegistrationController');

// POST /api/v1/deferred-link — called by mobile app on first launch (API key auth, no JWT)
router.post('/deferred-link', handleDeferredLink);

// GET /api/v1/deep-link/resolve/:shortCode — called by app after Universal Link fires (API key auth)
router.get('/resolve/:shortCode', resolveDeepLink);

module.exports = router;
