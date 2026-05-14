import {
  LayoutDashboard, ScanSearch, AlertTriangle, ListChecks, FlaskConical,
  Users, Stethoscope, Rocket, Brain, CreditCard, CheckSquare, FileText, FolderOpen,
  type LucideIcon,
} from "lucide-react";

export type ToolKey =
  | "dashboard" | "idea" | "reality" | "mvp" | "proof" | "swarm"
  | "doctor" | "launch" | "twin" | "passport" | "tasks" | "reports" | "projects";

export type Tool = {
  key: ToolKey;
  route: string;
  label: string;
  diegetic: string;
  short: string;
  long: string;
  icon: LucideIcon;
  accent: string;
  accent2: string;
  group: "Core" | "Validation" | "Build" | "Launch";
  isFlagship?: boolean;
};

const cyan = "var(--noctra-cyan)";
const violet = "var(--noctra-violet)";
const magenta = "var(--noctra-magenta)";
const emerald = "var(--noctra-emerald)";
const amber = "var(--noctra-amber)";
const rose = "var(--noctra-rose)";
const gold = "var(--noctra-gold)";

export const TOOLS: Tool[] = [
  { key: "dashboard", route: "/app", label: "Dashboard", diegetic: "Dashboard", short: "Execution dashboard", long: "Your execution dashboard. See project state, top risks, next tasks, and recent activity — all in one place.", icon: LayoutDashboard, accent: cyan, accent2: violet, group: "Core" },
  { key: "reports", route: "/app/reports", label: "Reports", diegetic: "Reports", short: "Reports", long: "Every report Noctra has generated — filterable, exportable, and linked to your projects.", icon: FileText, accent: "var(--noctra-text-soft)", accent2: violet, group: "Core" },
  { key: "tasks", route: "/app/tasks", label: "Tasks", diegetic: "Tasks", short: "Task queue", long: "Tasks generated from your reports. Prioritized, categorized, and ready to execute.", icon: CheckSquare, accent: emerald, accent2: cyan, group: "Core" },
  { key: "projects", route: "/app/projects", label: "Projects", diegetic: "Projects", short: "Projects", long: "Organize your work into projects. Link reports, tasks, and proof signals.", icon: FolderOpen, accent: cyan, accent2: emerald, group: "Core" },

  { key: "idea", route: "/app/idea", label: "Idea Checker", diegetic: "Idea Checker", short: "Idea check", long: "Describe your idea. Noctra scores its strength, finds weak points, and recommends what to validate next.", icon: ScanSearch, accent: violet, accent2: cyan, group: "Validation" },
  { key: "reality", route: "/app/reality", label: "Reality Compiler", diegetic: "Reality Compiler", short: "Reality check", long: "Every assumption gets tested across feasibility, market viability, and blind spots.", icon: AlertTriangle, accent: amber, accent2: rose, group: "Validation" },
  { key: "proof", route: "/app/proof", label: "Proof Engine", diegetic: "Proof Engine", short: "Proof analysis", long: "Track evidence, measure validation depth, and find critical gaps before you build.", icon: FlaskConical, accent: emerald, accent2: gold, group: "Validation" },
  { key: "swarm", route: "/app/swarm", label: "Market Swarm", diegetic: "Market Swarm", short: "Market analysis", long: "Simulate demand, test pricing tolerance, and identify market segments for your product.", icon: Users, accent: cyan, accent2: violet, group: "Validation" },

  { key: "mvp", route: "/app/mvp", label: "MVP Planner", diegetic: "MVP Planner", short: "MVP plan", long: "Lock the scope, define the success metric, and lay out a build plan with clear priorities.", icon: ListChecks, accent: cyan, accent2: emerald, group: "Build" },
  { key: "doctor", route: "/app/doctor", label: "Project Doctor", diegetic: "Project Doctor", short: "Code diagnosis", long: "Upload a repo zip. Noctra scans, diagnoses blockers, and generates a fix queue automatically.", icon: Stethoscope, accent: rose, accent2: cyan, group: "Build", isFlagship: true } as Tool,
  { key: "twin", route: "/app/twin", label: "Product Twin", diegetic: "Product Twin", short: "Product memory", long: "Your persistent product memory. Ask about decisions, patterns, and what to build next.", icon: Brain, accent: magenta, accent2: violet, group: "Build" },

  { key: "launch", route: "/app/launch", label: "Launch Room", diegetic: "Launch Room", short: "Launch check", long: "Readiness check, gate verification, and go/no-go decision for shipping your product.", icon: Rocket, accent: amber, accent2: cyan, group: "Launch" },
  { key: "passport", route: "/app/passport", label: "Passport", diegetic: "Passport", short: "Execution record", long: "Your execution record — scores, milestones, and progress across all projects.", icon: CreditCard, accent: gold, accent2: cyan, group: "Launch" },
];

export const TOOL_BY_KEY: Record<ToolKey, Tool> = Object.fromEntries(
  TOOLS.map((t) => [t.key, t])
) as Record<ToolKey, Tool>;

export const TOOL_GROUPS: Tool["group"][] = ["Core", "Validation", "Build", "Launch"];

export const GROUP_DESCRIPTION: Record<Tool["group"], string> = {
  Core: "Dashboard, reports, tasks, and projects",
  Validation: "Test your idea against reality",
  Build: "Plan your build and diagnose your codebase",
  Launch: "Prepare to ship",
};
