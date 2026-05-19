import { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { getDashboardData, getReports, getProofSignals, getTasks, getProjects, createTask, saveTasks } from "@/lib/repository";
import { TOOL_BY_KEY, TOOLS } from "@/lib/noctra-tools";
import { useProgression } from "@/lib/progression-context";
import { computeNextAction, computePipeline } from "@/lib/next-action";
import { extractRisks, RISK_SEV_COLOR } from "@/lib/risk-radar";
import { buildTimeline, formatTimeAgo, TIMELINE_TYPE_COLOR } from "@/lib/timeline";
import { computeScoreHistory, getDeltaLabel, getDeltaColor, type ScoreHistoryEntry } from "@/lib/score-history";
import { getUsage, getUsagePercent, getUsageColor } from "@/lib/usage";
import { extractScoreTrends, computeToolCoverage, generateInsightBrief, type ScoreTrend, type ToolCoverage, type InsightBrief, type ReportSummary } from "@/lib/intelligence";
import { generateDailyBriefing, type DailyBriefing } from "@/lib/daily-briefing";
import { runContradictionEngine, type EnhancedContradiction } from "@/lib/contradiction-engine";
import { generateRoadmap, type Roadmap } from "@/lib/roadmap";
import { generateExecutionPackage, type ExecutionPackage } from "@/lib/execution-autopilot";
import { buildProductBrain, type ProductBrain } from "@/lib/product-brain";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight, FileText, CheckSquare, FolderOpen, Zap, AlertTriangle, TrendingUp, TrendingDown, Minus, Brain, ShieldOff, Clock, Target, Map, Terminal, Copy, Download, Plus, XCircle, CheckCircle, Info, Stethoscope, Lightbulb, Upload, Lock } from "lucide-react";
import { UsageBar } from "./dashboard/UsageBar";
import { DashboardEmptyState } from "./dashboard/EmptyState";
import { DashboardContent } from "./dashboard/DashboardContent";

type DashData = Awaited<ReturnType<typeof getDashboardData>>;

export default function DashboardPage() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
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
  const [executionPkg, setExecutionPkg] = useState<ExecutionPackage | null>(null);
  const [brain, setBrain] = useState<ProductBrain | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [creatingTasks, setCreatingTasks] = useState(false);
  const [activeRoadmapTab, setActiveRoadmapTab] = useState<"now" | "next" | "later">("now");
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
    setExecutionPkg(generateExecutionPackage({ reports: reps, tasks: taskList, proofSignals: signals }));
    setBrain(buildProductBrain({ reports: reps, tasks: taskList, proofSignals: signals }));
  }, []);

  useEffect(() => {
    let loadedReports: ReportSummary[] = [];
    let loadedTasks: typeof allTasks = [];
    let loadedSignals: typeof proofSignals = [];
    const dashPromise = getDashboardData().then(setData).catch(() => null);
    const reportsPromise = getReports().then((r) => { loadedReports = (r as ReportSummary[]) ?? []; setReports(loadedReports); }).catch(() => null);
    const signalsPromise = getProofSignals().then((s) => { loadedSignals = (s as { id: string }[]) ?? []; setProofSignals(loadedSignals); }).catch(() => null);
    const projectsPromise = getProjects().then((p) => setAllProjects((p as { id: string; name: string; stage?: string | null }[]) ?? [])).catch(() => null);
    const tasksPromise = getTasks().then((t) => { loadedTasks = (t as typeof allTasks) ?? []; setAllTasks(loadedTasks); }).catch(() => null);
    const usagePromise = getUsage().then((u) => {
      if (u) {
        const s = u.usage["scansPerDay"] ?? u.usage["scan-upload"];
        const r = u.usage["structuredReportsPerDay"] ?? u.usage["structured"];
        setUsage({ plan: u.plan, scans: s ?? { used: 0, limit: "unlimited" }, reports: r ?? { used: 0, limit: "unlimited" } });
      }
    }).catch(() => null);
    Promise.all([dashPromise, reportsPromise, signalsPromise, projectsPromise, tasksPromise, usagePromise])
      .then(() => runIntelligence(loadedReports, loadedTasks, loadedSignals))
      .finally(() => setLoading(false));
  }, [runIntelligence]);

  const smartNextAction = useMemo(() => computeNextAction({
    reports: reports as { id: string; tool: string; score?: number | null; created_at: string }[],
    tasks: allTasks, projects: allProjects, proofSignals,
  }), [reports, allTasks, allProjects, proofSignals]);

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--noctra-text)" }}>Dashboard</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>Your execution plan</p>
          </div>
        </div>

        {usage && <UsageBar usage={usage} />}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin" style={{ color: "var(--noctra-cyan)" }} />
          </div>
        ) : (data?.reports.length ?? 0) === 0 ? (
          <DashboardEmptyState navigate={navigate} />
        ) : (
          <DashboardContent reports={reports} allTasks={allTasks} data={data} smartNextAction={smartNextAction} navigate={navigate} />
        )}
      </div>
    </AppShell>
  );
}
