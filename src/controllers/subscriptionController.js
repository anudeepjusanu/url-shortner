const paymentService = require('../services/paymentService');
const { UsageTracker } = require('../middleware/usageTracker');
const User = require('../models/User');
const Plan = require('../models/Plan');

const createSubscription = async (req, res) => {
  try {
    const { planName, paymentMethodId, billingCycle, couponCode, trialDays } = req.body;
    const userId = req.user.id;

    if (!planName || !paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'Plan name and payment method are required'
      });
    }

    const options = {
      billingCycle: billingCycle || 'monthly',
      couponCode: couponCode || null,
      trialDays: trialDays !== undefined ? trialDays : 14
    };

    const subscription = await paymentService.createSubscription(
      userId,
      planName,
      paymentMethodId,
      options
    );

    res.json({
      success: true,
      message: 'Subscription created successfully',
      data: { subscription }
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create subscription'
    });
  }
};

const cancelSubscription = async (req, res) => {
  try {
    const { immediate = false } = req.body;
    const userId = req.user.id;

    const subscription = await paymentService.cancelSubscription(userId, immediate);

    res.json({
      success: true,
      message: immediate ? 'Subscription cancelled immediately' : 'Subscription will cancel at period end',
      data: { subscription }
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel subscription'
    });
  }
};

const updateSubscription = async (req, res) => {
  try {
    const { planName } = req.body;
    const userId = req.user.id;

    if (!planName) {
      return res.status(400).json({
        success: false,
        message: 'Plan name is required'
      });
    }

    const subscription = await paymentService.updateSubscription(userId, planName);

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: { subscription }
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update subscription'
    });
  }
};

const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('plan subscription');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const plan = await Plan.getByName(user.plan);
    const usage = await UsageTracker.getUserUsage(userId);

    res.json({
      success: true,
      data: {
        plan: user.plan,
        subscription: user.subscription,
        planDetails: plan,
        usage: usage
      }
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription status'
    });
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await paymentService.getPaymentHistory(userId);

    res.json({
      success: true,
      data: { history }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history'
    });
  }
};

const createSetupIntent = async (req, res) => {
  try {
    const userId = req.user.id;
    const setupIntent = await paymentService.createSetupIntent(userId);

    res.json({
      success: true,
      data: { setupIntent }
    });
  } catch (error) {
    console.error('Create setup intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create setup intent'
    });
  }
};

const handleWebhook = async (req, res) => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      const sig = req.headers['stripe-signature'];
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    await paymentService.handleWebhook(event);

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handling error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook handling failed'
    });
  }
};

const getAvailablePlans = async (req, res) => {
  try {
    const plans = await Plan.getAllPlans();

    res.json({
      success: true,
      data: { plans }
    });
  } catch (error) {
    console.error('Get available plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available plans'
    });
  }
};

// Payment method management
const addPaymentMethod = async (req, res) => {
  try {
    const { paymentMethodId, setAsDefault } = req.body;
    const userId = req.user.id;

    if (!paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'Payment method ID is required'
      });
    }

    const paymentMethod = await paymentService.addPaymentMethod(
      userId,
      paymentMethodId,
      setAsDefault || false
    );

    res.json({
      success: true,
      message: 'Payment method added successfully',
      data: { paymentMethod }
    });
  } catch (error) {
    console.error('Add payment method error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add payment method'
    });
  }
};

const removePaymentMethod = async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    const userId = req.user.id;

    await paymentService.removePaymentMethod(userId, paymentMethodId);

    res.json({
      success: true,
      message: 'Payment method removed successfully'
    });
  } catch (error) {
    console.error('Remove payment method error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove payment method'
    });
  }
};

const setDefaultPaymentMethod = async (req, res) => {
  try {
    const { paymentMethodId } = req.params;
    const userId = req.user.id;

    const paymentMethod = await paymentService.setDefaultPaymentMethod(userId, paymentMethodId);

    res.json({
      success: true,
      message: 'Default payment method updated',
      data: { paymentMethod }
    });
  } catch (error) {
    console.error('Set default payment method error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to set default payment method'
    });
  }
};

const getPaymentMethods = async (req, res) => {
  try {
    const userId = req.user.id;
    const paymentMethods = await paymentService.getPaymentMethods(userId);

    res.json({
      success: true,
      data: { paymentMethods }
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment methods'
    });
  }
};

// Subscription pause/resume
const pauseSubscription = async (req, res) => {
  try {
    const { resumeAt } = req.body;
    const userId = req.user.id;

    const subscription = await paymentService.pauseSubscription(
      userId,
      resumeAt ? new Date(resumeAt) : null
    );

    res.json({
      success: true,
      message: 'Subscription paused successfully',
      data: { subscription }
    });
  } catch (error) {
    console.error('Pause subscription error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to pause subscription'
    });
  }
};

const resumeSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const subscription = await paymentService.resumeSubscription(userId);

    res.json({
      success: true,
      message: 'Subscription resumed successfully',
      data: { subscription }
    });
  } catch (error) {
    console.error('Resume subscription error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to resume subscription'
    });
  }
};

// Coupon validation
const validateCoupon = async (req, res) => {
  try {
    const { couponCode, planName } = req.body;
    const userId = req.user.id;

    if (!couponCode || !planName) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code and plan name are required'
      });
    }

    const coupon = await paymentService.validateCoupon(couponCode, userId, planName);

    res.json({
      success: true,
      data: {
        coupon: {
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          validUntil: coupon.validUntil
        }
      }
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Invalid coupon code'
    });
  }
};

const applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;
    const userId = req.user.id;

    if (!couponCode) {
      return res.status(400).json({
        success: false,
        message: 'Coupon code is required'
      });
    }

    const subscription = await paymentService.applyCouponToSubscription(userId, couponCode);

    res.json({
      success: true,
      message: 'Coupon applied successfully',
      data: { subscription }
    });
  } catch (error) {
    console.error('Apply coupon error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to apply coupon'
    });
  }
};

// Billing details
const getBillingDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const billingDetails = await paymentService.getBillingDetails(userId);

    res.json({
      success: true,
      data: billingDetails
    });
  } catch (error) {
    console.error('Get billing details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch billing details'
    });
  }
};

// Download invoice
const downloadInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const userId = req.user.id;

    const invoice = await paymentService.downloadInvoice(userId, invoiceId);

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Download invoice error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to download invoice'
    });
  }
};

module.exports = {
  createSubscription,
  cancelSubscription,
  updateSubscription,
  getSubscriptionStatus,
  getPaymentHistory,
  createSetupIntent,
  handleWebhook,
  getAvailablePlans,
  // Payment methods
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
  getPaymentMethods,
  // Pause/Resume
  pauseSubscription,
  resumeSubscription,
  // Coupons
  validateCoupon,
  applyCoupon,
  // Billing
  getBillingDetails,
  downloadInvoice
};