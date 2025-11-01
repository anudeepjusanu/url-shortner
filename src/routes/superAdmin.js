const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const { authenticate } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/superAdmin');

// All routes require authentication and super admin role
router.use(authenticate);
router.use(requireSuperAdmin);

// Dashboard and analytics
router.get('/dashboard/stats', superAdminController.getDashboardStats);
router.get('/analytics', superAdminController.getAnalytics);
router.get('/system/health', superAdminController.getSystemHealth);

// User management
router.get('/users', superAdminController.getAllUsers);
router.put('/users/:userId', superAdminController.updateUserStatus);
router.delete('/users/:userId', superAdminController.deleteUser);

module.exports = router;