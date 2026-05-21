import { Panel, NoctraButton, ProgressBar, ScoreRing } from "@/components/Primitives";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import type { ProjectState } from "@/lib/project-state";
import { RISK_SEV_COLOR, type RadarRisk } from "@/lib/risk-radar";
import { ArrowRight, FileText, CheckSquare, FlaskConical, ShieldAlert, AlertTriangle, RefreshCw, Copy, Check, Download, Terminal } from "lucide-react";
import { INTELLIGENCE_TOOLS, SCORE_COLOR, type Project, type Report, type Task, type ProofSignal, type Tab } from "./types";

interface OverviewTabProps {
  project: Project | null;
  projectState: ProjectState | null;
  reports: Report[];
  tasks: Task[];
  proofSignals: ProofSignal[];
  risks: RadarRisk[];
  navigate: (url: string) => void;
  onTabChange: (tab: Tab) => void;
  briefCopied: boolean;
  promptCopied: boolean;
  onCopyBrief: () => void;
  onDownloadBrief: () => void;
  onCopyPrompt: () => void;
}

export function OverviewTab({ project, projectState, reports, tasks, proofSignals, risks, navigate, onTabChange, briefCopied, promptCopied, onCopyBrief, onDownloadBrief, onCopyPrompt }: OverviewTabProps) {
  return (
    <div className="space-y-4">
      {projectState ? (
        <div className="flex items-center justify-between gap-4 px-4 py-4 rounded-xl" style={{ background: "rgba(61,216,255,0.06)", border: "1px solid rgba(61,216,255,0.2)" }}>
          <div className="flex items-start gap-3 min-w-0">
            <ArrowRight size={16} style={{ color: "var(--noctra-cyan)", flexShrink: 0, marginTop: 2 }} />
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--noctra-text)" }}>{projectState.nextAction.title}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{projectState.nextAction.reason}</p>
            </div>
          </div>
          <button onClick={() => navigate(projectState.nextAction.href)} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "var(--noctra-cyan)", color: "#000" }}>
            Go <ArrowRight size={11} />
          </button>
        </div>
      ) : null}

      {projectState?.topBlocker ? (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.2)" }}>
          <ShieldAlert size={14} style={{ color: "var(--noctra-rose)", flexShrink: 0, marginTop: 1 }} />
          <div>
            <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--noctra-rose)" }}>Top Blocker</p>
            <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{projectState.topBlocker}</p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Reports", value: reports.length, icon: FileText, color: "var(--noctra-violet)", onClick: () => onTabChange("reports") },
          { label: "Tasks", value: tasks.length, icon: CheckSquare, color: "var(--noctra-emerald)", onClick: () => onTabChange("execution") },
          { label: "Proof Signals", value: proofSignals.length, icon: FlaskConical, color: "var(--noctra-emerald)", onClick: () => onTabChange("proof") },
        ].map(({ label, value, icon: Icon, color, onClick }) => (
          <Panel key={label}>
            <button className="w-full text-left" onClick={onClick}>
              <div className="flex items-center gap-2 mb-2"><Icon size={13} style={{ color }} /><span className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{label}</span></div>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            </button>
          </Panel>
        ))}
      </div>

      {projectState ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Panel>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium" style={{ color: "var(--noctra-text-muted)" }}>Launch Readiness</p>
              <span className="text-xs font-mono" style={{ color: projectState.readiness >= 70 ? "var(--noctra-emerald)" : projectState.readiness >= 40 ? "var(--noctra-amber)" : "var(--noctra-rose)" }}>{projectState.readiness}%</span>
            </div>
            <ProgressBar value={projectState.readiness} color={projectState.readiness >= 70 ? "var(--noctra-emerald)" : projectState.readiness >= 40 ? "var(--noctra-amber)" : "var(--noctra-rose)"} />
            <p className="text-xs mt-1.5 capitalize" style={{ color: "var(--noctra-text-muted)" }}>Phase: {projectState.stage.replace("_", " ")}</p>
          </Panel>
          {tasks.length > 0 ? (
            <Panel>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium" style={{ color: "var(--noctra-text-muted)" }}>Task Completion</p>
                <span className="text-xs font-mono" style={{ color: "var(--noctra-emerald)" }}>{projectState.taskCompletionRate}%</span>
              </div>
              <ProgressBar value={projectState.completedTasks} max={tasks.length} color="var(--noctra-emerald)" />
              <p className="text-xs mt-1.5" style={{ color: "var(--noctra-text-muted)" }}>{projectState.completedTasks}/{tasks.length} completed</p>
            </Panel>
          ) : null}
        </div>
      ) : null}

      {projectState && projectState.coveredTools.length > 0 ? (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--noctra-text-muted)" }}>Scores</p>
          <div className="flex flex-wrap gap-5 justify-center">
            {INTELLIGENCE_TOOLS.filter((k) => projectState.latestReportByTool[k]).map((key) => {
              const t = TOOL_BY_KEY[key as keyof typeof TOOL_BY_KEY];
              const rep = projectState.latestReportByTool[key];
              if (!t || !rep) return null;
              return (
                <button key={key} className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity" onClick={() => navigate(`/app/reports/${rep.id}`)}>
                  <ScoreRing value={rep.score ?? 0} size={64} stroke={5} label={t.short} color={t.accent} />
                </button>
              );
            })}
          </div>
          {projectState.missingTools.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t" style={{ borderColor: "var(--noctra-border)" }}>
              <span className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>Not run:</span>
              {projectState.missingTools.map((key) => {
                const t = TOOL_BY_KEY[key as keyof typeof TOOL_BY_KEY];
                if (!t) return null;
                return <button key={key} onClick={() => navigate(t.route)} className="text-xs px-2 py-0.5 rounded-full hover:opacity-80" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-muted)" }}>{t.label}</button>;
              })}
            </div>
          ) : null}
        </Panel>
      ) : null}

      {projectState && projectState.failedGates.length > 0 ? (
        <Panel>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={13} style={{ color: "var(--noctra-rose)" }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-rose)" }}>Failed Gates ({projectState.failedGates.length})</p>
          </div>
          <div className="space-y-1">
            {projectState.failedGates.map((g, i) => (
              <div key={i} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg" style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.15)" }}>
                <span style={{ color: "var(--noctra-rose)" }}>✗</span>
                <span style={{ color: "var(--noctra-text-muted)" }}>{g}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate("/app/doctor")} className="flex items-center gap-1.5 mt-3 text-xs" style={{ color: "var(--noctra-rose)" }}>
            <RefreshCw size={11} /> Re-scan with Product Doctor
          </button>
        </Panel>
      ) : null}

      {risks.length > 0 ? (
        <Panel>
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert size={13} style={{ color: "var(--noctra-amber)" }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-amber)" }}>Risks & Blockers</p>
            <span className="ml-auto text-xs font-mono" style={{ color: "var(--noctra-text-muted)" }}>{risks.length} risk{risks.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="space-y-2">
            {risks.slice(0, 5).map((risk) => (
              <div key={risk.id} className="flex items-start gap-3 px-3 py-2 rounded-lg" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: RISK_SEV_COLOR[risk.severity] }} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium" style={{ color: "var(--noctra-text)" }}>{risk.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>{risk.recommendedFix}</p>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium uppercase" style={{ background: `${RISK_SEV_COLOR[risk.severity]}15`, color: RISK_SEV_COLOR[risk.severity] }}>{risk.severity}</span>
              </div>
            ))}
            {risks.length > 5 ? <button onClick={() => onTabChange("history")} className="text-xs mt-1" style={{ color: "var(--noctra-text-muted)" }}>+{risks.length - 5} more → view in History tab</button> : null}
          </div>
        </Panel>
      ) : null}

      {projectState ? (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--noctra-text-muted)" }}>Export & Handoff</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button onClick={onCopyBrief} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium text-left" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: briefCopied ? "var(--noctra-emerald)" : "var(--noctra-text)" }}>
              {briefCopied ? <Check size={12} style={{ color: "var(--noctra-emerald)" }} /> : <Copy size={12} />}
              <div><p>{briefCopied ? "Copied!" : "Copy Project Brief"}</p><p style={{ color: "var(--noctra-text-muted)" }}>Markdown status report</p></div>
            </button>
            <button onClick={onDownloadBrief} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium text-left" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }}>
              <Download size={12} />
              <div><p>Download Brief</p><p style={{ color: "var(--noctra-text-muted)" }}>Save as .md file</p></div>
            </button>
            <button onClick={onCopyPrompt} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium text-left sm:col-span-2" style={{ background: promptCopied ? "rgba(61,216,255,0.08)" : "var(--noctra-surface2)", border: `1px solid ${promptCopied ? "rgba(61,216,255,0.25)" : "var(--noctra-border)"}`, color: promptCopied ? "var(--noctra-cyan)" : "var(--noctra-text)" }}>
              {promptCopied ? <Check size={12} style={{ color: "var(--noctra-cyan)" }} /> : <Terminal size={12} />}
              <div><p>{promptCopied ? "Prompt copied!" : "Copy Dev Agent Prompt"}</p><p style={{ color: "var(--noctra-text-muted)" }}>Paste into Replit Agent, Cursor, or Windsurf</p></div>
            </button>
          </div>
        </Panel>
      ) : null}

      <Panel>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--noctra-text-muted)" }}>Run Report</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: "Idea Checker", href: "/app/idea", color: "var(--noctra-violet)" },
            { label: "Reality Compiler", href: "/app/reality", color: "var(--noctra-amber)" },
            { label: "Proof Engine", href: "/app/proof", color: "var(--noctra-emerald)" },
            { label: "MVP Planner", href: "/app/mvp", color: "var(--noctra-cyan)" },
            { label: "Product Doctor", href: "/app/doctor", color: "var(--noctra-rose)" },
            { label: "Launch Room", href: "/app/launch", color: "var(--noctra-amber)" },
          ].map(({ label, href, color }) => (
            <button key={href} onClick={() => navigate(href)} className="px-3 py-2 rounded-lg text-xs font-medium text-left hover:opacity-80" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color }}>{label}</button>
          ))}
        </div>
      </Panel>
    </div>
  );
}
