export type LaunchFinding = {
  id: string;
  severity: "P0" | "P1" | "P2" | "P3";
  category: "security" | "auth" | "database" | "billing" | "deployment" | "testing" | "performance" | "accessibility" | "product" | "ux" | "observability" | "maintainability";
  title: string;
  summary: string;
  evidence: Array<{
    source: "static_scan" | "command_output" | "ai_inference" | "user_context";
    filePath?: string;
    lineNumber?: number;
    snippet?: string;
    command?: string;
    outputExcerpt?: string;
  }>;
  whyItMatters: string;
  recommendedFix: string;
  acceptanceCriteria: string[];
  verificationSteps: string[];
  aiIdePrompt: string;
  confidence: "low" | "medium" | "high";
};

export type LaunchGateStatus = "GREEN" | "YELLOW" | "RED";

export type LaunchGate = {
  name: string;
  status: LaunchGateStatus;
  score: number;
  maxScore: number;
  findings: LaunchFinding[];
  evidence: string[];
  howToFix?: string;
  why?: string;
};

export type DeterministicScore = {
  total: number;
  maxTotal: number;
  breakdown: {
    security: { score: number; max: number };
    buildTest: { score: number; max: number };
    deployment: { score: number; max: number };
    authData: { score: number; max: number };
    uxEdgeStates: { score: number; max: number };
    observability: { score: number; max: number };
    productCompleteness: { score: number; max: number };
  };
  verdict: "GO" | "CONDITIONAL_GO" | "NO_GO";
  reason: string;
};

export type ReportConfidence = "verified" | "inferred" | "needs_confirmation" | "not_checked";

export function getConfidenceForFinding(finding: LaunchFinding): ReportConfidence {
  const hasStaticEvidence = finding.evidence.some(e => e.source === "static_scan");
  const hasCommandEvidence = finding.evidence.some(e => e.source === "command_output");
  const hasAiEvidence = finding.evidence.some(e => e.source === "ai_inference");
  const hasUserEvidence = finding.evidence.some(e => e.source === "user_context");

  if (hasStaticEvidence || hasCommandEvidence) return "verified";
  if (hasAiEvidence && !hasUserEvidence) return "inferred";
  if (hasUserEvidence || finding.evidence.length === 0) return "needs_confirmation";
  return "not_checked";
}

export function getConfidenceLabel(confidence: ReportConfidence): string {
  switch (confidence) {
    case "verified": return "Verified by scan";
    case "inferred": return "Inferred by AI";
    case "needs_confirmation": return "Needs manual confirmation";
    case "not_checked": return "Not checked";
  }
}

export function getConfidenceColor(confidence: ReportConfidence): string {
  switch (confidence) {
    case "verified": return "var(--color-success)";
    case "inferred": return "var(--color-warning)";
    case "needs_confirmation": return "var(--accent-cyan)";
    case "not_checked": return "var(--text-tertiary)";
  }
}
