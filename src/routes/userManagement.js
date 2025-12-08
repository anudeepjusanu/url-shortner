const express = require('express');
const router = express.Router();
const userManagementController = require('../controllers/userManagementController');
const { authenticate, requireRole } = require('../middleware/auth');

// All routes require authentication and admin or super_admin role
router.use(authenticate);
router.use(requireRole(['admin', 'super_admin']));

// Get all users with filters
router.get('/', userManagementController.getAllUsers);

// Get user statistics
router.get('/stats', userManagementController.getUserStats);

// Get single user details
router.get('/:userId', userManagementController.getUser);

// Update user status (activate/deactivate, change plan)
router.put('/:userId/status', userManagementController.updateUserStatus);

// Delete user
router.delete('/:userId', userManagementController.deleteUser);

module.exports = router;
