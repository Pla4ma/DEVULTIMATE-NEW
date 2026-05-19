import { Plus, Trash2, Loader2, Target, CheckCircle } from "lucide-react";
import { Panel, EmptyState, NoctraButton } from "@/components/Primitives";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import { SIGNAL_KINDS, KIND_COLOR } from "./constants";
import type { ProofSignalRow } from "./types";

interface ProofSignalTrackerProps {
  signals: ProofSignalRow[];
  signalsLoading: boolean;
  showAddForm: boolean;
  setShowAddForm: (v: boolean) => void;
  newLabel: string;
  setNewLabel: (v: string) => void;
  newKind: string;
  setNewKind: (v: string) => void;
  newValue: string;
  setNewValue: (v: string) => void;
  newSource: string;
  setNewSource: (v: string) => void;
  addingSignal: boolean;
  deletingId: string | null;
  onAddSignal: () => void;
  onDeleteSignal: (id: string) => void;
}

export function ProofSignalTracker({
  signals, signalsLoading, showAddForm, setShowAddForm,
  newLabel, setNewLabel, newKind, setNewKind,
  newValue, setNewValue, newSource, setNewSource,
  addingSignal, deletingId, onAddSignal, onDeleteSignal,
}: ProofSignalTrackerProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--noctra-text-muted)" }}>Track real evidence from customers, experiments, and markets</p>
        <NoctraButton onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={13} /> Add Signal
        </NoctraButton>
      </div>

      {showAddForm && (
        <Panel>
          <div className="space-y-3">
            <p className="text-xs font-semibold" style={{ color: "var(--noctra-text-muted)" }}>New Signal</p>
            <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Signal label (e.g. 'User paid $99', '8 interviews done')" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--noctra-text-muted)" }}>Kind</label>
                <select value={newKind} onChange={(e) => setNewKind(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }}>
                  {SIGNAL_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--noctra-text-muted)" }}>Count / Value</label>
                <input type="number" value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="e.g. 12" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }} />
              </div>
            </div>
            <input value={newSource} onChange={(e) => setNewSource(e.target.value)} placeholder="Source (optional, e.g. Twitter DM, Zoom call)" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }} />
            <div className="flex gap-2">
              <NoctraButton onClick={onAddSignal} disabled={addingSignal || !newLabel.trim()} className="flex-1">
                {addingSignal ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add Signal
              </NoctraButton>
              <NoctraButton variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</NoctraButton>
            </div>
          </div>
        </Panel>
      )}

      {signalsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={20} className="animate-spin" style={{ color: TOOL_BY_KEY["proof"]!.accent }} />
        </div>
      ) : signals.length === 0 ? (
        <EmptyState icon={<Target size={22} />} title="No signals yet" body="Add your first proof signal — interviews, sales, surveys, LOIs." />
      ) : (
        <div className="space-y-2">
          {signals.map((sig) => (
            <Panel key={sig.id}>
              <div className="flex items-center gap-3">
                <div className="px-2 py-1 rounded text-xs font-medium shrink-0" style={{ background: `${KIND_COLOR[sig.kind] ?? "var(--noctra-text-muted)"}18`, color: KIND_COLOR[sig.kind] ?? "var(--noctra-text-muted)" }}>
                  {sig.kind}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: "var(--noctra-text)" }}>{sig.label}</p>
                  {sig.source && <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>Source: {sig.source}</p>}
                </div>
                {sig.value != null && (
                  <span className="text-sm font-bold shrink-0" style={{ color: TOOL_BY_KEY["proof"]!.accent }}>n={sig.value}</span>
                )}
                <button onClick={() => onDeleteSignal(sig.id)} disabled={deletingId === sig.id} className="p-1 rounded opacity-50 hover:opacity-100">
                  {deletingId === sig.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} style={{ color: "var(--noctra-rose)" }} />}
                </button>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
