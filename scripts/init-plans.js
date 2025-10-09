const mongoose = require('mongoose');
const Plan = require('../src/models/Plan');
require('dotenv').config();

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
      support: 'email'
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
      monthly: 'price_1QCabcdef123456789', // Replace with actual Stripe price IDs
      yearly: 'price_1QCabcdef987654321'
    },
    features: {
      urlsPerMonth: -1, // Unlimited
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
      monthly: 'price_1QCenterpriseMonthly', // Replace with actual Stripe price IDs
      yearly: 'price_1QCenterpriseYearly'
    },
    features: {
      urlsPerMonth: -1, // Unlimited
      customDomains: -1, // Unlimited
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

async function initializePlans() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/url-shortener');
    console.log('Connected to MongoDB');

    // Clear existing plans
    await Plan.deleteMany({});
    console.log('Cleared existing plans');

    // Insert new plans
    const createdPlans = await Plan.insertMany(plans);
    console.log(`Created ${createdPlans.length} plans:`);

    createdPlans.forEach(plan => {
      console.log(`- ${plan.displayName} (${plan.name}): $${plan.price.monthly}/month`);
    });

    console.log('Plans initialized successfully!');
  } catch (error) {
    console.error('Error initializing plans:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the initialization
if (require.main === module) {
  initializePlans();
}

module.exports = initializePlans;