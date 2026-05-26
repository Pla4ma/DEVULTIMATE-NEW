// intelligence.ts — Intelligence analysis: trends, coverage, insight briefs
// Shared utilities imported from report-utils.ts. Contradiction detection via contradiction-engine.ts.

import {
  type ReportSummary,
  INTELLIGENCE_TOOLS,
  TOOL_LABELS,
  TOOL_JOURNEY_ORDER,
  extractData,
} from "./report-utils";
import { runContradictionEngine, type EnhancedContradiction } from "./contradiction-engine";

// Re-export for backward compatibility — consumers import ReportSummary from here
export type { EnhancedContradiction } from "./contradiction-engine";

export interface ScoreTrend {
  tool: string;
  label: string;
  latestScore: number;
  previousScore?: number;
  delta?: number;
  direction: "up" | "down" | "stable" | "new";
  createdAt: string;
}

export interface ToolCoverage {
  covered: string[];
  missing: string[];
  percentage: number;
  nextRecommended: string | null;
}

export interface InsightBrief {
  headline: string;
  status: "on-track" | "needs-attention" | "critical";
  topRisk: string;
  topOpportunity: string;
  immediateAction: string;
  avgScore: number;
}

export function computeToolCoverage(reports: ReportSummary[]): ToolCoverage {
  const toolsDone = new Set(reports.map((r) => r.tool).filter((t) => (INTELLIGENCE_TOOLS as readonly string[]).includes(t)));
  const covered = INTELLIGENCE_TOOLS.filter((t) => toolsDone.has(t));
  const missing = INTELLIGENCE_TOOLS.filter((t) => !toolsDone.has(t));
  const percentage = Math.round((covered.length / INTELLIGENCE_TOOLS.length) * 100);
  const nextRecommended = TOOL_JOURNEY_ORDER.find((t) => !toolsDone.has(t)) ?? null;
  return { covered, missing, percentage, nextRecommended };
}

export function extractScoreTrends(reports: ReportSummary[]): ScoreTrend[] {
  const byTool = new Map<string, ReportSummary[]>();
  for (const r of reports) {
    if (!(INTELLIGENCE_TOOLS as readonly string[]).includes(r.tool)) continue;
    if (!byTool.has(r.tool)) byTool.set(r.tool, []);
    byTool.get(r.tool)!.push(r);
  }

  const trends: ScoreTrend[] = [];
  for (const [tool, toolReports] of byTool.entries()) {
    const sorted = [...toolReports].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const latest = sorted[0];
    if (!latest) continue;
    const previous = sorted[1];
    const latestScore = getScoreOrNull(latest);
    if (latestScore == null) continue;

    const previousScore = previous ? getScoreOrNull(previous) ?? undefined : undefined;
    const delta = previousScore != null ? latestScore - previousScore : undefined;
    const direction: ScoreTrend["direction"] =
      delta == null ? "new" : delta > 3 ? "up" : delta < -3 ? "down" : "stable";

    trends.push({
      tool,
      label: TOOL_LABELS[tool] ?? tool,
      latestScore,
      previousScore,
      delta,
      direction,
      createdAt: latest.created_at,
    });
  }

  return trends.sort((a, b) => {
    const order = { up: 0, new: 1, stable: 2, down: 3 };
    const od = order[a.direction] - order[b.direction];
    if (od !== 0) return od;
    return b.latestScore - a.latestScore;
  });
}

