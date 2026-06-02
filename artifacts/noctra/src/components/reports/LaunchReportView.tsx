import { ScoreRing, Badge, Panel, EmptyState, StatusDot, ProgressBar } from "@/components/Primitives";
import { Rocket, FileText } from "lucide-react";

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
        <ScoreRing value={score} label="Readiness" color="var(--color-warning)" />
        <div className="flex-1 min-w-0">
          {data.verdict && <p className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{data.verdict}</p>}
          {data.summary && <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{data.summary}</p>}
          {data.go_no_go && (
            <div className="mt-2">
              <Badge variant={data.go_no_go === "GO" ? "emerald" : "rose"}>{data.go_no_go}</Badge>
            </div>
          )}
          {redCount > 0 && <p className="text-xs mt-1" style={{ color: "var(--color-danger)" }}>{redCount} gate(s) blocking launch</p>}
        </div>
      </div>

      {gates.length > 0 && (
        <Panel>
          <p className="eyebrow mb-3" style={{ color: "var(--text-tertiary)" }}>Launch Gates</p>
          <div className="space-y-2">
            {gates.map((g, i) => (
              <div key={i} className="rounded-lg p-3 flex items-start gap-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)" }}>
                <StatusDot status={g.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: "var(--text-primary)" }}>{g.name}</p>
                  {g.how_to_fix && g.status !== "GREEN" && <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{g.how_to_fix}</p>}
                </div>
                <Badge variant={g.status === "GREEN" ? "emerald" : g.status === "YELLOW" ? "amber" : "rose"}>{g.status}</Badge>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {data.risks && data.risks.length > 0 && (
        <Panel>
          <p className="eyebrow mb-3" style={{ color: "var(--color-warning)" }}>Risk Register</p>
          <div className="space-y-2">
            {data.risks.map((r, i) => (
              <div key={i} className="rounded-lg p-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)" }}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm" style={{ color: "var(--text-primary)" }}>{r.risk}</p>
                  {r.probability && <Badge variant={r.probability === "high" ? "rose" : r.probability === "low" ? "emerald" : "amber"}>{r.probability}</Badge>}
                </div>
                {r.mitigation && <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>Mitigation: {r.mitigation}</p>}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {data.launch_checklist && data.launch_checklist.length > 0 && (
        <Panel>
          <p className="eyebrow mb-2" style={{ color: "var(--color-success)" }}>Launch Checklist</p>
          <ul className="space-y-1">
            {data.launch_checklist.map((item, i) => (
              <li key={i} className="text-sm flex gap-2" style={{ color: "var(--text-secondary)" }}>
                <span style={{ color: "var(--color-success)" }}>○</span>{item}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* Asset checklist */}
      {data.asset_checklist && data.asset_checklist.length > 0 && (
        <Panel>
          <p className="eyebrow mb-2" style={{ color: "var(--signal)" }}>
            <FileText size={11} className="inline mr-1" />Assets Required
          </p>
          <ul className="space-y-1">
            {data.asset_checklist.map((item, i) => (
              <li key={i} className="text-sm flex gap-2" style={{ color: "var(--text-secondary)" }}>
                <span style={{ color: "var(--signal)" }}>○</span>{item}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* Next actions */}
      {data.next_actions && data.next_actions.length > 0 && (
        <Panel>
          <p className="eyebrow mb-2" style={{ color: "var(--signal)" }}>Next Actions</p>
          <ol className="space-y-1">
            {data.next_actions.map((a, i) => (
              <li key={i} className="text-sm flex gap-2" style={{ color: "var(--text-secondary)" }}>
                <span className="text-xs font-mono shrink-0" style={{ color: "var(--text-tertiary)" }}>{i + 1}.</span>{a}
              </li>
            ))}
          </ol>
        </Panel>
      )}

      <ProgressBar value={score} color="var(--color-warning)" />
    </div>
  );
}
