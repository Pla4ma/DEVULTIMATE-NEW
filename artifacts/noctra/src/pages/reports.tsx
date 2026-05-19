import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { Panel, EmptyState, Badge, NoctraButton } from "@/components/Primitives";
import { getReports, deleteReport } from "@/lib/repository";
import { downloadMarkdown, reportToMarkdown } from "@/lib/export";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import { FileText, Loader2, Trash2, Download, ArrowRight, Search, Grid3X3, List, Stethoscope } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Report = {
  id: string; tool: string; title: string;
  score?: number | null; summary?: string | null;
  payload: unknown; project_id?: string | null; created_at: string;
};

const SCORE_COLOR = (s: number) =>
  s >= 75 ? "var(--noctra-emerald)" : s >= 50 ? "var(--noctra-amber)" : "var(--noctra-rose)";

export default function ReportsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [toolFilter, setToolFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  useEffect(() => {
    let cancelled = false;
    getReports()
      .then((r) => { if (!cancelled) setReports((r as Report[]) ?? []); })
      .catch((err) => { if (!cancelled) toast({ title: "Failed to load reports", description: err?.message ?? "Unknown error", variant: "destructive" }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const tools = useMemo(() => [...new Set(reports.map((r) => r.tool))], [reports]);

  const filtered = useMemo(() => {
    let list = toolFilter === "all" ? reports : reports.filter((r) => r.tool === toolFilter);
    if (search.trim()) {
      list = list.filter((r) =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        (r.summary ?? "").toLowerCase().includes(search.toLowerCase())
      );
    }
    return list;
  }, [reports, toolFilter, search]);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await deleteReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
      setConfirmDelete(null);
    } catch (err) { toast({ title: "Failed to delete report", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" }); } finally { setDeleting(null); }
  }

  function handleDownload(report: Report) {
    const md = reportToMarkdown(report);
    downloadMarkdown(report.title.replace(/\s+/g, "-").toLowerCase(), md);
  }

  return (
    <AppShell>
      <div className="p-6 max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--noctra-text)" }}>Reports</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>
              {reports.length} report{reports.length !== 1 ? "s" : ""} · {tools.length} tool{tools.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex p-0.5 rounded-lg gap-0.5" style={{ background: "var(--noctra-surface)", border: "1px solid var(--noctra-border)" }}>
              <button onClick={() => setViewMode("list")} className="p-1.5 rounded" style={{ background: viewMode === "list" ? "var(--noctra-surface2)" : "transparent", color: viewMode === "list" ? "var(--noctra-text)" : "var(--noctra-text-muted)" }}>
                <List size={13} />
              </button>
              <button onClick={() => setViewMode("grid")} className="p-1.5 rounded" style={{ background: viewMode === "grid" ? "var(--noctra-surface2)" : "transparent", color: viewMode === "grid" ? "var(--noctra-text)" : "var(--noctra-text-muted)" }}>
                <Grid3X3 size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--noctra-text-muted)" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reports…" className="w-full pl-8 pr-3 py-2 rounded-lg text-sm outline-none" style={{ background: "var(--noctra-surface)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }} />
          </div>
          {tools.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={() => setToolFilter("all")} className="px-3 py-1.5 rounded-full text-xs font-medium transition-all" style={{ background: toolFilter === "all" ? "var(--noctra-surface2)" : "transparent", border: `1px solid ${toolFilter === "all" ? "var(--noctra-border)" : "transparent"}`, color: toolFilter === "all" ? "var(--noctra-text)" : "var(--noctra-text-muted)" }}>
                All ({reports.length})
              </button>
              {tools.map((t) => {
                const tool = TOOL_BY_KEY[t as keyof typeof TOOL_BY_KEY];
                const count = reports.filter((r) => r.tool === t).length;
                return (
                  <button key={t} onClick={() => setToolFilter(toolFilter === t ? "all" : t)} className="px-3 py-1.5 rounded-full text-xs font-medium transition-all" style={{ background: toolFilter === t ? `${tool?.accent ?? "var(--noctra-cyan)"}20` : "transparent", border: `1px solid ${toolFilter === t ? (tool?.accent ?? "var(--noctra-cyan)") : "transparent"}`, color: toolFilter === t ? (tool?.accent ?? "var(--noctra-text)") : "var(--noctra-text-muted)" }}>
                    {tool?.label ?? t} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Report list/grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={22} className="animate-spin" style={{ color: "var(--noctra-cyan)" }} /></div>
        ) : filtered.length === 0 ? (reports.length === 0 ? (
          <div className="space-y-4">
            <EmptyState icon={<Stethoscope size={24} />} title="No reports yet" body="Run Project Doctor or an intelligence tool to generate your first analysis report." />
            <div className="flex justify-center gap-3">
              <NoctraButton onClick={() => navigate("/app/doctor")}>Run Project Doctor</NoctraButton>
              <NoctraButton variant="ghost" onClick={() => navigate("/app/idea")}>Run Idea Checker</NoctraButton>
            </div>
          </div>
        ) : (
          <EmptyState icon={<FileText size={24} />} title="No reports match your filter" body="Try a different tool or search term." />
        )) : viewMode === "list" ? (
          <div className="space-y-2">
            {filtered.map((report) => {
              const tool = TOOL_BY_KEY[report.tool as keyof typeof TOOL_BY_KEY];
              return (
                <Panel key={report.id}>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${tool?.accent ?? "var(--noctra-text-muted)"}18`, border: `1px solid ${tool?.accent ?? "var(--noctra-text-muted)"}22` }}>
                      {tool && <tool.icon size={14} style={{ color: tool.accent }} />}
                    </div>
                    <button className="flex-1 text-left min-w-0" onClick={() => navigate(`/app/reports/${report.id}`)}>
                      <div className="flex items-start gap-2 mb-0.5">
                        <p className="text-sm font-medium flex-1 min-w-0 truncate" style={{ color: "var(--noctra-text)" }}>{report.title}</p>
                        {report.score != null && (
                          <span className="text-xs font-bold shrink-0" style={{ color: SCORE_COLOR(report.score) }}>{report.score}/100</span>
                        )}
                      </div>
                      {report.summary && <p className="text-xs line-clamp-2" style={{ color: "var(--noctra-text-muted)" }}>{report.summary}</p>}
                      <div className="flex items-center gap-3 mt-1.5 text-xs" style={{ color: "var(--noctra-text-muted)" }}>
                        {tool && <Badge style={{ background: `${tool.accent}12`, color: tool.accent, fontSize: "10px" }}>{tool.label}</Badge>}
                        <span>{new Date(report.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                      </div>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => navigate(`/app/reports/${report.id}`)} className="p-1.5 rounded opacity-50 hover:opacity-100 transition-opacity">
                        <ArrowRight size={14} style={{ color: "var(--noctra-text-muted)" }} />
                      </button>
                      <button onClick={() => handleDownload(report)} className="p-1.5 rounded opacity-50 hover:opacity-100 transition-opacity">
                        <Download size={14} style={{ color: "var(--noctra-text-muted)" }} />
                      </button>
                      {confirmDelete === report.id ? (
                        <>
                          <button onClick={() => handleDelete(report.id)} disabled={deleting === report.id} className="text-xs px-2 py-1 rounded" style={{ color: "var(--noctra-rose)" }}>
                            {deleting === report.id ? <Loader2 size={10} className="animate-spin" /> : "Confirm"}
                          </button>
                          <button onClick={() => setConfirmDelete(null)} className="text-xs px-2 py-1 rounded" style={{ color: "var(--noctra-text-muted)" }}>Cancel</button>
                        </>
                      ) : (
                        <button onClick={() => setConfirmDelete(report.id)} className="p-1.5 rounded opacity-30 hover:opacity-100 transition-opacity">
                          <Trash2 size={14} style={{ color: "var(--noctra-rose)" }} />
                        </button>
                      )}
                    </div>
                  </div>
                </Panel>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map((report) => {
              const tool = TOOL_BY_KEY[report.tool as keyof typeof TOOL_BY_KEY];
              return (
                <button key={report.id} onClick={() => navigate(`/app/reports/${report.id}`)} className="w-full text-left rounded-xl border p-4" style={{ background: "var(--noctra-surface)", borderColor: "var(--noctra-border)", cursor: "pointer" }}>
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${tool?.accent ?? "var(--noctra-text-muted)"}18`, border: `1px solid ${tool?.accent ?? "var(--noctra-text-muted)"}22` }}>
                      {tool && <tool.icon size={14} style={{ color: tool.accent }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--noctra-text)" }}>{report.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {tool && <Badge style={{ background: `${tool.accent}12`, color: tool.accent, fontSize: "9px" }}>{tool.label}</Badge>}
                        <span className="text-[10px]" style={{ color: "var(--noctra-text-muted)" }}>{new Date(report.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {report.score != null && (
                      <span className="text-xs font-bold shrink-0" style={{ color: SCORE_COLOR(report.score) }}>{report.score}</span>
                    )}
                  </div>
                  {report.summary && <p className="text-xs line-clamp-2" style={{ color: "var(--noctra-text-muted)" }}>{report.summary}</p>}
                  <div className="flex gap-2 mt-2">
                    <button onClick={(e) => { e.stopPropagation(); handleDownload(report); }} className="text-[10px] px-2 py-0.5 rounded opacity-50 hover:opacity-100" style={{ color: "var(--noctra-text-muted)" }}>
                      <Download size={10} /> Export
                    </button>
                    {confirmDelete === report.id ? (
                      <div className="flex gap-1 ml-auto">
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(report.id); }} disabled={deleting === report.id} className="text-[10px] px-2 py-0.5 rounded" style={{ color: "var(--noctra-rose)" }}>
                          {deleting === report.id ? <Loader2 size={8} className="animate-spin" /> : "Delete"}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(null); }} className="text-[10px] px-2 py-0.5 rounded" style={{ color: "var(--noctra-text-muted)" }}>Cancel</button>
                      </div>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(report.id); }} className="text-[10px] px-2 py-0.5 rounded ml-auto opacity-30 hover:opacity-100" style={{ color: "var(--noctra-rose)" }}>
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {filtered.length > 0 && (
          <p className="text-xs text-center pt-2" style={{ color: "var(--noctra-text-muted)" }}>
            Showing {filtered.length} of {reports.length} reports
          </p>
        )}
      </div>
    </AppShell>
  );
}
