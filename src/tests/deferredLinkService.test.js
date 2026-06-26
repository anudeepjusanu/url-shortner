'use strict';

// ── Mock Redis BEFORE requiring any module that imports it ────────────────────
const mockRedisStore = new Map();

jest.mock('../config/redis', () => {
  const store = mockRedisStore;
  return {
    redis: {
      status: 'ready',
      on: jest.fn(),
      connect: jest.fn().mockResolvedValue({}),
      quit: jest.fn().mockResolvedValue({}),
      get: jest.fn(async (key) => store.get(key) ?? null),
      setex: jest.fn(async (key, _ttl, value) => { store.set(key, value); return 'OK'; }),
      del: jest.fn(async (key) => { store.delete(key); return 1; }),
      scan: jest.fn(async (_cursor, _match, pattern, _count, _n) => {
        // Simple pattern matching: replace * with .* for regex
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        const matched = [...store.keys()].filter(k => regex.test(k));
        return ['0', matched];
      }),
    },
    cacheGet: jest.fn(async (key) => {
      const raw = store.get(key);
      return raw ? JSON.parse(raw) : null;
    }),
    cacheSet: jest.fn(async (key, value, _ttl) => {
      store.set(key, JSON.stringify(value));
      return true;
    }),
    cacheDel: jest.fn(async (key) => { store.delete(key); return true; }),
    cacheExists: jest.fn(async (key) => store.has(key)),
  };
});

const { scoreMatch, extractOSVersion, storePayload, matchPayload } = require('../services/deferredLinkService');

// Clear the mock store between tests
beforeEach(() => mockRedisStore.clear());

// ─── extractOSVersion ─────────────────────────────────────────────────────────

describe('extractOSVersion', () => {
  test('extracts iOS version from UA', () => {
    expect(extractOSVersion('Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X)')).toBe('17.2');
  });

  test('handles multi-part iOS version', () => {
    expect(extractOSVersion('Mozilla/5.0 (iPhone; CPU iPhone OS 16_5_1 like Mac OS X)')).toBe('16.5.1');
  });

  test('extracts Android version from UA', () => {
    expect(extractOSVersion('Mozilla/5.0 (Linux; Android 13; Pixel 7)')).toBe('13');
  });

  test('extracts Android version with minor', () => {
    expect(extractOSVersion('Mozilla/5.0 (Linux; Android 12.1; Samsung)')).toBe('12.1');
  });

  test('returns null for desktop UA', () => {
    expect(extractOSVersion('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120')).toBeNull();
  });

  test('returns null for empty string', () => {
    expect(extractOSVersion('')).toBeNull();
  });
});

// ─── scoreMatch ───────────────────────────────────────────────────────────────

