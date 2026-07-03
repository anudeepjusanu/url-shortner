const { logger } = require("./logger");
const safeBrowsingService = require("../safeBrowsingService");
const {
  loadPrompt,
  buildPrompt,
  isKnownLegitHost,
  CLAUDE_VISION_TYPES,
  CLAUDE_MODEL,
  detectImage,
  resolveImage,
  checkSafebrowz,
} = require("./moderationShared");
const { evaluateImageWithClaude } = require("./imageModeration");

// Layer 1 reuses the existing Google Safe Browsing integration (already wired
// synchronously into URL creation) instead of a second implementation of the
// same API call, and maps its shape onto the pipeline's SafeBrowsingResult shape.
async function checkSafeBrowsingLayer(url) {
  const result = await safeBrowsingService.checkUrl(url);
  if (result.skipped) {
    return {
      available: false,
      flagged: false,
      error: result.error || result.message,
    };
  }
  return {
    available: true,
    flagged: !result.isSafe,
    threatTypes: (result.threats || []).map((t) => t.threatType),
  };
}

// Firecrawl scraper
async function scrapeWithFirecrawl(url) {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return { available: false, error: "FIRECRAWL_API_KEY not set" };

  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
        timeout: 30000,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      const msg = `Firecrawl ${res.status}: ${errText.slice(0, 150)}`;
      logger.warn({ url, err: msg }, "Firecrawl scrape failed");
      return { available: false, error: msg };
    }

    const data = await res.json();
    const md = data?.data?.markdown ?? "";
    const meta = data?.data?.metadata ?? {};

    return {
      available: md.trim().length > 0,
      title: meta.title ?? "",
      description: meta.description ?? "",
      content: md.slice(0, 6000),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.warn({ url, err: msg }, "Firecrawl scrape threw");
    return { available: false, error: msg };
  }
}

// Claude: text evaluation
async function evaluateWithClaude(url, sbz, fc) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const knownLegitHost = isKnownLegitHost(url);

  const safebrowzBlock = sbz.available
    ? JSON.stringify(
        {
          verdict: sbz.verdict,
          confidence: sbz.score,
          threat_signals: sbz.flags,
        },
        null,
        2,
      )
    : `UNAVAILABLE (${sbz.error ?? "no data"})`;

  const fcBlock = fc.available
    ? `TITLE: ${fc.title || "(none)"}\nDESCRIPTION: ${fc.description || "(none)"}\nCONTENT:\n"""\n${fc.content}\n"""`
    : `UNAVAILABLE (${fc.error ?? "no content retrieved"})`;

  const prompt = buildPrompt(loadPrompt("text-moderation.prompt.txt"), {
    URL: url,
    KNOWN_LEGIT_HOST_STATUS: knownLegitHost
      ? "KNOWN-LEGITIMATE FILE-HOST / SSO DOMAIN (e.g. SharePoint, Google Drive, Dropbox, Microsoft login)"
      : "NOT a known-legitimate file-host domain (treat as an unknown/regular domain)",
    SAFEBROWZ_BLOCK: safebrowzBlock,
    FIRECRAWL_BLOCK: fcBlock,
    KNOWN_LEGIT_HOST_BOOL: String(knownLegitHost),
  });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 700,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    logger.error({ status: res.status, body: errText }, "Anthropic API error");
    throw new Error(`Anthropic API error ${res.status}: ${errText}`);
  }

  const data = await res.json();

  const textOutput = data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("\n");

  const match = textOutput.match(/\{[\s\S]*\}/);
  if (!match) {
    logger.error(
      { textOutput },
      "Could not parse JSON verdict from Claude response",
    );
    throw new Error("Could not parse verdict from Claude response");
  }

  const verdict = JSON.parse(match[0]);

  return {
    decision: verdict.decision,
    category: verdict.category,
    confidence: verdict.confidence,
    flags: verdict.flags,
    reason: verdict.reason,
    contentAccessed: verdict.content_accessed ?? fc.available,
    inputTokens: data.usage?.input_tokens ?? null,
    outputTokens: data.usage?.output_tokens ?? null,
  };
}

