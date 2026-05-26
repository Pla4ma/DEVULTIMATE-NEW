/**
 * Central route registry.
 *
 * All product code MUST import routes from here instead of using raw strings.
 * This prevents stale route references that cause 404s.
 *
 * App.tsx defines these grouped routes:
 *   /app               → Command Center
 *   /app/idea-lab      → Idea Lab (idea, reality, proof, swarm)
 *   /app/code-health   → Code Health (doctor, launch)
 *   /app/build         → Build Planner (mvp, tasks)
 *   /app/brain         → Project Brain (twin, passport, projects, reports)
 *   /app/reports/:id   → Report Detail
 *   /app/projects/:id  → Project Detail
 */

export const ROUTES = {
  // Public
  landing: "/",
  pricing: "/pricing",
  privacy: "/privacy",

  // Grouped experiences (defined in App.tsx)
  app: "/app",
  ideaLab: "/app/idea-lab",
  codeHealth: "/app/code-health",
  build: "/app/build",
  brain: "/app/brain",

  // Individual tools → grouped route with tool query param
  doctor: "/app/code-health?tool=doctor",
  launch: "/app/code-health?tool=launch",

  idea: "/app/idea-lab?tool=idea",
  reality: "/app/idea-lab?tool=reality",
  proof: "/app/idea-lab?tool=proof",
  swarm: "/app/idea-lab?tool=swarm",

  mvp: "/app/build?tool=mvp",
  tasks: "/app/build?tool=tasks",

  twin: "/app/brain?tool=twin",
  passport: "/app/brain?tool=passport",
  projects: "/app/brain?tool=projects",
  reports: "/app/brain?tool=reports",

  // Dynamic routes (use functions below)
  reportDetail: (id: string) => `/app/reports/${id}`,
  projectDetail: (id: string) => `/app/projects/${id}`,
} as const;

/**
 * All valid app-level routes that App.tsx mounts.
 * Used by route contract tests to catch stale references.
 */
export const VALID_APP_ROUTES = [
  "/app",
  "/app/idea-lab",
  "/app/code-health",
  "/app/build",
  "/app/brain",
  "/app/reports",
  "/app/projects",
] as const;

/**
 * Legacy route patterns that should NOT appear in product code.
 * Used by route contract tests to detect stale references.
 *
 * NOTE: /app/projects and /app/reports are NOT stale — they are valid
 * grouped routes defined in App.tsx. Only the /:id variants are dynamic.
 */
export const STALE_ROUTE_PATTERNS = [
  "/app/doctor",
  "/app/launch",
  "/app/tasks",
  "/app/idea",
  "/app/reality",
  "/app/proof",
  "/app/swarm",
  "/app/mvp",
  "/app/twin",
  "/app/passport",
] as const;
