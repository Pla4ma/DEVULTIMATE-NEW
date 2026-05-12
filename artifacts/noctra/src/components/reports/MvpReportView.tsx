import { ScoreRing, Badge, Panel, EmptyState, ProgressBar } from "@/components/Primitives";
import { ListChecks } from "lucide-react";

type Week = { week: string; goal: string; tasks: string[] };
type FeatureROI = { feature: string; score: number; decision: string };
type Milestone = { name: string; weeks: number; criteria?: string };
type Architecture = Record<string, string>;
type RuthlessScope = { build_now?: string[]; build_next?: string[]; cut?: string[] };

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
  next_actions?: string[];
};

type Props = { report: { payload: unknown; score?: number | null; [key: string]: unknown } };

export function MvpReportView({ report }: Props) {
  const p = report.payload as Record<string, unknown>;
  const data = (p?.data ?? p) as MvpData | null;
  if (!data) return <EmptyState icon={<ListChecks size={24} />} title="No data available" />;

  const score = data.mvp_score ?? data.score ?? report.score ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-start flex-wrap">
        <ScoreRing value={score} label="MVP" color="var(--noctra-cyan)" />
        <div className="flex-1 min-w-0">
          {data.verdict && <p className="text-sm font-semibold mb-2" style={{ color: "var(--noctra-text)" }}>{data.verdict}</p>}
          {data.summary && <p className="text-sm" style={{ color: "var(--noctra-text-soft)" }}>{data.summary}</p>}
          {data.north_star_metric && (
            <div className="mt-2 px-3 py-1.5 rounded-lg inline-flex gap-2 items-center" style={{ background: "rgba(61,216,255,0.08)", border: "1px solid rgba(61,216,255,0.2)" }}>
              <span className="text-xs font-semibold" style={{ color: "var(--noctra-cyan)" }}>North Star:</span>
              <span className="text-xs" style={{ color: "var(--noctra-text-soft)" }}>{data.north_star_metric}</span>
            </div>
          )}
        </div>
      </div>

      {data.ruthless_scope && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--noctra-cyan)" }}>Ruthless Scope</p>
          <div className="space-y-3">
            {data.ruthless_scope.build_now && data.ruthless_scope.build_now.length > 0 && (
              <div>
                <p className="text-xs mb-1.5 font-medium" style={{ color: "var(--noctra-emerald)" }}>Build Now</p>
                <ul className="space-y-1">
                  {data.ruthless_scope.build_now.map((f, i) => <li key={i} className="text-sm flex gap-2" style={{ color: "var(--noctra-text-soft)" }}><span style={{ color: "var(--noctra-emerald)" }}>✓</span>{f}</li>)}
                </ul>
              </div>
            )}
            {data.ruthless_scope.build_next && data.ruthless_scope.build_next.length > 0 && (
              <div>
                <p className="text-xs mb-1.5 font-medium" style={{ color: "var(--noctra-amber)" }}>Build Next</p>
                <ul className="space-y-1">
                  {data.ruthless_scope.build_next.map((f, i) => <li key={i} className="text-sm flex gap-2" style={{ color: "var(--noctra-text-soft)" }}><span style={{ color: "var(--noctra-amber)" }}>→</span>{f}</li>)}
                </ul>
              </div>
            )}
            {data.ruthless_scope.cut && data.ruthless_scope.cut.length > 0 && (
              <div>
                <p className="text-xs mb-1.5 font-medium" style={{ color: "var(--noctra-rose)" }}>Cut</p>
                <ul className="space-y-1">
                  {data.ruthless_scope.cut.map((f, i) => <li key={i} className="text-sm flex gap-2 line-through" style={{ color: "var(--noctra-text-muted)" }}><span>✗</span>{f}</li>)}
                </ul>
              </div>
            )}
          </div>
        </Panel>
      )}

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

      {data.architecture && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-text-muted)" }}>Architecture</p>
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

      <ProgressBar value={score} color="var(--noctra-cyan)" />
    </div>
  );
}
