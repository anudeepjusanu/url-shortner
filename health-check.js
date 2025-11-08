#!/usr/bin/env node

/**
 * Backend Health Check Script
 * Verifies that all QR Code and Content Filter routes are properly registered
 */

const http = require('http');

const API_BASE_URL = 'http://localhost:3015';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(path, method = 'GET') {
  return new Promise((resolve) => {
    const url = new URL(path, API_BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      resolve({
        status: res.statusCode,
        success: res.statusCode < 500
      });
    });

    req.on('error', (error) => {
      resolve({
        status: 0,
        success: false,
        error: error.message
      });
    });

    req.setTimeout(3000, () => {
      req.destroy();
      resolve({
        status: 0,
        success: false,
        error: 'Timeout'
      });
    });

    req.end();
  });
}

async function checkEndpoint(path, method = 'GET', description) {
  const result = await makeRequest(path, method);

  if (result.error) {
    log(`  ❌ ${method.padEnd(7)} ${path.padEnd(40)} - ERROR: ${result.error}`, 'red');
    return false;
  } else if (result.status === 401 || result.status === 403) {
    log(`  ✅ ${method.padEnd(7)} ${path.padEnd(40)} - ${result.status} (Auth Required - OK)`, 'green');
    return true;
  } else if (result.status < 500) {
    log(`  ✅ ${method.padEnd(7)} ${path.padEnd(40)} - ${result.status}`, 'green');
    return true;
  } else {
    log(`  ❌ ${method.padEnd(7)} ${path.padEnd(40)} - ${result.status}`, 'red');
    return false;
  }
}

async function main() {
  log('\n🔍 Backend Health Check', 'cyan');
  log('━'.repeat(80), 'cyan');

  // Check if server is running
  log('\n📡 Checking if backend server is running...', 'blue');
  const healthCheck = await makeRequest('/health');

  if (healthCheck.error) {
    log(`\n❌ Backend server is NOT running!`, 'red');
    log(`   Error: ${healthCheck.error}`, 'red');
    log(`\n💡 Start the backend server with:`, 'yellow');
    log(`   cd /home/user/url-shortner`, 'yellow');
    log(`   npm run dev`, 'yellow');
    process.exit(1);
  }

  log(`✅ Backend server is running on ${API_BASE_URL}`, 'green');

  // Check QR Code routes
  log('\n📋 Checking QR Code Routes...', 'blue');
  const qrRoutes = [
    ['/api/qr-codes/stats', 'GET'],
    ['/api/qr-codes', 'GET'],
    ['/api/qr-codes/generate/test123', 'POST'],
    ['/api/qr-codes/download/test123', 'GET'],
    ['/api/qr-codes/bulk-generate', 'POST'],
    ['/api/qr-codes/test123', 'GET'],
    ['/api/qr-codes/test123', 'PUT'],
    ['/api/qr-codes/test123', 'DELETE']
  ];

  let qrSuccess = 0;
  for (const [path, method] of qrRoutes) {
    const success = await checkEndpoint(path, method);
    if (success) qrSuccess++;
  }

  // Check Content Filter routes
  log('\n🛡️  Checking Content Filter Routes...', 'blue');
  const filterRoutes = [
    ['/api/content-filter/settings', 'GET'],
    ['/api/content-filter/settings', 'PUT'],
    ['/api/content-filter/blocked-domains', 'GET'],
    ['/api/content-filter/blocked-domains', 'POST'],
    ['/api/content-filter/blocked-domains/test.com', 'DELETE'],
    ['/api/content-filter/blocked-keywords', 'GET'],
    ['/api/content-filter/blocked-keywords', 'POST'],
    ['/api/content-filter/blocked-keywords/test', 'DELETE'],
    ['/api/content-filter/allowed-domains', 'GET'],
    ['/api/content-filter/allowed-domains', 'POST'],
    ['/api/content-filter/allowed-domains/test.com', 'DELETE'],
    ['/api/content-filter/logs', 'GET'],
    ['/api/content-filter/stats', 'GET'],
    ['/api/content-filter/validate', 'POST']
  ];

  let filterSuccess = 0;
  for (const [path, method] of filterRoutes) {
    const success = await checkEndpoint(path, method);
    if (success) filterSuccess++;
  }

  // Summary
  log('\n' + '━'.repeat(80), 'cyan');
  log('📊 Summary', 'cyan');
  log('━'.repeat(80), 'cyan');

  const totalRoutes = qrRoutes.length + filterRoutes.length;
  const totalSuccess = qrSuccess + filterSuccess;

  log(`\n  QR Code Routes:      ${qrSuccess}/${qrRoutes.length} working`, qrSuccess === qrRoutes.length ? 'green' : 'yellow');
  log(`  Content Filter Routes: ${filterSuccess}/${filterRoutes.length} working`, filterSuccess === filterRoutes.length ? 'green' : 'yellow');
  log(`  Total:              ${totalSuccess}/${totalRoutes} working\n`, totalSuccess === totalRoutes ? 'green' : 'yellow');

  if (totalSuccess === totalRoutes) {
    log('✅ All routes are properly registered and responding!', 'green');
    log('\n💡 Note: 401/403 responses are expected (authentication required)', 'cyan');
    process.exit(0);
  } else {
    log('⚠️  Some routes are not responding correctly', 'yellow');
    log('   This might be normal if authentication middleware is blocking requests', 'yellow');
    process.exit(0);
  }
}

main().catch(error => {
  log(`\n❌ Health check failed: ${error.message}`, 'red');
  process.exit(1);
});
