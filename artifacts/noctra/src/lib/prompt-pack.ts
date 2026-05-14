export type PromptTool = "Replit" | "Lovable" | "Cursor" | "Claude" | "ChatGPT" | "GitHub Copilot" | "Windsurf";

export type PromptItem = {
  tool: PromptTool;
  phase: string;
  prompt: string;
  acceptance_criteria: string[];
  estimated_time?: string;
  difficulty?: "easy" | "medium" | "hard";
  dependencies?: string[];
  tags?: string[];
};

export type PromptPack = {
  title: string;
  source: string;
  description?: string;
  prompts: PromptItem[];
  metadata?: {
    total_estimated_time?: string;
    difficulty_distribution?: Record<string, number>;
    tool_distribution?: Record<string, number>;
  };
};

function truncate(s: string, n: number) { return s.length > n ? s.slice(0, n) + "..." : s; }

const toolAdaptations: Record<PromptTool, { prefix: string; suffix: string }> = {
  "Replit":         { prefix: "🔧 Replit Agent - ", suffix: "\n\nPlease implement this in the Replit environment and ensure it runs successfully." },
  "Lovable":        { prefix: "💝 Lovable Dev - ", suffix: "\n\nBuild this with care and attention to user experience. Make it delightful!" },
  "Cursor":         { prefix: "⚡ Cursor IDE - ", suffix: "\n\nImplement this efficiently with best practices and clean code architecture." },
  "Claude":         { prefix: "🤖 Claude AI - ", suffix: "\n\nPlease provide a detailed implementation with explanations and best practices." },
  "ChatGPT":        { prefix: "🧠 ChatGPT - ", suffix: "\n\nPlease implement this step by step with clear explanations." },
  "GitHub Copilot": { prefix: "🚀 GitHub Copilot - ", suffix: "\n\nGenerate clean, maintainable code following GitHub best practices." },
  "Windsurf":       { prefix: "🌊 Windsurf - ", suffix: "\n\nBuild this with modern web development practices and responsive design." }
};

export function adaptPromptForTool(prompt: string, tool: PromptTool): string {
  const a = toolAdaptations[tool];
  return `${a.prefix}${prompt}${a.suffix}`;
}

export function estimatePromptDifficulty(prompt: string): "easy" | "medium" | "hard" {
  const l = prompt.toLowerCase();
  if (l.includes("simple") || l.includes("basic") || l.includes("quick")) return "easy";
  if (l.includes("complex") || l.includes("advanced") || l.includes("architecture")) return "hard";
  return "medium";
}

export function estimatePromptTime(prompt: string, difficulty: "easy" | "medium" | "hard"): string {
  const baseTimes = { easy: 30, medium: 120, hard: 240 };
  const wordCount = prompt.split(" ").length;
  const multiplier = wordCount > 100 ? 1.5 : wordCount > 50 ? 1.2 : 1;
  const mins = Math.round(baseTimes[difficulty] * multiplier);
  return mins < 60 ? `${mins} minutes` : `${Math.round(mins / 60)} hours`;
}

export function calculatePromptPackMetadata(prompts: PromptItem[]) {
  const totalMins = prompts.reduce((t, p) => {
    return t + (p.estimated_time ? parseInt(p.estimated_time) || 0 : 0);
  }, 0);
  const difficultyDistribution = prompts.reduce((d, p) => {
    const diff = p.difficulty || "medium";
    d[diff] = (d[diff] || 0) + 1;
    return d;
  }, {} as Record<string, number>);
  const toolDistribution = prompts.reduce((d, p) => {
    d[p.tool] = (d[p.tool] || 0) + 1;
    return d;
  }, {} as Record<string, number>);
  return {
    total_estimated_time: totalMins < 60 ? `${totalMins} minutes` : `${Math.round(totalMins / 60)} hours`,
    difficulty_distribution: difficultyDistribution,
    tool_distribution: toolDistribution,
  };
}

