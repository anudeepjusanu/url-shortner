const Plan = require('../models/Plan');

const plans = [
  {
    name: 'free',
    displayName: 'Free',
    description: 'Perfect for personal use and testing',
    price: {
      monthly: 0,
      yearly: 0
    },
    features: {
      urlsPerMonth: 100,
      customDomains: 0,
      analytics: 'basic',
      passwordProtection: false,
      apiAccess: false,
      bulkOperations: false,
      exportData: false,
      support: 'community'
    },
    isActive: true
  },
  {
    name: 'pro',
    displayName: 'Pro',
    description: 'For professionals and small teams',
    price: {
      monthly: 9,
      yearly: 90
    },
    stripePriceId: {
      monthly: 'price_1QCabcdef123456789',
      yearly: 'price_1QCabcdef987654321'
    },
    features: {
      urlsPerMonth: -1,
      customDomains: 5,
      analytics: 'advanced',
      passwordProtection: true,
      apiAccess: true,
      bulkOperations: true,
      exportData: true,
      support: 'priority'
    },
    isActive: true
  },
  {
    name: 'enterprise',
    displayName: 'Enterprise',
    description: 'For large teams and organizations',
    price: {
      monthly: 29,
      yearly: 290
    },
    stripePriceId: {
      monthly: 'price_1QCenterpriseMonthly',
      yearly: 'price_1QCenterpriseYearly'
    },
    features: {
      urlsPerMonth: -1,
      customDomains: -1,
      analytics: 'enterprise',
      passwordProtection: true,
      apiAccess: true,
      bulkOperations: true,
      exportData: true,
      support: 'dedicated',
      ssoIntegration: true,
      whiteLabel: true,
      customBranding: true
    },
    isActive: true
  }
];

async function seedPlans() {
  try {
    const existingPlans = await Plan.countDocuments();
    if (existingPlans > 0) return;
    await Plan.insertMany(plans);
    console.log(`✅ Seeded ${plans.length} default plans`);
  } catch (error) {
    console.error('Plan seeding error:', error);
    throw error;
  }
}

module.exports = { seedPlans };
