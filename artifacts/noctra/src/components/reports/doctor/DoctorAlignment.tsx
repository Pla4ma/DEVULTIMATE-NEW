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
        <GitBranch size={13} style={{ color: "var(--noctra-cyan)" }} />
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Codebase / Product Alignment</p>
      </div>
      {alignment.missingProductRequirements && alignment.missingProductRequirements.length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-medium mb-1" style={{ color: "var(--noctra-rose)" }}>Missing Product Requirements</p>
          {alignment.missingProductRequirements.map((m, i) => (
            <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded-lg mb-1 text-xs" style={{ background: "rgba(244,63,94,0.04)", border: "1px solid rgba(244,63,94,0.15)" }}>
              <AlertTriangle size={10} style={{ color: "var(--noctra-rose)", marginTop: 2, flexShrink: 0 }} />
              <div><span className="font-medium" style={{ color: "var(--noctra-text)" }}>{m.title}</span><p style={{ color: "var(--noctra-text-muted)" }}>{m.description}</p></div>
            </div>
          ))}
        </div>
      )}
      {alignment.riskyImplementationChoices && alignment.riskyImplementationChoices.length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-medium mb-1" style={{ color: "var(--noctra-amber)" }}>Risky Implementation Choices</p>
          {alignment.riskyImplementationChoices.map((r, i) => (
            <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded-lg mb-1 text-xs" style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.15)" }}>
              <AlertTriangle size={10} style={{ color: "var(--noctra-amber)", marginTop: 2, flexShrink: 0 }} />
              <div><span className="font-medium" style={{ color: "var(--noctra-text)" }}>{r.title}</span><p style={{ color: "var(--noctra-text-muted)" }}>{r.description}</p></div>
            </div>
          ))}
        </div>
      )}
      {alignment.builtButUnnecessary && alignment.builtButUnnecessary.length > 0 && (
        <div className="mb-2">
          <p className="text-xs font-medium mb-1" style={{ color: "var(--noctra-text-muted)" }}>Built But Unnecessary</p>
          {alignment.builtButUnnecessary.map((b, i) => (
            <div key={i} className="px-2 py-1.5 rounded-lg mb-1 text-xs" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
              <span style={{ color: "var(--noctra-text)" }}>{b.title}</span>
              <p style={{ color: "var(--noctra-text-muted)" }}>{b.description}</p>
            </div>
          ))}
        </div>
      )}
      {alignment.MVPFeatureCoverage && alignment.MVPFeatureCoverage.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: "var(--noctra-text-muted)" }}>MVP Feature Coverage</p>
          <div className="space-y-1">
            {alignment.MVPFeatureCoverage.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-xs px-2 py-1 rounded-lg" style={{ background: "var(--noctra-surface2)" }}>
                {f.status === "found" ? <Check size={10} style={{ color: "var(--noctra-emerald)" }} /> : <AlertTriangle size={10} style={{ color: "var(--noctra-amber)" }} />}
                <span style={{ color: "var(--noctra-text)" }}>{f.feature}</span>
                <Badge style={{ marginLeft: "auto", fontSize: "9px", background: f.status === "found" ? "rgba(52,211,153,0.1)" : "rgba(245,158,11,0.1)", color: f.status === "found" ? "var(--noctra-emerald)" : "var(--noctra-amber)" }}>{f.status}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
      {alignment.recommendedCodeTasks && alignment.recommendedCodeTasks.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-medium mb-1" style={{ color: "var(--noctra-cyan)" }}>Recommended Code Tasks</p>
          {alignment.recommendedCodeTasks.map((t, i) => (
            <div key={i} className="px-2 py-1.5 rounded-lg mb-1 text-xs" style={{ background: "rgba(61,216,255,0.04)", border: "1px solid rgba(61,216,255,0.15)" }}>
              <span className="font-medium" style={{ color: "var(--noctra-text)" }}>{t.title}</span>
              <p style={{ color: "var(--noctra-text-muted)" }}>{t.reason}</p>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
