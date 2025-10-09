import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Shield, BarChart3, Globe, Check, Star } from 'lucide-react';
import Button from '../UI/Button';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Lightning Fast",
      description: "Create short URLs in seconds with our optimized platform"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with 99.9% uptime guarantee"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Detailed Analytics",
      description: "Track clicks, locations, devices, and more with real-time insights"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Custom Domains",
      description: "Use your own branded domains for professional short links"
    }
  ];

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      description: "Perfect for personal use",
      features: [
        "100 URLs per month",
        "Basic analytics",
        "Standard support",
        "laghhu.link domain"
      ],
      cta: "Get Started Free",
      popular: false
    },
    {
      name: "Pro",
      price: "$9",
      period: "/month",
      description: "Best for professionals",
      features: [
        "Unlimited URLs",
        "Advanced analytics",
        "Custom domains",
        "Priority support",
        "Bulk operations",
        "Password protection"
      ],
      cta: "Start Pro Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "$29",
      period: "/month",
      description: "For teams and businesses",
      features: [
        "Everything in Pro",
        "Team collaboration",
        "API access",
        "White-label solution",
        "Dedicated support",
        "SLA guarantee"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Marketing Director",
      company: "TechCorp",
      content: "LaghhuLink has transformed our marketing campaigns. The analytics are incredibly detailed and the custom domains make our links look professional.",
      rating: 5
    },
    {
      name: "David Rodriguez",
      role: "Social Media Manager",
      company: "GrowthCo",
      content: "The bulk operations feature saves us hours every week. Plus the real-time analytics help us optimize our social media strategy.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <Zap className="w-8 h-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">LaghhuLink</span>
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-500 hover:text-gray-900">Features</a>
              <a href="#pricing" className="text-gray-500 hover:text-gray-900">Pricing</a>
              <a href="#testimonials" className="text-gray-500 hover:text-gray-900">Reviews</a>
            </nav>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-500 hover:text-gray-900">Sign In</Link>
              <Button onClick={() => navigate('/register')} className="bg-blue-600 hover:bg-blue-700">
                Get Started Free
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Shorten Links,
              <span className="text-blue-600"> Amplify Results</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Create powerful short links with advanced analytics, custom domains, and enterprise-grade security.
              Transform your marketing campaigns with LaghhuLink.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => navigate('/register')}
                className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
              >
                Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/demo')}
                className="text-lg px-8 py-3"
              >
                View Demo
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              ✓ Free for 30 days • ✓ No credit card required • ✓ Cancel anytime
            </p>
          </div>

          {/* Hero Image/Demo */}
          <div className="mt-16">
            <div className="bg-gray-900 rounded-lg p-6 shadow-2xl">
              <div className="bg-white rounded-md p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gray-100 rounded px-3 py-2 flex-1">
                      <span className="text-gray-500">Paste your long URL here...</span>
                    </div>
                    <Button className="bg-blue-600">Shorten</Button>
                  </div>
                  <div className="border rounded p-3 bg-blue-50">
                    <p className="text-sm font-medium text-blue-900">https://laghhu.link/abc123</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-blue-600">🔗 Custom domain • 📊 Analytics enabled</span>
                      <button className="text-blue-600 text-sm">Copy</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Marketing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to create, manage, and optimize your short links at scale.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">10M+</div>
              <div className="text-gray-600">Links Created</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">500K+</div>
              <div className="text-gray-600">Happy Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your needs. Upgrade or downgrade anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div key={index} className={`bg-white rounded-lg shadow-sm border-2 p-8 relative ${plan.popular ? 'border-blue-500' : 'border-gray-200'}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 mr-3" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-900 hover:bg-gray-800'}`}
                  onClick={() => navigate('/register')}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Loved by Marketing Teams Worldwide
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.role} at {testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Links?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of marketers who trust LaghhuLink for their URL shortening needs.
          </p>
          <Button
            onClick={() => navigate('/register')}
            className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3"
          >
            Start Your Free Trial Today <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Zap className="w-6 h-6 text-blue-400" />
                <span className="text-lg font-bold">LaghhuLink</span>
              </div>
              <p className="text-gray-400">
                The professional URL shortener for modern marketing teams.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="/api-docs" className="hover:text-white">API</a></li>
                <li><a href="/integrations" className="hover:text-white">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/about" className="hover:text-white">About</a></li>
                <li><a href="/contact" className="hover:text-white">Contact</a></li>
                <li><a href="/privacy" className="hover:text-white">Privacy</a></li>
                <li><a href="/terms" className="hover:text-white">Terms</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/help" className="hover:text-white">Help Center</a></li>
                <li><a href="/docs" className="hover:text-white">Documentation</a></li>
                <li><a href="/status" className="hover:text-white">Status</a></li>
                <li><a href="mailto:support@laghhu.link" className="hover:text-white">support@laghhu.link</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 LaghhuLink. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;