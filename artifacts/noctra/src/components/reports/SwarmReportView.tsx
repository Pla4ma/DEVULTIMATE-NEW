import { ScoreRing, Badge, Panel, EmptyState, ProgressBar } from "@/components/Primitives";
import { Users, ShieldAlert, ShieldCheck } from "lucide-react";
import { computeAIDefenseScore, DEFENSE_RISK_COLOR, DEFENSE_RISK_LABEL } from "@/lib/ai-defense";

type Persona = { name: string; role: string; reaction: string; objections?: string[]; willingness_to_pay?: string; top_objection?: string; segment?: string };
type Experiment = { title: string; method?: string };
type TopObjection = { objection: string; frequency?: string; blocking?: boolean; rebuttal?: string; killer_question?: string };
type SegmentBreakdown = { enthusiasts?: number; skeptics?: number; neutrals?: number };

type SwarmData = {
  verdict?: string;
  summary?: string;
  swarm_score?: number;
  score?: number;
  personas?: Persona[];
  consensus?: string;
  top_objections?: (string | TopObjection)[];
  recommendations?: string[];
  next_experiments?: (string | Experiment)[];
  pricing_signal?: string;
  next_actions?: string[];
  segment_breakdown?: SegmentBreakdown;
};

type Props = {
  report: { payload: unknown; score?: number | null; [key: string]: unknown };
  compact?: boolean;
};

