import { useEffect, useState, useCallback, useMemo, lazy, Suspense } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { ROUTES } from "@/lib/routes";
import { useDataStore, type Task, type Project, type ProofSignal } from "@/stores/data-store";
import { getUsage } from "@/lib/repository";
import { useProgression } from "@/lib/progression-context";
import { computeNextAction } from "@/lib/next-action";
import { computeScoreHistory, type ScoreHistoryEntry } from "@/lib/score-history";
import { extractScoreTrends, computeToolCoverage, generateInsightBrief, type ScoreTrend, type ToolCoverage, type InsightBrief } from "@/lib/intelligence";
import type { ReportSummary } from "@/lib/report-utils";
import { generateDailyBriefing, type DailyBriefing } from "@/lib/daily-briefing";
import { runContradictionEngine, type EnhancedContradiction } from "@/lib/contradiction-engine";
import { generateRoadmap, type Roadmap } from "@/lib/roadmap";
import { buildProductBrain, type ProductBrain } from "@/lib/product-brain";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ObsidianButton } from "@/components/ObsidianButton";
import {
  ArrowRight, FileText, CheckSquare, Zap, AlertTriangle,
  TrendingUp, TrendingDown, Minus, Brain, Target, Stethoscope,
  XCircle, CheckCircle, Shield,
  RotateCcw, ListChecks, RefreshCw, Sparkles, Upload,
} from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } },
};

