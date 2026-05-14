import { useEffect, useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { Panel, Badge, EmptyState, NoctraButton, ProgressBar, ScoreRing } from "@/components/Primitives";
import { ReportRenderer } from "@/components/reports/ReportRenderer";
import {
  getProject, getReports, getTasks, getProofSignals,
  updateProject, deleteProject, updateTaskStatus, createProofSignal,
  getReport, linkReportToProject,
} from "@/lib/repository";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import { computeProjectState } from "@/lib/project-state";
import type { ProjectState } from "@/lib/project-state";
import { buildTimeline, formatTimeAgo, TIMELINE_TYPE_COLOR } from "@/lib/timeline";
import { extractRisks, RISK_SEV_COLOR } from "@/lib/risk-radar";
import { generateProjectBrief, generateDevAgentPrompt } from "@/lib/brief-generator";
import { computeScoreHistory, getDeltaLabel, getDeltaColor } from "@/lib/score-history";
import { generateTasksFromReport } from "@/lib/task-generator";
import { generateSprintFromTasks } from "@/lib/sprint";
import { downloadMarkdown } from "@/lib/export";
import { analyzeCodebaseAlignment } from "@/lib/codebase-alignment";
import type { ReportSummary } from "@/lib/intelligence";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Trash2, Edit2, FileText, CheckSquare, Loader2, Calendar,
  FolderOpen, Rocket, AlertTriangle, Save, X, FlaskConical, Brain,
  ArrowRight, ShieldAlert, TrendingUp, Plus, RefreshCw, Circle, CheckCircle2,
  History, Copy, Check, Download, Terminal, Clock, Award, Star,
  Zap, Activity,
} from "lucide-react";

type Project = {
  id: string; name: string; idea?: string | null;
  stage?: string | null; status?: string | null; created_at: string;
};
type Report = {
  id: string; tool: string; title: string;
  score?: number | null; summary?: string | null; payload: unknown; created_at: string;
  project_id?: string | null;
};
type Task = {
  id: string; title: string; status: string; priority: string;
  category?: string | null; source_report_id?: string | null;
};
type ProofSignal = {
  id: string; label: string; kind: string; value?: number | null;
  source?: string | null; evidence?: string | null; created_at: string;
};

const STAGES = ["idea", "validation", "building", "launched", "paused"];
const STAGE_COLORS: Record<string, string> = {
  idea: "var(--noctra-violet)", validation: "var(--noctra-amber)",
  building: "var(--noctra-cyan)", launched: "var(--noctra-emerald)", paused: "var(--noctra-text-muted)",
};
const PRIORITY_COLOR: Record<string, string> = {
  high: "var(--noctra-rose)", medium: "var(--noctra-amber)", low: "var(--noctra-emerald)",
  critical: "var(--noctra-rose)",
};
const STATUS_COLOR: Record<string, string> = {
  todo: "var(--noctra-text-muted)", "in-progress": "var(--noctra-cyan)",
  completed: "var(--noctra-emerald)", blocked: "var(--noctra-rose)",
};
const INTELLIGENCE_TOOLS = ["idea", "reality", "proof", "swarm", "mvp", "doctor", "launch"] as const;
const SCORE_COLOR = (s: number) =>
  s >= 70 ? "var(--noctra-emerald)" : s >= 50 ? "var(--noctra-amber)" : "var(--noctra-rose)";

type Tab = "overview" | "reports" | "execution" | "proof" | "doctor" | "twin" | "launch" | "history";

// ─── Passport stamps ──────────────────────────────────────────────────────────

