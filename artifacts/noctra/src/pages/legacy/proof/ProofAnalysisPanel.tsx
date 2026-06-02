import {
  FlaskConical, Wand2, Loader2, RotateCcw, AlertTriangle,
  CheckCircle, TrendingUp, ExternalLink, ArrowRight,
} from "lucide-react";
import { Panel, EmptyState, NoctraButton, Badge, ScoreRing } from "@/components/Primitives";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import { TOOL_EXAMPLES } from "@/lib/noctra-journey";
import { ROUTES } from "@/lib/routes";
import type { Phase, ProofSignalRow } from "./types";

const TOOL = TOOL_BY_KEY["proof"]!;

interface ProofAnalysisPanelProps {
  input: string;
  setInput: (v: string) => void;
  phase: Phase;
  error: string;
  result: Awaited<ReturnType<typeof import("@/lib/ai").callStructuredAI>> | null;
  saved: boolean;
  savedReportId: string | null;
  signals: ProofSignalRow[];
  onRun: () => void;
  onReset: () => void;
  onNavigate: (path: string) => void;
}

export function ProofAnalysisPanel({
  input, setInput, phase, error, result, saved, savedReportId, signals,
  onRun, onReset, onNavigate,
}: ProofAnalysisPanelProps) {
  const d = result?.data as Record<string, unknown> | null;
  const proofScore = typeof d?.proof_score === "number" ? d.proof_score : result?.score ?? null;
  const experiments = Array.isArray(d?.experiments) ? d!.experiments as Array<Record<string, unknown>> : [];
  const objections = Array.isArray(d?.objections) ? d!.objections as Array<Record<string, unknown>> : [];
  const evidenceGaps = Array.isArray(d?.evidence_gaps) ? d!.evidence_gaps as string[] : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Panel>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>
              Describe what you're validating
            </label>
            <textarea
              value={input} onChange={(e) => setInput(e.target.value)}
              placeholder={TOOL_EXAMPLES.proof?.[0] ?? "e.g. We're validating that indie hackers will pay for automated SEO analysis. We've run 8 interviews and have 3 LOIs."}
              rows={7} disabled={phase === "running"} maxLength={4000}
              className="w-full px-3 py-2.5 rounded-lg text-sm resize-none outline-none"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
            />
            {input.length > 0 && (
              <div className="flex justify-end mt-1">
                <span className="text-[10px]" style={{ color: input.length > 3500 ? "var(--color-warning)" : "var(--text-tertiary)" }}>{input.length}/4000</span>
              </div>
            )}
          </div>
          {signals.length > 0 && (
            <div className="px-3 py-2 rounded-lg text-xs" style={{ background: "var(--signal-soft)", border: "1px solid var(--signal-soft)", color: "var(--signal)" }}>
              {signals.length} signal{signals.length !== 1 ? "s" : ""} in tracker will be included as context
            </div>
          )}
          {phase === "error" && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--color-danger-soft)", border: "1px solid var(--color-danger-soft)" }}>
              <AlertTriangle size={13} style={{ color: "var(--color-danger)", marginTop: 1 }} />
              <p className="text-xs" style={{ color: "var(--color-danger)" }}>{error}</p>
            </div>
          )}
          <div className="flex gap-2">
            <NoctraButton onClick={onRun} disabled={phase === "running" || !input.trim()} className="flex-1">
              {phase === "running" ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
              {phase === "running" ? "Analyzing…" : "Analyze Proof"}
            </NoctraButton>
            {phase === "idle" && <span className="flex items-center text-xs px-2" style={{ color: "var(--text-tertiary)" }}>⌘↵</span>}
            {phase === "done" && <NoctraButton variant="ghost" onClick={onReset}><RotateCcw size={13} /></NoctraButton>}
          </div>
        </div>
      </Panel>

      <Panel>
        {phase === "idle" && (
          <EmptyState icon={<FlaskConical size={22} />} title="No analysis yet" body="Describe your validation progress and run the Proof Engine." />
        )}
        {phase === "running" && (
          <div className="flex items-center justify-center h-40">
            <div className="text-center space-y-3">
              <Loader2 size={24} className="animate-spin mx-auto" style={{ color: TOOL.accent }} />
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Measuring signal density…</p>
            </div>
          </div>
        )}
        {phase === "done" && d && (
          <div className="space-y-4">
            {proofScore != null && (
              <div className="flex items-center gap-4">
                <ScoreRing value={proofScore} size={72} stroke={6} label="Proof Score" color={TOOL.accent} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{String(d.verdict ?? "")}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>{String(d.summary ?? "")}</p>
                </div>
              </div>
            )}

            {experiments.length > 0 && (
              <div>
                <p className="eyebrow mb-2" style={{ color: "var(--text-tertiary)" }}>Recommended Experiments</p>
                <div className="space-y-2">
                  {experiments.slice(0, 4).map((exp, i) => (
                    <div key={i} className="px-3 py-2 rounded-lg" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)" }}>
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{String(exp.title ?? "")}</p>
                        <Badge style={{ fontSize: "10px" }}>{String(exp.effort ?? "")}</Badge>
                      </div>
                      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{String(exp.method ?? "")}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {objections.length > 0 && (
              <div>
                <p className="eyebrow mb-2" style={{ color: "var(--text-tertiary)" }}>Top Objections</p>
                <div className="space-y-2">
                  {objections.slice(0, 3).map((obj, i) => (
                    <div key={i} className="px-3 py-2 rounded-lg" style={{ background: "var(--color-danger-soft)", border: "1px solid var(--color-danger-soft)" }}>
                      <p className="text-xs font-medium mb-0.5" style={{ color: "var(--color-danger)" }}>{String(obj.objection ?? "")}</p>
                      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{String(obj.rebuttal ?? "")}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {evidenceGaps.length > 0 && (
              <div>
                <p className="eyebrow mb-2" style={{ color: "var(--text-tertiary)" }}>Evidence Gaps</p>
                <ul className="space-y-1">
                  {evidenceGaps.map((gap, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--text-tertiary)" }}>
                      <AlertTriangle size={11} style={{ color: "var(--color-warning)", marginTop: 1, flexShrink: 0 }} />
                      {gap}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {saved && (
              <div className="flex gap-2 pt-1 border-t" style={{ borderColor: "var(--border-default)" }}>
                {savedReportId && (
                  <NoctraButton variant="ghost" onClick={() => onNavigate(`/app/reports/${savedReportId}`)} className="flex-1">
                    <ExternalLink size={12} /> View Full Report
                  </NoctraButton>
                )}
                <NoctraButton variant="ghost" onClick={() => onNavigate(ROUTES.swarm)} className="flex-1">
                  Next: Market Swarm <ArrowRight size={12} />
                </NoctraButton>
              </div>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}
