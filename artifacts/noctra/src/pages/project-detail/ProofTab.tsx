import { Panel, Badge, EmptyState, NoctraButton } from "@/components/Primitives";
import { Plus, X, Loader2, FlaskConical, ArrowRight } from "lucide-react";
import type { ProofSignal } from "./types";
import { ROUTES } from "@/lib/routes";

interface ProofTabProps {
  proofSignals: ProofSignal[];
  addingSignal: boolean;
  signalLabel: string;
  signalKind: string;
  signalSource: string;
  signalEvidence: string;
  savingSignal: boolean;
  onToggleAddingSignal: () => void;
  onSignalLabelChange: (val: string) => void;
  onSignalKindChange: (val: string) => void;
  onSignalSourceChange: (val: string) => void;
  onSignalEvidenceChange: (val: string) => void;
  onAddSignal: () => void;
  onCancelAddSignal: () => void;
  navigate: (url: string) => void;
}

export function ProofTab({ proofSignals, addingSignal, signalLabel, signalKind, signalSource, signalEvidence, savingSignal, onToggleAddingSignal, onSignalLabelChange, onSignalKindChange, onSignalSourceChange, onSignalEvidenceChange, onAddSignal, onCancelAddSignal, navigate }: ProofTabProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Proof Signals <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>({proofSignals.length})</span></p>
        <NoctraButton variant="ghost" onClick={onToggleAddingSignal}><Plus size={13} /> Add Signal</NoctraButton>
      </div>
      {addingSignal ? (
        <Panel className="glass">
          <p className="text-xs font-semibold mb-3" style={{ color: "var(--color-success)" }}>New Proof Signal</p>
          <div className="space-y-2">
            <input value={signalLabel} onChange={(e) => onSignalLabelChange(e.target.value)} placeholder="What did you validate?" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "rgba(20, 18, 40, 0.5)", border: "1px solid rgba(139, 92, 246, 0.12)", color: "var(--text-primary)" }} />
            <div className="flex gap-2">
              {["qualitative", "quantitative", "behavioral"].map((k) => (
                <button key={k} onClick={() => onSignalKindChange(k)} className="px-3 py-1 rounded-full text-xs capitalize" style={{ background: signalKind === k ? "var(--color-success-soft)" : "rgba(20, 18, 40, 0.5)", border: `1px solid ${signalKind === k ? "var(--color-success)" : "rgba(139, 92, 246, 0.12)"}`, color: signalKind === k ? "var(--color-success)" : "var(--text-tertiary)" }}>{k}</button>
              ))}
            </div>
            <input value={signalSource} onChange={(e) => onSignalSourceChange(e.target.value)} placeholder="Source (optional)" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "rgba(20, 18, 40, 0.5)", border: "1px solid rgba(139, 92, 246, 0.12)", color: "var(--text-primary)" }} />
            <textarea value={signalEvidence} onChange={(e) => onSignalEvidenceChange(e.target.value)} placeholder="Evidence / notes (optional)" rows={2} className="w-full px-3 py-2 rounded-lg text-sm resize-none outline-none" style={{ background: "rgba(20, 18, 40, 0.5)", border: "1px solid rgba(139, 92, 246, 0.12)", color: "var(--text-primary)" }} />
            <div className="flex gap-2">
              <NoctraButton onClick={onAddSignal} disabled={savingSignal || !signalLabel.trim()}>{savingSignal ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Save</NoctraButton>
              <NoctraButton variant="ghost" onClick={onCancelAddSignal}><X size={12} /> Cancel</NoctraButton>
            </div>
          </div>
        </Panel>
      ) : null}
      {proofSignals.length === 0 ? (
        <EmptyState icon={<FlaskConical size={22} />} title="No proof signals yet" body="Add validation evidence — user interviews, signups, conversion data, or experiments." />
      ) : (
        <div className="space-y-2">
          {proofSignals.map((s) => (
            <Panel key={s.id} className="glass">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--color-success-soft)", border: "1px solid var(--color-success-soft)" }}>
                  <FlaskConical size={12} style={{ color: "var(--color-success)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{s.label}</p>
                    <Badge style={{ fontSize: "10px", textTransform: "capitalize" }}>{s.kind}</Badge>
                  </div>
                  {s.source ? <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>Source: {s.source}</p> : null}
                  {s.evidence ? <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{s.evidence}</p> : null}
                  <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>{new Date(s.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
      <NoctraButton variant="ghost" onClick={() => navigate(ROUTES.proof)}><FlaskConical size={13} /> Run Proof Engine <ArrowRight size={11} /></NoctraButton>
    </div>
  );
}
