import { saveTasks } from "./repository";

export interface Task {
  id: string;
  title: string;
  detail?: string;
  priority: "high" | "medium" | "low";
  category: string;
  acceptance_criteria?: string[];
  source_report_id?: string;
  project_id?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface SprintDay {
  day: string;
  goal: string;
  tasks: string[];
  acceptance_criteria: string[];
}

export interface Sprint {
  id: string;
  title: string;
  days: SprintDay[];
  risks: string[];
  demo_checklist: string[];
  duration?: number;
  maxTasksPerDay?: number;
}

interface DraftTask {
  title: string;
  detail?: string;
  priority: "high" | "medium" | "low";
  category: string;
  acceptance_criteria?: string[];
  sourceReportId?: string;
  projectId?: string | null;
}

export function normalizePriority(value: unknown): "high" | "medium" | "low" {
  const v = String(value ?? "medium").toLowerCase();
  if (v === "high" || v === "critical" || v === "urgent") return "high";
  if (v === "low" || v === "minor") return "low";
  return "medium";
}

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const asObj = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v.trim() : v == null ? fallback : String(v).trim();

function truncate(s: string, max = 100): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

export async function generateTasksFromReport(input: {
  id: string;
  tool: string;
  payload: unknown;
  project_id?: string | null;
}): Promise<number> {
  const payload = asObj(input.payload);
  const data = asObj(payload.data ?? payload);
  if (!data || Object.keys(data).length === 0) return 0;

  const drafts: DraftTask[] = [];
  const base = { sourceReportId: input.id, projectId: input.project_id ?? null };

  function push(t: Omit<DraftTask, "sourceReportId" | "projectId">) {
    if (!t.title?.trim()) return;
    drafts.push({ ...base, ...t });
  }

  switch (input.tool) {
    case "idea": {
      // Next actions from signal analysis
      asArray(data.next_actions).slice(0, 6).forEach((a) => {
        const title = str(a);
        if (title) push({ title: truncate(title), priority: "high", category: "strategy", detail: "Generated from Signal Chamber analysis" });
      });
      // Each risky assumption becomes a validation task
      asArray(data.assumptions).slice(0, 5).forEach((raw) => {
        const a = asObj(raw);
        const assumption = str(a.assumption);
        const test = str(a.test);
        if (!assumption) return;
        push({
          title: truncate(`Validate: ${assumption}`),
          detail: test || `Test assumption: ${assumption}`,
          priority: normalizePriority(a.risk),
          category: "validation",
        });
      });
      // Sharpest experiment as a standalone task
      const experiment = str(data.sharpest_experiment);
      if (experiment) {
        push({ title: truncate(`Run: ${experiment}`), detail: "Sharpest experiment from Signal Chamber", priority: "high", category: "validation" });
      }
      break;
    }

    case "reality": {
      // Patch plan items — these are the actual actionable fixes (field exists in AI schema)
      asArray(data.patch_plan).slice(0, 8).forEach((raw) => {
        const p = asObj(raw);
        const problem = str(p.problem);
        const patch = str(p.patch);
        if (!patch && !problem) return;
        push({
          title: truncate(patch || `Fix: ${problem}`),
          detail: problem ? `Problem: ${problem}` : undefined,
          priority: normalizePriority(p.priority ?? p.effort),
          category: "strategy",
        });
      });
      // High/critical risk items become mitigation tasks
      asArray(data.risk_items).slice(0, 6).forEach((raw) => {
        const r = asObj(raw);
        const mitigation = str(r.mitigation);
        const assumption = str(r.assumption);
        if (!mitigation) return;
        const sev = str(r.severity);
        if (sev === "critical" || sev === "high") {
          push({
            title: truncate(`Mitigate: ${mitigation}`),
            detail: assumption ? `Assumption at risk: ${assumption}` : undefined,
            priority: sev === "critical" ? "high" : "medium",
            category: "validation",
          });
        }
      });
      // Next actions
      asArray(data.next_actions).slice(0, 4).forEach((a) => {
        const title = str(a);
        if (title) push({ title: truncate(title), priority: "high", category: "strategy" });
      });
      // Blind spots to investigate
      asArray(data.blind_spots).slice(0, 3).forEach((b) => {
        const title = str(b);
        if (title) push({ title: truncate(`Investigate: ${title}`), priority: "medium", category: "validation" });
      });
      break;
    }

    case "proof": {
      // Each planned/running experiment becomes a task
      asArray(data.experiments).slice(0, 8).forEach((raw) => {
        const e = asObj(raw);
        const title = str(e.title);
        const method = str(e.method);
        const successSignal = str(e.success_signal);
        if (!title) return;
        push({
          title: truncate(`Experiment: ${title}`),
          detail: [method, successSignal ? `Success: ${successSignal}` : ""].filter(Boolean).join(" | "),
          priority: normalizePriority(e.effort),
          category: "validation",
        });
      });
      // Evidence gaps are explicit tasks
      asArray(data.evidence_gaps).slice(0, 4).forEach((g) => {
        const gap = str(g);
        if (gap) push({ title: truncate(`Close evidence gap: ${gap}`), priority: "high", category: "validation" });
      });
      // Next experiments
      asArray(data.next_experiments).slice(0, 3).forEach((e) => {
        const title = str(e);
        if (title) push({ title: truncate(`Run: ${title}`), priority: "high", category: "validation" });
      });
      asArray(data.next_actions).slice(0, 3).forEach((a) => {
        const title = str(a);
        if (title) push({ title: truncate(title), priority: "medium", category: "strategy" });
      });
      break;
    }

    case "swarm": {
      // Recommendations as strategy tasks
      asArray(data.recommendations).slice(0, 5).forEach((r) => {
        const title = str(r);
        if (title) push({ title: truncate(title), priority: "high", category: "strategy" });
      });
      // Top objections that are blocking → create rebuttal/fix tasks
      asArray(data.top_objections).slice(0, 4).forEach((raw) => {
        const o = asObj(raw);
        const objection = str(o.objection);
        const rebuttal = str(o.rebuttal);
        const blocking = o.blocking === true || str(o.frequency) === "high";
        if (!objection || !blocking) return;
        push({
          title: truncate(`Address objection: ${objection}`),
          detail: rebuttal ? `Rebuttal: ${rebuttal}` : undefined,
          priority: "high",
          category: "validation",
        });
      });
      // Next experiments
      asArray(data.next_experiments).slice(0, 3).forEach((e) => {
        const title = str(e);
        if (title) push({ title: truncate(`Experiment: ${title}`), priority: "high", category: "validation" });
      });
      asArray(data.next_actions).slice(0, 3).forEach((a) => {
        const title = str(a);
        if (title) push({ title: truncate(title), priority: "medium", category: "strategy" });
      });
      break;
    }

    case "mvp": {
      // Build-now features are dev tasks
      const scope = asObj(data.ruthless_scope);
      asArray(scope.build_now).slice(0, 8).forEach((f) => {
        const title = str(f);
        if (title) push({ title: truncate(`Build: ${title}`), priority: "high", category: "development" });
      });
      // Feature ROI: only BUILD decisions
      asArray(data.feature_roi).slice(0, 6).forEach((raw) => {
        const f = asObj(raw);
        if (str(f.decision) !== "BUILD") return;
        const title = str(f.feature);
        const reason = str(f.reason);
        if (!title) return;
        const score = typeof f.score === "number" ? f.score : 0;
        push({
          title: truncate(`Build: ${title}`),
          detail: reason || undefined,
          priority: score >= 7 ? "high" : score >= 4 ? "medium" : "low",
          category: "development",
        });
      });
      // Week tasks from the plan
      asArray(data.weeks).slice(0, 4).forEach((raw, weekIndex) => {
        const w = asObj(raw);
        const goal = str(w.goal);
        asArray(w.tasks).slice(0, 4).forEach((t) => {
          const title = str(t);
          if (!title) return;
          push({
            title: truncate(`Week ${weekIndex + 1}: ${title}`),
            detail: goal || undefined,
            priority: weekIndex === 0 ? "high" : "medium",
            category: "development",
          });
        });
      });
      asArray(data.next_actions).slice(0, 3).forEach((a) => {
        const title = str(a);
        if (title) push({ title: truncate(title), priority: "high", category: "strategy" });
      });
      break;
    }

    case "doctor": {
      // CRITICAL and HIGH issues first
      asArray(data.issues).slice(0, 8).forEach((raw) => {
        const issue = asObj(raw);
        const sev = str(issue.severity);
        if (sev !== "CRITICAL" && sev !== "HIGH") return;
        const title = str(issue.issue);
        const fix = str(issue.fix);
        if (!title) return;
        push({
          title: truncate(`Fix: ${title}`),
          detail: fix || undefined,
          priority: sev === "CRITICAL" ? "high" : "medium",
          category: "technical",
          acceptance_criteria: fix ? [`${fix} is applied and tested`] : undefined,
        });
      });
      // Repair queue items
      asArray(data.repair_queue).slice(0, 6).forEach((item) => {
        const title = str(item);
        if (title) push({ title: truncate(title), priority: "high", category: "technical" });
      });
      // Fix plan for medium items not already covered
      asArray(data.fix_plan).slice(0, 4).forEach((raw) => {
        const f = asObj(raw);
        if (str(f.priority) !== "high") return;
        const title = str(f.title);
        if (!title) return;
        push({
          title: truncate(title),
          detail: str(f.code_hint) || undefined,
          priority: "medium",
          category: "technical",
        });
      });
      // Critical issues as separate tasks
      asArray(data.critical_issues).slice(0, 3).forEach((c) => {
        const title = str(c);
        if (title) push({ title: truncate(`CRITICAL: ${title}`), priority: "high", category: "technical" });
      });
      asArray(data.next_actions).slice(0, 3).forEach((a) => {
        const title = str(a);
        if (title) push({ title: truncate(title), priority: "high", category: "technical" });
      });
      break;
    }

    case "launch": {
      // Launch checklist — each item is an object {item, category, done, critical}
      asArray(data.launch_checklist).slice(0, 12).forEach((raw) => {
        const item = typeof raw === "string" ? raw : str(asObj(raw).item);
        if (!item) return;
        const obj = typeof raw === "string" ? {} : asObj(raw);
        const isDone = obj.done === true;
        if (isDone) return; // skip already-done items
        const isCritical = obj.critical === true;
        push({
          title: truncate(item),
          priority: isCritical ? "high" : "medium",
          category: str(obj.category) || "launch",
        });
      });
      // Day one actions
      asArray(data.day_one_actions).slice(0, 5).forEach((a) => {
        const title = str(a);
        if (title) push({ title: truncate(`Day 1: ${title}`), priority: "high", category: "launch" });
      });
      // High-probability, high-impact risks need mitigation tasks
      asArray(data.risks).slice(0, 4).forEach((raw) => {
        const r = asObj(raw);
        const risk = str(r.risk);
        const mitigation = str(r.mitigation);
        if (!mitigation || (str(r.probability) !== "high" && str(r.impact) !== "high")) return;
        push({
          title: truncate(`Mitigate: ${risk || mitigation}`),
          detail: mitigation,
          priority: "high",
          category: "launch",
        });
      });
      asArray(data.next_actions).slice(0, 3).forEach((a) => {
        const title = str(a);
        if (title) push({ title: truncate(title), priority: "high", category: "launch" });
      });
      break;
    }

    case "twin": {
      // Strategic moves
      asArray(data.strategic_moves).slice(0, 5).forEach((m) => {
        const title = str(m);
        if (title) push({ title: truncate(title), priority: "high", category: "strategy" });
      });
      // Drift signals that are high severity need action
      asArray(data.drift_signals).slice(0, 3).forEach((raw) => {
        const d = asObj(raw);
        const signal = str(d.signal);
        if (!signal || str(d.severity) === "low") return;
        push({ title: truncate(`Address drift: ${signal}`), priority: str(d.severity) === "high" ? "high" : "medium", category: "strategy" });
      });
      asArray(data.next_actions).slice(0, 4).forEach((a) => {
        const title = str(a);
        if (title) push({ title: truncate(title), priority: "medium", category: "strategy" });
      });
      break;
    }

    default:
      return 0;
  }

  if (drafts.length === 0) return 0;

  // Deduplicate by title
  const seen = new Set<string>();
  const unique = drafts.filter((d) => {
    const key = d.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  try {
    const saved = await saveTasks(
      unique.map((d) => ({
        title: d.title,
        detail: d.detail,
        priority: d.priority,
        category: d.category,
        sourceReportId: d.sourceReportId,
        projectId: d.projectId ?? undefined,
      })),
    );
    return Array.isArray(saved) ? saved.length : unique.length;
  } catch {
    return 0;
  }
}

export const createTasksFromReport = generateTasksFromReport;

export function generateSprintFromTasks(
  tasks: Task[],
  options: { title?: string; duration?: number; maxTasksPerDay?: number } = {},
): Sprint {
  const title = options.title || "Sprint Plan";
  const duration = options.duration ?? 14;
  const maxTasksPerDay = options.maxTasksPerDay ?? 3;

  // Sort by priority then category impact
  const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
  const categoryOrder: Record<string, number> = { technical: 5, development: 4, validation: 3, launch: 2, strategy: 1 };

  const sorted = [...tasks].sort((a, b) => {
    const dp = (priorityOrder[b.priority] ?? 2) - (priorityOrder[a.priority] ?? 2);
    if (dp !== 0) return dp;
    return (categoryOrder[b.category] ?? 0) - (categoryOrder[a.category] ?? 0);
  });

  const totalDays = Math.max(1, Math.ceil(sorted.length / maxTasksPerDay));
  const days: SprintDay[] = [];

  for (let day = 1; day <= totalDays; day++) {
    const slice = sorted.slice((day - 1) * maxTasksPerDay, day * maxTasksPerDay);

    // Build a meaningful goal from the tasks in this day
    const categories = [...new Set(slice.map((t) => t.category))];
    const highPriority = slice.filter((t) => t.priority === "high");
    const goal =
      highPriority.length > 0
        ? `Complete ${highPriority.length} high-priority ${categories.join("/")} task${highPriority.length > 1 ? "s" : ""}`
        : `Complete ${slice.length} ${categories.join("/")} task${slice.length > 1 ? "s" : ""}`;

    days.push({
      day: `Day ${day}`,
      goal,
      tasks: slice.map((t) => t.title),
      acceptance_criteria: slice.map((t) =>
        t.acceptance_criteria?.join("; ") || `"${t.title}" is done and verified`
      ),
    });
  }

  const risks: string[] = [];
  const highPriorityTasks = tasks.filter((t) => t.priority === "high");
  if (highPriorityTasks.length > 5) {
    risks.push(`${highPriorityTasks.length} high-priority tasks — daily re-prioritization recommended`);
  }
  const techTasks = tasks.filter((t) => t.category === "technical");
  if (techTasks.length > 0) {
    risks.push(`${techTasks.length} technical tasks — may expose unknown dependencies that extend the sprint`);
  }
  const launchTasks = tasks.filter((t) => t.category === "launch");
  if (launchTasks.length > 0) {
    risks.push(`${launchTasks.length} launch tasks — external dependencies (DNS, payments, stores) may cause delays`);
  }

  return {
    id: `sprint-${Date.now()}`,
    title,
    days,
    duration,
    maxTasksPerDay,
    risks: risks.slice(0, 5),
    demo_checklist: [
      "All high-priority tasks completed or explicitly deferred with documented reason",
      "Working software demo with real data (not mocked)",
      "Error states tested and handled gracefully",
      "Performance acceptable under real usage patterns",
    ],
  };
}
