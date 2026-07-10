import { Router, type IRouter } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db, scansTable } from "@workspace/db";
import {
  CreateScanBody,
  GetScanParams,
  GetScanResponse,
  ListScansQueryParams,
  ListScansResponse,
  GetStatsResponse,
} from "@workspace/api-zod";
import { moderateUrl } from "../lib/moderation";

const router: IRouter = Router();

router.get("/scans", async (req, res): Promise<void> => {
  const parsed = ListScansQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { limit = 50, offset = 0, decision } = parsed.data;

  let query = db
    .select()
    .from(scansTable)
    .orderBy(desc(scansTable.scannedAt))
    .limit(limit)
    .offset(offset);

  if (decision) {
    query = query.where(eq(scansTable.decision, decision));
  }

  const scans = await query;
  res.json(ListScansResponse.parse(scans));
});

router.post("/scans", async (req, res): Promise<void> => {
  const parsed = CreateScanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { url } = parsed.data;

  req.log.info({ url }, "Starting URL moderation scan");

  let verdict;
  try {
    verdict = await moderateUrl(url);
  } catch (err) {
    req.log.error({ err, url }, "Moderation failed");
    res.status(502).json({ error: "Failed to analyze URL. Please try again." });
    return;
  }

  const [scan] = await db
    .insert(scansTable)
    .values({
      url,
      decision: verdict.decision,
      category: verdict.category,
      confidence: verdict.confidence,
      flags: verdict.flags,
      reason: verdict.reason,
      contentAccessed: verdict.contentAccessed,
      pipelineTrace: verdict.pipelineTrace,
      inputTokens: verdict.inputTokens,
      outputTokens: verdict.outputTokens,
    })
    .returning();

  req.log.info(
    { scanId: scan.id, decision: verdict.decision },
    "Scan complete",
  );
  res.status(201).json(GetScanResponse.parse(scan));
});

router.get("/scans/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetScanParams.safeParse({ id: raw });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid scan ID" });
    return;
  }

  const [scan] = await db
    .select()
    .from(scansTable)
    .where(eq(scansTable.id, parsed.data.id));

  if (!scan) {
    res.status(404).json({ error: "Scan not found" });
    return;
  }

  res.json(GetScanResponse.parse(scan));
});

router.get("/stats", async (_req, res): Promise<void> => {
  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      allowed: sql<number>`count(*) filter (where decision = 'ALLOW')::int`,
      blocked: sql<number>`count(*) filter (where decision = 'BLOCK')::int`,
    })
    .from(scansTable);

  const topCategories = await db
    .select({
      category: scansTable.category,
      count: sql<number>`count(*)::int`,
    })
    .from(scansTable)
    .groupBy(scansTable.category)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

  const recentScans = await db
    .select()
    .from(scansTable)
    .orderBy(desc(scansTable.scannedAt))
    .limit(10);

  res.json(
    GetStatsResponse.parse({
      total: totals?.total ?? 0,
      allowed: totals?.allowed ?? 0,
      blocked: totals?.blocked ?? 0,
      topCategories,
      recentScans,
    }),
  );
});

export default router;
