export interface QualityResult {
  valid: boolean;
  repaired: boolean;
  missingFields: string[];
  warnings: string[];
  contentWarnings: string[];
  qualityConfidence: "high" | "medium" | "low";
  parseStatus: "clean" | "repaired" | "fallback";
}

type ToolSchema = {
  required: string[];
  optional?: string[];
};

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

const GENERIC_PHRASES = [
  "consider",
  "interesting",
  "promising",
  "it is worth noting",
  "you may want to",
  "could be beneficial",
  "might be a good idea",
  "it seems",
  "it appears",
  "it looks like",
  "perhaps",
  "possibly",
  "in order to",
  "a lot of",
];

const EXPECTED_SIGNAL_TERMS = [
  "build script", "start script", "env example", ".env.example", ".env",
  "gitignore", "readme", "dockerfile", "docker-compose",
  "deployment config", "ci workflow", "ci/cd",
  "auth file", "authentication", "authorization",
  "migration", "database migration",
  "console.log", "debugger", "todo", "fixme",
  "hardcoded secret", "secret", "api key",
  "test file", "test script", "unit test",
  "stripe", "payment", "webhook",
  "privacy policy", "upload limit",
  "dangerouslySetInnerHTML", "eval",
  "score", "health", "health_score",
  "component", "api route", "route",
  "package.json", "package manager",
  "typescript", "any type",
  "performance", "security",
];

export function getRequiredFields(tool: string): string[] {
  return TOOL_SCHEMAS[tool]?.required ?? [];
}

function extractStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(v => extractStrings(v));
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(v => extractStrings(v));
  }
  return [];
}

