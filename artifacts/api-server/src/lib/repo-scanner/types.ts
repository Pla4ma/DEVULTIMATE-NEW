import type { StaticSignals } from "../launch-gates";

export interface EvidenceItem {
  category: string;
  severity: "info" | "warning" | "error";
  filePath: string;
  lineNumber?: number;
  snippet: string;
  signal: string;
  explanation: string;
}

export interface SampleFile {
  path: string;
  size: number;
  lines: number;
  preview: string;
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
  trimmed: boolean;
  secretConfidence: "clean" | "suspicious" | "secrets_detected";
}
