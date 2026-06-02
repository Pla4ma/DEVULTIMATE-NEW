import { isDemoMode } from "@/lib/demo-mode";
import { requireUserId, withErrorHandling, getSupabaseClient } from "./common";

interface UsageQuota {
  used: number;
  limit: number | string;
}

interface UsageData {
  plan: string;
  usage: Record<string, UsageQuota>;
}

const PLAN_LIMITS: Record<string, { scansPerDay: number | string; structuredReportsPerDay: number | string }> = {
  free: { scansPerDay: 3, structuredReportsPerDay: 3 },
  pro: { scansPerDay: 50, structuredReportsPerDay: 50 },
  team: { scansPerDay: 200, structuredReportsPerDay: 200 },
  enterprise: { scansPerDay: "unlimited", structuredReportsPerDay: "unlimited" },
};

export async function getUsage(): Promise<UsageData | null> {
  if (isDemoMode()) {
    return {
      plan: "demo",
      usage: {
        scansPerDay: { used: 0, limit: 2 },
        structuredReportsPerDay: { used: 0, limit: 3 },
      },
    };
  }

  return withErrorHandling("getUsage", async () => {
    const userId = await requireUserId();
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    const today = new Date().toISOString().split("T")[0];

    const [planResult, usageResult] = await Promise.all([
      supabase.from("user_plans").select("plan").eq("user_id", userId).single(),
      supabase.rpc("get_daily_usage", { p_user_id: userId, p_date: today }),
    ]);

    const plan = (planResult.data?.plan as string) ?? "free";
    const defaultLimits = { scansPerDay: 3 as number | string, structuredReportsPerDay: 3 as number | string };
    const limits = PLAN_LIMITS[plan] ?? defaultLimits;

    const usageRows = (usageResult.data ?? []) as Array<{ route: string; call_count: number }>;
    const routeCounts: Record<string, number> = {};
    for (const row of usageRows) {
      routeCounts[row.route] = Number(row.call_count);
    }

    return {
      plan,
      usage: {
        scansPerDay: {
          used: routeCounts["scan-upload"] ?? routeCounts["scansPerDay"] ?? 0,
          limit: limits.scansPerDay,
        },
        structuredReportsPerDay: {
          used: routeCounts["structured"] ?? routeCounts["structuredReportsPerDay"] ?? 0,
          limit: limits.structuredReportsPerDay,
        },
      },
    };
  });
}
