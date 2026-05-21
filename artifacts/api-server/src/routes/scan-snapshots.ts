import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { scanSnapshotsTable } from "@workspace/db";
import { requireProjectOwnership } from "../middleware/requireProjectOwnership";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/:projectId", requireProjectOwnership, async (req, res) => {
  try {
    const projectId = req.params.projectId as string;
    const snapshots = await db
      .select()
      .from(scanSnapshotsTable)
      .where(eq(scanSnapshotsTable.projectId, projectId))
      .orderBy(desc(scanSnapshotsTable.createdAt));
    res.json(snapshots);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch scan snapshots");
    res.status(500).json({ error: "FETCH_FAILED", message: "Failed to fetch scan snapshots" });
  }
});

router.get("/:projectId/latest", requireProjectOwnership, async (req, res) => {
  try {
    const projectId = req.params.projectId as string;
    const [latest] = await db
      .select()
      .from(scanSnapshotsTable)
      .where(eq(scanSnapshotsTable.projectId, projectId))
      .orderBy(desc(scanSnapshotsTable.createdAt))
      .limit(1);
    res.json(latest ?? null);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch latest scan snapshot");
    res.status(500).json({ error: "FETCH_FAILED", message: "Failed to fetch latest scan snapshot" });
  }
});

router.get("/:projectId/delta", requireProjectOwnership, async (req, res) => {
  try {
    const projectId = req.params.projectId as string;
    const snapshots = await db
      .select()
      .from(scanSnapshotsTable)
      .where(eq(scanSnapshotsTable.projectId, projectId))
      .orderBy(desc(scanSnapshotsTable.createdAt))
      .limit(2);
    if (snapshots.length === 0) {
      res.json({ previous: null, current: null, delta: null });
      return;
    }
    const current = snapshots[0]!;
    const previous = snapshots[1] ?? null;
    const currentBlockers = (current.blockers as Array<{ id: string; status: string }>) ?? [];
    const previousBlockers = previous ? (previous.blockers as Array<{ id: string; status: string }>) ?? [] : [];
    const previousIds = new Set(previousBlockers.map((b) => b.id));
    const currentIds = new Set(currentBlockers.map((b) => b.id));
    const fixedBlockers = previousBlockers.filter((b) => !currentIds.has(b.id) || b.status === "fixed");
    const newBlockers = currentBlockers.filter((b) => !previousIds.has(b.id));
    const unresolvedBlockers = currentBlockers.filter((b) => b.status === "open" || b.status === "in_progress");
    const scoreDelta = previous ? (current.score ?? 0) - (previous.score ?? 0) : 0;
    res.json({
      current,
      previous,
      delta: {
        scoreDelta,
        fixedBlockers: fixedBlockers.length,
        newBlockers: newBlockers.length,
        unresolvedBlockers: unresolvedBlockers.length,
        isFirstScan: !previous,
        scoreImproved: scoreDelta > 0,
        scoreDeclined: scoreDelta < 0,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to compute scan delta");
    res.status(500).json({ error: "DELTA_FAILED", message: "Failed to compute scan delta" });
  }
});

router.post("/:projectId", requireProjectOwnership, async (req, res) => {
  try {
    const projectId = req.params.projectId as string;
    const userId = req.user!.id;
    const snapshot = req.body as {
      reportId?: string;
      score?: number;
      blockers?: unknown[];
      staticSignals?: Record<string, unknown>;
      generatedTasks?: unknown[];
      evidenceIndex?: unknown[];
      summary?: string;
    };
    const [created] = await db
      .insert(scanSnapshotsTable)
      .values({
        userId,
        projectId,
        reportId: snapshot.reportId ?? null,
        score: snapshot.score ?? null,
        blockers: snapshot.blockers ?? [],
        staticSignals: snapshot.staticSignals ?? {},
        generatedTasks: snapshot.generatedTasks ?? [],
        evidenceIndex: snapshot.evidenceIndex ?? [],
        summary: snapshot.summary ?? null,
      })
      .returning();
    res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, "Failed to create scan snapshot");
    res.status(500).json({ error: "CREATE_FAILED", message: "Failed to create scan snapshot" });
  }
});

export default router;
