import { Panel, Badge, EmptyState, NoctraButton } from "@/components/Primitives";
import { ReportRenderer } from "@/components/reports/ReportRenderer";
import { FileText, AlertTriangle, CheckSquare, Loader2, Terminal, RefreshCw, Check, ArrowRight } from "lucide-react";
import { PRIORITY_COLOR, SCORE_COLOR, type Report, type Task, type Project } from "./types";
import type { ProjectState } from "@/lib/project-state";
import { ROUTES } from "@/lib/routes";

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
            <NoctraButton onClick={() => navigate(ROUTES.doctor)}><FileText size={13} /> Scan with Product Doctor</NoctraButton>
          </div>
        </>
      ) : (
        <>
          {latestDoctorReport ? (
            <>
              <Panel className="glass">
                <div className="flex items-center gap-3 mb-3">
                  <FileText size={14} style={{ color: "var(--color-danger)" }} />
                  <p className="eyebrow" style={{ color: "var(--text-tertiary)" }}>Latest Scan</p>
                  {latestDoctorReport.score != null ? <Badge style={{ marginLeft: "auto", background: `${SCORE_COLOR(latestDoctorReport.score)}18`, color: SCORE_COLOR(latestDoctorReport.score) }}>{latestDoctorReport.score}/100</Badge> : null}
                </div>
                <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>{latestDoctorReport.title}</p>
                {latestDoctorReport.summary ? <p className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>{latestDoctorReport.summary}</p> : null}
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{new Date(latestDoctorReport.created_at).toLocaleDateString()}</p>
              </Panel>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {latestDoctorReport.score != null && (
                  <Panel className="glass">
                    <p className="eyebrow mb-2" style={{ color: "var(--text-tertiary)" }}>Health Score</p>
                    <p className="text-2xl font-bold" style={{ color: SCORE_COLOR(latestDoctorReport.score) }}>{latestDoctorReport.score}/100</p>
                  </Panel>
                )}
                {(() => {
                  const p = latestDoctorReport.payload as Record<string, unknown>;
                  const data = ((p?.data ?? p) ?? {}) as Record<string, unknown>;
                  const lr = data.launch_readiness as string;
                  if (!lr) return null;
                  return (
                    <Panel className="glass">
                      <p className="eyebrow mb-2" style={{ color: "var(--text-tertiary)" }}>Launch Readiness</p>
                      <p className="text-lg font-bold" style={{ color: lr === "GO" ? "var(--color-success)" : lr === "CONDITIONAL" ? "var(--color-warning)" : "var(--color-danger)" }}>{lr}</p>
                    </Panel>
                  );
                })()}
              </div>
            </>
          ) : null}

          {openScanGates.length > 0 ? (
            <Panel className="glass">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={13} style={{ color: "var(--color-danger)" }} />
                <p className="eyebrow" style={{ color: "var(--color-danger)" }}>Failed Gates ({openScanGates.length})</p>
              </div>
              <div className="space-y-1">
                {openScanGates.map((g, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg" style={{ background: "var(--color-danger-soft)", border: "1px solid var(--color-danger-soft)" }}>
                    <span style={{ color: "var(--color-danger)" }}>✗</span>
                    <span style={{ color: "var(--text-tertiary)" }}>{g}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                {latestDoctorReport ? (
                  <>
                    <button onClick={() => onGenerateTasks(latestDoctorReport)} disabled={generatingTasks === latestDoctorReport.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 disabled:opacity-50" style={{ color: "var(--color-danger)", background: "var(--color-danger-soft)" }}>
                      {generatingTasks === latestDoctorReport.id ? <Loader2 size={11} className="animate-spin" /> : <CheckSquare size={11} />}
                      Generate Fix Tasks
                    </button>
                    <button onClick={() => navigate(ROUTES.reportDetail(latestDoctorReport.id))} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ color: "var(--signal)", background: "var(--signal-soft)" }}>
                      <Terminal size={11} /> View Build Prompt
                    </button>
                  </>
                ) : null}
                <button onClick={() => navigate(ROUTES.doctor)} className="glass flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium" style={{ color: "var(--color-danger)" }}>
                  <RefreshCw size={11} /> Re-scan
                </button>
              </div>
            </Panel>
          ) : latestDoctorReport ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "var(--color-success-soft)", border: "1px solid var(--color-success-soft)" }}>
              <Check size={14} style={{ color: "var(--color-success)" }} />
              <p className="text-xs" style={{ color: "var(--color-success)" }}>All launch gates passing</p>
            </div>
          ) : null}

          {latestDoctorReport ? <Panel className="glass"><ReportRenderer report={latestDoctorReport} projectId={project?.id} /></Panel> : null}

          {projectState && projectState.doctorScore > 0 && tasks.filter(t => t.source_report_id === latestDoctorReport?.id).length > 0 && (
            <Panel className="glass">
              <div className="flex items-center gap-2 mb-2">
                <CheckSquare size={13} style={{ color: "var(--color-success)" }} />
                <p className="eyebrow" style={{ color: "var(--text-tertiary)" }}>Doctor Fix Tasks</p>
                <span className="ml-auto text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>{tasks.filter(t => t.source_report_id === latestDoctorReport?.id).length} tasks</span>
              </div>
              {tasks.filter(t => t.source_report_id === latestDoctorReport?.id).slice(0, 5).map(t => (
                <div key={t.id} className="glass flex items-center gap-2 px-3 py-1.5 mb-1 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: PRIORITY_COLOR[t.priority] ?? "var(--text-tertiary)" }} />
                  <span className="flex-1" style={{ color: "var(--text-primary)" }}>{t.title}</span>
                  <Badge style={{ fontSize: "9px" }}>{t.status}</Badge>
                </div>
              ))}
              <NoctraButton variant="ghost" onClick={() => navigate(ROUTES.tasks)} className="mt-1">
                View All Tasks <ArrowRight size={11} />
              </NoctraButton>
            </Panel>
          )}

          {doctorReports.length > 1 ? (
            <Panel className="glass">
              <div className="flex items-center gap-2 mb-3">
                <p className="eyebrow" style={{ color: "var(--text-tertiary)" }}>Scan History ({doctorReports.length} scans)</p>
              </div>
              {(() => {
                const sorted = [...doctorReports].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                const scores = sorted.map(r => r.score ?? 0);
                const max = Math.max(...scores, 100);
                const w = 280; const h = 48;
                const pts = scores.map((s, i) => `${(i / (scores.length - 1)) * w},${h - (s / max) * h}`).join(" ");
                return (
                  <div className="mb-3">
                    <svg width="100%" viewBox={`0 0 ${w} ${h + 8}`} preserveAspectRatio="none" style={{ height: 52 }}>
                      <defs>
                        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--signal)" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="var(--signal)" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <polyline points={pts} fill="none" stroke="var(--signal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#spark-fill)" />
                      {scores.map((s, i) => (
                        <circle key={i} cx={(i / (scores.length - 1)) * w} cy={h - (s / max) * h} r="3.5" fill="var(--signal)" />
                      ))}
                    </svg>
                    <div className="flex justify-between mt-1">
                      {sorted.map((r, i) => (
                        <div key={r.id} className="text-center">
                          <p className="text-mono text-xs font-bold" style={{ color: SCORE_COLOR(r.score ?? 0) }}>{r.score ?? "—"}</p>
                          <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.5)" }}>#{i + 1}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
              <div className="space-y-1.5">
                {doctorReports.map((r, i) => (
                  <button key={r.id} onClick={() => navigate(ROUTES.reportDetail(r.id))} className="glass w-full flex items-center justify-between gap-3 px-3 py-2 hover:opacity-80">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-mono text-xs" style={{ color: "var(--text-tertiary)" }}>#{doctorReports.length - i}</span>
                      <span className="text-xs truncate" style={{ color: "var(--text-primary)" }}>{r.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.score != null ? <span className="text-xs font-bold text-mono" style={{ color: SCORE_COLOR(r.score) }}>{r.score}</span> : null}
                      <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            </Panel>
          ) : null}

          <div className="flex gap-2 flex-wrap">
            <NoctraButton variant="ghost" onClick={() => navigate(ROUTES.doctor)}><RefreshCw size={13} /> Re-scan with Product Doctor</NoctraButton>
            {latestDoctorReport ? (
              <>
                <NoctraButton variant="ghost" onClick={() => navigate(ROUTES.reportDetail(latestDoctorReport.id))}>Full Scan Report <ArrowRight size={11} /></NoctraButton>
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
