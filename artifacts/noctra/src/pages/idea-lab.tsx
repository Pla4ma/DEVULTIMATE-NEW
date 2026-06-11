import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { ScoreRing } from "@/components/Primitives";
import { motion, AnimatePresence } from "framer-motion";
import { isDemoMode } from "@/lib/demo-mode";
import { callWithCrossContext } from "@/lib/ai";
import type { StructuredResult } from "@/lib/ai";
import type { InjectedContext } from "@/lib/cross-context";
import { saveReport, getReports } from "@/lib/repository";
import { generateTasksFromReport } from "@/lib/task-generator";
import { useProgression } from "@/lib/progression-context";
import { useToast } from "@/hooks/use-toast";
import { ObsidianButton } from "@/components/ObsidianButton";
import {
  Lightbulb, Terminal, Users, FlaskConical, ScanSearch, Wand2, Loader2,
  RotateCcw, CheckCircle, Zap, ArrowRight, AlertTriangle, Rocket,
  TrendingUp, Target, BarChart3, ArrowUpRight,
} from "lucide-react";

type ToolMode = "idea" | "reality" | "swarm" | "proof";
type Phase = "idle" | "running" | "done" | "error";

const MODES: Array<{ key: ToolMode; label: string; icon: typeof Lightbulb; color: string; description: string }> = [
  { key: "idea", label: "Idea Checker", icon: ScanSearch, color: "#8b5cf6", description: "Score your idea for signal strength, red flags, and ICP fit" },
  { key: "reality", label: "Reality Compiler", icon: Terminal, color: "#f97316", description: "Stress-test assumptions across feasibility and market viability" },
  { key: "swarm", label: "Market Swarm", icon: Users, color: "#8b5cf6", description: "Simulate market demand with AI-generated user personas" },
  { key: "proof", label: "Proof Engine", icon: FlaskConical, color: "#f97316", description: "Track validation evidence and find critical gaps" },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function IdeaLabPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { refreshProgression } = useProgression();

  const [mode, setMode] = useState<ToolMode>("idea");
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [currentStage, setCurrentStage] = useState("");
  const [result, setResult] = useState<StructuredResult | null>(null);
  const [injectedContext, setInjectedContext] = useState<InjectedContext | null>(null);
  const [error, setError] = useState("");
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const [autoSaved, setAutoSaved] = useState(false);

  const currentMode = MODES.find((m) => m.key === mode)!;

  useEffect(() => {
    if (!isDemoMode()) return;
    import("@/lib/repository").then(({ getReports }) => {
      getReports("idea").then((reps) => {
        const latest = (reps as Array<{ id: string; tool: string; title: string; score?: number | null; summary?: string | null; payload?: unknown }>)?.[0];
        if (!latest?.payload) return;
        const p = latest.payload as Record<string, unknown>;
        const data = (p.data ?? p) as Record<string, unknown>;
        const res = {
          score: typeof latest.score === "number" ? latest.score : undefined,
          data,
          title: latest.title,
          summary: typeof latest.summary === "string" ? latest.summary : undefined,
          markdown: typeof data.markdown === "string" ? data.markdown : undefined,
        } as StructuredResult;
        setResult(res);
        setSavedReportId(latest.id);
        setAutoSaved(true);
        setPhase("done");
      }).catch(() => {});
    });
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (phase === "idle" && input.trim()) void run();
    }
  }, [phase, input, mode]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  async function run() {
    if (!input.trim()) return;
    setPhase("running");
    setError("");
    setResult(null);
    setAutoSaved(false);
    setSavedReportId(null);
    setInjectedContext(null);
    setCurrentStage("Loading intelligence context...");

    try {
      const res = await callWithCrossContext(mode, input.trim(), { onStage: setCurrentStage });
      setResult(res);
      setInjectedContext(res.injectedContext ?? null);
      setPhase("done");
      void autoSave(res, input.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setPhase("error");
    }
  }

  async function autoSave(res: StructuredResult, rawInput: string) {
    try {
      const report = await saveReport({
        tool: mode,
        title: res.title || `${currentMode.label} — ${rawInput.slice(0, 60)}`,
        payload: { data: res.data, markdown: res.markdown, output: res.markdown },
        score: res.score ?? undefined,
        summary: res.summary,
      });
      const r = report as { id?: string } | null;
      setSavedReportId(r?.id ?? null);
      if (r?.id) {
        await generateTasksFromReport({ id: r.id, tool: mode, payload: { data: res.data }, project_id: null });
      }
      setAutoSaved(true);
      refreshProgression();
    } catch (e) {
      toast({ title: "Auto-save failed", description: e instanceof Error ? e.message : "Report results visible but not stored.", variant: "destructive" });
    }
  }

  function reset() {
    setPhase("idle");
    setResult(null);
    setError("");
    setAutoSaved(false);
    setSavedReportId(null);
    setInput("");
    setCurrentStage("");
    setInjectedContext(null);
  }

  const d = result?.data as Record<string, unknown> | null;
  const score = result?.score ?? (d?.signal_score as number) ?? (d?.reality_score as number) ?? (d?.swarm_score as number) ?? null;
  const verdict = d?.verdict as string ?? d?.go_signal as string ?? null;
  const redFlags = Array.isArray(d?.red_flags) ? d.red_flags as string[] : [];
  const nextActions = Array.isArray(d?.next_actions) ? d.next_actions as string[] : [];

  return (
    <AppShell>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <motion.div {...fadeInUp} className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ color: "#fff" }}>Idea Lab</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Validate ideas, stress-test assumptions, and simulate market demand</p>
        </motion.div>

        <motion.div {...fadeInUp} className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => { setMode(m.key); reset(); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
                style={{
                  background: active ? `${m.color}15` : "rgba(20, 18, 40, 0.5)",
                  border: `1px solid ${active ? m.color : "rgba(139, 92, 246, 0.12)"}`,
                  color: active ? m.color : "rgba(255,255,255,0.6)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <Icon size={16} />
                {m.label}
              </button>
            );
          })}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            {...fadeInUp}
            className="glass overflow-hidden"
          >
            <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "rgba(139, 92, 246, 0.12)" }}>
              <span className="text-xs font-medium tracking-[0.12em] uppercase" style={{ color: "rgba(255,255,255,0.6)" }}>Input</span>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>⌘↵ to run</span>
            </div>
            <div className="p-5 space-y-4">
              {injectedContext?.hasContext && injectedContext.reports.length > 0 && (
                <div className="px-3 py-2 rounded-lg border" style={{ background: "rgba(20, 18, 40, 0.5)", borderColor: "rgba(139, 92, 246, 0.12)", backdropFilter: "blur(12px)" }}>
                  <p className="text-xs font-medium mb-1" style={{ color: "#f97316" }}>
                    <Zap size={10} className="inline mr-1" />
                    Cross-tool intelligence injected
                  </p>
                </div>
              )}

              {autoSaved && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ background: "rgba(20, 18, 40, 0.5)", borderColor: "rgba(139, 92, 246, 0.12)", backdropFilter: "blur(12px)" }}>
                  <CheckCircle size={14} style={{ color: "var(--color-success)" }} />
                  <p className="text-xs" style={{ color: "var(--color-success)" }}>Report saved + tasks generated automatically</p>
                </div>
              )}

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={mode === "idea" ? "Describe your idea, product, or hypothesis..." : mode === "reality" ? "Describe your assumptions to stress-test..." : mode === "swarm" ? "Describe your offer or pitch for market simulation..." : "Describe what you want to validate with evidence..."}
                rows={8}
                disabled={phase === "running"}
                className="w-full px-4 py-3 rounded-lg text-sm resize-none outline-none transition-colors"
                style={{
                  background: "rgba(20, 18, 40, 0.5)",
                  border: "1px solid rgba(139, 92, 246, 0.12)",
                  color: "#fff",
                  backdropFilter: "blur(12px)",
                }}
                maxLength={4000}
              />

              <div className="flex gap-3">
                <ObsidianButton
                  variant="primary"
                  onClick={run}
                  disabled={phase === "running" || !input.trim()}
                  className="flex-1"
                >
                  {phase === "running" ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                  {phase === "running" ? currentStage || "Analyzing..." : `Run ${currentMode.label}`}
                </ObsidianButton>
                {phase !== "idle" && (
                  <ObsidianButton
                    variant="secondary"
                    size="sm"
                    onClick={reset}
                  >
                    <RotateCcw size={16} />
                  </ObsidianButton>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            {...fadeInUp}
            className="glass overflow-hidden"
          >
            <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "rgba(139, 92, 246, 0.12)" }}>
              <span className="text-xs font-medium tracking-[0.12em] uppercase" style={{ color: "rgba(255,255,255,0.6)" }}>Output</span>
              {phase === "running" && <Loader2 size={14} className="animate-spin" style={{ color: currentMode.color }} />}
            </div>
            <div className="p-5">
              <AnimatePresence mode="wait">
                {phase === "idle" && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${currentMode.color}15`, backdropFilter: "blur(12px)" }}>
                      <currentMode.icon size={28} style={{ color: currentMode.color }} />
                    </div>
                    <p className="text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>{currentMode.label} awaiting input</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{currentMode.description}</p>
                  </motion.div>
                )}

                {phase === "running" && (
                  <motion.div
                    key="running"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-16"
                  >
                    <Loader2 size={32} className="animate-spin mb-4" style={{ color: currentMode.color }} />
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>{currentStage || "Analyzing..."}</p>
                  </motion.div>
                )}

                {phase === "done" && result && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {score != null && (
                      <div className="flex items-center gap-5 p-5 rounded-xl border" style={{ background: "rgba(20, 18, 40, 0.5)", borderColor: "rgba(139, 92, 246, 0.12)", backdropFilter: "blur(12px)" }}>
                        <ScoreRing value={score} size={80} stroke={7} label={currentMode.label} color={score >= 70 ? "var(--color-success)" : score >= 40 ? "var(--color-warning)" : "var(--color-danger)"} />
                        <div className="flex-1">
                          <p className="text-xs font-medium tracking-[0.12em] uppercase mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>Signal Score</p>
                          <p className="text-3xl font-bold font-mono" style={{ color: score >= 70 ? "var(--color-success)" : score >= 40 ? "var(--color-warning)" : "var(--color-danger)" }}>
                            {score}<span className="text-sm font-normal" style={{ color: "rgba(255,255,255,0.6)" }}>/100</span>
                          </p>
                          {verdict && (
                            <span className="text-xs font-medium tracking-[0.12em] uppercase mt-2 inline-block px-3 py-1 rounded-full" style={{
                              background: verdict === "GO" ? "var(--color-success-soft)" : verdict === "NO-GO" ? "var(--color-danger-soft)" : "var(--color-warning-soft)",
                              color: verdict === "GO" ? "var(--color-success)" : verdict === "NO-GO" ? "var(--color-danger)" : "var(--color-warning)",
                            }}>
                              {verdict}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {result.markdown && (
                      <div className="noctra-prose text-sm" style={{ maxHeight: 300, overflowY: "auto" }}>
                        {result.markdown.slice(0, 1500)}{result.markdown.length > 1500 ? "..." : ""}
                      </div>
                    )}

                    {redFlags.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium tracking-[0.12em] uppercase" style={{ color: "var(--color-danger)" }}>Red Flags</p>
                        {redFlags.slice(0, 3).map((flag, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                            <AlertTriangle size={12} className="mt-0.5 shrink-0" style={{ color: "var(--color-danger)" }} />
                            {flag}
                          </div>
                        ))}
                      </div>
                    )}

                    {nextActions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium tracking-[0.12em] uppercase" style={{ color: "#f97316" }}>Next Actions</p>
                        {nextActions.slice(0, 3).map((action, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                            <ArrowRight size={12} className="mt-0.5 shrink-0" style={{ color: "#f97316" }} />
                            {action}
                          </div>
                        ))}
                      </div>
                    )}

                    {autoSaved && savedReportId && (
                      <div className="flex gap-2 pt-3 border-t" style={{ borderColor: "rgba(139, 92, 246, 0.12)" }}>
                        <ObsidianButton
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                          onClick={() => navigate(`/app/reports/${savedReportId}`)}
                        >
                          <ArrowUpRight size={12} /> View Full Report
                        </ObsidianButton>
                        <ObsidianButton
                          variant="primary"
                          size="sm"
                          className="flex-1"
                          onClick={() => { setMode("reality"); reset(); }}
                        >
                          <Terminal size={12} /> Stress-Test
                        </ObsidianButton>
                      </div>
                    )}
                  </motion.div>
                )}

                {phase === "error" && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <AlertTriangle size={32} className="mb-4" style={{ color: "var(--color-danger)" }} />
                    <p className="text-sm font-medium mb-1" style={{ color: "var(--color-danger)" }}>Analysis failed</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{error}</p>
                    <ObsidianButton
                      variant="secondary"
                      size="sm"
                      onClick={reset}
                      className="mt-4"
                    >
                      Try Again
                    </ObsidianButton>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}
