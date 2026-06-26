const AppRegistration = require('../models/AppRegistration');

/**
 * GET /.well-known/apple-app-site-association
 *
 * iOS fetches this automatically when deciding whether to open a Universal Link
 * in the app or in Safari. We serve it dynamically — no static file to maintain.
 * Must be reachable WITHOUT authentication.
 */
const serveAASA = async (req, res) => {
  try {
    const apps = await AppRegistration.find({
      isActive: true,
      bundleId: { $ne: null }
    }).select('bundleId teamId').lean();

    const details = apps.map(app => ({
      appID: app.teamId ? `${app.teamId}.${app.bundleId}` : app.bundleId,
      paths: ['/dl/*']
    }));

    const aasa = {
      applinks: {
        apps: [],
        details
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.json(aasa);
  } catch (err) {
    console.error('[wellKnown] AASA error:', err.message);
    // 503 with no-store: a transient DB error must never be cached as "no apps"
    // because iOS CDN/device caches could break Universal Links for up to an hour.
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({ applinks: { apps: [], details: [] } });
  }
};

/**
 * GET /.well-known/assetlinks.json
 *
 * Android fetches this once to verify the app-domain association.
 * Requires the SHA-256 certificate fingerprint of the app's signing key.
 * Must be reachable WITHOUT authentication.
 */
const serveAssetLinks = async (req, res) => {
  try {
    const apps = await AppRegistration.find({
      isActive: true,
      packageName: { $ne: null },
      sha256Fingerprint: { $ne: null }
    }).select('packageName sha256Fingerprint').lean();

    const assetLinks = apps.map(app => ({
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: app.packageName,
        sha256_cert_fingerprints: [app.sha256Fingerprint]
      }
    }));

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.json(assetLinks);
  } catch (err) {
    console.error('[wellKnown] assetlinks error:', err.message);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json([]);
  }
};

module.exports = { serveAASA, serveAssetLinks };
