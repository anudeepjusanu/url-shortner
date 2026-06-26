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
    }).select('bundleId').lean();

    const details = apps.map(app => ({
      appID: app.bundleId,
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
    // Return an empty but valid AASA so iOS doesn't permanently cache a failure
    res.setHeader('Content-Type', 'application/json');
    return res.json({ applinks: { apps: [], details: [] } });
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
    return res.json([]);
  }
};

module.exports = { serveAASA, serveAssetLinks };
