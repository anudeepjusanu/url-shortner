const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { bypassLimiter } = require('../middleware/rateLimiter');
const {
  validateObjectId,
  validatePagination,
  validateAdminUserUpdate,
  sanitizeInput
} = require('../middleware/validation');

router.use(sanitizeInput);
router.use(authenticate);
router.use(requireAdmin);
router.use(bypassLimiter);

router.get('/stats', adminController.getSystemStats);

router.get('/users', validatePagination, adminController.getUsers);
router.put('/users/:id', validateObjectId, validateAdminUserUpdate, adminController.updateUser);
router.delete('/users/:id', validateObjectId, adminController.deleteUser);

router.get('/urls', validatePagination, adminController.getAllUrls);
router.put('/urls/:id', validateObjectId, adminController.updateUrl);
router.delete('/urls/:id', validateObjectId, adminController.deleteUrl);

router.get('/organizations', validatePagination, adminController.getOrganizations);

module.exports = router;