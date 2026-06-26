const AppRegistration = require('../models/AppRegistration');

// Escape regex metacharacters from user-supplied strings before using in RegExp.
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Build a MongoDB filter that restricts to the caller's creator OR organization.
// list() already uses both fields; all other handlers use this helper so the
// ownership check is consistent across the whole controller.
const ownerFilter = (req, id) => {
  const filter = {};
  if (id) filter._id = id;
  if (req.user.organization) {
    filter.$or = [{ creator: req.user.id }, { organization: req.user.organization }];
  } else {
    filter.creator = req.user.id;
  }
  return filter;
};

// POST /api/v1/app-registrations
const create = async (req, res) => {
  try {
    const {
      name,
      bundleId,
      teamId,
      iosStoreUrl,
      packageName,
      sha256Fingerprint,
      androidStoreUrl,
      webFallbackUrl,
      screenMappings
    } = req.body;

    if (!name || !webFallbackUrl) {
      return res.status(400).json({ success: false, message: 'name and webFallbackUrl are required' });
    }

    if (!bundleId && !packageName) {
      return res.status(400).json({
        success: false,
        message: 'At least one of bundleId (iOS) or packageName (Android) is required'
      });
    }

    const registration = await AppRegistration.create({
      name,
      bundleId: bundleId || null,
      teamId: teamId || null,
      iosStoreUrl: iosStoreUrl || null,
      packageName: packageName || null,
      sha256Fingerprint: sha256Fingerprint || null,
      androidStoreUrl: androidStoreUrl || null,
      webFallbackUrl,
      screenMappings: screenMappings || [],
      creator: req.user.id,
      organization: req.user.organization || null
    });

    // apiKey is select:false in the schema; access it directly on the new document
    // and surface it once here — the client must copy it now, it won't be shown again.
    return res.status(201).json({
      success: true,
      data: {
        ...registration.toObject(),
        apiKey: registration.apiKey
      }
    });
  } catch (err) {
    console.error('[appReg] create error:', err.message);
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'An app with this bundle ID or package name already exists' });
    }
    return res.status(500).json({ success: false, message: 'Failed to register app' });
  }
};

// GET /api/v1/app-registrations
const list = async (req, res) => {
  try {
    const filter = ownerFilter(req);

    const apps = await AppRegistration.find(filter)
      .select('+apiKey')
      .sort({ createdAt: -1 })
      .lean();

    // Mask the full API key in list view — show only last 6 chars
    const masked = apps.map(a => ({
      ...a,
      apiKey: a.apiKey ? `••••••••${a.apiKey.slice(-6)}` : '••••••••'
    }));

    return res.json({ success: true, data: masked });
  } catch (err) {
    console.error('[appReg] list error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch app registrations' });
  }
};

// GET /api/v1/app-registrations/:id
const getOne = async (req, res) => {
  try {
    const app = await AppRegistration.findOne(ownerFilter(req, req.params.id))
      .select('+apiKey')
      .lean();

    if (!app) {
      return res.status(404).json({ success: false, message: 'App registration not found' });
    }

    return res.json({
      success: true,
      data: { ...app, apiKey: app.apiKey ? `••••••••${app.apiKey.slice(-6)}` : '••••••••' }
    });
  } catch (err) {
    console.error('[appReg] getOne error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch app registration' });
  }
};

// PUT /api/v1/app-registrations/:id
const update = async (req, res) => {
  try {
    const allowed = [
      'name', 'bundleId', 'teamId', 'iosStoreUrl', 'packageName',
      'sha256Fingerprint', 'androidStoreUrl', 'webFallbackUrl',
      'screenMappings', 'isActive'
    ];

    // Load a full Mongoose document (not lean) so that .save() triggers the
    // pre('validate') hook in the schema, which enforces the bundleId||packageName
    // invariant atomically — no separate read-before-check that can race.
    const app = await AppRegistration.findOne(ownerFilter(req, req.params.id))
      .select('+apiKey');
    if (!app) {
      return res.status(404).json({ success: false, message: 'App registration not found' });
    }

    for (const key of allowed) {
      if (req.body[key] !== undefined) app[key] = req.body[key];
    }

    await app.save();

    const obj = app.toObject();
    return res.json({
      success: true,
      data: { ...obj, apiKey: obj.apiKey ? `••••••••${obj.apiKey.slice(-6)}` : '••••••••' }
    });
  } catch (err) {
    console.error('[appReg] update error:', err.message);
    if (err.name === 'ValidationError') {
      const msg = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: msg });
    }
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'An app with this bundle ID or package name already exists' });
    }
    return res.status(500).json({ success: false, message: 'Failed to update app registration' });
  }
};

// DELETE /api/v1/app-registrations/:id
const remove = async (req, res) => {
  try {
    const app = await AppRegistration.findOneAndDelete(ownerFilter(req, req.params.id));

    if (!app) {
      return res.status(404).json({ success: false, message: 'App registration not found' });
    }

    return res.json({ success: true, message: 'App registration deleted' });
  } catch (err) {
    console.error('[appReg] delete error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to delete app registration' });
  }
};

// POST /api/v1/app-registrations/:id/rotate-key
// Regenerates the API key — only safe to do if the mobile app has not shipped yet.
const rotateKey = async (req, res) => {
  try {
    const crypto = require('crypto');
    const newKey = crypto.randomBytes(24).toString('hex');

    const app = await AppRegistration.findOneAndUpdate(
      ownerFilter(req, req.params.id),
      { apiKey: newKey },
      { new: true }
    );

    if (!app) {
      return res.status(404).json({ success: false, message: 'App registration not found' });
    }

    return res.json({
      success: true,
      message: 'API key rotated. Update your mobile app before deploying.',
      apiKey: newKey
    });
  } catch (err) {
    console.error('[appReg] rotateKey error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to rotate API key' });
  }
};

// GET /api/v1/resolve/:shortCode
// Called by the mobile app after receiving a Universal Link URL.
// Requires Bearer {apiKey} — the same key the mobile SDK uses for deferred linking.
const resolveDeepLink = async (req, res) => {
  try {
    // Authenticate via API key (same auth as the deferred-link endpoint)
    const authHeader = req.get('Authorization') || '';
    const apiKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    if (!apiKey) {
      return res.status(401).json({ success: false, message: 'Missing Authorization header' });
    }
    const callerApp = await AppRegistration.findOne({ apiKey, isActive: true }).select('+apiKey').lean();
    if (!callerApp) {
      return res.status(401).json({ success: false, message: 'Invalid API key' });
    }

    const Url = require('../models/Url');

    let shortCode;
    try {
      shortCode = decodeURIComponent(req.params.shortCode);
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid shortCode' });
    }

    const safeCode = escapeRegex(shortCode);

    const url = await Url.findOne({
      $or: [
        { shortCode: { $regex: new RegExp(`^${safeCode}$`, 'i') } },
        { customCode: { $regex: new RegExp(`^${safeCode}$`, 'i') } }
      ],
      'deepLink.enabled': true,
      isActive: true
    }).select('deepLink shortCode').lean();

    if (!url) {
      return res.status(404).json({ success: false, message: 'Deep link not found' });
    }

    return res.json({
      success: true,
      data: {
        shortCode: url.shortCode,
        screen: url.deepLink.screen,
        params: url.deepLink.params || {}
      }
    });
  } catch (err) {
    console.error('[appReg] resolveDeepLink error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to resolve deep link' });
  }
};

module.exports = { create, list, getOne, update, remove, rotateKey, resolveDeepLink };
