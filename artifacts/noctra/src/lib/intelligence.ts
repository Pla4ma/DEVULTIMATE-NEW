export interface ReportSummary {
  id: string;
  tool: string;
  title: string;
  score?: number | null;
  created_at: string;
  payload?: unknown;
  summary?: string | null;
}

export interface Contradiction {
  type: "score" | "signal" | "assumption" | "scope" | "timing";
  severity: "high" | "medium" | "low";
  description: string;
  tools: string[];
  resolution: string;
}

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

const INTELLIGENCE_TOOLS = ["doctor", "idea", "reality", "proof", "swarm", "mvp", "launch"];

const TOOL_LABELS: Record<string, string> = {
  idea: "Idea Checker",
  reality: "Reality Compiler",
  proof: "Proof Engine",
  swarm: "Market Swarm",
  mvp: "MVP Planner",
  doctor: "Product Doctor",
  launch: "Launch Room",
  twin: "Product Twin",
};

const TOOL_JOURNEY_ORDER = ["doctor", "idea", "reality", "swarm", "proof", "mvp", "launch"];

function extractData(report: ReportSummary): Record<string, unknown> {
  const p = report.payload as Record<string, unknown> | null;
  if (!p) return {};
  const d = (p.data ?? p) as Record<string, unknown>;
  return d ?? {};
}

function getScore(report: ReportSummary): number | null {
  if (typeof report.score === "number") return report.score;
  const d = extractData(report);
  const keys = [`${report.tool}_score`, "signal_score", "health_score", "proof_score", "mvp_score", "swarm_score", "launch_score", "reality_score", "score"];
  for (const k of keys) {
    if (typeof d[k] === "number") return d[k] as number;
  }
  return null;
}

export function computeToolCoverage(reports: ReportSummary[]): ToolCoverage {
  const toolsDone = new Set(reports.map((r) => r.tool).filter((t) => INTELLIGENCE_TOOLS.includes(t)));
  const covered = INTELLIGENCE_TOOLS.filter((t) => toolsDone.has(t));
  const missing = INTELLIGENCE_TOOLS.filter((t) => !toolsDone.has(t));
  const percentage = Math.round((covered.length / INTELLIGENCE_TOOLS.length) * 100);
  const nextRecommended = TOOL_JOURNEY_ORDER.find((t) => !toolsDone.has(t)) ?? null;
  return { covered, missing, percentage, nextRecommended };
}

