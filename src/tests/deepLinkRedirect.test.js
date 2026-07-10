'use strict';

// ── Mock all external connections before anything is required ─────────────────

jest.mock('../config/redis', () => ({
  redis: { status: 'ready', on: jest.fn(), connect: jest.fn(), quit: jest.fn() },
  cacheGet: jest.fn().mockResolvedValue(null),
  cacheSet: jest.fn().mockResolvedValue(true),
  cacheDel: jest.fn().mockResolvedValue(true),
  cacheExists: jest.fn().mockResolvedValue(false),
}));

jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return { ...actual, connect: jest.fn().mockResolvedValue({}) };
});

// Mock the deferredLinkService to avoid Redis in integration tests
jest.mock('../services/deferredLinkService', () => ({
  storePayload: jest.fn().mockResolvedValue('dl:deferred:127.0.0.1:123456'),
  matchPayload: jest.fn().mockResolvedValue({ matched: false }),
  scoreMatch: jest.fn(),
  extractOSVersion: jest.fn(),
}));

// Mock analytics + geo so clicks don't error out
jest.mock('../services/analyticsService', () => ({
  recordClick: jest.fn().mockResolvedValue({}),
}));
jest.mock('../utils/geoLocation', () => ({
  getLocationFromIP: jest.fn().mockResolvedValue({ country: 'US' }),
}));

// Mock the Url model
const mockUrlFindOne = jest.fn();
jest.mock('../models/Url', () => ({
  findOne: mockUrlFindOne,
}));

const request = require('supertest');
const express = require('express');
const redirectController = require('../controllers/redirectController');
const { redirectLimiter } = require('../middleware/rateLimiter');

// Minimal app with just the /dl/ route
const app = express();
app.use(express.json());
app.get('/dl/:shortCode', redirectLimiter, redirectController.handleDeepLinkRedirect);

// ─── Shared test fixtures ─────────────────────────────────────────────────────

const makeApp = (overrides = {}) => ({
  _id: 'app123',
  name: 'Test App',
  bundleId: 'com.test.app',
  iosStoreUrl: 'https://apps.apple.com/app/id999',
  packageName: 'com.test.app',
  androidStoreUrl: 'https://play.google.com/store/apps/details?id=com.test.app',
  webFallbackUrl: 'https://example.com/download',
  ...overrides,
});

const makeUrl = (appOverrides = {}, deepLinkOverrides = {}) => ({
  _id: 'url123',
  shortCode: 'abc123',
  originalUrl: 'https://original.com/product/42',
  isActive: true,
  deepLink: {
    enabled: true,
    appRegistration: makeApp(appOverrides),
    screen: 'product',
    params: { id: '42' },
    webFallbackUrl: null,
    ...deepLinkOverrides,
  },
});

// Make Url.findOne().populate() chainable
const mockPopulate = (returnValue) => {
  const chain = { populate: jest.fn().mockResolvedValue(returnValue) };
  mockUrlFindOne.mockReturnValue(chain);
};

// ─── Desktop / unknown browser → web fallback ─────────────────────────────────

describe('Flow C — desktop and in-app browsers → web fallback', () => {
  test('desktop Chrome redirects to app webFallbackUrl', async () => {
    mockPopulate(makeUrl());
    const res = await request(app)
      .get('/dl/abc123')
      .set('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120');

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://example.com/download');
  });

  test('desktop with per-link webFallbackUrl uses that over app default', async () => {
    mockPopulate(makeUrl({}, { webFallbackUrl: 'https://example.com/specific-product' }));
    const res = await request(app)
      .get('/dl/abc123')
      .set('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120');

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://example.com/specific-product');
  });

  test('desktop with no fallback URLs at all falls back to originalUrl', async () => {
    mockPopulate(makeUrl(
      { webFallbackUrl: null },
      { webFallbackUrl: null }
    ));
    const res = await request(app)
      .get('/dl/abc123')
      .set('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120');

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://original.com/product/42');
  });

  test('Instagram UA redirects to web fallback (not App Store)', async () => {
    mockPopulate(makeUrl());
    const res = await request(app)
      .get('/dl/abc123')
      .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Instagram/303.0');

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://example.com/download');
  });

  test('Facebook in-app browser redirects to web fallback', async () => {
    mockPopulate(makeUrl());
    const res = await request(app)
      .get('/dl/abc123')
      .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) FBAN/FBForIPhone FBAV/456.0');

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://example.com/download');
  });
});

