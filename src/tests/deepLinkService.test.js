'use strict';

const { detectPlatform, getClientIP, buildAndroidIntentPage } = require('../services/deepLinkService');

// ─── detectPlatform ───────────────────────────────────────────────────────────

describe('detectPlatform', () => {
  describe('iOS detection', () => {
    test('detects iPhone', () => {
      expect(detectPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe('ios');
    });

    test('detects iPad', () => {
      expect(detectPlatform('Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)')).toBe('ios');
    });

    test('detects iPod', () => {
      expect(detectPlatform('Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X)')).toBe('ios');
    });
  });

  describe('Android detection', () => {
    test('detects Android phone', () => {
      expect(detectPlatform('Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36')).toBe('android');
    });

    test('detects Android tablet', () => {
      expect(detectPlatform('Mozilla/5.0 (Linux; Android 12; Samsung Galaxy Tab) AppleWebKit/537.36')).toBe('android');
    });
  });

  describe('in-app browser detection — checked BEFORE platform', () => {
    test('Facebook (fban) on iPhone → in-app-browser, not ios', () => {
      expect(detectPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) ... FBAN/123 FBAV/456')).toBe('in-app-browser');
    });

    test('Instagram on iPhone → in-app-browser', () => {
      expect(detectPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Instagram/303.0')).toBe('in-app-browser');
    });

    test('Twitter on Android → in-app-browser', () => {
      expect(detectPlatform('Mozilla/5.0 (Linux; Android 13) Twitter for Android')).toBe('in-app-browser');
    });

    test('WeChat (MicroMessenger) → in-app-browser', () => {
      expect(detectPlatform('Mozilla/5.0 (iPhone) MicroMessenger/8.0')).toBe('in-app-browser');
    });

    test('TikTok → in-app-browser', () => {
      expect(detectPlatform('Mozilla/5.0 (iPhone) tiktok/25.0')).toBe('in-app-browser');
    });

    test('Snapchat → in-app-browser', () => {
      expect(detectPlatform('Mozilla/5.0 (iPhone) Snapchat/12.0')).toBe('in-app-browser');
    });

    test('LINE → in-app-browser', () => {
      expect(detectPlatform('Mozilla/5.0 (iPhone) Line/13.0')).toBe('in-app-browser');
    });
  });

  describe('desktop detection', () => {
    test('Chrome on macOS → desktop', () => {
      expect(detectPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120')).toBe('desktop');
    });

    test('Firefox on Windows → desktop', () => {
      expect(detectPlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/120')).toBe('desktop');
    });

    test('empty string → desktop', () => {
      expect(detectPlatform('')).toBe('desktop');
    });

    test('null/undefined → desktop', () => {
      expect(detectPlatform(null)).toBe('desktop');
      expect(detectPlatform(undefined)).toBe('desktop');
    });
  });
});

// ─── getClientIP ──────────────────────────────────────────────────────────────

describe('getClientIP', () => {
  const makeReq = (headers = {}, ip = '127.0.0.1') => ({
    get: (name) => headers[name] || null,
    ip,
  });

  test('prefers CF-Connecting-IP over everything', () => {
    const req = makeReq({
      'CF-Connecting-IP': '1.2.3.4',
      'X-Real-IP': '5.6.7.8',
      'X-Forwarded-For': '9.10.11.12',
    });
    expect(getClientIP(req)).toBe('1.2.3.4');
  });

  test('prefers X-Real-IP over X-Forwarded-For', () => {
    const req = makeReq({
      'X-Real-IP': '5.6.7.8',
      'X-Forwarded-For': '9.10.11.12, 13.14.15.16',
    });
    expect(getClientIP(req)).toBe('5.6.7.8');
  });

  test('takes first IP from X-Forwarded-For chain', () => {
    const req = makeReq({ 'X-Forwarded-For': '10.0.0.1, 172.16.0.1, 192.168.1.1' });
    expect(getClientIP(req)).toBe('10.0.0.1');
  });

  test('prefers X-Client-IP over req.ip', () => {
    const req = makeReq({ 'X-Client-IP': '200.1.2.3' }, '127.0.0.1');
    expect(getClientIP(req)).toBe('200.1.2.3');
  });

  test('falls back to req.ip', () => {
    const req = makeReq({}, '203.0.113.42');
    expect(getClientIP(req)).toBe('203.0.113.42');
  });

  test('ultimate fallback is 127.0.0.1', () => {
    const req = makeReq({}, null);
    expect(getClientIP(req)).toBe('127.0.0.1');
  });
});

// ─── buildAndroidIntentPage ───────────────────────────────────────────────────

describe('buildAndroidIntentPage', () => {
  const intentUrl = 'intent://example.com/dl/abc#Intent;scheme=https;package=com.test;end';
  const fallback = 'https://play.google.com/store/apps/details?id=com.test';
  const appName = 'Test App';

  test('returns an HTML string', () => {
    const html = buildAndroidIntentPage(intentUrl, fallback, appName);
    expect(typeof html).toBe('string');
    expect(html).toMatch(/<!DOCTYPE html>/i);
  });

  test('contains the app name in the page', () => {
    const html = buildAndroidIntentPage(intentUrl, fallback, appName);
    expect(html).toContain('Test App');
  });

  test('contains the intent URL in the script', () => {
    const html = buildAndroidIntentPage(intentUrl, fallback, appName);
    expect(html).toContain(intentUrl);
  });

  test('contains the fallback URL as the Continue button', () => {
    const html = buildAndroidIntentPage(intentUrl, fallback, appName);
    expect(html).toContain(fallback);
  });

  test('strips XSS characters from app name', () => {
    const maliciousName = 'Evil<script>alert(1)</script>App';
    const html = buildAndroidIntentPage(intentUrl, fallback, maliciousName);
    // The page has its own legitimate <script> block; check the NAME context specifically
    const h2Content = html.match(/<h2>(.*?)<\/h2>/s)?.[1] ?? '';
    // Raw injection tag must not appear — angle brackets must be entity-encoded
    expect(h2Content).not.toContain('<script>');
    expect(h2Content).toContain('&lt;script&gt;');
  });

  test('uses "the app" when appName is empty', () => {
    const html = buildAndroidIntentPage(intentUrl, fallback, '');
    expect(html).toContain('the app');
  });
});
