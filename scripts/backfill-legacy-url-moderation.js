/**
 * One-time backfill: mark pre-existing links as 'not_scanned' instead of
 * leaving them stuck on 'pending' ("Scanning") forever.
 *
 * The URL Scanner only ever gets triggered from the create-link controller
 * (src/controllers/urlController.js). Any link that existed before the
 * scanner shipped — or was inserted directly into MongoDB (imports/seeds)
 * rather than through the API — has NO moderationStatus field stored in
 * MongoDB at all (not even the string 'pending'). The app only *displays*
 * these as "Scanning" because Mongoose applies the schema's `default:
 * 'pending'` when it hydrates a document that's missing the field — that
 * default never gets written back to the database. A raw query for
 * `{ moderationStatus: 'pending' }` (as this script's first version did)
 * matches zero of these documents, because MongoDB equality queries only
 * treat a missing field as a match for `null`, not for any other value.
 *
 * Left alone, scheduledTasks.reScanActiveLinks() would eventually treat any
 * such link older than an hour as "stuck" and force it through the real
 * (paid) pipeline — which is exactly what we don't want for a whole backlog
 * of legacy links. Run this script first so they're reclassified before that
 * cron (or a manual re-scan) ever sees them.
 *
 * This script finds exactly that signature — status missing or 'pending',
 * never checked, created more than an hour ago — and marks it 'not_scanned'.
 * It does NOT
 * run those links through the real scan pipeline (no Firecrawl/Claude/
 * SafeBrowz cost). 'not_scanned' is intentionally excluded from
 * scheduledTasks.reScanActiveLinks()'s query, so these links are never
 * retroactively scanned — only links created from now on go through the
 * scanner, per the "only new links should be scanned" decision.
 *
 * Usage:
 *   node -r dotenv/config scripts/backfill-legacy-url-moderation.js
 *   # or, with .env already set:
 *   node scripts/backfill-legacy-url-moderation.js
 *
 * Safe to re-run — it only ever touches documents still matching the
 * pending+never-checked+stale signature, so already-backfilled links are
 * left alone on subsequent runs.
 */

"use strict";

const path = require("path");
const mongoose = require("mongoose");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("ERROR: MONGODB_URI environment variable is not set.");
  process.exit(1);
}

// Minimal inline schema — avoids importing the full app with all its side-effects
const urlSchema = new mongoose.Schema(
  {},
  { strict: false, collection: "urls" },
);
const Url = mongoose.model("Url", urlSchema);

const STALE_PENDING_CUTOFF_MS = 60 * 60 * 1000; // 1 hour — matches scheduledTasks.js

async function run() {
  await mongoose.connect(MONGODB_URI);

  const cutoff = new Date(Date.now() - STALE_PENDING_CUTOFF_MS);

  const filter = {
    createdAt: { $lte: cutoff },
    $and: [
      {
        $or: [
          { moderationStatus: { $exists: false } },
          { moderationStatus: "pending" },
        ],
      },
      {
        // Mongo equality against null already matches a missing field too,
        // but spelled out explicitly here to match the status check above.
        $or: [
          { moderationCheckedAt: { $exists: false } },
          { moderationCheckedAt: null },
        ],
      },
    ],
  };

  const matchCount = await Url.countDocuments(filter);
  console.log(
    `Found ${matchCount} legacy link(s) stuck on 'pending' with no scan history.`,
  );

  if (matchCount === 0) {
    console.log("Nothing to backfill.");
    await mongoose.disconnect();
    return;
  }

  const result = await Url.updateMany(filter, {
    $set: {
      moderationStatus: "not_scanned",
      moderationVerdict: {
        decision: "NOT_SCANNED",
        reason:
          "Created before the URL Scanner was enabled; not retroactively scanned.",
      },
      moderationCheckedAt: new Date(),
    },
  });

  console.log(`Backfilled ${result.modifiedCount} link(s) to 'not_scanned'.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Backfill failed:", err.message);
  process.exit(1);
});
