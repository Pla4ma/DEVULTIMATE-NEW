// timeline.ts — Build a chronological event log from Noctra data
// Pure utility: no React, no side effects.

export type TimelineEventType =
  | "idea_checked"
  | "reality_compiled"
  | "proof_generated"
  | "proof_signal_added"
  | "swarm_run"
  | "mvp_planned"
  | "tasks_generated"
  | "project_scanned"
  | "launch_planned"
  | "passport_stamp"
  | "report_saved"
  | "project_created";

export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  title: string;
  description: string;
  date: string;
  href?: string;
  score?: number;
  severity?: string;
};

type ReportLike = {
  id: string;
  tool: string;
  title: string;
  score?: number | null;
  summary?: string | null;
  created_at: string;
};

type ProofSignalLike = {
  id: string;
  label: string;
  kind: string;
  created_at: string;
};

type ProjectLike = {
  id: string;
  name: string;
  created_at: string;
};

const TOOL_LABELS: Record<string, string> = {
  idea: "Idea Checker",
  reality: "Reality Compiler",
  proof: "Proof Engine",
  swarm: "Market Swarm",
  mvp: "MVP Planner",
  doctor: "Project Doctor",
  launch: "Launch Room",
};

function toolToEventType(tool: string): TimelineEventType {
  const map: Record<string, TimelineEventType> = {
    idea: "idea_checked",
    reality: "reality_compiled",
    proof: "proof_generated",
    swarm: "swarm_run",
    mvp: "mvp_planned",
    doctor: "project_scanned",
    launch: "launch_planned",
  };
  return map[tool] ?? "report_saved";
}

export const TIMELINE_TYPE_LABELS: Record<TimelineEventType, string> = {
  idea_checked: "Idea analyzed",
  reality_compiled: "Reality checked",
  proof_generated: "Proof report generated",
  proof_signal_added: "Proof signal added",
  swarm_run: "Market simulated",
  mvp_planned: "MVP planned",
  tasks_generated: "Tasks generated",
  project_scanned: "Codebase scanned",
  launch_planned: "Launch plan created",
  passport_stamp: "Passport stamp unlocked",
  report_saved: "Report saved",
  project_created: "Project created",
};

export const TIMELINE_TYPE_COLOR: Record<TimelineEventType, string> = {
  idea_checked: "var(--noctra-violet)",
  reality_compiled: "var(--noctra-amber)",
  proof_generated: "var(--noctra-emerald)",
  proof_signal_added: "var(--noctra-emerald)",
  swarm_run: "var(--noctra-cyan)",
  mvp_planned: "var(--noctra-gold)",
  tasks_generated: "var(--noctra-cyan)",
  project_scanned: "var(--noctra-rose)",
  launch_planned: "var(--noctra-magenta)",
  passport_stamp: "var(--noctra-gold)",
  report_saved: "var(--noctra-text-muted)",
  project_created: "var(--noctra-violet)",
};

export function buildTimeline(params: {
  reports: ReportLike[];
  proofSignals?: ProofSignalLike[];
  project?: ProjectLike;
  limit?: number;
}): TimelineEvent[] {
  const { reports, proofSignals = [], project, limit } = params;
  const events: TimelineEvent[] = [];

  if (project) {
    events.push({
      id: `project-${project.id}`,
      type: "project_created",
      title: `Project created: ${project.name}`,
      description: "A new project workspace was created.",
      date: project.created_at,
      href: `/app/projects/${project.id}`,
    });
  }

  for (const r of reports) {
    const label = TOOL_LABELS[r.tool] ?? r.tool;
    events.push({
      id: `report-${r.id}`,
      type: toolToEventType(r.tool),
      title: `${label} run`,
      description: r.summary ?? `${label} analysis completed`,
      date: r.created_at,
      href: `/app/reports/${r.id}`,
      score: r.score ?? undefined,
    });
  }

  for (const s of proofSignals) {
    events.push({
      id: `signal-${s.id}`,
      type: "proof_signal_added",
      title: `Proof signal: ${s.label}`,
      description: `${s.kind} signal logged`,
      date: s.created_at,
      href: "/app/proof",
    });
  }

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return limit != null ? events.slice(0, limit) : events;
}

export function formatTimeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}
