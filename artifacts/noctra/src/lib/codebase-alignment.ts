// codebase-alignment.ts — Codebase-to-Product Alignment analysis
// Pure utility: no React, no side effects.

import type { ReportSummary } from "./intelligence";

export interface AlignmentIssue {
  title: string;
  description: string;
  severity: "critical" | "high" | "medium";
  category: "missing-requirement" | "unnecessary-complexity" | "risky-implementation" | "gap";
}

export interface CodebaseAlignment {
  alignmentScore: number;
  missingProductRequirements: AlignmentIssue[];
  builtButUnnecessary: AlignmentIssue[];
  riskyImplementationChoices: AlignmentIssue[];
  MVPFeatureCoverage: { feature: string; status: "found" | "missing" | "partial" }[];
  launchBlockers: string[];
  recommendedCodeTasks: Array<{ title: string; priority: "critical" | "high" | "medium"; reason: string }>;
}

function extractData(report: ReportSummary): Record<string, unknown> {
  const p = report.payload as Record<string, unknown> | null;
  if (!p) return {};
  return ((p.data ?? p) as Record<string, unknown>) ?? {};
}

function getScore(report: ReportSummary): number {
  if (typeof report.score === "number") return report.score;
  const d = extractData(report);
  const keys = ["signal_score", "reality_score", "proof_score", "health_score", "mvp_score", "swarm_score", "launch_score", "score"];
  for (const k of keys) {
    if (typeof d[k] === "number") return d[k] as number;
  }
  return 0;
}

function fileListContains(files: string[], keyword: string): boolean {
  return files.some((f) => f.toLowerCase().includes(keyword.toLowerCase()));
}

type TaskLike = { id: string; title?: string; status: string; priority: string };

