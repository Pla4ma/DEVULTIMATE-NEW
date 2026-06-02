import { getSupabaseAdmin } from "./supabase-admin";
import { logger } from "./logger";

export interface UsageRecord {
  route: string;
  tool?: string;
  provider?: string;
  model?: string;
  tokensEstimated?: number;
  success?: boolean;
  errorMessage?: string;
  ipAddress?: string;
}

type SupabaseError = { message: string } | null;

interface UsageDbClient {
  rpc(fn: string, args: Record<string, unknown>): Promise<{ data: unknown; error: SupabaseError }>;
  from(table: string): {
    insert(row: Record<string, unknown>): PromiseLike<{ error: SupabaseError }>;
  };
}

function usageDb(): UsageDbClient | null {
  const admin = getSupabaseAdmin();
  return admin ? (admin as unknown as UsageDbClient) : null;
}

type DailyUsage = { counts: Map<string, number>; fetchedAt: number };

const CACHE_TTL_MS = 10_000;
const usageCache = new Map<string, DailyUsage>();

const memoryStore = new Map<string, { date: string; counts: Map<string, number> }>();

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function memoryKey(userId: string): string {
  return `${userId}:${today()}`;
}

function bumpMemory(userId: string, route: string): void {
  const key = memoryKey(userId);
  let entry = memoryStore.get(key);
  if (!entry) {
    entry = { date: today(), counts: new Map() };
    memoryStore.set(key, entry);
  }
  entry.counts.set(route, (entry.counts.get(route) ?? 0) + 1);
}

function readMemory(userId: string): Map<string, number> {
  return memoryStore.get(memoryKey(userId))?.counts ?? new Map();
}

export async function getDailyUsage(userId: string): Promise<Map<string, number>> {
  const cached = usageCache.get(userId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.counts;
  }

  const admin = usageDb();
  if (!admin) {
    return readMemory(userId);
  }

  try {
    const { data, error } = await admin.rpc("get_daily_usage", { p_user_id: userId });
    if (error) {
      logger.warn({ userId, err: error }, "get_daily_usage RPC failed — using cached/memory counts");
      return cached?.counts ?? readMemory(userId);
    }
    const counts = new Map<string, number>();
    for (const row of (data as Array<{ route: string; call_count: number }> | null) ?? []) {
      counts.set(row.route, Number(row.call_count));
    }
    usageCache.set(userId, { counts, fetchedAt: Date.now() });
    return counts;
  } catch (err) {
    logger.warn({ userId, err }, "get_daily_usage threw — using cached/memory counts");
    return cached?.counts ?? readMemory(userId);
  }
}

export function recordUsage(userId: string, record: UsageRecord): void {
  const cached = usageCache.get(userId);
  if (cached) {
    cached.counts.set(record.route, (cached.counts.get(record.route) ?? 0) + 1);
  }
  bumpMemory(userId, record.route);

  const admin = usageDb();
  if (!admin) return;

  void admin
    .from("usage_logs")
    .insert({
      user_id: userId,
      route: record.route,
      tool: record.tool ?? null,
      provider: record.provider ?? null,
      model: record.model ?? null,
      tokens_estimated: record.tokensEstimated ?? null,
      success: record.success ?? true,
      error_message: record.errorMessage ?? null,
      ip_address: record.ipAddress ?? null,
    })
    .then(({ error }) => {
      if (error) logger.warn({ userId, route: record.route, err: error }, "Failed to persist usage_log");
    });
}

export function pruneMemory(): void {
  const current = today();
  for (const [key, entry] of memoryStore) {
    if (entry.date !== current) memoryStore.delete(key);
  }
  const cutoff = Date.now() - CACHE_TTL_MS;
  for (const [userId, entry] of usageCache) {
    if (entry.fetchedAt < cutoff) usageCache.delete(userId);
  }
}
