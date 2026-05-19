export type Project = {
  id: string; name: string; idea?: string | null;
  stage?: string | null; status?: string | null; created_at: string;
};
export type Report = {
  id: string; tool: string; title: string;
  score?: number | null; summary?: string | null; payload: unknown; created_at: string;
  project_id?: string | null;
};
export type Task = {
  id: string; title: string; status: string; priority: string;
  category?: string | null; source_report_id?: string | null;
};
export type ProofSignal = {
  id: string; label: string; kind: string; value?: number | null;
  source?: string | null; evidence?: string | null; created_at: string;
};

export const STAGES = ["idea", "validation", "building", "launched", "paused"];
export const STAGE_COLORS: Record<string, string> = {
  idea: "var(--noctra-violet)", validation: "var(--noctra-amber)",
  building: "var(--noctra-cyan)", launched: "var(--noctra-emerald)", paused: "var(--noctra-text-muted)",
};
export const PRIORITY_COLOR: Record<string, string> = {
  high: "var(--noctra-rose)", medium: "var(--noctra-amber)", low: "var(--noctra-emerald)",
  critical: "var(--noctra-rose)",
};
export const STATUS_COLOR: Record<string, string> = {
  todo: "var(--noctra-text-muted)", "in-progress": "var(--noctra-cyan)",
  completed: "var(--noctra-emerald)", blocked: "var(--noctra-rose)",
};
export const INTELLIGENCE_TOOLS = ["idea", "reality", "proof", "swarm", "mvp", "doctor", "launch"] as const;
export const SCORE_COLOR = (s: number) =>
  s >= 70 ? "var(--noctra-emerald)" : s >= 50 ? "var(--noctra-amber)" : "var(--noctra-rose)";

export type Tab = "overview" | "reports" | "execution" | "proof" | "doctor" | "twin" | "launch" | "history";
