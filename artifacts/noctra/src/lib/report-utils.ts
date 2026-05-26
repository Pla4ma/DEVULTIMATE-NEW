// report-utils.ts — Shared report processing utilities
// Single source of truth for extractData, getScore, latestByTool, and tool constants.
// Every module that processes reports MUST import from here.

export interface ReportSummary {
  id: string;
  tool: string;
  title: string;
  score?: number | null;
  created_at: string;
  payload?: unknown;
  summary?: string | null;
}

export const INTELLIGENCE_TOOLS = ["doctor", "idea", "reality", "proof", "swarm", "mvp", "launch"] as const;

export const TOOL_LABELS: Record<string, string> = {
  idea: "Idea Checker",
  reality: "Reality Compiler",
  proof: "Proof Engine",
  swarm: "Market Swarm",
  mvp: "MVP Planner",
  doctor: "Product Doctor",
  launch: "Launch Room",
  twin: "Product Twin",
};

export const TOOL_JOURNEY_ORDER = ["doctor", "idea", "reality", "swarm", "proof", "mvp", "launch"] as const;

const SCORE_KEYS = ["signal_score", "reality_score", "proof_score", "health_score", "mvp_score", "swarm_score", "launch_score", "score"];

/**
 * Extract the data object from a report payload.
 * Handles both { data: ... } and flat payload shapes.
 */
export function extractData(report: ReportSummary): Record<string, unknown> {
  const p = report.payload as Record<string, unknown> | null;
  if (!p) return {};
  return ((p.data ?? p) as Record<string, unknown>) ?? {};
}

/**
 * Get numeric score from a report. Checks report.score first, then payload keys.
 */
export function getScore(report: ReportSummary): number {
  if (typeof report.score === "number") return report.score;
  const d = extractData(report);
  for (const k of SCORE_KEYS) {
    if (typeof d[k] === "number") return d[k] as number;
  }
  return 0;
}

/**
 * Get numeric score from a report, returning null if not found.
 * Use this variant when 0 is a valid score and you need to distinguish "no score" from "scored 0".
 */
export function getScoreOrNull(report: ReportSummary): number | null {
  if (typeof report.score === "number") return report.score;
  const d = extractData(report);
  for (const k of SCORE_KEYS) {
    if (typeof d[k] === "number") return d[k] as number;
  }
  return null;
}

/**
 * Build a Map of tool → latest report (sorted newest-first).
 * Deduplicates: only the most recent report per tool is kept.
 */
export function latestByTool(reports: ReportSummary[]): Map<string, ReportSummary> {
  const byTool = new Map<string, ReportSummary>();
  for (const r of [...reports].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )) {
    if (!byTool.has(r.tool)) byTool.set(r.tool, r);
  }
  return byTool;
}

/**
 * Get the human-readable label for a tool key.
 */
export function toolLabel(tool: string): string {
  return TOOL_LABELS[tool] ?? tool;
}
