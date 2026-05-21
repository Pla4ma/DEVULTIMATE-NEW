import { Router, type IRouter } from "express";
import multer from "multer";
import { scanZip } from "../lib/repo-scanner";
import { evaluateLaunchGates } from "../lib/launch-gates";
import { requireUploadQuota } from "../lib/usage-quota";
import { notifyWebhooks } from "../lib/notify-webhooks";
import { db } from "@workspace/db";
import { projectsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

const router: IRouter = Router();

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const updatableFields = new Set(["name", "idea", "stage", "status", "meta", "launchReadinessScore"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    const isZipName = file.originalname.toLowerCase().endsWith(".zip");
    if (isZipName) { cb(null, true); } else { cb(new Error("Only .zip files are accepted")); }
  },
});

// List all projects for the current user
router.get("/", async (req, res) => {
  try {
    const userId = req.user!.id;
    const projects = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.userId, userId))
      .orderBy(projectsTable.updatedAt);
    res.json(projects);
  } catch (err) {
    req.log.error({ err }, "Failed to list projects");
    res.status(500).json({ error: "FETCH_FAILED", message: "Failed to list projects" });
  }
});

// Get single project
router.get("/:id", async (req, res) => {
  try {
    const userId = req.user!.id;
    const [project] = await db
      .select()
      .from(projectsTable)
      .where(and(eq(projectsTable.id, req.params.id as string), eq(projectsTable.userId, userId)));
    if (!project) {
      res.status(404).json({ error: "NOT_FOUND", message: "Project not found" });
      return;
    }
    res.json(project);
  } catch (err) {
    req.log.error({ err }, "Failed to get project");
    res.status(500).json({ error: "FETCH_FAILED", message: "Failed to get project" });
  }
});

// Create project
router.post("/", async (req, res) => {
  try {
    const userId = req.user!.id;
    const { name, idea, stage } = req.body as { name?: string; idea?: string; stage?: string };
    if (!name?.trim()) {
      res.status(400).json({ error: "VALIDATION_ERROR", message: "name is required" });
      return;
    }
    if (name.trim().length > 200) {
      res.status(400).json({ error: "VALIDATION_ERROR", message: "name exceeds 200 characters" });
      return;
    }
    const [created] = await db
      .insert(projectsTable)
      .values({ userId, name: name.trim(), idea: idea?.trim() ?? null, stage: stage ?? "IDEA" })
      .returning();
    res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, "Failed to create project");
    res.status(500).json({ error: "CREATE_FAILED", message: "Failed to create project" });
  }
});

// Update project (including lifecycle stage transitions)
router.patch("/:id", async (req, res) => {
  try {
    const userId = req.user!.id;
    const body = req.body as Record<string, unknown>;
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    for (const [key, value] of Object.entries(body)) {
      if (updatableFields.has(key)) {
        patch[key] = value;
      }
    }
    const [updated] = await db
      .update(projectsTable)
      .set(patch)
      .where(and(eq(projectsTable.id, req.params.id as string), eq(projectsTable.userId, userId)))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "NOT_FOUND", message: "Project not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to update project");
    res.status(500).json({ error: "UPDATE_FAILED", message: "Failed to update project" });
  }
});

// Delete project
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.user!.id;
    await db
      .delete(projectsTable)
      .where(and(eq(projectsTable.id, req.params.id as string), eq(projectsTable.userId, userId)));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete project");
    res.status(500).json({ error: "DELETE_FAILED", message: "Failed to delete project" });
  }
});

// Transition project stage
router.post("/:id/transition", async (req, res) => {
  try {
    const userId = req.user!.id;
    const { stage } = req.body as { stage: string };
    const validStages = ["IDEA", "PLANNED", "BUILDING", "SCANNED", "FIXING", "READY_SOON", "LAUNCH_READY", "LAUNCHED"];
    if (!validStages.includes(stage)) {
      res.status(400).json({ error: "INVALID_STAGE", message: `Invalid stage. Must be one of: ${validStages.join(", ")}` });
      return;
    }
    const [updated] = await db
      .update(projectsTable)
      .set({ stage, updatedAt: new Date() })
      .where(and(eq(projectsTable.id, req.params.id as string), eq(projectsTable.userId, userId)))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "NOT_FOUND", message: "Project not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to transition project stage");
    res.status(500).json({ error: "TRANSITION_FAILED", message: "Failed to transition project stage" });
  }
});

const TRANSITIONS: Record<string, string[]> = {
  IDEA: ["PLANNED", "BUILDING"],
  PLANNED: ["BUILDING", "SCANNED"],
  BUILDING: ["SCANNED", "FIXING"],
  SCANNED: ["FIXING", "READY_SOON"],
  FIXING: ["SCANNED", "READY_SOON"],
  READY_SOON: ["LAUNCH_READY"],
  LAUNCH_READY: ["LAUNCHED"],
  LAUNCHED: [],
};

router.post("/:id/transition-safe", async (req, res) => {
  try {
    const userId = req.user!.id;
    const { stage } = req.body as { stage: string };
    const [project] = await db
      .select({ stage: projectsTable.stage })
      .from(projectsTable)
      .where(and(eq(projectsTable.id, req.params.id as string), eq(projectsTable.userId, userId)));
    if (!project) {
      res.status(404).json({ error: "NOT_FOUND", message: "Project not found" });
      return;
    }
    const currentStage = project.stage;
    const allowedNext = TRANSITIONS[currentStage];
    if (!allowedNext?.includes(stage)) {
      res.status(400).json({ error: "INVALID_TRANSITION", message: `Cannot transition from ${currentStage} to ${stage}` });
      return;
    }
    const [updated] = await db
      .update(projectsTable)
      .set({ stage, updatedAt: new Date() })
      .where(and(eq(projectsTable.id, req.params.id as string), eq(projectsTable.userId, userId)))
      .returning();
    res.json(updated);
  } catch (err) {
    req.log.error({ err }, "Failed to transition project stage");
    res.status(500).json({ error: "TRANSITION_FAILED", message: "Failed to transition project stage" });
  }
});