export function generatePromptPackFromReport(
  report: { tool: string; title: string; payload: unknown; id?: string },
  targetTool: PromptTool = "Replit"
): PromptPack {
  const p = report.payload as Record<string, unknown>;
  const data = p?.data as Record<string, unknown> | null;
  const prompts: PromptItem[] = [];
  const preamble = `I'm building: ${report.title}.\nContext from my ${report.tool} report:`;

  if (report.tool === "mvp" && data) {
    const scope = data.ruthless_scope as { build_now?: string[]; build_next?: string[] } | null;
    const arch = data.architecture as Record<string, string> | null;
    const northStar = data.north_star_metric as string | null;
    if (arch) {
      const setupPrompt = `${preamble}\nArchitecture: Frontend: ${arch.frontend ?? "React"}, Backend: ${arch.backend ?? "Node.js"}, DB: ${arch.database ?? "PostgreSQL"}, Auth: ${arch.auth ?? "Supabase"}, Hosting: ${arch.hosting ?? "Vercel"}.\n\nCreate the project scaffold with this exact stack. Set up the folder structure, install all dependencies, and configure environment variables. Do not add extra libraries.`;
      prompts.push({ tool: targetTool, phase: "1. Project Setup", prompt: adaptPromptForTool(setupPrompt, targetTool), acceptance_criteria: ["Project runs locally", "All deps installed", "Folder structure matches architecture"], estimated_time: "2 hours", difficulty: "medium" });
    }
    if (scope?.build_now?.length) {
      const featuresPrompt = `${preamble}\nBuild only these MVP features in order:\n${scope.build_now.map((f, i) => `${i + 1}. ${f}`).join("\n")}\n\nNorth star metric: ${northStar ?? "User activation"}.\n\nDo NOT build anything outside this list. Each feature must work end-to-end.`;
      prompts.push({ tool: targetTool, phase: "2. Core Features", prompt: adaptPromptForTool(featuresPrompt, targetTool), acceptance_criteria: scope.build_now.slice(0, 3).map((f) => `${f} works end-to-end`), estimated_time: "4 hours", difficulty: "hard", dependencies: ["1. Project Setup"] });
    }
  }

  if (report.tool === "doctor" && data) {
    const repairQueue = data.repair_queue as string[] | null;
    const issues = data.issues as Array<{ severity: string; issue: string; fix: string; file?: string }> | null;
    const gates = data.launch_gates as Array<{ name: string; status: string; how_to_fix: string }> | null;
    const allGates = data.gates as Array<{ name: string; status: string; how_to_fix: string }> | null;
    const effectiveGates = gates ?? allGates ?? [];
    const critIssues = issues?.filter((i) => i.severity === "CRITICAL" || i.severity === "HIGH") ?? [];
    const redGates = effectiveGates.filter((g) => g.status === "RED") ?? [];
    const yellowGates = effectiveGates.filter((g) => g.status === "YELLOW") ?? [];
    const healthScore = data.health_score ?? data.score ?? 0;
    const launchReadiness = data.launch_readiness as string ?? (redGates.length === 0 ? "CONDITIONAL" : "NO-GO");
    const topBlocker = data.top_blocker as string ?? (redGates.length > 0 ? `${redGates[0].name} gate failed` : "");
    const evidence = data.evidence as Array<{ filePath: string; lineNumber?: number; explanation: string; severity: string }> | null;
    const alignment = data.alignment as Record<string, unknown> | null;
    const alignmentTasks = (alignment?.recommendedCodeTasks as Array<{ title: string }> | undefined) ?? [];

    // Comprehensive next build prompt as first phase
    const diagnosisLines: string[] = [
      `## Project Context`,
      `This is a diagnostic repair session for a project that has been scanned by Project Doctor.`,
      ``,
      `## Diagnosis Summary`,
      `Health Score: ${healthScore}/100`,
      `Launch Readiness: ${launchReadiness}`,
      topBlocker ? `Top Blocker: ${topBlocker}` : "",
      ``,
    ];
    if (redGates.length > 0) {
      diagnosisLines.push(`## Critical Blockers (RED Gates)`);
      redGates.forEach((g) => {
        diagnosisLines.push(`- ${g.name}: ${g.how_to_fix}`);
      });
      diagnosisLines.push("", "These are launch-blocking issues. Fix them before any other work.");
      diagnosisLines.push("");
    }
    if (yellowGates.length > 0) {
      diagnosisLines.push(`## Warnings (YELLOW Gates)`);
      yellowGates.forEach((g) => {
        diagnosisLines.push(`- ${g.name}: ${g.how_to_fix}`);
      });
      diagnosisLines.push("");
    }
    if (critIssues.length > 0) {
      diagnosisLines.push(`## Critical Issues`);
      critIssues.slice(0, 5).forEach((issue) => {
        const parts = [`- ${issue.issue}`];
        if (issue.file) parts.push(` (${issue.file})`);
        if (issue.fix) parts.push(` → Fix: ${issue.fix}`);
        diagnosisLines.push(parts.join(""));
      });
      diagnosisLines.push("");
    }
    if (evidence && evidence.length > 0) {
      diagnosisLines.push(`## Files Likely Affected`);
      evidence.slice(0, 8).forEach((e) => {
        diagnosisLines.push(`- \`${e.filePath}\`${e.lineNumber ? `:${e.lineNumber}` : ""} — ${e.explanation}`);
      });
      diagnosisLines.push("");
    }
    if (repairQueue && repairQueue.length > 0) {
      diagnosisLines.push(`## Repair Queue (Priority Order)`);
      repairQueue.slice(0, 8).forEach((r, i) => diagnosisLines.push(`${i + 1}. ${r}`));
      diagnosisLines.push("");
    }
    diagnosisLines.push(`## Exact Requirements`);
    diagnosisLines.push(`1. Fix all RED gates — they are launch blockers`);
    diagnosisLines.push(`2. Address all CRITICAL and HIGH severity issues`);
    diagnosisLines.push(`3. Remove console.log statements (${data.consoleLogCount ?? "?"} found)`);
    diagnosisLines.push(`4. Resolve TODO/FIXME comments (${data.todoCount ?? "?"} found)`);
    diagnosisLines.push(`5. Ensure no debugger statements remain in production code`);
    diagnosisLines.push(`6. Refactor files over 600 lines`);
    diagnosisLines.push(`7. Remove hardcoded secrets or move to environment variables`);
    diagnosisLines.push("");
    diagnosisLines.push(`## Do Not Break Rules`);
    diagnosisLines.push(`- Do NOT modify project architecture or framework`);
    diagnosisLines.push(`- Do NOT change package.json dependencies unless explicitly required`);
    diagnosisLines.push(`- Do NOT remove existing functionality`);
    diagnosisLines.push(`- Do NOT add new features — this is a repair session only`);
    diagnosisLines.push(`- Do NOT change database schemas`);
    diagnosisLines.push(`- Preserve all existing API contracts`);
    diagnosisLines.push("");
    diagnosisLines.push(`## Acceptance Criteria`);
    diagnosisLines.push(`- All RED gates are GREEN`);
    diagnosisLines.push(`- All CRITICAL issues resolved`);
    diagnosisLines.push(`- No new TypeScript errors introduced`);
    diagnosisLines.push(`- Each change is minimal and focused`);
    diagnosisLines.push(`- No console.log or debugger statements remain in production code`);
    diagnosisLines.push(`- All secrets moved to environment variables`);
    diagnosisLines.push("");
    diagnosisLines.push(`## Test Commands`);
    diagnosisLines.push(`\`\`\``);
    diagnosisLines.push(`pnpm run typecheck`);
    diagnosisLines.push(`pnpm run build`);
    diagnosisLines.push(`\`\`\``);
    diagnosisLines.push("");
    diagnosisLines.push(`## Security Reminders`);
    diagnosisLines.push(`- Never commit .env files or real secrets`);
    diagnosisLines.push(`- Never use eval() or new Function()`);
    diagnosisLines.push(`- Never expose API keys in client-side code`);
    diagnosisLines.push(`- Always validate and sanitize user input`);
    diagnosisLines.push("");
    diagnosisLines.push(`## Build / Typecheck Instructions`);
    diagnosisLines.push(`1. Run \`pnpm run typecheck\` after changes`);
    diagnosisLines.push(`2. Fix all TypeScript errors before proceeding`);
    diagnosisLines.push(`3. Run \`pnpm run build\` to verify the build`);
    diagnosisLines.push(`4. Re-upload to Project Doctor to confirm health score improvement`);
    diagnosisLines.push(`5. Verify no regressions in existing features`);
    diagnosisLines.push("");
    diagnosisLines.push(`## Final Expected Outcome`);
    diagnosisLines.push(`- Health score improves from ${healthScore}/100 to 70+/100`);
    diagnosisLines.push(`- All launch gates pass (GREEN)`);
    diagnosisLines.push(`- Codebase is production-ready`);
    diagnosisLines.push(`- Zero critical or high-severity issues`);
    diagnosisLines.push(`- Project can be deployed without manual fixes`);

    const mainPrompt = diagnosisLines.join("\n");
    prompts.push({
      tool: targetTool,
      phase: "1. Full Diagnostic Repair",
      prompt: adaptPromptForTool(mainPrompt, targetTool),
      acceptance_criteria: [
        "Health score improves to 70+",
        "All RED gates become GREEN",
        "All CRITICAL/HIGH issues resolved",
        "TypeScript build passes with 0 errors",
        "No console.log or debugger in production code",
        "All secrets moved to environment variables",
      ],
      estimated_time: redGates.length > 0 ? "4 hours" : "2 hours",
      difficulty: redGates.length > 0 ? "hard" : "medium",
    });

    if (redGates.length > 0) {
      const gatesPrompt = `${preamble}\nThese launch gates are RED and must be fixed before launch:\n${redGates.map((g, i) => `${i + 1}. ${g.name}: ${g.how_to_fix}`).join("\n")}\n\nFix all RED gates. Do not deploy until they are GREEN. Show me what changed for each fix.`;
      prompts.push({ tool: targetTool, phase: "2. Fix Launch Blockers (RED gates)", prompt: adaptPromptForTool(gatesPrompt, targetTool), acceptance_criteria: redGates.map((g) => `${g.name} gate is GREEN`), estimated_time: "4 hours", difficulty: "hard", dependencies: ["1. Full Diagnostic Repair"] });
    }
    if (critIssues.length > 0) {
      const issuesPrompt = `${preamble}\nCritical issues to fix:\n${critIssues.slice(0, 5).map((i, n) => `${n + 1}. ${i.issue}${i.file ? ` (${i.file})` : ""}\nFix: ${i.fix}`).join("\n\n")}\n\nFix each issue and explain what was changed.`;
      prompts.push({ tool: targetTool, phase: redGates.length > 0 ? "3. Critical Issues" : "2. Critical Issues", prompt: adaptPromptForTool(issuesPrompt, targetTool), acceptance_criteria: critIssues.slice(0, 3).map((i) => `Fixed: ${truncate(i.issue, 50)}`), estimated_time: "2 hours", difficulty: "medium", dependencies: redGates.length > 0 ? ["1. Full Diagnostic Repair"] : [] });
    }
    if (repairQueue?.length) {
      const phaseLabel = redGates.length > 0 ? "4" : critIssues.length > 0 ? "3" : "2";
      const repairPrompt = `${preamble}\nRepair queue (in priority order):\n${repairQueue.slice(0, 8).map((r, i) => `${i + 1}. ${r}`).join("\n")}\n\nWork through this list in order. Show progress.`;
      prompts.push({ tool: targetTool, phase: `${phaseLabel}. Repair Queue`, prompt: adaptPromptForTool(repairPrompt, targetTool), acceptance_criteria: repairQueue.slice(0, 3).map((r) => truncate(r, 50)), estimated_time: "2 hours", difficulty: "medium" });
    }
    if (alignmentTasks.length > 0) {
      const alignPhase = redGates.length + critIssues.length + (repairQueue?.length ?? 0) > 0 ? String(Math.max(2, redGates.length + (critIssues.length > 0 ? 1 : 0) + ((repairQueue?.length ?? 0) > 0 ? 1 : 0) + 1)) : "2";
      const alignPrompt = `${preamble}\nCodebase alignment tasks:\n${alignmentTasks.map((t, i) => `${i + 1}. ${t.title}`).join("\n")}\n\nImplement each alignment fix.`;
      prompts.push({ tool: targetTool, phase: `${alignPhase}. Codebase Alignment`, prompt: adaptPromptForTool(alignPrompt, targetTool), acceptance_criteria: alignmentTasks.map((t) => truncate(t.title, 50)), estimated_time: "1 hour", difficulty: "medium" });
    }
  }

  if (report.tool === "idea" && data) {
    const sharpest = data.sharpest_experiment as string | null;
    if (sharpest) {
      const experimentPrompt = `I'm validating this idea: ${report.title}.\nMy sharpest experiment to run: ${sharpest}\n\nBuild the minimum tool needed to run this experiment. Keep it simple — just enough to get signal. No excess features.`;
      prompts.push({ tool: targetTool, phase: "1. Sharpest Experiment", prompt: adaptPromptForTool(experimentPrompt, targetTool), acceptance_criteria: ["Experiment can be run with real users", "Data can be collected", "Takes < 1 hour to build"], estimated_time: "1 hour", difficulty: "easy" });
    }
  }

  if (prompts.length === 0) {
    const nextActions = (data?.next_actions as string[] | null) ?? [];
    nextActions.slice(0, 5).forEach((action, i) => {
      const actionPrompt = `${preamble}\nAction to implement: ${action}\n\nImplement this action. Show your work step by step.`;
      prompts.push({ tool: targetTool, phase: `Step ${i + 1}`, prompt: adaptPromptForTool(actionPrompt, targetTool), acceptance_criteria: [`${truncate(action, 50)} is complete`], estimated_time: estimatePromptTime(actionPrompt, "medium"), difficulty: estimatePromptDifficulty(actionPrompt), dependencies: i > 0 ? [`Step ${i}`] : [] });
    });
  }

  if (prompts.length === 0) {
    const fallbackPrompt = `I'm working on: ${report.title}.\nHelp me implement the most impactful next step based on this ${report.tool} report context. Be specific and actionable.`;
    prompts.push({ tool: targetTool, phase: "1. Next Action", prompt: adaptPromptForTool(fallbackPrompt, targetTool), acceptance_criteria: ["Implementation is complete", "Works end-to-end"], estimated_time: "2 hours", difficulty: "medium" });
  }

  return {
    title: `Prompt Pack: ${report.title}`,
    source: report.id ?? report.tool,
    description: `Generated from ${report.tool} report for ${report.title}`,
    prompts,
    metadata: calculatePromptPackMetadata(prompts),
  };
}

export function exportPromptPackToMarkdown(pack: PromptPack): string {
  let md = `# ${pack.title}\n\n`;
  if (pack.description) md += `**Description:** ${pack.description}\n\n`;
  md += `**Source:** ${pack.source}\n\n## Prompts\n\n`;
  pack.prompts.forEach((p, i) => {
    md += `### ${i + 1}. ${p.phase}\n\n**Tool:** ${p.tool}\n**Difficulty:** ${p.difficulty || "medium"}\n**Estimated Time:** ${p.estimated_time || "unknown"}\n\n**Prompt:**\n\`\`\`\n${p.prompt}\n\`\`\`\n\n**Acceptance Criteria:**\n`;
    p.acceptance_criteria.forEach((c) => { md += `- [ ] ${c}\n`; });
    md += "\n---\n\n";
  });
  return md;
}
