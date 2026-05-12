import { ScoreRing, Badge, Panel, EmptyState, ProgressBar } from "@/components/Primitives";
import { AlertTriangle, ShieldAlert, ShieldCheck, XCircle, AlertCircle, CheckCircle, Wrench, ChevronRight } from "lucide-react";
import { computeAIDefenseScore, DEFENSE_RISK_COLOR, DEFENSE_RISK_LABEL } from "@/lib/ai-defense";

type RiskItem = { assumption: string; severity: string; blind_spot?: string; mitigation?: string };

type CompilerError = {
  code: string;
  severity: string;
  message: string;
  why_it_matters?: string;
  fix?: string;
  blocks_build?: boolean;
};

type RealityData = {
  verdict?: string;
  summary?: string;
  reality_score?: number;
  score?: number;
  compile_status?: string;
  errors?: CompilerError[];
  warnings?: string[];
  product_patch?: string;
  patched_idea?: string;
  decisive_move?: string;
  red_flags?: string[];
  blind_spots?: string[];
  market_risks?: string[];
  technical_risks?: string[];
  risk_items?: RiskItem[];
  assumptions?: RiskItem[];
  next_actions?: string[];
  go_signal?: string;
};

type Props = {
  report: { payload: unknown; score?: number | null; [key: string]: unknown };
  compact?: boolean;
  prevScore?: number;
  scoreDelta?: number;
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

export function RealityReportView({ report, compact, prevScore, scoreDelta }: Props) {
  const p = report.payload as Record<string, unknown>;
  const data = (p?.data ?? p) as RealityData | null;
  if (!data) return <EmptyState icon={<AlertTriangle size={24} />} title="No data available" />;

  const score = data.score ?? data.reality_score ?? report.score ?? 0;
  const risks = data.risk_items ?? data.assumptions ?? [];
  const defense = computeAIDefenseScore({ tool: "reality", payload: report.payload, score: report.score as number | null });
  const defenseColor = DEFENSE_RISK_COLOR[defense.riskLevel];

  const isCompilerSchema = !!data.compile_status;
  const compileStatus = data.compile_status ?? (
    data.go_signal === "GO" ? "PASSED" : data.go_signal === "NO-GO" ? "FAILED" : "WARNING"
  );
  const statusCfg = STATUS_CONFIG[compileStatus as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.WARNING;
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
          {/* Compile status badge (new schema) */}
          {isCompilerSchema ? (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg mb-2"
              style={{ background: statusCfg.bg, border: `1px solid ${statusCfg.border}` }}
            >
              <StatusIcon size={12} style={{ color: statusCfg.color }} />
              <span className="text-xs font-mono font-bold" style={{ color: statusCfg.color }}>
                {statusCfg.label}
              </span>
            </div>
          ) : null}
          {data.verdict && (
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--noctra-text)" }}>
              {data.verdict}
            </p>
          )}
          {data.summary && (
            <p className="text-sm" style={{ color: "var(--noctra-text-soft)" }}>
              {data.summary}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {!isCompilerSchema && data.go_signal ? (
              <Badge variant={data.go_signal === "GO" ? "emerald" : data.go_signal === "NO-GO" ? "rose" : "amber"}>
                {data.go_signal}
              </Badge>
            ) : null}
            {prevScore != null && scoreDelta != null ? (
              <Badge
                style={{
                  background:
                    scoreDelta > 0
                      ? "rgba(52,211,153,0.1)"
                      : scoreDelta < 0
                        ? "rgba(244,63,94,0.1)"
                        : "var(--noctra-surface2)",
                  color:
                    scoreDelta > 0
                      ? "var(--noctra-emerald)"
                      : scoreDelta < 0
                        ? "var(--noctra-rose)"
                        : "var(--noctra-text-muted)",
                }}
              >
                {scoreDelta > 0
                  ? `↑ +${scoreDelta}`
                  : scoreDelta < 0
                    ? `↓ ${scoreDelta}`
                    : "→ flat"}{" "}
                vs prev ({prevScore})
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Compiler Schema: Blocking Errors ── */}
      {isCompilerSchema && blockingErrors.length > 0 && (
        <div className="space-y-2">
          <p
            className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
            style={{ color: "var(--noctra-rose)" }}
          >
            <XCircle size={11} />
            {blockingErrors.length} Blocking Error{blockingErrors.length !== 1 ? "s" : ""}
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
                <span className="text-xs font-mono font-bold" style={{ color: "var(--noctra-rose)" }}>
                  error
                </span>
                <span className="text-xs font-mono font-semibold" style={{ color: "var(--noctra-text)" }}>
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
              <div className="px-3 py-2.5 space-y-1.5" style={{ background: "var(--noctra-surface2)" }}>
                <p className="text-xs font-mono" style={{ color: "var(--noctra-text)" }}>
                  {err.message}
                </p>
                {err.why_it_matters && (
                  <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>
                    <span className="font-semibold" style={{ color: "var(--noctra-rose)" }}>Why: </span>
                    {err.why_it_matters}
                  </p>
                )}
                {err.fix && (
                  <div className="flex items-start gap-1.5">
                    <Wrench size={11} style={{ color: "var(--noctra-emerald)", flexShrink: 0, marginTop: 1 }} />
                    <p className="text-xs" style={{ color: "var(--noctra-emerald)" }}>
                      {err.fix}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Compiler Schema: Non-blocking Errors ── */}
      {isCompilerSchema && nonBlockingErrors.length > 0 && (
        <div className="space-y-2">
          <p
            className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
            style={{ color: "var(--noctra-amber)" }}
          >
            <AlertCircle size={11} />
            {nonBlockingErrors.length} Error{nonBlockingErrors.length !== 1 ? "s" : ""}
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
                <span className="text-xs font-mono font-bold" style={{ color: "var(--noctra-amber)" }}>
                  error
                </span>
                <span className="text-xs font-mono font-semibold" style={{ color: "var(--noctra-text)" }}>
                  {err.code}
                </span>
                <span
                  className="ml-auto text-[10px] uppercase font-medium"
                  style={{ color: SEV_COLOR[err.severity] ?? "var(--noctra-amber)" }}
                >
                  {err.severity}
                </span>
              </div>
              <div className="px-3 py-2.5 space-y-1.5" style={{ background: "var(--noctra-surface2)" }}>
                <p className="text-xs font-mono" style={{ color: "var(--noctra-text)" }}>
                  {err.message}
                </p>
                {err.why_it_matters && (
                  <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>
                    {err.why_it_matters}
                  </p>
                )}
                {err.fix && (
                  <div className="flex items-start gap-1.5">
                    <Wrench size={11} style={{ color: "var(--noctra-emerald)", flexShrink: 0, marginTop: 1 }} />
                    <p className="text-xs" style={{ color: "var(--noctra-emerald)" }}>
                      {err.fix}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Compiler Schema: Warnings ── */}
      {isCompilerSchema && warnings.length > 0 && (
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
                <span className="font-mono shrink-0" style={{ color: "var(--noctra-amber)" }}>
                  warn
                </span>
                <span style={{ color: "var(--noctra-text-soft)" }}>{w}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ── Compiler Schema: Product Patch ── */}
      {data.product_patch && (
        <Panel
          style={{
            border: "1px solid rgba(61,216,255,0.2)",
            background: "rgba(61,216,255,0.04)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Wrench size={12} style={{ color: "var(--noctra-cyan)" }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-cyan)" }}>
              Product Patch
            </p>
          </div>
          <p className="text-sm" style={{ color: "var(--noctra-text-soft)" }}>
            {data.product_patch}
          </p>
        </Panel>
      )}

      {/* ── Compiler Schema: Patched Idea ── */}
      {data.patched_idea && (
        <Panel
          style={{
            border: "1px solid rgba(52,211,153,0.2)",
            background: "rgba(52,211,153,0.04)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={12} style={{ color: "var(--noctra-emerald)" }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-emerald)" }}>
              Patched Idea
            </p>
          </div>
          <p className="text-sm" style={{ color: "var(--noctra-text-soft)" }}>
            {data.patched_idea}
          </p>
        </Panel>
      )}

      {/* ── Compiler Schema: Decisive Move ── */}
      {data.decisive_move && (
        <Panel
          style={{
            border: "1px solid rgba(61,216,255,0.2)",
            background: "rgba(61,216,255,0.04)",
          }}
        >
          <p className="text-xs font-semibold mb-1" style={{ color: "var(--noctra-cyan)" }}>
            Decisive Move (next 7 days)
          </p>
          <p className="text-sm" style={{ color: "var(--noctra-text)" }}>
            {data.decisive_move}
          </p>
        </Panel>
      )}

      {/* ── Legacy schema: Red Flags ── */}
      {!isCompilerSchema && data.red_flags && data.red_flags.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-rose)" }}>
            Red Flags
          </p>
          <ul className="space-y-1">
            {data.red_flags.map((f, i) => (
              <li key={i} className="text-sm flex gap-2" style={{ color: "var(--noctra-text-soft)" }}>
                <span style={{ color: "var(--noctra-rose)" }}>!</span>
                {f}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* ── Shared: Blind Spots ── */}
      {data.blind_spots && data.blind_spots.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-amber)" }}>
            Blind Spots
          </p>
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

      {/* ── Shared: Risk Matrix (legacy + new if present) ── */}
      {risks.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--noctra-amber)" }}>
            Risk Matrix
          </p>
          <div className="space-y-2">
            {risks.map((r, i) => (
              <div
                key={i}
                className="rounded-lg p-3"
                style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm" style={{ color: "var(--noctra-text)" }}>
                    {r.assumption}
                  </p>
                  <Badge
                    variant={
                      r.severity === "high" || r.severity === "critical"
                        ? "rose"
                        : r.severity === "low"
                          ? "emerald"
                          : "amber"
                    }
                  >
                    {r.severity}
                  </Badge>
                </div>
                {r.mitigation && (
                  <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>
                    Fix: {r.mitigation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ── Legacy: Market Risks ── */}
      {!compact && !isCompilerSchema && data.market_risks && data.market_risks.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-amber)" }}>
            Market Risks
          </p>
          <ul className="space-y-1">
            {data.market_risks.map((r, i) => (
              <li key={i} className="text-sm flex gap-2" style={{ color: "var(--noctra-text-soft)" }}>
                <span style={{ color: "var(--noctra-amber)" }}>—</span>
                {r}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* ── Shared: Next Actions ── */}
      {data.next_actions && data.next_actions.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-cyan)" }}>
            Next Actions
          </p>
          <ol className="space-y-1">
            {data.next_actions.map((a, i) => (
              <li key={i} className="text-sm flex gap-2" style={{ color: "var(--noctra-text-soft)" }}>
                <span className="text-xs font-mono shrink-0" style={{ color: "var(--noctra-text-muted)" }}>
                  {i + 1}.
                </span>
                {a}
              </li>
            ))}
          </ol>
        </Panel>
      )}

      {/* AI Wrapper Defense Score */}
      <Panel>
        <div className="flex items-center gap-2 mb-3">
          {defense.riskLevel === "low" ? (
            <ShieldCheck size={14} style={{ color: defenseColor }} />
          ) : (
            <ShieldAlert size={14} style={{ color: defenseColor }} />
          )}
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: defenseColor }}
          >
            AI Wrapper Defense — {DEFENSE_RISK_LABEL[defense.riskLevel]}
          </p>
          <span className="ml-auto text-xs font-bold font-mono" style={{ color: defenseColor }}>
            {defense.score}/100
          </span>
        </div>
        <ProgressBar value={defense.score} color={defenseColor} />
        <div className="mt-3 space-y-1">
          {defense.reasons.map((r, i) => (
            <p key={i} className="text-xs flex gap-1.5" style={{ color: "var(--noctra-text-soft)" }}>
              <span style={{ color: defenseColor }}>·</span>
              {r}
            </p>
          ))}
        </div>
        {defense.moatSuggestions.length > 0 && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--noctra-border)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-text-muted)" }}>
              Moat Suggestions
            </p>
            <div className="space-y-1">
              {defense.moatSuggestions.map((s, i) => (
                <p key={i} className="text-xs flex gap-1.5" style={{ color: "var(--noctra-text-muted)" }}>
                  <span style={{ color: "var(--noctra-amber)" }}>→</span>
                  {s}
                </p>
              ))}
            </div>
          </div>
        )}
      </Panel>

      <ProgressBar value={score} color="var(--noctra-amber)" />
    </div>
  );
}
