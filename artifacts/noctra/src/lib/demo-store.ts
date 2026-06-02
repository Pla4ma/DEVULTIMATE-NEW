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

  private seeded = false;

  seed(userId: string): void {
    if (this.seeded) return;
    this.seeded = true;
    seedDemoData(this, userId);
  }
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

function seedDemoData(store: DemoStore, userId: string): void {
  const helix: Project = {
    id: "demo-proj-helix", user_id: userId, name: "Helix — AI code review for teams",
    idea: "An AI reviewer that posts inline PR comments, catches security regressions, and learns each team's conventions.",
    stage: "building", status: "active",
    meta: { repo: "helix/app", stack: ["TypeScript", "React", "Postgres", "Fastify"], team: 4 },
    created_at: daysAgo(38),
  };
  const orbit: Project = {
    id: "demo-proj-orbit", user_id: userId, name: "Orbit — async standup for remote teams",
    idea: "Replace daily standup meetings with threaded async updates and an AI digest that flags blockers.",
    stage: "validating", status: "active",
    meta: { repo: "orbit/web", stack: ["Next.js", "Supabase"], team: 2 },
    created_at: daysAgo(21),
  };
  store.projects.push(helix, orbit);

  const doctorGatesEarly = [
    { name: "Secrets Management", status: "RED" },
    { name: "Error Handling", status: "RED" },
    { name: "Rate Limiting", status: "RED" },
    { name: "Test Coverage", status: "YELLOW" },
    { name: "CI/CD Pipeline", status: "YELLOW" },
    { name: "Dependency Audit", status: "GREEN" },
  ];
  const doctorGatesMid = [
    { name: "Secrets Management", status: "GREEN" },
    { name: "Error Handling", status: "YELLOW" },
    { name: "Rate Limiting", status: "RED" },
    { name: "Test Coverage", status: "YELLOW" },
    { name: "CI/CD Pipeline", status: "GREEN" },
    { name: "Dependency Audit", status: "GREEN" },
  ];
  const doctorGatesLatest = [
    { name: "Secrets Management", status: "GREEN" },
    { name: "Error Handling", status: "GREEN" },
    { name: "Rate Limiting", status: "RED" },
    { name: "Test Coverage", status: "YELLOW" },
    { name: "CI/CD Pipeline", status: "GREEN" },
    { name: "Dependency Audit", status: "GREEN" },
  ];

  const reports: Report[] = [
    {
      id: "demo-rep-doctor-1", user_id: userId, tool: "doctor",
      title: "Launch Readiness Scan — baseline", score: 34,
      summary: "First scan surfaced hardcoded secrets, no rate limiting, and unhandled promise rejections across the API layer.",
      project_id: helix.id, created_at: daysAgo(30),
      payload: { data: { health_score: 34, go_no_go: "NO-GO", gates: doctorGatesEarly,
        red_gates: ["Secrets Management", "Error Handling", "Rate Limiting"],
        files_analyzed: 312, frameworks: ["React", "Fastify", "Postgres"],
        red_flags: ["AWS key committed in src/config.ts", "No global error boundary", "Public endpoints unthrottled"] } },
    },
    {
      id: "demo-rep-doctor-2", user_id: userId, tool: "doctor",
      title: "Launch Readiness Scan — week 2", score: 58,
      summary: "Secrets moved to env, error boundary added. Rate limiting still missing on auth routes.",
      project_id: helix.id, created_at: daysAgo(16),
      payload: { data: { health_score: 58, go_no_go: "HOLD", gates: doctorGatesMid,
        red_gates: ["Rate Limiting"], files_analyzed: 341, frameworks: ["React", "Fastify", "Postgres"],
        red_flags: ["Login endpoint has no rate limit"] } },
    },
    {
      id: "demo-rep-doctor-3", user_id: userId, tool: "doctor",
      title: "Launch Readiness Scan — current", score: 72,
      summary: "Strong progress. Error handling now green. One blocker remains: auth rate limiting before launch.",
      project_id: helix.id, created_at: daysAgo(2),
      payload: { data: { health_score: 72, go_no_go: "HOLD", gates: doctorGatesLatest,
        red_gates: ["Rate Limiting"], files_analyzed: 358, frameworks: ["React", "Fastify", "Postgres"],
        red_flags: ["Auth rate limiting not yet implemented"] } },
    },
    {
      id: "demo-rep-idea", user_id: userId, tool: "idea",
      title: "Idea Signal — AI code review", score: 81,
      summary: "Strong signal. Clear pain, willing buyers, but a crowded field with well-funded incumbents.",
      project_id: helix.id, created_at: daysAgo(35),
      payload: { data: { signal_score: 81, verdict: "Strong signal — validate differentiation",
        red_flags: ["Crowded space (CodeRabbit, Graphite, Greptile)", "Enterprise sales cycle is long"],
        green_flags: ["Teams already pay for review tooling", "AI review is a top-3 requested feature"],
        target_market: "Series A–C engineering teams (15–80 devs)" } },
    },
    {
      id: "demo-rep-reality", user_id: userId, tool: "reality",
      title: "Reality Compiler — assumptions", score: 66,
      summary: "Core assumptions hold, but the 'teams will trust AI to block merges' assumption is unproven.",
      project_id: helix.id, created_at: daysAgo(28),
      payload: { data: { reality_score: 66, verdict: "Proceed with caution",
        blind_spots: ["No evidence teams will let AI gate merges", "Self-hosted requirement underestimated for enterprise"],
        assumptions_tested: 9, assumptions_failed: 2 } },
    },
    {
      id: "demo-rep-swarm", user_id: userId, tool: "swarm",
      title: "Market Swarm — demand simulation", score: 74,
      summary: "Simulated 500 ICP reactions. Pricing sweet spot at $20/seat; resistance above $35.",
      project_id: helix.id, created_at: daysAgo(24),
      payload: { data: { swarm_score: 74, demand: "High among 20–60 dev teams",
        price_point: "$20/seat/mo", segments: ["Series A SaaS", "Dev agencies", "Open-source maintainers"] } },
    },
    {
      id: "demo-rep-proof", user_id: userId, tool: "proof",
      title: "Proof Engine — evidence depth", score: 52,
      summary: "Some validation evidence collected, but no paying-customer proof yet. Depth gap on retention.",
      project_id: helix.id, created_at: daysAgo(18),
      payload: { data: { proof_score: 52, verdict: "Evidence shallow — need paid pilots",
        evidence_count: 6, strongest: "12 design partners signed LOIs", weakest: "Zero retention data" } },
    },
    {
      id: "demo-rep-mvp", user_id: userId, tool: "mvp",
      title: "MVP Plan — ruthless scope", score: 70,
      summary: "Cut to one killer loop: PR opens → AI reviews → inline comments → team reacts. Everything else deferred.",
      project_id: helix.id, created_at: daysAgo(12),
      payload: { data: { mvp_score: 70,
        north_star_metric: "PRs reviewed per team per week",
        ruthless_scope: {
          build_now: ["GitHub PR webhook ingestion", "Inline AI review comments", "Per-repo convention learning", "Slack notification on blockers"],
          build_later: ["GitLab + Bitbucket support", "Custom rule editor UI", "Analytics dashboard", "SSO / SAML", "Self-hosted deployment"],
        },
        week_plan: [
          { week: 1, focus: "PR ingestion + review pipeline", deliverables: ["GitHub App auth", "Webhook → queue", "First AI comment posted"] },
          { week: 2, focus: "Convention learning", deliverables: ["Repo style extraction", "Comment quality tuning", "False-positive suppression"] },
          { week: 3, focus: "Team loop", deliverables: ["Slack blocker alerts", "Reaction feedback capture", "3 design-partner pilots live"] },
        ] } },
    },
    {
      id: "demo-rep-launch", user_id: userId, tool: "launch",
      title: "Launch Room — go/no-go", score: 64,
      summary: "One RED gate (rate limiting) blocks GO. Everything else is launch-ready. ETA: 3 days.",
      project_id: helix.id, created_at: daysAgo(1),
      payload: { data: { launch_score: 64, go_no_go: "HOLD",
        gates: doctorGatesLatest, red_gates: ["Rate Limiting"],
        blocking_reason: "Auth rate limiting must ship before public launch" } },
    },
    {
      id: "demo-rep-orbit-idea", user_id: userId, tool: "idea",
      title: "Idea Signal — async standup", score: 59,
      summary: "Moderate signal. Real pain but low willingness to pay; many free alternatives.",
      project_id: orbit.id, created_at: daysAgo(20),
      payload: { data: { signal_score: 59, verdict: "Weak monetization — reconsider wedge",
        red_flags: ["Geekbot/Standuply already dominate", "Low willingness to pay for async standup alone"],
        target_market: "Remote-first teams of 5–30" } },
    },
  ];
  store.reports.push(...reports);

  const tasks: Task[] = [
    { id: "demo-task-1", user_id: userId, title: "Add rate limiting to auth endpoints",
      detail: "Login and signup routes are unthrottled. Add a sliding-window limiter (10 req/min/IP) before launch. This is the only RED gate left.",
      priority: "critical", category: "security", status: "in_progress",
      project_id: helix.id, source_report_id: "demo-rep-doctor-3", created_at: daysAgo(2) },
    { id: "demo-task-2", user_id: userId, title: "Write integration tests for review pipeline",
      detail: "Test coverage gate is YELLOW. Cover the webhook → review → comment path end-to-end.",
      priority: "high", category: "testing", status: "todo",
      project_id: helix.id, source_report_id: "demo-rep-doctor-3", created_at: daysAgo(2) },
    { id: "demo-task-3", user_id: userId, title: "Run 3 paid design-partner pilots",
      detail: "Proof Engine flagged zero retention data. Convert LOIs into paid pilots to gather real usage evidence.",
      priority: "high", category: "validation", status: "todo",
      project_id: helix.id, source_report_id: "demo-rep-proof", created_at: daysAgo(11) },
    { id: "demo-task-4", user_id: userId, title: "Tune false-positive suppression on review comments",
      detail: "Design partners report noise. Add confidence threshold + per-repo mute list.",
      priority: "medium", category: "development", status: "todo",
      project_id: helix.id, source_report_id: "demo-rep-mvp", created_at: daysAgo(9) },
    { id: "demo-task-5", user_id: userId, title: "Move AWS key out of src/config.ts",
      detail: "Hardcoded credential committed to the repo. Rotate the key and load from env.",
      priority: "critical", category: "security", status: "completed",
      project_id: helix.id, source_report_id: "demo-rep-doctor-1", created_at: daysAgo(29) },
    { id: "demo-task-6", user_id: userId, title: "Add global error boundary + structured logging",
      detail: "Unhandled rejections crash the worker. Wrap handlers and pipe to pino.",
      priority: "high", category: "reliability", status: "completed",
      project_id: helix.id, source_report_id: "demo-rep-doctor-1", created_at: daysAgo(20) },
    { id: "demo-task-7", user_id: userId, title: "Ship GitHub App auth + webhook ingestion",
      detail: "Week 1 deliverable. OAuth flow + signed webhook verification + job queue.",
      priority: "high", category: "development", status: "completed",
      project_id: helix.id, source_report_id: "demo-rep-mvp", created_at: daysAgo(10) },
    { id: "demo-task-8", user_id: userId, title: "Per-repo convention extraction",
      detail: "Learn each team's lint config and naming patterns to ground review comments.",
      priority: "medium", category: "development", status: "in_progress",
      project_id: helix.id, source_report_id: "demo-rep-mvp", created_at: daysAgo(7) },
    { id: "demo-task-9", user_id: userId, title: "Validate differentiation vs CodeRabbit",
      detail: "Idea Checker flagged a crowded field. Document the one wedge competitors can't copy fast.",
      priority: "medium", category: "strategy", status: "todo",
      project_id: helix.id, source_report_id: "demo-rep-idea", created_at: daysAgo(33) },
    { id: "demo-task-10", user_id: userId, title: "Draft Slack blocker-alert message format",
      detail: "Notify the team channel when AI flags a launch-blocking regression in a PR.",
      priority: "low", category: "development", status: "todo",
      project_id: helix.id, source_report_id: "demo-rep-mvp", created_at: daysAgo(6) },
  ];
  store.tasks.push(...tasks);

  const signals: ProofSignal[] = [
    { id: "demo-sig-1", user_id: userId, label: "12 design partners signed LOIs", kind: "demand",
      value: 12, weight: 3, source: "Outbound to eng leaders", evidence: "Signed letters of intent from Series A–B teams",
      project_id: helix.id, created_at: daysAgo(26) },
    { id: "demo-sig-2", user_id: userId, label: "Waitlist at 480 developers", kind: "interest",
      value: 480, weight: 2, source: "Launch landing page", evidence: "Organic + Show HN traffic",
      project_id: helix.id, created_at: daysAgo(22) },
    { id: "demo-sig-3", user_id: userId, label: "$20/seat validated as price ceiling", kind: "pricing",
      value: 20, weight: 2, source: "Market Swarm simulation", evidence: "Resistance spikes above $35/seat",
      project_id: helix.id, created_at: daysAgo(24) },
    { id: "demo-sig-4", user_id: userId, label: "Zero retention data", kind: "risk",
      value: 0, weight: 3, source: "Proof Engine", evidence: "No live usage cohorts yet — biggest evidence gap",
      project_id: helix.id, created_at: daysAgo(18) },
    { id: "demo-sig-5", user_id: userId, label: "3 competitors raised in last 6 months", kind: "risk",
      value: 3, weight: 2, source: "Market scan", evidence: "Well-funded incumbents moving fast",
      project_id: helix.id, created_at: daysAgo(30) },
  ];
  store.proofSignals.push(...signals);

  const blockers: Blocker[] = [
    { id: "demo-blk-1", user_id: userId, project_id: helix.id, scan_id: null,
      title: "Auth endpoints have no rate limiting", severity: "P0", category: "security",
      evidence: "src/routes/auth.ts — login & signup accept unlimited requests per IP",
      why_it_matters: "Enables credential stuffing and brute-force attacks; blocks public launch.",
      recommended_fix: "Add a sliding-window limiter (10 req/min/IP) middleware on auth routes.",
      acceptance_criteria: "Login route returns 429 after 10 attempts/min from one IP; covered by an integration test.",
      status: "in_progress", linked_task_id: "demo-task-1", created_at: daysAgo(2), updated_at: daysAgo(1) },
    { id: "demo-blk-2", user_id: userId, project_id: helix.id, scan_id: null,
      title: "Review pipeline lacks end-to-end tests", severity: "P1", category: "testing",
      evidence: "No test exercises webhook → review → comment path.",
      why_it_matters: "Regressions in the core loop ship undetected.",
      recommended_fix: "Add an integration test that posts a fixture PR and asserts an inline comment.",
      acceptance_criteria: "CI runs an e2e test covering the full review path on every PR.",
      status: "open", linked_task_id: "demo-task-2", created_at: daysAgo(2), updated_at: daysAgo(2) },
    { id: "demo-blk-3", user_id: userId, project_id: helix.id, scan_id: null,
      title: "AI review comments are too noisy", severity: "P2", category: "quality",
      evidence: "Design partners muted the bot in 2 of 3 repos.",
      why_it_matters: "Noise erodes trust and drives churn during pilots.",
      recommended_fix: "Add a confidence threshold and per-repo suppression list.",
      acceptance_criteria: "False-positive rate under 10% on partner repos; no repo mutes the bot.",
      status: "open", linked_task_id: "demo-task-4", created_at: daysAgo(9), updated_at: daysAgo(9) },
  ];
  store.blockers.push(...blockers);

  store.scanSnapshots.push(
    { id: "demo-snap-1", user_id: userId, project_id: helix.id, report_id: "demo-rep-doctor-1",
      score: 34, blockers: [{ id: "b1", status: "open" }, { id: "b2", status: "open" }, { id: "b3", status: "open" }],
      static_signals: { files: 312, secrets_found: 1 }, generated_tasks: [], evidence_index: [],
      summary: "Baseline scan — 3 critical blockers.", created_at: daysAgo(30) },
    { id: "demo-snap-2", user_id: userId, project_id: helix.id, report_id: "demo-rep-doctor-2",
      score: 58, blockers: [{ id: "b3", status: "open" }],
      static_signals: { files: 341, secrets_found: 0 }, generated_tasks: [], evidence_index: [],
      summary: "Secrets + error handling resolved.", created_at: daysAgo(16) },
    { id: "demo-snap-3", user_id: userId, project_id: helix.id, report_id: "demo-rep-doctor-3",
      score: 72, blockers: [{ id: "b3", status: "in_progress" }],
      static_signals: { files: 358, secrets_found: 0 }, generated_tasks: [], evidence_index: [],
      summary: "One blocker left: rate limiting.", created_at: daysAgo(2) },
  );

  store.scans.push({
    id: "demo-scan-1", user_id: userId, file_name: "helix-app-main.zip",
    summary: "358 files · React + Fastify + Postgres · 1 blocker remaining",
    payload: { files_analyzed: 358, frameworks: ["React", "Fastify", "Postgres"] },
    project_id: helix.id, created_at: daysAgo(2),
  });
}

export const demoStore = new DemoStore();
