import {
  LayoutDashboard, ScanSearch, ListChecks,
  Users, Stethoscope, Rocket, Brain, BarChart3, CheckSquare, FileText, FolderOpen,
  Lightbulb, AlertTriangle, FlaskConical, Map, Terminal, Zap,
  type LucideIcon,
} from "lucide-react";

export type ToolKey =
  | "dashboard" | "idea" | "reality" | "mvp" | "proof" | "swarm"
  | "doctor" | "launch" | "twin" | "passport" | "tasks" | "reports" | "projects";

export type ExperienceKey = "command" | "idea-lab" | "code-health" | "build" | "brain";

export type ToolGroup = "Command Center" | "Idea Lab" | "Code Health" | "Build Planner" | "Project Brain";

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
  experience: ExperienceKey;
};

export type Experience = {
  key: ExperienceKey;
  label: string;
  short: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  route: string;
  tools: ToolKey[];
};

const cyan = "var(--accent-cyan)";
const violet = "var(--accent-violet)";
const magenta = "var(--accent-magenta)";
const emerald = "var(--color-success)";
const amber = "var(--color-warning)";
const rose = "var(--color-danger)";
const gold = "var(--accent-gold)";

export const EXPERIENCES: Experience[] = [
  {
    key: "command",
    label: "Command Center",
    short: "Dashboard",
    description: "Your launch readiness command center — score, blockers, next fix, and rescan.",
    icon: LayoutDashboard,
    accent: cyan,
    route: "/app",
    tools: ["dashboard"],
  },
  {
    key: "idea-lab",
    label: "Idea Lab",
    short: "Ideas",
    description: "Validate ideas, stress-test assumptions, and simulate market demand.",
    icon: Lightbulb,
    accent: violet,
    route: "/app/idea-lab",
    tools: ["idea", "reality", "swarm", "proof"],
  },
  {
    key: "code-health",
    label: "Code Health",
    short: "Code",
    description: "Scan codebases, diagnose launch blockers, and get go/no-go signals.",
    icon: Stethoscope,
    accent: rose,
    route: "/app/code-health",
    tools: ["doctor", "launch"],
  },
  {
    key: "build",
    label: "Build Planner",
    short: "Build",
    description: "Plan MVP scope, generate build plans, and track execution.",
    icon: Map,
    accent: emerald,
    route: "/app/build",
    tools: ["mvp", "tasks"],
  },
  {
    key: "brain",
    label: "Project Brain",
    short: "Brain",
    description: "Your persistent product memory — AI chat, decision log, and project intelligence.",
    icon: Brain,
    accent: magenta,
    route: "/app/brain",
    tools: ["twin", "passport", "projects", "reports"],
  },
];

