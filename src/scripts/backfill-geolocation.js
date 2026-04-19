/**
 * Backfill geolocation data for existing clicks that have no location info.
 * Run once: node src/scripts/backfill-geolocation.js
 *
 * Respects ip-api.com free tier limit (45 req/min) by batching with delays.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const { Click } = require('../models/Analytics');

const MONGODB_URI = process.env.MONGODB_URI;
const BATCH_SIZE = 40; // stay under 45 req/min limit
const BATCH_DELAY_MS = 65000; // wait 65 seconds between batches

const privateRanges = [
  /^127\./,
  /^192\.168\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^::1$/,
  /^fc00::/,
  /^fe80::/
];

function isPrivateIP(ip) {
  if (!ip) return true;
  const clean = ip.replace(/^::ffff:/, '');
  return privateRanges.some(r => r.test(clean));
}

async function lookupIP(ip) {
  try {
    const cleanIP = ip.replace(/^::ffff:/, '');
    if (isPrivateIP(cleanIP)) return null;

    const { data } = await axios.get(
      `http://ip-api.com/json/${cleanIP}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone`,
      { timeout: 5000 }
    );

    if (data.status === 'fail') return null;

    return {
      country: data.countryCode,
      countryName: data.country,
      region: data.regionName || data.region,
      city: data.city,
      timezone: data.timezone,
      coordinates: {
        latitude: data.lat,
        longitude: data.lon
      }
    };
  } catch {
    return null;
  }
}

async function run() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected');

  // Find clicks with no country data and a non-private IP
  const total = await Click.countDocuments({
    'location.country': { $in: [null, '', undefined] },
    ipAddress: { $exists: true, $nin: [null, ''] }
  });

  console.log(`📊 Found ${total} clicks with missing geolocation data`);

  if (total === 0) {
    console.log('✅ Nothing to backfill');
    await mongoose.disconnect();
    return;
  }

  let processed = 0;
  let updated = 0;
  let batchNum = 0;

  while (processed < total) {
    batchNum++;
    const clicks = await Click.find(
      {
        'location.country': { $in: [null, '', undefined] },
        ipAddress: { $exists: true, $nin: [null, ''] }
      },
      { _id: 1, ipAddress: 1 }
    ).limit(BATCH_SIZE);

    if (clicks.length === 0) break;

    console.log(`\n📦 Batch ${batchNum}: processing ${clicks.length} clicks...`);

    // Deduplicate IPs so we only call the API once per unique IP in this batch
    const ipMap = new Map();
    for (const click of clicks) {
      const clean = click.ipAddress.replace(/^::ffff:/, '');
      if (!isPrivateIP(clean) && !ipMap.has(clean)) {
        ipMap.set(clean, null);
      }
    }

    // Fetch geo data for each unique IP
    for (const [ip] of ipMap) {
      const location = await lookupIP(ip);
      ipMap.set(ip, location);
    }

    // Bulk update
    const ops = clicks
      .map(click => {
        const clean = click.ipAddress.replace(/^::ffff:/, '');
        const location = ipMap.get(clean);
        if (!location) return null;
        return {
          updateOne: {
            filter: { _id: click._id },
            update: { $set: { location } }
          }
        };
      })
      .filter(Boolean);

    if (ops.length > 0) {
      const result = await Click.bulkWrite(ops);
      updated += result.modifiedCount;
      console.log(`   ✅ Updated ${result.modifiedCount} clicks`);
    }

    processed += clicks.length;
    console.log(`   Progress: ${processed}/${total}`);

    // Respect rate limit before next batch
    if (processed < total) {
      console.log(`   ⏳ Waiting ${BATCH_DELAY_MS / 1000}s for rate limit...`);
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  console.log(`\n✅ Done. Updated ${updated} of ${total} clicks with geolocation data`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('❌ Backfill failed:', err);
  process.exit(1);
});
