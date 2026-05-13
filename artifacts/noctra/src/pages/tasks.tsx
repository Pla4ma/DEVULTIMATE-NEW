import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { Panel, EmptyState, Badge, NoctraButton } from "@/components/Primitives";
import { getTasks, updateTaskStatus, deleteTask, createTask, getProjects } from "@/lib/repository";
import {
  CheckSquare, Loader2, Trash2, Plus, CheckCircle, Circle,
  Search, Download, Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Task = {
  id: string; title: string; detail?: string | null;
  priority: string; category?: string | null; status: string; created_at: string;
  source_report_id?: string | null;
  project_id?: string | null;
};

const STATUS_CYCLE: Record<string, string> = {
  todo: "in-progress", "in-progress": "completed", completed: "todo",
};
const STATUS_TABS = ["all", "todo", "in-progress", "completed"] as const;
type StatusTab = typeof STATUS_TABS[number];

const PRIORITY_COLOR: Record<string, string> = {
  critical: "var(--noctra-rose)", high: "var(--noctra-rose)", medium: "var(--noctra-amber)", low: "var(--noctra-emerald)",
};
const STATUS_COLOR: Record<string, string> = {
  todo: "var(--noctra-text-muted)", "in-progress": "var(--noctra-cyan)", completed: "var(--noctra-emerald)",
};

function exportToCSV(tasks: Task[]) {
  const headers = ["title", "priority", "status", "category", "created_at"];
  const rows = tasks.map((t) => [
    `"${(t.title ?? "").replace(/"/g, '""')}"`,
    t.priority, t.status, t.category ?? "",
    new Date(t.created_at).toLocaleDateString(),
  ].join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "noctra-tasks.csv"; a.click();
  URL.revokeObjectURL(url);
}

export default function TasksPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusTab>("todo");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newCategory, setNewCategory] = useState("development");
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [projectMap, setProjectMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all([getTasks(), getProjects().catch(() => [])])
      .then(([t, p]) => {
        if (cancelled) return;
        setTasks((t as Task[]) ?? []);
        const map: Record<string, string> = {};
        (p as Array<{ id: string; name: string }>).forEach((proj) => { map[proj.id] = proj.name; });
        setProjectMap(map);
      })
      .catch((err) => {
        if (!cancelled) toast({ title: "Failed to load tasks", description: err?.message ?? "Unknown error", variant: "destructive" });
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    let list = tasks;
    if (statusFilter !== "all") list = list.filter((t) => t.status === statusFilter);
    if (priorityFilter !== "all") list = list.filter((t) => t.priority === priorityFilter);
    if (search.trim()) list = list.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()) || (t.detail ?? "").toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [tasks, statusFilter, priorityFilter, search]);

  const counts = useMemo(() => ({
    all: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    "in-progress": tasks.filter((t) => t.status === "in-progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  }), [tasks]);

  async function toggleStatus(task: Task) {
    const next = STATUS_CYCLE[task.status] ?? "todo";
    setTogglingId(task.id);
    try {
      await updateTaskStatus(task.id, next);
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: next } : t));
    } catch (err) {
      toast({ title: "Failed to update status", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      toast({ title: "Failed to delete task", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleAdd() {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const task = await createTask({ title: newTitle.trim(), priority: newPriority, category: newCategory });
      setTasks((prev) => [task as Task, ...prev]);
      setNewTitle(""); setShowAdd(false);
    } catch (err) { toast({ title: "Failed to add task", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" }); } finally { setAdding(false); }
  }

  const completedPct = tasks.length > 0 ? Math.round((counts.completed / tasks.length) * 100) : 0;

  return (
    <AppShell>
      <div className="p-6 max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--noctra-text)" }}>Tasks</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--noctra-text-muted)" }}>
              Mission Queue · {tasks.length} task{tasks.length !== 1 ? "s" : ""} · {completedPct}% done
            </p>
          </div>
          <div className="flex gap-2">
            <NoctraButton variant="ghost" onClick={() => exportToCSV(filtered)} disabled={filtered.length === 0}>
              <Download size={13} /> Export CSV
            </NoctraButton>
            <NoctraButton onClick={() => setShowAdd((v) => !v)}>
              <Plus size={13} /> Add Task
            </NoctraButton>
          </div>
        </div>

        {/* Add task form */}
        {showAdd && (
          <Panel>
            <div className="space-y-3">
              <input
                value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="Task title…"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }}
                autoFocus
              />
              <div className="flex gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>Priority:</span>
                  {["high", "medium", "low"].map((p) => (
                    <button key={p} onClick={() => setNewPriority(p)} className="px-2.5 py-0.5 rounded-full text-xs capitalize transition-all" style={{ background: newPriority === p ? `${PRIORITY_COLOR[p]}20` : "var(--noctra-surface2)", border: `1px solid ${newPriority === p ? PRIORITY_COLOR[p] : "var(--noctra-border)"}`, color: newPriority === p ? PRIORITY_COLOR[p] : "var(--noctra-text-muted)" }}>
                      {p}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--noctra-text-muted)" }}>Category:</span>
                  {["development", "marketing", "research", "ops"].map((c) => (
                    <button key={c} onClick={() => setNewCategory(c)} className="px-2.5 py-0.5 rounded-full text-xs capitalize transition-all" style={{ background: newCategory === c ? "rgba(61,216,255,0.2)" : "var(--noctra-surface2)", border: `1px solid ${newCategory === c ? "var(--noctra-cyan)" : "var(--noctra-border)"}`, color: newCategory === c ? "var(--noctra-cyan)" : "var(--noctra-text-muted)" }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <NoctraButton onClick={handleAdd} disabled={adding || !newTitle.trim()} className="flex-1">
                  {adding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add Task
                </NoctraButton>
                <NoctraButton variant="ghost" onClick={() => setShowAdd(false)}>Cancel</NoctraButton>
              </div>
            </div>
          </Panel>
        )}

        {/* Search + filters */}
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--noctra-text-muted)" }} />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks…"
              className="w-full pl-8 pr-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: "var(--noctra-surface)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text)" }}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter size={12} style={{ color: "var(--noctra-text-muted)" }} />
            {(["all", "high", "medium", "low"] as const).map((p) => (
              <button key={p} onClick={() => setPriorityFilter(p)} className="px-2.5 py-1 rounded-full text-xs capitalize transition-all" style={{ background: priorityFilter === p ? (p !== "all" ? `${PRIORITY_COLOR[p]}20` : "var(--noctra-surface2)") : "transparent", border: `1px solid ${priorityFilter === p ? (p !== "all" ? PRIORITY_COLOR[p] : "var(--noctra-border)") : "transparent"}`, color: priorityFilter === p ? (p !== "all" ? PRIORITY_COLOR[p] : "var(--noctra-text)") : "var(--noctra-text-muted)" }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--noctra-surface)" }}>
          {STATUS_TABS.map((st) => (
            <button key={st} onClick={() => setStatusFilter(st)} className="flex-1 px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all" style={{ background: statusFilter === st ? "var(--noctra-surface2)" : "transparent", color: statusFilter === st ? STATUS_COLOR[st] ?? "var(--noctra-text)" : "var(--noctra-text-muted)", border: statusFilter === st ? "1px solid var(--noctra-border)" : "1px solid transparent" }}>
              {st === "all" ? "All" : st} ({counts[st]})
            </button>
          ))}
        </div>

        {/* Task list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin" style={{ color: "var(--noctra-cyan)" }} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<CheckSquare size={24} />} title={search ? "No tasks match your search" : `No ${statusFilter === "all" ? "" : statusFilter} tasks`} body={tasks.length === 0 ? "Tasks are auto-generated when you save AI reports. You can also add them manually." : "Try a different filter or search term."} />
        ) : (
          <div className="space-y-2">
            {filtered.map((task) => (
              <Panel key={task.id} style={{ padding: "0" }}>
                <div className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleStatus(task)}
                      disabled={togglingId === task.id}
                      className="mt-0.5 shrink-0 transition-opacity hover:opacity-70"
                    >
                      {togglingId === task.id ? (
                        <Loader2 size={16} className="animate-spin" style={{ color: STATUS_COLOR[task.status] }} />
                      ) : task.status === "completed" ? (
                        <CheckCircle size={16} style={{ color: "var(--noctra-emerald)" }} />
                      ) : task.status === "in-progress" ? (
                        <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: "var(--noctra-cyan)", background: "rgba(61,216,255,0.1)" }} />
                      ) : (
                        <Circle size={16} style={{ color: "var(--noctra-border)" }} />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <button onClick={() => setExpandedId(expandedId === task.id ? null : task.id)} className="w-full text-left">
                        <p className="text-sm" style={{ color: task.status === "completed" ? "var(--noctra-text-muted)" : "var(--noctra-text)", textDecoration: task.status === "completed" ? "line-through" : "none" }}>
                          {task.title}
                        </p>
                      </button>
                      {expandedId === task.id && task.detail && (
                        <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "var(--noctra-text-muted)" }}>{task.detail}</p>
                      )}
                      {expandedId === task.id && (task.source_report_id || task.project_id) && (
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {task.source_report_id && (
                            <button
                              onClick={() => navigate(`/app/reports/${task.source_report_id}`)}
                              className="text-[11px] px-2 py-1 rounded-full"
                              style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-cyan)" }}
                            >
                              View source report
                            </button>
                          )}
                          {task.project_id && (
                            <button
                              onClick={() => navigate(`/app/projects/${task.project_id}`)}
                              className="text-[11px] px-2 py-1 rounded-full"
                              style={{ background: "var(--noctra-surface2)", border: "1px solid var(--noctra-border)", color: "var(--noctra-text-muted)" }}
                            >
                              {projectMap[task.project_id] ? `Project: ${projectMap[task.project_id]}` : "View project"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {task.priority && (
                        <div className="w-2 h-2 rounded-full" style={{ background: PRIORITY_COLOR[task.priority] ?? "var(--noctra-text-muted)" }} title={task.priority} />
                      )}
                      {task.category && (
                        <Badge style={{ fontSize: "10px", opacity: 0.7 }}>{task.category}</Badge>
                      )}
                      <button
                        onClick={() => handleDelete(task.id)}
                        disabled={deletingId === task.id}
                        className="p-1 rounded opacity-30 hover:opacity-100 transition-opacity"
                      >
                        {deletingId === task.id ? (
                          <Loader2 size={12} className="animate-spin" style={{ color: "var(--noctra-rose)" }} />
                        ) : (
                          <Trash2 size={12} style={{ color: "var(--noctra-rose)" }} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        )}

        {/* Footer stats */}
        {tasks.length > 0 && (
          <div className="flex items-center justify-between text-xs pt-2" style={{ color: "var(--noctra-text-muted)" }}>
            <span>Showing {filtered.length} of {tasks.length} tasks</span>
            <span>{counts.completed} completed · {counts["in-progress"]} in progress · {counts.todo} to do</span>
          </div>
        )}
      </div>
    </AppShell>
  );
}
