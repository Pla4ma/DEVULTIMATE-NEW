import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { Panel, ScoreRing, Badge, EmptyState, ProgressBar } from "@/components/Primitives";
import { getPassport, getReports, getTasks, getProofSignals } from "@/lib/repository";
import { TOOL_BY_KEY, TOOLS } from "@/lib/noctra-tools";
import { CreditCard, Loader2, Trophy, Target, Zap, CheckCircle, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type PassportData = {
  passport: Record<string, unknown> | null;
  reports: Record<string, unknown>[];
  tasks: Record<string, unknown>[];
  signals: Record<string, unknown>[];
};

type Stamp = {
  id: string; label: string; emoji: string;
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

  return [
    {
      id: "first_signal", label: "First Signal", emoji: "⚡",
      description: "Run your first intelligence tool",
      earned: reports.length >= 1,
    },
    {
      id: "idea_hunter", label: "Idea Hunter", emoji: "🔍",
      description: "Run 3 Signal Chamber analyses",
      earned: ideaCount >= 3, progress: ideaCount, total: 3,
    },
    {
      id: "reality_check", label: "Reality Checked", emoji: "🎯",
      description: "Run a Reality Check",
      earned: reports.some((r) => r.tool === "reality"),
    },
    {
      id: "swarm_general", label: "Swarm General", emoji: "👥",
      description: "Deploy 3 persona swarms",
      earned: swarmCount >= 3, progress: swarmCount, total: 3,
    },
    {
      id: "proof_collector", label: "Proof Collector", emoji: "🧪",
      description: "Add 5 proof signals",
      earned: signals.length >= 5, progress: signals.length, total: 5,
    },
    {
      id: "task_master", label: "Task Master", emoji: "✅",
      description: "Complete 10 tasks",
      earned: completedTasks >= 10, progress: completedTasks, total: 10,
    },
    {
      id: "code_doctor", label: "Code Doctor", emoji: "🏥",
      description: "Run a Diagnostic Bay analysis",
      earned: doctorCount >= 1,
    },
    {
      id: "launch_ready", label: "Launch Ready", emoji: "🚀",
      description: "Complete a Launch Control analysis",
      earned: launchCount >= 1,
    },
    {
      id: "full_spectrum", label: "Full Spectrum", emoji: "🌈",
      description: "Use 7 different intelligence tools",
      earned: toolsUsed.size >= 7, progress: toolsUsed.size, total: 7,
    },
    {
      id: "high_scorer", label: "High Scorer", emoji: "🏆",
      description: "Get 3 reports with score ≥ 80",
      earned: highScores >= 3, progress: highScores, total: 3,
    },
    {
      id: "deep_intelligence", label: "Deep Intelligence", emoji: "🧠",
      description: "Save 10 intelligence reports",
      earned: reports.length >= 10, progress: reports.length, total: 10,
    },
    {
      id: "mvp_planner", label: "Blueprint Builder", emoji: "📋",
      description: "Run the Blueprint Board",
      earned: reports.some((r) => r.tool === "mvp"),
    },
  ];
}

function getFounderLevel(reports: number, tasks: number, signals: number): { level: number; title: string; nextAt: number } {
  const score = reports * 10 + tasks * 2 + signals * 3;
  if (score >= 200) return { level: 5, title: "Operator", nextAt: Infinity };
  if (score >= 100) return { level: 4, title: "Builder", nextAt: 200 };
  if (score >= 50) return { level: 3, title: "Validator", nextAt: 100 };
  if (score >= 20) return { level: 2, title: "Explorer", nextAt: 50 };
  return { level: 1, title: "Pioneer", nextAt: 20 };
}

export default function PassportPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [data, setData] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPassport(), getReports(), getTasks(), getProofSignals()])
      .then(([passport, reports, tasks, signals]) => {
        setData({
          passport: passport as Record<string, unknown> | null,
          reports: (reports as Record<string, unknown>[]) ?? [],
          tasks: (tasks as Record<string, unknown>[]) ?? [],
          signals: (signals as Record<string, unknown>[]) ?? [],
        });
      })
      .catch((err) => toast({ title: "Failed to load passport", description: err?.message ?? "Unknown error", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

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
  const { level, title: levelTitle, nextAt } = getFounderLevel(data.reports.length, data.tasks.length, data.signals.length);

  const levelScore = data.reports.length * 10 + data.tasks.length * 2 + data.signals.length * 3;
  const prevLevelAt = level === 1 ? 0 : level === 2 ? 20 : level === 3 ? 50 : level === 4 ? 100 : 200;
  const levelProgress = nextAt === Infinity ? 100 : Math.round(((levelScore - prevLevelAt) / (nextAt - prevLevelAt)) * 100);

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.3)" }}>
            <CreditCard size={18} style={{ color: "var(--noctra-gold)" }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--noctra-text)" }}>Founder Passport</h1>
            <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>Your intelligence profile and achievement record</p>
          </div>
        </div>

        {/* Level + core stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Panel>
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold" style={{ background: "rgba(234,179,8,0.15)", border: "2px solid rgba(234,179,8,0.4)", color: "var(--noctra-gold)" }}>
                {level}
              </div>
              <p className="text-sm font-bold" style={{ color: "var(--noctra-gold)" }}>{levelTitle}</p>
              <div className="w-full">
                <ProgressBar value={levelProgress} max={100} color="var(--noctra-gold)" />
                <p className="text-xs mt-1 text-center" style={{ color: "var(--noctra-text-muted)" }}>
                  {nextAt === Infinity ? "Max level" : `${levelScore}/${nextAt} to Level ${level + 1}`}
                </p>
              </div>
            </div>
          </Panel>

          {[
            { label: "Avg Score", value: avgScore, max: 100, color: "var(--noctra-cyan)", suffix: "/100" },
            { label: "Tasks Done", value: completedTasks, max: data.tasks.length || 1, color: "var(--noctra-emerald)", suffix: `/${data.tasks.length}` },
            { label: "Stamps", value: earnedStamps, max: stamps.length, color: "var(--noctra-violet)", suffix: `/${stamps.length}` },
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
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--noctra-text-muted)" }}>Intelligence Scores</p>
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

        {/* Achievement Stamps */}
        <div>
          <p className="text-sm font-semibold mb-3" style={{ color: "var(--noctra-text)" }}>
            Achievement Stamps <span style={{ color: "var(--noctra-text-muted)", fontWeight: 400, fontSize: "12px" }}>({earnedStamps}/{stamps.length} earned)</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {stamps.map((stamp) => (
              <Panel key={stamp.id} style={{
                opacity: stamp.earned ? 1 : 0.5,
                background: stamp.earned ? undefined : "var(--noctra-surface2)",
              }}>
                <div className="flex flex-col items-center text-center gap-2 py-2">
                  <div className="text-2xl">{stamp.emoji}</div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: stamp.earned ? "var(--noctra-text)" : "var(--noctra-text-muted)" }}>
                      {stamp.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)", fontSize: "10px" }}>
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

        {/* Tools coverage */}
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--noctra-text-muted)" }}>Tool Coverage</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TOOLS.filter((t) => !["dashboard", "reports", "tasks", "projects", "passport"].includes(t.key)).map((t) => {
              const used = data.reports.some((r) => r.tool === t.key);
              return (
                <button key={t.key} onClick={() => navigate(t.route)} className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-left hover:opacity-80" style={{ background: used ? `${t.accent}10` : "var(--noctra-surface2)", border: `1px solid ${used ? t.accent + "30" : "var(--noctra-border)"}` }}>
                  <t.icon size={13} style={{ color: used ? t.accent : "var(--noctra-text-muted)" }} />
                  <span className="text-xs" style={{ color: used ? t.accent : "var(--noctra-text-muted)" }}>{t.label}</span>
                  {used && <CheckCircle size={11} style={{ color: t.accent, marginLeft: "auto" }} />}
                </button>
              );
            })}
          </div>
        </Panel>

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
