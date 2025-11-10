import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import MainHeader from "./MainHeader";
import api from "../services/api";
import "./BillingManagement.css";

const BillingManagement = () => {
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
    if (!window.confirm("Are you sure you want to pause your subscription?"))
      return;

    try {
      await api.post("/subscriptions/pause");
      alert("Subscription paused successfully");
      loadBillingData();
    } catch (error) {
      alert("Failed to pause subscription");
    }
  };

  const handleResumeSubscription = async () => {
    try {
      await api.post("/subscriptions/resume");
      alert("Subscription resumed successfully");
      loadBillingData();
    } catch (error) {
      alert("Failed to resume subscription");
    }
  };

  const handleCancelSubscription = async () => {
    if (
      !window.confirm(
        "Are you sure you want to cancel? You will lose premium features at the end of your billing period."
      )
    )
      return;

    try {
      await api.post("/subscriptions/cancel", { immediate: false });
      alert("Subscription will cancel at the end of the billing period");
      loadBillingData();
    } catch (error) {
      alert("Failed to cancel subscription");
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
        message: error.response?.data?.message || "Invalid coupon code",
      });
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !couponValidation?.valid) return;

    try {
      await api.post("/subscriptions/apply-coupon", {
        couponCode: couponCode.toUpperCase(),
      });
      alert("Coupon applied successfully!");
      setCouponCode("");
      setCouponValidation(null);
      loadBillingData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to apply coupon");
    }
  };

  const handleRemovePaymentMethod = async (paymentMethodId) => {
    if (
      !window.confirm("Are you sure you want to remove this payment method?")
    )
      return;

    try {
      await api.delete(`/subscriptions/payment-methods/${paymentMethodId}`);
      alert("Payment method removed");
      loadBillingData();
    } catch (error) {
      alert("Failed to remove payment method");
    }
  };

  const handleSetDefaultPaymentMethod = async (paymentMethodId) => {
    try {
      await api.put(
        `/subscriptions/payment-methods/${paymentMethodId}/default`
      );
      alert("Default payment method updated");
      loadBillingData();
    } catch (error) {
      alert("Failed to update default payment method");
    }
  };

  const downloadInvoice = async (invoiceId) => {
    try {
      const response = await api.get(
        `/subscriptions/invoices/${invoiceId}/download`
      );
      window.open(response.data.data.pdf, "_blank");
    } catch (error) {
      alert("Failed to download invoice");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: "green", label: "Active", icon: "✓" },
      trialing: { color: "blue", label: "Trial", icon: "◷" },
      past_due: { color: "red", label: "Past Due", icon: "⚠" },
      cancelled: { color: "gray", label: "Cancelled", icon: "✕" },
      paused: { color: "yellow", label: "Paused", icon: "❚❚" },
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
              <p>Loading billing information...</p>
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
              <p>Failed to load billing information</p>
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
                <h1 className="billing-title">Billing & Subscription</h1>
                <p className="billing-subtitle">
                  Manage your subscription, payment methods, and billing history
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
                Overview
              </button>
              <button
                className={`tab-button ${
                  activeTab === "payment-methods" ? "active" : ""
                }`}
                onClick={() => setActiveTab("payment-methods")}
              >
                Payment Methods
              </button>
              <button
                className={`tab-button ${
                  activeTab === "invoices" ? "active" : ""
                }`}
                onClick={() => setActiveTab("invoices")}
              >
                Invoices
              </button>
              <button
                className={`tab-button ${activeTab === "usage" ? "active" : ""}`}
                onClick={() => setActiveTab("usage")}
              >
                Usage
              </button>
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="tab-content">
                {/* Current Plan Card */}
                <div className="billing-card">
                  <div className="card-header">
                    <div>
                      <h2 className="card-title">Current Plan</h2>
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
                          <p className="alert-title">Trial Period Active</p>
                          <p className="alert-text">
                            Your trial ends on{" "}
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
                          Discount Applied: {billingData.subscription.discountCode}
                        </p>
                        {billingData.subscription.discountPercentage && (
                          <p className="alert-text">
                            {billingData.subscription.discountPercentage}% off
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Plan Details Grid */}
                  <div className="plan-details-grid">
                    <div className="plan-detail">
                      <p className="detail-label">Billing Cycle</p>
                      <p className="detail-value">
                        {billingData.subscription.billingCycle || "Monthly"}
                      </p>
                    </div>
                    {billingData.subscription.currentPeriodEnd && (
                      <div className="plan-detail">
                        <p className="detail-label">Next Billing Date</p>
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
                        ▶ Resume Subscription
                      </button>
                    ) : (
                      billingData.subscription.status === "active" && (
                        <button
                          className="btn btn-secondary"
                          onClick={handlePauseSubscription}
                        >
                          ❚❚ Pause Subscription
                        </button>
                      )
                    )}

                    {billingData.plan.name !== "free" &&
                      !billingData.subscription.cancelAtPeriodEnd && (
                        <button
                          className="btn btn-danger"
                          onClick={handleCancelSubscription}
                        >
                          ✕ Cancel Subscription
                        </button>
                      )}

                    <a href="/pricing" className="btn btn-primary">
                      Change Plan
                    </a>
                  </div>
                </div>

                {/* Upcoming Invoice */}
                {billingData.upcomingInvoice && (
                  <div className="billing-card">
                    <h2 className="card-title">Upcoming Invoice</h2>
                    <div className="invoice-summary">
                      <div>
                        <p className="detail-label">Amount Due</p>
                        <p className="detail-value large">
                          ${billingData.upcomingInvoice.amount.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="detail-label">Due Date</p>
                        <p className="detail-value">
                          {new Date(
                            billingData.upcomingInvoice.date
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {billingData.upcomingInvoice.lines.length > 0 && (
                      <div className="invoice-lines">
                        <h3 className="invoice-lines-title">Line Items</h3>
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
                  <h2 className="card-title">Apply Discount Code</h2>
                  <div className="coupon-form">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponValidation(null);
                      }}
                      placeholder="Enter coupon code"
                      className="coupon-input"
                    />
                    <button
                      className="btn btn-secondary"
                      onClick={handleValidateCoupon}
                    >
                      Validate
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={handleApplyCoupon}
                      disabled={!couponValidation?.valid}
                    >
                      Apply
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
                    <h2 className="card-title">Payment Methods</h2>
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowAddPayment(true)}
                    >
                      + Add Payment Method
                    </button>
                  </div>

                  <div className="payment-methods-list">
                    {billingData.paymentMethods.length === 0 ? (
                      <p className="empty-state">No payment methods added yet</p>
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
                                Expires {method.card.expMonth}/{method.card.expYear}
                              </p>
                            </div>
                            {method.isDefault && (
                              <span className="default-badge">Default</span>
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
                                Set as Default
                              </button>
                            )}
                            <button
                              className="btn-link danger"
                              onClick={() => handleRemovePaymentMethod(method._id)}
                            >
                              Remove
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
                  <h2 className="card-title">Invoice History</h2>

                  <div className="invoices-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="empty-state">
                              No invoices yet
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
                                  ⬇ Download
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
                  <h2 className="card-title">Current Usage</h2>

                  <div className="usage-grid">
                    <div className="usage-card">
                      <div className="usage-header">
                        <span className="usage-label">URLs This Month</span>
                        <span className="usage-icon blue">📊</span>
                      </div>
                      <p className="usage-value">
                        {billingData.usage.urlsCreatedThisMonth}
                      </p>
                      {billingData.plan.details?.features.urlsPerMonth !== -1 && (
                        <p className="usage-limit">
                          of {billingData.plan.details?.features.urlsPerMonth}{" "}
                          included
                        </p>
                      )}
                    </div>

                    <div className="usage-card">
                      <div className="usage-header">
                        <span className="usage-label">Total URLs Created</span>
                        <span className="usage-icon green">✓</span>
                      </div>
                      <p className="usage-value">
                        {billingData.usage.urlsCreatedTotal}
                      </p>
                    </div>

                    <div className="usage-card">
                      <div className="usage-header">
                        <span className="usage-label">Custom Domains</span>
                        <span className="usage-icon purple">🌐</span>
                      </div>
                      <p className="usage-value">
                        {billingData.usage.customDomainsCount}
                      </p>
                      {billingData.plan.details?.features.customDomains > 0 && (
                        <p className="usage-limit">
                          of {billingData.plan.details?.features.customDomains}{" "}
                          included
                        </p>
                      )}
                    </div>

                    <div className="usage-card">
                      <div className="usage-header">
                        <span className="usage-label">API Calls This Month</span>
                        <span className="usage-icon orange">⚡</span>
                      </div>
                      <p className="usage-value">
                        {billingData.usage.apiCallsThisMonth}
                      </p>
                    </div>

                    {billingData.usage.overageCharges > 0 && (
                      <div className="usage-card overage">
                        <div className="usage-header">
                          <span className="usage-label">Overage Charges</span>
                          <span className="usage-icon red">⚠</span>
                        </div>
                        <p className="usage-value">
                          ${billingData.usage.overageCharges.toFixed(2)}
                        </p>
                        <p className="usage-limit">Added to next invoice</p>
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
