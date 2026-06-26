/**
 * deepLinkService
 *
 * Handles platform detection and builds the correct server response for each
 * of the three deep link routing paths (Flow A/B/C from the PDF).
 *
 * Flow A — app installed     → OS intercepts BEFORE our server sees the request.
 *                              Any iOS/Android request that DOES reach our server
 *                              means the app was NOT installed.
 * Flow B — app not installed → store redirect + deferred payload stored in Redis.
 * Flow C — desktop/in-app   → web fallback URL.
 */

const IN_APP_BROWSER_PATTERNS = [
  'fban', 'fbav',       // Facebook
  'instagram',          // Instagram
  'twitter',            // Twitter
  'wechat', 'micromessenger', // WeChat
  'line/',              // LINE
  'snapchat',           // Snapchat
  'tiktok',             // TikTok
];

/**
 * Detect the routing platform from a User-Agent string.
 * Returns: 'ios' | 'android' | 'in-app-browser' | 'desktop'
 */
const detectPlatform = (userAgent) => {
  const ua = (userAgent || '').toLowerCase();

  // Check in-app browsers first — these can't fire Universal/App Links
  if (IN_APP_BROWSER_PATTERNS.some(p => ua.includes(p))) {
    return 'in-app-browser';
  }

  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'desktop';
};

/**
 * Extract the real client IP, respecting common proxy headers.
 * Mirrors the same logic in redirectController to stay consistent.
 */
const getClientIP = (req) => {
  const cfIP = req.get('CF-Connecting-IP');
  const realIP = req.get('X-Real-IP');
  const forwarded = req.get('X-Forwarded-For');
  const clientIP = req.get('X-Client-IP');

  if (cfIP) return cfIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();
  if (clientIP) return clientIP;
  return req.ip || '127.0.0.1';
};

/**
 * Build the Android intent HTML page.
 *
 * This page attempts to open the app via the intent:// URI scheme. If the app
 * is not installed, the browser_fallback_url takes the user to the Play Store.
 * We also store the deferred payload BEFORE serving this page, so if the user
 * installs from the store and opens the app, the payload is waiting.
 */
const buildAndroidIntentPage = (intentUrl, webFallbackUrl, appName) => {
  // HTML-encode for use in text content and attribute values
  const safeAppName = (appName || 'the app')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  // HTML-encode for href attribute (prevents attribute breakout)
  const attrFallbackUrl = webFallbackUrl
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');
  // JSON.stringify handles " and \ but the HTML parser treats </script> as a tag
  // terminator regardless of JS string context. Unicode-escape < and > so the HTML
  // parser never sees the sequence, while the JS engine decodes it correctly at runtime.
  const safeForScript = (val) =>
    JSON.stringify(val).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
  const scriptIntentUrl   = safeForScript(intentUrl);
  const scriptFallbackUrl = safeForScript(webFallbackUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Opening ${safeAppName}…</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex;
           align-items: center; justify-content: center; min-height: 100vh; margin: 0;
           background: #f8fafc; color: #1e293b; }
    .card { text-align: center; padding: 32px 24px; max-width: 360px; }
    p { font-size: 15px; color: #64748b; margin: 8px 0 24px; }
    a { display: inline-block; background: #3b82f6; color: #fff; padding: 12px 28px;
        border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Opening ${safeAppName}…</h2>
    <p>If the app doesn't open automatically, tap the button below.</p>
    <a href="${attrFallbackUrl}">Continue in Browser</a>
  </div>
  <script>
    // Try to open the app via intent URI; fall through to store if not installed
    try { window.location.replace(${scriptIntentUrl}); } catch(e) {}
    // Fallback: if still here after 2s, user probably doesn't have the app
    setTimeout(function() {
      window.location.replace(${scriptFallbackUrl});
    }, 2500);
  </script>
</body>
</html>`;
};

module.exports = { detectPlatform, getClientIP, buildAndroidIntentPage };
