const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticate } = require('../middleware/auth');

// Webhook endpoint (must be before other middleware)
router.post('/webhook', express.raw({ type: 'application/json' }), subscriptionController.handleWebhook);

// Get available plans (public)
router.get('/plans', subscriptionController.getAvailablePlans);

// Protected routes - require authentication
router.use(authenticate);

// Subscription management
router.post('/create', subscriptionController.createSubscription);
router.post('/cancel', subscriptionController.cancelSubscription);
router.post('/update', subscriptionController.updateSubscription);
router.get('/status', subscriptionController.getSubscriptionStatus);

// Payment methods and history
router.post('/setup-intent', subscriptionController.createSetupIntent);
router.get('/payment-history', subscriptionController.getPaymentHistory);

module.exports = router;