// next-action.ts — Global next-best-action engine for Noctra
// Pure utility: no React, no side effects. Call with loaded data, get a single prioritized action.

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

// ─── Global next-action engine ──────────────────────────────────────────────
// Walk the full intelligence pipeline and return the single most valuable next step.

export function computeNextAction(params: {
  reports: ReportLike[];
  tasks: TaskLike[];
  projects: ProjectLike[];
  proofSignals: ProofSignalLike[];
  projectId?: string;
}): NextAction {
  const { reports, tasks, projects, proofSignals } = params;

  const openTaskCount = tasks.filter((t) => t.status === "todo").length;
  const openHighPriority = tasks.filter(
    (t) => t.status === "todo" && (t.priority === "high" || t.priority === "critical")
  ).length;

  // 1. No idea reports → start at Idea Checker
  if (!hasTool(reports, "idea")) {
    return {
      title: "Run Idea Checker",
      description: "Analyze your startup idea for signal strength, red flags, and ICP fit.",
      reason: "Start here — validate your product idea before building anything.",
      href: "/app/idea",
      priority: "critical",
      tool: "idea",
    };
  }

  // 2. Idea exists but no reality check
  if (!hasTool(reports, "reality")) {
    return {
      title: "Run Reality Compiler",
      description: "Reality-check every assumption before committing resources.",
      reason: "Idea Checker is done — now pressure-test assumptions against reality.",
      href: "/app/reality",
      priority: "high",
      tool: "reality",
      sourceReportId: latestReport(reports, "idea")?.id,
    };
  }

  // 3. Reality check failed → fix before moving forward
  const realityScore = scoreFor(reports, "reality");
  if (realityScore > 0 && realityScore < 50) {
    return {
      title: "Fix Reality Compiler Failures",
      description: "Your reality score is below 50. Review red flags and patch assumptions.",
      reason: `Reality score of ${realityScore}/100 — critical assumptions are failing. Fix before proceeding.`,
      href: "/app/reality",
      priority: "critical",
      tool: "reality",
      sourceReportId: latestReport(reports, "reality")?.id,
    };
  }

  // 4. No proof signals and no proof report → start Proof Engine
  if (!hasTool(reports, "proof") && proofSignals.length === 0) {
    return {
      title: "Start Proof Engine",
      description: "Collect validation evidence and design experiments to prove your assumptions.",
      reason: "No proof signals yet — assumptions need real-world validation evidence.",
      href: "/app/proof",
      priority: "high",
      tool: "proof",
    };
  }

  // 5. No swarm report → simulate market demand
  if (!hasTool(reports, "swarm")) {
    return {
      title: "Run Market Swarm",
      description: "Simulate your target market with AI personas to surface objections and WTP.",
      reason: "Validate market demand before locking in your MVP scope.",
      href: "/app/swarm",
      priority: "high",
      tool: "swarm",
    };
  }

  // 6. No MVP report → generate blueprint
  if (!hasTool(reports, "mvp")) {
    return {
      title: "Generate MVP Planner",
      description: "Create a week-by-week MVP plan with feature ROI scoring and architecture decisions.",
      reason: "Define your ruthless MVP scope — cut what doesn't ship value.",
      href: "/app/mvp",
      priority: "high",
      tool: "mvp",
    };
  }

  // 7. MVP exists but very few tasks → generate tasks from blueprint
  if (hasTool(reports, "mvp") && tasks.length < 3) {
    return {
      title: "Generate Tasks from MVP Plan",
      description: "Turn your MVP plan into actionable tasks with priority and category.",
      reason: "Your blueprint is ready — generate the execution task queue.",
      href: "/app/tasks",
      priority: "high",
      tool: "tasks",
      sourceReportId: latestReport(reports, "mvp")?.id,
    };
  }

  // 8. Massive task backlog → deal with it first
  if (openTaskCount > 15) {
    return {
      title: "Clear Your Tasks",
      description: `You have ${openTaskCount} open tasks — work through the backlog before generating more analysis.`,
      reason: "Backlog overload reduces velocity. Complete outstanding tasks first.",
      href: "/app/tasks",
      priority: "high",
      tool: "tasks",
    };
  }

  // 9. No doctor scan → upload ZIP
  if (!hasTool(reports, "doctor")) {
    return {
      title: "Scan Code with Project Doctor",
      description: "Upload your project ZIP for static analysis and AI diagnosis of launch readiness.",
      reason: "Check for hidden launch blockers before going live.",
      href: "/app/doctor",
      priority: "medium",
      tool: "doctor",
    };
  }

  // 10. Doctor found critical issues → fix them
  const doctorScore = scoreFor(reports, "doctor");
  if (doctorScore > 0 && doctorScore < 50) {
    return {
      title: "Fix Project Doctor Blockers",
      description: "Your codebase scan found critical issues. Review and resolve the red gates.",
      reason: `Doctor score ${doctorScore}/100 — launch blockers must be resolved before going live.`,
      href: "/app/doctor",
      priority: "critical",
      tool: "doctor",
      sourceReportId: latestReport(reports, "doctor")?.id,
    };
  }

  // 11. No launch report → generate launch plan
  if (!hasTool(reports, "launch")) {
    return {
      title: "Generate Launch Plan",
      description: "Get your go/no-go signal with a full launch checklist and distribution plan.",
      reason: "All pre-launch gates are clear — generate your launch assessment now.",
      href: "/app/launch",
      priority: "medium",
      tool: "launch",
    };
  }

  // 12. Proof is weak → run more experiments
  const proofScore = scoreFor(reports, "proof");
  if (proofScore > 0 && proofScore < 50) {
    return {
      title: "Strengthen Proof Signals",
      description: "Add more validation evidence to boost your Proof Engine confidence score.",
      reason: `Proof score ${proofScore}/100 — run more experiments to build conviction.`,
      href: "/app/proof",
      priority: "medium",
      tool: "proof",
    };
  }

  // 13. No project workspace yet with enough data
  if (projects.length === 0 && reports.length >= 3) {
    return {
      title: "Create Project Workspace",
      description: "Organize your reports and tasks into a project to track everything in one place.",
      reason: "You have enough reports to warrant a dedicated project workspace.",
      href: "/app/projects",
      priority: "medium",
      tool: "projects",
    };
  }

  // 14. Open high-priority tasks piling up
  if (openHighPriority > 3) {
    return {
      title: "Resolve High-Priority Tasks",
      description: `${openHighPriority} high-priority tasks are unresolved. Address these before moving forward.`,
      reason: "Critical items are blocking forward progress on your product.",
      href: "/app/tasks",
      priority: "high",
      tool: "tasks",
    };
  }

  // 15. All done — use Product Twin for synthesis
  return {
    title: "Consult Product Twin",
    description: "Synthesize all your intelligence with your AI digital twin for strategic clarity.",
    reason: "You've run the full intelligence suite — synthesize all signals with your twin.",
    href: "/app/twin",
    priority: "low",
    tool: "twin",
  };
}

