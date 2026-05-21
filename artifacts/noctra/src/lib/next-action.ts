// next-action.ts — Project-centric next-best-action engine with lifecycle awareness

export type NextActionPriority = "critical" | "high" | "medium" | "low";

export type NextAction = {
  title: string;
  description: string;
  reason: string;
  href: string;
  priority: NextActionPriority;
  tool: string;
  projectId?: string;
  sourceReportId?: string;
};

export type ReportNextAction = {
  title: string;
  href: string;
  tool: string;
  description: string;
};

type ReportLike = {
  id: string;
  tool: string;
  score?: number | null;
  payload?: unknown;
  created_at: string;
};

type TaskLike = {
  id: string;
  status: string;
  priority: string;
  source_report_id?: string | null;
};

type ProjectLike = { id: string; name: string; stage?: string | null };
type ProofSignalLike = { id: string };

const PROJECT_LIFECYCLE_STAGES = [
  "IDEA", "PLANNED", "BUILDING", "SCANNED", "FIXING", "READY_SOON", "LAUNCH_READY", "LAUNCHED",
] as const;

function latestReport(reports: ReportLike[], tool: string): ReportLike | undefined {
  return reports
    .filter((r) => r.tool === tool)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
}

function scoreFor(reports: ReportLike[], tool: string): number {
  return latestReport(reports, tool)?.score ?? 0;
}

function hasTool(reports: ReportLike[], tool: string): boolean {
  return reports.some((r) => r.tool === tool);
}

function getRedGates(report: ReportLike): string[] {
  if (!report.payload) return [];
  const p = report.payload as Record<string, unknown>;
  const d = (p.data ?? p) as Record<string, unknown>;
  const gates = (d.gates ?? []) as Array<{ name: string; status: string }>;
  const gateRed = gates.filter(g => g.status === "RED").map(g => g.name);
  const redStrings = (d.red_gates ?? []) as string[];
  return [...gateRed, ...redStrings.filter(s => typeof s === "string")];
}

