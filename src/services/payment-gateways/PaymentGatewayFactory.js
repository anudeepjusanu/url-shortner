const StripeGateway = require('./StripeGateway');
const MoyasarGateway = require('./MoyasarGateway');

/**
 * PaymentGatewayFactory - Factory class for creating payment gateway instances
 *
 * This factory provides:
 * - Centralized gateway creation and management
 * - Gateway selection based on user preferences or business logic
 * - Singleton pattern for gateway instances
 * - Configuration management
 */
class PaymentGatewayFactory {
  constructor() {
    this.gateways = new Map();
    this.defaultGateway = process.env.DEFAULT_PAYMENT_GATEWAY || 'stripe';
    this.initialized = false;
  }

  /**
   * Initialize all configured gateways
   */
  async initialize() {
    try {
      // Initialize Stripe if configured
      if (process.env.STRIPE_SECRET_KEY) {
        const stripeGateway = new StripeGateway({
          apiKey: process.env.STRIPE_SECRET_KEY,
          publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
          webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
        });
        await stripeGateway.initialize();
        this.gateways.set('stripe', stripeGateway);
        console.log('[PaymentGatewayFactory] Stripe gateway initialized');
      }

      // Initialize Moyasar if configured
      if (process.env.MOYASAR_API_KEY) {
        const moyasarGateway = new MoyasarGateway({
          apiKey: process.env.MOYASAR_API_KEY,
          secretKey: process.env.MOYASAR_SECRET_KEY,
          publishableKey: process.env.MOYASAR_PUBLISHABLE_KEY
        });
        await moyasarGateway.initialize();
        this.gateways.set('moyasar', moyasarGateway);
        console.log('[PaymentGatewayFactory] Moyasar gateway initialized');
      }

      this.initialized = true;
      console.log(`[PaymentGatewayFactory] Factory initialized with ${this.gateways.size} gateway(s)`);

      return {
        success: true,
        gateways: Array.from(this.gateways.keys()),
        defaultGateway: this.defaultGateway
      };
    } catch (error) {
      console.error('[PaymentGatewayFactory] Initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Get a gateway instance by name
   * @param {string} gatewayName - Name of the gateway (stripe, moyasar)
   * @returns {BasePaymentGateway} Gateway instance
   */
  getGateway(gatewayName = null) {
    const name = gatewayName || this.defaultGateway;

    if (!this.initialized) {
      throw new Error('PaymentGatewayFactory is not initialized. Call initialize() first.');
    }

    const gateway = this.gateways.get(name.toLowerCase());

    if (!gateway) {
      throw new Error(`Payment gateway '${name}' is not configured or available. Available gateways: ${Array.from(this.gateways.keys()).join(', ')}`);
    }

    return gateway;
  }

  /**
   * Get gateway for a specific user based on their preferences
   * @param {Object} user - User object
   * @returns {BasePaymentGateway} Gateway instance
   */
  getGatewayForUser(user) {
    // Check if user has a preferred gateway
    const preferredGateway = user?.subscription?.paymentGateway || user?.preferredPaymentGateway;

    if (preferredGateway && this.gateways.has(preferredGateway)) {
      return this.getGateway(preferredGateway);
    }

    // Use default gateway
    return this.getGateway(this.defaultGateway);
  }

  /**
   * Get gateway based on currency
   * Useful for routing payments based on currency
   * @param {string} currency - Currency code (SAR, USD, etc.)
   * @returns {BasePaymentGateway} Gateway instance
   */
  getGatewayForCurrency(currency) {
    const currencyUpper = currency.toUpperCase();

    // Route Saudi Riyal to Moyasar if available (better rates for SAR)
    if (currencyUpper === 'SAR' && this.gateways.has('moyasar')) {
      return this.getGateway('moyasar');
    }

    // Route GCC currencies to Moyasar if available
    const gccCurrencies = ['AED', 'KWD', 'BHD', 'OMR', 'QAR'];
    if (gccCurrencies.includes(currencyUpper) && this.gateways.has('moyasar')) {
      return this.getGateway('moyasar');
    }

    // Use Stripe for other currencies
    if (this.gateways.has('stripe')) {
      return this.getGateway('stripe');
    }

    // Fallback to default
    return this.getGateway(this.defaultGateway);
  }

  /**
   * Get gateway based on payment method
   * @param {string} paymentMethod - Payment method type (card, mada, apple_pay, etc.)
   * @returns {BasePaymentGateway} Gateway instance
   */
  getGatewayForPaymentMethod(paymentMethod) {
    const methodLower = paymentMethod.toLowerCase();

    // Route Mada and STC Pay to Moyasar (exclusive to Saudi Arabia)
    if ((methodLower === 'mada' || methodLower === 'stcpay') && this.gateways.has('moyasar')) {
      return this.getGateway('moyasar');
    }

    // Use default for other methods
    return this.getGateway(this.defaultGateway);
  }

  /**
   * Get the best gateway for a payment based on multiple factors
   * @param {Object} paymentData - Payment information
   * @param {string} paymentData.currency - Currency code
   * @param {string} paymentData.paymentMethod - Payment method
   * @param {Object} paymentData.user - User object
   * @param {number} paymentData.amount - Payment amount
   * @returns {Object} Gateway instance and selection reason
   */
  selectOptimalGateway(paymentData) {
    const { currency, paymentMethod, user, amount } = paymentData;

    let selectedGateway = null;
    let reason = '';

    // Priority 1: User preference
    if (user?.subscription?.paymentGateway && this.gateways.has(user.subscription.paymentGateway)) {
      selectedGateway = this.getGateway(user.subscription.paymentGateway);
      reason = 'User preference';
    }

    // Priority 2: Payment method specific (Mada, STC Pay)
    else if (paymentMethod) {
      try {
        selectedGateway = this.getGatewayForPaymentMethod(paymentMethod);
        reason = 'Payment method optimization';
      } catch (error) {
        // Fall through to next priority
      }
    }

    // Priority 3: Currency optimization
    else if (currency) {
      try {
        selectedGateway = this.getGatewayForCurrency(currency);
        reason = 'Currency optimization';
      } catch (error) {
        // Fall through to next priority
      }
    }

    // Priority 4: Default gateway
    if (!selectedGateway) {
      selectedGateway = this.getGateway(this.defaultGateway);
      reason = 'Default gateway';
    }

    // Calculate fees for transparency
    const fees = selectedGateway.calculateFees(amount, currency, paymentMethod);

    return {
      gateway: selectedGateway,
      gatewayName: selectedGateway.getGatewayName(),
      reason,
      fees
    };
  }

  /**
   * Get all available gateways
   * @returns {Array} List of gateway names
   */
  getAvailableGateways() {
    return Array.from(this.gateways.keys());
  }

  /**
   * Check if a specific gateway is available
   * @param {string} gatewayName - Gateway name
   * @returns {boolean} Whether gateway is available
   */
  isGatewayAvailable(gatewayName) {
    return this.gateways.has(gatewayName.toLowerCase());
  }

  /**
   * Get gateway information (without sensitive data)
   * @param {string} gatewayName - Gateway name
   * @returns {Object} Gateway information
   */
  getGatewayInfo(gatewayName) {
    const gateway = this.getGateway(gatewayName);

    return {
      name: gateway.getGatewayName(),
      isReady: gateway.isReady(),
      supportedCurrencies: gateway.getSupportedCurrencies(),
      supportedPaymentMethods: gateway.getSupportedPaymentMethods(),
      config: gateway.getConfig()
    };
  }

  /**
   * Get information for all available gateways
   * @returns {Array} Array of gateway information
   */
  getAllGatewaysInfo() {
    const info = [];

    for (const gatewayName of this.gateways.keys()) {
      info.push(this.getGatewayInfo(gatewayName));
    }

    return info;
  }

  /**
   * Compare fees across gateways for a given amount
   * @param {number} amount - Amount to compare
   * @param {string} currency - Currency code
   * @param {string} paymentMethod - Payment method
   * @returns {Array} Fee comparison across gateways
   */
  compareFees(amount, currency, paymentMethod = 'card') {
    const comparison = [];

    for (const [name, gateway] of this.gateways.entries()) {
      const fees = gateway.calculateFees(amount, currency, paymentMethod);
      comparison.push({
        gateway: name,
        fees,
        netAmount: amount - fees.total
      });
    }

    // Sort by total fees (ascending)
    comparison.sort((a, b) => a.fees.total - b.fees.total);

    return comparison;
  }

  /**
   * Verify webhook for any gateway
   * @param {string} gatewayName - Gateway name
   * @param {string} payload - Webhook payload
   * @param {string} signature - Webhook signature
   * @param {string} secret - Optional webhook secret
   * @returns {Object|null} Verified webhook event or null
   */
  verifyWebhook(gatewayName, payload, signature, secret = null) {
    try {
      const gateway = this.getGateway(gatewayName);
      return gateway.verifyWebhookSignature(payload, signature, secret);
    } catch (error) {
      console.error(`[PaymentGatewayFactory] Webhook verification failed for ${gatewayName}:`, error.message);
      return null;
    }
  }

  /**
   * Get default gateway name
   * @returns {string} Default gateway name
   */
  getDefaultGateway() {
    return this.defaultGateway;
  }

  /**
   * Set default gateway
   * @param {string} gatewayName - Gateway name to set as default
   */
  setDefaultGateway(gatewayName) {
    if (!this.gateways.has(gatewayName.toLowerCase())) {
      throw new Error(`Cannot set default gateway. Gateway '${gatewayName}' is not available.`);
    }

    this.defaultGateway = gatewayName.toLowerCase();
    console.log(`[PaymentGatewayFactory] Default gateway set to: ${this.defaultGateway}`);
  }

  /**
   * Check if factory is initialized
   * @returns {boolean} Initialization status
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Get gateway count
   * @returns {number} Number of available gateways
   */
  getGatewayCount() {
    return this.gateways.size;
  }
}

// Export singleton instance
const paymentGatewayFactory = new PaymentGatewayFactory();

module.exports = paymentGatewayFactory;
