import type { ScanResult } from "./types";
import type { StaticSignals } from "../launch-gates";

export function buildSummaryMarkdown(ctx: {
  fileName: string;
  fileCount: number;
  totalSize: number;
  framework: string | null;
  packageManager: string | null;
  staticSignals: StaticSignals;
  repoMap: ScanResult["repoMap"];
  secretConfidence: "clean" | "suspicious" | "secrets_detected";
}): string {
  const { fileName, fileCount, totalSize, framework, packageManager, staticSignals, repoMap, secretConfidence } = ctx;
  const kb = Math.round(totalSize / 1024);

  return `# Static Code Signal Scan: ${fileName}

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
- Secret confidence: ${secretConfidence}

## Scan Type
- **Tier:** Static Code Signal Scan (deterministic only)
- **Does NOT:** build, test, deploy, run auth checks, or verify runtime behavior
- **Deep Scan:** (coming soon) runs build/typecheck/lint in a sandbox for verified results
`;
}
