import {
  LayoutDashboard, ScanSearch, ListChecks,
  Users, Stethoscope, Rocket, Brain, BarChart3, CheckSquare, FileText, FolderOpen,
  Lightbulb, Wrench, Settings,
  type LucideIcon,
} from "lucide-react";

export type ToolKey =
  | "dashboard" | "idea" | "reality" | "mvp" | "proof" | "swarm"
  | "doctor" | "launch" | "twin" | "passport" | "tasks" | "reports" | "projects";

export type ToolGroup = "Launch Cockpit" | "Product Doctor" | "Fix Tasks" | "Reports" | "Idea & MVP" | "Advanced Tools" | "Settings";

export type Tool = {
  key: ToolKey;
  route: string;
  label: string;
  short: string;
  long: string;
  icon: LucideIcon;
  accent: string;
  accent2: string;
  group: ToolGroup;
  order: number;
};

const cyan = "var(--noctra-cyan)";
const violet = "var(--noctra-violet)";
const magenta = "var(--noctra-magenta)";
const emerald = "var(--noctra-emerald)";
const amber = "var(--noctra-amber)";
const rose = "var(--noctra-rose)";
const gold = "var(--noctra-gold)";

export const TOOLS: Tool[] = [
  { key: "dashboard", route: "/app", label: "Launch Cockpit", short: "Launch center", long: "Launch readiness score, top blocker, next fix, and rescan — all in one place.", icon: LayoutDashboard, accent: cyan, accent2: violet, group: "Launch Cockpit", order: 0 },
  { key: "doctor", route: "/app/doctor", label: "Product Doctor", short: "Codebase scan & fix", long: "Upload your repo. Get launch readiness, blockers, fix queue, and build prompt.", icon: Stethoscope, accent: rose, accent2: cyan, group: "Product Doctor", order: 1 },
  { key: "tasks", route: "/app/tasks", label: "Fix Tasks", short: "Task queue", long: "Tasks generated from Product Doctor and other reports. Prioritized, categorized, ready to execute.", icon: CheckSquare, accent: emerald, accent2: cyan, group: "Fix Tasks", order: 2 },
  { key: "reports", route: "/app/reports", label: "Reports", short: "Reports", long: "Every report — filterable, exportable, and linked to your projects.", icon: FileText, accent: "var(--noctra-text-soft)", accent2: violet, group: "Reports", order: 3 },
  { key: "idea", route: "/app/idea", label: "Idea Checker", short: "Idea analysis", long: "Describe your idea. Get signal score, red flags, and what to validate next.", icon: ScanSearch, accent: violet, accent2: cyan, group: "Idea & MVP", order: 4 },
  { key: "mvp", route: "/app/mvp", label: "MVP Planner", short: "Build plan", long: "Lock scope, define success metrics, and generate a week-by-week build plan.", icon: ListChecks, accent: cyan, accent2: emerald, group: "Idea & MVP", order: 5 },
  { key: "reality", route: "/app/reality", label: "Reality Compiler", short: "Assumption testing", long: "Every assumption tested across feasibility, market viability, and blind spots.", icon: Users, accent: amber, accent2: rose, group: "Advanced Tools", order: 6 },
  { key: "proof", route: "/app/proof", label: "Proof Engine", short: "Evidence tracking", long: "Track evidence, measure validation depth, and find critical gaps before you build.", icon: BarChart3, accent: emerald, accent2: gold, group: "Advanced Tools", order: 7 },
  { key: "swarm", route: "/app/swarm", label: "Market Swarm", short: "Market simulation", long: "Simulate demand, test pricing, and identify market segments.", icon: Users, accent: cyan, accent2: violet, group: "Advanced Tools", order: 8 },
  { key: "launch", route: "/app/launch", label: "Launch Room", short: "Launch readiness", long: "Readiness check, gate verification, and go/no-go decision.", icon: Rocket, accent: amber, accent2: cyan, group: "Advanced Tools", order: 9 },
  { key: "twin", route: "/app/twin", label: "Product Twin", short: "Product memory", long: "Your persistent product memory. Ask about decisions, patterns, and next steps.", icon: Brain, accent: magenta, accent2: violet, group: "Advanced Tools", order: 10 },
  { key: "passport", route: "/app/passport", label: "Project Profile", short: "Project record", long: "Complete project record — scores, milestones, and progress.", icon: FolderOpen, accent: gold, accent2: cyan, group: "Advanced Tools", order: 11 },
  { key: "projects", route: "/app/projects", label: "Projects", short: "Projects", long: "Organize your work into projects. Link reports, tasks, and proof signals.", icon: FolderOpen, accent: cyan, accent2: emerald, group: "Advanced Tools", order: 12 },
];

export const TOOL_BY_KEY: Record<ToolKey, Tool> = Object.fromEntries(
  TOOLS.map((t) => [t.key, t])
) as Record<ToolKey, Tool>;

export const TOOL_GROUPS: ToolGroup[] = [
  "Launch Cockpit", "Product Doctor", "Fix Tasks", "Reports", "Idea & MVP", "Advanced Tools",
];

export const GROUP_DESCRIPTION: Record<ToolGroup, string> = {
  "Launch Cockpit": "Your command center: score, blockers, next fix",
  "Product Doctor": "Scan, diagnose, fix, rescan — the core loop",
  "Fix Tasks": "Prioritized fix queue from your scans",
  "Reports": "Full report history and evidence",
  "Idea & MVP": "Pre-build validation and build planning",
  "Advanced Tools": "Market validation, launch prep, project workspace",
  "Settings": "",
};
