import type { LaunchFinding } from "../launch-finding";

export type AuthBypassSignal = {
  protectedRoutes: string[];
  rawFetchCalls: Array<{ url: string; file: string; line: number }>;
  bypassRisks: Array<{ url: string; file: string; line: number; fix: string }>;
};

export function analyzeAuthBypass(
  protectedRoutes: string[],
  rawFetchCalls: Array<{ url: string; file: string; line: number }>
): AuthBypassSignal {
  const bypassRisks: AuthBypassSignal["bypassRisks"] = [];

  for (const call of rawFetchCalls) {
    const isProtected = protectedRoutes.some(route => call.url.startsWith(route));
    if (isProtected) {
      bypassRisks.push({
        url: call.url,
        file: call.file,
        line: call.line,
        fix: `Replace fetch("${call.url}") with authenticatedFetch("${call.url}", ...)`,
      });
    }
  }

  return {
    protectedRoutes,
    rawFetchCalls,
    bypassRisks,
  };
}

export function authBypassToFindings(signal: AuthBypassSignal): LaunchFinding[] {
  const findings: LaunchFinding[] = [];

  for (const risk of signal.bypassRisks) {
    findings.push({
      id: `auth-bypass-${risk.url.replace(/[^a-z0-9]/gi, "-")}-${risk.line}`,
      severity: "P1",
      category: "auth",
      title: `Auth bypass risk: ${risk.url}`,
      summary: `Raw fetch() to protected endpoint ${risk.url} — Authorization header may be missing`,
      evidence: [{
        source: "static_scan",
        filePath: risk.file,
        lineNumber: risk.line,
      }],
      whyItMatters: "Protected API calls without authentication will fail with 401 in production",
      recommendedFix: risk.fix,
      acceptanceCriteria: [
        "All protected API calls include Authorization header",
        "No raw fetch() calls to /api/* endpoints that require auth",
      ],
      verificationSteps: [
        `Check ${risk.file} line ${risk.line}`,
        "Verify authenticatedFetch is used instead of raw fetch",
      ],
      aiIdePrompt: `In ${risk.file} at line ${risk.line}, replace the raw fetch() call with authenticatedFetch() to ensure the Authorization header is included.`,
      confidence: "high",
    });
  }

  return findings;
}