export function computeNextAction(params: {
  reports: ReportLike[];
  tasks: TaskLike[];
  projects: ProjectLike[];
  proofSignals: ProofSignalLike[];
  projectId?: string;
}): NextAction {
  const { reports, tasks, projects, proofSignals, projectId } = params;
  const project = projects.find(p => p.id === projectId);
  const currentStage = (project?.stage ?? "IDEA") as typeof PROJECT_LIFECYCLE_STAGES[number];

  const openTaskCount = tasks.filter((t) => t.status !== "completed").length;
  const openHighPriority = tasks.filter(
    (t) => t.status !== "completed" && (t.priority === "high" || t.priority === "critical")
  ).length;
  const openCriticalTasks = tasks.filter(t => t.status !== "completed" && t.priority === "critical").length;

  // Stage 1: IDEA → need to plan
  if (currentStage === "IDEA") {
    if (!hasTool(reports, "idea")) {
      return {
        title: "Run Idea Checker",
        description: "Validate your product idea for signal strength and market fit.",
        reason: "Your project is in IDEA stage. Start by validating the concept.",
        href: "/app/idea",
        priority: "critical",
        tool: "idea",
        projectId,
      };
    }
    return {
      title: "Run Reality Compiler",
      description: "Pressure-test assumptions before building.",
      reason: "Idea checked — now validate assumptions before committing.",
      href: "/app/reality",
      priority: "high",
      tool: "reality",
      projectId,
    };
  }

  // Stage 2: PLANNED → build
  if (currentStage === "PLANNED") {
    if (!hasTool(reports, "mvp")) {
      return {
        title: "Generate MVP Plan",
        description: "Create a week-by-week build plan with feature scoring.",
        reason: "Assumptions validated — now plan what to build.",
        href: "/app/mvp",
        priority: "high",
        tool: "mvp",
        projectId,
      };
    }
    return {
      title: "Start Building MVP",
      description: "Follow your MVP plan to build the core product.",
      reason: "MVP plan is ready — time to build.",
      href: "/app/mvp",
      priority: "high",
      tool: "mvp",
      projectId,
    };
  }

  // Stage 3: BUILDING → scan
  if (currentStage === "BUILDING") {
    return {
      title: "Upload Code for Product Doctor Scan",
      description: "Upload your project ZIP for static analysis and launch blocker detection.",
      reason: "Building phase requires code validation — scan to find launch blockers early.",
      href: "/app/doctor",
      priority: "high",
      tool: "doctor",
      projectId,
    };
  }

  // Stage 4: SCANNED → fix blockers
  if (currentStage === "SCANNED") {
    const doctorScore = scoreFor(reports, "doctor");
    if (doctorScore > 0 && doctorScore < 56) {
      return {
        title: "Fix Launch Blockers",
        description: `Scored ${doctorScore}/100. Resolve P0/P1 blockers from the Product Doctor report.`,
        reason: "Launch blockers detected — fix them before progressing.",
        href: `/app/tasks?project=${projectId}`,
        priority: "critical",
        tool: "tasks",
        projectId,
      };
    }
    if (doctorScore > 0 && doctorScore < 70) {
      return {
        title: "Improve Launch Readiness Score",
        description: `Scored ${doctorScore}/100. Resolve remaining issues to reach launch threshold.`,
        reason: "Score needs improvement to reach LAUNCH_READY.",
        href: "/app/doctor",
        priority: "high",
        tool: "doctor",
        projectId,
      };
    }
    return {
      title: "Rescan to Verify Fixes",
      description: "Upload updated ZIP to verify fixes improved your score.",
      reason: "Fix the identified blockers, then rescan to measure improvement.",
      href: "/app/doctor",
      priority: "high",
      tool: "doctor",
      projectId,
    };
  }

  // Stage 5: FIXING → fix + rescan
  if (currentStage === "FIXING") {
    if (openCriticalTasks > 0) {
      return {
        title: `Complete ${openCriticalTasks} Critical Fix Task${openCriticalTasks !== 1 ? "s" : ""}`,
        description: `Critical fix tasks from Product Doctor are pending.`,
        reason: "Fix P0 blockers first, then rescan to see score improve.",
        href: `/app/tasks?project=${projectId}`,
        priority: "critical",
        tool: "tasks",
        projectId,
      };
    }
    if (openHighPriority > 0) {
      return {
        title: `Resolve ${openHighPriority} Launch Blocker${openHighPriority !== 1 ? "s" : ""}`,
        description: `High-priority tasks remain. Resolve them to reach READY_SOON.`,
        reason: "Bulk of fixes done — finish the remaining high-priority items.",
        href: `/app/tasks?project=${projectId}`,
        priority: "high",
        tool: "tasks",
        projectId,
      };
    }
    return {
      title: "Rescan with Product Doctor",
      description: "Upload updated ZIP to verify all fixes and improve your score.",
      reason: "Fixes complete — rescan to validate improvement and progress to READY_SOON.",
      href: "/app/doctor",
      priority: "high",
      tool: "doctor",
      projectId,
    };
  }

  // Stage 6: READY_SOON → finalize
  if (currentStage === "READY_SOON") {
    if (!hasTool(reports, "launch")) {
      return {
        title: "Generate Launch Plan",
        description: "Get your go/no-go signal with full launch checklist.",
        reason: "Ready soon — generate your launch assessment and checklist.",
        href: "/app/launch",
        priority: "high",
        tool: "launch",
        projectId,
      };
    }
    if (openTaskCount > 0) {
      return {
        title: `Complete ${openTaskCount} Remaining Task${openTaskCount !== 1 ? "s" : ""}`,
        description: "Final tasks before launch readiness.",
        reason: "Tie up loose ends before declaring LAUNCH_READY.",
        href: `/app/tasks?project=${projectId}`,
        priority: "medium",
        tool: "tasks",
        projectId,
      };
    }
    return {
      title: "Declare Launch Ready",
      description: "All gates green, tasks complete — ready to launch.",
      reason: "Everything looks good — transition to LAUNCH_READY.",
      href: `/app/projects/${projectId}`,
      priority: "medium",
      tool: "projects",
      projectId,
    };
  }

  // Stage 7: LAUNCH_READY → launch
  if (currentStage === "LAUNCH_READY") {
    return {
      title: "Execute Launch Plan",
      description: "All pre-launch checks passed. Execute your launch plan.",
      reason: "Fully launch-ready — execute the launch.",
      href: "/app/launch",
      priority: "high",
      tool: "launch",
      projectId,
    };
  }

  // Stage 8: LAUNCHED → maintain
  if (currentStage === "LAUNCHED") {
    const daysSinceLastScan = 0; // Placeholder
    if (daysSinceLastScan > 30) {
      return {
        title: "Rescan with Product Doctor",
        description: "It's been a while since your last scan. Check for regressions.",
        reason: "Post-launch monitoring — scan for issues introduced in new code.",
        href: "/app/doctor",
        priority: "medium",
        tool: "doctor",
        projectId,
      };
    }
    return {
      title: "Consult Product Twin",
      description: "Synthesize all intelligence with your AI digital twin.",
      reason: "Post-launch — monitor, iterate and improve with AI insights.",
      href: "/app/twin",
      priority: "low",
      tool: "twin",
      projectId,
    };
  }

  // Fallback: default recommendation
  if (!hasTool(reports, "doctor")) {
    return {
      title: "Run Product Doctor",
      description: "Upload your project ZIP for static analysis and AI diagnosis.",
      reason: "Start here — diagnose your codebase for launch blockers.",
      href: "/app/doctor",
      priority: "critical",
      tool: "doctor",
      projectId,
    };
  }

  const doctorScore = scoreFor(reports, "doctor");
  const lastDoc = latestReport(reports, "doctor");
  const redGates = lastDoc ? getRedGates(lastDoc) : [];

  if (doctorScore > 0 && doctorScore < 50) {
    return {
      title: `Fix ${redGates.length} Launch Blocker${redGates.length !== 1 ? "s" : ""}`,
      description: `Your codebase scored ${doctorScore}/100. Resolve red gates before proceeding.`,
      reason: `Score too low for safe launch. Fix blockers, then rescan.`,
      href: "/app/doctor",
      priority: "critical",
      tool: "doctor",
      projectId,
      sourceReportId: lastDoc?.id,
    };
  }

  if (openCriticalTasks > 0) {
    return {
      title: `Complete ${openCriticalTasks} Critical Fix Task${openCriticalTasks !== 1 ? "s" : ""}`,
      description: `Critical fix tasks from Product Doctor are pending.`,
      reason: "Fix execution is the fastest path to a better launch score.",
      href: `/app/tasks?project=${projectId}`,
      priority: "critical",
      tool: "tasks",
      projectId,
    };
  }

  if (!hasTool(reports, "idea")) {
    return {
      title: "Run Idea Checker",
      description: "Validate your product idea for signal strength.",
      reason: "Pre-build validation reduces risk before investing in code.",
      href: "/app/idea",
      priority: "medium",
      tool: "idea",
      projectId,
    };
  }

  if (!hasTool(reports, "mvp")) {
    return {
      title: "Generate MVP Planner",
      description: "Create a week-by-week build plan.",
      reason: "Define scope early.",
      href: "/app/mvp",
      priority: "medium",
      tool: "mvp",
      projectId,
    };
  }

  if (!hasTool(reports, "launch")) {
    return {
      title: "Generate Launch Plan",
      description: "Get your go/no-go signal with full launch checklist.",
      reason: "All pre-launch gates are clear — generate your launch assessment.",
      href: "/app/launch",
      priority: "high",
      tool: "launch",
      projectId,
    };
  }

  return {
    title: "Consult Product Twin",
    description: "Synthesize all intelligence with your AI digital twin.",
    reason: "Full intelligence suite complete — synthesize signals.",
    href: "/app/twin",
    priority: "low",
    tool: "twin",
    projectId,
  };
}

