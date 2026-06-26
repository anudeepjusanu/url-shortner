const express = require('express');
const router = express.Router();
const { serveAASA, serveAssetLinks } = require('../controllers/wellKnownController');

// These two routes must be accessible without authentication.
// They are mounted at / in app.js and must be registered BEFORE any auth middleware.
router.get('/apple-app-site-association', serveAASA);
router.get('/assetlinks.json', serveAssetLinks);

module.exports = router;
