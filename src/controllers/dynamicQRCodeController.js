const QRCode = require('qrcode');
const sharp = require('sharp');
const PDFDocument = require('pdfkit');
const { body, validationResult } = require('express-validator');
const DynamicQRCode = require('../models/DynamicQRCode');
const { cacheGet, cacheSet, cacheDel } = require('../config/redis');
const config = require('../config/environment');

const CACHE_TTL = 60; // seconds — short so destination changes propagate quickly
const cacheKey = (code) => `dqr:${code}`;

// ─── Helpers ────────────────────────────────────────────────────────────────

const getScanUrl = (code) => {
  const base = config.BASE_URL || process.env.BASE_URL || 'http://localhost:3015';
  return `${base}/dqr/${code}`;
};

const getFrontendUrl = () =>
  process.env.FRONTEND_URL || 'http://localhost:5173';

const isValidUrl = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const generateQRBuffer = async (scanUrl, customization = {}) => {
  const {
    size = 300,
    errorCorrection = 'M',
    foregroundColor = '#000000',
    backgroundColor = '#FFFFFF',
    includeMargin = true
  } = customization;

  return QRCode.toBuffer(scanUrl, {
    type: 'png',
    width: size,
    errorCorrectionLevel: errorCorrection,
    color: { dark: foregroundColor, light: backgroundColor },
    margin: includeMargin ? 4 : 0
  });
};

const convertBuffer = async (pngBuffer, format) => {
  if (!format || format === 'png') return pngBuffer;
  const s = sharp(pngBuffer);
  switch (format.toLowerCase()) {
    case 'jpeg':
    case 'jpg':
      return s.jpeg({ quality: 92 }).toBuffer();
    case 'gif':
      return s.gif().toBuffer();
    case 'webp':
      return s.webp({ quality: 92 }).toBuffer();
    default:
      return pngBuffer;
  }
};

const contentTypeFor = (format) => ({
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  pdf: 'application/pdf'
}[format?.toLowerCase()] || 'image/png');

const detectLang = (req) => {
  const accept = (req.headers['accept-language'] || '').toLowerCase();
  return accept.includes('ar') ? 'ar' : 'en';
};

// ─── Validation chains ───────────────────────────────────────────────────────

const createValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('destinationUrl')
    .trim()
    .notEmpty()
    .withMessage('Destination URL is required')
    .isURL({ require_protocol: true })
    .withMessage('Destination URL must be a valid http/https URL')
    .isLength({ max: 2048 }),
  body('customization.size').optional().isInt({ min: 100, max: 2000 }),
  body('customization.format')
    .optional()
    .isIn(['png', 'jpeg', 'jpg', 'gif', 'webp', 'svg', 'pdf']),
  body('customization.errorCorrection').optional().isIn(['L', 'M', 'Q', 'H']),
  body('customization.foregroundColor')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  body('customization.backgroundColor')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
];

const updateDestinationValidation = [
  body('destinationUrl')
    .trim()
    .notEmpty()
    .withMessage('Destination URL is required')
    .isURL({ require_protocol: true })
    .withMessage('Destination URL must be a valid http/https URL')
    .isLength({ max: 2048 })
];

// ─── Controllers ─────────────────────────────────────────────────────────────

// POST /api/dynamic-qr
exports.create = [
  ...createValidation,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { name, destinationUrl, customization = {} } = req.body;
      const creator = req.user.id;

      const code = await DynamicQRCode.generateUniqueCode();
      const scanUrl = getScanUrl(code);

      // Generate QR image and store as data URL
      const pngBuffer = await generateQRBuffer(scanUrl, customization);
      const qrCodeData = `data:image/png;base64,${pngBuffer.toString('base64')}`;

      const doc = await DynamicQRCode.create({
        code,
        name,
        destinationUrl,
        creator,
        organization: req.user.organization || null,
        customization,
        qrCodeData,
        destinationHistory: [{ url: destinationUrl, changedBy: creator }]
      });

      return res.status(201).json({
        success: true,
        message: 'Dynamic QR code created successfully',
        data: { ...doc.toObject(), scanUrl }
      });
    } catch (err) {
      console.error('DynamicQR create error:', err);
      return res.status(500).json({ success: false, error: 'Failed to create dynamic QR code' });
    }
  }
];

