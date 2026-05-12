// score-history.ts — Score history and delta tracking across multiple reports
// Pure utility: no React, no side effects.

export type ScoreDirection = "improved" | "declined" | "flat";

export type ScoreHistoryEntry = {
  tool: string;
  latestScore: number;
  previousScore?: number;
  delta?: number;
  direction: ScoreDirection;
  likelyReason?: string;
  reportCount: number;
};

const LIKELY_REASONS: Record<string, { improved: string; declined: string; flat: string }> = {
  idea: {
    improved: "Refined ICP or value proposition in this run.",
    declined: "Idea diverged from market signals or new risks emerged.",
    flat: "Score stable — idea framing is consistent.",
  },
  reality: {
    improved: "Addressed prior assumptions and reduced red flags.",
    declined: "New risk items emerged or core assumptions weakened.",
    flat: "Assumption set unchanged — run with updated context.",
  },
  proof: {
    improved: "Added more validation evidence and closed evidence gaps.",
    declined: "Evidence gaps widened or proof signal count decreased.",
    flat: "Validation baseline stable — continue running experiments.",
  },
  swarm: {
    improved: "Market personas responded more positively to refined pitch.",
    declined: "More objections surfaced from persona simulation.",
    flat: "Market signal holding steady across simulation runs.",
  },
  mvp: {
    improved: "Scope tightened and features better prioritized.",
    declined: "Scope crept or architecture decisions added complexity.",
    flat: "MVP plan consistent — keep momentum on execution.",
  },
  doctor: {
    improved: "Fixed launch gates and resolved critical code issues.",
    declined: "New code issues or additional gate failures detected.",
    flat: "Code health stable — continue fixing repair queue.",
  },
  launch: {
    improved: "Improved checklist completion and distribution plan.",
    declined: "New failure modes or launch risks identified.",
    flat: "Launch readiness holding — continue addressing gates.",
  },
};

type ReportLike = {
  id: string;
  tool: string;
  score?: number | null;
  created_at: string;
  summary?: string | null;
};

export function computeScoreHistory(reports: ReportLike[]): ScoreHistoryEntry[] {
  const byTool = new Map<string, ReportLike[]>();
  for (const r of reports) {
    if (r.score == null) continue;
    const arr = byTool.get(r.tool) ?? [];
    arr.push(r);
    byTool.set(r.tool, arr);
  }

  const result: ScoreHistoryEntry[] = [];

  for (const [tool, reps] of byTool) {
    const sorted = [...reps].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const latest = sorted[0];
    const previous = sorted[1];
    const latestScore = latest.score!;
    const prevScore = previous?.score ?? undefined;
    const delta = prevScore != null ? latestScore - prevScore : undefined;
    const direction: ScoreDirection =
      delta == null || Math.abs(delta) < 3 ? "flat" : delta > 0 ? "improved" : "declined";
    const reasons = LIKELY_REASONS[tool];
    const likelyReason = reasons?.[direction];

    result.push({
      tool,
      latestScore,
      previousScore: prevScore,
      delta,
      direction,
      likelyReason,
      reportCount: sorted.length,
    });
  }

  return result.sort((a, b) => b.latestScore - a.latestScore);
}

export function getDeltaLabel(entry: ScoreHistoryEntry): string {
  if (entry.delta == null) return "";
  if (entry.delta === 0 || Math.abs(entry.delta) < 3) return "→ flat";
  return entry.delta > 0 ? `↑ +${entry.delta}` : `↓ ${entry.delta}`;
}

export function getDeltaColor(direction: ScoreDirection): string {
  if (direction === "improved") return "var(--noctra-emerald)";
  if (direction === "declined") return "var(--noctra-rose)";
  return "var(--noctra-text-muted)";
}
