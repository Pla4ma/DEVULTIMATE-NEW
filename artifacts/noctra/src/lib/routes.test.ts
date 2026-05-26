import { describe, it, expect } from "vitest";
import { ROUTES, STALE_ROUTE_PATTERNS } from "./routes";

/**
 * Route contract tests.
 *
 * These tests prevent the #1 bug class in this codebase:
 * stale route references that cause 404s.
 */

describe("route registry", () => {
  it("all tool routes resolve to valid grouped route paths", () => {
    const validBasePaths = ["/app", "/app/idea-lab", "/app/code-health", "/app/build", "/app/brain"];

    const toolRoutes = [
      ROUTES.doctor,
      ROUTES.launch,
      ROUTES.idea,
      ROUTES.reality,
      ROUTES.proof,
      ROUTES.swarm,
      ROUTES.mvp,
      ROUTES.tasks,
      ROUTES.twin,
      ROUTES.passport,
      ROUTES.projects,
      ROUTES.reports,
    ];

    for (const route of toolRoutes) {
      const basePath = route.split("?")[0];
      expect(validBasePaths).toContain(basePath);
    }
  });

  it("tool routes include tool query param", () => {
    expect(ROUTES.doctor).toContain("tool=doctor");
    expect(ROUTES.launch).toContain("tool=launch");
    expect(ROUTES.idea).toContain("tool=idea");
    expect(ROUTES.reality).toContain("tool=reality");
    expect(ROUTES.proof).toContain("tool=proof");
    expect(ROUTES.swarm).toContain("tool=swarm");
    expect(ROUTES.mvp).toContain("tool=mvp");
    expect(ROUTES.tasks).toContain("tool=tasks");
    expect(ROUTES.twin).toContain("tool=twin");
    expect(ROUTES.passport).toContain("tool=passport");
    expect(ROUTES.projects).toContain("tool=projects");
    expect(ROUTES.reports).toContain("tool=reports");
  });

  it("does not contain stale legacy app routes as values", () => {
    const allRouteValues = JSON.stringify(ROUTES);

    // These stale patterns should NOT appear as route VALUES
    // (they exist in STALE_ROUTE_PATTERNS for test detection only)
    const staleRoutes = [
      '"/app/doctor"',
      '"/app/launch"',
      '"/app/tasks"',
      '"/app/idea"',
      '"/app/reality"',
      '"/app/proof"',
      '"/app/swarm"',
      '"/app/mvp"',
      '"/app/twin"',
      '"/app/passport"',
    ];

    for (const staleRoute of staleRoutes) {
      // Allow stale routes in STALE_ROUTE_PATTERNS (for testing) but not in actual route values
      const routeValuesOnly = JSON.stringify({
        doctor: ROUTES.doctor,
        launch: ROUTES.launch,
        idea: ROUTES.idea,
        reality: ROUTES.reality,
        proof: ROUTES.proof,
        swarm: ROUTES.swarm,
        mvp: ROUTES.mvp,
        tasks: ROUTES.tasks,
        twin: ROUTES.twin,
        passport: ROUTES.passport,
        projects: ROUTES.projects,
        reports: ROUTES.reports,
      });
      expect(routeValuesOnly).not.toContain(staleRoute);
    }
  });

  it("dynamic route builders produce correct paths", () => {
    expect(ROUTES.reportDetail("abc123")).toBe("/app/reports/abc123");
    expect(ROUTES.projectDetail("xyz789")).toBe("/app/projects/xyz789");
  });

  it("STALE_ROUTE_PATTERNS contains all legacy patterns for detection", () => {
    expect(STALE_ROUTE_PATTERNS).toContain("/app/doctor");
    expect(STALE_ROUTE_PATTERNS).toContain("/app/launch");
    expect(STALE_ROUTE_PATTERNS).toContain("/app/tasks");
    expect(STALE_ROUTE_PATTERNS).toContain("/app/idea");
    expect(STALE_ROUTE_PATTERNS).toContain("/app/reality");
    expect(STALE_ROUTE_PATTERNS).toContain("/app/proof");
    expect(STALE_ROUTE_PATTERNS).toContain("/app/swarm");
    expect(STALE_ROUTE_PATTERNS).toContain("/app/mvp");
    expect(STALE_ROUTE_PATTERNS).toContain("/app/twin");
    expect(STALE_ROUTE_PATTERNS).toContain("/app/passport");
  });
});
