import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { Panel, ScoreRing, Badge, EmptyState } from "@/components/Primitives";
import { getPassport, getReports, getTasks, getProofSignals } from "@/lib/repository";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import { CreditCard, Loader2, CheckCircle, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type PassportData = {
  passport: Record<string, unknown> | null;
  reports: Record<string, unknown>[];
  tasks: Record<string, unknown>[];
  signals: Record<string, unknown>[];
};

type Stamp = {
  id: string; label: string;
  description: string; earned: boolean; progress?: number; total?: number;
};

function computeStamps(data: PassportData): Stamp[] {
  const { reports, tasks, signals } = data;
  const toolsUsed = new Set(reports.map((r) => r.tool as string));
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const highScores = reports.filter((r) => typeof r.score === "number" && (r.score as number) >= 80).length;
  const ideaCount = reports.filter((r) => r.tool === "idea").length;
  const doctorCount = reports.filter((r) => r.tool === "doctor").length;
  const launchCount = reports.filter((r) => r.tool === "launch").length;
  const swarmCount = reports.filter((r) => r.tool === "swarm").length;
  const proofCount = reports.filter((r) => r.tool === "proof").length;
  const scanCount = reports.filter((r) => r.tool === "doctor").length;
  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // Check Doctor gate status from latest report
  const doctorReports = reports.filter((r) => r.tool === "doctor").sort(
    (a, b) => new Date(String(b.created_at ?? 0)).getTime() - new Date(String(a.created_at ?? 0)).getTime()
  );
  const latestDoctor = doctorReports[0];
  let gatesAllGreen = false;
  let gatesNoRed = false;
  let doctorScoreHigh = false;
  const latestDoctorScore = typeof latestDoctor?.score === "number" ? (latestDoctor.score as number) : 0;
  if (latestDoctor) {
    const p = latestDoctor.payload as Record<string, unknown>;
    const data = (p?.data ?? p) as Record<string, unknown>;
    const gates = (data.gates ?? data.launch_gates ?? []) as Array<{ status: string }>;
    gatesAllGreen = gates.length > 0 && gates.every(g => g.status === "GREEN");
    gatesNoRed = gates.length > 0 && !gates.some(g => g.status === "RED");
    doctorScoreHigh = latestDoctorScore >= 65;
  }

  return [
    {
      id: "first_signal", label: "Started",
      description: "Run your first intelligence tool",
      earned: reports.length >= 1,
    },
    {
      id: "idea_hunter", label: "Idea Deep Dive",
      description: "Run 3 Idea Checker analyses",
      earned: ideaCount >= 3, progress: ideaCount, total: 3,
    },
    {
      id: "reality_check", label: "Reality Checked",
      description: "Run a Reality Check",
      earned: reports.some((r) => r.tool === "reality"),
    },
    {
      id: "swarm_general", label: "Market Tested",
      description: "Deploy 3 persona swarms",
      earned: swarmCount >= 3, progress: swarmCount, total: 3,
    },
    {
      id: "proof_collector", label: "Evidence Collected",
      description: "Add 5 proof signals",
      earned: signals.length >= 5, progress: signals.length, total: 5,
    },
    {
      id: "proof_analysis", label: "Proof Analyzed",
      description: "Run a Proof Analysis report",
      earned: proofCount >= 1,
    },
    {
      id: "task_master", label: "Consistent Execution",
      description: "Complete 10 tasks",
      earned: completedTasks >= 10, progress: completedTasks, total: 10,
    },
    {
      id: "task_commander", label: "High Completion Rate",
      description: "Complete 80% of all tasks",
      earned: taskCompletionRate >= 80 && tasks.length >= 5, progress: taskCompletionRate, total: 80,
    },
    {
      id: "code_doctor", label: "Codebase Scanned",
      description: "Scan a repo with Project Doctor",
      earned: scanCount >= 1,
    },
    {
      id: "gates_cleared", label: "Gates Cleared",
      description: "All launch gates passed in Project Doctor",
      earned: gatesAllGreen,
    },
    {
      id: "no_red_gates", label: "No Launch Blockers",
      description: "No RED gates in latest Doctor scan",
      earned: gatesNoRed,
    },
    {
      id: "doctor_high_score", label: "Healthy Codebase",
      description: "Doctor score 65+",
      earned: doctorScoreHigh, progress: latestDoctorScore, total: 65,
    },
    {
      id: "mvp_planner", label: "Build Planned",
      description: "Run the MVP Planner",
      earned: reports.some((r) => r.tool === "mvp"),
    },
    {
      id: "launch_ready", label: "Launch Ready",
      description: "Doctor gates cleared + Launch Room run",
      earned: launchCount >= 1 && gatesNoRed,
    },
    {
      id: "full_spectrum", label: "Full Intelligence",
      description: "Use 7 different intelligence tools",
      earned: toolsUsed.size >= 7, progress: toolsUsed.size, total: 7,
    },
    {
      id: "high_scorer", label: "High Scores",
      description: "Get 3 reports with score ≥ 80",
      earned: highScores >= 3, progress: highScores, total: 3,
    },
    {
      id: "deep_intelligence", label: "Deep Knowledge",
      description: "Save 10 intelligence reports",
      earned: reports.length >= 10, progress: reports.length, total: 10,
    },
    {
      id: "multi_scanner", label: "Multi-Repo Scanned",
      description: "Scan 3 different repos",
      earned: scanCount >= 3, progress: scanCount, total: 3,
    },
    {
      id: "ship_it", label: "Shipped",
      description: "Doctor gates clear + launch plan ready",
      earned: launchCount >= 1 && gatesNoRed && reports.some((r) => r.tool === "launch"),
    },
  ];
}

export default function PassportPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [data, setData] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getPassport(), getReports(), getTasks(), getProofSignals()])
      .then(([passport, reports, tasks, signals]) => {
        if (cancelled) return;
        setData({
          passport: passport as Record<string, unknown> | null,
          reports: (reports as Record<string, unknown>[]) ?? [],
          tasks: (tasks as Record<string, unknown>[]) ?? [],
          signals: (signals as Record<string, unknown>[]) ?? [],
        });
      })
      .catch((err) => { if (!cancelled) toast({ title: "Failed to load passport", description: err?.message ?? "Unknown error", variant: "destructive" }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return (
    <AppShell>
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--noctra-gold)" }} />
      </div>
    </AppShell>
  );

  if (!data) return (
    <AppShell>
      <div className="p-6 max-w-4xl mx-auto">
        <EmptyState icon={<CreditCard size={24} />} title="Could not load passport" body="Check your connection and try again." />
      </div>
    </AppShell>
  );

  const avgScore = data.reports.length
    ? Math.round(data.reports.reduce((s, r) => s + (typeof r.score === "number" ? r.score : 0), 0) / data.reports.length)
    : 0;

  const completedTasks = data.tasks.filter((t) => t.status === "completed").length;
  const taskCompletionRate = data.tasks.length > 0 ? Math.round((completedTasks / data.tasks.length) * 100) : 0;
  const toolsUsed = [...new Set(data.reports.map((r) => r.tool as string))];
  const stamps = computeStamps(data);
  const earnedStamps = stamps.filter((s) => s.earned).length;
  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.3)" }}>
            <CreditCard size={18} style={{ color: "var(--noctra-gold)" }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--noctra-text)" }}>Passport</h1>
            <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>Your execution record — scores, milestones, and progress across all projects</p>
          </div>
        </div>

        {/* Core stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Avg Score", value: avgScore, max: 100, color: "var(--noctra-cyan)", suffix: "/100" },
            { label: "Tasks Done", value: completedTasks, max: data.tasks.length || 1, color: "var(--noctra-emerald)", suffix: `/${data.tasks.length}` },
            { label: "Milestones", value: earnedStamps, max: stamps.length, color: "var(--noctra-violet)", suffix: `/${stamps.length}` },
          ].map(({ label, value, color, suffix }) => (
            <Panel key={label}>
              <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color }}>{value}<span className="text-sm font-normal" style={{ color: "var(--noctra-text-muted)" }}>{suffix}</span></p>
            </Panel>
          ))}
        </div>

        {/* Intelligence Score Rings */}
        {toolsUsed.length > 0 && (
          <Panel>
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--noctra-text-muted)" }}>Scores</p>
            <div className="flex flex-wrap gap-6 justify-center">
              {toolsUsed.filter((k) => TOOL_BY_KEY[k as keyof typeof TOOL_BY_KEY]).map((key) => {
                const t = TOOL_BY_KEY[key as keyof typeof TOOL_BY_KEY]!;
                const toolReports = data.reports.filter((r) => r.tool === key);
                const latestScore = toolReports[0]?.score as number ?? 0;
                return (
                  <div key={key} className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => navigate(t.route)}>
                    <ScoreRing value={latestScore} size={72} stroke={6} label={t.label.split(" ")[0]!} color={t.accent} />
                    <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{toolReports.length} run{toolReports.length !== 1 ? "s" : ""}</p>
                  </div>
                );
              })}
            </div>
          </Panel>
        )}

        {/* Milestones */}
        <div>
          <p className="text-sm font-semibold mb-3" style={{ color: "var(--noctra-text)" }}>
            Milestones <span style={{ color: "var(--noctra-text-muted)", fontWeight: 400, fontSize: "12px" }}>({earnedStamps}/{stamps.length})</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {stamps.map((stamp) => (
              <Panel key={stamp.id} style={{
                opacity: stamp.earned ? 1 : 0.5,
                background: stamp.earned ? undefined : "var(--noctra-surface2)",
              }}>
                <div className="flex flex-col items-center text-center gap-2 py-2">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: stamp.earned ? "var(--noctra-text)" : "var(--noctra-text-muted)" }}>
                      {stamp.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>
                      {stamp.description}
                    </p>
                  </div>
                  {stamp.earned ? (
                    <CheckCircle size={12} style={{ color: "var(--noctra-emerald)" }} />
                  ) : stamp.total != null ? (
                    <div className="w-full">
                      <div className="h-1 rounded-full w-full" style={{ background: "var(--noctra-surface)" }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, ((stamp.progress ?? 0) / stamp.total) * 100)}%`, background: "var(--noctra-cyan)" }} />
                      </div>
                      <p style={{ fontSize: "10px", color: "var(--noctra-text-muted)" }} className="mt-0.5">{stamp.progress}/{stamp.total}</p>
                    </div>
                  ) : (
                    <Lock size={11} style={{ color: "var(--noctra-text-muted)" }} />
                  )}
                </div>
              </Panel>
            ))}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Reports Saved", value: data.reports.length, color: "var(--noctra-violet)", route: "/app/reports" },
            { label: "Proof Signals", value: data.signals.length, color: "var(--noctra-emerald)", route: "/app/proof" },
            { label: "Tools Used", value: toolsUsed.length, color: "var(--noctra-cyan)", route: "/app" },
          ].map(({ label, value, color, route }) => (
            <Panel key={label}>
              <button onClick={() => navigate(route)} className="w-full text-left">
                <p className="text-xs mb-1" style={{ color: "var(--noctra-text-muted)" }}>{label}</p>
                <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              </button>
            </Panel>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
