import { useLocation } from "wouter";
import { ScoreRing, Badge, Panel, EmptyState, ProgressBar } from "@/components/Primitives";
import { Stethoscope, XCircle, Shield, Bug, Terminal, AlertTriangle, Check } from "lucide-react";
import type { DoctorData, ScanData } from "./doctor/doctor-types";
import { SEV_COLOR } from "./doctor/doctor-constants";
import { DoctorLaunchGates } from "./doctor/DoctorLaunchGates";
import { DoctorRepairQueue } from "./doctor/DoctorRepairQueue";
import { DoctorAlignment } from "./doctor/DoctorAlignment";
import { DoctorGeneratedExecution } from "./doctor/DoctorGeneratedExecution";

export function DoctorReportView({ report, projectId }: { report: { id: string; payload: unknown; score?: number | null; project_id?: string | null; [key: string]: unknown }; projectId?: string }) {
  const [, navigate] = useLocation();
  const p = report.payload as Record<string, unknown>;
  const payloadData = (p?.data ?? p) as DoctorData | null;
  const scan = p?.scan as ScanData | null;

  if (!payloadData) return <EmptyState icon={<Stethoscope size={24} />} title="No data available" />;
  const pd = payloadData;

  const score = pd.health_score ?? pd.score ?? report.score ?? 0;
  const gates = pd.gates ?? [];
  const redGates = gates.filter(g => g.status === "RED");
  const yellowGates = gates.filter(g => g.status === "YELLOW");
  const greenGates = gates.filter(g => g.status === "GREEN");
  const issues = pd.issues ?? [];
  const repairQueue = pd.repair_queue ?? [];
  const fixPlan = pd.fix_plan ?? [];
  const evidence = pd.evidence ?? scan?.evidenceIndex ?? [];
  const nextActions = pd.next_actions ?? [];
  const alignment = pd.alignment ?? null;
  const redGateNames = pd.red_gates ?? [];
  const yellowGateNames = pd.yellow_gates ?? [];

  const healthColor = score >= 70 ? "var(--color-success)" : score >= 40 ? "var(--color-warning)" : "var(--color-danger)";
  const readinessScore = pd.launch_readiness_score ?? score;

  const allBlockers = [...new Set([...redGates.map(g => g.name), ...redGateNames])];
  const allWarnings = [...new Set([...yellowGates.map(g => g.name), ...yellowGateNames])];

  return (
    <div className="space-y-4">
      {/* ===== 1. Executive Verdict ===== */}
      <div
        className="rounded-xl p-4 flex gap-4 items-start flex-wrap"
        style={{
          background: score >= 70 ? "var(--color-success-soft)" : score >= 40 ? "var(--color-warning-soft)" : "var(--color-danger-soft)",
          border: `1px solid ${healthColor}22`,
        }}
      >
        <ScoreRing value={score} label="Health" color={healthColor} size={72} stroke={6} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Terminal size={13} style={{ color: healthColor }} />
            <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Executive Verdict</p>
            {pd.launch_readiness && (
              <Badge style={{
                marginLeft: "auto",
                background: pd.launch_readiness === "GO" ? "var(--color-success-soft)" : pd.launch_readiness === "CONDITIONAL" ? "var(--color-warning-soft)" : "var(--color-danger-soft)",
                color: pd.launch_readiness === "GO" ? "var(--color-success)" : pd.launch_readiness === "CONDITIONAL" ? "var(--color-warning)" : "var(--color-danger)",
              }}>
                Launch: {pd.launch_readiness}
              </Badge>
            )}
          </div>
          {pd.verdict && <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{pd.verdict}</p>}
          {pd.summary && <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>{pd.summary}</p>}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {pd.top_blocker && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "var(--color-danger-soft)", border: "1px solid var(--color-danger-soft)" }}>
                <XCircle size={10} style={{ color: "var(--color-danger)" }} />
                <span style={{ color: "var(--color-danger)" }}>Blocker: {pd.top_blocker}</span>
              </div>
            )}
            {allBlockers.length > 0 && <Badge style={{ background: "var(--color-danger-soft)", color: "var(--color-danger)" }}>{allBlockers.length} RED gates</Badge>}
            {allWarnings.length > 0 && <Badge style={{ background: "var(--color-warning-soft)", color: "var(--color-warning)" }}>{allWarnings.length} YELLOW</Badge>}
            {greenGates.length > 0 && <Badge style={{ background: "var(--color-success-soft)", color: "var(--color-success)" }}>{greenGates.length} GREEN</Badge>}
          </div>
          {pd.recommended_action && (
            <p className="text-xs mt-2 flex items-center gap-1" style={{ color: "var(--signal)" }}>
              <Terminal size={10} /> Next action: {pd.recommended_action}
            </p>
          )}
        </div>
      </div>

      {/* ===== 2. Critical Issues ===== */}
      {pd.critical_issues && pd.critical_issues.length > 0 && (
        <Panel>
          <p className="eyebrow mb-2 flex items-center gap-1.5" style={{ color: "var(--color-danger)" }}>
            <XCircle size={11} />Critical Issues
          </p>
          <div className="space-y-2">
            {pd.critical_issues.map((issue, i) => (
              <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "var(--color-danger-soft)", border: "1px solid var(--color-danger-soft)" }}>
                <span className="text-xs font-mono shrink-0 mt-0.5" style={{ color: "var(--color-danger)" }}>#{i + 1}</span>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{issue}</p>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ===== 2b. Security / Testing / Deployment Gaps ===== */}
      {(pd.security_findings?.length ?? 0) > 0 && (
        <Panel>
          <p className="eyebrow mb-2" style={{ color: "var(--color-danger)" }}>Security Findings</p>
          <div className="space-y-1">
            {pd.security_findings!.map((f, i) => (
              <p key={i} className="text-xs flex gap-2" style={{ color: "var(--text-secondary)" }}>
                <span style={{ color: "var(--color-danger)" }}>!</span>{f}
              </p>
            ))}
          </div>
        </Panel>
      )}
      {(pd.testing_gaps?.length ?? 0) > 0 && (
        <Panel>
          <p className="eyebrow mb-2" style={{ color: "var(--color-warning)" }}>Testing Gaps</p>
          <div className="space-y-1">
            {pd.testing_gaps!.map((g, i) => (
              <p key={i} className="text-xs flex gap-2" style={{ color: "var(--text-secondary)" }}>
                <span style={{ color: "var(--color-warning)" }}>—</span>{g}
              </p>
            ))}
          </div>
        </Panel>
      )}
      {(pd.deployment_gaps?.length ?? 0) > 0 && (
        <Panel>
          <p className="eyebrow mb-2" style={{ color: "var(--color-warning)" }}>Deployment Gaps</p>
          <div className="space-y-1">
            {pd.deployment_gaps!.map((g, i) => (
              <p key={i} className="text-xs flex gap-2" style={{ color: "var(--text-secondary)" }}>
                <span style={{ color: "var(--color-warning)" }}>—</span>{g}
              </p>
            ))}
          </div>
        </Panel>
      )}

      {/* ===== 3. Launch Gates ===== */}
      <DoctorLaunchGates gates={gates} allBlockers={allBlockers} allWarnings={allWarnings} greenGates={greenGates} />

      {/* ===== 4. Evidence Index ===== */}
      {evidence.length > 0 && (
        <Panel>
          <div className="flex items-center gap-2 mb-3">
            <Bug size={13} style={{ color: "var(--color-warning)" }} />
            <p className="eyebrow" style={{ color: "var(--text-tertiary)" }}>Evidence Index</p>
            <span className="ml-auto text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>{evidence.length} findings</span>
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {evidence.slice(0, 25).map((e, i) => {
              const relatedFix = issues.find(iss => iss.file === e.filePath || (e.signal && iss.issue?.toLowerCase().includes(e.signal.toLowerCase())));
              return (
                <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)" }}>
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: SEV_COLOR[e.severity] ?? "var(--text-tertiary)" }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[10px]" style={{ color: "var(--text-tertiary)" }}>{e.filePath}{e.lineNumber ? `:${e.lineNumber}` : ""}</span>
                      <Badge style={{ fontSize: "9px", background: `${SEV_COLOR[e.severity] ?? "var(--text-tertiary)"}18`, color: SEV_COLOR[e.severity] ?? "var(--text-tertiary)" }}>{e.severity}</Badge>
                    </div>
                    <p className="mt-0.5" style={{ color: "var(--text-secondary)" }}>{e.explanation || e.signal || e.snippet}</p>
                    {relatedFix?.fix && (
                      <p className="mt-0.5 text-[10px]" style={{ color: "var(--signal)" }}>Fix: {relatedFix.fix}</p>
                    )}
                  </div>
                </div>
              );
            })}
            {evidence.length > 25 && (
              <p className="text-xs text-center pt-1" style={{ color: "var(--text-tertiary)" }}>+{evidence.length - 25} more findings</p>
            )}
          </div>
        </Panel>
      )}

      {/* ===== 5. Repair Queue ===== */}
      <DoctorRepairQueue allBlockers={allBlockers} repairQueue={repairQueue} fixPlan={fixPlan} />

      {/* ===== 6. Codebase/Product Alignment ===== */}
      <DoctorAlignment alignment={alignment!} />

      {/* ===== 7. Generated Execution ===== */}
      <DoctorGeneratedExecution
        report={report}
        pd={pd}
        score={score}
        readinessScore={readinessScore}
        gates={gates}
        redGates={redGates}
        redGateNames={redGateNames}
        allBlockers={allBlockers}
        repairQueue={repairQueue}
        fixPlan={fixPlan}
        evidence={evidence}
        navigate={navigate}
      />

      {/* ===== 8. Issues ===== */}
      {issues.length > 0 && (
        <Panel>
          <p className="eyebrow mb-3" style={{ color: "var(--color-danger)" }}>Issues</p>
          <div className="space-y-2">
            {issues.slice(0, 15).map((issue, i) => (
              <div key={i} className="rounded-lg p-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)" }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm" style={{ color: "var(--text-primary)" }}>{issue.issue}</p>
                  <Badge style={{ fontSize: "9px", background: `${SEV_COLOR[issue.severity] ?? "var(--text-tertiary)"}18`, color: SEV_COLOR[issue.severity] ?? "var(--text-tertiary)" }}>{issue.severity}</Badge>
                </div>
                {issue.file && <p className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>{issue.file}{issue.line ? `:${issue.line}` : ""}</p>}
                {issue.fix && <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>Fix: {issue.fix}</p>}
                {issue.explanation && <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>{issue.explanation}</p>}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ===== 9. Next Actions ===== */}
      {nextActions.length > 0 && (
        <Panel>
          <p className="eyebrow mb-2" style={{ color: "var(--text-tertiary)" }}>Next Actions</p>
          <div className="space-y-1">
            {nextActions.map((action, i) => (
              <p key={i} className="text-xs flex gap-2" style={{ color: "var(--text-secondary)" }}>
                <span style={{ color: "var(--signal)" }}>→</span>{action}
              </p>
            ))}
          </div>
        </Panel>
      )}

      {/* ===== 10. Scan Summary ===== */}
      {scan && (
        <Panel>
          <p className="eyebrow mb-2" style={{ color: "var(--text-tertiary)" }}>Scan Summary</p>
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
