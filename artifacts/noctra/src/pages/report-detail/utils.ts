import type { Report } from "./types";
import type { Sprint } from "@/lib/task-generator/types";

export function scoreLabel(score: number): string {
  if (score >= 80) return "Strong";
  if (score >= 65) return "Good";
  if (score >= 50) return "Fair";
  if (score >= 35) return "Weak";
  return "Critical";
}

export function buildContextFromReport(report: Report): string {
  const p = (report.payload as Record<string, unknown>) ?? {};
  const data = (p?.data as Record<string, unknown>) ?? {};
  const parts: string[] = [];
  if (report.title) parts.push(`Title: ${report.title}`);
  if (report.summary) parts.push(`Summary: ${report.summary}`);
  if (p?.input) parts.push(`Input: ${String(p.input)}`);
  Object.entries(data).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      parts.push(`${k}: ${typeof v === "object" ? JSON.stringify(v).slice(0, 500) : String(v)}`);
    }
  });
  return parts.join("\n");
}

export function getPayloadData<T>(report: Report): T | null {
  if (!report.payload) return null;
  const p = report.payload as Record<string, unknown>;
  return (p?.data as T | null) ?? null;
}

export function sprintToMarkdown(sprint: Sprint | Record<string, unknown>): string {
  const title = String((sprint as Sprint).title ?? (sprint as Record<string, unknown>).title ?? "Sprint");
  const days = ((sprint as Sprint).days ?? (sprint as Record<string, unknown>).days ?? []) as Array<{ day: string; goal?: string; tasks: string[] }>;
  const risks = ((sprint as Sprint).risks ?? (sprint as Record<string, unknown>).risks ?? []) as string[];
  const demoChecklist = ((sprint as Sprint).demo_checklist ?? (sprint as Record<string, unknown>).demo_checklist ?? []) as string[];

  const lines = [`# ${title}`, ""];
  days.forEach((d) => {
    lines.push(`## ${d.day}`);
    if (d.goal) lines.push(`Goal: ${d.goal}`);
    d.tasks.forEach((t, i) => lines.push(`${i + 1}. ${t}`));
    lines.push("");
  });
  if (risks.length > 0) { lines.push("## Risks"); risks.forEach((r) => lines.push(`- ${r}`)); lines.push(""); }
  if (demoChecklist.length > 0) { lines.push("## Demo Checklist"); demoChecklist.forEach((d) => lines.push(`- [ ] ${d}`)); lines.push(""); }
  return lines.join("\n");
}

export function promptPackToMarkdown(pack: Record<string, unknown>): string {
  const prompts = (pack?.prompts as Array<Record<string, unknown>>) ?? [];
  const lines = [`# ${String(pack?.title ?? "Prompt Pack")}`, ""];
  if (pack?.description) lines.push(`${String(pack.description)}`, "");
  prompts.forEach((p) => {
    lines.push(`## ${String(p?.phase ?? "Phase")}: ${String(p?.prompt ?? "").slice(0, 80)}`);
    lines.push(`**Tool:** ${String(p?.tool ?? "AI")}`);
    if (p?.estimated_time) lines.push(`**Time:** ${String(p.estimated_time)}`);
    if (p?.difficulty) lines.push(`**Difficulty:** ${String(p.difficulty)}`);
    lines.push("");
    lines.push(String(p?.prompt ?? ""));
    lines.push("");
    const ac = p?.acceptance_criteria as string[] ?? [];
    if (ac.length > 0) { ac.forEach((c) => lines.push(`- [ ] ${c}`)); lines.push(""); }
  });
  return lines.join("\n");
}