// GET /api/dynamic-qr
exports.list = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim();

    const filter = { creator: req.user.id };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { destinationUrl: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const [docs, total] = await Promise.all([
      DynamicQRCode.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DynamicQRCode.countDocuments(filter)
    ]);

    const baseUrl = config.BASE_URL || process.env.BASE_URL || 'http://localhost:3015';
    const items = docs.map((d) => ({ ...d, scanUrl: `${baseUrl}/dqr/${d.code}` }));

    return res.json({
      success: true,
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('DynamicQR list error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch dynamic QR codes' });
  }
};

// GET /api/dynamic-qr/:id
exports.get = async (req, res) => {
  try {
    const doc = await DynamicQRCode.findOne({
      _id: req.params.id,
      creator: req.user.id
    }).lean();

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Dynamic QR code not found' });
    }

    return res.json({
      success: true,
      data: { ...doc, scanUrl: getScanUrl(doc.code) }
    });
  } catch (err) {
    console.error('DynamicQR get error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch dynamic QR code' });
  }
};

// PUT /api/dynamic-qr/:id  — update name / customization (not destination)
exports.update = async (req, res) => {
  try {
    const doc = await DynamicQRCode.findOne({ _id: req.params.id, creator: req.user.id });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Dynamic QR code not found' });
    }

    const { name, isActive, customization } = req.body;

    if (name !== undefined) doc.name = String(name).trim().slice(0, 100);
    if (typeof isActive === 'boolean') doc.isActive = isActive;

    let regenerate = false;
    if (customization && typeof customization === 'object') {
      const allowed = ['size', 'format', 'errorCorrection', 'foregroundColor', 'backgroundColor', 'includeMargin', 'logo'];
      allowed.forEach((k) => {
        if (customization[k] !== undefined) {
          doc.customization[k] = customization[k];
          regenerate = true;
        }
      });
    }

    if (regenerate) {
      const pngBuffer = await generateQRBuffer(getScanUrl(doc.code), doc.customization);
      doc.qrCodeData = `data:image/png;base64,${pngBuffer.toString('base64')}`;
    }

    await doc.save();

    return res.json({
      success: true,
      message: 'Dynamic QR code updated',
      data: { ...doc.toObject(), scanUrl: getScanUrl(doc.code) }
    });
  } catch (err) {
    console.error('DynamicQR update error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update dynamic QR code' });
  }
};

// PUT /api/dynamic-qr/:id/destination
exports.updateDestination = [
  ...updateDestinationValidation,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const doc = await DynamicQRCode.findOne({ _id: req.params.id, creator: req.user.id });
      if (!doc) {
        return res.status(404).json({ success: false, error: 'Dynamic QR code not found' });
      }

      const { destinationUrl } = req.body;

      doc.destinationHistory.push({ url: destinationUrl, changedBy: req.user.id });
      // Limit history to last 50 entries
      if (doc.destinationHistory.length > 50) {
        doc.destinationHistory = doc.destinationHistory.slice(-50);
      }
      doc.destinationUrl = destinationUrl;

      await doc.save();

      // Invalidate Redis cache so next scan picks up the new destination instantly
      await cacheDel(cacheKey(doc.code));

      return res.json({
        success: true,
        message: 'Destination updated — existing QR codes now redirect to the new URL',
        data: { ...doc.toObject(), scanUrl: getScanUrl(doc.code) }
      });
    } catch (err) {
      console.error('DynamicQR updateDestination error:', err);
      return res.status(500).json({ success: false, error: 'Failed to update destination' });
    }
  }
];

// DELETE /api/dynamic-qr/:id
exports.remove = async (req, res) => {
  try {
    const doc = await DynamicQRCode.findOneAndDelete({
      _id: req.params.id,
      creator: req.user.id
    });

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Dynamic QR code not found' });
    }

    await cacheDel(cacheKey(doc.code));

    return res.json({ success: true, message: 'Dynamic QR code deleted' });
  } catch (err) {
    console.error('DynamicQR remove error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete dynamic QR code' });
  }
};

