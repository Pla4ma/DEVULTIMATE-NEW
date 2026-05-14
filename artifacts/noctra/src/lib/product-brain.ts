// product-brain.ts — Product Brain: extract knowledge graph nodes/edges/clusters/insights
// Pure utility: no React, no side effects.

import type { ReportSummary } from "./intelligence";

export type NodeType =
  | "idea"
  | "assumption"
  | "risk"
  | "proof-signal"
  | "objection"
  | "feature"
  | "task"
  | "launch-gate"
  | "code-issue"
  | "user-segment"
  | "monetization-idea"
  | "retention-loop";

export type EdgeRelationship =
  | "supports"
  | "contradicts"
  | "blocks"
  | "improves"
  | "validates"
  | "invalidates"
  | "depends_on"
  | "creates_risk"
  | "reduces_risk";

export interface BrainNode {
  id: string;
  type: NodeType;
  label: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low" | "neutral";
  score?: number;
  sourceTool: string;
  sourceReportId?: string;
  projectId?: string;
}

export interface BrainEdge {
  from: string;
  to: string;
  relationship: EdgeRelationship;
  confidence: number; // 0–1
}

export interface BrainCluster {
  id: string;
  name: string;
  nodeIds: string[];
  theme: string;
  healthSignal: "green" | "amber" | "red" | "unknown";
}

export interface BrainInsight {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  actionLabel: string;
  actionHref: string;
  sourceTool: string;
}

export interface ProductBrain {
  nodes: BrainNode[];
  edges: BrainEdge[];
  clusters: BrainCluster[];
  insights: BrainInsight[];
}

type TaskLike = {
  id: string;
  title?: string;
  status: string;
  priority: string;
  category?: string | null;
};

type ProofSignalLike = {
  id: string;
  label?: string;
  kind?: string;
};

