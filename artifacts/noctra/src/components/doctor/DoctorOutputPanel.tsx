import { useLocation } from "wouter";
import { DoctorReportView } from "@/components/reports/DoctorReportView";
import { EmptyState, NoctraButton, Panel, Badge } from "@/components/Primitives";
import { ROUTES } from "@/lib/routes";
import { type Phase, type ScanResult, type AIResult, type ScanFallbackMode } from "@/hooks/use-doctor-scan";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import {
  Stethoscope, Loader2, CheckCircle, AlertTriangle, XCircle,
  Bug, Terminal, FileText, Rocket, FileCode,
  RotateCcw, ListChecks, Target, Clock,
} from "lucide-react";

const TOOL = TOOL_BY_KEY["doctor"]!;

const STEPS: Array<{ key: Phase; label: string }> = [
  { key: "scanning", label: "Static scan complete — launch gates evaluated" },
  { key: "diagnosing", label: "AI diagnosis complete — blockers identified" },
  { key: "generating", label: "Fix tasks generated — report saved" },
  { key: "done", label: "Diagnosis complete" },
];

const PHASE_ORDER: Record<Phase, number> = {
  idle: -1, scanning: 0, diagnosing: 1, generating: 2, done: 3, error: -1,
};

// Simulated extraction of previous score from saved report IDs
// In a real app this would come from report history in the DB
function getPreviousScanData() {
  return null;
}

