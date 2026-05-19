import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Terminal } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { callWithCrossContext } from "@/lib/ai";
import type { StructuredResult } from "@/lib/ai";
import type { InjectedContext } from "@/lib/cross-context";
import { saveReport, getReports } from "@/lib/repository";
import { generateTasksFromReport } from "@/lib/task-generator";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import { useToast } from "@/hooks/use-toast";
import { RealityInputPanel } from "./reality/RealityInputPanel";
import { RealityOutputPanel } from "./reality/RealityOutputPanel";
import type { Phase, CompileMode } from "./reality/types";

const TOOL = TOOL_BY_KEY["reality"]!;

export default function RealityPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [compileMode, setCompileMode] = useState<CompileMode>("full");
  const [phase, setPhase] = useState<Phase>("idle");
  const [currentStage, setCurrentStage] = useState("");
  const [result, setResult] = useState<StructuredResult | null>(null);
  const [injectedContext, setInjectedContext] = useState<InjectedContext | null>(null);
  const [error, setError] = useState("");
  const [autoSaved, setAutoSaved] = useState(false);
  const [autoSaveError, setAutoSaveError] = useState(false);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const [generatingTasks, setGeneratingTasks] = useState(false);
  const [applyingPatch, setApplyingPatch] = useState(false);
  const [patchSaved, setPatchSaved] = useState(false);
  const [latestIdea, setLatestIdea] = useState<string | null>(null);

  useEffect(() => {
    getReports("idea").then((reps) => {
      const latest = (reps as Array<{ summary?: string | null; payload?: Record<string, unknown> }>)?.[0];
      if (latest) {
        const desc = latest.summary ?? ((latest.payload as Record<string, unknown>)?.markdown as string) ?? "";
        setLatestIdea(desc ? `Based on my latest idea analysis:\n\n${desc.slice(0, 1000)}` : null);
      }
    }).catch(() => {});
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (phase === "idle" && input.trim()) void run();
      }
    },
    [phase, input],
  );

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
    setPatchSaved(false);
    setCurrentStage("Loading intelligence context…");

    const compiledInput = `[COMPILE MODE: ${compileMode}]\n\n${input.trim()}`;

    try {
      const res = await callWithCrossContext("reality", compiledInput, {
        onStage: setCurrentStage,
      });
      setResult(res);
      setInjectedContext(res.injectedContext ?? null);
      setPhase("done");
      setAutoSaveError(false);
      void autoSave(res, input.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Compilation failed");
      setPhase("error");
    }
  }

  async function autoSave(res: StructuredResult, rawInput: string) {
    try {
      const d = res.data as Record<string, unknown> | null;
      const modeLabel = compileMode.toUpperCase();
      const title =
        typeof d?.title === "string" && d.title.trim()
          ? d.title
          : `Reality Compile [${modeLabel}] — ${rawInput.slice(0, 55)}${rawInput.length > 55 ? "…" : ""}`;
      const report = await saveReport({
        tool: "reality",
        title,
        payload: { data: res.data, markdown: res.markdown },
        score: res.score ?? undefined,
        summary: res.summary,
      });
      const saved = report as { id?: string };
      setSavedReportId(saved?.id ?? null);
      setAutoSaved(true);
      if (saved?.id) {
        await generateTasksFromReport({
          id: saved.id,
          tool: "reality",
          payload: { data: res.data },
          project_id: null,
        });
      }
    } catch (e) {
      console.warn("Auto-save failed:", e);
      setAutoSaveError(true);
    }
  }

  async function handleGenerateTasks() {
    if (!result?.data || !savedReportId) return;
    setGeneratingTasks(true);
    try {
      await generateTasksFromReport({
        id: savedReportId,
        tool: "reality",
        payload: { data: result.data },
        project_id: null,
      });
    } finally {
      setGeneratingTasks(false);
    }
  }

  async function handleApplyPatch() {
    if (!result?.data) return;
    const d = result.data as Record<string, unknown>;
    const patchedIdea = typeof d.patched_idea === "string" ? d.patched_idea : "";
    const productPatch = typeof d.product_patch === "string" ? d.product_patch : "";
    if (!patchedIdea && !productPatch) {
      toast({ title: "Nothing to patch", description: "No patched_idea or product_patch found in this compilation.", variant: "destructive" });
      return;
    }

    setApplyingPatch(true);
    try {
      const snippet = input.trim().slice(0, 60);
      const title = `Patched Idea — ${snippet}${input.trim().length > 60 ? "…" : ""}`;
      const report = await saveReport({
        tool: "idea",
        title,
        payload: {
          data: {
            patched_idea: patchedIdea,
            product_patch: productPatch,
            source_reality_report_id: savedReportId,
            decisive_move: d.decisive_move ?? "",
            summary: patchedIdea,
            verdict: typeof d.verdict === "string" ? d.verdict : "",
            compile_mode: compileMode,
            score: typeof d.score === "number" ? Math.min(100, (d.score as number) + 15) : 60,
            signal_score: typeof d.score === "number" ? Math.min(100, (d.score as number) + 15) : 60,
          },
          markdown: `# ${title}\n\n## Product Patch\n${productPatch}\n\n## Patched Idea\n${patchedIdea}`,
        },
        score: typeof d.score === "number" ? Math.min(100, (d.score as number) + 15) : undefined,
        summary: patchedIdea.slice(0, 300),
        projectId: undefined,
      }) as { id?: string };
      setPatchSaved(true);
      if (report?.id) {
        toast({ title: "Patch applied", description: "Patched Idea report created. Navigating…" });
        navigate(`/app/reports/${report.id}`);
      }
    } catch (err) {
      toast({ title: "Failed to apply patch", description: err instanceof Error ? err.message : "Unexpected error.", variant: "destructive" });
      setApplyingPatch(false);
    }
  }

  function reset() {
    setPhase("idle");
    setResult(null);
    setError("");
    setAutoSaved(false);
    setAutoSaveError(false);
    setSavedReportId(null);
    setInput("");
    setPatchSaved(false);
    setApplyingPatch(false);
    setCurrentStage("");
    setInjectedContext(null);
    setGeneratingTasks(false);
  }

  const d = result?.data as Record<string, unknown> | null;
  const patchedIdea = typeof d?.patched_idea === "string" ? d.patched_idea : "";
  const productPatch = typeof d?.product_patch === "string" ? d.product_patch : "";
  const canApplyPatch = !!(patchedIdea || productPatch) && !patchSaved;

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `${TOOL.accent}15`, border: `1px solid ${TOOL.accent}30` }}
          >
            <Terminal size={16} style={{ color: TOOL.accent }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--noctra-text)" }}>
              Reality Compiler
            </h1>
            <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>
              Catch assumption errors before they become expensive mistakes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <RealityInputPanel
            input={input}
            setInput={setInput}
            compileMode={compileMode}
            setCompileMode={setCompileMode}
            phase={phase}
            currentStage={currentStage}
            injectedContext={injectedContext}
            autoSaved={autoSaved}
            autoSaveError={autoSaveError}
            savedReportId={savedReportId}
            latestIdea={latestIdea}
            canApplyPatch={canApplyPatch}
            patchedIdea={patchedIdea}
            generatingTasks={generatingTasks}
            applyingPatch={applyingPatch}
            onRun={run}
            onReset={reset}
            onApplyPatch={handleApplyPatch}
            onGenerateTasks={handleGenerateTasks}
            onNavigate={navigate}
          />
          <RealityOutputPanel
            phase={phase}
            error={error}
            result={result}
            compileMode={compileMode}
            currentStage={currentStage}
            savedReportId={savedReportId}
            onReset={reset}
            onNavigate={navigate}
          />
        </div>
      </div>
    </AppShell>
  );
}
