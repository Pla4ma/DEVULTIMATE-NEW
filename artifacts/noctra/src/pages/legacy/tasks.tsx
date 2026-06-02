import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { Panel, EmptyState, NoctraButton } from "@/components/Primitives";
import { getTasks, updateTaskStatus, deleteTask, createTask, getProjects } from "@/lib/repository";
import { tasksToGithubMarkdown } from "@/lib/export";
import { generateSprintFromTasks } from "@/lib/sprint";
import {
  CheckSquare, Loader2, Plus, CheckCircle, XCircle,
  Search, Download, Filter, Copy, Check, X, Calendar, ChevronDown, ListTodo,
} from "lucide-react";
import { BreadcrumbBar } from "@/components/Breadcrumb";
import { useToast } from "@/hooks/use-toast";
import { TaskItem } from "./tasks/TaskItem";
import {
  normalizeStatus, STATUS_CYCLE, STATUS_TABS, STATUS_COLOR, PRIORITY_COLOR, exportToCSV,
  type Task, type StatusTab,
} from "./tasks/tasks-types";

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
  const [projectMap, setProjectMap] = useState<Record<string, string>>({});
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [copyDone, setCopyDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getTasks(), getProjects().catch(() => [])])
      .then(([t, p]) => {
        if (cancelled) return;
        setTasks(((t as Task[]) ?? []).map(task => ({ ...task, status: normalizeStatus(task.status) })));
        const map: Record<string, string> = {};
        (p as Array<{ id: string; name: string }>).forEach((proj) => { map[proj.id] = proj.name; });
        setProjectMap(map);
      })
      .catch((err) => { if (!cancelled) toast({ title: "Failed to load tasks", description: err?.message ?? "Unknown error", variant: "destructive" }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let list = tasks;
    if (statusFilter !== "all") list = list.filter((t) => normalizeStatus(t.status) === statusFilter);
    if (priorityFilter !== "all") list = list.filter((t) => t.priority === priorityFilter);
    if (projectFilter !== "all") list = list.filter((t) => t.project_id === projectFilter);
    if (search.trim()) list = list.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()) || (t.detail ?? "").toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [tasks, statusFilter, priorityFilter, projectFilter, search]);

  const selectedTasks = useMemo(() => filtered.filter(t => selectedIds.has(t.id)), [filtered, selectedIds]);

  function toggleSelect(id: string) {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }
  function selectAll() { setSelectedIds(new Set(filtered.map(t => t.id))); }
  function clearSelection() { setSelectedIds(new Set()); }

  async function copyMarkdown(tasksToCopy: Task[]) {
    const md = tasksToGithubMarkdown(tasksToCopy);
    try {
      await navigator.clipboard.writeText(md);
      toast({ title: "Copied", description: `${tasksToCopy.length} task${tasksToCopy.length !== 1 ? "s" : ""} copied as markdown.` });
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    } catch (e) {
      toast({ title: "Failed to copy", description: "Clipboard access denied.", variant: "destructive" });
    }
  }

  function exportMarkdown() {
    const md = tasksToGithubMarkdown(filtered);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "noctra-tasks.md"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${filtered.length} task${filtered.length !== 1 ? "s" : ""} exported as markdown.` });
  }

  function exportGitHub() {
    const md = tasksToGithubMarkdown(filtered);
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "noctra-tasks-github.md"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "GitHub Issues exported", description: `${filtered.length} task${filtered.length !== 1 ? "s" : ""} formatted as GitHub Issues.` });
  }

  async function generateSprintFromSelected() {
    if (selectedTasks.length === 0) { toast({ title: "No tasks selected", description: "Select tasks to generate a sprint.", variant: "destructive" }); return; }
    try {
      const sprintTasks = selectedTasks.map(t => ({
        id: t.id, title: t.title, detail: t.detail ?? undefined,
        priority: t.priority as "high" | "medium" | "low",
        category: t.category ?? "development", status: normalizeStatus(t.status),
        created_at: t.created_at, source_report_id: t.source_report_id ?? undefined,
        project_id: t.project_id ?? null, acceptance_criteria: t.acceptance_criteria ?? undefined,
      }));
      const sprint = generateSprintFromTasks(sprintTasks, { title: "Sprint Plan" });
      const firstDay = sprint.days[0];
      const md = `# ${sprint.title}\n\n## Goal\n${firstDay ? firstDay.goal : "Complete selected tasks"}\n\n## Days\n${sprint.days.map(d => `### ${d.day}\n**Goal:** ${d.goal}\n${d.tasks.map(t => `- ${t}`).join("\n")}\n**Acceptance:** ${d.acceptance_criteria.join("; ")}`).join("\n\n")}\n\n## Risks\n${sprint.risks.map(r => `- ${r}`).join("\n")}\n\n## Demo Checklist\n${sprint.demo_checklist.map(c => `- [ ] ${c}`).join("\n")}`;
      const blob = new Blob([md], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "noctra-sprint.md"; a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Sprint downloaded", description: `${selectedTasks.length} task${selectedTasks.length !== 1 ? "s" : ""} → sprint plan.` });
      clearSelection();
    } catch (err) { toast({ title: "Failed to generate sprint", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" }); }
  }

  const counts = useMemo(() => ({
    all: tasks.length,
    todo: tasks.filter((t) => normalizeStatus(t.status) === "todo").length,
    "in-progress": tasks.filter((t) => normalizeStatus(t.status) === "in-progress").length,
    completed: tasks.filter((t) => normalizeStatus(t.status) === "completed").length,
  }), [tasks]);

  async function toggleStatus(task: Task) {
    const next = STATUS_CYCLE[task.status] ?? "todo";
    setTogglingId(task.id);
    try { await updateTaskStatus(task.id, next); setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: next } : t)); }
    catch (err) { toast({ title: "Failed to update status", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" }); }
    finally { setTogglingId(null); }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try { await deleteTask(id); setTasks((prev) => prev.filter((t) => t.id !== id)); }
    catch (err) { toast({ title: "Failed to delete task", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" }); }
    finally { setDeletingId(null); }
  }

  async function handleAdd() {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const task = await createTask({ title: newTitle.trim(), priority: newPriority, category: newCategory });
      setTasks((prev) => [task as Task, ...prev]);
      setNewTitle(""); setShowAdd(false);
    } catch (err) { toast({ title: "Failed to add task", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" }); }
    finally { setAdding(false); }
  }

  const completedPct = tasks.length > 0 ? Math.round((counts.completed / tasks.length) * 100) : 0;

  return (
    <AppShell>
      <div className="p-6 max-w-4xl mx-auto space-y-5">
        <BreadcrumbBar />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Task Queue</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>
              {tasks.length} task{tasks.length !== 1 ? "s" : ""} · {completedPct}% complete · {counts["in-progress"]} in progress
            </p>
          </div>
          <div className="flex gap-2">
            {selectedIds.size > 0 ? (
              <>
                <NoctraButton variant="ghost" onClick={() => copyMarkdown(selectedTasks)} disabled={selectedTasks.length === 0}>
                  {copyDone ? <Check size={13} /> : <Copy size={13} />} Copy ({selectedIds.size})
                </NoctraButton>
                <NoctraButton variant="ghost" onClick={generateSprintFromSelected} disabled={selectedTasks.length === 0}>
                  <Calendar size={13} /> Sprint ({selectedIds.size})
                </NoctraButton>
                <NoctraButton variant="ghost" onClick={clearSelection}><X size={13} /> Clear</NoctraButton>
              </>
            ) : (
              <>
                <NoctraButton variant="ghost" onClick={() => copyMarkdown(filtered)} disabled={filtered.length === 0}>
                  {copyDone ? <Check size={13} /> : <Copy size={13} />} Copy
                </NoctraButton>
                <div className="relative">
                  <NoctraButton variant="ghost" disabled={filtered.length === 0}>
                    <Download size={13} /> Export <ChevronDown size={11} />
                  </NoctraButton>
                </div>
              </>
            )}
            <NoctraButton onClick={() => setShowAdd((v) => !v)}>
              <Plus size={13} /> Add Task
            </NoctraButton>
          </div>
        </div>

        {selectedIds.size === 0 && filtered.length > 0 && (
          <div className="flex gap-2 p-2 rounded-lg" style={{ background: "var(--surface-1)" }}>
            <button onClick={exportMarkdown} className="text-xs px-3 py-1.5 rounded-md" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}>Markdown</button>
            <button onClick={exportGitHub} className="text-xs px-3 py-1.5 rounded-md" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}>GitHub Issues</button>
            <button onClick={() => exportToCSV(filtered)} className="text-xs px-3 py-1.5 rounded-md" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}>CSV</button>
            {filtered.length > 0 && (
              <button onClick={selectAll} className="text-xs px-3 py-1.5 rounded-md ml-auto" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-tertiary)" }}>Select all ({filtered.length})</button>
            )}
          </div>
        )}

        {showAdd && (
          <Panel>
            <div className="space-y-3">
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} placeholder="Task title…" autoFocus className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={{ background: "var(--surface-2)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
              <div className="flex gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Priority:</span>
                  {["high", "medium", "low"].map((p) => (
                    <button key={p} onClick={() => setNewPriority(p)} className="px-2.5 py-0.5 rounded-full text-xs capitalize" style={{ background: newPriority === p ? `${PRIORITY_COLOR[p]}20` : "var(--surface-2)", border: `1px solid ${newPriority === p ? PRIORITY_COLOR[p] : "var(--border-default)"}`, color: newPriority === p ? PRIORITY_COLOR[p] : "var(--text-tertiary)" }}>{p}</button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Category:</span>
                  {["development", "marketing", "research", "ops"].map((c) => (
                    <button key={c} onClick={() => setNewCategory(c)} className="px-2.5 py-0.5 rounded-full text-xs capitalize" style={{ background: newCategory === c ? "var(--signal-soft)" : "var(--surface-2)", border: `1px solid ${newCategory === c ? "var(--signal)" : "var(--border-default)"}`, color: newCategory === c ? "var(--signal)" : "var(--text-tertiary)" }}>{c}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <NoctraButton onClick={handleAdd} disabled={adding || !newTitle.trim()} className="flex-1">{adding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add Task</NoctraButton>
                <NoctraButton variant="ghost" onClick={() => setShowAdd(false)}>Cancel</NoctraButton>
              </div>
            </div>
          </Panel>
        )}

        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks…" className="w-full pl-8 pr-3 py-2 rounded-lg text-sm outline-none" style={{ background: "var(--surface-1)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }} />
          </div>
          {Object.keys(projectMap).length > 0 && (
            <div className="relative">
              <button onClick={() => setShowProjectMenu(!showProjectMenu)} className="px-3 py-2 rounded-lg text-xs flex items-center gap-2" style={{ background: projectFilter !== "all" ? "var(--signal-soft)" : "var(--surface-1)", border: `1px solid ${projectFilter !== "all" ? "var(--signal)" : "var(--border-default)"}`, color: projectFilter !== "all" ? "var(--signal)" : "var(--text-tertiary)" }}>
                {projectFilter === "all" ? "All Projects" : (projectMap[projectFilter] || projectFilter)} <ChevronDown size={11} />
              </button>
              {showProjectMenu && (
                <div className="absolute top-full left-0 mt-1 py-1 rounded-lg shadow-lg z-10 min-w-[160px]" style={{ background: "var(--surface-1)", border: "1px solid var(--border-default)" }}>
                  <button onClick={() => { setProjectFilter("all"); setShowProjectMenu(false); }} className="w-full text-left px-3 py-1.5 text-xs" style={{ color: projectFilter === "all" ? "var(--signal)" : "var(--text-primary)" }}>All Projects</button>
                  {Object.entries(projectMap).map(([id, name]) => (
                    <button key={id} onClick={() => { setProjectFilter(id); setShowProjectMenu(false); }} className="w-full text-left px-3 py-1.5 text-xs" style={{ color: projectFilter === id ? "var(--signal)" : "var(--text-primary)" }}>{name}</button>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Filter size={12} style={{ color: "var(--text-tertiary)" }} />
            {(["all", "high", "medium", "low"] as const).map((p) => (
              <button key={p} onClick={() => setPriorityFilter(p)} className="px-2.5 py-1 rounded-full text-xs capitalize" style={{ background: priorityFilter === p ? (p !== "all" ? `${PRIORITY_COLOR[p]}20` : "var(--surface-2)") : "transparent", border: `1px solid ${priorityFilter === p ? (p !== "all" ? PRIORITY_COLOR[p] : "var(--border-default)") : "transparent"}`, color: priorityFilter === p ? (p !== "all" ? PRIORITY_COLOR[p] : "var(--text-primary)") : "var(--text-tertiary)" }}>{p}</button>
            ))}
          </div>
        </div>

        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--surface-1)" }}>
          {STATUS_TABS.map((st) => (
              <button key={st} onClick={() => setStatusFilter(st)} className="flex-1 px-3 py-2 rounded-lg text-xs font-medium capitalize" style={{ background: statusFilter === st ? "var(--surface-2)" : "transparent", color: statusFilter === st ? STATUS_COLOR[st] ?? "var(--text-primary)" : "var(--text-tertiary)", border: statusFilter === st ? "1px solid var(--border-default)" : "1px solid transparent" }}>
              {st === "all" ? "All" : st} ({counts[st]})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={22} className="animate-spin" style={{ color: "var(--signal)" }} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<ListTodo size={24} />} title={search ? "No tasks match your search" : `No ${statusFilter === "all" ? "" : statusFilter} tasks`} body={tasks.length === 0 ? "Tasks are auto-generated when you save AI reports. You can also add them manually." : "Try a different filter or search term."} />
        ) : (
          <div className="space-y-2">
            {filtered.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                togglingId={togglingId}
                deletingId={deletingId}
                selectedIds={selectedIds}
                projectMap={projectMap}
                onToggleStatus={toggleStatus}
                onDelete={handleDelete}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
        )}

        {tasks.length > 0 && (
          <div className="flex items-center justify-between text-xs pt-2" style={{ color: "var(--text-tertiary)" }}>
            <span>Showing {filtered.length} of {tasks.length} tasks</span>
            <span>{counts.completed} completed · {counts["in-progress"]} in progress · {counts.todo} to do</span>
          </div>
        )}
      </div>
    </AppShell>
  );
}
