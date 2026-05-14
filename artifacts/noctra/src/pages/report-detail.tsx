import { useEffect, useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { Panel, Badge, EmptyState, NoctraButton } from "@/components/Primitives";
import { ReportRenderer } from "@/components/reports/ReportRenderer";
import {
  getReport, deleteReport, getTasks, getProjects, getProofSignals,
  getReports, linkReportToProject, createProject, saveReport,
} from "@/lib/repository";
import {
  downloadMarkdown, downloadJson, reportToMarkdown, reportToSummary,
  copyText, tasksToGithubMarkdown,
} from "@/lib/export";
import { generateTasksFromReport, generateSprintFromTasks } from "@/lib/task-generator";
import { generatePromptPackFromReport, exportPromptPackToMarkdown } from "@/lib/prompt-pack";
import { generateDevAgentPrompt } from "@/lib/brief-generator";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import { getReportNextActions } from "@/lib/next-action";
import { analyzeMonetization } from "@/lib/monetization";
import { analyzeRetention } from "@/lib/retention";
import { callStructuredAI } from "@/lib/ai";
import type { ReportSummary } from "@/lib/intelligence";
import {
  ArrowLeft, Trash2, Download, FileText, Loader2, Calendar,
  Zap, Link2, AlertTriangle, ArrowRight, FolderOpen,
  Copy, CheckCheck, Package, Plus, X, Check, Layers,
  ClipboardList, Rocket, Github, DollarSign, RefreshCw,
  TrendingUp, ShieldAlert, BarChart3,
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
  sprint: "var(--noctra-cyan)",
  "prompt-pack": "var(--noctra-violet)",
};

function scoreLabel(score: number): string {
  if (score >= 80) return "Strong";
  if (score >= 65) return "Good";
  if (score >= 50) return "Fair";
  if (score >= 35) return "Weak";
  return "Critical";
}

function buildContextFromReport(report: Report): string {
  const p = (report.payload as Record<string, unknown>) ?? {};
  const data = (p?.data as Record<string, unknown>) ?? {};
  const parts: string[] = [];
  if (report.title) parts.push(`Title: ${report.title}`);
  if (report.summary) parts.push(`Summary: ${report.summary}`);
  if (p?.input) parts.push(`Input: ${String(p.input)}`);
  Object.entries(data).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      parts.push(`${k}: ${typeof v === "object" ? JSON.stringify(v).slice(0, 500) : String(v)}`);
    }
  });
  return parts.join("\n");
}

function getPayloadData<T>(report: Report): T | null {
  if (!report.payload) return null;
  const p = report.payload as Record<string, unknown>;
  return (p?.data as T | null) ?? null;
}

function sprintToMarkdown(sprint: Record<string, unknown>): string {
  const days = (sprint?.days as Array<Record<string, unknown>>) ?? [];
  const lines = [`# ${String(sprint?.title ?? "Sprint Plan")}`, ""];
  days.forEach((d) => {
    lines.push(`## ${String(d?.day ?? "Day")}`);
    if (d?.goal) lines.push(`Goal: ${String(d.goal)}`);
    if (d?.tasks) {
      const tasks = d.tasks as string[];
      tasks.forEach((t, i) => lines.push(`${i + 1}. ${t}`));
    }
    lines.push("");
  });
  const risks = sprint?.risks as string[] ?? [];
  if (risks.length > 0) {
    lines.push("## Risks");
    risks.forEach((r) => lines.push(`- ${r}`));
    lines.push("");
  }
  const demo = sprint?.demo_checklist as string[] ?? [];
  if (demo.length > 0) {
    lines.push("## Demo Checklist");
    demo.forEach((d) => lines.push(`- [ ] ${d}`));
    lines.push("");
  }
  return lines.join("\n");
}

