import { supabase as _supabase, isSupabaseConfigured, supabaseConfigError } from "@/integrations/supabase/client";
import { isDemoMode, getDemoUser, DEMO_USER_FALLBACK_ID } from "@/lib/demo-mode";
import { demoStore } from "@/lib/demo-store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase: any = _supabase;

export class RepositoryError extends Error {
  constructor(
    message: string,
    public code?: string,
    public operation?: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public details?: any
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}

export async function requireUserId(): Promise<string> {
  if (isDemoMode()) {
    return getDemoUser()?.id ?? DEMO_USER_FALLBACK_ID;
  }
  if (!isSupabaseConfigured()) {
    throw new RepositoryError(
      supabaseConfigError ?? "Supabase is not configured.",
      "SUPABASE_NOT_CONFIGURED",
      "getUser",
    );
  }
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      throw new RepositoryError("Authentication failed", "AUTH_ERROR", "getUser", { originalError: error });
    }
    if (!data.user) {
      throw new RepositoryError("You must be signed in", "NOT_AUTHENTICATED", "getUser");
    }
    return data.user.id;
  } catch (error) {
    if (error instanceof RepositoryError) throw error;
    throw new RepositoryError("Unexpected authentication error", "UNKNOWN_AUTH_ERROR", "getUser", { originalError: error });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleSupabaseError(error: any, operation: string, context?: any): never {
  switch (error?.code) {
    case 'PGRST116':
      throw new RepositoryError("Resource not found", "NOT_FOUND", operation, { ...context, originalError: error });
    case 'PGRST301':
      throw new RepositoryError("Permission denied", "PERMISSION_DENIED", operation, { ...context, originalError: error });
    case '23505':
      throw new RepositoryError("Resource already exists", "DUPLICATE", operation, { ...context, originalError: error });
    default:
      throw new RepositoryError(error?.message || "Database operation failed", "DATABASE_ERROR", operation, { ...context, originalError: error });
  }
}

async function withErrorHandling<T>(
  operation: string,
  fn: () => Promise<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context?: any
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof RepositoryError) throw error;
    handleSupabaseError(error, operation, context);
  }
}

// ─── DASHBOARD INTELLIGENCE ─────────────────────────────────────────────────

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function computeNextBestAction(reports: any[], tasks: any[], projects: any[], latestScores: Record<string, number>): NextBestAction {
  const toolsDone = new Set<string>(reports.map((r: Record<string, unknown>) => String(r.tool ?? "")));
  const openTaskCount = tasks.filter((t: Record<string, unknown>) => t.status === "todo").length;

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
    return toolsDone.has(tool) && score > 0 && score < 45;
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

// ─── REPORTS ────────────────────────────────────────────────────────────────

export async function saveReport(params: {
  tool: string;
  title: string;
  payload: unknown;
  score?: number;
  summary?: string;
  projectId?: string;
}) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.saveReport(userId, params);
  }
  return withErrorHandling("saveReport", async () => {
    const userId = await requireUserId();
    if (!params.tool?.trim()) throw new RepositoryError("Tool is required", "VALIDATION_ERROR", "saveReport");
    if (!params.title?.trim()) throw new RepositoryError("Title is required", "VALIDATION_ERROR", "saveReport");
    if (!params.payload) throw new RepositoryError("Payload is required", "VALIDATION_ERROR", "saveReport");

    const { data, error } = await supabase
      .from("reports")
      .insert({
        user_id: userId,
        tool: params.tool.trim(),
        title: params.title.trim(),
        payload: params.payload as never,
        score: params.score ?? null,
        summary: params.summary?.trim() ?? null,
        project_id: params.projectId ?? null,
      })
      .select()
      .single();
    if (error) handleSupabaseError(error, "saveReport", { params });
    return data;
  });
}

