const AppRegistration = require('../models/AppRegistration');

// POST /api/v1/app-registrations
const create = async (req, res) => {
  try {
    const {
      name,
      bundleId,
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
      iosStoreUrl: iosStoreUrl || null,
      packageName: packageName || null,
      sha256Fingerprint: sha256Fingerprint || null,
      androidStoreUrl: androidStoreUrl || null,
      webFallbackUrl,
      screenMappings: screenMappings || [],
      creator: req.user.id,
      organization: req.user.organization || null
    });

    return res.status(201).json({
      success: true,
      data: {
        ...registration.toJSON(),
        // Surface the API key once clearly; client should copy it now
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
    const filter = { creator: req.user.id };
    if (req.user.organization) filter.organization = req.user.organization;

    const apps = await AppRegistration.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // Mask the full API key in list view — show only last 6 chars
    const masked = apps.map(a => ({
      ...a,
      apiKey: `••••••••${a.apiKey.slice(-6)}`
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
    const app = await AppRegistration.findOne({
      _id: req.params.id,
      creator: req.user.id
    }).lean();

    if (!app) {
      return res.status(404).json({ success: false, message: 'App registration not found' });
    }

    return res.json({
      success: true,
      data: { ...app, apiKey: `••••••••${app.apiKey.slice(-6)}` }
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
      'name', 'bundleId', 'iosStoreUrl', 'packageName',
      'sha256Fingerprint', 'androidStoreUrl', 'webFallbackUrl',
      'screenMappings', 'isActive'
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const app = await AppRegistration.findOneAndUpdate(
      { _id: req.params.id, creator: req.user.id },
      updates,
      { new: true, runValidators: true }
    ).lean();

    if (!app) {
      return res.status(404).json({ success: false, message: 'App registration not found' });
    }

    return res.json({
      success: true,
      data: { ...app, apiKey: `••••••••${app.apiKey.slice(-6)}` }
    });
  } catch (err) {
    console.error('[appReg] update error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to update app registration' });
  }
};

// DELETE /api/v1/app-registrations/:id
const remove = async (req, res) => {
  try {
    const app = await AppRegistration.findOneAndDelete({
      _id: req.params.id,
      creator: req.user.id
    });

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
      { _id: req.params.id, creator: req.user.id },
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

// GET /api/v1/deep-link/resolve/:shortCode
// Called by the mobile app after receiving a Universal Link URL.
// Returns the screen and params for the given short code.
const resolveDeepLink = async (req, res) => {
  try {
    const Url = require('../models/Url');
    const shortCode = decodeURIComponent(req.params.shortCode);

    const url = await Url.findOne({
      $or: [
        { shortCode: { $regex: new RegExp(`^${shortCode}$`, 'i') } },
        { customCode: { $regex: new RegExp(`^${shortCode}$`, 'i') } }
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
