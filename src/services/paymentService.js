const User = require('../models/User');
const Plan = require('../models/Plan');
const Coupon = require('../models/Coupon');
const PaymentMethod = require('../models/PaymentMethod');
const emailService = require('./emailService');

// Initialize Stripe only if API key is provided
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('⚠️  Stripe API key not configured - payment features will be disabled');
}

class PaymentService {
  // Create Stripe customer
  async createCustomer(user) {
    if (!stripe) {
      throw new Error('Payment service not configured');
    }
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

  // Create subscription with trial and coupon support
  async createSubscription(userId, planName, paymentMethodId, options = {}) {
    try {
      const { billingCycle = 'monthly', couponCode = null, trialDays = 14 } = options;

      const user = await User.findById(userId);
      const plan = await Plan.getByName(planName);

      if (!user || !plan) {
        throw new Error('User or plan not found');
      }

      if (plan.isFree) {
        throw new Error('Cannot create subscription for free plan');
      }

      // Create customer if doesn't exist
      let customerId = user.subscription.stripeCustomerId;
      if (!customerId) {
        const customer = await this.createCustomer(user);
        customerId = customer.id;
      }

      // Attach and save payment method
      await this.addPaymentMethod(userId, paymentMethodId, true);

      // Handle coupon if provided
      let stripeCouponId = null;
      let discountPercentage = null;
      if (couponCode) {
        const coupon = await Coupon.findValidCoupon(couponCode);
        await coupon.validateForUser(userId, planName);
        stripeCouponId = coupon.stripeCouponId;
        discountPercentage = coupon.discountType === 'percentage' ? coupon.discountValue : null;
      }

      // Select price based on billing cycle
      const priceId = billingCycle === 'yearly' ? plan.stripePriceId.yearly : plan.stripePriceId.monthly;

      // Subscription parameters
      const subscriptionParams = {
        customer: customerId,
        items: [{ price: priceId }],
        default_payment_method: paymentMethodId,
        expand: ['latest_invoice.payment_intent'],
        trial_period_days: trialDays,
        metadata: {
          userId: userId.toString(),
          planName: planName
        }
      };

      // Add coupon if exists
      if (stripeCouponId) {
        subscriptionParams.coupon = stripeCouponId;
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create(subscriptionParams);

      // Apply coupon in our system if provided
      if (couponCode) {
        const coupon = await Coupon.findValidCoupon(couponCode);
        await coupon.applyCoupon(userId, subscription.id);
      }

      // Update user subscription info
      const updateData = {
        plan: planName,
        'subscription.stripeSubscriptionId': subscription.id,
        'subscription.stripePriceId': priceId,
        'subscription.status': subscription.status,
        'subscription.billingCycle': billingCycle,
        'subscription.currentPeriodStart': new Date(subscription.current_period_start * 1000),
        'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
      };

      if (subscription.trial_end) {
        updateData['subscription.trialStart'] = new Date();
        updateData['subscription.trialEnd'] = new Date(subscription.trial_end * 1000);
      }

      if (couponCode) {
        updateData['subscription.discountCode'] = couponCode;
        if (discountPercentage) {
          updateData['subscription.discountPercentage'] = discountPercentage;
        }
      }

      await User.findByIdAndUpdate(userId, updateData);

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

  // Payment Method Management
  async addPaymentMethod(userId, paymentMethodId, setAsDefault = false) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      let customerId = user.subscription.stripeCustomerId;
      if (!customerId) {
        const customer = await this.createCustomer(user);
        customerId = customer.id;
      }

      // Attach payment method to customer
      const stripePaymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Check if this is the first payment method
      const existingMethods = await PaymentMethod.countDocuments({ user: userId, isActive: true });
      const isFirstMethod = existingMethods === 0;

      // Save payment method to database
      const paymentMethod = new PaymentMethod({
        user: userId,
        stripePaymentMethodId: paymentMethodId,
        type: stripePaymentMethod.type,
        card: stripePaymentMethod.card ? {
          brand: stripePaymentMethod.card.brand,
          last4: stripePaymentMethod.card.last4,
          expMonth: stripePaymentMethod.card.exp_month,
          expYear: stripePaymentMethod.card.exp_year,
          fingerprint: stripePaymentMethod.card.fingerprint
        } : undefined,
        billing: stripePaymentMethod.billing_details,
        isDefault: setAsDefault || isFirstMethod
      });

      await paymentMethod.save();

      // Set as default in Stripe if requested or first method
      if (setAsDefault || isFirstMethod) {
        await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
      }

      return paymentMethod;
    } catch (error) {
      console.error('Add payment method error:', error);
      throw error;
    }
  }

  async removePaymentMethod(userId, paymentMethodId) {
    try {
      const paymentMethod = await PaymentMethod.findOne({
        user: userId,
        _id: paymentMethodId,
        isActive: true
      });

      if (!paymentMethod) {
        throw new Error('Payment method not found');
      }

      // Check if it's the default method
      if (paymentMethod.isDefault) {
        const otherMethods = await PaymentMethod.find({
          user: userId,
          _id: { $ne: paymentMethodId },
          isActive: true
        });

        if (otherMethods.length > 0) {
          // Set another method as default
          otherMethods[0].isDefault = true;
          await otherMethods[0].save();
        }
      }

      // Detach from Stripe
      await stripe.paymentMethods.detach(paymentMethod.stripePaymentMethodId);

      // Mark as inactive
      paymentMethod.isActive = false;
      await paymentMethod.save();

      return true;
    } catch (error) {
      console.error('Remove payment method error:', error);
      throw error;
    }
  }

  async setDefaultPaymentMethod(userId, paymentMethodId) {
    try {
      const user = await User.findById(userId);
      const paymentMethod = await PaymentMethod.findOne({
        user: userId,
        _id: paymentMethodId,
        isActive: true
      });

      if (!paymentMethod) {
        throw new Error('Payment method not found');
      }

      // Update in Stripe
      await stripe.customers.update(user.subscription.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethod.stripePaymentMethodId,
        },
      });

      // Update in database
      paymentMethod.isDefault = true;
      await paymentMethod.save();

      return paymentMethod;
    } catch (error) {
      console.error('Set default payment method error:', error);
      throw error;
    }
  }

