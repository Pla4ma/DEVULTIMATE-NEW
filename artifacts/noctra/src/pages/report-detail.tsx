import { useEffect, useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { Panel, Badge, EmptyState, NoctraButton } from "@/components/Primitives";
import { ROUTES } from "@/lib/routes";
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
import type { ReportSummary } from "@/lib/report-utils";
import {
  ArrowLeft, Trash2, Download, FileText, Loader2, Calendar,
  Zap, Link2, AlertTriangle, ArrowRight, FolderOpen,
  Copy, CheckCheck, Package, Plus, X, Check,
  ClipboardList, Rocket, DollarSign, TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ObsidianButton } from "@/components/ObsidianButton";
import { LinkProjectModal } from "./report-detail/LinkProjectModal";
import { SCORE_COLOR, TOOL_ACCENT, type Report, type Project, type ToolAction } from "./report-detail/types";
import { scoreLabel, buildContextFromReport, getPayloadData, sprintToMarkdown, promptPackToMarkdown } from "./report-detail/utils";

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
  const [generatingAction, setGeneratingAction] = useState<string | null>(null);
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
    Promise.all([getReport(id), getTasks(), getProjects(), getProofSignals(), getReports()])
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
  const accentColor = TOOL_ACCENT[report?.tool ?? ""] ?? "#f97316";
  const linkedProject = projects.find((p) => p.id === report?.project_id);

  async function handleDelete() {
    if (!report) return;
    setDeleting(true);
    try { await deleteReport(report.id); navigate(ROUTES.reports); }
    catch (err) { setDeleting(false); setConfirmDelete(false); toast({ title: "Failed to delete report", description: err instanceof Error ? err.message : "Unexpected error.", variant: "destructive" }); }
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
    try { await copyText(report.summary ?? reportToSummary(report)); setSummaryCopied(true); setTimeout(() => setSummaryCopied(false), 2000); }
    catch { toast({ title: "Copy failed", description: "Could not access clipboard.", variant: "destructive" }); }
  }

  async function handleGenerateTasks() {
    if (!report) return;
    setGeneratingAction("tasks");
    try {
      const count = await generateTasksFromReport({ id: report.id, tool: report.tool, payload: report.payload, project_id: report.project_id });
      if (count > 0) toast({ title: `${count} task${count !== 1 ? "s" : ""} created`, description: "View them in Tasks." });
      else toast({ title: "No tasks generated", description: "Not enough structured data in this report.", variant: "destructive" });
    } catch (err) { toast({ title: "Failed to generate tasks", description: err instanceof Error ? err.message : "Unexpected error.", variant: "destructive" }); }
    finally { setGeneratingAction(null); }
  }

  async function handleGeneratePromptPack() {
    if (!report) return;
    setGeneratingAction("pack");
    try {
      const pack = generatePromptPackFromReport(report, "Replit");
      const md = exportPromptPackToMarkdown(pack);
      downloadMarkdown(`${report.title.replace(/\s+/g, "-").toLowerCase()}-prompt-pack`, md);
      toast({ title: "Prompt pack downloaded", description: `${pack.prompts.length} prompt${pack.prompts.length !== 1 ? "s" : ""} exported.` });
    } catch (err) { toast({ title: "Failed to generate prompt pack", description: err instanceof Error ? err.message : "Unexpected error.", variant: "destructive" }); }
    finally { setGeneratingAction(null); }
  }

  async function handleLinkToProject(projectId: string | null) {
    if (!report) return;
    setLinking(true);
    try {
      await linkReportToProject(report.id, projectId);
      setReport((prev) => prev ? { ...prev, project_id: projectId } : prev);
      setShowLinkModal(false);
      toast({ title: projectId ? "Report linked" : "Report unlinked", description: projectId ? `Linked to "${projects.find((p) => p.id === projectId)?.name ?? "project"}".` : "Report unlinked from project." });
    } catch (err) { toast({ title: "Failed to link report", description: err instanceof Error ? err.message : "Unexpected error.", variant: "destructive" }); }
    finally { setLinking(false); }
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
      navigate(ROUTES.projectDetail(proj.id));
    } catch (err) { toast({ title: "Failed to create project", description: err instanceof Error ? err.message : "Unexpected error.", variant: "destructive" }); }
    finally { setCreatingProject(false); }
  }

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
      return (saved as { id: string }) ?? null;
    } catch (err) {
      toast({ title: `Failed to generate ${targetTool} report`, description: err instanceof Error ? err.message : "Unexpected error.", variant: "destructive" });
      return null;
    }
  }

  function getToolActions(): ToolAction[] {
    if (!report) return [];
    switch (report.tool) {
      case "idea":
        return [
{ id: "gen-reality", label: "Generate Reality Report", description: "Reality-check every assumption in this idea", icon: Zap, color: "#eab308", busy: generatingAction === "reality" },
      { id: "gen-swarm", label: "Generate Market Swarm Report", description: "Simulate market demand with AI personas", icon: Zap, color: "#f97316", busy: generatingAction === "swarm" },
      { id: "gen-mvp", label: "Generate MVP Report", description: "Plan your build based on this idea", icon: Rocket, color: "#8b5cf6", busy: generatingAction === "mvp" },
      { id: "gen-proof", label: "Generate Proof Report", description: "Validate assumptions with evidence", icon: Zap, color: "#22c55e", busy: generatingAction === "proof" },
        ];
      case "reality": {
        const data = getPayloadData<Record<string, unknown>>(report) ?? {};
        const hasPatch = !!(data?.patched_idea || data?.patched_idea_description);
        return [
          ...(hasPatch ? [{ id: "apply-patch", label: "Apply Patch", description: "Create a new idea report from patched idea", icon: Zap, color: "#22c55e", busy: applyingPatch }] : []),
          { id: "gen-tasks", label: "Generate Tasks from Errors", description: "Turn red flags into actionable fix tasks", icon: ClipboardList, color: "#ef4444", busy: generatingAction === "tasks" },
        ];
      }
      case "swarm":
        return [
{ id: "gen-mvp", label: "Generate MVP Report", description: "Turn swarm insights into a build plan", icon: Rocket, color: "#8b5cf6", busy: generatingAction === "mvp" },
      { id: "gen-tasks", label: "Generate Proof Experiments / Tasks", description: "Design experiments addressing objections", icon: Zap, color: "#22c55e", busy: generatingAction === "tasks" },
        ];
      case "mvp":
        return [
{ id: "gen-tasks", label: "Generate Tasks", description: "Break MVP plan into execution tasks", icon: ClipboardList, color: "#f97316", busy: generatingAction === "tasks" },
      { id: "gen-sprint", label: "Generate Sprint", description: "Turn tasks into a sprint plan", icon: Calendar, color: "#8b5cf6", busy: generatingAction === "tasks" },
      { id: "gen-prompt-pack", label: "Generate Prompt Pack", description: "Export Replit/Cursor/Windsurf prompts", icon: Package, color: "#8b5cf6", busy: generatingAction === "pack" },
          { id: "export-prd", label: "Export PRD", description: "Download a product requirements document", icon: FileText },
          { id: "export-github", label: "Export GitHub Issues", description: "Download features as GitHub issue markdown", icon: Package },
        ];
      case "doctor":
        return [
{ id: "gen-tasks", label: "Generate Fix Tasks", description: "Turn blockers into high-priority tasks", icon: ClipboardList, color: "#ef4444", busy: generatingAction === "tasks" },
      { id: "gen-prompt-pack", label: "Generate Prompt Pack", description: "Export Replit/Cursor/Windsurf fix prompts", icon: Package, color: "#8b5cf6", busy: generatingAction === "pack" },
          { id: "copy-doctor-prompt", label: "Copy Next Build Prompt", description: "Copy diagnostic prompt for Codex/Replit/Cursor", icon: Copy, color: "#f97316" },
          { id: "export-fix-plan", label: "Export Fix Plan", description: "Download a structured doctor fix plan", icon: FileText, color: "#ef4444" },
{ id: "gen-launch-blockers", label: "Create Launch Blocker Tasks", description: "Generate tasks specifically for RED gates", icon: ClipboardList, color: "#ef4444", busy: generatingAction === "tasks" },
      { id: "gen-launch", label: "Generate Launch Report", description: "Create launch readiness report", icon: Rocket, color: "#eab308", busy: generatingAction === "launch" },
        ];
      case "launch":
        return [
          { id: "gen-tasks", label: "Generate Launch Tasks", description: "Turn launch plan into a sprint queue", icon: ClipboardList, color: "#eab308", busy: generatingAction === "tasks" },
          { id: "export-launch-pack", label: "Export Launch Pack", description: "Download complete launch plan as markdown", icon: Rocket, color: "#eab308" },
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
      default: return [];
    }
  }

  async function handleToolAction(actionId: string) {
    if (!report) return;
    switch (actionId) {
      case "gen-reality": {
        setGeneratingAction("reality");
        try { const saved = await generateChildReport("reality", buildContextFromReport(report)); if (saved?.id) { toast({ title: "Reality Report generated", description: "Navigating..." }); navigate(ROUTES.reportDetail(saved.id)); } }
        finally { setGeneratingAction(null); }
        break;
      }
      case "gen-swarm": {
        setGeneratingAction("swarm");
        try { const saved = await generateChildReport("swarm", buildContextFromReport(report)); if (saved?.id) { toast({ title: "Market Swarm Report generated", description: "Navigating..." }); navigate(ROUTES.reportDetail(saved.id)); } }
        finally { setGeneratingAction(null); }
        break;
      }
      case "gen-mvp": {
        setGeneratingAction("mvp");
        try { const saved = await generateChildReport("mvp", buildContextFromReport(report)); if (saved?.id) { toast({ title: "MVP Report generated", description: "Navigating..." }); navigate(ROUTES.reportDetail(saved.id)); } }
        finally { setGeneratingAction(null); }
        break;
      }
      case "gen-proof": {
        setGeneratingAction("proof");
        try { const saved = await generateChildReport("proof", buildContextFromReport(report)); if (saved?.id) { toast({ title: "Proof Report generated", description: "Navigating..." }); navigate(ROUTES.reportDetail(saved.id)); } }
        finally { setGeneratingAction(null); }
        break;
      }
      case "gen-launch": {
        setGeneratingAction("launch");
        try { const saved = await generateChildReport("launch", buildContextFromReport(report)); if (saved?.id) { toast({ title: "Launch Report generated", description: "Navigating..." }); navigate(ROUTES.reportDetail(saved.id)); } }
        finally { setGeneratingAction(null); }
        break;
      }
      case "apply-patch": {
        setApplyingPatch(true);
        try {
          const data = getPayloadData<Record<string, unknown>>(report) ?? {};
          const patchedIdea = data?.patched_idea ?? data?.patched_idea_description;
          if (!patchedIdea) { toast({ title: "No patched idea found", description: "This reality report contains no patched_idea.", variant: "destructive" }); return; }
          const saved = await saveReport({
            tool: "idea", title: "Patched Idea",
            payload: { data: { patched_idea: patchedIdea, product_patch: data?.product_patch, source_reality_report_id: report.id } },
            summary: `Patched from reality: ${String(patchedIdea).slice(0, 120)}...`, projectId: report.project_id ?? undefined,
          });
          const sid = (saved as { id?: string })?.id;
          if (sid) { toast({ title: "Patched Idea created", description: "Navigating..." }); navigate(ROUTES.reportDetail(sid)); }
        } catch (err) { toast({ title: "Failed to apply patch", description: err instanceof Error ? err.message : "Unexpected error.", variant: "destructive" }); }
        finally { setApplyingPatch(false); }
        break;
      }
      case "gen-tasks": {
        const data = getPayloadData<Record<string, unknown>>(report) ?? {};
        let rawTasks: string[] = [];
        if (report.tool === "reality") { rawTasks = [...(data?.errors as string[] ?? []), ...(data?.warnings as string[] ?? []), ...(data?.product_patch as string[] ?? []), ...(data?.decisive_move ? [String(data.decisive_move)] : [])]; }
        else if (report.tool === "swarm") { rawTasks = [...(data?.next_experiments as string[] ?? []), ...(data?.top_objection as string[] ?? []), ...(data?.objection_heatmap as string[] ?? []), ...(data?.feature_demand as string[] ?? [])]; }
        else if (report.tool === "mvp") { const scope = data?.ruthless_scope as { build_now?: string[] } ?? {}; rawTasks = [...(scope?.build_now ?? (data?.next_actions as string[] ?? [])), ...(data?.weekly_build_plan as string[] ?? []), ...(data?.milestones as string[] ?? [])]; if (data?.architecture) rawTasks.push(String(data.architecture)); if (data?.api_contract) rawTasks.push(String(data.api_contract)); if (data?.testing_plan) rawTasks.push(String(data.testing_plan)); }
        else if (report.tool === "doctor") { rawTasks = [...(data?.red_gates as string[] ?? []), ...(data?.yellow_gates as string[] ?? []), ...(data?.issues as string[] ?? []), ...(data?.repair_queue as string[] ?? []), ...(data?.security_findings as string[] ?? []), ...(data?.testing_gaps as string[] ?? []), ...(data?.deployment_gaps as string[] ?? [])]; }
        else if (report.tool === "launch") { rawTasks = [...(data?.checklist as string[] ?? []), ...(data?.risks as string[] ?? []), ...(data?.copy as string[] ?? []), ...(data?.channels as string[] ?? []), ...(data?.analytics_plan as string[] ?? [])]; }
        else { await handleGenerateTasks(); return; }
        if (rawTasks.length === 0) { toast({ title: "No tasks to generate", description: "No structured data found for task creation.", variant: "destructive" }); return; }
        setGeneratingAction("tasks");
        try { const count = await generateTasksFromReport({ id: report.id, tool: report.tool, payload: { data: { task_list: rawTasks }, synthetic: true }, project_id: report.project_id }); toast({ title: `${count} task${count !== 1 ? "s" : ""} created`, description: "View them in Tasks." }); }
        catch (err) { toast({ title: "Failed to generate tasks", description: err instanceof Error ? err.message : "Unexpected error.", variant: "destructive" }); }
        finally { setGeneratingAction(null); }
        break;
      }
      case "gen-sprint": {
        setGeneratingAction("tasks");
        try {
          const data = getPayloadData<Record<string, unknown>>(report) ?? {};
          const scope = data?.ruthless_scope as { build_now?: string[] } ?? {};
          const features = scope?.build_now ?? (data?.next_actions as string[] ?? []);
          if (features.length === 0) { toast({ title: "No features found", description: "Cannot generate sprint without build features.", variant: "destructive" }); return; }
          const tasks = features.map((title, idx) => ({ id: `sprint-${idx}-${Date.now()}`, title: String(title), priority: "high" as const, category: "mvp", acceptance_criteria: ["Implement as described"], source_report_id: report.id, project_id: report.project_id ?? null, created_at: new Date().toISOString() }));
          const sprint = generateSprintFromTasks(tasks, { title: `Sprint: ${report.title}` });
          const saved = await saveReport({ tool: "sprint", title: sprint.title, payload: { ...sprint, source_report_id: report.id }, projectId: report.project_id ?? undefined });
          const sid = (saved as { id?: string })?.id;
          if (sid) { toast({ title: "Sprint generated and saved!", description: "Navigating to sprint report." }); navigate(ROUTES.reportDetail(sid)); }
          else { const md = sprintToMarkdown(sprint); downloadMarkdown(`${report.title.replace(/\s+/g, "-").toLowerCase()}-sprint`, md); toast({ title: "Sprint downloaded", description: "Could not save as report — downloaded as markdown." }); }
        } catch (err) { toast({ title: "Failed to generate sprint", description: err instanceof Error ? err.message : "Unexpected error.", variant: "destructive" }); }
        finally { setGeneratingAction(null); }
        break;
      }
      case "gen-prompt-pack": {
        setGeneratingAction("pack");
        try {
          const pack = generatePromptPackFromReport(report, "Replit");
          const md = exportPromptPackToMarkdown(pack);
          const saved = await saveReport({ tool: "prompt-pack", title: `Prompt Pack: ${report.title}`, payload: { ...pack, source_report_id: report.id }, projectId: report.project_id ?? undefined });
          const sid = (saved as { id?: string })?.id;
          if (sid) { toast({ title: "Prompt Pack saved!", description: "Navigating to prompt pack report." }); navigate(ROUTES.reportDetail(sid)); }
          else { downloadMarkdown(`${report.title.replace(/\s+/g, "-").toLowerCase()}-prompt-pack`, md); toast({ title: "Prompt Pack downloaded", description: "Could not save as report — downloaded as markdown." }); }
        } catch (err) { toast({ title: "Failed to generate prompt pack", description: err instanceof Error ? err.message : "Unexpected error.", variant: "destructive" }); }
        finally { setGeneratingAction(null); }
        break;
      }
      case "copy-doctor-prompt": {
        if (!report) break;
        const p = report.payload as Record<string, unknown>;
        const dpData = ((p?.data ?? p) ?? {}) as Record<string, unknown>;
        const prompt = generateDevAgentPrompt({
          project: { name: report.title, idea: report.summary },
          state: { stage: "FIXING", readiness: (dpData.launch_readiness_score as number) ?? (report.score ?? 0), doctorScore: report.score ?? 0, failedGates: Array.isArray(dpData.red_gates) ? (dpData.red_gates as string[]) : [], topBlocker: (dpData.top_blocker as string) ?? null, nextAction: { title: (dpData.recommended_action as string) ?? "Fix launch blockers", href: ROUTES.tasks, reason: "", description: "", priority: "high", tool: "doctor" }, ideaScore: 0, realityScore: 0, proofScore: 0, swarmScore: 0, mvpScore: 0, launchScore: 0, overallScore: 0, coveredTools: [], missingTools: [], openP0Tasks: 0, openP1Tasks: 0, latestReportByTool: {}, proofSignalCount: 0, scanCount: 0, totalReports: 0, totalTasks: 0, completedTasks: 0, taskCompletionRate: 0 },
          tasks: [], doctorPayload: report.payload,
        });
        try { await navigator.clipboard.writeText(prompt); toast({ title: "Next Build Prompt copied", description: "Paste into Codex, Replit Agent, Cursor, or Windsurf." }); }
        catch { downloadMarkdown(`${report.title.replace(/\s+/g, "-").toLowerCase()}-build-prompt`, prompt); toast({ title: "Prompt downloaded", description: "Clipboard unavailable — saved as .md file." }); }
        break;
      }
      case "gen-launch-blockers": {
        if (!report) break;
        const lbP = report.payload as Record<string, unknown>;
        const lbData = ((lbP?.data ?? lbP) ?? {}) as Record<string, unknown>;
        const redGateNames: string[] = [];
        const gatesData = (lbData.gates ?? lbData.launch_gates ?? []) as Array<Record<string, unknown>>;
        for (const g of gatesData) { if (String(g.status ?? "").toLowerCase() === "red") redGateNames.push(String(g.name ?? g.gate ?? "Unknown gate")); }
        const redStrings = (lbData.red_gates as string[] ?? []).filter(s => typeof s === "string");
        const allBlockers = [...new Set([...redGateNames, ...redStrings])].slice(0, 8);
        if (allBlockers.length === 0) { toast({ title: "No RED gates found", description: "No launch blockers to create tasks for.", variant: "destructive" }); return; }
        setGeneratingAction("tasks");
        try { const count = await generateTasksFromReport({ id: report.id, tool: "doctor", payload: { data: { red_gates: allBlockers, issues: allBlockers.map((b) => ({ issue: b, severity: "HIGH", fix: `Resolve: ${b}` })) } }, project_id: report.project_id }); toast({ title: `${count} blocker task${count !== 1 ? "s" : ""} created`, description: "Added to Task Queue." }); }
        catch (err) { toast({ title: "Failed to create blocker tasks", description: err instanceof Error ? err.message : "Unexpected error.", variant: "destructive" }); }
        finally { setGeneratingAction(null); }
        break;
      }
      case "export-prd": {
        if (!report) break;
        const md = `# PRD: ${report.title}\n\n${report.summary ? `## Overview\n${report.summary}\n\n` : ""}${reportToMarkdown(report)}`;
        downloadMarkdown(`${report.title.replace(/\s+/g, "-").toLowerCase()}-prd`, md);
        break;
      }
      case "export-github": {
        if (!report) break;
        const ghData = (report.payload as Record<string, unknown>)?.data as Record<string, unknown> | null;
        const scope = ghData?.ruthless_scope as { build_now?: string[] } | null;
        const features = scope?.build_now ?? (ghData?.next_actions as string[] | null) ?? [];
        const ghMd = tasksToGithubMarkdown(features.map((f) => ({ title: String(f), priority: "high", status: "todo" })));
        downloadMarkdown(`${report.title.replace(/\s+/g, "-").toLowerCase()}-github-issues`, ghMd);
        break;
      }
      case "export-fix-plan": {
        if (!report) break;
        const fpMd = `# Doctor Fix Plan: ${report.title}\n\n${report.summary ? `## Diagnosis Summary\n${report.summary}\n\n` : ""}${reportToMarkdown(report)}`;
        downloadMarkdown(`${report.title.replace(/\s+/g, "-").toLowerCase()}-fix-plan`, fpMd);
        break;
      }
      case "export-launch-pack": {
        if (!report) break;
        const lpMd = `# Launch Pack: ${report.title}\n\n${report.summary ? `## Launch Summary\n${report.summary}\n\n` : ""}${reportToMarkdown(report)}`;
        downloadMarkdown(`${report.title.replace(/\s+/g, "-").toLowerCase()}-launch-pack`, lpMd);
        break;
      }
      case "copy-sprint": {
        await copyText(sprintToMarkdown((report.payload as Record<string, unknown>) ?? {}));
        toast({ title: "Sprint plan copied" });
        break;
      }
      case "download-sprint": {
        downloadMarkdown(`${report.title.replace(/\s+/g, "-").toLowerCase()}-sprint`, sprintToMarkdown((report.payload as Record<string, unknown>) ?? {}));
        break;
      }
      case "copy-pack": {
        await copyText(promptPackToMarkdown((report.payload as Record<string, unknown>) ?? {}));
        toast({ title: "Prompt pack copied" });
        break;
      }
      case "download-pack": {
        downloadMarkdown(`${report.title.replace(/\s+/g, "-").toLowerCase()}-prompt-pack`, promptPackToMarkdown((report.payload as Record<string, unknown>) ?? {}));
        break;
      }
    }
  }

  const monetization = useMemo(() => {
    if (!report || !["idea", "mvp", "swarm", "reality"].includes(report.tool)) return null;
    const base = report as ReportSummary;
    return analyzeMonetization(reportsList.length > 0 ? reportsList : [base]);
  }, [report, reportsList]);

  const retention = useMemo(() => {
    if (!report || !["idea", "mvp", "swarm"].includes(report.tool)) return null;
    const base = report as ReportSummary;
    return analyzeRetention(reportsList.length > 0 ? reportsList : [base]);
  }, [report, reportsList]);

  if (loading) {
    return (<AppShell><div className="flex items-center justify-center h-64"><Loader2 size={24} className="animate-spin" style={{ color: "#f97316" }} /></div></AppShell>);
  }

  if (error || !report) {
    return (
      <AppShell>
        <div className="p-6 max-w-4xl mx-auto">
          <EmptyState icon={<AlertTriangle size={24} />} title="Report not found" body={error || "This report does not exist or you don't have access."} />
          <div className="flex justify-center mt-4"><ObsidianButton variant="ghost" onClick={() => navigate(ROUTES.reports)}><ArrowLeft size={14} /> Back to Reports</ObsidianButton></div>
        </div>
      </AppShell>
    );
  }

  const nextActions = getReportNextActions(report.tool, { id: report.id, score: report.score }, { hasTasks, hasProject, hasProof, hasSwarm, hasMvp, doctorScore });
  const toolActions = getToolActions();

  const continueWorkflowIds = new Set(["gen-reality", "gen-swarm", "gen-mvp", "gen-proof", "gen-launch", "apply-patch"]);
  const createExecutionIds = new Set(["gen-tasks", "gen-sprint", "gen-prompt-pack", "copy-doctor-prompt", "gen-launch-blockers"]);
  const exportShareIds = new Set(["export-prd", "export-github", "export-fix-plan", "export-launch-pack", "copy-sprint", "download-sprint", "copy-pack", "download-pack"]);

  const continueWorkflowActions = toolActions.filter((a) => continueWorkflowIds.has(a.id));
  const createExecutionActions = toolActions.filter((a) => createExecutionIds.has(a.id));
  const exportShareActions = toolActions.filter((a) => exportShareIds.has(a.id));

  const toolBasePaths = [ROUTES.codeHealth, ROUTES.ideaLab, ROUTES.build, ROUTES.brain];
  const workflowNextActions = nextActions.filter((na) => toolBasePaths.some((h) => na.href.startsWith(h)));
  const executionNextActions = nextActions.filter((na) => na.href.startsWith(ROUTES.build) && na.href.includes("tool=tasks"));
  const manageNextActions = nextActions.filter((na) => na.href.startsWith(ROUTES.brain) && na.href.includes("tool=projects"));

  function renderActionButton(action: ToolAction) {
    return (
      <button key={action.id} onClick={() => handleToolAction(action.id)} disabled={action.busy} className="glass flex items-center gap-3 px-3 py-2.5 text-left transition-all hover:opacity-80 disabled:opacity-50">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `color-mix(in srgb, ${action.color ?? accentColor} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${action.color ?? accentColor} 14%, transparent)` }}>
          {action.busy ? <Loader2 size={12} className="animate-spin" style={{ color: action.color ?? accentColor }} /> : <action.icon size={12} style={{ color: action.color ?? accentColor }} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium" style={{ color: "#fff" }}>{action.label}</p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{action.description}</p>
        </div>
        <ArrowRight size={11} style={{ color: "rgba(255,255,255,0.5)", flexShrink: 0 }} />
      </button>
    );
  }

  function renderNextActionButton(na: typeof nextActions[number]) {
    const naTool = TOOL_BY_KEY[na.tool as keyof typeof TOOL_BY_KEY];
    return (
      <button key={na.href + na.title} onClick={() => navigate(na.href)} className="glass flex items-center gap-3 px-3 py-2.5 text-left transition-all hover:opacity-90">
        {naTool ? <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `color-mix(in srgb, ${naTool.accent} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${naTool.accent} 14%, transparent)` }}><naTool.icon size={12} style={{ color: naTool.accent }} /></div> : null}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium" style={{ color: "#fff" }}>{na.title}</p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{na.description}</p>
        </div>
        <ArrowRight size={11} style={{ color: "rgba(255,255,255,0.5)", flexShrink: 0 }} />
      </button>
    );
  }

  return (
    <AppShell>
      {showLinkModal ? <LinkProjectModal projects={projects} currentProjectId={report.project_id} onLink={handleLinkToProject} onClose={() => setShowLinkModal(false)} linking={linking} /> : null}

      <div className="p-6 max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button onClick={() => navigate(ROUTES.reports)} className="flex items-center gap-1.5 text-sm hover:opacity-80" style={{ color: "rgba(255,255,255,0.5)" }}><ArrowLeft size={14} /> All Reports</button>
          <div className="flex items-center gap-2 flex-wrap">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "#ef4444" }}>Delete?</span>
                <ObsidianButton variant="ghost" onClick={handleDelete} disabled={deleting}>{deleting ? <Loader2 size={12} className="animate-spin" /> : "Yes, delete"}</ObsidianButton>
                <ObsidianButton variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</ObsidianButton>
              </div>
            ) : (
              <ObsidianButton variant="ghost" onClick={() => setConfirmDelete(true)}><Trash2 size={13} style={{ color: "#ef4444" }} /><span style={{ color: "#ef4444" }}>Delete</span></ObsidianButton>
            )}
          </div>
        </div>

        <Panel>
          <div className="flex items-start gap-4">
            {tool ? <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `color-mix(in srgb, ${tool.accent} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${tool.accent} 19%, transparent)` }}><tool.icon size={18} style={{ color: tool.accent }} /></div> : null}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {tool ? <Badge style={{ background: `color-mix(in srgb, ${tool.accent} 10%, transparent)`, color: tool.accent }}>{tool.label}</Badge> : null}
                {report.score != null ? <Badge style={{ background: `color-mix(in srgb, ${SCORE_COLOR(report.score)} 10%, transparent)`, color: SCORE_COLOR(report.score) }}>{scoreLabel(report.score)} — {report.score}/100</Badge> : null}
              </div>
              <h1 className="text-xl font-bold tracking-tight" style={{ color: "#fff" }}>{report.title}</h1>
              {report.summary ? <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>{report.summary}</p> : null}
              <div className="flex items-center gap-3 mt-2 text-xs flex-wrap" style={{ color: "rgba(255,255,255,0.5)" }}>
                <span className="flex items-center gap-1"><Calendar size={11} />{new Date(report.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                {linkedProject && report.project_id ? <button onClick={() => navigate(ROUTES.projectDetail(report.project_id!))} className="flex items-center gap-1 hover:opacity-80" style={{ color: "#f97316" }}><FolderOpen size={11} /> {linkedProject.name}</button> : null}
              </div>
            </div>
          </div>
        </Panel>

        <Panel><div className="p-1"><ReportRenderer report={report} /></div></Panel>

        {monetization ? (
          <Panel>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign size={12} style={{ color: "#22c55e" }} />
              <p className="eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>Monetization Intelligence</p>
              <Badge style={{ background: `color-mix(in srgb, ${SCORE_COLOR(monetization.monetizationScore)} 10%, transparent)`, color: SCORE_COLOR(monetization.monetizationScore), marginLeft: "auto" }}>{monetization.monetizationScore}/100</Badge>
            </div>
            <div className="space-y-3 text-xs" style={{ color: "#fff" }}>
              <div className="flex gap-4 flex-wrap"><div><span className="font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Model:</span> {monetization.bestModel}</div><div><span className="font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Strategy:</span> {monetization.paywallStrategy.slice(0, 80)}…</div></div>
              <p className="italic" style={{ color: "rgba(255,255,255,0.5)" }}>{monetization.pricingRecommendation}</p>
            </div>
          </Panel>
        ) : null}

        {retention ? (
          <Panel>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={12} style={{ color: "#f97316" }} />
              <p className="eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>Retention Intelligence</p>
              <Badge style={{ background: `color-mix(in srgb, ${SCORE_COLOR(retention.retentionScore)} 10%, transparent)`, color: SCORE_COLOR(retention.retentionScore), marginLeft: "auto" }}>{retention.retentionScore}/100</Badge>
            </div>
            <div className="space-y-2 text-xs" style={{ color: "#fff" }}>
              <p><span className="font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Habit:</span> {retention.coreHabit}</p>
              <p><span className="font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Weakness:</span> {retention.loopWeakness.slice(0, 120)}</p>
            </div>
          </Panel>
        ) : null}

        {continueWorkflowActions.length + workflowNextActions.length > 0 ? (
          <Panel>
            <div className="flex items-center gap-2 mb-3"><Rocket size={12} style={{ color: accentColor }} /><p className="eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>Continue Workflow</p></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{continueWorkflowActions.map(renderActionButton)}{workflowNextActions.map(renderNextActionButton)}</div>
          </Panel>
        ) : null}

        {createExecutionActions.length + executionNextActions.length > 0 ? (
          <Panel>
            <div className="flex items-center gap-2 mb-3"><Zap size={12} style={{ color: accentColor }} /><p className="eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>Create Execution</p></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{createExecutionActions.map(renderActionButton)}{executionNextActions.map(renderNextActionButton)}</div>
          </Panel>
        ) : null}

        <Panel>
          <div className="flex items-center gap-2 mb-3"><Download size={12} style={{ color: "rgba(255,255,255,0.5)" }} /><p className="eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>Export</p></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button onClick={handleCopySummary} className="glass flex flex-col items-center gap-1.5 px-3 py-3 text-xs font-medium hover:opacity-80" style={{ background: summaryCopied ? "var(--color-success-soft)" : "rgba(20, 18, 40, 0.5)", border: `1px solid ${summaryCopied ? "#22c55e" : "rgba(139, 92, 246, 0.12)"}`, color: summaryCopied ? "#22c55e" : "#fff" }}>
              {summaryCopied ? <CheckCheck size={15} /> : <Copy size={15} />}{summaryCopied ? "Copied!" : "Copy Summary"}
            </button>
            <button onClick={handleDownloadMD} className="glass flex flex-col items-center gap-1.5 px-3 py-3 text-xs font-medium hover:opacity-80"><Download size={15} /> Download MD</button>
            <button onClick={handleDownloadJSON} className="glass flex flex-col items-center gap-1.5 px-3 py-3 text-xs font-medium hover:opacity-80"><FileText size={15} /> Download JSON</button>
            {exportShareActions.map((action) => (
              <button key={action.id} onClick={() => handleToolAction(action.id)} disabled={action.busy} className="glass flex flex-col items-center gap-1.5 px-3 py-3 text-xs font-medium hover:opacity-80 disabled:opacity-50">
                {action.busy ? <Loader2 size={15} className="animate-spin" /> : <action.icon size={15} />}{action.label}
              </button>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center gap-2 mb-3"><Link2 size={12} style={{ color: "rgba(255,255,255,0.5)" }} /><p className="eyebrow" style={{ color: "rgba(255,255,255,0.5)" }}>Manage</p></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button onClick={() => setShowLinkModal(true)} className="glass flex flex-col items-center gap-1.5 px-3 py-3 text-xs font-medium hover:opacity-80" style={{ background: linkedProject ? "rgba(249, 115, 22, 0.06)" : "rgba(20, 18, 40, 0.5)", border: `1px solid ${linkedProject ? "rgba(249, 115, 22, 0.12)" : "rgba(139, 92, 246, 0.12)"}`, color: linkedProject ? "#f97316" : "#fff" }}><Link2 size={15} />{linkedProject ? "Relink" : "Link Project"}</button>
            {!report.project_id ? (
              <button onClick={handleCreateProject} disabled={creatingProject} className="glass flex flex-col items-center gap-1.5 px-3 py-3 text-xs font-medium hover:opacity-80 disabled:opacity-50" style={{ background: "var(--color-success-soft)", border: "1px solid var(--color-success-soft)", color: "#22c55e" }}>
                {creatingProject ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}{creatingProject ? "Creating…" : "New Project"}
              </button>
            ) : (
              <button onClick={() => report.project_id && navigate(ROUTES.projectDetail(report.project_id))} className="glass flex flex-col items-center gap-1.5 px-3 py-3 text-xs font-medium hover:opacity-80"><FolderOpen size={15} /> View Project</button>
            )}
            <button onClick={() => setConfirmDelete(true)} className="glass flex flex-col items-center gap-1.5 px-3 py-3 text-xs font-medium hover:opacity-80" style={{ background: "var(--color-danger-soft)", border: "1px solid var(--color-danger-soft)", color: "#ef4444" }}><Trash2 size={15} /> Delete</button>
            {manageNextActions.map(renderNextActionButton)}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
