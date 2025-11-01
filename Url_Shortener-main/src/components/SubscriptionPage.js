import React, { useState } from "react";
import Sidebar from "./Sidebar";
import MainHeader from "./MainHeader";
import "./Analytics.css";
import "./SubscriptionPage.css";

const SubscriptionPage = () => {
  const [timeFilter, setTimeFilter] = useState("Last 7 days");

  return (
    <div className="analytics-container">
      <MainHeader />
      <div className="analytics-layout">
        <Sidebar />
        <div className="analytics-main">
          <div className="analytics-content">
        <main >
          <div className="subscription-content-wrapper">
            <h1 className="subscription-title">Subscription Management</h1>
            <p className="subscription-desc">Manage your plan, billing, and subscription preferences</p>

            {/* Professional Plan Card */}
            <section className="current-plan-section">
              <div className="current-plan-card">
                <div className="plan-header-row">
                  <span className="plan-title">Professional Plan</span>
                  <span className="plan-status active">ACTIVE</span>
                  <span className="plan-price">$29 <span className="plan-price-unit">/month</span></span>
                </div>
                <div className="plan-subheader">50,000 links per month • Advanced analytics • Custom domains</div>
                <div className="plan-next-billing">Next billing: <b>December 15, 2024</b> • $29/month</div>
                <div className="plan-stats-row">
                  <div className="plan-stat"><span className="stat-number">12,450</span><span className="stat-label">Links Created<br/><span className="stat-sub">of 50,000</span></span></div>
                  <div className="plan-stat"><span className="stat-number">3</span><span className="stat-label">Custom Domains<br/><span className="stat-sub">of 10</span></span></div>
                  <div className="plan-stat"><span className="stat-number">245K</span><span className="stat-label">Total Clicks<br/><span className="stat-sub">this month</span></span></div>
                </div>
                <div className="plan-features-row">
                  <ul className="plan-features-list">
                    <li>✔ 50,000 links/month</li>
                    <li>✔ Custom domains (10)</li>
                    <li>✔ UTM tracking</li>
                  </ul>
                  <ul className="plan-features-list">
                    <li>✔ Advanced analytics</li>
                    <li>✔ QR code generation</li>
                    <li>✔ Priority support</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Available Plans */}
            <section className="available-plans-section">
              <div className="plans-row">
                <div className="plan-card">
                  <div className="plan-card-title">Starter</div>
                  <div className="plan-card-price">$9 <span>/month</span></div>
                  <ul className="plan-card-features">
                    <li>✔ 5,000 links/month</li>
                    <li>✔ Basic analytics</li>
                    <li>✔ QR codes</li>
                  </ul>
                  <button className="plan-card-btn downgrade">Downgrade</button>
                </div>
                <div className="plan-card current">
                  <div className="plan-card-title">Professional</div>
                  <div className="plan-card-price">$29 <span>/month</span></div>
                  <ul className="plan-card-features">
                    <li>✔ 50,000 links/month</li>
                    <li>✔ Advanced analytics</li>
                    <li>✔ Custom domains (10)</li>
                  </ul>
                  <button className="plan-card-btn current">Current Plan</button>
                </div>
                <div className="plan-card">
                  <div className="plan-card-title">Enterprise</div>
                  <div className="plan-card-price">$99 <span>/month</span></div>
                  <ul className="plan-card-features">
                    <li>✔ Unlimited links</li>
                    <li>✔ Advanced analytics</li>
                    <li>✔ Unlimited domains</li>
                  </ul>
                  <button className="plan-card-btn upgrade">Upgrade</button>
                </div>
              </div>
            </section>

            {/* Billing Information */}
            <section className="billing-section">
              <div className="billing-info-row">
                <div className="billing-info-box">
                  <div className="billing-label">Payment Method</div>
                  <div className="billing-value">
                    <span className="visa-icon">VISA</span>
                    <span className="card-number">•••• •••• •••• 4242</span>
                    <span className="card-expiry">Expires: 12/26</span>
                  </div>
                  <a href="#" className="billing-link">Update payment method</a>
                </div>
                <div className="billing-info-box">
                  <div className="billing-label">Billing Address</div>
                  <div className="billing-value">
                    Ahmed Al-Rashid<br />123 King Fahd Road<br />Riyadh, Saudi Arabia 12345
                  </div>
                  <a href="#" className="billing-link">Update billing address</a>
                </div>
              </div>
            </section>

            {/* Cancel Subscription */}
            <section className="cancel-section">
              <div className="cancel-box">
                <div className="cancel-title">Cancel Subscription</div>
                <div className="cancel-desc">
                  Canceling your subscription will downgrade your account to the free plan at the end of your current billing cycle (December 15, 2024). You'll lose access to premium features but your links will continue to work.
                </div>
                <div className="cancel-warning">
                  <span className="warning-icon">⚠️</span>
                  <div>
                    <b>What you'll lose:</b>
                    <ul>
                      <li>Advanced analytics and reporting</li>
                      <li>Custom domain support</li>
                      <li>Priority customer support</li>
                      <li>Higher link creation limits</li>
                    </ul>
                  </div>
                </div>
                <div className="cancel-actions">
                  <button className="pause-btn">Pause for 3 months</button>
                  <button className="cancel-btn">Cancel Subscription</button>
                </div>
              </div>
            </section>

          </div>
        </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
