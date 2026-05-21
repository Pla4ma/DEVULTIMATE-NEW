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

type Blocker = {
  id: string; user_id: string; project_id: string; scan_id: string | null;
  title: string; severity: "P0" | "P1" | "P2";
  category: string; evidence: string | null; why_it_matters: string | null;
  recommended_fix: string | null; acceptance_criteria: string | null;
  status: "open" | "in_progress" | "fixed" | "ignored";
  linked_task_id: string | null; created_at: string; updated_at: string;
};

type ScanSnapshot = {
  id: string; user_id: string; project_id: string; report_id: string | null;
  score: number | null; blockers: unknown[]; static_signals: Record<string, unknown>;
  generated_tasks: unknown[]; evidence_index: unknown[]; summary: string | null;
  created_at: string;
};

class DemoStore {
  reports: Report[] = [];
  projects: Project[] = [];
  tasks: Task[] = [];
  proofSignals: ProofSignal[] = [];
  scans: Scan[] = [];
  blockers: Blocker[] = [];
  scanSnapshots: ScanSnapshot[] = [];

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

  getBlockers(userId: string, projectId: string): Blocker[] {
    return this.blockers.filter((b) => b.user_id === userId && b.project_id === projectId);
  }

  createBlocker(userId: string, params: { projectId: string; title: string; severity?: string; category?: string; evidence?: string; whyItMatters?: string; recommendedFix?: string; acceptanceCriteria?: string; status?: string; scanId?: string }): Blocker {
    const b: Blocker = {
      id: makeId(), user_id: userId, project_id: params.projectId,
      title: params.title, severity: (params.severity ?? "P1") as "P0" | "P1" | "P2",
      category: (params.category ?? "code") as Blocker["category"],
      evidence: params.evidence ?? null, why_it_matters: params.whyItMatters ?? null,
      recommended_fix: params.recommendedFix ?? null, acceptance_criteria: params.acceptanceCriteria ?? null,
      status: (params.status ?? "open") as Blocker["status"],
      scan_id: params.scanId ?? null, linked_task_id: null, created_at: now(), updated_at: now(),
    };
    this.blockers.unshift(b);
    return b;
  }

  updateBlocker(userId: string, id: string, patch: Partial<Blocker>): Blocker | null {
    const b = this.blockers.find((b) => b.id === id && b.user_id === userId);
    if (!b) return null;
    Object.assign(b, patch, { updated_at: now() });
    return b;
  }

  deleteBlocker(userId: string, id: string): void {
    this.blockers = this.blockers.filter((b) => !(b.id === id && b.user_id === userId));
  }

  getScanSnapshots(userId: string, projectId: string): ScanSnapshot[] {
    return this.scanSnapshots.filter((s) => s.user_id === userId && s.project_id === projectId);
  }

  getLatestScanSnapshot(userId: string, projectId: string): ScanSnapshot | null {
    const snaps = this.scanSnapshots.filter((s) => s.user_id === userId && s.project_id === projectId);
    return snaps.length > 0 ? snaps[0]! : null;
  }

  getScanDelta(userId: string, projectId: string): { current: ScanSnapshot | null; previous: ScanSnapshot | null; delta: null | { scoreDelta: number; fixedBlockers: number; newBlockers: number; unresolvedBlockers: number; isFirstScan: boolean; scoreImproved: boolean; scoreDeclined: boolean } } {
    const snaps = this.scanSnapshots.filter((s) => s.user_id === userId && s.project_id === projectId);
    if (snaps.length === 0) return { current: null, previous: null, delta: null };
    const current = snaps[0]!;
    const previous = snaps[1] ?? null;
    const currentBlockers = (current.blockers as Array<{ id: string; status: string }>) ?? [];
    const previousBlockers = previous ? (previous.blockers as Array<{ id: string; status: string }>) ?? [] : [];
    const previousIds = new Set(previousBlockers.map((b) => b.id));
    const currentIds = new Set(currentBlockers.map((b) => b.id));
    const fixedBlockers = previousBlockers.filter((b) => !currentIds.has(b.id) || b.status === "fixed").length;
    const newBlockers = currentBlockers.filter((b) => !previousIds.has(b.id)).length;
    const unresolvedBlockers = currentBlockers.filter((b) => b.status === "open" || b.status === "in_progress").length;
    const scoreDelta = previous ? (current.score ?? 0) - (previous.score ?? 0) : 0;
    return { current, previous, delta: { scoreDelta, fixedBlockers, newBlockers, unresolvedBlockers, isFirstScan: !previous, scoreImproved: scoreDelta > 0, scoreDeclined: scoreDelta < 0 } };
  }

  createScanSnapshot(userId: string, params: { projectId: string; reportId?: string; score?: number; blockers?: unknown[]; staticSignals?: Record<string, unknown>; generatedTasks?: unknown[]; evidenceIndex?: unknown[]; summary?: string }): ScanSnapshot {
    const s: ScanSnapshot = {
      id: makeId(), user_id: userId, project_id: params.projectId,
      report_id: params.reportId ?? null, score: params.score ?? null,
      blockers: params.blockers ?? [], static_signals: params.staticSignals ?? {},
      generated_tasks: params.generatedTasks ?? [], evidence_index: params.evidenceIndex ?? [],
      summary: params.summary ?? null, created_at: now(),
    };
    this.scanSnapshots.unshift(s);
    return s;
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
