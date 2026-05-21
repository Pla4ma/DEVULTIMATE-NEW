import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { blockersTable } from "@workspace/db";
import { requireProjectOwnership } from "../middleware/requireProjectOwnership";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

const ALLOWED_UPDATE_FIELDS = new Set([
  "title", "severity", "category", "evidence", "whyItMatters",
  "recommendedFix", "acceptanceCriteria", "status",
]);

router.get("/:projectId", requireProjectOwnership, async (req, res) => {
  try {
    const projectId = req.params.projectId as string;
    const blockers = await db
      .select()
      .from(blockersTable)
      .where(eq(blockersTable.projectId, projectId))
      .orderBy(blockersTable.createdAt);
    res.json(blockers);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch blockers");
    res.status(500).json({ error: "FETCH_FAILED", message: "Failed to fetch blockers" });
  }
});

router.post("/:projectId", requireProjectOwnership, async (req, res) => {
  try {
    const projectId = req.params.projectId as string;
    const blocker = req.body as {
      title: string;
      severity?: string;
      category?: string;
      evidence?: string;
      whyItMatters?: string;
      recommendedFix?: string;
      acceptanceCriteria?: string;
      status?: string;
      scanId?: string;
    };

    if (!blocker.title?.trim()) {
      res.status(400).json({ error: "VALIDATION_ERROR", message: "title is required" });
      return;
    }
    if (blocker.title.trim().length > 500) {
      res.status(400).json({ error: "VALIDATION_ERROR", message: "title exceeds 500 characters" });
      return;
    }

    const userId = req.user!.id;

    const [created] = await db
      .insert(blockersTable)
      .values({
        userId,
        projectId,
        title: blocker.title.trim(),
        severity: blocker.severity ?? "P1",
        category: blocker.category ?? "code",
        evidence: blocker.evidence ?? null,
        whyItMatters: blocker.whyItMatters ?? null,
        recommendedFix: blocker.recommendedFix ?? null,
        acceptanceCriteria: blocker.acceptanceCriteria ?? null,
        status: blocker.status ?? "open",
        scanId: blocker.scanId ?? null,
      })
      .returning();

    res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, "Failed to create blocker");
    res.status(500).json({ error: "CREATE_FAILED", message: "Failed to create blocker" });
  }
});

router.patch("/:projectId/:blockerId", requireProjectOwnership, async (req, res) => {
  try {
    const projectId = req.params.projectId as string;
    const blockerId = req.params.blockerId as string;
    const updates = req.body as Record<string, unknown>;

    const filtered: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of Object.keys(updates)) {
      if (ALLOWED_UPDATE_FIELDS.has(key)) {
        filtered[key] = updates[key];
      }
    }

    const [updated] = await db
      .update(blockersTable)
      .set(filtered)
      .where(and(eq(blockersTable.id, blockerId), eq(blockersTable.projectId, projectId)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "NOT_FOUND", message: "Blocker not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update blocker");
    res.status(500).json({ error: "UPDATE_FAILED", message: "Failed to update blocker" });
  }
});

router.delete("/:projectId/:blockerId", requireProjectOwnership, async (req, res) => {
  try {
    const projectId = req.params.projectId as string;
    const blockerId = req.params.blockerId as string;
    await db
      .delete(blockersTable)
      .where(and(eq(blockersTable.id, blockerId), eq(blockersTable.projectId, projectId)));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete blocker");
    res.status(500).json({ error: "DELETE_FAILED", message: "Failed to delete blocker" });
  }
});

export default router;
