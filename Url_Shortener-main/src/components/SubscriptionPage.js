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
          <div className="analytics-content" style={{
            padding: '24px',
            maxWidth: '1400px',
            margin: '0 auto'
          }}>
            <div className="page-header" style={{
              marginBottom: '24px'
            }}>
              <h1 className="subscription-title" style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '4px',
                margin: '0 0 4px 0'
              }}>Subscription Management</h1>
              <p className="subscription-desc" style={{
                color: '#6B7280',
                fontSize: '14px',
                margin: 0
              }}>Manage your plan, billing, and subscription preferences</p>
            </div>

            {/* Professional Plan Card */}
            <section className="current-plan-section" style={{ marginBottom: '24px' }}>
              <div className="current-plan-card" style={{
                background: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '24px 28px',
                boxShadow: '0 2px 8px 0 rgba(16,30,54,0.03)'
              }}>
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
            <section className="available-plans-section" style={{ marginBottom: '24px' }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '16px',
                margin: '0 0 16px 0'
              }}>Available Plans</h2>
              <div className="plans-row" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px'
              }}>
                <div className="plan-card" style={{
                  background: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '24px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <div className="plan-card-title" style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '8px'
                  }}>Starter</div>
                  <div className="plan-card-price" style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#2563EB',
                    marginBottom: '16px'
                  }}>$9 <span style={{
                    fontSize: '14px',
                    color: '#6B7280',
                    fontWeight: '400'
                  }}>/month</span></div>
                  <ul className="plan-card-features" style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 20px 0',
                    color: '#22C55E',
                    fontSize: '14px',
                    fontWeight: '500',
                    lineHeight: '1.8',
                    textAlign: 'left',
                    width: '100%'
                  }}>
                    <li>✔ 5,000 links/month</li>
                    <li>✔ Basic analytics</li>
                    <li>✔ QR codes</li>
                  </ul>
                  <button className="plan-card-btn downgrade" style={{
                    width: '100%',
                    padding: '10px 0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    background: '#F3F4F6',
                    color: '#374151'
                  }}>Downgrade</button>
                </div>
                <div className="plan-card current" style={{
                  background: '#fff',
                  border: '2px solid #2563EB',
                  borderRadius: '12px',
                  padding: '24px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: '0 2px 8px 0 rgba(37,99,235,0.08)',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#2563EB',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '600',
                    padding: '4px 12px',
                    borderRadius: '12px'
                  }}>CURRENT</div>
                  <div className="plan-card-title" style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '8px'
                  }}>Professional</div>
                  <div className="plan-card-price" style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#2563EB',
                    marginBottom: '16px'
                  }}>$29 <span style={{
                    fontSize: '14px',
                    color: '#6B7280',
                    fontWeight: '400'
                  }}>/month</span></div>
                  <ul className="plan-card-features" style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 20px 0',
                    color: '#22C55E',
                    fontSize: '14px',
                    fontWeight: '500',
                    lineHeight: '1.8',
                    textAlign: 'left',
                    width: '100%'
                  }}>
                    <li>✔ 50,000 links/month</li>
                    <li>✔ Advanced analytics</li>
                    <li>✔ Custom domains (10)</li>
                  </ul>
                  <button className="plan-card-btn current" style={{
                    width: '100%',
                    padding: '10px 0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'default',
                    background: '#DBEAFE',
                    color: '#2563EB'
                  }}>Current Plan</button>
                </div>
                <div className="plan-card" style={{
                  background: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '24px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <div className="plan-card-title" style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '8px'
                  }}>Enterprise</div>
                  <div className="plan-card-price" style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#2563EB',
                    marginBottom: '16px'
                  }}>$99 <span style={{
                    fontSize: '14px',
                    color: '#6B7280',
                    fontWeight: '400'
                  }}>/month</span></div>
                  <ul className="plan-card-features" style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 20px 0',
                    color: '#22C55E',
                    fontSize: '14px',
                    fontWeight: '500',
                    lineHeight: '1.8',
                    textAlign: 'left',
                    width: '100%'
                  }}>
                    <li>✔ Unlimited links</li>
                    <li>✔ Advanced analytics</li>
                    <li>✔ Unlimited domains</li>
                  </ul>
                  <button className="plan-card-btn upgrade" style={{
                    width: '100%',
                    padding: '10px 0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    background: '#2563EB',
                    color: '#fff'
                  }}>Upgrade</button>
                </div>
              </div>
            </section>

            {/* Billing Information */}
            <section className="billing-section" style={{ marginBottom: '24px' }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '16px',
                margin: '0 0 16px 0'
              }}>Billing Information</h2>
              <div className="billing-info-row" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px'
              }}>
                <div className="billing-info-box" style={{
                  background: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '20px 24px'
                }}>
                  <div className="billing-label" style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '12px'
                  }}>Payment Method</div>
                  <div className="billing-value" style={{
                    marginBottom: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="visa-icon" style={{
                        background: '#1A1F71',
                        color: '#fff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '700'
                      }}>VISA</span>
                      <span className="card-number" style={{
                        fontSize: '14px',
                        color: '#374151'
                      }}>•••• •••• •••• 4242</span>
                    </div>
                    <span className="card-expiry" style={{
                      fontSize: '13px',
                      color: '#6B7280'
                    }}>Expires: 12/26</span>
                  </div>
                  <a href="#" className="billing-link" style={{
                    fontSize: '14px',
                    color: '#2563EB',
                    textDecoration: 'none',
                    fontWeight: '500'
                  }}>Update payment method</a>
                </div>
                <div className="billing-info-box" style={{
                  background: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  padding: '20px 24px'
                }}>
                  <div className="billing-label" style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: '12px'
                  }}>Billing Address</div>
                  <div className="billing-value" style={{
                    fontSize: '14px',
                    color: '#374151',
                    lineHeight: '1.6',
                    marginBottom: '16px'
                  }}>
                    Ahmed Al-Rashid<br />123 King Fahd Road<br />Riyadh, Saudi Arabia 12345
                  </div>
                  <a href="#" className="billing-link" style={{
                    fontSize: '14px',
                    color: '#2563EB',
                    textDecoration: 'none',
                    fontWeight: '500'
                  }}>Update billing address</a>
                </div>
              </div>
            </section>

            {/* Cancel Subscription */}
            <section className="cancel-section">
              <div className="cancel-box" style={{
                background: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '24px 28px'
              }}>
                <div className="cancel-title" style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '12px'
                }}>Cancel Subscription</div>
                <div className="cancel-desc" style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  lineHeight: '1.6',
                  marginBottom: '20px'
                }}>
                  Canceling your subscription will downgrade your account to the free plan at the end of your current billing cycle (December 15, 2024). You'll lose access to premium features but your links will continue to work.
                </div>
                <div className="cancel-warning" style={{
                  background: '#FEF3C7',
                  border: '1px solid #FCD34D',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '20px',
                  display: 'flex',
                  gap: '12px'
                }}>
                  <span className="warning-icon" style={{
                    fontSize: '20px',
                    flexShrink: 0
                  }}>⚠️</span>
                  <div style={{
                    fontSize: '13px',
                    color: '#78350F'
                  }}>
                    <b style={{ display: 'block', marginBottom: '8px' }}>What you'll lose:</b>
                    <ul style={{
                      margin: 0,
                      paddingLeft: '20px',
                      lineHeight: '1.8'
                    }}>
                      <li>Advanced analytics and reporting</li>
                      <li>Custom domain support</li>
                      <li>Priority customer support</li>
                      <li>Higher link creation limits</li>
                    </ul>
                  </div>
                </div>
                <div className="cancel-actions" style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end'
                }}>
                  <button className="pause-btn" style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: '1px solid #E5E7EB',
                    background: '#fff',
                    color: '#374151',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}>Pause for 3 months</button>
                  <button className="cancel-btn" style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none',
                    background: '#DC2626',
                    color: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}>Cancel Subscription</button>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
