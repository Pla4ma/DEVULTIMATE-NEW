// retention.ts — Retention loop intelligence from all report payloads
// Pure utility: no React, no side effects.

import type { ReportSummary } from "./intelligence";

export interface RetentionIntelligence {
  retentionScore: number;
  coreHabit: string;
  trigger: string;
  userAction: string;
  reward: string;
  investment: string;
  returnReason: string;
  loopWeakness: string;
  featuresThatImproveRetention: string[];
  metricsToTrack: string[];
  retentionTasks: Array<{ title: string; priority: "critical" | "high" | "medium" }>;
}

function extractData(report: ReportSummary): Record<string, unknown> {
  const p = report.payload as Record<string, unknown> | null;
  if (!p) return {};
  return ((p.data ?? p) as Record<string, unknown>) ?? {};
}

function getScore(report: ReportSummary): number {
  if (typeof report.score === "number") return report.score;
  const d = extractData(report);
  const keys = ["signal_score", "reality_score", "proof_score", "health_score", "mvp_score", "swarm_score", "launch_score", "score"];
  for (const k of keys) {
    if (typeof d[k] === "number") return d[k] as number;
  }
  return 0;
}

export function analyzeRetention(reports: ReportSummary[]): RetentionIntelligence {
  const byTool = new Map<string, ReportSummary>();
  for (const r of [...reports].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )) {
    if (!byTool.has(r.tool)) byTool.set(r.tool, r);
  }

  const idea = byTool.get("idea");
  const swarm = byTool.get("swarm");
  const mvp = byTool.get("mvp");
  const reality = byTool.get("reality");

  const ideaData = idea ? extractData(idea) : {};
  const swarmData = swarm ? extractData(swarm) : {};
  const mvpData = mvp ? extractData(mvp) : {};
  const realityData = reality ? extractData(reality) : {};

  const productDesc = String(
    ideaData.idea ?? ideaData.description ?? ideaData.product ?? idea?.title ?? "your product"
  ).toLowerCase();

  const swarmScore = swarm ? getScore(swarm) : 0;
  const mvpScore = mvp ? getScore(mvp) : 0;
  const ideaScore = idea ? getScore(idea) : 0;

  // Extract retention signals from swarm
  const retentionRate = typeof swarmData.retention_rate === "number" ? swarmData.retention_rate : null;
  const churnReasons = Array.isArray(swarmData.churn_reasons)
    ? (swarmData.churn_reasons as string[])
    : [];

  // Determine product category for tailored retention advice
  const isAIProduct = productDesc.includes("ai") || productDesc.includes("gpt") || productDesc.includes("model") || productDesc.includes("llm");
  const isSocialProduct = productDesc.includes("social") || productDesc.includes("community") || productDesc.includes("connect");
  const isProductivityTool = productDesc.includes("productivity") || productDesc.includes("workflow") || productDesc.includes("automation") || productDesc.includes("tool");
  const isMarketplace = productDesc.includes("marketplace") || productDesc.includes("platform");

  // Core habit
  let coreHabit = "Using your product to solve a recurring problem at a predictable interval";
  if (isAIProduct) coreHabit = "Getting AI-powered insights or completions as part of a daily workflow";
  if (isSocialProduct) coreHabit = "Checking for social interactions, updates, and responses from the community";
  if (isProductivityTool) coreHabit = "Opening your tool as part of a regular work routine to complete recurring tasks";
  if (isMarketplace) coreHabit = "Returning to check listings, matches, or transactions as part of a purchasing or selling habit";

  // Trigger
  let trigger = "Internal: a recurring need or problem the user knows your product solves";
  if (isAIProduct) trigger = "External: a new task or question the user wants AI help with";
  if (isSocialProduct) trigger = "External: a notification or the fear of missing out on activity";
  if (isProductivityTool) trigger = "Internal: the start of a work session or appearance of a specific task type";
  if (isMarketplace) trigger = "External: price change notification, new listing match, or incoming message";

  // User action
  let userAction = "Performing the core action that delivers value (the reason they signed up)";
  if (isAIProduct) userAction = "Prompting the AI and reviewing the output for insights or completions";
  if (isSocialProduct) userAction = "Posting, reacting, or responding to other users";
  if (isProductivityTool) userAction = "Completing a task, running an automation, or processing a workflow item";
  if (isMarketplace) userAction = "Browsing, messaging, or transacting with another party";

  // Reward
  let reward = "Immediate relief of the core pain point — the problem is solved, the task is done";
  if (isAIProduct) reward = "Surprising and useful AI output that saves time or generates new ideas";
  if (isSocialProduct) reward = "Social validation — likes, responses, new connections, and a sense of belonging";
  if (isProductivityTool) reward = "Visible progress — tasks completed, time saved, workflow improved";
  if (isMarketplace) reward = "A successful match, sale, or purchase — the economic transaction completes";

  // Investment
  let investment = "User data, preferences, history, and created content that would be lost if they leave";
  if (isAIProduct) investment = "Trained context, saved conversations, and AI memory that improves with use";
  if (isSocialProduct) investment = "Followers, posts, reputation, and social graph built over time";
  if (isProductivityTool) investment = "Saved workflows, templates, integrations, and historical data";
  if (isMarketplace) investment = "Built reputation, reviews, listings, and transaction history";

  // Return reason
  let returnReason = "The recurring need returns — the habit loop is reinforced by regular pain";
  if (isAIProduct) returnReason = "The next task appears — AI assistance is now part of their standard workflow";
  if (isSocialProduct) returnReason = "New social activity — notifications and FOMO pull the user back";
  if (isProductivityTool) returnReason = "The next work session begins — your tool is now part of their opening routine";
  if (isMarketplace) returnReason = "New listing, new offer, or follow-up message requires attention";

  // Loop weakness
  let loopWeakness = "No clear mechanism to strengthen investment over time — users can leave without losing value";
  if (retentionRate !== null && retentionRate < 40) {
    loopWeakness = `Swarm Field simulated ${retentionRate}% retention rate — users are churning before forming a habit (takes ~7 sessions minimum)`;
  } else if (churnReasons.length > 0) {
    loopWeakness = `Swarm churn reasons: ${churnReasons.slice(0, 2).join("; ")}`;
  } else if (isAIProduct) {
    loopWeakness = "AI products are easily replaced by competitors — the habit must be tied to personal data or workflow integration, not just AI quality";
  } else if (isSocialProduct) {
    loopWeakness = "Social products face the cold-start problem — retention is weak until a critical mass of active users exists";
  }

  // Features that improve retention
  const featuresThatImproveRetention: string[] = [];
  if (isAIProduct) {
    featuresThatImproveRetention.push("Persistent AI memory that remembers past conversations and user preferences");
    featuresThatImproveRetention.push("Weekly digest or summary email showing what the AI has learned about the user");
    featuresThatImproveRetention.push("Progress tracking — show users how the AI has improved their output over time");
  } else if (isSocialProduct) {
    featuresThatImproveRetention.push("Smart notification system that surfaces genuinely relevant activity (not noise)");
    featuresThatImproveRetention.push("Streak or consistency features that reward regular participation");
    featuresThatImproveRetention.push("Personalized feed that improves with each visit (reinforces investment loop)");
  } else if (isProductivityTool) {
    featuresThatImproveRetention.push("Progress dashboard showing cumulative time saved, tasks completed, or output generated");
    featuresThatImproveRetention.push("Team collaboration features that create social accountability and switching costs");
    featuresThatImproveRetention.push("Integration with tools already in the user's workflow (Slack, Notion, GitHub, etc.)");
  } else {
    featuresThatImproveRetention.push("Personal data or history that accumulates value over time");
    featuresThatImproveRetention.push("Progress indicators that show how the product is improving their life or work");
    featuresThatImproveRetention.push("Network effects — features that become more valuable as more users join");
  }
  featuresThatImproveRetention.push("Email re-engagement at the right moment (not generic drip — triggered by user behavior)");
  featuresThatImproveRetention.push("Milestone celebrations that reinforce the habit at key retention checkpoints (day 1, 7, 30)");

  // Metrics to track
  const metricsToTrack: string[] = [
    "Day 1 retention: % of users who return within 24 hours of first use",
    "Day 7 retention: % of users who return within 7 days",
    "Day 30 retention: % of users who return within 30 days (product-market fit signal)",
    "Session frequency: average sessions per week per active user",
    "Core action completion rate: % of sessions where the user completes the primary action",
    "Churn trigger: the last action taken before users stop returning",
    "Habit formation indicator: % of users with 3+ sessions in their first week",
  ];

  if (isAIProduct) {
    metricsToTrack.push("AI output satisfaction rate: % of AI responses rated helpful or used by the user");
  }
  if (isSocialProduct) {
    metricsToTrack.push("Content creation rate: % of active users who produce (not just consume) content");
  }

  // Retention score
  const baseScore = Math.max(
    0,
    (retentionRate ?? 45) * 0.6 +
      (swarmScore > 0 ? swarmScore * 0.2 : 5) +
      (ideaScore > 0 ? ideaScore * 0.1 : 3) +
      (mvpScore > 0 ? mvpScore * 0.1 : 3)
  );
  const retentionScore = Math.min(100, Math.round(baseScore));

  // Tasks
  const retentionTasks: RetentionIntelligence["retentionTasks"] = [];
  if (!swarm) {
    retentionTasks.push({ title: "Run Swarm Field to simulate retention rate and churn reasons", priority: "critical" });
  }
  if (retentionRate !== null && retentionRate < 40) {
    retentionTasks.push({ title: "Redesign core action to be faster and more rewarding (session quality fix)", priority: "critical" });
  }
  retentionTasks.push({ title: "Implement Day 1 / Day 7 / Day 30 retention tracking in analytics", priority: "high" });
  retentionTasks.push({ title: "Design the investment mechanic — what does the user build or accumulate over time?", priority: "high" });
  retentionTasks.push({ title: "Set up re-engagement email triggered by 3-day inactivity", priority: "medium" });
  retentionTasks.push({ title: "Build a streak or consistency indicator to reinforce the habit", priority: "medium" });

  return {
    retentionScore,
    coreHabit,
    trigger,
    userAction,
    reward,
    investment,
    returnReason,
    loopWeakness,
    featuresThatImproveRetention,
    metricsToTrack,
    retentionTasks,
  };
}
