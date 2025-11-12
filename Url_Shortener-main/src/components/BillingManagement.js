import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import Sidebar from "./Sidebar";
import MainHeader from "./MainHeader";
import api from "../services/api";
import "./BillingManagement.css";

const BillingManagement = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("overview");
  const [billingData, setBillingData] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [couponValidation, setCouponValidation] = useState(null);
  const [showAddPayment, setShowAddPayment] = useState(false);

  useEffect(() => {
    loadBillingData();
    loadInvoices();
  }, []);

  const loadBillingData = async () => {
    try {
      const response = await api.get("/subscriptions/billing");
      setBillingData(response.data.data);
    } catch (error) {
      console.error("Failed to load billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      const response = await api.get("/subscriptions/payment-history");
      setInvoices(response.data.data.history);
    } catch (error) {
      console.error("Failed to load invoices:", error);
    }
  };

  const handlePauseSubscription = async () => {
    if (!window.confirm(t('subscription.confirmPauseSubscription')))
      return;

    try {
      await api.post("/subscriptions/pause");
      alert(t('subscription.subscriptionPausedSuccess'));
      loadBillingData();
    } catch (error) {
      alert(t('subscription.failedToPauseSubscription'));
    }
  };

  const handleResumeSubscription = async () => {
    try {
      await api.post("/subscriptions/resume");
      alert(t('subscription.subscriptionResumedSuccess'));
      loadBillingData();
    } catch (error) {
      alert(t('subscription.failedToResumeSubscription'));
    }
  };

  const handleCancelSubscription = async () => {
    if (
      !window.confirm(
        t('subscription.confirmCancelSubscription')
      )
    )
      return;

    try {
      await api.post("/subscriptions/cancel", { immediate: false });
      alert(t('subscription.subscriptionWillCancelAtPeriodEnd'));
      loadBillingData();
    } catch (error) {
      alert(t('subscription.failedToCancelSubscription'));
    }
  };

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;

    try {
      const response = await api.post("/subscriptions/validate-coupon", {
        couponCode: couponCode.toUpperCase(),
        planName: billingData?.plan.name,
      });

      setCouponValidation({
        valid: true,
        message: `✓ ${response.data.data.coupon.description}`,
      });
    } catch (error) {
      setCouponValidation({
        valid: false,
        message: error.response?.data?.message || t('subscription.invalidCouponCode'),
      });
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !couponValidation?.valid) return;

    try {
      await api.post("/subscriptions/apply-coupon", {
        couponCode: couponCode.toUpperCase(),
      });
      alert(t('subscription.couponAppliedSuccess'));
      setCouponCode("");
      setCouponValidation(null);
      loadBillingData();
    } catch (error) {
      alert(error.response?.data?.message || t('subscription.failedToApplyCoupon'));
    }
  };

  const handleRemovePaymentMethod = async (paymentMethodId) => {
    if (
      !window.confirm(t('subscription.confirmRemovePaymentMethod'))
    )
      return;

    try {
      await api.delete(`/subscriptions/payment-methods/${paymentMethodId}`);
      alert(t('subscription.paymentMethodRemoved'));
      loadBillingData();
    } catch (error) {
      alert(t('subscription.failedToRemovePaymentMethod'));
    }
  };

  const handleSetDefaultPaymentMethod = async (paymentMethodId) => {
    try {
      await api.put(
        `/subscriptions/payment-methods/${paymentMethodId}/default`
      );
      alert(t('subscription.defaultPaymentMethodUpdated'));
      loadBillingData();
    } catch (error) {
      alert(t('subscription.failedToUpdateDefaultPaymentMethod'));
    }
  };

  const downloadInvoice = async (invoiceId) => {
    try {
      const response = await api.get(
        `/subscriptions/invoices/${invoiceId}/download`
      );
      window.open(response.data.data.pdf, "_blank");
    } catch (error) {
      alert(t('subscription.failedToDownloadInvoice'));
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: "green", label: t('subscription.status.active'), icon: "✓" },
      trialing: { color: "blue", label: t('subscription.status.trial'), icon: "◷" },
      past_due: { color: "red", label: t('subscription.status.pastDue'), icon: "⚠" },
      cancelled: { color: "gray", label: t('subscription.status.cancelled'), icon: "✕" },
      paused: { color: "yellow", label: t('subscription.status.paused'), icon: "❚❚" },
    };

    const config = statusConfig[status] || statusConfig.active;

    return (
      <span className={`status-badge status-${config.color}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <MainHeader />
        <div className="analytics-layout">
          <Sidebar />
          <div className="analytics-main">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>{t('subscription.loadingBillingInfo')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!billingData) {
    return (
      <div className="analytics-container">
        <MainHeader />
        <div className="analytics-layout">
          <Sidebar />
          <div className="analytics-main">
            <div className="error-container">
              <p>{t('subscription.failedToLoadBillingInfo')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <MainHeader />
      <div className="analytics-layout">
        <Sidebar />
        <div className="analytics-main">
          <div className="billing-content">
            {/* Header */}
            <div className="billing-header">
              <div>
                <h1 className="billing-title">{t('subscription.title')}</h1>
                <p className="billing-subtitle">
                  {t('subscription.subtitle')}
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="billing-tabs">
              <button
                className={`tab-button ${
                  activeTab === "overview" ? "active" : ""
                }`}
                onClick={() => setActiveTab("overview")}
              >
                {t('subscription.tabs.overview')}
              </button>
              <button
                className={`tab-button ${
                  activeTab === "payment-methods" ? "active" : ""
                }`}
                onClick={() => setActiveTab("payment-methods")}
              >
                {t('subscription.tabs.paymentMethods')}
              </button>
              <button
                className={`tab-button ${
                  activeTab === "invoices" ? "active" : ""
                }`}
                onClick={() => setActiveTab("invoices")}
              >
                {t('subscription.tabs.invoices')}
              </button>
              <button
                className={`tab-button ${activeTab === "usage" ? "active" : ""}`}
                onClick={() => setActiveTab("usage")}
              >
                {t('subscription.tabs.usage')}
              </button>
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="tab-content">
                {/* Current Plan Card */}
                <div className="billing-card">
                  <div className="card-header">
                    <div>
                      <h2 className="card-title">{t('subscription.currentPlan.title')}</h2>
                      <p className="card-subtitle">
                        {billingData.plan.details?.displayName ||
                          billingData.plan.name}
                      </p>
                    </div>
                    {getStatusBadge(billingData.subscription.status)}
                  </div>

                  {/* Trial Alert */}
                  {billingData.subscription.trialEnd &&
                    new Date(billingData.subscription.trialEnd) > new Date() && (
                      <div className="alert alert-info">
                        <span className="alert-icon">ℹ</span>
                        <div>
                          <p className="alert-title">{t('subscription.trialPeriodActive')}</p>
                          <p className="alert-text">
                            {t('subscription.trialEndsOn')}{" "}
                            {new Date(
                              billingData.subscription.trialEnd
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}

                  {/* Discount Alert */}
                  {billingData.subscription.discountCode && (
                    <div className="alert alert-success">
                      <span className="alert-icon">🎁</span>
                        <div>
                          <p className="alert-title">
                            {t('subscription.discountApplied')}: {billingData.subscription.discountCode}
                          </p>
                          {billingData.subscription.discountPercentage && (
                            <p className="alert-text">
                              {billingData.subscription.discountPercentage}% {t('subscription.off')}
                            </p>
                          )}
                        </div>
                    </div>
                  )}

                  {/* Plan Details Grid */}
                  <div className="plan-details-grid">
                    <div className="plan-detail">
                      <p className="detail-label">{t('subscription.billingCycle')}</p>
                      <p className="detail-value">
                        {billingData.subscription.billingCycle || t('subscription.monthly')}
                      </p>
                    </div>
                    {billingData.subscription.currentPeriodEnd && (
                      <div className="plan-detail">
                        <p className="detail-label">{t('subscription.nextBilling')}</p>
                        <p className="detail-value">
                          {new Date(
                            billingData.subscription.currentPeriodEnd
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="card-actions">
                    {billingData.subscription.status === "paused" ? (
                      <button
                        className="btn btn-success"
                        onClick={handleResumeSubscription}
                      >
                        ▶ {t('subscription.resumeSubscription')}
                      </button>
                    ) : (
                      billingData.subscription.status === "active" && (
                        <button
                          className="btn btn-secondary"
                          onClick={handlePauseSubscription}
                        >
                          ❚❚ {t('subscription.pauseSubscription')}
                        </button>
                      )
                    )}

                    {billingData.plan.name !== "free" &&
                      !billingData.subscription.cancelAtPeriodEnd && (
                        <button
                          className="btn btn-danger"
                          onClick={handleCancelSubscription}
                        >
                          ✕ {t('subscription.cancelSubscriptionButton')}
                        </button>
                      )}

                    <a href="/pricing" className="btn btn-primary">
                      {t('subscription.changePlan')}
                    </a>
                  </div>
                </div>

                {/* Upcoming Invoice */}
                {billingData.upcomingInvoice && (
                  <div className="billing-card">
                    <h2 className="card-title">{t('subscription.upcomingInvoice')}</h2>
                    <div className="invoice-summary">
                      <div>
                        <p className="detail-label">{t('subscription.amountDue')}</p>
                        <p className="detail-value large">
                          ${billingData.upcomingInvoice.amount.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="detail-label">{t('subscription.dueDate')}</p>
                        <p className="detail-value">
                          {new Date(
                            billingData.upcomingInvoice.date
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {billingData.upcomingInvoice.lines.length > 0 && (
                      <div className="invoice-lines">
                        <h3 className="invoice-lines-title">{t('subscription.lineItems')}</h3>
                        {billingData.upcomingInvoice.lines.map((line, index) => (
                          <div key={index} className="invoice-line">
                            <span>{line.description}</span>
                            <span>${line.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Apply Coupon */}
                <div className="billing-card">
                  <h2 className="card-title">{t('subscription.applyDiscountCode')}</h2>
                  <div className="coupon-form">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponValidation(null);
                      }}
                      placeholder={t('subscription.enterCouponCode')}
                      className="coupon-input"
                    />
                    <button
                      className="btn btn-secondary"
                      onClick={handleValidateCoupon}
                    >
                      {t('subscription.validate')}
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={handleApplyCoupon}
                      disabled={!couponValidation?.valid}
                    >
                      {t('subscription.apply')}
                    </button>
                  </div>

                  {couponValidation && (
                    <div
                      className={`coupon-message ${
                        couponValidation.valid ? "valid" : "invalid"
                      }`}
                    >
                      {couponValidation.message}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Methods Tab */}
            {activeTab === "payment-methods" && (
              <div className="tab-content">
                <div className="billing-card">
                  <div className="card-header">
                    <h2 className="card-title">{t('subscription.paymentMethod')}</h2>
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowAddPayment(true)}
                    >
                      + {t('subscription.addPaymentMethod')}
                    </button>
                  </div>

                  <div className="payment-methods-list">
                    {billingData.paymentMethods.length === 0 ? (
                      <p className="empty-state">{t('subscription.noPaymentMethodsYet')}</p>
                    ) : (
                      billingData.paymentMethods.map((method) => (
                        <div key={method._id} className="payment-method-item">
                          <div className="payment-method-info">
                            <div className="payment-icon">💳</div>
                            <div>
                              <p className="payment-brand">
                                {method.card.brand} •••• {method.card.last4}
                              </p>
                              <p className="payment-expiry">
                                {t('subscription.expires')} {method.card.expMonth}/{method.card.expYear}
                              </p>
                            </div>
                            {method.isDefault && (
                              <span className="default-badge">{t('subscription.default')}</span>
                            )}
                          </div>
                          <div className="payment-method-actions">
                            {!method.isDefault && (
                              <button
                                className="btn-link"
                                onClick={() =>
                                  handleSetDefaultPaymentMethod(method._id)
                                }
                              >
                                {t('subscription.setAsDefault')}
                              </button>
                            )}
                            <button
                              className="btn-link danger"
                              onClick={() => handleRemovePaymentMethod(method._id)}
                            >
                              {t('common.delete')}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Invoices Tab */}
            {activeTab === "invoices" && (
              <div className="tab-content">
                <div className="billing-card">
                  <h2 className="card-title">{t('subscription.billing.title')}</h2>

                  <div className="invoices-table">
                    <table>
                      <thead>
                        <tr>
                          <th>{t('subscription.billing.date')}</th>
                          <th>{t('subscription.billing.amount')}</th>
                          <th>{t('subscription.billing.status')}</th>
                          <th>{t('myLinks.table.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="empty-state">
                              {t('subscription.noInvoicesYet')}
                            </td>
                          </tr>
                        ) : (
                          invoices.map((invoice) => (
                            <tr key={invoice.id}>
                              <td>
                                {new Date(invoice.date).toLocaleDateString()}
                              </td>
                              <td>
                                ${invoice.amount.toFixed(2)}{" "}
                                {invoice.currency.toUpperCase()}
                              </td>
                              <td>
                                <span
                                  className={`invoice-status ${invoice.status}`}
                                >
                                  {invoice.status}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="btn-link"
                                  onClick={() => downloadInvoice(invoice.id)}
                                >
                                  ⬇ {t('subscription.billing.download')}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Usage Tab */}
            {activeTab === "usage" && (
              <div className="tab-content">
                <div className="billing-card">
                  <h2 className="card-title">{t('subscription.currentUsage')}</h2>

                  <div className="usage-grid">
                    <div className="usage-card">
                      <div className="usage-header">
                        <span className="usage-label">{t('subscription.urlsThisMonth')}</span>
                        <span className="usage-icon blue">📊</span>
                      </div>
                      <p className="usage-value">
                        {billingData.usage.urlsCreatedThisMonth}
                      </p>
                      {billingData.plan.details?.features.urlsPerMonth !== -1 && (
                        <p className="usage-limit">
                          {t('subscription.of')} {billingData.plan.details?.features.urlsPerMonth}{" "}
                          {t('subscription.included')}
                        </p>
                      )}
                    </div>

                    <div className="usage-card">
                      <div className="usage-header">
                        <span className="usage-label">{t('subscription.totalUrlsCreated')}</span>
                        <span className="usage-icon green">✓</span>
                      </div>
                      <p className="usage-value">
                        {billingData.usage.urlsCreatedTotal}
                      </p>
                    </div>

                    <div className="usage-card">
                      <div className="usage-header">
                        <span className="usage-label">{t('subscription.customDomains')}</span>
                        <span className="usage-icon purple">🌐</span>
                      </div>
                      <p className="usage-value">
                        {billingData.usage.customDomainsCount}
                      </p>
                      {billingData.plan.details?.features.customDomains > 0 && (
                        <p className="usage-limit">
                          {t('subscription.of')} {billingData.plan.details?.features.customDomains}{" "}
                          {t('subscription.included')}
                        </p>
                      )}
                    </div>

                    <div className="usage-card">
                      <div className="usage-header">
                        <span className="usage-label">{t('subscription.apiCallsThisMonth')}</span>
                        <span className="usage-icon orange">⚡</span>
                      </div>
                      <p className="usage-value">
                        {billingData.usage.apiCallsThisMonth}
                      </p>
                    </div>

                    {billingData.usage.overageCharges > 0 && (
                      <div className="usage-card overage">
                        <div className="usage-header">
                          <span className="usage-label">{t('subscription.overageCharges')}</span>
                          <span className="usage-icon red">⚠</span>
                        </div>
                        <p className="usage-value">
                          ${billingData.usage.overageCharges.toFixed(2)}
                        </p>
                        <p className="usage-limit">{t('subscription.addedToNextInvoice')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingManagement;
