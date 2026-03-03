const CountryCode = require('../models/CountryCode');

/**
 * Get all active country codes sorted by priority then name.
 * Cached in-memory for 1 hour since country codes rarely change.
 */
let cachedCodes = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

exports.getCountryCodes = async (req, res) => {
  try {
    const now = Date.now();

    // Serve from cache if still valid
    if (cachedCodes && (now - cacheTimestamp) < CACHE_TTL) {
      return res.json({ success: true, data: cachedCodes });
    }

    const codes = await CountryCode.find({ isActive: true })
      .select('name code dialCode flag priority')
      .sort({ priority: -1, name: 1 })
      .lean();

    cachedCodes = codes;
    cacheTimestamp = now;

    // Allow browser caching for 1 hour
    res.set('Cache-Control', 'public, max-age=3600');
    res.json({ success: true, data: codes });
  } catch (error) {
    console.error('Error fetching country codes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch country codes' });
  }
};

/**
 * Admin-only: Add/update a country code
 */
exports.upsertCountryCode = async (req, res) => {
  try {
    const { name, code, dialCode, flag, isActive, priority } = req.body;

    if (!name || !code || !dialCode) {
      return res.status(400).json({ success: false, message: 'name, code, and dialCode are required' });
    }

    const countryCode = await CountryCode.findOneAndUpdate(
      { code: code.toUpperCase() },
      { name, code: code.toUpperCase(), dialCode, flag, isActive, priority: priority || 0 },
      { upsert: true, new: true, runValidators: true }
    );

    // Invalidate cache
    cachedCodes = null;
    cacheTimestamp = 0;

    res.json({ success: true, data: countryCode });
  } catch (error) {
    console.error('Error upserting country code:', error);
    res.status(500).json({ success: false, message: 'Failed to update country code' });
  }
};
