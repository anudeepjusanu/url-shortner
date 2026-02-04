const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();

app.use((req, res, next) => {
  try {
    req.url = decodeURIComponent(req.url);
  } catch (err) {}
  next();
});

// Trust proxy
const parseTrustProxy = (rawValue) => {
  if (rawValue === undefined || rawValue === null || rawValue === '') return undefined;

  const value = String(rawValue).trim().toLowerCase();
  if (value === 'false' || value === '0' || value === 'off' || value === 'no') return false;

  // `true` is considered unsafe by express-rate-limit (bypassable). Map it to a safer default.
  if (value === 'true' || value === 'on' || value === 'yes') return 1;

  const asNumber = Number(value);
  if (Number.isFinite(asNumber)) return asNumber;

  // Allow express trust proxy presets like 'loopback', 'linklocal', etc.
  return rawValue;
};

const trustProxy = parseTrustProxy(process.env.TRUST_PROXY);
app.set('trust proxy', trustProxy ?? (process.env.NODE_ENV === 'production' ? 1 : false));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT) || 500,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });
  next();
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Simple test endpoint without middleware
app.post('/test-register', async (req, res) => {
  console.log('Test register hit:', req.body);
  res.json({ success: true, message: 'Test endpoint working' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/urls', require('./routes/urls'));
app.use('/api/domains', require('./routes/domains'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/qr-codes', require('./routes/qrCodes'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/super-admin', require('./routes/superAdmin'));
app.use('/api/users', require('./routes/userManagement'));
app.use('/api/google-analytics', require('./routes/googleAnalytics'));

// Serve React static files
app.use(express.static(path.join(__dirname, '../Url_Shortener-main/build')));

// Redirect route - must be after API routes but before 404 handler
const redirectController = require('./controllers/redirectController');
const { redirectLimiter } = require('./middleware/rateLimiter');

// QR Code generation endpoint (e.g., /qr/mbtw7f) - for generating QR code images
app.get('/qr/:shortCode', redirectController.generateQRCode);

// QR Code scan redirect endpoint (e.g., /q/mbtw7f) - for QR code scans
// This route is specifically for QR codes and will track as QR scan
app.get('/q/:shortCode', redirectController.redirectFromQRCode);
// app.get('/q/:shortCode/*', redirectController.redirectFromQRCode); // Handle extra paths

// Handle shortened URL redirects (e.g., /mbtw7f)
app.get('/:shortCode', redirectLimiter, redirectController.redirectToOriginalUrl);
// app.get('/:shortCode/*', /* redirectLimiter, */ redirectController.redirectToOriginalUrl); // Handle extra paths

// Optional: Preview endpoint (e.g., /preview/mbtw7f)
app.get('/preview/:shortCode', redirectController.getPreview);

// 404 handler - serves React app for non-API routes, JSON for API routes
app.use((req, res) => {
  // If it's not an API route and it's a GET request, serve the React app
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../Url_Shortener-main/build', 'index.html'));
  } else {
    res.status(404).json({
      error: 'Not Found',
      message: 'The requested resource was not found on this server.',
      path: req.path
    });
  }
});

app.use((err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid JSON payload'
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Payload Too Large',
      message: 'Request payload exceeds maximum size limit'
    });
  }

  const status = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' && status === 500 
    ? 'Internal Server Error' 
    : err.message;

  res.status(status).json({
    error: status >= 500 ? 'Internal Server Error' : 'Client Error',
    message
  });
});

module.exports = app;