export const TOOLS: Tool[] = [
  { key: "dashboard", route: "/app", label: "Command Center", short: "Dashboard", long: "Launch readiness score, top blocker, next fix, and rescan — all in one place.", icon: LayoutDashboard, accent: cyan, accent2: violet, group: "Command Center", order: 0, experience: "command" },
  { key: "idea", route: "/app/idea-lab", label: "Idea Checker", short: "Idea analysis", long: "Describe your idea. Get signal score, red flags, and what to validate next.", icon: ScanSearch, accent: violet, accent2: cyan, group: "Idea Lab", order: 1, experience: "idea-lab" },
  { key: "reality", route: "/app/idea-lab", label: "Reality Compiler", short: "Assumption testing", long: "Every assumption tested across feasibility, market viability, and blind spots.", icon: Terminal, accent: amber, accent2: rose, group: "Idea Lab", order: 2, experience: "idea-lab" },
  { key: "swarm", route: "/app/idea-lab", label: "Market Swarm", short: "Market simulation", long: "Simulate demand, test pricing, and identify market segments.", icon: Users, accent: cyan, accent2: violet, group: "Idea Lab", order: 3, experience: "idea-lab" },
  { key: "proof", route: "/app/idea-lab", label: "Proof Engine", short: "Evidence tracking", long: "Track evidence, measure validation depth, and find critical gaps before you build.", icon: FlaskConical, accent: emerald, accent2: gold, group: "Idea Lab", order: 4, experience: "idea-lab" },
  { key: "doctor", route: "/app/code-health", label: "Product Doctor", short: "Codebase scan & fix", long: "Upload your repo. Get launch readiness, blockers, fix queue, and build prompt.", icon: Stethoscope, accent: rose, accent2: cyan, group: "Code Health", order: 5, experience: "code-health" },
  { key: "launch", route: "/app/code-health", label: "Launch Room", short: "Launch readiness", long: "Readiness check, gate verification, and go/no-go decision.", icon: Rocket, accent: amber, accent2: cyan, group: "Code Health", order: 6, experience: "code-health" },
  { key: "mvp", route: "/app/build", label: "MVP Planner", short: "Build plan", long: "Lock scope, define success metrics, and generate a week-by-week build plan.", icon: Map, accent: cyan, accent2: emerald, group: "Build Planner", order: 7, experience: "build" },
  { key: "tasks", route: "/app/build", label: "Fix Tasks", short: "Task queue", long: "Tasks generated from Product Doctor and other reports. Prioritized, categorized, ready to execute.", icon: CheckSquare, accent: emerald, accent2: cyan, group: "Build Planner", order: 8, experience: "build" },
  { key: "twin", route: "/app/brain", label: "Product Twin", short: "Product memory", long: "Your persistent product memory. Ask about decisions, patterns, and next steps.", icon: Brain, accent: magenta, accent2: violet, group: "Project Brain", order: 9, experience: "brain" },
  { key: "passport", route: "/app/brain", label: "Project Profile", short: "Project record", long: "Complete project record — scores, milestones, and progress.", icon: BarChart3, accent: gold, accent2: cyan, group: "Project Brain", order: 10, experience: "brain" },
  { key: "projects", route: "/app/brain", label: "Projects", short: "Projects", long: "Organize your work into projects. Link reports, tasks, and proof signals.", icon: FolderOpen, accent: cyan, accent2: emerald, group: "Project Brain", order: 11, experience: "brain" },
  { key: "reports", route: "/app/brain", label: "Reports", short: "Reports", long: "Every report — filterable, exportable, and linked to your projects.", icon: FileText, accent: "var(--text-tertiary)", accent2: violet, group: "Project Brain", order: 12, experience: "brain" },
];

export const TOOL_BY_KEY: Record<ToolKey, Tool> = Object.fromEntries(
  TOOLS.map((t) => [t.key, t])
) as Record<ToolKey, Tool>;

export const EXPERIENCE_BY_KEY: Record<ExperienceKey, Experience> = Object.fromEntries(
  EXPERIENCES.map((e) => [e.key, e])
) as Record<ExperienceKey, Experience>;

export const TOOL_GROUPS: ToolGroup[] = [
  "Command Center", "Idea Lab", "Code Health", "Build Planner", "Project Brain",
];

export const GROUP_DESCRIPTION: Record<ToolGroup, string> = {
  "Command Center": "Your command center: score, blockers, next fix",
  "Idea Lab": "Validate, stress-test, and simulate market demand",
  "Code Health": "Scan, diagnose, fix, rescan — the core loop",
  "Build Planner": "Plan MVP scope and track execution",
  "Project Brain": "AI memory, project intelligence, and reports",
};

export function getExperienceForTool(toolKey: ToolKey): Experience | undefined {
  const tool = TOOL_BY_KEY[toolKey];
  if (!tool) return undefined;
  return EXPERIENCE_BY_KEY[tool.experience];
}

export function getToolsForExperience(experienceKey: ExperienceKey): Tool[] {
  return TOOLS.filter((t) => t.experience === experienceKey).sort((a, b) => a.order - b.order);
}