export function extractScoreTrends(reports: ReportSummary[]): ScoreTrend[] {
  const byTool = new Map<string, ReportSummary[]>();
  for (const r of reports) {
    if (!INTELLIGENCE_TOOLS.includes(r.tool)) continue;
    if (!byTool.has(r.tool)) byTool.set(r.tool, []);
    byTool.get(r.tool)!.push(r);
  }

  const trends: ScoreTrend[] = [];
  for (const [tool, toolReports] of byTool.entries()) {
    const sorted = [...toolReports].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const latest = sorted[0];
    const previous = sorted[1];
    const latestScore = getScore(latest);
    if (latestScore == null) continue;

    const previousScore = previous ? getScore(previous) ?? undefined : undefined;
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

export function detectContradictions(reports: ReportSummary[]): Contradiction[] {
  const contradictions: Contradiction[] = [];

  // Take most recent report per tool
  const byTool = new Map<string, ReportSummary>();
  for (const r of [...reports].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )) {
    if (!byTool.has(r.tool)) byTool.set(r.tool, r);
  }

  const idea = byTool.get("idea");
  const reality = byTool.get("reality");
  const launch = byTool.get("launch");
  const doctor = byTool.get("doctor");
  const proof = byTool.get("proof");
  const mvp = byTool.get("mvp");

  if (idea && reality) {
    const ideaData = extractData(idea);
    const realityData = extractData(reality);
    const ideaScore = getScore(idea) ?? (ideaData.signal_score as number | null) ?? 0;
    const goSignal = String(realityData.go_signal ?? "");

    if (ideaScore >= 70 && goSignal === "NO-GO") {
      contradictions.push({
        type: "signal",
        severity: "high",
        description: `Idea Checker scored ${ideaScore}/100 (strong) but Reality Compiler returned NO-GO — your strongest assumptions may be the most dangerous ones`,
        tools: ["idea", "reality"],
        resolution: "Re-run Reality Compiler with explicit focus on why high-scoring ideas still fail. Address each critical risk before proceeding.",
      });
    }
    if (ideaScore < 45 && goSignal === "GO") {
      contradictions.push({
        type: "signal",
        severity: "medium",
        description: `Idea Checker scored ${ideaScore}/100 (weak signal) but Reality Compiler returned GO — you may be pressure-testing the wrong version of the idea`,
        tools: ["idea", "reality"],
        resolution: "Sharpen the idea formulation and re-run Idea Checker before treating the GO signal as valid.",
      });
    }
  }

  if (launch && doctor) {
    const launchScore = getScore(launch) ?? 0;
    const doctorScore = getScore(doctor) ?? 0;
    if (launchScore >= 70 && doctorScore < 50) {
      contradictions.push({
        type: "score",
        severity: "high",
        description: `Launch Room shows ${launchScore}/100 readiness but Project Doctor health is only ${doctorScore}/100 — you're planning to launch on a broken foundation`,
        tools: ["launch", "doctor"],
        resolution: "Resolve all RED gates from Project Doctor first. A ${doctorScore}/100 health score means production incidents are likely within hours of launch.",
      });
    }
  }

  if (proof) {
    const proofData = extractData(proof);
    const proofScore = getScore(proof) ?? (proofData.proof_score as number | null) ?? 0;
    const gaps = Array.isArray(proofData.evidence_gaps) ? proofData.evidence_gaps.length : 0;
    if (proofScore >= 65 && gaps >= 3) {
      contradictions.push({
        type: "assumption",
        severity: "medium",
        description: `Proof Engine scores ${proofScore}/100 but flagged ${gaps} unaddressed evidence gaps — the score may be inflated by low-quality signals`,
        tools: ["proof"],
        resolution: "Close at least 2 of the flagged evidence gaps before treating the proof score as launch validation.",
      });
    }
  }

  if (mvp) {
    const mvpReports = reports
      .filter((r) => r.tool === "mvp")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (mvpReports.length >= 2) {
      const latestScore = getScore(mvpReports[0]) ?? 0;
      const prevScore = getScore(mvpReports[1]) ?? 0;
      if (latestScore < prevScore - 10) {
        contradictions.push({
          type: "scope",
          severity: "medium",
          description: `MVP score dropped from ${prevScore} to ${latestScore} across runs — scope is likely expanding instead of contracting`,
          tools: ["mvp"],
          resolution: "Return to first principles: what is the single user action that proves this MVP works? Cut everything else.",
        });
      }
    }
  }

  if (idea && mvp && !proof) {
    const ideaDate = new Date(idea.created_at).getTime();
    const mvpDate = new Date(mvp.created_at).getTime();
    const daysBetween = (mvpDate - ideaDate) / (1000 * 60 * 60 * 24);
    if (daysBetween < 1) {
      contradictions.push({
        type: "timing",
        severity: "low",
        description: "Idea Checker and MVP Planner run on the same day with no Proof Engine — you may be planning to build before validating",
        tools: ["idea", "mvp"],
        resolution: "Run Proof Engine before finalizing the MVP scope. Build only what validated demand requires.",
      });
    }
  }

  return contradictions;
}

export function generateInsightBrief(reports: ReportSummary[]): InsightBrief {
  const trends = extractScoreTrends(reports);
  const contradictions = detectContradictions(reports);
  const coverage = computeToolCoverage(reports);

  const avgScore =
    trends.length > 0
      ? Math.round(trends.reduce((sum, t) => sum + t.latestScore, 0) / trends.length)
      : 0;

  const improvingCount = trends.filter((t) => t.direction === "up").length;
  const decliningCount = trends.filter((t) => t.direction === "down").length;
  const criticalContradictions = contradictions.filter((c) => c.severity === "high").length;

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
    contradictions[0]?.description ??
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
      ? contradictions[0].resolution
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
