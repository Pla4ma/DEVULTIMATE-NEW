import { useLocation } from "wouter";
import {
  Loader2, CheckCircle, AlertCircle, Zap, Play, RotateCcw,
  Wrench, CheckSquare, ArrowRight,
} from "lucide-react";
import { NoctraButton, Panel, Badge } from "@/components/Primitives";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import { TOOL_EXAMPLES } from "@/lib/noctra-journey";
import { COMPILE_MODES } from "./constants";
import type { Phase, CompileMode } from "./types";
import type { InjectedContext } from "@/lib/cross-context";

const TOOL = TOOL_BY_KEY["reality"]!;

interface RealityInputPanelProps {
  input: string;
  setInput: (v: string) => void;
  compileMode: CompileMode;
  setCompileMode: (v: CompileMode) => void;
  phase: Phase;
  currentStage: string;
  injectedContext: InjectedContext | null;
  autoSaved: boolean;
  autoSaveError: boolean;
  savedReportId: string | null;
  latestIdea: string | null;
  canApplyPatch: boolean;
  patchedIdea: string;
  generatingTasks: boolean;
  applyingPatch: boolean;
  onRun: () => void;
  onReset: () => void;
  onApplyPatch: () => void;
  onGenerateTasks: () => void;
  onNavigate: (path: string) => void;
}

export function RealityInputPanel({
  input,
  setInput,
  compileMode,
  setCompileMode,
  phase,
  currentStage,
  injectedContext,
  autoSaved,
  autoSaveError,
  savedReportId,
  latestIdea,
  canApplyPatch,
  patchedIdea,
  generatingTasks,
  applyingPatch,
  onRun,
  onReset,
  onApplyPatch,
  onGenerateTasks,
  onNavigate,
}: RealityInputPanelProps) {
  return (
    <div className="space-y-4">
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
          maxLength={4000}
          className="w-full px-3 py-2.5 rounded-lg text-sm resize-none outline-none font-mono"
          style={{
            background: "var(--noctra-surface2)",
            border: "1px solid var(--noctra-border)",
            color: "var(--noctra-text)",
          }}
        />
        {input.length > 0 && (
          <div className="flex justify-end mt-1">
            <span className="text-[10px]" style={{ color: input.length > 3500 ? "var(--noctra-amber)" : "var(--noctra-text-muted)" }}>{input.length}/4000</span>
          </div>
        )}

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
                onClick={() => onNavigate(`/app/reports/${savedReportId}`)}
                className="ml-auto text-xs hover:opacity-80"
                style={{ color: "var(--noctra-cyan)" }}
              >
                View <ArrowRight size={10} className="inline" />
              </button>
            )}
          </div>
        )}
        {autoSaveError && !autoSaved && (
          <div
            className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{
              background: "rgba(244,63,94,0.06)",
              border: "1px solid rgba(244,63,94,0.2)",
            }}
          >
            <AlertCircle size={12} style={{ color: "var(--noctra-rose)" }} />
            <p className="text-xs" style={{ color: "var(--noctra-rose)" }}>
              Auto-save failed — your analysis is visible but not stored. Check your connection.
            </p>
          </div>
        )}

        <div className="flex gap-2 mt-3">
          {latestIdea && phase === "idle" && !input.trim() && (
            <NoctraButton variant="ghost" onClick={() => setInput(latestIdea)}>
              Use latest Idea report
            </NoctraButton>
          )}
          <NoctraButton
            onClick={onRun}
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
            <NoctraButton variant="ghost" onClick={onReset}>
              <RotateCcw size={13} />
            </NoctraButton>
          )}
        </div>
      </Panel>

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
            onClick={onApplyPatch}
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

      {phase === "done" && savedReportId && (
        <NoctraButton
          variant="ghost"
          onClick={onGenerateTasks}
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
  );
}
