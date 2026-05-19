import {
  Cpu, CheckCircle, AlertCircle, XCircle, RotateCcw,
  ArrowRight, Wrench, ChevronRight, ExternalLink, Terminal,
} from "lucide-react";
import { EmptyState, NoctraButton, Panel, Badge } from "@/components/Primitives";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import { SEV_COLOR, STATUS_CONFIG } from "./constants";
import type { Phase, CompileMode, CompilerError } from "./types";
import type { StructuredResult } from "@/lib/ai";

const TOOL = TOOL_BY_KEY["reality"]!;

interface RealityOutputPanelProps {
  phase: Phase;
  error: string;
  result: StructuredResult | null;
  compileMode: CompileMode;
  currentStage: string;
  savedReportId: string | null;
  onReset: () => void;
  onNavigate: (path: string) => void;
}

export function RealityOutputPanel({
  phase,
  error,
  result,
  compileMode,
  currentStage,
  savedReportId,
  onReset,
  onNavigate,
}: RealityOutputPanelProps) {
  if (phase === "idle") {
    return (
      <EmptyState
        icon={<Terminal size={22} />}
        title="Awaiting input"
        body="Describe your product or assumptions. Select a compile mode and press ⌘↵ to run."
      />
    );
  }

  if (phase === "running") {
    return (
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
    );
  }

  if (phase === "error") {
    return (
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
              onClick={onReset}
              className="flex items-center gap-1.5 text-xs mt-3 hover:opacity-80"
              style={{ color: "var(--noctra-rose)" }}
            >
              <RotateCcw size={11} /> Try again
            </button>
          </div>
        </div>
      </Panel>
    );
  }

  if (phase === "done" && result) {
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

    return (
      <div className="space-y-3">
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

        {d?.summary ? (
          <Panel>
            <p className="text-xs" style={{ color: "var(--noctra-text-soft)" }}>
              {d.summary as string}
            </p>
          </Panel>
        ) : null}

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

        <div
          className="flex gap-2 flex-wrap pt-3 mt-2 border-t"
          style={{ borderColor: "var(--noctra-border)" }}
        >
          {savedReportId && (
            <NoctraButton
              variant="ghost"
              onClick={() => onNavigate(`/app/reports/${savedReportId}`)}
            >
              <ExternalLink size={11} /> Full Report
            </NoctraButton>
          )}
          {savedReportId && (
            <NoctraButton
              variant="ghost"
              onClick={() => onNavigate("/app/proof")}
            >
              Next: Proof Engine <ArrowRight size={11} />
            </NoctraButton>
          )}
          <NoctraButton variant="ghost" onClick={onReset}>
            <RotateCcw size={12} />
          </NoctraButton>
        </div>
      </div>
    );
  }

  return null;
}
