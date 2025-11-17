/**
 * BasePaymentGateway - Abstract base class for payment gateway implementations
 *
 * This class defines the interface that all payment gateways must implement.
 * It provides common functionality and enforces consistent behavior across different gateways.
 */

class BasePaymentGateway {
  constructor(config = {}) {
    if (new.target === BasePaymentGateway) {
      throw new TypeError('Cannot construct BasePaymentGateway instances directly. Use a concrete implementation.');
    }

    this.config = config;
    this.gatewayName = this.constructor.name.replace('Gateway', '').toLowerCase();
    this.isInitialized = false;
  }

  /**
   * Initialize the payment gateway with credentials
   * Must be implemented by subclasses
   */
  async initialize() {
    throw new Error('Method initialize() must be implemented by subclass');
  }

  /**
   * Create a payment intent/transaction
   * @param {Object} paymentData - Payment details
   * @param {number} paymentData.amount - Amount in smallest currency unit (e.g., cents, halalas)
   * @param {string} paymentData.currency - Currency code (SAR, USD, etc.)
   * @param {string} paymentData.description - Payment description
   * @param {Object} paymentData.metadata - Additional metadata
   * @param {Object} paymentData.customer - Customer information
   * @returns {Promise<Object>} Payment intent/transaction details
   */
  async createPayment(paymentData) {
    throw new Error('Method createPayment() must be implemented by subclass');
  }

  /**
   * Confirm/capture a payment
   * @param {string} paymentId - Payment ID from gateway
   * @param {Object} confirmData - Additional confirmation data
   * @returns {Promise<Object>} Confirmed payment details
   */
  async confirmPayment(paymentId, confirmData = {}) {
    throw new Error('Method confirmPayment() must be implemented by subclass');
  }

  /**
   * Get payment status
   * @param {string} paymentId - Payment ID from gateway
   * @returns {Promise<Object>} Payment status and details
   */
  async getPaymentStatus(paymentId) {
    throw new Error('Method getPaymentStatus() must be implemented by subclass');
  }

  /**
   * Refund a payment
   * @param {string} paymentId - Payment ID to refund
   * @param {number} amount - Amount to refund (optional, defaults to full refund)
   * @param {string} reason - Refund reason
   * @returns {Promise<Object>} Refund details
   */
  async refundPayment(paymentId, amount = null, reason = '') {
    throw new Error('Method refundPayment() must be implemented by subclass');
  }

  /**
   * Create a customer in the payment gateway
   * @param {Object} customerData - Customer information
   * @param {string} customerData.email - Customer email
   * @param {string} customerData.name - Customer name
   * @param {Object} customerData.metadata - Additional metadata
   * @returns {Promise<Object>} Customer details from gateway
   */
  async createCustomer(customerData) {
    throw new Error('Method createCustomer() must be implemented by subclass');
  }

  /**
   * Get customer details
   * @param {string} customerId - Customer ID from gateway
   * @returns {Promise<Object>} Customer details
   */
  async getCustomer(customerId) {
    throw new Error('Method getCustomer() must be implemented by subclass');
  }

  /**
   * Update customer information
   * @param {string} customerId - Customer ID from gateway
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated customer details
   */
  async updateCustomer(customerId, updateData) {
    throw new Error('Method updateCustomer() must be implemented by subclass');
  }

  /**
   * Delete/deactivate a customer
   * @param {string} customerId - Customer ID from gateway
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteCustomer(customerId) {
    throw new Error('Method deleteCustomer() must be implemented by subclass');
  }

  /**
   * Create a subscription
   * @param {Object} subscriptionData - Subscription details
   * @param {string} subscriptionData.customerId - Customer ID
   * @param {string} subscriptionData.priceId - Price/plan ID
   * @param {Object} subscriptionData.metadata - Additional metadata
   * @returns {Promise<Object>} Subscription details
   */
  async createSubscription(subscriptionData) {
    throw new Error('Method createSubscription() must be implemented by subclass');
  }

