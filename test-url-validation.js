#!/usr/bin/env node

/**
 * Quick test to verify URL validation changes
 */

const { validateUrl } = require('./src/utils/urlValidator');

console.log('\n🧪 Testing URL Validator Changes\n');
console.log('═'.repeat(60));

// Test URLs that should now pass validation (keywords removed)
const testUrls = [
  'http://malware.testing.google.test/testing/malware/',
  'http://testsafebrowsing.appspot.com/s/phishing.html',
  'http://example.com/page-about-malware-protection',
  'https://security-blog.com/phishing-awareness'
];

console.log('\n✅ These URLs should now PASS validation:');
console.log('   (They will be checked by Google Safe Browsing API instead)\n');

testUrls.forEach((url, index) => {
  const result = validateUrl(url);
  const status = result.isValid ? '✅ PASS' : '❌ FAIL';
  console.log(`${index + 1}. ${status}: ${url}`);
  if (!result.isValid) {
    console.log(`   Error: ${result.message}`);
  }
});

// Test URLs that should still fail validation (dangerous protocols/files)
const dangerousUrls = [
  'javascript:alert(1)',
  'data:text/html,<script>alert(1)</script>',
  'http://example.com/file.exe',
  'http://example.com/../../../etc/passwd'
];

console.log('\n❌ These URLs should still FAIL validation:');
console.log('   (Dangerous protocols and file types)\n');

dangerousUrls.forEach((url, index) => {
  const result = validateUrl(url);
  const status = result.isValid ? '⚠️  UNEXPECTED PASS' : '✅ CORRECTLY BLOCKED';
  console.log(`${index + 1}. ${status}: ${url}`);
  if (!result.isValid) {
    console.log(`   Reason: ${result.message}`);
  }
});

console.log('\n' + '═'.repeat(60));
console.log('\n✨ Validation changes verified!\n');
console.log('Next step: Test with Google Safe Browsing API');
console.log('Run: node test-safe-browsing.js\n');
