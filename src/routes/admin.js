const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/superAdmin');
const { bypassLimiter } = require('../middleware/rateLimiter');
const {
  validateObjectId,
  validatePagination,
  validateAdminUserUpdate,
  sanitizeInput
} = require('../middleware/validation');

router.use(sanitizeInput);
router.use(authenticate);
router.use(bypassLimiter);

// Stats endpoint - available to both admin and super_admin
router.get('/stats', requireAdmin, adminController.getSystemStats);

// User management - available to both admin and super_admin
router.get('/users', requireAdmin, validatePagination, adminController.getUsers);
router.put('/users/:id', requireAdmin, validateObjectId, validateAdminUserUpdate, adminController.updateUser);
router.delete('/users/:id', requireAdmin, validateObjectId, adminController.deleteUser);

// URL management - SUPER ADMIN ONLY
router.get('/urls', requireSuperAdmin, validatePagination, adminController.getAllUrls);
router.put('/urls/:id', requireSuperAdmin, validateObjectId, adminController.updateUrl);
router.delete('/urls/:id', requireSuperAdmin, validateObjectId, adminController.deleteUrl);

// Organizations - available to both admin and super_admin
router.get('/organizations', requireAdmin, validatePagination, adminController.getOrganizations);

module.exports = router;