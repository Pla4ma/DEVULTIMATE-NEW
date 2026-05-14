export type GateStatus = "GREEN" | "YELLOW" | "RED";

export interface LaunchGate {
  name: string;
  status: GateStatus;
  evidence: string[];
  how_to_fix: string;
  why?: string;
}

export interface StaticSignals {
  hasReadme: boolean;
  readmeQuality: "none" | "minimal" | "good";
  hasGitignore: boolean;
  hasEnvExample: boolean;
  committedEnvFiles: boolean;
  hasPackageJson: boolean;
  hasBuildScript: boolean;
  hasStartScript: boolean;
  hasTestScript: boolean;
  hasTests: boolean;
  hasCiWorkflow: boolean;
  hasDockerfile: boolean;
  hasDeploymentConfig: boolean;
  hasDatabaseMigrations: boolean;
  hasApiRoutes: boolean;
  hasAuthFiles: boolean;
  hasPaymentFiles: boolean;
  hasAiFiles: boolean;
  hasStorageFiles: boolean;
  sourceFileCount: number;
  testFileCount: number;
  componentCount: number;
  routeCount: number;
  apiRouteCount: number;
  hookCount: number;
  utilCount: number;
  serviceCount: number;
  todoCount: number;
  fixmeCount: number;
  consoleLogCount: number;
  debuggerCount: number;
  tsAnyCount: number;
  tsIgnoreCount: number;
  eslintDisableCount: number;
  evalCount: number;
  newFunctionCount: number;
  dangerouslySetInnerHTMLCount: number;
  localStorageTokenHints: number;
  possibleHardcodedSecrets: number;
  filesOver300Lines: number;
  filesOver600Lines: number;
}

