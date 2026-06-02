import type { ReactNode, ElementType } from "react";

export type Report = {
  id: string;
  tool: string;
  title: string;
  score?: number | null;
  summary?: string | null;
  payload: unknown;
  project_id?: string | null;
  created_at: string;
};

export type Project = { id: string; name: string; idea?: string | null };

export type ToolAction = { id: string; label: string; description: string; icon: ElementType; color?: string; busy?: boolean };

export const SCORE_COLOR = (s: number) =>
  s >= 75 ? "var(--color-success)" : s >= 50 ? "var(--color-warning)" : "var(--color-danger)";

export const TOOL_ACCENT: Record<string, string> = {
  idea: "var(--accent-violet)",
  reality: "var(--color-warning)",
  proof: "var(--color-success)",
  swarm: "var(--signal)",
  mvp: "var(--signal)",
  doctor: "var(--color-danger)",
  launch: "var(--color-warning)",
  twin: "var(--accent-magenta)",
  sprint: "var(--signal)",
  "prompt-pack": "var(--accent-violet)",
};
