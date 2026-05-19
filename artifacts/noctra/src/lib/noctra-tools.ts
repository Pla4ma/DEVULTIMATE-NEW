import {
  LayoutDashboard, ScanSearch, AlertTriangle, ListChecks, FlaskConical,
  Users, Stethoscope, Rocket, Brain, BarChart3, CheckSquare, FileText, FolderOpen,
  type LucideIcon,
} from "lucide-react";

export type ToolKey =
  | "dashboard" | "idea" | "reality" | "mvp" | "proof" | "swarm"
  | "doctor" | "launch" | "twin" | "passport" | "tasks" | "reports" | "projects";

export type Tool = {
  key: ToolKey;
  route: string;
  label: string;
  short: string;
  long: string;
  icon: LucideIcon;
  accent: string;
  accent2: string;
  group: "Core" | "Diagnose" | "Validate" | "Build" | "Launch";
};

const cyan = "var(--noctra-cyan)";
const violet = "var(--noctra-violet)";
const magenta = "var(--noctra-magenta)";
const emerald = "var(--noctra-emerald)";
const amber = "var(--noctra-amber)";
const rose = "var(--noctra-rose)";
const gold = "var(--noctra-gold)";

export const TOOLS: Tool[] = [
  { key: "dashboard", route: "/app", label: "Dashboard", short: "Command center", long: "Project health, top risks, next actions, and recent activity — all in one place.", icon: LayoutDashboard, accent: cyan, accent2: violet, group: "Core" },
  { key: "reports", route: "/app/reports", label: "Reports", short: "Reports", long: "Every report Noctra has generated — filterable, exportable, and linked to your projects.", icon: FileText, accent: "var(--noctra-text-soft)", accent2: violet, group: "Core" },
  { key: "tasks", route: "/app/tasks", label: "Tasks", short: "Task queue", long: "Tasks generated from your reports. Prioritized, categorized, and ready to execute.", icon: CheckSquare, accent: emerald, accent2: cyan, group: "Core" },
  { key: "projects", route: "/app/projects", label: "Projects", short: "Projects", long: "Organize your work into projects. Link reports, tasks, and proof signals.", icon: FolderOpen, accent: cyan, accent2: emerald, group: "Core" },

  { key: "idea", route: "/app/idea", label: "Idea Checker", short: "Idea analysis", long: "Describe your idea. Noctra scores its strength, finds weak points, and recommends what to validate next.", icon: ScanSearch, accent: violet, accent2: cyan, group: "Diagnose" },
  { key: "doctor", route: "/app/doctor", label: "Project Doctor", short: "Codebase scan", long: "Upload a repo zip. Noctra scans, diagnoses blockers, and generates a fix queue automatically.", icon: Stethoscope, accent: rose, accent2: cyan, group: "Diagnose" },

  { key: "reality", route: "/app/reality", label: "Reality Compiler", short: "Assumption testing", long: "Every assumption gets tested across feasibility, market viability, and blind spots.", icon: AlertTriangle, accent: amber, accent2: rose, group: "Validate" },
  { key: "proof", route: "/app/proof", label: "Proof Engine", short: "Evidence tracking", long: "Track evidence, measure validation depth, and find critical gaps before you build.", icon: FlaskConical, accent: emerald, accent2: gold, group: "Validate" },
  { key: "swarm", route: "/app/swarm", label: "Market Swarm", short: "Market simulation", long: "Simulate demand, test pricing tolerance, and identify market segments for your product.", icon: Users, accent: cyan, accent2: violet, group: "Validate" },

  { key: "mvp", route: "/app/mvp", label: "MVP Planner", short: "Build plan", long: "Lock the scope, define the success metric, and lay out a build plan with clear priorities.", icon: ListChecks, accent: cyan, accent2: emerald, group: "Build" },
  { key: "twin", route: "/app/twin", label: "Product Twin", short: "Product memory", long: "Your persistent product memory. Ask about decisions, patterns, and what to build next.", icon: Brain, accent: magenta, accent2: violet, group: "Build" },

  { key: "launch", route: "/app/launch", label: "Launch Room", short: "Launch readiness", long: "Readiness check, gate verification, and go/no-go decision for shipping your product.", icon: Rocket, accent: amber, accent2: cyan, group: "Launch" },
  { key: "passport", route: "/app/passport", label: "Project Profile", short: "Project record", long: "Complete project record — scores, milestones, and progress across all your work.", icon: BarChart3, accent: gold, accent2: cyan, group: "Launch" },
];

export const TOOL_BY_KEY: Record<ToolKey, Tool> = Object.fromEntries(
  TOOLS.map((t) => [t.key, t])
) as Record<ToolKey, Tool>;

export const TOOL_GROUPS: Tool["group"][] = ["Core", "Diagnose", "Validate", "Build", "Launch"];

export const GROUP_DESCRIPTION: Record<Tool["group"], string> = {
  Core: "Dashboard, reports, tasks, and projects",
  Diagnose: "Analyze your idea and codebase",
  Validate: "Test assumptions against reality",
  Build: "Plan and track your build",
  Launch: "Prepare to ship",
};
