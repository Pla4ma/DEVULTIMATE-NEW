import { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { Panel, Badge } from "@/components/Primitives";
import { getDashboardData, getReports, getProofSignals, getTasks, getProjects, createTask, saveTasks } from "@/lib/repository";
import { TOOL_BY_KEY, TOOLS } from "@/lib/noctra-tools";
import { useProgression } from "@/lib/progression-context";
import { MILESTONES } from "@/lib/progression";
import { computeNextAction, computePipeline } from "@/lib/next-action";
import { extractRisks, RISK_SEV_COLOR } from "@/lib/risk-radar";
import { buildTimeline, formatTimeAgo, TIMELINE_TYPE_COLOR } from "@/lib/timeline";
import { computeScoreHistory, getDeltaLabel, getDeltaColor } from "@/lib/score-history";
import {
  extractScoreTrends,
  computeToolCoverage,
  generateInsightBrief,
  type ScoreTrend,
  type ToolCoverage,
  type InsightBrief,
  type ReportSummary,
} from "@/lib/intelligence";
import { generateDailyBriefing, type DailyBriefing } from "@/lib/daily-briefing";
import { runContradictionEngine, type EnhancedContradiction } from "@/lib/contradiction-engine";
import { generateRoadmap, type Roadmap } from "@/lib/roadmap";
import { generateExecutionPackage, type ExecutionPackage } from "@/lib/execution-autopilot";
import { buildProductBrain, type ProductBrain } from "@/lib/product-brain";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, ArrowRight, FileText, CheckSquare, FolderOpen,
  Zap, AlertTriangle, TrendingUp, TrendingDown, Minus,
  Brain, ShieldOff, Clock,
  Target, Map, Terminal, Copy, Download, Plus,
  XCircle, CheckCircle, Info, Stethoscope, Lightbulb, Upload, Lock,
} from "lucide-react";

type DashData = Awaited<ReturnType<typeof getDashboardData>>;

const STATUS_COLORS = {
  "on-track": "var(--noctra-emerald)",
  "needs-attention": "var(--noctra-amber)",
  "critical": "var(--noctra-rose)",
};

const STATUS_LABELS = {
  "on-track": "On Track",
  "needs-attention": "Needs Attention",
  "critical": "Critical",
};

const TRAJECTORY_ICON = {
  improving: <TrendingUp size={12} />,
  stagnant: <Minus size={12} />,
  declining: <TrendingDown size={12} />,
};

const INTELLIGENCE_TOOL_KEYS = ["idea", "reality", "swarm", "proof", "mvp", "doctor", "launch"];