describe('scoreMatch', () => {
  const now = Date.now();

  const baseStored = {
    platform: 'ios',
    osVersion: '17.0',
    screenWidth: 390,
    screenHeight: 844,
    storedAt: now - 1000 * 60 * 30, // 30 minutes ago
  };

  const baseIncoming = {
    platform: 'ios',
    osVersion: '17.0',
    screenWidth: 390,
    screenHeight: 844,
  };

  test('perfect match returns confidence >= 0.80', () => {
    const confidence = scoreMatch(baseStored, baseIncoming);
    expect(confidence).toBeGreaterThanOrEqual(0.80);
  });

  test('perfect match very recent click returns confidence near 1.0', () => {
    const stored = { ...baseStored, storedAt: Date.now() - 5000 }; // 5 seconds ago
    expect(scoreMatch(stored, baseIncoming)).toBeGreaterThan(0.90);
  });

  test('platform mismatch returns exactly 0', () => {
    expect(scoreMatch({ ...baseStored, platform: 'android' }, baseIncoming)).toBe(0);
    expect(scoreMatch(baseStored, { ...baseIncoming, platform: 'android' })).toBe(0);
  });

  test('matching major OS version gives partial score', () => {
    const incoming = { ...baseIncoming, osVersion: '17.1' }; // same major, different minor
    const sameOS = scoreMatch(baseStored, baseIncoming);
    const diffMinor = scoreMatch(baseStored, incoming);
    expect(diffMinor).toBeLessThan(sameOS);
    expect(diffMinor).toBeGreaterThan(0);
  });

  test('completely different OS version gives lower score', () => {
    const incoming = { ...baseIncoming, osVersion: '15.0' }; // different major
    const sameOS = scoreMatch(baseStored, baseIncoming);
    const diffOS = scoreMatch(baseStored, incoming);
    expect(diffOS).toBeLessThan(sameOS);
  });

  test('screen size within 10px gives partial score', () => {
    const incoming = { ...baseIncoming, screenWidth: 395, screenHeight: 850 }; // off by 5/6
    const exact = scoreMatch(baseStored, baseIncoming);
    const close = scoreMatch(baseStored, incoming);
    expect(close).toBeLessThan(exact);
    expect(close).toBeGreaterThan(0);
  });

  test('screen size off by more than 10px gives 0 screen score', () => {
    const incomingFarOff = { ...baseIncoming, screenWidth: 430, screenHeight: 932 }; // iPhone 14 Plus
    const incomingExact = { ...baseIncoming };
    expect(scoreMatch(baseStored, incomingFarOff)).toBeLessThan(scoreMatch(baseStored, incomingExact));
  });

  test('click older than 24h gets lowest time score', () => {
    const oldStored = { ...baseStored, storedAt: now - 25 * 60 * 60 * 1000 }; // 25h ago
    const recentStored = { ...baseStored, storedAt: now - 30 * 60 * 1000 };    // 30 min ago
    expect(scoreMatch(oldStored, baseIncoming)).toBeLessThan(scoreMatch(recentStored, baseIncoming));
  });

  test('missing screen dimensions still scores on platform + OS + time', () => {
    const noScreen = { ...baseIncoming, screenWidth: null, screenHeight: null };
    const conf = scoreMatch(baseStored, noScreen);
    expect(conf).toBeGreaterThan(0);
  });

  test('result is always between 0 and 1', () => {
    const conf = scoreMatch(baseStored, baseIncoming);
    expect(conf).toBeGreaterThanOrEqual(0);
    expect(conf).toBeLessThanOrEqual(1);
  });
});

// ─── storePayload ─────────────────────────────────────────────────────────────

describe('storePayload', () => {
  const mockUrlDoc = {
    shortCode: 'abc123',
    deepLink: { screen: 'product', params: { id: '42' } },
  };

  const makeReq = (sw, sh) => ({
    query: { sw, sh },
    get: () => null,
    ip: '127.0.0.1',
  });

  test('stores a key in Redis and returns the key', async () => {
    const key = await storePayload(
      '192.168.1.1',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      makeReq('390', '844'),
      mockUrlDoc
    );
    expect(key).toMatch(/^dl:deferred:192\.168\.1\.1:\d+$/);
    expect(mockRedisStore.size).toBe(1);
  });

  test('stored entry contains platform, screen, params', async () => {
    await storePayload(
      '10.0.0.1',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      makeReq('390', '844'),
      mockUrlDoc
    );
    const raw = [...mockRedisStore.values()][0];
    const entry = JSON.parse(raw);
    expect(entry.platform).toBe('ios');
    expect(entry.screen).toBe('product');
    expect(entry.params).toEqual({ id: '42' });
    expect(entry.screenWidth).toBe(390);
    expect(entry.screenHeight).toBe(844);
  });

  test('returns null without throwing on Redis error', async () => {
    const { cacheSet } = require('../config/redis');
    cacheSet.mockRejectedValueOnce(new Error('Redis down'));
    const key = await storePayload('1.2.3.4', 'ua', makeReq(null, null), mockUrlDoc);
    expect(key).toBeNull();
  });
});

// ─── matchPayload ─────────────────────────────────────────────────────────────

