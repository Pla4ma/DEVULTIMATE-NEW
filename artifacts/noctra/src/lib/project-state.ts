// project-state.ts — Computed project state summary for Noctra
// Pure utility: takes raw data arrays for a project, returns a rich computed state object.

import { computeNextAction, type NextAction } from "./next-action";

export type ProjectPhase =
  | "idea"
  | "validation"
  | "building"
  | "launch-prep"
  | "launched";

export type ProjectState = {
  // Per-tool scores (0 if not run)
  ideaScore: number;
  realityScore: number;
  proofScore: number;
  swarmScore: number;
  mvpScore: number;
  doctorScore: number;
  launchScore: number;

  // Aggregate
  overallScore: number;
  coveredTools: string[];
  missingTools: string[];

  // Phase & readiness
  phase: ProjectPhase;
  readiness: number; // 0–100

  // Blockers
  failedGates: string[];
  topBlocker: string | null;
  openP0Tasks: number;
  openP1Tasks: number;

  // Latest report per tool
  latestReportByTool: Record<
    string,
    { id: string; title: string; score?: number | null; created_at: string }
  >;

  // Counts
  proofSignalCount: number;
  scanCount: number;
  totalReports: number;
  totalTasks: number;
  completedTasks: number;
  taskCompletionRate: number; // 0–100

  // Next action
  nextAction: NextAction;
};

const INTELLIGENCE_TOOLS = [
  "idea", "reality", "proof", "swarm", "mvp", "doctor", "launch",
] as const;

type ReportLike = {
  id: string;
  tool: string;
  score?: number | null;
  payload?: unknown;
  created_at: string;
  title: string;
};

type TaskLike = {
  id: string;
  status: string;
  priority: string;
  source_report_id?: string | null;
};

type ProofSignalLike = { id: string };
type ProjectLike = { id: string; name: string; stage?: string | null };

function latestReport(reports: ReportLike[], tool: string): ReportLike | undefined {
  return reports
    .filter((r) => r.tool === tool)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
}

function scoreFor(reports: ReportLike[], tool: string): number {
  return latestReport(reports, tool)?.score ?? 0;
}

function extractFailedGates(reports: ReportLike[]): string[] {
  const doctorReport = latestReport(reports, "doctor");
  if (!doctorReport?.payload) return [];
  const p = doctorReport.payload as Record<string, unknown>;
  const gates = p.gates ?? p.launch_gates ?? p.checks;
  if (!Array.isArray(gates)) return [];
  return gates
    .filter(
      (g: unknown) =>
        typeof g === "object" &&
        g !== null &&
        (String((g as Record<string, unknown>).status ?? "").toLowerCase() === "fail" ||
          String((g as Record<string, unknown>).status ?? "").toLowerCase() === "red" ||
          String((g as Record<string, unknown>).result ?? "").toLowerCase() === "fail")
    )
    .map(
      (g: unknown) =>
        String(
          (g as Record<string, unknown>).name ??
          (g as Record<string, unknown>).check ??
          (g as Record<string, unknown>).gate ??
          "Unknown gate"
        )
    )
    .slice(0, 5);
}

function computePhase(covered: string[], tasks: TaskLike[]): ProjectPhase {
  if (covered.includes("launch")) return "launched";
  if (covered.includes("doctor") || (covered.includes("mvp") && tasks.length >= 3))
    return "launch-prep";
  if (covered.includes("mvp") || covered.includes("swarm")) return "building";
  if (covered.includes("reality") || covered.includes("proof")) return "validation";
  return "idea";
}

function computeReadiness(covered: string[], scores: Record<string, number>): number {
  const steps = [
    { tool: "idea", weight: 10 },
    { tool: "reality", weight: 15 },
    { tool: "proof", weight: 15 },
    { tool: "swarm", weight: 10 },
    { tool: "mvp", weight: 15 },
    { tool: "doctor", weight: 20 },
    { tool: "launch", weight: 15 },
  ];

  let total = 0;
  for (const step of steps) {
    if (covered.includes(step.tool)) {
      const scoreBonus = Math.min(1, (scores[step.tool] ?? 50) / 100);
      total += step.weight * scoreBonus;
    }
  }
  return Math.round(total);
}