export async function getReports(tool?: string, projectId?: string) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.getReports(userId, tool, projectId);
  }
  return withErrorHandling("getReports", async () => {
    const userId = await requireUserId();
    let q = supabase.from("reports").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (tool) q = q.eq("tool", tool);
    if (projectId) q = q.eq("project_id", projectId);
    const { data, error } = await q;
    if (error) handleSupabaseError(error, "getReports", { tool, projectId });
    return data ?? [];
  });
}

export async function getReport(id: string) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.getReport(userId, id);
  }
  return withErrorHandling("getReport", async () => {
    if (!id?.trim()) throw new RepositoryError("Report ID is required", "VALIDATION_ERROR", "getReport");
    const userId = await requireUserId();
    const { data, error } = await supabase.from("reports").select("*").eq("id", id).eq("user_id", userId).single();
    if (error) handleSupabaseError(error, "getReport", { id });
    return data;
  });
}

export async function deleteReport(id: string) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    demoStore.deleteReport(userId, id);
    return;
  }
  return withErrorHandling("deleteReport", async () => {
    if (!id?.trim()) throw new RepositoryError("Report ID is required", "VALIDATION_ERROR", "deleteReport");
    const userId = await requireUserId();
    const { error } = await supabase.from("reports").delete().eq("id", id).eq("user_id", userId);
    if (error) handleSupabaseError(error, "deleteReport", { id });
  });
}

export async function linkReportToProject(reportId: string, projectId: string | null) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    demoStore.linkReportToProject(userId, reportId, projectId);
    return;
  }
  return withErrorHandling("linkReportToProject", async () => {
    if (!reportId?.trim()) throw new RepositoryError("Report ID is required", "VALIDATION_ERROR", "linkReportToProject");
    const userId = await requireUserId();
    const { error } = await supabase.from("reports").update({ project_id: projectId }).eq("id", reportId).eq("user_id", userId);
    if (error) handleSupabaseError(error, "linkReportToProject", { reportId, projectId });
  });
}

export async function updateReport(id: string, updates: { title?: string; payload?: unknown; score?: number; summary?: string; project_id?: string | null }) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.updateReport(userId, id, updates);
  }
  return withErrorHandling("updateReport", async () => {
    if (!id?.trim()) throw new RepositoryError("Report ID is required", "VALIDATION_ERROR", "updateReport");
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from("reports")
      .update({ ...updates, payload: updates.payload as never, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) handleSupabaseError(error, "updateReport", { id, updates });
    return data;
  });
}

// ─── DASHBOARD ──────────────────────────────────────────────────────────────

