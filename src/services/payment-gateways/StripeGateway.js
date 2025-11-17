const BasePaymentGateway = require('./BasePaymentGateway');
const stripe = require('stripe');

/**
 * StripeGateway - Stripe payment gateway implementation
 *
 * Implements payment processing using Stripe API
 * Supports payments, subscriptions, customers, and webhooks
 */
class StripeGateway extends BasePaymentGateway {
  constructor(config = {}) {
    super(config);

    this.apiKey = config.apiKey || process.env.STRIPE_SECRET_KEY;
    this.webhookSecret = config.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET;
    this.publishableKey = config.publishableKey || process.env.STRIPE_PUBLISHABLE_KEY;

    if (!this.apiKey) {
      throw new Error('Stripe API key is required');
    }

    this.stripe = null;
  }

  /**
   * Initialize Stripe SDK
   */
  async initialize() {
    try {
      this.stripe = stripe(this.apiKey);
      this.isInitialized = true;
      this.log('info', 'Stripe gateway initialized successfully');
      return { success: true };
    } catch (error) {
      this.log('error', 'Failed to initialize Stripe gateway', { error: error.message });
      throw error;
    }
  }

  /**
   * Create a payment intent
   */
  async createPayment(paymentData) {
    try {
      const {
        amount,
        currency = 'SAR',
        description,
        metadata = {},
        customer,
        paymentMethod,
        automaticPaymentMethods = true,
        captureMethod = 'automatic',
        returnUrl
      } = paymentData;

      // Validate amount
      const validation = this.validateAmount(amount, currency);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Convert to smallest unit
      const amountInSmallestUnit = this.toSmallestUnit(amount, currency);

      const paymentIntentData = {
        amount: amountInSmallestUnit,
        currency: currency.toLowerCase(),
        description,
        metadata: {
          ...metadata,
          gateway: 'stripe'
        },
        capture_method: captureMethod
      };

      // Add customer if provided
      if (customer) {
        if (typeof customer === 'string') {
          paymentIntentData.customer = customer;
        } else if (customer.id) {
          paymentIntentData.customer = customer.id;
        }
      }

      // Add payment method if provided
      if (paymentMethod) {
        paymentIntentData.payment_method = paymentMethod;
      }

      // Enable automatic payment methods if requested
      if (automaticPaymentMethods) {
        paymentIntentData.automatic_payment_methods = { enabled: true };
      }

      // Add return URL for redirect-based payment methods
      if (returnUrl) {
        paymentIntentData.return_url = returnUrl;
      }

      const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentData);

      this.log('info', 'Payment intent created', {
        paymentIntentId: paymentIntent.id,
        amount,
        currency
      });

      return {
        success: true,
        data: {
          id: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          status: paymentIntent.status,
          amount: this.fromSmallestUnit(paymentIntent.amount, currency),
          currency: paymentIntent.currency.toUpperCase(),
          metadata: paymentIntent.metadata,
          paymentMethod: paymentIntent.payment_method,
          customerId: paymentIntent.customer
        }
      };
    } catch (error) {
      this.log('error', 'Failed to create payment', { error: error.message });
      return this.handleError(error, 'createPayment');
    }
  }

  /**
   * Confirm a payment intent
   */
  async confirmPayment(paymentId, confirmData = {}) {
    try {
      const { paymentMethod, returnUrl } = confirmData;

      const confirmOptions = {};
      if (paymentMethod) confirmOptions.payment_method = paymentMethod;
      if (returnUrl) confirmOptions.return_url = returnUrl;

      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentId, confirmOptions);

      this.log('info', 'Payment confirmed', { paymentIntentId: paymentId });

      return {
        success: true,
        data: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: this.fromSmallestUnit(paymentIntent.amount, paymentIntent.currency.toUpperCase()),
          currency: paymentIntent.currency.toUpperCase()
        }
      };
    } catch (error) {
      this.log('error', 'Failed to confirm payment', { error: error.message, paymentId });
      return this.handleError(error, 'confirmPayment');
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId);

      return {
        success: true,
        data: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: this.fromSmallestUnit(paymentIntent.amount, paymentIntent.currency.toUpperCase()),
          currency: paymentIntent.currency.toUpperCase(),
          paymentMethod: paymentIntent.payment_method,
          metadata: paymentIntent.metadata
        }
      };
    } catch (error) {
      this.log('error', 'Failed to get payment status', { error: error.message, paymentId });
      return this.handleError(error, 'getPaymentStatus');
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(paymentId, amount = null, reason = '') {
    try {
      const refundData = {
        payment_intent: paymentId
      };

      if (amount) {
        // Get the payment intent to get currency
        const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId);
        refundData.amount = this.toSmallestUnit(amount, paymentIntent.currency.toUpperCase());
      }

      if (reason) {
        refundData.reason = reason;
      }

      const refund = await this.stripe.refunds.create(refundData);

      this.log('info', 'Payment refunded', {
        paymentIntentId: paymentId,
        refundId: refund.id,
        amount: amount || 'full'
      });

      return {
        success: true,
        data: {
          id: refund.id,
          paymentId: refund.payment_intent,
          status: refund.status,
          amount: this.fromSmallestUnit(refund.amount, refund.currency.toUpperCase()),
          currency: refund.currency.toUpperCase(),
          reason: refund.reason
        }
      };
    } catch (error) {
      this.log('error', 'Failed to refund payment', { error: error.message, paymentId });
      return this.handleError(error, 'refundPayment');
    }
  }

  /**
   * Create a customer
   */
  async createCustomer(customerData) {
    try {
      const { email, name, phone, metadata = {}, address, paymentMethod } = customerData;

      const customerCreateData = {
        email,
        name,
        metadata: {
          ...metadata,
          gateway: 'stripe'
        }
      };

      if (phone) customerCreateData.phone = phone;
      if (address) customerCreateData.address = address;
      if (paymentMethod) customerCreateData.payment_method = paymentMethod;

      const customer = await this.stripe.customers.create(customerCreateData);

      this.log('info', 'Customer created', { customerId: customer.id, email });

      return {
        success: true,
        data: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          metadata: customer.metadata
        }
      };
    } catch (error) {
      this.log('error', 'Failed to create customer', { error: error.message });
      return this.handleError(error, 'createCustomer');
    }
  }

  /**
   * Get customer details
   */
  async getCustomer(customerId) {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);

      return {
        success: true,
        data: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          phone: customer.phone,
          metadata: customer.metadata,
          defaultPaymentMethod: customer.invoice_settings?.default_payment_method
        }
      };
    } catch (error) {
      this.log('error', 'Failed to get customer', { error: error.message, customerId });
      return this.handleError(error, 'getCustomer');
    }
  }

  /**
   * Update customer
   */
  async updateCustomer(customerId, updateData) {
    try {
      const customer = await this.stripe.customers.update(customerId, updateData);

      this.log('info', 'Customer updated', { customerId });

      return {
        success: true,
        data: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          metadata: customer.metadata
        }
      };
    } catch (error) {
      this.log('error', 'Failed to update customer', { error: error.message, customerId });
      return this.handleError(error, 'updateCustomer');
    }
  }

  /**
   * Delete customer
   */
  async deleteCustomer(customerId) {
    try {
      const deleted = await this.stripe.customers.del(customerId);

      this.log('info', 'Customer deleted', { customerId });

      return {
        success: true,
        data: { deleted: deleted.deleted, id: customerId }
      };
    } catch (error) {
      this.log('error', 'Failed to delete customer', { error: error.message, customerId });
      return this.handleError(error, 'deleteCustomer');
    }
  }

  /**
   * Create subscription
   */
  async createSubscription(subscriptionData) {
    try {
      const { customerId, priceId, items, metadata = {}, trialPeriodDays } = subscriptionData;

      const subscriptionCreateData = {
        customer: customerId,
        metadata: {
          ...metadata,
          gateway: 'stripe'
        }
      };

      if (items) {
        subscriptionCreateData.items = items;
      } else if (priceId) {
        subscriptionCreateData.items = [{ price: priceId }];
      }

      if (trialPeriodDays) {
        subscriptionCreateData.trial_period_days = trialPeriodDays;
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionCreateData);

      this.log('info', 'Subscription created', {
        subscriptionId: subscription.id,
        customerId
      });

      return {
        success: true,
        data: {
          id: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          items: subscription.items.data,
          metadata: subscription.metadata
        }
      };
    } catch (error) {
      this.log('error', 'Failed to create subscription', { error: error.message });
      return this.handleError(error, 'createSubscription');
    }
  }

  /**
   * Get subscription
   */
  async getSubscription(subscriptionId) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

      return {
        success: true,
        data: {
          id: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          items: subscription.items.data
        }
      };
    } catch (error) {
      this.log('error', 'Failed to get subscription', { error: error.message, subscriptionId });
      return this.handleError(error, 'getSubscription');
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(subscriptionId, updateData) {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, updateData);

      this.log('info', 'Subscription updated', { subscriptionId });

      return {
        success: true,
        data: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000)
        }
      };
    } catch (error) {
      this.log('error', 'Failed to update subscription', { error: error.message, subscriptionId });
      return this.handleError(error, 'updateSubscription');
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId, immediate = false) {
    try {
      let subscription;

      if (immediate) {
        subscription = await this.stripe.subscriptions.cancel(subscriptionId);
      } else {
        subscription = await this.stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true
        });
      }

      this.log('info', 'Subscription cancelled', { subscriptionId, immediate });

      return {
        success: true,
        data: {
          id: subscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        }
      };
    } catch (error) {
      this.log('error', 'Failed to cancel subscription', { error: error.message, subscriptionId });
      return this.handleError(error, 'cancelSubscription');
    }
  }

  /**
   * Add payment method to customer
   */
  async addPaymentMethod(customerId, paymentMethodData) {
    try {
      const { paymentMethodId, setAsDefault = false } = paymentMethodData;

      // Attach payment method to customer
      await this.stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });

      // Set as default if requested
      if (setAsDefault) {
        await this.stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId
          }
        });
      }

      this.log('info', 'Payment method added', { customerId, paymentMethodId });

      return {
        success: true,
        data: {
          paymentMethodId,
          customerId,
          isDefault: setAsDefault
        }
      };
    } catch (error) {
      this.log('error', 'Failed to add payment method', { error: error.message });
      return this.handleError(error, 'addPaymentMethod');
    }
  }

  /**
   * Get customer payment methods
   */
  async getPaymentMethods(customerId) {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });

      return {
        success: true,
        data: paymentMethods.data.map(pm => ({
          id: pm.id,
          type: pm.type,
          card: pm.card ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expiryMonth: pm.card.exp_month,
            expiryYear: pm.card.exp_year
          } : null
        }))
      };
    } catch (error) {
      this.log('error', 'Failed to get payment methods', { error: error.message, customerId });
      return this.handleError(error, 'getPaymentMethods');
    }
  }

  /**
   * Remove payment method
   */
  async removePaymentMethod(paymentMethodId) {
    try {
      await this.stripe.paymentMethods.detach(paymentMethodId);

      this.log('info', 'Payment method removed', { paymentMethodId });

      return {
        success: true,
        data: { paymentMethodId, removed: true }
      };
    } catch (error) {
      this.log('error', 'Failed to remove payment method', { error: error.message, paymentMethodId });
      return this.handleError(error, 'removePaymentMethod');
    }
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(customerId, paymentMethodId) {
    try {
      await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });

      this.log('info', 'Default payment method set', { customerId, paymentMethodId });

      return {
        success: true,
        data: { customerId, defaultPaymentMethod: paymentMethodId }
      };
    } catch (error) {
      this.log('error', 'Failed to set default payment method', { error: error.message });
      return this.handleError(error, 'setDefaultPaymentMethod');
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload, signature, secret = null) {
    try {
      const webhookSecret = secret || this.webhookSecret;

      if (!webhookSecret) {
        throw new Error('Webhook secret is not configured');
      }

      const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      return event;
    } catch (error) {
      this.log('error', 'Webhook signature verification failed', { error: error.message });
      return null;
    }
  }

  /**
   * Process webhook event
   */
  async processWebhook(event) {
    try {
      const { type, data } = event;

      this.log('info', 'Processing webhook', { eventType: type, eventId: event.id });

      // Return standardized webhook data
      return {
        success: true,
        eventType: type,
        eventId: event.id,
        data: data.object
      };
    } catch (error) {
      this.log('error', 'Failed to process webhook', { error: error.message });
      return this.handleError(error, 'processWebhook');
    }
  }

  /**
   * Get supported currencies
   */
  getSupportedCurrencies() {
    return ['SAR', 'USD', 'AED', 'EUR', 'GBP', 'KWD', 'BHD', 'OMR', 'QAR'];
  }

  /**
   * Get supported payment methods
   */
  getSupportedPaymentMethods() {
    return ['card', 'apple_pay', 'google_pay', 'link'];
  }

  /**
   * Calculate Stripe fees
   */
  calculateFees(amount, currency, paymentMethod = 'card') {
    // Stripe pricing: 2.9% + fixed fee
    const percentageFee = 2.9;
    let fixedFee = 0;

    // Fixed fees vary by currency
    const fixedFees = {
      SAR: 1,
      USD: 0.30,
      AED: 1,
      EUR: 0.25,
      GBP: 0.20
    };

    fixedFee = fixedFees[currency] || 0.30;

    const gatewayFee = (amount * percentageFee / 100) + fixedFee;

    return {
      gatewayFee: parseFloat(gatewayFee.toFixed(2)),
      platformFee: 0,
      total: parseFloat(gatewayFee.toFixed(2)),
      percentage: percentageFee,
      fixed: fixedFee
    };
  }

  /**
   * Get publishable key (safe to expose to frontend)
   */
  getPublishableKey() {
    return this.publishableKey;
  }
}

module.exports = StripeGateway;
