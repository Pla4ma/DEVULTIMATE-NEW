import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";
import { generateTasksFromPayload } from "../lib/task-generator/index";

const router: IRouter = Router();

router.post("/generate", async (req, res) => {
  try {
    const { reportId, tool, payload, projectId } = req.body as {
      reportId?: string;
      tool?: string;
      projectId?: string;
      payload?: unknown;
    };

    if (!reportId || !tool) {
      res.status(400).json({ error: "BAD_REQUEST", message: "reportId and tool are required" });
      return;
    }

    if (typeof reportId !== "string" || typeof tool !== "string") {
      res.status(400).json({ error: "BAD_REQUEST", message: "reportId and tool must be strings" });
      return;
    }

    logger.info({ reportId, tool, projectId }, "Generating tasks from report");

    const tasks = generateTasksFromPayload({ id: reportId, tool, payload, project_id: projectId });

    if (tasks.length === 0) {
      res.json({ count: 0, tasks: [], message: "No tasks could be generated from this report" });
      return;
    }

    res.json({ count: tasks.length, tasks });
  } catch (err) {
    logger.error({ err }, "Task generation failed");
    res.status(500).json({ error: "TASK_GEN_FAILED", message: "Task generation failed" });
  }
});

export default router;
