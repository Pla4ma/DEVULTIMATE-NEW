import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { EmptyState, NoctraButton, Panel, Badge } from "@/components/Primitives";
import { callWithCrossContext } from "@/lib/ai";
import type { StructuredResult } from "@/lib/ai";
import type { InjectedContext } from "@/lib/cross-context";
import { saveReport } from "@/lib/repository";
import { generateTasksFromReport } from "@/lib/task-generator";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import { TOOL_EXAMPLES } from "@/lib/noctra-journey";
import {
  Loader2, RotateCcw, CheckCircle, Wrench,
  ArrowRight, Zap, Terminal, XCircle, AlertCircle, ChevronRight,
  CheckSquare, Cpu, Play,
} from "lucide-react";

const TOOL = TOOL_BY_KEY["reality"]!;

type Phase = "idle" | "running" | "done" | "error";
type CompileMode = "idea" | "mvp" | "retention" | "monetization" | "ai-wrapper" | "launch" | "full";

const COMPILE_MODES: Array<{ key: CompileMode; label: string; desc: string }> = [
  { key: "full", label: "Full", desc: "All-spectrum compilation" },
  { key: "idea", label: "Idea", desc: "Market, timing, founder-fit" },
  { key: "mvp", label: "MVP", desc: "Scope, shippability, timeline" },
  { key: "retention", label: "Retention", desc: "Why users come back" },
  { key: "monetization", label: "Monetization", desc: "Will anyone pay?" },
  { key: "ai-wrapper", label: "AI Wrapper", desc: "ChatGPT replacement risk" },
  { key: "launch", label: "Launch", desc: "Channels, Day-1 traction" },
];

type CompilerError = {
  code: string;
  severity: string;
  message: string;
  why_it_matters?: string;
  fix?: string;
  blocks_build?: boolean;
};

const SEV_COLOR: Record<string, string> = {
  critical: "var(--noctra-rose)",
  high: "var(--noctra-rose)",
  medium: "var(--noctra-amber)",
  low: "var(--noctra-emerald)",
};