let _nodeCounter = 0;
function nid(prefix: string): string {
  return `${prefix}-${++_nodeCounter}`;
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

function scoreToSeverity(score: number): BrainNode["severity"] {
  if (score < 40) return "critical";
  if (score < 55) return "high";
  if (score < 70) return "medium";
  if (score < 85) return "low";
  return "neutral";
}

export function buildProductBrain(params: {
  reports: ReportSummary[];
  tasks: TaskLike[];
  proofSignals: ProofSignalLike[];
}): ProductBrain {
  _nodeCounter = 0;

  const { reports, tasks, proofSignals } = params;
  const nodes: BrainNode[] = [];
  const edges: BrainEdge[] = [];
  const insights: BrainInsight[] = [];

  const byTool = new Map<string, ReportSummary>();
  for (const r of [...reports].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )) {
    if (!byTool.has(r.tool)) byTool.set(r.tool, r);
  }

  const idea = byTool.get("idea");
  const reality = byTool.get("reality");
  const proof = byTool.get("proof");
  const mvp = byTool.get("mvp");
  const swarm = byTool.get("swarm");
  const doctor = byTool.get("doctor");
  const launch = byTool.get("launch");

  const ideaNodeId = idea ? (() => {
    const d = extractData(idea);
    const score = getScore(idea);
    const id = nid("idea");
    nodes.push({
      id,
      type: "idea",
      label: String(d.idea ?? idea.title ?? "Core Idea").slice(0, 60),
      description: String(d.verdict ?? d.summary ?? idea.summary ?? "The core product concept").slice(0, 200),
      severity: scoreToSeverity(score),
      score,
      sourceTool: "idea",
      sourceReportId: idea.id,
    });
    return id;
  })() : null;

  // ── Assumptions from Reality ─────────────────────────────────────────────
  const assumptionNodeIds: string[] = [];
  if (reality) {
    const d = extractData(reality);
    const score = getScore(reality);
    const errors = Array.isArray(d.errors) ? (d.errors as Array<Record<string, unknown>>) : [];
    const assumptions = Array.isArray(d.assumptions) ? (d.assumptions as string[]) : [];

    if (errors.length > 0) {
      for (const err of errors.slice(0, 5)) {
        const id = nid("assumption");
        const sev = String(err.severity ?? "medium").toLowerCase() as BrainNode["severity"];
        assumptionNodeIds.push(id);
        nodes.push({
          id,
          type: "assumption",
          label: String(err.code ?? err.title ?? "Assumption error").slice(0, 60),
          description: String(err.message ?? err.fix ?? "Reality compiler flagged this assumption").slice(0, 200),
          severity: (["critical", "high", "medium", "low"].includes(sev) ? sev : "medium"),
          sourceTool: "reality",
          sourceReportId: reality.id,
        });
        if (ideaNodeId) {
          edges.push({ from: ideaNodeId, to: id, relationship: "creates_risk", confidence: 0.8 });
        }
      }
    } else if (assumptions.length > 0) {
      for (const a of assumptions.slice(0, 4)) {
        const id = nid("assumption");
        assumptionNodeIds.push(id);
        nodes.push({
          id,
          type: "assumption",
          label: String(a).slice(0, 60),
          description: "Assumption extracted from Reality Compiler",
          severity: score < 50 ? "high" : "medium",
          sourceTool: "reality",
          sourceReportId: reality.id,
        });
        if (ideaNodeId) {
          edges.push({ from: ideaNodeId, to: id, relationship: "depends_on", confidence: 0.7 });
        }
      }
    } else {
      const id = nid("assumption");
      assumptionNodeIds.push(id);
      const goSignal = String(d.go_signal ?? d.compile_status ?? "UNKNOWN");
      nodes.push({
        id,
        type: "assumption",
        label: `Reality signal: ${goSignal}`,
        description: `Reality Compiler returned ${goSignal} with score ${score}/100`,
        severity: goSignal === "NO-GO" || goSignal === "FAILED" ? "critical" : score < 50 ? "high" : "medium",
        score,
        sourceTool: "reality",
        sourceReportId: reality.id,
      });
    }

    if (score >= 70 && ideaNodeId) {
      insights.push({
        id: nid("insight"),
        title: "Reality Compiler validates core assumptions",
        description: `Reality score ${score}/100 — your core assumptions are holding under stress testing.`,
        severity: "low",
        actionLabel: "View report",
        actionHref: `/app/reports/${reality.id}`,
        sourceTool: "reality",
      });
    } else if (score < 50 && ideaNodeId) {
      insights.push({
        id: nid("insight"),
        title: "Critical assumption failures detected",
        description: `Reality Compiler score is ${score}/100${errors.length > 0 ? ` with ${errors.filter((e) => Boolean(e.blocks_build)).length} build-blocking errors` : ""}. Address before building.`,
        severity: "critical",
        actionLabel: "Run Reality Compiler",
        actionHref: "/app/reality",
        sourceTool: "reality",
      });
    }
  }

  // ── Proof signals ─────────────────────────────────────────────────────────
  const proofNodeIds: string[] = [];
  for (const sig of proofSignals.slice(0, 6)) {
    const id = nid("proof-signal");
    proofNodeIds.push(id);
    nodes.push({
      id,
      type: "proof-signal",
      label: (sig.label ?? `Proof signal #${proofNodeIds.length}`).slice(0, 60),
      description: `${sig.kind ?? "Validation signal"} — evidence of real demand`,
      severity: "neutral",
      sourceTool: "proof",
    });
    if (ideaNodeId) {
      edges.push({ from: id, to: ideaNodeId, relationship: "validates", confidence: 0.75 });
    }
  }

  if (proofSignals.length === 0 && ideaNodeId) {
    insights.push({
      id: nid("insight"),
      title: "No proof signals collected",
      description: "Your Product Brain has zero validation evidence. Every node is built on assumptions, not data.",
      severity: "critical",
      actionLabel: "Add proof signals",
      actionHref: "/app/proof",
      sourceTool: "proof",
    });
  } else if (proofSignals.length >= 5) {
    insights.push({
      id: nid("insight"),
      title: `${proofSignals.length} proof signals collected`,
      description: "Strong evidence base — your Product Brain has external validation anchoring the idea.",
      severity: "low",
      actionLabel: "View Proof Engine",
      actionHref: "/app/proof",
      sourceTool: "proof",
    });
  }

  // ── Risks from doctor ─────────────────────────────────────────────────────
  const riskNodeIds: string[] = [];
  if (doctor) {
    const d = extractData(doctor);
    const doctorScore = getScore(doctor);
    const gates = Array.isArray(d.gates) ? (d.gates as Array<Record<string, unknown>>) : [];
    const failedGates = gates.filter(
      (g) => String(g.status ?? g.result ?? "").toLowerCase() === "fail" || String(g.status ?? "").toLowerCase() === "red"
    );
    const codeIssues = Array.isArray(d.issues) ? (d.issues as Array<Record<string, unknown>>) : [];

    for (const gate of failedGates.slice(0, 4)) {
      const id = nid("launch-gate");
      riskNodeIds.push(id);
      nodes.push({
        id,
        type: "launch-gate",
        label: `Gate failed: ${String(gate.name ?? gate.gate ?? "Unknown gate").slice(0, 50)}`,
        description: String(gate.recommendation ?? gate.detail ?? "This gate must pass before launch").slice(0, 200),
        severity: "critical",
        sourceTool: "doctor",
        sourceReportId: doctor.id,
      });
    }

    for (const issue of codeIssues.slice(0, 3)) {
      const id = nid("code-issue");
      nodes.push({
        id,
        type: "code-issue",
        label: String(issue.title ?? issue.type ?? "Code issue").slice(0, 60),
        description: String(issue.description ?? issue.detail ?? "Identified in Project Doctor scan").slice(0, 200),
        severity: String(issue.severity ?? "medium") as BrainNode["severity"],
        sourceTool: "doctor",
        sourceReportId: doctor.id,
      });
    }

    if (doctorScore < 50) {
      insights.push({
        id: nid("insight"),
        title: `Codebase health is ${doctorScore}/100 — launch risk`,
        description: `${failedGates.length} gate${failedGates.length !== 1 ? "s" : ""} failed in Project Doctor. This is a hard blocker for launch.`,
        severity: "critical",
        actionLabel: "View Doctor report",
        actionHref: doctor.id ? `/app/reports/${doctor.id}` : "/app/doctor",
        sourceTool: "doctor",
      });
    }
  }

  // ── User segments from Swarm ──────────────────────────────────────────────
  if (swarm) {
    const d = extractData(swarm);
    const personas = Array.isArray(d.personas) ? (d.personas as Array<Record<string, unknown>>) : [];
    const segments = Array.isArray(d.user_segments) ? (d.user_segments as string[]) : [];

    for (const segment of segments.slice(0, 3)) {
      const id = nid("user-segment");
      nodes.push({
        id,
        type: "user-segment",
        label: String(segment).slice(0, 60),
        description: "User segment identified in Market Swarm simulation",
        severity: "neutral",
        sourceTool: "swarm",
        sourceReportId: swarm.id,
      });
      if (ideaNodeId) {
        edges.push({ from: ideaNodeId, to: id, relationship: "supports", confidence: 0.65 });
      }
    }

    if (segments.length === 0 && personas.length > 0) {
      for (const persona of personas.slice(0, 3)) {
        const id = nid("user-segment");
        nodes.push({
          id,
          type: "user-segment",
          label: String(persona.role ?? persona.type ?? persona.name ?? "Persona").slice(0, 60),
          description: String(persona.description ?? persona.summary ?? "Market Swarm persona").slice(0, 200),
          severity: "neutral",
          sourceTool: "swarm",
          sourceReportId: swarm.id,
        });
      }
    }

    const wtp = typeof d.willingness_to_pay === "number" ? d.willingness_to_pay : null;
    if (wtp !== null) {
      if (wtp < 30) {
        insights.push({
          id: nid("insight"),
          title: `Low willingness to pay: ${wtp}%`,
          description: "Market Swarm simulated low market payment willingness. Reconsider pricing model or strengthen value proposition.",
          severity: "high",
          actionLabel: "View Swarm results",
          actionHref: swarm.id ? `/app/reports/${swarm.id}` : "/app/swarm",
          sourceTool: "swarm",
        });
      } else if (wtp >= 60) {
        insights.push({
          id: nid("insight"),
          title: `Strong willingness to pay: ${wtp}%`,
          description: "Market Swarm shows high market payment willingness — your pricing model is supported.",
          severity: "low",
          actionLabel: "View Swarm results",
          actionHref: swarm.id ? `/app/reports/${swarm.id}` : "/app/swarm",
          sourceTool: "swarm",
        });
      }
    }
  }

  // ── Features from MVP ─────────────────────────────────────────────────────
  const featureNodeIds: string[] = [];
  if (mvp) {
    const d = extractData(mvp);
    const features = Array.isArray(d.features) ? (d.features as Array<Record<string, unknown>>) : [];

    for (const feat of features.slice(0, 5)) {
      const id = nid("feature");
      featureNodeIds.push(id);
      nodes.push({
        id,
        type: "feature",
        label: String(feat.name ?? feat.title ?? feat.feature ?? "Feature").slice(0, 60),
        description: String(feat.description ?? feat.detail ?? feat.why ?? "MVP feature").slice(0, 200),
        severity: String(feat.priority ?? "medium") === "critical" ? "critical" : "neutral",
        sourceTool: "mvp",
        sourceReportId: mvp.id,
      });
      if (ideaNodeId) {
        edges.push({ from: ideaNodeId, to: id, relationship: "supports", confidence: 0.8 });
      }
    }
  }

  // ── Tasks ─────────────────────────────────────────────────────────────────
  for (const task of tasks.filter((t) => t.status !== "completed" && t.priority === "critical").slice(0, 3)) {
    const id = nid("task");
    nodes.push({
      id,
      type: "task",
      label: (task.title ?? "Critical task").slice(0, 60),
      description: "Critical task — blocking current progress",
      severity: "critical",
      sourceTool: task.category ?? "tasks",
    });
  }

  // ── Monetization node ─────────────────────────────────────────────────────
  if (mvp) {
    const d = extractData(mvp);
    const pricingModel = String(d.pricing_model ?? d.monetization ?? "");
    if (pricingModel) {
      const id = nid("monetization-idea");
      nodes.push({
        id,
        type: "monetization-idea",
        label: `Monetization: ${pricingModel.slice(0, 50)}`,
        description: "Pricing model from MVP Planner",
        severity: "neutral",
        sourceTool: "mvp",
        sourceReportId: mvp.id,
      });
      if (ideaNodeId) {
        edges.push({ from: ideaNodeId, to: id, relationship: "supports", confidence: 0.7 });
      }
    }
  }

  // ── Launch readiness insight ──────────────────────────────────────────────
  if (launch) {
    const launchScore = getScore(launch);
    const launchData = extractData(launch);
    const goNoGo = String(launchData.go_no_go ?? launchData.recommendation ?? "");

    if (launchScore >= 70 && (!doctor || getScore(doctor) >= 60)) {
      insights.push({
        id: nid("insight"),
        title: "Launch readiness looks strong",
        description: `Launch Room scores ${launchScore}/100${goNoGo ? ` — ${goNoGo}` : ""}. Proceed to final checks.`,
        severity: "low",
        actionLabel: "View Launch Room",
        actionHref: launch.id ? `/app/reports/${launch.id}` : "/app/launch",
        sourceTool: "launch",
      });
    } else if (launchScore < 60) {
      insights.push({
        id: nid("insight"),
        title: `Launch readiness at ${launchScore}/100`,
        description: "Launch Room signals are not ready. Resolve blockers before shipping.",
        severity: "high",
        actionLabel: "View Launch Room",
        actionHref: launch.id ? `/app/reports/${launch.id}` : "/app/launch",
        sourceTool: "launch",
      });
    }
  }

  // ── Overall brain health insight ──────────────────────────────────────────
  const coveredTools = new Set(reports.map((r) => r.tool));
  if (coveredTools.size === 0) {
    insights.push({
      id: nid("insight"),
      title: "Product Brain is empty",
      description: "No intelligence tools have been run yet. Start with Idea Checker to build your first intelligence layer.",
      severity: "critical",
      actionLabel: "Run Idea Checker",
      actionHref: "/app/idea",
      sourceTool: "idea",
    });
  } else if (coveredTools.size < 3) {
    insights.push({
      id: nid("insight"),
      title: `Product Brain: ${coveredTools.size}/7 tools run`,
      description: "Your intelligence coverage is low — significant blind spots remain. Run more tools to complete the picture.",
      severity: "high",
      actionLabel: "View coverage",
      actionHref: "/app",
      sourceTool: "idea",
    });
  }

  // ── Clusters ──────────────────────────────────────────────────────────────
  const clusters: BrainCluster[] = [];

  const validationNodes = nodes.filter((n) => ["assumption", "proof-signal", "objection"].includes(n.type));
  const techNodes = nodes.filter((n) => ["launch-gate", "code-issue"].includes(n.type));
  const marketNodes = nodes.filter((n) => ["user-segment", "monetization-idea", "retention-loop"].includes(n.type));
  const buildNodes = nodes.filter((n) => ["feature", "task"].includes(n.type));

  if (validationNodes.length > 0) {
    const hasCritical = validationNodes.some((n) => n.severity === "critical" || n.severity === "high");
    clusters.push({
      id: "cluster-validation",
      name: "Validation",
      nodeIds: validationNodes.map((n) => n.id),
      theme: "assumptions, proof, objections",
      healthSignal: hasCritical ? "red" : proofSignals.length >= 3 ? "green" : "amber",
    });
  }

  if (techNodes.length > 0) {
    const hasCritical = techNodes.some((n) => n.severity === "critical");
    clusters.push({
      id: "cluster-technical",
      name: "Technical Health",
      nodeIds: techNodes.map((n) => n.id),
      theme: "code quality, launch gates, codebase issues",
      healthSignal: hasCritical ? "red" : "amber",
    });
  }

  if (marketNodes.length > 0) {
    clusters.push({
      id: "cluster-market",
      name: "Market Intelligence",
      nodeIds: marketNodes.map((n) => n.id),
      theme: "user segments, monetization, retention",
      healthSignal: "amber",
    });
  }

  if (buildNodes.length > 0) {
    const hasCritical = buildNodes.some((n) => n.severity === "critical");
    clusters.push({
      id: "cluster-build",
      name: "Build Plan",
      nodeIds: buildNodes.map((n) => n.id),
      theme: "MVP features, tasks",
      healthSignal: hasCritical ? "red" : "green",
    });
  }

  return { nodes, edges, clusters, insights };
}
