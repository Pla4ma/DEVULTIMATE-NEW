import { pool, db } from "@workspace/db";
import { sendWebhookNotification } from "./webhooks";
import { logger } from "./logger";

export async function notifyWebhooks(
  projectId: string,
  projectName: string,
  score: number | null,
  prevScore: number | null,
  blockerCount: number,
  gateSummary: string,
  reportUrl: string
): Promise<void> {
  try {
    const result = await pool.query(
      "SELECT url, provider FROM webhooks WHERE project_id = $1 AND events LIKE '%scan.completed%'",
      [projectId]
    );

    const rows = result.rows as Array<{ url: string; provider: string }> | undefined;
    if (!rows || rows.length === 0) return;

    const payload = {
      event: "scan.completed" as const,
      projectName,
      projectId,
      score,
      prevScore,
      blockerCount,
      gateSummary,
      reportUrl,
    };

    await Promise.allSettled(
      rows.map((webhook) =>
        sendWebhookNotification(webhook.url, webhook.provider as "slack" | "discord", payload)
          .then((ok) => {
            if (!ok) logger.warn({ projectId, webhook }, "Webhook delivery failed");
          })
      )
    );
  } catch (err) {
    logger.error({ err, projectId }, "Failed to send webhook notifications");
  }
}
