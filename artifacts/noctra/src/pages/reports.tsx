import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { Panel, EmptyState, Badge, NoctraButton } from "@/components/Primitives";
import { getReports, deleteReport } from "@/lib/repository";
import { downloadMarkdown, reportToMarkdown } from "@/lib/export";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import { FileText, Loader2, Trash2, Download, ArrowRight, Search } from "lucide-react";
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

  useEffect(() => {
    let cancelled = false;
    getReports()
      .then((r) => { if (!cancelled) setReports((r as Report[]) ?? []); })
      .catch((err) => { if (!cancelled) toast({ title: "Failed to load reports", description: err?.message ?? "Unknown error", variant: "destructive" }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
            <p className="text-sm mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>All generated reports ({reports.length})</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--noctra-text-muted)" }} />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports…"
            className="w-full pl-8 pr-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "var(--noctra-surface)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }}
          />
        </div>

        {/* Tool filter chips */}
        {tools.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setToolFilter("all")} className="px-3 py-1 rounded-full text-xs font-medium transition-all" style={{ background: toolFilter === "all" ? "var(--noctra-surface2)" : "transparent", border: `1px solid ${toolFilter === "all" ? "var(--noctra-border)" : "transparent"}`, color: toolFilter === "all" ? "var(--noctra-text)" : "var(--noctra-text-muted)" }}>
              All ({reports.length})
            </button>
            {tools.map((t) => {
              const tool = TOOL_BY_KEY[t as keyof typeof TOOL_BY_KEY];
              const count = reports.filter((r) => r.tool === t).length;
              return (
                <button key={t} onClick={() => setToolFilter(toolFilter === t ? "all" : t)} className="px-3 py-1 rounded-full text-xs font-medium transition-all" style={{ background: toolFilter === t ? `${tool?.accent ?? "var(--noctra-cyan)"}20` : "transparent", border: `1px solid ${toolFilter === t ? (tool?.accent ?? "var(--noctra-cyan)") : "transparent"}`, color: toolFilter === t ? (tool?.accent ?? "var(--noctra-text)") : "var(--noctra-text-muted)" }}>
                  {tool?.label ?? t} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Report list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin" style={{ color: "var(--noctra-cyan)" }} />
          </div>
        ) : filtered.length === 0 ? (reports.length === 0 ? (
          <div className="space-y-4">
            <EmptyState
              icon={<FileText size={24} />}
              title="No reports yet"
              body="Run an intelligence tool to generate your first analysis report."
            />
            <div className="flex justify-center gap-3">
              <NoctraButton onClick={() => navigate("/app/idea")}>Run Idea Checker</NoctraButton>
              <NoctraButton variant="ghost" onClick={() => navigate("/app/doctor")}>Run Project Doctor</NoctraButton>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={<FileText size={24} />}
            title={search || toolFilter !== "all" ? "No reports match your filter" : "No reports yet"}
            body="Run any intelligence tool and save the report to see it here."
          />
        )
        ) : (
          <div className="space-y-2">
            {filtered.map((report) => {
              const tool = TOOL_BY_KEY[report.tool as keyof typeof TOOL_BY_KEY];
              return (
                <Panel key={report.id}>
                  <div className="flex items-start gap-4">
                    {/* Tool icon */}
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${tool?.accent ?? "var(--noctra-text-muted)"}18`, border: `1px solid ${tool?.accent ?? "var(--noctra-text-muted)"}22` }}>
                      {tool && <tool.icon size={14} style={{ color: tool.accent }} />}
                    </div>

                    {/* Main content - clickable */}
                    <button className="flex-1 text-left min-w-0" onClick={() => navigate(`/app/reports/${report.id}`)}>
                      <div className="flex items-start gap-2 mb-0.5">
                        <p className="text-sm font-medium flex-1 min-w-0 truncate" style={{ color: "var(--noctra-text)" }}>
                          {report.title}
                        </p>
                        {report.score != null && (
                          <span className="text-xs font-bold shrink-0" style={{ color: SCORE_COLOR(report.score) }}>
                            {report.score}/100
                          </span>
                        )}
                      </div>
                      {report.summary && (
                        <p className="text-xs line-clamp-2" style={{ color: "var(--noctra-text-muted)" }}>
                          {report.summary}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-xs" style={{ color: "var(--noctra-text-muted)" }}>
                        {tool && <Badge style={{ background: `${tool.accent}12`, color: tool.accent, fontSize: "10px" }}>{tool.label}</Badge>}
                        <span>{new Date(report.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                      </div>
                    </button>

                    {/* Actions */}
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
