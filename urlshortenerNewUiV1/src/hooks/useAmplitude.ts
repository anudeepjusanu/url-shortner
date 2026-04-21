import { useCallback } from 'react';
import amplitudeService from '@/services/amplitude';

export const useAmplitude = () => {
  const track = useCallback((eventName: string, properties?: Record<string, any>) => {
    amplitudeService.track(eventName, properties);
  }, []);

  return {
    track,

    // Authentication
    trackRegistrationStarted: useCallback((source?: string) =>
      amplitudeService.trackRegistrationStarted(source), []),
    trackRegistrationCompleted: useCallback((userId: string, userProperties?: Record<string, any>) =>
      amplitudeService.trackRegistrationCompleted(userId, userProperties), []),
    trackLogin: useCallback((userId: string, method?: string) =>
      amplitudeService.trackLogin(userId, method), []),
    trackLogout: useCallback(() =>
      amplitudeService.trackLogout(), []),
    trackPasswordResetRequested: useCallback((email: string) =>
      amplitudeService.trackPasswordResetRequested(email), []),
    trackPasswordResetCompleted: useCallback(() =>
      amplitudeService.trackPasswordResetCompleted(), []),

    // Link Management
    trackLinkCreated: useCallback((linkProperties?: Record<string, any>) =>
      amplitudeService.trackLinkCreated(linkProperties), []),
    trackLinkClicked: useCallback((linkId: string, linkProperties?: Record<string, any>) =>
      amplitudeService.trackLinkClicked(linkId, linkProperties), []),
    trackLinkEdited: useCallback((linkId: string, changedFields?: string[]) =>
      amplitudeService.trackLinkEdited(linkId, changedFields), []),
    trackLinkDeleted: useCallback((linkId: string, linkAge?: number | null) =>
      amplitudeService.trackLinkDeleted(linkId, linkAge), []),
    trackBulkLinksCreated: useCallback((count: number) =>
      amplitudeService.trackBulkLinksCreated(count), []),
    trackLinkCopied: useCallback((linkId: string) =>
      amplitudeService.trackLinkCopied(linkId), []),

    // QR Code
    trackQRCodeGenerated: useCallback((linkId: string, options?: Record<string, any>) =>
      amplitudeService.trackQRCodeGenerated(linkId, options), []),
    trackQRCodeDownloaded: useCallback((linkId: string, format?: string) =>
      amplitudeService.trackQRCodeDownloaded(linkId, format), []),
    trackQRCodeCustomized: useCallback((linkId: string, customizations?: Record<string, any>) =>
      amplitudeService.trackQRCodeCustomized(linkId, customizations), []),

    // Analytics
    trackAnalyticsViewed: useCallback((linkId?: string | null, viewType?: string) =>
      amplitudeService.trackAnalyticsViewed(linkId, viewType), []),
    trackAnalyticsFiltered: useCallback((filterType: string, filterValue: any) =>
      amplitudeService.trackAnalyticsFiltered(filterType, filterValue), []),
    trackAnalyticsExported: useCallback((format: string, linkId?: string | null) =>
      amplitudeService.trackAnalyticsExported(format, linkId), []),
    trackDashboardViewed: useCallback(() =>
      amplitudeService.trackDashboardViewed(), []),

    // UTM Builder
    trackUTMParametersAdded: useCallback((params?: Record<string, any>) =>
      amplitudeService.trackUTMParametersAdded(params), []),
    trackUTMLinkGenerated: useCallback(() =>
      amplitudeService.trackUTMLinkGenerated(), []),
    trackUTMTemplateSaved: useCallback((templateName: string) =>
      amplitudeService.trackUTMTemplateSaved(templateName), []),

    // Custom Domains
    trackCustomDomainAdded: useCallback((domain: string) =>
      amplitudeService.trackCustomDomainAdded(domain), []),
    trackCustomDomainVerified: useCallback((domain: string) =>
      amplitudeService.trackCustomDomainVerified(domain), []),
    trackCustomDomainDeleted: useCallback((domain: string) =>
      amplitudeService.trackCustomDomainDeleted(domain), []),

    // Subscription & Billing
    trackSubscriptionPageViewed: useCallback(() =>
      amplitudeService.trackSubscriptionPageViewed(), []),
    trackPlanSelected: useCallback((planName: string, planPrice: number) =>
      amplitudeService.trackPlanSelected(planName, planPrice), []),
    trackPaymentInitiated: useCallback((planName: string, amount: number) =>
      amplitudeService.trackPaymentInitiated(planName, amount), []),
    trackPaymentCompleted: useCallback((planName: string, amount: number, transactionId: string) =>
      amplitudeService.trackPaymentCompleted(planName, amount, transactionId), []),
    trackPaymentFailed: useCallback((planName: string, amount: number, errorReason: string) =>
      amplitudeService.trackPaymentFailed(planName, amount, errorReason), []),
    trackSubscriptionUpgraded: useCallback((fromPlan: string, toPlan: string) =>
      amplitudeService.trackSubscriptionUpgraded(fromPlan, toPlan), []),
    trackSubscriptionCancelled: useCallback((planName: string, reason?: string | null) =>
      amplitudeService.trackSubscriptionCancelled(planName, reason), []),
    trackBillingPageViewed: useCallback(() =>
      amplitudeService.trackBillingPageViewed(), []),

    // Admin
    trackUserManagementAccessed: useCallback(() =>
      amplitudeService.trackUserManagementAccessed(), []),
    trackUserRoleChanged: useCallback((targetUserId: string, newRole: string) =>
      amplitudeService.trackUserRoleChanged(targetUserId, newRole), []),
    trackUserDeleted: useCallback((targetUserId: string) =>
      amplitudeService.trackUserDeleted(targetUserId), []),
    trackAdminUrlManagementAccessed: useCallback(() =>
      amplitudeService.trackAdminUrlManagementAccessed(), []),
    trackContentFilterApplied: useCallback((filterType: string, filterValue: any) =>
      amplitudeService.trackContentFilterApplied(filterType, filterValue), []),

    // User Engagement
    trackPageView: useCallback((pageName: string, pageUrl: string) =>
      amplitudeService.trackPageView(pageName, pageUrl), []),
    trackFeatureDiscovery: useCallback((featureName: string) =>
      amplitudeService.trackFeatureDiscovery(featureName), []),
    trackSearchPerformed: useCallback((searchQuery: string, resultsCount: number) =>
      amplitudeService.trackSearchPerformed(searchQuery, resultsCount), []),
    trackFilterApplied: useCallback((filterType: string, filterValue: any) =>
      amplitudeService.trackFilterApplied(filterType, filterValue), []),
    trackSettingsChanged: useCallback((settingName: string, newValue: any) =>
      amplitudeService.trackSettingsChanged(settingName, newValue), []),
    trackLanguageChanged: useCallback((newLanguage: string) =>
      amplitudeService.trackLanguageChanged(newLanguage), []),

    // Error Tracking
    trackError: useCallback((errorType: string, errorMessage: string, context?: Record<string, any>) =>
      amplitudeService.trackError(errorType, errorMessage, context), []),

    // User Management
    setUser: useCallback((userId: string, userProperties?: Record<string, any>) =>
      amplitudeService.setUser(userId, userProperties), []),
    updateUserProperties: useCallback((properties: Record<string, any>) =>
      amplitudeService.updateUserProperties(properties), []),
    clearUser: useCallback(() =>
      amplitudeService.clearUser(), []),
  };
};

export default useAmplitude;
