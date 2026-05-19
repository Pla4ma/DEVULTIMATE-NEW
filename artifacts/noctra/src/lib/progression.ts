import type { ToolKey } from "@/lib/noctra-tools";

export type Capability = {
  key: string;
  label: string;
  description: string;
  phase: "diagnose" | "validate" | "build" | "launch";
  tools: ToolKey[];
};

export const CAPABILITIES: Capability[] = [
  {
    key: "diagnose",
    label: "Diagnose",
    description: "Analyze your idea and codebase for launch blockers",
    phase: "diagnose",
    tools: ["idea", "doctor"],
  },
  {
    key: "validate",
    label: "Validate",
    description: "Test assumptions against market reality",
    phase: "validate",
    tools: ["reality", "proof", "swarm"],
  },
  {
    key: "build",
    label: "Build",
    description: "Plan your MVP and track product intelligence",
    phase: "build",
    tools: ["mvp", "twin"],
  },
  {
    key: "launch",
    label: "Launch",
    description: "Prepare for shipping and manage execution",
    phase: "launch",
    tools: ["launch", "passport"],
  },
];

export function getCapabilityFor(toolKey: ToolKey): Capability | null {
  return CAPABILITIES.find((c) => c.tools.includes(toolKey)) ?? null;
}

export function getToolsByPhase(phase: Capability["phase"]): ToolKey[] {
  return CAPABILITIES.find((c) => c.phase === phase)?.tools ?? [];
}

export type CapabilityStatus = {
  phase: Capability["phase"];
  label: string;
  used: number;
  total: number;
  percentage: number;
};

export function computeCapabilityStatus(
  usedTools: Set<string>
): CapabilityStatus[] {
  return CAPABILITIES.map((c) => {
    const used = c.tools.filter((t) => usedTools.has(t)).length;
    const total = c.tools.length;
    return {
      phase: c.phase,
      label: c.label,
      used,
      total,
      percentage: total > 0 ? Math.round((used / total) * 100) : 0,
    };
  });
}

// Intelligence coverage score (0-100) based on how many tools have been used
export function computeCoverageScore(usedTools: Set<string>): number {
  const allToolKeys: ToolKey[] = [
    "idea", "doctor", "reality", "proof", "swarm", "mvp", "twin", "launch",
  ];
  const used = allToolKeys.filter((t) => usedTools.has(t)).length;
  return Math.round((used / allToolKeys.length) * 100);
}
