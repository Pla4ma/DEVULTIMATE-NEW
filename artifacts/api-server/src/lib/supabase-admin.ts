import { createClient } from "@supabase/supabase-js";
import { logger } from "./logger";

const supabaseUrl = process.env.SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

let adminClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin(): ReturnType<typeof createClient> | null {
  if (adminClient) return adminClient;
  if (!supabaseUrl || !serviceRoleKey) {
    logger.warn("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — admin client unavailable");
    return null;
  }
  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return adminClient;
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
