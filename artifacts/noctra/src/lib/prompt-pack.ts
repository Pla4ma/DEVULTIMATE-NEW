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
    const issues = data.issues as Array<{ severity: string; issue: string; fix: string }> | null;
    const gates = data.launch_gates as Array<{ name: string; status: string; how_to_fix: string }> | null;
    const critIssues = issues?.filter((i) => i.severity === "CRITICAL" || i.severity === "HIGH") ?? [];
    const redGates = gates?.filter((g) => g.status === "RED") ?? [];
    if (redGates.length > 0) {
      const gatesPrompt = `${preamble}\nThese launch gates are RED and must be fixed before launch:\n${redGates.map((g, i) => `${i + 1}. ${g.name}: ${g.how_to_fix}`).join("\n")}\n\nFix all RED gates. Do not deploy until they are GREEN. Show me what changed for each fix.`;
      prompts.push({ tool: targetTool, phase: "1. Fix Launch Blockers (RED gates)", prompt: adaptPromptForTool(gatesPrompt, targetTool), acceptance_criteria: redGates.map((g) => `${g.name} gate is GREEN`), estimated_time: "4 hours", difficulty: "hard" });
    }
    if (critIssues.length > 0) {
      const issuesPrompt = `${preamble}\nCritical issues to fix:\n${critIssues.slice(0, 5).map((i, n) => `${n + 1}. ${i.issue}\nFix: ${i.fix}`).join("\n\n")}\n\nFix each issue and explain what was changed.`;
      prompts.push({ tool: targetTool, phase: "2. Critical Issues", prompt: adaptPromptForTool(issuesPrompt, targetTool), acceptance_criteria: critIssues.slice(0, 3).map((i) => `Fixed: ${truncate(i.issue, 50)}`), estimated_time: "2 hours", difficulty: "medium", dependencies: redGates.length > 0 ? ["1. Fix Launch Blockers (RED gates)"] : [] });
    }
    if (repairQueue?.length) {
      const repairPrompt = `${preamble}\nRepair queue (in priority order):\n${repairQueue.slice(0, 8).map((r, i) => `${i + 1}. ${r}`).join("\n")}\n\nWork through this list in order. Show progress.`;
      prompts.push({ tool: targetTool, phase: "3. Repair Queue", prompt: adaptPromptForTool(repairPrompt, targetTool), acceptance_criteria: repairQueue.slice(0, 3).map((r) => truncate(r, 50)), estimated_time: "2 hours", difficulty: "medium" });
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
