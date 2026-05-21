import type { ToolKey } from "./noctra-tools";

export type PipelineNode = {
  key: string;
  label: string;
  tool: ToolKey;
  hint: string;
};

export const PIPELINE: PipelineNode[] = [
  { key: "idea",      label: "Idea",    tool: "idea",     hint: "Validate the raw idea" },
  { key: "reality",   label: "Reality", tool: "reality",  hint: "Compile risk and blind spots" },
  { key: "blueprint", label: "MVP",     tool: "mvp",      hint: "Compress to build-ready scope" },
  { key: "proof",     label: "Proof",   tool: "proof",    hint: "Quantify validation evidence" },
  { key: "market",    label: "Market",  tool: "swarm",    hint: "Analyze demand signals" },
  { key: "scan",      label: "Scan",    tool: "doctor",   hint: "Diagnose execution health and blockers" },
  { key: "fix",       label: "Fix",     tool: "tasks",    hint: "Execute fix tasks from scan" },
  { key: "rescan",    label: "Rescan",  tool: "doctor",   hint: "Re-scan to verify fixes improved score" },
  { key: "launch",    label: "Launch",  tool: "launch",   hint: "Ready the launch sequence" },
  { key: "profile",   label: "Profile", tool: "passport", hint: "Review project record and milestones" },
];

export const TOOL_EXAMPLES: Record<ToolKey, string[]> = {
  dashboard: [],
  idea: [
    "An async stand-up tool for distributed AI engineering teams.",
    "A coaching app that turns founder journals into weekly strategy.",
  ],
  reality: [
    "Assumption: SMB owners will pay $99/mo for an AI bookkeeper.",
    "Risk hypothesis: distribution depends entirely on TikTok virality.",
  ],
  mvp: [
    "Product: Notion-for-Operators, focused on weekly OKR rituals.",
    "Target launch in 6 weeks with 3 design partners committed.",
  ],
  proof: [
    "Evidence: 4.2% reply rate from 240 cold outbound emails.",
    "12 interviews surfaced the same urgent hiring pain.",
  ],
  swarm: [
    "Product: AI sales coach at $49/mo. TAM ~$800M. Top segment: indie SaaS founders.",
    "Pricing test: $29 vs $49/mo. Segment: small teams (2–10 people) in B2B SaaS.",
  ],
  doctor: [
    "React + TanStack codebase, 240 files, no tests, slow CI.",
    "Suspect performance regression on dashboard route.",
  ],
  launch: [
    "Launching to 1,200 newsletter subs and Product Hunt next Tuesday.",
    "Pricing: free + $19/mo. No partnerships lined up yet.",
  ],
  twin: [
    "Remember: positioning shifted from 'AI sales' to 'AI coaching'.",
    "Pricing experiments paused until we hit 200 active users.",
  ],
  passport: [],
  tasks: [],
  reports: [],
  projects: [],
};

export const NEXT_BEST_MOVES: { tool: ToolKey; title: string; reason: string; confidence: number }[] = [
  { tool: "doctor",  title: "Run Product Doctor on your codebase",           reason: "Fastest path to launch readiness.", confidence: 92 },
  { tool: "idea",    title: "Run Idea Checker on your sharpest idea",        reason: "Validate before you build.",        confidence: 86 },
  { tool: "mvp",     title: "Generate MVP Planner",                         reason: "Turn validation into a build plan.", confidence: 78 },
  { tool: "reality", title: "Run Reality Compiler on your top assumption",   reason: "Surface blind spots before you build.",     confidence: 74 },
];

export const COMPANION_LINES = {
  hero: "Launch readiness starts here. Scan your codebase, fix blockers, rescan to verify improvement.",
  dashboard: "Your launch cockpit: score, blockers, and the next fix to push you forward.",
  loadingShort: "Processing. Results in a moment.",
  briefingReady: "Briefing compiled. Review the intelligence panel.",
  warning: "Critical findings detected. Address before moving forward.",
  success: "Report saved. Fix tasks generated. Rescan to verify improvement.",
  launching: "Launch readiness under assessment. Results will show here.",
};
