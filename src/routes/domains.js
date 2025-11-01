const express = require('express');
const router = express.Router();
const domainController = require('../controllers/domainController');
const { authenticate } = require('../middleware/auth');
const { validateDomain } = require('../middleware/validation');

// Apply authentication to all domain routes
router.use(authenticate);

// Domain CRUD operations
router.post('/', validateDomain, domainController.addDomain);
router.get('/', domainController.getDomains);
router.get('/stats', domainController.getDomainStats);
router.get('/:id', domainController.getDomain);
router.put('/:id', domainController.updateDomain);
router.delete('/:id', domainController.deleteDomain);

// Domain verification and management
router.post('/:id/verify', domainController.verifyDomain);
router.post('/:id/set-default', domainController.setDefaultDomain);

// Domain information lookup
router.get('/info/:domain', domainController.getDomainInfo);

module.exports = router;