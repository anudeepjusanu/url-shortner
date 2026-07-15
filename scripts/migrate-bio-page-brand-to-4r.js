/**
 * One-time migration: force the "Build your page at ..." footer brand on
 * every pre-existing bio page created under a snip.sa domain over to 4r —
 * without touching the page's real public URL.
 *
 * Background: BioPage documents have two separate domain-ish fields:
 *   - `domain`      — pinned at creation, drives the real public URL
 *                      (https://<domain>/bio/<username>). Never changes on
 *                      edit; intentionally immutable so shared links don't
 *                      break.
 *   - `brandDomain` — display-only, drives the footer/watermark brand
 *                      ("Build your page at SNIP/4R"). Re-resolves to the
 *                      current system domain every time the page is edited
 *                      (see bioPageController.js/bioPageService.js).
 *
 * Bio pages that were created on a snip.sa domain and have never been
 * re-edited since still show a snip `brandDomain` (or none at all, for
 * pages that predate the `brandDomain` field). This script bulk-sets
 * `brandDomain` to the 4r equivalent for all of them, so the footer shows
 * 4r immediately — with no per-page edit required. `domain` (the real URL)
 * is never touched.
 *
 * Matches on:
 *   - `domain` containing "snip" (qa.snip.sa, snip.sa, www.snip.sa, ...)
 *   - `domain` missing/null (legacy pages that predate the `domain` field
 *     entirely — see backfill-legacy-system-domain.js; these are
 *     unambiguously snip-era too)
 *
 * This OVERWRITES `brandDomain` unconditionally for every matching
 * document, even if a `brandDomain` is already set (e.g. from a prior
 * partial run, or a real edit made while still on a snip host) — by
 * design, per explicit request: every snip-created page should show 4r,
 * with no exceptions.
 *
 * Usage:
 *   node scripts/migrate-bio-page-brand-to-4r.js            # dry run — reports what would change
 *   node scripts/migrate-bio-page-brand-to-4r.js --apply     # actually writes the changes
 */

"use strict";

const path = require("path");
const mongoose = require("mongoose");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Fallback brandDomain for documents with no `domain` at all (pre-dates the
// `domain` field entirely). Change this if reusing the script in another
// environment (e.g. "4r.sa" for production).
const LEGACY_FALLBACK_BRAND_DOMAIN = "qa.4r.sa";

const APPLY = process.argv.includes("--apply");

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("ERROR: MONGODB_URI environment variable is not set.");
  process.exit(1);
}

// Minimal inline schema — avoid importing the full app with its side-effects
const BioPage = mongoose.model(
  "BioPage",
  new mongoose.Schema({}, { strict: false, collection: "biopages" }),
);

const SNIP_OR_MISSING_DOMAIN_FILTER = {
  $or: [
    { domain: { $regex: /snip/i } },
    { domain: { $exists: false } },
    { domain: null },
  ],
};

const toBrandDomain = (domain) =>
  domain ? domain.replace(/snip/i, "4r") : LEGACY_FALLBACK_BRAND_DOMAIN;

async function run() {
  await mongoose.connect(MONGODB_URI);

  const docs = await BioPage.find(SNIP_OR_MISSING_DOMAIN_FILTER)
    .select({ _id: 1, username: 1, domain: 1, brandDomain: 1 })
    .lean();

  console.log(
    `Found ${docs.length} bio page(s) created on a snip domain (or predating the domain field).`,
  );

  if (docs.length === 0) {
    console.log("Nothing to migrate.");
    await mongoose.disconnect();
    return;
  }

  let changed = 0;
  for (const doc of docs) {
    const newBrandDomain = toBrandDomain(doc.domain);
    const noop = doc.brandDomain === newBrandDomain;
    console.log(
      `${noop ? "[no-op]" : "[change]"} @${doc.username || doc._id}: domain=${doc.domain ?? "(none)"} brandDomain "${doc.brandDomain ?? "(none)"}" -> "${newBrandDomain}"`,
    );
    if (!noop) changed++;

    if (APPLY && !noop) {
      await BioPage.updateOne(
        { _id: doc._id },
        { $set: { brandDomain: newBrandDomain } },
      );
    }
  }

  console.log(
    APPLY
      ? `Applied: updated ${changed} of ${docs.length} record(s).`
      : `Dry run: ${changed} of ${docs.length} record(s) would change. Re-run with --apply to write.`,
  );

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
