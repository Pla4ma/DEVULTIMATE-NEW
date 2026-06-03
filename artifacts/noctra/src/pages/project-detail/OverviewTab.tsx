import { Panel, NoctraButton, ProgressBar, ScoreRing } from "@/components/Primitives";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import type { ProjectState } from "@/lib/project-state";
import { RISK_SEV_COLOR, type RadarRisk } from "@/lib/risk-radar";
import { ArrowRight, FileText, CheckSquare, FlaskConical, ShieldAlert, AlertTriangle, RefreshCw, Copy, Check, Download, Terminal } from "lucide-react";
import { INTELLIGENCE_TOOLS, SCORE_COLOR, type Project, type Report, type Task, type ProofSignal, type Tab } from "./types";
import { ROUTES } from "@/lib/routes";

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
        <div className="flex items-center justify-between gap-4 px-4 py-4 rounded-xl" style={{ background: "var(--signal-soft)", border: "1px solid var(--border-default)" }}>
          <div className="flex items-start gap-3 min-w-0">
            <ArrowRight size={16} style={{ color: "var(--signal)", flexShrink: 0, marginTop: 2 }} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-display" style={{ color: "var(--text-primary)" }}>{projectState.nextAction.title}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{projectState.nextAction.reason}</p>
            </div>
          </div>
          <button onClick={() => navigate(projectState.nextAction.href)} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "var(--signal)", color: "var(--surface-0)" }}>
            Go <ArrowRight size={11} />
          </button>
        </div>
      ) : null}

      {projectState?.topBlocker ? (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ background: "var(--color-danger-soft)", border: "1px solid var(--color-danger)" }}>
          <ShieldAlert size={14} style={{ color: "var(--color-danger)", flexShrink: 0, marginTop: 1 }} />
          <div>
            <p className="eyebrow mb-0.5" style={{ color: "var(--color-danger)" }}>Top Blocker</p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{projectState.topBlocker}</p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Reports", value: reports.length, icon: FileText, color: "var(--accent-violet)", onClick: () => onTabChange("reports") },
          { label: "Tasks", value: tasks.length, icon: CheckSquare, color: "var(--color-success)", onClick: () => onTabChange("execution") },
          { label: "Proof Signals", value: proofSignals.length, icon: FlaskConical, color: "var(--color-success)", onClick: () => onTabChange("proof") },
        ].map(({ label, value, icon: Icon, color, onClick }) => (
          <Panel key={label} className="glass">
            <button className="w-full text-left" onClick={onClick}>
              <div className="flex items-center gap-2 mb-2"><Icon size={13} style={{ color }} /><span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{label}</span></div>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            </button>
          </Panel>
        ))}
      </div>

      {projectState ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Panel className="glass">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>Launch Readiness</p>
              <span className="text-xs font-mono" style={{ color: projectState.readiness >= 70 ? "var(--color-success)" : projectState.readiness >= 40 ? "var(--color-warning)" : "var(--color-danger)" }}>{projectState.readiness}%</span>
            </div>
            <ProgressBar value={projectState.readiness} color={projectState.readiness >= 70 ? "var(--color-success)" : projectState.readiness >= 40 ? "var(--color-warning)" : "var(--color-danger)"} />
            <p className="text-xs mt-1.5 capitalize" style={{ color: "var(--text-tertiary)" }}>Phase: {projectState.stage.replace("_", " ")}</p>
          </Panel>
          {tasks.length > 0 ? (
            <Panel className="glass">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>Task Completion</p>
                <span className="text-xs font-mono" style={{ color: "var(--color-success)" }}>{projectState.taskCompletionRate}%</span>
              </div>
              <ProgressBar value={projectState.completedTasks} max={tasks.length} color="var(--color-success)" />
              <p className="text-xs mt-1.5" style={{ color: "var(--text-tertiary)" }}>{projectState.completedTasks}/{tasks.length} completed</p>
            </Panel>
          ) : null}
        </div>
      ) : null}

      {projectState && projectState.coveredTools.length > 0 ? (
        <Panel className="glass">
          <p className="eyebrow mb-4" style={{ color: "var(--text-tertiary)" }}>Scores</p>
          <div className="flex flex-wrap gap-5 justify-center">
            {INTELLIGENCE_TOOLS.filter((k) => projectState.latestReportByTool[k]).map((key) => {
              const t = TOOL_BY_KEY[key as keyof typeof TOOL_BY_KEY];
              const rep = projectState.latestReportByTool[key];
              if (!t || !rep) return null;
              return (
                <button key={key} className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity" onClick={() => navigate(ROUTES.reportDetail(rep.id))}>
                  <ScoreRing value={rep.score ?? 0} size={64} stroke={5} label={t.short} color={t.accent} />
                </button>
              );
            })}
          </div>
          {projectState.missingTools.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t" style={{ borderColor: "var(--border-default)" }}>
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Not run:</span>
              {projectState.missingTools.map((key) => {
                const t = TOOL_BY_KEY[key as keyof typeof TOOL_BY_KEY];
                if (!t) return null;
                return <button key={key} onClick={() => navigate(t.route)} className="text-xs px-2 py-0.5 rounded-full hover:opacity-80" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-tertiary)" }}>{t.label}</button>;
              })}
            </div>
          ) : null}
        </Panel>
      ) : null}

      {projectState && projectState.failedGates.length > 0 ? (
        <Panel className="glass">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={13} style={{ color: "var(--color-danger)" }} />
            <p className="eyebrow mb-2" style={{ color: "var(--color-danger)" }}>Failed Gates ({projectState.failedGates.length})</p>
          </div>
          <div className="space-y-1">
            {projectState.failedGates.map((g, i) => (
              <div key={i} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg" style={{ background: "var(--color-danger-soft)", border: "1px solid var(--color-danger-soft)" }}>
                <span style={{ color: "var(--color-danger)" }}>✗</span>
                <span style={{ color: "var(--text-tertiary)" }}>{g}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate(ROUTES.doctor)} className="flex items-center gap-1.5 mt-3 text-xs" style={{ color: "var(--color-danger)" }}>
            <RefreshCw size={11} /> Re-scan with Product Doctor
          </button>
        </Panel>
      ) : null}

      {risks.length > 0 ? (
        <Panel className="glass">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert size={13} style={{ color: "var(--color-warning)" }} />
            <p className="eyebrow mb-3" style={{ color: "var(--color-warning)" }}>Risks & Blockers</p>
            <span className="ml-auto text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>{risks.length} risk{risks.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="space-y-2">
            {risks.slice(0, 5).map((risk) => (
              <div key={risk.id} className="glass flex items-start gap-3 px-3 py-2">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: RISK_SEV_COLOR[risk.severity] }} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{risk.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{risk.recommendedFix}</p>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium uppercase" style={{ background: `${RISK_SEV_COLOR[risk.severity]}15`, color: RISK_SEV_COLOR[risk.severity] }}>{risk.severity}</span>
              </div>
            ))}
            {risks.length > 5 ? <button onClick={() => onTabChange("history")} className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>+{risks.length - 5} more → view in History tab</button> : null}
          </div>
        </Panel>
      ) : null}

      {projectState ? (
        <Panel className="glass">
          <p className="eyebrow mb-3" style={{ color: "var(--text-tertiary)" }}>Export & Handoff</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button onClick={onCopyBrief} className="glass flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-left" style={{ color: briefCopied ? "var(--color-success)" : "var(--text-primary)" }}>
              {briefCopied ? <Check size={12} style={{ color: "var(--color-success)" }} /> : <Copy size={12} />}
              <div><p>{briefCopied ? "Copied!" : "Copy Project Brief"}</p><p style={{ color: "var(--text-tertiary)" }}>Markdown status report</p></div>
            </button>
            <button onClick={onDownloadBrief} className="glass flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-left" style={{ color: "var(--text-primary)" }}>
              <Download size={12} />
              <div><p>Download Brief</p><p style={{ color: "var(--text-tertiary)" }}>Save as .md file</p></div>
            </button>
            <button onClick={onCopyPrompt} className="glass flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-left sm:col-span-2" style={{ background: promptCopied ? "var(--signal-soft)" : undefined, border: promptCopied ? "1px solid var(--accent-cyan-glow)" : undefined, color: promptCopied ? "var(--signal)" : "var(--text-primary)" }}>
              {promptCopied ? <Check size={12} style={{ color: "var(--signal)" }} /> : <Terminal size={12} />}
              <div><p>{promptCopied ? "Prompt copied!" : "Copy Dev Agent Prompt"}</p><p style={{ color: "var(--text-tertiary)" }}>Paste into Replit Agent, Cursor, or Windsurf</p></div>
            </button>
          </div>
        </Panel>
      ) : null}

      <Panel className="glass">
          <p className="eyebrow mb-3" style={{ color: "var(--text-tertiary)" }}>Run Report</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { label: "Idea Checker", href: ROUTES.idea, color: "var(--accent-violet)" },
            { label: "Reality Compiler", href: ROUTES.reality, color: "var(--color-warning)" },
            { label: "Proof Engine", href: ROUTES.proof, color: "var(--color-success)" },
            { label: "MVP Planner", href: ROUTES.mvp, color: "var(--signal)" },
            { label: "Product Doctor", href: ROUTES.doctor, color: "var(--color-danger)" },
            { label: "Launch Room", href: ROUTES.launch, color: "var(--color-warning)" },
          ].map(({ label, href, color }) => (
            <button key={href} onClick={() => navigate(href)} className="glass px-3 py-2 text-xs font-medium text-left hover:opacity-80" style={{ color }}>{label}</button>
          ))}
        </div>
      </Panel>
    </div>
  );
}
