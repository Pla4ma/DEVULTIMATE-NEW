export interface QualityResult {
  valid: boolean;
  repaired: boolean;
  missingFields: string[];
  warnings: string[];
}

type ToolSchema = {
  required: string[];
  optional?: string[];
};

// These schemas are kept in sync with the AI system prompts in routes/ai.ts.
// Each required field MUST be returned by the corresponding prompt.
// If you change a prompt's output schema, update this file too.
const TOOL_SCHEMAS: Record<string, ToolSchema> = {
  idea: {
    required: ["verdict", "summary", "signal_score", "next_actions"],
    optional: ["who_hurts_most", "why_it_matters", "sharpest_experiment", "strengths", "red_flags", "assumptions", "better_versions"],
  },
  reality: {
    required: ["verdict", "summary", "reality_score", "go_signal", "risk_items", "patch_plan"],
    optional: ["blind_spots", "red_flags", "market_risks", "technical_risks", "next_actions"],
  },
  proof: {
    required: ["verdict", "proof_score", "experiments", "evidence_gaps"],
    optional: ["summary", "signal_density", "objections", "next_experiments", "next_actions"],
  },
  swarm: {
    required: ["verdict", "swarm_score", "personas", "top_objections", "segment_breakdown"],
    optional: ["summary", "consensus", "pricing_signal", "recommendations", "next_experiments", "next_actions"],
  },
  mvp: {
    required: ["verdict", "mvp_score", "ruthless_scope", "north_star_metric"],
    optional: ["summary", "architecture", "weeks", "milestones", "feature_roi", "next_actions"],
  },
  doctor: {
    required: ["verdict", "health_score", "gates", "issues", "repair_queue"],
    optional: ["summary", "framework", "fix_plan", "critical_issues", "next_actions"],
  },
  launch: {
    required: ["verdict", "launch_score", "go_no_go", "gates", "launch_checklist"],
    optional: ["summary", "risks", "day_one_actions", "distribution_plan", "next_actions"],
  },
  twin: {
    required: ["summary", "overall_trajectory", "strategic_moves", "next_actions"],
    optional: ["patterns", "contradictions", "drift_signals"],
  },
};

export function validateReportQuality(
  tool: string,
  data: Record<string, unknown>,
  repaired: boolean,
): QualityResult {
  const schema = TOOL_SCHEMAS[tool];
  const warnings: string[] = [];

  if (!schema) {
    return { valid: true, repaired, missingFields: [], warnings: [`No schema defined for tool: ${tool} — skipping validation`] };
  }

  const missingFields: string[] = [];
  for (const field of schema.required) {
    if (data[field] === undefined || data[field] === null) {
      missingFields.push(field);
    }
  }

  if (repaired) {
    warnings.push("JSON was repaired from malformed AI response — review output for truncation");
  }

  // Warn on empty arrays for fields that should have content
  for (const field of schema.required) {
    const val = data[field];
    if (Array.isArray(val) && val.length === 0) {
      warnings.push(`Field "${field}" is an empty array — AI may have returned minimal output`);
    }
  }

  const valid = missingFields.length === 0;
  return { valid, repaired, missingFields, warnings };
}

export function buildFallbackResult(tool: string): Record<string, unknown> {
  const fallbacks: Record<string, Record<string, unknown>> = {
    idea: {
      verdict: "Analysis could not be completed — please try again",
      summary: "The AI did not return a complete analysis. Check your API key and try with more specific input.",
      signal_score: 0,
      who_hurts_most: "Unknown",
      why_it_matters: "Unknown",
      sharpest_experiment: "Retry with more context about the problem and target user",
      strengths: [],
      red_flags: ["Analysis incomplete"],
      assumptions: [],
      better_versions: [],
      next_actions: ["Retry with a more detailed description of the problem and target user"],
    },
    reality: {
      verdict: "Reality check could not be completed",
      summary: "The AI did not return a complete analysis. Check your API key and try again.",
      reality_score: 0,
      go_signal: "CAUTION",
      blind_spots: ["Analysis incomplete — retry for accurate assessment"],
      red_flags: [],
      risk_items: [],
      market_risks: [],
      technical_risks: [],
      patch_plan: [],
      next_actions: ["Retry with more context about your current situation"],
    },
    proof: {
      verdict: "Proof analysis could not be completed",
      proof_score: 0,
      signal_density: 0,
      experiments: [],
      objections: [],
      evidence_gaps: ["No evidence gathered yet — start with 5 customer conversations"],
      next_experiments: ["Talk to 5 potential customers this week and document their exact words"],
      next_actions: ["Start collecting proof signals"],
    },
    swarm: {
      verdict: "Market simulation could not be completed",
      swarm_score: 0,
      consensus: "Analysis failed",
      pricing_signal: "Unknown",
      segment_breakdown: { enthusiasts: 0, skeptics: 0, neutrals: 100 },
      personas: [],
      top_objections: [],
      recommendations: [],
      next_experiments: [],
      next_actions: ["Retry with more context about your target market"],
    },
    mvp: {
      verdict: "MVP plan could not be generated",
      mvp_score: 0,
      north_star_metric: "To be defined",
      ruthless_scope: { build_now: [], build_next: [], cut: [] },
      architecture: {},
      weeks: [],
      milestones: [],
      feature_roi: [],
      next_actions: ["Retry with a clearer description of the core user action you want to enable"],
    },
    doctor: {
      verdict: "Diagnostic could not be completed",
      health_score: 0,
      framework: "Unknown",
      gates: [],
      issues: [],
      repair_queue: ["Retry scan with a valid ZIP file"],
      fix_plan: [],
      critical_issues: [],
      next_actions: ["Retry with a valid project ZIP file"],
    },
    launch: {
      verdict: "Launch assessment could not be completed",
      launch_score: 0,
      go_no_go: "HOLD",
      gates: [],
      risks: [],
      launch_checklist: [],
      day_one_actions: [],
      next_actions: ["Retry with more context about your product and distribution plan"],
    },
    twin: {
      summary: "Memory synthesis could not be completed — run more intelligence tools to build context.",
      overall_trajectory: "stagnant",
      patterns: [],
      contradictions: [],
      drift_signals: [],
      strategic_moves: ["Run Signal Chamber to establish your product intelligence baseline"],
      next_actions: ["Complete at least 3 intelligence tools to enable meaningful synthesis"],
    },
  };

  return fallbacks[tool] ?? {
    verdict: "Analysis could not be completed",
    summary: "An error occurred during analysis. Please try again.",
    score: 0,
    next_actions: ["Retry with more context"],
  };
}
