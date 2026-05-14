export function reportToMarkdown(report: {
  tool: string;
  title: string;
  score?: number | null;
  summary?: string | null;
  created_at: string;
  payload: unknown;
}): string {
  const lines: string[] = [];
  lines.push(`# ${report.title}`);
  lines.push("");
  lines.push(`> **Tool:** ${report.tool} | **Date:** ${new Date(report.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`);
  if (report.score != null) lines.push(`> **Score:** ${report.score}/100`);
  lines.push("");

  if (report.summary) {
    lines.push("## Summary");
    lines.push(`> ${report.summary}`);
    lines.push("");
  }

  const p = report.payload as Record<string, unknown> | null;
  if (!p) return lines.join("\n");
  const data = p.data as Record<string, unknown> | null;
  const output = p.output as string | null;
  if (data) {
    lines.push(objToMarkdown(data));
  } else if (output) {
    lines.push(output);
  }

  lines.push("---");
  lines.push("");
  lines.push(`*Exported from Noctra on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}*`);

  return lines.join("\n");
}

function objToMarkdown(obj: Record<string, unknown>, depth = 0): string {
  const lines: string[] = [];
  const prefix = depth > 0 ? "  " : "";

  for (const [key, value] of Object.entries(obj)) {
    const sectionName = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    if (value === null || value === undefined) continue;

    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      const header = depth === 0 ? `\n## ${sectionName}` : `\n### ${sectionName}`;
      lines.push(header);
      for (const item of value) {
        if (typeof item === "string") {
          lines.push(`${prefix}- ${item}`);
        } else if (typeof item === "object" && item !== null) {
          const o = item as Record<string, unknown>;
          const head = String(o.title ?? o.name ?? o.issue ?? o.feature ?? o.assumption ?? o.label ?? "");
          if (head) lines.push(`\n${prefix}### ${head}`);
          for (const [k, v] of Object.entries(o)) {
            if (k === "title" || k === "name") continue;
            if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
              const label = k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
              lines.push(`${prefix}- **${label}**: ${v}`);
            } else if (Array.isArray(v) && v.length > 0) {
              const label = k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
              lines.push(`${prefix}- **${label}**: ${v.join(", ")}`);
            }
          }
        }
      }
    } else if (typeof value === "object") {
      const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v != null);
      if (entries.length === 0) continue;
      const header = depth === 0 ? `\n## ${sectionName}` : `\n### ${sectionName}`;
      lines.push(header);
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (v == null) continue;
        const label = k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        if (Array.isArray(v)) {
          lines.push(`${prefix}- **${label}**: ${v.join(", ")}`);
        } else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
          lines.push(`${prefix}- **${label}**: ${v}`);
        }
      }
    } else {
      lines.push(`\n## ${sectionName}`);
      lines.push(`${value}`);
    }
  }
  return lines.join("\n");
}

export function reportToSummary(report: {
  title: string;
  tool: string;
  score?: number | null;
  summary?: string | null;
  created_at: string;
  payload?: unknown;
}): string {
  const lines: string[] = [];
  lines.push(`# ${report.title}`);
  lines.push(`**Tool:** ${report.tool} | **Date:** ${new Date(report.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`);
  if (report.score != null) lines.push(`**Score:** ${report.score}/100`);
  if (report.summary) lines.push(`**Summary:** ${report.summary}`);
  const p = report.payload as Record<string, unknown> | null;
  const data = p?.data as Record<string, unknown> | null;
  if (data?.verdict) lines.push(`**Verdict:** ${data.verdict}`);
  if (data?.next_actions && Array.isArray(data.next_actions)) {
    lines.push("");
    lines.push("**Next Actions:**");
    (data.next_actions as string[]).slice(0, 5).forEach((a) => lines.push(`1. ${a}`));
  }
  if (data?.top_blocker) lines.push(`**Top Blocker:** ${data.top_blocker}`);
  if (data?.launch_readiness) lines.push(`**Launch Readiness:** ${data.launch_readiness}`);
  return lines.join("\n");
}

export function downloadMarkdown(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".md") ? filename : `${filename}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function copyText(content: string): Promise<void> {
  if (typeof navigator?.clipboard?.writeText !== "function") {
    throw new Error("Clipboard API not available");
  }
  await navigator.clipboard.writeText(content);
}

export function downloadCSV(filename: string, data: string[][]): void {
  const csvContent = data.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function tasksToGithubMarkdown(tasks: Array<{
  title: string;
  detail?: string | null;
  priority?: string;
  status?: string;
}>): string {
  const lines = ["# Tasks — GitHub Issues\n"];
  for (const task of tasks) {
    lines.push(`## ${task.title}`);
    if (task.priority) lines.push(`**Priority:** ${task.priority}`);
    if (task.status) lines.push(`**Status:** ${task.status}`);
    if (task.detail) lines.push(`\n${task.detail}`);
    lines.push(`\n---\n`);
  }
  return lines.join("\n");
}
