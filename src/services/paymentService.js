const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Plan = require('../models/Plan');
const emailService = require('./emailService');

class PaymentService {
  // Create Stripe customer
  async createCustomer(user) {
    try {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user._id.toString()
        }
      });

      // Update user with Stripe customer ID
      await User.findByIdAndUpdate(user._id, {
        'subscription.stripeCustomerId': customer.id
      });

      return customer;
    } catch (error) {
      console.error('Create customer error:', error);
      throw error;
    }
  }

  // Create subscription
  async createSubscription(userId, planName, paymentMethodId) {
    try {
      const user = await User.findById(userId);
      const plan = await Plan.getByName(planName);

      if (!user || !plan) {
        throw new Error('User or plan not found');
      }

      // Create customer if doesn't exist
      let customerId = user.subscription.stripeCustomerId;
      if (!customerId) {
        const customer = await this.createCustomer(user);
        customerId = customer.id;
      }

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: plan.stripePriceId.monthly }],
        default_payment_method: paymentMethodId,
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user subscription info
      await User.findByIdAndUpdate(userId, {
        plan: planName,
        'subscription.stripeSubscriptionId': subscription.id,
        'subscription.status': subscription.status,
        'subscription.currentPeriodStart': new Date(subscription.current_period_start * 1000),
        'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
      });

      // Send upgrade confirmation email
      await emailService.sendUpgradeConfirmation(user, planName);

      return subscription;
    } catch (error) {
      console.error('Create subscription error:', error);
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(userId, immediate = false) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.subscription.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      let subscription;
      if (immediate) {
        // Cancel immediately
        subscription = await stripe.subscriptions.cancel(user.subscription.stripeSubscriptionId);

        await User.findByIdAndUpdate(userId, {
          plan: 'free',
          'subscription.status': 'cancelled',
          'subscription.cancelAtPeriodEnd': false,
        });
      } else {
        // Cancel at period end
        subscription = await stripe.subscriptions.update(user.subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });

        await User.findByIdAndUpdate(userId, {
          'subscription.cancelAtPeriodEnd': true,
        });
      }

      return subscription;
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw error;
    }
  }

  // Update subscription
  async updateSubscription(userId, newPlanName) {
    try {
      const user = await User.findById(userId);
      const newPlan = await Plan.getByName(newPlanName);

      if (!user || !newPlan || !user.subscription.stripeSubscriptionId) {
        throw new Error('User, plan, or subscription not found');
      }

      // Get current subscription
      const subscription = await stripe.subscriptions.retrieve(user.subscription.stripeSubscriptionId);

      // Update subscription
      const updatedSubscription = await stripe.subscriptions.update(user.subscription.stripeSubscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPlan.stripePriceId.monthly,
        }],
        proration_behavior: 'create_prorations',
      });

      // Update user plan
      await User.findByIdAndUpdate(userId, {
        plan: newPlanName,
        'subscription.status': updatedSubscription.status,
      });

      return updatedSubscription;
    } catch (error) {
      console.error('Update subscription error:', error);
      throw error;
    }
  }

  // Handle webhook events
  async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Webhook handling error:', error);
    }
  }

  async handlePaymentSucceeded(invoice) {
    const user = await User.findOne({ 'subscription.stripeCustomerId': invoice.customer });
    if (user) {
      await User.findByIdAndUpdate(user._id, {
        'subscription.status': 'active',
        'subscription.currentPeriodStart': new Date(invoice.period_start * 1000),
        'subscription.currentPeriodEnd': new Date(invoice.period_end * 1000),
      });
    }
  }

  async handlePaymentFailed(invoice) {
    const user = await User.findOne({ 'subscription.stripeCustomerId': invoice.customer });
    if (user) {
      await User.findByIdAndUpdate(user._id, {
        'subscription.status': 'past_due',
      });
    }
  }

  async handleSubscriptionUpdated(subscription) {
    const user = await User.findOne({ 'subscription.stripeCustomerId': subscription.customer });
    if (user) {
      await User.findByIdAndUpdate(user._id, {
        'subscription.status': subscription.status,
        'subscription.currentPeriodStart': new Date(subscription.current_period_start * 1000),
        'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
        'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end,
      });
    }
  }

  async handleSubscriptionDeleted(subscription) {
    const user = await User.findOne({ 'subscription.stripeCustomerId': subscription.customer });
    if (user) {
      await User.findByIdAndUpdate(user._id, {
        plan: 'free',
        'subscription.status': 'cancelled',
        'subscription.stripeSubscriptionId': null,
        'subscription.cancelAtPeriodEnd': false,
      });
    }
  }

  // Get payment history
  async getPaymentHistory(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.subscription.stripeCustomerId) {
        return [];
      }

      const invoices = await stripe.invoices.list({
        customer: user.subscription.stripeCustomerId,
        limit: 10,
      });

      return invoices.data.map(invoice => ({
        id: invoice.id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        status: invoice.status,
        date: new Date(invoice.created * 1000),
        pdf: invoice.hosted_invoice_url,
      }));
    } catch (error) {
      console.error('Get payment history error:', error);
      return [];
    }
  }

  // Create setup intent for adding payment method
  async createSetupIntent(userId) {
    try {
      const user = await User.findById(userId);
      let customerId = user.subscription.stripeCustomerId;

      if (!customerId) {
        const customer = await this.createCustomer(user);
        customerId = customer.id;
      }

      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        usage: 'off_session',
      });

      return setupIntent;
    } catch (error) {
      console.error('Create setup intent error:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();