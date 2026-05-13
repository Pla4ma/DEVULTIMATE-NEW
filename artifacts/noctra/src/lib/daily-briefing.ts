// daily-briefing.ts — Deterministic founder daily briefing
// Pure utility: no React, no side effects.

import { computeToolCoverage, detectContradictions, type ReportSummary } from "./intelligence";

export interface DailyBriefing {
  greeting: string;
  currentFocus: string;
  topThreePriorities: string[];
  biggestRisk: string;
  easiestWin: string;
  oneThingToAvoid: string;
  recommendedWorkBlock: string;
  quickStats: { label: string; value: string | number; color: string }[];
  suggestedPrompt: string;
}

const TOOL_LABELS: Record<string, string> = {
  idea: "Idea Checker",
  reality: "Reality Compiler",
  proof: "Proof Engine",
  swarm: "Market Swarm",
  mvp: "MVP Planner",
  doctor: "Project Doctor",
  launch: "Launch Room",
};

const NEXT_TOOL_SEQUENCE = ["idea", "reality", "proof", "swarm", "mvp", "doctor", "launch"];

function getHourOfDay(): number {
  return new Date().getHours();
}

function getGreeting(): string {
  const h = getHourOfDay();
  if (h < 12) return "Good morning, Founder.";
  if (h < 17) return "Good afternoon, Founder.";
  return "Good evening, Founder.";
}

function getWorkBlock(): string {
  const h = getHourOfDay();
  if (h < 9) return "You're early — use this quiet window for deep analysis before standups.";
  if (h < 12) return "Prime focus window. Tackle the hardest validation task first.";
  if (h < 14) return "Post-lunch window — good for reviewing reports and running quick tools.";
  if (h < 17) return "Afternoon block — ideal for building, scanning, or running the Swarm.";
  if (h < 20) return "Evening session — review today's output, set tomorrow's priorities.";
  return "Late session — wrap up documentation and queue tomorrow's tasks.";
}

type TaskLike = {
  id: string;
  status: string;
  priority: string;
  title?: string;
};

type ProofSignalLike = { id: string };

