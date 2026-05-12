// risk-radar.ts — Extract and normalise risks from all Noctra report payloads
// Pure utility: no React, no side effects.

export type RiskCategory =
  | "Market"
  | "Product"
  | "Technical"
  | "Security"
  | "Testing"
  | "Launch"
  | "Monetization"
  | "Retention"
  | "AI Replacement"
  | "Scope";

export type RiskSeverity = "critical" | "high" | "medium" | "low";

export type RadarRisk = {
  id: string;
  title: string;
  category: RiskCategory;
  severity: RiskSeverity;
  sourceTool: string;
  sourceReportId?: string;
  projectId?: string;
  impact: string;
  recommendedFix: string;
};

export const RISK_SEV_COLOR: Record<RiskSeverity, string> = {
  critical: "var(--noctra-rose)",
  high: "var(--noctra-amber)",
  medium: "var(--noctra-cyan)",
  low: "var(--noctra-text-muted)",
};

export const RISK_CATEGORY_COLOR: Record<RiskCategory, string> = {
  Market: "var(--noctra-violet)",
  Product: "var(--noctra-cyan)",
  Technical: "var(--noctra-rose)",
  Security: "var(--noctra-rose)",
  Testing: "var(--noctra-amber)",
  Launch: "var(--noctra-magenta)",
  Monetization: "var(--noctra-gold)",
  Retention: "var(--noctra-emerald)",
  "AI Replacement": "var(--noctra-rose)",
  Scope: "var(--noctra-text-muted)",
};

const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

type ReportLike = {
  id: string;
  tool: string;
  payload: unknown;
  score?: number | null;
  project_id?: string | null;
};

type TaskLike = {
  id: string;
  status: string;
  priority: string;
  title: string;
};

