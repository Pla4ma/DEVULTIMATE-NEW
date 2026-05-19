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
  hasPrivacyPolicy: boolean;
  hasUploadLimits: boolean;
  hasPaymentVerification: boolean;
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

  // 6. Infrastructure Gate (deterministic: build + start scripts + deployment config + CI)
  {
    const evidence: string[] = [];
    if (!signals.hasBuildScript) evidence.push("No build script in package.json — app cannot be built for production");
    if (!signals.hasStartScript) evidence.push("No start script in package.json — app cannot be started in production");
    if (signals.hasBuildScript) evidence.push("✓ Build script exists");
    if (signals.hasStartScript) evidence.push("✓ Start script exists");
    if (signals.hasDeploymentConfig) evidence.push("✓ Deployment config found");
    if (!signals.hasDeploymentConfig) evidence.push("No deployment config (Dockerfile, vercel.json, fly.toml, etc.)");
    if (signals.hasDockerfile) evidence.push("✓ Dockerfile found");
    if (signals.hasCiWorkflow) evidence.push("✓ CI workflow found");
    if (!signals.hasCiWorkflow) evidence.push("No CI workflow configured");

    const blocking = !signals.hasBuildScript || !signals.hasStartScript;
    const warning = !signals.hasDeploymentConfig || !signals.hasCiWorkflow;
    gates.push({
      name: "Infrastructure Gate",
      status: blocking ? "RED" : warning ? "YELLOW" : "GREEN",
      evidence,
      how_to_fix: blocking
        ? "Add build and start scripts to package.json — these are required for production deployment"
        : warning
        ? "Add deployment config and CI workflow for reliable releases"
        : "Infrastructure signals look solid",
      why: "Without build/start scripts, deployment config, and CI, production releases require manual intervention and are prone to errors.",
    });
  }

  // 7. API Security Gate (deterministic: API routes require auth signals)
  if (signals.hasApiRoutes) {
    const evidence: string[] = [];
    if (!signals.hasAuthFiles) evidence.push("API routes detected but no auth files found — endpoints may be unprotected");
    if (signals.hasAuthFiles) evidence.push("✓ Auth files detected");
    evidence.push(`${signals.apiRouteCount} API route(s) found`);
    if (signals.consoleLogCount > 5) evidence.push(`${signals.consoleLogCount} console.log statements in source — may leak sensitive data via API responses`);

    gates.push({
      name: "API Security Gate",
      status: !signals.hasAuthFiles ? "RED" : "GREEN",
      evidence,
      how_to_fix: !signals.hasAuthFiles
        ? "Add authentication middleware to all API routes before exposing to users"
        : "API routes have auth signals present",
      why: "Exposed API routes without authentication are the most common source of data breaches in production.",
    });
  }

  // 8. Payment Security Gate (deterministic: payment files must verify webhooks)
  if (signals.hasPaymentFiles) {
    const evidence: string[] = [];
    if (signals.hasPaymentVerification) evidence.push("✓ Payment webhook signature verification detected");
    if (!signals.hasPaymentVerification) evidence.push("Payment files found but no webhook signature verification detected");
    gates.push({
      name: "Payment Security Gate",
      status: signals.hasPaymentVerification ? "GREEN" : "RED",
      evidence,
      how_to_fix: signals.hasPaymentVerification
        ? "Payment verification looks properly configured"
        : "Add Stripe webhook signature verification using constructEvent() before processing any payment events",
      why: "Without webhook signature verification, attackers can forge payment events and trigger refunds or unauthorized access.",
    });
  }

  // 9. Data Gate (deterministic: database without migrations)
  if (signals.hasDatabaseMigrations) {
    gates.push({
      name: "Data Gate",
      status: "GREEN",
      evidence: ["✓ Database migrations found"],
      how_to_fix: "Data layer looks properly managed",
      why: "Database migrations ensure schema changes are tracked, reviewable, and reversible.",
    });
  }

  // 10. Upload Gate (deterministic: upload feature without limits)
  if (signals.hasStorageFiles) {
    const evidence: string[] = [];
    if (!signals.hasUploadLimits) evidence.push("Upload/storage files found but no file size or rate limits detected");
    if (signals.hasUploadLimits) evidence.push("✓ File size or upload limits detected");
    gates.push({
      name: "Upload Security Gate",
      status: signals.hasUploadLimits ? "GREEN" : "YELLOW",
      evidence,
      how_to_fix: signals.hasUploadLimits
        ? "Upload limits detected"
        : "Add file size limits, type validation, and rate limiting to upload endpoints",
      why: "Unrestricted uploads enable denial-of-service attacks, storage exhaustion, and malware distribution.",
    });
  }

  // 11. AI Privacy Gate (deterministic: AI apps should have privacy policy)
  if (signals.hasAiFiles) {
    const evidence: string[] = [];
    if (!signals.hasPrivacyPolicy) evidence.push("AI-related files detected but no privacy policy found");
    if (signals.hasPrivacyPolicy) evidence.push("✓ Privacy policy found");
    gates.push({
      name: "AI Privacy Gate",
      status: signals.hasPrivacyPolicy ? "GREEN" : "YELLOW",
      evidence,
      how_to_fix: signals.hasPrivacyPolicy
        ? "Privacy policy detected"
        : "Add a privacy policy disclosing what data is sent to AI providers and how it's handled",
      why: "AI features that send user data to third-party providers require clear privacy disclosure to comply with regulations and build user trust.",
    });
  }

  // 12. Performance Gate
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
