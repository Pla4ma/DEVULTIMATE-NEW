import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { AppShell } from "@/components/AppShell";
import { motion, AnimatePresence } from "framer-motion";
import { isDemoMode } from "@/lib/demo-mode";
import { callStructuredAI } from "@/lib/ai";
import { saveReport, getTasks, getReports } from "@/lib/repository";
import { generateTasksFromReport } from "@/lib/task-generator";
import { useProgression } from "@/lib/progression-context";
import { useToast } from "@/hooks/use-toast";
import { ObsidianButton } from "@/components/ObsidianButton";
import {
  Map, CheckSquare, Wand2, Loader2, RotateCcw, CheckCircle, Zap,
  ArrowRight, AlertTriangle, Clock, ArrowUpRight, Plus, Filter,
  ChevronDown, ChevronUp, Trash2, Edit2,
} from "lucide-react";

type ToolMode = "mvp" | "tasks";
type Phase = "idle" | "running" | "done" | "error";
type TaskStatus = "todo" | "in_progress" | "completed";
type TaskPriority = "critical" | "high" | "medium" | "low";

interface Task {
  id: string;
  title: string;
  detail?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category?: string;
  created_at: string;
}

const MODES: Array<{ key: ToolMode; label: string; icon: typeof Map; color: string; description: string }> = [
  { key: "mvp", label: "MVP Planner", icon: Map, color: "#8b5cf6", description: "Lock scope, define success metrics, and generate a build plan." },
  { key: "tasks", label: "Fix Tasks", icon: CheckSquare, color: "#f97316", description: "Tasks generated from your scans. Prioritized and ready to execute." },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function BuildPlannerPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { refreshProgression } = useProgression();

  const [mode, setMode] = useState<ToolMode>("tasks");
  const [phase, setPhase] = useState<Phase>("idle");
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">("all");
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const currentMode = MODES.find((m) => m.key === mode)!;

  useEffect(() => {
    if (mode === "tasks") loadTasks();
  }, [mode]);

  useEffect(() => {
    if (!isDemoMode()) return;
    import("@/lib/repository").then(({ getReports }) => {
      getReports("mvp").then((reps) => {
        const latest = (reps as Array<{ id: string; tool: string; title: string; score?: number | null; summary?: string | null; payload?: unknown }>)?.[0];
        if (!latest?.payload) return;
        const p = latest.payload as Record<string, unknown>;
        const data = (p.data ?? p) as Record<string, unknown>;
        setResult(data as Record<string, unknown>);
        setSavedReportId(latest.id);
        setPhase("done");
      }).catch(() => {});
    });
  }, []);

  async function loadTasks() {
    setLoadingTasks(true);
    try {
      const t = await getTasks();
      setTasks((t as Task[]) ?? []);
    } catch (e) {
      toast({ title: "Failed to load tasks", variant: "destructive" });
    } finally {
      setLoadingTasks(false);
    }
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (phase === "idle" && input.trim() && mode === "mvp") void run();
    }
  }, [phase, input, mode]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  async function run() {
    if (!input.trim()) return;
    setPhase("running");
    setError("");
    setResult(null);
    setSavedReportId(null);

    try {
      const res = await callStructuredAI("mvp", input.trim());
      setResult(res);
      setPhase("done");

      const report = await saveReport({
        tool: "mvp",
        title: res.title || `MVP Plan — ${input.slice(0, 60)}`,
        payload: { data: res.data, markdown: res.markdown },
        score: res.score ?? undefined,
        summary: res.summary,
      });
      const r = report as { id?: string } | null;
      setSavedReportId(r?.id ?? null);
      if (r?.id) await generateTasksFromReport({ id: r.id, tool: "mvp", payload: { data: res.data }, project_id: null });
      refreshProgression();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setPhase("error");
    }
  }

  function reset() {
    setPhase("idle");
    setResult(null);
    setError("");
    setSavedReportId(null);
    setInput("");
  }

  async function updateTaskStatus(taskId: string, status: TaskStatus) {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status } : t));
      refreshProgression();
    } catch (e) {
      toast({ title: "Failed to update task", variant: "destructive" });
    }
  }

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    return true;
  });

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "completed").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    todo: tasks.filter((t) => t.status === "todo").length,
    critical: tasks.filter((t) => t.priority === "critical" && t.status !== "completed").length,
    high: tasks.filter((t) => t.priority === "high" && t.status !== "completed").length,
  };

  const d = result?.data as Record<string, unknown> | null;
  const ruthlessScope = d?.ruthless_scope as Record<string, unknown> | null;
  const buildNow = Array.isArray(ruthlessScope?.build_now) ? ruthlessScope.build_now as string[] : [];
  const buildLater = Array.isArray(ruthlessScope?.build_later) ? ruthlessScope.build_later as string[] : [];
  const northStar = d?.north_star_metric as string || null;
  const weekPlan = Array.isArray(d?.week_plan) ? d.week_plan as Array<{ week: number; focus: string; deliverables: string[] }> : [];

  return (
    <AppShell>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <motion.div {...fadeInUp} className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight mb-2 text-display" style={{ color: "#fff" }}>Build Planner</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Plan MVP scope and track execution</p>
        </motion.div>

        <motion.div {...fadeInUp} className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => { setMode(m.key); if (m.key === "tasks") loadTasks(); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
                style={{
                  background: active ? `${m.color}15` : "rgba(20, 18, 40, 0.5)",
                  border: `1px solid ${active ? m.color : "rgba(139, 92, 246, 0.12)"}`,
                  color: active ? m.color : "rgba(255,255,255,0.6)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <Icon size={16} />
                {m.label}
                {m.key === "tasks" && taskStats.critical > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "var(--color-danger)", color: "#fff" }}>
                    {taskStats.critical}
                  </span>
                )}
              </button>
            );
          })}
        </motion.div>

        {mode === "mvp" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div {...fadeInUp} className="glass overflow-hidden">
              <div className="px-5 py-3 border-b" style={{ borderColor: "rgba(139, 92, 246, 0.12)" }}>
                <span className="eyebrow" style={{ color: "rgba(255,255,255,0.6)" }}>Input</span>
              </div>
              <div className="p-5 space-y-4">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe your product idea and what you want to build first..."
                  rows={8}
                  disabled={phase === "running"}
                  className="w-full px-4 py-3 rounded-lg text-sm resize-none outline-none"
                  style={{ background: "rgba(20, 18, 40, 0.5)", border: "1px solid rgba(139, 92, 246, 0.12)", color: "#fff", backdropFilter: "blur(12px)" }}
                  maxLength={4000}
                />
                <div className="flex gap-3">
                  <ObsidianButton
                    variant="primary"
                    onClick={run}
                    disabled={phase === "running" || !input.trim()}
                    className="flex-1"
                  >
                    {phase === "running" ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                    {phase === "running" ? "Generating plan..." : "Generate MVP Plan"}
                  </ObsidianButton>
                  {phase !== "idle" && (
                    <ObsidianButton variant="secondary" onClick={reset}><RotateCcw size={16} /></ObsidianButton>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div {...fadeInUp} className="glass overflow-hidden">
              <div className="px-5 py-3 border-b" style={{ borderColor: "rgba(139, 92, 246, 0.12)" }}>
                <span className="eyebrow" style={{ color: "rgba(255,255,255,0.6)" }}>Output</span>
              </div>
              <div className="p-5">
                <AnimatePresence mode="wait">
                  {phase === "idle" && (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(20, 18, 40, 0.5)", backdropFilter: "blur(12px)" }}>
                        <Map size={28} style={{ color: "#f97316" }} />
                      </div>
                      <p className="text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>MVP Planner awaiting input</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Describe your idea to generate a ruthless scope and build plan</p>
                    </motion.div>
                  )}

                  {phase === "running" && (
                    <motion.div key="running" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-16">
                      <Loader2 size={32} className="animate-spin mb-4" style={{ color: "#f97316" }} />
                      <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Generating your build plan...</p>
                    </motion.div>
                  )}

                  {phase === "done" && result && (
                    <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                      {northStar && (
                        <div className="p-5 rounded-xl" style={{ background: "rgba(249, 115, 22, 0.06)", border: "1px solid rgba(249, 115, 22, 0.12)" }}>
                          <p className="eyebrow mb-2" style={{ color: "#f97316" }}>North Star Metric</p>
                          <p className="text-base font-semibold" style={{ color: "#fff" }}>{northStar}</p>
                        </div>
                      )}

                      {buildNow.length > 0 && (
                        <div>
                          <p className="eyebrow mb-2" style={{ color: "var(--color-success)" }}>Build Now</p>
                          <div className="space-y-1.5">
                            {buildNow.map((item, i) => (
                              <div key={i} className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg" style={{ background: "rgba(20, 18, 40, 0.5)", border: "1px solid rgba(139, 92, 246, 0.12)", backdropFilter: "blur(12px)" }}>
                                <CheckCircle size={14} className="mt-0.5 shrink-0" style={{ color: "var(--color-success)" }} />
                                <span className="text-sm" style={{ color: "#fff" }}>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {buildLater.length > 0 && (
                        <div>
                          <p className="eyebrow mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Build Later</p>
                          <div className="space-y-1.5">
                            {buildLater.map((item, i) => (
                              <div key={i} className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg opacity-60" style={{ background: "rgba(20, 18, 40, 0.5)", border: "1px solid rgba(139, 92, 246, 0.12)", backdropFilter: "blur(12px)" }}>
                                <Clock size={14} className="mt-0.5 shrink-0" style={{ color: "rgba(255,255,255,0.5)" }} />
                                <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {savedReportId && (
                        <ObsidianButton variant="secondary" onClick={() => navigate(`/app/reports/${savedReportId}`)} className="w-full">
                          <ArrowUpRight size={12} /> View Full Report
                        </ObsidianButton>
                      )}
                    </motion.div>
                  )}

                  {phase === "error" && (
                    <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-16 text-center">
                      <AlertTriangle size={32} className="mb-4" style={{ color: "var(--color-danger)" }} />
                      <p className="text-sm font-medium mb-1" style={{ color: "var(--color-danger)" }}>Failed to generate plan</p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{error}</p>
                      <ObsidianButton variant="secondary" onClick={reset} className="mt-4">Try Again</ObsidianButton>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        ) : (
          <motion.div {...fadeInUp} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total", value: taskStats.total, color: "#fff" },
                { label: "Completed", value: taskStats.completed, color: "var(--color-success)" },
                { label: "In Progress", value: taskStats.inProgress, color: "var(--color-warning)" },
                { label: "Critical", value: taskStats.critical, color: "var(--color-danger)" },
              ].map((stat) => (
                <div key={stat.label} className="glass p-4">
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{stat.label}</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: stat.color }}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as TaskStatus | "all")}
                className="px-3 py-2 rounded-lg text-xs"
                style={{ background: "rgba(20, 18, 40, 0.5)", border: "1px solid rgba(139, 92, 246, 0.12)", color: "#fff", backdropFilter: "blur(12px)" }}
              >
                <option value="all">All Status</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as TaskPriority | "all")}
                className="px-3 py-2 rounded-lg text-xs"
                style={{ background: "rgba(20, 18, 40, 0.5)", border: "1px solid rgba(139, 92, 246, 0.12)", color: "#fff", backdropFilter: "blur(12px)" }}
              >
                <option value="all">All Priority</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {loadingTasks ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl skeleton" />)}
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-16">
                <CheckSquare size={32} className="mx-auto mb-4" style={{ color: "rgba(255,255,255,0.5)" }} />
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>No tasks found</p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>Run Product Doctor or MVP Planner to generate tasks</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    className="glass p-4 cursor-pointer transition-colors"
                    style={{
                      borderColor: task.priority === "critical" && task.status !== "completed" ? "var(--color-danger)" : "rgba(139, 92, 246, 0.12)",
                      opacity: task.status === "completed" ? 0.7 : 1,
                    }}
                    onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); updateTaskStatus(task.id, task.status === "completed" ? "todo" : "completed"); }}
                        className="mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0"
                        style={{
                          borderColor: task.status === "completed" ? "var(--color-success)" : "rgba(139, 92, 246, 0.12)",
                          background: task.status === "completed" ? "var(--color-success-soft)" : "transparent",
                        }}
                      >
                        {task.status === "completed" && <CheckCircle size={12} style={{ color: "var(--color-success)" }} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: task.status === "completed" ? "rgba(255,255,255,0.5)" : "#fff", textDecoration: task.status === "completed" ? "line-through" : "none" }}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
                            background: task.priority === "critical" ? "var(--color-danger-soft)" : task.priority === "high" ? "var(--color-warning-soft)" : "rgba(20, 18, 40, 0.5)",
                            color: task.priority === "critical" ? "var(--color-danger)" : task.priority === "high" ? "var(--color-warning)" : "rgba(255,255,255,0.6)",
                          }}>
                            {task.priority}
                          </span>
                          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>{task.category}</span>
                        </div>
                      </div>
                      {expandedTask === task.id ? <ChevronUp size={14} style={{ color: "rgba(255,255,255,0.5)" }} /> : <ChevronDown size={14} style={{ color: "rgba(255,255,255,0.5)" }} />}
                    </div>

                    <AnimatePresence>
                      {expandedTask === task.id && task.detail && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <p className="text-xs mt-3 pl-8" style={{ color: "rgba(255,255,255,0.6)" }}>{task.detail}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
