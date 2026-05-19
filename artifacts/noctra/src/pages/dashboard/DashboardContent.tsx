import { useMemo } from "react";
import { Target, XCircle, TrendingUp, TrendingDown, Minus, Stethoscope, CheckSquare, FolderOpen, FileText, ArrowRight, Rocket, AlertTriangle, CheckCircle, Clock, BarChart3, Shield, ExternalLink } from "lucide-react";
import { Panel, Badge, ScoreRing, NoctraButton } from "@/components/Primitives";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import { computeScoreHistory, getDeltaLabel, type ScoreHistoryEntry } from "@/lib/score-history";
import type { ReportSummary } from "@/lib/intelligence";

type Props = {
  reports: ReportSummary[];
  allTasks: Array<{ id: string; status: string; priority: string; title?: string; category?: string | null; created_at?: string; updated_at?: string }>;
  data: { reports: Array<{ id: string }>; tasks: Array<{ id: string }> } | null;
  smartNextAction: { title: string; reason: string; priority: string; href: string };
  navigate: (path: string) => void;
};

const PRIORITY_COLOR: Record<string, string> = {
  critical: "var(--noctra-rose)", high: "var(--noctra-amber)", medium: "var(--noctra-cyan)", low: "var(--noctra-text-muted)",
};
const PRIORITY_BG: Record<string, string> = {
  critical: "rgba(244,63,94,0.08)", high: "rgba(245,158,11,0.08)", medium: "rgba(61,216,255,0.08)", low: "transparent",
};

