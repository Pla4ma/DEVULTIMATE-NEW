import { Panel, Badge, EmptyState, NoctraButton } from "@/components/Primitives";
import { TOOL_BY_KEY } from "@/lib/noctra-tools";
import { CheckSquare, Loader2, Download, CheckCircle2, Circle, ArrowRight, Plus } from "lucide-react";
import { PRIORITY_COLOR, STATUS_COLOR, type Report, type Task } from "./types";

interface ExecutionTabProps {
  tasks: Task[];
  reports: Report[];
  taskFilter: "all" | "todo" | "in-progress" | "completed";
  completedTasks: number;
  filteredTasks: Task[];
  generatingSprint: boolean;
  generatingTasks: string | null;
  onTaskFilterChange: (f: "all" | "todo" | "in-progress" | "completed") => void;
  onTaskToggle: (task: Task) => void;
  onGenerateSprint: () => void;
  onGenerateTasks: (report: Report) => void;
  navigate: (url: string) => void;
}

export function ExecutionTab({ tasks, reports, taskFilter, completedTasks, filteredTasks, generatingSprint, generatingTasks, onTaskFilterChange, onTaskToggle, onGenerateSprint, onGenerateTasks, navigate }: ExecutionTabProps) {
  return (
    <div className="space-y-3">
      {tasks.length === 0 ? (
        <EmptyState icon={<CheckSquare size={22} />} title="No tasks yet" body="Generate tasks from any AI report to start building your sprint queue." />
      ) : (
        <>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--noctra-surface)" }}>
              {(["all", "todo", "in-progress", "completed"] as const).map((f) => (
                <button key={f} onClick={() => onTaskFilterChange(f)} className="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all" style={{ background: taskFilter === f ? "var(--noctra-surface2)" : "transparent", color: taskFilter === f ? "var(--noctra-text)" : "var(--noctra-text-muted)", border: taskFilter === f ? "1px solid var(--noctra-border)" : "1px solid transparent", whiteSpace: "nowrap" }}>
                  {f === "all" ? `All (${tasks.length})` : f === "todo" ? `Todo (${tasks.filter((t) => t.status === "todo").length})` : f === "in-progress" ? `Active (${tasks.filter((t) => t.status === "in-progress").length})` : `Done (${completedTasks})`}
                </button>
              ))}
            </div>
            <NoctraButton variant="ghost" onClick={onGenerateSprint} disabled={generatingSprint}>
              {generatingSprint ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
              {generatingSprint ? "Building…" : "Export Sprint"}
            </NoctraButton>
          </div>
          <div className="space-y-2">
            {filteredTasks.length === 0 ? (
              <p className="text-xs text-center py-4" style={{ color: "var(--noctra-text-muted)" }}>No tasks in this filter.</p>
            ) : filteredTasks.map((t) => (
              <Panel key={t.id}>
                <div className="flex items-center gap-3">
                  <button onClick={() => onTaskToggle(t)} className="shrink-0">
                    {t.status === "completed" ? <CheckCircle2 size={16} style={{ color: "var(--noctra-emerald)" }} /> : <Circle size={16} style={{ color: "var(--noctra-text-muted)" }} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: t.status === "completed" ? "var(--noctra-text-muted)" : "var(--noctra-text)", textDecoration: t.status === "completed" ? "line-through" : "none" }}>{t.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {t.category ? <span className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>{t.category}</span> : null}
                      {t.source_report_id ? <button onClick={() => navigate(`/app/reports/${t.source_report_id}`)} className="text-xs hover:opacity-80" style={{ color: "var(--noctra-cyan)" }}>from report</button> : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-2 h-2 rounded-full" style={{ background: PRIORITY_COLOR[t.priority] ?? "var(--noctra-text-muted)" }} />
                    <Badge style={{ textTransform: "capitalize", fontSize: "10px", color: STATUS_COLOR[t.status] ?? "var(--noctra-text-muted)" }}>{t.status}</Badge>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
          <NoctraButton variant="ghost" onClick={() => navigate("/app/tasks")}><CheckSquare size={13} /> View all tasks <ArrowRight size={11} /></NoctraButton>
        </>
      )}
      {reports.length > 0 ? (
        <Panel>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--noctra-text-muted)" }}>Generate tasks from a report</p>
          <div className="space-y-1.5">
            {reports.slice(0, 5).map((r) => {
              const t = TOOL_BY_KEY[r.tool as keyof typeof TOOL_BY_KEY];
              return (
                <button key={r.id} onClick={() => onGenerateTasks(r)} disabled={generatingTasks === r.id} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:opacity-80 disabled:opacity-50" style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)" }}>
                  {t ? <t.icon size={12} style={{ color: t.accent }} /> : null}
                  <span className="text-xs flex-1 text-left truncate" style={{ color: "var(--noctra-text)" }}>{r.title}</span>
                  {generatingTasks === r.id ? <Loader2 size={11} className="animate-spin" style={{ color: "var(--noctra-cyan)" }} /> : <Plus size={11} style={{ color: "var(--noctra-text-muted)" }} />}
                </button>
              );
            })}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
