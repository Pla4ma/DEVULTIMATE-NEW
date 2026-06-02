import { ShieldCheck, ShieldAlert } from "lucide-react";
import { Panel, ProgressBar } from "@/components/Primitives";
import { DEFENSE_RISK_COLOR, DEFENSE_RISK_LABEL, type DefenseRiskLevel } from "@/lib/ai-defense";

type AIDefenseResult = {
  score: number;
  riskLevel: DefenseRiskLevel;
  reasons: string[];
  moatSuggestions: string[];
};

export function RealityAIDefense({ defense }: { defense: AIDefenseResult }) {
  const defenseColor = DEFENSE_RISK_COLOR[defense.riskLevel];

  return (
    <Panel>
      <div className="flex items-center gap-2 mb-3">
        {defense.riskLevel === "low" ? (
          <ShieldCheck size={14} style={{ color: defenseColor }} />
        ) : (
          <ShieldAlert size={14} style={{ color: defenseColor }} />
        )}
        <p className="eyebrow" style={{ color: defenseColor }}>
          AI Wrapper Defense — {DEFENSE_RISK_LABEL[defense.riskLevel]}
        </p>
        <span className="ml-auto text-xs font-bold font-mono" style={{ color: defenseColor }}>
          {defense.score}/100
        </span>
      </div>
      <ProgressBar value={defense.score} color={defenseColor} />
      <div className="mt-3 space-y-1">
        {defense.reasons.map((r, i) => (
          <p key={i} className="text-xs flex gap-1.5" style={{ color: "var(--text-secondary)" }}>
            <span style={{ color: defenseColor }}>·</span>
            {r}
          </p>
        ))}
      </div>
      {defense.moatSuggestions.length > 0 && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border-default)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>
            Moat Suggestions
          </p>
          <div className="space-y-1">
            {defense.moatSuggestions.map((s, i) => (
              <p key={i} className="text-xs flex gap-1.5" style={{ color: "var(--text-tertiary)" }}>
                <span style={{ color: "var(--color-warning)" }}>→</span>
                {s}
              </p>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}