export function evaluateLaunchGates(signals: StaticSignals): LaunchGate[] {
  const gates: LaunchGate[] = [];

  // 1. Security Gate
  {
    const evidence: string[] = [];
    if (signals.committedEnvFiles) evidence.push("WARNING: .env files committed to repo");
    if (signals.possibleHardcodedSecrets > 0) evidence.push(`${signals.possibleHardcodedSecrets} possible hardcoded secret(s) found`);
    if (signals.localStorageTokenHints > 0) evidence.push(`${signals.localStorageTokenHints} token(s) stored in localStorage`);
    if (!signals.hasGitignore) evidence.push("No .gitignore found");
    if (signals.evalCount > 0) evidence.push(`${signals.evalCount} eval() usage(s) detected`);
    if (signals.dangerouslySetInnerHTMLCount > 0) evidence.push(`${signals.dangerouslySetInnerHTMLCount} dangerouslySetInnerHTML usage(s)`);
    if (signals.hasEnvExample) evidence.push("✓ .env.example exists");
    if (!signals.committedEnvFiles && signals.possibleHardcodedSecrets === 0) {
      evidence.push("✓ No obvious secrets committed");
    }

    const critical = signals.committedEnvFiles || signals.possibleHardcodedSecrets > 2;
    const warning = signals.possibleHardcodedSecrets > 0 || signals.localStorageTokenHints > 0 || !signals.hasGitignore;

    gates.push({
      name: "Security Gate",
      status: critical ? "RED" : warning ? "YELLOW" : "GREEN",
      evidence,
      how_to_fix: critical
        ? "Remove .env files from git, rotate exposed secrets, add .env to .gitignore"
        : warning
        ? "Review localStorage token storage and possible hardcoded secrets"
        : "Security looks acceptable for launch",
      why: "Security breaches are the #1 cause of production incidents. Secrets in code, eval(), and missing .gitignore put your users and data at immediate risk.",
    });
  }

  // 2. Testing Gate
  {
    const evidence: string[] = [];
    if (!signals.hasTests) evidence.push("No test files found");
    if (signals.testFileCount === 0) evidence.push("Zero test files detected");
    if (signals.testFileCount > 0) evidence.push(`✓ ${signals.testFileCount} test file(s) found`);
    if (signals.hasTestScript) evidence.push("✓ Test script configured in package.json");
    if (!signals.hasTestScript) evidence.push("No test script in package.json");

    const noTests = !signals.hasTests;
    gates.push({
      name: "Testing Gate",
      status: noTests ? "YELLOW" : "GREEN",
      evidence,
      how_to_fix: noTests
        ? "Add basic tests for critical paths. Consider Vitest or Jest."
        : "Testing setup looks acceptable",
      why: "Without tests, regressions go undetected. One broken production path can undo months of user acquisition.",
    });
  }

  // 3. Deployment Gate
  {
    const evidence: string[] = [];
    if (!signals.hasBuildScript) evidence.push("No build script in package.json");
    if (!signals.hasStartScript) evidence.push("No start script in package.json");
    if (signals.hasBuildScript) evidence.push("✓ Build script configured");
    if (signals.hasStartScript) evidence.push("✓ Start script configured");
    if (signals.hasDockerfile) evidence.push("✓ Dockerfile found");
    if (signals.hasDeploymentConfig) evidence.push("✓ Deployment config found");
    if (signals.hasCiWorkflow) evidence.push("✓ CI workflow found");

    const missing = !signals.hasBuildScript || !signals.hasStartScript;
    gates.push({
      name: "Deployment Gate",
      status: missing ? "RED" : !signals.hasDeploymentConfig ? "YELLOW" : "GREEN",
      evidence,
      how_to_fix: missing
        ? "Add build and start scripts to package.json before deploying"
        : !signals.hasDeploymentConfig
        ? "Consider adding a Dockerfile or deployment config (Render, Fly.io, etc.)"
        : "Deployment config looks ready",
      why: "Without build/start scripts or deployment config, your app cannot be deployed to production. Every deploy will require manual intervention.",
    });
  }

  // 4. Documentation Gate
  {
    const evidence: string[] = [];
    if (!signals.hasReadme) evidence.push("No README found");
    if (signals.hasReadme && signals.readmeQuality === "minimal") evidence.push("README is minimal");
    if (signals.hasReadme && signals.readmeQuality === "good") evidence.push("✓ README looks complete");
    if (!signals.hasEnvExample) evidence.push("No .env.example file");
    if (signals.hasEnvExample) evidence.push("✓ .env.example exists");

    const red = !signals.hasReadme;
    const yellow = signals.readmeQuality === "minimal" || !signals.hasEnvExample;
    gates.push({
      name: "Documentation Gate",
      status: red ? "RED" : yellow ? "YELLOW" : "GREEN",
      evidence,
      how_to_fix: red
        ? "Create a README with setup instructions, environment variables, and how to run the project"
        : yellow
        ? "Improve README quality and add .env.example"
        : "Documentation looks acceptable",
      why: "New contributors (or your future self) cannot onboard without docs. Missing README and .env.example cause setup friction that kills momentum.",
    });
  }

  // 5. Product Completeness Gate
  {
    const evidence: string[] = [];
    if (signals.sourceFileCount < 5) evidence.push(`Only ${signals.sourceFileCount} source files — may be incomplete`);
    if (signals.todoCount > 10) evidence.push(`${signals.todoCount} TODO comments — many unfinished items`);
    if (signals.fixmeCount > 5) evidence.push(`${signals.fixmeCount} FIXME comments`);
    if (signals.componentCount > 0) evidence.push(`✓ ${signals.componentCount} component(s) detected`);
    if (signals.apiRouteCount > 0) evidence.push(`✓ ${signals.apiRouteCount} API route(s) detected`);
    if (signals.hasAuthFiles) evidence.push("✓ Auth files detected");
    if (signals.sourceFileCount >= 10) evidence.push(`✓ ${signals.sourceFileCount} source files`);

    const incomplete = signals.sourceFileCount < 5 || signals.todoCount > 20;
    const warning = signals.todoCount > 10 || signals.fixmeCount > 5;
    gates.push({
      name: "Product Completeness Gate",
      status: incomplete ? "RED" : warning ? "YELLOW" : "GREEN",
      evidence,
      how_to_fix: incomplete
        ? "Complete the core product features before launching"
        : warning
        ? "Review and resolve TODO/FIXME items"
        : "Product appears feature-complete",
      why: "Users judge your product instantly. Stubs, empty states, and incomplete features erode trust and drive churn before you get a second chance.",
    });
  }

  // 6. Performance Gate
  {
    const evidence: string[] = [];
    if (signals.consoleLogCount > 20) evidence.push(`${signals.consoleLogCount} console.log statements (should be removed for production)`);
    if (signals.debuggerCount > 0) evidence.push(`${signals.debuggerCount} debugger statement(s) found`);
    if (signals.filesOver600Lines > 0) evidence.push(`${signals.filesOver600Lines} file(s) over 600 lines — may need refactoring`);
    if (signals.filesOver300Lines > 0) evidence.push(`${signals.filesOver300Lines} file(s) over 300 lines`);
    if (signals.tsAnyCount > 10) evidence.push(`${signals.tsAnyCount} TypeScript \`any\` usage(s)`);
    if (signals.consoleLogCount <= 5) evidence.push("✓ Minimal console.log usage");

    const red = signals.debuggerCount > 0;
    const warning = signals.consoleLogCount > 20 || signals.filesOver600Lines > 3;
    gates.push({
      name: "Performance Gate",
      status: red ? "RED" : warning ? "YELLOW" : "GREEN",
      evidence,
      how_to_fix: red
        ? "Remove debugger statements immediately — they will pause execution in production"
        : warning
        ? "Remove console.log statements and refactor large files"
        : "No major performance concerns detected",
      why: "Debugger statements block production execution. console.log bloat and 600+ line files degrade runtime performance and maintainability.",
    });
  }

  return gates;
}
