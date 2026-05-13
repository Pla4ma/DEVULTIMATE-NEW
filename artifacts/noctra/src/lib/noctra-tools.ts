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
};

const cyan = "var(--noctra-cyan)";
const violet = "var(--noctra-violet)";
const magenta = "var(--noctra-magenta)";
const emerald = "var(--noctra-emerald)";
const amber = "var(--noctra-amber)";
const rose = "var(--noctra-rose)";
const gold = "var(--noctra-gold)";

export const TOOLS: Tool[] = [
  { key: "dashboard", route: "/app", label: "Command Center", diegetic: "Command Center", short: "AI command center", long: "Your intelligence hub. See the full picture, track your founder trajectory, and get your next best move.", icon: LayoutDashboard, accent: cyan, accent2: violet, group: "Core" },
  { key: "reports", route: "/app/reports", label: "Reports", diegetic: "Reports", short: "AI reports", long: "Every analysis Noctra has run on your product — filterable, exportable, and linked to your projects.", icon: FileText, accent: "var(--noctra-text-soft)", accent2: violet, group: "Core" },
  { key: "tasks", route: "/app/tasks", label: "Tasks", diegetic: "Tasks", short: "Task queue", long: "Tasks generated from your intelligence reports. Prioritized, categorized, and ready to sprint.", icon: CheckSquare, accent: emerald, accent2: cyan, group: "Core" },
  { key: "projects", route: "/app/projects", label: "Projects", diegetic: "Projects", short: "Projects", long: "Organize your founder context into projects. Link reports, tasks, and proof signals.", icon: FolderOpen, accent: cyan, accent2: emerald, group: "Core" },

  { key: "idea", route: "/app/idea", label: "Idea Checker", diegetic: "Idea Checker", short: "Idea scanner", long: "Drop founder context. The checker sweeps the signal — surfacing strength, fragility, and the sharpest experiment to run next.", icon: ScanSearch, accent: violet, accent2: cyan, group: "Validation" },
  { key: "reality", route: "/app/reality", label: "Reality Compiler", diegetic: "Reality Compiler", short: "Reality check", long: "Every assumption gets pressure-tested across feasibility, market, and blind-spot axes. Surfaces what reality will quietly punish.", icon: AlertTriangle, accent: amber, accent2: rose, group: "Validation" },
  { key: "proof", route: "/app/proof", label: "Proof Engine", diegetic: "Proof Engine", short: "Validation lab", long: "Confidence rises only when evidence converges. The engine measures signal density and proposes the next experiment.", icon: FlaskConical, accent: emerald, accent2: gold, group: "Validation" },
  { key: "swarm", route: "/app/swarm", label: "Market Swarm", diegetic: "Market Swarm", short: "Market simulation", long: "A persona swarm reacts to your pitch in parallel — exposing objections, excitement, and willingness-to-pay clusters.", icon: Users, accent: cyan, accent2: violet, group: "Validation" },

  { key: "mvp", route: "/app/mvp", label: "MVP Planner", diegetic: "MVP Planner", short: "MVP planner", long: "Lock the scope, define the north-star metric, and lay out a build path with surgical cuts.", icon: ListChecks, accent: cyan, accent2: emerald, group: "Build" },
  { key: "doctor", route: "/app/doctor", label: "Project Doctor", diegetic: "Project Doctor", short: "Code doctor", long: "Drop a repo zip. Noctra extracts manifests, surfaces hotspots, evaluates launch gates, and prescribes a repair queue.", icon: Stethoscope, accent: rose, accent2: cyan, group: "Build" },
  { key: "twin", route: "/app/twin", label: "Product Twin", diegetic: "Product Twin", short: "Digital twin", long: "A persistent twin of every founder context, decision, and proof. Surfaces drift, contradictions, and strategic moves.", icon: Brain, accent: magenta, accent2: violet, group: "Build" },

  { key: "launch", route: "/app/launch", label: "Launch Room", diegetic: "Launch Room", short: "Launch sequencer", long: "Readiness, war-games, and telemetry — all converging into a clean go/no-go signal.", icon: Rocket, accent: amber, accent2: cyan, group: "Launch" },
  { key: "passport", route: "/app/passport", label: "Passport", diegetic: "Passport", short: "Founder profile", long: "Your living founder identity — intelligence scores, milestones, and proof of progression.", icon: CreditCard, accent: gold, accent2: cyan, group: "Launch" },
];

export const TOOL_BY_KEY: Record<ToolKey, Tool> = Object.fromEntries(
  TOOLS.map((t) => [t.key, t])
) as Record<ToolKey, Tool>;

export const TOOL_GROUPS: Tool["group"][] = ["Core", "Validation", "Build", "Launch"];
