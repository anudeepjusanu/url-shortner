import * as amplitude from '@amplitude/analytics-browser';

class AmplitudeService {
  constructor() {
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) return;

    const apiKey = process.env.REACT_APP_AMPLITUDE_API_KEY;
    
    if (!apiKey) {
      console.warn('Amplitude API key not found. Analytics will not be tracked.');
      return;
    }

    amplitude.init(apiKey, {
      defaultTracking: {
        sessions: true,
        pageViews: false, // We'll track manually for better control
        formInteractions: false,
        fileDownloads: true,
      },
    });

    this.initialized = true;
    console.log('Amplitude initialized successfully');
  }

  // Set user identity and properties
  setUser(userId, userProperties = {}) {
    if (!this.initialized) return;
    
    amplitude.setUserId(userId);
    
    if (Object.keys(userProperties).length > 0) {
      amplitude.identify(new amplitude.Identify().set(userProperties));
    }
  }

  // Update user properties
  updateUserProperties(properties) {
    if (!this.initialized) return;
    
    const identifyEvent = new amplitude.Identify();
    Object.entries(properties).forEach(([key, value]) => {
      identifyEvent.set(key, value);
    });
    amplitude.identify(identifyEvent);
  }

  // Increment user property
  incrementUserProperty(property, value = 1) {
    if (!this.initialized) return;
    
    amplitude.identify(
      new amplitude.Identify().add(property, value)
    );
  }

  // Clear user data on logout
  clearUser() {
    if (!this.initialized) return;
    
    amplitude.setUserId(undefined);
    amplitude.reset();
  }

  // Track event
  track(eventName, eventProperties = {}) {
    if (!this.initialized) return;
    
    amplitude.track(eventName, {
      ...eventProperties,
      timestamp: new Date().toISOString(),
      platform: 'web',
    });
  }

  // Authentication Events
  trackRegistrationStarted(source = 'direct') {
    this.track('User Registration Started', { source });
  }

  trackRegistrationCompleted(userId, userProperties = {}) {
    this.setUser(userId, {
      ...userProperties,
      registration_date: new Date().toISOString(),
    });
    this.track('User Registration Completed', {
      registration_method: userProperties.registration_method || 'email',
    });
  }

  trackLogin(userId, method = 'email') {
    this.setUser(userId);
    this.updateUserProperties({
      last_login_date: new Date().toISOString(),
    });
    this.track('User Login', { method });
  }

  trackLogout() {
    this.track('User Logout');
    this.clearUser();
  }

  trackPasswordResetRequested(email) {
    this.track('Password Reset Requested', { 
      email_provided: !!email 
    });
  }

  trackPasswordResetCompleted() {
    this.track('Password Reset Completed');
  }

  // Link Management Events
  trackLinkCreated(linkProperties = {}) {
    this.track('Short Link Created', {
      has_custom_alias: !!linkProperties.customAlias,
      has_password: !!linkProperties.hasPassword,
      has_expiry: !!linkProperties.hasExpiry,
      has_utm_params: !!linkProperties.hasUtmParams,
      link_type: linkProperties.linkType || 'standard',
    });
    this.incrementUserProperty('total_links_created');
  }

  trackLinkClicked(linkId, linkProperties = {}) {
    this.track('Short Link Clicked', {
      link_id: linkId,
      ...linkProperties,
    });
  }

  trackLinkEdited(linkId, changedFields = []) {
    this.track('Short Link Edited', {
      link_id: linkId,
      changed_fields: changedFields,
    });
  }

  trackLinkDeleted(linkId, linkAge = null) {
    this.track('Short Link Deleted', {
      link_id: linkId,
      link_age_days: linkAge,
    });
  }

  trackBulkLinksCreated(count) {
    this.track('Bulk Links Created', { count });
    this.incrementUserProperty('total_links_created', count);
  }

  trackLinkCopied(linkId) {
    this.track('Link Copy to Clipboard', { link_id: linkId });
  }

  // QR Code Events
  trackQRCodeGenerated(linkId, options = {}) {
    this.track('QR Code Generated', {
      link_id: linkId,
      has_custom_style: !!options.customStyle,
      format: options.format || 'png',
    });
  }

  trackQRCodeDownloaded(linkId, format = 'png') {
    this.track('QR Code Downloaded', {
      link_id: linkId,
      format,
    });
  }

  trackQRCodeCustomized(linkId, customizations = {}) {
    this.track('QR Code Customized', {
      link_id: linkId,
      ...customizations,
    });
  }

  // Analytics Events
  trackAnalyticsViewed(linkId = null, viewType = 'overview') {
    this.track('Analytics Page Viewed', {
      link_id: linkId,
      view_type: viewType,
    });
  }

  trackAnalyticsFiltered(filterType, filterValue) {
    this.track('Analytics Filtered', {
      filter_type: filterType,
      filter_value: filterValue,
    });
  }

  trackAnalyticsExported(format, linkId = null) {
    this.track('Analytics Exported', {
      format,
      link_id: linkId,
    });
  }

  trackDashboardViewed() {
    this.track('Dashboard Viewed');
  }

  // UTM Builder Events
  trackUTMParametersAdded(params = {}) {
    this.track('UTM Parameters Added', {
      has_source: !!params.source,
      has_medium: !!params.medium,
      has_campaign: !!params.campaign,
      has_term: !!params.term,
      has_content: !!params.content,
    });
  }

  trackUTMLinkGenerated() {
    this.track('UTM Link Generated');
  }

  trackUTMTemplateSaved(templateName) {
    this.track('UTM Template Saved', { template_name: templateName });
  }

  // Custom Domain Events
  trackCustomDomainAdded(domain) {
    this.track('Custom Domain Added', { domain });
    this.incrementUserProperty('custom_domains_count');
  }

  trackCustomDomainVerified(domain) {
    this.track('Custom Domain Verified', { domain });
  }

  trackCustomDomainDeleted(domain) {
    this.track('Custom Domain Deleted', { domain });
    this.incrementUserProperty('custom_domains_count', -1);
  }

  // Subscription & Billing Events
  trackSubscriptionPageViewed() {
    this.track('Subscription Page Viewed');
  }

  trackPlanSelected(planName, planPrice) {
    this.track('Plan Selected', {
      plan_name: planName,
      plan_price: planPrice,
    });
  }

  trackPaymentInitiated(planName, amount) {
    this.track('Payment Initiated', {
      plan_name: planName,
      amount,
    });
  }

  trackPaymentCompleted(planName, amount, transactionId) {
    this.track('Payment Completed', {
      plan_name: planName,
      amount,
      transaction_id: transactionId,
    });
    this.updateUserProperties({
      subscription_plan: planName,
      subscription_status: 'active',
    });
  }

  trackPaymentFailed(planName, amount, errorReason) {
    this.track('Payment Failed', {
      plan_name: planName,
      amount,
      error_reason: errorReason,
    });
  }

  trackSubscriptionUpgraded(fromPlan, toPlan) {
    this.track('Subscription Upgraded', {
      from_plan: fromPlan,
      to_plan: toPlan,
    });
    this.updateUserProperties({
      subscription_plan: toPlan,
    });
  }

  trackSubscriptionCancelled(planName, reason = null) {
    this.track('Subscription Cancelled', {
      plan_name: planName,
      cancellation_reason: reason,
    });
    this.updateUserProperties({
      subscription_status: 'cancelled',
    });
  }

  trackBillingPageViewed() {
    this.track('Billing Page Viewed');
  }

  // Admin Events
  trackUserManagementAccessed() {
    this.track('User Management Accessed');
  }

  trackUserRoleChanged(targetUserId, newRole) {
    this.track('User Role Changed', {
      target_user_id: targetUserId,
      new_role: newRole,
    });
  }

  trackUserDeleted(targetUserId) {
    this.track('User Deleted', {
      target_user_id: targetUserId,
    });
  }

  trackAdminUrlManagementAccessed() {
    this.track('Admin URL Management Accessed');
  }

  trackContentFilterApplied(filterType, filterValue) {
    this.track('Content Filter Applied', {
      filter_type: filterType,
      filter_value: filterValue,
    });
  }

  // User Engagement Events
  trackPageView(pageName, pageUrl) {
    this.track('Page View', {
      page_name: pageName,
      page_url: pageUrl,
    });
  }

  trackFeatureDiscovery(featureName) {
    this.track('Feature Discovery', {
      feature_name: featureName,
    });
  }

  trackSearchPerformed(searchQuery, resultsCount) {
    this.track('Search Performed', {
      search_query: searchQuery,
      results_count: resultsCount,
    });
  }

  trackFilterApplied(filterType, filterValue) {
    this.track('Filter Applied', {
      filter_type: filterType,
      filter_value: filterValue,
    });
  }

  trackSettingsChanged(settingName, newValue) {
    this.track('Settings Changed', {
      setting_name: settingName,
      new_value: newValue,
    });
  }

  trackLanguageChanged(newLanguage) {
    this.track('Language Changed', {
      language: newLanguage,
    });
    this.updateUserProperties({
      language_preference: newLanguage,
    });
  }

  // Error Tracking
  trackError(errorType, errorMessage, context = {}) {
    this.track('Error Occurred', {
      error_type: errorType,
      error_message: errorMessage,
      ...context,
    });
  }
}

// Create singleton instance
const amplitudeService = new AmplitudeService();

export default amplitudeService;
