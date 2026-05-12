import { ScoreRing, Badge, Panel, EmptyState, ProgressBar } from "@/components/Primitives";
import { FlaskConical, Clock, Target, AlertTriangle, CheckCircle2, Circle } from "lucide-react";

type Experiment = {
  title: string;
  method: string;
  hypothesis?: string;
  script?: string;
  success_metric?: string;
  success_signal?: string;
  failure_signal?: string;
  estimated_time?: string;
  difficulty?: string;
  status?: string;
};
type ProofSignal = { label: string; kind: string; value?: number; source?: string };

type ProofData = {
  verdict?: string;
  summary?: string;
  proof_score?: number;
  score?: number;
  signal_density?: number;
  experiments?: Experiment[];
  evidence_gaps?: string[];
  next_experiments?: string[];
  proof_signals?: ProofSignal[];
  next_actions?: string[];
};

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "var(--noctra-emerald)",
  medium: "var(--noctra-amber)",
  hard: "var(--noctra-rose)",
  low: "var(--noctra-emerald)",
  high: "var(--noctra-rose)",
};

type Props = { report: { payload: unknown; score?: number | null; [key: string]: unknown } };

export function ProofReportView({ report }: Props) {
  const p = report.payload as Record<string, unknown>;
  const data = (p?.data ?? p) as ProofData | null;
  if (!data) return <EmptyState icon={<FlaskConical size={24} />} title="No data available" />;

  const score = data.proof_score ?? data.score ?? report.score ?? 0;
  const density = data.signal_density ?? score;

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-start flex-wrap">
        <ScoreRing value={score} label="Proof" color="var(--noctra-emerald)" />
        <div className="flex-1 min-w-0">
          {data.verdict && <p className="text-sm font-semibold mb-2" style={{ color: "var(--noctra-text)" }}>{data.verdict}</p>}
          {data.summary && <p className="text-sm" style={{ color: "var(--noctra-text-soft)" }}>{data.summary}</p>}
        </div>
      </div>

      <Panel>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-emerald)" }}>Signal Density</p>
        <ProgressBar value={density} color="var(--noctra-emerald)" />
        <p className="text-xs mt-1" style={{ color: "var(--noctra-text-muted)" }}>{density}/100 — {density >= 70 ? "Strong" : density >= 40 ? "Building" : "Weak"} evidence base</p>
      </Panel>

      {/* Experiment Cards — Feature 8 */}
      {data.experiments && data.experiments.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: "var(--noctra-emerald)" }}>
            Validation Experiments
          </p>
          <div className="space-y-3">
            {data.experiments.map((e, i) => {
              const statusDone = e.status === "complete" || e.status === "done";
              const statusActive = e.status === "in-progress" || e.status === "running";
              return (
                <div
                  key={i}
                  className="rounded-xl p-4"
                  style={{
                    background: statusDone ? "rgba(52,211,153,0.05)" : "var(--noctra-surface2)",
                    border: `1px solid ${statusDone ? "rgba(52,211,153,0.25)" : statusActive ? "rgba(61,216,255,0.2)" : "var(--noctra-border)"}`,
                  }}
                >
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {statusDone ? (
                        <CheckCircle2 size={14} style={{ color: "var(--noctra-emerald)", flexShrink: 0 }} />
                      ) : statusActive ? (
                        <Target size={14} style={{ color: "var(--noctra-cyan)", flexShrink: 0 }} />
                      ) : (
                        <Circle size={14} style={{ color: "var(--noctra-text-muted)", flexShrink: 0 }} />
                      )}
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--noctra-text)" }}>{e.title}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {e.difficulty && (
                        <Badge style={{ fontSize: "9px", color: DIFFICULTY_COLOR[e.difficulty.toLowerCase()] ?? "var(--noctra-text-muted)", background: "transparent", border: `1px solid ${DIFFICULTY_COLOR[e.difficulty.toLowerCase()] ?? "var(--noctra-border)"}20` }}>
                          {e.difficulty}
                        </Badge>
                      )}
                      {e.status && (
                        <Badge variant={statusDone ? "emerald" : statusActive ? "cyan" : "muted"}>
                          {e.status}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Hypothesis */}
                  {e.hypothesis && (
                    <div className="mb-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--noctra-text-muted)" }}>Hypothesis</p>
                      <p className="text-xs" style={{ color: "var(--noctra-text-soft)" }}>{e.hypothesis}</p>
                    </div>
                  )}

                  {/* Method */}
                  <div className="mb-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--noctra-text-muted)" }}>Method</p>
                    <p className="text-xs" style={{ color: "var(--noctra-text-soft)" }}>{e.method}</p>
                  </div>

                  {/* Script */}
                  {e.script && (
                    <div className="mb-2 p-2 rounded-lg" style={{ background: "var(--noctra-bg)", border: "1px solid var(--noctra-border)" }}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--noctra-text-muted)" }}>Script</p>
                      <p className="text-xs italic" style={{ color: "var(--noctra-text-soft)" }}>"{e.script}"</p>
                    </div>
                  )}

                  {/* Success / failure signals */}
                  <div className="flex gap-3 mt-2 flex-wrap">
                    {(e.success_signal ?? e.success_metric) && (
                      <div className="flex items-start gap-1 flex-1 min-w-0">
                        <CheckCircle2 size={11} style={{ color: "var(--noctra-emerald)", flexShrink: 0, marginTop: 1 }} />
                        <p className="text-xs" style={{ color: "var(--noctra-emerald)" }}>{e.success_signal ?? e.success_metric}</p>
                      </div>
                    )}
                    {e.failure_signal && (
                      <div className="flex items-start gap-1 flex-1 min-w-0">
                        <AlertTriangle size={11} style={{ color: "var(--noctra-rose)", flexShrink: 0, marginTop: 1 }} />
                        <p className="text-xs" style={{ color: "var(--noctra-rose)" }}>{e.failure_signal}</p>
                      </div>
                    )}
                  </div>

                  {/* Time estimate */}
                  {e.estimated_time && (
                    <div className="flex items-center gap-1 mt-2">
                      <Clock size={11} style={{ color: "var(--noctra-text-muted)" }} />
                      <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{e.estimated_time}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data.evidence_gaps && data.evidence_gaps.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-amber)" }}>Evidence Gaps</p>
          <ul className="space-y-1">
            {data.evidence_gaps.map((g, i) => <li key={i} className="text-sm flex gap-2" style={{ color: "var(--noctra-text-soft)" }}><span style={{ color: "var(--noctra-amber)" }}>—</span>{g}</li>)}
          </ul>
        </Panel>
      )}

      {data.next_actions && data.next_actions.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-cyan)" }}>Next Actions</p>
          <ol className="space-y-1">
            {data.next_actions.map((a, i) => <li key={i} className="text-sm flex gap-2" style={{ color: "var(--noctra-text-soft)" }}><span className="text-xs font-mono shrink-0" style={{ color: "var(--noctra-text-muted)" }}>{i + 1}.</span>{a}</li>)}
          </ol>
        </Panel>
      )}
    </div>
  );
}
