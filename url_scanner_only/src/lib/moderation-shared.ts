import fs from "node:fs";
import path from "node:path";
import { logger } from "./logger";

// ── Prompt template loader ────────────────────────────────────────────────────
const promptCache = new Map<string, string>();

export function loadPrompt(filename: string): string {
  const cached = promptCache.get(filename);
  if (cached !== undefined) return cached;
  const filepath = path.join(__dirname, "prompts", filename);
  const content = fs.readFileSync(filepath, "utf-8");
  promptCache.set(filename, content);
  return content;
}

export function buildPrompt(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{{${k}}}`, v),
    template
  );
}

// ── Shared types ──────────────────────────────────────────────────────────────
export interface PipelineTrace {
  safeBrowsing: { available: boolean; flagged?: boolean; threatTypes?: string[]; error?: string };
  safebrowz: { available: boolean; verdict: "safe" | "caution" | "danger" | null; score: number | null; flags: string[]; error?: string };
  firecrawl: { available: boolean; contentLength?: number; error?: string };
  claude: { ran: boolean };
}

export interface ModerationVerdict {
  decision: "ALLOW" | "BLOCK";
  category: string;
  confidence: number;
  flags: string[];
  reason: string;
  contentAccessed: boolean;
  pipelineTrace: PipelineTrace;
  inputTokens: number | null;
  outputTokens: number | null;
}

export interface SafeBrowsingResult {
  available: boolean;
  flagged: boolean;
  threatTypes?: string[];
  error?: string;
}

export interface SafebrowzResult {
  available: boolean;
  verdict: "safe" | "caution" | "danger" | null;
  score: number | null;
  flags: string[];
  error?: string;
}

export interface FirecrawlResult {
  available: boolean;
  error?: string;
  title?: string;
  description?: string;
  content?: string;
}

export interface ImagePayload {
  base64: string;
  mediaType: string;
  sourceUrl: string;
  byteLength: number;
}

// ── Image detection constants ─────────────────────────────────────────────────
// Extend IMAGE_EXTENSIONS or KNOWN_IMAGE_HOSTS to add new coverage.
export const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff"];
// SVG omitted — XML text, better handled by the Firecrawl text path.

// Add or remove entries here to extend coverage.
export const KNOWN_IMAGE_HOSTS: string[] = [
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

// Media types Claude's vision API accepts.
export const CLAUDE_VISION_TYPES = new Set<string>(["image/jpeg", "image/png", "image/gif", "image/webp"]);

export const IMAGE_FETCH_TIMEOUT_MS = 8_000;
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// ── Known-legitimate file-host / SSO domains ─────────────────────────────────
const KNOWN_LEGIT_HOSTS = [
  "sharepoint.com",
  "onedrive.live.com",
  "drive.google.com",
  "docs.google.com",
  "dropbox.com",
  "box.com",
  "login.microsoftonline.com",
];

export function isKnownLegitHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return KNOWN_LEGIT_HOSTS.some((d) => host === d || host.endsWith("." + d));
  } catch {
    return false;
  }
}

// ── Image URL detection helpers ───────────────────────────────────────────────
export function hasImageExtension(url: string): boolean {
  try {
    const p = new URL(url).pathname.toLowerCase();
    return IMAGE_EXTENSIONS.some((ext) => p.endsWith(ext));
  } catch {
    return false;
  }
}

export function isKnownImageHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return KNOWN_IMAGE_HOSTS.some((d) => host === d || host.endsWith("." + d));
  } catch {
    return false;
  }
}

export async function checkContentTypeIsImage(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5_000);
    const res = await fetch(url, { method: "HEAD", signal: controller.signal, redirect: "follow" });
    clearTimeout(timer);
    return (res.headers.get("content-type") ?? "").startsWith("image/");
  } catch {
    return false;
  }
}

export type ImageDetection =
  | { kind: "direct"; url: string }
  | { kind: "hosted"; hostUrl: string }
  | { kind: "none" };

export async function detectImage(url: string): Promise<ImageDetection> {
  // Case (a): path ends in known image extension
  if (hasImageExtension(url)) return { kind: "direct", url };
  // Case (c): known image-hosting domain
  if (isKnownImageHost(url)) return { kind: "hosted", hostUrl: url };
  // Case (b): HEAD request — only done when the above two don't match
  if (await checkContentTypeIsImage(url)) return { kind: "direct", url };
  return { kind: "none" };
}

// ── Image fetch & extraction ──────────────────────────────────────────────────
export async function fetchImageBase64(url: string): Promise<ImagePayload | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);
    const res = await fetch(url, { signal: controller.signal, redirect: "follow" });
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
    logger.warn({ url, err: e instanceof Error ? e.message : String(e) }, "Image fetch failed");
    return null;
  }
}

export async function extractPrimaryImageUrl(pageUrl: string): Promise<string | null> {
  // Gyazo: known direct-URL transformation
  try {
    const u = new URL(pageUrl);
    const host = u.hostname.toLowerCase();
    if (host === "gyazo.com" || host.endsWith(".gyazo.com")) {
      const id = u.pathname.replace(/^\//, "").split("?")[0];
      if (id) return `https://i.gyazo.com/${id}.png`;
    }
  } catch {}

  // General: fetch page HTML and parse og:image
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);
    const res = await fetch(pageUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Snip-moderation/1.0)" },
    });
    clearTimeout(timer);
    if (!res.ok) return null;

    const html = await res.text();
    // Match og:image in either attribute order
    const m =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

