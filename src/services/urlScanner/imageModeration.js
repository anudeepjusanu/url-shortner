const { logger } = require("./logger");
const { loadPrompt, buildPrompt, CLAUDE_MODEL } = require("./moderationShared");

// Claude: image (multimodal) evaluation
async function evaluateImageWithClaude(url, image, sbz, sb) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

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

  const sbBlock = sb.available
    ? sb.flagged
      ? `FLAGGED — ${(sb.threatTypes ?? []).join(", ")}`
      : "Clear"
    : `UNAVAILABLE (${sb.error ?? "no data"})`;

  const prompt = buildPrompt(loadPrompt("image-moderation.prompt.txt"), {
    URL: url,
    IMAGE_SOURCE_URL: image.sourceUrl,
    SAFE_BROWSING_BLOCK: sbBlock,
    SAFEBROWZ_BLOCK: safebrowzBlock,
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
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: image.mediaType,
                data: image.base64,
              },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    logger.error(
      { status: res.status, body: errText },
      "Anthropic image API error",
    );
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
      "Could not parse JSON verdict from Claude image response",
    );
    throw new Error("Could not parse verdict from Claude image response");
  }

  const verdict = JSON.parse(match[0]);

  return {
    decision: verdict.decision,
    category: verdict.category,
    confidence: verdict.confidence,
    flags: verdict.flags,
    reason: verdict.reason,
    contentAccessed: true,
    inputTokens: data.usage?.input_tokens ?? null,
    outputTokens: data.usage?.output_tokens ?? null,
  };
}

module.exports = { evaluateImageWithClaude };
