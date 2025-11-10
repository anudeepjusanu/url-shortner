const mongoose = require('mongoose');
const Coupon = require('../src/models/Coupon');
require('dotenv').config();

const sampleCoupons = [
  {
    code: 'WELCOME20',
    description: '20% off your first month',
    discountType: 'percentage',
    discountValue: 20,
    validFor: ['pro', 'enterprise'],
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    maxUses: null,
    maxUsesPerUser: 1,
    isActive: true,
    metadata: {
      campaign: 'welcome',
      source: 'signup'
    }
  },
  {
    code: 'SAVE50',
    description: '$50 off any plan',
    discountType: 'fixed',
    discountValue: 50,
    validFor: ['pro', 'enterprise'],
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    maxUses: 100,
    maxUsesPerUser: 1,
    isActive: true,
    metadata: {
      campaign: 'monthly_promo',
      source: 'email'
    }
  },
  {
    code: 'BLACKFRIDAY',
    description: '50% off annual plans',
    discountType: 'percentage',
    discountValue: 50,
    maxDiscount: 150,
    validFor: ['pro', 'enterprise'],
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    maxUses: 500,
    maxUsesPerUser: 1,
    isActive: true,
    metadata: {
      campaign: 'blackfriday',
      source: 'website'
    }
  },
  {
    code: 'ENTERPRISE30',
    description: '30% off Enterprise plan for 3 months',
    discountType: 'percentage',
    discountValue: 30,
    validFor: ['enterprise'],
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    maxUses: 50,
    maxUsesPerUser: 1,
    isActive: true,
    metadata: {
      campaign: 'enterprise_growth',
      source: 'sales'
    }
  },
  {
    code: 'YEARLY25',
    description: '25% off yearly subscription',
    discountType: 'percentage',
    discountValue: 25,
    validFor: ['pro', 'enterprise'],
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    maxUses: null,
    maxUsesPerUser: 1,
    isActive: true,
    metadata: {
      campaign: 'annual_discount',
      source: 'website'
    }
  }
];

async function initCoupons() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/url-shortener');
    console.log('Connected to MongoDB');

    // Clear existing coupons (optional - comment out if you want to keep existing)
    // await Coupon.deleteMany({});
    // console.log('Cleared existing coupons');

    // Insert sample coupons
    for (const couponData of sampleCoupons) {
      try {
        const existingCoupon = await Coupon.findOne({ code: couponData.code });
        if (existingCoupon) {
          console.log(`Coupon ${couponData.code} already exists, skipping...`);
          continue;
        }

        const coupon = new Coupon(couponData);
        await coupon.save();
        console.log(`✓ Created coupon: ${coupon.code} - ${coupon.description}`);
      } catch (error) {
        console.error(`Failed to create coupon ${couponData.code}:`, error.message);
      }
    }

    console.log('\n✓ Coupon initialization complete!');
    console.log('\nAvailable coupons:');
    const coupons = await Coupon.find({ isActive: true });
    coupons.forEach(c => {
      console.log(`  - ${c.code}: ${c.description} (Valid until: ${c.validUntil.toLocaleDateString()})`);
    });

  } catch (error) {
    console.error('Error initializing coupons:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the initialization
initCoupons();
