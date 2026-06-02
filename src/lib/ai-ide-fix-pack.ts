import { LaunchFinding } from "./launch-finding";

export type IdeType = "cursor" | "claude_code" | "codex" | "opencode";

export type IdeFixPack = {
  ide: IdeType;
  prompt: string;
};

function getFilesToInspect(finding: LaunchFinding): string[] {
  const files = new Set<string>();
  finding.evidence.forEach(e => {
    if (e.filePath) {
      files.add(e.filePath);
    }
  });
  return Array.from(files);
}

function generateBasePrompt(finding: LaunchFinding): string {
  const files = getFilesToInspect(finding);
  
  let prompt = `# Goal
Fix the following ${finding.severity} launch blocker: ${finding.title}

## Summary
${finding.summary}

## Why it matters
${finding.whyItMatters}

## Files to inspect
${files.length > 0 ? files.map(f => `- ${f}`).join('\n') : '- Let the IDE search for relevant files'}

## Step-by-step instructions
1. Inspect the referenced files.
2. Implement the recommended fix: ${finding.recommendedFix}
3. Follow any provided AI context instructions:
${finding.aiIdePrompt.split('\n').map(l => `   > ${l}`).join('\n')}

## Acceptance Criteria
${finding.acceptanceCriteria.map(c => `- [ ] ${c}`).join('\n')}

## Verification
${finding.verificationSteps.map(s => `- [ ] ${s}`).join('\n')}
`;

  return prompt;
}

export function generateCursorPrompt(finding: LaunchFinding): string {
  const files = getFilesToInspect(finding);
  const fileMentions = files.map(f => `@${f.split('/').pop()}`).join(' ');
  
  return `${fileMentions}

${generateBasePrompt(finding)}

Please fix this issue in the referenced files.`;
}

export function generateClaudeCodePrompt(finding: LaunchFinding): string {
  return `Please help me fix this launch blocker. Use your search tools to find the files mentioned below if necessary.

${generateBasePrompt(finding)}

Please start by reading the relevant files.`;
}

export function generateCodexPrompt(finding: LaunchFinding): string {
  return `${generateBasePrompt(finding)}

Implement the fixes as described above.`;
}

export function generateOpenCodePrompt(finding: LaunchFinding): string {
  return `<GOAL>
Fix launch blocker: ${finding.title}
</GOAL>

<CONTEXT>
${generateBasePrompt(finding)}
</CONTEXT>

Please explore the codebase, understand the issue, and apply the necessary fixes. 
Verify the fixes before completing the task.`;
}

export function generateAllFixPacks(finding: LaunchFinding): IdeFixPack[] {
  return [
    { ide: "cursor", prompt: generateCursorPrompt(finding) },
    { ide: "claude_code", prompt: generateClaudeCodePrompt(finding) },
    { ide: "codex", prompt: generateCodexPrompt(finding) },
    { ide: "opencode", prompt: generateOpenCodePrompt(finding) },
  ];
}
