import { isDemoMode } from "@/lib/demo-mode";
import { demoStore } from "@/lib/demo-store";
import { requireUserId, withErrorHandling, handleSupabaseError, getSupabaseClient } from "./common";

interface NextBestAction {
  title: string;
  reason: string;
  route: string;
  tool?: string;
}

const TOOL_JOURNEY: Array<{
  tool: string;
  title: string;
  route: string;
  prereq?: string;
  reason: string;
}> = [
  { tool: "idea", title: "Run Idea Checker", route: "/app/idea", reason: "Start by validating your product idea before building anything" },
  { tool: "reality", title: "Run Reality Compiler", route: "/app/reality", prereq: "idea", reason: "Your idea scored well — now pressure-test every assumption" },
  { tool: "proof", title: "Run Proof Engine", route: "/app/proof", prereq: "reality", reason: "Time to collect evidence — assumptions need real-world validation" },
  { tool: "swarm", title: "Run Market Swarm", route: "/app/swarm", prereq: "idea", reason: "Simulate your target market before committing to a direction" },
  { tool: "mvp", title: "Run MVP Planner", route: "/app/mvp", prereq: "idea", reason: "Define your ruthless MVP scope — cut what doesn't ship value" },
  { tool: "doctor", title: "Run Project Doctor", route: "/app/doctor", prereq: "mvp", reason: "Scan your codebase for launch blockers before going live" },
  { tool: "launch", title: "Run Launch Room", route: "/app/launch", prereq: "doctor", reason: "Get your go/no-go signal before launching" },
];

interface ReportLike {
  tool?: string;
  score?: number;
  title?: string;
}

interface TaskLike {
  status?: string;
  priority?: string;
  title?: string;
}

interface ProjectLike {
  name?: string;
  stage?: string;
}

function computeNextBestAction(
  reports: ReportLike[],
  tasks: TaskLike[],
  projects: ProjectLike[],
  latestScores: Record<string, number>
): NextBestAction {
  const toolsDone = new Set(reports.map((r) => String(r.tool ?? "")));
  const openTaskCount = tasks.filter((t) => t.status === "todo").length;

  if (openTaskCount > 12) {
    return {
      title: "Clear Your Tasks",
      reason: `You have ${openTaskCount} open tasks — work through the backlog before generating more intelligence`,
      route: "/app/tasks",
    };
  }

  if (projects.length === 0 && reports.length >= 3) {
    return {
      title: "Create a Project Workspace",
      reason: "You have reports accumulating — create a project to link them and track progress in one place",
      route: "/app/projects",
    };
  }

  const lowScoreTools = TOOL_JOURNEY.filter(({ tool }) => {
    const key = `${tool}Score` as keyof typeof latestScores;
    const score = latestScores[key];
    return toolsDone.has(tool) && score !== undefined && score > 0 && score < 45;
  });
  if (lowScoreTools.length > 0) {
    const worst = lowScoreTools.reduce((prev, cur) => {
      const pk = `${prev.tool}Score` as keyof typeof latestScores;
      const ck = `${cur.tool}Score` as keyof typeof latestScores;
      return (latestScores[pk] ?? 100) < (latestScores[ck] ?? 100) ? prev : cur;
    });
    const score = latestScores[`${worst.tool}Score` as keyof typeof latestScores] ?? 0;
    return {
      title: `Revisit ${worst.title.replace("Run ", "")}`,
      reason: `Your last ${worst.tool} score was ${score}/100 — address the findings and re-run for improvement`,
      route: worst.route,
      tool: worst.tool,
    };
  }

  for (const step of TOOL_JOURNEY) {
    if (toolsDone.has(step.tool)) continue;
    if (step.prereq && !toolsDone.has(step.prereq)) continue;
    return { title: step.title, reason: step.reason, route: step.route, tool: step.tool };
  }

  if (toolsDone.has("launch")) {
    return {
      title: "Consult Product Twin",
      reason: "You've run the full intelligence suite — synthesize all signals with your digital twin",
      route: "/app/twin",
      tool: "twin",
    };
  }

  return {
    title: "Run Idea Checker",
    reason: "Validate your product idea before building further",
    route: "/app/idea",
    tool: "idea",
  };
}

interface DashboardData {
  reports: ReportLike[];
  projects: ProjectLike[];
  tasks: TaskLike[];
  proofSignalCount: number;
  latestScores: Record<string, number>;
  nextBestAction: NextBestAction;
  riskRadar: string[];
}

