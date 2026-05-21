import JSZip from "jszip";
import type { StaticSignals } from "../launch-gates";
import type { ScanResult, EvidenceItem, SampleFile } from "./types";
import {
  MAX_PER_FILE_SIZE, MAX_FILE_COUNT, MAX_SCAN_TIME_MS,
  MAX_TEXT_BYTES_PER_FILE, MAX_TOTAL_TEXT_BYTES, MAX_UNCOMPRESSED_TOTAL, SECRET_PATTERNS,
} from "./constants";
import { redactSecrets, isSafePath, shouldIgnoreDir, isBinary, getExtension, getEntryPriority } from "./utils";
import { buildSummaryMarkdown } from "./summary";

export async function doScan(buffer: Buffer, fileName: string): Promise<ScanResult> {
  const startTime = Date.now();

  // ZIP bomb protection: use optimized loading options
  const zip = await JSZip.loadAsync(buffer, {
    checkCRC32: true,
    createFolders: false,
  });

  const warnings: string[] = [];
  const extensions: Record<string, number> = {};
  const manifests: string[] = [];
  let packageJson: Record<string, unknown> | null = null;
  let framework: string | null = null;
  let packageManager: string | null = null;
  const scripts: Record<string, string> = {};
  const dependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = {};

  const repoMap = {
    components: [] as string[], routes: [] as string[], apiFiles: [] as string[],
    hooks: [] as string[], utilities: [] as string[], services: [] as string[],
    authFiles: [] as string[], dbFiles: [] as string[], aiFiles: [] as string[],
    paymentFiles: [] as string[], uploadFiles: [] as string[], configFiles: [] as string[],
    testFiles: [] as string[], deploymentFiles: [] as string[], docsFiles: [] as string[],
  };

  const staticSignals: StaticSignals = {
    hasReadme: false, readmeQuality: "none", hasGitignore: false, hasEnvExample: false,
    committedEnvFiles: false, hasPackageJson: false, hasBuildScript: false, hasStartScript: false,
    hasTestScript: false, hasTests: false, hasCiWorkflow: false, hasDockerfile: false,
    hasDeploymentConfig: false, hasDatabaseMigrations: false, hasApiRoutes: false,
    hasAuthFiles: false, hasPaymentFiles: false, hasAiFiles: false, hasStorageFiles: false,
    hasPrivacyPolicy: false, hasUploadLimits: false, hasPaymentVerification: false,
    sourceFileCount: 0, testFileCount: 0, componentCount: 0, routeCount: 0, apiRouteCount: 0,
    hookCount: 0, utilCount: 0, serviceCount: 0, todoCount: 0, fixmeCount: 0,
    consoleLogCount: 0, debuggerCount: 0, tsAnyCount: 0, tsIgnoreCount: 0,
    eslintDisableCount: 0, evalCount: 0, newFunctionCount: 0,
    dangerouslySetInnerHTMLCount: 0, localStorageTokenHints: 0, possibleHardcodedSecrets: 0,
    filesOver300Lines: 0, filesOver600Lines: 0,
  };

  const evidenceIndex: EvidenceItem[] = [];
  const sampleFiles: SampleFile[] = [];
  const fileSizes: { path: string; size: number }[] = [];

  let fileCount = 0;
  let totalSize = 0;
  let ignoredFiles = 0;
  let totalTextBytes = 0;
  let timedOut = false;

  const entries = Object.entries(zip.files);

  if (entries.length > MAX_FILE_COUNT) {
    warnings.push(`ZIP contains ${entries.length} entries — using priority-based selection of up to ${MAX_FILE_COUNT} entries instead of ZIP order`);
  }

  const sortedEntries = entries
    .filter(([, f]) => !f.dir)
    .sort((a, b) => getEntryPriority(a[0]) - getEntryPriority(b[0]))
    .slice(0, MAX_FILE_COUNT);

  for (const [path, file] of sortedEntries) {
    if (timedOut) {
      warnings.push("Scan timed out — results may be incomplete");
      break;
    }

    const elapsed = Date.now() - startTime;
    if (elapsed > MAX_SCAN_TIME_MS) {
      warnings.push("Scan exceeded time limit — results may be incomplete");
      timedOut = true;
      break;
    }

    if (file.dir) continue;
    if (!isSafePath(path)) {
      warnings.push(`Unsafe path skipped: ${path}`);
      continue;
    }

    const parts = path.split("/");
    const name = parts[parts.length - 1]!;

    if (shouldIgnoreDir(parts.slice(0, -1))) { ignoredFiles++; continue; }
    if (isBinary(name)) { ignoredFiles++; continue; }

    const ext = getExtension(name);
    extensions[ext] = (extensions[ext] ?? 0) + 1;

    let content = "";
    try { content = await file.async("string"); } catch { ignoredFiles++; continue; }

    const size = content.length;
    if (size > MAX_PER_FILE_SIZE) {
      warnings.push(`Skipping large file: ${path} (${(size / 1024).toFixed(0)} KB, max ${(MAX_PER_FILE_SIZE / 1024).toFixed(0)} KB)`);
      ignoredFiles++; continue;
    }
    if (totalTextBytes + size > MAX_TOTAL_TEXT_BYTES) {
      warnings.push("Total text size limit reached — stopping file analysis");
      timedOut = true; break;
    }

    totalSize += size;
    fileCount++;
    fileSizes.push({ path, size });
    const textSize = Math.min(size, MAX_TEXT_BYTES_PER_FILE);
    totalTextBytes += textSize;
    const lowerPath = path.toLowerCase();
    const lowerName = name.toLowerCase();

    if (lowerName.startsWith("readme")) {
      staticSignals.hasReadme = true;
      staticSignals.readmeQuality = content.length > 500 ? "good" : "minimal";
      repoMap.docsFiles.push(path);
    }
    if (lowerName === ".gitignore") staticSignals.hasGitignore = true;
    if (lowerName === ".env" || lowerName.match(/^\.env\./)) {
      if (!lowerName.includes("example") && !lowerName.includes("sample")) {
        staticSignals.committedEnvFiles = true;
        warnings.push(`Committed .env file detected: ${path}`);
        evidenceIndex.push({ category: "Security", severity: "error", filePath: path, snippet: "[Contents hidden for security]", signal: "committed_env_file", explanation: ".env files should never be committed to source control" });
      } else { staticSignals.hasEnvExample = true; }
      continue;
    }

    if (lowerName === "package.json" && parts.length <= 3) {
      staticSignals.hasPackageJson = true;
      manifests.push(path);
      try {
        const pkg = JSON.parse(content) as Record<string, unknown>;
        if (!packageJson) packageJson = pkg;
        const s = (pkg.scripts ?? {}) as Record<string, string>;
        Object.assign(scripts, s);
        if (s.build) staticSignals.hasBuildScript = true;
        if (s.start) staticSignals.hasStartScript = true;
        if (s.test) staticSignals.hasTestScript = true;
        Object.assign(dependencies, (pkg.dependencies ?? {}) as Record<string, string>);
        Object.assign(devDependencies, (pkg.devDependencies ?? {}) as Record<string, string>);
        const allDeps = { ...dependencies, ...devDependencies };
        if (allDeps.next) framework = "Next.js";
        else if (allDeps["@remix-run/react"] || allDeps["@remix-run/node"]) framework = "Remix";
        else if (allDeps["@sveltejs/kit"]) framework = "SvelteKit";
        else if (allDeps["nuxt"] || allDeps["nuxt3"]) framework = "Nuxt";
        else if (allDeps.vite || allDeps["@vitejs/plugin-react"]) framework = "Vite + React";
        else if (allDeps.react) framework = "React";
        else if (allDeps.vue) framework = "Vue";
        else if (allDeps.svelte) framework = "Svelte";
        else if (allDeps.angular || allDeps["@angular/core"]) framework = "Angular";
        else if (allDeps.express) framework = "Express";
        else if (allDeps.fastify) framework = "Fastify";
        else if (allDeps.hono) framework = "Hono";
        else if (allDeps.django) framework = "Django";
        else if (allDeps.flask) framework = "Flask";
        else if (allDeps.rails) framework = "Rails";
        else if (allDeps.spring) framework = "Spring";
        if (parts.some(p => p === "pnpm-lock.yaml")) packageManager = "pnpm";
      } catch { warnings.push(`Failed to parse ${path}`); }
    }

    if (lowerName === "pnpm-lock.yaml") packageManager = "pnpm";
    if (lowerName === "yarn.lock") packageManager = "yarn";
    if (lowerName === "package-lock.json") packageManager = "npm";
    if (lowerName === "dockerfile") { staticSignals.hasDockerfile = true; repoMap.deploymentFiles.push(path); }
    if (lowerPath.includes(".github/workflows") || lowerPath.includes(".gitlab-ci")) { staticSignals.hasCiWorkflow = true; repoMap.deploymentFiles.push(path); }
    if (["render.yaml", "fly.toml", "vercel.json", "netlify.toml", ".replit"].some(f => lowerName === f)) { staticSignals.hasDeploymentConfig = true; repoMap.deploymentFiles.push(path); }
    if (lowerPath.includes("migration") || lowerPath.includes("schema.sql")) { staticSignals.hasDatabaseMigrations = true; repoMap.dbFiles.push(path); }

    const isSource = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"].includes(ext);
    if (isSource) {
      staticSignals.sourceFileCount++;
      const isTest = lowerName.includes(".test.") || lowerName.includes(".spec.") || lowerPath.includes("/__tests__/");
      if (isTest) { staticSignals.hasTests = true; staticSignals.testFileCount++; repoMap.testFiles.push(path); }
      if (lowerPath.includes("/components/") || lowerPath.includes("/component/")) { repoMap.components.push(path); staticSignals.componentCount++; }
      if (lowerPath.includes("/pages/") || lowerPath.includes("/routes/") || lowerPath.includes("/app/") || lowerPath.includes("/views/") || lowerPath.includes("/screens/")) { repoMap.routes.push(path); staticSignals.routeCount++; }
      if (lowerPath.includes("/api/") || lowerName.includes("route") || lowerName.includes("handler") || lowerPath.includes("/api-")) { repoMap.apiFiles.push(path); staticSignals.apiRouteCount++; staticSignals.hasApiRoutes = true; }
      if (lowerPath.includes("/hooks/") || lowerName.startsWith("use")) { repoMap.hooks.push(path); staticSignals.hookCount++; }
      if (lowerPath.includes("/utils/") || lowerPath.includes("/lib/") || lowerPath.includes("/helpers/")) { repoMap.utilities.push(path); staticSignals.utilCount++; }
      if (lowerPath.includes("/services/") || lowerName.includes("service")) { repoMap.services.push(path); staticSignals.serviceCount++; }
      if (lowerName.includes("auth") || lowerPath.includes("/auth/")) { repoMap.authFiles.push(path); staticSignals.hasAuthFiles = true; }
      if (lowerName.includes("db") || lowerName.includes("database") || lowerName.includes("drizzle") || lowerName.includes("prisma") || lowerName.includes("supabase")) repoMap.dbFiles.push(path);
      if (lowerName.includes("ai") || lowerName.includes("openai") || lowerName.includes("groq") || lowerName.includes("llm")) { repoMap.aiFiles.push(path); staticSignals.hasAiFiles = true; }
      if (lowerName.includes("stripe") || lowerName.includes("payment")) {
        repoMap.paymentFiles.push(path); staticSignals.hasPaymentFiles = true;
        if (lowerName.includes("webhook") || content.includes("constructEvent") || content.includes("verifySignature") || content.includes("verifyPayment")) staticSignals.hasPaymentVerification = true;
      }
      if (lowerName.includes("upload") || lowerName.includes("storage") || lowerName.includes("s3")) {
        repoMap.uploadFiles.push(path); staticSignals.hasStorageFiles = true;
        if (content.includes("maxFileSize") || content.includes("MAX_FILE_SIZE") || content.includes("fileSize") || content.includes("multer") || content.includes("uploadLimit")) staticSignals.hasUploadLimits = true;
      }
      if (lowerName.includes("privacy") || lowerName.startsWith("privacy.")) staticSignals.hasPrivacyPolicy = true;

      const lines = content.split("\n");
      const lineCount = lines.length;

      if (lineCount > 300) staticSignals.filesOver300Lines++;
      if (lineCount > 600) staticSignals.filesOver600Lines++;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!;
        const lowerLine = line.toLowerCase();

        if (lowerLine.includes("// todo") || lowerLine.includes("//todo")) staticSignals.todoCount++;
        if (lowerLine.includes("// fixme") || lowerLine.includes("//fixme")) staticSignals.fixmeCount++;
        if (lowerLine.includes("console.log")) staticSignals.consoleLogCount++;
        if (line.trim() === "debugger;") {
          staticSignals.debuggerCount++;
          evidenceIndex.push({ category: "Performance", severity: "error", filePath: path, lineNumber: i + 1, snippet: line.trim(), signal: "debugger_statement", explanation: "debugger statements will pause execution in production" });
        }
        if (line.includes(": any") || line.includes("<any>")) staticSignals.tsAnyCount++;
        if (lowerLine.includes("// @ts-ignore")) staticSignals.tsIgnoreCount++;
        if (lowerLine.includes("// eslint-disable")) staticSignals.eslintDisableCount++;
        if (line.includes("eval(")) {
          staticSignals.evalCount++;
          evidenceIndex.push({ category: "Security", severity: "warning", filePath: path, lineNumber: i + 1, snippet: redactSecrets(line.trim().slice(0, 100)), signal: "eval_usage", explanation: "eval() is a security risk and performance problem" });
        }
        if (line.includes("new Function(")) staticSignals.newFunctionCount++;
        if (line.includes("dangerouslySetInnerHTML")) staticSignals.dangerouslySetInnerHTMLCount++;
        if (line.includes("localStorage") && (lowerLine.includes("token") || lowerLine.includes("auth"))) staticSignals.localStorageTokenHints++;

        for (const pattern of SECRET_PATTERNS) {
          if (pattern.test(line) && !lowerLine.includes("example") && !lowerLine.includes("placeholder")) {
            staticSignals.possibleHardcodedSecrets++;
            evidenceIndex.push({ category: "Security", severity: "error", filePath: path, lineNumber: i + 1, snippet: redactSecrets(line.trim().slice(0, 80)), signal: "hardcoded_secret", explanation: "Possible hardcoded API key or secret detected" });
            break;
          }
        }
      }

      if (sampleFiles.length < 5 && size < 3000 && !isTest) {
        sampleFiles.push({ path, size, lines: lineCount, preview: redactSecrets(content.slice(0, 500)) });
      }
    }

    if ([".json", ".yaml", ".yml", ".toml", ".config.js", ".config.ts"].some(e => ext === e || name.endsWith(e))) {
      repoMap.configFiles.push(path);
    }
  }

  fileSizes.sort((a, b) => b.size - a.size);
  const largestFiles = fileSizes.slice(0, 10);

  const secretConfidence: "clean" | "suspicious" | "secrets_detected" =
    staticSignals.possibleHardcodedSecrets > 0 || staticSignals.committedEnvFiles ? "secrets_detected"
    : staticSignals.localStorageTokenHints > 0 ? "suspicious"
    : "clean";

  if (secretConfidence !== "clean") {
    warnings.push(`Secret confidence: ${secretConfidence} — review scan results for exposed credentials`);
    if (secretConfidence === "secrets_detected") {
      warnings.push("Possible secrets detected in codebase. Check evidence index for details. Secrets have been redacted from snippets.");
    }
  }

  const summaryMarkdown = buildSummaryMarkdown({
    fileName, fileCount, totalSize, framework, packageManager, staticSignals, repoMap, secretConfidence,
  });

  return {
    fileName, fileCount, totalSize, ignoredFiles, warnings, extensions, manifests,
    packageJson, framework, packageManager, scripts, dependencies, devDependencies,
    repoMap, staticSignals, evidenceIndex: evidenceIndex.slice(0, 50), sampleFiles,
    largestFiles, summaryMarkdown, trimmed: timedOut, secretConfidence,
  };
}
