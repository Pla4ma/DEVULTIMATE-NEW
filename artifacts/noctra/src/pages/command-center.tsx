import { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { getDashboardData, getReports, getProofSignals, getTasks, getProjects, createTask, saveTasks } from "@/lib/repository";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import { useProgression } from "@/lib/progression-context";
import { computeNextAction } from "@/lib/next-action";
import { extractRisks, RISK_SEV_COLOR } from "@/lib/risk-radar";
import { computeScoreHistory, getDeltaLabel, getDeltaColor, type ScoreHistoryEntry } from "@/lib/score-history";
import { getUsage, getUsagePercent, getUsageColor } from "@/lib/usage";
import { extractScoreTrends, computeToolCoverage, generateInsightBrief, type ScoreTrend, type ToolCoverage, type InsightBrief, type ReportSummary } from "@/lib/intelligence";
import { generateDailyBriefing, type DailyBriefing } from "@/lib/daily-briefing";
import { runContradictionEngine, type EnhancedContradiction } from "@/lib/contradiction-engine";
import { generateRoadmap, type Roadmap } from "@/lib/roadmap";
import { buildProductBrain, type ProductBrain } from "@/lib/product-brain";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, FileText, CheckSquare, FolderOpen, Zap, AlertTriangle,
  TrendingUp, TrendingDown, Minus, Brain, Target, Clock, Stethoscope,
  Lightbulb, Rocket, XCircle, CheckCircle, Shield, BarChart3, ExternalLink,
  RotateCcw, ListChecks, RefreshCw, Sparkles, Activity, ArrowUpRight,
} from "lucide-react";

type DashData = {
  reports: Array<{ id: string; tool?: string; score?: number | null; created_at?: string }>;
  tasks: Array<{ id: string }>;
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } },
};

