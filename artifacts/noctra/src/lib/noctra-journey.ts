import type { ToolKey } from "./noctra-tools";

export type JourneyNode = {
  key: string;
  label: string;
  tool: ToolKey;
  hint: string;
};

export const JOURNEY: JourneyNode[] = [
  { key: "signal",    label: "Signal",    tool: "idea",     hint: "Stress-test the raw idea" },
  { key: "reality",   label: "Reality",   tool: "reality",  hint: "Compile risk and blind spots" },
  { key: "blueprint", label: "Blueprint", tool: "mvp",      hint: "Compress to a build-ready scope" },
  { key: "proof",     label: "Proof",     tool: "proof",    hint: "Quantify validation evidence" },
  { key: "market",    label: "Market",    tool: "swarm",    hint: "Analyze demand signals and segments" },
  { key: "build",     label: "Build",     tool: "doctor",   hint: "Diagnose execution health" },
  { key: "launch",    label: "Launch",    tool: "launch",   hint: "Ready the launch sequence" },
  { key: "evolve",    label: "Evolve",    tool: "passport", hint: "Lock progression and learn" },
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
  { tool: "idea",    title: "Run Idea Checker on your sharpest idea",      reason: "Fastest path to a measurable validation step.", confidence: 86 },
  { tool: "reality", title: "Run Reality Compiler on your top assumption", reason: "Surface blind spots before you build.",     confidence: 78 },
  { tool: "proof",   title: "Run Proof Engine to assess validation depth", reason: "Your validation depth is below launch threshold.", confidence: 72 },
];

export const COMPANION_LINES = {
  hero: "Run Idea Checker to surface strengths, fragilities, and the next validation step.",
  dashboard: "Review your execution plan. Gaps in proof or Doctor may block launch.",
  loadingShort: "Processing. You'll see results in a moment.",
  briefingReady: "Briefing compiled. Review the intelligence panel.",
  warning: "Critical findings detected. Address before moving to build phase.",
  success: "Report saved. Next action available below.",
  launching: "Launch readiness under assessment. Results will show here.",
};
