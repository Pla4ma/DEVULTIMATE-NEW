import { CheckCircle, TrendingUp } from "lucide-react";
import { Panel, ScoreRing } from "@/components/Primitives";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import { KIND_COLOR } from "./constants";
import type { ProofSignalRow } from "./types";

const TOOL = TOOL_BY_KEY["proof"]!;

export function ProofScoreTab({ signals }: { signals: ProofSignalRow[] }) {
  const paymentIntentCount = signals.filter((s) => s.kind === "payment_intent").length;
  const interviewCount = signals.filter((s) => s.kind === "interview").length;
  const conversionCount = signals.filter((s) => s.kind === "demo_request" || s.kind === "signup").length;
  const negativeCount = signals.filter((s) => s.kind === "objection" || s.kind === "churn_risk").length;
  const diversityBonus = new Set(signals.map((s) => s.kind)).size >= 3 ? 5 : 0;

  const paymentPoints = Math.min(24, paymentIntentCount * 12);
  const interviewPoints = Math.min(20, interviewCount * 5);
  const volumePoints = Math.min(30, Math.round((signals.length / 10) * 30));
  const conversionPoints = Math.min(10, conversionCount * 3);
  const positivePoints = volumePoints + paymentPoints + interviewPoints + conversionPoints;
  const negativePoints = negativeCount * 3;

  const signalScore = signals.length === 0 ? 0 : Math.max(0, Math.min(100, Math.round(
    positivePoints - negativePoints + diversityBonus
  )));

  const kindCounts = signals.reduce((acc, s) => { acc[s.kind] = (acc[s.kind] ?? 0) + 1; return acc; }, {} as Record<string, number>);
  const sortedKinds = Object.entries(kindCounts).sort((a, b) => b[1] - a[1]);
  const strongestSignal = sortedKinds.length > 0 && sortedKinds[0] ? sortedKinds[0][0] : "none";
  const weakestArea = !paymentIntentCount ? "payment_intent (0)"
    : interviewCount < 3 ? "interviews (need 3+)"
    : signals.length < 10 ? "total volume (need 10+)"
    : "n/a — strong coverage";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Panel>
        <div className="flex flex-col items-center gap-4 py-4">
          <ScoreRing value={signalScore} size={100} stroke={8} label="Signal Score" color={TOOL.accent} />
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {signalScore >= 75 ? "Strong Evidence" : signalScore >= 40 ? "Building Evidence" : "Weak Evidence"}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
              Based on {signals.length} proof signal{signals.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </Panel>

      <Panel>
        <p className="eyebrow mb-4" style={{ color: "var(--text-tertiary)" }}>Signal Breakdown</p>
        <div className="space-y-3">
          {Object.entries(
            signals.reduce((acc, s) => { acc[s.kind] = (acc[s.kind] ?? 0) + 1; return acc; }, {} as Record<string, number>)
          ).map(([kind, count]) => (
            <div key={kind} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: KIND_COLOR[kind] ?? "var(--text-tertiary)" }} />
                <span className="text-xs capitalize" style={{ color: "var(--text-tertiary)" }}>{kind}</span>
              </div>
              <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{count}</span>
            </div>
          ))}
          {signals.length === 0 && (
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>No signals yet. Add some in the Signal Tracker.</p>
          )}
        </div>
      </Panel>

      <Panel>
        <p className="eyebrow mb-3" style={{ color: "var(--text-tertiary)" }}>Score Formula</p>
        <div className="space-y-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
          {[
            { label: "Signal volume (max 30)", points: volumePoints, max: 30 },
            { label: "Payment intent (×12 each, max 24)", points: paymentPoints, max: 24 },
            { label: "Interviews (×5 each, max 20)", points: interviewPoints, max: 20 },
            { label: "Demo requests + signups (×3, max 10)", points: conversionPoints, max: 10 },
          ].map(({ label, points, max }) => (
            <div key={label}>
              <div className="flex justify-between mb-1">
                <span>{label}</span>
                <span style={{ color: "var(--text-primary)" }}>+{points}/{max}</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: "var(--surface-2)" }}>
                <div className="h-full rounded-full" style={{ width: `${max > 0 ? (points / max) * 100 : 0}%`, background: TOOL.accent }} />
              </div>
            </div>
          ))}
          {diversityBonus > 0 && (
            <div className="flex justify-between text-xs">
              <span>Diversity bonus (3+ kinds)</span>
              <span style={{ color: "var(--color-success)" }}>+{diversityBonus}</span>
            </div>
          )}
          {negativeCount > 0 && (
            <div className="flex justify-between text-xs">
              <span style={{ color: "var(--color-danger)" }}>Objection/churn penalty</span>
              <span style={{ color: "var(--color-danger)" }}>−{negativePoints}</span>
            </div>
          )}
          <div className="flex justify-between text-xs font-bold pt-1 border-t" style={{ borderColor: "var(--border-default)" }}>
            <span style={{ color: "var(--text-primary)" }}>Total</span>
            <span style={{ color: "var(--text-primary)" }}>{signalScore}/100</span>
          </div>
        </div>
      </Panel>

      <Panel>
        <p className="eyebrow mb-3" style={{ color: "var(--text-tertiary)" }}>Signal Analysis</p>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span style={{ color: "var(--text-tertiary)" }}>Positive points</span>
            <span style={{ color: "var(--color-success)" }}>+{positivePoints}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--text-tertiary)" }}>Negative points</span>
            <span style={{ color: "var(--color-danger)" }}>−{negativePoints}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--text-tertiary)" }}>Payment bonus</span>
            <span style={{ color: "var(--accent-gold)" }}>+{paymentPoints}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--text-tertiary)" }}>Diversity bonus</span>
            <span style={{ color: "var(--color-success)" }}>+{diversityBonus}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span style={{ color: "var(--text-tertiary)" }}>Strongest signal</span>
            <span className="capitalize" style={{ color: "var(--text-primary)" }}>{strongestSignal}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--text-tertiary)" }}>Weakest area</span>
            <span style={{ color: "var(--color-warning)" }}>{weakestArea}</span>
          </div>
          <div className="pt-2 border-t" style={{ borderColor: "var(--border-default)" }}>
            <span style={{ color: "var(--text-tertiary)" }}>Recommendation</span>
            <p className="mt-1" style={{ color: signalScore >= 75 ? "var(--color-success)" : signalScore >= 40 ? "var(--color-warning)" : "var(--color-danger)" }}>
              {signalScore >= 75 ? "Strong evidence base — proceed with confidence" :
               signalScore >= 40 ? "Building evidence — run more experiments, especially for payment intent" :
               "Weak evidence — prioritize customer interviews and payment signals"}
            </p>
          </div>
        </div>
      </Panel>

      <Panel>
        <p className="eyebrow mb-3" style={{ color: "var(--text-tertiary)" }}>Next Milestones</p>
        <div className="space-y-2">
          {[
            { label: "5 customer interviews", done: interviewCount >= 5, target: 5, current: interviewCount },
            { label: "1 payment intent signal", done: paymentIntentCount >= 1, target: 1, current: paymentIntentCount },
            { label: "10 total signals", done: signals.length >= 10, target: 10, current: signals.length },
            { label: "3 different signal types", done: new Set(signals.map((s) => s.kind)).size >= 3, target: 3, current: new Set(signals.map((s) => s.kind)).size },
          ].map(({ label, done, target, current }) => (
            <div key={label} className="flex items-center gap-2 text-xs">
              {done
                ? <CheckCircle size={13} style={{ color: "var(--color-success)" }} />
                : <TrendingUp size={13} style={{ color: "var(--color-warning)" }} />
              }
              <span style={{ color: done ? "var(--color-success)" : "var(--text-tertiary)", textDecoration: done ? "line-through" : "none" }}>{label}</span>
              <span className="ml-auto" style={{ color: "var(--text-tertiary)" }}>{current}/{target}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
