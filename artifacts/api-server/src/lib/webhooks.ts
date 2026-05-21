import { logger } from "./logger";

interface WebhookPayload {
  event: "scan.completed" | "score.changed" | "blocker.added";
  projectName: string;
  projectId: string;
  score: number | null;
  prevScore: number | null;
  blockerCount: number;
  gateSummary: string;
  reportUrl: string;
}

async function sendToSlack(webhookUrl: string, payload: WebhookPayload): Promise<boolean> {
  const blocks: Record<string, unknown>[] = [
    {
      type: "header",
      text: { type: "plain_text", text: `🚀 ${payload.projectName} — Scan Complete`, emoji: true },
    },
  ];

  if (payload.score != null) {
    const emoji = payload.score >= 70 ? "🟢" : payload.score >= 40 ? "🟡" : "🔴";
    blocks.push({
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Score:* ${emoji} ${payload.score}/100` },
        { type: "mrkdwn", text: `*Blockers:* ${payload.blockerCount}` },
      ],
    });
  }

  if (payload.prevScore != null && payload.score != null) {
    const delta = payload.score - payload.prevScore;
    const direction = delta > 0 ? "↑ +" : delta < 0 ? "↓ " : "→ ";
    blocks.push({
      type: "context",
      elements: [{ type: "mrkdwn", text: `Score change: ${direction}${Math.abs(delta)} points` }],
    });
  }

  blocks.push({
    type: "actions",
    elements: [
      {
        type: "button",
        text: { type: "plain_text", text: "View Report", emoji: true },
        url: payload.reportUrl,
      },
    ],
  });

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
    });
    if (!res.ok) {
      logger.warn({ status: res.status, webhookUrl }, "Slack webhook returned error");
      return false;
    }
    return true;
  } catch (err) {
    logger.error({ err, webhookUrl }, "Failed to send Slack webhook");
    return false;
  }
}

async function sendToDiscord(webhookUrl: string, payload: WebhookPayload): Promise<boolean> {
  const color = payload.score == null ? 0x4a5268
    : payload.score >= 70 ? 0x34d399
    : payload.score >= 40 ? 0xf59e0b
    : 0xf43f5e;

  const embed: Record<string, unknown> = {
    title: `🚀 ${payload.projectName} — Scan Complete`,
    color,
    fields: [],
    timestamp: new Date().toISOString(),
  };

  if (payload.score != null) {
    (embed.fields as Record<string, unknown>[]).push(
      { name: "Score", value: `${payload.score}/100`, inline: true },
      { name: "Blockers", value: String(payload.blockerCount), inline: true },
    );
  }

  if (payload.prevScore != null && payload.score != null) {
    const delta = payload.score - payload.prevScore;
    const direction = delta > 0 ? `+${delta}` : String(delta);
    (embed.fields as Record<string, unknown>[]).push({
      name: "Score Change",
      value: `${direction} points`,
      inline: true,
    });
  }

  (embed.fields as Record<string, unknown>[]).push({
    name: "Gates",
    value: payload.gateSummary || "No gates evaluated",
    inline: false,
  });

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
    if (!res.ok) {
      logger.warn({ status: res.status, webhookUrl }, "Discord webhook returned error");
      return false;
    }
    return true;
  } catch (err) {
    logger.error({ err, webhookUrl }, "Failed to send Discord webhook");
    return false;
  }
}

export async function sendWebhookNotification(
  webhookUrl: string,
  provider: "slack" | "discord",
  payload: WebhookPayload
): Promise<boolean> {
  if (provider === "slack") return sendToSlack(webhookUrl, payload);
  if (provider === "discord") return sendToDiscord(webhookUrl, payload);
  return false;
}

export function detectWebhookProvider(url: string): "slack" | "discord" | null {
  if (url.includes("hooks.slack.com")) return "slack";
  if (url.includes("discord.com/api/webhooks")) return "discord";
  return null;
}
