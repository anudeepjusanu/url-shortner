import * as amplitude from '@amplitude/analytics-browser';

class AmplitudeService {
  private initialized = false;

  initialize(): void {
    if (this.initialized) return;

    const apiKey = import.meta.env.VITE_AMPLITUDE_API_KEY;

    if (!apiKey) {
      console.warn('Amplitude API key not found. Analytics will not be tracked.');
      return;
    }

    amplitude.init(apiKey, {
      defaultTracking: {
        sessions: true,
        pageViews: false, // Tracked manually for better control
        formInteractions: false,
        fileDownloads: true,
      },
    });

    this.initialized = true;
    console.log('Amplitude initialized successfully');
  }

  setUser(userId: string, userProperties: Record<string, any> = {}): void {
    if (!this.initialized) return;

    amplitude.setUserId(userId);

    if (Object.keys(userProperties).length > 0) {
      const identifyEvent = new amplitude.Identify();
      Object.entries(userProperties).forEach(([key, value]) => {
        identifyEvent.set(key, value);
      });
      amplitude.identify(identifyEvent);
    }
  }

  updateUserProperties(properties: Record<string, any>): void {
    if (!this.initialized) return;

    const identifyEvent = new amplitude.Identify();
    Object.entries(properties).forEach(([key, value]) => {
      identifyEvent.set(key, value);
    });
    amplitude.identify(identifyEvent);
  }

  incrementUserProperty(property: string, value = 1): void {
    if (!this.initialized) return;

    amplitude.identify(new amplitude.Identify().add(property, value));
  }

  clearUser(): void {
    if (!this.initialized) return;

    amplitude.setUserId(undefined);
    amplitude.reset();
  }

  track(eventName: string, eventProperties: Record<string, any> = {}): void {
    if (!this.initialized) return;

    amplitude.track(eventName, {
      ...eventProperties,
      timestamp: new Date().toISOString(),
      platform: 'web',
    });
  }

  // Authentication Events
  trackRegistrationStarted(source = 'direct'): void {
    this.track('User Registration Started', { source });
  }

  trackRegistrationCompleted(userId: string, userProperties: Record<string, any> = {}): void {
    this.setUser(userId, {
      ...userProperties,
      registration_date: new Date().toISOString(),
    });
    this.track('User Registration Completed', {
      registration_method: userProperties.registration_method || 'email',
    });
  }

  trackLogin(userId: string, method = 'email'): void {
    this.setUser(userId);
    this.updateUserProperties({ last_login_date: new Date().toISOString() });
    this.track('User Login', { method });
  }

  trackLogout(): void {
    this.track('User Logout');
    this.clearUser();
  }

  trackPasswordResetRequested(email: string): void {
    this.track('Password Reset Requested', { email_provided: !!email });
  }

  trackPasswordResetCompleted(): void {
    this.track('Password Reset Completed');
  }

  // Link Management Events
  trackLinkCreated(linkProperties: Record<string, any> = {}): void {
    this.track('Short Link Created', {
      has_custom_alias: !!linkProperties.customAlias,
      has_password: !!linkProperties.hasPassword,
      has_expiry: !!linkProperties.hasExpiry,
      has_utm_params: !!linkProperties.hasUtmParams,
      link_type: linkProperties.linkType || 'standard',
    });
    this.incrementUserProperty('total_links_created');
  }

  trackLinkClicked(linkId: string, linkProperties: Record<string, any> = {}): void {
    this.track('Short Link Clicked', { link_id: linkId, ...linkProperties });
  }

  trackLinkEdited(linkId: string, changedFields: string[] = []): void {
    this.track('Short Link Edited', { link_id: linkId, changed_fields: changedFields });
  }

  trackLinkDeleted(linkId: string, linkAge: number | null = null): void {
    this.track('Short Link Deleted', { link_id: linkId, link_age_days: linkAge });
  }

  trackBulkLinksCreated(count: number): void {
    this.track('Bulk Links Created', { count });
    this.incrementUserProperty('total_links_created', count);
  }

  trackLinkCopied(linkId: string): void {
    this.track('Link Copy to Clipboard', { link_id: linkId });
  }

  // QR Code Events
  trackQRCodeGenerated(linkId: string, options: Record<string, any> = {}): void {
    this.track('QR Code Generated', {
      link_id: linkId,
      has_custom_style: !!options.customStyle,
      format: options.format || 'png',
    });
  }

  trackQRCodeDownloaded(linkId: string, format = 'png'): void {
    this.track('QR Code Downloaded', { link_id: linkId, format });
  }

  trackQRCodeCustomized(linkId: string, customizations: Record<string, any> = {}): void {
    this.track('QR Code Customized', { link_id: linkId, ...customizations });
  }

  // Analytics Events
  trackAnalyticsViewed(linkId: string | null = null, viewType = 'overview'): void {
    this.track('Analytics Page Viewed', { link_id: linkId, view_type: viewType });
  }

