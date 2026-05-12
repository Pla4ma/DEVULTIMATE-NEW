import { ScoreRing, Badge, Panel, EmptyState, StatusDot, ProgressBar } from "@/components/Primitives";
import { Rocket } from "lucide-react";

type Gate = { name: string; status: "GREEN" | "YELLOW" | "RED"; how_to_fix?: string };
type Risk = { risk: string; probability?: string; mitigation?: string };

type LaunchData = {
  verdict?: string;
  summary?: string;
  launch_score?: number;
  readiness_score?: number;
  score?: number;
  gates?: Gate[];
  risks?: Risk[];
  launch_checklist?: string[];
  asset_checklist?: string[];
  next_actions?: string[];
  go_no_go?: string;
};

type Props = { report: { payload: unknown; score?: number | null; [key: string]: unknown } };

export function LaunchReportView({ report }: Props) {
  const p = report.payload as Record<string, unknown>;
  const data = (p?.data ?? p) as LaunchData | null;
  if (!data) return <EmptyState icon={<Rocket size={24} />} title="No data available" />;

  const score = data.launch_score ?? data.readiness_score ?? data.score ?? report.score ?? 0;
  const gates = data.gates ?? [];
  const redCount = gates.filter(g => g.status === "RED").length;

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-start flex-wrap">
        <ScoreRing value={score} label="Readiness" color="var(--noctra-amber)" />
        <div className="flex-1 min-w-0">
          {data.verdict && <p className="text-sm font-semibold mb-2" style={{ color: "var(--noctra-text)" }}>{data.verdict}</p>}
          {data.summary && <p className="text-sm" style={{ color: "var(--noctra-text-soft)" }}>{data.summary}</p>}
          {data.go_no_go && (
            <div className="mt-2">
              <Badge variant={data.go_no_go === "GO" ? "emerald" : "rose"}>{data.go_no_go}</Badge>
            </div>
          )}
          {redCount > 0 && <p className="text-xs mt-1" style={{ color: "var(--noctra-rose)" }}>{redCount} gate(s) blocking launch</p>}
        </div>
      </div>

      {gates.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--noctra-text-muted)" }}>Launch Gates</p>
          <div className="space-y-2">
            {gates.map((g, i) => (
              <div key={i} className="rounded-lg p-3 flex items-start gap-3" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                <StatusDot status={g.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: "var(--noctra-text)" }}>{g.name}</p>
                  {g.how_to_fix && g.status !== "GREEN" && <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{g.how_to_fix}</p>}
                </div>
                <Badge variant={g.status === "GREEN" ? "emerald" : g.status === "YELLOW" ? "amber" : "rose"}>{g.status}</Badge>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {data.risks && data.risks.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--noctra-amber)" }}>Risk Register</p>
          <div className="space-y-2">
            {data.risks.map((r, i) => (
              <div key={i} className="rounded-lg p-3" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm" style={{ color: "var(--noctra-text)" }}>{r.risk}</p>
                  {r.probability && <Badge variant={r.probability === "high" ? "rose" : r.probability === "low" ? "emerald" : "amber"}>{r.probability}</Badge>}
                </div>
                {r.mitigation && <p className="text-xs mt-1" style={{ color: "var(--noctra-text-soft)" }}>Mitigation: {r.mitigation}</p>}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {data.launch_checklist && data.launch_checklist.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-emerald)" }}>Launch Checklist</p>
          <ul className="space-y-1">
            {data.launch_checklist.map((item, i) => (
              <li key={i} className="text-sm flex gap-2" style={{ color: "var(--noctra-text-soft)" }}>
                <span style={{ color: "var(--noctra-emerald)" }}>○</span>{item}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <ProgressBar value={score} color="var(--noctra-amber)" />
    </div>
  );
}