export async function getDashboardData() {
  if (isDemoMode()) {
    const userId = await requireUserId();
    const reports = demoStore.getReports(userId);
    const projects = demoStore.getProjects(userId);
    const tasks = demoStore.getTasks(userId);
    const proofSignalCount = demoStore.getProofSignals(userId).length;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const latestForTool = (tool: string) => reports.find((r: any) => r.tool === tool);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scoreFor = (tool: string) => (latestForTool(tool) as any)?.score ?? 0;

    const latestScores = {
      ideaScore: scoreFor('idea'), realityScore: scoreFor('reality'), proofScore: scoreFor('proof'),
      swarmScore: scoreFor('swarm'), mvpScore: scoreFor('mvp'), doctorScore: scoreFor('doctor'), launchScore: scoreFor('launch'),
    };

    const nextBestAction = computeNextBestAction(reports, tasks, projects, latestScores);

    const riskRadar: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const openTaskCount = tasks.filter((t: any) => t.status === 'todo').length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lowScoreCount = reports.filter((r: any) => r.score && r.score < 50).length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const highPriorityOpen = tasks.filter((t: any) => t.status === 'todo' && t.priority === 'high').length;

    if (openTaskCount > 15) riskRadar.push(`Task backlog growing (${openTaskCount} open) — complete before adding more`);
    else if (openTaskCount > 8) riskRadar.push(`${openTaskCount} open tasks — consider a focused sprint`);
    if (highPriorityOpen > 5) riskRadar.push(`${highPriorityOpen} high-priority tasks unaddressed`);
    if (lowScoreCount > 2) riskRadar.push(`${lowScoreCount} reports scoring below 50 — review and act on findings`);
    if (projects.length === 0 && reports.length > 2) riskRadar.push("No project workspace — create one to organize your reports and tasks");

    return { reports, projects, tasks, proofSignalCount, latestScores, nextBestAction, riskRadar };
  }

  return withErrorHandling("getDashboardData", async () => {
    const userId = await requireUserId();
    try {
      const [reportsResult, projectsResult, tasksResult, signalsResult] = await Promise.all([
        supabase.from("reports").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("projects").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("tasks").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("proof_signals").select("id").eq("user_id", userId),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reports = reportsResult.data ?? [] as any[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const projects = projectsResult.data ?? [] as any[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tasks = tasksResult.data ?? [] as any[];
      const proofSignalCount = (signalsResult.data ?? []).length;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const latestForTool = (tool: string) => reports.find((r: any) => r.tool === tool);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scoreFor = (tool: string) => latestForTool(tool)?.score ?? 0;

      const latestScores = {
        ideaScore: scoreFor('idea'), realityScore: scoreFor('reality'), proofScore: scoreFor('proof'),
        swarmScore: scoreFor('swarm'), mvpScore: scoreFor('mvp'), doctorScore: scoreFor('doctor'), launchScore: scoreFor('launch'),
      };

      const nextBestAction = computeNextBestAction(reports, tasks, projects, latestScores);

      const riskRadar: string[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const openTaskCount = tasks.filter((t: any) => t.status === 'todo').length;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lowScoreCount = reports.filter((r: any) => r.score && r.score < 50).length;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const highPriorityOpen = tasks.filter((t: any) => t.status === 'todo' && t.priority === 'high').length;

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
      handleSupabaseError(error, "getDashboardData");
      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        reports: [] as any[], projects: [] as any[], tasks: [] as any[], proofSignalCount: 0,
        latestScores: { ideaScore: 0, realityScore: 0, proofScore: 0, swarmScore: 0, mvpScore: 0, doctorScore: 0, launchScore: 0 },
        nextBestAction: { title: "Run Idea Checker", reason: "Start by validating your product idea", route: "/app/idea", tool: "idea" as string | undefined },
        riskRadar: [] as string[],
      };
    }
  });
}

// ─── PROJECTS ───────────────────────────────────────────────────────────────

export async function createProject(params: { name: string; idea?: string; stage?: string; status?: string; meta?: Record<string, unknown> }) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.createProject(userId, params);
  }
  return withErrorHandling("createProject", async () => {
    const userId = await requireUserId();
    if (!params.name?.trim()) throw new RepositoryError("Project name is required", "VALIDATION_ERROR", "createProject");
    const { data, error } = await supabase
      .from("projects")
      .insert({ user_id: userId, name: params.name.trim(), idea: params.idea?.trim() ?? null, stage: params.stage ?? "idea", status: params.status ?? "active", meta: (params.meta ?? {}) as never })
      .select().single();
    if (error) handleSupabaseError(error, "createProject", { params });
    return data;
  });
}

export async function getProjects() {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.getProjects(userId);
  }
  return withErrorHandling("getProjects", async () => {
    const userId = await requireUserId();
    const { data, error } = await supabase.from("projects").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (error) handleSupabaseError(error, "getProjects");
    return data ?? [];
  });
}

export async function getProject(id: string) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.getProject(userId, id);
  }
  return withErrorHandling("getProject", async () => {
    if (!id?.trim()) throw new RepositoryError("Project ID is required", "VALIDATION_ERROR", "getProject");
    const userId = await requireUserId();
    const { data, error } = await supabase.from("projects").select("*").eq("id", id).eq("user_id", userId).single();
    if (error) handleSupabaseError(error, "getProject", { id });
    return data;
  });
}

