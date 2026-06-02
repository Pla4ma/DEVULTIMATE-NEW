import { Loader2, Wand2, AlertTriangle, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Panel, EmptyState, NoctraButton, Badge } from "@/components/Primitives";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import type { ReportSummary } from "@/lib/report-utils";

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
  improving: "var(--color-success)",
  stagnant: "var(--color-warning)",
  declining: "var(--color-danger)",
};

export function TwinDataPanel({
  recentReports, allReports, toolsCovered,
  syntheticPhase, synthesis, synthesisStage, trends,
  onSynthesize,
}: TwinDataPanelProps) {
  return (
    <div className="space-y-3">
      <Panel>
        <p className="eyebrow mb-2" style={{ color: "var(--text-tertiary)" }}>Data Coverage</p>
        <div className="space-y-1.5">
          {(["idea", "reality", "proof", "swarm", "mvp", "doctor", "launch"] as const).map((toolKey) => {
            const tool = TOOL_BY_KEY[toolKey];
            const covered = toolsCovered.includes(toolKey);
            const hasData = allReports.some((r) => r.tool === toolKey && r.score != null);
            return (
              <div key={toolKey} className="flex items-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full shrink-0 ${covered ? "" : "opacity-30"}`} style={{ background: covered ? tool.accent : "var(--text-tertiary)" }} />
                <span style={{ color: covered ? tool.accent : "var(--text-tertiary)", fontWeight: covered ? 500 : 400 }}>
                  {tool.label}
                </span>
                {!covered && <span className="text-[9px] ml-auto" style={{ color: "var(--text-tertiary)" }}>No data</span>}
                {hasData && <span className="text-[9px] ml-auto" style={{ color: "var(--color-success)" }}>Loaded</span>}
              </div>
            );
          })}
        </div>
      </Panel>

      {trends.length > 0 && (
        <Panel>
          <p className="eyebrow mb-2" style={{ color: "var(--text-tertiary)" }}>Score Trends</p>
          <div className="space-y-2">
            {trends.slice(0, 5).map((t) => {
              const tool = TOOL_BY_KEY[t.tool as keyof typeof TOOL_BY_KEY];
              const deltaColor = t.direction === "up" ? "var(--color-success)" : t.direction === "down" ? "var(--color-danger)" : "var(--text-tertiary)";
              return (
                <div key={t.tool} className="flex items-center gap-2">
                  <span className="text-xs w-16 truncate shrink-0" style={{ color: "var(--text-tertiary)" }}>{t.label.split(" ")[0]}</span>
                  <div className="flex-1 h-1 rounded-full" style={{ background: "var(--surface-2)" }}>
                    <div className="h-1 rounded-full transition-all" style={{ width: `${t.latestScore}%`, background: tool?.accent ?? "var(--signal)" }} />
                  </div>
                  <span className="text-xs font-mono w-6 text-right shrink-0" style={{ color: tool?.accent ?? "var(--signal)" }}>{t.latestScore}</span>
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
            <p className="text-xs text-center" style={{ color: "var(--text-tertiary)" }}>
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
              <p className="eyebrow mb-2" style={{ color: "var(--text-tertiary)" }}>Trajectory</p>
              <Badge style={{
                background: `${trajectoryColor[synthesis.overall_trajectory as keyof typeof trajectoryColor] ?? "var(--color-warning)"}18`,
                color: trajectoryColor[synthesis.overall_trajectory as keyof typeof trajectoryColor] ?? "var(--color-warning)",
              }}>
                {String(synthesis.overall_trajectory)}
              </Badge>
              {Boolean(synthesis.summary) && (
                <p className="text-xs mt-2" style={{ color: "var(--text-tertiary)" }}>{String(synthesis.summary)}</p>
              )}
            </Panel>
          )}

          {((): Array<{ pattern: string; evidence?: string; implication?: string } | string> => {
            const p = synthesis.patterns;
            return Array.isArray(p) ? p as Array<{ pattern: string; evidence?: string; implication?: string } | string> : [];
          })().length > 0 && (
            <Panel>
              <p className="eyebrow mb-2" style={{ color: "var(--text-tertiary)" }}>Patterns</p>
              <div className="space-y-2">
                {(synthesis.patterns as Array<{ pattern: string; evidence?: string; implication?: string } | string>).slice(0, 3).map((p, i) => (
                  <div key={i} className="px-3 py-2 rounded-lg" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)" }}>
                    <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                      {typeof p === "string" ? p : p.pattern}
                    </p>
                    {typeof p !== "string" && p.implication && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{p.implication}</p>
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
              <p className="eyebrow mb-2" style={{ color: "var(--color-danger)" }}>Drift Signals</p>
              <div className="space-y-1.5">
                {(synthesis.drift_signals as Array<{ signal?: string; severity?: string } | string>).slice(0, 3).map((d, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <AlertTriangle size={10} style={{ color: "var(--color-danger)", marginTop: 1, flexShrink: 0 }} />
                    <span style={{ color: "var(--text-tertiary)" }}>
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
              <p className="eyebrow mb-2" style={{ color: "var(--signal)" }}>Strategic Moves</p>
              <div className="space-y-1.5">
                {(synthesis.strategic_moves as string[]).slice(0, 3).map((m, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs">
                    <ChevronRight size={10} style={{ color: "var(--signal)", marginTop: 1, flexShrink: 0 }} />
                    <span style={{ color: "var(--text-primary)" }}>{m}</span>
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
