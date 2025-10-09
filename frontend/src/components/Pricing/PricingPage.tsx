import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Zap, Users, BarChart3, Shield, Globe, Infinity } from 'lucide-react';

interface PlanFeature {
  name: string;
  included: boolean;
  value?: string;
}

interface Plan {
  name: string;
  displayName: string;
  price: number;
  period: string;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  cta: string;
}

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans: Plan[] = [
    {
      name: 'free',
      displayName: 'Free',
      price: 0,
      period: 'forever',
      description: 'Perfect for personal use and testing',
      features: [
        { name: 'URLs per month', included: true, value: '100' },
        { name: 'Custom domains', included: false },
        { name: 'Basic analytics', included: true },
        { name: 'Password protection', included: false },
        { name: 'API access', included: false },
        { name: 'Bulk operations', included: false },
        { name: 'Email support', included: true }
      ],
      cta: 'Get Started'
    },
    {
      name: 'pro',
      displayName: 'Pro',
      price: billingCycle === 'monthly' ? 9 : 90,
      period: billingCycle === 'monthly' ? 'month' : 'year',
      description: 'For professionals and small teams',
      features: [
        { name: 'URLs per month', included: true, value: 'Unlimited' },
        { name: 'Custom domains', included: true, value: '5' },
        { name: 'Advanced analytics', included: true },
        { name: 'Password protection', included: true },
        { name: 'API access', included: true },
        { name: 'Bulk operations', included: true },
        { name: 'Priority support', included: true }
      ],
      popular: true,
      cta: 'Start Free Trial'
    },
    {
      name: 'enterprise',
      displayName: 'Enterprise',
      price: billingCycle === 'monthly' ? 29 : 290,
      period: billingCycle === 'monthly' ? 'month' : 'year',
      description: 'For large teams and organizations',
      features: [
        { name: 'URLs per month', included: true, value: 'Unlimited' },
        { name: 'Custom domains', included: true, value: 'Unlimited' },
        { name: 'Enterprise analytics', included: true },
        { name: 'Password protection', included: true },
        { name: 'API access', included: true },
        { name: 'Bulk operations', included: true },
        { name: 'Dedicated support', included: true },
        { name: 'SSO integration', included: true },
        { name: 'White-label option', included: true }
      ],
      cta: 'Contact Sales'
    }
  ];

  const handlePlanSelect = (planName: string) => {
    if (planName === 'free') {
      navigate('/register');
    } else if (planName === 'enterprise') {
      window.location.href = 'mailto:info@syberviz.com?subject=Enterprise Plan Inquiry';
    } else {
      navigate('/register', { state: { selectedPlan: planName } });
    }
  };

  const FeatureIcon: React.FC<{ included: boolean }> = ({ included }) => (
    included ? (
      <Check className="w-5 h-5 text-green-500" />
    ) : (
      <X className="w-5 h-5 text-gray-300" />
    )
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Zap className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">LaghhuLink</span>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Choose the perfect plan for your needs. Start free, upgrade when you grow.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-12">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                billingCycle === 'yearly' ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Yearly
              <span className="ml-1 text-green-600 font-semibold">(Save 17%)</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl shadow-lg ${
                plan.popular ? 'ring-2 ring-blue-600' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.displayName}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>

                <div className="mb-8">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-600 ml-2">/{plan.period}</span>
                </div>

                <button
                  onClick={() => handlePlanSelect(plan.name)}
                  className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-colors ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </button>

                <div className="mt-8">
                  <ul className="space-y-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <FeatureIcon included={feature.included} />
                        <span className="ml-3 text-sm text-gray-700">
                          {feature.name}
                          {feature.value && (
                            <span className="font-medium text-gray-900 ml-1">
                              ({feature.value})
                            </span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Feature Comparison
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 font-medium text-gray-900">Features</th>
                  <th className="text-center py-4 px-4 font-medium text-gray-900">Free</th>
                  <th className="text-center py-4 px-4 font-medium text-gray-900">Pro</th>
                  <th className="text-center py-4 px-4 font-medium text-gray-900">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[
                  { name: 'URLs per month', free: '100', pro: 'Unlimited', enterprise: 'Unlimited' },
                  { name: 'Custom domains', free: '0', pro: '5', enterprise: 'Unlimited' },
                  { name: 'Analytics', free: 'Basic', pro: 'Advanced', enterprise: 'Enterprise' },
                  { name: 'Password protection', free: false, pro: true, enterprise: true },
                  { name: 'API access', free: false, pro: true, enterprise: true },
                  { name: 'Bulk operations', free: false, pro: true, enterprise: true },
                  { name: 'Support', free: 'Email', pro: 'Priority', enterprise: 'Dedicated' },
                  { name: 'SSO integration', free: false, pro: false, enterprise: true },
                  { name: 'White-label', free: false, pro: false, enterprise: true }
                ].map((feature, index) => (
                  <tr key={index}>
                    <td className="py-4 px-4 text-sm text-gray-900">{feature.name}</td>
                    <td className="py-4 px-4 text-center text-sm">
                      {typeof feature.free === 'boolean' ? (
                        <FeatureIcon included={feature.free} />
                      ) : (
                        <span className="text-gray-700">{feature.free}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center text-sm">
                      {typeof feature.pro === 'boolean' ? (
                        <FeatureIcon included={feature.pro} />
                      ) : (
                        <span className="text-gray-700">{feature.pro}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center text-sm">
                      {typeof feature.enterprise === 'boolean' ? (
                        <FeatureIcon included={feature.enterprise} />
                      ) : (
                        <span className="text-gray-700">{feature.enterprise}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="text-center mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>

          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                question: 'Can I change my plan anytime?',
                answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately and billing is prorated.'
              },
              {
                question: 'What happens if I exceed my limits?',
                answer: 'You\'ll receive notifications as you approach your limits. Free users will be prompted to upgrade, while paid users can purchase additional capacity.'
              },
              {
                question: 'Do you offer custom enterprise solutions?',
                answer: 'Yes! Contact our sales team for custom pricing and features tailored to your organization\'s needs.'
              },
              {
                question: 'Is there a free trial for paid plans?',
                answer: 'Yes, Pro and Enterprise plans include a 14-day free trial. No credit card required to start.'
              }
            ].map((faq, index) => (
              <div key={index} className="text-left bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-medium text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-blue-600 rounded-2xl py-16 px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to get started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who trust LaghhuLink for their URL shortening needs.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Start Free Today
          </button>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;