export function DoctorOutputPanel(props: {
  phase: Phase; error: string; aiResult: AIResult | null; scanResult: ScanResult | null;
  scanFallbackMode: ScanFallbackMode; savedReportId: string | null; accent?: string;
}) {
  const [, navigate] = useLocation();
  const { phase, error, aiResult, scanResult, scanFallbackMode, savedReportId } = props;
  const accent = props.accent ?? TOOL.accent;

  if (phase === "idle") {
    return (
      <EmptyState icon={<Stethoscope size={22} />} title="No diagnosis yet"
        body="Drop your repo ZIP. Product Doctor diagnoses launch blockers, code risks, and generates the exact tasks and build prompt to fix them. Rescan after fixing to verify improvement."
      />
    );
  }

  if (phase === "error") {
    return (
      <EmptyState icon={<AlertTriangle size={22} />} title="Diagnosis failed" body={error || "Something went wrong. Check your repo zip and try again."} />
    );
  }

  if (phase === "done" && aiResult) {
    const aiData = aiResult.data as Record<string, unknown> | null;
    const healthScore = typeof aiData?.health_score === "number" ? aiData.health_score
      : typeof aiResult.score === "number" ? aiResult.score : null;
    const launchReadiness = typeof aiData?.launch_readiness === "string" ? aiData.launch_readiness : "";
    const redGates = (aiData?.red_gates as string[] ?? []);
    const yellowGates = (aiData?.yellow_gates as string[] ?? []);
    const topIssues = (aiData?.issues as string[] ?? []).slice(0, 5);
    const repairQueue = (aiData?.repair_queue as string[] ?? []).slice(0, 5);
    const topBlockers = redGates.slice(0, 3);
    const healthColor = healthScore != null
      ? (healthScore >= 70 ? "var(--color-success)" : healthScore >= 40 ? "var(--color-warning)" : "var(--color-danger)")
      : "var(--text-tertiary)";
    const statusLabel = healthScore != null
      ? (healthScore >= 70 ? "Launch Ready" : healthScore >= 40 ? "Needs Work" : "Blocked")
      : "Unknown";
    const currentStep = PHASE_ORDER[phase];

    return (
      <div className="space-y-4">
        {/* Scan→Fix→Rescan status banner */}
        <div className="px-4 py-3 rounded-xl flex items-center gap-3" style={{ background: "var(--color-success-soft)", border: "1px solid var(--color-success-soft)" }}>
          <CheckCircle size={14} style={{ color: "var(--color-success)" }} />
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: "var(--color-success)" }}>Diagnosis complete — report saved</p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Fix queue generated and added to Task Queue. Fix blockers, then rescan to see your score improve.
            </p>
          </div>
          <NoctraButton variant="ghost" onClick={() => navigate(ROUTES.tasks)} className="text-xs shrink-0">
            <ListChecks size={11} /> View Fix Tasks
          </NoctraButton>
        </div>

        {scanFallbackMode === "ai-only" && (
          <div className="px-4 py-3 rounded-xl flex items-start gap-3" style={{ background: "var(--color-danger-soft)", border: "1px solid var(--color-danger-soft)" }}>
            <AlertTriangle size={14} style={{ color: "var(--color-danger)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--color-danger)" }}>Static scan failed — this is NOT a launch readiness report</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                The static scanner could not process your repo. This is an AI-only estimate based on file metadata alone, not real code analysis.
              </p>
              <ul className="text-xs mt-1 space-y-0.5" style={{ color: "var(--color-warning)" }}>
                <li>No code scan was performed</li>
                <li>No launch gates were evaluated</li>
                <li>No evidence index exists</li>
              </ul>
              <p className="text-xs mt-2 font-bold" style={{ color: "var(--color-danger)" }}>
                Do not use this report for any launch or deployment decision. Retry with a valid ZIP file for real diagnostics.
              </p>
            </div>
          </div>
        )}

        {/* Current Launch Score + Previous Score + Score Change */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Current Score */}
          {healthScore != null && (
            <Panel>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>Current Launch Score</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold" style={{ color: healthColor }}>{healthScore}</span>
                <span className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>/ 100</span>
              </div>
              <div className="mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                  background: healthScore >= 70 ? "var(--color-success-soft)" : healthScore >= 40 ? "var(--color-warning-soft)" : "var(--color-danger-soft)",
                  color: healthColor,
                }}>{statusLabel}</span>
              </div>
            </Panel>
          )}

          {/* Previous Score (placeholder - real data comes from report history) */}
          <Panel>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>Score Change</p>
            <div className="flex items-center gap-2">
              <div className="flex items-end gap-1">
                <span className="text-lg font-bold" style={{ color: "var(--text-tertiary)" }}>—</span>
                <span className="text-xs mb-0.5" style={{ color: "var(--text-tertiary)" }}>previous</span>
              </div>
            </div>
            <p className="text-[10px] mt-1" style={{ color: "var(--text-tertiary)" }}>
              First scan — rescan after fixing to track improvement
            </p>
          </Panel>

          {/* Launch Readiness / Status */}
          {launchReadiness && (
            <Panel>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>Launch Readiness</p>
              <p className="text-lg font-bold" style={{
                color: launchReadiness === "GO" ? "var(--color-success)" :
                  launchReadiness === "CONDITIONAL" ? "var(--color-warning)" : "var(--color-danger)"
              }}>{launchReadiness}</p>
              <p className="text-[10px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                {launchReadiness === "GO" ? "All gates clear — ready to ship"
                  : launchReadiness === "CONDITIONAL" ? "Fix yellow gates before launch"
                  : "Blockers must be resolved"}
              </p>
            </Panel>
          )}
        </div>

        {/* Top 3 Blockers */}
        {topBlockers.length > 0 && (
          <Panel>
            <div className="flex items-center gap-2 mb-2">
              <XCircle size={12} style={{ color: "var(--color-danger)" }} />
              <p className="eyebrow" style={{ color: "var(--color-danger)" }}>Top Blockers</p>
              {redGates.length > 3 && (
                <span className="text-[10px] ml-auto" style={{ color: "var(--text-tertiary)" }}>+{redGates.length - 3} more</span>
              )}
            </div>
            <div className="space-y-1.5">
              {topBlockers.map((g, i) => (
                <div key={i} className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={{ background: "var(--color-danger-soft)", border: "1px solid var(--color-danger-soft)" }}>
                  <span className="text-[10px] font-bold opacity-60" style={{ color: "var(--color-danger)" }}>#{i + 1}</span>
                  <XCircle size={11} style={{ color: "var(--color-danger)" }} />
                  <span style={{ color: "var(--text-primary)" }}>{g}</span>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {/* Next Recommended Fix */}
        {repairQueue.length > 0 && (
          <Panel>
            <div className="flex items-center gap-2 mb-2">
              <Target size={12} style={{ color: "var(--color-warning)" }} />
              <p className="eyebrow" style={{ color: "var(--color-warning)" }}>Next Recommended Fix</p>
            </div>
            <div className="px-3 py-2 rounded-lg" style={{ background: "var(--color-warning-soft)", border: "1px solid var(--color-warning-soft)" }}>
              <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{repairQueue[0]}</p>
              {repairQueue.length > 1 && (
                <p className="text-[10px] mt-1" style={{ color: "var(--text-tertiary)" }}>Then: {repairQueue.slice(1, 3).join(", ")}</p>
              )}
            </div>
          </Panel>
        )}

        {/* Red/Yellow Gates */}
        {(redGates.length > 0 || yellowGates.length > 0) && (
          <Panel>
            <p className="eyebrow mb-2" style={{ color: "var(--color-danger)" }}>Launch Gates</p>
            <div className="space-y-1">
              {redGates.map((g, i) => (
                <div key={`r-${i}`} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg" style={{ background: "var(--color-danger-soft)", border: "1px solid var(--color-danger-soft)" }}>
                  <XCircle size={11} style={{ color: "var(--color-danger)" }} />
                  <span style={{ color: "var(--text-primary)" }}>{g}</span>
                </div>
              ))}
              {yellowGates.map((g, i) => (
                <div key={`y-${i}`} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg" style={{ background: "var(--color-warning-soft)", border: "1px solid var(--color-warning-soft)" }}>
                  <AlertTriangle size={11} style={{ color: "var(--color-warning)" }} />
                  <span style={{ color: "var(--text-primary)" }}>{g}</span>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {/* Fix Task Queue */}
        <Panel>
          <div className="flex items-center gap-2 mb-2">
            <ListChecks size={12} style={{ color: "var(--color-success)" }} />
            <p className="eyebrow" style={{ color: "var(--text-tertiary)" }}>Fix Task Queue</p>
            <span className="ml-auto text-[10px]" style={{ color: "var(--text-tertiary)" }}>
              Generated from this scan
            </span>
          </div>
          <div className="space-y-1.5">
            {repairQueue.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs" style={{ background: "var(--surface-2)" }}>
                <span className="text-[10px] font-mono opacity-50" style={{ color: "var(--text-tertiary)" }}>{String(i + 1).padStart(2, "0")}</span>
                <span className="flex-1" style={{ color: "var(--text-secondary)" }}>{item}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "var(--color-warning-soft)", color: "var(--color-warning)" }}>
                  {i === 0 ? "CRITICAL" : i < 3 ? "HIGH" : "MEDIUM"}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Launch Readiness Timeline - rescan loop */}
        <Panel>
          <div className="flex items-center gap-2 mb-2">
            <Clock size={12} style={{ color: "var(--signal)" }} />
            <p className="eyebrow" style={{ color: "var(--text-tertiary)" }}>Launch Readiness Loop</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg" style={{ background: "var(--signal-soft)", border: "1px solid var(--signal-soft)" }}>
              <span className="font-bold" style={{ color: "var(--signal)" }}>Scan</span>
              <ArrowRight size={10} style={{ color: "var(--text-tertiary)" }} />
              <span className="font-bold" style={{ color: "var(--color-warning)" }}>Fix</span>
              <ArrowRight size={10} style={{ color: "var(--text-tertiary)" }} />
              <span className="font-bold" style={{ color: "var(--color-success)" }}>Rescan</span>
              <ArrowRight size={10} style={{ color: "var(--text-tertiary)" }} />
              <span className="font-bold" style={{ color: "var(--signal)" }}>Launch</span>
            </div>
            <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
              Each rescan verifies fixes improved your score
            </span>
          </div>
        </Panel>

        {/* Top Issues */}
        {topIssues.length > 0 && (
          <Panel>
            <p className="eyebrow mb-2" style={{ color: "var(--color-danger)" }}>Top Issues</p>
            <div className="space-y-1">
              {topIssues.map((issue, i) => (
                <p key={i} className="text-xs flex gap-2" style={{ color: "var(--text-secondary)" }}>
                  <span style={{ color: "var(--color-danger)" }}>—</span>{issue}
                </p>
              ))}
            </div>
          </Panel>
        )}

        {/* Evidence index from scan */}
        {scanResult?.evidenceIndex && scanResult.evidenceIndex.length > 0 && (
          <Panel>
            <div className="flex items-center gap-2 mb-2">
              <Bug size={13} style={{ color: "var(--color-warning)" }} />
              <p className="eyebrow" style={{ color: "var(--text-tertiary)" }}>Evidence Index</p>
              <span className="ml-auto text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>{scanResult.evidenceIndex.length} items</span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {scanResult.evidenceIndex.slice(0, 15).map((e, i) => (
                <div key={i} className="flex items-start gap-2 px-2 py-1.5 rounded-lg text-xs" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)" }}>
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: e.severity === "error" ? "var(--color-danger)" : e.severity === "warning" ? "var(--color-warning)" : "var(--signal)" }} />
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-[10px]" style={{ color: "var(--text-tertiary)" }}>{e.filePath}{e.lineNumber ? `:${e.lineNumber}` : ""}</span>
                    <p className="mt-0.5" style={{ color: "var(--text-secondary)" }}>{e.explanation || e.signal}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {/* Scan Summary */}
        {scanResult?.scan && (
          <Panel>
            <p className="eyebrow mb-2" style={{ color: "var(--text-tertiary)" }}>Scan Summary</p>
            <div className="flex flex-wrap gap-2 text-xs">
              {scanResult.scan.fileCount != null && <Badge>{scanResult.scan.fileCount} files</Badge>}
              {scanResult.scan.totalLines != null && <Badge>{scanResult.scan.totalLines} lines</Badge>}
              {scanResult.scan.framework && <Badge>{scanResult.scan.framework}</Badge>}
              {scanResult.scan.packageManager && <Badge>{scanResult.scan.packageManager}</Badge>}
              {scanResult.scan.languages && Object.entries(scanResult.scan.languages).slice(0, 6).map(([lang, lines]) => (
                <Badge key={lang}>{lang} ({lines} lines)</Badge>
              ))}
            </div>
            {scanResult.repoMap && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 mt-2">
                {Object.entries(scanResult.repoMap).map(([key, files]) => {
                  if (!Array.isArray(files) || files.length === 0) return null;
                  return <Badge key={key} style={{ fontSize: "10px", justifyContent: "flex-start" }}>{key}: {files.length}</Badge>;
                })}
              </div>
            )}
          </Panel>
        )}

        {/* Scan Warnings */}
        {scanResult?.warnings && scanResult.warnings.length > 0 && (
          <div className="px-3 py-2 rounded-lg" style={{ background: "var(--color-warning-soft)", border: "1px solid var(--color-warning-soft)" }}>
            <p className="text-xs font-medium mb-1" style={{ color: "var(--color-warning)" }}>Scan Warnings</p>
            {scanResult.warnings.slice(0, 3).map((w, i) => (
              <p key={i} className="text-xs" style={{ color: "var(--text-tertiary)" }}>{w}</p>
            ))}
          </div>
        )}

        <DoctorReportView report={{ id: savedReportId ?? "", payload: { data: aiResult.data, markdown: aiResult.markdown }, score: aiResult.score ?? null }} />

        {/* Build Prompt */}
        <Panel>
          <div className="flex items-center gap-2 mb-2">
            <Terminal size={13} style={{ color: "var(--signal)" }} />
            <p className="eyebrow" style={{ color: "var(--text-tertiary)" }}>Next Build Prompt</p>
          </div>
          <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
            Copy this prompt into Codex, Replit Agent, Cursor, or Windsurf to fix all identified issues.
          </p>
          <div className="flex gap-2 mb-2">
            <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: "var(--signal-soft)", color: "var(--signal)" }}>Codex</span>
            <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: "var(--signal-soft)", color: "var(--signal)" }}>Replit</span>
            <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: "var(--signal-soft)", color: "var(--signal)" }}>Cursor</span>
            <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: "var(--signal-soft)", color: "var(--signal)" }}>Windsurf</span>
          </div>
          <div className="flex gap-2">
            {savedReportId && (
              <NoctraButton variant="ghost" onClick={() => navigate(`/app/reports/${savedReportId}`)}>
                <Terminal size={11} /> Open Build Prompt
              </NoctraButton>
            )}
          </div>
        </Panel>

        {/* Rescan + Action buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t" style={{ borderColor: "var(--border-default)" }}>
          <NoctraButton variant="primary" onClick={() => navigate(ROUTES.doctor)}>
            <RotateCcw size={12} /> Rescan
          </NoctraButton>
          {savedReportId && (
            <>
              <NoctraButton variant="ghost" onClick={() => navigate(`/app/reports/${savedReportId}`)}>
                <FileText size={12} /> View Report
              </NoctraButton>
              <NoctraButton variant="ghost" onClick={() => navigate(`/app/tasks?report=${savedReportId}`)}>
                <ListChecks size={12} /> Fix Tasks
              </NoctraButton>
            </>
          )}
          <NoctraButton variant="ghost" onClick={() => navigate(ROUTES.launch)}>
            <Rocket size={12} /> Launch Room
          </NoctraButton>
        </div>
      </div>
    );
  }

  // Running phase (scanning/diagnosing/generating)
  const currentStep = PHASE_ORDER[phase];
  return (
    <div className="space-y-6 p-2">
      <div className="text-center">
        <Loader2 size={28} className="animate-spin mx-auto mb-3" style={{ color: accent }} />
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {phase === "scanning" ? "Deep scanning repository structure and evaluating launch gates…"
            : phase === "diagnosing" ? "AI is diagnosing launch blockers, code risks, and missing requirements…"
            : "Generating fix tasks, next build prompt, and saving report…"}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>This takes 20–40 seconds</p>
      </div>
      <div className="space-y-3">
        {STEPS.map((step, i) => {
          const stepIdx = PHASE_ORDER[step.key] ?? -1;
          const isDone = currentStep > stepIdx;
          const isActive = currentStep === stepIdx;
          return (
            <div key={step.key} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                style={{
                  background: isDone ? "var(--color-success-soft)" : isActive ? `${accent}18` : "var(--surface-2)",
                  border: isDone ? "1px solid var(--color-success-soft)" : isActive ? `1px solid ${accent}60` : "1px solid var(--border-default)",
                  color: isDone ? "var(--color-success)" : isActive ? accent : "var(--text-tertiary)",
                }}
              >
                {isDone ? "✓" : isActive ? <Loader2 size={10} className="animate-spin" /> : i + 1}
              </div>
              <span className="text-xs" style={{
                color: isDone ? "var(--color-success)" : isActive ? "var(--text-primary)" : "var(--text-tertiary)",
                fontWeight: isActive ? 500 : 400,
              }}>
                {step.label}
              </span>
              {isActive && (
                <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full" style={{ background: `${accent}14`, color: accent }}>Running</span>
              )}
              {isDone && (
                <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full" style={{ background: "var(--color-success-soft)", color: "var(--color-success)" }}>Done</span>
              )}
            </div>
          );
        })}
      </div>

      {scanResult?.scan?.languages && Object.keys(scanResult.scan.languages).length > 0 && (
        <div>
          <p className="eyebrow mb-2" style={{ color: "var(--text-tertiary)" }}>Languages Detected</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(scanResult.scan.languages).slice(0, 8).map(([lang, lines]) => (
              <Badge key={lang} style={{ background: `${accent}18`, color: accent }}>{lang} ({lines} lines)</Badge>
            ))}
          </div>
        </div>
      )}

      {scanResult?.warnings && scanResult.warnings.length > 0 && (
        <div className="px-3 py-2 rounded-lg" style={{ background: "var(--color-warning-soft)", border: "1px solid var(--color-warning-soft)" }}>
          <p className="text-xs font-medium mb-1" style={{ color: "var(--color-warning)" }}>Scan Warnings</p>
          {scanResult.warnings.slice(0, 3).map((w, i) => (
            <p key={i} className="text-xs" style={{ color: "var(--text-tertiary)" }}>{w}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function ArrowRight({ size, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size ?? 12} height={size ?? 12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
