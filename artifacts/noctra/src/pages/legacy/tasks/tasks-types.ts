export type Task = {
  id: string; title: string; detail?: string | null;
  priority: string; category?: string | null; status: string; created_at: string;
  source_report_id?: string | null;
  project_id?: string | null;
  acceptance_criteria?: string[] | null;
};

const STATUS_MAP: Record<string, string> = {
  open: "todo", "in-progress": "in-progress", completed: "completed",
  todo: "todo", doing: "in-progress", done: "completed",
};

export function normalizeStatus(s: string): string {
  return STATUS_MAP[s] ?? "todo";
}

export const STATUS_CYCLE: Record<string, string> = {
  todo: "in-progress", "in-progress": "completed", completed: "todo",
};

export const STATUS_TABS = ["all", "todo", "in-progress", "completed"] as const;
export type StatusTab = typeof STATUS_TABS[number];

export const PRIORITY_COLOR: Record<string, string> = {
  critical: "var(--color-danger)", high: "var(--color-danger)", medium: "var(--color-warning)", low: "var(--color-success)",
};

export const STATUS_COLOR: Record<string, string> = {
  todo: "var(--text-tertiary)", "in-progress": "var(--signal)", completed: "var(--color-success)",
};

export function exportToCSV(tasks: Task[]) {
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