export function generateInsightBrief(reports: ReportSummary[]): InsightBrief {
  const trends = extractScoreTrends(reports);
  const { contradictions } = runContradictionEngine(reports);
  const coverage = computeToolCoverage(reports);

  const avgScore =
    trends.length > 0
      ? Math.round(trends.reduce((sum, t) => sum + t.latestScore, 0) / trends.length)
      : 0;

  const improvingCount = trends.filter((t) => t.direction === "up").length;
  const decliningCount = trends.filter((t) => t.direction === "down").length;
  const criticalContradictions = contradictions.filter((c) => c.severity === "critical" || c.severity === "high").length;

  const status: InsightBrief["status"] =
    criticalContradictions > 0 || decliningCount > improvingCount + 1
      ? "critical"
      : avgScore < 52 || coverage.percentage < 43
      ? "needs-attention"
      : "on-track";

  const worstTrend = [...trends]
    .filter((t) => t.direction === "down")
    .sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0))[0];
  const bestTrend = [...trends]
    .filter((t) => t.direction === "up")
    .sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0))[0];

  const headline =
    criticalContradictions > 0
      ? `${criticalContradictions} critical contradiction${criticalContradictions > 1 ? "s" : ""} detected — your reports are telling conflicting stories`
      : coverage.percentage < 43
      ? `${coverage.percentage}% tool coverage — you have ${coverage.missing.length} unknown risk areas`
      : avgScore >= 70
      ? `Strong position — ${avgScore}/100 average across ${trends.length} tools`
      : avgScore >= 55
      ? `Developing — ${avgScore}/100 average, ${coverage.missing.length} tools left to run`
      : `Early stage — ${avgScore}/100 average, significant validation work ahead`;

  const topRisk =
    contradictions[0]?.explanation ??
    (worstTrend
      ? `${worstTrend.label} dropped ${Math.abs(worstTrend.delta ?? 0)} points — losing momentum`
      : coverage.missing[0]
      ? `${TOOL_LABELS[coverage.missing[0]] ?? coverage.missing[0]} not yet analyzed — blind spot`
      : "No critical risks detected across current reports");

  const topOpportunity =
    bestTrend
      ? `${bestTrend.label} improving (+${bestTrend.delta} points) — build on this momentum`
      : coverage.nextRecommended
      ? `Run ${TOOL_LABELS[coverage.nextRecommended] ?? coverage.nextRecommended} to expand intelligence coverage`
      : "All tools showing stable performance — time to execute";

  const immediateAction =
    contradictions.length > 0
      ? contradictions[0]?.recommendedResolution ?? "Address identified contradictions"
      : coverage.nextRecommended
      ? `Run ${TOOL_LABELS[coverage.nextRecommended] ?? coverage.nextRecommended}`
      : worstTrend
      ? `Re-run ${worstTrend.label} and address the specific issues causing the score decline`
      : "Run Product Twin for a full strategic synthesis across all reports";

  return { headline, status, topRisk, topOpportunity, immediateAction, avgScore };
}

export function buildInsightSweepInput(reports: ReportSummary[]): string {
  const trends = extractScoreTrends(reports);
  const coverage = computeToolCoverage(reports);

  const lines: string[] = [
    `## Report Corpus (${reports.length} total, ${coverage.percentage}% tool coverage)`,
    `Tools run: ${coverage.covered.join(", ")}`,
    `Tools not run: ${coverage.missing.join(", ") || "none"}`,
    "",
  ];

  for (const trend of trends) {
    const byTool = reports
      .filter((r) => r.tool === trend.tool)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const latest = byTool[0];
    if (!latest) continue;

    const d = extractData(latest);
    lines.push(`### ${trend.label} — ${trend.latestScore}/100`);
    if (trend.previousScore != null) {
      lines.push(`Score trend: ${trend.direction} (${trend.previousScore} → ${trend.latestScore})`);
    }
    if (d.verdict) lines.push(`Verdict: ${String(d.verdict)}`);
    if (d.go_signal) lines.push(`Go signal: ${String(d.go_signal)}`);
    if (d.go_no_go) lines.push(`Go/No-go: ${String(d.go_no_go)}`);
    if (Array.isArray(d.red_flags)) {
      lines.push(`Red flags: ${(d.red_flags as string[]).slice(0, 2).join("; ")}`);
    }
    if (Array.isArray(d.blind_spots)) {
      lines.push(`Blind spots: ${(d.blind_spots as string[]).slice(0, 2).join("; ")}`);
    }
    if (latest.summary) lines.push(`Summary: ${latest.summary.slice(0, 200)}`);
    lines.push("");
  }

  return lines.join("\n");
}