export type PipelineStep = {
  key: string;
  label: string;
  href: string;
  done: boolean;
  active: boolean;
};

export function computePipeline(params: {
  reports: ReportLike[];
  tasks: TaskLike[];
  proofSignals: ProofSignalLike[];
}): PipelineStep[] {
  const { reports, tasks, proofSignals } = params;
  const steps = [
    { key: "doctor", label: "Scan", href: "/app/doctor", done: hasTool(reports, "doctor") },
    { key: "tasks", label: "Fix", href: "/app/tasks", done: tasks.filter(t => t.status === "completed").length >= 3 },
    { key: "rescan", label: "Rescan", href: "/app/doctor", done: (hasTool(reports, "doctor") ? reports.filter(r => r.tool === "doctor").length >= 2 : false) },
    { key: "idea", label: "Idea", href: "/app/idea", done: hasTool(reports, "idea") },
    { key: "reality", label: "Reality", href: "/app/reality", done: hasTool(reports, "reality") },
    { key: "proof", label: "Proof", href: "/app/proof", done: hasTool(reports, "proof") || proofSignals.length >= 3 },
    { key: "mvp", label: "Blueprint", href: "/app/mvp", done: hasTool(reports, "mvp") },
    { key: "launch", label: "Launch", href: "/app/launch", done: hasTool(reports, "launch") },
  ];
  const firstIncomplete = steps.findIndex((s) => !s.done);
  return steps.map((s, i) => ({ ...s, active: i === firstIncomplete }));
}

