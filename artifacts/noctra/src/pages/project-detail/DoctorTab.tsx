import { Panel, Badge, EmptyState, NoctraButton } from "@/components/Primitives";
import { ReportRenderer } from "@/components/reports/ReportRenderer";
import { FileText, AlertTriangle, CheckSquare, Loader2, Terminal, RefreshCw, Check, ArrowRight } from "lucide-react";
import { PRIORITY_COLOR, SCORE_COLOR, type Report, type Task, type Project } from "./types";
import type { ProjectState } from "@/lib/project-state";

interface DoctorTabProps {
  doctorReports: Report[];
  latestDoctorReport: Report | null;
  openScanGates: string[];
  tasks: Task[];
  projectState: ProjectState | null;
  project: Project | null;
  generatingTasks: string | null;
  onGenerateTasks: (report: Report) => void;
  onCopyBuildPrompt: () => void;
  navigate: (url: string) => void;
}

export function DoctorTab({ doctorReports, latestDoctorReport, openScanGates, tasks, projectState, project, generatingTasks, onGenerateTasks, onCopyBuildPrompt, navigate }: DoctorTabProps) {
  return (
    <div className="space-y-3">
      {doctorReports.length === 0 ? (
        <>
          <EmptyState icon={<FileText size={22} />} title="No diagnosis yet" body="Upload your project ZIP to Product Doctor to diagnose your codebase for launch blockers, code quality issues, and security gaps." />
          <div className="flex justify-center">
            <NoctraButton onClick={() => navigate("/app/doctor")}><FileText size={13} /> Scan with Product Doctor</NoctraButton>
          </div>
        </>
      ) : (
        <>
          {latestDoctorReport ? (
            <>
              <Panel>
                <div className="flex items-center gap-3 mb-3">
                  <FileText size={14} style={{ color: "var(--noctra-rose)" }} />
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Latest Scan</p>
                  {latestDoctorReport.score != null ? <Badge style={{ marginLeft: "auto", background: `${SCORE_COLOR(latestDoctorReport.score)}18`, color: SCORE_COLOR(latestDoctorReport.score) }}>{latestDoctorReport.score}/100</Badge> : null}
                </div>
                <p className="text-sm font-medium mb-1" style={{ color: "var(--noctra-text)" }}>{latestDoctorReport.title}</p>
                {latestDoctorReport.summary ? <p className="text-xs mb-2" style={{ color: "var(--noctra-text-muted)" }}>{latestDoctorReport.summary}</p> : null}
                <p className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{new Date(latestDoctorReport.created_at).toLocaleDateString()}</p>
              </Panel>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {latestDoctorReport.score != null && (
                  <Panel>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-text-muted)" }}>Health Score</p>
                    <p className="text-2xl font-bold" style={{ color: SCORE_COLOR(latestDoctorReport.score) }}>{latestDoctorReport.score}/100</p>
                  </Panel>
                )}
                {(() => {
                  const p = latestDoctorReport.payload as Record<string, unknown>;
                  const data = ((p?.data ?? p) ?? {}) as Record<string, unknown>;
                  const lr = data.launch_readiness as string;
                  if (!lr) return null;
                  return (
                    <Panel>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--noctra-text-muted)" }}>Launch Readiness</p>
                      <p className="text-lg font-bold" style={{ color: lr === "GO" ? "var(--noctra-emerald)" : lr === "CONDITIONAL" ? "var(--noctra-amber)" : "var(--noctra-rose)" }}>{lr}</p>
                    </Panel>
                  );
                })()}
              </div>
            </>
          ) : null}

          {openScanGates.length > 0 ? (
            <Panel>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={13} style={{ color: "var(--noctra-rose)" }} />
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-rose)" }}>Failed Gates ({openScanGates.length})</p>
              </div>
              <div className="space-y-1">
                {openScanGates.map((g, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg" style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.15)" }}>
                    <span style={{ color: "var(--noctra-rose)" }}>✗</span>
                    <span style={{ color: "var(--noctra-text-muted)" }}>{g}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                {latestDoctorReport ? (
                  <>
                    <button onClick={() => onGenerateTasks(latestDoctorReport)} disabled={generatingTasks === latestDoctorReport.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 disabled:opacity-50" style={{ color: "var(--noctra-rose)", background: "rgba(244,63,94,0.1)" }}>
                      {generatingTasks === latestDoctorReport.id ? <Loader2 size={11} className="animate-spin" /> : <CheckSquare size={11} />}
                      Generate Fix Tasks
                    </button>
                    <button onClick={() => navigate(`/app/reports/${latestDoctorReport.id}`)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ color: "var(--noctra-cyan)", background: "rgba(61,216,255,0.1)" }}>
                      <Terminal size={11} /> View Build Prompt
                    </button>
                  </>
                ) : null}
                <button onClick={() => navigate("/app/doctor")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ color: "var(--noctra-rose)", background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                  <RefreshCw size={11} /> Re-scan
                </button>
              </div>
            </Panel>
          ) : latestDoctorReport ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)" }}>
              <Check size={14} style={{ color: "var(--noctra-emerald)" }} />
              <p className="text-xs" style={{ color: "var(--noctra-emerald)" }}>All launch gates passing</p>
            </div>
          ) : null}

          {latestDoctorReport ? <Panel><ReportRenderer report={latestDoctorReport} projectId={project?.id} /></Panel> : null}

          {projectState && projectState.doctorScore > 0 && tasks.filter(t => t.source_report_id === latestDoctorReport?.id).length > 0 && (
            <Panel>
              <div className="flex items-center gap-2 mb-2">
                <CheckSquare size={13} style={{ color: "var(--noctra-emerald)" }} />
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--noctra-text-muted)" }}>Doctor Fix Tasks</p>
                <span className="ml-auto text-xs font-mono" style={{ color: "var(--noctra-text-muted)" }}>{tasks.filter(t => t.source_report_id === latestDoctorReport?.id).length} tasks</span>
              </div>
              {tasks.filter(t => t.source_report_id === latestDoctorReport?.id).slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg mb-1 text-xs" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: PRIORITY_COLOR[t.priority] ?? "var(--noctra-text-muted)" }} />
                  <span className="flex-1" style={{ color: "var(--noctra-text)" }}>{t.title}</span>
                  <Badge style={{ fontSize: "9px" }}>{t.status}</Badge>
                </div>
              ))}
              <NoctraButton variant="ghost" onClick={() => navigate("/app/tasks")} className="mt-1">
                View All Tasks <ArrowRight size={11} />
              </NoctraButton>
            </Panel>
          )}

          {doctorReports.length > 1 ? (
            <Panel>
              <p className="text-xs font-medium mb-2" style={{ color: "var(--noctra-text-muted)" }}>Scan History ({doctorReports.length} scans)</p>
              <div className="space-y-1.5">
                {doctorReports.map((r, i) => (
                  <button key={r.id} onClick={() => navigate(`/app/reports/${r.id}`)} className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:opacity-80" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>#{doctorReports.length - i}</span>
                      <span className="text-xs truncate" style={{ color: "var(--noctra-text)" }}>{r.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.score != null ? <span className="text-xs font-mono" style={{ color: SCORE_COLOR(r.score) }}>{r.score}</span> : null}
                      <span className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            </Panel>
          ) : null}

          <div className="flex gap-2 flex-wrap">
            <NoctraButton variant="ghost" onClick={() => navigate("/app/doctor")}><RefreshCw size={13} /> Re-scan with Product Doctor</NoctraButton>
            {latestDoctorReport ? (
              <>
                <NoctraButton variant="ghost" onClick={() => navigate(`/app/reports/${latestDoctorReport.id}`)}>Full Scan Report <ArrowRight size={11} /></NoctraButton>
                <NoctraButton variant="ghost" onClick={onCopyBuildPrompt}>
                  <Terminal size={11} /> Copy Build Prompt
                </NoctraButton>
              </>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