const PASSPORT_STAMPS = [
  { key: "first-idea", label: "Idea Validated", description: "Ran Idea Checker", icon: Star, condition: (ps: ProjectState) => ps.ideaScore > 0, color: "var(--noctra-violet)", href: "/app/idea" },
  { key: "idea-strong", label: "Strong Signal", description: "Idea scored 70+", icon: Zap, condition: (ps: ProjectState) => ps.ideaScore >= 70, color: "var(--noctra-violet)", href: "/app/idea" },
  { key: "reality-check", label: "Reality Checked", description: "Ran Reality Compiler", icon: Activity, condition: (ps: ProjectState) => ps.realityScore > 0, color: "var(--noctra-amber)", href: "/app/reality" },
  { key: "proof-started", label: "Proof Started", description: "First proof signal logged", icon: FlaskConical, condition: (ps: ProjectState) => ps.proofSignalCount > 0, color: "var(--noctra-emerald)", href: "/app/proof" },
  { key: "proof-strong", label: "Proof Validated", description: "Proof score 70+", icon: CheckSquare, condition: (ps: ProjectState) => ps.proofScore >= 70, color: "var(--noctra-emerald)", href: "/app/proof" },
  { key: "swarm-run", label: "Market Simulated", description: "Ran Market Swarm", icon: Brain, condition: (ps: ProjectState) => ps.swarmScore > 0, color: "var(--noctra-cyan)", href: "/app/swarm" },
  { key: "mvp-planned", label: "MVP Planned", description: "Ran MVP Planner", icon: FileText, condition: (ps: ProjectState) => ps.mvpScore > 0, color: "var(--noctra-cyan)", href: "/app/mvp" },
  { key: "tasks-created", label: "Tasks Created", description: "Built an execution task queue", icon: CheckSquare, condition: (ps: ProjectState) => ps.totalTasks >= 3, color: "var(--noctra-emerald)", href: "/app/tasks" },
  { key: "tasks-progress", label: "Building", description: "Completed 3+ tasks", icon: TrendingUp, condition: (ps: ProjectState) => ps.completedTasks >= 3, color: "var(--noctra-emerald)", href: "/app/tasks" },
  { key: "code-scanned", label: "Code Scanned", description: "Ran Project Doctor scan", icon: FileText, condition: (ps: ProjectState) => ps.doctorScore > 0, color: "var(--noctra-rose)", href: "/app/doctor" },
  { key: "doctor-clear", label: "Gates Cleared", description: "Doctor score 65+", icon: Award, condition: (ps: ProjectState) => ps.doctorScore >= 65, color: "var(--noctra-emerald)", href: "/app/doctor" },
  { key: "launch-ready", label: "Launch Ready", description: "Generated Launch Plan", icon: Rocket, condition: (ps: ProjectState) => ps.launchScore > 0, color: "var(--noctra-amber)", href: "/app/launch" },
  { key: "full-intel", label: "Full Intelligence", description: "All 7 tools completed", icon: Star, condition: (ps: ProjectState) => ps.coveredTools.length >= 7, color: "var(--noctra-magenta)", href: "/app/idea" },
];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [proofSignals, setProofSignals] = useState<ProofSignal[]>([]);
  const [projectState, setProjectState] = useState<ProjectState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editIdea, setEditIdea] = useState("");
  const [editStage, setEditStage] = useState("idea");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const [taskFilter, setTaskFilter] = useState<"all" | "todo" | "in-progress" | "completed">("all");
  const [generatingSprint, setGeneratingSprint] = useState(false);
  const [generatingTasks, setGeneratingTasks] = useState<string | null>(null);

  const [briefCopied, setBriefCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);

  const [addingSignal, setAddingSignal] = useState(false);
  const [signalLabel, setSignalLabel] = useState("");
  const [signalKind, setSignalKind] = useState("qualitative");
  const [signalSource, setSignalSource] = useState("");
  const [signalEvidence, setSignalEvidence] = useState("");
  const [savingSignal, setSavingSignal] = useState(false);

  const [linkReportId, setLinkReportId] = useState("");
  const [linkingReport, setLinkingReport] = useState(false);

  function recomputeState(proj: Project, reps: Report[], tsks: Task[], signals: ProofSignal[]) {
    setProjectState(computeProjectState({ reports: reps, tasks: tsks, proofSignals: signals, projects: [], currentProject: proj }));
  }

  useEffect(() => {
    if (!id) return;
    Promise.all([getProject(id), getReports(undefined, id), getTasks(id), getProofSignals(id)])
      .then(([proj, reps, tsks, signals]) => {
        const p = proj as Project;
        const r = (reps as Report[]) ?? [];
        const t = (tsks as Task[]) ?? [];
        const s = (signals as ProofSignal[]) ?? [];
        setProject(p); setReports(r); setTasks(t); setProofSignals(s);
        setEditName(p.name); setEditIdea(p.idea ?? ""); setEditStage(p.stage ?? "idea");
        recomputeState(p, r, t, s);
      })
      .catch((e) => setError(e?.message ?? "Failed to load project"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    if (!project) return;
    setSaving(true);
    try {
      const updated = await updateProject(project.id, { name: editName, idea: editIdea, stage: editStage });
      const p = updated as Project;
      setProject(p); setEditing(false);
      recomputeState(p, reports, tasks, proofSignals);
    } catch (err) {
      toast({ title: "Failed to save project", description: err instanceof Error ? err.message : "Unexpected error.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!project) return;
    setDeleting(true);
    try {
      await deleteProject(project.id);
      navigate("/app/projects");
    } catch (err) {
      setDeleting(false);
      toast({ title: "Failed to delete project", description: err instanceof Error ? err.message : "Unexpected error.", variant: "destructive" });
    }
  }

  async function handleTaskToggle(task: Task) {
    const next = task.status === "completed" ? "todo" : "completed";
    const updatedTasks = tasks.map((t) => t.id === task.id ? { ...t, status: next } : t);
    setTasks(updatedTasks);
    try {
      await updateTaskStatus(task.id, next);
      if (project) recomputeState(project, reports, updatedTasks, proofSignals);
    } catch (err) {
      setTasks(tasks);
      toast({ title: "Failed to update task", description: err instanceof Error ? err.message : "Unexpected error.", variant: "destructive" });
    }
  }

  async function handleAddSignal() {
    if (!project || !signalLabel.trim()) return;
    setSavingSignal(true);
    try {
      const s = await createProofSignal({ label: signalLabel.trim(), kind: signalKind, source: signalSource.trim() || undefined, evidence: signalEvidence.trim() || undefined, projectId: project.id });
      const updated = [...proofSignals, s as ProofSignal];
      setProofSignals(updated); setSignalLabel(""); setSignalSource(""); setSignalEvidence(""); setAddingSignal(false);
      recomputeState(project, reports, tasks, updated);
    } catch (err) {
      toast({ title: "Failed to add proof signal", description: err instanceof Error ? err.message : "Unexpected error.", variant: "destructive" });
    } finally {
      setSavingSignal(false);
    }
  }

  async function handleGenerateSprint() {
    const openTasks = tasks.filter((t) => t.status !== "completed");
    if (openTasks.length === 0) {
      toast({ title: "No open tasks", description: "All tasks completed. Generate more first.", variant: "destructive" });
      return;
    }
    setGeneratingSprint(true);
    try {
      const sprint = generateSprintFromTasks(
        openTasks.map((t) => ({ id: t.id, title: t.title, priority: (t.priority as "high" | "medium" | "low") || "medium", category: t.category ?? "general", created_at: new Date().toISOString() })),
        { title: `${project?.name ?? "Project"} Sprint`, duration: 14 }
      );
      const lines = [`# ${sprint.title}`, "", `**Duration:** ${sprint.duration} days`, ""];
      sprint.days.forEach((d) => { lines.push(`## ${d.day}: ${d.goal}`); d.tasks.forEach((t) => lines.push(`- [ ] ${t}`)); lines.push(""); });
      if (sprint.risks.length > 0) { lines.push("## Risks"); sprint.risks.forEach((r) => lines.push(`- ${r}`)); lines.push(""); }
      if (sprint.demo_checklist.length > 0) { lines.push("## Demo Checklist"); sprint.demo_checklist.forEach((c) => lines.push(`- [ ] ${c}`)); }
      downloadMarkdown(`${(project?.name ?? "project").replace(/\s+/g, "-").toLowerCase()}-sprint`, lines.join("\n"));
      toast({ title: "Sprint downloaded", description: `${sprint.days.length}-day sprint plan exported.` });
    } catch (err) {
      toast({ title: "Failed to generate sprint", description: err instanceof Error ? err.message : "Unexpected error.", variant: "destructive" });
    } finally {
      setGeneratingSprint(false);
    }
  }

  async function handleGenerateTasksFromReport(report: Report) {
    setGeneratingTasks(report.id);
    try {
      const count = await generateTasksFromReport({ id: report.id, tool: report.tool, payload: report.payload, project_id: project?.id });
      if (count > 0) {
        const newTasks = await getTasks(project?.id);
        const t = (newTasks as Task[]) ?? [];
        setTasks(t);
        if (project) recomputeState(project, reports, t, proofSignals);
        toast({ title: `${count} task${count !== 1 ? "s" : ""} created`, description: "Added to your project task queue." });
      } else {
        toast({ title: "No tasks generated", description: "Not enough structured data in this report.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Failed to generate tasks", description: err instanceof Error ? err.message : "Unexpected error.", variant: "destructive" });
    } finally {
      setGeneratingTasks(null);
    }
  }

  async function handleLinkReportById() {
    if (!project || !linkReportId.trim()) return;
    setLinkingReport(true);
    try {
      const rep = await getReport(linkReportId.trim()) as Report;
      await linkReportToProject(rep.id, project.id);
      const updatedReports = (await getReports(undefined, project.id)) as Report[];
      setReports(updatedReports ?? []);
      recomputeState(project, updatedReports ?? [], tasks, proofSignals);
      setLinkReportId("");
      toast({ title: "Report linked", description: `"${rep.title}" is now linked to this project.` });
    } catch (err) {
      toast({ title: "Failed to link report", description: err instanceof Error ? err.message : "Check the report ID and try again.", variant: "destructive" });
    } finally {
      setLinkingReport(false);
    }
  }

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const filteredTasks = taskFilter === "all" ? tasks : tasks.filter((t) => t.status === taskFilter);
  const launchReports = reports.filter((r) => r.tool === "launch");
  const latestLaunchReport = launchReports[0] ?? null;
  const doctorReports = reports.filter((r) => r.tool === "doctor").sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const latestDoctorReport = doctorReports[0] ?? null;
  const stageColor = STAGE_COLORS[project?.stage ?? "idea"] ?? "var(--noctra-text-muted)";

  const timeline = useMemo(() => buildTimeline({ reports, proofSignals, project: project ?? undefined, limit: 20 }), [reports, proofSignals, project]);
  const risks = useMemo(() => extractRisks({ reports, tasks, projectId: project?.id }), [reports, tasks, project]);
  const scoreHistory = useMemo(() => computeScoreHistory(reports), [reports]);
  const alignment = useMemo(() => analyzeCodebaseAlignment({ reports: reports as unknown as ReportSummary[], tasks }), [reports, tasks]);
  const mvpReport = reports.find((r) => r.tool === "mvp");

  function copyBrief() {
    if (!project || !projectState) return;
    const md = generateProjectBrief({ project, state: projectState, tasks, reports, proofSignalCount: proofSignals.length });
    navigator.clipboard.writeText(md).catch(() => {});
    setBriefCopied(true); setTimeout(() => setBriefCopied(false), 2500);
  }

  function downloadBrief() {
    if (!project || !projectState) return;
    const md = generateProjectBrief({ project, state: projectState, tasks, reports, proofSignalCount: proofSignals.length });
    const blob = new Blob([md], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${project.name.replace(/\s+/g, "-").toLowerCase()}-brief.md`;
    a.click();
  }

  function copyPrompt() {
    if (!project || !projectState) return;
    const md = generateDevAgentPrompt({ project, state: projectState, tasks, doctorPayload: latestDoctorReport?.payload, mvpPayload: mvpReport?.payload });
    navigator.clipboard.writeText(md).catch(() => {});
    setPromptCopied(true); setTimeout(() => setPromptCopied(false), 2500);
  }

  if (loading) return (
    <AppShell>
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--noctra-cyan)" }} />
      </div>
    </AppShell>
  );

  if (error || !project) return (
    <AppShell>
      <div className="p-6 max-w-4xl mx-auto">
        <EmptyState icon={<AlertTriangle size={24} />} title="Project not found" body={error || "This project does not exist."} />
        <div className="flex justify-center mt-4">
          <NoctraButton variant="ghost" onClick={() => navigate("/app/projects")}><ArrowLeft size={14} /> Back to Projects</NoctraButton>
        </div>
      </div>
    </AppShell>
  );

  const earnedStamps = projectState ? PASSPORT_STAMPS.filter((s) => s.condition(projectState)) : [];

  const openScanGates: string[] = [];
  if (latestDoctorReport?.payload) {
    const p = latestDoctorReport.payload as Record<string, unknown>;
    const gates = (p.gates ?? p.launch_gates ?? p.checks) as unknown[] | null;
    if (Array.isArray(gates)) {
      gates.forEach((g: unknown) => {
        const go = g as Record<string, unknown>;
        const status = String(go.status ?? go.result ?? "").toLowerCase();
        if (status === "fail" || status === "red") openScanGates.push(String(go.name ?? go.check ?? go.gate ?? "Unknown gate"));
      });
    }
  }

  const TABS: Array<{ key: Tab; label: string; count?: number }> = [
    { key: "overview", label: "Overview" },
    { key: "reports", label: "Reports", count: reports.length },
    { key: "execution", label: "Execution", count: tasks.filter((t) => t.status !== "completed").length },
    { key: "proof", label: "Proof", count: proofSignals.length },
    { key: "doctor", label: "Project Doctor", count: doctorReports.length },
    { key: "twin", label: "Product Twin" },
    { key: "launch", label: "Launch", count: launchReports.length },
    { key: "history", label: "History", count: timeline.length },
  ];

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button onClick={() => navigate("/app/projects")} className="flex items-center gap-1.5 text-sm hover:opacity-80" style={{ color: "var(--noctra-text-muted)" }}>
            <ArrowLeft size={14} /> All Projects
          </button>
          <div className="flex items-center gap-2">
            {editing ? null : <NoctraButton variant="ghost" onClick={() => setEditing(true)}><Edit2 size={13} /> Edit</NoctraButton>}
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--noctra-rose)" }}>Delete project?</span>
                <NoctraButton variant="ghost" onClick={handleDelete} disabled={deleting}>{deleting ? <Loader2 size={12} className="animate-spin" /> : "Yes, delete"}</NoctraButton>
                <NoctraButton variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</NoctraButton>
              </div>
            ) : (
              <NoctraButton variant="ghost" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={13} style={{ color: "var(--noctra-rose)" }} />
                <span style={{ color: "var(--noctra-rose)" }}>Delete</span>
              </NoctraButton>
            )}
          </div>
        </div>

        {/* Header */}
        {editing ? (
          <Panel>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--noctra-text-muted)" }}>Project Name</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--noctra-text-muted)" }}>Core Idea</label>
                <textarea value={editIdea} onChange={(e) => setEditIdea(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg text-sm resize-none outline-none" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--noctra-text-muted)" }}>Stage</label>
                <div className="flex gap-2 flex-wrap">
                  {STAGES.map((s) => (
                    <button key={s} onClick={() => setEditStage(s)} className="px-3 py-1 rounded-full text-xs font-medium capitalize" style={{ background: editStage === s ? `${STAGE_COLORS[s]}20` : "var(--noctra-surface2)", border: `1px solid ${editStage === s ? STAGE_COLORS[s] : "var(--noctra-border)"}`, color: editStage === s ? STAGE_COLORS[s] : "var(--noctra-text-muted)" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <NoctraButton onClick={handleSave} disabled={saving}>{saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save</NoctraButton>
                <NoctraButton variant="ghost" onClick={() => setEditing(false)}><X size={12} /> Cancel</NoctraButton>
              </div>
            </div>
          </Panel>
        ) : (
          <Panel>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${stageColor}18`, border: `1px solid ${stageColor}30` }}>
                <FolderOpen size={18} style={{ color: stageColor }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge style={{ background: `${stageColor}18`, color: stageColor }}>{project.stage ?? "idea"}</Badge>
                  {project.status ? <Badge>{project.status}</Badge> : null}
                  {projectState ? (
                    <Badge style={{ background: projectState.readiness >= 70 ? "rgba(52,211,153,0.1)" : projectState.readiness >= 40 ? "rgba(245,158,11,0.1)" : "rgba(244,63,94,0.1)", color: projectState.readiness >= 70 ? "var(--noctra-emerald)" : projectState.readiness >= 40 ? "var(--noctra-amber)" : "var(--noctra-rose)" }}>
                      {projectState.readiness}% ready
                    </Badge>
                  ) : null}
                </div>
                <h1 className="text-xl font-bold" style={{ color: "var(--noctra-text)" }}>{project.name}</h1>
                {project.idea ? <p className="text-sm mt-1" style={{ color: "var(--noctra-text-muted)" }}>{project.idea}</p> : null}
                <p className="text-xs mt-2 flex items-center gap-1" style={{ color: "var(--noctra-text-muted)" }}>
                  <Calendar size={11} /> Created {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-4 text-center shrink-0">
                {[
                  { label: "Reports", value: reports.length, color: "var(--noctra-violet)" },
                  { label: "Tasks", value: tasks.length, color: "var(--noctra-emerald)" },
                  { label: "Done", value: completedTasks, color: "var(--noctra-cyan)" },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <p className="text-lg font-bold" style={{ color }}>{value}</p>
                    <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: "var(--noctra-surface)" }}>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key); setSelectedReport(null); }} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all" style={{ background: tab === t.key ? "var(--noctra-surface2)" : "transparent", color: tab === t.key ? "var(--noctra-text)" : "var(--noctra-text-muted)", border: tab === t.key ? "1px solid var(--noctra-border)" : "1px solid transparent", whiteSpace: "nowrap" }}>
              {t.label}
              {t.count != null && t.count > 0 ? <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "var(--noctra-surface)", color: "var(--noctra-text-muted)" }}>{t.count}</span> : null}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {tab === "overview" ? (
          <div className="space-y-4">
            {projectState ? (
              <div className="flex items-center justify-between gap-4 px-4 py-4 rounded-xl" style={{ background: "rgba(61,216,255,0.06)", border: "1px solid rgba(61,216,255,0.2)" }}>
                <div className="flex items-start gap-3 min-w-0">
                  <ArrowRight size={16} style={{ color: "var(--noctra-cyan)", flexShrink: 0, marginTop: 2 }} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--noctra-text)" }}>{projectState.nextAction.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{projectState.nextAction.reason}</p>
                  </div>
                </div>
                <button onClick={() => navigate(projectState.nextAction.href)} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "var(--noctra-cyan)", color: "#000" }}>
                  Go <ArrowRight size={11} />
                </button>
              </div>
            ) : null}

            {projectState?.topBlocker ? (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.2)" }}>
                <ShieldAlert size={14} style={{ color: "var(--noctra-rose)", flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--noctra-rose)" }}>Top Blocker</p>
                  <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{projectState.topBlocker}</p>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Reports", value: reports.length, icon: FileText, color: "var(--noctra-violet)", onClick: () => setTab("reports") },
                { label: "Tasks", value: tasks.length, icon: CheckSquare, color: "var(--noctra-emerald)", onClick: () => setTab("execution") },
                { label: "Proof Signals", value: proofSignals.length, icon: FlaskConical, color: "var(--noctra-emerald)", onClick: () => setTab("proof") },
              ].map(({ label, value, icon: Icon, color, onClick }) => (
                <Panel key={label}>
                  <button className="w-full text-left" onClick={onClick}>
                    <div className="flex items-center gap-2 mb-2"><Icon size={13} style={{ color }} /><span className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{label}</span></div>
                    <p className="text-2xl font-bold" style={{ color }}>{value}</p>
                  </button>
                </Panel>
              ))}
            </div>

            {projectState ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Panel>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium" style={{ color: "var(--noctra-text-muted)" }}>Launch Readiness</p>
                    <span className="text-xs font-mono" style={{ color: projectState.readiness >= 70 ? "var(--noctra-emerald)" : projectState.readiness >= 40 ? "var(--noctra-amber)" : "var(--noctra-rose)" }}>{projectState.readiness}%</span>
                  </div>
                  <ProgressBar value={projectState.readiness} color={projectState.readiness >= 70 ? "var(--noctra-emerald)" : projectState.readiness >= 40 ? "var(--noctra-amber)" : "var(--noctra-rose)"} />
                  <p className="text-xs mt-1.5 capitalize" style={{ color: "var(--noctra-text-muted)" }}>Phase: {projectState.phase.replace("-", " ")}</p>
                </Panel>
                {tasks.length > 0 ? (
                  <Panel>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium" style={{ color: "var(--noctra-text-muted)" }}>Task Completion</p>
                      <span className="text-xs font-mono" style={{ color: "var(--noctra-emerald)" }}>{projectState.taskCompletionRate}%</span>
                    </div>
                    <ProgressBar value={projectState.completedTasks} max={tasks.length} color="var(--noctra-emerald)" />
                    <p className="text-xs mt-1.5" style={{ color: "var(--noctra-text-muted)" }}>{projectState.completedTasks}/{tasks.length} completed</p>
                  </Panel>
                ) : null}
              </div>
            ) : null}

            {projectState && projectState.coveredTools.length > 0 ? (
              <Panel>
                <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--noctra-text-muted)" }}>Intelligence Scores</p>
                <div className="flex flex-wrap gap-5 justify-center">
                  {INTELLIGENCE_TOOLS.filter((k) => projectState.latestReportByTool[k]).map((key) => {
                    const t = TOOL_BY_KEY[key as keyof typeof TOOL_BY_KEY];
                    const rep = projectState.latestReportByTool[key];
                    if (!t || !rep) return null;
                    return (
                      <button key={key} className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity" onClick={() => navigate(`/app/reports/${rep.id}`)}>
                        <ScoreRing value={rep.score ?? 0} size={64} stroke={5} label={t.short} color={t.accent} />
                      </button>
                    );
                  })}
                </div>
                {projectState.missingTools.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t" style={{ borderColor: "var(--noctra-border)" }}>
                    <span className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>Not run:</span>
                    {projectState.missingTools.map((key) => {
                      const t = TOOL_BY_KEY[key as keyof typeof TOOL_BY_KEY];
                      if (!t) return null;
                      return <button key={key} onClick={() => navigate(t.route)} className="text-xs px-2 py-0.5 rounded-full hover:opacity-80" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-muted)" }}>{t.label}</button>;
                    })}
                  </div>
                ) : null}
              </Panel>
            ) : null}

            {projectState && projectState.failedGates.length > 0 ? (
              <Panel>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={13} style={{ color: "var(--noctra-rose)" }} />
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-rose)" }}>Failed Gates ({projectState.failedGates.length})</p>
                </div>
                <div className="space-y-1">
                  {projectState.failedGates.map((g, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg" style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.15)" }}>
                      <span style={{ color: "var(--noctra-rose)" }}>✗</span>
                      <span style={{ color: "var(--noctra-text-muted)" }}>{g}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate("/app/doctor")} className="flex items-center gap-1.5 mt-3 text-xs" style={{ color: "var(--noctra-rose)" }}>
                  <RefreshCw size={11} /> Re-scan with Project Doctor
                </button>
              </Panel>
            ) : null}

            {risks.length > 0 ? (
              <Panel>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert size={13} style={{ color: "var(--noctra-amber)" }} />
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-amber)" }}>Risk Radar</p>
                  <span className="ml-auto text-xs font-mono" style={{ color: "var(--noctra-text-muted)" }}>{risks.length} risk{risks.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="space-y-2">
                  {risks.slice(0, 5).map((risk) => (
                    <div key={risk.id} className="flex items-start gap-3 px-3 py-2 rounded-lg" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: RISK_SEV_COLOR[risk.severity] }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium" style={{ color: "var(--noctra-text)" }}>{risk.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{risk.recommendedFix}</p>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium uppercase" style={{ background: `${RISK_SEV_COLOR[risk.severity]}15`, color: RISK_SEV_COLOR[risk.severity] }}>{risk.severity}</span>
                    </div>
                  ))}
                  {risks.length > 5 ? <button onClick={() => setTab("history")} className="text-xs mt-1" style={{ color: "var(--noctra-text-muted)" }}>+{risks.length - 5} more → view in History tab</button> : null}
                </div>
              </Panel>
            ) : null}

            {projectState ? (
              <Panel>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--noctra-text-muted)" }}>Export & Handoff</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button onClick={copyBrief} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium text-left" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: briefCopied ? "var(--noctra-emerald)" : "var(--noctra-text)" }}>
                    {briefCopied ? <Check size={12} style={{ color: "var(--noctra-emerald)" }} /> : <Copy size={12} />}
                    <div><p>{briefCopied ? "Copied!" : "Copy Project Brief"}</p><p style={{ color: "var(--noctra-text-muted)" }}>Markdown status report</p></div>
                  </button>
                  <button onClick={downloadBrief} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium text-left" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }}>
                    <Download size={12} />
                    <div><p>Download Brief</p><p style={{ color: "var(--noctra-text-muted)" }}>Save as .md file</p></div>
                  </button>
                  <button onClick={copyPrompt} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium text-left sm:col-span-2" style={{ background: promptCopied ? "rgba(61,216,255,0.08)" : "var(--noctra-surface2)", border: `1px solid ${promptCopied ? "rgba(61,216,255,0.25)" : "var(--noctra-border)"}`, color: promptCopied ? "var(--noctra-cyan)" : "var(--noctra-text)" }}>
                    {promptCopied ? <Check size={12} style={{ color: "var(--noctra-cyan)" }} /> : <Terminal size={12} />}
                    <div><p>{promptCopied ? "Prompt copied!" : "Copy Dev Agent Prompt"}</p><p style={{ color: "var(--noctra-text-muted)" }}>Paste into Replit Agent, Cursor, or Windsurf</p></div>
                  </button>
                </div>
              </Panel>
            ) : null}

            <Panel>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--noctra-text-muted)" }}>Run Intelligence Tool</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: "Idea Checker", href: "/app/idea", color: "var(--noctra-violet)" },
                  { label: "Reality Compiler", href: "/app/reality", color: "var(--noctra-amber)" },
                  { label: "Proof Engine", href: "/app/proof", color: "var(--noctra-emerald)" },
                  { label: "MVP Planner", href: "/app/mvp", color: "var(--noctra-cyan)" },
                  { label: "Project Doctor", href: "/app/doctor", color: "var(--noctra-rose)" },
                  { label: "Launch Room", href: "/app/launch", color: "var(--noctra-amber)" },
                ].map(({ label, href, color }) => (
                  <button key={href} onClick={() => navigate(href)} className="px-3 py-2 rounded-lg text-xs font-medium text-left hover:opacity-80" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color }}>{label}</button>
                ))}
              </div>
            </Panel>

            {earnedStamps.length > 0 ? (
              <Panel>
                <div className="flex items-center gap-2 mb-3">
                  <Award size={13} style={{ color: "var(--noctra-violet)" }} />
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Passport Stamps</p>
                  <span className="ml-auto text-xs font-mono" style={{ color: "var(--noctra-text-muted)" }}>{earnedStamps.length}/{PASSPORT_STAMPS.length}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {earnedStamps.map((stamp) => (
                    <div key={stamp.key} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs" style={{ background: `${stamp.color}15`, border: `1px solid ${stamp.color}30`, color: stamp.color }}>
                      <stamp.icon size={11} />
                      <span>{stamp.label}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            ) : null}
          </div>
        ) : null}

        {/* ── Reports Tab ── */}
        {tab === "reports" ? (
          <div className="space-y-3">
            {selectedReport ? (
              <>
                <div className="flex items-center justify-between">
                  <button onClick={() => setSelectedReport(null)} className="flex items-center gap-1.5 text-sm" style={{ color: "var(--noctra-text-muted)" }}><ArrowLeft size={13} /> All Reports</button>
                  <div className="flex gap-2">
                    <NoctraButton variant="ghost" onClick={() => handleGenerateTasksFromReport(selectedReport)} disabled={generatingTasks === selectedReport.id}>
                      {generatingTasks === selectedReport.id ? <Loader2 size={12} className="animate-spin" /> : <CheckSquare size={12} />} Generate Tasks
                    </NoctraButton>
                    <NoctraButton variant="ghost" onClick={() => navigate(`/app/reports/${selectedReport.id}`)}>Full Report <ArrowRight size={12} /></NoctraButton>
                  </div>
                </div>
                <Panel><ReportRenderer report={selectedReport} /></Panel>
              </>
            ) : (
              <>
                {reports.length === 0 ? (
                  <EmptyState icon={<FileText size={22} />} title="No reports yet" body="Run any AI tool and link it to this project, or paste a report ID below." />
                ) : (
                  INTELLIGENCE_TOOLS.filter((key) => reports.some((r) => r.tool === key)).map((key) => {
                    const toolDef = TOOL_BY_KEY[key as keyof typeof TOOL_BY_KEY];
                    const toolReports = reports.filter((r) => r.tool === key).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                    return (
                      <div key={key} className="space-y-1.5">
                        <p className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: toolDef?.accent ?? "var(--noctra-text-muted)" }}>{toolDef?.label ?? key}</p>
                        {toolReports.map((r, idx) => (
                          <Panel key={r.id} style={{ opacity: idx === 0 ? 1 : 0.7 }}>
                            <div className="flex items-center justify-between gap-3">
                              <button className="flex items-center gap-3 min-w-0 flex-1 text-left" onClick={() => setSelectedReport(r)}>
                                {toolDef ? <toolDef.icon size={13} style={{ color: toolDef.accent }} /> : null}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium truncate" style={{ color: "var(--noctra-text)" }}>{r.title}</p>
                                    {idx === 0 ? <Badge style={{ fontSize: "10px", background: `${toolDef?.accent}18`, color: toolDef?.accent }}>Latest</Badge> : null}
                                  </div>
                                  {r.summary ? <p className="text-xs truncate mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{r.summary}</p> : null}
                                </div>
                              </button>
                              <div className="flex items-center gap-2 shrink-0">
                                {r.score != null ? <span className="text-xs font-bold" style={{ color: SCORE_COLOR(r.score) }}>{r.score}</span> : null}
                                <button onClick={() => handleGenerateTasksFromReport(r)} disabled={generatingTasks === r.id} title="Generate tasks" className="p-1 rounded hover:opacity-70">
                                  {generatingTasks === r.id ? <Loader2 size={12} className="animate-spin" style={{ color: "var(--noctra-cyan)" }} /> : <CheckSquare size={12} style={{ color: "var(--noctra-text-muted)" }} />}
                                </button>
                                <button onClick={() => navigate(`/app/reports/${r.id}`)} title="Open full report" className="p-1 rounded hover:opacity-70">
                                  <ArrowRight size={12} style={{ color: "var(--noctra-text-muted)" }} />
                                </button>
                              </div>
                            </div>
                          </Panel>
                        ))}
                      </div>
                    );
                  })
                )}

                {INTELLIGENCE_TOOLS.filter((key) => !reports.some((r) => r.tool === key)).length > 0 ? (
                  <Panel style={{ opacity: 0.7 }}>
                    <p className="text-xs font-medium mb-2" style={{ color: "var(--noctra-text-muted)" }}>Not yet run</p>
                    <div className="flex flex-wrap gap-1.5">
                      {INTELLIGENCE_TOOLS.filter((key) => !reports.some((r) => r.tool === key)).map((key) => {
                        const t = TOOL_BY_KEY[key as keyof typeof TOOL_BY_KEY];
                        if (!t) return null;
                        return <button key={key} onClick={() => navigate(t.route)} className="text-xs px-2.5 py-1 rounded-full hover:opacity-80" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-muted)" }}>+ {t.label}</button>;
                      })}
                    </div>
                  </Panel>
                ) : null}

                <Panel>
                  <p className="text-xs font-medium mb-2" style={{ color: "var(--noctra-text-muted)" }}>Link existing report by ID</p>
                  <div className="flex gap-2">
                    <input value={linkReportId} onChange={(e) => setLinkReportId(e.target.value)} placeholder="Paste report ID…" className="flex-1 px-3 py-2 rounded-lg text-xs outline-none" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }} />
                    <NoctraButton onClick={handleLinkReportById} disabled={linkingReport || !linkReportId.trim()}>
                      {linkingReport ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Link
                    </NoctraButton>
                  </div>
                </Panel>
              </>
            )}
          </div>
        ) : null}

        {/* ── Execution Tab ── */}
        {tab === "execution" ? (
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <EmptyState icon={<CheckSquare size={22} />} title="No tasks yet" body="Generate tasks from any AI report to start building your sprint queue." />
            ) : (
              <>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--noctra-surface)" }}>
                    {(["all", "todo", "in-progress", "completed"] as const).map((f) => (
                      <button key={f} onClick={() => setTaskFilter(f)} className="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all" style={{ background: taskFilter === f ? "var(--noctra-surface2)" : "transparent", color: taskFilter === f ? "var(--noctra-text)" : "var(--noctra-text-muted)", border: taskFilter === f ? "1px solid var(--noctra-border)" : "1px solid transparent", whiteSpace: "nowrap" }}>
                        {f === "all" ? `All (${tasks.length})` : f === "todo" ? `Todo (${tasks.filter((t) => t.status === "todo").length})` : f === "in-progress" ? `Active (${tasks.filter((t) => t.status === "in-progress").length})` : `Done (${completedTasks})`}
                      </button>
                    ))}
                  </div>
                  <NoctraButton variant="ghost" onClick={handleGenerateSprint} disabled={generatingSprint}>
                    {generatingSprint ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                    {generatingSprint ? "Building…" : "Export Sprint"}
                  </NoctraButton>
                </div>
                <div className="space-y-2">
                  {filteredTasks.length === 0 ? (
                    <p className="text-xs text-center py-4" style={{ color: "var(--noctra-text-muted)" }}>No tasks in this filter.</p>
                  ) : filteredTasks.map((t) => (
                    <Panel key={t.id}>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleTaskToggle(t)} className="shrink-0">
                          {t.status === "completed" ? <CheckCircle2 size={16} style={{ color: "var(--noctra-emerald)" }} /> : <Circle size={16} style={{ color: "var(--noctra-text-muted)" }} />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm" style={{ color: t.status === "completed" ? "var(--noctra-text-muted)" : "var(--noctra-text)", textDecoration: t.status === "completed" ? "line-through" : "none" }}>{t.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {t.category ? <span className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{t.category}</span> : null}
                            {t.source_report_id ? <button onClick={() => navigate(`/app/reports/${t.source_report_id}`)} className="text-xs hover:opacity-80" style={{ color: "var(--noctra-cyan)" }}>from report</button> : null}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-2 h-2 rounded-full" style={{ background: PRIORITY_COLOR[t.priority] ?? "var(--noctra-text-muted)" }} />
                          <Badge style={{ textTransform: "capitalize", fontSize: "10px", color: STATUS_COLOR[t.status] ?? "var(--noctra-text-muted)" }}>{t.status}</Badge>
                        </div>
                      </div>
                    </Panel>
                  ))}
                </div>
                <NoctraButton variant="ghost" onClick={() => navigate("/app/tasks")}><CheckSquare size={13} /> View all tasks <ArrowRight size={11} /></NoctraButton>
              </>
            )}
            {reports.length > 0 ? (
              <Panel>
                <p className="text-xs font-medium mb-2" style={{ color: "var(--noctra-text-muted)" }}>Generate tasks from a report</p>
                <div className="space-y-1.5">
                  {reports.slice(0, 5).map((r) => {
                    const t = TOOL_BY_KEY[r.tool as keyof typeof TOOL_BY_KEY];
                    return (
                      <button key={r.id} onClick={() => handleGenerateTasksFromReport(r)} disabled={generatingTasks === r.id} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:opacity-80 disabled:opacity-50" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                        {t ? <t.icon size={12} style={{ color: t.accent }} /> : null}
                        <span className="text-xs flex-1 text-left truncate" style={{ color: "var(--noctra-text)" }}>{r.title}</span>
                        {generatingTasks === r.id ? <Loader2 size={11} className="animate-spin" style={{ color: "var(--noctra-cyan)" }} /> : <Plus size={11} style={{ color: "var(--noctra-text-muted)" }} />}
                      </button>
                    );
                  })}
                </div>
              </Panel>
            ) : null}
          </div>
        ) : null}

        {/* ── Proof Tab ── */}
        {tab === "proof" ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium" style={{ color: "var(--noctra-text)" }}>Proof Signals <span style={{ color: "var(--noctra-text-muted)", fontWeight: 400 }}>({proofSignals.length})</span></p>
              <NoctraButton variant="ghost" onClick={() => setAddingSignal(!addingSignal)}><Plus size={13} /> Add Signal</NoctraButton>
            </div>
            {addingSignal ? (
              <Panel>
                <p className="text-xs font-semibold mb-3" style={{ color: "var(--noctra-emerald)" }}>New Proof Signal</p>
                <div className="space-y-2">
                  <input value={signalLabel} onChange={(e) => setSignalLabel(e.target.value)} placeholder="What did you validate?" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }} />
                  <div className="flex gap-2">
                    {["qualitative", "quantitative", "behavioral"].map((k) => (
                      <button key={k} onClick={() => setSignalKind(k)} className="px-3 py-1 rounded-full text-xs capitalize" style={{ background: signalKind === k ? "rgba(52,211,153,0.15)" : "var(--noctra-surface2)", border: `1px solid ${signalKind === k ? "var(--noctra-emerald)" : "var(--noctra-border)"}`, color: signalKind === k ? "var(--noctra-emerald)" : "var(--noctra-text-muted)" }}>{k}</button>
                    ))}
                  </div>
                  <input value={signalSource} onChange={(e) => setSignalSource(e.target.value)} placeholder="Source (optional)" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }} />
                  <textarea value={signalEvidence} onChange={(e) => setSignalEvidence(e.target.value)} placeholder="Evidence / notes (optional)" rows={2} className="w-full px-3 py-2 rounded-lg text-sm resize-none outline-none" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }} />
                  <div className="flex gap-2">
                    <NoctraButton onClick={handleAddSignal} disabled={savingSignal || !signalLabel.trim()}>{savingSignal ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Save</NoctraButton>
                    <NoctraButton variant="ghost" onClick={() => setAddingSignal(false)}><X size={12} /> Cancel</NoctraButton>
                  </div>
                </div>
              </Panel>
            ) : null}
            {proofSignals.length === 0 ? (
              <EmptyState icon={<FlaskConical size={22} />} title="No proof signals yet" body="Add validation evidence — user interviews, signups, conversion data, or experiments." />
            ) : (
              <div className="space-y-2">
                {proofSignals.map((s) => (
                  <Panel key={s.id}>
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
                        <FlaskConical size={12} style={{ color: "var(--noctra-emerald)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium" style={{ color: "var(--noctra-text)" }}>{s.label}</p>
                          <Badge style={{ fontSize: "10px", textTransform: "capitalize" }}>{s.kind}</Badge>
                        </div>
                        {s.source ? <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>Source: {s.source}</p> : null}
                        {s.evidence ? <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-soft)" }}>{s.evidence}</p> : null}
                        <p className="text-xs mt-1" style={{ color: "var(--noctra-text-muted)" }}>{new Date(s.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </Panel>
                ))}
              </div>
            )}
            <NoctraButton variant="ghost" onClick={() => navigate("/app/proof")}><FlaskConical size={13} /> Run Proof Engine <ArrowRight size={11} /></NoctraButton>
          </div>
        ) : null}

        {/* ── Doctor Tab ── */}
        {tab === "doctor" ? (
          <div className="space-y-3">
            {doctorReports.length === 0 ? (
              <>
                <EmptyState icon={<FileText size={22} />} title="No scans yet" body="Upload your project ZIP to Project Doctor to scan for launch blockers, code quality issues, and security red flags." />
                <div className="flex justify-center">
                  <NoctraButton onClick={() => navigate("/app/doctor")}><FileText size={13} /> Scan with Project Doctor</NoctraButton>
                </div>
              </>
            ) : (
              <>
                {latestDoctorReport ? (
                  <>
                    <Panel>
                      <div className="flex items-center gap-3 mb-3">
                        <FileText size={14} style={{ color: "var(--noctra-rose)" }} />
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Latest Scan</p>
                        {latestDoctorReport.score != null ? <Badge style={{ marginLeft: "auto", background: `${SCORE_COLOR(latestDoctorReport.score)}18`, color: SCORE_COLOR(latestDoctorReport.score) }}>{latestDoctorReport.score}/100</Badge> : null}
                      </div>
                      <p className="text-sm font-medium mb-1" style={{ color: "var(--noctra-text)" }}>{latestDoctorReport.title}</p>
                      {latestDoctorReport.summary ? <p className="text-xs mb-2" style={{ color: "var(--noctra-text-muted)" }}>{latestDoctorReport.summary}</p> : null}
                      <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{new Date(latestDoctorReport.created_at).toLocaleDateString()}</p>
                    </Panel>

                    {/* Health + Launch Readiness */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {latestDoctorReport.score != null && (
                        <Panel>
                          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-text-muted)" }}>Health Score</p>
                          <p className="text-2xl font-bold" style={{ color: SCORE_COLOR(latestDoctorReport.score) }}>{latestDoctorReport.score}/100</p>
                        </Panel>
                      )}
                      {(() => {
                        const p = latestDoctorReport.payload as Record<string, unknown>;
                        const data = ((p?.data ?? p) ?? {}) as Record<string, unknown>;
                        const lr = data.launch_readiness as string;
                        if (!lr) return null;
                        return (
                          <Panel>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-text-muted)" }}>Launch Readiness</p>
                            <p className="text-lg font-bold" style={{ color: lr === "GO" ? "var(--noctra-emerald)" : lr === "CONDITIONAL" ? "var(--noctra-amber)" : "var(--noctra-rose)" }}>{lr}</p>
                          </Panel>
                        );
                      })()}
                    </div>
                  </>
                ) : null}

                {openScanGates.length > 0 ? (
                  <Panel>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle size={13} style={{ color: "var(--noctra-rose)" }} />
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-rose)" }}>Failed Gates ({openScanGates.length})</p>
                    </div>
                    <div className="space-y-1">
                      {openScanGates.map((g, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg" style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.15)" }}>
                          <span style={{ color: "var(--noctra-rose)" }}>✗</span>
                          <span style={{ color: "var(--noctra-text-muted)" }}>{g}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {latestDoctorReport ? (
                        <button onClick={() => handleGenerateTasksFromReport(latestDoctorReport)} disabled={generatingTasks === latestDoctorReport.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 disabled:opacity-50" style={{ color: "var(--noctra-rose)", background: "rgba(244,63,94,0.1)" }}>
                          {generatingTasks === latestDoctorReport.id ? <Loader2 size={11} className="animate-spin" /> : <CheckSquare size={11} />}
                          Generate Fix Tasks
                        </button>
                      ) : null}
                      <button onClick={() => navigate("/app/doctor")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ color: "var(--noctra-rose)", background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                        <RefreshCw size={11} /> Re-scan
                      </button>
                    </div>
                  </Panel>
                ) : latestDoctorReport ? (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)" }}>
                    <Check size={14} style={{ color: "var(--noctra-emerald)" }} />
                    <p className="text-xs" style={{ color: "var(--noctra-emerald)" }}>All launch gates passing</p>
                  </div>
                ) : null}

                {latestDoctorReport ? <Panel><ReportRenderer report={latestDoctorReport} projectId={project?.id} /></Panel> : null}

                {/* Fix tasks from doctor */}
                {projectState && projectState.doctorScore > 0 && tasks.filter(t => t.source_report_id === latestDoctorReport?.id).length > 0 && (
                  <Panel>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckSquare size={13} style={{ color: "var(--noctra-emerald)" }} />
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Doctor Fix Tasks</p>
                      <span className="ml-auto text-xs font-mono" style={{ color: "var(--noctra-text-muted)" }}>{tasks.filter(t => t.source_report_id === latestDoctorReport?.id).length} tasks</span>
                    </div>
                    {tasks.filter(t => t.source_report_id === latestDoctorReport?.id).slice(0, 5).map(t => (
                      <div key={t.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg mb-1 text-xs" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: PRIORITY_COLOR[t.priority] ?? "var(--noctra-text-muted)" }} />
                        <span className="flex-1" style={{ color: "var(--noctra-text)" }}>{t.title}</span>
                        <Badge style={{ fontSize: "9px" }}>{t.status}</Badge>
                      </div>
                    ))}
                    <NoctraButton variant="ghost" onClick={() => navigate("/app/tasks")} className="mt-1">
                      View All Tasks <ArrowRight size={11} />
                    </NoctraButton>
                  </Panel>
                )}

                {doctorReports.length > 1 ? (
                  <Panel>
                    <p className="text-xs font-medium mb-2" style={{ color: "var(--noctra-text-muted)" }}>Scan History ({doctorReports.length} scans)</p>
                    <div className="space-y-1.5">
                      {doctorReports.map((r, i) => (
                        <button key={r.id} onClick={() => navigate(`/app/reports/${r.id}`)} className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:opacity-80" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>#{doctorReports.length - i}</span>
                            <span className="text-xs truncate" style={{ color: "var(--noctra-text)" }}>{r.title}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {r.score != null ? <span className="text-xs font-mono" style={{ color: SCORE_COLOR(r.score) }}>{r.score}</span> : null}
                            <span className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{new Date(r.created_at).toLocaleDateString()}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </Panel>
                ) : null}

                <div className="flex gap-2 flex-wrap">
                  <NoctraButton variant="ghost" onClick={() => navigate("/app/doctor")}><RefreshCw size={13} /> Re-scan with Project Doctor</NoctraButton>
                  {latestDoctorReport ? <NoctraButton variant="ghost" onClick={() => navigate(`/app/reports/${latestDoctorReport.id}`)}>Full Scan Report <ArrowRight size={11} /></NoctraButton> : null}
                </div>
              </>
            )}
          </div>
        ) : null}

        {/* ── Twin Tab ── */}
        {tab === "twin" ? (
          <div className="space-y-4">
            <Panel>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,41,215,0.1)", border: "1px solid rgba(255,41,215,0.25)" }}>
                  <Brain size={18} style={{ color: "var(--noctra-magenta)" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--noctra-text)" }}>Product Twin</p>
                  <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>AI synthesis with full cross-tool memory</p>
                </div>
              </div>
              <p className="text-sm mb-4" style={{ color: "var(--noctra-text-soft)" }}>
                The Product Twin has context from all {reports.length} report{reports.length !== 1 ? "s" : ""} in this project. Ask it to synthesize findings, identify contradictions, or suggest your next move.
              </p>
              <div className="space-y-2 mb-4">
                {["What are the biggest risks in this project?", "Summarize all intelligence findings so far", "What should I work on next?", "Are there any contradictions between my reports?"].map((q) => (
                  <div key={q} className="px-3 py-2 rounded-lg text-xs" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-muted)" }}>{q}</div>
                ))}
              </div>
              <NoctraButton onClick={() => navigate("/app/twin")}><Brain size={13} /> Open Product Twin <ArrowRight size={11} /></NoctraButton>
            </Panel>
            {projectState && projectState.coveredTools.length > 0 ? (
              <Panel>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--noctra-text-muted)" }}>Project Intelligence Loaded</p>
                <div className="space-y-1.5">
                  {projectState.coveredTools.map((key) => {
                    const t = TOOL_BY_KEY[key as keyof typeof TOOL_BY_KEY];
                    const rep = projectState.latestReportByTool[key];
                    if (!t || !rep) return null;
                    return (
                      <div key={key} className="flex items-center gap-3 py-1">
                        <t.icon size={12} style={{ color: t.accent, flexShrink: 0 }} />
                        <span className="text-xs flex-1" style={{ color: "var(--noctra-text-soft)" }}>{t.label}</span>
                        {rep.score != null ? <span className="text-xs font-mono" style={{ color: SCORE_COLOR(rep.score) }}>{rep.score}/100</span> : null}
                        <TrendingUp size={10} style={{ color: "var(--noctra-emerald)" }} />
                      </div>
                    );
                  })}
                </div>
              </Panel>
            ) : null}
          </div>
        ) : null}

        {/* ── Launch Tab ── */}
        {tab === "launch" ? (
          <div className="space-y-3">
            {latestLaunchReport ? (
              <>
                <Panel>
                  <div className="flex items-center gap-3 mb-3">
                    <Rocket size={14} style={{ color: "var(--noctra-amber)" }} />
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Launch Assessment</p>
                    {latestLaunchReport.score != null ? <Badge style={{ marginLeft: "auto", background: `${SCORE_COLOR(latestLaunchReport.score)}18`, color: SCORE_COLOR(latestLaunchReport.score) }}>{latestLaunchReport.score}/100</Badge> : null}
                  </div>
                  <p className="text-sm font-medium mb-1" style={{ color: "var(--noctra-text)" }}>{latestLaunchReport.title}</p>
                  {latestLaunchReport.summary ? <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{latestLaunchReport.summary}</p> : null}
                  <p className="text-xs mt-2" style={{ color: "var(--noctra-text-muted)" }}>{new Date(latestLaunchReport.created_at).toLocaleDateString()}</p>
                </Panel>
                <Panel><ReportRenderer report={latestLaunchReport} /></Panel>
                <div className="flex gap-2 flex-wrap">
                  <NoctraButton variant="ghost" onClick={() => navigate(`/app/reports/${latestLaunchReport.id}`)}>Full Report <ArrowRight size={11} /></NoctraButton>
                  <NoctraButton variant="ghost" onClick={() => handleGenerateTasksFromReport(latestLaunchReport)} disabled={generatingTasks === latestLaunchReport.id}>
                    {generatingTasks === latestLaunchReport.id ? <Loader2 size={12} className="animate-spin" /> : <CheckSquare size={12} />} Generate Launch Tasks
                  </NoctraButton>
                  <NoctraButton variant="ghost" onClick={() => navigate("/app/launch")}><Rocket size={13} /> Re-run Launch Room</NoctraButton>
                </div>
              </>
            ) : (
              <>
                <EmptyState icon={<Rocket size={22} />} title="No launch report yet" body="Run Launch Room to get your go/no-go signal with a full checklist and distribution plan." />
                <div className="flex justify-center"><NoctraButton onClick={() => navigate("/app/launch")}><Rocket size={13} /> Run Launch Room</NoctraButton></div>
              </>
            )}
          </div>
        ) : null}

        {/* ── History Tab ── */}
        {tab === "history" ? (
          <div className="space-y-4">
            {timeline.length > 0 ? (
              <Panel>
                <div className="flex items-center gap-2 mb-4">
                  <History size={13} style={{ color: "var(--noctra-violet)" }} />
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Project Timeline</p>
                </div>
                <div className="relative">
                  <div className="absolute left-[5px] top-0 bottom-0 w-px" style={{ background: "var(--noctra-border)" }} />
                  <div className="space-y-4 pl-6">
                    {timeline.map((event) => (
                      <div key={event.id} className="relative">
                        <div className="absolute -left-6 w-2.5 h-2.5 rounded-full top-1" style={{ background: TIMELINE_TYPE_COLOR[event.type] ?? "var(--noctra-text-muted)", boxShadow: `0 0 6px ${TIMELINE_TYPE_COLOR[event.type] ?? "var(--noctra-text-muted)"}60` }} />
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium" style={{ color: "var(--noctra-text)" }}>{event.title}</p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{event.description}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {event.score != null ? <span className="text-xs font-bold font-mono" style={{ color: event.score >= 70 ? "var(--noctra-emerald)" : event.score >= 50 ? "var(--noctra-amber)" : "var(--noctra-rose)" }}>{event.score}</span> : null}
                            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--noctra-text-muted)" }}><Clock size={10} />{formatTimeAgo(event.date)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>
            ) : (
              <EmptyState icon={<History size={22} />} title="No history yet" body="Run intelligence tools and add proof signals to build your project timeline." />
            )}
            {scoreHistory.length > 0 ? (
              <Panel>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--noctra-text-muted)" }}>Score History</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {scoreHistory.map((entry) => {
                    const t = TOOL_BY_KEY[entry.tool as keyof typeof TOOL_BY_KEY];
                    return (
                      <div key={entry.tool} className="rounded-lg p-3" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          {t ? <t.icon size={10} style={{ color: t.accent }} /> : null}
                          <span className="text-[10px] uppercase tracking-wide font-medium" style={{ color: "var(--noctra-text-muted)" }}>{t?.short ?? entry.tool}</span>
                        </div>
                        <p className="text-xl font-bold font-mono leading-none" style={{ color: t?.accent ?? "var(--noctra-cyan)" }}>{entry.latestScore}</p>
                        {entry.delta != null ? <p className="text-[10px] mt-1 font-medium" style={{ color: getDeltaColor(entry.direction) }}>{getDeltaLabel(entry)}</p> : <p className="text-[10px] mt-1" style={{ color: "var(--noctra-text-muted)" }}>first run</p>}
                      </div>
                    );
                  })}
                </div>
              </Panel>
            ) : null}
            {risks.length > 0 ? (
              <Panel>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldAlert size={13} style={{ color: "var(--noctra-amber)" }} />
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-amber)" }}>Full Risk Register</p>
                  <span className="ml-auto text-xs font-mono" style={{ color: "var(--noctra-text-muted)" }}>{risks.length} risks detected</span>
                </div>
                <div className="space-y-2">
                  {risks.map((risk) => (
                    <div key={risk.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: RISK_SEV_COLOR[risk.severity] }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="text-xs font-medium" style={{ color: "var(--noctra-text)" }}>{risk.title}</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase shrink-0" style={{ background: `${RISK_SEV_COLOR[risk.severity]}15`, color: RISK_SEV_COLOR[risk.severity] }}>{risk.severity}</span>
                          <span className="text-[10px]" style={{ color: "var(--noctra-text-muted)" }}>{risk.category}</span>
                        </div>
                        <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>Fix: {risk.recommendedFix}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>Source: {risk.sourceTool}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            ) : null}
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
