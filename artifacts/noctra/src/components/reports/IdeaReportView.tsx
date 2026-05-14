import { ScoreRing, Badge, Panel, ProgressBar, EmptyState } from "@/components/Primitives";
import { Lightbulb, ShieldCheck, ShieldAlert } from "lucide-react";
import { computeAIDefenseScore, DEFENSE_RISK_COLOR, DEFENSE_RISK_LABEL } from "@/lib/ai-defense";

type Assumption = { assumption: string; test: string; risk: string };
type BetterVersion = { name: string; positioning: string; target_user: string };

type IdeaData = {
  summary?: string;
  verdict?: string;
  signal_score?: number;
  score?: number;
  sharpest_experiment?: string;
  why_it_matters?: string;
  who_hurts_most?: string;
  target_user?: string;
  pain_intensity?: string;
  willingness_to_pay?: string;
  retention_risk?: string;
  ai_replacement_risk?: string;
  strongest_angle?: string;
  weakest_assumption?: string;
  top_risks?: string[];
  next_actions?: string[];
  assumptions?: Assumption[];
  better_versions?: BetterVersion[];
  red_flags?: string[];
  strengths?: string[];
};

type Props = {
  report: { payload: unknown; score?: number | null; [key: string]: unknown };
  compact?: boolean;
};

