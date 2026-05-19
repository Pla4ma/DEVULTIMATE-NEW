import { Loader2, Wand2, AlertTriangle, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Panel, EmptyState, NoctraButton, Badge } from "@/components/Primitives";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import type { ReportSummary } from "@/lib/intelligence";

interface TwinDataPanelProps {
  recentReports: ReportSummary[];
  allReports: ReportSummary[];
  toolsCovered: string[];
  syntheticPhase: "idle" | "running" | "done";
  synthesis: Record<string, unknown> | null;
  synthesisStage: string;
  trends: Array<{ tool: string; label: string; latestScore: number; direction: string; delta?: number | null }>;
  onSynthesize: () => void;
}

const trajectoryColor: Record<string, string> = {
  improving: "var(--noctra-emerald)",
  stagnant: "var(--noctra-amber)",
  declining: "var(--noctra-rose)",
};

export function TwinDataPanel({
  recentReports, allReports, toolsCovered,
  syntheticPhase, synthesis, synthesisStage, trends,
  onSynthesize,
}: TwinDataPanelProps) {
  return (
    <div className="space-y-3">
      <Panel>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-text-muted)" }}>Data Coverage</p>
        <div className="space-y-1.5">
          {(["idea", "reality", "proof", "swarm", "mvp", "doctor", "launch"] as const).map((toolKey) => {
            const tool = TOOL_BY_KEY[toolKey];
            const covered = toolsCovered.includes(toolKey);
            const hasData = allReports.some((r) => r.tool === toolKey && r.score != null);
            return (
              <div key={toolKey} className="flex items-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full shrink-0 ${covered ? "" : "opacity-30"}`} style={{ background: covered ? tool.accent : "var(--noctra-text-muted)" }} />
                <span style={{ color: covered ? tool.accent : "var(--noctra-text-muted)", fontWeight: covered ? 500 : 400 }}>
                  {tool.label}
                </span>
                {!covered && <span className="text-[9px] ml-auto" style={{ color: "var(--noctra-text-muted)" }}>No data</span>}
                {hasData && <span className="text-[9px] ml-auto" style={{ color: "var(--noctra-emerald)" }}>Loaded</span>}
              </div>
            );
          })}
        </div>
      </Panel>

      {trends.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-text-muted)" }}>Score Trends</p>
          <div className="space-y-2">
            {trends.slice(0, 5).map((t) => {
              const tool = TOOL_BY_KEY[t.tool as keyof typeof TOOL_BY_KEY];
              const deltaColor = t.direction === "up" ? "var(--noctra-emerald)" : t.direction === "down" ? "var(--noctra-rose)" : "var(--noctra-text-muted)";
              return (
                <div key={t.tool} className="flex items-center gap-2">
                  <span className="text-xs w-16 truncate shrink-0" style={{ color: "var(--noctra-text-muted)" }}>{t.label.split(" ")[0]}</span>
                  <div className="flex-1 h-1 rounded-full" style={{ background: "var(--noctra-surface2)" }}>
                    <div className="h-1 rounded-full transition-all" style={{ width: `${t.latestScore}%`, background: tool?.accent ?? "var(--noctra-cyan)" }} />
                  </div>
                  <span className="text-xs font-mono w-6 text-right shrink-0" style={{ color: tool?.accent ?? "var(--noctra-cyan)" }}>{t.latestScore}</span>
                  {t.delta != null && (
                    <span style={{ color: deltaColor }}>
                      {t.direction === "up" ? <TrendingUp size={9} /> : t.direction === "down" ? <TrendingDown size={9} /> : <Minus size={9} />}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {recentReports.length >= 2 && syntheticPhase !== "running" && (
        <NoctraButton onClick={onSynthesize} variant="ghost" className="w-full">
          <Wand2 size={12} />
          {syntheticPhase === "done" ? "Re-synthesize" : "Synthesize"}
        </NoctraButton>
      )}

      {syntheticPhase === "running" && (
        <Panel>
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <Loader2 size={18} className="animate-spin" style={{ color: TOOL_BY_KEY["twin"]!.accent }} />
            <p className="text-xs text-center" style={{ color: "var(--noctra-text-muted)" }}>
              {synthesisStage || "Synthesizing…"}
            </p>
          </div>
        </Panel>
      )}

      {syntheticPhase === "idle" && recentReports.length < 2 && (
        <Panel>
          <EmptyState
            icon={<Wand2 size={18} />}
            title="Not enough data"
            body="Run at least 2 intelligence tools to unlock synthesis."
          />
        </Panel>
      )}

      {syntheticPhase === "done" && synthesis && (
        <>
          {synthesis.overall_trajectory != null && (
            <Panel>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-text-muted)" }}>Trajectory</p>
              <Badge style={{
                background: `${trajectoryColor[synthesis.overall_trajectory as keyof typeof trajectoryColor] ?? "var(--noctra-amber)"}18`,
                color: trajectoryColor[synthesis.overall_trajectory as keyof typeof trajectoryColor] ?? "var(--noctra-amber)",
              }}>
                {String(synthesis.overall_trajectory)}
              </Badge>
              {Boolean(synthesis.summary) && (
                <p className="text-xs mt-2" style={{ color: "var(--noctra-text-muted)" }}>{String(synthesis.summary)}</p>
              )}
            </Panel>
          )}

          {((): Array<{ pattern: string; evidence?: string; implication?: string } | string> => {
            const p = synthesis.patterns;
            return Array.isArray(p) ? p as Array<{ pattern: string; evidence?: string; implication?: string } | string> : [];
          })().length > 0 && (
            <Panel>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-text-muted)" }}>Patterns</p>
              <div className="space-y-2">
                {(synthesis.patterns as Array<{ pattern: string; evidence?: string; implication?: string } | string>).slice(0, 3).map((p, i) => (
                  <div key={i} className="px-3 py-2 rounded-lg" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                    <p className="text-xs font-medium" style={{ color: "var(--noctra-text)" }}>
                      {typeof p === "string" ? p : p.pattern}
                    </p>
                    {typeof p !== "string" && p.implication && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{p.implication}</p>
                    )}
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {(() => {
            const d = synthesis.drift_signals;
            return Array.isArray(d) ? d as Array<{ signal?: string; severity?: string } | string> : [];
          })().length > 0 && (
            <Panel>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-rose)" }}>Drift Signals</p>
              <div className="space-y-1.5">
                {(synthesis.drift_signals as Array<{ signal?: string; severity?: string } | string>).slice(0, 3).map((d, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <AlertTriangle size={10} style={{ color: "var(--noctra-rose)", marginTop: 1, flexShrink: 0 }} />
                    <span style={{ color: "var(--noctra-text-muted)" }}>
                      {typeof d === "string" ? d : (d.signal ?? "")}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {(() => {
            const m = synthesis.strategic_moves;
            return Array.isArray(m) ? m as string[] : [];
          })().length > 0 && (
            <Panel>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-cyan)" }}>Strategic Moves</p>
              <div className="space-y-1.5">
                {(synthesis.strategic_moves as string[]).slice(0, 3).map((m, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs">
                    <ChevronRight size={10} style={{ color: "var(--noctra-cyan)", marginTop: 1, flexShrink: 0 }} />
                    <span style={{ color: "var(--noctra-text)" }}>{m}</span>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
