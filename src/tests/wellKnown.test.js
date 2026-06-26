'use strict';

// ── Mock external connections before anything is required ─────────────────────
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

// Mock AppRegistration model — factory creates a fresh jest.fn() for find
jest.mock('../models/AppRegistration', () => ({ find: jest.fn() }));

const request = require('supertest');
const express = require('express');
const AppRegistration = require('../models/AppRegistration');
const wellKnownRouter = require('../routes/wellKnown');

// Minimal test app — only mount the /.well-known routes
const app = express();
app.use('/.well-known', wellKnownRouter);

// Helper: make a mock chain that satisfies .find({}).select('').lean()
const makeChain = (resolvedValue) => ({
  select: jest.fn().mockReturnValue({
    lean: jest.fn().mockResolvedValue(resolvedValue),
  }),
});

const makeErrorChain = (err) => ({
  select: jest.fn().mockReturnValue({
    lean: jest.fn().mockRejectedValue(err),
  }),
});

beforeEach(() => AppRegistration.find.mockReset());

// ─── apple-app-site-association ───────────────────────────────────────────────

describe('GET /.well-known/apple-app-site-association', () => {
  test('returns valid AASA JSON with registered iOS app', async () => {
    AppRegistration.find.mockReturnValueOnce(makeChain([
      { bundleId: 'com.test.app', teamId: 'ABCDE12345', isActive: true },
      { bundleId: 'com.other.app', teamId: 'FGHIJ67890', isActive: true },
    ]));

    const res = await request(app)
      .get('/.well-known/apple-app-site-association')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(res.body).toHaveProperty('applinks');
    expect(res.body.applinks.details).toHaveLength(2);
    // appID must be TeamID.BundleID — Apple rejects bare bundle IDs
    expect(res.body.applinks.details[0].appID).toBe('ABCDE12345.com.test.app');
    expect(res.body.applinks.details[1].appID).toBe('FGHIJ67890.com.other.app');
    expect(res.body.applinks.details[0].paths).toContain('/dl/*');
  });

  test('returns empty details array when no iOS apps registered', async () => {
    AppRegistration.find.mockReturnValueOnce(makeChain([]));

    const res = await request(app)
      .get('/.well-known/apple-app-site-association')
      .expect(200);

    expect(res.body.applinks.details).toHaveLength(0);
    expect(res.body.applinks.apps).toEqual([]);
  });

  test('returns 503 without caching on DB error', async () => {
    AppRegistration.find.mockReturnValueOnce(makeErrorChain(new Error('DB down')));

    const res = await request(app)
      .get('/.well-known/apple-app-site-association')
      .expect(503);

    // Must not be cached — a transient outage should never persist as "no apps"
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body).toHaveProperty('applinks');
    expect(res.body.applinks.details).toEqual([]);
  });

  test('has correct Cache-Control header', async () => {
    AppRegistration.find.mockReturnValueOnce(makeChain([]));
    const res = await request(app)
      .get('/.well-known/apple-app-site-association');
    expect(res.headers['cache-control']).toContain('public');
  });

  test('falls back to bare bundleId when teamId is not set', async () => {
    AppRegistration.find.mockReturnValueOnce(makeChain([
      { bundleId: 'com.legacy.app', teamId: null, isActive: true },
    ]));
    const res = await request(app)
      .get('/.well-known/apple-app-site-association')
      .expect(200);
    expect(res.body.applinks.details[0].appID).toBe('com.legacy.app');
  });

  test('filters out apps without bundleId', async () => {
    AppRegistration.find.mockReturnValueOnce(makeChain([
      { bundleId: 'com.valid.app', isActive: true },
    ]));
    const res = await request(app)
      .get('/.well-known/apple-app-site-association')
      .expect(200);
    expect(res.body.applinks.details.every(d => d.appID)).toBe(true);
  });
});

// ─── assetlinks.json ──────────────────────────────────────────────────────────

describe('GET /.well-known/assetlinks.json', () => {
  test('returns valid asset links for registered Android app', async () => {
    AppRegistration.find.mockReturnValueOnce(makeChain([
      {
        packageName: 'com.test.app',
        sha256Fingerprint: 'AA:BB:CC:DD:EE:FF:00:11',
        isActive: true,
      },
    ]));

    const res = await request(app)
      .get('/.well-known/assetlinks.json')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].target.package_name).toBe('com.test.app');
    expect(res.body[0].target.sha256_cert_fingerprints).toContain('AA:BB:CC:DD:EE:FF:00:11');
    expect(res.body[0].relation).toContain('delegate_permission/common.handle_all_urls');
  });

  test('returns empty array when no Android apps registered', async () => {
    AppRegistration.find.mockReturnValueOnce(makeChain([]));
    const res = await request(app)
      .get('/.well-known/assetlinks.json')
      .expect(200);
    expect(res.body).toEqual([]);
  });

  test('returns 503 without caching on DB error', async () => {
    AppRegistration.find.mockReturnValueOnce(makeErrorChain(new Error('DB down')));
    const res = await request(app)
      .get('/.well-known/assetlinks.json')
      .expect(503);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(0);
  });

  test('multiple Android apps → one entry each', async () => {
    AppRegistration.find.mockReturnValueOnce(makeChain([
      { packageName: 'com.app.one', sha256Fingerprint: 'AA:BB', isActive: true },
      { packageName: 'com.app.two', sha256Fingerprint: 'CC:DD', isActive: true },
    ]));
    const res = await request(app)
      .get('/.well-known/assetlinks.json')
      .expect(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.map(e => e.target.package_name)).toEqual(['com.app.one', 'com.app.two']);
  });
});
