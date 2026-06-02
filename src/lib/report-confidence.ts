import { LaunchFinding } from "./launch-finding";

export type ConfidenceLabel = 
  | "Verified by scan"
  | "Inferred by AI"
  | "Needs manual confirmation"
  | "Not checked";

export function getFindingConfidenceLabel(finding: LaunchFinding): ConfidenceLabel {
  if (!finding.evidence || finding.evidence.length === 0) {
    return "Needs manual confirmation";
  }

  const hasStaticScan = finding.evidence.some(e => e.source === "static_scan");
  const hasCommandOutput = finding.evidence.some(e => e.source === "command_output");
  const hasAiInference = finding.evidence.some(e => e.source === "ai_inference");
  const hasUserContext = finding.evidence.some(e => e.source === "user_context");

  if (hasStaticScan || hasCommandOutput) {
    return "Verified by scan";
  }

  if (hasAiInference && !hasUserContext) {
    return "Inferred by AI";
  }

  return "Needs manual confirmation";
}

export function getCategoryConfidenceLabel(categoryHasFindings: boolean, scannerCoversCategory: boolean): ConfidenceLabel {
  if (!scannerCoversCategory) {
    return "Not checked";
  }
  
  if (categoryHasFindings) {
    // If the scanner found something, it's verified by the scan.
    // In a more complex implementation we might aggregate the confidence of all findings in the category.
    return "Verified by scan";
  }
  
  // If scanner covers it and found nothing, it's fairly confident
  return "Verified by scan";
}
