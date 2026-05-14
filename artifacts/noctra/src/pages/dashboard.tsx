import { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { ScoreRing, Panel, Badge, EmptyState, ProgressBar } from "@/components/Primitives";
import { getDashboardData, getReports, getProofSignals, getTasks, getProjects, createTask, saveTasks } from "@/lib/repository";
import { TOOL_BY_KEY, TOOLS } from "@/lib/noctra-tools";
import { callInsightSweep } from "@/lib/ai";
import { computeNextAction, computePipeline } from "@/lib/next-action";
import { extractRisks, RISK_SEV_COLOR } from "@/lib/risk-radar";
import { buildTimeline, formatTimeAgo, TIMELINE_TYPE_COLOR } from "@/lib/timeline";
import { computeScoreHistory, getDeltaLabel, getDeltaColor } from "@/lib/score-history";
import {
  extractScoreTrends,
  computeToolCoverage,
  generateInsightBrief,
  buildInsightSweepInput,
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
  Brain, ChevronRight, Sparkles, Shield, ShieldOff, Clock,
  Sun, Target, Map, Terminal, Copy, Download, Plus,
  XCircle, CheckCircle, Info,
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

  // Insight sweep — AI synthesis of all reports
  const [sweeping, setSweeping] = useState(false);
  const [sweep, setSweep] = useState<Record<string, unknown> | null>(null);
  const [sweepError, setSweepError] = useState("");

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

  async function runInsightSweep() {
    if (reports.length === 0) return;
    setSweeping(true);
    setSweepError("");
    try {
      const input = buildInsightSweepInput(reports);
      const result = await callInsightSweep(input);
      setSweep(result.data);
    } catch (err) {
      setSweepError(err instanceof Error ? err.message : "Sweep failed");
    } finally {
      setSweeping(false);
    }
  }

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
      return { title: "Run Idea Checker", description: "Start by describing your product idea.", reason: "First step to building your intelligence stack", estimatedTime: "5 min", href: "/app/idea", sourceType: "onboarding" };
    }
    return { title: "Review your command center", description: "All major milestones reached. Review insights and plan next moves.", reason: "Maintain momentum", estimatedTime: "10 min", href: "/app/reports", sourceType: "review" };
  }, [allTasks, reports, proofSignals]);

  // ── Continue Where You Left Off ──────────────────────────────────────────
  type ContinueAction = { title: string; description: string; reason: string; href: string; sourceType: string } | null;

  const continueAction = useMemo((): ContinueAction => {
    const hasMvp = reports.some((r) => r.tool === "mvp");
    const hasDoctor = reports.some((r) => r.tool === "doctor");
    const hasProofReport = reports.some((r) => r.tool === "proof");
    const proofSignalCount = proofSignals.length;
    const mvpTasks = allTasks.filter((t) => t.category === "mvp");
    const doctorTasks = allTasks.filter((t) => t.category === "doctor");

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const completedThisWeek = allTasks.filter((t) => t.status === "completed" && new Date(t.updated_at ?? t.created_at ?? 0).getTime() > oneWeekAgo);

    if (hasMvp && mvpTasks.length === 0) {
      const mvpReport = [...reports].reverse().find((r) => r.tool === "mvp");
      return { title: "MVP tasks not yet created", description: "You generated an MVP plan but have not created tasks yet.", reason: "Break the plan into execution steps", href: mvpReport ? `/app/reports/${mvpReport.id}` : "/app/reports", sourceType: "mvp" };
    }
    if (hasDoctor && doctorTasks.length === 0) {
      const doctorReport = [...reports].reverse().find((r) => r.tool === "doctor");
      return { title: "Doctor red gates not addressed", description: "Project Doctor found issues. Create fix tasks.", reason: "Resolve launch blockers", href: doctorReport ? `/app/reports/${doctorReport.id}` : "/app/doctor", sourceType: "doctor" };
    }
    if (proofSignalCount > 0 && !hasProofReport) {
      return { title: "Proof signals not analyzed", description: `You have ${proofSignalCount} proof signal${proofSignalCount !== 1 ? "s" : ""} but no proof analysis report.`, reason: "Turn signals into validation evidence", href: "/app/proof", sourceType: "proof" };
    }
    if (allTasks.length > 0 && completedThisWeek.length === 0) {
      return { title: "No tasks completed this week", description: "You created tasks but have not completed any this week.", reason: "Build execution momentum", href: "/app/tasks", sourceType: "task" };
    }
    if (reports.length > 0) {
      const last = reports[reports.length - 1];
      return { title: `Continue from ${last.tool}`, description: `Your latest report was "${last.title}". Review and take next action.`, reason: "Pick up where you left off", href: `/app/reports/${last.id}`, sourceType: "report" };
    }
    return null;
  }, [reports, allTasks, proofSignals]);

  // ── Weekly Momentum Summary ──────────────────────────────────────────────
  const weeklySummary = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const thisWeekReports = reports.filter((r) => new Date(r.created_at).getTime() > oneWeekAgo);
    const thisWeekTasks = allTasks.filter((t) => new Date(t.created_at ?? 0).getTime() > oneWeekAgo);
    const completedThisWeek = allTasks.filter((t) => t.status === "completed" && new Date(t.updated_at ?? t.created_at ?? 0).getTime() > oneWeekAgo);
    const thisWeekSignals = proofSignals.filter((s) => new Date(s.created_at ?? 0).getTime() > oneWeekAgo);
    const tasksTodo = allTasks.filter((t) => t.status === "todo").length;
    const doctorReports = reports.filter((r) => r.tool === "doctor");
    const lastDoctor = doctorReports[doctorReports.length - 1];
    const redGates = lastDoctor?.payload ? ((lastDoctor.payload as Record<string, unknown>)?.data as Record<string, unknown>)?.red_gates as string[] ?? [] : [];
    return {
      tasksCompleted: completedThisWeek.length,
      reportsGenerated: thisWeekReports.length,
      signalsAdded: thisWeekSignals.length,
      scansRun: thisWeekReports.filter((r) => r.tool === "doctor").length,
      biggestBlocker: redGates.length > 0 ? `${redGates.length} red gate${redGates.length !== 1 ? "s" : ""} in Doctor report` : tasksTodo > 0 ? `${tasksTodo} open task${tasksTodo !== 1 ? "s" : ""} remaining` : "No blockers identified",
    };
  }, [reports, allTasks, proofSignals]);

  const recentTimeline = useMemo(() => buildTimeline({
    reports: reports as Array<{ id: string; tool: string; title: string; score?: number | null; summary?: string | null; created_at: string }>,
    proofSignals: proofSignals as Array<{ id: string; label: string; kind: string; created_at: string }>,
    limit: 8,
  }), [reports, proofSignals]);

  const scoreHistoryEntries = useMemo(() => computeScoreHistory(
    reports as Array<{ id: string; tool: string; score?: number | null; created_at: string }>
  ), [reports]);

  type SweepContradiction = { description: string; severity: string; resolution: string };
  type SweepPattern = { pattern: string; implication: string };

  const sweepData = sweep as Record<string, unknown> | null;
  const sweepContradictions: SweepContradiction[] = Array.isArray(sweepData?.contradictions)
    ? (sweepData!.contradictions as SweepContradiction[])
    : [];
  const sweepPatterns: SweepPattern[] = Array.isArray(sweepData?.patterns)
    ? (sweepData!.patterns as SweepPattern[])
    : [];
  const sweepPriorities: string[] = Array.isArray(sweepData?.next_priorities)
    ? (sweepData!.next_priorities as string[])
    : [];

  const activeRoadmapItems = activeRoadmapTab === "now" ? (roadmap?.now ?? []) : activeRoadmapTab === "next" ? (roadmap?.next ?? []) : (roadmap?.later ?? []);

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--noctra-text)" }}>Command Center</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>
              Founder intelligence hub
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs" style={{ background: "rgba(61,216,255,0.08)", border: "1px solid rgba(61,216,255,0.2)", color: "var(--noctra-cyan)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            Live
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: "var(--noctra-cyan)" }} />
          </div>
        ) : (data?.reports.length ?? 0) === 0 ? (
          <Panel>
            <EmptyState
              icon={<Zap size={24} />}
              title="No intelligence yet"
              body="Run your first tool to start building your founder intelligence stack. Start with Idea Checker — it takes 2 minutes and unlocks the full analysis pipeline."
            />
            <div className="flex flex-col sm:flex-row justify-center gap-2 mt-4">
              <button
                onClick={() => navigate("/app/idea")}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: "var(--noctra-cyan)", color: "#000" }}
              >
                Start with Idea Checker <ArrowRight size={14} />
              </button>
              <button
                onClick={() => navigate("/app/twin")}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm"
                style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-muted)" }}
              >
                <Brain size={14} /> Ask Product Twin first
              </button>
            </div>
          </Panel>
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
               SECTION 2: ACTIVE PROJECT STATE
            ═══════════════════════════════════════════════ */}

            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: FileText, label: "Reports", value: data?.reports.length ?? 0, route: "/app/reports", color: "var(--noctra-violet)" },
                { icon: CheckSquare, label: "Tasks", value: data?.tasks.length ?? 0, route: "/app/tasks", color: "var(--noctra-emerald)" },
                { icon: FolderOpen, label: "Projects", value: data?.projects.length ?? 0, route: "/app/projects", color: "var(--noctra-cyan)" },
              ].map(({ icon: Icon, label, value, route, color }) => (
                <Panel key={label}>
                  <button onClick={() => navigate(route)} className="w-full text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={14} style={{ color }} />
                      <span className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{label}</span>
                    </div>
                    <p className="text-2xl font-bold" style={{ color }}>{value}</p>
                  </button>
                </Panel>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Panel>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Map size={13} style={{ color: "var(--noctra-cyan)" }} />
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>
                        Founder Pipeline
                      </p>
                    </div>
                    <span className="text-xs font-mono" style={{ color: pipelineProgress === 8 ? "var(--noctra-emerald)" : pipelineProgress >= 5 ? "var(--noctra-amber)" : "var(--noctra-text-muted)" }}>
                      {pipelineProgress}/8
                    </span>
                  </div>
                  <div className="flex gap-1 items-center overflow-x-auto pb-1">
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
                </Panel>
              </div>

              {scoreEntries.length > 0 && (
                <Panel>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--noctra-text-muted)" }}>Scores</p>
                  <div className="flex flex-wrap gap-4 justify-center">
                    {scoreEntries.slice(0, 4).map(([tool, score]) => {
                      const t = TOOL_BY_KEY[tool as keyof typeof TOOL_BY_KEY];
                      return (
                        <div key={tool} className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => t && navigate(t.route)}>
                          <ScoreRing value={score as number} size={60} stroke={5} label={t?.short ?? tool} color={t?.accent ?? "var(--noctra-cyan)"} />
                        </div>
                      );
                    })}
                  </div>
                </Panel>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Panel>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={12} style={{ color: weeklySummary.biggestBlocker.includes("No blockers") ? "var(--noctra-emerald)" : "var(--noctra-amber)" }} />
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Blockers</p>
                </div>
                <p className="text-sm" style={{ color: "var(--noctra-text-soft)" }}>{weeklySummary.biggestBlocker}</p>
              </Panel>

              <Panel>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={12} style={{ color: "var(--noctra-violet)" }} />
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Quick Stats</p>
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-lg font-bold font-mono" style={{ color: "var(--noctra-violet)" }}>{data?.reports.length ?? 0}</p>
                    <p className="text-[9px] uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Reports</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold font-mono" style={{ color: "var(--noctra-emerald)" }}>{data?.tasks.length ?? 0}</p>
                    <p className="text-[9px] uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Tasks</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold font-mono" style={{ color: "var(--noctra-cyan)" }}>{proofSignals.length}</p>
                    <p className="text-[9px] uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Proof</p>
                  </div>
                </div>
              </Panel>
            </div>

            {/* ═══════════════════════════════════════════════
               SECTION 3: RISKS & CONTRADICTIONS
            ═══════════════════════════════════════════════ */}

            {insightBrief && (
              <div
                className="rounded-xl px-4 py-4 flex flex-col gap-3"
                style={{
                  background: `${statusColor}08`,
                  border: `1px solid ${statusColor}25`,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Shield size={16} style={{ color: statusColor, flexShrink: 0, marginTop: 2 }} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-snug" style={{ color: "var(--noctra-text)" }}>
                        {insightBrief.headline}
                      </p>
                      <p className="text-xs mt-1.5" style={{ color: "var(--noctra-text-muted)" }}>
                        → {insightBrief.immediateAction}
                      </p>
                    </div>
                  </div>
                  <Badge style={{
                    background: `${statusColor}18`,
                    color: statusColor,
                    flexShrink: 0,
                    fontSize: "10px",
                    fontWeight: 600,
                  }}>
                    {STATUS_LABELS[insightBrief.status]}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="px-3 py-2 rounded-lg" style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.15)" }}>
                    <p className="text-xs font-medium mb-0.5" style={{ color: "var(--noctra-rose)" }}>Top Risk</p>
                    <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{insightBrief.topRisk}</p>
                  </div>
                  <div className="px-3 py-2 rounded-lg" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                    <p className="text-xs font-medium mb-0.5" style={{ color: "var(--noctra-emerald)" }}>Top Opportunity</p>
                    <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{insightBrief.topOpportunity}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {radarRisks.length > 0 && (
                <Panel>
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldOff size={13} style={{ color: "var(--noctra-amber)" }} />
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-amber)" }}>Risk Radar</p>
                    <span className="ml-auto text-xs font-mono" style={{ color: "var(--noctra-text-muted)" }}>top 3</span>
                  </div>
                  <div className="space-y-2">
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
                  </div>
                </Panel>
              )}

              {contradictions.length > 0 && (
                <Panel>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={14} style={{ color: "var(--noctra-rose)" }} />
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-rose)" }}>
                      Contradictions
                    </p>
                    {alignmentScore !== null && (
                      <span className="ml-auto text-xs font-mono" style={{ color: alignmentScore >= 70 ? "var(--noctra-emerald)" : alignmentScore >= 50 ? "var(--noctra-amber)" : "var(--noctra-rose)" }}>
                        {alignmentScore}/100
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {contradictions.slice(0, 2).map((c) => (
                      <div
                        key={c.id}
                        className="px-3 py-2.5 rounded-lg"
                        style={{
                          background: c.severity === "critical" || c.severity === "high" ? "rgba(244,63,94,0.06)" : "rgba(245,158,11,0.06)",
                          border: `1px solid ${c.severity === "critical" || c.severity === "high" ? "rgba(244,63,94,0.2)" : "rgba(245,158,11,0.2)"}`,
                        }}
                      >
                        <div className="flex items-start gap-2 justify-between">
                          <div className="flex items-start gap-2 min-w-0">
                            <Badge style={{
                              background: c.severity === "critical" ? "rgba(244,63,94,0.2)" : c.severity === "high" ? "rgba(244,63,94,0.15)" : "rgba(245,158,11,0.15)",
                              color: c.severity === "critical" || c.severity === "high" ? "var(--noctra-rose)" : "var(--noctra-amber)",
                              fontSize: "10px",
                              flexShrink: 0,
                            }}>{c.severity}</Badge>
                            <p className="text-xs font-medium" style={{ color: "var(--noctra-text)" }}>{c.title}</p>
                          </div>
                          <button
                            onClick={() => createContradictionTask(c)}
                            className="shrink-0 text-[10px] px-2 py-0.5 rounded"
                            style={{ background: "var(--noctra-surface2)", color: "var(--noctra-text-muted)", border: "1px solid var(--noctra-border)" }}
                          >
                            + Task
                          </button>
                        </div>
                        <p className="text-xs mt-1.5" style={{ color: "var(--noctra-text-muted)" }}>{c.explanation}</p>
                        <div className="flex items-start gap-1.5 mt-2">
                          <ChevronRight size={11} style={{ color: "var(--noctra-emerald)", marginTop: 1, flexShrink: 0 }} />
                          <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{c.recommendedResolution}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              )}
            </div>

            {(() => {
              const doctorReports = reports.filter((r) => r.tool === "doctor");
              const lastDoctor = doctorReports[doctorReports.length - 1];
              const redGates: string[] = lastDoctor?.payload
                ? ((lastDoctor.payload as Record<string, unknown>)?.data as Record<string, unknown>)?.red_gates as string[] ?? []
                : [];
              if (redGates.length === 0) return null;
              return (
                <Panel>
                  <div className="flex items-center gap-2">
                    <XCircle size={12} style={{ color: "var(--noctra-rose)" }} />
                    <p className="text-xs font-semibold" style={{ color: "var(--noctra-rose)" }}>
                      {redGates.length} Failed Gate{redGates.length !== 1 ? "s" : ""} in Project Doctor
                    </p>
                    <button
                      onClick={() => navigate("/app/doctor")}
                      className="ml-auto text-xs px-2 py-1 rounded"
                      style={{ background: "rgba(244,63,94,0.1)", color: "var(--noctra-rose)" }}
                    >
                      View
                    </button>
                  </div>
                </Panel>
              );
            })()}

            {/* ═══════════════════════════════════════════════
               SECTION 4: EXECUTION PLAN
            ═══════════════════════════════════════════════ */}

            <Panel>
              <div className="flex items-center gap-2 mb-3">
                <Zap size={14} style={{ color: "var(--noctra-amber)" }} />
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-amber)" }}>Execution Plan</p>
              </div>

              {roadmap?.recommendedSprint?.goal && (
                <div className="px-3 py-2 rounded-lg mb-3" style={{ background: "rgba(149,117,255,0.06)", border: "1px solid rgba(149,117,255,0.15)" }}>
                  <p className="text-xs font-medium" style={{ color: "var(--noctra-violet)" }}>Sprint Goal</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{roadmap.recommendedSprint.goal}</p>
                </div>
              )}

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

              {executionPkg && (
                <div className="space-y-2 mb-3">
                  <div className="px-3 py-2.5 rounded-lg" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}>
                    <p className="text-xs font-semibold" style={{ color: "var(--noctra-text)" }}>{executionPkg.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{executionPkg.goal}</p>
                  </div>
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.12)" }}>
                    <CheckCircle size={11} style={{ color: "var(--noctra-emerald)", marginTop: 1, flexShrink: 0 }} />
                    <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{executionPkg.expectedOutcome}</p>
                  </div>
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
                  Copy Prompt
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
               SECTION 5: RECENT ACTIVITY
            ═══════════════════════════════════════════════ */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentTimeline.length > 0 && (
                <div className="md:col-span-2">
                  <Panel>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock size={13} style={{ color: "var(--noctra-text-muted)" }} />
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Recent Activity</p>
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
                <Panel>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--noctra-text-muted)" }}>This Week</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Done", value: weeklySummary.tasksCompleted, color: "var(--noctra-emerald)" },
                      { label: "Reports", value: weeklySummary.reportsGenerated, color: "var(--noctra-violet)" },
                      { label: "Signals", value: weeklySummary.signalsAdded, color: "var(--noctra-cyan)" },
                      { label: "Scans", value: weeklySummary.scansRun, color: "var(--noctra-amber)" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="text-center px-2 py-1.5 rounded-lg" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                        <p className="text-base font-bold font-mono" style={{ color: value > 0 ? color : "var(--noctra-text-muted)" }}>{value}</p>
                        <p className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{label}</p>
                      </div>
                    ))}
                  </div>
                </Panel>

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

            {/* ═══════════════════════════════════════════════
               SECTION 6: PRODUCT TWIN SHORTCUT
            ═══════════════════════════════════════════════ */}
            <div
              className="rounded-xl px-4 py-4 space-y-3"
              style={{
                background: "rgba(149,117,255,0.04)",
                border: "1px solid rgba(149,117,255,0.15)",
              }}
            >
              <div className="flex items-center gap-2">
                <Brain size={15} style={{ color: "var(--noctra-violet)" }} />
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-violet)" }}>
                  Product Twin
                </p>
              </div>
              <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>
                Your AI co-founder — ask about your current blocker, get strategic advice, or generate a build prompt for your next session.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigate("/app/twin")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: "var(--noctra-violet)", color: "#fff" }}
                >
                  <Brain size={11} />
                  Ask Product Twin
                </button>
                <button
                  onClick={() => navigate("/app/twin")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: "rgba(61,216,255,0.1)", border: "1px solid rgba(61,216,255,0.25)", color: "var(--noctra-cyan)" }}
                >
                  <Terminal size={11} />
                  Generate Build Prompt
                </button>
              </div>
            </div>

          </>
        )}
      </div>
    </AppShell>
  );
}
