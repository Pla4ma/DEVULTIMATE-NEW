import { Panel, EmptyState } from "@/components/Primitives";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import { TIMELINE_TYPE_COLOR, formatTimeAgo, type TimelineEvent } from "@/lib/timeline";
import { RISK_SEV_COLOR, type RadarRisk } from "@/lib/risk-radar";
import { getDeltaLabel, getDeltaColor, type ScoreHistoryEntry } from "@/lib/score-history";
import { History, Clock, ShieldAlert } from "lucide-react";

interface HistoryTabProps {
  timeline: TimelineEvent[];
  scoreHistory: ScoreHistoryEntry[];
  risks: RadarRisk[];
}

export function HistoryTab({ timeline, scoreHistory, risks }: HistoryTabProps) {
  return (
    <div className="space-y-4">
      {timeline.length > 0 ? (
        <Panel className="glass">
          <div className="flex items-center gap-2 mb-4">
            <History size={13} style={{ color: "var(--accent-violet)" }} />
            <p className="eyebrow" style={{ color: "var(--text-tertiary)" }}>Project Timeline</p>
          </div>
          <div className="relative">
            <div className="absolute left-[5px] top-0 bottom-0 w-px" style={{ background: "var(--border-default)" }} />
            <div className="space-y-4 pl-6">
              {timeline.map((event) => (
                <div key={event.id} className="relative">
                  <div className="absolute -left-6 w-2.5 h-2.5 rounded-full top-1" style={{ background: TIMELINE_TYPE_COLOR[event.type] ?? "var(--text-tertiary)", boxShadow: `0 0 6px ${TIMELINE_TYPE_COLOR[event.type] ?? "var(--text-tertiary)"}60` }} />
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{event.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{event.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {event.score != null ? <span className="text-xs font-bold font-mono" style={{ color: event.score >= 70 ? "var(--color-success)" : event.score >= 50 ? "var(--color-warning)" : "var(--color-danger)" }}>{event.score}</span> : null}
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-tertiary)" }}><Clock size={10} />{formatTimeAgo(event.date)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      ) : (
        <EmptyState icon={<History size={22} />} title="No history yet" body="Run reports and add proof signals to build your project timeline." />
      )}
      {scoreHistory.length > 0 ? (
        <Panel className="glass">
          <p className="eyebrow mb-3" style={{ color: "var(--text-tertiary)" }}>Score History</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {scoreHistory.map((entry) => {
              const t = TOOL_BY_KEY[entry.tool as keyof typeof TOOL_BY_KEY];
              return (
                <div key={entry.tool} className="glass p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    {t ? <t.icon size={10} style={{ color: t.accent }} /> : null}
                    <span className="text-[10px] uppercase tracking-wide font-medium" style={{ color: "var(--text-tertiary)" }}>{t?.short ?? entry.tool}</span>
                  </div>
                  <p className="text-xl font-bold font-mono leading-none" style={{ color: t?.accent ?? "var(--signal)" }}>{entry.latestScore}</p>
                  {entry.delta != null ? <p className="text-[10px] mt-1 font-medium" style={{ color: getDeltaColor(entry.direction) }}>{getDeltaLabel(entry)}</p> : <p className="text-[10px] mt-1" style={{ color: "var(--text-tertiary)" }}>first run</p>}
                </div>
              );
            })}
          </div>
        </Panel>
      ) : null}
      {risks.length > 0 ? (
        <Panel className="glass">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert size={13} style={{ color: "var(--color-warning)" }} />
            <p className="eyebrow" style={{ color: "var(--color-warning)" }}>Risks & Blockers</p>
            <span className="ml-auto text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>{risks.length} risks detected</span>
          </div>
          <div className="space-y-2">
            {risks.map((risk) => (
              <div key={risk.id} className="glass flex items-start gap-3 px-3 py-2.5">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: RISK_SEV_COLOR[risk.severity] }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{risk.title}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase shrink-0" style={{ background: `${RISK_SEV_COLOR[risk.severity]}15`, color: RISK_SEV_COLOR[risk.severity] }}>{risk.severity}</span>
                    <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{risk.category}</span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Fix: {risk.recommendedFix}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>Source: {risk.sourceTool}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
