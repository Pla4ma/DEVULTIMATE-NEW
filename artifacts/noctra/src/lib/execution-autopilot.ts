// execution-autopilot.ts — Generates an executable build package from all intelligence
// Pure utility: no React, no side effects.

import type { ReportSummary } from "./intelligence";

export interface AutopilotTask {
  title: string;
  detail: string;
  priority: "critical" | "high" | "medium";
  category: string;
  estimatedHours: number;
}

export interface ExecutionPackage {
  title: string;
  goal: string;
  taskBatch: AutopilotTask[];
  promptPack: string;
  acceptanceCriteria: string[];
  testPlan: string[];
  expectedOutcome: string;
  riskIfIgnored: string;
}

type TaskLike = {
  id: string;
  title?: string;
  status: string;
  priority: string;
  category?: string | null;
};

type ProofSignalLike = { id: string };

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

export function generateExecutionPackage(params: {
  reports: ReportSummary[];
  tasks: TaskLike[];
  proofSignals: ProofSignalLike[];
}): ExecutionPackage {
  const { reports, tasks, proofSignals } = params;

  // Latest report per tool
  const byTool = new Map<string, ReportSummary>();
  for (const r of [...reports].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )) {
    if (!byTool.has(r.tool)) byTool.set(r.tool, r);
  }

  const doctor = byTool.get("doctor");
  const mvp = byTool.get("mvp");
  const reality = byTool.get("reality");
  const launch = byTool.get("launch");
  const proof = byTool.get("proof");

  const openCritical = tasks.filter((t) => t.status !== "completed" && t.priority === "critical");
  const openHigh = tasks.filter((t) => t.status !== "completed" && t.priority === "high");
  const coveredTools = new Set(reports.map((r) => r.tool));

  const taskBatch: AutopilotTask[] = [];
  const acceptanceCriteria: string[] = [];
  const testPlan: string[] = [];

  // Determine the primary goal
  let title = "Execution Package";
  let goal = "Clear current blockers and advance product readiness.";
  let expectedOutcome = "Measurable improvement in product readiness and reduced risk.";
  let riskIfIgnored = "Continued build investment on an unvalidated foundation.";

  // ── Doctor failures ────────────────────────────────────────────────────
  if (doctor && getScore(doctor) < 60) {
    const doctorData = extractData(doctor);
    const gates = Array.isArray(doctorData.gates) ? (doctorData.gates as Array<Record<string, unknown>>) : [];
    const failedGates = gates.filter(
      (g) => String(g.status ?? g.result ?? "").toLowerCase() === "fail" || String(g.status ?? "").toLowerCase() === "red"
    );

    title = "Codebase Health Execution Package";
    goal = `Fix ${failedGates.length || "critical"} Project Doctor failures and bring health score above 70/100.`;
    expectedOutcome = "Project Doctor score ≥ 70, all critical gates passing, production-ready codebase.";
    riskIfIgnored = "Launching with the current health score risks immediate production incidents, security breaches, and user data loss.";

    if (failedGates.length > 0) {
      for (const gate of failedGates.slice(0, 5)) {
        const gateName = String(gate.name ?? gate.gate ?? gate.check ?? "Failed gate");
        taskBatch.push({
          title: `Fix: ${gateName}`,
          detail: String(gate.recommendation ?? gate.fix ?? gate.detail ?? `Address the ${gateName} failure identified in Project Doctor`),
          priority: "critical",
          category: "technical",
          estimatedHours: 2,
        });
        acceptanceCriteria.push(`${gateName} gate passes with GREEN status in the next Project Doctor scan`);
        testPlan.push(`Re-run Project Doctor after fixing ${gateName} — verify gate status changes to PASS`);
      }
    } else {
      taskBatch.push({
        title: "Audit and improve codebase health",
        detail: "Review all Project Doctor findings and address the highest-severity issues first — focus on security, error handling, and deployment configuration.",
        priority: "critical",
        category: "technical",
        estimatedHours: 4,
      });
    }
  }

  // ── Reality failures ─────────────────────────────────────────────────
  else if (reality && getScore(reality) < 50) {
    const realityData = extractData(reality);
    const errors = Array.isArray(realityData.errors) ? (realityData.errors as Array<Record<string, unknown>>) : [];
    const blockingErrors = errors.filter((e) => Boolean(e.blocks_build));

    title = "Assumption Resolution Execution Package";
    goal = `Resolve ${blockingErrors.length || "critical"} Reality Compiler errors and re-run to achieve a passing compile status.`;
    expectedOutcome = "Reality Compiler returns PASSED or WARNING, all blocking errors addressed, clear go/no-go signal.";
    riskIfIgnored = "Building on failing assumptions means shipping a product the market does not want.";

    if (blockingErrors.length > 0) {
      for (const error of blockingErrors.slice(0, 5)) {
        const code = String(error.code ?? "ERROR");
        const fix = String(error.fix ?? error.recommendation ?? "Address this blocking error");
        taskBatch.push({
          title: `Fix ${code}`,
          detail: fix,
          priority: "critical",
          category: "validation",
          estimatedHours: 3,
        });
        acceptanceCriteria.push(`${code} error is resolved and no longer appears in the Reality Compiler output`);
        testPlan.push(`Re-run Reality Compiler and verify ${code} is no longer flagged`);
      }
    }
  }

  // ── Proof gaps ─────────────────────────────────────────────────────
  else if (proofSignals.length < 3) {
    title = "Proof Collection Execution Package";
    goal = `Collect ${3 - proofSignals.length} more strong proof signals to justify build investment.`;
    expectedOutcome = `${3 - proofSignals.length + proofSignals.length}+ proof signals with diverse evidence types, Proof Engine score ≥ 60.`;
    riskIfIgnored = "Building without proof of demand is the #1 reason startups fail — you're betting your runway on unvalidated assumptions.";

    taskBatch.push(
      {
        title: "Run 3 user discovery interviews",
        detail: "Talk to potential users about the problem you're solving. Don't pitch — ask about their current workflow, pain points, and what they've tried. Record and transcribe.",
        priority: "critical",
        category: "validation",
        estimatedHours: 5,
      },
      {
        title: "Create a landing page and measure conversion",
        detail: "Build a 1-page description of your solution with a signup or waitlist form. Drive 50+ visitors from your target audience and measure conversion rate.",
        priority: "critical",
        category: "validation",
        estimatedHours: 4,
      },
      {
        title: "Collect one Letter of Intent or pilot agreement",
        detail: "Identify one potential early customer willing to pay or commit to a pilot. Even informal agreements count — the goal is external validation of willingness to exchange value.",
        priority: "high",
        category: "validation",
        estimatedHours: 8,
      }
    );

    acceptanceCriteria.push(
      "3+ proof signals logged in Proof Engine with documented sources",
      "At least 1 external validation (not self-reported or assumed)",
      "Proof Engine score improves to ≥ 55/100"
    );

    testPlan.push(
      "Review interview recordings for consistent pain points (signal: same problem mentioned by 3+ users)",
      "Check landing page conversion rate against industry benchmark (signal: ≥ 2% conversion)",
      "Re-run Proof Engine with updated signals and verify score improvement"
    );
  }

  // ── Open critical tasks ──────────────────────────────────────────────
  else if (openCritical.length > 0) {
    title = "Critical Task Clearance Package";
    goal = `Resolve ${openCritical.length} critical task${openCritical.length > 1 ? "s" : ""} blocking current progress.`;
    expectedOutcome = "All critical tasks resolved, build pipeline unblocked, ready for next intelligence pass.";
    riskIfIgnored = "Critical tasks compound — each day they remain open adds risk and reduces team velocity.";

    for (const task of openCritical.slice(0, 5)) {
      taskBatch.push({
        title: task.title ?? "Resolve critical task",
        detail: `Complete this critical task — it's blocking ${openHigh.length > 0 ? `${openHigh.length} high-priority items` : "downstream progress"}`,
        priority: "critical",
        category: task.category ?? "general",
        estimatedHours: 3,
      });
    }

    acceptanceCriteria.push(
      `All ${openCritical.length} critical tasks marked complete`,
      "No new critical tasks created without a corresponding resolution plan",
      "High-priority task queue reviewed and re-prioritized"
    );

    testPlan.push(
      "Review each completed critical task for completeness — check that the underlying problem is fully resolved, not just closed",
      "Re-run any affected intelligence tools to verify improvement"
    );
  }

  // ── Default: tool coverage expansion ────────────────────────────────
  else {
    const missingTools = ["idea", "reality", "proof", "swarm", "mvp", "doctor", "launch"].filter(
      (t) => !coveredTools.has(t)
    );
    const nextTool = missingTools[0];

    title = nextTool
      ? `Intelligence Expansion: ${nextTool.charAt(0).toUpperCase() + nextTool.slice(1)}`
      : "Full Intelligence Pass";

    goal = nextTool
      ? `Run ${nextTool} analysis to eliminate a key intelligence blind spot.`
      : "Re-run all intelligence tools with updated context and resolve any new findings.";

    expectedOutcome = nextTool
      ? `${nextTool} report generated, blind spot eliminated, next action clearly identified.`
      : "All tools re-run, full intelligence picture updated, prioritized action list ready.";

    riskIfIgnored = "Intelligence blind spots lead to expensive pivots — unknown risks are the most dangerous ones.";

    if (nextTool) {
      taskBatch.push({
        title: `Prepare and run ${nextTool} analysis`,
        detail: `Gather current product context, assumptions, and any recent changes before running the ${nextTool} tool for the most accurate results.`,
        priority: "high",
        category: "intelligence",
        estimatedHours: 1,
      });
    }

    acceptanceCriteria.push(
      "New intelligence report generated and reviewed",
      "Any new contradictions or risks identified and added to task queue",
      "Next action clearly defined based on updated intelligence"
    );

    testPlan.push(
      "Review new report against previous reports for score changes",
      "Check for new contradictions introduced by the updated analysis"
    );
  }

  // ── Build the Replit/Cursor prompt ───────────────────────────────────

  const toolsSummary = [...coveredTools].join(", ") || "none yet";
  const scores: string[] = [];
  for (const [tool, report] of byTool.entries()) {
    const s = getScore(report);
    if (s > 0) scores.push(`${tool}=${s}/100`);
  }

  const doctorGates = doctor
    ? (() => {
        const d = extractData(doctor);
        const gates = Array.isArray(d.gates) ? (d.gates as Array<Record<string, unknown>>) : [];
        return gates
          .filter((g) => String(g.status ?? g.result ?? "").toLowerCase() === "fail" || String(g.status ?? "").toLowerCase() === "red")
          .map((g) => String(g.name ?? g.gate ?? "gate"))
          .slice(0, 3)
          .join(", ");
      })()
    : "";

  const promptPack = `You are a senior software engineer and startup advisor helping me execute a critical development task.

## Project Context
- Intelligence tools run: ${toolsSummary}
- Scores: ${scores.join(", ") || "none yet"}
- Open critical tasks: ${openCritical.length}
- Proof signals: ${proofSignals.length}
${doctorGates ? `- Failed Project Doctor gates: ${doctorGates}` : ""}

## Current Task
**${title}**

Goal: ${goal}

## Task Batch
${taskBatch
  .map(
    (t, i) => `${i + 1}. [${t.priority.toUpperCase()}] ${t.title}
   → ${t.detail}
   → Estimated: ${t.estimatedHours}h`
  )
  .join("\n\n")}

## Acceptance Criteria
${acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}

## Test Plan
${testPlan.map((t, i) => `${i + 1}. ${t}`).join("\n")}

## Expected Outcome
${expectedOutcome}

## Risk If Ignored
${riskIfIgnored}

Please help me execute task 1 first. Start with a concrete implementation plan, then write the code or guide me through the steps.`;

  return {
    title,
    goal,
    taskBatch,
    promptPack,
    acceptanceCriteria,
    testPlan,
    expectedOutcome,
    riskIfIgnored,
  };
}
