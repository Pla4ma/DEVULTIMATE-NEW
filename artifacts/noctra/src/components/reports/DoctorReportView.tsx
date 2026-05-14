import { useState } from "react";
import { useLocation } from "wouter";
import { ScoreRing, Badge, Panel, EmptyState, StatusDot, ProgressBar, NoctraButton } from "@/components/Primitives";
import { Stethoscope, Rocket, CheckSquare, Copy, Check, Download, AlertTriangle, ExternalLink, FileText, Shield, Bug, ListOrdered, GitBranch, Terminal, RefreshCw, FolderOpen, Package, Target, XCircle, ShieldAlert, BarChart3, Wrench, ClipboardList, Loader2 } from "lucide-react";
import { createTask } from "@/lib/repository";
import { downloadMarkdown } from "@/lib/export";
import { generateDevAgentPrompt } from "@/lib/brief-generator";
import { generatePromptPackFromReport, exportPromptPackToMarkdown } from "@/lib/prompt-pack";

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
  security_findings?: string[];
  testing_gaps?: string[];
  deployment_gaps?: string[];
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
  const [generatingPack, setGeneratingPack] = useState(false);

  if (!payloadData) return <EmptyState icon={<Stethoscope size={24} />} title="No data available" />;
  const pd = payloadData!;

  const score = pd.health_score ?? pd.score ?? report.score ?? 0;
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
  const redGateNames = payloadData.red_gates ?? [];
  const yellowGateNames = payloadData.yellow_gates ?? [];

  const healthColor = score >= 70 ? "var(--noctra-emerald)" : score >= 40 ? "var(--noctra-amber)" : "var(--noctra-rose)";
  const readinessScore = payloadData.launch_readiness_score ?? score;

  async function copyPrompt() {
    const prompt = generateNextBuildPrompt();
    try {
      await navigator.clipboard.writeText(prompt);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2500);
    } catch {
      downloadMarkdown("next-build-prompt", prompt);
    }
  }

  function downloadPrompt() {
    const prompt = generateNextBuildPrompt();
    downloadMarkdown("next-build-prompt", prompt);
  }

  function generateNextBuildPrompt(): string {
    return generateDevAgentPrompt({
      project: { name: "Current Project", idea: pd.summary },
      state: {
        phase: "launch-prep",
        readiness: readinessScore,
        doctorScore: score,
        failedGates: [...new Set([...redGates.map(g => g.name), ...redGateNames])],
        topBlocker: pd.top_blocker ?? null,
        nextAction: { title: pd.recommended_action ?? "Fix launch blockers", href: "/app/tasks", reason: "", description: "", priority: "high", tool: "doctor" },
        ideaScore: 0, realityScore: 0, proofScore: 0, swarmScore: 0, mvpScore: 0, launchScore: 0,
        overallScore: 0, coveredTools: [], missingTools: [], openP0Tasks: 0, openP1Tasks: 0,
        latestReportByTool: {}, proofSignalCount: 0, scanCount: 0, totalReports: 0,
        totalTasks: 0, completedTasks: 0, taskCompletionRate: 0,
      },
      tasks: [],
      doctorPayload: report.payload,
    });
  }

  async function handleGeneratePromptPack() {
    setGeneratingPack(true);
    try {
      const pack = generatePromptPackFromReport(
        { id: report.id, tool: "doctor", title: "Project Doctor Report", payload: report.payload },
        "Replit"
      );
      const md = exportPromptPackToMarkdown(pack);
      downloadMarkdown("doctor-prompt-pack", md);
      setBriefCopied(true);
      setTimeout(() => setBriefCopied(false), 2500);
    } finally {
      setGeneratingPack(false);
    }
  }

  function handleExportFixPlan() {
    const lines: string[] = [
      `# Doctor Fix Plan — ${new Date().toLocaleDateString()}`,
      "",
      `Health Score: ${score}/100`,
      `Launch Readiness: ${pd.launch_readiness ?? "N/A"}`,
      `Top Blocker: ${pd.top_blocker ?? "None"}`,
      "",
      "## Launch Gates",
      ...gates.map(g => `- [${g.status}] ${g.name}${g.how_to_fix ? ` → Fix: ${g.how_to_fix}` : ""}`),
      "",
      "## Repair Queue",
      ...repairQueue.map((item, i) => `${i + 1}. ${item}`),
      "",
      "## Fix Plan",
      ...fixPlan.map(f => `- [${f.priority}] ${f.title}${f.files ? ` (Files: ${f.files.join(", ")})` : ""}${f.acceptance_criteria ? `\n  AC: ${f.acceptance_criteria.join("; ")}` : ""}`),
      "",
      "## Evidence Index",
      ...evidence.slice(0, 20).map(e => `- [${e.severity}] ${e.filePath}${e.lineNumber ? `:${e.lineNumber}` : ""} — ${e.explanation || e.signal}`),
    ];
    downloadMarkdown("doctor-fix-plan", lines.join("\n"));
  }

  const allBlockers = [...new Set([...redGates.map(g => g.name), ...redGateNames])];
  const allWarnings = [...new Set([...yellowGates.map(g => g.name), ...yellowGateNames])];

  return (
    <div className="space-y-4">
      {/* ===== 1. Executive Verdict ===== */}
      <div
        className="rounded-xl p-4 flex gap-4 items-start flex-wrap"
        style={{
          background: score >= 70 ? "rgba(52,211,153,0.04)" : score >= 40 ? "rgba(245,158,11,0.04)" : "rgba(244,63,94,0.04)",
          border: `1px solid ${healthColor}22`,
        }}
      >
        <ScoreRing value={score} label="Health" color={healthColor} size={72} stroke={6} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Target size={13} style={{ color: healthColor }} />
            <p className="text-sm font-bold" style={{ color: "var(--noctra-text)" }}>Executive Verdict</p>
            {payloadData.launch_readiness && (
              <Badge style={{
                marginLeft: "auto",
                background: payloadData.launch_readiness === "GO" ? "rgba(52,211,153,0.1)" : payloadData.launch_readiness === "CONDITIONAL" ? "rgba(245,158,11,0.1)" : "rgba(244,63,94,0.1)",
                color: payloadData.launch_readiness === "GO" ? "var(--noctra-emerald)" : payloadData.launch_readiness === "CONDITIONAL" ? "var(--noctra-amber)" : "var(--noctra-rose)",
              }}>
                Launch: {payloadData.launch_readiness}
              </Badge>
            )}
          </div>
          {payloadData.verdict && <p className="text-sm font-semibold mb-1" style={{ color: "var(--noctra-text)" }}>{payloadData.verdict}</p>}
          {payloadData.summary && <p className="text-xs mb-2" style={{ color: "var(--noctra-text-soft)" }}>{payloadData.summary}</p>}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {payloadData.top_blocker && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)" }}>
                <XCircle size={10} style={{ color: "var(--noctra-rose)" }} />
                <span style={{ color: "var(--noctra-rose)" }}>Blocker: {payloadData.top_blocker}</span>
              </div>
            )}
            {allBlockers.length > 0 && <Badge style={{ background: "rgba(244,63,94,0.1)", color: "var(--noctra-rose)" }}>{allBlockers.length} RED gates</Badge>}
            {allWarnings.length > 0 && <Badge style={{ background: "rgba(245,158,11,0.1)", color: "var(--noctra-amber)" }}>{allWarnings.length} YELLOW</Badge>}
            {greenGates.length > 0 && <Badge style={{ background: "rgba(52,211,153,0.1)", color: "var(--noctra-emerald)" }}>{greenGates.length} GREEN</Badge>}
          </div>
          {payloadData.recommended_action && (
            <p className="text-xs mt-2 flex items-center gap-1" style={{ color: "var(--noctra-cyan)" }}>
              <Terminal size={10} /> Next action: {payloadData.recommended_action}
            </p>
          )}
        </div>
      </div>

      {/* ===== 2. Critical Issues ===== */}
      {payloadData.critical_issues && payloadData.critical_issues.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "var(--noctra-rose)" }}>
            <XCircle size={11} />Critical Issues
          </p>
          <div className="space-y-2">
            {payloadData.critical_issues.map((issue, i) => (
              <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(244,63,94,0.04)", border: "1px solid rgba(244,63,94,0.15)" }}>
                <span className="text-xs font-mono shrink-0 mt-0.5" style={{ color: "var(--noctra-rose)" }}>#{i + 1}</span>
                <p className="text-xs" style={{ color: "var(--noctra-text-soft)" }}>{issue}</p>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ===== 2b. Security / Testing / Deployment Gaps ===== */}
      {(payloadData.security_findings?.length ?? 0) > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-rose)" }}>Security Findings</p>
          <div className="space-y-1">
            {payloadData.security_findings!.map((f, i) => (
              <p key={i} className="text-xs flex gap-2" style={{ color: "var(--noctra-text-soft)" }}>
                <span style={{ color: "var(--noctra-rose)" }}>!</span>{f}
              </p>
            ))}
          </div>
        </Panel>
      )}
      {(payloadData.testing_gaps?.length ?? 0) > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-amber)" }}>Testing Gaps</p>
          <div className="space-y-1">
            {payloadData.testing_gaps!.map((g, i) => (
              <p key={i} className="text-xs flex gap-2" style={{ color: "var(--noctra-text-soft)" }}>
                <span style={{ color: "var(--noctra-amber)" }}>—</span>{g}
              </p>
            ))}
          </div>
        </Panel>
      )}
      {(payloadData.deployment_gaps?.length ?? 0) > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-amber)" }}>Deployment Gaps</p>
          <div className="space-y-1">
            {payloadData.deployment_gaps!.map((g, i) => (
              <p key={i} className="text-xs flex gap-2" style={{ color: "var(--noctra-text-soft)" }}>
                <span style={{ color: "var(--noctra-amber)" }}>—</span>{g}
              </p>
            ))}
          </div>
        </Panel>
      )}

      {/* ===== 3. Launch Gates ===== */}
      {gates.length > 0 && (
        <Panel>
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert size={13} style={{ color: "var(--noctra-rose)" }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Launch Gates</p>
            <span className="ml-auto text-xs font-mono" style={{ color: "var(--noctra-text-muted)" }}>
              {allBlockers.length} RED · {allWarnings.length} YELLOW · {greenGates.length} GREEN
            </span>
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
                  <p className="text-xs mt-1 italic" style={{ color: "var(--noctra-text-muted)" }}>
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
            <span className="ml-auto text-xs font-mono" style={{ color: "var(--noctra-text-muted)" }}>{evidence.length} findings</span>
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {evidence.slice(0, 25).map((e, i) => {
              const relatedFix = payloadData.issues?.find(iss => iss.file === e.filePath || (e.signal && iss.issue?.toLowerCase().includes(e.signal.toLowerCase())));
              return (
                <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: SEV_COLOR[e.severity] ?? "var(--noctra-text-muted)" }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[10px]" style={{ color: "var(--noctra-text-muted)" }}>{e.filePath}{e.lineNumber ? `:${e.lineNumber}` : ""}</span>
                      <Badge style={{ fontSize: "9px", background: `${SEV_COLOR[e.severity] ?? "var(--noctra-text-muted)"}18`, color: SEV_COLOR[e.severity] ?? "var(--noctra-text-muted)" }}>{e.severity}</Badge>
                    </div>
                    <p className="mt-0.5" style={{ color: "var(--noctra-text-soft)" }}>{e.explanation || e.signal || e.snippet}</p>
                    {relatedFix?.fix && (
                      <p className="mt-0.5 text-[10px]" style={{ color: "var(--noctra-cyan)" }}>Fix: {relatedFix.fix}</p>
                    )}
                  </div>
                </div>
              );
            })}
            {evidence.length > 25 && (
              <p className="text-xs text-center pt-1" style={{ color: "var(--noctra-text-muted)" }}>+{evidence.length - 25} more findings</p>
            )}
          </div>
        </Panel>
      )}

      {/* ===== 4. Repair Queue ===== */}
      {(repairQueue.length > 0 || fixPlan.length > 0 || allBlockers.length > 0) && (
        <Panel>
          <div className="flex items-center gap-2 mb-3">
            <Wrench size={13} style={{ color: "var(--noctra-amber)" }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Repair Queue</p>
          </div>
          <div className="space-y-2">
            {/* RED gates first */}
            {allBlockers.map((name, i) => (
              <div key={`r-${i}`} className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(244,63,94,0.04)", border: "1px solid rgba(244,63,94,0.2)" }}>
                <span className="text-xs font-mono shrink-0 mt-0.5" style={{ color: "var(--noctra-rose)" }}>#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" style={{ color: "var(--noctra-rose)" }}>{name}</p>
                  <Badge style={{ fontSize: "9px", background: "rgba(244,63,94,0.1)", color: "var(--noctra-rose)", marginTop: 2, display: "inline-block" }}>HIGH</Badge>
                </div>
              </div>
            ))}
            {/* repair_queue items */}
            {repairQueue.map((item, i) => (
              <div key={`rq-${i}`} className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                <span className="text-xs font-mono shrink-0 mt-0.5" style={{ color: "var(--noctra-amber)" }}>#{allBlockers.length + i + 1}</span>
                <p className="text-xs" style={{ color: "var(--noctra-text-soft)" }}>{item}</p>
              </div>
            ))}
            {/* fix_plan items */}
            {fixPlan.map((item, i) => (
              <div key={`fp-${i}`} className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                <span className="text-xs font-mono shrink-0 mt-0.5" style={{ color: "var(--noctra-amber)" }}>#{allBlockers.length + repairQueue.length + i + 1}</span>
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
          {alignment.recommendedCodeTasks && alignment.recommendedCodeTasks.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium mb-1" style={{ color: "var(--noctra-cyan)" }}>Recommended Code Tasks</p>
              {alignment.recommendedCodeTasks.map((t, i) => (
                <div key={i} className="px-2 py-1.5 rounded-lg mb-1 text-xs" style={{ background: "rgba(61,216,255,0.04)", border: "1px solid rgba(61,216,255,0.15)" }}>
                  <span className="font-medium" style={{ color: "var(--noctra-text)" }}>{t.title}</span>
                  <p style={{ color: "var(--noctra-text-muted)" }}>{t.reason}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {/* ===== 6. Generated Execution ===== */}
      <Panel>
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList size={13} style={{ color: "var(--noctra-emerald)" }} />
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Generated Execution</p>
        </div>

        {/* Fix Tasks */}
        {report.id && (
          <div className="mb-3 pb-3 border-b" style={{ borderColor: "var(--noctra-border)" }}>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--noctra-text)" }}>Fix Tasks</p>
            <div className="flex flex-wrap gap-2">
              <NoctraButton variant="ghost" onClick={() => navigate(`/app/tasks?report=${report.id}`)}>
                <ExternalLink size={11} /> View Fix Tasks
              </NoctraButton>
              {report.project_id && (
                <NoctraButton variant="ghost" onClick={() => navigate(`/app/projects/${report.project_id}`)}>
                  <FolderOpen size={11} /> Open Project
                </NoctraButton>
              )}
            </div>
          </div>
        )}

        {/* Next Build Prompt */}
        <div className="mb-3 pb-3 border-b" style={{ borderColor: "var(--noctra-border)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Terminal size={13} style={{ color: "var(--noctra-cyan)" }} />
            <p className="text-xs font-medium" style={{ color: "var(--noctra-text)" }}>Next Build Prompt</p>
          </div>
          <p className="text-xs mb-2" style={{ color: "var(--noctra-text-muted)" }}>
            Copy this prompt into Codex, Replit Agent, Cursor, or Windsurf to fix all identified issues.
          </p>
          <div className="flex items-center gap-2 mb-2">
            <Badge style={{ fontSize: "9px", background: "rgba(61,216,255,0.1)", color: "var(--noctra-cyan)" }}>Codex</Badge>
            <Badge style={{ fontSize: "9px", background: "rgba(61,216,255,0.1)", color: "var(--noctra-cyan)" }}>Replit</Badge>
            <Badge style={{ fontSize: "9px", background: "rgba(61,216,255,0.1)", color: "var(--noctra-cyan)" }}>Cursor</Badge>
            <Badge style={{ fontSize: "9px", background: "rgba(61,216,255,0.1)", color: "var(--noctra-cyan)" }}>Windsurf</Badge>
          </div>
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

        {/* Prompt Pack */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Package size={13} style={{ color: "var(--noctra-violet)" }} />
            <p className="text-xs font-medium" style={{ color: "var(--noctra-text)" }}>Prompt Pack</p>
          </div>
          <p className="text-xs mb-2" style={{ color: "var(--noctra-text-muted)" }}>
            Generate a multi-step prompt pack with phase-by-phase repair instructions for your AI coding tool.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleGeneratePromptPack}
              disabled={generatingPack}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
              style={{ background: generatingPack ? "rgba(149,117,255,0.1)" : "var(--noctra-surface2)", color: "var(--noctra-violet)", border: "1px solid rgba(149,117,255,0.25)" }}
            >
              {generatingPack ? <Loader2 size={11} className="animate-spin" /> : <Package size={11} />}
              Generate Prompt Pack
            </button>
            <button
              onClick={handleExportFixPlan}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
              style={{ background: "var(--noctra-surface2)", color: "var(--noctra-text)", border: "1px solid var(--noctra-border)" }}
            >
              <FileText size={11} /> Export Fix Plan
            </button>
          </div>
        </div>
      </Panel>

      {/* Issues section */}
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
