const Url = require("../../models/Url");
const { cacheDel } = require("../../config/redis");
const { moderateUrl } = require("./urlModeration");

const DECISION_TO_STATUS = {
  ALLOW: "safe",
  BLOCK: "suspicious",
};

// Runs the pipeline and persists the result. Used both fire-and-forget (on
// creation) and awaited in a concurrency-limited loop (periodic re-scan).
async function scanAndPersist(urlDoc) {
  try {
    const verdict = await moderateUrl(urlDoc.originalUrl);
    await applyModerationResult(
      urlDoc,
      DECISION_TO_STATUS[verdict.decision] || "could_not_verify",
      verdict,
    );
  } catch (error) {
    await applyModerationResult(urlDoc, "could_not_verify", {
      error: error.message,
    });
  }
}

// Fire-and-forget: kicks off the moderation pipeline after a link is created.
// Never awaited by a request handler — the pipeline can take 5-30s
// (Firecrawl scraping + Claude).
function triggerUrlScan(urlDoc) {
  scanAndPersist(urlDoc);
}

async function applyModerationResult(
  urlDoc,
  moderationStatus,
  moderationVerdict,
) {
  try {
    await Url.findByIdAndUpdate(urlDoc._id, {
      moderationStatus,
      moderationVerdict,
      moderationCheckedAt: new Date(),
    });

    // Cached URL objects are read on every redirect — drop them so the
    // updated moderationStatus is picked up on the next click. A link can be
    // cached under either identifier (shortCode or customCode), so both
    // need clearing, each lowercased to match how redirectService keys them.
    if (urlDoc.shortCode) {
      await cacheDel(`url:${urlDoc.shortCode.toLowerCase()}`);
    }
    if (urlDoc.customCode) {
      await cacheDel(`url:${urlDoc.customCode.toLowerCase()}`);
    }
  } catch (error) {
    console.error(
      "[urlScanner] Failed to persist moderation result:",
      error.message,
    );
  }
}

module.exports = { triggerUrlScan, scanAndPersist };
