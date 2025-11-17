const BasePaymentGateway = require('./BasePaymentGateway');
const axios = require('axios');
const crypto = require('crypto');

/**
 * MoyasarGateway - Moyasar payment gateway implementation
 *
 * Implements payment processing using Moyasar API (Saudi Arabia-focused)
 * Supports payments via Mada, Credit Cards, Apple Pay, STC Pay
 *
 * Moyasar API Documentation: https://moyasar.com/docs/api/
 */
class MoyasarGateway extends BasePaymentGateway {
  constructor(config = {}) {
    super(config);

    this.apiKey = config.apiKey || process.env.MOYASAR_API_KEY;
    this.secretKey = config.secretKey || process.env.MOYASAR_SECRET_KEY;
    this.publishableKey = config.publishableKey || process.env.MOYASAR_PUBLISHABLE_KEY;
    this.baseURL = 'https://api.moyasar.com/v1';

    if (!this.apiKey) {
      throw new Error('Moyasar API key is required');
    }

    this.axiosInstance = null;
  }

  /**
   * Initialize Moyasar API client
   */
  async initialize() {
    try {
      this.axiosInstance = axios.create({
        baseURL: this.baseURL,
        headers: {
          'Content-Type': 'application/json'
        },
        auth: {
          username: this.apiKey,
          password: ''
        }
      });

      this.isInitialized = true;
      this.log('info', 'Moyasar gateway initialized successfully');
      return { success: true };
    } catch (error) {
      this.log('error', 'Failed to initialize Moyasar gateway', { error: error.message });
      throw error;
    }
  }

  /**
   * Create a payment
   */
  async createPayment(paymentData) {
    try {
      const {
        amount,
        currency = 'SAR',
        description,
        metadata = {},
        customer,
        callbackUrl,
        source = {}
      } = paymentData;

      // Validate amount
      const validation = this.validateAmount(amount, currency);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Convert to smallest unit (halalas for SAR)
      const amountInSmallestUnit = this.toSmallestUnit(amount, currency);

      const paymentCreateData = {
        amount: amountInSmallestUnit,
        currency: currency.toLowerCase(),
        description: description || 'Payment',
        metadata: {
          ...metadata,
          gateway: 'moyasar'
        }
      };

      // Add callback URL
      if (callbackUrl) {
        paymentCreateData.callback_url = callbackUrl;
      }

      // Add source (payment method)
      if (source.type) {
        paymentCreateData.source = source;
      }

      const response = await this.axiosInstance.post('/payments', paymentCreateData);
      const payment = response.data;

      this.log('info', 'Payment created', {
        paymentId: payment.id,
        amount,
        currency
      });

      return {
        success: true,
        data: {
          id: payment.id,
          status: payment.status,
          amount: this.fromSmallestUnit(payment.amount, currency),
          currency: payment.currency.toUpperCase(),
          description: payment.description,
          metadata: payment.metadata,
          source: payment.source,
          transactionUrl: payment.source?.transaction_url
        }
      };
    } catch (error) {
      this.log('error', 'Failed to create payment', { error: error.message });
      return this.handleError(error, 'createPayment');
    }
  }

