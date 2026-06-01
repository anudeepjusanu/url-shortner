/**
 * One-time script — provisions SSL for all verified domains with ssl.status: 'pending'.
 *
 * Run on the server:
 *   node scripts/provision-pending-ssl.js
 *
 * Safe to re-run — skips domains that already have ssl.status: 'active'.
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const Domain = require('../src/models/Domain');
  const sslProvisioningService = require('../src/services/sslProvisioningService');

  const pending = await Domain.find({
    verificationStatus: 'verified',
    'ssl.status': { $in: ['pending', 'failed'] }
  });

  console.log(`Found ${pending.length} domain(s) needing SSL provisioning`);

  for (const domain of pending) {
    console.log(`\n[${domain.fullDomain}] Starting SSL provisioning...`);
    try {
      const result = await sslProvisioningService.provision(domain._id.toString());
      if (result.success) {
        console.log(`[${domain.fullDomain}] ✅ SSL provisioned. Expires: ${result.expiresAt}`);
      } else {
        console.log(`[${domain.fullDomain}] ❌ Failed: ${result.error}`);
      }
    } catch (err) {
      console.error(`[${domain.fullDomain}] ❌ Error: ${err.message}`);
    }
  }

  console.log('\nDone.');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Script failed:', err.message);
  process.exit(1);
});
