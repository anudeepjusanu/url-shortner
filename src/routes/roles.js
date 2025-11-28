const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { authenticate } = require('../middleware/auth');
const { requireAdminOrAbove } = require('../middleware/permissions');

/**
 * @route   GET /api/roles/my-permissions
 * @desc    Get current user's permissions
 * @access  Private
 */
router.get('/my-permissions', authenticate, roleController.getMyPermissions);

/**
 * @route   GET /api/roles
 * @desc    Get all available roles and their permissions
 * @access  Private - Admin+
 */
router.get('/', authenticate, requireAdminOrAbove, roleController.getAllRoles);

/**
 * @route   GET /api/roles/users
 * @desc    Get all users with their roles
 * @access  Private - Admin+
 */
router.get('/users', authenticate, requireAdminOrAbove, roleController.getUsersWithRoles);

/**
 * @route   PUT /api/roles/users/:userId/role
 * @desc    Update a user's role
 * @access  Private - Admin+
 */
router.put('/users/:userId/role', authenticate, requireAdminOrAbove, roleController.updateUserRole);

/**
 * @route   PUT /api/roles/users/:userId/permissions
 * @desc    Update a user's custom permissions
 * @access  Private - Admin+
 */
router.put('/users/:userId/permissions', authenticate, requireAdminOrAbove, roleController.updateUserPermissions);

module.exports = router;
