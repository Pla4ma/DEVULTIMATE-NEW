import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";
import { db, projectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function requireProjectOwnership(req: Request, res: Response, next: NextFunction): Promise<void> {
  const projectId = req.params.projectId || req.body?.projectId;
  if (!projectId) {
    res.status(400).json({ error: "BAD_REQUEST", message: "Project ID is required" });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Authentication required" });
    return;
  }

  try {
    const [project] = await db.select().from(projectsTable).where(
      eq(projectsTable.id, projectId)
    ).limit(1);

    if (!project) {
      res.status(404).json({ error: "NOT_FOUND", message: "Project not found" });
      return;
    }

    if (project.userId !== req.user.id) {
      res.status(403).json({ error: "FORBIDDEN", message: "You do not own this project" });
      return;
    }

    next();
  } catch (err) {
    logger.error({ err, projectId, userId: req.user.id }, "requireProjectOwnership: database error");
    res.status(500).json({ error: "INTERNAL_ERROR", message: "Failed to verify project ownership" });
  }
}
