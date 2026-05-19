import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { FlaskConical } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { callStructuredAI } from "@/lib/ai";
import { saveReport, createProofSignal, getProofSignals, deleteProofSignal } from "@/lib/repository";
import { generateTasksFromReport } from "@/lib/task-generator";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import { useToast } from "@/hooks/use-toast";
import { ProofAnalysisPanel } from "./proof/ProofAnalysisPanel";
import { ProofSignalTracker } from "./proof/ProofSignalTracker";
import { ProofScoreTab } from "./proof/ProofScoreTab";
import type { Phase, Tab, ProofSignalRow } from "./proof/types";

const TOOL = TOOL_BY_KEY["proof"]!;

export default function ProofPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("analysis");
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<Awaited<ReturnType<typeof callStructuredAI>> | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const [signals, setSignals] = useState<ProofSignalRow[]>([]);
  const [signalsLoading, setSignalsLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [newKind, setNewKind] = useState("interview");
  const [newValue, setNewValue] = useState("");
  const [newSource, setNewSource] = useState("");
  const [addingSignal, setAddingSignal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    getProofSignals()
      .then((s) => setSignals((s as ProofSignalRow[]) ?? []))
      .catch((e) => { console.warn("Failed to load proof signals:", e); setSignals([]); })
      .finally(() => setSignalsLoading(false));
  }, []);

  async function run() {
    if (!input.trim()) return;
    setPhase("running"); setError(""); setResult(null); setSaved(false); setSavedReportId(null);
    const signalCtx = signals.map((s) =>
      `${s.kind}: ${s.label}${s.value != null ? ` (n=${s.value})` : ""}${s.source ? ` [${s.source}]` : ""}`
    ).join("; ");
    try {
      const res = await callStructuredAI("proof", input.trim(), {
        signals: signalCtx || undefined,
        signal_count: signals.length,
      });
      setResult(res); setPhase("done");
      setTab("analysis");
      void autoSave(res);
    } catch (err) { setError(err instanceof Error ? err.message : "Analysis failed"); setPhase("error"); }
  }

  async function autoSave(res: Awaited<ReturnType<typeof callStructuredAI>>) {
    try {
      const report = await saveReport({
        tool: "proof",
        title: res.title || `Proof Engine — ${input.slice(0, 60)}`,
        payload: { data: res.data, markdown: res.markdown },
        score: res.score ?? undefined,
        summary: res.summary,
      });
      const r = report as { id?: string } | null;
      setSavedReportId(r?.id ?? null);
      if (r?.id) await generateTasksFromReport({ id: r.id, tool: "proof", payload: { data: res.data }, project_id: null });
      setSaved(true);
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof Error ? err.message : "Could not auto-save report.", variant: "destructive" });
    }
  }

  async function handleAddSignal() {
    if (!newLabel.trim()) return;
    setAddingSignal(true);
    try {
      const sig = await createProofSignal({
        label: newLabel.trim(), kind: newKind,
        value: newValue ? parseInt(newValue) : undefined,
        source: newSource.trim() || undefined,
      });
      setSignals((prev) => [sig as ProofSignalRow, ...prev]);
      setNewLabel(""); setNewValue(""); setNewSource(""); setShowAddForm(false);
    } catch (err) { toast({ title: "Failed to add signal", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" }); } finally { setAddingSignal(false); }
  }

  async function handleDeleteSignal(id: string) {
    setDeletingId(id);
    try {
      await deleteProofSignal(id);
      setSignals((prev) => prev.filter((s) => s.id !== id));
    } catch (err) { toast({ title: "Failed to delete signal", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" }); } finally { setDeletingId(null); }
  }

  function reset() { setPhase("idle"); setResult(null); setError(""); setSaved(false); setSavedReportId(null); setInput(""); }

  const TABS: Array<{ id: Tab; label: string }> = [
    { id: "analysis", label: "AI Analysis" },
    { id: "signals", label: `Signal Tracker (${signals.length})` },
    { id: "score", label: "Proof Score" },
  ];

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${TOOL.accent}18`, border: `1px solid ${TOOL.accent}30` }}>
            <FlaskConical size={18} style={{ color: TOOL.accent }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--noctra-text)" }}>{TOOL.label}</h1>
            <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>Measure signal density and generate your next experiments</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded" style={{ background: `${TOOL.accent}18`, color: TOOL.accent }}>
              {signals.length} signal{signals.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--noctra-surface)" }}>
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all" style={{ background: tab === id ? "var(--noctra-surface2)" : "transparent", color: tab === id ? "var(--noctra-text)" : "var(--noctra-text-muted)", border: tab === id ? "1px solid var(--noctra-border)" : "1px solid transparent" }}>
              {label}
            </button>
          ))}
        </div>

        {tab === "analysis" && (
          <ProofAnalysisPanel
            input={input} setInput={setInput} phase={phase} error={error}
            result={result} saved={saved} savedReportId={savedReportId}
            signals={signals} onRun={run} onReset={reset} onNavigate={navigate}
          />
        )}

        {tab === "signals" && (
          <ProofSignalTracker
            signals={signals} signalsLoading={signalsLoading}
            showAddForm={showAddForm} setShowAddForm={setShowAddForm}
            newLabel={newLabel} setNewLabel={setNewLabel}
            newKind={newKind} setNewKind={setNewKind}
            newValue={newValue} setNewValue={setNewValue}
            newSource={newSource} setNewSource={setNewSource}
            addingSignal={addingSignal} deletingId={deletingId}
            onAddSignal={handleAddSignal} onDeleteSignal={handleDeleteSignal}
          />
        )}

        {tab === "score" && <ProofScoreTab signals={signals} />}
      </div>
    </AppShell>
  );
}
