import { ShieldAlert } from "lucide-react";
import { Panel, Badge } from "@/components/Primitives";
import { GATE_ICON, GATE_COLOR } from "./doctor-constants";
import type { Gate } from "./doctor-types";

type Props = {
  gates: Gate[];
  allBlockers: string[];
  allWarnings: string[];
  greenGates: Gate[];
};

export function DoctorLaunchGates({ gates, allBlockers, allWarnings, greenGates }: Props) {
  if (gates.length === 0) return null;

  return (
    <Panel>
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert size={13} style={{ color: "var(--noctra-rose)" }} />
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Launch Gates</p>
        <span className="ml-auto text-xs font-mono" style={{ color: "var(--noctra-text-muted)" }}>
          {allBlockers.length} RED · {allWarnings.length} YELLOW · {greenGates.length} GREEN
        </span>
      </div>
      <div className="space-y-2">
        {gates.map((g, i) => (
          <div key={i} className="rounded-xl p-3" style={{
            background: g.status === "RED" ? "rgba(244,63,94,0.04)" : g.status === "YELLOW" ? "rgba(245,158,11,0.04)" : "rgba(52,211,153,0.04)",
            border: `1px solid ${GATE_COLOR[g.status]}22`,
          }}>
            <div className="flex items-center gap-2 mb-1">
              {GATE_ICON[g.status]}
              <span className="text-sm font-medium" style={{ color: "var(--noctra-text)" }}>{g.name}</span>
              <Badge style={{ background: `${GATE_COLOR[g.status]}18`, color: GATE_COLOR[g.status], fontSize: "10px", marginLeft: "auto" }}>{g.status}</Badge>
            </div>
            {g.evidence && g.evidence.length > 0 && (
              <ul className="mt-1 space-y-0.5">
                {g.evidence.map((e, j) => (
                  <li key={j} className="text-xs flex items-start gap-1.5" style={{ color: "var(--noctra-text-muted)" }}>
                    <span style={{ color: GATE_COLOR[g.status] }}>•</span> {e}
                  </li>
                ))}
              </ul>
            )}
            {g.why && (
              <p className="text-xs mt-1 italic" style={{ color: "var(--noctra-text-muted)" }}>
                Why: {g.why}
              </p>
            )}
            {g.how_to_fix && (
              <div className="mt-1.5 px-2 py-1 rounded-lg text-xs" style={{
                background: g.status === "RED" ? "rgba(244,63,94,0.06)" : g.status === "YELLOW" ? "rgba(245,158,11,0.06)" : "rgba(52,211,153,0.06)",
                color: GATE_COLOR[g.status],
              }}>
                Fix: {g.how_to_fix}
              </div>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}
