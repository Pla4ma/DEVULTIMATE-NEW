// roadmap.ts — Intelligent roadmap generator from all project intelligence
// Pure utility: no React, no side effects.

import type { ReportSummary } from "./intelligence";

export interface RoadmapItem {
  id: string;
  title: string;
  reason: string;
  priority: "critical" | "high" | "medium" | "low";
  tool: string;
  isBlocker: boolean;
  sourceReportId?: string;
  tags: string[];
}

export interface RoadmapPhase {
  id: string;
  name: string;
  description: string;
  items: RoadmapItem[];
  estimatedDays: number;
}

export interface Roadmap {
  phases: RoadmapPhase[];
  now: RoadmapItem[];
  next: RoadmapItem[];
  later: RoadmapItem[];
  kill: string[];
  criticalPath: string[];
  launchMinimum: string[];
  recommendedSprint: {
    goal: string;
    items: RoadmapItem[];
    estimatedDays: number;
  };
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

let _idCounter = 0;
function uid(prefix: string): string {
  return `${prefix}-${++_idCounter}`;
}

export function generateRoadmap(params: {
  reports: ReportSummary[];
  tasks: TaskLike[];
  proofSignals: ProofSignalLike[];
}): Roadmap {
  _idCounter = 0;

  const { reports, tasks, proofSignals } = params;
  const now: RoadmapItem[] = [];
  const next: RoadmapItem[] = [];
  const later: RoadmapItem[] = [];
  const kill: string[] = [];

  // Sort reports newest-first per tool
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
  const doctor = byTool.get("doctor");
  const launch = byTool.get("launch");
  const swarm = byTool.get("swarm");

  const openCriticalTasks = tasks.filter((t) => t.status !== "completed" && t.priority === "critical");
  const openHighTasks = tasks.filter((t) => t.status !== "completed" && t.priority === "high");

  // ── NOW: Immediate blockers ─────────────────────────────────────────────

  // Critical tasks always come first
  for (const task of openCriticalTasks.slice(0, 3)) {
    now.push({
      id: uid("task"),
      title: task.title ?? "Resolve critical task",
      reason: "Marked critical — blocking all downstream progress",
      priority: "critical",
      tool: task.category ?? "tasks",
      isBlocker: true,
      tags: ["critical", "existing-task"],
    });
  }

  // Doctor failures before launch
  if (doctor) {
    const doctorScore = getScore(doctor);
    const doctorData = extractData(doctor);
    if (doctorScore < 60) {
      const gates = Array.isArray(doctorData.gates) ? doctorData.gates : [];
      const failedGates = (gates as Array<Record<string, unknown>>)
        .filter((g) => String(g.status ?? g.result ?? "").toLowerCase() === "fail" || String(g.status ?? "").toLowerCase() === "red")
        .map((g) => String(g.name ?? g.gate ?? g.check ?? "gate"));

      if (failedGates.length > 0) {
        now.push({
          id: uid("doctor"),
          title: `Fix ${failedGates.length} failed Project Doctor gate${failedGates.length > 1 ? "s" : ""}`,
          reason: `Diagnostic Bay score is ${doctorScore}/100. Failed: ${failedGates.slice(0, 2).join(", ")}${failedGates.length > 2 ? "…" : ""}`,
          priority: "critical",
          tool: "doctor",
          isBlocker: true,
          sourceReportId: doctor.id,
          tags: ["doctor", "launch-blocker", "technical"],
        });
      } else {
        now.push({
          id: uid("doctor"),
          title: `Improve codebase health from ${doctorScore}/100`,
          reason: "Low Diagnostic Bay score signals critical technical risks before launch",
          priority: "high",
          tool: "doctor",
          isBlocker: doctorScore < 40,
          sourceReportId: doctor.id,
          tags: ["doctor", "technical"],
        });
      }
    }
  }

  // Weak proof before heavy build
  if (proofSignals.length < 3) {
    now.push({
      id: uid("proof"),
      title: "Collect at least 3 strong proof signals",
      reason: `Only ${proofSignals.length} proof signal${proofSignals.length === 1 ? "" : "s"} collected — insufficient to justify build investment`,
      priority: proofSignals.length === 0 ? "critical" : "high",
      tool: "proof",
      isBlocker: proofSignals.length === 0,
      tags: ["proof", "validation"],
    });
  }

  // Reality failures
  if (reality) {
    const realityData = extractData(reality);
    const realityScore = getScore(reality);
    const goSignal = String(realityData.go_signal ?? realityData.compile_status ?? "");
    if (goSignal === "NO-GO" || goSignal === "FAILED" || realityScore < 45) {
      const errors = Array.isArray(realityData.errors) ? realityData.errors : [];
      const blockingErrors = (errors as Array<Record<string, unknown>>).filter((e) => Boolean(e.blocks_build));

      now.push({
        id: uid("reality"),
        title: blockingErrors.length > 0
          ? `Resolve ${blockingErrors.length} blocking Reality Compiler error${blockingErrors.length > 1 ? "s" : ""}`
          : "Address Pressure Matrix failures before building",
        reason: `Reality score is ${realityScore}/100${goSignal ? ` — ${goSignal}` : ""}. Building on failing assumptions wastes runway.`,
        priority: "critical",
        tool: "reality",
        isBlocker: true,
        sourceReportId: reality.id,
        tags: ["reality", "validation", "assumption"],
      });
    }
  }

  // ── NEXT: Near-term important items ────────────────────────────────────

  // High-priority existing tasks
  for (const task of openHighTasks.slice(0, 3)) {
    next.push({
      id: uid("task-high"),
      title: task.title ?? "Resolve high-priority task",
      reason: "High-priority task in queue — clear these to maintain velocity",
      priority: "high",
      tool: task.category ?? "tasks",
      isBlocker: false,
      tags: ["high-priority", "existing-task"],
    });
  }

  // Missing tools in sequence
  const toolSequence = ["idea", "reality", "proof", "swarm", "mvp", "doctor", "launch"];
  const coveredTools = new Set(reports.map((r) => r.tool));
  const toolDescriptions: Record<string, string> = {
    idea: "Run Signal Chamber — validate your core idea before building anything",
    reality: "Run Pressure Matrix — stress-test your top assumptions",
    proof: "Run Proof Reactor — track and score real validation evidence",
    swarm: "Run Swarm Field — simulate 25+ user personas reacting to your product",
    mvp: "Run Blueprint Board — create a week-by-week build plan",
    doctor: "Run Diagnostic Bay — scan codebase for launch blockers",
    launch: "Run Launch Control — final go/no-go assessment",
  };

  for (const tool of toolSequence) {
    if (!coveredTools.has(tool)) {
      const isNextInSequence = toolSequence.filter((t) => !coveredTools.has(t))[0] === tool;
      const bucket = isNextInSequence ? next : later;
      bucket.push({
        id: uid(`run-${tool}`),
        title: toolDescriptions[tool] ?? `Run ${tool}`,
        reason: `${tool.charAt(0).toUpperCase() + tool.slice(1)} analysis is missing — blind spot in your intelligence coverage`,
        priority: isNextInSequence ? "high" : "medium",
        tool,
        isBlocker: false,
        tags: ["tool-coverage", tool],
      });
    }
  }

  // Low swarm willingness to pay → pricing experiment
  if (swarm) {
    const swarmData = extractData(swarm);
    const wtp = typeof swarmData.willingness_to_pay === "number" ? swarmData.willingness_to_pay : null;
    if (wtp !== null && wtp < 50) {
      next.push({
        id: uid("swarm-pricing"),
        title: "Run pricing experiment before building payment flow",
        reason: `Swarm Field shows ${wtp}% willingness to pay — too low to build a paid product without validation`,
        priority: "high",
        tool: "swarm",
        isBlocker: false,
        sourceReportId: swarm.id,
        tags: ["pricing", "monetization", "validation"],
      });
    }
  }

  // MVP scope cut recommendation
  if (mvp) {
    const mvpData = extractData(mvp);
    const featureList = Array.isArray(mvpData.features) ? mvpData.features : [];
    const weekCount = typeof mvpData.timeline_weeks === "number" ? mvpData.timeline_weeks : 0;
    if (featureList.length > 8 || weekCount > 8) {
      next.push({
        id: uid("mvp-cut"),
        title: "Cut MVP scope — too many features for a first ship",
        reason: `Blueprint Board lists ${featureList.length > 0 ? featureList.length + " features" : "too many features"}${weekCount > 8 ? ` across ${weekCount} weeks` : ""}. Ship the smallest version first.`,
        priority: "high",
        tool: "mvp",
        isBlocker: false,
        sourceReportId: mvp.id,
        tags: ["mvp", "scope", "execution"],
      });
    }
  }

  // ── LATER: Nice-to-have improvements ───────────────────────────────────

  if (launch) {
    const launchScore = getScore(launch);
    const launchData = extractData(launch);
    const checklistItems = Array.isArray(launchData.checklist) ? launchData.checklist : [];
    const incomplete = (checklistItems as Array<Record<string, unknown>>).filter(
      (c) => !Boolean(c.complete) && !Boolean(c.done) && String(c.status ?? "").toLowerCase() !== "complete"
    );
    if (incomplete.length > 0 && launchScore >= 60) {
      later.push({
        id: uid("launch-checklist"),
        title: `Complete ${incomplete.length} launch checklist item${incomplete.length > 1 ? "s" : ""}`,
        reason: "Launch Control checklist has incomplete items — required before shipping",
        priority: "medium",
        tool: "launch",
        isBlocker: false,
        sourceReportId: launch.id,
        tags: ["launch", "checklist"],
      });
    }
  }

  if (proof && proofSignals.length >= 3 && proofSignals.length < 8) {
    later.push({
      id: uid("proof-grow"),
      title: "Grow proof signal count to 8+ for launch-grade validation",
      reason: `${proofSignals.length} signals is good for early validation but insufficient for launch confidence`,
      priority: "medium",
      tool: "proof",
      isBlocker: false,
      sourceReportId: proof?.id,
      tags: ["proof", "validation"],
    });
  }

  // ── KILL: Things to stop doing ─────────────────────────────────────────

  if (mvp) {
    const mvpData = extractData(mvp);
    const features = Array.isArray(mvpData.features) ? (mvpData.features as Array<Record<string, unknown>>) : [];
    const phase2Features = features.filter((f) => String(f.phase ?? f.timeline ?? "").toLowerCase().includes("2") || String(f.priority ?? "").toLowerCase() === "low");
    if (phase2Features.length > 0) {
      kill.push(`Phase 2 features in MVP scope (${phase2Features.length} identified) — defer until after first user validation`);
    }
  }

  if (swarm) {
    const swarmData = extractData(swarm);
    const wtp = typeof swarmData.willingness_to_pay === "number" ? swarmData.willingness_to_pay : null;
    if (wtp !== null && wtp < 30) {
      kill.push("Building a paid-first product when willingness-to-pay is below 30% — start with free-to-use and prove retention first");
    }
  }

  if (!coveredTools.has("proof") && coveredTools.has("mvp")) {
    kill.push("Adding more MVP features without any proof signals — you are building blind");
  }

  // ── Critical path ───────────────────────────────────────────────────────

  const criticalPath: string[] = [];
  if (!coveredTools.has("idea")) criticalPath.push("Run Signal Chamber to establish baseline idea score");
  if (!coveredTools.has("reality")) criticalPath.push("Run Pressure Matrix to validate core assumptions");
  if (proofSignals.length < 3) criticalPath.push("Collect 3+ proof signals to justify build investment");
  if (!coveredTools.has("mvp")) criticalPath.push("Run Blueprint Board to scope the MVP");
  if (doctor && getScore(doctor) < 60) criticalPath.push("Fix all Diagnostic Bay failures before shipping");
  if (!coveredTools.has("launch")) criticalPath.push("Run Launch Control for final go/no-go");

  if (criticalPath.length === 0) {
    criticalPath.push("All critical intelligence tools have been run — focus on execution");
    criticalPath.push("Re-run any tool where scores have declined to identify emerging risks");
  }

  // ── Launch minimum ──────────────────────────────────────────────────────

  const launchMinimum: string[] = [
    "Signal Chamber run with score ≥ 60",
    "Pressure Matrix returns GO or WARNING (not FAILED)",
    "At least 5 proof signals collected",
    "Blueprint Board MVP scope finalized",
    "Diagnostic Bay score ≥ 70 with 0 critical gate failures",
    "Launch Control score ≥ 65",
  ];

  // ── Recommended sprint ──────────────────────────────────────────────────

  const sprintItems = [...now, ...next]
    .filter((item) => item.isBlocker || item.priority === "critical" || item.priority === "high")
    .slice(0, 5);

  const sprintGoal = now.length > 0
    ? `Resolve ${now.filter((i) => i.isBlocker).length} blocker${now.filter((i) => i.isBlocker).length !== 1 ? "s" : ""} and clear the path to first ship`
    : next.length > 0
    ? "Expand intelligence coverage and clear high-priority task queue"
    : "Polish and prepare for launch";

  // ── Phase structure ─────────────────────────────────────────────────────

  const phases: RoadmapPhase[] = [
    {
      id: "phase-now",
      name: "Now — Blockers",
      description: "Critical blockers that must be resolved before any other work",
      items: now,
      estimatedDays: Math.max(1, now.length * 2),
    },
    {
      id: "phase-next",
      name: "Next — Build",
      description: "Near-term validated build work and intelligence expansion",
      items: next,
      estimatedDays: Math.max(3, next.length * 3),
    },
    {
      id: "phase-later",
      name: "Later — Polish",
      description: "Post-validation improvements and launch refinements",
      items: later,
      estimatedDays: Math.max(5, later.length * 4),
    },
  ];

  return {
    phases,
    now,
    next,
    later,
    kill,
    criticalPath,
    launchMinimum,
    recommendedSprint: {
      goal: sprintGoal,
      items: sprintItems,
      estimatedDays: Math.max(3, sprintItems.length * 2),
    },
  };
}
