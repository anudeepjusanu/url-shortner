const paymentService = require('../services/paymentService');
const { UsageTracker } = require('../middleware/usageTracker');
const User = require('../models/User');
const Plan = require('../models/Plan');

const createSubscription = async (req, res) => {
  try {
    const { planName, paymentMethodId } = req.body;
    const userId = req.user.id;

    if (!planName || !paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'Plan name and payment method are required'
      });
    }

    const subscription = await paymentService.createSubscription(
      userId,
      planName,
      paymentMethodId
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

module.exports = {
  createSubscription,
  cancelSubscription,
  updateSubscription,
  getSubscriptionStatus,
  getPaymentHistory,
  createSetupIntent,
  handleWebhook,
  getAvailablePlans
};