import { ScoreRing, Badge, Panel, EmptyState, ProgressBar } from "@/components/Primitives";
import { AlertTriangle, ShieldAlert, CheckCircle, XCircle, AlertCircle, ChevronRight, Wrench } from "lucide-react";
import { computeAIDefenseScore } from "@/lib/ai-defense";
import type { RealityData, CompilerError, RiskItem } from "./reality/reality-types";
import { STATUS_CONFIG, SEV_COLOR } from "./reality/reality-constants";
import { RealityCompilerErrors } from "./reality/RealityCompilerErrors";
import { RealityAIDefense } from "./reality/RealityAIDefense";

export function RealityReportView({ report, compact, prevScore, scoreDelta }: {
  report: { payload: unknown; score?: number | null; [key: string]: unknown };
  compact?: boolean;
  prevScore?: number;
  scoreDelta?: number;
}) {
  const p = report.payload as Record<string, unknown>;
  const data = (p?.data ?? p) as RealityData | null;
  if (!data) return <EmptyState icon={<AlertTriangle size={24} />} title="No data available" />;

  const score = data.score ?? data.reality_score ?? report.score ?? 0;
  const risks: RiskItem[] = data.risk_items ?? data.assumptions ?? [];
  const defense = computeAIDefenseScore({ tool: "reality", payload: report.payload, score: report.score as number | null });

  const isCompilerSchema = !!data.compile_status;
  const compileStatus = data.compile_status ?? (
    data.go_signal === "GO" ? "PASSED" : data.go_signal === "NO-GO" ? "FAILED" : "WARNING"
  );
  const statusCfg = STATUS_CONFIG[compileStatus as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.WARNING;
  if (!statusCfg) return null;
  const StatusIcon = statusCfg.icon;
  const errors: CompilerError[] = Array.isArray(data.errors) ? data.errors : [];
  const warnings: string[] = Array.isArray(data.warnings) ? data.warnings : [];
  const blockingErrors = errors.filter((e) => e.blocks_build);
  const nonBlockingErrors = errors.filter((e) => !e.blocks_build);

  return (
    <div className="space-y-4">
      {/* Score + Compile Status */}
      <div className="flex gap-4 items-start flex-wrap">
        <ScoreRing value={score} label="Reality" color="var(--noctra-amber)" />
        <div className="flex-1 min-w-0">
          {isCompilerSchema ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg mb-2" style={{ background: statusCfg.bg, border: `1px solid ${statusCfg.border}` }}>
              <StatusIcon size={12} style={{ color: statusCfg.color }} />
              <span className="text-xs font-mono font-bold" style={{ color: statusCfg.color }}>{statusCfg.label}</span>
            </div>
          ) : null}
          {data.verdict && <p className="text-sm font-semibold mb-1" style={{ color: "var(--noctra-text)" }}>{data.verdict}</p>}
          {data.summary && <p className="text-sm" style={{ color: "var(--noctra-text-soft)" }}>{data.summary}</p>}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {!isCompilerSchema && data.go_signal ? (
              <Badge variant={data.go_signal === "GO" ? "emerald" : data.go_signal === "NO-GO" ? "rose" : "amber"}>
                {data.go_signal}
              </Badge>
            ) : null}
            {prevScore != null && scoreDelta != null ? (
              <Badge style={{
                background: scoreDelta > 0 ? "rgba(52,211,153,0.1)" : scoreDelta < 0 ? "rgba(244,63,94,0.1)" : "var(--noctra-surface2)",
                color: scoreDelta > 0 ? "var(--noctra-emerald)" : scoreDelta < 0 ? "var(--noctra-rose)" : "var(--noctra-text-muted)",
              }}>
                {scoreDelta > 0 ? `↑ +${scoreDelta}` : scoreDelta < 0 ? `↓ ${scoreDelta}` : "→ flat"} vs prev ({prevScore})
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      {/* Compiler Errors */}
      {isCompilerSchema && <RealityCompilerErrors blockingErrors={blockingErrors} nonBlockingErrors={nonBlockingErrors} />}

      {/* Compiler Warnings */}
      {isCompilerSchema && warnings.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "var(--noctra-amber)" }}>
            <AlertCircle size={11} />
            {warnings.length} Warning{warnings.length !== 1 ? "s" : ""}
          </p>
          <div className="space-y-1.5">
            {warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-xs px-2 py-1.5 rounded-lg" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
                <span className="font-mono shrink-0" style={{ color: "var(--noctra-amber)" }}>warn</span>
                <span style={{ color: "var(--noctra-text-soft)" }}>{w}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Product Patch / Patched Idea / Decisive Move */}
      {data.product_patch && (
        <Panel style={{ border: "1px solid rgba(61,216,255,0.2)", background: "rgba(61,216,255,0.04)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Wrench size={12} style={{ color: "var(--noctra-cyan)" }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-cyan)" }}>Product Patch</p>
          </div>
          <p className="text-sm" style={{ color: "var(--noctra-text-soft)" }}>{data.product_patch}</p>
        </Panel>
      )}
      {data.patched_idea && (
        <Panel style={{ border: "1px solid rgba(52,211,153,0.2)", background: "rgba(52,211,153,0.04)" }}>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={12} style={{ color: "var(--noctra-emerald)" }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-emerald)" }}>Patched Idea</p>
          </div>
          <p className="text-sm" style={{ color: "var(--noctra-text-soft)" }}>{data.patched_idea}</p>
        </Panel>
      )}
      {data.decisive_move && (
        <Panel style={{ border: "1px solid rgba(61,216,255,0.2)", background: "rgba(61,216,255,0.04)" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "var(--noctra-cyan)" }}>Decisive Move (next 7 days)</p>
          <p className="text-sm" style={{ color: "var(--noctra-text)" }}>{data.decisive_move}</p>
        </Panel>
      )}

      {/* Legacy: Red Flags */}
      {!isCompilerSchema && data.red_flags && data.red_flags.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-rose)" }}>Red Flags</p>
          <ul className="space-y-1">
            {data.red_flags.map((f, i) => (
              <li key={i} className="text-sm flex gap-2" style={{ color: "var(--noctra-text-soft)" }}>
                <span style={{ color: "var(--noctra-rose)" }}>!</span>{f}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* Blind Spots */}
      {data.blind_spots && data.blind_spots.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-amber)" }}>Blind Spots</p>
          <div className="space-y-1.5">
            {data.blind_spots.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <ChevronRight size={12} style={{ color: "var(--noctra-amber)", flexShrink: 0, marginTop: 2 }} />
                <span style={{ color: "var(--noctra-text-soft)" }}>{s}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Risk Matrix */}
      {risks.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--noctra-amber)" }}>Risk Matrix</p>
          <div className="space-y-2">
            {risks.map((r, i) => (
              <div key={i} className="rounded-lg p-3" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm" style={{ color: "var(--noctra-text)" }}>{r.assumption}</p>
                  <Badge variant={r.severity === "high" || r.severity === "critical" ? "rose" : r.severity === "low" ? "emerald" : "amber"}>{r.severity}</Badge>
                </div>
                {r.mitigation && <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>Fix: {r.mitigation}</p>}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Market Risks (legacy) */}
      {!compact && !isCompilerSchema && data.market_risks && data.market_risks.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-amber)" }}>Market Risks</p>
          <ul className="space-y-1">
            {data.market_risks.map((r, i) => (
              <li key={i} className="text-sm flex gap-2" style={{ color: "var(--noctra-text-soft)" }}>
                <span style={{ color: "var(--noctra-amber)" }}>—</span>{r}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* Next Actions */}
      {data.next_actions && data.next_actions.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-cyan)" }}>Next Actions</p>
          <ol className="space-y-1">
            {data.next_actions.map((a, i) => (
              <li key={i} className="text-sm flex gap-2" style={{ color: "var(--noctra-text-soft)" }}>
                <span className="text-xs font-mono shrink-0" style={{ color: "var(--noctra-text-muted)" }}>{i + 1}.</span>
                {a}
              </li>
            ))}
          </ol>
        </Panel>
      )}

      {/* AI Wrapper Defense */}
      <RealityAIDefense defense={defense} />

      <ProgressBar value={score} color="var(--noctra-amber)" />
    </div>
  );
}
