import { getReports } from "./repository";

// Which tools' previous results are most valuable to inject when running each tool
const CONTEXT_MAP: Record<string, string[]> = {
  idea:    ["reality", "swarm", "proof"],
  reality: ["idea", "proof", "swarm"],
  proof:   ["idea", "reality"],
  swarm:   ["idea", "mvp", "reality"],
  mvp:     ["idea", "reality", "proof", "swarm"],
  doctor:  ["mvp", "launch"],
  launch:  ["doctor", "mvp", "reality", "proof"],
  twin:    ["idea", "reality", "proof", "swarm", "mvp", "doctor", "launch"],
};

export interface ContextReport {
  tool: string;
  label: string;
  score: number | null;
  title: string;
  keyInsights: string[];
}

export interface InjectedContext {
  hasContext: boolean;
  summary: string;
  reports: ContextReport[];
}

const TOOL_LABELS: Record<string, string> = {
  idea: "Idea Checker", reality: "Reality Compiler", proof: "Proof Engine",
  swarm: "Market Swarm", mvp: "MVP Planner", doctor: "Project Doctor",
  launch: "Launch Room", twin: "Product Twin",
};

function pickKeyInsights(data: Record<string, unknown>, tool: string): string[] {
  const insights: string[] = [];

  if (typeof data.verdict === "string") insights.push(`Verdict: ${data.verdict}`);
  if (typeof data.go_signal === "string") insights.push(`Go signal: ${data.go_signal}`);
  if (typeof data.go_no_go === "string") insights.push(`Launch gate: ${data.go_no_go}`);
  if (typeof data.summary === "string") insights.push(`Summary: ${data.summary.slice(0, 200)}`);

  // Tool-specific key fields
  if (tool === "idea") {
    if (typeof data.who_hurts_most === "string") insights.push(`Who hurts most: ${data.who_hurts_most}`);
    if (typeof data.sharpest_experiment === "string") insights.push(`Key experiment: ${data.sharpest_experiment}`);
    if (Array.isArray(data.red_flags)) {
      (data.red_flags as string[]).slice(0, 2).forEach((f) => insights.push(`Red flag: ${f}`));
    }
  }
  if (tool === "reality") {
    if (Array.isArray(data.blind_spots)) {
      (data.blind_spots as string[]).slice(0, 2).forEach((b) => insights.push(`Blind spot: ${b}`));
    }
    if (Array.isArray(data.risk_items)) {
      const critical = (data.risk_items as Array<Record<string, unknown>>)
        .filter((r) => r.severity === "critical")
        .slice(0, 1);
      critical.forEach((r) => insights.push(`Critical risk: ${String(r.assumption ?? "")}`));
    }
  }
  if (tool === "proof") {
    if (Array.isArray(data.evidence_gaps)) {
      (data.evidence_gaps as string[]).slice(0, 2).forEach((g) => insights.push(`Evidence gap: ${g}`));
    }
  }
  if (tool === "swarm") {
    if (typeof data.consensus === "string") insights.push(`Market consensus: ${data.consensus}`);
    if (typeof data.pricing_signal === "string") insights.push(`Pricing signal: ${data.pricing_signal}`);
  }
  if (tool === "mvp") {
    const scope = data.ruthless_scope as Record<string, unknown> | null;
    if (Array.isArray(scope?.build_now)) {
      insights.push(`Core scope: ${(scope!.build_now as string[]).slice(0, 2).join(", ")}`);
    }
    if (typeof data.north_star_metric === "string") {
      insights.push(`North star: ${data.north_star_metric}`);
    }
  }
  if (tool === "doctor") {
    if (Array.isArray(data.repair_queue)) {
      insights.push(`Top repair: ${String((data.repair_queue as unknown[])[0] ?? "")}`);
    }
  }
  if (tool === "launch") {
    if (typeof data.distribution_plan === "string") {
      insights.push(`Distribution: ${data.distribution_plan.slice(0, 150)}`);
    }
  }

  if (Array.isArray(data.next_actions)) {
    (data.next_actions as string[]).slice(0, 2).forEach((a) => insights.push(`Next action: ${a}`));
  }

  return insights.slice(0, 5);
}

export async function loadCrossToolContext(
  tool: string,
  projectId?: string | null
): Promise<InjectedContext> {
  const relevantTools = CONTEXT_MAP[tool] ?? [];
  if (relevantTools.length === 0) return { hasContext: false, summary: "", reports: [] };

  try {
    const allReports = await getReports(undefined, projectId ?? undefined);
    const reports = (allReports as Array<Record<string, unknown>>)
      .filter((r) => relevantTools.includes(String(r.tool ?? "")))
      .sort((a, b) => new Date(String(b.created_at)).getTime() - new Date(String(a.created_at)).getTime());

    // One per tool — most recent
    const deduped = new Map<string, Record<string, unknown>>();
    for (const r of reports) {
      const t = String(r.tool ?? "");
      if (!deduped.has(t)) deduped.set(t, r);
    }

    const contextReports: ContextReport[] = [];
    for (const r of deduped.values()) {
      const t = String(r.tool ?? "unknown");
      const p = r.payload as Record<string, unknown> | null;
      const data = ((p?.data ?? p ?? {}) as Record<string, unknown>);
      contextReports.push({
        tool: t,
        label: TOOL_LABELS[t] ?? t,
        score: typeof r.score === "number" ? r.score : null,
        title: String(r.title ?? "Untitled"),
        keyInsights: pickKeyInsights(data, t),
      });
    }

    if (contextReports.length === 0) return { hasContext: false, summary: "", reports: [] };

    const summary = contextReports
      .map((r) => {
        const scoreStr = r.score != null ? ` (${r.score}/100)` : "";
        return `[${r.label.toUpperCase()}]${scoreStr}\n${r.keyInsights.join("\n")}`;
      })
      .join("\n\n");

    return { hasContext: true, summary, reports: contextReports };
  } catch {
    return { hasContext: false, summary: "", reports: [] };
  }
}

export function buildContextBlock(context: InjectedContext, tool: string): string {
  if (!context.hasContext || !context.summary) return "";
  return [
    `\n\n---`,
    `PRIOR INTELLIGENCE (build on this — reference specific findings from these reports in your ${tool} analysis):`,
    "",
    context.summary,
    `---`,
  ].join("\n");
}