export function computeProjectState(params: {
  reports: ReportLike[];
  tasks: TaskLike[];
  proofSignals: ProofSignalLike[];
  projects: ProjectLike[];
  currentProject?: ProjectLike;
}): ProjectState {
  const { reports, tasks, proofSignals, projects, currentProject } = params;

  const scores: Record<string, number> = {};
  for (const tool of INTELLIGENCE_TOOLS) {
    scores[tool] = scoreFor(reports, tool);
  }

  const coveredTools = INTELLIGENCE_TOOLS.filter((t) => reports.some((r) => r.tool === t));
  const missingTools = INTELLIGENCE_TOOLS.filter((t) => !coveredTools.includes(t));

  const latestReportByTool: ProjectState["latestReportByTool"] = {};
  for (const tool of INTELLIGENCE_TOOLS) {
    const r = latestReport(reports, tool);
    if (r) {
      latestReportByTool[tool] = {
        id: r.id,
        title: r.title,
        score: r.score,
        created_at: r.created_at,
      };
    }
  }

  const phase = computePhase(coveredTools, tasks);
  const readiness = computeReadiness(coveredTools, scores);

  const failedGates = extractFailedGates(reports);
  const openP0Tasks = tasks.filter(
    (t) => t.status === "todo" && t.priority === "critical"
  ).length;
  const openP1Tasks = tasks.filter(
    (t) => t.status === "todo" && t.priority === "high"
  ).length;

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const taskCompletionRate =
    tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const scanCount = reports.filter((r) => r.tool === "doctor").length;

  const coveredScores = coveredTools
    .map((t) => scores[t] ?? 0)
    .filter((s) => s > 0);
  const overallScore =
    coveredScores.length > 0
      ? Math.round(coveredScores.reduce((a, b) => a + b, 0) / coveredScores.length)
      : 0;

  // Top blocker: failed gates > low doctor score > low reality score > open P0 tasks
  let topBlocker: string | null = null;
  if (failedGates.length > 0) {
    topBlocker = `${failedGates.length} failed gate${failedGates.length > 1 ? "s" : ""} in Project Doctor: ${failedGates[0]}`;
  } else if (scores.doctor > 0 && scores.doctor < 50) {
    topBlocker = `Project Doctor score is ${scores.doctor}/100 — critical launch blockers detected`;
  } else if (scores.reality > 0 && scores.reality < 50) {
    topBlocker = `Pressure Matrix score is ${scores.reality}/100 — core assumptions are failing`;
  } else if (openP0Tasks > 0) {
    topBlocker = `${openP0Tasks} critical task${openP0Tasks > 1 ? "s" : ""} unresolved in the queue`;
  }

  const nextAction = computeNextAction({
    reports,
    tasks,
    projects: currentProject ? [currentProject, ...projects] : projects,
    proofSignals,
    projectId: currentProject?.id,
  });

  return {
    ideaScore: scores.idea ?? 0,
    realityScore: scores.reality ?? 0,
    proofScore: scores.proof ?? 0,
    swarmScore: scores.swarm ?? 0,
    mvpScore: scores.mvp ?? 0,
    doctorScore: scores.doctor ?? 0,
    launchScore: scores.launch ?? 0,
    overallScore,
    coveredTools,
    missingTools,
    phase,
    readiness,
    failedGates,
    topBlocker,
    openP0Tasks,
    openP1Tasks,
    latestReportByTool,
    proofSignalCount: proofSignals.length,
    scanCount,
    totalReports: reports.length,
    totalTasks: tasks.length,
    completedTasks,
    taskCompletionRate,
    nextAction,
  };
}
