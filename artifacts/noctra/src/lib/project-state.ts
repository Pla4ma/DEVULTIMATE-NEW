// project-state.ts — Computed project state with canonical lifecycle stages

import { computeNextAction, type NextAction } from "./next-action";

export const PROJECT_LIFECYCLE_STAGES = [
  "IDEA",
  "PLANNED",
  "BUILDING",
  "SCANNED",
  "FIXING",
  "READY_SOON",
  "LAUNCH_READY",
  "LAUNCHED",
] as const;

export type ProjectLifecycleStage = (typeof PROJECT_LIFECYCLE_STAGES)[number];

export type ProjectPhase = ProjectLifecycleStage;

export type ProjectState = {
  stage: ProjectLifecycleStage;
  ideaScore: number;
  realityScore: number;
  proofScore: number;
  swarmScore: number;
  mvpScore: number;
  doctorScore: number;
  launchScore: number;
  overallScore: number;
  coveredTools: string[];
  missingTools: string[];
  readiness: number;
  failedGates: string[];
  topBlocker: string | null;
  openP0Tasks: number;
  openP1Tasks: number;
  latestReportByTool: Record<string, { id: string; title: string; score?: number | null; created_at: string }>;
  proofSignalCount: number;
  scanCount: number;
  totalReports: number;
  totalTasks: number;
  completedTasks: number;
  taskCompletionRate: number;
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
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
}

function scoreFor(reports: ReportLike[], tool: string): number {
  return latestReport(reports, tool)?.score ?? 0;
}

function extractFailedGates(reports: ReportLike[]): string[] {
  const doctorReport = latestReport(reports, "doctor");
  if (!doctorReport?.payload) return [];
  const p = doctorReport.payload as Record<string, unknown>;
  const data = (p.data ?? p) as Record<string, unknown>;
  const gates = (data.gates ?? data.launch_gates ?? p.gates ?? p.launch_gates ?? p.checks ?? []) as unknown[];
  if (!Array.isArray(gates)) {
    const redGates = (data.red_gates ?? []) as string[];
    return Array.isArray(redGates) ? redGates.slice(0, 5) : [];
  }
  const failed = gates
    .filter((g: unknown) =>
      typeof g === "object" && g !== null &&
      (String((g as Record<string, unknown>).status ?? "").toLowerCase() === "fail" ||
        String((g as Record<string, unknown>).status ?? "").toLowerCase() === "red")
    )
    .map((g: unknown) =>
      String((g as Record<string, unknown>).name ?? (g as Record<string, unknown>).check ?? (g as Record<string, unknown>).gate ?? "Unknown gate")
    );
  const redGateStrings = (data.red_gates ?? []) as string[];
  if (Array.isArray(redGateStrings)) {
    redGateStrings.forEach(name => {
      if (typeof name === "string" && !failed.includes(name)) failed.push(name);
    });
  }
  return failed.slice(0, 5);
}

function computeLifecycleStage(covered: string[], tasks: TaskLike[], doctorScore: number, scanCount: number): ProjectLifecycleStage {
  if (covered.includes("launch")) return "LAUNCHED";
  if (doctorScore >= 70 && covered.includes("mvp")) return "LAUNCH_READY";
  if (doctorScore >= 56 && scanCount > 0) return "READY_SOON";
  if (doctorScore > 0 && doctorScore < 56 && scanCount > 0) return "FIXING";
  if (scanCount > 0) return "SCANNED";
  if (covered.includes("mvp") || covered.includes("swarm")) return "BUILDING";
  if (covered.includes("reality") || covered.includes("proof")) return "PLANNED";
  return "IDEA";
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
      latestReportByTool[tool] = { id: r.id, title: r.title, score: r.score, created_at: r.created_at };
    }
  }

  const scanCount = reports.filter((r) => r.tool === "doctor").length;
  const stage = computeLifecycleStage(coveredTools, tasks, scores.doctor ?? 0, scanCount);
  const readiness = computeReadiness(coveredTools, scores);

  const failedGates = extractFailedGates(reports);
  const openP0Tasks = tasks.filter((t) => t.status === "todo" && t.priority === "critical").length;
  const openP1Tasks = tasks.filter((t) => t.status === "todo" && t.priority === "high").length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const coveredScores = coveredTools.map((t) => scores[t] ?? 0).filter((s) => s > 0);
  const overallScore = coveredScores.length > 0
    ? Math.round(coveredScores.reduce((a, b) => a + b, 0) / coveredScores.length)
    : 0;

  let topBlocker: string | null = null;
  if (failedGates.length > 0) {
    topBlocker = `${failedGates.length} failed gate${failedGates.length > 1 ? "s" : ""} in Product Doctor: ${failedGates[0]}`;
  } else if ((scores.doctor ?? 0) > 0 && (scores.doctor ?? 0) < 50) {
    topBlocker = `Product Doctor score is ${scores.doctor}/100 — critical launch blockers detected`;
  } else if ((scores.reality ?? 0) > 0 && (scores.reality ?? 0) < 50) {
    topBlocker = `Reality Compiler score is ${scores.reality}/100 — core assumptions are failing`;
  } else if (openP0Tasks > 0) {
    topBlocker = `${openP0Tasks} critical task${openP0Tasks > 1 ? "s" : ""} unresolved in the queue`;
  }

  const nextAction = computeNextAction({
    reports, tasks,
    projects: currentProject ? [currentProject, ...projects] : projects,
    proofSignals,
    projectId: currentProject?.id,
  });

  return {
    stage,
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
