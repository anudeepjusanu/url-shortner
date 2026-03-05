const express = require('express');
const router = express.Router();
const countryCodeController = require('../controllers/countryCodeController');
const { authenticate } = require('../middleware/auth');

// Public endpoint – no auth required
router.get('/', countryCodeController.getCountryCodes);

// Admin-only: add/update a country code
router.put('/', authenticate, countryCodeController.upsertCountryCode);

module.exports = router;
