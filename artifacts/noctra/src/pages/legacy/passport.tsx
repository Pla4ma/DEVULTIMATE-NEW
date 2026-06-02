import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { Panel, ScoreRing, Badge, EmptyState } from "@/components/Primitives";
import { getPassport, getReports, getTasks, getProofSignals } from "@/lib/repository";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import { BreadcrumbBar } from "@/components/Breadcrumb";
import { BarChart3, Loader2, CheckCircle, Circle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ROUTES } from "@/lib/routes";

type ProfileData = {
  passport: Record<string, unknown> | null;
  reports: Record<string, unknown>[];
  tasks: Record<string, unknown>[];
  signals: Record<string, unknown>[];
};

type MilestoneItem = {
  id: string; label: string;
  description: string; achieved: boolean; progress?: number; total?: number;
};

function computeMilestones(data: ProfileData): MilestoneItem[] {
  const { reports, tasks, signals } = data;
  const toolsUsed = new Set(reports.map((r) => r.tool as string));
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const ideaCount = reports.filter((r) => r.tool === "idea").length;
  const doctorCount = reports.filter((r) => r.tool === "doctor").length;
  const launchCount = reports.filter((r) => r.tool === "launch").length;
  const swarmCount = reports.filter((r) => r.tool === "swarm").length;
  const proofCount = reports.filter((r) => r.tool === "proof").length;
  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const doctorReports = reports.filter((r) => r.tool === "doctor").sort(
    (a, b) => new Date(String(b.created_at ?? 0)).getTime() - new Date(String(a.created_at ?? 0)).getTime()
  );
  const latestDoctor = doctorReports[0];
  let gatesAllGreen = false;
  if (latestDoctor) {
    const p = latestDoctor.payload as Record<string, unknown>;
    const data = (p?.data ?? p) as Record<string, unknown>;
    const gates = (data.gates ?? data.launch_gates ?? []) as Array<{ status: string }>;
    gatesAllGreen = gates.length > 0 && gates.every(g => g.status === "GREEN");
  }

  return [
    { id: "first_analysis", label: "First Analysis", description: "Run your first intelligence tool", achieved: reports.length >= 1 },
    { id: "codebase_scanned", label: "Codebase Scanned", description: "Scan a repo with Product Doctor", achieved: doctorCount >= 1 },
    { id: "gates_cleared", label: "Gates Cleared", description: "All launch gates passed in Product Doctor", achieved: gatesAllGreen },
    { id: "idea_validated", label: "Idea Validated", description: "Run 3 Idea Checker analyses", achieved: ideaCount >= 3, progress: ideaCount, total: 3 },
    { id: "market_tested", label: "Market Tested", description: "Run 3 Market Swarm simulations", achieved: swarmCount >= 3, progress: swarmCount, total: 3 },
    { id: "evidence_collected", label: "Evidence Collected", description: "Add 5 proof signals", achieved: signals.length >= 5, progress: signals.length, total: 5 },
    { id: "proof_analyzed", label: "Proof Analyzed", description: "Run a Proof Analysis report", achieved: proofCount >= 1 },
    { id: "build_planned", label: "Build Planned", description: "Run the MVP Planner", achieved: reports.some((r) => r.tool === "mvp") },
    { id: "consistent_execution", label: "Consistent Execution", description: "Complete 10 tasks", achieved: completedTasks >= 10, progress: completedTasks, total: 10 },
    { id: "high_completion", label: "High Completion Rate", description: "Complete 80% of all tasks", achieved: taskCompletionRate >= 80 && tasks.length >= 5, progress: taskCompletionRate, total: 80 },
    { id: "launch_ready", label: "Launch Ready", description: "Doctor gates cleared + Launch Room run", achieved: launchCount >= 1 && gatesAllGreen },
    { id: "deep_knowledge", label: "Deep Knowledge", description: "Save 10 intelligence reports", achieved: reports.length >= 10, progress: reports.length, total: 10 },
  ];
}

