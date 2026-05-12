import JSZip from "jszip";

const IGNORE_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".next", "out", "coverage",
  "venv", "__pycache__", "vendor", "target", ".cache", ".turbo",
]);
const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico", ".bmp", ".tiff", ".mp4", ".mov", ".avi", ".mp3", ".wav"]);
const BINARY_EXTS = new Set([".zip", ".tar", ".gz", ".exe", ".dll", ".so", ".bin", ".wasm", ".pdf", ".ttf", ".woff", ".woff2", ".otf"]);
const CODE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java", ".cs", ".rb", ".php", ".swift", ".kt", ".vue", ".svelte", ".c", ".cpp", ".h"]);
const MANIFEST_NAMES = new Set(["package.json", "requirements.txt", "go.mod", "cargo.toml", "pubspec.yaml"]);
const ENV_NAMES = new Set([".env", ".env.local", ".env.production", ".env.staging", ".env.development"]);
const SECRET_PATTERNS = /(?:password|secret|api_key|apikey|token|private_key|auth_token)\s*[:=]\s*["']?[A-Za-z0-9_\-\.]{8,}/gi;

export type LaunchGate = {
  name: string;
  status: "GREEN" | "YELLOW" | "RED";
  evidence: string[];
  how_to_fix: string;
};

export type StaticSignals = {
  hasReadme: boolean;
  hasGitignore: boolean;
  hasEnvExample: boolean;
  committedEnvFiles: string[];
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
  todoCount: number;
  fixmeCount: number;
  consoleLogCount: number;
  debuggerCount: number;
  tsAnyCount: number;
  evalCount: number;
  dangerouslySetInnerHTMLCount: number;
  possibleHardcodedSecrets: number;
  filesOver300Lines: number;
  filesOver600Lines: number;
  componentCount: number;
  routeCount: number;
  apiRouteCount: number;
  testFileCount: number;
};

export type DeepZipScanResult = {
  fileName: string;
  fileCount: number;
  totalSize: number;
  extensions: Record<string, number>;
  manifests: Record<string, string>;
  packageJson: Record<string, unknown> | null;
  framework: string;
  packageManager: string;
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  staticSignals: StaticSignals;
  launchGates: LaunchGate[];
  sampleFiles: Array<{ path: string; content: string; lines: number }>;
  largestFiles: Array<{ path: string; size: number }>;
  warnings: string[];
  summaryMarkdown: string;
};

function shouldIgnore(filePath: string): boolean {
  return filePath.split("/").some((p) => IGNORE_DIRS.has(p));
}

function getExt(filePath: string): string {
  const dot = filePath.lastIndexOf(".");
  return dot === -1 ? "" : filePath.slice(dot).toLowerCase();
}

function getBasename(filePath: string): string {
  return filePath.split("/").pop()!.toLowerCase();
}

function redactSecrets(content: string): string {
  return content.replace(SECRET_PATTERNS, (match) => {
    const eqIdx = match.indexOf("=");
    const colonIdx = match.indexOf(":");
    const sep = eqIdx !== -1 && (colonIdx === -1 || eqIdx < colonIdx) ? eqIdx : colonIdx;
    return match.slice(0, sep + 1) + " [REDACTED]";
  });
}

function detectFramework(packageJson: Record<string, unknown> | null, allFiles: string[]): string {
  if (!packageJson) {
    if (allFiles.some((f) => f.endsWith("requirements.txt"))) return "Python";
    if (allFiles.some((f) => f.endsWith("go.mod"))) return "Go";
    return "Unknown";
  }
  const deps = { ...((packageJson.dependencies as Record<string, string>) ?? {}), ...((packageJson.devDependencies as Record<string, string>) ?? {}) };
  if (deps.next) return "Next.js";
  if (deps.react) return "React";
  if (deps.vue) return "Vue";
  if (deps.express) return "Express";
  return "Node.js";
}

export async function scanZip(file: File): Promise<DeepZipScanResult> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const result: DeepZipScanResult = {
    fileName: file.name, fileCount: 0, totalSize: 0, extensions: {}, manifests: {},
    packageJson: null, framework: "Unknown", packageManager: "npm", scripts: {}, dependencies: {}, devDependencies: {},
    staticSignals: {
      hasReadme: false, hasGitignore: false, hasEnvExample: false, committedEnvFiles: [],
      hasPackageJson: false, hasBuildScript: false, hasStartScript: false, hasTestScript: false,
      hasTests: false, hasCiWorkflow: false, hasDockerfile: false, hasDeploymentConfig: false,
      hasDatabaseMigrations: false, hasApiRoutes: false, hasAuthFiles: false, hasPaymentFiles: false,
      hasAiFiles: false, hasStorageFiles: false, todoCount: 0, fixmeCount: 0, consoleLogCount: 0,
      debuggerCount: 0, tsAnyCount: 0, evalCount: 0, dangerouslySetInnerHTMLCount: 0,
      possibleHardcodedSecrets: 0, filesOver300Lines: 0, filesOver600Lines: 0,
      componentCount: 0, routeCount: 0, apiRouteCount: 0, testFileCount: 0,
    },
    launchGates: [], sampleFiles: [], largestFiles: [], warnings: [], summaryMarkdown: "",
  };

  const sizePairs: Array<{ path: string; size: number }> = [];
  const allPaths: string[] = [];
  let components = 0, routes = 0, apiRoutes = 0, testFiles = 0;

  for (const [filePath, entry] of Object.entries(zip.files)) {
    if (entry.dir || shouldIgnore(filePath)) continue;
    const ext = getExt(filePath);
    const basename = getBasename(filePath);

    if (IMAGE_EXTS.has(ext) || BINARY_EXTS.has(ext)) {
      result.fileCount++;
      result.extensions[ext] = (result.extensions[ext] ?? 0) + 1;
      allPaths.push(filePath);
      continue;
    }

    let content: string;
    try { content = await entry.async("string"); } catch { result.warnings.push(`Could not read: ${filePath}`); continue; }

    const size = content.length;
    result.fileCount++;
    result.totalSize += size;
    result.extensions[ext] = (result.extensions[ext] ?? 0) + 1;
    sizePairs.push({ path: filePath, size });
    allPaths.push(filePath);

    const lines = content.split("\n");
    if (lines.length > 600) result.staticSignals.filesOver600Lines++;
    else if (lines.length > 300) result.staticSignals.filesOver300Lines++;

    if (ENV_NAMES.has(basename)) { result.staticSignals.committedEnvFiles.push(filePath); continue; }
    if (basename.startsWith(".env.example") || basename.startsWith(".env.sample")) result.staticSignals.hasEnvExample = true;
    if (MANIFEST_NAMES.has(basename)) {
      result.manifests[basename] = content.slice(0, 4000);
      if (basename === "package.json") {
        try {
          result.packageJson = JSON.parse(content) as Record<string, unknown>;
          result.staticSignals.hasPackageJson = true;
          const scripts = (result.packageJson.scripts as Record<string, string>) ?? {};
          result.scripts = scripts;
          result.dependencies = (result.packageJson.dependencies as Record<string, string>) ?? {};
          result.devDependencies = (result.packageJson.devDependencies as Record<string, string>) ?? {};
          if (scripts.build) result.staticSignals.hasBuildScript = true;
          if (scripts.start) result.staticSignals.hasStartScript = true;
          if (scripts.test) result.staticSignals.hasTestScript = true;
        } catch { result.warnings.push("Could not parse package.json"); }
      }
    }

    const lp = filePath.toLowerCase();
    if (basename.includes("readme")) result.staticSignals.hasReadme = true;
    if (basename === ".gitignore") result.staticSignals.hasGitignore = true;
    if (basename === "dockerfile") result.staticSignals.hasDockerfile = true;
    if (lp.includes(".github/workflows") || lp.includes(".circleci")) result.staticSignals.hasCiWorkflow = true;
    if (lp.includes("vercel.json") || lp.includes("fly.toml") || lp.includes("railway.json")) result.staticSignals.hasDeploymentConfig = true;
    if (lp.includes("migration") || lp.includes("schema.sql")) result.staticSignals.hasDatabaseMigrations = true;
    if (lp.includes("/components/")) components++;
    if (lp.includes("/pages/") || lp.includes("/routes/")) routes++;
    if (lp.includes("/api/") || basename.includes("route") || basename.includes("handler")) { apiRoutes++; result.staticSignals.hasApiRoutes = true; }
    if (lp.endsWith(".test.ts") || lp.endsWith(".spec.ts") || lp.includes("__tests__")) { testFiles++; result.staticSignals.hasTests = true; }
    if (basename.includes("auth")) result.staticSignals.hasAuthFiles = true;
    if (basename.includes("stripe") || basename.includes("payment")) result.staticSignals.hasPaymentFiles = true;
    if (basename.includes("ai") || basename.includes("openai")) result.staticSignals.hasAiFiles = true;

    if (CODE_EXTS.has(ext)) {
      result.staticSignals.todoCount += (content.match(/\/\/\s*TODO/gi) ?? []).length;
      result.staticSignals.consoleLogCount += (content.match(/console\.log\(/g) ?? []).length;
      result.staticSignals.tsAnyCount += (content.match(/:\s*any\b/g) ?? []).length;
      result.staticSignals.evalCount += (content.match(/\beval\(/g) ?? []).length;
      const secretMatches = content.match(SECRET_PATTERNS) ?? [];
      result.staticSignals.possibleHardcodedSecrets += secretMatches.length;
    }

    if (result.sampleFiles.length < 8 && CODE_EXTS.has(ext) && size < 10000) {
      result.sampleFiles.push({ path: filePath, content: redactSecrets(content.slice(0, 3000)), lines: lines.length });
    }
  }

  result.staticSignals.componentCount = components;
  result.staticSignals.routeCount = routes;
  result.staticSignals.apiRouteCount = apiRoutes;
  result.staticSignals.testFileCount = testFiles;
  result.largestFiles = sizePairs.sort((a, b) => b.size - a.size).slice(0, 10);
  result.framework = detectFramework(result.packageJson, allPaths);

  if (allPaths.some((p) => p.includes("pnpm-lock"))) result.packageManager = "pnpm";
  else if (allPaths.some((p) => p.includes("yarn.lock"))) result.packageManager = "yarn";

  const ss = result.staticSignals;
  result.launchGates = [
    {
      name: "Security Gate",
      status: ss.committedEnvFiles.length > 0 || ss.possibleHardcodedSecrets > 2 || ss.evalCount > 0 ? "RED" : ss.possibleHardcodedSecrets > 0 ? "YELLOW" : "GREEN",
      evidence: [`Committed env files: ${ss.committedEnvFiles.length}`, `Possible secrets: ${ss.possibleHardcodedSecrets}`, `eval() calls: ${ss.evalCount}`],
      how_to_fix: "Remove committed env files, audit for hardcoded secrets, avoid eval().",
    },
    {
      name: "Testing Gate",
      status: !ss.hasTests ? "RED" : ss.testFileCount < 3 ? "YELLOW" : "GREEN",
      evidence: [ss.hasTests ? `${ss.testFileCount} test file(s)` : "No tests found"],
      how_to_fix: "Add unit and integration tests. Configure a test script.",
    },
    {
      name: "Deployment Gate",
      status: !ss.hasDeploymentConfig && !ss.hasDockerfile ? "RED" : !ss.hasBuildScript ? "YELLOW" : "GREEN",
      evidence: [ss.hasDockerfile ? "Dockerfile present" : "No Dockerfile", ss.hasDeploymentConfig ? "Deployment config found" : "No deployment config"],
      how_to_fix: "Add deployment config (vercel.json, fly.toml, Dockerfile) and build script.",
    },
    {
      name: "Documentation Gate",
      status: !ss.hasReadme ? "RED" : !ss.hasEnvExample ? "YELLOW" : "GREEN",
      evidence: [ss.hasReadme ? "README found" : "No README", ss.hasEnvExample ? ".env.example found" : "No .env.example"],
      how_to_fix: "Add README.md, .env.example, and .gitignore.",
    },
    {
      name: "Product Completeness Gate",
      status: !ss.hasApiRoutes && components === 0 ? "RED" : ss.consoleLogCount > 20 ? "YELLOW" : "GREEN",
      evidence: [`${components} components`, `${apiRoutes} API routes`, `${ss.consoleLogCount} console.log calls`],
      how_to_fix: "Remove console.log statements. Ensure core user flows are implemented.",
    },
  ];

  const redGates = result.launchGates.filter((g) => g.status === "RED").length;
  const yellowGates = result.launchGates.filter((g) => g.status === "YELLOW").length;
  const healthScore = Math.max(0, 100 - redGates * 25 - yellowGates * 10);

  result.summaryMarkdown = `## Diagnostic Summary: ${file.name}\n\n**Files:** ${result.fileCount} | **Framework:** ${result.framework} | **Package Manager:** ${result.packageManager}\n\n**Estimated Health Score:** ${healthScore}/100\n\n### Launch Gates\n${result.launchGates.map((g) => `- ${g.status === "GREEN" ? "✅" : g.status === "YELLOW" ? "⚠️" : "🔴"} **${g.name}**: ${g.status}`).join("\n")}`.trim();

  return result;
}

export function summarizeZip(scan: DeepZipScanResult): string {
  const gateStr = scan.launchGates.map((g) => `${g.name}: ${g.status} — ${g.evidence.join("; ")}`).join("\n");
  return `REPO: ${scan.fileName}\nFILES: ${scan.fileCount} (${(scan.totalSize / 1024).toFixed(0)} KB)\nFRAMEWORK: ${scan.framework} / ${scan.packageManager}\n\nSTATIC SIGNALS:\n- Tests: ${scan.staticSignals.hasTests} (${scan.staticSignals.testFileCount} files)\n- CI/CD: ${scan.staticSignals.hasCiWorkflow}\n- Committed env: ${scan.staticSignals.committedEnvFiles.length}\n- Hardcoded secrets: ${scan.staticSignals.possibleHardcodedSecrets}\n- console.log: ${scan.staticSignals.consoleLogCount}\n- TypeScript any: ${scan.staticSignals.tsAnyCount}\n\nLAUNCH GATES:\n${gateStr}\n\nSAMPLE FILES:\n${scan.sampleFiles.map((f) => `--- ${f.path} (${f.lines} lines) ---\n${f.content}`).join("\n\n")}`;
}