// GET /api/dynamic-qr/:id/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const doc = await DynamicQRCode.findOne({
      _id: req.params.id,
      creator: req.user.id
    })
      .select('code name destinationUrl scanCount uniqueScanCount lastScannedAt destinationHistory createdAt isActive')
      .lean();

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Dynamic QR code not found' });
    }

    return res.json({
      success: true,
      data: {
        ...doc,
        scanUrl: getScanUrl(doc.code),
        destinationChanges: doc.destinationHistory.length
      }
    });
  } catch (err) {
    console.error('DynamicQR analytics error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
};

// GET /api/dynamic-qr/:id/download?format=png
exports.download = async (req, res) => {
  try {
    const doc = await DynamicQRCode.findOne({ _id: req.params.id, creator: req.user.id });
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Dynamic QR code not found' });
    }

    const format = (req.query.format || doc.customization.format || 'png').toLowerCase();
    const scanUrl = getScanUrl(doc.code);
    const pngBuffer = await generateQRBuffer(scanUrl, doc.customization);

    const safeName = doc.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `dynamic-qr-${safeName}-${doc.code}.${format}`;

    if (format === 'svg') {
      const svg = await QRCode.toString(scanUrl, {
        type: 'svg',
        errorCorrectionLevel: doc.customization.errorCorrection || 'M',
        color: {
          dark: doc.customization.foregroundColor || '#000000',
          light: doc.customization.backgroundColor || '#FFFFFF'
        },
        margin: doc.customization.includeMargin ? 4 : 0
      });
      res.set({
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': `attachment; filename="${filename}"`
      });
      return res.send(svg);
    }

    if (format === 'pdf') {
      const pdf = new PDFDocument({ size: [doc.customization.size || 300, doc.customization.size || 300], margin: 0 });
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      });
      pdf.pipe(res);
      pdf.image(pngBuffer, 0, 0, { width: doc.customization.size || 300 });
      pdf.end();
      return;
    }

    const outputBuffer = await convertBuffer(pngBuffer, format);
    res.set({
      'Content-Type': contentTypeFor(format),
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': outputBuffer.length
    });
    return res.send(outputBuffer);
  } catch (err) {
    console.error('DynamicQR download error:', err);
    return res.status(500).json({ success: false, error: 'Failed to generate download' });
  }
};

// GET /dqr/:code  — public scan redirect (no auth required)
exports.handleScan = async (req, res) => {
  const { code } = req.params;
  const lang = detectLang(req);
  const errorUrl = `${getFrontendUrl()}/qr-error?lang=${lang}&code=${encodeURIComponent(code)}`;

  try {
    // Try Redis cache first for sub-second response
    let cached = await cacheGet(cacheKey(code));
    let destinationUrl;
    let docId;

    if (cached && cached.destinationUrl) {
      destinationUrl = cached.destinationUrl;
      docId = cached.id;
    } else {
      const doc = await DynamicQRCode.findOne({ code }).select('destinationUrl isActive _id').lean();

      if (!doc || !doc.isActive) {
        return res.redirect(302, errorUrl);
      }

      destinationUrl = doc.destinationUrl;
      docId = doc._id.toString();

      // Cache for next scan
      await cacheSet(cacheKey(code), { destinationUrl, id: docId, isActive: true }, CACHE_TTL);
    }

    // Redirect immediately — track scan asynchronously so it doesn't add latency
    res.redirect(302, destinationUrl);

    // Fire-and-forget analytics
    setImmediate(async () => {
      try {
        const doc = await DynamicQRCode.findById(docId);
        if (doc) {
          const isUnique = !doc.lastScannedAt;
          await doc.incrementScan(isUnique);
        }
      } catch (analyticsErr) {
        console.error('DynamicQR scan tracking error:', analyticsErr);
      }
    });
  } catch (err) {
    console.error('DynamicQR handleScan error:', err);
    return res.redirect(302, errorUrl);
  }
};