describe('matchPayload', () => {
  const seedPayload = async (ip, overrides = {}) => {
    const ts = Date.now() - 60_000; // 1 minute ago
    const key = `dl:deferred:${ip}:${ts}`;
    const entry = {
      ip,
      platform: 'ios',
      osVersion: '17.0',
      screenWidth: 390,
      screenHeight: 844,
      storedAt: ts,
      shortCode: 'abc123',
      screen: 'product',
      params: { id: '42' },
      ...overrides,
    };
    mockRedisStore.set(key, JSON.stringify(entry));
    return { key, entry };
  };

  test('returns matched:false when no keys exist for that IP', async () => {
    const result = await matchPayload({
      ip: '10.0.0.99',
      platform: 'ios',
      osVersion: '17.0',
      screenWidth: 390,
      screenHeight: 844,
    });
    expect(result).toEqual({ matched: false });
  });

  test('returns matched:true with screen and params on confident match', async () => {
    await seedPayload('10.0.0.1');
    const result = await matchPayload({
      ip: '10.0.0.1',
      platform: 'ios',
      osVersion: '17.0',
      screenWidth: 390,
      screenHeight: 844,
    });
    expect(result.matched).toBe(true);
    expect(result.screen).toBe('product');
    expect(result.params).toEqual({ id: '42' });
    expect(result.confidence).toBeGreaterThanOrEqual(0.80);
  });

  test('deletes the key after a successful match (no double-claiming)', async () => {
    await seedPayload('10.0.0.2');
    await matchPayload({ ip: '10.0.0.2', platform: 'ios', osVersion: '17.0', screenWidth: 390, screenHeight: 844 });
    // Second call should return no match
    const second = await matchPayload({ ip: '10.0.0.2', platform: 'ios', osVersion: '17.0', screenWidth: 390, screenHeight: 844 });
    expect(second.matched).toBe(false);
  });

  test('returns matched:false when platform does not match', async () => {
    await seedPayload('10.0.0.3', { platform: 'ios' });
    const result = await matchPayload({
      ip: '10.0.0.3',
      platform: 'android', // wrong platform
      osVersion: '13.0',
      screenWidth: 390,
      screenHeight: 844,
    });
    expect(result.matched).toBe(false);
  });

  test('returns matched:false when confidence is below threshold', async () => {
    await seedPayload('10.0.0.4', {
      platform: 'ios',
      osVersion: '17.0',
      screenWidth: 390,
      screenHeight: 844,
      storedAt: Date.now() - 48 * 60 * 60 * 1000, // 48h ago — very low time score
    });
    // Different screen size + old click → low confidence
    const result = await matchPayload({
      ip: '10.0.0.4',
      platform: 'ios',
      osVersion: '14.0',   // different major OS version
      screenWidth: 430,
      screenHeight: 932,
    });
    expect(result.matched).toBe(false);
  });

  test('returns matched:false when ip is missing', async () => {
    const result = await matchPayload({ platform: 'ios' });
    expect(result.matched).toBe(false);
  });

  test('picks the highest-confidence entry when multiple exist', async () => {
    const goodTs = Date.now() - 60_000;       // 1 min ago
    const oldTs  = Date.now() - 50 * 3600_000; // 50h ago

    mockRedisStore.set(`dl:deferred:10.0.0.5:${oldTs}`, JSON.stringify({
      ip: '10.0.0.5', platform: 'ios', osVersion: '15.0',
      screenWidth: 320, screenHeight: 568, storedAt: oldTs,
      screen: 'old-screen', params: null,
    }));
    mockRedisStore.set(`dl:deferred:10.0.0.5:${goodTs}`, JSON.stringify({
      ip: '10.0.0.5', platform: 'ios', osVersion: '17.0',
      screenWidth: 390, screenHeight: 844, storedAt: goodTs,
      screen: 'product', params: { id: '99' },
    }));

    const result = await matchPayload({
      ip: '10.0.0.5',
      platform: 'ios',
      osVersion: '17.0',
      screenWidth: 390,
      screenHeight: 844,
    });
    expect(result.matched).toBe(true);
    expect(result.screen).toBe('product');
  });
});