function promptPackToMarkdown(pack: Record<string, unknown>): string {
  const prompts = (pack?.prompts as Array<Record<string, unknown>>) ?? [];
  const lines = [`# ${String(pack?.title ?? "Prompt Pack")}`, ""];
  if (pack?.description) lines.push(`${String(pack.description)}`, "");
  prompts.forEach((p) => {
    lines.push(`## ${String(p?.phase ?? "Phase")}: ${String(p?.prompt ?? "").slice(0, 80)}`);
    lines.push(`**Tool:** ${String(p?.tool ?? "AI")}`);
    if (p?.estimated_time) lines.push(`**Time:** ${String(p.estimated_time)}`);
    if (p?.difficulty) lines.push(`**Difficulty:** ${String(p.difficulty)}`);
    lines.push("");
    lines.push(String(p?.prompt ?? ""));
    lines.push("");
    const ac = p?.acceptance_criteria as string[] ?? [];
    if (ac.length > 0) {
      ac.forEach((c) => lines.push(`- [ ] ${c}`));
      lines.push("");
    }
  });
  return lines.join("\n");
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

// ─── Main Page ──────────────────────────────────────────────────────────────

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
  const [generatingReality, setGeneratingReality] = useState(false);
  const [generatingSwarm, setGeneratingSwarm] = useState(false);
  const [generatingMvp, setGeneratingMvp] = useState(false);
  const [generatingProof, setGeneratingProof] = useState(false);
  const [generatingLaunch, setGeneratingLaunch] = useState(false);
  const [applyingPatch, setApplyingPatch] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linking, setLinking] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [summaryCopied, setSummaryCopied] = useState(false);

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

  // ── AI report generation ───────────────────────────────────────────────────

  async function generateChildReport(targetTool: string, context: string) {
    if (!report) return null;
    try {
      const result = await callStructuredAI(targetTool, context);
      const saved = await saveReport({
        tool: result.tool ?? targetTool,
        title: result.title || `${targetTool.charAt(0).toUpperCase() + targetTool.slice(1)} Report`,
        payload: { ...result, input: context },
        score: result.score ?? undefined,
        summary: result.summary ?? undefined,
        projectId: report.project_id ?? undefined,
      });
      return (saved as unknown as { id: string }) ?? null;
    } catch (err) {
      toast({
        title: `Failed to generate ${targetTool} report`,
        description: err instanceof Error ? err.message : "Unexpected error.",
        variant: "destructive",
      });
      return null;
    }
  }

  // ── Tool-specific action dispatch ──────────────────────────────────────────

  type ToolAction = { id: string; label: string; description: string; icon: React.ElementType; color?: string; busy?: boolean };

  function getToolActions(): ToolAction[] {
    if (!report) return [];
    switch (report.tool) {
      case "idea":
        return [
          { id: "gen-reality", label: "Generate Reality Report", description: "Reality-check every assumption in this idea", icon: Zap, color: "var(--noctra-amber)", busy: generatingReality },
          { id: "gen-swarm", label: "Generate Market Swarm Report", description: "Simulate market demand with AI personas", icon: Layers, color: "var(--noctra-cyan)", busy: generatingSwarm },
          { id: "gen-mvp", label: "Generate MVP Report", description: "Plan your build based on this idea", icon: Rocket, color: "var(--noctra-violet)", busy: generatingMvp },
          { id: "gen-proof", label: "Generate Proof Report", description: "Validate assumptions with evidence", icon: Zap, color: "var(--noctra-emerald)", busy: generatingProof },
        ];
      case "reality": {
        const data = getPayloadData<Record<string, unknown>>(report) ?? {};
        const hasPatch = !!(data?.patched_idea || data?.patched_idea_description);
        return [
          ...(hasPatch ? [{ id: "apply-patch", label: "Apply Patch", description: "Create a new idea report from patched idea", icon: Zap, color: "var(--noctra-emerald)", busy: applyingPatch }] : []),
          { id: "gen-tasks", label: "Generate Tasks from Errors", description: "Turn red flags into actionable fix tasks", icon: ClipboardList, color: "var(--noctra-rose)", busy: generatingTasks },
        ];
      }
      case "swarm":
        return [
          { id: "gen-mvp", label: "Generate MVP Report", description: "Turn swarm insights into a build plan", icon: Rocket, color: "var(--noctra-violet)", busy: generatingMvp },
          { id: "gen-tasks", label: "Generate Proof Experiments / Tasks", description: "Design experiments addressing objections", icon: Zap, color: "var(--noctra-emerald)", busy: generatingTasks },
        ];
      case "mvp":
        return [
          { id: "gen-tasks", label: "Generate Tasks", description: "Break MVP plan into execution tasks", icon: ClipboardList, color: "var(--noctra-cyan)", busy: generatingTasks },
          { id: "gen-sprint", label: "Generate Sprint", description: "Turn tasks into a sprint plan", icon: Calendar, color: "var(--noctra-violet)", busy: generatingTasks },
          { id: "gen-prompt-pack", label: "Generate Prompt Pack", description: "Export Replit/Cursor/Windsurf prompts", icon: Package, color: "var(--noctra-violet)", busy: generatingPack },
          { id: "export-prd", label: "Export PRD", description: "Download a product requirements document", icon: FileText },
          { id: "export-github", label: "Export GitHub Issues", description: "Download features as GitHub issue markdown", icon: Github },
        ];
      case "doctor":
        return [
          { id: "gen-tasks", label: "Generate Fix Tasks", description: "Turn blockers into high-priority tasks", icon: ClipboardList, color: "var(--noctra-rose)", busy: generatingTasks },
          { id: "gen-prompt-pack", label: "Generate Prompt Pack", description: "Export Replit/Cursor/Windsurf fix prompts", icon: Package, color: "var(--noctra-violet)", busy: generatingPack },
          { id: "copy-doctor-prompt", label: "Copy Next Build Prompt", description: "Copy diagnostic prompt for Codex/Replit/Cursor", icon: Copy, color: "var(--noctra-cyan)" },
          { id: "export-fix-plan", label: "Export Fix Plan", description: "Download a structured doctor fix plan", icon: FileText, color: "var(--noctra-rose)" },
          { id: "gen-launch-blockers", label: "Create Launch Blocker Tasks", description: "Generate tasks specifically for RED gates", icon: ShieldAlert, color: "var(--noctra-rose)", busy: generatingTasks },
          { id: "gen-launch", label: "Generate Launch Report", description: "Create launch readiness report", icon: Rocket, color: "var(--noctra-amber)", busy: generatingLaunch },
        ];
      case "launch":
        return [
          { id: "gen-tasks", label: "Generate Launch Tasks", description: "Turn launch plan into a sprint queue", icon: ClipboardList, color: "var(--noctra-amber)", busy: generatingTasks },
          { id: "export-launch-pack", label: "Export Launch Pack", description: "Download complete launch plan as markdown", icon: Rocket, color: "var(--noctra-amber)" },
        ];
      case "sprint":
        return [
          { id: "copy-sprint", label: "Copy Sprint Plan", description: "Copy sprint plan to clipboard", icon: Copy },
          { id: "download-sprint", label: "Download Sprint Markdown", description: "Download sprint plan as markdown", icon: Download },
        ];
      case "prompt-pack":
        return [
          { id: "copy-pack", label: "Copy All Prompts", description: "Copy entire prompt pack to clipboard", icon: Copy },
          { id: "download-pack", label: "Download Prompt Pack", description: "Download prompt pack as markdown", icon: Download },
        ];
      default:
        return [];
    }
  }

  async function handleToolAction(actionId: string) {
    if (!report) return;
    switch (actionId) {
      case "gen-reality": {
        setGeneratingReality(true);
        try {
          const saved = await generateChildReport("reality", buildContextFromReport(report));
          if (saved?.id) { toast({ title: "Reality Report generated", description: "Navigating..." }); navigate(`/app/reports/${saved.id}`); }
        } finally { setGeneratingReality(false); }
        break;
      }
      case "gen-swarm": {
        setGeneratingSwarm(true);
        try {
          const saved = await generateChildReport("swarm", buildContextFromReport(report));
          if (saved?.id) { toast({ title: "Market Swarm Report generated", description: "Navigating..." }); navigate(`/app/reports/${saved.id}`); }
        } finally { setGeneratingSwarm(false); }
        break;
      }
      case "gen-mvp": {
        setGeneratingMvp(true);
        try {
          const context = buildContextFromReport(report);
          const saved = await generateChildReport("mvp", context);
          if (saved?.id) { toast({ title: "MVP Report generated", description: "Navigating..." }); navigate(`/app/reports/${saved.id}`); }
        } finally { setGeneratingMvp(false); }
        break;
      }
      case "gen-proof": {
        setGeneratingProof(true);
        try {
          const saved = await generateChildReport("proof", buildContextFromReport(report));
          if (saved?.id) { toast({ title: "Proof Report generated", description: "Navigating..." }); navigate(`/app/reports/${saved.id}`); }
        } finally { setGeneratingProof(false); }
        break;
      }
      case "gen-launch": {
        setGeneratingLaunch(true);
        try {
          const saved = await generateChildReport("launch", buildContextFromReport(report));
          if (saved?.id) { toast({ title: "Launch Report generated", description: "Navigating..." }); navigate(`/app/reports/${saved.id}`); }
        } finally { setGeneratingLaunch(false); }
        break;
      }
      case "apply-patch": {
        setApplyingPatch(true);
        try {
          const data = getPayloadData<Record<string, unknown>>(report) ?? {};
          const patchedIdea = data?.patched_idea ?? data?.patched_idea_description;
          if (!patchedIdea) {
            toast({ title: "No patched idea found", description: "This reality report contains no patched_idea.", variant: "destructive" });
            return;
          }
          const saved = await saveReport({
            tool: "idea",
            title: "Patched Idea",
            payload: { data: { patched_idea: patchedIdea, product_patch: data?.product_patch, source_reality_report_id: report.id } },
            summary: `Patched from reality: ${String(patchedIdea).slice(0, 120)}...`,
            projectId: report.project_id ?? undefined,
          });
          const sid = (saved as unknown as { id?: string })?.id;
          if (sid) { toast({ title: "Patched Idea created", description: "Navigating..." }); navigate(`/app/reports/${sid}`); }
        } catch (err) {
          toast({ title: "Failed to apply patch", description: err instanceof Error ? err.message : "Unexpected error.", variant: "destructive" });
        } finally { setApplyingPatch(false); }
        break;
      }
      case "gen-tasks": {
        const data = getPayloadData<Record<string, unknown>>(report) ?? {};
        let rawTasks: string[] = [];
        if (report.tool === "reality") {
          rawTasks = [
            ...(data?.errors as string[] ?? []), ...(data?.warnings as string[] ?? []),
            ...(data?.product_patch as string[] ?? []),
            ...(data?.decisive_move ? [String(data.decisive_move)] : []),
          ];
        } else if (report.tool === "swarm") {
          rawTasks = [
            ...(data?.next_experiments as string[] ?? []), ...(data?.top_objection as string[] ?? []),
            ...(data?.objection_heatmap as string[] ?? []), ...(data?.feature_demand as string[] ?? []),
          ];
        } else if (report.tool === "mvp") {
          const scope = data?.ruthless_scope as { build_now?: string[] } ?? {};
          rawTasks = [
            ...(scope?.build_now ?? (data?.next_actions as string[] ?? [])),
            ...(data?.weekly_build_plan as string[] ?? []), ...(data?.milestones as string[] ?? []),
          ];
          if (data?.architecture) rawTasks.push(String(data.architecture));
          if (data?.api_contract) rawTasks.push(String(data.api_contract));
          if (data?.testing_plan) rawTasks.push(String(data.testing_plan));
        } else if (report.tool === "doctor") {
          rawTasks = [
            ...(data?.red_gates as string[] ?? []), ...(data?.yellow_gates as string[] ?? []),
            ...(data?.issues as string[] ?? []), ...(data?.repair_queue as string[] ?? []),
            ...(data?.security_findings as string[] ?? []), ...(data?.testing_gaps as string[] ?? []),
            ...(data?.deployment_gaps as string[] ?? []),
          ];
        } else if (report.tool === "launch") {
          rawTasks = [
            ...(data?.checklist as string[] ?? []), ...(data?.risks as string[] ?? []),
            ...(data?.copy as string[] ?? []), ...(data?.channels as string[] ?? []),
            ...(data?.analytics_plan as string[] ?? []),
          ];
        } else {
          await handleGenerateTasks();
          return;
        }
        if (rawTasks.length === 0) {
          toast({ title: "No tasks to generate", description: "No structured data found for task creation.", variant: "destructive" });
          return;
        }
        setGeneratingTasks(true);
        try {
          const count = await generateTasksFromReport({
            id: report.id, tool: report.tool,
            payload: { data: { task_list: rawTasks }, synthetic: true },
            project_id: report.project_id,
          });
          toast({ title: `${count} task${count !== 1 ? "s" : ""} created`, description: "View them in Tasks." });
        } catch (err) {
          toast({ title: "Failed to generate tasks", description: err instanceof Error ? err.message : "Unexpected error.", variant: "destructive" });
        } finally { setGeneratingTasks(false); }
        break;
      }
      case "gen-sprint": {
        setGeneratingTasks(true);
        try {
          const data = getPayloadData<Record<string, unknown>>(report) ?? {};
          const scope = data?.ruthless_scope as { build_now?: string[] } ?? {};
          const features = scope?.build_now ?? (data?.next_actions as string[] ?? []);
          if (features.length === 0) {
            toast({ title: "No features found", description: "Cannot generate sprint without build features.", variant: "destructive" });
            return;
          }
          const tasks = features.map((title, idx) => ({
            id: `sprint-${idx}-${Date.now()}`,
            title: String(title), priority: "high" as const, category: "mvp",
            acceptance_criteria: ["Implement as described"],
            source_report_id: report.id, project_id: report.project_id ?? null,
            created_at: new Date().toISOString(),
          }));
          const sprint = generateSprintFromTasks(tasks, { title: `Sprint: ${report.title}` });
          const saved = await saveReport({
            tool: "sprint", title: sprint.title,
            payload: { ...sprint, source_report_id: report.id },
            projectId: report.project_id ?? undefined,
          });
          const sid = (saved as unknown as { id?: string })?.id;
          if (sid) {
            toast({ title: "Sprint generated and saved!", description: "Navigating to sprint report." });
            navigate(`/app/reports/${sid}`);
          } else {
            const md = sprintToMarkdown(sprint as unknown as Record<string, unknown>);
            downloadMarkdown(`${report.title.replace(/\s+/g, "-").toLowerCase()}-sprint`, md);
            toast({ title: "Sprint downloaded", description: "Could not save as report — downloaded as markdown." });
          }
        } catch (err) {
          toast({ title: "Failed to generate sprint", description: err instanceof Error ? err.message : "Unexpected error.", variant: "destructive" });
        } finally { setGeneratingTasks(false); }
        break;
      }
      case "gen-prompt-pack": {
        setGeneratingPack(true);
        try {
          const pack = generatePromptPackFromReport(report, "Replit");
          const md = exportPromptPackToMarkdown(pack);
          const saved = await saveReport({
            tool: "prompt-pack", title: `Prompt Pack: ${report.title}`,
            payload: { ...pack, source_report_id: report.id },
            projectId: report.project_id ?? undefined,
          });
          const sid = (saved as unknown as { id?: string })?.id;
          if (sid) {
            toast({ title: "Prompt Pack saved!", description: "Navigating to prompt pack report." });
            navigate(`/app/reports/${sid}`);
          } else {
            downloadMarkdown(`${report.title.replace(/\s+/g, "-").toLowerCase()}-prompt-pack`, md);
            toast({ title: "Prompt Pack downloaded", description: "Could not save as report — downloaded as markdown." });
          }
        } catch (err) {
          toast({ title: "Failed to generate prompt pack", description: err instanceof Error ? err.message : "Unexpected error.", variant: "destructive" });
        } finally { setGeneratingPack(false); }
        break;
      }
      case "copy-doctor-prompt": {
        if (!report) break;
        const p = report.payload as Record<string, unknown>;
        const data = ((p?.data ?? p) ?? {}) as Record<string, unknown>;
        const prompt = generateDevAgentPrompt({
          project: { name: report.title, idea: report.summary },
          state: {
            phase: "launch-prep",
            readiness: (data.launch_readiness_score as number) ?? (report.score ?? 0),
            doctorScore: report.score ?? 0,
            failedGates: Array.isArray(data.red_gates) ? (data.red_gates as string[]) : [],
            topBlocker: (data.top_blocker as string) ?? null,
            nextAction: { title: (data.recommended_action as string) ?? "Fix launch blockers", href: "/app/tasks", reason: "", description: "", priority: "high", tool: "doctor" },
            ideaScore: 0, realityScore: 0, proofScore: 0, swarmScore: 0, mvpScore: 0, launchScore: 0,
            overallScore: 0, coveredTools: [], missingTools: [], openP0Tasks: 0, openP1Tasks: 0,
            latestReportByTool: {}, proofSignalCount: 0, scanCount: 0, totalReports: 0,
            totalTasks: 0, completedTasks: 0, taskCompletionRate: 0,
          },
          tasks: [],
          doctorPayload: report.payload,
        });
        try {
          await navigator.clipboard.writeText(prompt);
          toast({ title: "Next Build Prompt copied", description: "Paste into Codex, Replit Agent, Cursor, or Windsurf." });
        } catch {
          downloadMarkdown(`${report.title.replace(/\s+/g, "-").toLowerCase()}-build-prompt`, prompt);
          toast({ title: "Prompt downloaded", description: "Clipboard unavailable — saved as .md file." });
        }
        break;
      }
      case "gen-launch-blockers": {
        if (!report) break;
        const p = report.payload as Record<string, unknown>;
        const data = ((p?.data ?? p) ?? {}) as Record<string, unknown>;
        const redGateNames: string[] = [];
        const gatesData = (data.gates ?? data.launch_gates ?? []) as Array<Record<string, unknown>>;
        for (const g of gatesData) {
          if (String(g.status ?? "").toLowerCase() === "red") {
            redGateNames.push(String(g.name ?? g.gate ?? "Unknown gate"));
          }
        }
        const redStrings = (data.red_gates as string[] ?? []).filter(s => typeof s === "string");
        const allBlockers = [...new Set([...redGateNames, ...redStrings])].slice(0, 8);
        if (allBlockers.length === 0) {
          toast({ title: "No RED gates found", description: "No launch blockers to create tasks for.", variant: "destructive" });
          return;
        }
        setGeneratingTasks(true);
        try {
          const count = await generateTasksFromReport({
            id: report.id, tool: "doctor",
            payload: { data: { red_gates: allBlockers, issues: allBlockers.map((b: string) => ({ issue: b, severity: "HIGH", fix: `Resolve: ${b}` })) } },
            project_id: report.project_id,
          });
          toast({ title: `${count} blocker task${count !== 1 ? "s" : ""} created`, description: "Added to Task Queue." });
        } catch (err) {
          toast({ title: "Failed to create blocker tasks", description: err instanceof Error ? err.message : "Unexpected error.", variant: "destructive" });
        } finally { setGeneratingTasks(false); }
        break;
      }
      case "export-prd": handleExportPRD(); break;
      case "export-github": handleExportGitHubIssues(); break;
      case "export-fix-plan": handleExportFixPlan(); break;
      case "export-launch-pack": handleExportLaunchPack(); break;
      case "copy-sprint": {
        await copyText(sprintToMarkdown((report.payload as Record<string, unknown>) ?? {}));
        toast({ title: "Sprint plan copied" });
        break;
      }
      case "download-sprint": {
        downloadMarkdown(`${report.title.replace(/\s+/g, "-").toLowerCase()}-sprint`,
          sprintToMarkdown((report.payload as Record<string, unknown>) ?? {}));
        break;
      }
      case "copy-pack": {
        await copyText(promptPackToMarkdown((report.payload as Record<string, unknown>) ?? {}));
        toast({ title: "Prompt pack copied" });
        break;
      }
      case "download-pack": {
        downloadMarkdown(`${report.title.replace(/\s+/g, "-").toLowerCase()}-prompt-pack`,
          promptPackToMarkdown((report.payload as Record<string, unknown>) ?? {}));
        break;
      }
    }
  }

  // ── Intelligence panels ────────────────────────────────────────────────────

  const monetization = useMemo(() => {
    if (!report || !["idea", "mvp", "swarm", "reality"].includes(report.tool)) return null;
    const base = report as unknown as ReportSummary;
    return analyzeMonetization(reportsList.length > 0 ? reportsList : [base]);
  }, [report, reportsList]);

  const retention = useMemo(() => {
    if (!report || !["idea", "mvp", "swarm"].includes(report.tool)) return null;
    const base = report as unknown as ReportSummary;
    return analyzeRetention(reportsList.length > 0 ? reportsList : [base]);
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

  // ── Action categorization ──────────────────────────────────────────────────
  const continueWorkflowIds = new Set(["gen-reality", "gen-swarm", "gen-mvp", "gen-proof", "gen-launch", "apply-patch"]);
  const createExecutionIds = new Set(["gen-tasks", "gen-sprint", "gen-prompt-pack"]);
  const exportShareIds = new Set(["export-prd", "export-github", "export-fix-plan", "export-launch-pack", "copy-sprint", "download-sprint", "copy-pack", "download-pack"]);

  const continueWorkflowActions = toolActions.filter((a) => continueWorkflowIds.has(a.id));
  const createExecutionActions = toolActions.filter((a) => createExecutionIds.has(a.id));
  const exportShareActions = toolActions.filter((a) => exportShareIds.has(a.id));

  // Distribute next actions into groups
  const toolHrefs = new Set(["/app/reality", "/app/swarm", "/app/mvp", "/app/proof", "/app/doctor", "/app/launch", "/app/idea", "/app/twin", "/app/passport", "/app/reports"]);
  const workflowNextActions = nextActions.filter((na) => [...toolHrefs].some((h) => na.href.startsWith(h)));
  const executionNextActions = nextActions.filter((na) => na.href === "/app/tasks" || na.href.startsWith("/app/tasks/"));
  const manageNextActions = nextActions.filter((na) => na.href.startsWith("/app/projects"));

  function renderActionButton(action: ToolAction) {
    return (
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
    );
  }

  function renderNextActionButton(na: typeof nextActions[number]) {
    const naTool = TOOL_BY_KEY[na.tool as keyof typeof TOOL_BY_KEY];
    return (
      <button
        key={na.href + na.title}
        onClick={() => navigate(na.href)}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all hover:opacity-90"
        style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}
      >
        {naTool ? (
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${naTool.accent}18`, border: `1px solid ${naTool.accent}25` }}>
            <naTool.icon size={12} style={{ color: naTool.accent }} />
          </div>
        ) : null}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium" style={{ color: "var(--noctra-text)" }}>{na.title}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{na.description}</p>
        </div>
        <ArrowRight size={11} style={{ color: "var(--noctra-text-muted)", flexShrink: 0 }} />
      </button>
    );
  }

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
        {/* ─── Top bar ─────────────────────────────────────────────────────── */}
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

        {/* ─── Header ─────────────────────────────────────────────────────── */}
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

        {/* ─── Report Content ─────────────────────────────────────────────── */}
        <Panel>
          <div className="p-1">
            <ReportRenderer report={report} />
          </div>
        </Panel>

        {/* ─── Monetization Panel ─────────────────────────────────────────── */}
        {monetization ? (
          <Panel>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={12} style={{ color: "var(--noctra-emerald)" }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Monetization Intelligence</p>
              <Badge style={{ background: `${SCORE_COLOR(monetization.monetizationScore)}18`, color: SCORE_COLOR(monetization.monetizationScore), marginLeft: "auto" }}>
                {monetization.monetizationScore}/100
              </Badge>
            </div>
            <div className="space-y-3 text-xs" style={{ color: "var(--noctra-text)" }}>
              <div className="flex gap-4 flex-wrap">
                <div>
                  <span className="font-semibold" style={{ color: "var(--noctra-text-muted)" }}>Model:</span> {monetization.bestModel}
                </div>
                <div>
                  <span className="font-semibold" style={{ color: "var(--noctra-text-muted)" }}>Strategy:</span> {monetization.paywallStrategy.slice(0, 80)}…
                </div>
              </div>
              <p className="italic" style={{ color: "var(--noctra-text-muted)" }}>{monetization.pricingRecommendation}</p>
            </div>
          </Panel>
        ) : null}

        {/* ─── Retention Panel ────────────────────────────────────────────── */}
        {retention ? (
          <Panel>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={12} style={{ color: "var(--noctra-cyan)" }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Retention Intelligence</p>
              <Badge style={{ background: `${SCORE_COLOR(retention.retentionScore)}18`, color: SCORE_COLOR(retention.retentionScore), marginLeft: "auto" }}>
                {retention.retentionScore}/100
              </Badge>
            </div>
            <div className="space-y-2 text-xs" style={{ color: "var(--noctra-text)" }}>
              <p><span className="font-semibold" style={{ color: "var(--noctra-text-muted)" }}>Habit:</span> {retention.coreHabit}</p>
              <p><span className="font-semibold" style={{ color: "var(--noctra-text-muted)" }}>Weakness:</span> {retention.loopWeakness.slice(0, 120)}</p>
            </div>
          </Panel>
        ) : null}

        {/* ─── Action Groups ─────────────────────────────────────────────── */}

        {/* Continue Workflow */}
        {continueWorkflowActions.length + workflowNextActions.length > 0 ? (
          <Panel>
            <div className="flex items-center gap-2 mb-3">
              <Rocket size={12} style={{ color: accentColor }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Continue Workflow</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {continueWorkflowActions.map(renderActionButton)}
              {workflowNextActions.map(renderNextActionButton)}
            </div>
          </Panel>
        ) : null}

        {/* Create Execution */}
        {createExecutionActions.length + executionNextActions.length > 0 ? (
          <Panel>
            <div className="flex items-center gap-2 mb-3">
              <Zap size={12} style={{ color: accentColor }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Create Execution</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {createExecutionActions.map(renderActionButton)}
              {executionNextActions.map(renderNextActionButton)}
            </div>
          </Panel>
        ) : null}

        {/* Export / Share */}
        <Panel>
          <div className="flex items-center gap-2 mb-3">
            <Download size={12} style={{ color: "var(--noctra-text-muted)" }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Export / Share</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Always-available */}
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
              <Download size={15} /> Download MD
            </button>
            <button
              onClick={handleDownloadJSON}
              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-medium hover:opacity-80"
              style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }}
            >
              <FileText size={15} /> Download JSON
            </button>
            {/* Tool-specific exports */}
            {exportShareActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleToolAction(action.id)}
                disabled={action.busy}
                className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-medium hover:opacity-80 disabled:opacity-50"
                style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }}
              >
                {action.busy ? <Loader2 size={15} className="animate-spin" /> : <action.icon size={15} />}
                {action.label}
              </button>
            ))}
          </div>
        </Panel>

        {/* Manage */}
        <Panel>
          <div className="flex items-center gap-2 mb-3">
            <Link2 size={12} style={{ color: "var(--noctra-text-muted)" }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Manage</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                <FolderOpen size={15} /> View Project
              </button>
            )}
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-medium hover:opacity-80"
              style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", color: "var(--noctra-rose)" }}
            >
              <Trash2 size={15} /> Delete
            </button>
            {manageNextActions.map(renderNextActionButton)}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
