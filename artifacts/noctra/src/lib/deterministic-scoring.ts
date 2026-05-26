import type { LaunchFinding, DeterministicScore } from "./launch-finding";

const CATEGORY_MAX_SCORES = {
  security: 25,
  buildTest: 20,
  deployment: 15,
  authData: 15,
  uxEdgeStates: 10,
  observability: 5,
  productCompleteness: 10,
} as const;

const SEVERITY_DEDUCTION: Record<string, number> = {
  P0: 10,
  P1: 5,
  P2: 2,
  P3: 1,
};

const CATEGORY_TO_KEY: Record<string, keyof typeof CATEGORY_MAX_SCORES> = {
  security: "security",
  auth: "authData",
  database: "authData",
  billing: "security",
  deployment: "deployment",
  testing: "buildTest",
  performance: "buildTest",
  accessibility: "uxEdgeStates",
  product: "productCompleteness",
  ux: "uxEdgeStates",
  observability: "observability",
  maintainability: "buildTest",
};

export function computeDeterministicScore(findings: LaunchFinding[]): DeterministicScore {
  const breakdown = {
    security: { score: CATEGORY_MAX_SCORES.security, max: CATEGORY_MAX_SCORES.security },
    buildTest: { score: CATEGORY_MAX_SCORES.buildTest, max: CATEGORY_MAX_SCORES.buildTest },
    deployment: { score: CATEGORY_MAX_SCORES.deployment, max: CATEGORY_MAX_SCORES.deployment },
    authData: { score: CATEGORY_MAX_SCORES.authData, max: CATEGORY_MAX_SCORES.authData },
    uxEdgeStates: { score: CATEGORY_MAX_SCORES.uxEdgeStates, max: CATEGORY_MAX_SCORES.uxEdgeStates },
    observability: { score: CATEGORY_MAX_SCORES.observability, max: CATEGORY_MAX_SCORES.observability },
    productCompleteness: { score: CATEGORY_MAX_SCORES.productCompleteness, max: CATEGORY_MAX_SCORES.productCompleteness },
  };

  for (const finding of findings) {
    const categoryKey = CATEGORY_TO_KEY[finding.category] ?? "productCompleteness";
    const deduction = SEVERITY_DEDUCTION[finding.severity] ?? 1;
    const category = breakdown[categoryKey];
    if (category) {
      category.score = Math.max(0, category.score - deduction) as typeof category.score;
    }
  }

  const total = Object.values(breakdown).reduce((sum, cat) => sum + cat.score, 0);
  const maxTotal = Object.values(breakdown).reduce((sum, cat) => sum + cat.max, 0);

  const hasP0 = findings.some(f => f.severity === "P0");
  const hasP1 = findings.some(f => f.severity === "P1");

  let verdict: DeterministicScore["verdict"];
  let reason: string;

  if (hasP0) {
    verdict = "NO_GO";
    const p0Count = findings.filter(f => f.severity === "P0").length;
    reason = `${p0Count} P0 blocker${p0Count > 1 ? "s" : ""} must be resolved before launch`;
  } else if (total < 70) {
    verdict = "NO_GO";
    reason = `Score ${total}/100 is below the 70-point launch threshold`;
  } else if (hasP1 || total < 85) {
    verdict = "CONDITIONAL_GO";
    reason = hasP1
      ? "P1 issues present — launch with caution after review"
      : `Score ${total}/100 — consider resolving remaining issues`;
  } else {
    verdict = "GO";
    reason = `Score ${total}/100 — all gates passing, ready to launch`;
  }

  return { total, maxTotal, breakdown, verdict, reason };
}