export function validateReportQuality(
  tool: string,
  data: Record<string, unknown>,
  repaired: boolean,
): QualityResult {
  const schema = TOOL_SCHEMAS[tool];
  const warnings: string[] = [];
  const contentWarnings: string[] = [];

  if (!schema) {
    return {
      valid: true,
      repaired,
      missingFields: [],
      warnings: [`No schema defined for tool: ${tool} — skipping validation`],
      contentWarnings: [],
      qualityConfidence: "medium",
      parseStatus: repaired ? "repaired" : "clean",
    };
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

  for (const field of schema.required) {
    const val = data[field];
    if (Array.isArray(val) && val.length === 0) {
      warnings.push(`Field "${field}" is an empty array — AI may have returned minimal output`);
    }
  }

  // Content quality checks for doctor/launch tools
  if (tool === "doctor" || tool === "launch") {
    // Check that gates have evidence
    const gates = data.gates as unknown[] | undefined;
    if (Array.isArray(gates)) {
      for (const gate of gates) {
        const g = gate as Record<string, unknown>;
        const evidence = g.evidence;
        if (Array.isArray(evidence) && evidence.length === 0) {
          contentWarnings.push(`Gate "${g.name}" has no evidence — AI may be guessing`);
        }
        if (Array.isArray(evidence)) {
          const hasSignalRef = evidence.some((e: string) =>
            EXPECTED_SIGNAL_TERMS.some(term => e.toLowerCase().includes(term))
          );
          if (evidence.length > 0 && !hasSignalRef) {
            contentWarnings.push(`Gate "${g.name}" evidence does not reference any scanner signal — may be generic`);
          }
        }
      }
    }

    // Check that issues have substance
    const issues = data.issues as unknown[] | undefined;
    if (Array.isArray(issues)) {
      for (const issue of issues) {
        const iss = issue as Record<string, unknown>;
        const issueText = String(iss.issue ?? "");
        if (!EXPECTED_SIGNAL_TERMS.some(term => issueText.toLowerCase().includes(term))) {
          contentWarnings.push(`Issue "${issueText.slice(0, 50)}..." may not reference scanner evidence`);
        }
      }
    }

    // Check for generic phrases in verdict and summary
    const verdict = String(data.verdict ?? "");
    const summary = String(data.summary ?? "");
    for (const phrase of GENERIC_PHRASES) {
      if (verdict.toLowerCase().includes(phrase)) {
        contentWarnings.push(`Verdict contains vague phrase: "${phrase}"`);
      }
      if (summary.toLowerCase().includes(phrase)) {
        contentWarnings.push(`Summary contains vague phrase: "${phrase}"`);
      }
    }

    // Score justification: high score but many issues = suspicious
    const healthScore = data.health_score ?? data.launch_score;
    if (typeof healthScore === "number" && Array.isArray(issues)) {
      const criticalCount = issues.filter(i => (i as Record<string, unknown>).severity === "CRITICAL").length;
      if (healthScore >= 70 && criticalCount > 0) {
        contentWarnings.push(`High score (${healthScore}) with ${criticalCount} critical issue(s) — score may be inflated`);
      }
      if (healthScore >= 85 && issues.length > 5) {
        contentWarnings.push(`High score (${healthScore}) with ${issues.length} total issues — score may be inconsistent`);
      }
      if (healthScore <= 35 && issues.length === 0) {
        contentWarnings.push(`Low score (${healthScore}) with zero issues — score may be unjustified`);
      }
    }
  }

  // Generic phrase check for all tools
  for (const field of ["verdict", "summary"] as const) {
    const val = data[field];
    if (typeof val === "string") {
      for (const phrase of GENERIC_PHRASES) {
        if (val.toLowerCase().includes(phrase)) {
          contentWarnings.push(`${field} contains vague phrase: "${phrase}"`);
        }
      }
    }
  }

  const missingFieldSeverity = missingFields.length;
  const contentWarningSeverity = contentWarnings.length;
  const hasEmptyArrays = warnings.some(w => w.includes("empty array"));

  let qualityConfidence: "high" | "medium" | "low";
  if (missingFieldSeverity > 0 || contentWarningSeverity > 3) {
    qualityConfidence = "low";
  } else if (contentWarningSeverity > 0 || hasEmptyArrays || repaired) {
    qualityConfidence = "medium";
  } else {
    qualityConfidence = "high";
  }

  const valid = missingFields.length === 0;

  return {
    valid,
    repaired,
    missingFields,
    warnings: [...warnings, ...contentWarnings],
    contentWarnings,
    qualityConfidence,
    parseStatus: repaired ? "repaired" : valid ? "clean" : "fallback",
  };
}

export function buildFallbackResult(tool: string): Record<string, unknown> {
  const fallbacks: Record<string, Record<string, unknown>> = {
    idea: {
      verdict: "AI analysis unavailable — static scan completed but expert diagnostic failed",
      summary: "The AI diagnostic system did not return a complete analysis. Below are the raw static signals available for manual review. Retry with more specific input or check API key configuration.",
      signal_score: 0,
      who_hurts_most: "Unknown — AI unavailable",
      why_it_matters: "Run analysis again when AI provider is responsive",
      sharpest_experiment: "Retry when AI system is available",
      strengths: [],
      red_flags: ["AI diagnostic unavailable — static signals only"],
      assumptions: [],
      better_versions: [],
      next_actions: ["Retry with a more detailed description of the problem and target user", "Check API key configuration"],
    },
    reality: {
      verdict: "AI analysis unavailable — static scan completed but expert diagnostic failed",
      summary: "The AI diagnostic system did not return a complete analysis. The static scan results are available for manual review. Retry when the AI provider is responsive.",
      reality_score: 0,
      go_signal: "CAUTION",
      blind_spots: ["AI unavailable — cannot assess blind spots"],
      red_flags: [],
      risk_items: [],
      market_risks: [],
      technical_risks: [],
      patch_plan: [],
      next_actions: ["Retry with more context", "Review static scan results manually"],
    },
    proof: {
      verdict: "AI analysis unavailable — static scan completed but expert diagnostic failed",
      proof_score: 0,
      signal_density: 0,
      experiments: [],
      objections: [],
      evidence_gaps: ["AI unavailable — start with 5 customer conversations"],
      next_experiments: ["Talk to 5 potential customers this week and document their exact words"],
      next_actions: ["Start collecting proof signals manually"],
    },
    swarm: {
      verdict: "AI analysis unavailable — static scan completed but expert diagnostic failed",
      swarm_score: 0,
      consensus: "AI unavailable",
      pricing_signal: "Unknown",
      segment_breakdown: { enthusiasts: 0, skeptics: 0, neutrals: 100 },
      personas: [],
      top_objections: [],
      recommendations: [],
      next_experiments: [],
      next_actions: ["Retry when AI provider is responsive"],
    },
    mvp: {
      verdict: "AI analysis unavailable — static scan completed but expert diagnostic failed",
      mvp_score: 0,
      north_star_metric: "To be defined",
      ruthless_scope: { build_now: [], build_next: [], cut: [] },
      architecture: {},
      weeks: [],
      milestones: [],
      feature_roi: [],
      next_actions: ["Retry when AI provider is responsive"],
    },
    doctor: {
      verdict: "AI diagnostic unavailable — static scan completed",
      summary: "The AI diagnostic system failed to generate a report. Your static scan results are preserved below. These include file counts, framework detection, security signals, and launch gate evaluations. For a full AI-powered diagnostic, retry when the system is available.",
      health_score: 0,
      framework: "Unknown",
      gates: [],
      issues: [],
      repair_queue: ["AI diagnostic unavailable — review static scan results for manual analysis", "Retry scan with a valid ZIP file when AI is available"],
      fix_plan: [],
      critical_issues: ["AI diagnostic unavailable — see static scan signals for manual review"],
      next_actions: ["Review static scan results manually", "Retry when AI provider is responsive"],
    },
    launch: {
      verdict: "AI analysis unavailable — static scan completed but expert diagnostic failed",
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
    verdict: "AI analysis unavailable — static scan completed",
    summary: "An error occurred during analysis. Static scan results are available for manual review.",
    score: 0,
    next_actions: ["Retry when AI provider is responsive"],
  };
}