  trackAnalyticsFiltered(filterType: string, filterValue: any): void {
    this.track('Analytics Filtered', { filter_type: filterType, filter_value: filterValue });
  }

  trackAnalyticsExported(format: string, linkId: string | null = null): void {
    this.track('Analytics Exported', { format, link_id: linkId });
  }

  trackDashboardViewed(): void {
    this.track('Dashboard Viewed');
  }

  // UTM Builder Events
  trackUTMParametersAdded(params: Record<string, any> = {}): void {
    this.track('UTM Parameters Added', {
      has_source: !!params.source,
      has_medium: !!params.medium,
      has_campaign: !!params.campaign,
      has_term: !!params.term,
      has_content: !!params.content,
    });
  }

  trackUTMLinkGenerated(): void {
    this.track('UTM Link Generated');
  }

  trackUTMTemplateSaved(templateName: string): void {
    this.track('UTM Template Saved', { template_name: templateName });
  }

  // Custom Domain Events
  trackCustomDomainAdded(domain: string): void {
    this.track('Custom Domain Added', { domain });
    this.incrementUserProperty('custom_domains_count');
  }

  trackCustomDomainVerified(domain: string): void {
    this.track('Custom Domain Verified', { domain });
  }

  trackCustomDomainDeleted(domain: string): void {
    this.track('Custom Domain Deleted', { domain });
    this.incrementUserProperty('custom_domains_count', -1);
  }

  // Subscription & Billing Events
  trackSubscriptionPageViewed(): void {
    this.track('Subscription Page Viewed');
  }

  trackPlanSelected(planName: string, planPrice: number): void {
    this.track('Plan Selected', { plan_name: planName, plan_price: planPrice });
  }

  trackPaymentInitiated(planName: string, amount: number): void {
    this.track('Payment Initiated', { plan_name: planName, amount });
  }

  trackPaymentCompleted(planName: string, amount: number, transactionId: string): void {
    this.track('Payment Completed', { plan_name: planName, amount, transaction_id: transactionId });
    this.updateUserProperties({ subscription_plan: planName, subscription_status: 'active' });
  }

  trackPaymentFailed(planName: string, amount: number, errorReason: string): void {
    this.track('Payment Failed', { plan_name: planName, amount, error_reason: errorReason });
  }

  trackSubscriptionUpgraded(fromPlan: string, toPlan: string): void {
    this.track('Subscription Upgraded', { from_plan: fromPlan, to_plan: toPlan });
    this.updateUserProperties({ subscription_plan: toPlan });
  }

  trackSubscriptionCancelled(planName: string, reason: string | null = null): void {
    this.track('Subscription Cancelled', { plan_name: planName, cancellation_reason: reason });
    this.updateUserProperties({ subscription_status: 'cancelled' });
  }

  trackBillingPageViewed(): void {
    this.track('Billing Page Viewed');
  }

  // Admin Events
  trackUserManagementAccessed(): void {
    this.track('User Management Accessed');
  }

  trackUserRoleChanged(targetUserId: string, newRole: string): void {
    this.track('User Role Changed', { target_user_id: targetUserId, new_role: newRole });
  }

  trackUserDeleted(targetUserId: string): void {
    this.track('User Deleted', { target_user_id: targetUserId });
  }

  trackAdminUrlManagementAccessed(): void {
    this.track('Admin URL Management Accessed');
  }

  trackContentFilterApplied(filterType: string, filterValue: any): void {
    this.track('Content Filter Applied', { filter_type: filterType, filter_value: filterValue });
  }

  // User Engagement Events
  trackPageView(pageName: string, pageUrl: string): void {
    this.track('Page View', { page_name: pageName, page_url: pageUrl });
  }

  trackFeatureDiscovery(featureName: string): void {
    this.track('Feature Discovery', { feature_name: featureName });
  }

  trackSearchPerformed(searchQuery: string, resultsCount: number): void {
    this.track('Search Performed', { search_query: searchQuery, results_count: resultsCount });
  }

  trackFilterApplied(filterType: string, filterValue: any): void {
    this.track('Filter Applied', { filter_type: filterType, filter_value: filterValue });
  }

  trackSettingsChanged(settingName: string, newValue: any): void {
    this.track('Settings Changed', { setting_name: settingName, new_value: newValue });
  }

  trackLanguageChanged(newLanguage: string): void {
    this.track('Language Changed', { language: newLanguage });
    this.updateUserProperties({ language_preference: newLanguage });
  }

  // Error Tracking
  trackError(errorType: string, errorMessage: string, context: Record<string, any> = {}): void {
    this.track('Error Occurred', { error_type: errorType, error_message: errorMessage, ...context });
  }
}

const amplitudeService = new AmplitudeService();
export default amplitudeService;
