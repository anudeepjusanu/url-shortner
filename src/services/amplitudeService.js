const { track } = require('@amplitude/analytics-node');

class AmplitudeService {
  constructor() {
    this.initialized = false;
    this.apiKey = process.env.AMPLITUDE_API_KEY;
  }

  initialize() {
    if (this.initialized) return;

    if (!this.apiKey) {
      console.warn('Amplitude API key not found. Server-side analytics will not be tracked.');
      return;
    }

    this.initialized = true;
    console.log('Amplitude backend service initialized');
  }

  // Track event
  track(userId, eventName, eventProperties = {}) {
    if (!this.initialized || !this.apiKey) return;

    try {
      track(eventName, eventProperties, {
        user_id: userId,
        device_id: eventProperties.device_id || 'server',
      });
    } catch (error) {
      console.error('Amplitude tracking error:', error);
    }
  }

  // Link Redirect Events
  trackLinkRedirect(userId, linkData, requestData) {
    this.track(userId || 'anonymous', 'Link Redirect Performed', {
      link_id: linkData.linkId,
      short_code: linkData.shortCode,
      has_password: !!linkData.hasPassword,
      has_expiry: !!linkData.hasExpiry,
      device_type: requestData.deviceType,
      browser: requestData.browser,
      os: requestData.os,
      country: requestData.country,
      city: requestData.city,
      referrer: requestData.referrer,
      is_mobile: requestData.isMobile,
      is_bot: requestData.isBot,
    });
  }

  // Link Validation Events
  trackLinkValidationFailed(linkId, reason) {
    this.track('system', 'Link Validation Failed', {
      link_id: linkId,
      failure_reason: reason,
    });
  }

  trackLinkExpiredAccess(linkId, userId = null) {
    this.track(userId || 'anonymous', 'Link Expired Access Attempt', {
      link_id: linkId,
    });
  }

  trackPasswordProtectedAccess(linkId, success, userId = null) {
    this.track(userId || 'anonymous', 'Password Protected Link Access', {
      link_id: linkId,
      access_granted: success,
    });
  }

  // API Usage Events
  trackAPIRequest(userId, requestData) {
    this.track(userId || 'anonymous', 'API Request Made', {
      endpoint: requestData.endpoint,
      method: requestData.method,
      status_code: requestData.statusCode,
      response_time_ms: requestData.responseTime,
      user_agent: requestData.userAgent,
      ip_address: requestData.ipAddress,
    });
  }

  trackAPIRateLimitHit(userId, endpoint) {
    this.track(userId || 'anonymous', 'API Rate Limit Hit', {
      endpoint,
    });
  }

  trackAPIAuthenticationFailed(ipAddress, reason) {
    this.track('anonymous', 'API Authentication Failed', {
      ip_address: ipAddress,
      failure_reason: reason,
    });
  }

  trackAPIError(userId, errorData) {
    this.track(userId || 'anonymous', 'API Error Occurred', {
      endpoint: errorData.endpoint,
      method: errorData.method,
      error_type: errorData.errorType,
      error_message: errorData.errorMessage,
      status_code: errorData.statusCode,
    });
  }

  // System Events
  trackEmailSent(userId, emailType, success = true) {
    this.track(userId || 'system', 'Email Sent', {
      email_type: emailType,
      success,
    });
  }

  trackWebhookTriggered(userId, webhookType, success = true) {
    this.track(userId || 'system', 'Webhook Triggered', {
      webhook_type: webhookType,
      success,
    });
  }

  trackCronJobExecuted(jobName, success = true, duration = null) {
    this.track('system', 'Cron Job Executed', {
      job_name: jobName,
      success,
      duration_ms: duration,
    });
  }

  trackCacheOperation(operation, hit = true) {
    this.track('system', operation === 'hit' ? 'Cache Hit' : 'Cache Miss', {
      operation,
    });
  }

  // Security Events
  trackSuspiciousActivity(userId, activityType, details = {}) {
    this.track(userId || 'anonymous', 'Suspicious Activity Detected', {
      activity_type: activityType,
      ...details,
    });
  }

  trackMultipleFailedLogins(userId, attemptCount, ipAddress) {
    this.track(userId || 'anonymous', 'Multiple Failed Login Attempts', {
      attempt_count: attemptCount,
      ip_address: ipAddress,
    });
  }

  trackInvalidTokenUsed(userId, tokenType, ipAddress) {
    this.track(userId || 'anonymous', 'Invalid Token Used', {
      token_type: tokenType,
      ip_address: ipAddress,
    });
  }

  // Payment Events (Server-side)
  trackPaymentProcessed(userId, paymentData) {
    this.track(userId, 'Payment Processed', {
      plan_name: paymentData.planName,
      amount: paymentData.amount,
      currency: paymentData.currency,
      payment_method: paymentData.paymentMethod,
      transaction_id: paymentData.transactionId,
      success: paymentData.success,
    });
  }

  trackSubscriptionCreated(userId, subscriptionData) {
    this.track(userId, 'Subscription Created', {
      plan_name: subscriptionData.planName,
      billing_cycle: subscriptionData.billingCycle,
      amount: subscriptionData.amount,
      subscription_id: subscriptionData.subscriptionId,
    });
  }

  trackSubscriptionUpdated(userId, updateData) {
    this.track(userId, 'Subscription Updated', {
      from_plan: updateData.fromPlan,
      to_plan: updateData.toPlan,
      change_type: updateData.changeType,
    });
  }

  trackSubscriptionCancelled(userId, subscriptionData) {
    this.track(userId, 'Subscription Cancelled', {
      plan_name: subscriptionData.planName,
      cancellation_reason: subscriptionData.reason,
      refund_issued: subscriptionData.refundIssued,
    });
  }

  // Bulk Operations
  trackBulkOperation(userId, operationType, count, success = true) {
    this.track(userId, 'Bulk Operation Performed', {
      operation_type: operationType,
      item_count: count,
      success,
    });
  }
}

// Create singleton instance
const amplitudeService = new AmplitudeService();

module.exports = amplitudeService;
