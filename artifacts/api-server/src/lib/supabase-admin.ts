import { logger } from "./logger";

const supabaseUrl = process.env.SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

interface SupabaseAdminClient {
  auth: {
    admin: {
      updateUserById: (uid: string, meta: { app_metadata: Record<string, string> }) => Promise<{ error: unknown }>;
    };
  };
}

let adminClient: SupabaseAdminClient | null = null;

export function getSupabaseAdmin(): SupabaseAdminClient | null {
  if (adminClient) return adminClient;
  if (!supabaseUrl || !serviceRoleKey) {
    logger.warn("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — admin client unavailable");
    return null;
  }
  try {
    const { createClient } = require("@supabase/supabase-js") as { createClient: (...args: unknown[]) => SupabaseAdminClient };
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    return adminClient;
  } catch {
    logger.warn("@supabase/supabase-js not installed — admin client unavailable");
    return null;
  }
}

export async function updateUserPlan(userId: string, plan: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    logger.warn({ userId, plan }, "Cannot update user plan — no admin client");
    return false;
  }
  const { error } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { plan },
  });
  if (error) {
    logger.error({ userId, plan, err: error }, "Failed to update user plan");
    return false;
  }
  logger.info({ userId, plan }, "User plan updated");
  return true;
}
