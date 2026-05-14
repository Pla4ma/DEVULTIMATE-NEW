import JSZip from "jszip";
import type { StaticSignals } from "./launch-gates";

const IGNORED_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".next", "out",
  "coverage", "vendor", "target", ".cache", ".turbo",
]);

const IGNORED_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp", ".bmp", ".tiff",
  ".mp4", ".mp3", ".wav", ".ogg", ".mov", ".avi", ".webm",
  ".woff", ".woff2", ".ttf", ".eot",
  ".zip", ".tar", ".gz", ".7z", ".rar",
  ".exe", ".bin", ".dll", ".so", ".dylib",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
]);

const SECRET_PATTERNS = [
  /sk-[A-Za-z0-9]{20,}/,
  /AIza[0-9A-Za-z\-_]{35}/,
  /AKIA[0-9A-Z]{16}/,
  /(?:api[_-]?key|secret|password|token)\s*[:=]\s*['"][^'"]{10,}['"]/i,
  /eyJ[A-Za-z0-9+/]{20,}/,
  /ghp_[A-Za-z0-9]{36}/,
  /ghs_[A-Za-z0-9]{36}/,
];

function redactSecrets(content: string): string {
  let result = content;
  for (const pattern of SECRET_PATTERNS) {
    result = result.replace(pattern, "[REDACTED]");
  }
  return result;
}

function isSafePath(filePath: string): boolean {
  if (filePath.includes("..")) return false;
  if (filePath.startsWith("/")) return false;
  if (filePath.includes("\0")) return false;
  return true;
}

function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "";
  return filename.slice(lastDot).toLowerCase();
}

function shouldIgnoreDir(pathParts: string[]): boolean {
  for (const part of pathParts) {
    if (IGNORED_DIRS.has(part)) return true;
  }
  return false;
}

function isImageOrMedia(ext: string): boolean {
  return IGNORED_EXTENSIONS.has(ext);
}

function isBinary(filename: string): boolean {
  return isImageOrMedia(getExtension(filename));
}

export interface ScanResult {
  fileName: string;
  fileCount: number;
  totalSize: number;
  ignoredFiles: number;
  warnings: string[];
  extensions: Record<string, number>;
  manifests: string[];
  packageJson: Record<string, unknown> | null;
  framework: string | null;
  packageManager: string | null;
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  repoMap: {
    components: string[];
    routes: string[];
    apiFiles: string[];
    hooks: string[];
    utilities: string[];
    services: string[];
    authFiles: string[];
    dbFiles: string[];
    aiFiles: string[];
    paymentFiles: string[];
    uploadFiles: string[];
    configFiles: string[];
    testFiles: string[];
    deploymentFiles: string[];
    docsFiles: string[];
  };
  staticSignals: StaticSignals;
  evidenceIndex: EvidenceItem[];
  sampleFiles: SampleFile[];
  largestFiles: { path: string; size: number }[];
  summaryMarkdown: string;
}

export interface EvidenceItem {
  category: string;
  severity: "info" | "warning" | "error";
  filePath: string;
  lineNumber?: number;
  snippet: string;
  signal: string;
  explanation: string;
}

interface SampleFile {
  path: string;
  size: number;
  lines: number;
  preview: string;
}

