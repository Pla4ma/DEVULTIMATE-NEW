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