export async function resolveImage(detection: ImageDetection & { kind: "direct" | "hosted" }): Promise<ImagePayload | null> {
  if (detection.kind === "direct") {
    return fetchImageBase64(detection.url);
  }
  // hosted: extract primary image URL from the page, then fetch it
  const imageUrl = await extractPrimaryImageUrl(detection.hostUrl);
  if (!imageUrl) {
    logger.warn({ hostUrl: detection.hostUrl }, "Could not extract image URL from hosting page");
    return null;
  }
  logger.info({ hostUrl: detection.hostUrl, imageUrl }, "Extracted image URL from hosting page");
  return fetchImageBase64(imageUrl);
}

// ── API layers ────────────────────────────────────────────────────────────────
export async function checkSafeBrowsing(url: string): Promise<SafeBrowsingResult> {
  const key = process.env.SAFE_BROWSING_API_KEY;
  if (!key) return { available: false, flagged: false, error: "SAFE_BROWSING_API_KEY not set" };

  try {
    const res = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: { clientId: "snip-sa", clientVersion: "1.0" },
          threatInfo: {
            threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url }],
          },
        }),
      }
    );
    if (!res.ok) {
      const errText = await res.text();
      const msg = `Safe Browsing ${res.status}: ${errText.slice(0, 120)}`;
      logger.warn({ url, err: msg }, "Safe Browsing check failed");
      return { available: false, flagged: false, error: msg };
    }
    const data = (await res.json()) as { matches?: Array<{ threatType: string }> };
    const matches = data.matches ?? [];
    return {
      available: true,
      flagged: matches.length > 0,
      threatTypes: matches.map((m) => m.threatType),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.warn({ url, err: msg }, "Safe Browsing check threw");
    return { available: false, flagged: false, error: msg };
  }
}

export async function checkSafebrowz(url: string): Promise<SafebrowzResult> {
  const key = process.env.SAFEBROWZ_API_KEY;
  if (!key) return { available: false, verdict: null, score: null, flags: [], error: "SAFEBROWZ_API_KEY not set" };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    const res = await fetch("https://api.safebrowz.com/v1/detect", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
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
      return { available: false, verdict: null, score: null, flags: [], error: msg };
    }

    const data = (await res.json()) as Record<string, unknown>;
    const verdict = (data.verdict as string) ?? null;
    const score = typeof data.confidence === "number" ? data.confidence : null;
    const flags: string[] = Array.isArray(data.threat_signals)
      ? (data.threat_signals as string[])
      : Array.isArray(data.flags)
      ? (data.flags as string[])
      : [];

    logger.info({ url, verdict, score, flags }, "SafeBrowz result");
    return { available: true, verdict: verdict as "safe" | "caution" | "danger" | null, score, flags };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.warn({ url, err: msg }, "SafeBrowz check threw");
    return { available: false, verdict: null, score: null, flags: [], error: msg };
  }
}
