import type { LaunchFinding } from "../launch-finding";

export type RouteIntegritySignal = {
  definedRoutes: string[];
  referencedRoutes: Array<{ path: string; file: string; line: number }>;
  missingRoutes: Array<{ path: string; references: Array<{ file: string; line: number }> }>;
  staleRoutes: string[];
};

export function analyzeRouteIntegrity(
  definedRoutes: string[],
  referencedRoutes: Array<{ path: string; file: string; line: number }>
): RouteIntegritySignal {
  const definedSet = new Set(definedRoutes);
  const missingMap = new Map<string, Array<{ file: string; line: number }>>();

  for (const ref of referencedRoutes) {
    const basePath = ref.path.split("?")[0] ?? ref.path;
    if (!definedSet.has(basePath) && !definedSet.has(ref.path)) {
      const existing = missingMap.get(ref.path) ?? [];
      existing.push({ file: ref.file, line: ref.line });
      missingMap.set(ref.path, existing);
    }
  }

  const missingRoutes = Array.from(missingMap.entries()).map(([path, references]) => ({
    path,
    references,
  }));

  const staleRoutes = definedRoutes.filter(route => {
    return !referencedRoutes.some(ref => ref.path === route || ref.path.startsWith(route));
  });

  return {
    definedRoutes,
    referencedRoutes,
    missingRoutes,
    staleRoutes,
  };
}

export function routeIntegrityToFindings(signal: RouteIntegritySignal): LaunchFinding[] {
  const findings: LaunchFinding[] = [];

  for (const missing of signal.missingRoutes) {
    findings.push({
      id: `route-missing-${missing.path.replace(/[^a-z0-9]/gi, "-")}`,
      severity: missing.references.length > 2 ? "P0" : "P1",
      category: "product",
      title: `Stale route: ${missing.path}`,
      summary: `${missing.references.length} navigation call${missing.references.length > 1 ? "s" : ""} reference ${missing.path}, which is not defined in the router`,
      evidence: missing.references.map(ref => ({
        source: "static_scan" as const,
        filePath: ref.file,
        lineNumber: ref.line,
      })),
      whyItMatters: "Users clicking these links will see a 404 page, destroying trust in the application",
      recommendedFix: `Replace ${missing.path} with a valid route from the ROUTES registry or add the route to App.tsx`,
      acceptanceCriteria: [
        `No navigation calls reference ${missing.path}`,
        "All CTA buttons navigate to defined routes",
      ],
      verificationSteps: ["Search codebase for the stale route string", "Verify no navigate() or href references remain"],
      aiIdePrompt: `Replace all references to "${missing.path}" with the correct route from the ROUTES registry. Check navigate() calls, href attributes, and link components.`,
      confidence: "high",
    });
  }

  return findings;
}