export function analyzeCodebaseAlignment(params: {
  reports: ReportSummary[];
  tasks: TaskLike[];
}): CodebaseAlignment {
  const { reports, tasks } = params;

  const byTool = new Map<string, ReportSummary>();
  for (const r of [...reports].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )) {
    if (!byTool.has(r.tool)) byTool.set(r.tool, r);
  }

  const mvp = byTool.get("mvp");
  const idea = byTool.get("idea");
  const doctor = byTool.get("doctor");
  const launch = byTool.get("launch");

  const missingProductRequirements: AlignmentIssue[] = [];
  const builtButUnnecessary: AlignmentIssue[] = [];
  const riskyImplementationChoices: AlignmentIssue[] = [];
  const MVPFeatureCoverage: CodebaseAlignment["MVPFeatureCoverage"] = [];
  const launchBlockers: string[] = [];
  const recommendedCodeTasks: CodebaseAlignment["recommendedCodeTasks"] = [];

  // Extract doctor scan data (scanned files, findings, gates)
  const doctorData = doctor ? extractData(doctor) : {};
  const scannedFiles: string[] = Array.isArray(doctorData.files_scanned)
    ? (doctorData.files_scanned as string[])
    : Array.isArray(doctorData.file_list)
    ? (doctorData.file_list as string[])
    : [];

  const doctorFindings = Array.isArray(doctorData.findings)
    ? (doctorData.findings as Array<Record<string, unknown>>)
    : [];

  const doctorGates = Array.isArray(doctorData.gates)
    ? (doctorData.gates as Array<Record<string, unknown>>)
    : [];

  const failedGateNames = doctorGates
    .filter((g) => String(g.status ?? g.result ?? "").toLowerCase() === "fail" || String(g.status ?? "").toLowerCase() === "red")
    .map((g) => String(g.name ?? g.gate ?? g.check ?? "Unknown gate"));

  // MVP feature coverage check
  const mvpData = mvp ? extractData(mvp) : {};
  const mvpFeatures: Array<Record<string, unknown>> = Array.isArray(mvpData.features)
    ? (mvpData.features as Array<Record<string, unknown>>)
    : [];

  const mvpRequirements: Record<string, string[]> = {};
  if (Array.isArray(mvpData.requirements)) {
    for (const r of mvpData.requirements as string[]) {
      const key = r.toLowerCase().split(" ").slice(0, 2).join("_");
      mvpRequirements[key] = [r];
    }
  }

  // Check known MVP signals against scanned files
  const ideaData = idea ? extractData(idea) : {};
  const productText = String(ideaData.idea ?? ideaData.description ?? idea?.title ?? "").toLowerCase();

  // Auth check
  const needsAuth = productText.includes("user") || productText.includes("account") || productText.includes("login") || productText.includes("sign") || mvpFeatures.some((f) => String(f.name ?? f.title ?? "").toLowerCase().includes("auth"));
  if (needsAuth && scannedFiles.length > 0) {
    const hasAuth = fileListContains(scannedFiles, "auth") || fileListContains(scannedFiles, "login") || fileListContains(scannedFiles, "session");
    MVPFeatureCoverage.push({ feature: "User Authentication", status: hasAuth ? "found" : "missing" });
    if (!hasAuth) {
      missingProductRequirements.push({
        title: "Authentication not found in codebase",
        description: "MVP or idea requires user accounts but no auth files were detected in the Project Doctor scan.",
        severity: "critical",
        category: "missing-requirement",
      });
      recommendedCodeTasks.push({
        title: "Implement user authentication",
        priority: "critical",
        reason: "MVP requires auth but no auth implementation found in codebase scan",
      });
    }
  }

  // AI check
  const needsAI = productText.includes("ai") || productText.includes("gpt") || productText.includes("llm") || productText.includes("model");
  if (needsAI && scannedFiles.length > 0) {
    const hasAI = fileListContains(scannedFiles, "openai") || fileListContains(scannedFiles, "anthropic") || fileListContains(scannedFiles, "groq") || fileListContains(scannedFiles, "ai") || fileListContains(scannedFiles, "llm");
    MVPFeatureCoverage.push({ feature: "AI Integration", status: hasAI ? "found" : "missing" });
    if (!hasAI) {
      missingProductRequirements.push({
        title: "AI service not found in codebase",
        description: "Idea description mentions AI/LLM functionality but no AI service integration was found in the scanned files.",
        severity: "high",
        category: "missing-requirement",
      });
      recommendedCodeTasks.push({
        title: "Integrate AI service (OpenAI / Anthropic / Groq)",
        priority: "high",
        reason: "Product idea requires AI but no AI integration found in codebase",
      });
    }
  }

  // Analytics check (for launch)
  if (launch && scannedFiles.length > 0) {
    const hasAnalytics = fileListContains(scannedFiles, "analytics") || fileListContains(scannedFiles, "mixpanel") || fileListContains(scannedFiles, "posthog") || fileListContains(scannedFiles, "segment") || fileListContains(scannedFiles, "amplitude");
    MVPFeatureCoverage.push({ feature: "Analytics / Tracking", status: hasAnalytics ? "found" : "missing" });
    if (!hasAnalytics) {
      missingProductRequirements.push({
        title: "No analytics integration found",
        description: "Launch Room expects analytics for post-launch monitoring, but no analytics SDK was found in the codebase scan.",
        severity: "high",
        category: "missing-requirement",
      });
      launchBlockers.push("No analytics — unable to monitor user behavior after launch");
      recommendedCodeTasks.push({
        title: "Add PostHog or Mixpanel analytics",
        priority: "high",
        reason: "Launch requires analytics to track retention, conversion, and user behavior",
      });
    }
  }

  // Doctor findings → risky choices
  for (const finding of doctorFindings.filter(
    (f) => String(f.severity ?? "").toLowerCase() === "high" || String(f.severity ?? "").toLowerCase() === "critical"
  ).slice(0, 4)) {
    riskyImplementationChoices.push({
      title: String(finding.title ?? finding.type ?? "Implementation risk").slice(0, 80),
      description: String(finding.description ?? finding.detail ?? "High-severity finding from Project Doctor").slice(0, 200),
      severity: (String(finding.severity ?? "high").toLowerCase() as "critical" | "high" | "medium"),
      category: "risky-implementation",
    });
  }

  // Doctor gates → launch blockers
  for (const gate of failedGateNames.slice(0, 5)) {
    launchBlockers.push(`${gate} gate failed in Project Doctor — must pass before launch`);
    recommendedCodeTasks.push({
      title: `Fix Project Doctor gate: ${gate}`,
      priority: "critical",
      reason: "Failed gate is a hard launch blocker",
    });
  }

  // Doctor says no tests but MVP says production-ready
  if (doctor && mvp) {
    const doctorScore = getScore(doctor);
    const mvpScore = getScore(mvp);
    const hasTestGate = failedGateNames.some((g) => g.toLowerCase().includes("test"));
    if (hasTestGate && mvpScore >= 65) {
      riskyImplementationChoices.push({
        title: "Testing gate failed but MVP plan assumes production-ready",
        description: "Project Doctor flagged test coverage failure while MVP Planner scores the MVP as production-ready. This is a dangerous misalignment.",
        severity: "critical",
        category: "risky-implementation",
      });
    }

    // Doctor low, launch high
    const launchReport = byTool.get("launch");
    if (doctorScore < 50 && launchReport && getScore(launchReport) >= 65) {
      launchBlockers.push("Launch Room says ready but Project Doctor health is critical — launch risk is high");
    }
  }

  // MVP features coverage (for known features)
  for (const feat of mvpFeatures.slice(0, 6)) {
    const featName = String(feat.name ?? feat.title ?? feat.feature ?? "Feature");
    const featKeyword = featName.toLowerCase().split(" ")[0];
    if (scannedFiles.length > 0) {
      const found = fileListContains(scannedFiles, featKeyword);
      MVPFeatureCoverage.push({ feature: featName.slice(0, 50), status: found ? "found" : "partial" });
    } else {
      MVPFeatureCoverage.push({ feature: featName.slice(0, 50), status: "partial" });
    }
  }

  // Unnecessary complexity (payment with low WTP)
  const swarm = byTool.get("swarm");
  if (swarm && scannedFiles.length > 0) {
    const swarmData = extractData(swarm);
    const wtp = typeof swarmData.willingness_to_pay === "number" ? swarmData.willingness_to_pay : null;
    const hasPayment = fileListContains(scannedFiles, "stripe") || fileListContains(scannedFiles, "payment") || fileListContains(scannedFiles, "billing");
    if (wtp !== null && wtp < 30 && hasPayment) {
      builtButUnnecessary.push({
        title: "Payment infrastructure built for a low-WTP market",
        description: `Market Swarm shows only ${wtp}% willingness to pay, but the codebase has payment logic. This adds complexity before proving demand.`,
        severity: "high",
        category: "unnecessary-complexity",
      });
    }
  }

  // Score calculation
  const totalIssues = missingProductRequirements.length + riskyImplementationChoices.length + builtButUnnecessary.length;
  const criticalCount = [...missingProductRequirements, ...riskyImplementationChoices, ...builtButUnnecessary].filter((i) => i.severity === "critical").length;
  const penalty = criticalCount * 20 + (totalIssues - criticalCount) * 8;

  const hasData = doctor != null || mvp != null;
  const baseScore = hasData ? 75 : 0;
  const alignmentScore = Math.max(0, Math.min(100, baseScore - penalty));

  return {
    alignmentScore,
    missingProductRequirements,
    builtButUnnecessary,
    riskyImplementationChoices,
    MVPFeatureCoverage,
    launchBlockers,
    recommendedCodeTasks,
  };
}
