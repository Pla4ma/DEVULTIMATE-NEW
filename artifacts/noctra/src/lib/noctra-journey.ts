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
  { key: "market",    label: "Market",    tool: "swarm",    hint: "Simulate persona reactions" },
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
    "Offer: AI sales coach that audits your last 5 calls for $49/mo.",
    "Personas: indie SaaS founders, RevOps leads, fractional CROs.",
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
  { tool: "idea",    title: "Run a Signal Scan on your sharpest idea",      reason: "Fastest path to a measurable validation step.", confidence: 86 },
  { tool: "reality", title: "Compile a Reality Scan on your top assumption", reason: "Surface the blind spots before you build.",     confidence: 78 },
  { tool: "proof",   title: "Open a proof cycle in Validation Lab",          reason: "Your validation depth is below launch threshold.", confidence: 72 },
];

export const COMPANION_LINES = {
  hero: "I'm watching the signal. Open Command Center to see your next move.",
  dashboard: "Your proof layer is thin. I'd run Validation Lab next.",
  loadingShort: "Compiling reality. Holding for signal.",
  briefingReady: "Briefing compiled. Review the intelligence panel.",
  warning: "Reality pressure rising. Re-test your sharpest assumption.",
  success: "Signal locked. Founder trajectory updated.",
  launching: "Launch readiness rising. Coordinating telemetry.",
};
