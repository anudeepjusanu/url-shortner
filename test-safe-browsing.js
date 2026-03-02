#!/usr/bin/env node

/**
 * Test script for Google Safe Browsing integration
 * 
 * Usage:
 *   node test-safe-browsing.js
 * 
 * This script tests the Safe Browsing service with various URLs
 */

require('dotenv').config();
const safeBrowsingService = require('./src/services/safeBrowsingService');

// Test URLs
const testUrls = {
  safe: [
    'https://google.com',
    'https://github.com',
    'https://stackoverflow.com'
  ],
  unsafe: [
    'http://malware.testing.google.test/testing/malware/',
    'http://testsafebrowsing.appspot.com/s/phishing.html',
    'http://testsafebrowsing.appspot.com/s/unwanted.html'
  ]
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testUrl(url, expectedSafe) {
  try {
    log(colors.cyan, `\n🔍 Testing: ${url}`);
    
    const result = await safeBrowsingService.checkUrl(url);
    
    if (result.skipped) {
      log(colors.yellow, `⚠️  Skipped: ${result.message || result.error}`);
      return { url, status: 'skipped', result };
    }
    
    const passed = result.isSafe === expectedSafe;
    
    if (passed) {
      log(colors.green, `✅ PASS: URL is ${result.isSafe ? 'safe' : 'unsafe'} as expected`);
    } else {
      log(colors.red, `❌ FAIL: Expected ${expectedSafe ? 'safe' : 'unsafe'}, got ${result.isSafe ? 'safe' : 'unsafe'}`);
    }
    
    if (!result.isSafe && result.threats && result.threats.length > 0) {
      log(colors.yellow, `   Threats detected: ${result.threats.map(t => t.threatType).join(', ')}`);
      log(colors.yellow, `   Message: ${result.message}`);
    }
    
    return { url, status: passed ? 'pass' : 'fail', result };
  } catch (error) {
    log(colors.red, `❌ ERROR: ${error.message}`);
    return { url, status: 'error', error: error.message };
  }
}

async function runTests() {
  log(colors.blue, '\n╔════════════════════════════════════════════════════════╗');
  log(colors.blue, '║   Google Safe Browsing Integration Test Suite         ║');
  log(colors.blue, '╚════════════════════════════════════════════════════════╝\n');
  
  // Check configuration
  const status = safeBrowsingService.getStatus();
  log(colors.cyan, '📋 Configuration Status:');
  log(colors.cyan, `   Enabled: ${status.enabled}`);
  log(colors.cyan, `   Configured: ${status.configured}`);
  log(colors.cyan, `   Threat Types: ${status.threatTypes.join(', ')}`);
  
  if (!status.configured) {
    log(colors.yellow, '\n⚠️  WARNING: Google Safe Browsing API key not configured!');
    log(colors.yellow, '   Set GOOGLE_SAFE_BROWSING_API_KEY in your .env file');
    log(colors.yellow, '   Tests will run but safety checks will be skipped\n');
  }
  
  const results = {
    pass: 0,
    fail: 0,
    error: 0,
    skipped: 0
  };
  
  // Test safe URLs
  log(colors.blue, '\n\n═══════════════════════════════════════════════════════');
  log(colors.blue, '  Testing Safe URLs (should pass)');
  log(colors.blue, '═══════════════════════════════════════════════════════');
  
  for (const url of testUrls.safe) {
    const result = await testUrl(url, true);
    results[result.status]++;
  }
  
  // Test unsafe URLs
  log(colors.blue, '\n\n═══════════════════════════════════════════════════════');
  log(colors.blue, '  Testing Unsafe URLs (should be blocked)');
  log(colors.blue, '═══════════════════════════════════════════════════════');
  
  for (const url of testUrls.unsafe) {
    const result = await testUrl(url, false);
    results[result.status]++;
  }
  
  // Summary
  log(colors.blue, '\n\n═══════════════════════════════════════════════════════');
  log(colors.blue, '  Test Summary');
  log(colors.blue, '═══════════════════════════════════════════════════════\n');
  
  const total = results.pass + results.fail + results.error + results.skipped;
  log(colors.green, `✅ Passed:  ${results.pass}/${total}`);
  log(colors.red, `❌ Failed:  ${results.fail}/${total}`);
  log(colors.red, `💥 Errors:  ${results.error}/${total}`);
  log(colors.yellow, `⚠️  Skipped: ${results.skipped}/${total}`);
  
  const successRate = total > 0 ? ((results.pass / total) * 100).toFixed(1) : 0;
  log(colors.cyan, `\n📊 Success Rate: ${successRate}%`);
  
  if (results.fail === 0 && results.error === 0) {
    log(colors.green, '\n🎉 All tests passed!\n');
    process.exit(0);
  } else if (results.skipped === total) {
    log(colors.yellow, '\n⚠️  All tests were skipped (API not configured)\n');
    process.exit(0);
  } else {
    log(colors.red, '\n❌ Some tests failed\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  log(colors.red, `\n💥 Fatal error: ${error.message}\n`);
  console.error(error);
  process.exit(1);
});