export function DashboardContent({ reports, allTasks, data, smartNextAction, navigate }: Props) {
  const doctorReports = reports.filter((r: ReportSummary) => r.tool === "doctor");
  const lastDoctor = doctorReports[doctorReports.length - 1];
  const lastPayload = lastDoctor?.payload ? (lastDoctor.payload as Record<string, unknown>) : null;
  const lastData = lastPayload?.data ? (lastPayload.data as Record<string, unknown>) : null;
  const launchScore = typeof lastDoctor?.score === "number" ? lastDoctor.score : (lastData?.health_score as number) ?? null;
  const scanCount = doctorReports.length;

  const redGates: string[] = [];
  const gateDetails: Array<{ name: string; status: string }> = [];
  if (lastDoctor?.payload) {
    const p = lastDoctor.payload as Record<string, unknown>;
    const d = (p.data ?? p) as Record<string, unknown>;
    const gates = (d.gates ?? []) as Array<{ name: string; status: string }>;
    gateDetails.push(...gates);
    const gateRed = gates.filter(g => g.status === "RED").map(g => g.name);
    const redStrings = (d.red_gates ?? []) as string[];
    redGates.push(...gateRed, ...redStrings.filter(s => typeof s === "string"));
  }

  const latestReport = reports[reports.length - 1];
  const latestTool = latestReport ? TOOL_BY_KEY[latestReport.tool as keyof typeof TOOL_BY_KEY] : null;

  const scoreHistoryEntries = reports.length > 0
    ? computeScoreHistory(reports as Array<{ id: string; tool: string; score?: number | null; created_at: string }>)
    : [];

  const healthTrend = useMemo(() => {
    const doctorEntries = scoreHistoryEntries.filter((e: ScoreHistoryEntry) => e.tool === "doctor");
    if (doctorEntries.length < 2) return null;
    const last = doctorEntries[doctorEntries.length - 1];
    return { direction: last.direction, delta: last.delta, previousScore: last.previousScore, latestScore: last.latestScore };
  }, [scoreHistoryEntries]);

  const hasIssues = redGates.length > 0;
  const openCritical = allTasks.filter(t => t.status !== "completed" && t.priority === "critical").length;
  const openHigh = allTasks.filter(t => t.status !== "completed" && t.priority === "high").length;
  const completedTasks = allTasks.filter(t => t.status === "completed").length;

  return (
    <div className="space-y-5">
      {/* Top metrics row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Panel>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={11} style={{ color: "var(--noctra-text-muted)" }} />
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Codebase Health</p>
          </div>
          {launchScore != null ? (
            <div className="flex items-center gap-3">
              <ScoreRing value={launchScore} label="" color={launchScore >= 70 ? "var(--noctra-emerald)" : launchScore >= 40 ? "var(--noctra-amber)" : "var(--noctra-rose)"} size={48} stroke={5} />
              <div>
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-bold" style={{ color: launchScore >= 70 ? "var(--noctra-emerald)" : launchScore >= 40 ? "var(--noctra-amber)" : "var(--noctra-rose)" }}>
                    {launchScore}
                  </span>
                  <span className="text-xs mb-0.5" style={{ color: "var(--noctra-text-muted)" }}>/100</span>
                </div>
                {healthTrend && (
                  <div className="flex items-center gap-1 mt-0.5">
                    {healthTrend.direction === "improved" ? <TrendingUp size={10} style={{ color: "var(--noctra-emerald)" }} />
                      : healthTrend.direction === "declined" ? <TrendingDown size={10} style={{ color: "var(--noctra-rose)" }} />
                      : <Minus size={10} style={{ color: "var(--noctra-text-muted)" }} />}
                    <span className="text-[10px]" style={{ color: healthTrend.direction === "improved" ? "var(--noctra-emerald)" : healthTrend.direction === "declined" ? "var(--noctra-rose)" : "var(--noctra-text-muted)" }}>
                      {healthTrend.delta != null ? (healthTrend.delta >= 0 ? "+" : "") + healthTrend.delta : ""} pts
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--noctra-text-muted)" }}>from {healthTrend.previousScore}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--noctra-text-muted)" }}>No scan yet</p>
          )}
        </Panel>

        <Panel>
          <div className="flex items-center gap-2 mb-1">
            <XCircle size={11} style={{ color: hasIssues ? "var(--noctra-rose)" : "var(--noctra-text-muted)" }} />
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Blocker Gates</p>
          </div>
          {redGates.length > 0 ? (
            <div>
              <p className="text-2xl font-bold" style={{ color: "var(--noctra-rose)" }}>{redGates.length}</p>
              <div className="mt-1 space-y-0.5">
                {redGates.slice(0, 3).map((g, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--noctra-rose)" }}>
                    <XCircle size={8} /> {g}
                  </div>
                ))}
                {redGates.length > 3 && <p className="text-[10px]" style={{ color: "var(--noctra-text-muted)" }}>+{redGates.length - 3} more</p>}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm" style={{ color: "var(--noctra-text-muted)" }}>{scanCount > 0 ? "All gates clear" : "No data"}</p>
              {scanCount > 0 && <CheckCircle size={16} style={{ color: "var(--noctra-emerald)" }} />}
            </div>
          )}
        </Panel>

        <Panel>
          <div className="flex items-center gap-2 mb-1">
            <CheckSquare size={11} style={{ color: "var(--noctra-text-muted)" }} />
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Open Tasks</p>
          </div>
          <p className="text-2xl font-bold" style={{ color: openCritical > 0 ? "var(--noctra-rose)" : "var(--noctra-cyan)" }}>{openCritical + openHigh}</p>
          <div className="flex gap-2 mt-0.5">
            {openCritical > 0 && <Badge style={{ fontSize: "9px", background: "rgba(244,63,94,0.1)", color: "var(--noctra-rose)" }}>{openCritical} critical</Badge>}
            {openHigh > 0 && <Badge style={{ fontSize: "9px", background: "rgba(245,158,11,0.1)", color: "var(--noctra-amber)" }}>{openHigh} high</Badge>}
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={11} style={{ color: "var(--noctra-text-muted)" }} />
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Reports</p>
          </div>
          <p className="text-2xl font-bold" style={{ color: "var(--noctra-violet)" }}>{data?.reports.length ?? 0}</p>
          <div className="flex gap-2 mt-0.5">
            {completedTasks > 0 && <Badge style={{ fontSize: "9px", background: "rgba(52,211,153,0.1)", color: "var(--noctra-emerald)" }}>{completedTasks} tasks done</Badge>}
            {scanCount > 0 && <Badge style={{ fontSize: "9px", background: "rgba(244,63,94,0.1)", color: "var(--noctra-rose)" }}>{scanCount} scan{scanCount > 1 ? "s" : ""}</Badge>}
          </div>
        </Panel>
      </div>

      {/* Next Action Bar */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl" style={{
        background: smartNextAction.priority === "critical" ? "rgba(244,63,94,0.07)" : smartNextAction.priority === "high" ? "rgba(61,216,255,0.06)" : "rgba(149,117,255,0.06)",
        border: `1px solid ${smartNextAction.priority === "critical" ? "rgba(244,63,94,0.25)" : smartNextAction.priority === "high" ? "rgba(61,216,255,0.2)" : "rgba(149,117,255,0.2)"}`,
      }}>
        <div className="flex items-start gap-3 min-w-0">
          <Target size={16} style={{ color: PRIORITY_COLOR[smartNextAction.priority] ?? "var(--noctra-violet)", flexShrink: 0, marginTop: 2 }} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-emerald)" }}>Next Action</p>
              <Badge style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", background: PRIORITY_BG[smartNextAction.priority] ?? "rgba(149,117,255,0.12)", color: PRIORITY_COLOR[smartNextAction.priority] ?? "var(--noctra-violet)" }}>
                {smartNextAction.priority}
              </Badge>
            </div>
            <p className="text-sm font-semibold" style={{ color: "var(--noctra-text)" }}>{smartNextAction.title}</p>
            <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{smartNextAction.reason}</p>
          </div>
        </div>
        <button onClick={() => navigate(smartNextAction.href)} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: smartNextAction.priority === "critical" ? "var(--noctra-rose)" : "var(--noctra-cyan)", color: "#000" }}>
          Open <ArrowRight size={11} />
        </button>
      </div>

      {/* Quick actions toolbar */}
      <div className="flex flex-wrap gap-2">
        <NoctraButton onClick={() => navigate("/app/doctor")} variant="primary" className="text-xs">
          <Stethoscope size={11} />
          {lastDoctor ? "Rescan Project" : "Scan Project"}
        </NoctraButton>
        <NoctraButton onClick={() => navigate("/app/tasks")} variant="ghost" className="text-xs">
          <CheckSquare size={11} />
          Tasks ({allTasks.length})
        </NoctraButton>
        <NoctraButton onClick={() => navigate("/app/launch")} variant="ghost" className="text-xs">
          <Rocket size={11} />
          Launch Readiness
        </NoctraButton>
        <NoctraButton onClick={() => navigate("/app/projects")} variant="ghost" className="text-xs">
          <FolderOpen size={11} />
          Projects
        </NoctraButton>
        {latestReport?.id && (
          <NoctraButton onClick={() => navigate(`/app/reports/${latestReport.id}`)} variant="ghost" className="text-xs">
            <FileText size={11} />
            Latest Report
          </NoctraButton>
        )}
      </div>

      {/* Blockers warning */}
      {redGates.length > 0 && (
        <div className="px-4 py-3 rounded-xl flex items-start gap-3" style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.2)" }}>
          <XCircle size={14} style={{ color: "var(--noctra-rose)", flexShrink: 0, marginTop: 1 }} />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold" style={{ color: "var(--noctra-rose)" }}>{redGates.length} blocker{redGates.length !== 1 ? "s" : ""} blocking launch</p>
              <NoctraButton onClick={() => navigate("/app/doctor")} variant="ghost" className="text-xs">
                Fix Now <ArrowRight size={10} />
              </NoctraButton>
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

      {/* Gate status breakdown (when doctor data exists) */}
      {gateDetails.length > 0 && (
        <Panel>
          <div className="flex items-center gap-2 mb-3">
            <Shield size={12} style={{ color: "var(--noctra-text-muted)" }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Gate Status</p>
            <span className="ml-auto text-[10px]" style={{ color: "var(--noctra-text-muted)" }}>
              {gateDetails.filter(g => g.status === "GREEN").length} GREEN · {gateDetails.filter(g => g.status === "YELLOW").length} YELLOW · {gateDetails.filter(g => g.status === "RED").length} RED
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {gateDetails.slice(0, 8).map((gate, i) => (
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
        </Panel>
      )}

      {/* Scan timeline */}
      {doctorReports.length > 1 && (
        <Panel>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={12} style={{ color: "var(--noctra-text-muted)" }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Scan History</p>
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
        </Panel>
      )}

      {/* Score trends */}
      {scoreHistoryEntries.length >= 2 && (
        <Panel>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={12} style={{ color: "var(--noctra-text-muted)" }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Score Trends</p>
          </div>
          <div className="space-y-1.5">
            {scoreHistoryEntries.filter((e: ScoreHistoryEntry) => e.latestScore != null && e.previousScore != null).slice(-6).map((entry: ScoreHistoryEntry, i: number) => (
              <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs" style={{ background: "var(--noctra-surface2)" }}>
                {entry.tool === "doctor" ? <Stethoscope size={10} style={{ color: "var(--noctra-rose)" }} />
                  : entry.tool === "idea" ? <FileText size={10} style={{ color: "var(--noctra-violet)" }} />
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
        </Panel>
      )}
    </div>
  );
}
