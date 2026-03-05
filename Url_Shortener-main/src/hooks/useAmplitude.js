import { useCallback } from 'react';
import amplitudeService from '../services/amplitude';

/**
 * Custom hook for easy Amplitude tracking in React components
 */
export const useAmplitude = () => {
  const track = useCallback((eventName, properties) => {
    amplitudeService.track(eventName, properties);
  }, []);

  return {
    // Core tracking
    track,
    
    // Authentication
    trackRegistrationStarted: useCallback((source) => 
      amplitudeService.trackRegistrationStarted(source), []),
    trackRegistrationCompleted: useCallback((userId, userProperties) => 
      amplitudeService.trackRegistrationCompleted(userId, userProperties), []),
    trackLogin: useCallback((userId, method) => 
      amplitudeService.trackLogin(userId, method), []),
    trackLogout: useCallback(() => 
      amplitudeService.trackLogout(), []),
    trackPasswordResetRequested: useCallback((email) => 
      amplitudeService.trackPasswordResetRequested(email), []),
    trackPasswordResetCompleted: useCallback(() => 
      amplitudeService.trackPasswordResetCompleted(), []),
    
    // Link Management
    trackLinkCreated: useCallback((linkProperties) => 
      amplitudeService.trackLinkCreated(linkProperties), []),
    trackLinkClicked: useCallback((linkId, linkProperties) => 
      amplitudeService.trackLinkClicked(linkId, linkProperties), []),
    trackLinkEdited: useCallback((linkId, changedFields) => 
      amplitudeService.trackLinkEdited(linkId, changedFields), []),
    trackLinkDeleted: useCallback((linkId, linkAge) => 
      amplitudeService.trackLinkDeleted(linkId, linkAge), []),
    trackBulkLinksCreated: useCallback((count) => 
      amplitudeService.trackBulkLinksCreated(count), []),
    trackLinkCopied: useCallback((linkId) => 
      amplitudeService.trackLinkCopied(linkId), []),
    
    // QR Code
    trackQRCodeGenerated: useCallback((linkId, options) => 
      amplitudeService.trackQRCodeGenerated(linkId, options), []),
    trackQRCodeDownloaded: useCallback((linkId, format) => 
      amplitudeService.trackQRCodeDownloaded(linkId, format), []),
    trackQRCodeCustomized: useCallback((linkId, customizations) => 
      amplitudeService.trackQRCodeCustomized(linkId, customizations), []),
    
    // Analytics
    trackAnalyticsViewed: useCallback((linkId, viewType) => 
      amplitudeService.trackAnalyticsViewed(linkId, viewType), []),
    trackAnalyticsFiltered: useCallback((filterType, filterValue) => 
      amplitudeService.trackAnalyticsFiltered(filterType, filterValue), []),
    trackAnalyticsExported: useCallback((format, linkId) => 
      amplitudeService.trackAnalyticsExported(format, linkId), []),
    trackDashboardViewed: useCallback(() => 
      amplitudeService.trackDashboardViewed(), []),
    
    // UTM Builder
    trackUTMParametersAdded: useCallback((params) => 
      amplitudeService.trackUTMParametersAdded(params), []),
    trackUTMLinkGenerated: useCallback(() => 
      amplitudeService.trackUTMLinkGenerated(), []),
    trackUTMTemplateSaved: useCallback((templateName) => 
      amplitudeService.trackUTMTemplateSaved(templateName), []),
    
    // Custom Domains
    trackCustomDomainAdded: useCallback((domain) => 
      amplitudeService.trackCustomDomainAdded(domain), []),
    trackCustomDomainVerified: useCallback((domain) => 
      amplitudeService.trackCustomDomainVerified(domain), []),
    trackCustomDomainDeleted: useCallback((domain) => 
      amplitudeService.trackCustomDomainDeleted(domain), []),
    
    // Subscription & Billing
    trackSubscriptionPageViewed: useCallback(() => 
      amplitudeService.trackSubscriptionPageViewed(), []),
    trackPlanSelected: useCallback((planName, planPrice) => 
      amplitudeService.trackPlanSelected(planName, planPrice), []),
    trackPaymentInitiated: useCallback((planName, amount) => 
      amplitudeService.trackPaymentInitiated(planName, amount), []),
    trackPaymentCompleted: useCallback((planName, amount, transactionId) => 
      amplitudeService.trackPaymentCompleted(planName, amount, transactionId), []),
    trackPaymentFailed: useCallback((planName, amount, errorReason) => 
      amplitudeService.trackPaymentFailed(planName, amount, errorReason), []),
    trackSubscriptionUpgraded: useCallback((fromPlan, toPlan) => 
      amplitudeService.trackSubscriptionUpgraded(fromPlan, toPlan), []),
    trackSubscriptionCancelled: useCallback((planName, reason) => 
      amplitudeService.trackSubscriptionCancelled(planName, reason), []),
    trackBillingPageViewed: useCallback(() => 
      amplitudeService.trackBillingPageViewed(), []),
    
    // Admin
    trackUserManagementAccessed: useCallback(() => 
      amplitudeService.trackUserManagementAccessed(), []),
    trackUserRoleChanged: useCallback((targetUserId, newRole) => 
      amplitudeService.trackUserRoleChanged(targetUserId, newRole), []),
    trackUserDeleted: useCallback((targetUserId) => 
      amplitudeService.trackUserDeleted(targetUserId), []),
    trackAdminUrlManagementAccessed: useCallback(() => 
      amplitudeService.trackAdminUrlManagementAccessed(), []),
    trackContentFilterApplied: useCallback((filterType, filterValue) => 
      amplitudeService.trackContentFilterApplied(filterType, filterValue), []),
    
    // User Engagement
    trackPageView: useCallback((pageName, pageUrl) => 
      amplitudeService.trackPageView(pageName, pageUrl), []),
    trackFeatureDiscovery: useCallback((featureName) => 
      amplitudeService.trackFeatureDiscovery(featureName), []),
    trackSearchPerformed: useCallback((searchQuery, resultsCount) => 
      amplitudeService.trackSearchPerformed(searchQuery, resultsCount), []),
    trackFilterApplied: useCallback((filterType, filterValue) => 
      amplitudeService.trackFilterApplied(filterType, filterValue), []),
    trackSettingsChanged: useCallback((settingName, newValue) => 
      amplitudeService.trackSettingsChanged(settingName, newValue), []),
    trackLanguageChanged: useCallback((newLanguage) => 
      amplitudeService.trackLanguageChanged(newLanguage), []),
    
    // Error Tracking
    trackError: useCallback((errorType, errorMessage, context) => 
      amplitudeService.trackError(errorType, errorMessage, context), []),
    
    // User Management
    setUser: useCallback((userId, userProperties) => 
      amplitudeService.setUser(userId, userProperties), []),
    updateUserProperties: useCallback((properties) => 
      amplitudeService.updateUserProperties(properties), []),
    clearUser: useCallback(() => 
      amplitudeService.clearUser(), []),
  };
};

export default useAmplitude;