  /**
   * Get subscription details
   * @param {string} subscriptionId - Subscription ID from gateway
   * @returns {Promise<Object>} Subscription details
   */
  async getSubscription(subscriptionId) {
    throw new Error('Method getSubscription() must be implemented by subclass');
  }

  /**
   * Update subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated subscription details
   */
  async updateSubscription(subscriptionId, updateData) {
    throw new Error('Method updateSubscription() must be implemented by subclass');
  }

  /**
   * Cancel a subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {boolean} immediate - Cancel immediately or at period end
   * @returns {Promise<Object>} Cancellation confirmation
   */
  async cancelSubscription(subscriptionId, immediate = false) {
    throw new Error('Method cancelSubscription() must be implemented by subclass');
  }

  /**
   * Add payment method to customer
   * @param {string} customerId - Customer ID
   * @param {Object} paymentMethodData - Payment method details
   * @returns {Promise<Object>} Payment method details
   */
  async addPaymentMethod(customerId, paymentMethodData) {
    throw new Error('Method addPaymentMethod() must be implemented by subclass');
  }

  /**
   * Get customer payment methods
   * @param {string} customerId - Customer ID
   * @returns {Promise<Array>} List of payment methods
   */
  async getPaymentMethods(customerId) {
    throw new Error('Method getPaymentMethods() must be implemented by subclass');
  }

  /**
   * Remove payment method
   * @param {string} paymentMethodId - Payment method ID
   * @returns {Promise<Object>} Removal confirmation
   */
  async removePaymentMethod(paymentMethodId) {
    throw new Error('Method removePaymentMethod() must be implemented by subclass');
  }

  /**
   * Set default payment method for customer
   * @param {string} customerId - Customer ID
   * @param {string} paymentMethodId - Payment method ID to set as default
   * @returns {Promise<Object>} Updated customer details
   */
  async setDefaultPaymentMethod(customerId, paymentMethodId) {
    throw new Error('Method setDefaultPaymentMethod() must be implemented by subclass');
  }

  /**
   * Verify webhook signature
   * @param {string} payload - Webhook payload
   * @param {string} signature - Webhook signature
   * @param {string} secret - Webhook secret
   * @returns {boolean} Whether signature is valid
   */
  verifyWebhookSignature(payload, signature, secret) {
    throw new Error('Method verifyWebhookSignature() must be implemented by subclass');
  }

  /**
   * Process webhook event
   * @param {Object} event - Webhook event data
   * @returns {Promise<Object>} Processing result
   */
  async processWebhook(event) {
    throw new Error('Method processWebhook() must be implemented by subclass');
  }

  /**
   * Get supported currencies for this gateway
   * @returns {Array<string>} List of supported currency codes
   */
  getSupportedCurrencies() {
    throw new Error('Method getSupportedCurrencies() must be implemented by subclass');
  }

  /**
   * Get supported payment methods for this gateway
   * @returns {Array<string>} List of supported payment method types
   */
  getSupportedPaymentMethods() {
    throw new Error('Method getSupportedPaymentMethods() must be implemented by subclass');
  }

  /**
   * Calculate gateway fees for a transaction
   * @param {number} amount - Transaction amount
   * @param {string} currency - Currency code
   * @param {string} paymentMethod - Payment method type
   * @returns {Object} Fee breakdown
   */
  calculateFees(amount, currency, paymentMethod = 'card') {
    throw new Error('Method calculateFees() must be implemented by subclass');
  }

  /**
   * Convert amount to smallest currency unit (e.g., dollars to cents)
   * @param {number} amount - Amount in major currency unit
   * @param {string} currency - Currency code
   * @returns {number} Amount in smallest unit
   */
  toSmallestUnit(amount, currency) {
    // Most currencies use 2 decimal places
    const decimalCurrencies = ['SAR', 'USD', 'AED', 'EUR'];
    // Some currencies use 3 decimal places
    const threeDecimalCurrencies = ['KWD', 'BHD', 'OMR'];
    // Some currencies have no decimal places
    const zeroDecimalCurrencies = ['JPY', 'KRW'];

    if (zeroDecimalCurrencies.includes(currency)) {
      return Math.round(amount);
    } else if (threeDecimalCurrencies.includes(currency)) {
      return Math.round(amount * 1000);
    } else {
      return Math.round(amount * 100);
    }
  }

