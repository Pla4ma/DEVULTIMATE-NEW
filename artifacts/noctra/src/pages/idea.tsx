import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { ToolScene } from "@/components/ToolScene";
import { IdeaReportView } from "@/components/reports/IdeaReportView";
import { EmptyState, NoctraButton, Badge } from "@/components/Primitives";
import { callWithCrossContext } from "@/lib/ai";
import type { StructuredResult } from "@/lib/ai";
import type { InjectedContext } from "@/lib/cross-context";
import { saveReport } from "@/lib/repository";
import { generateTasksFromReport } from "@/lib/task-generator";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import { TOOL_EXAMPLES } from "@/lib/noctra-journey";
import { useToast } from "@/hooks/use-toast";
import { ScanSearch, Wand2, Loader2, RotateCcw, CheckCircle, Zap, ExternalLink, ArrowRight, AlertTriangle, CheckSquare, Rocket } from "lucide-react";

const TOOL = TOOL_BY_KEY["idea"]!;
type Phase = "idle" | "running" | "done" | "error";

export default function IdeaPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [currentStage, setCurrentStage] = useState("");
  const [result, setResult] = useState<StructuredResult | null>(null);
  const [injectedContext, setInjectedContext] = useState<InjectedContext | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const examples = TOOL_EXAMPLES.idea;

  // Cmd+Enter / Ctrl+Enter to run
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (phase === "idle" && input.trim()) {
        void run();
      }
    }
  }, [phase, input]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  async function run() {
    if (!input.trim()) return;
    setPhase("running");
    setError("");
    setResult(null);
    setSaved(false);
    setAutoSaved(false);
    setInjectedContext(null);
    setCurrentStage("Loading intelligence context…");

    try {
      const res = await callWithCrossContext("idea", input.trim(), {
        onStage: setCurrentStage,
      });
      setResult(res);
      setInjectedContext(res.injectedContext ?? null);
      setPhase("done");

      // Auto-save fire-and-forget — results show immediately, nav buttons appear after save confirms
      void autoSave(res, input.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setPhase("error");
    }
  }

  async function autoSave(res: StructuredResult, rawInput: string) {
    try {
      const report = await saveReport({
        tool: "idea",
        title: res.title || `Signal Scan — ${rawInput.slice(0, 60)}`,
        payload: { data: res.data, markdown: res.markdown, output: res.markdown },
        score: res.score ?? undefined,
        summary: res.summary,
      });
      const r = report as { id?: string } | null;
      setSavedReportId(r?.id ?? null);
      if (r?.id) {
        await generateTasksFromReport({
          id: r.id,
          tool: "idea",
          payload: { data: res.data },
          project_id: null,
        });
      }
      setSaved(true);
      setAutoSaved(true);
    } catch (e) {
      toast({ title: "Auto-save failed", description: e instanceof Error ? e.message : "Report results visible but not stored.", variant: "destructive" });
    }
  }

  function reset() {
    setPhase("idle");
    setResult(null);
    setError("");
    setSaved(false);
    setAutoSaved(false);
    setSavedReportId(null);
    setInput("");
    setCurrentStage("");
    setInjectedContext(null);
  }

  const InputPanel = (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium" style={{ color: "var(--noctra-text-muted)" }}>
            Describe your idea, product, or hypothesis
          </label>
          <span className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>⌘↵ to run</span>
        </div>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. An async stand-up tool for distributed AI engineering teams. The core insight is that engineers hate meetings but still need alignment on blockers."
          rows={8}
          disabled={phase === "running"}
          className="w-full px-3 py-2.5 rounded-lg text-sm resize-none outline-none"
          style={{
            background: "var(--noctra-surface2)",
            border: "1px solid var(--noctra-border)",
            color: "var(--noctra-text)",
          }}
        />
      </div>

      {/* Context injection indicator */}
      {injectedContext?.hasContext && injectedContext.reports.length > 0 && (
        <div className="px-3 py-2 rounded-lg" style={{ background: "rgba(61,216,255,0.06)", border: "1px solid rgba(61,216,255,0.15)" }}>
          <p className="text-xs font-medium mb-1" style={{ color: "var(--noctra-cyan)" }}>
            <Zap size={10} className="inline mr-1" />
            Cross-tool intelligence injected
          </p>
          <div className="flex flex-wrap gap-1">
            {injectedContext.reports.map((r) => (
              <Badge key={r.tool} style={{ background: "rgba(61,216,255,0.12)", color: "var(--noctra-cyan)", fontSize: "10px" }}>
                {r.label}{r.score != null ? ` ${r.score}` : ""}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Auto-save indicator */}
      {autoSaved && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <CheckCircle size={12} style={{ color: "var(--noctra-emerald)" }} />
          <p className="text-xs" style={{ color: "var(--noctra-emerald)" }}>Report saved + tasks generated automatically</p>
        </div>
      )}

      {examples.length > 0 && phase === "idle" && (
        <div>
          <p className="text-xs mb-2" style={{ color: "var(--noctra-text-muted)" }}>Examples:</p>
          <div className="space-y-1">
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => setInput(ex)}
                className="block w-full text-left text-xs px-2 py-1.5 rounded hover:bg-white/3 transition-colors"
                style={{ color: "var(--noctra-text-soft)" }}
              >
                "{ex}"
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <NoctraButton
          variant="primary"
          onClick={run}
          disabled={phase === "running" || !input.trim()}
          className="flex-1"
        >
          {phase === "running" ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
          {phase === "running" ? currentStage || "Analyzing…" : "Run Idea Checker"}
        </NoctraButton>
        {phase !== "idle" && (
          <NoctraButton variant="ghost" onClick={reset}>
            <RotateCcw size={14} />
          </NoctraButton>
        )}
      </div>
    </div>
  );

  const OutputPanel = (
    <div className="space-y-4">
      {phase === "idle" && (
        <EmptyState
          icon={<ScanSearch size={24} />}
          title="Signal awaiting input"
          body="Enter your idea above and run the Idea Checker. Press ⌘↵ to start."
        />
      )}
      {phase === "running" && (
        <div className="flex flex-col items-center justify-center h-40 gap-3">
          <Loader2 size={20} className="animate-spin" style={{ color: "var(--noctra-violet)" }} />
          <span className="text-sm" style={{ color: "var(--noctra-text-muted)" }}>
            {currentStage || "Scanning signal…"}
          </span>
        </div>
      )}
      {phase === "done" && result && (
        <div className="space-y-4">
          <IdeaReportView
            report={{
              payload: { data: result.data, markdown: result.markdown },
              score: result.score,
              tool: "idea",
              title: result.title,
              summary: result.summary,
              created_at: new Date().toISOString(),
            }}
          />
          {autoSaved && (
            <div className="space-y-2 pt-3 border-t" style={{ borderColor: "var(--noctra-border)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Next Actions</p>
              <div className="grid grid-cols-2 gap-2">
                {savedReportId && (
                  <NoctraButton variant="ghost" onClick={() => navigate(`/app/reports/${savedReportId}`)}>
                    <ExternalLink size={11} /> View Full Report
                  </NoctraButton>
                )}
                <NoctraButton variant="ghost" onClick={() => navigate("/app/mvp")}>
                  <Rocket size={11} /> Generate MVP Plan
                </NoctraButton>
                <NoctraButton variant="ghost" onClick={() => navigate("/app/reality")}>
                  <AlertTriangle size={11} /> Run Reality Compiler
                </NoctraButton>
                {savedReportId && (
                  <NoctraButton variant="ghost" onClick={() => navigate(`/app/tasks?report=${savedReportId}`)}>
                    <CheckSquare size={11} /> View Tasks
                  </NoctraButton>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <AppShell>
      <ToolScene
        icon={ScanSearch}
        label={TOOL.diegetic}
        accent={TOOL.accent}
        phase={phase}
        inputPanel={InputPanel}
        outputPanel={OutputPanel}
        errorMessage={error}
      />
    </AppShell>
  );
}
