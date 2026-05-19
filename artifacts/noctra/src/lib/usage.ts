import { authenticatedFetch } from "./api-client";

export interface UsageData {
  plan: string;
  usage: Record<string, { used: number; limit: number | string }>;
}

let cachedUsage: UsageData | null = null;
let lastFetch = 0;

export async function getUsage(force = false): Promise<UsageData | null> {
  const now = Date.now();
  if (!force && cachedUsage && now - lastFetch < 60_000) {
    return cachedUsage;
  }

  try {
    const res = await authenticatedFetch("/api/user/usage");
    if (!res.ok) return null;
    const data = await res.json() as UsageData;
    cachedUsage = data;
    lastFetch = now;
    return data;
  } catch {
    return null;
  }
}

export function getUsagePercent(usage: { used: number; limit: number | string }): number {
  if (usage.limit === "unlimited") return 0;
  const limit = usage.limit as number;
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((usage.used / limit) * 100));
}

export function getUsageColor(percent: number): string {
  if (percent >= 90) return "var(--noctra-rose)";
  if (percent >= 70) return "var(--noctra-amber)";
  return "var(--noctra-emerald)";
}
