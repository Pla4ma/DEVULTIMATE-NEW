import { isDemoMode } from "@/lib/demo-mode";
import { demoStore } from "@/lib/demo-store";
import { requireUserId, RepositoryError, withErrorHandling, handleSupabaseError, getSupabaseClient } from "./common";

export async function saveScan(params: { fileName: string; summary: string; payload: unknown; projectId?: string }) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.saveScan(userId, params);
  }
  return withErrorHandling("saveScan", async () => {
    const userId = await requireUserId();
    const supabase = getSupabaseClient();
    if (!supabase) throw new RepositoryError("Supabase not configured", "SUPABASE_NOT_CONFIGURED", "saveScan");
    const { data, error } = await supabase
      .from("scans")
      .insert({ user_id: userId, file_name: params.fileName, summary: params.summary, payload: params.payload, project_id: params.projectId ?? null })
      .select().single();
    if (error) handleSupabaseError(error, "saveScan", { params } as Record<string, unknown>);
    return data;
  });
}

export async function getScans(projectId?: string) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.getScans(userId, projectId);
  }
  return withErrorHandling("getScans", async () => {
    const userId = await requireUserId();
    const supabase = getSupabaseClient();
    if (!supabase) throw new RepositoryError("Supabase not configured", "SUPABASE_NOT_CONFIGURED", "getScans");
    let q = supabase.from("scans").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (projectId) q = q.eq("project_id", projectId);
    const { data, error } = await q;
    if (error) handleSupabaseError(error, "getScans", { projectId } as Record<string, unknown>);
    return data ?? [];
  });
}
