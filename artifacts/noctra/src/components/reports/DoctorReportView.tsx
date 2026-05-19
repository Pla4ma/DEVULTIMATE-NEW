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

  const healthColor = score >= 70 ? "var(--noctra-emerald)" : score >= 40 ? "var(--noctra-amber)" : "var(--noctra-rose)";
  const readinessScore = pd.launch_readiness_score ?? score;

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
            <Terminal size={13} style={{ color: healthColor }} />
            <p className="text-sm font-bold" style={{ color: "var(--noctra-text)" }}>Executive Verdict</p>
            {pd.launch_readiness && (
              <Badge style={{
                marginLeft: "auto",
                background: pd.launch_readiness === "GO" ? "rgba(52,211,153,0.1)" : pd.launch_readiness === "CONDITIONAL" ? "rgba(245,158,11,0.1)" : "rgba(244,63,94,0.1)",
                color: pd.launch_readiness === "GO" ? "var(--noctra-emerald)" : pd.launch_readiness === "CONDITIONAL" ? "var(--noctra-amber)" : "var(--noctra-rose)",
              }}>
                Launch: {pd.launch_readiness}
              </Badge>
            )}
          </div>
          {pd.verdict && <p className="text-sm font-semibold mb-1" style={{ color: "var(--noctra-text)" }}>{pd.verdict}</p>}
          {pd.summary && <p className="text-xs mb-2" style={{ color: "var(--noctra-text-soft)" }}>{pd.summary}</p>}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {pd.top_blocker && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)" }}>
                <XCircle size={10} style={{ color: "var(--noctra-rose)" }} />
                <span style={{ color: "var(--noctra-rose)" }}>Blocker: {pd.top_blocker}</span>
              </div>
            )}
            {allBlockers.length > 0 && <Badge style={{ background: "rgba(244,63,94,0.1)", color: "var(--noctra-rose)" }}>{allBlockers.length} RED gates</Badge>}
            {allWarnings.length > 0 && <Badge style={{ background: "rgba(245,158,11,0.1)", color: "var(--noctra-amber)" }}>{allWarnings.length} YELLOW</Badge>}
            {greenGates.length > 0 && <Badge style={{ background: "rgba(52,211,153,0.1)", color: "var(--noctra-emerald)" }}>{greenGates.length} GREEN</Badge>}
          </div>
          {pd.recommended_action && (
            <p className="text-xs mt-2 flex items-center gap-1" style={{ color: "var(--noctra-cyan)" }}>
              <Terminal size={10} /> Next action: {pd.recommended_action}
            </p>
          )}
        </div>
      </div>

      {/* ===== 2. Critical Issues ===== */}
      {pd.critical_issues && pd.critical_issues.length > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "var(--noctra-rose)" }}>
            <XCircle size={11} />Critical Issues
          </p>
          <div className="space-y-2">
            {pd.critical_issues.map((issue, i) => (
              <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(244,63,94,0.04)", border: "1px solid rgba(244,63,94,0.15)" }}>
                <span className="text-xs font-mono shrink-0 mt-0.5" style={{ color: "var(--noctra-rose)" }}>#{i + 1}</span>
                <p className="text-xs" style={{ color: "var(--noctra-text-soft)" }}>{issue}</p>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ===== 2b. Security / Testing / Deployment Gaps ===== */}
      {(pd.security_findings?.length ?? 0) > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-rose)" }}>Security Findings</p>
          <div className="space-y-1">
            {pd.security_findings!.map((f, i) => (
              <p key={i} className="text-xs flex gap-2" style={{ color: "var(--noctra-text-soft)" }}>
                <span style={{ color: "var(--noctra-rose)" }}>!</span>{f}
              </p>
            ))}
          </div>
        </Panel>
      )}
      {(pd.testing_gaps?.length ?? 0) > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-amber)" }}>Testing Gaps</p>
          <div className="space-y-1">
            {pd.testing_gaps!.map((g, i) => (
              <p key={i} className="text-xs flex gap-2" style={{ color: "var(--noctra-text-soft)" }}>
                <span style={{ color: "var(--noctra-amber)" }}>—</span>{g}
              </p>
            ))}
          </div>
        </Panel>
      )}
      {(pd.deployment_gaps?.length ?? 0) > 0 && (
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-amber)" }}>Deployment Gaps</p>
          <div className="space-y-1">
            {pd.deployment_gaps!.map((g, i) => (
              <p key={i} className="text-xs flex gap-2" style={{ color: "var(--noctra-text-soft)" }}>
                <span style={{ color: "var(--noctra-amber)" }}>—</span>{g}
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
            <Bug size={13} style={{ color: "var(--noctra-amber)" }} />
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Evidence Index</p>
            <span className="ml-auto text-xs font-mono" style={{ color: "var(--noctra-text-muted)" }}>{evidence.length} findings</span>
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {evidence.slice(0, 25).map((e, i) => {
              const relatedFix = issues.find(iss => iss.file === e.filePath || (e.signal && iss.issue?.toLowerCase().includes(e.signal.toLowerCase())));
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

      {/* ===== 9. Next Actions ===== */}
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

      {/* ===== 10. Scan Summary ===== */}
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
