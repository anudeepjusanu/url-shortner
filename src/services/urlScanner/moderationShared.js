const fs = require("fs");
const path = require("path");
const { logger } = require("./logger");
const { safeFetch } = require("../../utils/ssrfGuard");

// The functions below fetch a user-submitted URL directly from our own
// server (unlike the Firecrawl/Safebrowz calls elsewhere in this module,
// which fetch on our behalf) — they use safeFetch instead of the global
// fetch so a link that resolves (directly, or via a redirect hop) to an
// internal/private address is never connected to. safeFetch throws on a
// block, which each call site's existing catch already handles the same way
// it handles any other fetch failure.

// Shared across urlModeration.js (text) and imageModeration.js (vision) so
// the model version only needs updating in one place.
const CLAUDE_MODEL = "claude-haiku-4-5-20251001";

const promptCache = new Map();

function loadPrompt(filename) {
  const cached = promptCache.get(filename);
  if (cached !== undefined) return cached;
  const filepath = path.join(__dirname, "prompts", filename);
  const content = fs.readFileSync(filepath, "utf-8");
  promptCache.set(filename, content);
  return content;
}

function buildPrompt(template, vars) {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{{${k}}}`, v),
    template,
  );
}

// Extend to add new coverage.
const IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".bmp",
  ".tiff",
];
// SVG omitted — XML text, better handled by the Firecrawl text path.

const KNOWN_IMAGE_HOSTS = [
  "imgur.com",
  "i.imgur.com",
  "ibb.co",
  "imgbb.com",
  "postimg.cc",
  "postimages.org",
  "prnt.sc",
  "lightshot.com",
  "imgbox.com",
  "imageban.ru",
  "gyazo.com",
  "i.gyazo.com",
];

const CLAUDE_VISION_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const IMAGE_FETCH_TIMEOUT_MS = 8_000;
const IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const KNOWN_LEGIT_HOSTS = [
  "sharepoint.com",
  "onedrive.live.com",
  "drive.google.com",
  "docs.google.com",
  "dropbox.com",
  "box.com",
  "login.microsoftonline.com",
];

function isKnownLegitHost(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return KNOWN_LEGIT_HOSTS.some((d) => host === d || host.endsWith("." + d));
  } catch {
    return false;
  }
}

function hasImageExtension(url) {
  try {
    const p = new URL(url).pathname.toLowerCase();
    return IMAGE_EXTENSIONS.some((ext) => p.endsWith(ext));
  } catch {
    return false;
  }
}

function isKnownImageHost(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return KNOWN_IMAGE_HOSTS.some((d) => host === d || host.endsWith("." + d));
  } catch {
    return false;
  }
}

async function checkContentTypeIsImage(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5_000);
    const res = await safeFetch(url, {
      method: "HEAD",
      signal: controller.signal,
    });
    clearTimeout(timer);
    return (res.headers.get("content-type") ?? "").startsWith("image/");
  } catch {
    return false;
  }
}

async function detectImage(url) {
  if (hasImageExtension(url)) return { kind: "direct", url };
  if (isKnownImageHost(url)) return { kind: "hosted", hostUrl: url };
  if (await checkContentTypeIsImage(url)) return { kind: "direct", url };
  return { kind: "none" };
}

async function fetchImageBase64(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);
    const res = await safeFetch(url, {
      signal: controller.signal,
    });
    clearTimeout(timer);

    const ct = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!ct.startsWith("image/")) return null;

    const cl = parseInt(res.headers.get("content-length") ?? "0", 10);
    if (cl > IMAGE_MAX_BYTES) {
      logger.warn({ url, contentLength: cl }, "Image too large — skipping");
      return null;
    }

    const bytes = await res.arrayBuffer();
    if (bytes.byteLength > IMAGE_MAX_BYTES) return null;

    return {
      base64: Buffer.from(bytes).toString("base64"),
      mediaType: ct,
      sourceUrl: url,
      byteLength: bytes.byteLength,
    };
  } catch (e) {
    logger.warn(
      { url, err: e instanceof Error ? e.message : String(e) },
      "Image fetch failed",
    );
    return null;
  }
}

async function extractPrimaryImageUrl(pageUrl) {
  // Gyazo: known direct-URL transformation
  try {
    const u = new URL(pageUrl);
    const host = u.hostname.toLowerCase();
    if (host === "gyazo.com" || host.endsWith(".gyazo.com")) {
      const id = u.pathname.replace(/^\//, "").split("?")[0];
      if (id) return `https://i.gyazo.com/${id}.png`;
    }
  } catch {
    // ignore malformed URL, fall through to generic HTML scrape
  }

  // General: fetch page HTML and parse og:image
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);
    const res = await safeFetch(pageUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Snip-moderation/1.0)",
      },
    });
    clearTimeout(timer);
    if (!res.ok) return null;

    const html = await res.text();
    const m =
      html.match(
        /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      ) ??
      html.match(
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      );
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

async function resolveImage(detection) {
  if (detection.kind === "direct") {
    return fetchImageBase64(detection.url);
  }
  // hosted: extract primary image URL from the page, then fetch it
  const imageUrl = await extractPrimaryImageUrl(detection.hostUrl);
  if (!imageUrl) {
    logger.warn(
      { hostUrl: detection.hostUrl },
      "Could not extract image URL from hosting page",
    );
    return null;
  }
  logger.info(
    { hostUrl: detection.hostUrl, imageUrl },
    "Extracted image URL from hosting page",
  );
  return fetchImageBase64(imageUrl);
}

async function checkSafebrowz(url) {
  const key = process.env.SAFEBROWZ_API_KEY;
  if (!key)
    return {
      available: false,
      verdict: null,
      score: null,
      flags: [],
      error: "SAFEBROWZ_API_KEY not set",
    };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch("https://api.safebrowz.com/v1/detect", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text();
      const msg = `SafeBrowz ${res.status}: ${errText.slice(0, 120)}`;
      logger.warn({ url, err: msg }, "SafeBrowz check failed");
      return {
        available: false,
        verdict: null,
        score: null,
        flags: [],
        error: msg,
      };
    }

    const data = await res.json();
    const verdict = data.verdict ?? null;
    const score = typeof data.confidence === "number" ? data.confidence : null;
    const flags = Array.isArray(data.threat_signals)
      ? data.threat_signals
      : Array.isArray(data.flags)
        ? data.flags
        : [];

    logger.info({ url, verdict, score, flags }, "SafeBrowz result");
    return { available: true, verdict, score, flags };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.warn({ url, err: msg }, "SafeBrowz check threw");
    return {
      available: false,
      verdict: null,
      score: null,
      flags: [],
      error: msg,
    };
  }
}

module.exports = {
  loadPrompt,
  buildPrompt,
  isKnownLegitHost,
  hasImageExtension,
  isKnownImageHost,
  checkContentTypeIsImage,
  detectImage,
  fetchImageBase64,
  extractPrimaryImageUrl,
  resolveImage,
  checkSafebrowz,
  CLAUDE_VISION_TYPES,
  IMAGE_EXTENSIONS,
  KNOWN_IMAGE_HOSTS,
  CLAUDE_MODEL,
};
