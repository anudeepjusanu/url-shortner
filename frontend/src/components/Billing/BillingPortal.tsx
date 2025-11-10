import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Download,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Gift,
  TrendingUp
} from 'lucide-react';
import { api } from '../../services/api';

interface PaymentMethod {
  _id: string;
  type: string;
  card: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
  lastUsed?: Date;
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  date: Date;
  pdf: string;
}

interface SubscriptionDetails {
  stripeSubscriptionId?: string;
  status: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  trialStart?: Date;
  pausedAt?: Date;
  resumeAt?: Date;
  billingCycle: string;
  discountCode?: string;
  discountPercentage?: number;
}

interface BillingData {
  plan: {
    name: string;
    details: any;
  };
  subscription: SubscriptionDetails;
  usage: {
    urlsCreatedThisMonth: number;
    urlsCreatedTotal: number;
    customDomainsCount: number;
    apiCallsThisMonth: number;
    overageCharges: number;
  };
  paymentMethods: PaymentMethod[];
  upcomingInvoice?: {
    amount: number;
    currency: string;
    date: Date;
    lines: Array<{
      description: string;
      amount: number;
      period: {
        start: Date;
        end: Date;
      };
    }>;
  };
}

const BillingPortal: React.FC = () => {
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'payment-methods' | 'invoices' | 'usage'>('overview');
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponValidation, setCouponValidation] = useState<{ valid: boolean; message: string } | null>(null);

  useEffect(() => {
    loadBillingData();
    loadInvoices();
  }, []);

  const loadBillingData = async () => {
    try {
      const response = await api.get('/subscriptions/billing');
      setBillingData(response.data.data);
    } catch (error) {
      console.error('Failed to load billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      const response = await api.get('/subscriptions/payment-history');
      setInvoices(response.data.data.history);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    }
  };

  const handlePauseSubscription = async () => {
    if (!confirm('Are you sure you want to pause your subscription?')) return;

    try {
      await api.post('/subscriptions/pause');
      alert('Subscription paused successfully');
      loadBillingData();
    } catch (error) {
      alert('Failed to pause subscription');
    }
  };

  const handleResumeSubscription = async () => {
    try {
      await api.post('/subscriptions/resume');
      alert('Subscription resumed successfully');
      loadBillingData();
    } catch (error) {
      alert('Failed to resume subscription');
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) return;

    try {
      await api.post('/subscriptions/cancel', { immediate: false });
      alert('Subscription will be cancelled at the end of the billing period');
      loadBillingData();
    } catch (error) {
      alert('Failed to cancel subscription');
    }
  };

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;

    try {
      const response = await api.post('/subscriptions/validate-coupon', {
        couponCode: couponCode.toUpperCase(),
        planName: billingData?.plan.name
      });

      setCouponValidation({
        valid: true,
        message: `Valid! ${response.data.data.coupon.description}`
      });
    } catch (error: any) {
      setCouponValidation({
        valid: false,
        message: error.response?.data?.message || 'Invalid coupon code'
      });
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    try {
      await api.post('/subscriptions/apply-coupon', {
        couponCode: couponCode.toUpperCase()
      });
      alert('Coupon applied successfully!');
      setCouponCode('');
      setCouponValidation(null);
      loadBillingData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to apply coupon');
    }
  };

  const handleRemovePaymentMethod = async (paymentMethodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) return;

    try {
      await api.delete(`/subscriptions/payment-methods/${paymentMethodId}`);
      alert('Payment method removed');
      loadBillingData();
    } catch (error) {
      alert('Failed to remove payment method');
    }
  };

  const handleSetDefaultPaymentMethod = async (paymentMethodId: string) => {
    try {
      await api.put(`/subscriptions/payment-methods/${paymentMethodId}/default`);
      alert('Default payment method updated');
      loadBillingData();
    } catch (error) {
      alert('Failed to update default payment method');
    }
  };

  const downloadInvoice = async (invoiceId: string) => {
    try {
      const response = await api.get(`/subscriptions/invoices/${invoiceId}/download`);
      window.open(response.data.data.pdf, '_blank');
    } catch (error) {
      alert('Failed to download invoice');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Active' },
      trialing: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Trial' },
      past_due: { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Past Due' },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Cancelled' },
      paused: { color: 'bg-yellow-100 text-yellow-800', icon: Pause, label: 'Paused' }
    };

    const config = statusConfig[status] || statusConfig.active;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">Loading billing information...</div>
      </div>
    );
  }

  if (!billingData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-600">Failed to load billing information</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="mt-2 text-gray-600">Manage your subscription, payment methods, and billing history</p>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'payment-methods', label: 'Payment Methods' },
                { id: 'invoices', label: 'Invoices' },
                { id: 'usage', label: 'Usage' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Current Plan */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Current Plan</h2>
                  <p className="text-gray-600">
                    {billingData.plan.details?.displayName || billingData.plan.name}
                  </p>
                </div>
                {getStatusBadge(billingData.subscription.status)}
              </div>

              {billingData.subscription.trialEnd && new Date(billingData.subscription.trialEnd) > new Date() && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Trial Period Active</p>
                      <p className="text-sm text-blue-700">
                        Your trial ends on {new Date(billingData.subscription.trialEnd).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {billingData.subscription.discountCode && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <Gift className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        Discount Applied: {billingData.subscription.discountCode}
                      </p>
                      {billingData.subscription.discountPercentage && (
                        <p className="text-sm text-green-700">
                          {billingData.subscription.discountPercentage}% off
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Billing Cycle</p>
                  <p className="text-lg font-medium text-gray-900 capitalize">
                    {billingData.subscription.billingCycle || 'Monthly'}
                  </p>
                </div>
                {billingData.subscription.currentPeriodEnd && (
                  <div>
                    <p className="text-sm text-gray-600">Next Billing Date</p>
                    <p className="text-lg font-medium text-gray-900">
                      {new Date(billingData.subscription.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {billingData.subscription.status === 'paused' ? (
                  <button
                    onClick={handleResumeSubscription}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Resume Subscription
                  </button>
                ) : billingData.subscription.status === 'active' && (
                  <button
                    onClick={handlePauseSubscription}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pause Subscription
                  </button>
                )}

                {billingData.plan.name !== 'free' && !billingData.subscription.cancelAtPeriodEnd && (
                  <button
                    onClick={handleCancelSubscription}
                    className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Subscription
                  </button>
                )}

                <a
                  href="/pricing"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Change Plan
                </a>
              </div>
            </div>

            {/* Upcoming Invoice */}
            {billingData.upcomingInvoice && (
              <div className="bg-white shadow-sm rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Invoice</h2>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Amount Due</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${billingData.upcomingInvoice.amount.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Due Date</p>
                    <p className="text-lg font-medium text-gray-900">
                      {new Date(billingData.upcomingInvoice.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {billingData.upcomingInvoice.lines.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Line Items</h3>
                    {billingData.upcomingInvoice.lines.map((line, index) => (
                      <div key={index} className="flex justify-between text-sm py-2">
                        <span className="text-gray-600">{line.description}</span>
                        <span className="font-medium text-gray-900">${line.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Apply Coupon */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Apply Discount Code</h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponValidation(null);
                  }}
                  placeholder="Enter coupon code"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleValidateCoupon}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Validate
                </button>
                <button
                  onClick={handleApplyCoupon}
                  disabled={!couponValidation?.valid}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>

              {couponValidation && (
                <div className={`mt-3 p-3 rounded-md ${
                  couponValidation.valid ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  <p className="text-sm">{couponValidation.message}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Methods Tab */}
        {activeTab === 'payment-methods' && (
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Payment Methods</h2>
              <button
                onClick={() => setShowAddPaymentMethod(true)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Add Payment Method
              </button>
            </div>

            <div className="space-y-4">
              {billingData.paymentMethods.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No payment methods added yet</p>
              ) : (
                billingData.paymentMethods.map((method) => (
                  <div
                    key={method._id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center">
                      <CreditCard className="w-8 h-8 text-gray-400 mr-4" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {method.card.brand} •••• {method.card.last4}
                        </p>
                        <p className="text-sm text-gray-500">
                          Expires {method.card.expMonth}/{method.card.expYear}
                        </p>
                      </div>
                      {method.isDefault && (
                        <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!method.isDefault && (
                        <button
                          onClick={() => handleSetDefaultPaymentMethod(method._id)}
                          className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
                        >
                          Set as Default
                        </button>
                      )}
                      <button
                        onClick={() => handleRemovePaymentMethod(method._id)}
                        className="px-3 py-1 text-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Invoice History</h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        No invoices yet
                      </td>
                    </tr>
                  ) : (
                    invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(invoice.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${invoice.amount.toFixed(2)} {invoice.currency.toUpperCase()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            invoice.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <button
                            onClick={() => downloadInvoice(invoice.id)}
                            className="inline-flex items-center text-blue-600 hover:text-blue-700"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Usage Tab */}
        {activeTab === 'usage' && (
          <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Current Usage</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">URLs This Month</p>
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {billingData.usage.urlsCreatedThisMonth}
                  </p>
                  {billingData.plan.details?.features.urlsPerMonth !== -1 && (
                    <p className="text-sm text-gray-500 mt-1">
                      of {billingData.plan.details?.features.urlsPerMonth} included
                    </p>
                  )}
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Total URLs Created</p>
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {billingData.usage.urlsCreatedTotal}
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">Custom Domains</p>
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {billingData.usage.customDomainsCount}
                  </p>
                  {billingData.plan.details?.features.customDomains > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      of {billingData.plan.details?.features.customDomains} included
                    </p>
                  )}
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">API Calls This Month</p>
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {billingData.usage.apiCallsThisMonth}
                  </p>
                </div>

                {billingData.usage.overageCharges > 0 && (
                  <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-orange-800 font-medium">Overage Charges</p>
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                    </div>
                    <p className="text-2xl font-bold text-orange-900">
                      ${billingData.usage.overageCharges.toFixed(2)}
                    </p>
                    <p className="text-sm text-orange-700 mt-1">
                      Added to next invoice
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingPortal;
