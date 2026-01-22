const express = require('express');
const router = express.Router();
const sitemapController = require('../controllers/sitemapController');

// GET /sitemap.xml
router.get('/sitemap.xml', sitemapController.generateSitemap);

module.exports = router;
