import type { Task, Sprint, SprintDay } from "./types";

export function generateSprintFromTasks(
  tasks: Task[],
  options: { title?: string; duration?: number; maxTasksPerDay?: number } = {},
): Sprint {
  const title = options.title || "Sprint Plan";
  const duration = options.duration ?? 14;
  const maxTasksPerDay = options.maxTasksPerDay ?? 3;

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