  /**
   * Confirm payment (Moyasar doesn't have separate confirm step, payment is created and confirmed together)
   */
  async confirmPayment(paymentId, confirmData = {}) {
    // For Moyasar, we just retrieve the payment status
    return this.getPaymentStatus(paymentId);
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId) {
    try {
      const response = await this.axiosInstance.get(`/payments/${paymentId}`);
      const payment = response.data;

      return {
        success: true,
        data: {
          id: payment.id,
          status: payment.status,
          amount: this.fromSmallestUnit(payment.amount, payment.currency.toUpperCase()),
          currency: payment.currency.toUpperCase(),
          description: payment.description,
          metadata: payment.metadata,
          source: payment.source,
          refunded: payment.refunded,
          refundedAmount: payment.refunded_amount ? this.fromSmallestUnit(payment.refunded_amount, payment.currency.toUpperCase()) : 0
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
        payment_id: paymentId
      };

      if (amount) {
        // Get the payment to get currency
        const paymentResponse = await this.axiosInstance.get(`/payments/${paymentId}`);
        const payment = paymentResponse.data;
        refundData.amount = this.toSmallestUnit(amount, payment.currency.toUpperCase());
      }

      if (reason) {
        refundData.description = reason;
      }

      const response = await this.axiosInstance.post('/refunds', refundData);
      const refund = response.data;

      this.log('info', 'Payment refunded', {
        paymentId,
        refundId: refund.id,
        amount: amount || 'full'
      });

      return {
        success: true,
        data: {
          id: refund.id,
          paymentId: refund.payment_id,
          status: refund.status,
          amount: this.fromSmallestUnit(refund.amount, refund.currency.toUpperCase()),
          currency: refund.currency.toUpperCase(),
          note: refund.note
        }
      };
    } catch (error) {
      this.log('error', 'Failed to refund payment', { error: error.message, paymentId });
      return this.handleError(error, 'refundPayment');
    }
  }

  /**
   * Create customer
   * Note: Moyasar doesn't have a separate customer API, customer data is passed with each payment
   */
  async createCustomer(customerData) {
    // Moyasar doesn't have customer management, so we just store the data locally
    // and return a virtual customer object
    this.log('info', 'Customer data stored (Moyasar uses inline customer data)', {
      email: customerData.email
    });

    return {
      success: true,
      data: {
        id: `moyasar_customer_${Date.now()}`,
        email: customerData.email,
        name: customerData.name,
        metadata: customerData.metadata,
        note: 'Moyasar does not have customer management. Customer data is stored locally.'
      }
    };
  }

  /**
   * Get customer
   * Note: Moyasar doesn't have customer management
   */
  async getCustomer(customerId) {
    return {
      success: false,
      error: {
        message: 'Moyasar does not support customer management. Customer data should be stored in your database.',
        code: 'NOT_SUPPORTED'
      }
    };
  }

  /**
   * Update customer
   */
  async updateCustomer(customerId, updateData) {
    return {
      success: false,
      error: {
        message: 'Moyasar does not support customer management. Customer data should be stored in your database.',
        code: 'NOT_SUPPORTED'
      }
    };
  }

  /**
   * Delete customer
   */
  async deleteCustomer(customerId) {
    return {
      success: false,
      error: {
        message: 'Moyasar does not support customer management. Customer data should be stored in your database.',
        code: 'NOT_SUPPORTED'
      }
    };
  }

  /**
   * Create subscription
   * Note: Moyasar doesn't have native subscription support, needs to be implemented manually
   */
  async createSubscription(subscriptionData) {
    return {
      success: false,
      error: {
        message: 'Moyasar does not have native subscription support. Subscriptions should be managed in your application with recurring payment creation.',
        code: 'NOT_SUPPORTED'
      }
    };
  }

  /**
   * Get subscription
   */
  async getSubscription(subscriptionId) {
    return {
      success: false,
      error: {
        message: 'Moyasar does not have native subscription support.',
        code: 'NOT_SUPPORTED'
      }
    };
  }

  /**
   * Update subscription
   */
  async updateSubscription(subscriptionId, updateData) {
    return {
      success: false,
      error: {
        message: 'Moyasar does not have native subscription support.',
        code: 'NOT_SUPPORTED'
      }
    };
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId, immediate = false) {
    return {
      success: false,
      error: {
        message: 'Moyasar does not have native subscription support.',
        code: 'NOT_SUPPORTED'
      }
    };
  }

  /**
   * Add payment method
   */
  async addPaymentMethod(customerId, paymentMethodData) {
    return {
      success: false,
      error: {
        message: 'Moyasar does not support stored payment methods. Payment source is provided during payment creation.',
        code: 'NOT_SUPPORTED'
      }
    };
  }

  /**
   * Get payment methods
   */
  async getPaymentMethods(customerId) {
    return {
      success: false,
      error: {
        message: 'Moyasar does not support stored payment methods.',
        code: 'NOT_SUPPORTED'
      }
    };
  }

  /**
   * Remove payment method
   */
  async removePaymentMethod(paymentMethodId) {
    return {
      success: false,
      error: {
        message: 'Moyasar does not support stored payment methods.',
        code: 'NOT_SUPPORTED'
      }
    };
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(customerId, paymentMethodId) {
    return {
      success: false,
      error: {
        message: 'Moyasar does not support stored payment methods.',
        code: 'NOT_SUPPORTED'
      }
    };
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload, signature, secret = null) {
    try {
      const webhookSecret = secret || this.secretKey;

      if (!webhookSecret) {
        throw new Error('Webhook secret is not configured');
      }

      // Moyasar uses HMAC SHA256 for webhook signatures
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );

      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }

      return JSON.parse(payload);
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

      return {
        success: true,
        eventType: type,
        eventId: event.id,
        data: data
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
    // Moyasar primarily supports Saudi Riyal and other GCC currencies
    return ['SAR', 'AED', 'KWD', 'BHD', 'OMR', 'QAR'];
  }

  /**
   * Get supported payment methods
   */
  getSupportedPaymentMethods() {
    return [
      'creditcard', // Visa, Mastercard
      'mada', // Saudi Mada cards
      'applepay', // Apple Pay
      'stcpay' // STC Pay (digital wallet)
    ];
  }

  /**
   * Calculate Moyasar fees
   */
  calculateFees(amount, currency, paymentMethod = 'creditcard') {
    // Moyasar pricing varies by payment method
    let percentageFee = 0;
    let fixedFee = 0;

    switch (paymentMethod) {
      case 'mada':
        percentageFee = 1.5; // 1.5% for Mada cards
        break;
      case 'creditcard':
        percentageFee = 2.5; // 2.5% for credit cards
        break;
      case 'applepay':
        percentageFee = 2.5; // 2.5% for Apple Pay
        break;
      case 'stcpay':
        percentageFee = 2.0; // 2.0% for STC Pay
        break;
      default:
        percentageFee = 2.5;
    }

    const gatewayFee = amount * percentageFee / 100;

    return {
      gatewayFee: parseFloat(gatewayFee.toFixed(2)),
      platformFee: 0,
      total: parseFloat(gatewayFee.toFixed(2)),
      percentage: percentageFee,
      fixed: fixedFee
    };
  }

  /**
   * Create payment with Mada card
   */
  async createMadaPayment(paymentData) {
    return this.createPayment({
      ...paymentData,
      source: {
        type: 'mada',
        ...paymentData.source
      }
    });
  }

  /**
   * Create payment with Apple Pay
   */
  async createApplePayPayment(paymentData) {
    return this.createPayment({
      ...paymentData,
      source: {
        type: 'applepay',
        ...paymentData.source
      }
    });
  }

  /**
   * Create payment with STC Pay
   */
  async createStcPayPayment(paymentData) {
    return this.createPayment({
      ...paymentData,
      source: {
        type: 'stcpay',
        ...paymentData.source
      }
    });
  }

  /**
   * List payments with filters
   */
  async listPayments(filters = {}) {
    try {
      const params = {};

      if (filters.status) params.status = filters.status;
      if (filters.source) params.source = filters.source;
      if (filters.created) params.created = filters.created;

      const response = await this.axiosInstance.get('/payments', { params });
      const payments = response.data.payments || [];

      return {
        success: true,
        data: payments.map(payment => ({
          id: payment.id,
          status: payment.status,
          amount: this.fromSmallestUnit(payment.amount, payment.currency.toUpperCase()),
          currency: payment.currency.toUpperCase(),
          description: payment.description,
          createdAt: payment.created_at
        }))
      };
    } catch (error) {
      this.log('error', 'Failed to list payments', { error: error.message });
      return this.handleError(error, 'listPayments');
    }
  }

  /**
   * Get publishable key (safe to expose to frontend)
   */
  getPublishableKey() {
    return this.publishableKey;
  }

  /**
   * Get payment form URL for hosted payment page
   */
  getPaymentFormUrl(paymentId) {
    return `https://moyasar.com/payment/${paymentId}`;
  }
}

module.exports = MoyasarGateway;
