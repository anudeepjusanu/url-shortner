const express = require('express');
const router = express.Router();
const linkHealthController = require('../controllers/linkHealthController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Health monitoring management
router.post('/:urlId/enable', linkHealthController.enableHealthMonitoring);
router.post('/:urlId/disable', linkHealthController.disableHealthMonitoring);
router.get('/:urlId/status', linkHealthController.getHealthStatus);
router.post('/:urlId/check', linkHealthController.triggerHealthCheck);

// Alerts
router.get('/alerts', linkHealthController.getAlerts);
router.post('/:urlId/alerts/:alertId/acknowledge', linkHealthController.acknowledgeAlert);

// Overview
router.get('/monitored', linkHealthController.getMonitoredUrls);

module.exports = router;
