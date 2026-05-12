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

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex gap-4 items-start flex-wrap">
        <ScoreRing value={score} label="Signal" color="var(--noctra-violet)" />
        <div className="flex-1 min-w-0">
          {data.verdict && (
            <p className="text-sm font-semibold mb-2" style={{ color: "var(--noctra-text)" }}>{data.verdict}</p>
          )}
          {data.summary && <p className="text-sm" style={{ color: "var(--noctra-text-soft)" }}>{data.summary}</p>}
          {data.who_hurts_most && (
            <p className="text-xs mt-1.5" style={{ color: "var(--noctra-text-muted)" }}>
              <strong>Who hurts most:</strong> {data.who_hurts_most}
            </p>
          )}
        </div>
      </div>

      {/* Sharpest experiment */}
      {data.sharpest_experiment && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--noctra-cyan)" }}>Sharpest Experiment</p>
          <p className="text-sm" style={{ color: "var(--noctra-text-soft)" }}>{data.sharpest_experiment}</p>
        </Panel>
      )}

      {/* Strengths */}
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

      {/* Red flags */}
      {data.red_flags && data.red_flags.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-rose)" }}>Red Flags</p>
          <ul className="space-y-1">
            {data.red_flags.map((f, i) => (
              <li key={i} className="text-sm flex gap-2" style={{ color: "var(--noctra-text-soft)" }}>
                <span style={{ color: "var(--noctra-rose)" }}>!</span>{f}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* Assumptions */}
      {!compact && data.assumptions && data.assumptions.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--noctra-amber)" }}>Assumptions to Test</p>
          <div className="space-y-3">
            {data.assumptions.map((a, i) => (
              <div key={i} className="rounded-lg p-3" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                <p className="text-sm font-medium mb-1" style={{ color: "var(--noctra-text)" }}>{a.assumption}</p>
                <p className="text-xs mb-1.5" style={{ color: "var(--noctra-text-soft)" }}>{a.test}</p>
                <Badge variant={a.risk === "high" ? "rose" : a.risk === "low" ? "emerald" : "amber"}>{a.risk} risk</Badge>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Better versions */}
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

      {/* Next actions */}
      {data.next_actions && data.next_actions.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-cyan)" }}>Next Actions</p>
          <ol className="space-y-1">
            {data.next_actions.map((a, i) => (
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