export async function scanZip(buffer: Buffer, fileName: string): Promise<ScanResult> {
  const zip = await JSZip.loadAsync(buffer);
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
    components: [] as string[],
    routes: [] as string[],
    apiFiles: [] as string[],
    hooks: [] as string[],
    utilities: [] as string[],
    services: [] as string[],
    authFiles: [] as string[],
    dbFiles: [] as string[],
    aiFiles: [] as string[],
    paymentFiles: [] as string[],
    uploadFiles: [] as string[],
    configFiles: [] as string[],
    testFiles: [] as string[],
    deploymentFiles: [] as string[],
    docsFiles: [] as string[],
  };

  const staticSignals: StaticSignals = {
    hasReadme: false,
    readmeQuality: "none",
    hasGitignore: false,
    hasEnvExample: false,
    committedEnvFiles: false,
    hasPackageJson: false,
    hasBuildScript: false,
    hasStartScript: false,
    hasTestScript: false,
    hasTests: false,
    hasCiWorkflow: false,
    hasDockerfile: false,
    hasDeploymentConfig: false,
    hasDatabaseMigrations: false,
    hasApiRoutes: false,
    hasAuthFiles: false,
    hasPaymentFiles: false,
    hasAiFiles: false,
    hasStorageFiles: false,
    sourceFileCount: 0,
    testFileCount: 0,
    componentCount: 0,
    routeCount: 0,
    apiRouteCount: 0,
    hookCount: 0,
    utilCount: 0,
    serviceCount: 0,
    todoCount: 0,
    fixmeCount: 0,
    consoleLogCount: 0,
    debuggerCount: 0,
    tsAnyCount: 0,
    tsIgnoreCount: 0,
    eslintDisableCount: 0,
    evalCount: 0,
    newFunctionCount: 0,
    dangerouslySetInnerHTMLCount: 0,
    localStorageTokenHints: 0,
    possibleHardcodedSecrets: 0,
    filesOver300Lines: 0,
    filesOver600Lines: 0,
  };

  const evidenceIndex: EvidenceItem[] = [];
  const sampleFiles: SampleFile[] = [];
  const fileSizes: { path: string; size: number }[] = [];

  let fileCount = 0;
  let totalSize = 0;
  let ignoredFiles = 0;

  const entries = Object.entries(zip.files);

  if (entries.length > 2500) {
    warnings.push(`ZIP contains ${entries.length} files — only analyzing first 2500`);
  }

  const processedEntries = entries.slice(0, 2500);

  for (const [path, file] of processedEntries) {
    if (file.dir) continue;
    if (!isSafePath(path)) {
      warnings.push(`Unsafe path skipped: ${path}`);
      continue;
    }

    const parts = path.split("/");
    const name = parts[parts.length - 1];

    if (shouldIgnoreDir(parts.slice(0, -1))) {
      ignoredFiles++;
      continue;
    }

    if (isBinary(name)) {
      ignoredFiles++;
      continue;
    }

    const ext = getExtension(name);
    extensions[ext] = (extensions[ext] ?? 0) + 1;

    let content = "";
    try {
      content = await file.async("string");
    } catch {
      ignoredFiles++;
      continue;
    }

    const size = content.length;
    totalSize += size;
    fileCount++;
    fileSizes.push({ path, size });

    const lowerPath = path.toLowerCase();
    const lowerName = name.toLowerCase();

    // README
    if (lowerName.startsWith("readme")) {
      staticSignals.hasReadme = true;
      staticSignals.readmeQuality = content.length > 500 ? "good" : "minimal";
      repoMap.docsFiles.push(path);
    }

    // .gitignore
    if (lowerName === ".gitignore") {
      staticSignals.hasGitignore = true;
    }

    // .env files (detect but don't read)
    if (lowerName === ".env" || lowerName.match(/^\.env\./)) {
      if (!lowerName.includes("example") && !lowerName.includes("sample")) {
        staticSignals.committedEnvFiles = true;
        warnings.push(`Committed .env file detected: ${path}`);
        evidenceIndex.push({
          category: "Security",
          severity: "error",
          filePath: path,
          snippet: "[Contents hidden for security]",
          signal: "committed_env_file",
          explanation: ".env files should never be committed to source control",
        });
      } else {
        staticSignals.hasEnvExample = true;
      }
      continue;
    }

    // package.json
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

        // Detect framework
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

        // Detect package manager
        if (parts.some(p => p === "pnpm-lock.yaml")) packageManager = "pnpm";
      } catch {
        warnings.push(`Failed to parse ${path}`);
      }
    }

    // pnpm-lock.yaml
    if (lowerName === "pnpm-lock.yaml") packageManager = "pnpm";
    if (lowerName === "yarn.lock") packageManager = "yarn";
    if (lowerName === "package-lock.json") packageManager = "npm";

    // Dockerfile
    if (lowerName === "dockerfile") {
      staticSignals.hasDockerfile = true;
      repoMap.deploymentFiles.push(path);
    }

    // CI/CD
    if (lowerPath.includes(".github/workflows") || lowerPath.includes(".gitlab-ci")) {
      staticSignals.hasCiWorkflow = true;
      repoMap.deploymentFiles.push(path);
    }

    // Deployment configs
    if (["render.yaml", "fly.toml", "vercel.json", "netlify.toml", ".replit"].some(f => lowerName === f)) {
      staticSignals.hasDeploymentConfig = true;
      repoMap.deploymentFiles.push(path);
    }

    // Migrations
    if (lowerPath.includes("migration") || lowerPath.includes("schema.sql")) {
      staticSignals.hasDatabaseMigrations = true;
      repoMap.dbFiles.push(path);
    }

    // Source file categories
    const isSource = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"].includes(ext);
    if (isSource) {
      staticSignals.sourceFileCount++;

      const isTest = lowerName.includes(".test.") || lowerName.includes(".spec.") || lowerPath.includes("/__tests__/");
      if (isTest) {
        staticSignals.hasTests = true;
        staticSignals.testFileCount++;
        repoMap.testFiles.push(path);
      }

      // Categorize
      if (lowerPath.includes("/components/") || lowerPath.includes("/component/")) {
        repoMap.components.push(path);
        staticSignals.componentCount++;
      }
      if (lowerPath.includes("/pages/") || lowerPath.includes("/routes/") || lowerPath.includes("/app/") || lowerPath.includes("/views/") || lowerPath.includes("/screens/")) {
        repoMap.routes.push(path);
        staticSignals.routeCount++;
      }
      if (lowerPath.includes("/api/") || lowerName.includes("route") || lowerName.includes("handler") || lowerPath.includes("/api-")) {
        repoMap.apiFiles.push(path);
        staticSignals.apiRouteCount++;
        staticSignals.hasApiRoutes = true;
      }
      if (lowerPath.includes("/hooks/") || lowerName.startsWith("use")) {
        repoMap.hooks.push(path);
        staticSignals.hookCount++;
      }
      if (lowerPath.includes("/utils/") || lowerPath.includes("/lib/") || lowerPath.includes("/helpers/")) {
        repoMap.utilities.push(path);
        staticSignals.utilCount++;
      }
      if (lowerPath.includes("/services/") || lowerName.includes("service")) {
        repoMap.services.push(path);
        staticSignals.serviceCount++;
      }
      if (lowerName.includes("auth") || lowerPath.includes("/auth/")) {
        repoMap.authFiles.push(path);
        staticSignals.hasAuthFiles = true;
      }
      if (lowerName.includes("db") || lowerName.includes("database") || lowerName.includes("drizzle") || lowerName.includes("prisma") || lowerName.includes("supabase")) {
        repoMap.dbFiles.push(path);
      }
      if (lowerName.includes("ai") || lowerName.includes("openai") || lowerName.includes("groq") || lowerName.includes("llm")) {
        repoMap.aiFiles.push(path);
        staticSignals.hasAiFiles = true;
      }
      if (lowerName.includes("stripe") || lowerName.includes("payment")) {
        repoMap.paymentFiles.push(path);
        staticSignals.hasPaymentFiles = true;
      }
      if (lowerName.includes("upload") || lowerName.includes("storage") || lowerName.includes("s3")) {
        repoMap.uploadFiles.push(path);
        staticSignals.hasStorageFiles = true;
      }

      // Analyze content
      const lines = content.split("\n");
      const lineCount = lines.length;

      if (lineCount > 300) staticSignals.filesOver300Lines++;
      if (lineCount > 600) staticSignals.filesOver600Lines++;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lowerLine = line.toLowerCase();

        if (lowerLine.includes("// todo") || lowerLine.includes("//todo")) staticSignals.todoCount++;
        if (lowerLine.includes("// fixme") || lowerLine.includes("//fixme")) staticSignals.fixmeCount++;
        if (lowerLine.includes("console.log")) staticSignals.consoleLogCount++;
        if (line.trim() === "debugger;") {
          staticSignals.debuggerCount++;
          evidenceIndex.push({
            category: "Performance",
            severity: "error",
            filePath: path,
            lineNumber: i + 1,
            snippet: line.trim(),
            signal: "debugger_statement",
            explanation: "debugger statements will pause execution in production",
          });
        }
        if (line.includes(": any") || line.includes("<any>")) staticSignals.tsAnyCount++;
        if (lowerLine.includes("// @ts-ignore")) staticSignals.tsIgnoreCount++;
        if (lowerLine.includes("// eslint-disable")) staticSignals.eslintDisableCount++;
        if (line.includes("eval(")) {
          staticSignals.evalCount++;
          evidenceIndex.push({
            category: "Security",
            severity: "warning",
            filePath: path,
            lineNumber: i + 1,
            snippet: redactSecrets(line.trim().slice(0, 100)),
            signal: "eval_usage",
            explanation: "eval() is a security risk and performance problem",
          });
        }
        if (line.includes("new Function(")) staticSignals.newFunctionCount++;
        if (line.includes("dangerouslySetInnerHTML")) staticSignals.dangerouslySetInnerHTMLCount++;
        if (line.includes("localStorage") && (lowerLine.includes("token") || lowerLine.includes("auth"))) {
          staticSignals.localStorageTokenHints++;
        }

        // Check for hardcoded secrets
        for (const pattern of SECRET_PATTERNS) {
          if (pattern.test(line) && !lowerLine.includes("example") && !lowerLine.includes("placeholder")) {
            staticSignals.possibleHardcodedSecrets++;
            evidenceIndex.push({
              category: "Security",
              severity: "error",
              filePath: path,
              lineNumber: i + 1,
              snippet: redactSecrets(line.trim().slice(0, 80)),
              signal: "hardcoded_secret",
              explanation: "Possible hardcoded API key or secret detected",
            });
            break;
          }
        }
      }

      // Collect sample files (up to 5 small source files)
      if (sampleFiles.length < 5 && size < 3000 && !isTest) {
        sampleFiles.push({
          path,
          size,
          lines: lineCount,
          preview: redactSecrets(content.slice(0, 500)),
        });
      }
    }

    // Config files
    if ([".json", ".yaml", ".yml", ".toml", ".config.js", ".config.ts"].some(e => ext === e || name.endsWith(e))) {
      repoMap.configFiles.push(path);
    }
  }

  // Sort and cap
  fileSizes.sort((a, b) => b.size - a.size);
  const largestFiles = fileSizes.slice(0, 10);

  // Build summary markdown
  const summaryMarkdown = buildSummaryMarkdown({
    fileName,
    fileCount,
    totalSize,
    framework,
    packageManager,
    staticSignals,
    repoMap,
  });

  return {
    fileName,
    fileCount,
    totalSize,
    ignoredFiles,
    warnings,
    extensions,
    manifests,
    packageJson,
    framework,
    packageManager,
    scripts,
    dependencies,
    devDependencies,
    repoMap,
    staticSignals,
    evidenceIndex: evidenceIndex.slice(0, 50),
    sampleFiles,
    largestFiles,
    summaryMarkdown,
  };
}

