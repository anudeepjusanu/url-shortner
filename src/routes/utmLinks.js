const express = require('express');
const router = express.Router();
const utmLinkController = require('../controllers/utmLinkController');
const { authenticateAny } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(authenticateAny, apiLimiter);

router.get('/', utmLinkController.getUserUtmLinks);
router.post('/', utmLinkController.createUtmLink);
router.delete('/:id', utmLinkController.deleteUtmLink);

module.exports = router;