export async function updateProject(id: string, patch: Partial<{ name: string; idea: string; stage: string; status: string; meta: Record<string, unknown> }>) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.updateProject(userId, id, patch as never);
  }
  return withErrorHandling("updateProject", async () => {
    const userId = await requireUserId();
    const { data, error } = await supabase.from("projects").update(patch as never).eq("id", id).eq("user_id", userId).select().single();
    if (error) handleSupabaseError(error, "updateProject", { id, patch });
    return data;
  });
}

export async function deleteProject(id: string) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    demoStore.deleteProject(userId, id);
    return;
  }
  return withErrorHandling("deleteProject", async () => {
    if (!id?.trim()) throw new RepositoryError("Project ID is required", "VALIDATION_ERROR", "deleteProject");
    const userId = await requireUserId();
    const { error } = await supabase.from("projects").delete().eq("id", id).eq("user_id", userId);
    if (error) handleSupabaseError(error, "deleteProject", { id });
  });
}

// ─── TASKS ──────────────────────────────────────────────────────────────────

export async function saveTasks(tasks: Array<{ title: string; detail?: string; priority?: string; projectId?: string; sourceReportId?: string; category?: string }>) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.saveTasks(userId, tasks);
  }
  return withErrorHandling("saveTasks", async () => {
    const userId = await requireUserId();
    tasks.forEach((task) => {
      if (!task.title?.trim()) throw new RepositoryError("Task title is required", "VALIDATION_ERROR", "saveTasks");
    });
    const { data, error } = await supabase
      .from("tasks")
      .insert(tasks.map((t) => ({
        user_id: userId, title: t.title.trim(), detail: t.detail?.trim() ?? null,
        priority: (t.priority as never) ?? "medium", project_id: t.projectId ?? null,
        source_report_id: t.sourceReportId ?? null, category: t.category ?? "development", status: "todo",
      })))
      .select();
    if (error) handleSupabaseError(error, "saveTasks", { tasks });
    return data ?? [];
  });
}

export async function createTask(task: { title: string; detail?: string; priority?: string; projectId?: string; sourceReportId?: string; category?: string }) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.createTask(userId, task);
  }
  return withErrorHandling("createTask", async () => {
    const userId = await requireUserId();
    if (!task.title?.trim()) throw new RepositoryError("Task title is required", "VALIDATION_ERROR", "createTask");
    const { data, error } = await supabase
      .from("tasks")
      .insert({ user_id: userId, title: task.title, detail: task.detail ?? null, priority: task.priority ?? "medium", project_id: task.projectId ?? null, source_report_id: task.sourceReportId ?? null, category: task.category ?? "development", status: "todo" })
      .select().single();
    if (error) handleSupabaseError(error, "createTask", { task });
    return data;
  });
}

export async function getTasks(projectId?: string) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.getTasks(userId, projectId);
  }
  return withErrorHandling("getTasks", async () => {
    const userId = await requireUserId();
    let q = supabase.from("tasks").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (projectId) q = q.eq("project_id", projectId);
    const { data, error } = await q;
    if (error) handleSupabaseError(error, "getTasks", { projectId });
    return data ?? [];
  });
}

export async function updateTaskStatus(id: string, status: string) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    demoStore.updateTaskStatus(userId, id, status);
    return;
  }
  return withErrorHandling("updateTaskStatus", async () => {
    if (!id?.trim()) throw new RepositoryError("Task ID is required", "VALIDATION_ERROR", "updateTaskStatus");
    const userId = await requireUserId();
    const { error } = await supabase.from("tasks").update({ status }).eq("id", id).eq("user_id", userId);
    if (error) handleSupabaseError(error, "updateTaskStatus", { id, status });
  });
}

export async function updateTask(id: string, patch: Partial<{ title: string; detail: string; priority: string; status: string; project_id: string }>) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    demoStore.updateTask(userId, id, patch as never);
    return;
  }
  return withErrorHandling("updateTask", async () => {
    const userId = await requireUserId();
    const { error } = await supabase.from("tasks").update(patch).eq("id", id).eq("user_id", userId);
    if (error) handleSupabaseError(error, "updateTask", { id, patch });
  });
}