// ─── Pipeline progress ───────────────────────────────────────────────────────
// Returns the 8-step pipeline with done/active/pending state per step.

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
    { key: "idea", label: "Idea", href: "/app/idea", done: hasTool(reports, "idea") },
    { key: "reality", label: "Reality", href: "/app/reality", done: hasTool(reports, "reality") },
    { key: "proof", label: "Proof", href: "/app/proof", done: hasTool(reports, "proof") || proofSignals.length >= 3 },
    { key: "swarm", label: "Swarm", href: "/app/swarm", done: hasTool(reports, "swarm") },
    { key: "mvp", label: "Blueprint", href: "/app/mvp", done: hasTool(reports, "mvp") },
    { key: "tasks", label: "Tasks", href: "/app/tasks", done: tasks.length >= 3 },
    { key: "doctor", label: "Doctor", href: "/app/doctor", done: hasTool(reports, "doctor") },
    { key: "launch", label: "Launch", href: "/app/launch", done: hasTool(reports, "launch") },
  ];

  const firstIncomplete = steps.findIndex((s) => !s.done);

  return steps.map((s, i) => ({
    ...s,
    active: i === firstIncomplete,
  }));
}

// ─── Report-level next actions ───────────────────────────────────────────────
// Given a specific report type, return the 3-5 best actions to take from that report.

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
      actions.push({ title: "Run Reality Compiler", href: "/app/reality", tool: "reality", description: "Reality-check every assumption in this idea" });
      actions.push({ title: "Run Market Swarm", href: "/app/swarm", tool: "swarm", description: "Simulate market demand with AI personas" });
      if (!context.hasMvp) {
        actions.push({ title: "Generate MVP Planner", href: "/app/mvp", tool: "mvp", description: "Plan your MVP based on this idea" });
      }
      if (!context.hasProject) {
        actions.push({ title: "Create Project", href: "/app/projects", tool: "projects", description: "Organize this idea into a project workspace" });
      }
      if (!context.hasTasks) {
        actions.push({ title: "Generate Tasks", href: "/app/tasks", tool: "tasks", description: "Turn this idea into an action list" });
      }
      break;

    case "reality":
      actions.push({ title: "Start Proof Engine", href: "/app/proof", tool: "proof", description: "Validate assumptions with real evidence" });
      actions.push({ title: "Run Market Swarm", href: "/app/swarm", tool: "swarm", description: "Simulate market reaction to this thesis" });
      if (!context.hasTasks) {
        actions.push({ title: "Generate Fix Tasks", href: "/app/tasks", tool: "tasks", description: "Turn red flags into actionable fix tasks" });
      }
      if (score < 50) {
        actions.push({ title: "Re-run Reality Compiler", href: "/app/reality", tool: "reality", description: "Revise your assumptions and re-run" });
      }
      break;

    case "proof":
      actions.push({ title: "Add Proof Signals", href: "/app/proof", tool: "proof", description: "Log more validation evidence" });
      actions.push({ title: "Run Market Swarm", href: "/app/swarm", tool: "swarm", description: "Cross-validate with persona simulation" });
      if (!context.hasMvp && score >= 60) {
        actions.push({ title: "Generate MVP Planner", href: "/app/mvp", tool: "mvp", description: "Proof is strong — plan the build now" });
      }
      if (!context.hasTasks) {
        actions.push({ title: "Generate Experiment Tasks", href: "/app/tasks", tool: "tasks", description: "Turn experiments into actionable tasks" });
      }
      break;

    case "swarm":
      actions.push({ title: "Generate MVP Planner", href: "/app/mvp", tool: "mvp", description: "Turn swarm insights into an MVP plan" });
      actions.push({ title: "Generate Proof Experiments", href: "/app/proof", tool: "proof", description: "Design experiments to address objections" });
      if (!context.hasTasks) {
        actions.push({ title: "Generate Tasks from Objections", href: "/app/tasks", tool: "tasks", description: "Turn persona objections into fix tasks" });
      }
      if (!context.hasProject) {
        actions.push({ title: "Create Project", href: "/app/projects", tool: "projects", description: "Organize swarm findings into a project" });
      }
      break;

    case "mvp":
      if (!context.hasTasks) {
        actions.push({ title: "Generate Tasks", href: "/app/tasks", tool: "tasks", description: "Break the MVP into actionable execution tasks" });
      }
      actions.push({ title: "Scan with Project Doctor", href: "/app/doctor", tool: "doctor", description: "Check your codebase for launch blockers" });
      if (!context.hasProject) {
        actions.push({ title: "Create Project", href: "/app/projects", tool: "projects", description: "Track this MVP in a project workspace" });
      }
      actions.push({ title: "Ask Product Twin", href: "/app/twin", tool: "twin", description: "Get AI synthesis of your MVP plan" });
      break;

    case "doctor":
      if (context.doctorScore >= 65) {
        actions.push({ title: "Generate Launch Plan", href: "/app/launch", tool: "launch", description: "Gates are passing — generate your launch assessment" });
      }
      actions.push({ title: "Generate Fix Tasks", href: "/app/tasks", tool: "tasks", description: "Turn blockers into prioritized fix tasks" });
      actions.push({ title: "Re-scan Project", href: "/app/doctor", tool: "doctor", description: "Upload updated ZIP for re-diagnosis" });
      actions.push({ title: "Ask Product Twin", href: "/app/twin", tool: "twin", description: "Get AI guidance on resolving blockers" });
      break;

    case "launch":
      actions.push({ title: "Ask Product Twin", href: "/app/twin", tool: "twin", description: "Get AI synthesis of your full launch readiness" });
      actions.push({ title: "Generate Launch Tasks", href: "/app/tasks", tool: "tasks", description: "Turn launch plan into a sprint queue" });
      actions.push({ title: "View Project Profile", href: "/app/passport", tool: "passport", description: "Review your complete project record and milestones" });
      break;

    default:
      actions.push({ title: "View All Reports", href: "/app/reports", tool: "reports", description: "See all your intelligence reports" });
      actions.push({ title: "Run Idea Checker", href: "/app/idea", tool: "idea", description: "Analyze a new product idea" });
  }

  return actions;
}
