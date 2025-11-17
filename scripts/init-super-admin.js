#!/usr/bin/env node

/**
 * Initialize Super Admin Script
 *
 * This script creates a super admin user for production deployment.
 * It should be run once during initial setup.
 *
 * Usage:
 *   node scripts/init-super-admin.js
 *
 * Or with environment variables:
 *   SUPER_ADMIN_EMAIL=admin@example.com SUPER_ADMIN_PASSWORD=securepass node scripts/init-super-admin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');

// Import User model
const User = require('../src/models/User');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Prompt for user input
 */
const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
const isValidPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  return password.length >= 8 &&
         /[A-Z]/.test(password) &&
         /[a-z]/.test(password) &&
         /[0-9]/.test(password);
};

/**
 * Create super admin user
 */
const createSuperAdmin = async (email, password, name) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.role === 'super_admin') {
        console.log('\n⚠️  Super admin with this email already exists.');
        console.log(`Email: ${existingUser.email}`);
        console.log(`Name: ${existingUser.name}`);
        console.log(`Created: ${existingUser.createdAt.toISOString()}`);

        const overwrite = await question('\nDo you want to update this user? (yes/no): ');
        if (overwrite.toLowerCase() !== 'yes' && overwrite.toLowerCase() !== 'y') {
          console.log('\nOperation cancelled.');
          return null;
        }

        // Update existing user
        existingUser.password = await bcrypt.hash(password, 10);
        existingUser.name = name;
        existingUser.role = 'super_admin';
        existingUser.isActive = true;
        existingUser.emailVerified = true;

        await existingUser.save();
        console.log('\n✅ Super admin updated successfully!');
        return existingUser;
      } else {
        console.log('\n⚠️  A user with this email already exists but is not a super admin.');
        const upgrade = await question('Do you want to upgrade this user to super admin? (yes/no): ');
        if (upgrade.toLowerCase() !== 'yes' && upgrade.toLowerCase() !== 'y') {
          console.log('\nOperation cancelled.');
          return null;
        }

        // Upgrade to super admin
        existingUser.role = 'super_admin';
        existingUser.password = await bcrypt.hash(password, 10);
        existingUser.name = name;
        existingUser.isActive = true;
        existingUser.emailVerified = true;

        await existingUser.save();
        console.log('\n✅ User upgraded to super admin successfully!');
        return existingUser;
      }
    }

    // Create new super admin
    const hashedPassword = await bcrypt.hash(password, 10);

    const superAdmin = new User({
      email,
      password: hashedPassword,
      name,
      role: 'super_admin',
      isActive: true,
      emailVerified: true,
      subscription: {
        plan: 'enterprise',
        status: 'active',
        billingCycle: 'lifetime',
        startDate: new Date(),
        features: {
          maxUrls: -1, // Unlimited
          maxCustomDomains: -1, // Unlimited
          analyticsEnabled: true,
          qrCodesEnabled: true,
          customBrandingEnabled: true,
          apiAccessEnabled: true,
          bulkOperationsEnabled: true
        }
      }
    });

    await superAdmin.save();

    console.log('\n✅ Super admin created successfully!');
    return superAdmin;

  } catch (error) {
    console.error('\n❌ Error creating super admin:', error.message);
    throw error;
  }
};

/**
 * Main function
 */
const main = async () => {
  try {
    console.log('\n===========================================');
    console.log('   Super Admin Initialization Script');
    console.log('===========================================\n');

    // Connect to database
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/url-shortener';
    console.log('Connecting to database...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database\n');

    // Get super admin details
    let email = process.env.SUPER_ADMIN_EMAIL;
    let password = process.env.SUPER_ADMIN_PASSWORD;
    let name = process.env.SUPER_ADMIN_NAME || 'Super Admin';

    // If not provided via environment variables, prompt for input
    if (!email) {
      while (true) {
        email = await question('Enter super admin email: ');
        if (isValidEmail(email)) {
          break;
        }
        console.log('❌ Invalid email format. Please try again.');
      }
    }

    if (!password) {
      while (true) {
        password = await question('Enter super admin password (min 8 chars, 1 uppercase, 1 lowercase, 1 number): ');
        if (isValidPassword(password)) {
          const confirmPassword = await question('Confirm password: ');
          if (password === confirmPassword) {
            break;
          }
          console.log('❌ Passwords do not match. Please try again.');
        } else {
          console.log('❌ Password does not meet requirements. Please try again.');
        }
      }
    }

    if (!process.env.SUPER_ADMIN_NAME) {
      const inputName = await question('Enter super admin name (default: Super Admin): ');
      if (inputName.trim()) {
        name = inputName.trim();
      }
    }

    console.log('\n-------------------------------------------');
    console.log('Super Admin Details:');
    console.log(`Email: ${email}`);
    console.log(`Name: ${name}`);
    console.log('-------------------------------------------\n');

    const confirm = await question('Proceed with creation? (yes/no): ');
    if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      console.log('\nOperation cancelled.');
      process.exit(0);
    }

    // Create super admin
    const superAdmin = await createSuperAdmin(email, password, name);

    if (superAdmin) {
      console.log('\n-------------------------------------------');
      console.log('Super Admin Information:');
      console.log('-------------------------------------------');
      console.log(`ID: ${superAdmin._id}`);
      console.log(`Email: ${superAdmin.email}`);
      console.log(`Name: ${superAdmin.name}`);
      console.log(`Role: ${superAdmin.role}`);
      console.log(`Created: ${superAdmin.createdAt.toISOString()}`);
      console.log('-------------------------------------------\n');

      console.log('⚠️  IMPORTANT: Save these credentials securely!');
      console.log('⚠️  This is the only time the password will be displayed.\n');
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    rl.close();
    await mongoose.disconnect();
    console.log('\n✅ Database connection closed.');
    process.exit(0);
  }
};

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { createSuperAdmin };