// ─── iOS → store redirect + fingerprint stored ────────────────────────────────

describe('Flow B — iOS (app not installed) → App Store + store fingerprint', () => {
  const { storePayload } = require('../services/deferredLinkService');

  beforeEach(() => storePayload.mockClear());

  test('iPhone UA redirects to iosStoreUrl', async () => {
    mockPopulate(makeUrl());
    const res = await request(app)
      .get('/dl/abc123')
      .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://apps.apple.com/app/id999');
  });

  test('stores deferred payload on iOS click', async () => {
    mockPopulate(makeUrl());
    await request(app)
      .get('/dl/abc123?sw=390&sh=844')
      .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');

    expect(storePayload).toHaveBeenCalledTimes(1);
  });

  test('iPad also redirects to App Store', async () => {
    mockPopulate(makeUrl());
    const res = await request(app)
      .get('/dl/abc123')
      .set('User-Agent', 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15');

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://apps.apple.com/app/id999');
  });

  test('falls back to webFallbackUrl when iosStoreUrl is missing', async () => {
    mockPopulate(makeUrl({ iosStoreUrl: null }));
    const res = await request(app)
      .get('/dl/abc123')
      .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)');

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://example.com/download');
  });
});

// ─── Android → intent page ────────────────────────────────────────────────────

describe('Flow B — Android (app not installed) → intent page', () => {
  const { storePayload } = require('../services/deferredLinkService');

  beforeEach(() => storePayload.mockClear());

  test('Android UA returns 200 HTML intent page', async () => {
    mockPopulate(makeUrl());
    const res = await request(app)
      .get('/dl/abc123')
      .set('User-Agent', 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('intent://');
    expect(res.text).toContain('com.test.app');
  });

  test('Android intent page contains Play Store fallback URL', async () => {
    mockPopulate(makeUrl());
    const res = await request(app)
      .get('/dl/abc123')
      .set('User-Agent', 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36');

    expect(res.text).toContain('play.google.com');
  });

  test('stores deferred payload on Android click', async () => {
    mockPopulate(makeUrl());
    await request(app)
      .get('/dl/abc123?sw=393&sh=852')
      .set('User-Agent', 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36');

    expect(storePayload).toHaveBeenCalledTimes(1);
  });

  test('falls back to web redirect when packageName or androidStoreUrl is missing', async () => {
    mockPopulate(makeUrl({ packageName: null, androidStoreUrl: null }));
    const res = await request(app)
      .get('/dl/abc123')
      .set('User-Agent', 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36');

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://example.com/download');
  });
});

// ─── Not found / disabled ─────────────────────────────────────────────────────

describe('Not found / disabled deep links', () => {
  test('unknown short code → redirect to link-not-found', async () => {
    const chain = { populate: jest.fn().mockResolvedValue(null) };
    mockUrlFindOne.mockReturnValue(chain);

    const res = await request(app)
      .get('/dl/doesnotexist')
      .set('User-Agent', 'Mozilla/5.0 (Macintosh) Chrome/120');

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('link-not-found');
  });

  test('deep link without appRegistration → link-not-found', async () => {
    const urlNoApp = makeUrl();
    urlNoApp.deepLink.appRegistration = null;
    const chain = { populate: jest.fn().mockResolvedValue(urlNoApp) };
    mockUrlFindOne.mockReturnValue(chain);

    const res = await request(app)
      .get('/dl/abc123')
      .set('User-Agent', 'Mozilla/5.0 (Macintosh) Chrome/120');

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('link-not-found');
  });
});