export function SwarmReportView({ report, compact }: Props) {
  const p = report.payload as Record<string, unknown>;
  const data = (p?.data ?? p) as SwarmData | null;
  if (!data) return <EmptyState icon={<Users size={24} />} title="No data available" />;

  const score = data.swarm_score ?? data.score ?? report.score ?? 0;
  const defense = computeAIDefenseScore({ tool: "swarm", payload: report.payload, score: report.score as number | null });
  const defenseColor = DEFENSE_RISK_COLOR[defense.riskLevel];

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-start flex-wrap">
        <ScoreRing value={score} label="Swarm" color="var(--noctra-cyan)" />
        <div className="flex-1 min-w-0">
          {data.verdict && <p className="text-sm font-semibold mb-2" style={{ color: "var(--noctra-text)" }}>{data.verdict}</p>}
          {data.summary && <p className="text-sm" style={{ color: "var(--noctra-text-soft)" }}>{data.summary}</p>}
          {data.consensus && <p className="text-sm mt-1 italic" style={{ color: "var(--noctra-text-muted)" }}>{data.consensus}</p>}
          {data.pricing_signal && (
            <div className="mt-2">
              <Badge variant="gold">Pricing Signal: {data.pricing_signal}</Badge>
            </div>
          )}
        </div>
      </div>

      {data.personas && data.personas.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--noctra-cyan)" }}>Persona Reactions</p>
          <div className="space-y-3">
            {data.personas.map((persona, i) => (
              <div key={i} className="rounded-lg p-3" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-medium" style={{ color: "var(--noctra-text)" }}>{persona.name}</p>
                  {persona.role && <Badge variant="muted">{persona.role}</Badge>}
                </div>
                <p className="text-xs mb-1.5" style={{ color: "var(--noctra-text-soft)" }}>{persona.reaction}</p>
                {persona.objections && persona.objections.length > 0 && (
                  <div className="mt-1">
                    <p className="text-xs font-medium mb-1" style={{ color: "var(--noctra-rose)" }}>Objections:</p>
                    <ul className="space-y-0.5">
                      {persona.objections.map((o, j) => <li key={j} className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>• {o}</li>)}
                    </ul>
                  </div>
                )}
                {persona.willingness_to_pay && (
                  <p className="text-xs mt-1" style={{ color: "var(--noctra-gold)" }}>WTP: {persona.willingness_to_pay}</p>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {data.segment_breakdown && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--noctra-text-muted)" }}>Segment Breakdown</p>
          <div className="flex gap-3">
            {[
              { label: "Enthusiasts", value: data.segment_breakdown.enthusiasts, color: "var(--noctra-emerald)" },
              { label: "Neutrals", value: data.segment_breakdown.neutrals, color: "var(--noctra-amber)" },
              { label: "Skeptics", value: data.segment_breakdown.skeptics, color: "var(--noctra-rose)" },
            ].map(({ label, value, color }) => value != null ? (
              <div key={label} className="flex-1 text-center px-2 py-3 rounded-lg" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                <p className="text-xl font-bold" style={{ color }}>{value}%</p>
                <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{label}</p>
              </div>
            ) : null)}
          </div>
        </Panel>
      )}

      {data.top_objections && data.top_objections.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-rose)" }}>Top Objections</p>
          <div className="space-y-2">
            {data.top_objections.map((o, i) => {
              if (typeof o === "string") {
                return <div key={i} className="text-sm flex gap-2" style={{ color: "var(--noctra-text-soft)" }}><span style={{ color: "var(--noctra-rose)" }}>!</span>{o}</div>;
              }
              return (
                <div key={i} className="rounded-lg p-2.5" style={{ background: "var(--noctra-surface2)", border: "1px solid rgba(244,63,94,0.15)" }}>
                  <div className="flex items-start gap-2 mb-1">
                    <span style={{ color: "var(--noctra-rose)" }}>!</span>
                    <p className="text-sm font-medium flex-1" style={{ color: "var(--noctra-text)" }}>{o.objection}</p>
                    {o.frequency && (
                      <Badge style={{ fontSize: "10px", background: o.blocking ? "rgba(244,63,94,0.15)" : "var(--noctra-surface)", color: o.blocking ? "var(--noctra-rose)" : "var(--noctra-text-muted)" }}>
                        {o.blocking ? "blocking · " : ""}{o.frequency}
                      </Badge>
                    )}
                  </div>
                  {o.rebuttal && <p className="text-xs ml-4" style={{ color: "var(--noctra-text-muted)" }}>↳ {o.rebuttal}</p>}
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {data.recommendations && data.recommendations.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-emerald)" }}>Recommendations</p>
          <ul className="space-y-1">
            {data.recommendations.map((r, i) => <li key={i} className="text-sm flex gap-2" style={{ color: "var(--noctra-text-soft)" }}><span style={{ color: "var(--noctra-emerald)" }}>→</span>{r}</li>)}
          </ul>
        </Panel>
      )}

      {/* AI Wrapper Defense Score */}
      <Panel>
        <div className="flex items-center gap-2 mb-3">
          {defense.riskLevel === "low" ? (
            <ShieldCheck size={14} style={{ color: defenseColor }} />
          ) : (
            <ShieldAlert size={14} style={{ color: defenseColor }} />
          )}
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: defenseColor }}>
            AI Wrapper Defense — {DEFENSE_RISK_LABEL[defense.riskLevel]}
          </p>
          <span className="ml-auto text-xs font-bold font-mono" style={{ color: defenseColor }}>
            {defense.score}/100
          </span>
        </div>
        <ProgressBar value={defense.score} color={defenseColor} />
        <div className="mt-3 space-y-1">
          {defense.reasons.map((r, i) => (
            <p key={i} className="text-xs flex gap-1.5" style={{ color: "var(--noctra-text-soft)" }}>
              <span style={{ color: defenseColor }}>·</span>{r}
            </p>
          ))}
        </div>
        {!compact && defense.moatSuggestions.length > 0 && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--noctra-border)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-text-muted)" }}>Moat Suggestions</p>
            <div className="space-y-1">
              {defense.moatSuggestions.map((s, i) => (
                <p key={i} className="text-xs flex gap-1.5" style={{ color: "var(--noctra-text-muted)" }}>
                  <span style={{ color: "var(--noctra-amber)" }}>→</span>{s}
                </p>
              ))}
            </div>
          </div>
        )}
      </Panel>

      <ProgressBar value={score} color="var(--noctra-cyan)" />
    </div>
  );
}