export function extractRisks(params: {
  reports: ReportLike[];
  tasks?: TaskLike[];
  projectId?: string;
}): RadarRisk[] {
  const { reports, tasks = [], projectId } = params;
  const risks: RadarRisk[] = [];
  let counter = 0;

  function add(r: Omit<RadarRisk, "id">) {
    risks.push({ ...r, id: `risk-${counter++}` });
  }

  for (const report of reports) {
    const p = report.payload as Record<string, unknown> | null;
    const data = ((p?.data ?? p) ?? {}) as Record<string, unknown>;
    const base = {
      sourceReportId: report.id,
      projectId: projectId ?? (report.project_id ?? undefined),
    };

    // ── Idea ────────────────────────────────────────────────────────────────
    if (report.tool === "idea") {
      const redFlags = (data.red_flags as string[] | undefined) ?? [];
      for (const flag of redFlags.slice(0, 4)) {
        add({ ...base, title: flag, category: "Market", severity: "high", sourceTool: "idea", impact: "Weak product-market fit signal", recommendedFix: "Revisit ICP and sharpen value proposition" });
      }
      const aiRisk = (data.ai_replacement_risk ?? data.chatgpt_risk) as string | undefined;
      if (aiRisk && aiRisk.toLowerCase().includes("high")) {
        add({ ...base, title: "High AI wrapper replacement risk", category: "AI Replacement", severity: "high", sourceTool: "idea", impact: "Product could be replaced by generic AI chat", recommendedFix: "Add proprietary data, workflow integration, or network effects" });
      }
    }

    // ── Reality ──────────────────────────────────────────────────────────────
    if (report.tool === "reality") {
      const redFlags = (data.red_flags as string[] | undefined) ?? [];
      for (const flag of redFlags.slice(0, 3)) {
        add({ ...base, title: flag, category: "Product", severity: "high", sourceTool: "reality", impact: "Core assumption failing reality check", recommendedFix: "Patch assumption or pivot strategy" });
      }
      const riskItems = ((data.risk_items ?? data.assumptions) as Array<{ assumption: string; severity: string; mitigation?: string }> | undefined) ?? [];
      for (const ri of riskItems.filter((r) => r.severity === "high" || r.severity === "critical").slice(0, 3)) {
        add({ ...base, title: ri.assumption, category: "Market", severity: ri.severity as RiskSeverity, sourceTool: "reality", impact: "High-severity assumption at risk", recommendedFix: ri.mitigation ?? "Address this assumption before proceeding" });
      }
      const marketRisks = (data.market_risks as string[] | undefined) ?? [];
      for (const r of marketRisks.slice(0, 2)) {
        add({ ...base, title: r, category: "Market", severity: "medium", sourceTool: "reality", impact: "Market-level risk identified", recommendedFix: "Monitor and validate market assumption" });
      }
    }

    // ── Proof ────────────────────────────────────────────────────────────────
    if (report.tool === "proof") {
      const gaps = (data.evidence_gaps as string[] | undefined) ?? [];
      for (const gap of gaps.slice(0, 3)) {
        add({ ...base, title: gap, category: "Product", severity: "medium", sourceTool: "proof", impact: "Validation gap — assumption unproven", recommendedFix: "Design an experiment to close this gap" });
      }
      const proofScore = (data.proof_score ?? data.score ?? report.score ?? 0) as number;
      if (proofScore > 0 && proofScore < 40) {
        add({ ...base, title: `Low proof score: ${proofScore}/100`, category: "Product", severity: "high", sourceTool: "proof", impact: "Weak validation evidence for core claims", recommendedFix: "Run more experiments and collect proof signals" });
      }
    }

    // ── Swarm ────────────────────────────────────────────────────────────────
    if (report.tool === "swarm") {
      const objections = (data.top_objections as string[] | undefined) ?? [];
      for (const obj of objections.slice(0, 3)) {
        add({ ...base, title: obj, category: "Market", severity: "medium", sourceTool: "swarm", impact: "Persona objection to conversion", recommendedFix: "Address objection in messaging or product" });
      }
      const retention = (data.retention_risk ?? data.churn_risk) as string | undefined;
      if (retention) {
        add({ ...base, title: retention, category: "Retention", severity: "medium", sourceTool: "swarm", impact: "User churn risk identified in simulation", recommendedFix: "Add retention mechanics before launch" });
      }
    }

    // ── Doctor ───────────────────────────────────────────────────────────────
    if (report.tool === "doctor") {
      const gates = (data.gates as Array<{ name: string; status: string; how_to_fix?: string }> | undefined) ?? [];
      for (const gate of gates.filter((g) => g.status === "RED").slice(0, 5)) {
        add({ ...base, title: `Gate failed: ${gate.name}`, category: "Launch", severity: "critical", sourceTool: "doctor", impact: "Blocking launch readiness gate", recommendedFix: gate.how_to_fix ?? "Fix gate before launch" });
      }
      const issues = (data.issues as Array<{ severity: string; issue: string; fix?: string }> | undefined) ?? [];
      for (const issue of issues.filter((i) => i.severity === "CRITICAL" || i.severity === "HIGH").slice(0, 4)) {
        const lc = issue.issue.toLowerCase();
        const cat: RiskCategory = lc.includes("security") || lc.includes("auth") ? "Security" : lc.includes("test") ? "Testing" : "Technical";
        add({ ...base, title: issue.issue, category: cat, severity: issue.severity === "CRITICAL" ? "critical" : "high", sourceTool: "doctor", impact: "Code-level issue blocking launch", recommendedFix: issue.fix ?? "Resolve issue immediately" });
      }
    }

    // ── Launch ───────────────────────────────────────────────────────────────
    if (report.tool === "launch") {
      const modes = ((data.failure_modes ?? data.risks) as string[] | undefined) ?? [];
      for (const risk of modes.slice(0, 3)) {
        add({ ...base, title: risk, category: "Launch", severity: "high", sourceTool: "launch", impact: "Launch execution risk", recommendedFix: "Address before go-live" });
      }
    }
  }

  // ── Overdue high-priority tasks ──────────────────────────────────────────
  for (const task of tasks.filter((t) => t.status === "todo" && (t.priority === "high" || t.priority === "critical")).slice(0, 3)) {
    add({ title: `Unresolved: ${task.title}`, category: "Scope", severity: task.priority as RiskSeverity, sourceTool: "tasks", impact: "Unresolved action blocking progress", recommendedFix: "Complete or reassign this task" });
  }

  return risks.sort((a, b) => (SEV_ORDER[a.severity] ?? 3) - (SEV_ORDER[b.severity] ?? 3));
}
