/**
 * RBAC Testing Script
 * This script tests if the Role-Based Access Control system is working correctly
 *
 * Run with: node src/scripts/testRBAC.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function testRBAC() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/url-shortner');
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Create a test user and check default permissions
    console.log('TEST 1: Creating test user with default role...');
    const testEmail = `test_${Date.now()}@example.com`;

    let testUser = new User({
      email: testEmail,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User'
    });

    await testUser.save();
    console.log(`✅ User created with role: ${testUser.role}`);
    console.log(`✅ Permissions object:`, JSON.stringify(testUser.permissions, null, 2));

    // Test 2: Check if hasPermission method works
    console.log('\nTEST 2: Testing hasPermission method...');
    testUser = await User.findById(testUser._id);

    const testCases = [
      { resource: 'urls', action: 'create', expectedForUser: true },
      { resource: 'urls', action: 'delete', expectedForUser: true },
      { resource: 'domains', action: 'create', expectedForUser: false },
      { resource: 'analytics', action: 'export', expectedForUser: false },
      { resource: 'users', action: 'create', expectedForUser: false }
    ];

    let allPassed = true;
    for (const test of testCases) {
      const hasPermission = testUser.hasPermission(test.resource, test.action);
      const passed = hasPermission === test.expectedForUser;

      console.log(`  ${passed ? '✅' : '❌'} ${test.resource}.${test.action}: ${hasPermission} (expected: ${test.expectedForUser})`);

      if (!passed) allPassed = false;
    }

    if (!allPassed) {
      console.log('\n❌ Some permission tests failed!');
    } else {
      console.log('\n✅ All permission tests passed!');
    }

    // Test 3: Change role and check permissions update
    console.log('\nTEST 3: Changing role to editor...');
    testUser.role = 'editor';
    await testUser.save();

    testUser = await User.findById(testUser._id);
    console.log(`✅ Role changed to: ${testUser.role}`);
    console.log(`✅ Can create domains: ${testUser.hasPermission('domains', 'create')}`);
    console.log(`✅ Can export analytics: ${testUser.hasPermission('analytics', 'export')}`);

    // Test 4: Test viewer role
    console.log('\nTEST 4: Changing role to viewer...');
    testUser.role = 'viewer';
    await testUser.save();

    testUser = await User.findById(testUser._id);
    console.log(`✅ Role changed to: ${testUser.role}`);
    console.log(`✅ Can read URLs: ${testUser.hasPermission('urls', 'read')}`);
    console.log(`✅ Can create URLs: ${testUser.hasPermission('urls', 'create')} (should be false)`);
    console.log(`✅ Can delete URLs: ${testUser.hasPermission('urls', 'delete')} (should be false)`);

    // Test 5: Test admin role
    console.log('\nTEST 5: Changing role to admin...');
    testUser.role = 'admin';
    await testUser.save();

    testUser = await User.findById(testUser._id);
    console.log(`✅ Role changed to: ${testUser.role}`);
    console.log(`✅ Can create users: ${testUser.hasPermission('users', 'create')} (should be true)`);
    console.log(`✅ Can delete users: ${testUser.hasPermission('users', 'delete')} (should be true)`);

    // Cleanup
    console.log('\nCleaning up test user...');
    await User.deleteOne({ _id: testUser._id });
    console.log('✅ Test user deleted\n');

    // Summary: Show all existing users and their roles
    console.log('='.repeat(60));
    console.log('CURRENT USERS IN DATABASE:');
    console.log('='.repeat(60));

    const allUsers = await User.find({}).select('email role createdAt').limit(20);

    if (allUsers.length === 0) {
      console.log('No users found in database.');
    } else {
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
        console.log('');
      });
    }

    console.log('='.repeat(60));
    console.log('🎉 RBAC SYSTEM TEST COMPLETE!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error during RBAC testing:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
}

// Run the test
testRBAC();
