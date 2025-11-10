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
router.post('/pause', subscriptionController.pauseSubscription);
router.post('/resume', subscriptionController.resumeSubscription);

// Payment methods
router.post('/setup-intent', subscriptionController.createSetupIntent);
router.post('/payment-methods', subscriptionController.addPaymentMethod);
router.get('/payment-methods', subscriptionController.getPaymentMethods);
router.delete('/payment-methods/:paymentMethodId', subscriptionController.removePaymentMethod);
router.put('/payment-methods/:paymentMethodId/default', subscriptionController.setDefaultPaymentMethod);

// Payment history and invoices
router.get('/payment-history', subscriptionController.getPaymentHistory);
router.get('/invoices/:invoiceId/download', subscriptionController.downloadInvoice);

// Billing and usage
router.get('/billing', subscriptionController.getBillingDetails);

// Coupons
router.post('/validate-coupon', subscriptionController.validateCoupon);
router.post('/apply-coupon', subscriptionController.applyCoupon);

module.exports = router;