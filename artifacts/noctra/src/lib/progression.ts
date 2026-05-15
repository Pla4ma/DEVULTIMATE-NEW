import type { ToolKey } from "@/lib/noctra-tools";

export type Milestone = {
  key: string;
  label: string;
  description: string;
  requiredReports: number;
  unlocks: ToolKey[];
};

export const MILESTONES: Milestone[] = [
  {
    key: "first_report",
    label: "First Analysis",
    description: "Complete your first report",
    requiredReports: 1,
    unlocks: ["reality"],
  },
  {
    key: "momentum",
    label: "Building Momentum",
    description: "Complete 3 reports",
    requiredReports: 3,
    unlocks: ["proof", "swarm"],
  },
  {
    key: "execution",
    label: "Ready to Build",
    description: "Complete 5 reports",
    requiredReports: 5,
    unlocks: ["mvp", "doctor"],
  },
  {
    key: "advanced",
    label: "Advanced Mode",
    description: "Complete 8 reports",
    requiredReports: 8,
    unlocks: ["twin", "launch"],
  },
  {
    key: "mastery",
    label: "Mastery",
    description: "Complete 10+ reports",
    requiredReports: 10,
    unlocks: ["passport"],
  },
];

const ALWAYS_UNLOCKED: ToolKey[] = ["dashboard", "idea", "reports", "tasks", "projects"];

export function getMilestoneFor(reportCount: number): Milestone | null {
  const applicable = MILESTONES.filter((m) => reportCount >= m.requiredReports);
  if (applicable.length === 0) return null;
  return applicable[applicable.length - 1];
}

export function getNextMilestone(reportCount: number): Milestone | null {
  return MILESTONES.find((m) => reportCount < m.requiredReports) ?? null;
}

export function getUnlockedTools(reportCount: number): Set<ToolKey> {
  const unlocked = new Set<ToolKey>(ALWAYS_UNLOCKED);
  for (const m of MILESTONES) {
    if (reportCount >= m.requiredReports) {
      for (const t of m.unlocks) unlocked.add(t);
    }
  }
  return unlocked;
}

export function isToolUnlocked(toolKey: ToolKey, reportCount: number): boolean {
  if (ALWAYS_UNLOCKED.includes(toolKey)) return true;
  return MILESTONES.some((m) => m.unlocks.includes(toolKey) && reportCount >= m.requiredReports);
}

export function getUnlockRequirement(toolKey: ToolKey): { milestone: Milestone; progress: number; total: number } | null {
  for (const m of MILESTONES) {
    if (m.unlocks.includes(toolKey)) {
      return { milestone: m, progress: 0, total: m.requiredReports };
    }
  }
  return null;
}

export function getMilestoneProgress(reportCount: number) {
  const next = getNextMilestone(reportCount);
  if (!next) {
    return { current: "mastery", progress: 1, total: 1, label: "All tools unlocked" };
  }
  const prevThreshold = (() => {
    const idx = MILESTONES.indexOf(next);
    if (idx === 0) return 0;
    return MILESTONES[idx - 1].requiredReports;
  })();
  const progress = reportCount - prevThreshold;
  const total = next.requiredReports - prevThreshold;
  return {
    current: next.key,
    progress: Math.max(0, Math.min(total, progress)),
    total,
    label: `${reportCount} / ${next.requiredReports} reports to unlock "${next.label}"`,
  };
}