const SEV_COLOR: Record<string, string> = {
  critical: "var(--noctra-rose)",
  high: "var(--noctra-amber)",
  medium: "var(--noctra-cyan)",
  low: "var(--noctra-emerald)",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { reportCount, nextMilestone, progress } = useProgression();

  // Intelligence layer — computed client-side from all reports
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [insightBrief, setInsightBrief] = useState<InsightBrief | null>(null);
  const [trends, setTrends] = useState<ScoreTrend[]>([]);
  const [coverage, setCoverage] = useState<ToolCoverage | null>(null);

  // New intelligence layers
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [contradictions, setContradictions] = useState<EnhancedContradiction[]>([]);
  const [alignmentScore, setAlignmentScore] = useState<number | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [executionPkg, setExecutionPkg] = useState<ExecutionPackage | null>(null);
  const [brain, setBrain] = useState<ProductBrain | null>(null);

  // UI state
  const [showPrompt, setShowPrompt] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [creatingTasks, setCreatingTasks] = useState(false);
  const [activeRoadmapTab, setActiveRoadmapTab] = useState<"now" | "next" | "later">("now");

  // Proof signals — loaded for next-action engine
  const [proofSignals, setProofSignals] = useState<{ id: string; kind?: string; label?: string; created_at?: string }[]>([]);
  const [allProjects, setAllProjects] = useState<{ id: string; name: string; stage?: string | null; updated_at?: string }[]>([]);
  const [allTasks, setAllTasks] = useState<{ id: string; status: string; priority: string; title?: string; category?: string | null; created_at?: string; updated_at?: string }[]>([]);

  const runIntelligence = useCallback((
    reps: ReportSummary[],
    taskList: typeof allTasks,
    signals: typeof proofSignals
  ) => {
    if (reps.length === 0 && taskList.length === 0) return;
    setInsightBrief(generateInsightBrief(reps));
    const engineResult = runContradictionEngine(reps);
    setContradictions(engineResult.contradictions);
    setAlignmentScore(engineResult.alignmentScore);
    setTrends(extractScoreTrends(reps));
    setCoverage(computeToolCoverage(reps));
    setBriefing(generateDailyBriefing({ reports: reps, tasks: taskList, proofSignals: signals }));
    setRoadmap(generateRoadmap({ reports: reps, tasks: taskList, proofSignals: signals }));
    setExecutionPkg(generateExecutionPackage({ reports: reps, tasks: taskList, proofSignals: signals }));
    setBrain(buildProductBrain({ reports: reps, tasks: taskList, proofSignals: signals }));
  }, []);

  useEffect(() => {
    let loadedReports: ReportSummary[] = [];
    let loadedTasks: typeof allTasks = [];
    let loadedSignals: typeof proofSignals = [];

    const dashPromise = getDashboardData().then(setData).catch(() => null);
    const reportsPromise = getReports()
      .then((r) => {
        loadedReports = (r as ReportSummary[]) ?? [];
        setReports(loadedReports);
      })
      .catch(() => null);
    const signalsPromise = getProofSignals()
      .then((s) => {
        loadedSignals = (s as { id: string }[]) ?? [];
        setProofSignals(loadedSignals);
      })
      .catch(() => null);
    const projectsPromise = getProjects()
      .then((p) => setAllProjects((p as { id: string; name: string; stage?: string | null }[]) ?? []))
      .catch(() => null);
    const tasksPromise = getTasks()
      .then((t) => {
        loadedTasks = (t as typeof allTasks) ?? [];
        setAllTasks(loadedTasks);
      })
      .catch(() => null);

    Promise.all([dashPromise, reportsPromise, signalsPromise, projectsPromise, tasksPromise])
      .then(() => {
        runIntelligence(loadedReports, loadedTasks, loadedSignals);
      })
      .finally(() => setLoading(false));
  }, [runIntelligence]);

  async function createRoadmapTasks() {
    if (!roadmap) return;
    const items = [...roadmap.now, ...roadmap.next].filter((i) => i.isBlocker || i.priority === "critical" || i.priority === "high").slice(0, 8);
    if (items.length === 0) { toast({ title: "No tasks to create", description: "All roadmap items are covered." }); return; }
    setCreatingTasks(true);
    try {
      await saveTasks(items.map((item) => ({
        title: item.title,
        detail: item.reason,
        priority: item.priority,
        category: item.tool,
      })));
      toast({ title: `${items.length} roadmap tasks created`, description: "Tasks added to your queue." });
    } catch {
      toast({ title: "Failed to create tasks", variant: "destructive" });
    } finally {
      setCreatingTasks(false);
    }
  }

  async function createAutopilotTasks() {
    if (!executionPkg) return;
    setCreatingTasks(true);
    try {
      await saveTasks(executionPkg.taskBatch.map((t) => ({
        title: t.title,
        detail: t.detail,
        priority: t.priority,
        category: t.category,
      })));
      toast({ title: `${executionPkg.taskBatch.length} execution tasks created`, description: "Task batch added to your queue." });
    } catch {
      toast({ title: "Failed to create tasks", variant: "destructive" });
    } finally {
      setCreatingTasks(false);
    }
  }

  async function createContradictionTask(c: EnhancedContradiction) {
    try {
      await createTask({
        title: `Resolve: ${c.title}`,
        detail: c.recommendedResolution,
        priority: c.severity === "critical" ? "critical" : "high",
        category: "intelligence",
      });
      toast({ title: "Resolution task created", description: "Added to your task queue." });
    } catch {
      toast({ title: "Failed to create task", variant: "destructive" });
    }
  }

  function copyPrompt() {
    if (!executionPkg) return;
    navigator.clipboard.writeText(executionPkg.promptPack).then(() => {
      toast({ title: "Prompt copied", description: "Paste into Replit, Cursor, or Windsurf." });
    });
  }

  const scoreEntries = Object.entries(data?.latestScores ?? {}).filter(([, v]) => (v as number) > 0);
  const statusColor = insightBrief ? STATUS_COLORS[insightBrief.status] : "var(--noctra-cyan)";
  const hasIntelligence = reports.length > 0;

  const pipeline = useMemo(() => computePipeline({
    reports: reports as { id: string; tool: string; score?: number | null; created_at: string }[],
    tasks: allTasks,
    proofSignals,
  }), [reports, allTasks, proofSignals]);

  const pipelineProgress = pipeline.filter((s) => s.done).length;

  const smartNextAction = useMemo(() => computeNextAction({
    reports: reports as { id: string; tool: string; score?: number | null; created_at: string }[],
    tasks: allTasks,
    projects: allProjects,
    proofSignals,
  }), [reports, allTasks, allProjects, proofSignals]);

  const radarRisks = useMemo(() => extractRisks({
    reports: reports as Array<{ id: string; tool: string; payload: unknown; score?: number | null }>,
    tasks: allTasks as Array<{ id: string; status: string; priority: string; title: string }>,
  }), [reports, allTasks]);

  // ── Daily Action (deterministic, no AI) ──────────────────────────────────
  type DailyAction = { title: string; description: string; reason: string; estimatedTime: string; href: string; sourceType: string; sourceId?: string };

  const dailyAction = useMemo((): DailyAction => {
    const openHighTasks = allTasks.filter((t) => t.status === "todo" && t.priority === "high");
    const openTasks = allTasks.filter((t) => t.status === "todo");
    const hasMvp = reports.some((r) => r.tool === "mvp");
    const hasLaunch = reports.some((r) => r.tool === "launch");
    const hasProofReport = reports.some((r) => r.tool === "proof");
    const hasDoctor = reports.some((r) => r.tool === "doctor");
    const hasIdeaOrReality = reports.some((r) => r.tool === "idea" || r.tool === "reality");
    const hasTasksCreated = allTasks.length > 0;
    const proofSignalCount = proofSignals.length;
    const mvpTasks = allTasks.filter((t) => t.category === "mvp");
    const doctorTasks = allTasks.filter((t) => t.category === "doctor");

    if (openHighTasks.length > 0) {
      const t = openHighTasks[0];
      return { title: t.title ?? "Complete high-priority task", description: "You have high-priority tasks waiting.", reason: "Highest priority open task", estimatedTime: "30 min", href: "/app/tasks", sourceType: "task", sourceId: t.id };
    }
    if (hasDoctor && doctorTasks.length === 0) {
      return { title: "Create fix tasks from Doctor report", description: "Project Doctor found issues that need fixing.", reason: "Red gates need resolution", estimatedTime: "10 min", href: "/app/doctor", sourceType: "doctor" };
    }
    if (hasMvp && mvpTasks.length === 0) {
      return { title: "Generate tasks from MVP plan", description: "You have an MVP plan but no execution tasks yet.", reason: "Break MVP plan into actionable tasks", estimatedTime: "5 min", href: "/app/reports", sourceType: "mvp" };
    }
    if (proofSignalCount >= 3 && !hasProofReport) {
      return { title: "Run Proof Analysis", description: `You have ${proofSignalCount} proof signals but no analysis report.`, reason: "Validate signals with AI analysis", estimatedTime: "10 min", href: "/app/proof", sourceType: "proof" };
    }
    if (openTasks.length > 0) {
      const t = openTasks[0];
      return { title: t.title ?? "Complete next open task", description: "You have open tasks in your queue.",           reason: "Complete your next open task", estimatedTime: "20 min", href: "/app/tasks", sourceType: "task", sourceId: t.id };
    }
    if (reports.length >= 2 && !hasTasksCreated) {
      const lastReport = reports[reports.length - 1];
      return { title: "Generate tasks from latest report", description: "Turn insights into execution tasks.", reason: "Convert analysis into action", estimatedTime: "5 min", href: `/app/reports/${lastReport.id}`, sourceType: "report", sourceId: lastReport.id };
    }
    if (hasIdeaOrReality && !hasMvp) {
      return { title: "Generate MVP Report", description: "You've validated your idea — now plan the build.", reason: "Move from validation to execution", estimatedTime: "15 min", href: "/app/mvp", sourceType: "mvp" };
    }
    if ((hasMvp || hasDoctor) && !hasLaunch) {
      return { title: "Run Launch Control", description: "You're close to shipping — check launch readiness.", reason: "Go/no-go decision before launch", estimatedTime: "15 min", href: "/app/launch", sourceType: "launch" };
    }
    if (reports.length === 0) {
      return { title: "Run Idea Checker", description: "Start by describing your product idea.", reason: "First step to building your execution plan", estimatedTime: "5 min", href: "/app/idea", sourceType: "onboarding" };
    }
    return { title: "Review your command center", description: "All major milestones reached. Review insights and plan next moves.", reason: "Maintain momentum", estimatedTime: "10 min", href: "/app/reports", sourceType: "review" };
  }, [allTasks, reports, proofSignals]);

  const recentTimeline = useMemo(() => buildTimeline({
    reports: reports as Array<{ id: string; tool: string; title: string; score?: number | null; summary?: string | null; created_at: string }>,
    proofSignals: proofSignals as Array<{ id: string; label: string; kind: string; created_at: string }>,
    limit: 8,
  }), [reports, proofSignals]);

  const scoreHistoryEntries = useMemo(() => computeScoreHistory(
    reports as Array<{ id: string; tool: string; score?: number | null; created_at: string }>
  ), [reports]);

  const activeRoadmapItems = activeRoadmapTab === "now" ? (roadmap?.now ?? []) : activeRoadmapTab === "next" ? (roadmap?.next ?? []) : (roadmap?.later ?? []);

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--noctra-text)" }}>Dashboard</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>
              Your execution plan
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: "var(--noctra-cyan)" }} />
          </div>
        ) : (data?.reports.length ?? 0) === 0 ? (
          <div className="space-y-8">
            {/* Promise */}
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4" style={{ background: "var(--noctra-cyan)", boxShadow: "0 0 20px var(--noctra-cyan-glow)" }}>
                <Zap size={20} className="text-black" />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: "var(--noctra-text)" }}>
                Turn your idea and codebase into a launch-ready execution plan.
              </h2>
              <p className="text-sm max-w-lg mx-auto" style={{ color: "var(--noctra-text-muted)" }}>
                Validate the idea, diagnose the repo, generate fix tasks, and get the exact build prompt to ship.
              </p>
            </div>

            {/* Three starting paths */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigate("/app/idea")}
                className="rounded-xl border p-5 text-left transition-all hover:opacity-90 group"
                style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: "rgba(149,117,255,0.12)" }}>
                  <Lightbulb size={18} style={{ color: "var(--noctra-violet)" }} />
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--noctra-text)" }}>Start with an idea</p>
                <p className="text-xs mb-3" style={{ color: "var(--noctra-text-muted)" }}>
                  Paste your idea. Get a signal score, top risks, and a verdict. Know what to validate next.
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "var(--noctra-cyan)", color: "#000" }}>
                  Check My Idea <ArrowRight size={11} />
                </span>
              </button>

              <button
                onClick={() => navigate("/app/doctor")}
                className="rounded-xl border p-5 text-left transition-all hover:opacity-90 group relative"
                style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}
              >
                <div className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded font-semibold uppercase" style={{ background: "rgba(244,63,94,0.12)", color: "var(--noctra-rose)", letterSpacing: "0.05em" }}>
                  Flagship
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: "rgba(244,63,94,0.12)" }}>
                  <Upload size={18} style={{ color: "var(--noctra-rose)" }} />
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--noctra-text)" }}>Start with a codebase</p>
                <p className="text-xs mb-3" style={{ color: "var(--noctra-text-muted)" }}>
                  Upload your repo ZIP. Get launch readiness, red/yellow/green gates, fix tasks, and a build prompt.
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "var(--noctra-rose)", color: "#fff" }}>
                  Upload Project ZIP <ArrowRight size={11} />
                </span>
              </button>

              <button
                onClick={() => navigate("/app/projects")}
                className="rounded-xl border p-5 text-left transition-all hover:opacity-90 group"
                style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: "rgba(52,211,153,0.12)" }}>
                  <FolderOpen size={18} style={{ color: "var(--noctra-emerald)" }} />
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--noctra-text)" }}>Create a project</p>
                <p className="text-xs mb-3" style={{ color: "var(--noctra-text-muted)" }}>
                  Set up a project to organize reports, tasks, and your execution plan in one place.
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-soft)" }}>
                  Create Project <ArrowRight size={11} />
                </span>
              </button>
            </div>

            {/* Output preview */}
            <div className="rounded-xl border p-5" style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)", borderStyle: "dashed" }}>
              <p className="text-xs font-semibold mb-3" style={{ color: "var(--noctra-text-muted)" }}>What you'll get:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Idea Score & Verdict", desc: "Signal strength, weak points, sharpest experiment" },
                  { label: "Launch Readiness", desc: "Red/yellow/green gates, top blocker, fix tasks" },
                  { label: "MVP Build Plan", desc: "Ruthless scope, milestones, architecture decisions" },
                  { label: "Next Build Prompt", desc: "Copy-paste prompt for Cursor, Replit, or Windsurf" },
                ].map(({ label, desc }) => (
                  <div key={label} className="rounded-lg p-3" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                    <p className="text-xs font-medium mb-0.5" style={{ color: "var(--noctra-text)" }}>{label}</p>
                    <p className="text-[10px]" style={{ color: "var(--noctra-text-muted)" }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Progression unlock preview */}
            <Panel>
              <p className="text-xs font-semibold mb-3" style={{ color: "var(--noctra-text-muted)" }}>As you complete reports, you'll unlock:</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {MILESTONES.map((m) => (
                  <div key={m.key} className="rounded-lg p-3 text-center" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", opacity: 0.6 }}>
                    <Lock size={14} className="mx-auto mb-1" style={{ color: "var(--noctra-text-muted)" }} />
                    <p className="text-xs font-medium" style={{ color: "var(--noctra-text)" }}>{m.label}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{m.description}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        ) : (
          <>

            {/* ═══════════════════════════════════════════════
               SECTION 1: TODAY'S FOCUS
            ═══════════════════════════════════════════════ */}
            <div
              className="flex items-center justify-between gap-4 px-4 py-4 rounded-xl"
              style={{
                background: smartNextAction.priority === "critical" ? "rgba(244,63,94,0.07)" : smartNextAction.priority === "high" ? "rgba(61,216,255,0.06)" : "rgba(149,117,255,0.06)",
                border: `1px solid ${smartNextAction.priority === "critical" ? "rgba(244,63,94,0.25)" : smartNextAction.priority === "high" ? "rgba(61,216,255,0.2)" : "rgba(149,117,255,0.2)"}`,
              }}
            >
              <div className="flex items-start gap-3 min-w-0">
                <Target size={16} style={{ color: smartNextAction.priority === "critical" ? "var(--noctra-rose)" : smartNextAction.priority === "high" ? "var(--noctra-cyan)" : "var(--noctra-violet)", flexShrink: 0, marginTop: 2 }} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--noctra-emerald)" }}>Today's Focus</p>
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-sm font-semibold" style={{ color: "var(--noctra-text)" }}>{smartNextAction.title}</p>
                    <Badge style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", background: smartNextAction.priority === "critical" ? "rgba(244,63,94,0.15)" : smartNextAction.priority === "high" ? "rgba(61,216,255,0.12)" : "rgba(149,117,255,0.12)", color: smartNextAction.priority === "critical" ? "var(--noctra-rose)" : smartNextAction.priority === "high" ? "var(--noctra-cyan)" : "var(--noctra-violet)" }}>
                      {smartNextAction.priority}
                    </Badge>
                  </div>
                  <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{smartNextAction.reason}</p>
                </div>
              </div>
              <button
                onClick={() => navigate(smartNextAction.href)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: smartNextAction.priority === "critical" ? "var(--noctra-rose)" : "var(--noctra-cyan)", color: "#000" }}
              >
                Start <ArrowRight size={11} />
              </button>
            </div>

            <Panel>
              <div className="flex items-center gap-2">
                <Info size={12} style={{ color: "var(--noctra-text-muted)" }} />
                <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>
                  {smartNextAction.priority === "critical"
                    ? "This is your most critical action — resolving it unlocks progress across your entire pipeline."
                    : smartNextAction.priority === "high"
                    ? "Completing this keeps your momentum going and removes friction from your workflow."
                    : "Small consistent actions compound into massive progress over time."}
                </p>
              </div>
            </Panel>

            {/* ═══════════════════════════════════════════════
               PROGRESSION: Next unlock
            ═══════════════════════════════════════════════ */}
            {nextMilestone && (
              <div
                className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl"
                style={{ background: "rgba(61,216,255,0.05)", border: "1px solid rgba(61,216,255,0.15)" }}
              >
                <div className="flex items-center gap-3">
                  <Lock size={14} style={{ color: "var(--noctra-cyan)" }} />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "var(--noctra-cyan)" }}>Next unlock: {nextMilestone.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>
                      Complete {nextMilestone.requiredReports - reportCount} more {nextMilestone.requiredReports - reportCount === 1 ? "report" : "reports"} to unlock {nextMilestone.unlocks.length} new tool{nextMilestone.unlocks.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--noctra-surface2)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.round((progress.progress / progress.total) * 100)}%`,
                        background: "var(--noctra-cyan)",
                      }}
                    />
                  </div>
                  <span className="text-xs font-mono" style={{ color: "var(--noctra-cyan)" }}>{reportCount}/{nextMilestone.requiredReports}</span>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════
               SECTION 2: PRODUCT STATE
            ═══════════════════════════════════════════════ */}

            <Panel>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Map size={13} style={{ color: "var(--noctra-cyan)" }} />
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>
                    Product State
                  </p>
                </div>
                <span className="text-xs font-mono" style={{ color: pipelineProgress === 8 ? "var(--noctra-emerald)" : pipelineProgress >= 5 ? "var(--noctra-amber)" : "var(--noctra-text-muted)" }}>
                  {pipelineProgress}/8
                </span>
              </div>
              <div className="flex gap-1 items-center overflow-x-auto pb-3 mb-3 border-b" style={{ borderColor: "var(--noctra-border)" }}>
                {pipeline.map((step, i) => (
                  <div key={step.key} className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => navigate(step.href)}
                      className="flex flex-col items-center gap-1 transition-opacity hover:opacity-90"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{
                          background: step.done ? "rgba(52,211,153,0.15)" : step.active ? "rgba(61,216,255,0.12)" : "var(--noctra-surface2)",
                          border: step.done ? "1px solid rgba(52,211,153,0.4)" : step.active ? "1px solid rgba(61,216,255,0.4)" : "1px solid var(--noctra-border)",
                          color: step.done ? "var(--noctra-emerald)" : step.active ? "var(--noctra-cyan)" : "var(--noctra-text-muted)",
                        }}
                      >
                        {step.done ? "\u2713" : i + 1}
                      </div>
                      <span className="text-[9px] font-medium" style={{ color: step.done ? "var(--noctra-emerald)" : step.active ? "var(--noctra-cyan)" : "var(--noctra-text-muted)" }}>
                        {step.label}
                      </span>
                    </button>
                    {i < pipeline.length - 1 ? (
                      <div className="w-4 h-px shrink-0 mb-3" style={{ background: step.done ? "rgba(52,211,153,0.4)" : "var(--noctra-border)" }} />
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: FileText, label: "Reports", value: data?.reports.length ?? 0, route: "/app/reports", color: "var(--noctra-violet)" },
                  { icon: CheckSquare, label: "Tasks", value: data?.tasks.length ?? 0, route: "/app/tasks", color: "var(--noctra-emerald)" },
                  { icon: FolderOpen, label: "Projects", value: data?.projects.length ?? 0, route: "/app/projects", color: "var(--noctra-cyan)" },
                ].map(({ icon: Icon, label, value, route, color }) => (
                  <button key={label} onClick={() => navigate(route)} className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={13} style={{ color }} />
                      <span className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{label}</span>
                    </div>
                    <p className="text-xl font-bold" style={{ color }}>{value}</p>
                  </button>
                ))}
              </div>
            </Panel>

            {/* ═══════════════════════════════════════════════
               SECTION 3: RISKS & BLOCKERS
            ═══════════════════════════════════════════════ */}

            {(() => {
              const doctorReports = reports.filter((r) => r.tool === "doctor");
              const lastDoctor = doctorReports[doctorReports.length - 1];
              const redGates: string[] = [];
              if (lastDoctor?.payload) {
                const p = lastDoctor.payload as Record<string, unknown>;
                const data = (p.data ?? p) as Record<string, unknown>;
                const gates = (data.gates ?? data.launch_gates ?? []) as Array<{ name: string; status: string }>;
                const gateRed = gates.filter(g => g.status === "RED").map(g => g.name);
                const redStrings = (data.red_gates ?? []) as string[];
                redGates.push(...gateRed, ...redStrings.filter(s => typeof s === "string"));
              }
              const hasDoctor = doctorReports.length > 0;
              const showFailedGates = redGates.length > 0;
              const showNoDoctor = !hasDoctor && reports.length >= 2;
              const showRisks = radarRisks.length > 0;
              const showContradictions = contradictions.length > 0;

              if (!showFailedGates && !showRisks && !showContradictions && !showNoDoctor) return null;

              return (
                <Panel>
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldOff size={13} style={{ color: "var(--noctra-amber)" }} />
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-amber)" }}>
                      Risks & Blockers
                    </p>
                  </div>
                  <div className="space-y-3">
                    {/* Top risks */}
                    {radarRisks.slice(0, 3).map((risk) => (
                      <div key={risk.id} className="flex items-start gap-3 px-3 py-2 rounded-lg" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: RISK_SEV_COLOR[risk.severity] }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium" style={{ color: "var(--noctra-text)" }}>{risk.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{risk.recommendedFix}</p>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium uppercase" style={{ background: `${RISK_SEV_COLOR[risk.severity]}15`, color: RISK_SEV_COLOR[risk.severity] }}>
                          {risk.severity}
                        </span>
                      </div>
                    ))}

                    {/* Failed gates */}
                    {redGates.length > 0 && (
                      <div className="px-3 py-2 rounded-lg" style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.2)" }}>
                        <div className="flex items-center gap-2">
                          <XCircle size={12} style={{ color: "var(--noctra-rose)" }} />
                          <p className="text-xs font-semibold" style={{ color: "var(--noctra-rose)" }}>
                            {redGates.length} Failed Gate{redGates.length !== 1 ? "s" : ""}
                          </p>
                          <button onClick={() => navigate("/app/doctor")} className="ml-auto text-xs px-2 py-1 rounded" style={{ background: "rgba(244,63,94,0.1)", color: "var(--noctra-rose)" }}>
                            View
                          </button>
                        </div>
                      </div>
                    )}

                    {/* No Doctor scan recommendation */}
                    {showNoDoctor && (
                      <div
                        className="px-3 py-2.5 rounded-lg flex items-start gap-3"
                        style={{ background: "rgba(61,216,255,0.06)", border: "1px solid rgba(61,216,255,0.2)" }}
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(244,63,94,0.12)" }}>
                          <Stethoscope size={13} style={{ color: "var(--noctra-rose)" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold" style={{ color: "var(--noctra-cyan)" }}>Project Doctor not run yet</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>
                            Upload your repo ZIP to diagnose launch blockers, code risks, and generate a fix queue + build prompt.
                          </p>
                        </div>
                        <button
                          onClick={() => navigate("/app/doctor")}
                          className="shrink-0 text-xs px-2 py-1 rounded font-medium"
                          style={{ background: "var(--noctra-cyan)", color: "#000" }}
                        >
                          Run Scan
                        </button>
                      </div>
                    )}

                    {/* Top contradiction */}
                    {contradictions.length > 0 && (
                      <div
                        className="px-3 py-2.5 rounded-lg"
                        style={{
                          background: contradictions[0].severity === "critical" || contradictions[0].severity === "high" ? "rgba(244,63,94,0.06)" : "rgba(245,158,11,0.06)",
                          border: `1px solid ${contradictions[0].severity === "critical" || contradictions[0].severity === "high" ? "rgba(244,63,94,0.2)" : "rgba(245,158,11,0.2)"}`,
                        }}
                      >
                        <div className="flex items-start gap-2 justify-between">
                          <div className="flex items-start gap-2 min-w-0">
                            <Badge style={{
                              background: contradictions[0].severity === "critical" ? "rgba(244,63,94,0.2)" : contradictions[0].severity === "high" ? "rgba(244,63,94,0.15)" : "rgba(245,158,11,0.15)",
                              color: contradictions[0].severity === "critical" || contradictions[0].severity === "high" ? "var(--noctra-rose)" : "var(--noctra-amber)",
                              fontSize: "10px",
                              flexShrink: 0,
                            }}>{contradictions[0].severity}</Badge>
                            <p className="text-xs font-medium" style={{ color: "var(--noctra-text)" }}>{contradictions[0].title}</p>
                          </div>
                          <button
                            onClick={() => createContradictionTask(contradictions[0])}
                            className="shrink-0 text-[10px] px-2 py-0.5 rounded"
                            style={{ background: "var(--noctra-surface2)", color: "var(--noctra-text-muted)", border: "1px solid var(--noctra-border)" }}
                          >
                            + Task
                          </button>
                        </div>
                        <p className="text-xs mt-1.5" style={{ color: "var(--noctra-text-muted)" }}>{contradictions[0].explanation}</p>
                      </div>
                    )}
                  </div>
                </Panel>
              );
            })()}

            {/* ═══════════════════════════════════════════════
               SECTION 4: EXECUTION
            ═══════════════════════════════════════════════ */}

            <Panel>
              <div className="flex items-center gap-2 mb-3">
                <Zap size={14} style={{ color: "var(--noctra-amber)" }} />
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-amber)" }}>Execution</p>
              </div>

              {roadmap && roadmap.now.length > 0 && (
                <div className="space-y-2 mb-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>
                    Next Tasks ({Math.min(3, roadmap.now.length)})
                  </p>
                  {roadmap.now.slice(0, 3).map((item) => {
                    const itemColor = item.priority === "critical" ? "var(--noctra-rose)" : item.priority === "high" ? "var(--noctra-amber)" : "var(--noctra-cyan)";
                    return (
                      <div key={item.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg" style={{ background: "var(--noctra-surface2)", border: `1px solid var(--noctra-border)` }}>
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: itemColor }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-medium" style={{ color: "var(--noctra-text)" }}>{item.title}</p>
                            {item.isBlocker && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase" style={{ background: "rgba(244,63,94,0.12)", color: "var(--noctra-rose)" }}>blocker</span>
                            )}
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{item.reason}</p>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold shrink-0" style={{ background: `${itemColor}12`, color: itemColor }}>{item.priority}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {roadmap?.recommendedSprint?.goal && (
                <div className="px-3 py-2 rounded-lg mb-3" style={{ background: "rgba(149,117,255,0.06)", border: "1px solid rgba(149,117,255,0.15)" }}>
                  <p className="text-xs font-medium" style={{ color: "var(--noctra-violet)" }}>Sprint Goal</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{roadmap.recommendedSprint.goal}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={createRoadmapTasks}
                  disabled={creatingTasks || !roadmap}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{ background: "rgba(61,216,255,0.1)", border: "1px solid rgba(61,216,255,0.25)", color: "var(--noctra-cyan)" }}
                >
                  {creatingTasks ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                  Create Tasks
                </button>
                <button
                  onClick={copyPrompt}
                  disabled={!executionPkg}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{ background: "rgba(61,216,255,0.08)", border: "1px solid rgba(61,216,255,0.2)", color: "var(--noctra-cyan)" }}
                >
                  <Copy size={11} />
                  Copy Next Build Prompt
                </button>
                <button
                  onClick={() => navigate("/app/doctor")}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-muted)" }}
                >
                  <ShieldOff size={11} />
                  Project Doctor
                </button>
                <button
                  onClick={() => {
                    if (executionPkg) {
                      const blob = new Blob([executionPkg.promptPack], { type: "text/markdown" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `execution-plan-${Date.now()}.md`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }
                  }}
                  disabled={!executionPkg}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-muted)" }}
                >
                  <Download size={11} />
                  Download Plan
                </button>
              </div>
            </Panel>

            {/* ═══════════════════════════════════════════════
               SECTION 5: HISTORY & MEMORY
            ═══════════════════════════════════════════════ */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentTimeline.length > 0 && (
                <div className="md:col-span-2">
                  <Panel>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock size={13} style={{ color: "var(--noctra-text-muted)" }} />
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>History & Memory</p>
                      </div>
                      <button onClick={() => navigate("/app/reports")} className="text-xs" style={{ color: "var(--noctra-cyan)" }}>View all →</button>
                    </div>
                    <div className="space-y-2">
                      {recentTimeline.slice(0, 6).map((event) => (
                        <div key={event.id} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: TIMELINE_TYPE_COLOR[event.type] ?? "var(--noctra-text-muted)" }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium" style={{ color: "var(--noctra-text)" }}>{event.title}</p>
                            {event.description && (
                              <p className="text-xs truncate mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{event.description}</p>
                            )}
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            {event.score != null ? (
                              <span className="text-xs font-mono" style={{ color: event.score >= 70 ? "var(--noctra-emerald)" : event.score >= 50 ? "var(--noctra-amber)" : "var(--noctra-rose)" }}>{event.score}</span>
                            ) : null}
                            <span className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{formatTimeAgo(event.date)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Panel>
                </div>
              )}

              <div className="space-y-4">

                {(data?.reports.length ?? 0) > 0 && (
                  <Panel>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Latest Reports</p>
                      <button onClick={() => navigate("/app/reports")} className="text-xs" style={{ color: "var(--noctra-cyan)" }}>View all</button>
                    </div>
                    <div className="space-y-1.5">
                      {data!.reports.slice(0, 3).map((r: Record<string, unknown>) => {
                        const tool = TOOL_BY_KEY[String(r.tool) as keyof typeof TOOL_BY_KEY];
                        return (
                          <button
                            key={String(r.id)}
                            onClick={() => navigate(`/app/reports/${String(r.id)}`)}
                            className="w-full flex items-center justify-between gap-2 py-1.5 border-b last:border-0 hover:opacity-80 transition-opacity text-left"
                            style={{ borderColor: "var(--noctra-border)" }}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {tool && <tool.icon size={12} style={{ color: tool.accent, flexShrink: 0 }} />}
                              <span className="text-xs truncate" style={{ color: "var(--noctra-text-soft)" }}>{String(r.title)}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {typeof r.score === "number" && (
                                <span className="text-xs font-mono" style={{ color: "var(--noctra-cyan)" }}>{r.score}</span>
                              )}
                              <span className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>
                                {new Date(String(r.created_at)).toLocaleDateString()}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </Panel>
                )}
              </div>
            </div>

          </>
        )}
      </div>
    </AppShell>
  );
}
