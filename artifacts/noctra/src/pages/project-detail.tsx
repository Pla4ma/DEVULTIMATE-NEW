import { useEffect, useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { Panel, Badge, EmptyState, NoctraButton, ScoreRing } from "@/components/Primitives";
import { ROUTES } from "@/lib/routes";
import {
  getProject, getReports, getTasks, getProofSignals,
  updateProject, deleteProject, updateTaskStatus, createProofSignal,
  getReport, linkReportToProject,
} from "@/lib/repository";
import { computeProjectState } from "@/lib/project-state";
import type { ProjectState } from "@/lib/project-state";
import { buildTimeline } from "@/lib/timeline";
import { extractRisks } from "@/lib/risk-radar";
import { generateProjectBrief, generateDevAgentPrompt } from "@/lib/brief-generator";
import { computeScoreHistory } from "@/lib/score-history";
import { generateTasksFromReport } from "@/lib/task-generator";
import { generateSprintFromTasks } from "@/lib/sprint";
import { downloadMarkdown, copyText } from "@/lib/export";
import { analyzeCodebaseAlignment } from "@/lib/codebase-alignment";
import type { ReportSummary } from "@/lib/report-utils";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Trash2, Edit2, Loader2, Calendar,
  FolderOpen, AlertTriangle, Save, X,
} from "lucide-react";
import { OverviewTab } from "./project-detail/OverviewTab";
import { ReportsTab } from "./project-detail/ReportsTab";
import { ExecutionTab } from "./project-detail/ExecutionTab";
import { ProofTab } from "./project-detail/ProofTab";
import { DoctorTab } from "./project-detail/DoctorTab";
import { TwinTab } from "./project-detail/TwinTab";
import { LaunchTab } from "./project-detail/LaunchTab";
import { HistoryTab } from "./project-detail/HistoryTab";
import { STAGES, STAGE_COLORS, type Project, type Report, type Task, type ProofSignal, type Tab } from "./project-detail/types";

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
      navigate(ROUTES.projects);
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
  const stageColor = STAGE_COLORS[project?.stage ?? "idea"] ?? "var(--text-tertiary)";

  const timeline = useMemo(() => buildTimeline({ reports, proofSignals, project: project ?? undefined, limit: 20 }), [reports, proofSignals, project]);
  const risks = useMemo(() => extractRisks({ reports, tasks, projectId: project?.id }), [reports, tasks, project]);
  const scoreHistory = useMemo(() => computeScoreHistory(reports), [reports]);
  const alignment = useMemo(() => analyzeCodebaseAlignment({ reports: reports as ReportSummary[], tasks }), [reports, tasks]);
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

  function handleCopyBuildPrompt() {
    if (!project || !projectState || !latestDoctorReport) return;
    copyText(generateDevAgentPrompt({
      project: { name: project.name, idea: project.idea },
      state: projectState,
      tasks,
      doctorPayload: latestDoctorReport.payload,
      mvpPayload: mvpReport?.payload,
    })).then(() => {
      toast({ title: "Prompt copied", description: "Paste into Codex, Replit, Cursor, or Windsurf." });
    }).catch(() => {});
  }

  if (loading) return (
    <AppShell>
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--signal)" }} />
      </div>
    </AppShell>
  );

  if (error || !project) return (
    <AppShell>
      <div className="p-6 max-w-4xl mx-auto">
        <EmptyState icon={<AlertTriangle size={24} />} title="Project not found" body={error || "This project does not exist."} />
        <div className="flex justify-center mt-4">
          <NoctraButton variant="ghost" onClick={() => navigate(ROUTES.projects)}><ArrowLeft size={14} /> Back to Projects</NoctraButton>
        </div>
      </div>
    </AppShell>
  );

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
    { key: "doctor", label: "Product Doctor", count: doctorReports.length },
    { key: "twin", label: "Product Twin" },
    { key: "launch", label: "Launch", count: launchReports.length },
    { key: "history", label: "History", count: timeline.length },
  ];

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button onClick={() => navigate(ROUTES.projects)} className="flex items-center gap-1.5 text-sm hover:opacity-80" style={{ color: "var(--text-tertiary)" }}>
            <ArrowLeft size={14} /> All Projects
          </button>
          <div className="flex items-center gap-2">
            {editing ? null : <NoctraButton variant="ghost" onClick={() => setEditing(true)}><Edit2 size={13} /> Edit</NoctraButton>}
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--color-danger)" }}>Delete project?</span>
                <NoctraButton variant="ghost" onClick={handleDelete} disabled={deleting}>{deleting ? <Loader2 size={12} className="animate-spin" /> : "Yes, delete"}</NoctraButton>
                <NoctraButton variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</NoctraButton>
              </div>
            ) : (
              <NoctraButton variant="ghost" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={13} style={{ color: "var(--color-danger)" }} />
                <span style={{ color: "var(--color-danger)" }}>Delete</span>
              </NoctraButton>
            )}
          </div>
        </div>

        {/* Header */}
        {editing ? (
          <Panel>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Project Name</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Core Idea</label>
                <textarea value={editIdea} onChange={(e) => setEditIdea(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg text-sm resize-none outline-none" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Stage</label>
                <div className="flex gap-2 flex-wrap">
                  {STAGES.map((s) => (
                    <button key={s} onClick={() => setEditStage(s)} className="px-3 py-1 rounded-full text-xs font-medium capitalize" style={{ background: editStage === s ? `${STAGE_COLORS[s]}20` : "var(--surface-2)", border: `1px solid ${editStage === s ? STAGE_COLORS[s] : "var(--border-default)"}`, color: editStage === s ? STAGE_COLORS[s] : "var(--text-tertiary)" }}>
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
            <div className="flex items-start gap-5">
              {projectState ? (
                <div className="shrink-0">
                  <ScoreRing value={projectState.readiness} size={72} stroke={6} label="Ready" color={projectState.readiness >= 70 ? "var(--color-success)" : projectState.readiness >= 40 ? "var(--color-warning)" : "var(--color-danger)"} />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${stageColor}18`, border: `1px solid ${stageColor}30` }}>
                  <FolderOpen size={18} style={{ color: stageColor }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge style={{ background: `${stageColor}18`, color: stageColor }}>{project.stage ?? "idea"}</Badge>
                  {project.status ? <Badge>{project.status}</Badge> : null}
                </div>
                <h1 className="text-xl font-bold text-display tracking-tight" style={{ color: "var(--text-primary)" }}>{project.name}</h1>
                {project.idea ? <p className="text-sm mt-1 line-clamp-2" style={{ color: "var(--text-tertiary)" }}>{project.idea}</p> : null}
                <p className="text-xs mt-2 flex items-center gap-1" style={{ color: "var(--text-quaternary)" }}>
                  <Calendar size={11} /> Created {new Date(project.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </p>
              </div>
              <div className="flex gap-5 text-center shrink-0">
                {[
                  { label: "Reports", value: reports.length, color: "var(--accent-violet)" },
                  { label: "Tasks", value: tasks.length, color: "var(--color-success)" },
                  { label: "Done", value: completedTasks, color: "var(--signal)" },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <p className="text-xl font-bold text-mono" style={{ color }}>{value}</p>
                    <p className="eyebrow mt-0.5" style={{ color: "var(--text-tertiary)" }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: "var(--surface-2)", border: "1px solid var(--border-subtle)" }}>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key); setSelectedReport(null); }} className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all" style={{ background: tab === t.key ? "var(--surface-1)" : "transparent", color: tab === t.key ? "var(--text-primary)" : "var(--text-tertiary)", border: tab === t.key ? "1px solid var(--border-default)" : "1px solid transparent", boxShadow: tab === t.key ? "var(--shadow-xs)" : "none", whiteSpace: "nowrap" }}>
              {t.label}
              {t.count != null && t.count > 0 ? <span className="text-mono text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--surface-3)", color: "var(--text-tertiary)" }}>{t.count}</span> : null}
            </button>
          ))}
        </div>

        {tab === "overview" ? (
          <OverviewTab
            project={project}
            projectState={projectState}
            reports={reports}
            tasks={tasks}
            proofSignals={proofSignals}
            risks={risks}
            navigate={navigate}
            onTabChange={setTab}
            briefCopied={briefCopied}
            promptCopied={promptCopied}
            onCopyBrief={copyBrief}
            onDownloadBrief={downloadBrief}
            onCopyPrompt={copyPrompt}
          />
        ) : null}

        {tab === "reports" ? (
          <ReportsTab
            reports={reports}
            selectedReport={selectedReport}
            onSelectReport={setSelectedReport}
            generatingTasks={generatingTasks}
            onGenerateTasks={handleGenerateTasksFromReport}
            navigate={navigate}
            linkReportId={linkReportId}
            onLinkReportIdChange={setLinkReportId}
            onLinkReport={handleLinkReportById}
            linkingReport={linkingReport}
          />
        ) : null}

        {tab === "execution" ? (
          <ExecutionTab
            tasks={tasks}
            reports={reports}
            taskFilter={taskFilter}
            completedTasks={completedTasks}
            filteredTasks={filteredTasks}
            generatingSprint={generatingSprint}
            generatingTasks={generatingTasks}
            onTaskFilterChange={setTaskFilter}
            onTaskToggle={handleTaskToggle}
            onGenerateSprint={handleGenerateSprint}
            onGenerateTasks={handleGenerateTasksFromReport}
            navigate={navigate}
          />
        ) : null}

        {tab === "proof" ? (
          <ProofTab
            proofSignals={proofSignals}
            addingSignal={addingSignal}
            signalLabel={signalLabel}
            signalKind={signalKind}
            signalSource={signalSource}
            signalEvidence={signalEvidence}
            savingSignal={savingSignal}
            onToggleAddingSignal={() => setAddingSignal(!addingSignal)}
            onSignalLabelChange={setSignalLabel}
            onSignalKindChange={setSignalKind}
            onSignalSourceChange={setSignalSource}
            onSignalEvidenceChange={setSignalEvidence}
            onAddSignal={handleAddSignal}
            onCancelAddSignal={() => setAddingSignal(false)}
            navigate={navigate}
          />
        ) : null}

        {tab === "doctor" ? (
          <DoctorTab
            doctorReports={doctorReports}
            latestDoctorReport={latestDoctorReport}
            openScanGates={openScanGates}
            tasks={tasks}
            projectState={projectState}
            project={project}
            generatingTasks={generatingTasks}
            onGenerateTasks={handleGenerateTasksFromReport}
            onCopyBuildPrompt={handleCopyBuildPrompt}
            navigate={navigate}
          />
        ) : null}

        {tab === "twin" ? (
          <TwinTab
            reports={reports}
            projectState={projectState}
            navigate={navigate}
          />
        ) : null}

        {tab === "launch" ? (
          <LaunchTab
            latestLaunchReport={latestLaunchReport}
            generatingTasks={generatingTasks}
            onGenerateTasks={handleGenerateTasksFromReport}
            navigate={navigate}
          />
        ) : null}

        {tab === "history" ? (
          <HistoryTab
            timeline={timeline}
            scoreHistory={scoreHistory}
            risks={risks}
          />
        ) : null}
      </div>
    </AppShell>
  );
}
