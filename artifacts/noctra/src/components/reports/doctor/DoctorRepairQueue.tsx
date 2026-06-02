import { Wrench } from "lucide-react";
import { Panel, Badge } from "@/components/Primitives";
import type { FixPlanItem } from "./doctor-types";

type Props = {
  allBlockers: string[];
  repairQueue: string[];
  fixPlan: FixPlanItem[];
};

export function DoctorRepairQueue({ allBlockers, repairQueue, fixPlan }: Props) {
  if (repairQueue.length === 0 && fixPlan.length === 0 && allBlockers.length === 0) return null;

  return (
    <Panel>
      <div className="flex items-center gap-2 mb-3">
        <Wrench size={13} style={{ color: "var(--color-warning)" }} />
        <p className="eyebrow" style={{ color: "var(--text-tertiary)" }}>Repair Queue</p>
      </div>
      <div className="space-y-2">
        {allBlockers.map((name, i) => (
          <div key={`r-${i}`} className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--color-danger-soft)", border: "1px solid var(--color-danger-soft)" }}>
            <span className="text-xs font-mono shrink-0 mt-0.5" style={{ color: "var(--color-danger)" }}>#{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium" style={{ color: "var(--color-danger)" }}>{name}</p>
              <Badge style={{ fontSize: "9px", background: "var(--color-danger-soft)", color: "var(--color-danger)", marginTop: 2, display: "inline-block" }}>HIGH</Badge>
            </div>
          </div>
        ))}
        {repairQueue.map((item, i) => (
          <div key={`rq-${i}`} className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)" }}>
            <span className="text-xs font-mono shrink-0 mt-0.5" style={{ color: "var(--color-warning)" }}>#{allBlockers.length + i + 1}</span>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{item}</p>
          </div>
        ))}
        {fixPlan.map((item, i) => (
          <div key={`fp-${i}`} className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)" }}>
            <span className="text-xs font-mono shrink-0 mt-0.5" style={{ color: "var(--color-warning)" }}>#{allBlockers.length + repairQueue.length + i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                {item.priority && <Badge style={{ fontSize: "9px", background: item.priority === "high" ? "var(--color-danger-soft)" : "var(--color-warning-soft)", color: item.priority === "high" ? "var(--color-danger)" : "var(--color-warning)" }}>{item.priority}</Badge>}
                {item.effort_hours != null && <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>~{item.effort_hours}h</span>}
              </div>
              {item.files && item.files.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.files.map((f, j) => <Badge key={j} style={{ fontSize: "9px" }}>{f}</Badge>)}
                </div>
              )}
              {item.acceptance_criteria && item.acceptance_criteria.length > 0 && (
                <p className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>AC: {item.acceptance_criteria.join("; ")}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