export default function CommandCenterPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  useProgression();

  const { reports, tasks: allTasks, projects: allProjects, signals: proofSignals, loading: storeLoading, fetchAll } = useDataStore();

  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [usage, setUsage] = useState<{ plan: string; scans: { used: number; limit: number | string }; reports: { used: number; limit: number | string } } | null>(null);
  const [insightBrief, setInsightBrief] = useState<InsightBrief | null>(null);
  const [trends, setTrends] = useState<ScoreTrend[]>([]);
  const [coverage, setCoverage] = useState<ToolCoverage | null>(null);
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [contradictions, setContradictions] = useState<EnhancedContradiction[]>([]);
  const [alignmentScore, setAlignmentScore] = useState<number | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [brain, setBrain] = useState<ProductBrain | null>(null);

  const runIntelligence = useCallback((reps: ReportSummary[], taskList: Task[], signals: ProofSignal[]) => {
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

  useEffect(() => {
    fetchAll().finally(() => setInitialLoad(false));
    getUsage().then((u) => {
      if (u) {
        const s = u.usage["scansPerDay"] ?? u.usage["scan-upload"];
        const r = u.usage["structuredReportsPerDay"] ?? u.usage["structured"];
        setUsage({ plan: u.plan, scans: s ?? { used: 0, limit: "unlimited" }, reports: r ?? { used: 0, limit: "unlimited" } });
      }
    }).catch(() => {});
  }, [fetchAll]);

  useEffect(() => {
    if (!initialLoad && reports.length > 0) {
      runIntelligence(reports, allTasks, proofSignals);
    }
  }, [reports, allTasks, proofSignals, initialLoad, runIntelligence]);

  const loading = initialLoad && storeLoading;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

  const smartNextAction = useMemo(() => computeNextAction({
    reports,
    tasks: allTasks, projects: allProjects, proofSignals,
  }), [reports, allTasks, allProjects, proofSignals]);

  const doctorReports = reports.filter((r: ReportSummary) => r.tool === "doctor");
  const lastDoctor = doctorReports[doctorReports.length - 1];
  const lastPayload = lastDoctor?.payload ? (lastDoctor.payload as Record<string, unknown>) : null;
  const lastData = lastPayload?.data ? (lastPayload.data as Record<string, unknown>) : null;
  const launchScore = typeof lastDoctor?.score === "number" ? lastDoctor.score : (lastData?.health_score as number) ?? null;
  const scoreHistoryEntries = reports.length > 0
    ? computeScoreHistory(reports)
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

  const scoreSeries = useMemo(() => {
    const docs = reports
      .filter((r: ReportSummary) => r.tool === "doctor" && typeof r.score === "number")
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return docs.map((r, i) => ({
      name: `Scan ${i + 1}`,
      date: new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      score: r.score as number,
    }));
  }, [reports]);

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

  const towerStatus = loading
    ? "idle"
    : redGates.length > 0
    ? "risk"
    : reports.length > 0
    ? "success"
    : "idle";
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
        className="max-w-6xl mx-auto space-y-6"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-display tracking-tight" style={{ color: "var(--text-primary)" }}>Command Center</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
              {launchScore != null
                ? `What to fix next to get closer to launch`
                : "Upload your project to start your launch readiness loop"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ObsidianButton
              variant="primary"
              onClick={() => navigate(ROUTES.codeHealth)}
            >
              <Stethoscope size={16} />
              {lastDoctor ? "Rescan Project" : "Run Product Doctor"}
            </ObsidianButton>
            {!loading && (
              <ObsidianButton
                variant="secondary"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Refresh</span>
              </ObsidianButton>
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
        ) : reports.length === 0 && allTasks.length === 0 ? (
          <motion.div variants={fadeInUp} className="space-y-6">
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
                style={{ background: "var(--teal)", boxShadow: "0 0 20px rgba(45,212,191,0.2)" }}
              >
                  <Zap size={24} className="text-obsidian-0" />
              </motion.div>
              <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                Upload your project. We'll tell you what blocks launch.
              </h2>
              <p className="text-sm max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>
                Get a launch score, prioritized blockers, and fix prompts you can paste into your AI IDE.
              </p>
            </div>

            <div className="max-w-lg mx-auto">
              <div
                className="w-full rounded-xl border p-6 text-center transition-all group cursor-pointer"
                style={{ background: "var(--surface-1)", borderColor: "var(--border-default)", boxShadow: "var(--shadow-md)" }}
                onClick={() => navigate(ROUTES.codeHealth)}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 mx-auto" style={{ background: "var(--color-danger-soft)" }}>
                  <Stethoscope size={22} style={{ color: "var(--color-danger)" }} />
                </div>
                <p className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Run Launch Scan</p>
                <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>Upload your repo ZIP. Get launch readiness, blockers, and fix tasks in under 2 minutes.</p>
                <ObsidianButton variant="primary">
                  <Upload size={16} /> Upload Project ZIP
                </ObsidianButton>
              </div>
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
                  <p className="eyebrow" style={{ color: "var(--text-tertiary)" }}>Launch Readiness</p>
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
                  <p className="eyebrow" style={{ color: "var(--text-tertiary)" }}>Top Blocker{redGates.length !== 1 ? "s" : ""}</p>
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
                  <Target size={14} style={{ color: "var(--teal)" }} />
                  <p className="eyebrow" style={{ color: "var(--text-tertiary)" }}>Next Fix</p>
                </div>
                <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  {smartNextAction.title || "Run Product Doctor"}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                  {smartNextAction.reason || "Start the scan → fix → rescan loop"}
                </p>
                <ObsidianButton
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(smartNextAction.href || "/app/code-health")}
                  className="mt-3"
                >
                  Go <ArrowRight size={12} />
                </ObsidianButton>
              </motion.div>

              <motion.div
                whileHover={{ y: -2 }}
                className="rounded-xl border p-5"
                style={{ background: "var(--surface-1)", borderColor: "var(--border-default)", boxShadow: "var(--shadow-sm)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <CheckSquare size={14} style={{ color: "var(--text-tertiary)" }} />
                  <p className="eyebrow" style={{ color: "var(--text-tertiary)" }}>Fix Task Queue</p>
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
              <ObsidianButton
                variant="danger"
                onClick={() => navigate("/app/code-health")}
              >
                <RotateCcw size={16} />
                {lastDoctor ? "Rescan & Recheck Score" : "Run Product Doctor"}
              </ObsidianButton>
              <ObsidianButton
                variant="secondary"
                onClick={() => navigate("/app/build")}
              >
                <ListChecks size={16} />
                View All Tasks ({allTasks.length})
              </ObsidianButton>
              <ObsidianButton
                variant="secondary"
                onClick={() => navigate("/app/brain")}
              >
                <FileText size={16} />
                Reports ({reports.length})
              </ObsidianButton>
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
                    <ObsidianButton
                      variant="danger"
                      size="sm"
                      onClick={() => navigate("/app/code-health")}
                    >
                      Fix Now <ArrowRight size={12} />
                    </ObsidianButton>
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
                  <Brain size={16} style={{ color: "var(--teal)" }} />
                  <p className="eyebrow" style={{ color: "var(--text-tertiary)" }}>Product Brain</p>
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
                  <Sparkles size={16} style={{ color: "var(--teal)" }} />
                  <p className="eyebrow" style={{ color: "var(--text-tertiary)" }}>Daily Briefing</p>
                </div>
                <p className="text-base font-medium" style={{ color: "var(--text-primary)" }}>{briefing.greeting}</p>
                <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>{briefing.currentFocus}</p>
              </motion.div>
            )}

            {scoreSeries.length > 1 && (
              <motion.div
                variants={fadeInUp}
                className="rounded-xl border p-5"
                style={{ background: "var(--surface-1)", borderColor: "var(--border-default)", boxShadow: "var(--shadow-sm)" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} style={{ color: "var(--signal)" }} />
                    <p className="eyebrow" style={{ color: "var(--text-tertiary)" }}>Launch Readiness Trend</p>
                  </div>
                  <span className="text-mono text-xs" style={{ color: "var(--color-success)" }}>
                    +{(scoreSeries[scoreSeries.length - 1]!.score - scoreSeries[0]!.score)} pts over {scoreSeries.length} scans
                  </span>
                </div>
                <div style={{ height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={scoreSeries} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                      <defs>
                        <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--signal)" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="var(--signal)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fill: "var(--text-tertiary)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: "var(--text-tertiary)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <RechartsTooltip
                        contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)" }}
                        labelStyle={{ color: "var(--text-tertiary)" }}
                      />
                      <Area type="monotone" dataKey="score" stroke="var(--signal)" strokeWidth={2.5} fill="url(#scoreGrad)" dot={{ fill: "var(--signal)", r: 4 }} activeDot={{ r: 6 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
    </AppShell>
  );
}