export default function CommandCenterPage() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  useProgression();
  const [usage, setUsage] = useState<{ plan: string; scans: { used: number; limit: number | string }; reports: { used: number; limit: number | string } } | null>(null);
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [insightBrief, setInsightBrief] = useState<InsightBrief | null>(null);
  const [trends, setTrends] = useState<ScoreTrend[]>([]);
  const [coverage, setCoverage] = useState<ToolCoverage | null>(null);
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [contradictions, setContradictions] = useState<EnhancedContradiction[]>([]);
  const [alignmentScore, setAlignmentScore] = useState<number | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [brain, setBrain] = useState<ProductBrain | null>(null);
  const [proofSignals, setProofSignals] = useState<{ id: string; kind?: string; label?: string; created_at?: string }[]>([]);
  const [allProjects, setAllProjects] = useState<{ id: string; name: string; stage?: string | null; updated_at?: string }[]>([]);
  const [allTasks, setAllTasks] = useState<{ id: string; status: string; priority: string; title?: string; category?: string | null; created_at?: string; updated_at?: string }[]>([]);

  const runIntelligence = useCallback((reps: ReportSummary[], taskList: typeof allTasks, signals: typeof proofSignals) => {
    if (reps.length === 0 && taskList.length === 0) return;
    setInsightBrief(generateInsightBrief(reps));
    const engineResult = runContradictionEngine(reps);
    setContradictions(engineResult.contradictions);
    setAlignmentScore(engineResult.alignmentScore);
    setTrends(extractScoreTrends(reps));
    setCoverage(computeToolCoverage(reps));
    setBriefing(generateDailyBriefing({ reports: reps, tasks: taskList, proofSignals: signals }));
    setRoadmap(generateRoadmap({ reports: reps, tasks: taskList, proofSignals: signals }));
    setBrain(buildProductBrain({ reports: reps, tasks: taskList, proofSignals: signals }));
  }, []);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    let loadedReports: ReportSummary[] = [];
    let loadedTasks: typeof allTasks = [];
    let loadedSignals: typeof proofSignals = [];
    const dashPromise = getDashboardData().then((d) => setData(d as unknown as DashData | null)).catch(() => { toast({ title: "Failed to load dashboard data", description: "Some widgets may be unavailable.", variant: "destructive" }); return null; });
    const reportsPromise = getReports().then((r) => { loadedReports = (r as ReportSummary[]) ?? []; setReports(loadedReports); }).catch(() => { toast({ title: "Failed to load reports", variant: "destructive" }); return null; });
    const signalsPromise = getProofSignals().then((s) => { loadedSignals = (s as { id: string }[]) ?? []; setProofSignals(loadedSignals); }).catch(() => { toast({ title: "Failed to load proof signals", variant: "destructive" }); return null; });
    const projectsPromise = getProjects().then((p) => setAllProjects((p as { id: string; name: string; stage?: string | null }[]) ?? [])).catch(() => { toast({ title: "Failed to load projects", variant: "destructive" }); return null; });
    const tasksPromise = getTasks().then((t) => { loadedTasks = (t as typeof allTasks) ?? []; setAllTasks(loadedTasks); }).catch(() => { toast({ title: "Failed to load tasks", variant: "destructive" }); return null; });
    const usagePromise = getUsage().then((u) => {
      if (u) {
        const s = u.usage["scansPerDay"] ?? u.usage["scan-upload"];
        const r = u.usage["structuredReportsPerDay"] ?? u.usage["structured"];
        setUsage({ plan: u.plan, scans: s ?? { used: 0, limit: "unlimited" }, reports: r ?? { used: 0, limit: "unlimited" } });
      }
    }).catch(() => { toast({ title: "Failed to load usage stats", variant: "destructive" }); return null; });
    return Promise.all([dashPromise, reportsPromise, signalsPromise, projectsPromise, tasksPromise, usagePromise])
      .then(() => runIntelligence(loadedReports, loadedTasks, loadedSignals))
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, [runIntelligence, toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const smartNextAction = useMemo(() => computeNextAction({
    reports: reports as { id: string; tool: string; score?: number | null; created_at: string }[],
    tasks: allTasks, projects: allProjects, proofSignals,
  }), [reports, allTasks, allProjects, proofSignals]);

  const doctorReports = reports.filter((r: ReportSummary) => r.tool === "doctor");
  const lastDoctor = doctorReports[doctorReports.length - 1];
  const lastPayload = lastDoctor?.payload ? (lastDoctor.payload as Record<string, unknown>) : null;
  const lastData = lastPayload?.data ? (lastPayload.data as Record<string, unknown>) : null;
  const launchScore = typeof lastDoctor?.score === "number" ? lastDoctor.score : (lastData?.health_score as number) ?? null;
  const scoreHistoryEntries = reports.length > 0
    ? computeScoreHistory(reports as Array<{ id: string; tool: string; score?: number | null; created_at: string }>)
    : [];
  const doctorScoreHist = scoreHistoryEntries.filter((e: ScoreHistoryEntry) => e.tool === "doctor");
  const prevScore = doctorScoreHist.length > 0 ? doctorScoreHist[0]?.previousScore ?? null : null;
  const scoreDelta = launchScore != null && prevScore != null ? launchScore - prevScore : null;
  const healthTrend = useMemo(() => {
    const doctorEntries = scoreHistoryEntries.filter((e: ScoreHistoryEntry) => e.tool === "doctor");
    if (doctorEntries.length < 2) return null;
    const last = doctorEntries[doctorEntries.length - 1];
    if (!last) return null;
    return { direction: last.direction, delta: last.delta, previousScore: last.previousScore, latestScore: last.latestScore };
  }, [scoreHistoryEntries]);

  const redGates: string[] = [];
  if (lastDoctor?.payload) {
    const p = lastDoctor.payload as Record<string, unknown>;
    const d = (p.data ?? p) as Record<string, unknown>;
    const gates = (d.gates ?? []) as Array<{ name: string; status: string }>;
    const gateRed = gates.filter((g: { name: string; status: string }) => g.status === "RED").map((g: { name: string; status: string }) => g.name);
    const redStrings = (d.red_gates ?? []) as string[];
    redGates.push(...gateRed, ...redStrings.filter((s: string) => typeof s === "string"));
  }

  const openCritical = allTasks.filter(t => t.status !== "completed" && t.priority === "critical").length;
  const openHigh = allTasks.filter(t => t.status !== "completed" && t.priority === "high").length;
  const openCount = openCritical + openHigh;
  const completedTasks = allTasks.filter(t => t.status === "completed").length;
  const hasIssues = redGates.length > 0;
  const scanCount = doctorReports.length;
  const launchColor = launchScore != null
    ? (launchScore >= 70 ? "var(--color-success)" : launchScore >= 40 ? "var(--color-warning)" : "var(--color-danger)")
    : "var(--text-tertiary)";
  const statusLabel = launchScore != null
    ? (launchScore >= 70 ? "Launch Ready" : launchScore >= 40 ? "Needs Work" : "Blocked")
    : "Not Scanned";

  return (
    <AppShell>
      <motion.div
        className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Command Center</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
              {launchScore != null
                ? `What to fix next to get closer to launch`
                : "Upload your project to start your launch readiness loop"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/app/code-health")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: "var(--accent-cyan)", color: "#000", boxShadow: "var(--shadow-glow)" }}
            >
              <Stethoscope size={16} />
              {lastDoctor ? "Rescan Project" : "Run Product Doctor"}
            </motion.button>
            {!loading && (
              <button
                onClick={() => loadData(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm transition-all hover:opacity-80"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-tertiary)" }}
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}
          </div>
        </motion.div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl border p-5 skeleton" style={{ borderColor: "var(--border-subtle)", height: 120 }} />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="rounded-xl border p-5 skeleton" style={{ borderColor: "var(--border-subtle)", height: 200 }} />
              ))}
            </div>
          </div>
        ) : (data?.reports.length ?? 0) === 0 && allTasks.length === 0 ? (
          <motion.div variants={fadeInUp} className="space-y-8">
            <div className="text-center py-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
                style={{ background: "var(--accent-cyan)", boxShadow: "var(--shadow-glow)" }}
              >
                <Zap size={28} className="text-black" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
                Launch readiness starts with a scan.
              </h2>
              <p className="text-base max-w-lg mx-auto" style={{ color: "var(--text-secondary)" }}>
                Upload your codebase. Get a launch score, blockers, and a prioritized fix queue. Rescan to track improvement.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/app/code-health")}
                className="rounded-xl border p-6 text-left transition-all group"
                style={{ background: "var(--surface-1)", borderColor: "var(--border-default)", boxShadow: "var(--shadow-md)" }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "var(--color-danger-soft)" }}>
                  <Stethoscope size={22} style={{ color: "var(--color-danger)" }} />
                </div>
                <p className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Scan a codebase</p>
                <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>Upload your repo ZIP. Get launch readiness, gates, fix tasks, and build prompt.</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg" style={{ background: "var(--color-danger)", color: "#fff" }}>
                  Upload Project ZIP <ArrowRight size={14} />
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/app/idea-lab")}
                className="rounded-xl border p-6 text-left transition-all group"
                style={{ background: "var(--surface-1)", borderColor: "var(--border-default)", boxShadow: "var(--shadow-md)" }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "var(--accent-violet-soft)" }}>
                  <Lightbulb size={22} style={{ color: "var(--accent-violet)" }} />
                </div>
                <p className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Describe an idea</p>
                <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>Get a signal score, top risks, and a verdict. Know what to validate next.</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg" style={{ background: "var(--accent-cyan)", color: "#000" }}>
                  Check My Idea <ArrowRight size={14} />
                </span>
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <motion.div variants={fadeInUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                whileHover={{ y: -2 }}
                className="rounded-xl border p-5"
                style={{ background: "var(--surface-1)", borderColor: "var(--border-default)", boxShadow: "var(--shadow-sm)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={14} style={{ color: "var(--text-tertiary)" }} />
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Launch Readiness</p>
                </div>
                {launchScore != null ? (
                  <div>
                    <div className="flex items-end gap-2">
                      <motion.span
                        key={launchScore}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-4xl font-bold"
                        style={{ color: launchColor }}
                      >
                        {launchScore}
                      </motion.span>
                      <span className="text-sm mb-1" style={{ color: "var(--text-tertiary)" }}>/100</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{
                        background: launchScore >= 70 ? "var(--color-success-soft)" : launchScore >= 40 ? "var(--color-warning-soft)" : "var(--color-danger-soft)",
                        color: launchColor,
                      }}>{statusLabel}</span>
                      {scoreDelta != null && healthTrend && (
                        <span className="text-xs flex items-center gap-1" style={{ color: healthTrend.direction === "improved" ? "var(--color-success)" : healthTrend.direction === "declined" ? "var(--color-danger)" : "var(--text-tertiary)" }}>
                          {healthTrend.direction === "improved" ? <TrendingUp size={12} /> : healthTrend.direction === "declined" ? <TrendingDown size={12} /> : <Minus size={12} />}
                          {scoreDelta != null ? (scoreDelta >= 0 ? "+" : "") + scoreDelta : ""} pts
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg" style={{ color: "var(--text-tertiary)" }}>No scan yet</p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-quaternary)" }}>Run Product Doctor to begin</p>
                  </div>
                )}
              </motion.div>

              <motion.div
                whileHover={{ y: -2 }}
                className="rounded-xl border p-5"
                style={{ background: "var(--surface-1)", borderColor: "var(--border-default)", boxShadow: "var(--shadow-sm)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <XCircle size={14} style={{ color: hasIssues ? "var(--color-danger)" : "var(--text-tertiary)" }} />
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Top Blocker{redGates.length !== 1 ? "s" : ""}</p>
                </div>
                {redGates.length > 0 ? (
                  <div>
                    <p className="text-lg font-semibold" style={{ color: "var(--color-danger)" }}>{redGates[0]}</p>
                    {redGates.length > 1 && (
                      <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>+{redGates.length - 1} more blockers</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-lg" style={{ color: "var(--text-tertiary)" }}>{scanCount > 0 ? "All gates clear" : "No data"}</p>
                    {scanCount > 0 && <CheckCircle size={18} className="mt-2" style={{ color: "var(--color-success)" }} />}
                  </div>
                )}
              </motion.div>

              <motion.div
                whileHover={{ y: -2 }}
                className="rounded-xl border p-5"
                style={{ background: "var(--surface-1)", borderColor: "var(--border-default)", boxShadow: "var(--shadow-sm)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Target size={14} style={{ color: "var(--accent-cyan)" }} />
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Next Fix</p>
                </div>
                <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  {smartNextAction.title || "Run Product Doctor"}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                  {smartNextAction.reason || "Start the scan → fix → rescan loop"}
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(smartNextAction.href || "/app/code-health")}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
                  style={{ background: "var(--accent-cyan)", color: "#000" }}
                >
                  Go <ArrowRight size={12} />
                </motion.button>
              </motion.div>

              <motion.div
                whileHover={{ y: -2 }}
                className="rounded-xl border p-5"
                style={{ background: "var(--surface-1)", borderColor: "var(--border-default)", boxShadow: "var(--shadow-sm)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <CheckSquare size={14} style={{ color: "var(--text-tertiary)" }} />
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Fix Task Queue</p>
                </div>
                <p className="text-3xl font-bold" style={{ color: openCount > 0 ? "var(--color-danger)" : "var(--color-success)" }}>
                  {allTasks.filter(t => t.status !== "completed").length}
                </p>
                <div className="flex gap-2 mt-2">
                  {openCritical > 0 && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}>{openCritical} critical</span>}
                  {openHigh > 0 && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--color-warning-soft)", color: "var(--color-warning)" }}>{openHigh} high</span>}
                  {completedTasks > 0 && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--color-success-soft)", color: "var(--color-success)" }}>{completedTasks} done</span>}
                </div>
              </motion.div>
            </motion.div>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/app/code-health")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "var(--color-danger)", color: "#fff" }}
              >
                <RotateCcw size={16} />
                {lastDoctor ? "Rescan & Recheck Score" : "Run Product Doctor"}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/app/build")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
              >
                <ListChecks size={16} />
                View All Tasks ({allTasks.length})
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/app/brain")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}
              >
                <FileText size={16} />
                Reports ({data?.reports.length ?? 0})
              </motion.button>
            </motion.div>

            {redGates.length > 0 && (
              <motion.div
                variants={fadeInUp}
                className="px-5 py-4 rounded-xl flex items-start gap-4"
                style={{ background: "var(--color-danger-soft)", border: "1px solid var(--color-danger)" }}
              >
                <XCircle size={18} style={{ color: "var(--color-danger)", flexShrink: 0, marginTop: 2 }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold" style={{ color: "var(--color-danger)" }}>{redGates.length} blocker{redGates.length !== 1 ? "s" : ""} blocking launch</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate("/app/code-health")}
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
                      style={{ background: "var(--color-danger)", color: "#fff" }}
                    >
                      Fix Now <ArrowRight size={12} />
                    </motion.button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {redGates.slice(0, 4).map((g, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5" style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}>
                        <XCircle size={10} />{g}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {brain && brain.insights.length > 0 && (
              <motion.div
                variants={fadeInUp}
                className="rounded-xl border p-5"
                style={{ background: "var(--surface-1)", borderColor: "var(--border-default)", boxShadow: "var(--shadow-sm)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Brain size={16} style={{ color: "var(--accent-magenta)" }} />
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Product Brain</p>
                </div>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{brain.insights[0]?.title ?? "Synthesis available"}</p>
                <p className="text-xs mt-2" style={{ color: "var(--text-tertiary)" }}>{brain.insights.length} insight{brain.insights.length !== 1 ? "s" : ""} · Alignment: {alignmentScore ?? "—"}</p>
              </motion.div>
            )}

            {briefing && (
              <motion.div
                variants={fadeInUp}
                className="rounded-xl border p-5"
                style={{ background: "var(--surface-1)", borderColor: "var(--border-default)", boxShadow: "var(--shadow-sm)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} style={{ color: "var(--accent-gold)" }} />
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>Daily Briefing</p>
                </div>
                <p className="text-base font-medium" style={{ color: "var(--text-primary)" }}>{briefing.greeting}</p>
                <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>{briefing.currentFocus}</p>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
    </AppShell>
  );
}