export function IdeaReportView({ report, compact }: Props) {
  const p = report.payload as Record<string, unknown>;
  const data = (p?.data ?? p) as IdeaData | null;
  if (!data) return <EmptyState icon={<Lightbulb size={24} />} title="No data available" />;

  const score = data.signal_score ?? data.score ?? report.score ?? 0;
  const defense = computeAIDefenseScore({ tool: "idea", payload: report.payload, score: report.score as number | null });
  const defenseColor = DEFENSE_RISK_COLOR[defense.riskLevel];

  const topRisks = data.top_risks ?? data.red_flags ?? [];
  const allNextActions = data.next_actions ?? [];

  return (
    <div className="space-y-4">
      {/* ═══ HEADER: Score + Verdict + Thesis ═══ */}
      <div className="flex gap-4 items-start flex-wrap">
        <ScoreRing value={score} label="Signal" color="var(--noctra-violet)" />
        <div className="flex-1 min-w-0">
          {data.verdict && (
            <span
              className="inline-block text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-2"
              style={{
                background: score >= 70 ? "rgba(52,211,153,0.1)" : score >= 40 ? "rgba(245,158,11,0.1)" : "rgba(244,63,94,0.1)",
                color: score >= 70 ? "var(--noctra-emerald)" : score >= 40 ? "var(--noctra-amber)" : "var(--noctra-rose)",
              }}
            >
              {data.verdict}
            </span>
          )}
          {data.summary && <p className="text-sm font-semibold mb-1" style={{ color: "var(--noctra-text)" }}>{data.summary}</p>}
          {data.who_hurts_most && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs font-medium" style={{ color: "var(--noctra-text-muted)" }}>Target user:</span>
              <span className="text-xs" style={{ color: "var(--noctra-text-soft)" }}>{data.who_hurts_most}</span>
            </div>
          )}
          {data.target_user && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium" style={{ color: "var(--noctra-text-muted)" }}>Target user:</span>
              <span className="text-xs" style={{ color: "var(--noctra-text-soft)" }}>{data.target_user}</span>
            </div>
          )}
        </div>
      </div>

      {/* ═══ THESIS & PAIN ═══ */}
      {(data.why_it_matters || data.pain_intensity || data.willingness_to_pay || data.retention_risk || data.ai_replacement_risk) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {data.why_it_matters && (
            <div className="col-span-2 sm:col-span-3 rounded-xl p-3 border" style={{ background: "rgba(61,216,255,0.04)", borderColor: "rgba(61,216,255,0.15)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--noctra-cyan)" }}>Why It Matters</p>
              <p className="text-sm" style={{ color: "var(--noctra-text-soft)" }}>{data.why_it_matters}</p>
            </div>
          )}
          {data.pain_intensity && (
            <div className="rounded-xl p-3 text-center border" style={{ background: "var(--noctra-surface2)", borderColor: "var(--noctra-border)" }}>
              <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--noctra-rose)" }}>Pain Intensity</p>
              <p className="text-sm" style={{ color: "var(--noctra-text)" }}>{data.pain_intensity}</p>
            </div>
          )}
          {data.willingness_to_pay && (
            <div className="rounded-xl p-3 text-center border" style={{ background: "var(--noctra-surface2)", borderColor: "var(--noctra-border)" }}>
              <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--noctra-emerald)" }}>Willingness to Pay</p>
              <p className="text-sm" style={{ color: "var(--noctra-text)" }}>{data.willingness_to_pay}</p>
            </div>
          )}
          {data.retention_risk && (
            <div className="rounded-xl p-3 text-center border" style={{ background: "var(--noctra-surface2)", borderColor: "var(--noctra-border)" }}>
              <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--noctra-amber)" }}>Retention Risk</p>
              <p className="text-sm" style={{ color: "var(--noctra-text)" }}>{data.retention_risk}</p>
            </div>
          )}
          {data.ai_replacement_risk && (
            <div className="rounded-xl p-3 text-center border" style={{ background: "var(--noctra-surface2)", borderColor: "var(--noctra-border)" }}>
              <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--noctra-rose)" }}>AI Replacement Risk</p>
              <p className="text-sm" style={{ color: "var(--noctra-text)" }}>{data.ai_replacement_risk}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ SHARPEST EXPERIMENT ═══ */}
      {data.sharpest_experiment && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--noctra-cyan)" }}>Sharpest Experiment</p>
          <p className="text-sm" style={{ color: "var(--noctra-text-soft)" }}>{data.sharpest_experiment}</p>
        </Panel>
      )}

      {/* ═══ STRONGEST ANGLE / WEAKEST ASSUMPTION ═══ */}
      {(data.strongest_angle || data.weakest_assumption) && (
        <div className="grid grid-cols-2 gap-3">
          {data.strongest_angle && (
            <Panel style={{ border: "1px solid rgba(52,211,153,0.2)", background: "rgba(52,211,153,0.04)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--noctra-emerald)" }}>Strongest Angle</p>
              <p className="text-sm" style={{ color: "var(--noctra-text)" }}>{data.strongest_angle}</p>
            </Panel>
          )}
          {data.weakest_assumption && (
            <Panel style={{ border: "1px solid rgba(244,63,94,0.2)", background: "rgba(244,63,94,0.04)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--noctra-rose)" }}>Weakest Assumption</p>
              <p className="text-sm" style={{ color: "var(--noctra-text)" }}>{data.weakest_assumption}</p>
            </Panel>
          )}
        </div>
      )}

      {/* ═══ TOP RISKS / RED FLAGS ═══ */}
      {topRisks.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-rose)" }}>
            {topRisks.length <= 3 ? "Top Risks" : `Top ${Math.min(3, topRisks.length)} Risks`}
          </p>
          <div className="space-y-2">
            {topRisks.slice(0, 3).map((f, i) => (
              <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(244,63,94,0.04)", border: "1px solid rgba(244,63,94,0.15)" }}>
                <span className="text-xs font-mono shrink-0 mt-0.5" style={{ color: "var(--noctra-rose)" }}>#{i + 1}</span>
                <p className="text-xs" style={{ color: "var(--noctra-text-soft)" }}>{f}</p>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ═══ STRENGTHS ═══ */}
      {data.strengths && data.strengths.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-emerald)" }}>Strengths</p>
          <ul className="space-y-1">
            {data.strengths.map((s, i) => (
              <li key={i} className="text-sm flex gap-2" style={{ color: "var(--noctra-text-soft)" }}>
                <span style={{ color: "var(--noctra-emerald)" }}>+</span>{s}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* ═══ ASSUMPTIONS TO TEST ═══ */}
      {!compact && data.assumptions && data.assumptions.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--noctra-amber)" }}>Assumptions to Test</p>
          <div className="space-y-3">
            {data.assumptions.map((a, i) => (
              <div key={i} className="rounded-lg p-3" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium" style={{ color: "var(--noctra-text)" }}>{a.assumption}</p>
                  <Badge variant={a.risk === "high" ? "rose" : a.risk === "low" ? "emerald" : "amber"} className="shrink-0">{a.risk} risk</Badge>
                </div>
                <p className="text-xs" style={{ color: "var(--noctra-text-soft)" }}>{a.test}</p>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ═══ SHARPER VERSIONS ═══ */}
      {!compact && data.better_versions && data.better_versions.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--noctra-violet)" }}>Sharper Versions</p>
          <div className="space-y-2">
            {data.better_versions.map((v, i) => (
              <div key={i} className="rounded-lg p-3" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--noctra-violet)" }}>{v.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-soft)" }}>{v.positioning}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>Target: {v.target_user}</p>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ═══ NEXT ACTIONS ═══ */}
      {allNextActions.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-cyan)" }}>Next Actions</p>
          <ol className="space-y-1">
            {allNextActions.map((a, i) => (
              <li key={i} className="text-sm flex gap-2" style={{ color: "var(--noctra-text-soft)" }}>
                <span className="text-xs font-mono shrink-0 mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{i + 1}.</span>{a}
              </li>
            ))}
          </ol>
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
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: defenseColor }}>AI Wrapper Defense — {DEFENSE_RISK_LABEL[defense.riskLevel]}</p>
          <span className="ml-auto text-xs font-bold font-mono" style={{ color: defenseColor }}>{defense.score}/100</span>
        </div>
        <ProgressBar value={defense.score} color={defenseColor} />
        <div className="mt-3 space-y-1">
          {defense.reasons.map((r, i) => (
            <p key={i} className="text-xs flex gap-1.5" style={{ color: "var(--noctra-text-soft)" }}>
              <span style={{ color: defenseColor }}>·</span>{r}
            </p>
          ))}
        </div>
        {defense.moatSuggestions.length > 0 && (
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

      <ProgressBar value={score} color="var(--noctra-violet)" />
    </div>
  );
}
