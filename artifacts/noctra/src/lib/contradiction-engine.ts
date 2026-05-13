// contradiction-engine.ts — Enhanced cross-report contradiction detection
// Pure utility: no React, no side effects.

import type { ReportSummary } from "./intelligence";

export interface EnhancedContradiction {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  conflictType:
    | "target-user-mismatch"
    | "pricing-mismatch"
    | "launch-readiness-mismatch"
    | "scope-conflict"
    | "proof-launch-conflict"
    | "health-launch-conflict"
    | "willingness-to-pay"
    | "score-divergence"
    | "assumption-conflict"
    | "timing-conflict";
  sourceA: { tool: string; label: string; reportId?: string };
  sourceB: { tool: string; label: string; reportId?: string };
  explanation: string;
  whyItMatters: string;
  recommendedResolution: string;
  suggestedTask: string;
}

export interface ContradictionEngineResult {
  contradictions: EnhancedContradiction[];
  alignmentScore: number;
  topResolution: string | null;
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

function latestByTool(reports: ReportSummary[]): Map<string, ReportSummary> {
  const byTool = new Map<string, ReportSummary>();
  for (const r of [...reports].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )) {
    if (!byTool.has(r.tool)) byTool.set(r.tool, r);
  }
  return byTool;
}

function label(tool: string): string {
  return TOOL_LABELS[tool] ?? tool;
}

