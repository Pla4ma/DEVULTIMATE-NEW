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
  Command, XCircle, CheckCircle, Info,
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
  const [proofSignals, setProofSignals] = useState<{ id: string }[]>([]);
  const [allProjects, setAllProjects] = useState<{ id: string; name: string; stage?: string | null }[]>([]);
  const [allTasks, setAllTasks] = useState<{ id: string; status: string; priority: string; title?: string; category?: string | null }[]>([]);

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
              <span className="ml-2 opacity-50 text-xs">⌘K to search</span>
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
        ) : (
          <>
            {/* ── DAILY BRIEFING ──────────────────────────────────────────── */}
            {briefing && (
              <div
                className="rounded-xl px-4 py-4 space-y-4"
                style={{
                  background: "rgba(61,216,255,0.04)",
                  border: "1px solid rgba(61,216,255,0.15)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sun size={15} style={{ color: "var(--noctra-amber)", flexShrink: 0 }} />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-amber)" }}>
                        Today's Founder Briefing
                      </p>
                      <p className="text-sm font-medium mt-0.5" style={{ color: "var(--noctra-text)" }}>
                        {briefing.greeting}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                    {briefing.quickStats.slice(0, 4).map((s) => (
                      <div key={s.label} className="text-center px-2.5 py-1.5 rounded-lg" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                        <p className="text-xs font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-[9px] uppercase tracking-wide mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Current focus */}
                <div className="px-3 py-2.5 rounded-lg" style={{ background: "rgba(61,216,255,0.06)", border: "1px solid rgba(61,216,255,0.2)" }}>
                  <p className="text-xs font-medium mb-0.5" style={{ color: "var(--noctra-cyan)" }}>Current Focus</p>
                  <p className="text-xs" style={{ color: "var(--noctra-text-soft)" }}>{briefing.currentFocus}</p>
                </div>

                {/* Priorities */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Top 3 Priorities</p>
                  {briefing.topThreePriorities.map((p, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="text-xs font-mono w-4 shrink-0 mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{i + 1}.</span>
                      <p className="text-xs" style={{ color: "var(--noctra-text-soft)" }}>{p}</p>
                    </div>
                  ))}
                </div>

                {/* Risk + Win row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="px-3 py-2.5 rounded-lg" style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.15)" }}>
                    <p className="text-xs font-medium mb-0.5" style={{ color: "var(--noctra-rose)" }}>Biggest Risk</p>
                    <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{briefing.biggestRisk}</p>
                  </div>
                  <div className="px-3 py-2.5 rounded-lg" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                    <p className="text-xs font-medium mb-0.5" style={{ color: "var(--noctra-emerald)" }}>Easiest Win</p>
                    <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{briefing.easiestWin}</p>
                  </div>
                </div>

                {/* Avoid */}
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}>
                  <XCircle size={12} style={{ color: "var(--noctra-amber)", flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p className="text-xs font-medium" style={{ color: "var(--noctra-amber)" }}>One Thing to Avoid</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{briefing.oneThingToAvoid}</p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => { setShowPrompt((p) => !p); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: "rgba(61,216,255,0.1)", border: "1px solid rgba(61,216,255,0.25)", color: "var(--noctra-cyan)" }}
                  >
                    <Terminal size={11} />
                    Generate Build Prompt
                  </button>
                  <button
                    onClick={() => navigate("/app/twin")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-muted)" }}
                  >
                    <Brain size={11} />
                    Ask Product Twin
                  </button>
                  <button
                    onClick={createAutopilotTasks}
                    disabled={creatingTasks || !executionPkg}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-muted)" }}
                  >
                    {creatingTasks ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                    Create Priority Tasks
                  </button>
                </div>

                {/* Generated prompt */}
                {showPrompt && briefing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium" style={{ color: "var(--noctra-text)" }}>Build Prompt</p>
                      <button
                        onClick={copyPrompt}
                        className="flex items-center gap-1 text-xs"
                        style={{ color: "var(--noctra-cyan)" }}
                      >
                        <Copy size={11} /> Copy
                      </button>
                    </div>
                    <pre
                      className="text-xs p-3 rounded-lg overflow-x-auto whitespace-pre-wrap"
                      style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-soft)", fontFamily: "monospace", maxHeight: 240 }}
                    >
                      {executionPkg?.promptPack ?? briefing.suggestedPrompt}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* ── INTELLIGENCE BRIEF ───────────────────────────────────────── */}
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

            {/* ── STATS ROW ───────────────────────────────────────────────── */}
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

            {/* ── PIPELINE PROGRESS ───────────────────────────────────────── */}
            <Panel>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>
                  Founder Pipeline
                </p>
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
                        {step.done ? "✓" : i + 1}
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

            {/* ── SMART NEXT ACTION ───────────────────────────────────────── */}
            <div
              className="flex items-center justify-between gap-4 px-4 py-4 rounded-xl"
              style={{
                background: smartNextAction.priority === "critical" ? "rgba(244,63,94,0.07)" : smartNextAction.priority === "high" ? "rgba(61,216,255,0.06)" : "rgba(149,117,255,0.06)",
                border: `1px solid ${smartNextAction.priority === "critical" ? "rgba(244,63,94,0.25)" : smartNextAction.priority === "high" ? "rgba(61,216,255,0.2)" : "rgba(149,117,255,0.2)"}`,
              }}
            >
              <div className="flex items-start gap-3 min-w-0">
                <ChevronRight size={16} style={{ color: smartNextAction.priority === "critical" ? "var(--noctra-rose)" : smartNextAction.priority === "high" ? "var(--noctra-cyan)" : "var(--noctra-violet)", flexShrink: 0, marginTop: 2 }} />
                <div className="min-w-0">
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
                Go <ArrowRight size={11} />
              </button>
            </div>

            {/* ── PRODUCT BRAIN INSIGHTS ───────────────────────────────────── */}
            {brain && brain.insights.length > 0 && (
              <Panel>
                <div className="flex items-center gap-2 mb-3">
                  <Brain size={14} style={{ color: "var(--noctra-violet)" }} />
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-violet)" }}>
                    Product Brain
                  </p>
                  <span className="ml-auto text-xs font-mono" style={{ color: "var(--noctra-text-muted)" }}>
                    {brain.nodes.length} nodes · {brain.clusters.length} clusters
                  </span>
                </div>

                {/* Cluster health */}
                {brain.clusters.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {brain.clusters.map((cluster) => {
                      const clusterColor = cluster.healthSignal === "green" ? "var(--noctra-emerald)" : cluster.healthSignal === "red" ? "var(--noctra-rose)" : cluster.healthSignal === "amber" ? "var(--noctra-amber)" : "var(--noctra-text-muted)";
                      return (
                        <div key={cluster.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs" style={{ background: `${clusterColor}10`, border: `1px solid ${clusterColor}30` }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: clusterColor }} />
                          <span style={{ color: "var(--noctra-text-soft)" }}>{cluster.name}</span>
                          <span className="font-mono text-[10px]" style={{ color: "var(--noctra-text-muted)" }}>{cluster.nodeIds.length}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Insights */}
                <div className="space-y-2">
                  {brain.insights.slice(0, 4).map((insight) => {
                    const sColor = SEV_COLOR[insight.severity] ?? "var(--noctra-text-muted)";
                    return (
                      <div key={insight.id} className="flex items-start gap-3 px-3 py-2.5 rounded-lg" style={{ background: `${sColor}08`, border: `1px solid ${sColor}20` }}>
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: sColor }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium" style={{ color: "var(--noctra-text)" }}>{insight.title}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{insight.description}</p>
                        </div>
                        <button
                          onClick={() => navigate(insight.actionHref)}
                          className="shrink-0 text-xs px-2 py-1 rounded-md"
                          style={{ background: `${sColor}15`, color: sColor }}
                        >
                          {insight.actionLabel}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            )}

            {/* ── CONTRADICTION ENGINE ────────────────────────────────────── */}
            {contradictions.length > 0 && (
              <Panel>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={14} style={{ color: "var(--noctra-rose)" }} />
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-rose)" }}>
                    Intelligence Contradictions ({contradictions.length})
                  </p>
                  {alignmentScore !== null && (
                    <span className="ml-auto text-xs font-mono" style={{ color: alignmentScore >= 70 ? "var(--noctra-emerald)" : alignmentScore >= 50 ? "var(--noctra-amber)" : "var(--noctra-rose)" }}>
                      {alignmentScore}/100 alignment
                    </span>
                  )}
                </div>
                <div className="space-y-2.5">
                  {contradictions.slice(0, 4).map((c) => (
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
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <button
                          onClick={() => navigate("/app/reality")}
                          className="text-[10px] px-2 py-0.5 rounded"
                          style={{ background: "rgba(61,216,255,0.08)", color: "var(--noctra-cyan)", border: "1px solid rgba(61,216,255,0.2)" }}
                        >
                          Run Reality Compiler
                        </button>
                        <button
                          onClick={() => navigate("/app/twin")}
                          className="text-[10px] px-2 py-0.5 rounded"
                          style={{ background: "var(--noctra-surface2)", color: "var(--noctra-text-muted)", border: "1px solid var(--noctra-border)" }}
                        >
                          Ask Product Twin
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {/* ── ROADMAP ─────────────────────────────────────────────────── */}
            {roadmap && (roadmap.now.length > 0 || roadmap.next.length > 0) && (
              <Panel>
                <div className="flex items-center gap-2 mb-3">
                  <Map size={14} style={{ color: "var(--noctra-cyan)" }} />
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>
                    Intelligence Roadmap
                  </p>
                  <div className="ml-auto flex gap-1">
                    {(["now", "next", "later"] as const).map((tab) => {
                      const count = tab === "now" ? roadmap.now.length : tab === "next" ? roadmap.next.length : roadmap.later.length;
                      return (
                        <button
                          key={tab}
                          onClick={() => setActiveRoadmapTab(tab)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all"
                          style={{
                            background: activeRoadmapTab === tab ? "rgba(61,216,255,0.12)" : "transparent",
                            border: activeRoadmapTab === tab ? "1px solid rgba(61,216,255,0.3)" : "1px solid transparent",
                            color: activeRoadmapTab === tab ? "var(--noctra-cyan)" : "var(--noctra-text-muted)",
                          }}
                        >
                          {tab} <span className="opacity-60">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sprint goal */}
                {activeRoadmapTab === "now" && roadmap.recommendedSprint.goal && (
                  <div className="px-3 py-2 rounded-lg mb-3" style={{ background: "rgba(149,117,255,0.06)", border: "1px solid rgba(149,117,255,0.15)" }}>
                    <p className="text-xs font-medium" style={{ color: "var(--noctra-violet)" }}>Recommended Sprint</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{roadmap.recommendedSprint.goal}</p>
                  </div>
                )}

                {/* Kill list */}
                {activeRoadmapTab === "later" && roadmap.kill.length > 0 && (
                  <div className="px-3 py-2 rounded-lg mb-3" style={{ background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.15)" }}>
                    <p className="text-xs font-medium mb-1.5" style={{ color: "var(--noctra-rose)" }}>Stop Doing</p>
                    {roadmap.kill.map((k, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs mb-1">
                        <span style={{ color: "var(--noctra-rose)" }}>×</span>
                        <span style={{ color: "var(--noctra-text-muted)" }}>{k}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  {activeRoadmapItems.slice(0, 5).map((item) => {
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

                <div className="flex gap-2 mt-3 flex-wrap">
                  <button
                    onClick={createRoadmapTasks}
                    disabled={creatingTasks}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                    style={{ background: "rgba(61,216,255,0.1)", border: "1px solid rgba(61,216,255,0.25)", color: "var(--noctra-cyan)" }}
                  >
                    {creatingTasks ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                    Create Roadmap Tasks
                  </button>
                  <button
                    onClick={() => navigate("/app/tasks")}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                    style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-muted)" }}
                  >
                    View All Tasks <ArrowRight size={11} />
                  </button>
                </div>
              </Panel>
            )}

            {/* ── EXECUTION AUTOPILOT ─────────────────────────────────────── */}
            {executionPkg && (
              <Panel>
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={14} style={{ color: "var(--noctra-amber)" }} />
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-amber)" }}>
                    Execution Autopilot
                  </p>
                </div>

                <div className="px-3 py-2.5 rounded-lg mb-3" style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)" }}>
                  <p className="text-xs font-semibold" style={{ color: "var(--noctra-text)" }}>{executionPkg.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{executionPkg.goal}</p>
                </div>

                {/* Task batch preview */}
                <div className="space-y-1.5 mb-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Task Batch ({executionPkg.taskBatch.length})</p>
                  {executionPkg.taskBatch.slice(0, 4).map((t, i) => {
                    const tc = t.priority === "critical" ? "var(--noctra-rose)" : t.priority === "high" ? "var(--noctra-amber)" : "var(--noctra-cyan)";
                    return (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-[10px] font-mono w-4 shrink-0 mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{i + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-medium" style={{ color: "var(--noctra-text)" }}>{t.title}</p>
                            <span className="text-[9px] px-1 py-0.5 rounded uppercase font-semibold" style={{ background: `${tc}12`, color: tc }}>{t.priority}</span>
                          </div>
                          <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--noctra-text-muted)" }}>{t.detail}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Expected outcome */}
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg mb-3" style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.12)" }}>
                  <CheckCircle size={11} style={{ color: "var(--noctra-emerald)", marginTop: 1, flexShrink: 0 }} />
                  <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{executionPkg.expectedOutcome}</p>
                </div>

                {/* Risk if ignored */}
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg mb-3" style={{ background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.12)" }}>
                  <Info size={11} style={{ color: "var(--noctra-rose)", marginTop: 1, flexShrink: 0 }} />
                  <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}><span style={{ color: "var(--noctra-rose)" }}>Risk if ignored: </span>{executionPkg.riskIfIgnored}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={createAutopilotTasks}
                    disabled={creatingTasks}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                    style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "var(--noctra-amber)" }}
                  >
                    {creatingTasks ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
                    Create Task Batch
                  </button>
                  <button
                    onClick={copyPrompt}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                    style={{ background: "rgba(61,216,255,0.08)", border: "1px solid rgba(61,216,255,0.2)", color: "var(--noctra-cyan)" }}
                  >
                    <Copy size={11} />
                    Copy Replit Prompt
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([executionPkg.promptPack], { type: "text/markdown" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `execution-plan-${Date.now()}.md`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                    style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-muted)" }}
                  >
                    <Download size={11} />
                    Download Plan
                  </button>
                </div>
              </Panel>
            )}

            {/* ── SCORE TRENDS ────────────────────────────────────────────── */}
            {trends.length > 0 && (
              <Panel>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--noctra-text-muted)" }}>Score Trends</p>
                <div className="space-y-2">
                  {trends.map((t) => {
                    const tool = TOOL_BY_KEY[t.tool as keyof typeof TOOL_BY_KEY];
                    const color = tool?.accent ?? "var(--noctra-cyan)";
                    const deltaColor = t.direction === "up" ? "var(--noctra-emerald)" : t.direction === "down" ? "var(--noctra-rose)" : "var(--noctra-text-muted)";
                    return (
                      <div key={t.tool} className="flex items-center gap-3 py-1 cursor-pointer group" onClick={() => tool && navigate(tool.route)}>
                        <span className="text-xs w-28 shrink-0 group-hover:opacity-80 transition-opacity" style={{ color: "var(--noctra-text-soft)" }}>
                          {t.label}
                        </span>
                        <div className="flex-1">
                          <ProgressBar value={t.latestScore} color={color} />
                        </div>
                        <span className="text-xs font-mono w-8 text-right shrink-0" style={{ color }}>{t.latestScore}</span>
                        {t.delta != null && (
                          <div className="flex items-center gap-0.5 w-12 justify-end shrink-0" style={{ color: deltaColor }}>
                            {t.direction === "up" ? <TrendingUp size={10} /> : t.direction === "down" ? <TrendingDown size={10} /> : <Minus size={10} />}
                            <span className="text-xs font-mono">{t.delta > 0 ? "+" : ""}{t.delta}</span>
                          </div>
                        )}
                        {t.direction === "new" && (
                          <span className="text-xs w-12 text-right shrink-0" style={{ color: "var(--noctra-text-muted)" }}>new</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Panel>
            )}

            {/* ── TOOL COVERAGE ───────────────────────────────────────────── */}
            {coverage && (
              <Panel>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Intelligence Coverage</p>
                  <span className="text-xs font-mono" style={{ color: coverage.percentage >= 70 ? "var(--noctra-emerald)" : coverage.percentage >= 40 ? "var(--noctra-amber)" : "var(--noctra-rose)" }}>
                    {coverage.percentage}%
                  </span>
                </div>
                <ProgressBar
                  value={coverage.percentage}
                  color={coverage.percentage >= 70 ? "var(--noctra-emerald)" : coverage.percentage >= 40 ? "var(--noctra-amber)" : "var(--noctra-rose)"}
                />
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {INTELLIGENCE_TOOL_KEYS.map((key) => {
                    const done = coverage.covered.includes(key);
                    const tool = TOOL_BY_KEY[key as keyof typeof TOOL_BY_KEY];
                    return (
                      <button
                        key={key}
                        onClick={() => tool && navigate(tool.route)}
                        className="px-2.5 py-1 rounded-full text-xs transition-all"
                        style={{
                          background: done ? `${tool?.accent ?? "var(--noctra-cyan)"}18` : "var(--noctra-surface2)",
                          border: `1px solid ${done ? `${tool?.accent ?? "var(--noctra-cyan)"}40` : "var(--noctra-border)"}`,
                          color: done ? (tool?.accent ?? "var(--noctra-cyan)") : "var(--noctra-text-muted)",
                          opacity: done ? 1 : 0.6,
                        }}
                      >
                        {done ? "✓ " : ""}{tool?.short ?? key}
                      </button>
                    );
                  })}
                </div>
                {coverage.nextRecommended && (
                  <button
                    onClick={() => {
                      const tool = TOOL_BY_KEY[coverage.nextRecommended! as keyof typeof TOOL_BY_KEY];
                      if (tool) navigate(tool.route);
                    }}
                    className="mt-3 flex items-center gap-1.5 text-xs"
                    style={{ color: "var(--noctra-cyan)" }}
                  >
                    <ArrowRight size={11} />
                    Run {TOOL_BY_KEY[coverage.nextRecommended as keyof typeof TOOL_BY_KEY]?.label ?? coverage.nextRecommended} next
                  </button>
                )}
              </Panel>
            )}

            {/* ── INSIGHT SWEEP (AI synthesis) ────────────────────────────── */}
            {hasIntelligence && (
              <Panel>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} style={{ color: "var(--noctra-violet)" }} />
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Insight Sweep</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--noctra-surface2)", color: "var(--noctra-text-muted)", border: "1px solid var(--noctra-border)" }}>AI</span>
                  </div>
                  {!sweep && (
                    <button
                      onClick={runInsightSweep}
                      disabled={sweeping}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: sweeping ? "var(--noctra-surface2)" : "var(--noctra-violet)22", border: "1px solid var(--noctra-violet)40", color: "var(--noctra-violet)", opacity: sweeping ? 0.7 : 1 }}
                    >
                      {sweeping ? <Loader2 size={11} className="animate-spin" /> : <Brain size={11} />}
                      {sweeping ? "Sweeping…" : `Sweep ${reports.length} reports`}
                    </button>
                  )}
                </div>

                {!sweep && !sweeping && !sweepError && (
                  <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>
                    AI synthesis across all {reports.length} report{reports.length !== 1 ? "s" : ""} — surfaces cross-tool contradictions and strategic priorities that deterministic rules miss.
                  </p>
                )}
                {sweeping && (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2 size={14} className="animate-spin" style={{ color: "var(--noctra-violet)" }} />
                    <span className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>Synthesizing {reports.length} reports…</span>
                  </div>
                )}
                {sweepError && <p className="text-xs" style={{ color: "var(--noctra-rose)" }}>{sweepError}</p>}

                {sweep ? (
                  <div className="space-y-4">
                    {typeof sweepData?.headline === "string" && (
                      <p className="text-sm font-semibold" style={{ color: "var(--noctra-text)" }}>{sweepData.headline as string}</p>
                    )}
                    {typeof sweepData?.trajectory === "string" && (
                      <div className="flex items-center gap-1.5">
                        <span style={{ color: sweepData.trajectory === "improving" ? "var(--noctra-emerald)" : sweepData.trajectory === "declining" ? "var(--noctra-rose)" : "var(--noctra-amber)" }}>
                          {TRAJECTORY_ICON[sweepData.trajectory as keyof typeof TRAJECTORY_ICON]}
                        </span>
                        <span className="text-xs capitalize" style={{ color: sweepData.trajectory === "improving" ? "var(--noctra-emerald)" : sweepData.trajectory === "declining" ? "var(--noctra-rose)" : "var(--noctra-amber)" }}>
                          {sweepData.trajectory as string}
                        </span>
                      </div>
                    )}
                    {typeof sweepData?.analysis === "string" && (
                      <p className="text-xs leading-relaxed" style={{ color: "var(--noctra-text-soft)" }}>{sweepData.analysis as string}</p>
                    )}
                    {sweepContradictions.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-2" style={{ color: "var(--noctra-rose)" }}>AI Contradictions</p>
                        <div className="space-y-2">
                          {sweepContradictions.map((c, i) => (
                            <div key={i} className="px-3 py-2 rounded-lg" style={{ background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.15)" }}>
                              <p className="text-xs" style={{ color: "var(--noctra-text)" }}>{c.description}</p>
                              <p className="text-xs mt-1" style={{ color: "var(--noctra-text-muted)" }}>→ {c.resolution}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {sweepPatterns.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-2" style={{ color: "var(--noctra-violet)" }}>Patterns</p>
                        <div className="space-y-2">
                          {sweepPatterns.map((p, i) => (
                            <div key={i} className="px-3 py-2 rounded-lg" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                              <p className="text-xs font-medium" style={{ color: "var(--noctra-text)" }}>{p.pattern}</p>
                              <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{p.implication}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {sweepPriorities.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-2" style={{ color: "var(--noctra-cyan)" }}>Next Priorities</p>
                        <ol className="space-y-1.5">
                          {sweepPriorities.map((p, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              <span className="font-mono shrink-0" style={{ color: "var(--noctra-text-muted)" }}>{i + 1}.</span>
                              <span style={{ color: "var(--noctra-text-soft)" }}>{p}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                    <button onClick={() => { setSweep(null); setSweepError(""); }} className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>
                      Run again
                    </button>
                  </div>
                ) : null}
              </Panel>
            )}

            {/* ── SCORE RINGS ─────────────────────────────────────────────── */}
            {scoreEntries.length > 0 && (
              <Panel>
                <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--noctra-text-muted)" }}>Intelligence Scores</p>
                <div className="flex flex-wrap gap-6 justify-center">
                  {scoreEntries.map(([tool, score]) => {
                    const t = TOOL_BY_KEY[tool as keyof typeof TOOL_BY_KEY];
                    return (
                      <div key={tool} className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => t && navigate(t.route)}>
                        <ScoreRing value={score as number} size={72} stroke={6} label={t?.short ?? tool} color={t?.accent ?? "var(--noctra-cyan)"} />
                      </div>
                    );
                  })}
                </div>
              </Panel>
            )}

            {/* ── RISK RADAR ──────────────────────────────────────────────── */}
            {radarRisks.length > 0 && (
              <Panel>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldOff size={13} style={{ color: "var(--noctra-amber)" }} />
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-amber)" }}>Risk Radar</p>
                  <span className="ml-auto text-xs font-mono" style={{ color: "var(--noctra-text-muted)" }}>{radarRisks.length} risk{radarRisks.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="space-y-2">
                  {radarRisks.slice(0, 5).map((risk) => (
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
                  {radarRisks.length > 5 && (
                    <p className="text-xs text-center pt-1" style={{ color: "var(--noctra-text-muted)" }}>+{radarRisks.length - 5} more risks in project view</p>
                  )}
                </div>
              </Panel>
            )}

            {/* ── SCORE HISTORY ───────────────────────────────────────────── */}
            {scoreHistoryEntries.length > 0 && (
              <Panel>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--noctra-text-muted)" }}>Score History</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {scoreHistoryEntries.map((entry) => {
                    const tool = TOOL_BY_KEY[entry.tool as keyof typeof TOOL_BY_KEY];
                    const deltaColor = getDeltaColor(entry.direction);
                    return (
                      <div key={entry.tool} className="rounded-lg p-3" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          {tool ? <tool.icon size={11} style={{ color: tool.accent }} /> : null}
                          <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--noctra-text-muted)" }}>{tool?.short ?? entry.tool}</span>
                        </div>
                        <p className="text-lg font-bold font-mono leading-none" style={{ color: tool?.accent ?? "var(--noctra-cyan)" }}>{entry.latestScore}</p>
                        {entry.delta != null ? (
                          <p className="text-[10px] mt-1 font-medium" style={{ color: deltaColor }}>{getDeltaLabel(entry)}</p>
                        ) : (
                          <p className="text-[10px] mt-1" style={{ color: "var(--noctra-text-muted)" }}>first run</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Panel>
            )}

            {/* ── RECENT ACTIVITY TIMELINE ────────────────────────────────── */}
            {recentTimeline.length > 0 && (
              <Panel>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock size={13} style={{ color: "var(--noctra-text-muted)" }} />
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Recent Activity</p>
                  </div>
                  <button onClick={() => navigate("/app/reports")} className="text-xs" style={{ color: "var(--noctra-cyan)" }}>All reports →</button>
                </div>
                <div className="space-y-3">
                  {recentTimeline.map((event) => (
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
            )}

            {/* ── QUICK NAV ───────────────────────────────────────────────── */}
            <Panel>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Intelligence Tools</p>
                <span className="text-[10px]" style={{ color: "var(--noctra-text-muted)" }}>or press ⌘K</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {TOOLS.filter((t) => INTELLIGENCE_TOOL_KEYS.includes(t.key)).map((tool) => {
                  const Icon = tool.icon;
                  const hasCoverage = coverage?.covered.includes(tool.key);
                  return (
                    <button
                      key={tool.key}
                      onClick={() => navigate(tool.route)}
                      className="flex items-center gap-2 p-3 rounded-lg text-left transition-colors hover:bg-white/3 border"
                      style={{ borderColor: hasCoverage ? `${tool.accent}30` : "var(--noctra-border)" }}
                    >
                      <Icon size={13} style={{ color: tool.accent, flexShrink: 0 }} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: "var(--noctra-text)" }}>{tool.short}</p>
                        {hasCoverage && <p className="text-[9px]" style={{ color: "var(--noctra-emerald)" }}>✓ run</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Panel>

            {/* ── RECENT REPORTS ──────────────────────────────────────────── */}
            {(data?.reports.length ?? 0) > 0 && (
              <Panel>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Recent Reports</p>
                  <button onClick={() => navigate("/app/reports")} className="text-xs" style={{ color: "var(--noctra-cyan)" }}>View all</button>
                </div>
                <div className="space-y-2">
                  {data!.reports.slice(0, 5).map((r: Record<string, unknown>) => {
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
                          <span className="text-sm truncate" style={{ color: "var(--noctra-text-soft)" }}>{String(r.title)}</span>
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

            {/* ── EMPTY STATE ─────────────────────────────────────────────── */}
            {(data?.reports.length ?? 0) === 0 && (
              <Panel>
                <EmptyState
                  icon={<Zap size={24} />}
                  title="No intelligence yet"
                  body="Run your first tool to start building your founder intelligence stack. Start with Signal Chamber — it takes 2 minutes and unlocks the full analysis pipeline."
                />
                <div className="flex flex-col sm:flex-row justify-center gap-2 mt-4">
                  <button
                    onClick={() => navigate("/app/idea")}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                    style={{ background: "var(--noctra-cyan)", color: "#000" }}
                  >
                    Start with Signal Chamber <ArrowRight size={14} />
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
            )}

            {/* ── CMD+K HINT ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-center gap-2 py-3 text-xs" style={{ color: "var(--noctra-text-muted)" }}>
              <Command size={11} />
              <span>K — search tools, navigate, or ask the Product Twin</span>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