export function generateDailyBriefing(params: {
  reports: ReportSummary[];
  tasks: TaskLike[];
  proofSignals: ProofSignalLike[];
}): DailyBriefing {
  const { reports, tasks, proofSignals } = params;

  const coverage = computeToolCoverage(reports);
  const contradictions = detectContradictions(reports);

  // Sort reports newest-first for each tool
  const byTool = new Map<string, ReportSummary>();
  for (const r of [...reports].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )) {
    if (!byTool.has(r.tool)) byTool.set(r.tool, r);
  }

  const scores: Record<string, number> = {};
  for (const [tool, report] of byTool.entries()) {
    scores[tool] = typeof report.score === "number" ? report.score : 0;
  }

  // Open critical/high tasks
  const openCritical = tasks.filter((t) => t.status !== "completed" && t.priority === "critical");
  const openHigh = tasks.filter((t) => t.status !== "completed" && t.priority === "high");
  const completedToday = tasks.filter((t) => t.status === "completed").length;
  const openTotal = tasks.filter((t) => t.status !== "completed").length;

  // Determine current focus
  let currentFocus = "No active focus — start by running your first intelligence tool.";
  const nextTool = NEXT_TOOL_SEQUENCE.find((t) => !coverage.covered.includes(t));
  if (openCritical.length > 0) {
    currentFocus = `${openCritical.length} critical task${openCritical.length > 1 ? "s" : ""} need your attention now — these are blocking progress.`;
  } else if (contradictions.filter((c) => c.severity === "high").length > 0) {
    currentFocus = "High-severity intelligence contradictions detected — your reports are telling conflicting stories.";
  } else if (nextTool) {
    currentFocus = `Next intelligence gap: run ${TOOL_LABELS[nextTool] ?? nextTool} to eliminate a key unknown.`;
  } else if (scores.launch && scores.launch < 60) {
    currentFocus = `Launch readiness is at ${scores.launch}/100 — resolve blockers before pushing to production.`;
  } else if (scores.doctor && scores.doctor < 60) {
    currentFocus = `Project Doctor flagged ${scores.doctor}/100 — code health needs attention before shipping.`;
  } else if (proofSignals.length < 3) {
    currentFocus = "Proof signals are thin — get more validation evidence before committing to a build.";
  } else {
    currentFocus = "All systems look stable — focus on execution and shipping.";
  }

  // Top 3 priorities (deterministic, ordered by urgency)
  const priorities: string[] = [];

  if (openCritical.length > 0) {
    const taskTitle = (openCritical[0] as { title?: string }).title;
    priorities.push(`Resolve critical task: "${taskTitle ?? "critical blocker"}" — blocking all downstream work`);
  }
  if (contradictions.filter((c) => c.severity === "high").length > 0) {
    priorities.push(contradictions.find((c) => c.severity === "high")!.resolution);
  }
  if (nextTool && priorities.length < 3) {
    priorities.push(`Run ${TOOL_LABELS[nextTool] ?? nextTool} — eliminates a critical intelligence blind spot`);
  }
  if (scores.doctor && scores.doctor < 50 && priorities.length < 3) {
    priorities.push("Fix Project Doctor failures — launch with a failing health score causes production incidents");
  }
  if (proofSignals.length < 2 && priorities.length < 3) {
    priorities.push("Add at least 2 proof signals — building without evidence is the #1 startup killer");
  }
  if (openHigh.length > 0 && priorities.length < 3) {
    priorities.push(`${openHigh.length} high-priority task${openHigh.length > 1 ? "s" : ""} open — clear your queue to maintain velocity`);
  }
  if (priorities.length < 3) {
    priorities.push("Review your latest reports — look for score declines or new contradictions");
  }
  if (priorities.length < 3) {
    priorities.push("Ask Product Twin for a strategic synthesis across all your reports");
  }

  // Biggest risk
  let biggestRisk = "No critical risks detected — keep shipping.";
  const highContradiction = contradictions.find((c) => c.severity === "high");
  if (highContradiction) {
    biggestRisk = highContradiction.description;
  } else if (scores.doctor && scores.doctor < 50) {
    biggestRisk = `Project Doctor health score is ${scores.doctor}/100 — production launch with this score risks immediate failures.`;
  } else if (scores.reality && scores.reality < 40) {
    biggestRisk = `Reality Compiler score is ${scores.reality}/100 — core idea assumptions have not been validated.`;
  } else if (proofSignals.length === 0) {
    biggestRisk = "Zero proof signals — you have no external validation that anyone wants this product.";
  } else {
    biggestRisk = contradictions[0]?.description ?? "Monitor score trends — a declining tool score signals emerging risk.";
  }

  // Easiest win
  let easiestWin = "Run a quick tool to expand your intelligence coverage.";
  if (nextTool === "idea") {
    easiestWin = "Run Idea Checker — takes 2 minutes and unlocks the full intelligence pipeline.";
  } else if (nextTool === "reality") {
    easiestWin = "Run Reality Compiler — stress-test your top 3 assumptions in under 5 minutes.";
  } else if (openCritical.length === 0 && openHigh.length > 0) {
    const taskTitle = (openHigh[0] as { title?: string }).title;
    easiestWin = `Complete "${taskTitle ?? "high priority task"}" — high impact, already queued.`;
  } else if (proofSignals.length > 0 && proofSignals.length < 5) {
    easiestWin = "Add one more proof signal — each signal meaningfully increases your proof score.";
  } else if (coverage.percentage === 100) {
    easiestWin = "Re-run any tool with updated context — your thinking has evolved since the last run.";
  } else if (nextTool) {
    easiestWin = `Run ${TOOL_LABELS[nextTool] ?? nextTool} — next step in your intelligence journey.`;
  }

  // One thing to avoid
  let oneThingToAvoid = "Don't build features you haven't validated with real users.";
  if (contradictions.filter((c) => c.severity === "high").length > 0) {
    oneThingToAvoid = "Don't proceed to build until you've resolved the high-severity intelligence contradictions.";
  } else if (scores.proof && scores.proof < 40 && scores.mvp && scores.mvp > 60) {
    oneThingToAvoid = "Don't over-invest in building — your proof score is too low to justify heavy build work.";
  } else if (scores.doctor && scores.doctor < 50 && scores.launch && scores.launch > 60) {
    oneThingToAvoid = "Don't launch yet — Launch Room says ready but Project Doctor says critical issues exist.";
  } else if (coverage.percentage < 30) {
    oneThingToAvoid = "Don't skip validation tools — building without intelligence coverage leads to expensive pivots.";
  }

  // Quick stats
  const quickStats = [
    {
      label: "Reports",
      value: reports.length,
      color: "var(--noctra-violet)",
    },
    {
      label: "Coverage",
      value: `${coverage.percentage}%`,
      color: coverage.percentage >= 70 ? "var(--noctra-emerald)" : coverage.percentage >= 40 ? "var(--noctra-amber)" : "var(--noctra-rose)",
    },
    {
      label: "Open Tasks",
      value: openTotal,
      color: openCritical.length > 0 ? "var(--noctra-rose)" : "var(--noctra-cyan)",
    },
    {
      label: "Proof Signals",
      value: proofSignals.length,
      color: proofSignals.length >= 5 ? "var(--noctra-emerald)" : proofSignals.length >= 2 ? "var(--noctra-amber)" : "var(--noctra-rose)",
    },
  ];

  if (completedToday > 0) {
    quickStats.push({
      label: "Completed",
      value: completedToday,
      color: "var(--noctra-emerald)",
    });
  }

  // Suggested prompt for Replit / Cursor
  const toolsRun = coverage.covered.join(", ") || "none yet";
  const avgScore =
    Object.values(scores).filter((s) => s > 0).length > 0
      ? Math.round(
          Object.values(scores).filter((s) => s > 0).reduce((a, b) => a + b, 0) /
            Object.values(scores).filter((s) => s > 0).length
        )
      : 0;

  const suggestedPrompt =
    `You are building a startup product. Current state:
- Tools analyzed: ${toolsRun}
- Average intelligence score: ${avgScore}/100
- Open critical tasks: ${openCritical.length}
- Proof signals collected: ${proofSignals.length}
- Current focus: ${currentFocus}
- Biggest risk: ${biggestRisk}

Based on this context, help me ${
      openCritical.length > 0
        ? "resolve my top critical task and unblock my build pipeline"
        : nextTool
        ? `run a comprehensive ${TOOL_LABELS[nextTool] ?? nextTool} analysis`
        : "identify the highest-leverage action I can take in the next 2 hours"
    }.`;

  return {
    greeting: getGreeting(),
    currentFocus,
    topThreePriorities: priorities.slice(0, 3),
    biggestRisk,
    easiestWin,
    oneThingToAvoid,
    recommendedWorkBlock: getWorkBlock(),
    quickStats,
    suggestedPrompt,
  };
}
