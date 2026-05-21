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
import { ArrowRight, FileText, CheckSquare, FolderOpen, Zap, AlertTriangle, TrendingUp, TrendingDown, Minus, Brain, Target, Clock, Stethoscope, Lightbulb, Rocket, XCircle, CheckCircle, Shield, BarChart3, ExternalLink, RotateCcw, ListChecks, RefreshCw } from "lucide-react";
import { UsageBar } from "./dashboard/UsageBar";

type DashData = {
  reports: Array<{ id: string }>;
  tasks: Array<{ id: string }>;
};

export default function DashboardPage() {
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
    const dashPromise = getDashboardData().then(setData).catch(() => { toast({ title: "Failed to load dashboard data", description: "Some widgets may be unavailable.", variant: "destructive" }); return null; });
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

  // Compute launch cockpit data
  const doctorReports = reports.filter((r: ReportSummary) => r.tool === "doctor");
  const lastDoctor = doctorReports[doctorReports.length - 1];
  const lastPayload = lastDoctor?.payload ? (lastDoctor.payload as Record<string, unknown>) : null;
  const lastData = lastPayload?.data ? (lastPayload.data as Record<string, unknown>) : null;
  const launchScore = typeof lastDoctor?.score === "number" ? lastDoctor.score : (lastData?.health_score as number) ?? null;
  const scoreHistoryEntries = reports.length > 0
    ? computeScoreHistory(reports as Array<{ id: string; tool: string; score?: number | null; created_at: string }>)
    : [];
  const doctorScoreHist = scoreHistoryEntries.filter((e: ScoreHistoryEntry) => e.tool === "doctor");
  const prevScore = doctorScoreHist.length > 0 ? doctorScoreHist[0].previousScore : null;
  const scoreDelta = launchScore != null && prevScore != null ? launchScore - prevScore : null;
  const healthTrend = useMemo(() => {
    const doctorEntries = scoreHistoryEntries.filter((e: ScoreHistoryEntry) => e.tool === "doctor");
    if (doctorEntries.length < 2) return null;
    const last = doctorEntries[doctorEntries.length - 1];
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
    ? (launchScore >= 70 ? "var(--noctra-emerald)" : launchScore >= 40 ? "var(--noctra-amber)" : "var(--noctra-rose)")
    : "var(--noctra-text-muted)";
  const statusLabel = launchScore != null
    ? (launchScore >= 70 ? "Launch Ready" : launchScore >= 40 ? "Needs Work" : "Blocked")
    : "Not Scanned";

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--noctra-text)" }}>Launch Cockpit</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>
              {launchScore != null
                ? `What to fix next to get closer to launch`
                : "Upload your project to start your launch readiness loop"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/app/doctor")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90" style={{ background: "var(--noctra-cyan)", color: "#000" }}>
              <Stethoscope size={14} />
              {lastDoctor ? "Rescan Project" : "Run Product Doctor"}
            </button>
            {!loading && (
              <button onClick={() => loadData(true)} disabled={refreshing} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all hover:opacity-80" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-muted)" }}>
                <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}
          </div>
        </div>

        {usage && <UsageBar usage={usage} />}

        {loading ? (
          <div className="space-y-5 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl border p-4" style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
                  <div className="h-3 w-24 rounded mb-3" style={{ background: "var(--noctra-surface2)" }} />
                  <div className="h-8 w-16 rounded mb-2" style={{ background: "var(--noctra-surface2)" }} />
                  <div className="h-3 w-32 rounded" style={{ background: "var(--noctra-surface2)" }} />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-9 w-32 rounded-lg" style={{ background: "var(--noctra-surface2)" }} />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="rounded-xl border p-4 h-32" style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
                  <div className="h-3 w-36 rounded mb-4" style={{ background: "var(--noctra-surface2)" }} />
                  <div className="space-y-2">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-8 rounded-lg" style={{ background: "var(--noctra-surface2)" }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (data?.reports.length ?? 0) === 0 && allTasks.length === 0 ? (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4" style={{ background: "var(--noctra-cyan)", boxShadow: "0 0 20px var(--noctra-cyan-glow)" }}>
                <Zap size={24} className="text-black" />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: "var(--noctra-text)" }}>
                Launch readiness starts with a scan.
              </h2>
              <p className="text-sm max-w-lg mx-auto" style={{ color: "var(--noctra-text-muted)" }}>
                Upload your codebase. Get a launch score, blockers, and a prioritized fix queue. Rescan to track improvement.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <button onClick={() => navigate("/app/doctor")} className="rounded-xl border p-5 text-left transition-all hover:opacity-90 group" style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: "rgba(244,63,94,0.12)" }}>
                  <Stethoscope size={18} style={{ color: "var(--noctra-rose)" }} />
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--noctra-text)" }}>Scan a codebase</p>
                <p className="text-xs mb-3" style={{ color: "var(--noctra-text-muted)" }}>Upload your repo ZIP. Get launch readiness, gates, fix tasks, and build prompt.</p>
                <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "var(--noctra-rose)", color: "#fff" }}>
                  Upload Project ZIP <ArrowRight size={11} />
                </span>
              </button>
              <button onClick={() => navigate("/app/idea")} className="rounded-xl border p-5 text-left transition-all hover:opacity-90 group" style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: "rgba(149,117,255,0.12)" }}>
                  <Lightbulb size={18} style={{ color: "var(--noctra-violet)" }} />
                </div>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--noctra-text)" }}>Describe an idea</p>
                <p className="text-xs mb-3" style={{ color: "var(--noctra-text-muted)" }}>Get a signal score, top risks, and a verdict. Know what to validate next.</p>
                <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "var(--noctra-cyan)", color: "#000" }}>
                  Check My Idea <ArrowRight size={11} />
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Above the fold: Launch Readiness Score + Top Blocker + Next Fix */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Launch Score */}
              <div className="rounded-xl border p-4" style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <Shield size={11} style={{ color: "var(--noctra-text-muted)" }} />
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Launch Readiness</p>
                </div>
                {launchScore != null ? (
                  <div>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold" style={{ color: launchColor }}>{launchScore}</span>
                      <span className="text-xs mb-1" style={{ color: "var(--noctra-text-muted)" }}>/100</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                        background: launchScore >= 70 ? "rgba(52,211,153,0.1)" : launchScore >= 40 ? "rgba(245,158,11,0.1)" : "rgba(244,63,94,0.1)",
                        color: launchColor,
                      }}>{statusLabel}</span>
                      {scoreDelta != null && healthTrend && (
                        <span className="text-[10px]" style={{ color: healthTrend.direction === "improved" ? "var(--noctra-emerald)" : healthTrend.direction === "declined" ? "var(--noctra-rose)" : "var(--noctra-text-muted)" }}>
                          {healthTrend.direction === "improved" ? <TrendingUp size={10} className="inline" /> : healthTrend.direction === "declined" ? <TrendingDown size={10} className="inline" /> : <Minus size={10} className="inline" />}
                          {scoreDelta != null ? (scoreDelta >= 0 ? "+" : "") + scoreDelta : ""} pts
                        </span>
                      )}
                    </div>
                    {prevScore != null && (
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>
                        Previous: {prevScore}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-sm" style={{ color: "var(--noctra-text-muted)" }}>No scan yet</p>
                    <p className="text-[10px]" style={{ color: "var(--noctra-text-muted)" }}>Run Product Doctor to begin</p>
                  </div>
                )}
              </div>

              {/* Top Blocker */}
              <div className="rounded-xl border p-4" style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <XCircle size={11} style={{ color: hasIssues ? "var(--noctra-rose)" : "var(--noctra-text-muted)" }} />
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Top Blocker{redGates.length !== 1 ? "s" : ""}</p>
                </div>
                {redGates.length > 0 ? (
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--noctra-rose)" }}>{redGates[0]}</p>
                    {redGates.length > 1 && (
                      <div className="mt-1 space-y-0.5">
                        {redGates.slice(1, 3).map((g, i) => (
                          <p key={i} className="text-[10px]" style={{ color: "var(--noctra-text-soft)" }}>— {g}</p>
                        ))}
                        {redGates.length > 3 && <p className="text-[10px]" style={{ color: "var(--noctra-text-muted)" }}>+{redGates.length - 3} more blockers</p>}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-sm" style={{ color: "var(--noctra-text-muted)" }}>{scanCount > 0 ? "All gates clear" : "No data"}</p>
                    {scanCount > 0 && <div className="mt-1"><CheckCircle size={14} style={{ color: "var(--noctra-emerald)" }} /></div>}
                  </div>
                )}
              </div>

              {/* Next Fix */}
              <div className="rounded-xl border p-4" style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <Target size={11} style={{ color: "var(--noctra-cyan)" }} />
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Next Recommended Fix</p>
                </div>
                <p className="text-sm font-semibold" style={{ color: "var(--noctra-text)" }}>
                  {smartNextAction.title || "Run Product Doctor"}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>
                  {smartNextAction.reason || "Start the scan → fix → rescan loop"}
                </p>
                <button
                  onClick={() => navigate(smartNextAction.href || "/app/doctor")}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg"
                  style={{ background: "var(--noctra-cyan)", color: "#000" }}
                >
                  Go <ArrowRight size={10} />
                </button>
              </div>

              {/* Fix Tasks Queue */}
              <div className="rounded-xl border p-4" style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <CheckSquare size={11} style={{ color: "var(--noctra-text-muted)" }} />
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Fix Task Queue</p>
                </div>
                <p className="text-2xl font-bold" style={{ color: openCount > 0 ? "var(--noctra-rose)" : "var(--noctra-emerald)" }}>
                  {allTasks.filter(t => t.status !== "completed").length}
                </p>
                <div className="flex gap-2 mt-0.5">
                  {openCritical > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(244,63,94,0.1)", color: "var(--noctra-rose)" }}>{openCritical} critical</span>}
                  {openHigh > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(245,158,11,0.1)", color: "var(--noctra-amber)" }}>{openHigh} high</span>}
                  {completedTasks > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(52,211,153,0.1)", color: "var(--noctra-emerald)" }}>{completedTasks} done</span>}
                </div>
              </div>
            </div>

            {/* Rescan + Action bar */}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => navigate("/app/doctor")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90" style={{ background: "var(--noctra-rose)", color: "#fff" }}>
                <RotateCcw size={14} />
                {lastDoctor ? "Rescan & Recheck Score" : "Run Product Doctor"}
              </button>
              <button onClick={() => navigate("/app/tasks")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-soft)" }}>
                <ListChecks size={14} />
                View All Tasks ({allTasks.length})
              </button>
              <button onClick={() => navigate("/app/launch")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-soft)" }}>
                <Rocket size={14} />
                Launch Readiness
              </button>
              <button onClick={() => navigate("/app/reports")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-soft)" }}>
                <FileText size={14} />
                Reports ({data?.reports.length ?? 0})
              </button>
              <button onClick={() => navigate("/app/projects")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-soft)" }}>
                <FolderOpen size={14} />
                Projects
              </button>
            </div>

            {redGates.length > 0 && (
              <div className="px-4 py-3 rounded-xl flex items-start gap-3" style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.2)" }}>
                <XCircle size={14} style={{ color: "var(--noctra-rose)", flexShrink: 0, marginTop: 1 }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold" style={{ color: "var(--noctra-rose)" }}>{redGates.length} blocker{redGates.length !== 1 ? "s" : ""} blocking launch</p>
                    <button onClick={() => navigate("/app/doctor")} className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "rgba(244,63,94,0.1)", color: "var(--noctra-rose)" }}>
                      Fix Now <ArrowRight size={10} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {redGates.slice(0, 4).map((g, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded flex items-center gap-1" style={{ background: "rgba(244,63,94,0.08)", color: "var(--noctra-rose)" }}>
                        <XCircle size={7} />{g}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Scan timeline / Score trends (lower priority) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doctorReports.length > 1 && (
                <div className="rounded-xl border p-4" style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={12} style={{ color: "var(--noctra-text-muted)" }} />
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Launch Readiness Timeline</p>
                    <span className="ml-auto text-[10px]" style={{ color: "var(--noctra-text-muted)" }}>{doctorReports.length} scans</span>
                  </div>
                  <div className="space-y-1.5">
                    {[...doctorReports].reverse().slice(-5).reverse().map((r: ReportSummary, i: number) => {
                      const score = typeof r.score === "number" ? r.score : null;
                      const prevScore = i > 0 && doctorReports[doctorReports.length - 1 - i + 1] ? typeof doctorReports[doctorReports.length - 1 - i + 1].score === "number" ? doctorReports[doctorReports.length - 1 - i + 1].score : null : null;
                      const delta = score != null && prevScore != null ? score - prevScore : null;
                      return (
                        <div key={r.id} className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:opacity-80" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}
                          onClick={() => navigate(`/app/reports/${r.id}`)}>
                          {score != null ? (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-sm font-bold font-mono" style={{ color: score >= 70 ? "var(--noctra-emerald)" : score >= 40 ? "var(--noctra-amber)" : "var(--noctra-rose)" }}>{score}</span>
                              {delta != null && (
                                <span className="text-[9px]" style={{ color: delta > 0 ? "var(--noctra-emerald)" : delta < 0 ? "var(--noctra-rose)" : "var(--noctra-text-muted)" }}>
                                  {delta > 0 ? "+" : ""}{delta}
                                </span>
                              )}
                            </div>
                          ) : <span className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>—</span>}
                          <span className="text-xs flex-1 truncate" style={{ color: "var(--noctra-text-soft)" }}>{new Date(r.created_at).toLocaleDateString()}</span>
                          <ExternalLink size={10} style={{ color: "var(--noctra-text-muted)" }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Score Trends */}
              {scoreHistoryEntries.length >= 2 && (
                <div className="rounded-xl border p-4" style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 size={12} style={{ color: "var(--noctra-text-muted)" }} />
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Score Trends</p>
                  </div>
                  <div className="space-y-1.5">
                    {scoreHistoryEntries.filter((e: ScoreHistoryEntry) => e.latestScore != null && e.previousScore != null).slice(-6).map((entry: ScoreHistoryEntry, i: number) => (
                      <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs" style={{ background: "var(--noctra-surface2)" }}>
                        {entry.tool === "doctor" ? <Stethoscope size={10} style={{ color: "var(--noctra-rose)" }} />
                          : entry.tool === "idea" ? <Lightbulb size={10} style={{ color: "var(--noctra-violet)" }} />
                          : entry.tool === "launch" ? <Rocket size={10} style={{ color: "var(--noctra-amber)" }} />
                          : <BarChart3 size={10} style={{ color: "var(--noctra-cyan)" }} />}
                        <span style={{ color: "var(--noctra-text-soft)" }} className="w-20">{entry.tool}</span>
                        <span className="font-mono" style={{ color: "var(--noctra-text)" }}>{entry.previousScore} → {entry.latestScore}</span>
                        {entry.direction === "improved" ? <TrendingUp size={10} style={{ color: "var(--noctra-emerald)" }} />
                          : entry.direction === "declined" ? <TrendingDown size={10} style={{ color: "var(--noctra-rose)" }} />
                          : <Minus size={10} style={{ color: "var(--noctra-text-muted)" }} />}
                        <span className="ml-auto" style={{ color: entry.direction === "improved" ? "var(--noctra-emerald)" : entry.direction === "declined" ? "var(--noctra-rose)" : "var(--noctra-text-muted)" }}>
                          {entry.delta != null ? (entry.delta >= 0 ? "+" : "") + entry.delta : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Gate status breakdown */}
            {lastDoctor?.payload ? (() => {
              const p = lastDoctor.payload as Record<string, unknown>;
              const d = (p.data ?? p) as Record<string, unknown>;
              const gates = (d.gates ?? []) as Array<{ name: string; status: string }>;
              if (gates.length === 0) return null;
              return (
                <div className="rounded-xl border p-4" style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Shield size={12} style={{ color: "var(--noctra-text-muted)" }} />
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Gate Status</p>
                    <span className="ml-auto text-[10px]" style={{ color: "var(--noctra-text-muted)" }}>
                      {gates.filter(g => g.status === "GREEN").length} GREEN · {gates.filter(g => g.status === "YELLOW").length} YELLOW · {gates.filter(g => g.status === "RED").length} RED
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {gates.slice(0, 8).map((gate, i) => (
                      <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs" style={{ background: "var(--noctra-surface2)" }}>
                        {gate.status === "GREEN" ? <CheckCircle size={10} style={{ color: "var(--noctra-emerald)" }} />
                          : gate.status === "YELLOW" ? <AlertTriangle size={10} style={{ color: "var(--noctra-amber)" }} />
                          : <XCircle size={10} style={{ color: "var(--noctra-rose)" }} />}
                        <span className="flex-1" style={{ color: "var(--noctra-text-soft)" }}>{gate.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: gate.status === "GREEN" ? "rgba(52,211,153,0.1)" : gate.status === "YELLOW" ? "rgba(245,158,11,0.1)" : "rgba(244,63,94,0.1)", color: gate.status === "GREEN" ? "var(--noctra-emerald)" : gate.status === "YELLOW" ? "var(--noctra-amber)" : "var(--noctra-rose)" }}>
                          {gate.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })() : null}

            {/* Product Brain / Insight Brief - secondary info */}
            {brain && brain.insights.length > 0 && (
              <div className="rounded-xl border p-4" style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Brain size={13} style={{ color: "var(--noctra-magenta)" }} />
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Product Brain</p>
                </div>
                <p className="text-xs" style={{ color: "var(--noctra-text-soft)" }}>{brain.insights[0]?.title ?? "Synthesis available"}</p>
                <p className="text-xs mt-1" style={{ color: "var(--noctra-text-muted)" }}>{brain.insights.length} insight{brain.insights.length !== 1 ? "s" : ""} · Alignment: {alignmentScore ?? "—"}</p>
              </div>
            )}

            {briefing && (
              <div className="rounded-xl border p-4" style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--noctra-text-muted)" }}>Daily Briefing</p>
                <p className="text-sm" style={{ color: "var(--noctra-text)" }}>{briefing.greeting}</p>
                <p className="text-xs mt-1" style={{ color: "var(--noctra-text-muted)" }}>{briefing.currentFocus}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
