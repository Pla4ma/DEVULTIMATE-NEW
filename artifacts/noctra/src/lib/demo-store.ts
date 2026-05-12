const makeId = () => crypto.randomUUID();
const now = () => new Date().toISOString();

type Report = {
  id: string; user_id: string; tool: string; title: string;
  payload: unknown; score: number | null; summary: string | null;
  project_id: string | null; created_at: string;
};

type Project = {
  id: string; user_id: string; name: string; idea: string | null;
  stage: string; status: string; meta: unknown; created_at: string;
};

type Task = {
  id: string; user_id: string; title: string; detail: string | null;
  priority: string; category: string; status: string; project_id: string | null;
  source_report_id: string | null; created_at: string;
};

type ProofSignal = {
  id: string; user_id: string; label: string; kind: string;
  value: number | null; weight: number; source: string | null;
  evidence: string | null; project_id: string | null; created_at: string;
};

type Scan = {
  id: string; user_id: string; file_name: string; summary: string;
  payload: unknown; project_id: string | null; created_at: string;
};

class DemoStore {
  reports: Report[] = [];
  projects: Project[] = [];
  tasks: Task[] = [];
  proofSignals: ProofSignal[] = [];
  scans: Scan[] = [];

  saveReport(userId: string, params: { tool: string; title: string; payload: unknown; score?: number; summary?: string; projectId?: string }): Report {
    const r: Report = {
      id: makeId(), user_id: userId, tool: params.tool, title: params.title,
      payload: params.payload, score: params.score ?? null, summary: params.summary ?? null,
      project_id: params.projectId ?? null, created_at: now(),
    };
    this.reports.unshift(r);
    return r;
  }

  getReports(userId: string, tool?: string, projectId?: string): Report[] {
    return this.reports
      .filter((r) => r.user_id === userId)
      .filter((r) => !tool || r.tool === tool)
      .filter((r) => !projectId || r.project_id === projectId);
  }

  getReport(userId: string, id: string): Report | null {
    return this.reports.find((r) => r.id === id && r.user_id === userId) ?? null;
  }

  deleteReport(userId: string, id: string): void {
    this.reports = this.reports.filter((r) => !(r.id === id && r.user_id === userId));
  }

  linkReportToProject(userId: string, reportId: string, projectId: string | null): void {
    const r = this.reports.find((r) => r.id === reportId && r.user_id === userId);
    if (r) r.project_id = projectId;
  }

  updateReport(userId: string, id: string, updates: Partial<Pick<Report, "title" | "payload" | "score" | "summary" | "project_id">>): Report | null {
    const r = this.reports.find((r) => r.id === id && r.user_id === userId);
    if (!r) return null;
    Object.assign(r, updates);
    return r;
  }

  createProject(userId: string, params: { name: string; idea?: string; stage?: string; status?: string; meta?: unknown }): Project {
    const p: Project = {
      id: makeId(), user_id: userId, name: params.name, idea: params.idea ?? null,
      stage: params.stage ?? "idea", status: params.status ?? "active", meta: params.meta ?? {},
      created_at: now(),
    };
    this.projects.unshift(p);
    return p;
  }

  getProjects(userId: string): Project[] {
    return this.projects.filter((p) => p.user_id === userId);
  }

  getProject(userId: string, id: string): Project | null {
    return this.projects.find((p) => p.id === id && p.user_id === userId) ?? null;
  }

  updateProject(userId: string, id: string, patch: Partial<Project>): Project | null {
    const p = this.projects.find((p) => p.id === id && p.user_id === userId);
    if (!p) return null;
    Object.assign(p, patch);
    return p;
  }

  deleteProject(userId: string, id: string): void {
    this.projects = this.projects.filter((p) => !(p.id === id && p.user_id === userId));
  }

  saveTasks(userId: string, tasks: Array<{ title: string; detail?: string; priority?: string; projectId?: string; sourceReportId?: string; category?: string }>): Task[] {
    const created: Task[] = tasks.map((t) => ({
      id: makeId(), user_id: userId, title: t.title, detail: t.detail ?? null,
      priority: t.priority ?? "medium", category: t.category ?? "development",
      status: "todo", project_id: t.projectId ?? null, source_report_id: t.sourceReportId ?? null,
      created_at: now(),
    }));
    this.tasks.unshift(...created);
    return created;
  }

  createTask(userId: string, task: { title: string; detail?: string; priority?: string; projectId?: string; sourceReportId?: string; category?: string }): Task {
    const t: Task = {
      id: makeId(), user_id: userId, title: task.title, detail: task.detail ?? null,
      priority: task.priority ?? "medium", category: task.category ?? "development",
      status: "todo", project_id: task.projectId ?? null, source_report_id: task.sourceReportId ?? null,
      created_at: now(),
    };
    this.tasks.unshift(t);
    return t;
  }

  getTasks(userId: string, projectId?: string): Task[] {
    return this.tasks
      .filter((t) => t.user_id === userId)
      .filter((t) => !projectId || t.project_id === projectId);
  }

  updateTaskStatus(userId: string, id: string, status: string): void {
    const t = this.tasks.find((t) => t.id === id && t.user_id === userId);
    if (t) t.status = status;
  }

  updateTask(userId: string, id: string, patch: Partial<Task>): void {
    const t = this.tasks.find((t) => t.id === id && t.user_id === userId);
    if (t) Object.assign(t, patch);
  }

  deleteTask(userId: string, id: string): void {
    this.tasks = this.tasks.filter((t) => !(t.id === id && t.user_id === userId));
  }

  saveProofSignals(userId: string, signals: Array<{ label: string; kind: string; value?: number; weight?: number; source?: string; evidence?: string; projectId?: string }>): ProofSignal[] {
    const created: ProofSignal[] = signals.map((s) => ({
      id: makeId(), user_id: userId, label: s.label, kind: s.kind,
      value: s.value ?? null, weight: s.weight ?? 1, source: s.source ?? null,
      evidence: s.evidence ?? null, project_id: s.projectId ?? null, created_at: now(),
    }));
    this.proofSignals.unshift(...created);
    return created;
  }

  getProofSignals(userId: string, projectId?: string): ProofSignal[] {
    return this.proofSignals
      .filter((s) => s.user_id === userId)
      .filter((s) => !projectId || s.project_id === projectId);
  }

  createProofSignal(userId: string, signal: { label: string; kind: string; value?: number; weight?: number; source?: string; evidence?: string; projectId?: string }): ProofSignal {
    const s: ProofSignal = {
      id: makeId(), user_id: userId, label: signal.label, kind: signal.kind,
      value: signal.value ?? null, weight: signal.weight ?? 1, source: signal.source ?? null,
      evidence: signal.evidence ?? null, project_id: signal.projectId ?? null, created_at: now(),
    };
    this.proofSignals.unshift(s);
    return s;
  }

  deleteProofSignal(userId: string, id: string): void {
    this.proofSignals = this.proofSignals.filter((s) => !(s.id === id && s.user_id === userId));
  }

  saveScan(userId: string, params: { fileName: string; summary: string; payload: unknown; projectId?: string }): Scan {
    const s: Scan = {
      id: makeId(), user_id: userId, file_name: params.fileName, summary: params.summary,
      payload: params.payload, project_id: params.projectId ?? null, created_at: now(),
    };
    this.scans.unshift(s);
    return s;
  }

  getScans(userId: string, projectId?: string): Scan[] {
    return this.scans
      .filter((s) => s.user_id === userId)
      .filter((s) => !projectId || s.project_id === projectId);
  }
}

export const demoStore = new DemoStore();
