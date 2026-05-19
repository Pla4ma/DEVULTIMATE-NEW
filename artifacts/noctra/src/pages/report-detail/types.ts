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
  s >= 75 ? "var(--noctra-emerald)" : s >= 50 ? "var(--noctra-amber)" : "var(--noctra-rose)";

export const TOOL_ACCENT: Record<string, string> = {
  idea: "var(--noctra-violet)",
  reality: "var(--noctra-amber)",
  proof: "var(--noctra-emerald)",
  swarm: "var(--noctra-cyan)",
  mvp: "var(--noctra-cyan)",
  doctor: "var(--noctra-rose)",
  launch: "var(--noctra-amber)",
  twin: "var(--noctra-magenta)",
  sprint: "var(--noctra-cyan)",
  "prompt-pack": "var(--noctra-violet)",
};
