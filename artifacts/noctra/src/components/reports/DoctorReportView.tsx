import { useState } from "react";
import { useLocation } from "wouter";
import { ScoreRing, Badge, Panel, EmptyState, StatusDot, ProgressBar, NoctraButton } from "@/components/Primitives";
import { Stethoscope, Rocket, CheckSquare, Copy, Check, Download, AlertTriangle, ExternalLink, FileText, Shield, Bug, ListOrdered, GitBranch, Terminal, RefreshCw, FolderOpen } from "lucide-react";
import { createTask } from "@/lib/repository";
import { downloadMarkdown } from "@/lib/export";
import { generateDevAgentPrompt } from "@/lib/brief-generator";

type Gate = { name: string; status: "GREEN" | "YELLOW" | "RED"; evidence?: string[]; how_to_fix?: string; why?: string };
type Issue = { severity: string; issue: string; fix?: string; file?: string; line?: number; explanation?: string };
type FixPlanItem = { title: string; priority: string; effort_hours?: number; files?: string[]; acceptance_criteria?: string[] };
type EvidenceItem = { filePath: string; lineNumber?: number; snippet?: string; severity: string; explanation: string; signal: string };

type ScanData = {
  fileCount?: number;
  totalLines?: number;
  framework?: string;
  packageManager?: string;
  languages?: Record<string, number>;
  repoMap?: {
    components: string[];
    routes: string[];
    apiFiles: string[];
    hooks: string[];
    utilities: string[];
    services: string[];
    authFiles: string[];
    dbFiles: string[];
    aiFiles: string[];
    paymentFiles: string[];
    uploadFiles: string[];
    configFiles: string[];
    testFiles: string[];
    deploymentFiles: string[];
    docsFiles: string[];
  };
  evidenceIndex?: EvidenceItem[];
};

type AlignmentData = {
  missingProductRequirements?: Array<{ title: string; description: string; severity: string }>;
  builtButUnnecessary?: Array<{ title: string; description: string; severity: string }>;
  riskyImplementationChoices?: Array<{ title: string; description: string; severity: string }>;
  MVPFeatureCoverage?: Array<{ feature: string; status: string }>;
  recommendedCodeTasks?: Array<{ title: string; priority: string; reason: string }>;
  launchBlockers?: string[];
};

type DoctorData = {
  verdict?: string;
  summary?: string;
  health_score?: number;
  launch_readiness?: string;
  launch_readiness_score?: number;
  score?: number;
  top_blocker?: string;
  recommended_action?: string;
  gates?: Gate[];
  issues?: Issue[];
  repair_queue?: string[];
  fix_plan?: FixPlanItem[];
  red_gates?: string[];
  yellow_gates?: string[];
  evidence?: EvidenceItem[];
  alignment?: AlignmentData;
  next_actions?: string[];
  critical_issues?: string[];
};

type Props = {
  report: { id: string; payload: unknown; score?: number | null; project_id?: string | null; [key: string]: unknown };
  projectId?: string;
};

const GATE_ICON = {
  GREEN: <Check size={12} style={{ color: "var(--noctra-emerald)" }} />,
  YELLOW: <AlertTriangle size={12} style={{ color: "var(--noctra-amber)" }} />,
  RED: <Shield size={12} style={{ color: "var(--noctra-rose)" }} />,
};
const GATE_COLOR = {
  GREEN: "var(--noctra-emerald)",
  YELLOW: "var(--noctra-amber)",
  RED: "var(--noctra-rose)",
};
const SEV_COLOR: Record<string, string> = {
  CRITICAL: "var(--noctra-rose)", HIGH: "var(--noctra-amber)", MEDIUM: "var(--noctra-amber)", LOW: "var(--noctra-emerald)",
  error: "var(--noctra-rose)", warning: "var(--noctra-amber)", info: "var(--noctra-cyan)",
};

