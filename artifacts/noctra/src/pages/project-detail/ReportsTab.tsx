import { Panel, Badge, EmptyState, NoctraButton } from "@/components/Primitives";
import { ReportRenderer } from "@/components/reports/ReportRenderer";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import { ArrowLeft, FileText, CheckSquare, Loader2, ArrowRight, Plus } from "lucide-react";
import { INTELLIGENCE_TOOLS, SCORE_COLOR, type Report } from "./types";

interface ReportsTabProps {
  reports: Report[];
  selectedReport: Report | null;
  onSelectReport: (report: Report | null) => void;
  generatingTasks: string | null;
  onGenerateTasks: (report: Report) => void;
  navigate: (url: string) => void;
  linkReportId: string;
  onLinkReportIdChange: (val: string) => void;
  onLinkReport: () => void;
  linkingReport: boolean;
}

export function ReportsTab({ reports, selectedReport, onSelectReport, generatingTasks, onGenerateTasks, navigate, linkReportId, onLinkReportIdChange, onLinkReport, linkingReport }: ReportsTabProps) {
  return (
    <div className="space-y-3">
      {selectedReport ? (
        <>
          <div className="flex items-center justify-between">
            <button onClick={() => onSelectReport(null)} className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-tertiary)" }}><ArrowLeft size={13} /> All Reports</button>
            <div className="flex gap-2">
              <NoctraButton variant="ghost" onClick={() => onGenerateTasks(selectedReport)} disabled={generatingTasks === selectedReport.id}>
                {generatingTasks === selectedReport.id ? <Loader2 size={12} className="animate-spin" /> : <CheckSquare size={12} />} Generate Tasks
              </NoctraButton>
              <NoctraButton variant="ghost" onClick={() => navigate(`/app/reports/${selectedReport.id}`)}>Full Report <ArrowRight size={12} /></NoctraButton>
            </div>
          </div>
          <Panel className="glass"><ReportRenderer report={selectedReport} /></Panel>
        </>
      ) : (
        <>
          {reports.length === 0 ? (
            <EmptyState icon={<FileText size={22} />} title="No reports yet" body="Run any AI tool and link it to this project, or paste a report ID below." />
          ) : (
            INTELLIGENCE_TOOLS.filter((key) => reports.some((r) => r.tool === key)).map((key) => {
              const toolDef = TOOL_BY_KEY[key as keyof typeof TOOL_BY_KEY];
              const toolReports = reports.filter((r) => r.tool === key).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              return (
                <div key={key} className="space-y-1.5">
                  <p className="eyebrow px-1" style={{ color: toolDef?.accent ?? "var(--text-tertiary)" }}>{toolDef?.label ?? key}</p>
                  {toolReports.map((r, idx) => (
                    <Panel key={r.id} className="glass" style={{ opacity: idx === 0 ? 1 : 0.7 }}>
                      <div className="flex items-center justify-between gap-3">
                        <button className="flex items-center gap-3 min-w-0 flex-1 text-left" onClick={() => onSelectReport(r)}>
                          {toolDef ? <toolDef.icon size={13} style={{ color: toolDef.accent }} /> : null}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{r.title}</p>
                              {idx === 0 ? <Badge style={{ fontSize: "10px", background: `${toolDef?.accent}18`, color: toolDef?.accent }}>Latest</Badge> : null}
                            </div>
                            {r.summary ? <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-tertiary)" }}>{r.summary}</p> : null}
                          </div>
                        </button>
                        <div className="flex items-center gap-2 shrink-0">
                          {r.score != null ? <span className="text-xs font-bold" style={{ color: SCORE_COLOR(r.score) }}>{r.score}</span> : null}
                          <button onClick={() => onGenerateTasks(r)} disabled={generatingTasks === r.id} title="Generate tasks" className="p-1 rounded hover:opacity-70">
                            {generatingTasks === r.id ? <Loader2 size={12} className="animate-spin" style={{ color: "var(--signal)" }} /> : <CheckSquare size={12} style={{ color: "var(--text-tertiary)" }} />}
                          </button>
                          <button onClick={() => navigate(`/app/reports/${r.id}`)} title="Open full report" className="p-1 rounded hover:opacity-70">
                            <ArrowRight size={12} style={{ color: "var(--text-tertiary)" }} />
                          </button>
                        </div>
                      </div>
                    </Panel>
                  ))}
                </div>
              );
            })
          )}

          {INTELLIGENCE_TOOLS.filter((key) => !reports.some((r) => r.tool === key)).length > 0 ? (
            <Panel className="glass" style={{ opacity: 0.7 }}>
              <p className="text-xs font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>Not yet run</p>
              <div className="flex flex-wrap gap-1.5">
                {INTELLIGENCE_TOOLS.filter((key) => !reports.some((r) => r.tool === key)).map((key) => {
                  const t = TOOL_BY_KEY[key as keyof typeof TOOL_BY_KEY];
                  if (!t) return null;
                  return <button key={key} onClick={() => navigate(t.route)} className="text-xs px-2.5 py-1 rounded-full hover:opacity-80" style={{ background: "rgba(20, 18, 40, 0.5)", border: "1px solid rgba(139, 92, 246, 0.12)", color: "var(--text-tertiary)", backdropFilter: "blur(12px)" }}>+ {t.label}</button>;
                })}
              </div>
            </Panel>
          ) : null}

          <Panel className="glass">
            <p className="text-xs font-medium mb-2" style={{ color: "var(--text-tertiary)" }}>Link existing report by ID</p>
            <div className="flex gap-2">
              <input value={linkReportId} onChange={(e) => onLinkReportIdChange(e.target.value)} placeholder="Paste report ID…" className="flex-1 px-3 py-2 rounded-lg text-xs outline-none" style={{ background: "rgba(20, 18, 40, 0.5)", border: "1px solid rgba(139, 92, 246, 0.12)", color: "var(--text-primary)" }} />
              <NoctraButton onClick={onLinkReport} disabled={linkingReport || !linkReportId.trim()}>
                {linkingReport ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Link
              </NoctraButton>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
