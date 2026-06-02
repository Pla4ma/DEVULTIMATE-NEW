import { DeterministicScore, LaunchFinding } from "./launch-finding";

const MAX_SCORES = {
  security: 25,
  buildTest: 20,
  deployment: 15,
  authData: 15,
  uxEdgeStates: 10,
  observability: 5,
  productCompleteness: 10,
};

export function calculateDeterministicScore(findings: LaunchFinding[]): DeterministicScore {
  // Start with perfect scores
  const breakdown = {
    security: { score: MAX_SCORES.security, max: MAX_SCORES.security },
    buildTest: { score: MAX_SCORES.buildTest, max: MAX_SCORES.buildTest },
    deployment: { score: MAX_SCORES.deployment, max: MAX_SCORES.deployment },
    authData: { score: MAX_SCORES.authData, max: MAX_SCORES.authData },
    uxEdgeStates: { score: MAX_SCORES.uxEdgeStates, max: MAX_SCORES.uxEdgeStates },
    observability: { score: MAX_SCORES.observability, max: MAX_SCORES.observability },
    productCompleteness: { score: MAX_SCORES.productCompleteness, max: MAX_SCORES.productCompleteness },
  };

  let hasP0Blocker = false;

  // Deduct points based on severity and category
  findings.forEach(finding => {
    if (finding.severity === "P0") {
      hasP0Blocker = true;
    }

    let deduction = 0;
    switch (finding.severity) {
      case "P0": deduction = 15; break;
      case "P1": deduction = 10; break;
      case "P2": deduction = 5; break;
      case "P3": deduction = 2; break;
    }

    switch (finding.category) {
      case "security":
        breakdown.security.score = Math.max(0, breakdown.security.score - deduction);
        break;
      case "auth":
      case "database":
        breakdown.authData.score = Math.max(0, breakdown.authData.score - deduction);
        break;
      case "testing":
        breakdown.buildTest.score = Math.max(0, breakdown.buildTest.score - deduction);
        break;
      case "deployment":
        breakdown.deployment.score = Math.max(0, breakdown.deployment.score - deduction);
        break;
      case "ux":
      case "accessibility":
        breakdown.uxEdgeStates.score = Math.max(0, breakdown.uxEdgeStates.score - deduction);
        break;
      case "observability":
      case "maintainability":
        breakdown.observability.score = Math.max(0, breakdown.observability.score - deduction);
        break;
      case "product":
      case "billing":
        breakdown.productCompleteness.score = Math.max(0, breakdown.productCompleteness.score - deduction);
        break;
      case "performance":
        // Distribute or assign to build/test for now
        breakdown.buildTest.score = Math.max(0, breakdown.buildTest.score - deduction);
        break;
    }
  });

  const totalScore = 
    breakdown.security.score + 
    breakdown.buildTest.score + 
    breakdown.deployment.score + 
    breakdown.authData.score + 
    breakdown.uxEdgeStates.score + 
    breakdown.observability.score + 
    breakdown.productCompleteness.score;

  let verdict: "GO" | "CONDITIONAL_GO" | "NO_GO";
  let reason = "";

  if (hasP0Blocker) {
    verdict = "NO_GO";
    reason = "Critical P0 blockers detected.";
  } else if (totalScore < 70) {
    verdict = "NO_GO";
    reason = `Score is too low (${totalScore}/100). Minimum required is 70.`;
  } else if (totalScore >= 85) {
    verdict = "GO";
    reason = `Score is excellent (${totalScore}/100) with no P0 blockers.`;
  } else {
    verdict = "CONDITIONAL_GO";
    reason = `Score is acceptable (${totalScore}/100) but requires fixing some P1/P2 issues before full launch.`;
  }

  return {
    total: totalScore,
    maxTotal: 100,
    breakdown,
    verdict,
    reason
  };
}