export default function PassportPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getPassport(), getReports(), getTasks(), getProofSignals()])
      .then(([passport, reports, tasks, signals]) => {
        if (cancelled) return;
        setData({
          passport: passport as Record<string, unknown> | null,
          reports: (reports as unknown as Record<string, unknown>[]) ?? [],
          tasks: (tasks as unknown as Record<string, unknown>[]) ?? [],
          signals: (signals as unknown as Record<string, unknown>[]) ?? [],
        });
      })
      .catch((err) => { if (!cancelled) toast({ title: "Failed to load profile", description: err?.message ?? "Unknown error", variant: "destructive" }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return (
    <AppShell>
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-gold)" }} />
      </div>
    </AppShell>
  );

  if (!data) return (
    <AppShell>
      <div className="p-6 max-w-4xl mx-auto">
        <EmptyState icon={<BarChart3 size={24} />} title="Could not load project profile" body="Check your connection and try again." />
      </div>
    </AppShell>
  );

  const avgScore = data.reports.length
    ? Math.round(data.reports.reduce((s, r) => s + (typeof r.score === "number" ? r.score : 0), 0) / data.reports.length)
    : 0;

  const completedTasks = data.tasks.filter((t) => t.status === "completed").length;
  const toolsUsed = [...new Set(data.reports.map((r) => r.tool as string))];
  const milestones = computeMilestones(data);
  const achievedCount = milestones.filter((s) => s.achieved).length;

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <BreadcrumbBar />
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--color-warning-soft)", border: "1px solid var(--color-warning-soft)" }}>
            <BarChart3 size={18} style={{ color: "var(--accent-gold)" }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Project Profile</h1>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Your execution record — scores, milestones, and progress across all projects</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Avg Score", value: avgScore, max: 100, color: "var(--signal)", suffix: "/100" },
            { label: "Tasks Done", value: completedTasks, max: data.tasks.length || 1, color: "var(--color-success)", suffix: `/${data.tasks.length}` },
            { label: "Milestones", value: achievedCount, max: milestones.length, color: "var(--accent-violet)", suffix: `/${milestones.length}` },
          ].map(({ label, value, color, suffix }) => (
            <Panel key={label}>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color }}>{value}<span className="text-sm font-normal" style={{ color: "var(--text-tertiary)" }}>{suffix}</span></p>
            </Panel>
          ))}
        </div>

        {toolsUsed.length > 0 && (
          <Panel>
            <p className="eyebrow mb-4" style={{ color: "var(--text-tertiary)" }}>Scores by tool</p>
            <div className="flex flex-wrap gap-6 justify-center">
              {toolsUsed.filter((k) => TOOL_BY_KEY[k as keyof typeof TOOL_BY_KEY]).map((key) => {
                const t = TOOL_BY_KEY[key as keyof typeof TOOL_BY_KEY]!;
                const toolReports = data.reports.filter((r) => r.tool === key);
                const latestScore = toolReports[0]?.score as number ?? 0;
                return (
                  <div key={key} className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => navigate(t.route)}>
                    <ScoreRing value={latestScore} size={72} stroke={6} label={t.label.split(" ")[0]!} color={t.accent} />
                    <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{toolReports.length} run{toolReports.length !== 1 ? "s" : ""}</p>
                  </div>
                );
              })}
            </div>
          </Panel>
        )}

        <div>
          <p className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
            Milestones <span style={{ color: "var(--text-tertiary)", fontWeight: 400, fontSize: "12px" }}>({achievedCount}/{milestones.length})</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {milestones.map((item) => (
              <Panel key={item.id} style={{
                opacity: item.achieved ? 1 : 0.5,
                background: item.achieved ? undefined : "var(--surface-2)",
              }}>
                <div className="flex flex-col items-center text-center gap-2 py-2">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: item.achieved ? "var(--text-primary)" : "var(--text-tertiary)" }}>
                      {item.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      {item.description}
                    </p>
                  </div>
                  {item.achieved ? (
                    <CheckCircle size={12} style={{ color: "var(--color-success)" }} />
                  ) : item.total != null ? (
                    <div className="w-full">
                      <div className="h-1 rounded-full w-full" style={{ background: "var(--surface-1)" }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, ((item.progress ?? 0) / item.total) * 100)}%`, background: "var(--signal)" }} />
                      </div>
                      <p style={{ fontSize: "10px", color: "var(--text-tertiary)" }} className="mt-0.5">{item.progress}/{item.total}</p>
                    </div>
                  ) : (
                    <Circle size={11} style={{ color: "var(--text-tertiary)" }} />
                  )}
                </div>
              </Panel>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Reports Saved", value: data.reports.length, color: "var(--accent-violet)", route: ROUTES.reports },
            { label: "Proof Signals", value: data.signals.length, color: "var(--color-success)", route: ROUTES.proof },
            { label: "Tools Used", value: toolsUsed.length, color: "var(--signal)", route: ROUTES.app },
          ].map(({ label, value, color, route }) => (
            <Panel key={label}>
              <button onClick={() => navigate(route)} className="w-full text-left">
                <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>{label}</p>
                <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              </button>
            </Panel>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