export function DoctorReportView({ report, projectId }: Props) {
  const [, navigate] = useLocation();
  const p = report.payload as Record<string, unknown>;
  const payloadData = (p?.data ?? p) as DoctorData | null;
  const scan = p?.scan as ScanData | null;
  const [briefCopied, setBriefCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);

  if (!payloadData) return <EmptyState icon={<Stethoscope size={24} />} title="No data available" />;

  const score = payloadData.health_score ?? payloadData.score ?? report.score ?? 0;
  const gates = payloadData.gates ?? [];
  const redGates = gates.filter(g => g.status === "RED");
  const yellowGates = gates.filter(g => g.status === "YELLOW");
  const greenGates = gates.filter(g => g.status === "GREEN");
  const issues = payloadData.issues ?? [];
  const repairQueue = payloadData.repair_queue ?? [];
  const fixPlan = payloadData.fix_plan ?? [];
  const evidence = payloadData.evidence ?? scan?.evidenceIndex ?? [];
  const nextActions = payloadData.next_actions ?? [];
  const alignment = payloadData.alignment ?? null;

  const healthColor = score >= 70 ? "var(--noctra-emerald)" : score >= 40 ? "var(--noctra-amber)" : "var(--noctra-rose)";
  const readinessScore = payloadData.launch_readiness_score ?? score;

  async function copyPrompt() {
    const prompt = generateDevAgentPrompt({
      project: { name: "Current Project", idea: payloadData!.summary },
      state: {
        phase: "launch-prep",
        readiness: readinessScore,
        doctorScore: score,
        failedGates: redGates.map(g => g.name),
        topBlocker: payloadData!.top_blocker ?? null,
        nextAction: { title: payloadData!.recommended_action ?? "Fix launch blockers", href: "/app/tasks", reason: "", description: "", priority: "high", tool: "doctor" },
        ideaScore: 0, realityScore: 0, proofScore: 0, swarmScore: 0, mvpScore: 0, launchScore: 0,
        overallScore: 0, coveredTools: [], missingTools: [], openP0Tasks: 0, openP1Tasks: 0,
        latestReportByTool: {}, proofSignalCount: 0, scanCount: 0, totalReports: 0,
        totalTasks: 0, completedTasks: 0, taskCompletionRate: 0,
      },
      tasks: [],
      doctorPayload: report.payload,
    });
    try {
      await navigator.clipboard.writeText(prompt);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2500);
    } catch {
      downloadPrompt();
    }
  }

  function downloadPrompt() {
    const prompt = generateDevAgentPrompt({
      project: { name: "Current Project", idea: payloadData!.summary },
      state: {
        phase: "launch-prep",
        readiness: readinessScore,
        doctorScore: score,
        failedGates: redGates.map(g => g.name),
        topBlocker: payloadData!.top_blocker ?? null,
        nextAction: { title: payloadData!.recommended_action ?? "Fix launch blockers", href: "/app/tasks", reason: "", description: "", priority: "high", tool: "doctor" },
        ideaScore: 0, realityScore: 0, proofScore: 0, swarmScore: 0, mvpScore: 0, launchScore: 0,
        overallScore: 0, coveredTools: [], missingTools: [], openP0Tasks: 0, openP1Tasks: 0,
        latestReportByTool: {}, proofSignalCount: 0, scanCount: 0, totalReports: 0,
        totalTasks: 0, completedTasks: 0, taskCompletionRate: 0,
      },
      tasks: [],
      doctorPayload: report.payload,
    });
    downloadMarkdown("next-build-prompt", prompt);
  }

  return (
    <div className="space-y-4">
      {/* ===== 1. Executive Verdict ===== */}
      <div className="flex gap-4 items-start flex-wrap">
        <ScoreRing value={score} label="Health" color={healthColor} />
        <div className="flex-1 min-w-0">
          {payloadData.verdict && <p className="text-sm font-semibold mb-1" style={{ color: "var(--noctra-text)" }}>{payloadData.verdict}</p>}
          {payloadData.summary && <p className="text-xs mb-2" style={{ color: "var(--noctra-text-soft)" }}>{payloadData.summary}</p>}
          <div className="flex items-center gap-3 flex-wrap">
            {payloadData.launch_readiness && (
              <Badge style={{
                background: payloadData.launch_readiness === "GO" ? "rgba(52,211,153,0.1)" : payloadData.launch_readiness === "CONDITIONAL" ? "rgba(245,158,11,0.1)" : "rgba(244,63,94,0.1)",
                color: payloadData.launch_readiness === "GO" ? "var(--noctra-emerald)" : payloadData.launch_readiness === "CONDITIONAL" ? "var(--noctra-amber)" : "var(--noctra-rose)",
              }}>
                Launch: {payloadData.launch_readiness}
              </Badge>
            )}
            {payloadData.top_blocker && <Badge style={{ background: "rgba(244,63,94,0.1)", color: "var(--noctra-rose)" }}>Blocker: {payloadData.top_blocker}</Badge>}
            {redGates.length > 0 && <Badge style={{ background: "rgba(244,63,94,0.1)", color: "var(--noctra-rose)" }}>{redGates.length} RED gates</Badge>}
            {yellowGates.length > 0 && <Badge style={{ background: "rgba(245,158,11,0.1)", color: "var(--noctra-amber)" }}>{yellowGates.length} YELLOW</Badge>}
            {greenGates.length > 0 && <Badge style={{ background: "rgba(52,211,153,0.1)", color: "var(--noctra-emerald)" }}>{greenGates.length} GREEN</Badge>}
          </div>
          {payloadData.recommended_action && (
            <p className="text-xs mt-2 flex items-center gap-1" style={{ color: "var(--noctra-cyan)" }}>
              <Terminal size={10} /> Next: {payloadData.recommended_action}
            </p>
          )}
        </div>
      </div>

      {/* ===== 2. Launch Gates ===== */}
      {gates.length > 0 && (
        <Panel>
          <div className="flex items-center gap-2 mb-3">
            <Shield size={13} style={{ color: "var(--noctra-rose)" }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Launch Gates</p>
            <span className="ml-auto text-xs font-mono" style={{ color: "var(--noctra-text-muted)" }}>{redGates.length} RED · {yellowGates.length} YELLOW · {greenGates.length} GREEN</span>
          </div>
          <div className="space-y-2">
            {gates.map((g, i) => (
              <div key={i} className="rounded-xl p-3" style={{
                background: g.status === "RED" ? "rgba(244,63,94,0.04)" : g.status === "YELLOW" ? "rgba(245,158,11,0.04)" : "rgba(52,211,153,0.04)",
                border: `1px solid ${GATE_COLOR[g.status]}22`,
              }}>
                <div className="flex items-center gap-2 mb-1">
                  {GATE_ICON[g.status]}
                  <span className="text-sm font-medium" style={{ color: "var(--noctra-text)" }}>{g.name}</span>
                  <Badge style={{ background: `${GATE_COLOR[g.status]}18`, color: GATE_COLOR[g.status], fontSize: "10px", marginLeft: "auto" }}>{g.status}</Badge>
                </div>
                {g.evidence && g.evidence.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {g.evidence.map((e, j) => (
                      <li key={j} className="text-xs flex items-start gap-1.5" style={{ color: "var(--noctra-text-muted)" }}>
                        <span style={{ color: GATE_COLOR[g.status] }}>•</span> {e}
                      </li>
                    ))}
                  </ul>
                )}
                {g.why && (
                  <p className="text-xs mt-1.5 italic" style={{ color: "var(--noctra-text-muted)" }}>
                    Why: {g.why}
                  </p>
                )}
                {g.how_to_fix && (
                  <div className="mt-1.5 px-2 py-1 rounded-lg text-xs" style={{
                    background: g.status === "RED" ? "rgba(244,63,94,0.06)" : g.status === "YELLOW" ? "rgba(245,158,11,0.06)" : "rgba(52,211,153,0.06)",
                    color: GATE_COLOR[g.status],
                  }}>
                    Fix: {g.how_to_fix}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ===== 3. Evidence Index ===== */}
      {evidence.length > 0 && (
        <Panel>
          <div className="flex items-center gap-2 mb-3">
            <Bug size={13} style={{ color: "var(--noctra-amber)" }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Evidence Index</p>
            <span className="ml-auto text-xs font-mono" style={{ color: "var(--noctra-text-muted)" }}>{evidence.length} items</span>
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {evidence.slice(0, 20).map((e, i) => (
              <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded-lg text-xs" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: SEV_COLOR[e.severity] ?? "var(--noctra-text-muted)" }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-[10px]" style={{ color: "var(--noctra-text-muted)" }}>{e.filePath}{e.lineNumber ? `:${e.lineNumber}` : ""}</span>
                    <Badge style={{ fontSize: "9px", background: `${SEV_COLOR[e.severity] ?? "var(--noctra-text-muted)"}18`, color: SEV_COLOR[e.severity] ?? "var(--noctra-text-muted)" }}>{e.severity}</Badge>
                  </div>
                  <p className="mt-0.5" style={{ color: "var(--noctra-text-soft)" }}>{e.explanation || e.signal || e.snippet}</p>
                </div>
              </div>
            ))}
            {evidence.length > 20 && (
              <p className="text-xs text-center pt-1" style={{ color: "var(--noctra-text-muted)" }}>+{evidence.length - 20} more items</p>
            )}
          </div>
        </Panel>
      )}

      {/* ===== 4. Repair Queue ===== */}
      {(repairQueue.length > 0 || fixPlan.length > 0) && (
        <Panel>
          <div className="flex items-center gap-2 mb-3">
            <ListOrdered size={13} style={{ color: "var(--noctra-amber)" }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Repair Queue</p>
          </div>
          <div className="space-y-2">
            {repairQueue.map((item, i) => (
              <div key={`rq-${i}`} className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                <span className="text-xs font-mono shrink-0 mt-0.5" style={{ color: "var(--noctra-amber)" }}>#{i + 1}</span>
                <p className="text-xs" style={{ color: "var(--noctra-text-soft)" }}>{item}</p>
              </div>
            ))}
            {fixPlan.map((item, i) => (
              <div key={`fp-${i}`} className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                <span className="text-xs font-mono shrink-0 mt-0.5" style={{ color: "var(--noctra-amber)" }}>#{repairQueue.length + i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium" style={{ color: "var(--noctra-text)" }}>{item.title}</p>
                    {item.priority && <Badge style={{ fontSize: "9px", background: item.priority === "high" ? "rgba(244,63,94,0.1)" : "rgba(245,158,11,0.1)", color: item.priority === "high" ? "var(--noctra-rose)" : "var(--noctra-amber)" }}>{item.priority}</Badge>}
                    {item.effort_hours != null && <span className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>~{item.effort_hours}h</span>}
                  </div>
                  {item.files && item.files.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.files.map((f, j) => <Badge key={j} style={{ fontSize: "9px" }}>{f}</Badge>)}
                    </div>
                  )}
                  {item.acceptance_criteria && item.acceptance_criteria.length > 0 && (
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>AC: {item.acceptance_criteria.join("; ")}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ===== 5. Codebase/Product Alignment ===== */}
      {alignment && (
        <Panel>
          <div className="flex items-center gap-2 mb-3">
            <GitBranch size={13} style={{ color: "var(--noctra-cyan)" }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Codebase / Product Alignment</p>
          </div>
          {alignment.missingProductRequirements && alignment.missingProductRequirements.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-medium mb-1" style={{ color: "var(--noctra-rose)" }}>Missing Product Requirements</p>
              {alignment.missingProductRequirements.map((m, i) => (
                <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded-lg mb-1 text-xs" style={{ background: "rgba(244,63,94,0.04)", border: "1px solid rgba(244,63,94,0.15)" }}>
                  <AlertTriangle size={10} style={{ color: "var(--noctra-rose)", marginTop: 2, flexShrink: 0 }} />
                  <div><span className="font-medium" style={{ color: "var(--noctra-text)" }}>{m.title}</span><p style={{ color: "var(--noctra-text-muted)" }}>{m.description}</p></div>
                </div>
              ))}
            </div>
          )}
          {alignment.riskyImplementationChoices && alignment.riskyImplementationChoices.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-medium mb-1" style={{ color: "var(--noctra-amber)" }}>Risky Implementation Choices</p>
              {alignment.riskyImplementationChoices.map((r, i) => (
                <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded-lg mb-1 text-xs" style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.15)" }}>
                  <AlertTriangle size={10} style={{ color: "var(--noctra-amber)", marginTop: 2, flexShrink: 0 }} />
                  <div><span className="font-medium" style={{ color: "var(--noctra-text)" }}>{r.title}</span><p style={{ color: "var(--noctra-text-muted)" }}>{r.description}</p></div>
                </div>
              ))}
            </div>
          )}
          {alignment.builtButUnnecessary && alignment.builtButUnnecessary.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-medium mb-1" style={{ color: "var(--noctra-text-muted)" }}>Built But Unnecessary</p>
              {alignment.builtButUnnecessary.map((b, i) => (
                <div key={i} className="px-2 py-1.5 rounded-lg mb-1 text-xs" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                  <span style={{ color: "var(--noctra-text)" }}>{b.title}</span>
                  <p style={{ color: "var(--noctra-text-muted)" }}>{b.description}</p>
                </div>
              ))}
            </div>
          )}
          {alignment.MVPFeatureCoverage && alignment.MVPFeatureCoverage.length > 0 && (
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: "var(--noctra-text-muted)" }}>MVP Feature Coverage</p>
              <div className="space-y-1">
                {alignment.MVPFeatureCoverage.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs px-2 py-1 rounded-lg" style={{ background: "var(--noctra-surface2)" }}>
                    {f.status === "found" ? <Check size={10} style={{ color: "var(--noctra-emerald)" }} /> : <AlertTriangle size={10} style={{ color: "var(--noctra-amber)" }} />}
                    <span style={{ color: "var(--noctra-text)" }}>{f.feature}</span>
                    <Badge style={{ marginLeft: "auto", fontSize: "9px", background: f.status === "found" ? "rgba(52,211,153,0.1)" : "rgba(245,158,11,0.1)", color: f.status === "found" ? "var(--noctra-emerald)" : "var(--noctra-amber)" }}>{f.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>
      )}

      {/* ===== 6. Generated Fix Tasks ===== */}
      {report.id && (
        <Panel>
          <div className="flex items-center gap-2 mb-3">
            <CheckSquare size={13} style={{ color: "var(--noctra-emerald)" }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Fix Tasks</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <NoctraButton variant="ghost" onClick={() => navigate(`/app/tasks?report=${report.id}`)}>
              <ExternalLink size={11} /> View Tasks from this Report
            </NoctraButton>
            {report.project_id && (
              <NoctraButton variant="ghost" onClick={() => navigate(`/app/projects/${report.project_id}`)}>
                <FolderOpen size={11} /> Open Project
              </NoctraButton>
            )}
          </div>
        </Panel>
      )}

      {/* ===== 7. Next Build Prompt ===== */}
      <div className="rounded-xl p-4" style={{ background: "rgba(61,216,255,0.04)", border: "1px solid rgba(61,216,255,0.2)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Terminal size={13} style={{ color: "var(--noctra-cyan)" }} />
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-cyan)" }}>Next Build Prompt</p>
        </div>
        <p className="text-xs mb-3" style={{ color: "var(--noctra-text-muted)" }}>
          Copy this prompt into Codex, Replit Agent, Cursor, or Windsurf to fix all identified issues.
        </p>
        <div className="flex gap-2">
          <button
            onClick={copyPrompt}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
            style={{ background: promptCopied ? "rgba(52,211,153,0.15)" : "var(--noctra-cyan)", color: promptCopied ? "var(--noctra-emerald)" : "#000" }}
          >
            {promptCopied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy Prompt</>}
          </button>
          <button
            onClick={downloadPrompt}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
            style={{ background: "var(--noctra-surface2)", color: "var(--noctra-text)", border: "1px solid var(--noctra-border)" }}
          >
            <Download size={11} /> Download
          </button>
        </div>
      </div>

      {issues.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--noctra-rose)" }}>Issues</p>
          <div className="space-y-2">
            {issues.slice(0, 15).map((issue, i) => (
              <div key={i} className="rounded-lg p-3" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm" style={{ color: "var(--noctra-text)" }}>{issue.issue}</p>
                  <Badge style={{ fontSize: "9px", background: `${SEV_COLOR[issue.severity] ?? "var(--noctra-text-muted)"}18`, color: SEV_COLOR[issue.severity] ?? "var(--noctra-text-muted)" }}>{issue.severity}</Badge>
                </div>
                {issue.file && <p className="text-xs font-mono" style={{ color: "var(--noctra-text-muted)" }}>{issue.file}{issue.line ? `:${issue.line}` : ""}</p>}
                {issue.fix && <p className="text-xs mt-1" style={{ color: "var(--noctra-text-soft)" }}>Fix: {issue.fix}</p>}
                {issue.explanation && <p className="text-xs mt-1" style={{ color: "var(--noctra-text-muted)" }}>{issue.explanation}</p>}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {nextActions.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-text-muted)" }}>Next Actions</p>
          <div className="space-y-1">
            {nextActions.map((action, i) => (
              <p key={i} className="text-xs flex gap-2" style={{ color: "var(--noctra-text-soft)" }}>
                <span style={{ color: "var(--noctra-cyan)" }}>→</span>{action}
              </p>
            ))}
          </div>
        </Panel>
      )}

      {/* Scan summary */}
      {scan && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-text-muted)" }}>Scan Summary</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {scan.fileCount != null && <Badge>{scan.fileCount} files</Badge>}
            {scan.framework && <Badge>{scan.framework}</Badge>}
            {scan.packageManager && <Badge>{scan.packageManager}</Badge>}
            {scan.languages && Object.entries(scan.languages).slice(0, 6).map(([lang, count]) => (
              <Badge key={lang}>{lang} ({count})</Badge>
            ))}
          </div>
          {scan.repoMap && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 mt-2">
              {Object.entries(scan.repoMap).map(([key, files]) => {
                if (!Array.isArray(files) || files.length === 0) return null;
                return <Badge key={key} style={{ fontSize: "10px", justifyContent: "flex-start" }}>{key}: {files.length}</Badge>;
              })}
            </div>
          )}
        </Panel>
      )}

      <ProgressBar value={score} color={healthColor} />
    </div>
  );
}