function buildSummaryMarkdown(ctx: {
  fileName: string;
  fileCount: number;
  totalSize: number;
  framework: string | null;
  packageManager: string | null;
  staticSignals: StaticSignals;
  repoMap: ScanResult["repoMap"];
}): string {
  const { fileName, fileCount, totalSize, framework, packageManager, staticSignals, repoMap } = ctx;
  const kb = Math.round(totalSize / 1024);

  return `# Project Scan: ${fileName}

## Overview
- **Files scanned:** ${fileCount}
- **Total size:** ${kb} KB
- **Framework:** ${framework ?? "Unknown"}
- **Package manager:** ${packageManager ?? "Unknown"}

## Repository Map
- Components: ${repoMap.components.length}
- Routes/Pages: ${repoMap.routes.length}
- API files: ${repoMap.apiFiles.length}
- Hooks: ${repoMap.hooks.length}
- Services: ${repoMap.services.length}
- Test files: ${staticSignals.testFileCount}

## Key Signals
- README: ${staticSignals.hasReadme ? `✓ (${staticSignals.readmeQuality})` : "✗ Missing"}
- .gitignore: ${staticSignals.hasGitignore ? "✓" : "✗ Missing"}
- .env.example: ${staticSignals.hasEnvExample ? "✓" : "✗ Missing"}
- Build script: ${staticSignals.hasBuildScript ? "✓" : "✗ Missing"}
- Tests: ${staticSignals.hasTests ? `✓ (${staticSignals.testFileCount} files)` : "✗ None found"}
- CI/CD: ${staticSignals.hasCiWorkflow ? "✓" : "✗ Not configured"}
- Auth: ${staticSignals.hasAuthFiles ? "✓" : "✗ Not detected"}
- Database: ${staticSignals.hasDatabaseMigrations ? "✓" : "✗ No migrations"}

## Code Quality
- console.log count: ${staticSignals.consoleLogCount}
- TODO comments: ${staticSignals.todoCount}
- FIXME comments: ${staticSignals.fixmeCount}
- TypeScript \`any\`: ${staticSignals.tsAnyCount}
- Possible secrets: ${staticSignals.possibleHardcodedSecrets}
- Committed .env: ${staticSignals.committedEnvFiles ? "⚠️ YES" : "✓ No"}
`;
}
