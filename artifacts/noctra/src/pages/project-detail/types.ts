export type Project = {
  id: string; name: string; idea?: string | null;
  stage?: string | null; status?: string | null; created_at: string;
  launch_readiness_score?: number | null;
  scan_count?: number | null;
  last_scan_at?: string | null;
};
export type Report = {
  id: string; tool: string; title: string;
  score?: number | null; summary?: string | null; payload: unknown; created_at: string;
  project_id?: string | null;
};
export type Task = {
  id: string; title: string; status: string; priority: string;
  category?: string | null; source_report_id?: string | null;
  linked_blocker_id?: string | null;
  evidence?: string | null;
  target_files_or_areas?: string | null;
  estimated_difficulty?: string | null;
  acceptance_criteria?: string | null;
  suggested_ai_prompt?: string | null;
};
export type ProofSignal = {
  id: string; label: string; kind: string; value?: number | null;
  source?: string | null; evidence?: string | null; created_at: string;
};

export const STAGES = ["IDEA", "PLANNED", "BUILDING", "SCANNED", "FIXING", "READY_SOON", "LAUNCH_READY", "LAUNCHED"];
export const STAGE_COLORS: Record<string, string> = {
  IDEA: "var(--noctra-violet)",
  PLANNED: "var(--noctra-amber)",
  BUILDING: "var(--noctra-cyan)",
  SCANNED: "var(--noctra-blue)",
  FIXING: "var(--noctra-rose)",
  READY_SOON: "var(--noctra-emerald)",
  LAUNCH_READY: "var(--noctra-gold)",
  LAUNCHED: "var(--noctra-emerald)",
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

export type Tab = "overview" | "reports" | "execution" | "proof" | "doctor" | "blockers" | "twin" | "launch" | "history";