export async function getDashboardData(): Promise<DashboardData> {
  if (isDemoMode()) {
    const userId = await requireUserId();
    const reports = demoStore.getReports(userId);
    const projects = demoStore.getProjects(userId);
    const tasks = demoStore.getTasks(userId);
    const proofSignalCount = demoStore.getProofSignals(userId).length;

    const latestForTool = (tool: string) => reports.find((r: ReportLike) => r.tool === tool);
    const scoreFor = (tool: string) => latestForTool(tool)?.score ?? 0;

    const latestScores = {
      ideaScore: scoreFor('idea'), realityScore: scoreFor('reality'), proofScore: scoreFor('proof'),
      swarmScore: scoreFor('swarm'), mvpScore: scoreFor('mvp'), doctorScore: scoreFor('doctor'), launchScore: scoreFor('launch'),
    };

    const nextBestAction = computeNextBestAction(reports, tasks, projects, latestScores);

    const riskRadar: string[] = [];
    const openTaskCount = tasks.filter((t: TaskLike) => t.status === 'todo').length;
    const lowScoreCount = reports.filter((r: ReportLike) => r.score !== undefined && r.score !== null && r.score < 50).length;
    const highPriorityOpen = tasks.filter((t: TaskLike) => t.status === 'todo' && t.priority === 'high').length;

    if (openTaskCount > 15) riskRadar.push(`Task backlog growing (${openTaskCount} open) — complete before adding more`);
    else if (openTaskCount > 8) riskRadar.push(`${openTaskCount} open tasks — consider a focused sprint`);
    if (highPriorityOpen > 5) riskRadar.push(`${highPriorityOpen} high-priority tasks unaddressed`);
    if (lowScoreCount > 2) riskRadar.push(`${lowScoreCount} reports scoring below 50 — review and act on findings`);
    if (projects.length === 0 && reports.length > 2) riskRadar.push("No project workspace — create one to organize your reports and tasks");

    return { reports, projects, tasks, proofSignalCount, latestScores, nextBestAction, riskRadar };
  }

  return withErrorHandling("getDashboardData", async () => {
    const userId = await requireUserId();
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase not configured");

    try {
      const [reportsResult, projectsResult, tasksResult, signalsResult] = await Promise.all([
        supabase.from("reports").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("projects").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("tasks").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("proof_signals").select("id").eq("user_id", userId),
      ]);

      const reports = (reportsResult.data ?? []) as ReportLike[];
      const projects = (projectsResult.data ?? []) as ProjectLike[];
      const tasks = (tasksResult.data ?? []) as TaskLike[];
      const proofSignalCount = (signalsResult.data ?? []).length;

      const latestForTool = (tool: string) => reports.find((r: ReportLike) => r.tool === tool);
      const scoreFor = (tool: string) => latestForTool(tool)?.score ?? 0;

      const latestScores = {
        ideaScore: scoreFor('idea'), realityScore: scoreFor('reality'), proofScore: scoreFor('proof'),
        swarmScore: scoreFor('swarm'), mvpScore: scoreFor('mvp'), doctorScore: scoreFor('doctor'), launchScore: scoreFor('launch'),
      };

      const nextBestAction = computeNextBestAction(reports, tasks, projects, latestScores);

      const riskRadar: string[] = [];
      const openTaskCount = tasks.filter((t: TaskLike) => t.status === 'todo').length;
      const lowScoreCount = reports.filter((r: ReportLike) => r.score !== undefined && r.score !== null && r.score < 50).length;
      const highPriorityOpen = tasks.filter((t: TaskLike) => t.status === 'todo' && t.priority === 'high').length;

      if (openTaskCount > 15) riskRadar.push(`Task backlog growing (${openTaskCount} open) — complete before adding more`);
      else if (openTaskCount > 8) riskRadar.push(`${openTaskCount} open tasks — consider a focused sprint`);
      if (highPriorityOpen > 5) riskRadar.push(`${highPriorityOpen} high-priority tasks unaddressed`);
      if (lowScoreCount > 2) riskRadar.push(`${lowScoreCount} reports scoring below 50 — review and act on findings`);
      if (projects.length === 0 && reports.length > 2) riskRadar.push("No project workspace — create one to organize your reports and tasks");
      if (latestScores.ideaScore > 0 && latestScores.realityScore === 0) riskRadar.push("Idea Checker done but no Reality Compiler — validate your assumptions next");
      if (latestScores.doctorScore > 0 && latestScores.doctorScore < 50) riskRadar.push("Project Doctor flagged critical issues — review before launch");
      if (latestScores.launchScore > 0 && latestScores.launchScore < 65) riskRadar.push("Launch readiness below 65 — resolve gate failures before going live");

      return { reports, projects, tasks, proofSignalCount, latestScores, nextBestAction, riskRadar };
    } catch (error) {
      handleSupabaseError(error as { message?: string; code?: string } | null, "getDashboardData");
      return {
        reports: [], projects: [], tasks: [], proofSignalCount: 0,
        latestScores: { ideaScore: 0, realityScore: 0, proofScore: 0, swarmScore: 0, mvpScore: 0, doctorScore: 0, launchScore: 0 },
        nextBestAction: { title: "Run Idea Checker", reason: "Start by validating your product idea", route: "/app/idea", tool: "idea" },
        riskRadar: [],
      };
    }
  });
}
