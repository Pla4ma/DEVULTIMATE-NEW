import type { LaunchFinding } from "../launch-finding";

export type ApiContractSignal = {
  backendRoutes: Array<{ method: string; path: string; file: string }>;
  frontendCalls: Array<{ method: string; url: string; file: string; line: number }>;
  missingEndpoints: Array<{ url: string; references: Array<{ file: string; line: number }> }>;
  wrongMethods: Array<{ url: string; expected: string; actual: string }>;
};

export function analyzeApiContract(
  backendRoutes: Array<{ method: string; path: string; file: string }>,
  frontendCalls: Array<{ method: string; url: string; file: string; line: number }>
): ApiContractSignal {
  const backendPaths = new Set(backendRoutes.map(r => r.path));
  const missingMap = new Map<string, Array<{ file: string; line: number }>>();

  for (const call of frontendCalls) {
    if (!backendPaths.has(call.url)) {
      const existing = missingMap.get(call.url) ?? [];
      existing.push({ file: call.file, line: call.line });
      missingMap.set(call.url, existing);
    }
  }

  const missingEndpoints = Array.from(missingMap.entries()).map(([url, references]) => ({
    url,
    references,
  }));

  return {
    backendRoutes,
    frontendCalls,
    missingEndpoints,
    wrongMethods: [],
  };
}

export function apiContractToFindings(signal: ApiContractSignal): LaunchFinding[] {
  const findings: LaunchFinding[] = [];

  for (const missing of signal.missingEndpoints) {
    findings.push({
      id: `api-missing-${missing.url.replace(/[^a-z0-9]/gi, "-")}`,
      severity: "P0",
      category: "product",
      title: `Missing API endpoint: ${missing.url}`,
      summary: `Frontend calls ${missing.url} but no backend route matches`,
      evidence: missing.references.map(ref => ({
        source: "static_scan" as const,
        filePath: ref.file,
        lineNumber: ref.line,
      })),
      whyItMatters: "API calls to non-existent endpoints will fail in production, breaking core user flows",
      recommendedFix: `Add a backend route for ${missing.url} or update the frontend to use an existing endpoint`,
      acceptanceCriteria: [
        `${missing.url} returns a valid response`,
        "No frontend code references non-existent API endpoints",
      ],
      verificationSteps: ["Run the API server", `Test ${missing.url} with curl`, "Check frontend error handling"],
      aiIdePrompt: `The frontend calls ${missing.url} but no backend route exists. Either add the Express route or update the frontend client to use the correct endpoint.`,
      confidence: "high",
    });
  }

  return findings;
}
