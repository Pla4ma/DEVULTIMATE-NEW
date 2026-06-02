import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { requireProjectOwnership } from "../middleware/requireProjectOwnership";
import { sendWebhookNotification, detectWebhookProvider } from "../lib/webhooks";

export const webhooksTable = pgTable("webhooks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  projectId: uuid("project_id").notNull(),
  url: text("url").notNull(),
  provider: text("provider").notNull(),
  events: text("events").notNull().default("scan.completed"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

const router: IRouter = Router();

router.get("/:projectId", requireProjectOwnership, async (req, res) => {
  try {
    const projectId = req.params.projectId as string;
    const webhooks = await db.select().from(webhooksTable).where(eq(webhooksTable.projectId, projectId));
    res.json(webhooks);
  } catch (err) {
    req.log.error({ err }, "Failed to list webhooks");
    res.status(500).json({ error: "FETCH_FAILED", message: "Failed to list webhooks" });
  }
});

router.post("/:projectId", requireProjectOwnership, async (req, res) => {
  try {
    const projectId = req.params.projectId as string;
    const userId = req.user!.id;
    const { url, events } = req.body as { url?: string; events?: string };

    if (!url?.trim()) {
      res.status(400).json({ error: "VALIDATION_ERROR", message: "url is required" });
      return;
    }

    const provider = detectWebhookProvider(url);
    if (!provider) {
      res.status(400).json({ error: "VALIDATION_ERROR", message: "URL must be a valid Slack or Discord webhook URL" });
      return;
    }

    const testResult = await sendWebhookNotification(url, provider, {
      event: "scan.completed",
      projectName: "NOCTRA",
      projectId,
      score: null,
      prevScore: null,
      blockerCount: 0,
      gateSummary: "Webhook configured successfully",
      reportUrl: "",
    });

    if (!testResult) {
      res.status(400).json({ error: "WEBHOOK_TEST_FAILED", message: "Could not send test notification to this URL. Check that the webhook URL is correct." });
      return;
    }

    const [created] = await db
      .insert(webhooksTable)
      .values({ userId, projectId, url: url.trim(), provider, events: events ?? "scan.completed" })
      .returning();
    res.status(201).json(created);
  } catch (err) {
    req.log.error({ err }, "Failed to create webhook");
    res.status(500).json({ error: "CREATE_FAILED", message: "Failed to create webhook" });
  }
});

router.delete("/:projectId/:webhookId", requireProjectOwnership, async (req, res) => {
  try {
    const webhookId = req.params.webhookId as string;
    await db.delete(webhooksTable).where(eq(webhooksTable.id, webhookId));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete webhook");
    res.status(500).json({ error: "DELETE_FAILED", message: "Failed to delete webhook" });
  }
});

export default router;