export function getReportNextActions(
  tool: string,
  report: { id: string; score?: number | null },
  context: {
    hasTasks: boolean;
    hasProject: boolean;
    hasProof: boolean;
    hasSwarm: boolean;
    hasMvp: boolean;
    doctorScore: number;
  }
): ReportNextAction[] {
  const actions: ReportNextAction[] = [];
  const score = report.score ?? 0;
  switch (tool) {
    case "idea":
      actions.push({ title: "Run Reality Compiler", href: "/app/reality", tool: "reality", description: "Reality-check every assumption" });
      if (!context.hasMvp) actions.push({ title: "Generate MVP Plan", href: "/app/mvp", tool: "mvp", description: "Plan your MVP from this idea" });
      break;
    case "reality":
      actions.push({ title: "Start Proof Engine", href: "/app/proof", tool: "proof", description: "Validate with real evidence" });
      if (score < 50) actions.push({ title: "Re-run Reality Compiler", href: "/app/reality", tool: "reality", description: "Revise assumptions and re-run" });
      break;
    case "mvp":
      actions.push({ title: "Scan with Product Doctor", href: "/app/doctor", tool: "doctor", description: "Check codebase for launch blockers" });
      break;
    case "doctor":
      if (context.doctorScore >= 65) actions.push({ title: "Generate Launch Plan", href: "/app/launch", tool: "launch", description: "Gates passing — get launch assessment" });
      actions.push({ title: "View Fix Tasks", href: "/app/tasks", tool: "tasks", description: "Turn blockers into fix tasks" });
      actions.push({ title: "Rescan Project", href: "/app/doctor", tool: "doctor", description: "Upload updated ZIP to verify fixes" });
      break;
    case "launch":
      actions.push({ title: "Consult Product Twin", href: "/app/twin", tool: "twin", description: "Full AI synthesis" });
      break;
    default:
      actions.push({ title: "Run Product Doctor", href: "/app/doctor", tool: "doctor", description: "Start with a codebase scan" });
  }
  return actions;
}
