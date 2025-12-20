const express = require('express');
const router = express.Router();
const preferencesController = require('../controllers/preferencesController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get all notification preferences
router.get('/notifications', preferencesController.getNotificationPreferences);

// Update all notification preferences
router.put('/notifications', preferencesController.updateNotificationPreferences);

// Toggle single notification setting
router.patch('/notifications/:category/:setting', preferencesController.toggleNotification);

// Toggle entire category
router.patch('/notifications/category/:category', preferencesController.toggleCategory);

// Get report preview
router.get('/reports/:type/preview', preferencesController.getReportPreview);

// Send test notification
router.post('/notifications/test', preferencesController.sendTestNotification);

module.exports = router;
