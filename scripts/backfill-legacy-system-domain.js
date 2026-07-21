/**
 * One-time backfill: pin the system domain on links/bio-pages/dynamic-QR
 * codes that existed before a per-record `domain` was ever recorded for the
 * system (non-custom) domain.
 *
 * Until this fix, `Url`/`BioPage`/`DynamicQRCode` documents created on the
 * base system domain stored `domain: null` (or had no `domain` field at
 * all). Their public URL was always recomputed live from whatever host the
 * current request/session happened to be on. That was invisible as long as
 * only one system domain (qa.snip.sa) ever existed — but the moment a
 * second one (qa.4r.sa) was introduced, every pre-existing base-domain
 * record started displaying under whichever domain the viewer currently
 * happened to be using, instead of the domain it was actually created
 * under.
 *
 * A `domain` of null/missing unambiguously means "created before this fix,
 * on the base system domain" — custom-domain records always have a real
 * value stored, never null. So this script sets LEGACY_SYSTEM_DOMAIN on
 * every document across all three collections currently missing one.
 *
 * IMPORTANT: run this AFTER deploying the code that adds/persists the
 * `domain` field (src/controllers/urlController.js, bioPageController.js,
 * dynamicQRCodeController.js + models) — not before. The backfilled value
 * itself is safe to apply at any point relative to that deploy.
 *
 * Usage:
 *   node -r dotenv/config scripts/backfill-legacy-system-domain.js
 *   # or, with .env already set:
 *   node scripts/backfill-legacy-system-domain.js
 *
 * Safe to re-run — it only ever touches documents still missing `domain`,
 * so already-backfilled records are left alone on subsequent runs.
 */

"use strict";

const path = require("path");
const mongoose = require("mongoose");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

// The one system domain that existed for every record created before this
// fix shipped. Change this if reusing the script in another environment.
const LEGACY_SYSTEM_DOMAIN = "qa.snip.sa";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("ERROR: MONGODB_URI environment variable is not set.");
  process.exit(1);
}

// Minimal inline schemas — avoid importing the full app with its side-effects
const Url = mongoose.model(
  "Url",
  new mongoose.Schema({}, { strict: false, collection: "urls" }),
);
const BioPage = mongoose.model(
  "BioPage",
  new mongoose.Schema({}, { strict: false, collection: "biopages" }),
);
const DynamicQRCode = mongoose.model(
  "DynamicQRCode",
  new mongoose.Schema({}, { strict: false, collection: "dynamicqrcodes" }),
);

const MISSING_DOMAIN_FILTER = {
  $or: [{ domain: { $exists: false } }, { domain: null }],
};

async function backfillCollection(Model, label) {
  const matchCount = await Model.countDocuments(MISSING_DOMAIN_FILTER);
  console.log(`${label}: found ${matchCount} record(s) with no domain set.`);

  if (matchCount === 0) {
    console.log(`${label}: nothing to backfill.`);
    return;
  }

  const result = await Model.updateMany(MISSING_DOMAIN_FILTER, {
    $set: { domain: LEGACY_SYSTEM_DOMAIN },
  });
  console.log(
    `${label}: backfilled ${result.modifiedCount} record(s) to "${LEGACY_SYSTEM_DOMAIN}".`,
  );
}

async function run() {
  await mongoose.connect(MONGODB_URI);

  await backfillCollection(Url, "urls");
  await backfillCollection(BioPage, "biopages");
  await backfillCollection(DynamicQRCode, "dynamicqrcodes");

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Backfill failed:", err.message);
  process.exit(1);
});