// Main URL pipeline — always call asynchronously in a background job, never
// awaited in the request handler a user is waiting on. Can take 5-30s.
async function moderateUrl(url) {
  logger.info({ url }, "Layer 1: Google Safe Browsing check");
  const sb = await checkSafeBrowsingLayer(url);

  if (sb.available && sb.flagged) {
    logger.info(
      { url, threatTypes: sb.threatTypes },
      "Safe Browsing flagged URL — blocking immediately",
    );
    return {
      decision: "BLOCK",
      category: "Known Threat",
      confidence: 100,
      flags: sb.threatTypes ?? ["safe_browsing_match"],
      reason: `Flagged by Google Safe Browsing (${(sb.threatTypes ?? []).join(", ")}). Pipeline stopped — SafeBrowz, Firecrawl, and Claude were skipped.`,
      contentAccessed: false,
      pipelineTrace: {
        safeBrowsing: {
          available: true,
          flagged: true,
          threatTypes: sb.threatTypes,
        },
        safebrowz: {
          available: false,
          verdict: null,
          score: null,
          flags: [],
          error: "skipped — Safe Browsing hard gate triggered",
        },
        firecrawl: {
          available: false,
          error: "skipped — Safe Browsing hard gate triggered",
        },
        claude: { ran: false },
      },
      inputTokens: null,
      outputTokens: null,
    };
  }

  logger.info(
    { url, sbAvailable: sb.available },
    "Safe Browsing clear — detecting URL type",
  );

  const detection = await detectImage(url);
  logger.info({ url, detectionKind: detection.kind }, "Image detection result");

  if (detection.kind !== "none") {
    // Image path
    logger.info(
      { url },
      "Image URL — running SafeBrowz + image fetch in parallel",
    );
    const [safebrowz, imagePayload] = await Promise.all([
      checkSafebrowz(url),
      resolveImage(detection),
    ]);

    const sbTrace = sb.available
      ? { available: true, flagged: false }
      : { available: false, error: sb.error };

    if (!imagePayload || !CLAUDE_VISION_TYPES.has(imagePayload.mediaType)) {
      const reason = !imagePayload
        ? "Image could not be fetched or exceeded size limit"
        : `Unsupported image type: ${imagePayload.mediaType}`;
      logger.warn(
        { url, reason },
        "Image analysis not possible — falling back to could_not_verify",
      );

      const safebrowzDanger =
        safebrowz.available && safebrowz.verdict === "danger";

      return {
        decision: safebrowzDanger ? "BLOCK" : "ALLOW",
        category: "Image",
        confidence: safebrowzDanger ? 70 : 30,
        flags: safebrowzDanger ? ["safebrowz_danger"] : ["could_not_verify"],
        reason: safebrowzDanger
          ? `Image analysis failed (${reason}) but SafeBrowz flagged the URL as danger.`
          : `Image analysis failed (${reason}). No reputation signals to block — allowing with low confidence.`,
        contentAccessed: false,
        pipelineTrace: {
          safeBrowsing: sbTrace,
          safebrowz,
          firecrawl: { available: false, error: reason },
          claude: { ran: false },
        },
        inputTokens: null,
        outputTokens: null,
      };
    }

    logger.info(
      {
        url,
        mediaType: imagePayload.mediaType,
        bytes: imagePayload.byteLength,
      },
      "Image fetched — running Claude image eval",
    );
    const claudeVerdict = await evaluateImageWithClaude(
      url,
      imagePayload,
      safebrowz,
      sb,
    );
    logger.info(
      {
        decision: claudeVerdict.decision,
        confidence: claudeVerdict.confidence,
      },
      "Image moderation complete",
    );

    return {
      ...claudeVerdict,
      pipelineTrace: {
        safeBrowsing: sbTrace,
        safebrowz,
        firecrawl: { available: true, contentLength: imagePayload.byteLength },
        claude: { ran: true },
      },
    };
  }

  // Text path
  logger.info({ url }, "Running SafeBrowz + Firecrawl in parallel");
  const [safebrowz, fc] = await Promise.all([
    checkSafebrowz(url),
    scrapeWithFirecrawl(url),
  ]);

  logger.info(
    {
      safebrowzAvailable: safebrowz.available,
      safebrowzVerdict: safebrowz.verdict,
      fcAvailable: fc.available,
      fcLength: fc.content?.length ?? 0,
    },
    "Parallel gather complete",
  );

  logger.info({ url }, "Running Claude");
  const claudeVerdict = await evaluateWithClaude(url, safebrowz, fc);
  logger.info(
    { decision: claudeVerdict.decision, confidence: claudeVerdict.confidence },
    "Moderation complete",
  );

  return {
    ...claudeVerdict,
    pipelineTrace: {
      safeBrowsing: sb.available
        ? { available: true, flagged: false }
        : { available: false, error: sb.error },
      safebrowz,
      firecrawl: fc.available
        ? { available: true, contentLength: fc.content?.length ?? 0 }
        : { available: false, error: fc.error },
      claude: { ran: true },
    },
  };
}

module.exports = { moderateUrl };
