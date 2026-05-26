import type { LaunchFinding } from "./launch-finding";

export type AIFixPack = {
  cursor: string;
  claudeCode: string;
  codex: string;
  opencode: string;
  verificationChecklist: string[];
  filesToInspect: string[];
  doNotChange: string[];
};

function buildGoalStatement(p0Findings: LaunchFinding[], p1Findings: LaunchFinding[], projectName: string): string {
  const allFindings = [...p0Findings, ...p1Findings];
  return allFindings.length > 0
    ? `Fix ${p0Findings.length} P0 blocker${p0Findings.length !== 1 ? "s" : ""} and ${p1Findings.length} P1 issue${p1Findings.length !== 1 ? "s" : ""} in ${projectName}.`
    : `No critical issues found in ${projectName}.`;
}

function buildSteps(allFindings: LaunchFinding[]): string {
  return allFindings.map((f, i) => `${i + 1}. ${f.title}: ${f.recommendedFix}`).join("\n");
}

function buildVerificationChecklist(allFindings: LaunchFinding[]): string[] {
  return allFindings.flatMap(f => f.acceptanceCriteria);
}

function buildFilesToInspect(allFindings: LaunchFinding[]): string[] {
  return [...new Set(
    allFindings.flatMap(f => f.evidence.map(e => e.filePath).filter(Boolean))
  )] as string[];
}

export function generateAIFixPack(
  findings: LaunchFinding[],
  projectName: string = "DEVULTIMATE"
): AIFixPack {
  const p0Findings = findings.filter(f => f.severity === "P0");
  const p1Findings = findings.filter(f => f.severity === "P1");
  const allFindings = [...p0Findings, ...p1Findings];

  const filesToInspect = buildFilesToInspect(allFindings);
  const verificationChecklist = buildVerificationChecklist(allFindings);
  const goalStatement = buildGoalStatement(p0Findings, p1Findings, projectName);
  const steps = buildSteps(allFindings);

  const cursor = `${goalStatement}

Do not:
- Redesign UI
- Add new features
- Change branding
- Add unnecessary dependencies

Files to inspect:
${filesToInspect.map(f => `- ${f}`).join("\n")}

Steps:
${steps}

Verification:
${verificationChecklist.map(c => `- [ ] ${c}`).join("\n")}`;

  const claudeCode = `${goalStatement}

CONTEXT:
${allFindings.map(f => `- ${f.title}: ${f.summary}`).join("\n")}

TASKS:
${steps}

ACCEPTANCE CRITERIA:
${verificationChecklist.map(c => `- ${c}`).join("\n")}

CONSTRAINTS:
- Do not add features
- Do not redesign styling
- Do not change branding
- Run typecheck/build after changes`;

  const codex = `Fix the following issues in ${projectName}:

${allFindings.map(f => `${f.severity}: ${f.title} — ${f.recommendedFix}`).join("\n")}

After fixing, verify:
${verificationChecklist.slice(0, 5).map(c => `- ${c}`).join("\n")}`;

  const opencode = `You are fixing ${projectName}. Apply these fixes:

${allFindings.map(f => `1. [${f.severity}] ${f.title}
   Problem: ${f.summary}
   Fix: ${f.recommendedFix}
   Files: ${f.evidence.map(e => e.filePath).filter(Boolean).join(", ")}`).join("\n\n")}

Do not add new features. Do not change UI styling. Run typecheck when done.`;

  return {
    cursor,
    claudeCode,
    codex,
    opencode,
    verificationChecklist,
    filesToInspect,
    doNotChange: [
      "UI styling and design",
      "Brand names and copy",
      "Database schema",
      "Authentication flow",
      "Billing integration",
    ],
  };
}