  async getPaymentMethods(userId) {
    try {
      return await PaymentMethod.getAllForUser(userId);
    } catch (error) {
      console.error('Get payment methods error:', error);
      throw error;
    }
  }

  // Subscription Pause/Resume
  async pauseSubscription(userId, resumeAt = null) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.subscription.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      const pauseParams = {
        pause_collection: {
          behavior: 'mark_uncollectible'
        }
      };

      if (resumeAt) {
        pauseParams.pause_collection.resumes_at = Math.floor(resumeAt.getTime() / 1000);
      }

      const subscription = await stripe.subscriptions.update(
        user.subscription.stripeSubscriptionId,
        pauseParams
      );

      await User.findByIdAndUpdate(userId, {
        'subscription.status': 'paused',
        'subscription.pausedAt': new Date(),
        'subscription.resumeAt': resumeAt
      });

      // Send email notification
      await emailService.sendSubscriptionPausedNotification(user);

      return subscription;
    } catch (error) {
      console.error('Pause subscription error:', error);
      throw error;
    }
  }

  async resumeSubscription(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.subscription.stripeSubscriptionId) {
        throw new Error('No subscription found');
      }

      const subscription = await stripe.subscriptions.update(
        user.subscription.stripeSubscriptionId,
        {
          pause_collection: ''
        }
      );

      await User.findByIdAndUpdate(userId, {
        'subscription.status': 'active',
        'subscription.pausedAt': null,
        'subscription.resumeAt': null
      });

      // Send email notification
      await emailService.sendSubscriptionResumedNotification(user);

      return subscription;
    } catch (error) {
      console.error('Resume subscription error:', error);
      throw error;
    }
  }

  // Coupon/Discount Management
  async validateCoupon(couponCode, userId, planName) {
    try {
      const coupon = await Coupon.findValidCoupon(couponCode);
      await coupon.validateForUser(userId, planName);
      return coupon;
    } catch (error) {
      console.error('Validate coupon error:', error);
      throw error;
    }
  }

  async applyCouponToSubscription(userId, couponCode) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.subscription.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      const coupon = await Coupon.findValidCoupon(couponCode);

      const subscription = await stripe.subscriptions.update(
        user.subscription.stripeSubscriptionId,
        {
          coupon: coupon.stripeCouponId
        }
      );

      await coupon.applyCoupon(userId, subscription.id);

      await User.findByIdAndUpdate(userId, {
        'subscription.discountCode': couponCode,
        'subscription.discountPercentage': coupon.discountType === 'percentage' ? coupon.discountValue : null
      });

      return subscription;
    } catch (error) {
      console.error('Apply coupon error:', error);
      throw error;
    }
  }

  // Usage-based billing for overages
  async recordOverage(userId, type, amount) {
    try {
      const user = await User.findById(userId);
      const plan = await Plan.getByName(user.plan);

      // Calculate overage charge based on plan and overage type
      let chargeAmount = 0;

      if (type === 'urls' && plan.features.urlsPerMonth !== -1) {
        chargeAmount = amount * 0.01; // $0.01 per URL overage
      } else if (type === 'api_calls') {
        chargeAmount = amount * 0.001; // $0.001 per API call overage
      }

      if (chargeAmount > 0) {
        // Create invoice item in Stripe
        await stripe.invoiceItems.create({
          customer: user.subscription.stripeCustomerId,
          amount: Math.round(chargeAmount * 100), // Convert to cents
          currency: 'usd',
          description: `Overage charges for ${type}: ${amount} units`,
          metadata: {
            type: 'overage',
            overageType: type,
            units: amount
          }
        });

        // Update user overage tracking
        await User.findByIdAndUpdate(userId, {
          $inc: { 'usage.overageCharges': chargeAmount }
        });

        // Send overage notification
        await emailService.sendOverageNotification(user, type, amount, chargeAmount);
      }

      return { chargeAmount, type, amount };
    } catch (error) {
      console.error('Record overage error:', error);
      throw error;
    }
  }

  // Get detailed billing info
  async getBillingDetails(userId) {
    try {
      const user = await User.findById(userId).select('plan subscription usage');
      if (!user) {
        throw new Error('User not found');
      }

      const plan = await Plan.getByName(user.plan);
      const paymentMethods = await this.getPaymentMethods(userId);

      let upcomingInvoice = null;
      if (user.subscription.stripeSubscriptionId) {
        try {
          upcomingInvoice = await stripe.invoices.retrieveUpcoming({
            customer: user.subscription.stripeCustomerId
          });
        } catch (err) {
          // No upcoming invoice
        }
      }

      return {
        plan: {
          name: user.plan,
          details: plan
        },
        subscription: user.subscription,
        usage: user.usage,
        paymentMethods,
        upcomingInvoice: upcomingInvoice ? {
          amount: upcomingInvoice.amount_due / 100,
          currency: upcomingInvoice.currency,
          date: new Date(upcomingInvoice.period_end * 1000),
          lines: upcomingInvoice.lines.data.map(line => ({
            description: line.description,
            amount: line.amount / 100,
            period: {
              start: new Date(line.period.start * 1000),
              end: new Date(line.period.end * 1000)
            }
          }))
        } : null
      };
    } catch (error) {
      console.error('Get billing details error:', error);
      throw error;
    }
  }

  // Download invoice
  async downloadInvoice(userId, invoiceId) {
    try {
      const user = await User.findById(userId);
      const invoice = await stripe.invoices.retrieve(invoiceId);

      // Verify invoice belongs to user
      if (invoice.customer !== user.subscription.stripeCustomerId) {
        throw new Error('Unauthorized');
      }

      return {
        url: invoice.hosted_invoice_url,
        pdf: invoice.invoice_pdf
      };
    } catch (error) {
      console.error('Download invoice error:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();