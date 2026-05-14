import { ScoreRing, Badge, Panel, EmptyState, ProgressBar } from "@/components/Primitives";
import { ListChecks, Database, GitBranch, TestTube, Rocket, Calendar } from "lucide-react";

type Week = { week: string; goal: string; tasks: string[] };
type FeatureROI = { feature: string; score: number; decision: string; effort?: string; impact?: string };
type Milestone = { name: string; weeks: number; criteria?: string };
type Architecture = Record<string, string>;
type RuthlessScope = { build_now?: string[]; build_next?: string[]; build_later?: string[]; cut?: string[]; kill?: string[] };

type MvpData = {
  verdict?: string;
  summary?: string;
  mvp_score?: number;
  score?: number;
  north_star_metric?: string;
  ruthless_scope?: RuthlessScope;
  weeks?: Week[];
  feature_roi?: FeatureROI[];
  milestones?: Milestone[];
  architecture?: Architecture;
  database_blueprint?: string;
  api_contract?: string;
  testing_plan?: string;
  deployment_plan?: string;
  next_actions?: string[];
};

type Props = { report: { payload: unknown; score?: number | null; [key: string]: unknown } };

export function MvpReportView({ report }: Props) {
  const p = report.payload as Record<string, unknown>;
  const data = (p?.data ?? p) as MvpData | null;
  if (!data) return <EmptyState icon={<ListChecks size={24} />} title="No data available" />;

  const score = data.mvp_score ?? data.score ?? report.score ?? 0;
  const scope = data.ruthless_scope;

  const roiItems = data.feature_roi ?? [];
  const mils = data.milestones ?? [];

  return (
    <div className="space-y-4">
      {/* ═══ HEADER ═══ */}
      <div className="flex gap-4 items-start flex-wrap">
        <ScoreRing value={score} label="MVP" color="var(--noctra-cyan)" />
        <div className="flex-1 min-w-0">
          {data.verdict && <p className="text-sm font-semibold mb-1" style={{ color: "var(--noctra-text)" }}>{data.verdict}</p>}
          {data.summary && <p className="text-sm" style={{ color: "var(--noctra-text-soft)" }}>{data.summary}</p>}
          {data.north_star_metric && (
            <div className="mt-2 px-3 py-1.5 rounded-lg inline-flex gap-2 items-center" style={{ background: "rgba(61,216,255,0.08)", border: "1px solid rgba(61,216,255,0.2)" }}>
              <span className="text-xs font-semibold" style={{ color: "var(--noctra-cyan)" }}>North Star:</span>
              <span className="text-xs" style={{ color: "var(--noctra-text-soft)" }}>{data.north_star_metric}</span>
            </div>
          )}
        </div>
      </div>

      {/* ═══ RUTHLESS SCOPE ═══ */}
      <Panel>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--noctra-cyan)" }}>Ruthless Scope</p>
        <div className="space-y-3">
          {scope?.build_now && scope.build_now.length > 0 && (
            <div>
              <p className="text-xs mb-1.5 font-medium" style={{ color: "var(--noctra-emerald)" }}>Build Now</p>
              <ul className="space-y-1">
                {scope.build_now.map((f, i) => <li key={i} className="text-sm flex gap-2" style={{ color: "var(--noctra-text-soft)" }}><span style={{ color: "var(--noctra-emerald)" }}>✓</span>{f}</li>)}
              </ul>
            </div>
          )}
          {scope?.build_next && scope.build_next.length > 0 && (
            <div>
              <p className="text-xs mb-1.5 font-medium" style={{ color: "var(--noctra-amber)" }}>Build Next</p>
              <ul className="space-y-1">
                {scope.build_next.map((f, i) => <li key={i} className="text-sm flex gap-2" style={{ color: "var(--noctra-text-soft)" }}><span style={{ color: "var(--noctra-amber)" }}>→</span>{f}</li>)}
              </ul>
            </div>
          )}
          {scope?.build_later && scope.build_later.length > 0 && (
            <div>
              <p className="text-xs mb-1.5 font-medium" style={{ color: "var(--noctra-text-muted)" }}>Build Later</p>
              <ul className="space-y-1">
                {scope.build_later.map((f, i) => <li key={i} className="text-sm flex gap-2" style={{ color: "var(--noctra-text-muted)" }}><span>○</span>{f}</li>)}
              </ul>
            </div>
          )}
          {((scope?.cut?.length ?? 0) > 0 || (scope?.kill?.length ?? 0) > 0) && (
            <div>
              <p className="text-xs mb-1.5 font-medium" style={{ color: "var(--noctra-rose)" }}>Kill</p>
              <ul className="space-y-1">
                {(scope?.cut ?? scope?.kill ?? []).map((f, i) => <li key={i} className="text-sm flex gap-2 line-through" style={{ color: "var(--noctra-text-muted)" }}><span>✗</span>{f}</li>)}
              </ul>
            </div>
          )}
        </div>
      </Panel>

      {/* ═══ FEATURE ROI TABLE ═══ */}
      {roiItems.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--noctra-emerald)" }}>Feature ROI</p>
          <div className="space-y-2">
            {roiItems.map((f, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" style={{ color: "var(--noctra-text)" }}>{f.feature}</p>
                  {(f.effort || f.impact) && (
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>
                      {f.effort ? `Effort: ${f.effort}` : ""}{f.effort && f.impact ? " · " : ""}{f.impact ? `Impact: ${f.impact}` : ""}
                    </p>
                  )}
                </div>
                <span className="text-xs font-mono shrink-0" style={{ color: "var(--noctra-cyan)" }}>{f.score}</span>
                <Badge variant={f.decision === "build" || f.decision === "now" ? "emerald" : f.decision === "later" ? "amber" : "rose"}>{f.decision}</Badge>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ═══ MILESTONES ═══ */}
      {mils.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--noctra-violet)" }}>
            <Calendar size={11} className="inline mr-1" />Milestones
          </p>
          <div className="space-y-2">
            {mils.map((m, i) => (
              <div key={i} className="flex items-start gap-3 px-3 py-2 rounded-lg" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: "rgba(149,117,255,0.12)", color: "var(--noctra-violet)" }}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" style={{ color: "var(--noctra-text)" }}>{m.name}</p>
                  <p className="text-[10px]" style={{ color: "var(--noctra-text-muted)" }}>Week {m.weeks}{m.criteria ? ` · ${m.criteria}` : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ═══ BUILD TIMELINE ═══ */}
      {data.weeks && data.weeks.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--noctra-violet)" }}>Build Timeline</p>
          <div className="space-y-3">
            {data.weeks.map((w, i) => (
              <div key={i} className="rounded-lg p-3" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--noctra-violet)" }}>Week {i + 1}: {w.goal}</p>
                <ul className="space-y-0.5">
                  {w.tasks.map((t, j) => <li key={j} className="text-xs flex gap-1.5" style={{ color: "var(--noctra-text-soft)" }}><span style={{ color: "var(--noctra-text-muted)" }}>·</span>{t}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ═══ ARCHITECTURE ═══ */}
      {data.architecture && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-text-muted)" }}>
            <GitBranch size={11} className="inline mr-1" />Architecture
          </p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(data.architecture).map(([k, v]) => (
              <div key={k} className="flex gap-2 text-xs">
                <span className="font-medium capitalize shrink-0" style={{ color: "var(--noctra-text-muted)" }}>{k}:</span>
                <span style={{ color: "var(--noctra-text-soft)" }}>{v}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ═══ DATABASE / API / TESTING / DEPLOY ═══ */}
      {data.database_blueprint && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--noctra-text-muted)" }}>
            <Database size={11} className="inline mr-1" />Database Blueprint
          </p>
          <pre className="text-xs whitespace-pre-wrap font-mono" style={{ color: "var(--noctra-text-soft)" }}>{data.database_blueprint}</pre>
        </Panel>
      )}
      {data.api_contract && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--noctra-text-muted)" }}>API Contract</p>
          <pre className="text-xs whitespace-pre-wrap font-mono" style={{ color: "var(--noctra-text-soft)" }}>{data.api_contract}</pre>
        </Panel>
      )}
      {data.testing_plan && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--noctra-text-muted)" }}>
            <TestTube size={11} className="inline mr-1" />Testing Plan
          </p>
          <p className="text-sm" style={{ color: "var(--noctra-text-soft)" }}>{data.testing_plan}</p>
        </Panel>
      )}
      {data.deployment_plan && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--noctra-text-muted)" }}>
            <Rocket size={11} className="inline mr-1" />Deployment Plan
          </p>
          <p className="text-sm" style={{ color: "var(--noctra-text-soft)" }}>{data.deployment_plan}</p>
        </Panel>
      )}

      {/* ═══ NEXT ACTIONS ═══ */}
      {data.next_actions && data.next_actions.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-cyan)" }}>Next Actions</p>
          <ol className="space-y-1">
            {data.next_actions.map((a, i) => (
              <li key={i} className="text-sm flex gap-2" style={{ color: "var(--noctra-text-soft)" }}>
                <span className="text-xs font-mono shrink-0" style={{ color: "var(--noctra-text-muted)" }}>{i + 1}.</span>{a}
              </li>
            ))}
          </ol>
        </Panel>
      )}

      <ProgressBar value={score} color="var(--noctra-cyan)" />
    </div>
  );
}