export function runContradictionEngine(reports: ReportSummary[]): ContradictionEngineResult {
  const contradictions: EnhancedContradiction[] = [];
  const byTool = latestByTool(reports);

  const idea = byTool.get("idea");
  const reality = byTool.get("reality");
  const proof = byTool.get("proof");
  const mvp = byTool.get("mvp");
  const swarm = byTool.get("swarm");
  const doctor = byTool.get("doctor");
  const launch = byTool.get("launch");

  // ── 1. Idea strong, Reality NO-GO ───────────────────────────────────────
  if (idea && reality) {
    const ideaScore = getScore(idea);
    const realityData = extractData(reality);
    const goSignal = String(realityData.go_signal ?? realityData.compile_status ?? "");

    if (ideaScore >= 70 && (goSignal === "NO-GO" || goSignal === "FAILED")) {
      contradictions.push({
        id: "idea-reality-signal",
        title: "High idea score but Reality compiler failed",
        severity: "critical",
        conflictType: "assumption-conflict",
        sourceA: { tool: "idea", label: label("idea"), reportId: idea.id },
        sourceB: { tool: "reality", label: label("reality"), reportId: reality.id },
        explanation: `Idea Checker scored ${ideaScore}/100 (strong) but Reality Compiler returned ${goSignal}. Your strongest assumptions may be the most dangerous ones — confirmation bias is likely distorting the idea score.`,
        whyItMatters: "Founders who score their idea highly while failing reality checks are the most at risk of building something nobody needs. The gap between these two signals is a red flag.",
        recommendedResolution: "Re-run Reality Compiler focusing on each assumption the Idea Checker deemed strong. Look for hidden market size assumptions, user behavior assumptions, and competition blind spots.",
        suggestedTask: "Identify the top 3 assumptions driving the high idea score and write a falsification test for each one.",
      });
    }

    if (ideaScore < 45 && (goSignal === "GO" || goSignal === "PASSED")) {
      contradictions.push({
        id: "idea-reality-weak-go",
        title: "Weak idea signal but Reality says GO",
        severity: "high",
        conflictType: "assumption-conflict",
        sourceA: { tool: "idea", label: label("idea"), reportId: idea.id },
        sourceB: { tool: "reality", label: label("reality"), reportId: reality.id },
        explanation: `Idea Checker scored ${ideaScore}/100 (weak) but Reality Compiler returned GO. You may be pressure-testing a different version of the idea than what was originally analyzed.`,
        whyItMatters: "A GO on a weak idea suggests the reality check input was too optimistic. The idea needs to be reformulated with honest market assumptions before the GO signal is trustworthy.",
        recommendedResolution: "Sharpen the idea formulation, re-run Idea Checker with the refined version, then re-run Reality Compiler using consistent assumptions.",
        suggestedTask: "Rewrite the idea description with explicit target user, problem, and pricing assumptions before re-running both tools.",
      });
    }
  }

  // ── 2. Launch ready but Doctor failed ────────────────────────────────────
  if (launch && doctor) {
    const launchScore = getScore(launch);
    const doctorScore = getScore(doctor);
    if (launchScore >= 65 && doctorScore < 50) {
      contradictions.push({
        id: "launch-doctor-health",
        title: "Launch-ready signal on a failing codebase",
        severity: "critical",
        conflictType: "health-launch-conflict",
        sourceA: { tool: "launch", label: label("launch"), reportId: launch.id },
        sourceB: { tool: "doctor", label: label("doctor"), reportId: doctor.id },
        explanation: `Launch Room shows ${launchScore}/100 readiness but Project Doctor health is ${doctorScore}/100. You're planning to launch on a broken technical foundation.`,
        whyItMatters: "Launching with a sub-50 health score means production incidents within hours. User trust, once broken at launch, is extremely hard to recover.",
        recommendedResolution: `Resolve all RED gates from Project Doctor first. Re-run Doctor scan after fixes. Only proceed to launch when Doctor score exceeds 70/100.`,
        suggestedTask: "Fix all critical Project Doctor failures — prioritize security, authentication, error handling, and deployment gates.",
      });
    }
  }

  // ── 3. Proof weak but Launch says ready ──────────────────────────────────
  if (proof && launch) {
    const proofScore = getScore(proof);
    const launchScore = getScore(launch);
    if (proofScore < 45 && launchScore >= 60) {
      contradictions.push({
        id: "proof-launch-conflict",
        title: "Launching without proof of demand",
        severity: "high",
        conflictType: "proof-launch-conflict",
        sourceA: { tool: "proof", label: label("proof"), reportId: proof.id },
        sourceB: { tool: "launch", label: label("launch"), reportId: launch.id },
        explanation: `Proof Engine score is ${proofScore}/100 (insufficient validation) but Launch Room scores ${launchScore}/100. You may be launching without evidence that anyone wants this product.`,
        whyItMatters: "Products that launch without proof of demand fail within 3 months. A low proof score means you're optimizing for launch speed at the expense of product-market fit.",
        recommendedResolution: "Collect at least 5 strong proof signals (user interviews, landing page signups, LOIs, pilot agreements) before treating the Launch score as valid.",
        suggestedTask: "Add 3 high-quality proof signals to Proof Engine before proceeding with launch planning.",
      });
    }
  }

  // ── 4. Swarm low willingness to pay but MVP assumes paid ─────────────────
  if (swarm && mvp) {
    const swarmData = extractData(swarm);
    const mvpData = extractData(mvp);
    const willingnessToPay = typeof swarmData.willingness_to_pay === "number" ? swarmData.willingness_to_pay : null;
    const pricingModel = String(mvpData.pricing_model ?? mvpData.monetization ?? "").toLowerCase();
    const hasPaidModel = pricingModel.includes("paid") || pricingModel.includes("subscription") || pricingModel.includes("premium");

    if (willingnessToPay !== null && willingnessToPay < 40 && hasPaidModel) {
      contradictions.push({
        id: "swarm-mvp-pricing",
        title: "Swarm shows low willingness to pay but MVP assumes paid model",
        severity: "high",
        conflictType: "pricing-mismatch",
        sourceA: { tool: "swarm", label: label("swarm"), reportId: swarm.id },
        sourceB: { tool: "mvp", label: label("mvp"), reportId: mvp.id },
        explanation: `Market Swarm simulated ${willingnessToPay}% willingness to pay but MVP Planner plans a paid model. You risk building a paid product nobody will purchase.`,
        whyItMatters: "Willingness-to-pay signals below 50% mean your pricing model must either change or your value proposition needs significant strengthening.",
        recommendedResolution: "Either run a freemium model first to prove retention, or redesign the value proposition to justify the price. Re-run Swarm after the pivot.",
        suggestedTask: "Run a pricing experiment — create a landing page with explicit pricing and measure conversion rate before building the payment flow.",
      });
    }
  }

  // ── 5. MVP scope expanding across runs ────────────────────────────────────
  const mvpReports = reports
    .filter((r) => r.tool === "mvp")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (mvpReports.length >= 2) {
    const latestScore = getScore(mvpReports[0]);
    const prevScore = getScore(mvpReports[1]);
    if (latestScore < prevScore - 10) {
      contradictions.push({
        id: "mvp-scope-creep",
        title: "MVP scope is growing across runs",
        severity: "medium",
        conflictType: "scope-conflict",
        sourceA: { tool: "mvp", label: label("mvp"), reportId: mvpReports[1].id },
        sourceB: { tool: "mvp", label: label("mvp"), reportId: mvpReports[0].id },
        explanation: `MVP score dropped from ${prevScore} to ${latestScore} across MVP Planner runs — scope is likely expanding instead of contracting.`,
        whyItMatters: "Scope creep is the most common reason MVPs take 3x longer to ship. Each added feature is a bet that customers need it — without proof.",
        recommendedResolution: "Return to first principles: what is the single user action that proves this MVP works? Cut everything else. Ship the smallest version first.",
        suggestedTask: "Create a 'cut list' — features that were in the last MVP plan but not the original. Archive them as phase 2.",
      });
    }
  }

  // ── 6. Building too fast without proof ─────────────────────────────────
  if (idea && mvp && !proof) {
    const ideaDate = new Date(idea.created_at).getTime();
    const mvpDate = new Date(mvp.created_at).getTime();
    const daysBetween = (mvpDate - ideaDate) / (1000 * 60 * 60 * 24);
    if (daysBetween < 1) {
      contradictions.push({
        id: "mvp-no-proof",
        title: "Planning to build without any validation",
        severity: "medium",
        conflictType: "timing-conflict",
        sourceA: { tool: "idea", label: label("idea"), reportId: idea.id },
        sourceB: { tool: "mvp", label: label("mvp"), reportId: mvp.id },
        explanation: "Idea Checker and MVP Planner run on the same day with no Proof Engine — you may be planning a full build before validating demand.",
        whyItMatters: "Running idea and MVP tools on the same day without proof means you're planning to build based on untested assumptions. This is the #1 startup mistake.",
        recommendedResolution: "Run Proof Engine before finalizing MVP scope. Build only what validated demand requires.",
        suggestedTask: "Run 3 user discovery interviews this week before committing to the MVP feature list.",
      });
    }
  }

  // ── 7. Proof high but evidence gaps flagged ─────────────────────────────
  if (proof) {
    const proofData = extractData(proof);
    const proofScore = getScore(proof);
    const gaps = Array.isArray(proofData.evidence_gaps) ? proofData.evidence_gaps.length : 0;
    if (proofScore >= 65 && gaps >= 3) {
      contradictions.push({
        id: "proof-gaps-inflated",
        title: "Proof score may be inflated despite evidence gaps",
        severity: "medium",
        conflictType: "assumption-conflict",
        sourceA: { tool: "proof", label: label("proof"), reportId: proof.id },
        sourceB: { tool: "proof", label: label("proof"), reportId: proof.id },
        explanation: `Proof Engine scores ${proofScore}/100 but flagged ${gaps} unaddressed evidence gaps. The score may be inflated by low-quality or self-reported signals.`,
        whyItMatters: "A proof score that's high due to weak signals gives false confidence. Investors and customers will probe these gaps directly.",
        recommendedResolution: "Close at least 2 of the flagged evidence gaps with external, verifiable validation before treating the proof score as launch-ready.",
        suggestedTask: "Address the top 2 evidence gaps identified in Proof Engine — convert them to concrete experiments with measurable outcomes.",
      });
    }
  }

  // ── Compute alignment score ─────────────────────────────────────────────
  const toolCount = byTool.size;
  const criticalCount = contradictions.filter((c) => c.severity === "critical").length;
  const highCount = contradictions.filter((c) => c.severity === "high").length;
  const mediumCount = contradictions.filter((c) => c.severity === "medium").length;

  const penaltyPoints = criticalCount * 25 + highCount * 15 + mediumCount * 7;
  const toolBonus = Math.min(30, toolCount * 5);
  const alignmentScore = Math.max(0, Math.min(100, 70 + toolBonus - penaltyPoints));

  const topResolution = contradictions.length > 0
    ? contradictions.sort((a, b) => {
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        return order[a.severity] - order[b.severity];
      })[0].recommendedResolution
    : null;

  return {
    contradictions,
    alignmentScore,
    topResolution,
  };
}
