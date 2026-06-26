/**
 * deferredLinkService
 *
 * Stores a device fingerprint + deep link payload when a mobile user clicks a
 * deep link but does not have the app installed. On first app launch, the app
 * calls POST /api/v1/deferred-link with its own fingerprint; we score all stored
 * payloads for that IP and return the best match if confidence >= 0.80.
 *
 * Storage: Redis only (no MongoDB). TTL = 72 hours.
 * Key pattern: dl:deferred:{ip}:{ms_timestamp}
 */

const { redis, cacheSet } = require('../config/redis');

const DEFERRED_TTL_SECONDS = 72 * 60 * 60;  // 72 hours
const KEY_PREFIX = 'dl:deferred:';
const CONFIDENCE_THRESHOLD = 0.80;
const LOOKUP_WINDOW_HOURS = 72;

/**
 * Store a deferred payload when a mobile request reaches our server
 * (meaning the app is not installed on that device).
 */
const storePayload = async (clientIP, userAgent, req, urlDoc) => {
  try {
    const ua = userAgent || '';
    const ts = Date.now();
    const key = `${KEY_PREFIX}${clientIP}:${ts}`;

    const entry = {
      // Fingerprint fields used for matching on app first launch
      ip: clientIP,
      platform: /iphone|ipad|ipod/i.test(ua) ? 'ios' : 'android',
      osVersion: extractOSVersion(ua),
      screenWidth: parseInt(req.query.sw) || null,
      screenHeight: parseInt(req.query.sh) || null,
      userAgent: ua.substring(0, 300),
      storedAt: ts,

      // What to open once the app launches
      shortCode: urlDoc.shortCode,
      screen: urlDoc.deepLink?.screen || null,
      params: urlDoc.deepLink?.params || null
    };

    await cacheSet(key, entry, DEFERRED_TTL_SECONDS);
    console.log(`[deferred] stored payload key=${key} screen=${entry.screen}`);
    return key;
  } catch (err) {
    // Non-fatal — deferred linking degrades gracefully to home screen
    console.error('[deferred] storePayload error:', err.message);
    return null;
  }
};

/**
 * Find the best-matching deferred payload for an incoming first-launch fingerprint.
 * Returns { matched: true, screen, params, confidence } or { matched: false }.
 */
const matchPayload = async (incoming) => {
  try {
    const { ip, platform, osVersion, screenWidth, screenHeight, installTime } = incoming;

    if (!ip) return { matched: false };

    // Scan Redis for all stored payloads from this IP
    const pattern = `${KEY_PREFIX}${ip}:*`;
    const keys = await scanKeys(pattern);

    if (keys.length === 0) return { matched: false };

    const cutoff = Date.now() - LOOKUP_WINDOW_HOURS * 60 * 60 * 1000;
    let best = null;
    let bestScore = 0;

    for (const key of keys) {
      const raw = await redis.get(key);
      if (!raw) continue;

      let entry;
      try { entry = JSON.parse(raw); } catch { continue; }

      // Skip entries older than 72h (Redis TTL handles cleanup, but be safe)
      if (entry.storedAt < cutoff) continue;

      const score = scoreMatch(entry, { platform, osVersion, screenWidth, screenHeight, installTime });

      if (score > bestScore) {
        bestScore = score;
        best = entry;
      }
    }

    if (!best || bestScore < CONFIDENCE_THRESHOLD) {
      console.log(`[deferred] no match for ip=${ip} best=${bestScore.toFixed(2)}`);
      return { matched: false };
    }

    console.log(`[deferred] matched ip=${ip} confidence=${bestScore.toFixed(2)} screen=${best.screen}`);

    // Clean up the matched key so it can't be claimed twice
    await redis.del(`${KEY_PREFIX}${ip}:${best.storedAt}`);

    return {
      matched: true,
      screen: best.screen,
      params: best.params,
      confidence: parseFloat(bestScore.toFixed(4))
    };
  } catch (err) {
    console.error('[deferred] matchPayload error:', err.message);
    return { matched: false };
  }
};

// ─── private helpers ──────────────────────────────────────────────────────────

/**
 * Score how well a stored fingerprint matches an incoming first-launch fingerprint.
 * IP match is assumed (we already filtered by IP prefix in the key scan).
 * Returns a number in [0, 1].
 */
const scoreMatch = (stored, incoming) => {
  let score = 0;
  let maxScore = 0;

  // Platform (ios/android) — must match; if not, discard
  maxScore += 3;
  if (stored.platform === incoming.platform) {
    score += 3;
  } else {
    return 0; // wrong platform, skip entirely
  }

  // OS version
  maxScore += 2;
  if (stored.osVersion && incoming.osVersion) {
    if (stored.osVersion === incoming.osVersion) {
      score += 2;
    } else if (stored.osVersion.split('.')[0] === incoming.osVersion.split('.')[0]) {
      score += 1;
    }
  }

  // Screen width
  maxScore += 1.5;
  if (stored.screenWidth && incoming.screenWidth) {
    const diff = Math.abs(stored.screenWidth - incoming.screenWidth);
    if (diff === 0) score += 1.5;
    else if (diff <= 10) score += 1;
  }

  // Screen height
  maxScore += 1.5;
  if (stored.screenHeight && incoming.screenHeight) {
    const diff = Math.abs(stored.screenHeight - incoming.screenHeight);
    if (diff === 0) score += 1.5;
    else if (diff <= 10) score += 1;
  }

  // Time proximity (click → first launch should be within hours, not days)
  maxScore += 2;
  const hoursSinceClick = (Date.now() - stored.storedAt) / (1000 * 60 * 60);
  if (hoursSinceClick < 1) score += 2;
  else if (hoursSinceClick < 6) score += 1.5;
  else if (hoursSinceClick < 24) score += 1;
  else score += 0.5;

  return score / maxScore;
};

/** Extract OS version string from a User-Agent. Returns null if not detectable. */
const extractOSVersion = (ua) => {
  const ios = ua.match(/OS (\d+[_\d]*) like Mac/i);
  if (ios) return ios[1].replace(/_/g, '.');

  const android = ua.match(/Android (\d+[.\d]*)/i);
  if (android) return android[1];

  return null;
};

/** Scan Redis for all keys matching a pattern. Returns an array of key strings. */
const scanKeys = async (pattern) => {
  const keys = [];
  let cursor = '0';

  do {
    const [nextCursor, batch] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = nextCursor;
    keys.push(...batch);
  } while (cursor !== '0');

  return keys;
};

module.exports = { storePayload, matchPayload, scoreMatch, extractOSVersion };
