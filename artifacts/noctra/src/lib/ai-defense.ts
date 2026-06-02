// ai-defense.ts — AI Wrapper Defense Score
// Computed deterministically from existing report payload — no LLM call needed.

export type DefenseRiskLevel = "low" | "moderate" | "high" | "critical";

export type AIDefenseScore = {
  score: number;
  riskLevel: DefenseRiskLevel;
  reasons: string[];
  moatSuggestions: string[];
};

export const DEFENSE_RISK_COLOR: Record<DefenseRiskLevel, string> = {
  low: "var(--color-success)",
  moderate: "var(--color-warning)",
  high: "var(--color-danger)",
  critical: "var(--color-danger)",
};

export const DEFENSE_RISK_LABEL: Record<DefenseRiskLevel, string> = {
  low: "Strong Moat",
  moderate: "Moderate Moat",
  high: "Weak Moat",
  critical: "AI Wrapper Risk",
};

function extractText(data: Record<string, unknown>, ...keys: string[]): string {
  return keys
    .flatMap((k) => {
      const v = data[k];
      if (typeof v === "string") return [v];
      if (Array.isArray(v)) return v.map(String);
      return [];
    })
    .join(" ")
    .toLowerCase();
}

// Infer AI wrapper defense from report data (deterministic, no LLM)
export function computeAIDefenseScore(params: {
  tool: string;
  payload: unknown;
  score?: number | null;
}): AIDefenseScore {
  const { tool, payload, score } = params;
  const p = payload as Record<string, unknown> | null;
  const data = ((p?.data ?? p) ?? {}) as Record<string, unknown>;

  const text = extractText(
    data,
    "summary", "verdict", "why_it_matters", "who_hurts_most",
    "strengths", "next_actions", "sharpest_experiment",
    "red_flags", "blind_spots", "recommendations", "consensus",
    "ai_replacement_risk", "chatgpt_risk", "moat"
  );

  let points = 0;
  const reasons: string[] = [];
  const moatSuggestions: string[] = [];

  // Dimension 1 — Unique workflow integration (15 pts)
  if (text.match(/workflow|integration|pipeline|automation|hook|ci\/cd|embed/)) {
    points += 15;
    reasons.push("Workflow integration reduces replaceability");
  } else {
    moatSuggestions.push("Embed into existing developer workflows (CI/CD, IDE plugins, git hooks)");
  }

  // Dimension 2 — Persistent data / memory (12 pts)
  if (text.match(/history|memory|persistent|longitudinal|track|over time|stored/)) {
    points += 12;
    reasons.push("Persistent data or memory advantage present");
  } else {
    moatSuggestions.push("Add longitudinal memory — track decisions, metrics, and product evolution over time");
  }

  // Dimension 3 — Collaboration / network effects (12 pts)
  if (text.match(/team|collaborat|network|shar|community|multi.user|org|invite/)) {
    points += 12;
    reasons.push("Collaboration or network effects identified");
  } else {
    moatSuggestions.push("Add team collaboration layer — shared workspaces, org-level insights, or peer comparison");
  }

  // Dimension 4 — Proprietary data advantage (14 pts)
  if (text.match(/proprietary|unique data|first.party|benchmark|anonymized|dataset|signal/)) {
    points += 14;
    reasons.push("Proprietary or first-party data advantage");
  } else {
    moatSuggestions.push("Build proprietary dataset — aggregated benchmarks, industry signals, or anonymized user data");
  }

  // Dimension 5 — Automation depth (10 pts)
  if (text.match(/automat|trigger|monitor|alert|watch|scheduled|recurring/)) {
    points += 10;
    reasons.push("Deep automation reduces manual steps");
  } else {
    moatSuggestions.push("Add automated monitoring and proactive alerts that fire without user input");
  }

  // Dimension 6 — Switching cost (10 pts)
  if (text.match(/lock|migration|switching|import|export|format|integrat|replac/)) {
    points += 10;
    reasons.push("Switching costs detected via data portability constraints");
  } else {
    moatSuggestions.push("Increase switching cost via project history export format, trained models, or proprietary scoring");
  }

  // Dimension 7 — Specialized UX (12 pts)
  if ((score != null && score >= 70) || tool === "doctor" || tool === "proof" || tool === "swarm") {
    points += 12;
    reasons.push("Specialized domain UX well beyond generic AI chat");
  } else if (score != null && score >= 50) {
    points += 6;
  }

  // Dimension 8 — Structured output quality (10 pts)
  if (text.match(/score|metric|benchmark|quantif|percentile|rated|ranked/)) {
    points += 10;
    reasons.push("Structured, scored outputs vs generic chatbot text");
  } else {
    moatSuggestions.push("Add quantified outputs — scores, benchmarks, percentiles — that raw chatbots cannot produce");
  }

  // AI wrapper penalty
  if (text.match(/ai wrapper|chatgpt.wrapper|gpt.wrapper|thin layer/)) {
    points = Math.max(0, points - 20);
    if (!reasons.some((r) => r.includes("wrapper"))) {
      reasons.push("⚠ AI wrapper perception risk detected in report");
    }
    moatSuggestions.unshift("Directly address wrapper perception — focus on proprietary data, workflow depth, and memory");
  }

  const finalScore = Math.min(100, Math.max(0, points));
  const riskLevel: DefenseRiskLevel =
    finalScore >= 65 ? "low" : finalScore >= 45 ? "moderate" : finalScore >= 25 ? "high" : "critical";

  if (reasons.length === 0) {
    reasons.push("Limited moat signals detected in this report");
  }

  return {
    score: finalScore,
    riskLevel,
    reasons: reasons.slice(0, 4),
    moatSuggestions: moatSuggestions.slice(0, 4),
  };
}
