import { Panel, NoctraButton } from "@/components/Primitives";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import type { ProjectState } from "@/lib/project-state";
import { Brain, TrendingUp, ArrowRight } from "lucide-react";
import { SCORE_COLOR, type Report } from "./types";

interface TwinTabProps {
  reports: Report[];
  projectState: ProjectState | null;
  navigate: (url: string) => void;
}

export function TwinTab({ reports, projectState, navigate }: TwinTabProps) {
  return (
    <div className="space-y-4">
      <Panel>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,41,215,0.1)", border: "1px solid rgba(255,41,215,0.25)" }}>
            <Brain size={18} style={{ color: "var(--noctra-magenta)" }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--noctra-text)" }}>Product Twin</p>
            <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>AI synthesis with full cross-tool memory</p>
          </div>
        </div>
        <p className="text-sm mb-4" style={{ color: "var(--noctra-text-soft)" }}>
          The Product Twin has context from all {reports.length} report{reports.length !== 1 ? "s" : ""} in this project. Ask it to synthesize findings, identify contradictions, or suggest your next move.
        </p>
        <div className="space-y-2 mb-4">
          {["What are the biggest risks in this project?", "Summarize all intelligence findings so far", "What should I work on next?", "Are there any contradictions between my reports?"].map((q) => (
            <div key={q} className="px-3 py-2 rounded-lg text-xs" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-muted)" }}>{q}</div>
          ))}
        </div>
        <NoctraButton onClick={() => navigate("/app/twin")}><Brain size={13} /> Open Product Twin <ArrowRight size={11} /></NoctraButton>
      </Panel>
      {projectState && projectState.coveredTools.length > 0 ? (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--noctra-text-muted)" }}>Project Intelligence Loaded</p>
          <div className="space-y-1.5">
            {projectState.coveredTools.map((key) => {
              const t = TOOL_BY_KEY[key as keyof typeof TOOL_BY_KEY];
              const rep = projectState.latestReportByTool[key];
              if (!t || !rep) return null;
              return (
                <div key={key} className="flex items-center gap-3 py-1">
                  <t.icon size={12} style={{ color: t.accent, flexShrink: 0 }} />
                  <span className="text-xs flex-1" style={{ color: "var(--noctra-text-soft)" }}>{t.label}</span>
                  {rep.score != null ? <span className="text-xs font-mono" style={{ color: SCORE_COLOR(rep.score) }}>{rep.score}/100</span> : null}
                  <TrendingUp size={10} style={{ color: "var(--noctra-emerald)" }} />
                </div>
              );
            })}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
