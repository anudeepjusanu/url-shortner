const AppRegistration = require('../models/AppRegistration');
const deferredLinkService = require('../services/deferredLinkService');
const deepLinkService = require('../services/deepLinkService');

/**
 * POST /api/v1/deferred-link
 *
 * Called by the mobile app on its VERY FIRST LAUNCH after a fresh install.
 * The app sends a device fingerprint; we match it against stored payloads
 * from the click that preceded the install.
 *
 * Authentication: Bearer {apiKey} from the AppRegistration document.
 * The app should store a flag (e.g. UserDefaults / SharedPreferences) after
 * calling this endpoint so it never calls it again.
 *
 * Response (matched):
 *   { matched: true, screen: 'product', params: { id: '123' }, confidence: 0.94 }
 *
 * Response (no match / low confidence):
 *   { matched: false }
 *   → app opens home screen normally
 */
const handleDeferredLink = async (req, res) => {
  try {
    // ── 1. Authenticate via API key ──────────────────────────────────────────
    const authHeader = req.get('Authorization') || '';
    const apiKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    if (!apiKey) {
      return res.status(401).json({ success: false, message: 'Missing Authorization header' });
    }

    const app = await AppRegistration.findOne({ apiKey, isActive: true }).lean();
    if (!app) {
      return res.status(401).json({ success: false, message: 'Invalid API key' });
    }

    // ── 2. Extract fingerprint from request body ──────────────────────────────
    const {
      platform,       // 'ios' | 'android'
      app_version,
      os_version,
      screen_width,
      screen_height,
      install_time    // unix timestamp (seconds) of first launch
    } = req.body;

    if (!platform || !['ios', 'android'].includes(platform)) {
      return res.status(400).json({ success: false, message: "platform must be 'ios' or 'android'" });
    }

    // Derive the client IP — same logic used at click time
    const clientIP = deepLinkService.getClientIP(req);

    // ── 3. Match against stored payloads ─────────────────────────────────────
    const result = await deferredLinkService.matchPayload({
      ip: clientIP,
      platform,
      osVersion: os_version || null,
      screenWidth: screen_width ? parseInt(screen_width) : null,
      screenHeight: screen_height ? parseInt(screen_height) : null,
      installTime: install_time || null
    });

    if (!result.matched) {
      return res.json({ matched: false });
    }

    return res.json({
      matched: true,
      screen: result.screen,
      params: result.params || {},
      confidence: result.confidence
    });
  } catch (err) {
    console.error('[deferredLink] error:', err.message);
    // Always return matched: false on error — never risk showing a wrong screen
    return res.json({ matched: false });
  }
};

module.exports = { handleDeferredLink };
