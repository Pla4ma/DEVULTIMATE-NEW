import { useEffect, useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { Panel, Badge, EmptyState, NoctraButton } from "@/components/Primitives";
import { ReportRenderer } from "@/components/reports/ReportRenderer";
import {
  getReport, deleteReport, getTasks, getProjects, getProofSignals,
  getReports, linkReportToProject, createProject,
} from "@/lib/repository";
import {
  downloadMarkdown, downloadJson, reportToMarkdown, reportToSummary,
  copyText, tasksToGithubMarkdown,
} from "@/lib/export";
import { generateTasksFromReport } from "@/lib/task-generator";
import { generatePromptPackFromReport, exportPromptPackToMarkdown } from "@/lib/prompt-pack";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import { getReportNextActions } from "@/lib/next-action";
import { analyzeMonetization } from "@/lib/monetization";
import { analyzeRetention } from "@/lib/retention";
import type { ReportSummary } from "@/lib/intelligence";
import {
  ArrowLeft, Trash2, Download, FileText, Loader2, Calendar,
  Zap, Link2, AlertTriangle, ArrowRight, FolderOpen,
  Copy, CheckCheck, Package, Plus, X, Check, Layers,
  ClipboardList, Rocket, Github, DollarSign, RefreshCw,
  TrendingUp, ShieldAlert,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Report = {
  id: string;
  tool: string;
  title: string;
  score?: number | null;
  summary?: string | null;
  payload: unknown;
  project_id?: string | null;
  created_at: string;
};

type Project = { id: string; name: string; idea?: string | null };

const SCORE_COLOR = (s: number) =>
  s >= 75 ? "var(--noctra-emerald)" : s >= 50 ? "var(--noctra-amber)" : "var(--noctra-rose)";

const TOOL_ACCENT: Record<string, string> = {
  idea: "var(--noctra-violet)",
  reality: "var(--noctra-amber)",
  proof: "var(--noctra-emerald)",
  swarm: "var(--noctra-cyan)",
  mvp: "var(--noctra-cyan)",
  doctor: "var(--noctra-rose)",
  launch: "var(--noctra-amber)",
  twin: "var(--noctra-magenta)",
};

function scoreLabel(score: number): string {
  if (score >= 80) return "Strong";
  if (score >= 65) return "Good";
  if (score >= 50) return "Fair";
  if (score >= 35) return "Weak";
  return "Critical";
}

// ─── Link Project Modal ───────────────────────────────────────────────────────

function LinkProjectModal({
  projects,
  currentProjectId,
  onLink,
  onClose,
  linking,
}: {
  projects: Project[];
  currentProjectId: string | null | undefined;
  onLink: (projectId: string | null) => void;
  onClose: () => void;
  linking: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-5 space-y-3"
        style={{ background: "var(--noctra-surface)", border: "1px solid var(--noctra-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold" style={{ color: "var(--noctra-text)" }}>Link to Project</p>
          <button onClick={onClose}>
            <X size={16} style={{ color: "var(--noctra-text-muted)" }} />
          </button>
        </div>
        {currentProjectId ? (
          <button
            onClick={() => onLink(null)}
            disabled={linking}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs"
            style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", color: "var(--noctra-rose)" }}
          >
            <X size={12} /> Unlink from current project
          </button>
        ) : null}
        {projects.length === 0 ? (
          <p className="text-xs py-4 text-center" style={{ color: "var(--noctra-text-muted)" }}>
            No projects yet — create one first.
          </p>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => onLink(p.id)}
                disabled={linking || p.id === currentProjectId}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:opacity-80 transition-opacity"
                style={{
                  background: p.id === currentProjectId ? "rgba(61,216,255,0.08)" : "var(--noctra-surface2)",
                  border: `1px solid ${p.id === currentProjectId ? "rgba(61,216,255,0.25)" : "var(--noctra-border)"}`,
                  opacity: linking ? 0.6 : 1,
                }}
              >
                <FolderOpen size={13} style={{ color: p.id === currentProjectId ? "var(--noctra-cyan)" : "var(--noctra-text-muted)", flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: "var(--noctra-text)" }}>{p.name}</p>
                  {p.idea ? <p className="text-xs truncate mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{p.idea}</p> : null}
                </div>
                {p.id === currentProjectId ? <Check size={12} style={{ color: "var(--noctra-cyan)", flexShrink: 0 }} /> : null}
                {linking ? <Loader2 size={11} className="animate-spin shrink-0" style={{ color: "var(--noctra-text-muted)" }} /> : null}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [report, setReport] = useState<Report | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [generatingTasks, setGeneratingTasks] = useState(false);
  const [generatingPack, setGeneratingPack] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linking, setLinking] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [summaryCopied, setSummaryCopied] = useState(false);

  // Context for next-action computation
  const [hasTasks, setHasTasks] = useState(false);
  const [hasProject, setHasProject] = useState(false);
  const [hasProof, setHasProof] = useState(false);
  const [hasSwarm, setHasSwarm] = useState(false);
  const [hasMvp, setHasMvp] = useState(false);
  const [doctorScore, setDoctorScore] = useState(0);
  const [reportsList, setReportsList] = useState<ReportSummary[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getReport(id),
      getTasks(),
      getProjects(),
      getProofSignals(),
      getReports(),
    ])
      .then(([r, tasks, projs, signals, allReports]) => {
        setReport(r as Report);
        setProjects((projs as Project[]) ?? []);
        setHasTasks((tasks as unknown[]).length > 0);
        setHasProject((projs as unknown[]).length > 0);
        setHasProof((signals as unknown[]).length > 0);
        const reps = allReports as ReportSummary[];
        setReportsList(reps);
        setHasSwarm(reps.some((rr) => rr.tool === "swarm"));
        setHasMvp(reps.some((rr) => rr.tool === "mvp"));
        const doctorRep = reps.find((rr) => rr.tool === "doctor");
        setDoctorScore(doctorRep?.score ?? 0);
      })
      .catch((e) => setError(e?.message ?? "Failed to load report"))
      .finally(() => setLoading(false));
  }, [id]);

  const tool = report ? TOOL_BY_KEY[report.tool as keyof typeof TOOL_BY_KEY] : null;
  const accentColor = TOOL_ACCENT[report?.tool ?? ""] ?? "var(--noctra-cyan)";
  const linkedProject = projects.find((p) => p.id === report?.project_id);

  // ── Global actions ─────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!report) return;
    setDeleting(true);
    try {
      await deleteReport(report.id);
      navigate("/app/reports");
    } catch (err) {
      setDeleting(false);
      setConfirmDelete(false);
      toast({ title: "Failed to delete report", description: err instanceof Error ? err.message : "Unexpected error.", variant: "destructive" });
    }
  }

  function handleDownloadMD() {
    if (!report) return;
    downloadMarkdown(report.title.replace(/\s+/g, "-").toLowerCase(), reportToMarkdown(report));
  }

  function handleDownloadJSON() {
    if (!report) return;
    downloadJson(report.title.replace(/\s+/g, "-").toLowerCase(), report.payload);
  }

  async function handleCopySummary() {
    if (!report) return;
    try {
      await copyText(report.summary ?? reportToSummary(report));
      setSummaryCopied(true);
      setTimeout(() => setSummaryCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", description: "Could not access clipboard.", variant: "destructive" });
    }
  }

  async function handleGenerateTasks() {
    if (!report) return;
    setGeneratingTasks(true);
    try {
      const count = await generateTasksFromReport({ id: report.id, tool: report.tool, payload: report.payload, project_id: report.project_id });
      if (count > 0) {
        toast({ title: `${count} task${count !== 1 ? "s" : ""} created`, description: "View them in Tasks." });
      } else {
        toast({ title: "No tasks generated", description: "Not enough structured data in this report.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Failed to generate tasks", description: err instanceof Error ? err.message : "Unexpected error.", variant: "destructive" });
    } finally {
      setGeneratingTasks(false);
    }
  }

  async function handleGeneratePromptPack() {
    if (!report) return;
    setGeneratingPack(true);
    try {
      const pack = generatePromptPackFromReport(report, "Replit");
      const md = exportPromptPackToMarkdown(pack);
      downloadMarkdown(`${report.title.replace(/\s+/g, "-").toLowerCase()}-prompt-pack`, md);
      toast({ title: "Prompt pack downloaded", description: `${pack.prompts.length} prompt${pack.prompts.length !== 1 ? "s" : ""} exported.` });
    } catch (err) {
      toast({ title: "Failed to generate prompt pack", description: err instanceof Error ? err.message : "Unexpected error.", variant: "destructive" });
    } finally {
      setGeneratingPack(false);
    }
  }

  async function handleLinkToProject(projectId: string | null) {
    if (!report) return;
    setLinking(true);
    try {
      await linkReportToProject(report.id, projectId);
      setReport((prev) => prev ? { ...prev, project_id: projectId } : prev);
      setShowLinkModal(false);
      toast({
        title: projectId ? "Report linked" : "Report unlinked",
        description: projectId ? `Linked to "${projects.find((p) => p.id === projectId)?.name ?? "project"}".` : "Report unlinked from project.",
      });
    } catch (err) {
      toast({ title: "Failed to link report", description: err instanceof Error ? err.message : "Unexpected error.", variant: "destructive" });
    } finally {
      setLinking(false);
    }
  }

  async function handleCreateProject() {
    if (!report) return;
    setCreatingProject(true);
    try {
      const proj = await createProject({ name: report.title, idea: report.summary ?? undefined, stage: "idea" }) as Project;
      await linkReportToProject(report.id, proj.id);
      setReport((prev) => prev ? { ...prev, project_id: proj.id } : prev);
      setProjects((prev) => [proj, ...prev]);
      toast({ title: "Project created", description: `"${proj.name}" created and linked.` });
      navigate(`/app/projects/${proj.id}`);
    } catch (err) {
      toast({ title: "Failed to create project", description: err instanceof Error ? err.message : "Unexpected error.", variant: "destructive" });
    } finally {
      setCreatingProject(false);
    }
  }

  // ── Tool-specific exports ──────────────────────────────────────────────────

  function handleExportPRD() {
    if (!report) return;
    const md = `# PRD: ${report.title}\n\n${report.summary ? `## Overview\n${report.summary}\n\n` : ""}${reportToMarkdown(report)}`;
    downloadMarkdown(`${report.title.replace(/\s+/g, "-").toLowerCase()}-prd`, md);
  }

  function handleExportGitHubIssues() {
    if (!report) return;
    const data = (report.payload as Record<string, unknown>)?.data as Record<string, unknown> | null;
    const scope = data?.ruthless_scope as { build_now?: string[] } | null;
    const features = scope?.build_now ?? (data?.next_actions as string[] | null) ?? [];
    const md = tasksToGithubMarkdown(features.map((f) => ({ title: String(f), priority: "high", status: "todo" })));
    downloadMarkdown(`${report.title.replace(/\s+/g, "-").toLowerCase()}-github-issues`, md);
  }

  function handleExportFixPlan() {
    if (!report) return;
    const md = `# Doctor Fix Plan: ${report.title}\n\n${report.summary ? `## Diagnosis Summary\n${report.summary}\n\n` : ""}${reportToMarkdown(report)}`;
    downloadMarkdown(`${report.title.replace(/\s+/g, "-").toLowerCase()}-fix-plan`, md);
  }

  function handleExportLaunchPack() {
    if (!report) return;
    const md = `# Launch Pack: ${report.title}\n\n${report.summary ? `## Launch Summary\n${report.summary}\n\n` : ""}${reportToMarkdown(report)}`;
    downloadMarkdown(`${report.title.replace(/\s+/g, "-").toLowerCase()}-launch-pack`, md);
  }

  // ── Tool-specific action dispatch ──────────────────────────────────────────

  type ToolAction = { id: string; label: string; description: string; icon: React.ElementType; color?: string; busy?: boolean };

  function getToolActions(): ToolAction[] {
    if (!report) return [];
    switch (report.tool) {
      case "idea":
        return [
          { id: "run-reality", label: "Run Pressure Matrix", description: "Reality-check every assumption in this idea", icon: Zap, color: "var(--noctra-amber)" },
          { id: "run-swarm", label: "Run Market Swarm", description: "Simulate market demand with AI personas", icon: Layers, color: "var(--noctra-cyan)" },
          { id: "run-mvp", label: "Generate MVP Plan", description: "Plan your build based on this idea", icon: Rocket, color: "var(--noctra-violet)" },
        ];
      case "reality":
        return [
          { id: "run-proof", label: "Run Proof Engine", description: "Validate assumptions with real evidence", icon: Zap, color: "var(--noctra-emerald)" },
          { id: "tasks-generate", label: "Tasks from Failures", description: "Turn red flags into actionable fix tasks", icon: ClipboardList, color: "var(--noctra-rose)", busy: generatingTasks },
          { id: "run-swarm", label: "Run Market Swarm", description: "Cross-validate with persona simulation", icon: Layers, color: "var(--noctra-cyan)" },
        ];
      case "swarm":
        return [
          { id: "run-mvp", label: "Generate MVP Plan", description: "Turn swarm insights into a build plan", icon: Rocket, color: "var(--noctra-violet)" },
          { id: "run-proof", label: "Generate Proof Experiments", description: "Design experiments addressing objections", icon: Zap, color: "var(--noctra-emerald)" },
          { id: "tasks-generate", label: "Tasks from Objections", description: "Turn persona objections into fix tasks", icon: ClipboardList, color: "var(--noctra-amber)", busy: generatingTasks },
        ];
      case "mvp":
        return [
          { id: "tasks-generate", label: "Generate Tasks", description: "Break MVP plan into execution tasks", icon: ClipboardList, color: "var(--noctra-cyan)", busy: generatingTasks },
          { id: "export-prd", label: "Export PRD", description: "Download a product requirements document", icon: FileText },
          { id: "export-github", label: "Export GitHub Issues", description: "Download build features as GitHub issue markdown", icon: Github },
        ];
      case "doctor":
        return [
          { id: "tasks-generate", label: "Generate Fix Tasks", description: "Turn blockers into high-priority tasks", icon: ClipboardList, color: "var(--noctra-rose)", busy: generatingTasks },
          { id: "export-fix-plan", label: "Export Fix Plan", description: "Download a structured doctor fix plan", icon: FileText, color: "var(--noctra-rose)" },
          { id: "run-launch", label: "Run Launch Control", description: "Check go/no-go status after fixes", icon: Rocket, color: "var(--noctra-amber)" },
        ];
      case "launch":
        return [
          { id: "tasks-generate", label: "Generate Launch Tasks", description: "Turn launch plan into a sprint queue", icon: ClipboardList, color: "var(--noctra-amber)", busy: generatingTasks },
          { id: "export-launch-pack", label: "Export Launch Pack", description: "Download complete launch plan as markdown", icon: Rocket, color: "var(--noctra-amber)" },
        ];
      default:
        return [];
    }
  }

  async function handleToolAction(actionId: string) {
    if (!report) return;
    switch (actionId) {
      case "run-reality": navigate("/app/reality"); break;
      case "run-swarm": navigate("/app/swarm"); break;
      case "run-mvp": navigate("/app/mvp"); break;
      case "run-proof": navigate("/app/proof"); break;
      case "run-launch": navigate("/app/launch"); break;
      case "tasks-generate": await handleGenerateTasks(); break;
      case "export-prd": handleExportPRD(); break;
      case "export-github": handleExportGitHubIssues(); break;
      case "export-fix-plan": handleExportFixPlan(); break;
      case "export-launch-pack": handleExportLaunchPack(); break;
    }
  }

  // ── Intelligence panels (monetization + retention) ────────────────────────

  const monetization = useMemo(() => {
    if (!report || !["idea", "mvp", "swarm", "reality"].includes(report.tool)) return null;
    const base = report as unknown as ReportSummary;
    const combined = reportsList.length > 0 ? reportsList : [base];
    return analyzeMonetization(combined);
  }, [report, reportsList]);

  const retention = useMemo(() => {
    if (!report || !["idea", "mvp", "swarm"].includes(report.tool)) return null;
    const base = report as unknown as ReportSummary;
    const combined = reportsList.length > 0 ? reportsList : [base];
    return analyzeRetention(combined);
  }, [report, reportsList]);

  // ── Loading / error states ─────────────────────────────────────────────────

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--noctra-cyan)" }} />
        </div>
      </AppShell>
    );
  }

  if (error || !report) {
    return (
      <AppShell>
        <div className="p-6 max-w-4xl mx-auto">
          <EmptyState icon={<AlertTriangle size={24} />} title="Report not found" body={error || "This report does not exist or you don't have access."} />
          <div className="flex justify-center mt-4">
            <NoctraButton variant="ghost" onClick={() => navigate("/app/reports")}>
              <ArrowLeft size={14} /> Back to Reports
            </NoctraButton>
          </div>
        </div>
      </AppShell>
    );
  }

  const nextActions = getReportNextActions(report.tool, { id: report.id, score: report.score }, { hasTasks, hasProject, hasProof, hasSwarm, hasMvp, doctorScore });
  const toolActions = getToolActions();

  return (
    <AppShell>
      {showLinkModal ? (
        <LinkProjectModal
          projects={projects}
          currentProjectId={report.project_id}
          onLink={handleLinkToProject}
          onClose={() => setShowLinkModal(false)}
          linking={linking}
        />
      ) : null}

      <div className="p-6 max-w-5xl mx-auto space-y-5">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={() => navigate("/app/reports")}
            className="flex items-center gap-1.5 text-sm hover:opacity-80 transition-opacity"
            style={{ color: "var(--noctra-text-muted)" }}
          >
            <ArrowLeft size={14} /> All Reports
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--noctra-rose)" }}>Delete?</span>
                <NoctraButton variant="ghost" onClick={handleDelete} disabled={deleting}>
                  {deleting ? <Loader2 size={12} className="animate-spin" /> : "Yes, delete"}
                </NoctraButton>
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
        <Panel>
          <div className="flex items-start gap-4">
            {tool ? (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${tool.accent}18`, border: `1px solid ${tool.accent}30` }}>
                <tool.icon size={18} style={{ color: tool.accent }} />
              </div>
            ) : null}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {tool ? <Badge style={{ background: `${tool.accent}18`, color: tool.accent }}>{tool.label}</Badge> : null}
                {report.score != null ? (
                  <Badge style={{ background: `${SCORE_COLOR(report.score)}18`, color: SCORE_COLOR(report.score) }}>
                    {scoreLabel(report.score)} — {report.score}/100
                  </Badge>
                ) : null}
              </div>
              <h1 className="text-xl font-bold" style={{ color: "var(--noctra-text)" }}>{report.title}</h1>
              {report.summary ? <p className="text-sm mt-1" style={{ color: "var(--noctra-text-muted)" }}>{report.summary}</p> : null}
              <div className="flex items-center gap-3 mt-2 text-xs flex-wrap" style={{ color: "var(--noctra-text-muted)" }}>
                <span className="flex items-center gap-1">
                  <Calendar size={11} />
                  {new Date(report.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </span>
                {linkedProject ? (
                  <button onClick={() => navigate(`/app/projects/${report.project_id}`)} className="flex items-center gap-1 hover:opacity-80" style={{ color: "var(--noctra-cyan)" }}>
                    <FolderOpen size={11} /> {linkedProject.name}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </Panel>

        {/* Global Action Bar */}
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--noctra-text-muted)" }}>Actions</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={handleCopySummary}
              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-medium transition-all hover:opacity-80"
              style={{ background: summaryCopied ? "rgba(52,211,153,0.1)" : "var(--noctra-surface2)", border: `1px solid ${summaryCopied ? "var(--noctra-emerald)" : "var(--noctra-border)"}`, color: summaryCopied ? "var(--noctra-emerald)" : "var(--noctra-text)" }}
            >
              {summaryCopied ? <CheckCheck size={15} /> : <Copy size={15} />}
              {summaryCopied ? "Copied!" : "Copy Summary"}
            </button>

            <button
              onClick={handleDownloadMD}
              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-medium hover:opacity-80"
              style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }}
            >
              <Download size={15} />
              Download MD
            </button>

            <button
              onClick={handleDownloadJSON}
              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-medium hover:opacity-80"
              style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }}
            >
              <FileText size={15} />
              Download JSON
            </button>

            <button
              onClick={handleGenerateTasks}
              disabled={generatingTasks}
              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-medium hover:opacity-80 disabled:opacity-50"
              style={{ background: "rgba(61,216,255,0.08)", border: "1px solid rgba(61,216,255,0.2)", color: "var(--noctra-cyan)" }}
            >
              {generatingTasks ? <Loader2 size={15} className="animate-spin" /> : <ClipboardList size={15} />}
              {generatingTasks ? "Generating…" : "Generate Tasks"}
            </button>

            <button
              onClick={handleGeneratePromptPack}
              disabled={generatingPack}
              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-medium hover:opacity-80 disabled:opacity-50"
              style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", color: "var(--noctra-violet)" }}
            >
              {generatingPack ? <Loader2 size={15} className="animate-spin" /> : <Package size={15} />}
              {generatingPack ? "Building…" : "Prompt Pack"}
            </button>

            <button
              onClick={() => setShowLinkModal(true)}
              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-medium hover:opacity-80"
              style={{ background: linkedProject ? "rgba(61,216,255,0.08)" : "var(--noctra-surface2)", border: `1px solid ${linkedProject ? "rgba(61,216,255,0.2)" : "var(--noctra-border)"}`, color: linkedProject ? "var(--noctra-cyan)" : "var(--noctra-text)" }}
            >
              <Link2 size={15} />
              {linkedProject ? "Relink" : "Link Project"}
            </button>

            {!report.project_id ? (
              <button
                onClick={handleCreateProject}
                disabled={creatingProject}
                className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-medium hover:opacity-80 disabled:opacity-50"
                style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)", color: "var(--noctra-emerald)" }}
              >
                {creatingProject ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                {creatingProject ? "Creating…" : "New Project"}
              </button>
            ) : (
              <button
                onClick={() => navigate(`/app/projects/${report.project_id}`)}
                className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-medium hover:opacity-80"
                style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }}
              >
                <FolderOpen size={15} />
                View Project
              </button>
            )}
          </div>
        </Panel>

        {/* Tool-specific actions */}
        {toolActions.length > 0 ? (
          <Panel>
            <div className="flex items-center gap-2 mb-3">
              <Zap size={12} style={{ color: accentColor }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>
                {tool?.label ?? "Tool"} Actions
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {toolActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleToolAction(action.id)}
                  disabled={action.busy}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all hover:opacity-80 disabled:opacity-50"
                  style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${action.color ?? accentColor}18`, border: `1px solid ${action.color ?? accentColor}25` }}
                  >
                    {action.busy ? (
                      <Loader2 size={12} className="animate-spin" style={{ color: action.color ?? accentColor }} />
                    ) : (
                      <action.icon size={12} style={{ color: action.color ?? accentColor }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium" style={{ color: "var(--noctra-text)" }}>{action.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{action.description}</p>
                  </div>
                  <ArrowRight size={11} style={{ color: "var(--noctra-text-muted)", flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </Panel>
        ) : null}

        {/* Next Actions */}
        {nextActions.length > 0 ? (
          <Panel>
            <div className="flex items-center gap-2 mb-3">
              <ArrowRight size={13} style={{ color: accentColor }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>What to do next</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {nextActions.map((action) => {
                const actionTool = TOOL_BY_KEY[action.tool as keyof typeof TOOL_BY_KEY];
                return (
                  <button
                    key={action.href + action.title}
                    onClick={() => navigate(action.href)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all hover:opacity-90"
                    style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}
                  >
                    {actionTool ? (
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${actionTool.accent}18`, border: `1px solid ${actionTool.accent}25` }}>
                        <actionTool.icon size={12} style={{ color: actionTool.accent }} />
                      </div>
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium" style={{ color: "var(--noctra-text)" }}>{action.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{action.description}</p>
                    </div>
                    <ArrowRight size={11} style={{ color: "var(--noctra-text-muted)", flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>
          </Panel>
        ) : null}

        {/* Report content */}
        <Panel>
          <div className="p-1">
            <ReportRenderer report={report} />
          </div>
        </Panel>

        {/* Bottom quick actions */}
        <div className="flex gap-3 flex-wrap">
          {tool ? (
            <NoctraButton variant="ghost" onClick={() => navigate(tool.route)}>
              <Zap size={13} /> Run {tool.label} again
            </NoctraButton>
          ) : null}
          <NoctraButton variant="ghost" onClick={() => navigate("/app/tasks")}>
            <FileText size={13} /> View task queue
          </NoctraButton>
          <NoctraButton variant="ghost" onClick={() => navigate("/app/twin")}>
            <Zap size={13} /> Ask Product Twin
          </NoctraButton>
        </div>
      </div>
    </AppShell>
  );
}
