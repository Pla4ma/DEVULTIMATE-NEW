import { GitBranch, AlertTriangle, Check } from "lucide-react";
import { Panel, Badge } from "@/components/Primitives";
import type { AlignmentData } from "./doctor-types";

type Props = {
  alignment: AlignmentData;
};

export function DoctorAlignment({ alignment }: Props) {
  if (!alignment) return null;

  return (
    <Panel>
      <div className="flex items-center gap-2 mb-3">
        <GitBranch size={13} style={{ color: "var(--signal)" }} />
        <p className="eyebrow" style={{ color: "var(--text-tertiary)" }}>Codebase / Product Alignment</p>
      </div>
      {alignment.missingProductRequirements && alignment.missingProductRequirements.length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-medium mb-1" style={{ color: "var(--color-danger)" }}>Missing Product Requirements</p>
          {alignment.missingProductRequirements.map((m, i) => (
            <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded-lg mb-1 text-xs" style={{ background: "var(--color-danger-soft)", border: "1px solid var(--color-danger-soft)" }}>
              <AlertTriangle size={10} style={{ color: "var(--color-danger)", marginTop: 2, flexShrink: 0 }} />
              <div><span className="font-medium" style={{ color: "var(--text-primary)" }}>{m.title}</span><p style={{ color: "var(--text-tertiary)" }}>{m.description}</p></div>
            </div>
          ))}
        </div>
      )}
      {alignment.riskyImplementationChoices && alignment.riskyImplementationChoices.length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-medium mb-1" style={{ color: "var(--color-warning)" }}>Risky Implementation Choices</p>
          {alignment.riskyImplementationChoices.map((r, i) => (
            <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded-lg mb-1 text-xs" style={{ background: "var(--color-warning-soft)", border: "1px solid var(--color-warning-soft)" }}>
              <AlertTriangle size={10} style={{ color: "var(--color-warning)", marginTop: 2, flexShrink: 0 }} />
              <div><span className="font-medium" style={{ color: "var(--text-primary)" }}>{r.title}</span><p style={{ color: "var(--text-tertiary)" }}>{r.description}</p></div>
            </div>
          ))}
        </div>
      )}
      {alignment.builtButUnnecessary && alignment.builtButUnnecessary.length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>Built But Unnecessary</p>
          {alignment.builtButUnnecessary.map((b, i) => (
            <div key={i} className="px-2 py-1.5 rounded-lg mb-1 text-xs" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)" }}>
              <span style={{ color: "var(--text-primary)" }}>{b.title}</span>
              <p style={{ color: "var(--text-tertiary)" }}>{b.description}</p>
            </div>
          ))}
        </div>
      )}
      {alignment.MVPFeatureCoverage && alignment.MVPFeatureCoverage.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: "var(--text-tertiary)" }}>MVP Feature Coverage</p>
          <div className="space-y-1">
            {alignment.MVPFeatureCoverage.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-xs px-2 py-1 rounded-lg" style={{ background: "var(--surface-2)" }}>
                {f.status === "found" ? <Check size={10} style={{ color: "var(--color-success)" }} /> : <AlertTriangle size={10} style={{ color: "var(--color-warning)" }} />}
                <span style={{ color: "var(--text-primary)" }}>{f.feature}</span>
                <Badge style={{ marginLeft: "auto", fontSize: "9px", background: f.status === "found" ? "var(--color-success-soft)" : "var(--color-warning-soft)", color: f.status === "found" ? "var(--color-success)" : "var(--color-warning)" }}>{f.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
      {alignment.recommendedCodeTasks && alignment.recommendedCodeTasks.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-medium mb-1" style={{ color: "var(--signal)" }}>Recommended Code Tasks</p>
          {alignment.recommendedCodeTasks.map((t, i) => (
            <div key={i} className="px-2 py-1.5 rounded-lg mb-1 text-xs" style={{ background: "var(--signal-soft)", border: "1px solid var(--signal-soft)" }}>
              <span className="font-medium" style={{ color: "var(--text-primary)" }}>{t.title}</span>
              <p style={{ color: "var(--text-tertiary)" }}>{t.reason}</p>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