// ZIP upload — standalone (no project required)
router.post("/scan",
  requireUploadQuota(),
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") { res.status(413).json({ error: "FILE_TOO_LARGE", message: "File exceeds 50MB limit" }); return; }
        res.status(400).json({ error: "UPLOAD_ERROR", message: err.message }); return;
      }
      if (err) { res.status(400).json({ error: "UPLOAD_ERROR", message: err.message }); return; }
      next();
    });
  },
  async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "ZIP invalid", message: "Please upload a .zip file." }); return;
    }
    const file = req.file;
    if (!file.originalname.toLowerCase().endsWith(".zip")) {
      res.status(400).json({ error: "ZIP invalid", message: "Only .zip files are accepted." }); return;
    }
    if (file.size > MAX_FILE_SIZE) {
      res.status(413).json({ error: "FILE_TOO_LARGE", message: "File exceeds 50MB limit." }); return;
    }
    if (file.size === 0) {
      res.status(400).json({ error: "ZIP invalid", message: "File is empty." }); return;
    }

    const warnings: string[] = [];

    try {
      const scan = await scanZip(file.buffer, file.originalname);
      const launchGates = evaluateLaunchGates(scan.staticSignals);

      res.json({
        scan: { ...scan, launchGates },
        summaryMarkdown: scan.summaryMarkdown,
        launchGates,
        evidenceIndex: scan.evidenceIndex,
        repoMap: scan.repoMap,
        warnings: [...warnings, ...scan.warnings],
        trimmed: scan.trimmed,
      });
    } catch (err) {
      req.log.error({ err }, "ZIP scan error");
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Invalid ZIP") || msg.includes("Bad local file") || msg.includes("is not a zip")) {
        res.status(400).json({ error: "ZIP invalid", message: "The file could not be read as a ZIP archive. Please upload a valid .zip file." });
      } else if (msg.includes("busy processing")) {
        res.status(503).json({ error: "SCAN_BUSY", message: msg });
      } else {
        res.status(500).json({ error: "Scan failed", message: msg });
      }
    }
  },
);

// ZIP upload — associated with a project
router.post("/:projectId/scan-upload",
  requireUploadQuota(),
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") { res.status(413).json({ error: "FILE_TOO_LARGE", message: "File exceeds 50MB limit" }); return; }
        res.status(400).json({ error: "UPLOAD_ERROR", message: err.message }); return;
      }
      if (err) { res.status(400).json({ error: "UPLOAD_ERROR", message: err.message }); return; }
      next();
    });
  },
  async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "ZIP invalid", message: "Please upload a .zip file." }); return;
    }
    const file = req.file;
    if (!file.originalname.toLowerCase().endsWith(".zip")) {
      res.status(400).json({ error: "ZIP invalid", message: "Only .zip files are accepted." }); return;
    }
    if (file.size > MAX_FILE_SIZE) {
      res.status(413).json({ error: "FILE_TOO_LARGE", message: "File exceeds 50MB limit." }); return;
    }
    if (file.size === 0) {
      res.status(400).json({ error: "ZIP invalid", message: "File is empty." }); return;
    }

    const warnings: string[] = [];
    const projectId = req.params.projectId as string;

    // Update project scan count and last scan timestamp
      await db.update(projectsTable)
      .set({ scanCount: sql`scan_count + 1`, lastScanAt: new Date() })
      .where(and(eq(projectsTable.id, projectId), eq(projectsTable.userId, req.user!.id)));

    try {
      const scan = await scanZip(file.buffer, file.originalname);
      const launchGates = evaluateLaunchGates(scan.staticSignals);

      // Fire webhooks asynchronously (don't block response)
      const prevScore = (await db.select({ launchReadinessScore: projectsTable.launchReadinessScore }).from(projectsTable).where(eq(projectsTable.id, projectId)).limit(1))[0]?.launchReadinessScore ?? null;
      const gatesSummary = launchGates.map((g: { name: string; status: string }) => `${g.name}:${g.status}`).join(", ");
      notifyWebhooks(projectId, file.originalname.replace(".zip", ""), null, prevScore, launchGates.filter((g: { status: string }) => g.status === "RED").length, gatesSummary, `${req.protocol}://${req.get("host")}/app/projects/${projectId}`).catch(() => {});

      res.json({
        scan: { ...scan, launchGates },
        summaryMarkdown: scan.summaryMarkdown,
        launchGates,
        evidenceIndex: scan.evidenceIndex,
        repoMap: scan.repoMap,
        warnings: [...warnings, ...scan.warnings],
        trimmed: scan.trimmed,
        projectId,
      });
    } catch (err) {
      req.log.error({ err }, "ZIP scan error");
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Invalid ZIP") || msg.includes("Bad local file") || msg.includes("is not a zip")) {
        res.status(400).json({ error: "ZIP invalid", message: "The file could not be read as a ZIP archive. Please upload a valid .zip file." });
      } else if (msg.includes("busy processing")) {
        res.status(503).json({ error: "SCAN_BUSY", message: msg });
      } else {
        res.status(500).json({ error: "Scan failed", message: msg });
      }
    }
  },
);

export default router;