  /**
   * Convert amount from smallest currency unit to major unit
   * @param {number} amount - Amount in smallest unit
   * @param {string} currency - Currency code
   * @returns {number} Amount in major currency unit
   */
  fromSmallestUnit(amount, currency) {
    const decimalCurrencies = ['SAR', 'USD', 'AED', 'EUR'];
    const threeDecimalCurrencies = ['KWD', 'BHD', 'OMR'];
    const zeroDecimalCurrencies = ['JPY', 'KRW'];

    if (zeroDecimalCurrencies.includes(currency)) {
      return amount;
    } else if (threeDecimalCurrencies.includes(currency)) {
      return amount / 1000;
    } else {
      return amount / 100;
    }
  }

  /**
   * Validate payment amount
   * @param {number} amount - Amount to validate
   * @param {string} currency - Currency code
   * @returns {Object} Validation result
   */
  validateAmount(amount, currency) {
    const minAmounts = {
      SAR: 1, // 1 SAR
      USD: 0.50, // 50 cents
      AED: 1, // 1 AED
      EUR: 0.50, // 50 cents
      KWD: 0.10, // 100 fils
      BHD: 0.10, // 100 fils
      OMR: 0.10 // 100 baisa
    };

    const minAmount = minAmounts[currency] || 0.50;

    if (amount < minAmount) {
      return {
        valid: false,
        error: `Amount must be at least ${minAmount} ${currency}`
      };
    }

    if (amount <= 0) {
      return {
        valid: false,
        error: 'Amount must be greater than zero'
      };
    }

    return { valid: true };
  }

  /**
   * Format amount for display
   * @param {number} amount - Amount in smallest unit
   * @param {string} currency - Currency code
   * @returns {string} Formatted amount
   */
  formatAmount(amount, currency) {
    const majorAmount = this.fromSmallestUnit(amount, currency);
    const threeDecimalCurrencies = ['KWD', 'BHD', 'OMR'];
    const zeroDecimalCurrencies = ['JPY', 'KRW'];

    let decimals = 2;
    if (zeroDecimalCurrencies.includes(currency)) {
      decimals = 0;
    } else if (threeDecimalCurrencies.includes(currency)) {
      decimals = 3;
    }

    return `${majorAmount.toFixed(decimals)} ${currency}`;
  }

  /**
   * Get gateway name
   * @returns {string} Gateway name
   */
  getGatewayName() {
    return this.gatewayName;
  }

  /**
   * Check if gateway is initialized
   * @returns {boolean} Initialization status
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Get gateway configuration (sanitized, without secrets)
   * @returns {Object} Sanitized configuration
   */
  getConfig() {
    const config = { ...this.config };
    // Remove sensitive data
    delete config.apiKey;
    delete config.secretKey;
    delete config.webhookSecret;
    delete config.privateKey;
    return config;
  }

  /**
   * Handle errors in a consistent way
   * @param {Error} error - Error object
   * @param {string} operation - Operation that failed
   * @returns {Object} Standardized error object
   */
  handleError(error, operation) {
    return {
      success: false,
      error: {
        gateway: this.gatewayName,
        operation,
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        details: error.details || null,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Log gateway activity (should be overridden to use proper logger)
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  log(level, message, data = {}) {
    const logData = {
      gateway: this.gatewayName,
      level,
      message,
      ...data,
      timestamp: new Date().toISOString()
    };

    console.log(`[${level.toUpperCase()}]`, JSON.stringify(logData));
  }
}

module.exports = BasePaymentGateway;
