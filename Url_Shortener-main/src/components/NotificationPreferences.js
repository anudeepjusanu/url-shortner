import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { preferencesAPI } from "../services/api";
import "./NotificationPreferences.css";

const NotificationPreferences = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [testingNotification, setTestingNotification] = useState(null);

  // Preferences state
  const [preferences, setPreferences] = useState({
    performance: {
      weeklyDigest: true,
      monthlyReport: true,
      viralLinkAlert: true,
      performanceDropAlert: true,
      milestoneAlerts: true
    },
    engagement: {
      inactivityReminder: true,
      featureTips: true,
      productUpdates: true
    },
    business: {
      competitorBenchmarks: false,
      predictiveAlerts: true
    },
    monetization: {
      upgradeOpportunities: true,
      specialOffers: true,
      usageWarnings: true
    },
    operational: {
      securityAlerts: true,
      domainStatus: true,
      linkExpiration: true,
      billingUpdates: true
    },
    marketing: {
      newsletter: false,
      marketingEmails: false
    },
    reportSettings: {
      weeklyReportDay: "monday",
      monthlyReportDay: 1,
      reportFormat: "email",
      includeCharts: true
    },
    regional: {
      language: "en",
      timezone: "Asia/Riyadh",
      theme: "light"
    }
  });

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await preferencesAPI.getNotificationPreferences();
      if (response.success && response.data) {
        setPreferences(response.data);
      }
    } catch (err) {
      console.error("Error loading preferences:", err);
      setError(t("errors.generic") || "Failed to load preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (category, setting) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: !prev[category][setting]
      }
    }));
  };

  const handleCategoryToggle = (category, enabled) => {
    const categorySettings = preferences[category];
    const updatedSettings = {};
    Object.keys(categorySettings).forEach(key => {
      updatedSettings[key] = enabled;
    });
    setPreferences(prev => ({
      ...prev,
      [category]: updatedSettings
    }));
  };

  const handleReportSettingChange = (setting, value) => {
    setPreferences(prev => ({
      ...prev,
      reportSettings: {
        ...prev.reportSettings,
        [setting]: value
      }
    }));
  };

  const handleRegionalChange = (setting, value) => {
    setPreferences(prev => ({
      ...prev,
      regional: {
        ...prev.regional,
        [setting]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      
      const response = await preferencesAPI.updateNotificationPreferences(preferences);
      
      if (response.success) {
        setSuccess(t("profile.notifications.settingsSaved") || "Preferences saved successfully!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error saving preferences:", err);
      setError(err.message || t("errors.generic") || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async (type) => {
    try {
      setTestingNotification(type);
      setError("");
      setSuccess("");
      const response = await preferencesAPI.sendTestNotification(type);
      if (response.success) {
        setSuccess(`Test ${type} notification sent to your email!`);
        setTimeout(() => setSuccess(""), 5000);
      } else {
        // Handle error response from API
        setError(response.message || `Failed to send test ${type} notification`);
        setTimeout(() => setError(""), 15000);
      }
    } catch (err) {
      // Extract error message from response - handle both axios error format and direct error
      let errorMessage = `Failed to send test notification`;
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setTimeout(() => setError(""), 15000);
    } finally {
      setTestingNotification(null);
    }
  };

  const isCategoryEnabled = (category) => {
    const settings = preferences[category];
    if (!settings) return false;
    return Object.values(settings).some(v => v === true);
  };

  const isCategoryFullyEnabled = (category) => {
    const settings = preferences[category];
    if (!settings) return false;
    return Object.values(settings).every(v => v === true);
  };

  // Notification toggle component
  const NotificationToggle = ({ category, setting, label, description, isPremium = false }) => (
    <div className="notification-item">
      <div className="notification-info">
        <div className="notification-label">
          {label}
          {isPremium && <span className="premium-badge">PRO</span>}
        </div>
        {description && <div className="notification-description">{description}</div>}
      </div>
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={preferences[category]?.[setting] || false}
          onChange={() => handleToggle(category, setting)}
          disabled={isPremium}
        />
        <span className="toggle-slider"></span>
      </label>
    </div>
  );

  // Category header with toggle all
  const CategoryHeader = ({ category, title, icon }) => (
    <div className="category-header">
      <div className="category-title">
        <span className="category-icon">{icon}</span>
        <h4>{title}</h4>
      </div>
      <div className="category-toggle">
        <span className="toggle-label">
          {isCategoryFullyEnabled(category) ? "All On" : isCategoryEnabled(category) ? "Partial" : "All Off"}
        </span>
        <label className="toggle-switch small">
          <input
            type="checkbox"
            checked={isCategoryFullyEnabled(category)}
            onChange={(e) => handleCategoryToggle(category, e.target.checked)}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="notification-preferences loading">
        <div className="spinner"></div>
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="notification-preferences">
      {/* Success/Error Messages */}
      {success && (
        <div className="alert alert-success">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z" fill="#10B981"/>
          </svg>
          {success}
        </div>
      )}
      {error && (
        <div className="alert alert-error">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z" fill="#DC2626"/>
          </svg>
          {error}
        </div>
      )}

      {/* Performance & Insights */}
      <div className="notification-category">
        <CategoryHeader 
          category="performance" 
          title={t("profile.preferences.performance.title") || "Performance & Insights"} 
          icon="📊" 
        />
        <div className="notification-list">
          <NotificationToggle
            category="performance"
            setting="weeklyDigest"
            label={t("profile.preferences.performance.weeklyDigest") || "Weekly Performance Digest"}
            description={t("profile.preferences.performance.weeklyDigestDesc") || "Get a summary of your link performance every week"}
          />
          <NotificationToggle
            category="performance"
            setting="monthlyReport"
            label={t("profile.preferences.performance.monthlyReport") || "Monthly Business Report"}
            description={t("profile.preferences.performance.monthlyReportDesc") || "Detailed monthly analytics with trends and insights"}
          />
          <NotificationToggle
            category="performance"
            setting="viralLinkAlert"
            label={t("profile.preferences.performance.viralAlert") || "Viral Link Alerts"}
            description={t("profile.preferences.performance.viralAlertDesc") || "Get notified when your links get unusual traffic spikes"}
          />
          <NotificationToggle
            category="performance"
            setting="performanceDropAlert"
            label={t("profile.preferences.performance.dropAlert") || "Performance Drop Alerts"}
            description={t("profile.preferences.performance.dropAlertDesc") || "Alert when link clicks drop significantly"}
          />
          <NotificationToggle
            category="performance"
            setting="milestoneAlerts"
            label={t("profile.preferences.performance.milestones") || "Milestone Celebrations"}
            description={t("profile.preferences.performance.milestonesDesc") || "Celebrate when you hit click milestones (100, 1K, 10K)"}
          />
        </div>
        {/* Test buttons for reports */}
        <div className="test-notification-row">
          <button 
            className="test-btn"
            onClick={() => handleTestNotification("weekly")}
            disabled={testingNotification === "weekly"}
          >
            {testingNotification === "weekly" ? "Sending..." : "Send Test Weekly Report"}
          </button>
          <button 
            className="test-btn"
            onClick={() => handleTestNotification("monthly")}
            disabled={testingNotification === "monthly"}
          >
            {testingNotification === "monthly" ? "Sending..." : "Send Test Monthly Report"}
          </button>
        </div>
      </div>

      {/* Engagement */}
      <div className="notification-category">
        <CategoryHeader 
          category="engagement" 
          title={t("profile.preferences.engagement.title") || "Engagement & Tips"} 
          icon="💡" 
        />
        <div className="notification-list">
          <NotificationToggle
            category="engagement"
            setting="inactivityReminder"
            label={t("profile.preferences.engagement.inactivity") || "Inactivity Reminders"}
            description={t("profile.preferences.engagement.inactivityDesc") || "Remind me if I haven't logged in for a while"}
          />
          <NotificationToggle
            category="engagement"
            setting="featureTips"
            label={t("profile.preferences.engagement.featureTips") || "Feature Tips & Tutorials"}
            description={t("profile.preferences.engagement.featureTipsDesc") || "Learn about features you might not be using"}
          />
          <NotificationToggle
            category="engagement"
            setting="productUpdates"
            label={t("profile.preferences.engagement.productUpdates") || "Product Updates"}
            description={t("profile.preferences.engagement.productUpdatesDesc") || "Get notified about new features and improvements"}
          />
        </div>
      </div>

      {/* Business Intelligence */}
      <div className="notification-category">
        <CategoryHeader 
          category="business" 
          title={t("profile.preferences.business.title") || "Business Intelligence"} 
          icon="📈" 
        />
        <div className="notification-list">
          <NotificationToggle
            category="business"
            setting="competitorBenchmarks"
            label={t("profile.preferences.business.benchmarks") || "Industry Benchmarks"}
            description={t("profile.preferences.business.benchmarksDesc") || "Compare your performance with industry averages"}
            isPremium={false}
          />
          <NotificationToggle
            category="business"
            setting="predictiveAlerts"
            label={t("profile.preferences.business.predictive") || "Predictive Alerts"}
            description={t("profile.preferences.business.predictiveDesc") || "Get alerts about predicted usage limits and trends"}
          />
        </div>
      </div>

      {/* Monetization */}
      <div className="notification-category">
        <CategoryHeader 
          category="monetization" 
          title={t("profile.preferences.monetization.title") || "Account & Billing"} 
          icon="💳" 
        />
        <div className="notification-list">
          <NotificationToggle
            category="monetization"
            setting="upgradeOpportunities"
            label={t("profile.preferences.monetization.upgrade") || "Upgrade Opportunities"}
            description={t("profile.preferences.monetization.upgradeDesc") || "Suggestions when you might benefit from upgrading"}
          />
          <NotificationToggle
            category="monetization"
            setting="specialOffers"
            label={t("profile.preferences.monetization.offers") || "Special Offers & Discounts"}
            description={t("profile.preferences.monetization.offersDesc") || "Exclusive deals and promotional offers"}
          />
          <NotificationToggle
            category="monetization"
            setting="usageWarnings"
            label={t("profile.preferences.monetization.usage") || "Usage Limit Warnings"}
            description={t("profile.preferences.monetization.usageDesc") || "Alert when approaching plan limits"}
          />
        </div>
      </div>

      {/* Operational */}
      <div className="notification-category">
        <CategoryHeader 
          category="operational" 
          title={t("profile.preferences.operational.title") || "Security & Operations"} 
          icon="🔒" 
        />
        <div className="notification-list">
          <NotificationToggle
            category="operational"
            setting="securityAlerts"
            label={t("profile.preferences.operational.security") || "Security Alerts"}
            description={t("profile.preferences.operational.securityDesc") || "Important security notifications (always recommended)"}
          />
          <NotificationToggle
            category="operational"
            setting="domainStatus"
            label={t("profile.preferences.operational.domain") || "Domain Status Updates"}
            description={t("profile.preferences.operational.domainDesc") || "DNS verification and SSL certificate updates"}
          />
          <NotificationToggle
            category="operational"
            setting="linkExpiration"
            label={t("profile.preferences.operational.expiration") || "Link Expiration Reminders"}
            description={t("profile.preferences.operational.expirationDesc") || "Notify before your links expire"}
          />
          <NotificationToggle
            category="operational"
            setting="billingUpdates"
            label={t("profile.preferences.operational.billing") || "Billing Updates"}
            description={t("profile.preferences.operational.billingDesc") || "Payment confirmations and invoice notifications"}
          />
        </div>
      </div>

      {/* Marketing */}
      <div className="notification-category">
        <CategoryHeader 
          category="marketing" 
          title={t("profile.preferences.marketing.title") || "Marketing & Newsletter"} 
          icon="📧" 
        />
        <div className="notification-list">
          <NotificationToggle
            category="marketing"
            setting="newsletter"
            label={t("profile.preferences.marketing.newsletter") || "Newsletter"}
            description={t("profile.preferences.marketing.newsletterDesc") || "Industry news, tips, and best practices"}
          />
          <NotificationToggle
            category="marketing"
            setting="marketingEmails"
            label={t("profile.preferences.marketing.promotional") || "Promotional Emails"}
            description={t("profile.preferences.marketing.promotionalDesc") || "Marketing campaigns and announcements"}
          />
        </div>
      </div>

      {/* Report Settings */}
      <div className="notification-category">
        <div className="category-header">
          <div className="category-title">
            <span className="category-icon">⚙️</span>
            <h4>{t("profile.preferences.reportSettings.title") || "Report Settings"}</h4>
          </div>
        </div>
        <div className="report-settings">
          <div className="setting-row">
            <label>{t("profile.preferences.reportSettings.weeklyDay") || "Weekly Report Day"}</label>
            <select
              value={preferences.reportSettings?.weeklyReportDay || "monday"}
              onChange={(e) => handleReportSettingChange("weeklyReportDay", e.target.value)}
            >
              <option value="monday">Monday</option>
              <option value="tuesday">Tuesday</option>
              <option value="wednesday">Wednesday</option>
              <option value="thursday">Thursday</option>
              <option value="friday">Friday</option>
              <option value="saturday">Saturday</option>
              <option value="sunday">Sunday</option>
            </select>
          </div>
          <div className="setting-row">
            <label>{t("profile.preferences.reportSettings.monthlyDay") || "Monthly Report Day"}</label>
            <select
              value={preferences.reportSettings?.monthlyReportDay || 1}
              onChange={(e) => handleReportSettingChange("monthlyReportDay", parseInt(e.target.value))}
            >
              {[...Array(28)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
          </div>
          <div className="setting-row">
            <label>{t("profile.preferences.reportSettings.format") || "Report Format"}</label>
            <select
              value={preferences.reportSettings?.reportFormat || "email"}
              onChange={(e) => handleReportSettingChange("reportFormat", e.target.value)}
            >
              <option value="email">Email Only</option>
              <option value="pdf">PDF Attachment</option>
              <option value="both">Email + PDF</option>
            </select>
          </div>
          <div className="setting-row checkbox-row">
            <label>
              <input
                type="checkbox"
                checked={preferences.reportSettings?.includeCharts !== false}
                onChange={(e) => handleReportSettingChange("includeCharts", e.target.checked)}
              />
              {t("profile.preferences.reportSettings.includeCharts") || "Include charts and visualizations"}
            </label>
          </div>
        </div>
      </div>

      {/* Regional Settings */}
      <div className="notification-category">
        <div className="category-header">
          <div className="category-title">
            <span className="category-icon">🌍</span>
            <h4>{t("profile.preferences.regional.title") || "Regional Settings"}</h4>
          </div>
        </div>
        <div className="report-settings">
          <div className="setting-row">
            <label>{t("profile.preferences.regional.language") || "Language"}</label>
            <select
              value={preferences.regional?.language || "en"}
              onChange={(e) => handleRegionalChange("language", e.target.value)}
            >
              <option value="en">{t("common.english") || "English"}</option>
              <option value="ar">{t("common.arabic") || "Arabic"}</option>
            </select>
          </div>
          <div className="setting-row">
            <label>{t("profile.preferences.regional.timezone") || "Timezone"}</label>
            <select
              value={preferences.regional?.timezone || "Asia/Riyadh"}
              onChange={(e) => handleRegionalChange("timezone", e.target.value)}
            >
              <option value="Asia/Riyadh">Asia/Riyadh (GMT+3)</option>
              <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
              <option value="Asia/Kuwait">Asia/Kuwait (GMT+3)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="America/New_York">America/New York (GMT-5)</option>
              <option value="America/Los_Angeles">America/Los Angeles (GMT-8)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="preferences-actions">
        <button
          className="save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (t("common.updating") || "Saving...") : (t("common.save") + " " + (t("profile.tabs.preferences") || "Preferences"))}
        </button>
      </div>
    </div>
  );
};

export default NotificationPreferences;