export async function deleteTask(id: string) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    demoStore.deleteTask(userId, id);
    return;
  }
  return withErrorHandling("deleteTask", async () => {
    if (!id?.trim()) throw new RepositoryError("Task ID is required", "VALIDATION_ERROR", "deleteTask");
    const userId = await requireUserId();
    const { error } = await supabase.from("tasks").delete().eq("id", id).eq("user_id", userId);
    if (error) handleSupabaseError(error, "deleteTask", { id });
  });
}

// ─── PROOF SIGNALS ───────────────────────────────────────────────────────────

export async function saveProofSignals(signals: Array<{ label: string; kind: string; value?: number; weight?: number; source?: string; evidence?: string; projectId?: string }>) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.saveProofSignals(userId, signals);
  }
  return withErrorHandling("saveProofSignals", async () => {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from("proof_signals")
      .insert(signals.map((s) => ({ user_id: userId, label: s.label, kind: s.kind, value: s.value ?? null, weight: s.weight ?? 1, source: s.source ?? null, evidence: s.evidence ?? null, project_id: s.projectId ?? null })))
      .select();
    if (error) handleSupabaseError(error, "saveProofSignals", { signals });
    return data ?? [];
  });
}

export async function getProofSignals(projectId?: string) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.getProofSignals(userId, projectId);
  }
  return withErrorHandling("getProofSignals", async () => {
    const userId = await requireUserId();
    let q = supabase.from("proof_signals").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (projectId) q = q.eq("project_id", projectId);
    const { data, error } = await q;
    if (error) handleSupabaseError(error, "getProofSignals", { projectId });
    return data ?? [];
  });
}

export async function createProofSignal(signal: { label: string; kind: string; value?: number; weight?: number; source?: string; evidence?: string; projectId?: string }) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.createProofSignal(userId, signal);
  }
  return withErrorHandling("createProofSignal", async () => {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from("proof_signals")
      .insert({ user_id: userId, label: signal.label, kind: signal.kind, value: signal.value ?? null, weight: signal.weight ?? 1, source: signal.source ?? null, evidence: signal.evidence ?? null, project_id: signal.projectId ?? null })
      .select().single();
    if (error) handleSupabaseError(error, "createProofSignal", { signal });
    return data;
  });
}

export async function deleteProofSignal(id: string) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    demoStore.deleteProofSignal(userId, id);
    return;
  }
  return withErrorHandling("deleteProofSignal", async () => {
    const userId = await requireUserId();
    const { error } = await supabase.from("proof_signals").delete().eq("id", id).eq("user_id", userId);
    if (error) handleSupabaseError(error, "deleteProofSignal", { id });
  });
}

// ─── SCANS ────────────────────────────────────────────────────────────────────

export async function saveScan(params: { fileName: string; summary: string; payload: unknown; projectId?: string }) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.saveScan(userId, params);
  }
  return withErrorHandling("saveScan", async () => {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from("scans")
      .insert({ user_id: userId, file_name: params.fileName, summary: params.summary, payload: params.payload as never, project_id: params.projectId ?? null })
      .select().single();
    if (error) handleSupabaseError(error, "saveScan", { params });
    return data;
  });
}

export async function getScans(projectId?: string) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.getScans(userId, projectId);
  }
  return withErrorHandling("getScans", async () => {
    const userId = await requireUserId();
    let q = supabase.from("scans").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (projectId) q = q.eq("project_id", projectId);
    const { data, error } = await q;
    if (error) handleSupabaseError(error, "getScans", { projectId });
    return data ?? [];
  });
}

// ─── PASSPORT ─────────────────────────────────────────────────────────────────
// Passport data is computed dynamically from reports/tasks/signals — no dedicated table.

export async function getPassport(): Promise<null> {
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function upsertPassport(_patch: Record<string, unknown>): Promise<null> {
  return null;
}