const STATUS_CONFIG = {
  PASSED: { color: "var(--noctra-emerald)", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.3)", icon: CheckCircle, label: "COMPILE PASSED" },
  WARNING: { color: "var(--noctra-amber)", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", icon: AlertCircle, label: "COMPILE WARNING" },
  FAILED: { color: "var(--noctra-rose)", bg: "rgba(244,63,94,0.1)", border: "rgba(244,63,94,0.3)", icon: XCircle, label: "COMPILE FAILED" },
};

export default function RealityPage() {
  const [, navigate] = useLocation();
  const [input, setInput] = useState("");
  const [compileMode, setCompileMode] = useState<CompileMode>("full");
  const [phase, setPhase] = useState<Phase>("idle");
  const [currentStage, setCurrentStage] = useState("");
  const [result, setResult] = useState<StructuredResult | null>(null);
  const [injectedContext, setInjectedContext] = useState<InjectedContext | null>(null);
  const [error, setError] = useState("");
  const [autoSaved, setAutoSaved] = useState(false);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const [generatingTasks, setGeneratingTasks] = useState(false);
  const [applyingPatch, setApplyingPatch] = useState(false);
  const [patchSaved, setPatchSaved] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (phase === "idle" && input.trim()) void run();
      }
    },
    [phase, input], // eslint-disable-line react-hooks/exhaustive-deps
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
    } catch {
      // silent — user still sees result
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
    if (!patchedIdea && !productPatch) return;

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
      }) as { id?: string };
      setPatchSaved(true);
      if (report?.id) {
        navigate(`/app/reports/${report.id}`);
      }
    } catch {
      setApplyingPatch(false);
    }
  }

  function reset() {
    setPhase("idle");
    setResult(null);
    setError("");
    setAutoSaved(false);
    setSavedReportId(null);
    setInput("");
    setPatchSaved(false);
    setApplyingPatch(false);
    setCurrentStage("");
    setInjectedContext(null);
    setGeneratingTasks(false);
  }

  const d = result?.data as Record<string, unknown> | null;
  const compileStatus =
    (d?.compile_status as string | undefined) ??
    (d?.go_signal === "GO" ? "PASSED" : d?.go_signal === "NO-GO" ? "FAILED" : "WARNING");
  const statusCfg =
    STATUS_CONFIG[compileStatus as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.WARNING;
  const StatusIcon = statusCfg.icon;
  const errors: CompilerError[] = Array.isArray(d?.errors) ? (d!.errors as CompilerError[]) : [];
  const warnings: string[] = Array.isArray(d?.warnings) ? (d!.warnings as string[]) : [];
  const productPatch = typeof d?.product_patch === "string" ? d.product_patch : "";
  const patchedIdea = typeof d?.patched_idea === "string" ? d.patched_idea : "";
  const decisiveMove = typeof d?.decisive_move === "string" ? d.decisive_move : "";
  const blockingErrors = errors.filter((e) => e.blocks_build);
  const nonBlockingErrors = errors.filter((e) => !e.blocks_build);
  const score =
    typeof d?.score === "number"
      ? d.score
      : typeof d?.reality_score === "number"
        ? d.reality_score
        : null;
  const canApplyPatch = (patchedIdea || productPatch) && !patchSaved;

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        {/* Header */}
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
          {/* ─── Input Panel ─── */}
          <div className="space-y-4">
            {/* Compile Mode selector */}
            <Panel>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: "var(--noctra-text-muted)" }}
              >
                Compile Mode
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {COMPILE_MODES.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setCompileMode(m.key)}
                    className="flex flex-col items-start px-2.5 py-2 rounded-lg text-left transition-all"
                    style={{
                      background:
                        compileMode === m.key ? `${TOOL.accent}15` : "var(--noctra-surface2)",
                      border: `1px solid ${compileMode === m.key ? TOOL.accent : "var(--noctra-border)"}`,
                    }}
                  >
                    <span
                      className="text-xs font-semibold"
                      style={{
                        color:
                          compileMode === m.key ? TOOL.accent : "var(--noctra-text)",
                      }}
                    >
                      {m.label}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--noctra-text-muted)" }}>
                      {m.desc}
                    </span>
                  </button>
                ))}
              </div>
            </Panel>

            {/* Input textarea */}
            <Panel>
              <div className="flex items-center justify-between mb-2">
                <label
                  className="text-xs font-medium"
                  style={{ color: "var(--noctra-text-muted)" }}
                >
                  Describe your product, assumptions, and constraints
                </label>
                <span
                  className="text-xs font-mono"
                  style={{ color: "var(--noctra-text-muted)" }}
                >
                  ⌘↵
                </span>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  TOOL_EXAMPLES.reality?.[0] ??
                  "e.g. B2B SaaS for restaurant chains. Core assumption: chains will pay $500/mo for automated inventory. No current validation."
                }
                rows={9}
                disabled={phase === "running"}
                className="w-full px-3 py-2.5 rounded-lg text-sm resize-none outline-none font-mono"
                style={{
                  background: "var(--noctra-surface2)",
                  border: "1px solid var(--noctra-border)",
                  color: "var(--noctra-text)",
                }}
              />

              {/* Context injection indicator */}
              {injectedContext?.hasContext && injectedContext.reports.length > 0 && (
                <div
                  className="mt-2 px-3 py-2 rounded-lg"
                  style={{
                    background: "rgba(245,158,11,0.06)",
                    border: "1px solid rgba(245,158,11,0.15)",
                  }}
                >
                  <p
                    className="text-xs font-medium mb-1"
                    style={{ color: "var(--noctra-amber)" }}
                  >
                    <Zap size={10} className="inline mr-1" />
                    Intelligence injected
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {injectedContext.reports.map((r) => (
                      <Badge
                        key={r.tool}
                        style={{
                          background: "rgba(245,158,11,0.12)",
                          color: "var(--noctra-amber)",
                          fontSize: "10px",
                        }}
                      >
                        {r.label}
                        {r.score != null ? ` ${r.score}` : ""}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {autoSaved && (
                <div
                  className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{
                    background: "rgba(16,185,129,0.06)",
                    border: "1px solid rgba(16,185,129,0.2)",
                  }}
                >
                  <CheckCircle size={12} style={{ color: "var(--noctra-emerald)" }} />
                  <p className="text-xs" style={{ color: "var(--noctra-emerald)" }}>
                    Report saved + tasks generated
                  </p>
                  {savedReportId && (
                    <button
                      onClick={() => navigate(`/app/reports/${savedReportId}`)}
                      className="ml-auto text-xs hover:opacity-80"
                      style={{ color: "var(--noctra-cyan)" }}
                    >
                      View <ArrowRight size={10} className="inline" />
                    </button>
                  )}
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <NoctraButton
                  onClick={run}
                  disabled={phase === "running" || !input.trim()}
                  className="flex-1"
                >
                  {phase === "running" ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Play size={13} />
                  )}
                  {phase === "running"
                    ? currentStage || "Compiling…"
                    : `Run Compiler [${compileMode.toUpperCase()}]`}
                </NoctraButton>
                {phase === "done" && (
                  <NoctraButton variant="ghost" onClick={reset}>
                    <RotateCcw size={13} />
                  </NoctraButton>
                )}
              </div>
            </Panel>

            {/* Apply Patch card */}
            {phase === "done" && canApplyPatch && (
              <Panel
                style={{
                  border: "1px solid rgba(245,158,11,0.3)",
                  background: "rgba(245,158,11,0.04)",
                }}
              >
                <div className="flex items-start gap-2 mb-3">
                  <Wrench
                    size={14}
                    style={{ color: "var(--noctra-amber)", flexShrink: 0, marginTop: 1 }}
                  />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--noctra-amber)" }}>
                      Apply Patch
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>
                      Creates a new Idea report with the patched concept. Your original Reality
                      report is preserved.
                    </p>
                  </div>
                </div>
                {patchedIdea && (
                  <p
                    className="text-xs mb-3 px-3 py-2 rounded-lg"
                    style={{
                      background: "var(--noctra-surface2)",
                      border: "1px solid var(--noctra-border)",
                      color: "var(--noctra-text-soft)",
                    }}
                  >
                    {patchedIdea.slice(0, 200)}
                    {patchedIdea.length > 200 ? "…" : ""}
                  </p>
                )}
                <NoctraButton
                  onClick={handleApplyPatch}
                  disabled={applyingPatch}
                  className="w-full"
                  style={{ background: "var(--noctra-amber)", color: "#000" }}
                >
                  {applyingPatch ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Wrench size={12} />
                  )}
                  {applyingPatch
                    ? "Creating patched report…"
                    : "Apply Patch → Create Idea Report"}
                </NoctraButton>
              </Panel>
            )}

            {/* Generate tasks button */}
            {phase === "done" && savedReportId && (
              <NoctraButton
                variant="ghost"
                onClick={handleGenerateTasks}
                disabled={generatingTasks}
                className="w-full"
              >
                {generatingTasks ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <CheckSquare size={12} />
                )}
                {generatingTasks ? "Generating tasks…" : "Generate Tasks from Errors"}
              </NoctraButton>
            )}
          </div>

          {/* ─── Output Panel ─── */}
          <div>
            {phase === "idle" ? (
              <EmptyState
                icon={<Terminal size={22} />}
                title="Awaiting input"
                body="Describe your product or assumptions. Select a compile mode and press ⌘↵ to run."
              />
            ) : phase === "running" ? (
              <Panel>
                <div className="flex flex-col items-center justify-center h-52 gap-4">
                  <div className="flex items-center gap-3">
                    <Cpu
                      size={20}
                      className="animate-pulse"
                      style={{ color: TOOL.accent }}
                    />
                    <div className="text-left">
                      <p
                        className="text-xs font-mono font-semibold"
                        style={{ color: TOOL.accent }}
                      >
                        compiling [{compileMode}]…
                      </p>
                      <p
                        className="text-xs font-mono mt-0.5"
                        style={{ color: "var(--noctra-text-muted)" }}
                      >
                        {currentStage || "Analyzing assumptions…"}
                      </p>
                    </div>
                  </div>
                  <div
                    className="w-full max-w-xs h-1 rounded-full overflow-hidden"
                    style={{ background: "var(--noctra-surface2)" }}
                  >
                    <div
                      className="h-full rounded-full animate-pulse"
                      style={{ background: TOOL.accent, width: "60%" }}
                    />
                  </div>
                </div>
              </Panel>
            ) : phase === "error" ? (
              <Panel
                style={{
                  border: "1px solid rgba(244,63,94,0.3)",
                  background: "rgba(244,63,94,0.04)",
                }}
              >
                <div className="flex items-start gap-3">
                  <XCircle
                    size={16}
                    style={{ color: "var(--noctra-rose)", flexShrink: 0, marginTop: 1 }}
                  />
                  <div>
                    <p
                      className="text-sm font-semibold mb-1"
                      style={{ color: "var(--noctra-rose)" }}
                    >
                      Compilation error
                    </p>
                    <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>
                      {error}
                    </p>
                    <button
                      onClick={reset}
                      className="flex items-center gap-1.5 text-xs mt-3 hover:opacity-80"
                      style={{ color: "var(--noctra-rose)" }}
                    >
                      <RotateCcw size={11} /> Try again
                    </button>
                  </div>
                </div>
              </Panel>
            ) : phase === "done" && result ? (
              <div className="space-y-3">
                {/* Compile Status Banner */}
                <div
                  className="px-4 py-3 rounded-xl flex items-center gap-3"
                  style={{
                    background: statusCfg.bg,
                    border: `1px solid ${statusCfg.border}`,
                  }}
                >
                  <StatusIcon
                    size={18}
                    style={{ color: statusCfg.color, flexShrink: 0 }}
                  />
                  <div className="flex-1">
                    <p
                      className="text-sm font-bold font-mono"
                      style={{ color: statusCfg.color }}
                    >
                      {statusCfg.label}
                    </p>
                    {d?.verdict ? (
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "var(--noctra-text-soft)" }}
                      >
                        {d.verdict as string}
                      </p>
                    ) : null}
                  </div>
                  {score != null && (
                    <div className="text-right shrink-0">
                      <p
                        className="text-2xl font-bold font-mono leading-none"
                        style={{ color: statusCfg.color }}
                      >
                        {score}
                      </p>
                      <p className="text-[10px]" style={{ color: "var(--noctra-text-muted)" }}>
                        / 100
                      </p>
                    </div>
                  )}
                </div>

                {/* Summary */}
                {d?.summary ? (
                  <Panel>
                    <p className="text-xs" style={{ color: "var(--noctra-text-soft)" }}>
                      {d.summary as string}
                    </p>
                  </Panel>
                ) : null}

                {/* Blocking Errors */}
                {blockingErrors.length > 0 && (
                  <div className="space-y-2">
                    <p
                      className="text-xs font-semibold uppercase tracking-wider px-1 flex items-center gap-1.5"
                      style={{ color: "var(--noctra-rose)" }}
                    >
                      <XCircle size={11} />
                      {blockingErrors.length} Blocking Error
                      {blockingErrors.length !== 1 ? "s" : ""}
                    </p>
                    {blockingErrors.map((err, i) => (
                      <div
                        key={i}
                        className="rounded-xl overflow-hidden"
                        style={{ border: "1px solid rgba(244,63,94,0.3)" }}
                      >
                        <div
                          className="px-3 py-2 flex items-center gap-2"
                          style={{ background: "rgba(244,63,94,0.1)" }}
                        >
                          <span
                            className="text-xs font-mono font-bold"
                            style={{ color: "var(--noctra-rose)" }}
                          >
                            error
                          </span>
                          <span
                            className="text-xs font-mono font-semibold"
                            style={{ color: "var(--noctra-text)" }}
                          >
                            {err.code}
                          </span>
                          <Badge
                            style={{
                              marginLeft: "auto",
                              fontSize: "10px",
                              background: "rgba(244,63,94,0.15)",
                              color: "var(--noctra-rose)",
                            }}
                          >
                            blocks build
                          </Badge>
                        </div>
                        <div
                          className="px-3 py-2.5 space-y-2"
                          style={{ background: "var(--noctra-surface2)" }}
                        >
                          <p
                            className="text-xs font-mono"
                            style={{ color: "var(--noctra-text)" }}
                          >
                            {err.message}
                          </p>
                          {err.why_it_matters && (
                            <p
                              className="text-xs"
                              style={{ color: "var(--noctra-text-muted)" }}
                            >
                              <span
                                className="font-semibold"
                                style={{ color: "var(--noctra-rose)" }}
                              >
                                Why:{" "}
                              </span>
                              {err.why_it_matters}
                            </p>
                          )}
                          {err.fix && (
                            <div className="flex items-start gap-1.5">
                              <Wrench
                                size={11}
                                style={{
                                  color: "var(--noctra-emerald)",
                                  flexShrink: 0,
                                  marginTop: 1,
                                }}
                              />
                              <p
                                className="text-xs"
                                style={{ color: "var(--noctra-emerald)" }}
                              >
                                {err.fix}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Non-blocking Errors */}
                {nonBlockingErrors.length > 0 && (
                  <div className="space-y-2">
                    <p
                      className="text-xs font-semibold uppercase tracking-wider px-1 flex items-center gap-1.5"
                      style={{ color: "var(--noctra-amber)" }}
                    >
                      <AlertCircle size={11} />
                      {nonBlockingErrors.length} Error
                      {nonBlockingErrors.length !== 1 ? "s" : ""}
                    </p>
                    {nonBlockingErrors.map((err, i) => (
                      <div
                        key={i}
                        className="rounded-xl overflow-hidden"
                        style={{ border: "1px solid rgba(245,158,11,0.25)" }}
                      >
                        <div
                          className="px-3 py-2 flex items-center gap-2"
                          style={{ background: "rgba(245,158,11,0.08)" }}
                        >
                          <span
                            className="text-xs font-mono font-bold"
                            style={{ color: "var(--noctra-amber)" }}
                          >
                            error
                          </span>
                          <span
                            className="text-xs font-mono font-semibold"
                            style={{ color: "var(--noctra-text)" }}
                          >
                            {err.code}
                          </span>
                          <span
                            className="ml-auto text-[10px] uppercase font-medium"
                            style={{
                              color:
                                SEV_COLOR[err.severity] ?? "var(--noctra-amber)",
                            }}
                          >
                            {err.severity}
                          </span>
                        </div>
                        <div
                          className="px-3 py-2.5 space-y-2"
                          style={{ background: "var(--noctra-surface2)" }}
                        >
                          <p
                            className="text-xs font-mono"
                            style={{ color: "var(--noctra-text)" }}
                          >
                            {err.message}
                          </p>
                          {err.why_it_matters && (
                            <p
                              className="text-xs"
                              style={{ color: "var(--noctra-text-muted)" }}
                            >
                              {err.why_it_matters}
                            </p>
                          )}
                          {err.fix && (
                            <div className="flex items-start gap-1.5">
                              <Wrench
                                size={11}
                                style={{
                                  color: "var(--noctra-emerald)",
                                  flexShrink: 0,
                                  marginTop: 1,
                                }}
                              />
                              <p
                                className="text-xs"
                                style={{ color: "var(--noctra-emerald)" }}
                              >
                                {err.fix}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Warnings */}
                {warnings.length > 0 && (
                  <Panel>
                    <p
                      className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5"
                      style={{ color: "var(--noctra-amber)" }}
                    >
                      <AlertCircle size={11} />
                      {warnings.length} Warning{warnings.length !== 1 ? "s" : ""}
                    </p>
                    <div className="space-y-1.5">
                      {warnings.map((w, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-xs px-2 py-1.5 rounded-lg"
                          style={{
                            background: "rgba(245,158,11,0.06)",
                            border: "1px solid rgba(245,158,11,0.15)",
                          }}
                        >
                          <span
                            className="font-mono shrink-0"
                            style={{ color: "var(--noctra-amber)" }}
                          >
                            warn
                          </span>
                          <span style={{ color: "var(--noctra-text-soft)" }}>{w}</span>
                        </div>
                      ))}
                    </div>
                  </Panel>
                )}

                {/* Product Patch */}
                {productPatch && (
                  <Panel
                    style={{
                      border: "1px solid rgba(61,216,255,0.2)",
                      background: "rgba(61,216,255,0.04)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Wrench size={12} style={{ color: "var(--noctra-cyan)" }} />
                      <p
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: "var(--noctra-cyan)" }}
                      >
                        Product Patch
                      </p>
                    </div>
                    <p className="text-sm" style={{ color: "var(--noctra-text-soft)" }}>
                      {productPatch}
                    </p>
                  </Panel>
                )}

                {/* Patched Idea */}
                {patchedIdea && (
                  <Panel
                    style={{
                      border: "1px solid rgba(52,211,153,0.2)",
                      background: "rgba(52,211,153,0.04)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle size={12} style={{ color: "var(--noctra-emerald)" }} />
                      <p
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: "var(--noctra-emerald)" }}
                      >
                        Patched Idea
                      </p>
                      <span
                        className="ml-auto text-[10px]"
                        style={{ color: "var(--noctra-text-muted)" }}
                      >
                        ready to re-compile
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: "var(--noctra-text-soft)" }}>
                      {patchedIdea}
                    </p>
                  </Panel>
                )}

                {/* Decisive Move */}
                {decisiveMove && (
                  <div
                    className="px-4 py-3 rounded-xl flex items-start gap-3"
                    style={{
                      background: "rgba(61,216,255,0.08)",
                      border: "1px solid rgba(61,216,255,0.25)",
                    }}
                  >
                    <ArrowRight
                      size={14}
                      style={{
                        color: "var(--noctra-cyan)",
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    />
                    <div>
                      <p
                        className="text-xs font-semibold mb-1"
                        style={{ color: "var(--noctra-cyan)" }}
                      >
                        Decisive Move (next 7 days)
                      </p>
                      <p className="text-sm" style={{ color: "var(--noctra-text)" }}>
                        {decisiveMove}
                      </p>
                    </div>
                  </div>
                )}

                {/* Blind Spots */}
                {Array.isArray(d?.blind_spots) &&
                  (d.blind_spots as string[]).length > 0 && (
                    <Panel>
                      <p
                        className="text-xs font-semibold uppercase tracking-wider mb-2"
                        style={{ color: "var(--noctra-amber)" }}
                      >
                        Blind Spots
                      </p>
                      <div className="space-y-1.5">
                        {(d.blind_spots as string[]).map((s, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <ChevronRight
                              size={11}
                              style={{
                                color: "var(--noctra-amber)",
                                flexShrink: 0,
                                marginTop: 1,
                              }}
                            />
                            <span style={{ color: "var(--noctra-text-soft)" }}>{s}</span>
                          </div>
                        ))}
                      </div>
                    </Panel>
                  )}

                {/* Next Actions */}
                {Array.isArray(d?.next_actions) &&
                  (d.next_actions as string[]).length > 0 && (
                    <Panel>
                      <p
                        className="text-xs font-semibold uppercase tracking-wider mb-2"
                        style={{ color: "var(--noctra-cyan)" }}
                      >
                        Next Actions
                      </p>
                      <ol className="space-y-1.5">
                        {(d.next_actions as string[]).map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs">
                            <span
                              className="font-mono shrink-0 w-4 text-right"
                              style={{ color: "var(--noctra-text-muted)" }}
                            >
                              {i + 1}.
                            </span>
                            <span style={{ color: "var(--noctra-text-soft)" }}>{a}</span>
                          </li>
                        ))}
                      </ol>
                    </Panel>
                  )}

                {/* Bottom actions */}
                <div className="flex gap-2 flex-wrap pt-1">
                  {savedReportId && (
                    <NoctraButton
                      variant="ghost"
                      onClick={() => navigate(`/app/reports/${savedReportId}`)}
                    >
                      Full Report <ArrowRight size={11} />
                    </NoctraButton>
                  )}
                  <NoctraButton variant="ghost" onClick={reset}>
                    <RotateCcw size={12} /> Reset
                  </NoctraButton>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
