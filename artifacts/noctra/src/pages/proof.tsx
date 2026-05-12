import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { Panel, EmptyState, NoctraButton, Badge, ScoreRing } from "@/components/Primitives";
import { callStructuredAI } from "@/lib/ai";
import { saveReport, createProofSignal, getProofSignals, deleteProofSignal } from "@/lib/repository";
import { generateTasksFromReport } from "@/lib/task-generator";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import { TOOL_EXAMPLES } from "@/lib/noctra-journey";
import {
  FlaskConical, Wand2, Loader2, RotateCcw, Plus, Trash2,
  Target, AlertTriangle, CheckCircle, TrendingUp, ExternalLink, ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TOOL = TOOL_BY_KEY["proof"]!;
type Phase = "idle" | "running" | "done" | "error";
type Tab = "analysis" | "signals" | "score";


type ProofSignalRow = {
  id: string; label: string; kind: string;
  value?: number | null; source?: string | null; evidence?: string | null;
  created_at?: string;
};

const SIGNAL_KINDS = [
  "interview", "waitlist", "signup", "pricing_click", "payment_intent",
  "dm_reply", "demo_request", "objection", "churn_risk", "manual",
];

const KIND_COLOR: Record<string, string> = {
  interview: "var(--noctra-violet)",
  waitlist: "var(--noctra-amber)",
  signup: "var(--noctra-cyan)",
  pricing_click: "var(--noctra-gold)",
  payment_intent: "var(--noctra-emerald)",
  dm_reply: "var(--noctra-magenta)",
  demo_request: "var(--noctra-cyan)",
  objection: "var(--noctra-rose)",
  churn_risk: "var(--noctra-rose)",
  manual: "var(--noctra-text-muted)",
};

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
      .catch(() => setSignals([]))
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
        title: res.title || `Proof Reactor — ${input.slice(0, 60)}`,
        payload: { data: res.data, markdown: res.markdown },
        score: res.score ?? undefined,
        summary: res.summary,
      });
      const r = report as { id?: string } | null;
      setSavedReportId(r?.id ?? null);
      if (r?.id) await generateTasksFromReport({ id: r.id, tool: "proof", payload: { data: res.data }, project_id: null });
      setSaved(true);
    } catch {
      // silent
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

  const d = result?.data as Record<string, unknown> | null;
  const proofScore = typeof d?.proof_score === "number" ? d.proof_score : result?.score ?? null;
  const experiments = Array.isArray(d?.experiments) ? d!.experiments as Array<Record<string, unknown>> : [];
  const objections = Array.isArray(d?.objections) ? d!.objections as Array<Record<string, unknown>> : [];
  const evidenceGaps = Array.isArray(d?.evidence_gaps) ? d!.evidence_gaps as string[] : [];

  const paymentIntentCount = signals.filter((s) => s.kind === "payment_intent").length;
  const interviewCount = signals.filter((s) => s.kind === "interview").length;
  const conversionCount = signals.filter((s) => s.kind === "demo_request" || s.kind === "signup").length;
  const negativeCount = signals.filter((s) => s.kind === "objection" || s.kind === "churn_risk").length;
  const diversityBonus = new Set(signals.map((s) => s.kind)).size >= 3 ? 5 : 0;
  const signalScore = signals.length === 0 ? 0 : Math.max(0, Math.min(100, Math.round(
    Math.min(30, (signals.length / 10) * 30) +
    Math.min(24, paymentIntentCount * 12) +
    Math.min(20, interviewCount * 5) +
    Math.min(10, conversionCount * 3) -
    negativeCount * 3 +
    diversityBonus
  )));

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${TOOL.accent}18`, border: `1px solid ${TOOL.accent}30` }}>
            <FlaskConical size={18} style={{ color: TOOL.accent }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--noctra-text)" }}>{TOOL.label}</h1>
            <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>Measure signal density and generate your next experiments</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge style={{ background: `${TOOL.accent}18`, color: TOOL.accent }}>
              {signals.length} signal{signals.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--noctra-surface)" }}>
          {([
            { id: "analysis" as Tab, label: "AI Analysis" },
            { id: "signals" as Tab, label: `Signal Tracker (${signals.length})` },
            { id: "score" as Tab, label: "Proof Score" },
          ]).map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all" style={{ background: tab === id ? "var(--noctra-surface2)" : "transparent", color: tab === id ? "var(--noctra-text)" : "var(--noctra-text-muted)", border: tab === id ? "1px solid var(--noctra-border)" : "1px solid transparent" }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── AI Analysis Tab ── */}
        {tab === "analysis" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Input */}
            <Panel>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-2" style={{ color: "var(--noctra-text-muted)" }}>
                    Describe what you're validating
                  </label>
                  <textarea
                    value={input} onChange={(e) => setInput(e.target.value)}
                    placeholder={TOOL_EXAMPLES.proof?.[0] ?? "e.g. We're validating that indie hackers will pay for automated SEO analysis. We've run 8 interviews and have 3 LOIs."}
                    rows={7} disabled={phase === "running"}
                    className="w-full px-3 py-2.5 rounded-lg text-sm resize-none outline-none"
                    style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }}
                  />
                </div>
                {signals.length > 0 && (
                  <div className="px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(61,216,255,0.06)", border: "1px solid rgba(61,216,255,0.15)", color: "var(--noctra-cyan)" }}>
                    {signals.length} signal{signals.length !== 1 ? "s" : ""} in tracker will be included as context
                  </div>
                )}
                {phase === "error" && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.2)" }}>
                    <AlertTriangle size={13} style={{ color: "var(--noctra-rose)", marginTop: 1 }} />
                    <p className="text-xs" style={{ color: "var(--noctra-rose)" }}>{error}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <NoctraButton onClick={run} disabled={phase === "running" || !input.trim()} className="flex-1">
                    {phase === "running" ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
                    {phase === "running" ? "Analyzing…" : "Analyze Proof"}
                  </NoctraButton>
                  {phase === "done" && <NoctraButton variant="ghost" onClick={reset}><RotateCcw size={13} /></NoctraButton>}
                </div>
              </div>
            </Panel>

            {/* Output */}
            <Panel>
              {phase === "idle" && (
                <EmptyState icon={<FlaskConical size={22} />} title="No analysis yet" body="Describe your validation progress and run the proof reactor." />
              )}
              {phase === "running" && (
                <div className="flex items-center justify-center h-40">
                  <div className="text-center space-y-3">
                    <Loader2 size={24} className="animate-spin mx-auto" style={{ color: TOOL.accent }} />
                    <p className="text-sm" style={{ color: "var(--noctra-text-muted)" }}>Measuring signal density…</p>
                  </div>
                </div>
              )}
              {phase === "done" && d && (
                <div className="space-y-4">
                  {proofScore != null && (
                    <div className="flex items-center gap-4">
                      <ScoreRing value={proofScore} size={72} stroke={6} label="Proof Score" color={TOOL.accent} />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--noctra-text)" }}>{String(d.verdict ?? "")}</p>
                        <p className="text-xs mt-1" style={{ color: "var(--noctra-text-muted)" }}>{String(d.summary ?? "")}</p>
                      </div>
                    </div>
                  )}

                  {experiments.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-text-muted)" }}>Recommended Experiments</p>
                      <div className="space-y-2">
                        {experiments.slice(0, 4).map((exp, i) => (
                          <div key={i} className="px-3 py-2 rounded-lg" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                            <div className="flex items-center justify-between mb-0.5">
                              <p className="text-xs font-medium" style={{ color: "var(--noctra-text)" }}>{String(exp.title ?? "")}</p>
                              <Badge style={{ fontSize: "10px" }}>{String(exp.effort ?? "")}</Badge>
                            </div>
                            <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{String(exp.method ?? "")}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {objections.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-text-muted)" }}>Top Objections</p>
                      <div className="space-y-2">
                        {objections.slice(0, 3).map((obj, i) => (
                          <div key={i} className="px-3 py-2 rounded-lg" style={{ background: "rgba(244,63,94,0.05)", border: "1px solid rgba(244,63,94,0.15)" }}>
                            <p className="text-xs font-medium mb-0.5" style={{ color: "var(--noctra-rose)" }}>{String(obj.objection ?? "")}</p>
                            <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{String(obj.rebuttal ?? "")}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {evidenceGaps.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-text-muted)" }}>Evidence Gaps</p>
                      <ul className="space-y-1">
                        {evidenceGaps.map((gap, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--noctra-text-muted)" }}>
                            <AlertTriangle size={11} style={{ color: "var(--noctra-amber)", marginTop: 1, flexShrink: 0 }} />
                            {gap}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {saved && (
                    <div className="flex gap-2 pt-1 border-t" style={{ borderColor: "var(--noctra-border)" }}>
                      {savedReportId && (
                        <NoctraButton variant="ghost" onClick={() => navigate(`/app/reports/${savedReportId}`)} className="flex-1">
                          <ExternalLink size={12} /> View Full Report
                        </NoctraButton>
                      )}
                      <NoctraButton variant="ghost" onClick={() => navigate("/app/swarm")} className="flex-1">
                        Next: Swarm Field <ArrowRight size={12} />
                      </NoctraButton>
                    </div>
                  )}
                </div>
              )}
            </Panel>
          </div>
        )}

        {/* ── Signal Tracker Tab ── */}
        {tab === "signals" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: "var(--noctra-text-muted)" }}>Track real evidence from customers, experiments, and markets</p>
              <NoctraButton onClick={() => setShowAddForm((v) => !v)}>
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
                    <NoctraButton onClick={handleAddSignal} disabled={addingSignal || !newLabel.trim()} className="flex-1">
                      {addingSignal ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add Signal
                    </NoctraButton>
                    <NoctraButton variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</NoctraButton>
                  </div>
                </div>
              </Panel>
            )}

            {signalsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin" style={{ color: TOOL.accent }} />
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
                        <span className="text-sm font-bold shrink-0" style={{ color: TOOL.accent }}>n={sig.value}</span>
                      )}
                      <button onClick={() => handleDeleteSignal(sig.id)} disabled={deletingId === sig.id} className="p-1 rounded opacity-50 hover:opacity-100">
                        {deletingId === sig.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} style={{ color: "var(--noctra-rose)" }} />}
                      </button>
                    </div>
                  </Panel>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Proof Score Tab ── */}
        {tab === "score" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Panel>
              <div className="flex flex-col items-center gap-4 py-4">
                <ScoreRing value={signalScore} size={100} stroke={8} label="Signal Score" color={TOOL.accent} />
                <div className="text-center">
                  <p className="text-sm font-semibold" style={{ color: "var(--noctra-text)" }}>
                    {signalScore >= 75 ? "Strong Evidence" : signalScore >= 40 ? "Building Evidence" : "Weak Evidence"}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--noctra-text-muted)" }}>
                    Based on {signals.length} proof signal{signals.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </Panel>

            <Panel>
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--noctra-text-muted)" }}>Signal Breakdown</p>
              <div className="space-y-3">
                {Object.entries(
                  signals.reduce((acc, s) => { acc[s.kind] = (acc[s.kind] ?? 0) + 1; return acc; }, {} as Record<string, number>)
                ).map(([kind, count]) => (
                  <div key={kind} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: KIND_COLOR[kind] ?? "var(--noctra-text-muted)" }} />
                      <span className="text-xs capitalize" style={{ color: "var(--noctra-text-muted)" }}>{kind}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: "var(--noctra-text)" }}>{count}</span>
                  </div>
                ))}
                {signals.length === 0 && (
                  <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>No signals yet. Add some in the Signal Tracker.</p>
                )}
              </div>
            </Panel>

            <Panel>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--noctra-text-muted)" }}>Score Formula</p>
              <div className="space-y-2 text-xs" style={{ color: "var(--noctra-text-muted)" }}>
                {[
                  { label: "Signal volume (×3/signal, max 30)", points: Math.min(30, Math.round((signals.length / 10) * 30)), max: 30 },
                  { label: "Payment intent (×12 each, max 24)", points: Math.min(24, paymentIntentCount * 12), max: 24 },
                  { label: "Interviews (×5 each, max 20)", points: Math.min(20, interviewCount * 5), max: 20 },
                  { label: "Demo requests + signups (×3, max 10)", points: Math.min(10, conversionCount * 3), max: 10 },
                  { label: "Diversity bonus (3+ kinds)", points: diversityBonus, max: 5 },
                ].map(({ label, points, max }) => (
                  <div key={label}>
                    <div className="flex justify-between mb-1">
                      <span>{label}</span>
                      <span style={{ color: "var(--noctra-text)" }}>{points}/{max}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "var(--noctra-surface2)" }}>
                      <div className="h-full rounded-full" style={{ width: `${max > 0 ? (points / max) * 100 : 0}%`, background: TOOL.accent }} />
                    </div>
                  </div>
                ))}
                {negativeCount > 0 && (
                  <p className="text-xs pt-1" style={{ color: "var(--noctra-rose)" }}>
                    −{negativeCount * 3} pts: {negativeCount} objection / churn-risk signal{negativeCount !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </Panel>

            <Panel>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--noctra-text-muted)" }}>Next Milestones</p>
              <div className="space-y-2">
                {[
                  { label: "5 customer interviews", done: interviewCount >= 5, target: 5, current: interviewCount },
                  { label: "1 payment intent signal", done: paymentIntentCount >= 1, target: 1, current: paymentIntentCount },
                  { label: "10 total signals", done: signals.length >= 10, target: 10, current: signals.length },
                  { label: "3 different signal types", done: new Set(signals.map((s) => s.kind)).size >= 3, target: 3, current: new Set(signals.map((s) => s.kind)).size },
                ].map(({ label, done, target, current }) => (
                  <div key={label} className="flex items-center gap-2 text-xs">
                    {done
                      ? <CheckCircle size={13} style={{ color: "var(--noctra-emerald)" }} />
                      : <TrendingUp size={13} style={{ color: "var(--noctra-amber)" }} />
                    }
                    <span style={{ color: done ? "var(--noctra-emerald)" : "var(--noctra-text-muted)", textDecoration: done ? "line-through" : "none" }}>{label}</span>
                    <span className="ml-auto" style={{ color: "var(--noctra-text-muted)" }}>{current}/{target}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        )}
      </div>
    </AppShell>
  );
}
