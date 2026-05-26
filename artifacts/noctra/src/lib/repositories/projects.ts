import { isDemoMode } from "@/lib/demo-mode";
import { demoStore } from "@/lib/demo-store";
import { requireUserId, RepositoryError, withErrorHandling, handleSupabaseError, getSupabaseClient } from "./common";

export async function createProject(params: { name: string; idea?: string; stage?: string; status?: string; meta?: Record<string, unknown> }) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.createProject(userId, params);
  }
  return withErrorHandling("createProject", async () => {
    const userId = await requireUserId();
    if (!params.name?.trim()) throw new RepositoryError("Project name is required", "VALIDATION_ERROR", "createProject");
    const supabase = getSupabaseClient();
    if (!supabase) throw new RepositoryError("Supabase not configured", "SUPABASE_NOT_CONFIGURED", "createProject");
    const { data, error } = await supabase
      .from("projects")
      .insert({ user_id: userId, name: params.name.trim(), idea: params.idea?.trim() ?? null, stage: params.stage ?? "idea", status: params.status ?? "active", meta: params.meta ?? {} })
      .select().single();
    if (error) handleSupabaseError(error, "createProject", { params } as Record<string, unknown>);
    return data;
  });
}

export interface ProjectRecord {
  id: string;
  name: string;
  stage?: string | null;
  status?: string;
  idea?: string | null;
  github_repo?: string | null;
  github_branch?: string | null;
  last_scan_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export async function getProjects(): Promise<ProjectRecord[]> {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.getProjects(userId);
  }
  return withErrorHandling("getProjects", async () => {
    const userId = await requireUserId();
    const supabase = getSupabaseClient();
    if (!supabase) throw new RepositoryError("Supabase not configured", "SUPABASE_NOT_CONFIGURED", "getProjects");
    const { data, error } = await supabase.from("projects").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (error) handleSupabaseError(error, "getProjects");
    return data ?? [];
  });
}

export async function getProject(id: string) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.getProject(userId, id);
  }
  return withErrorHandling("getProject", async () => {
    if (!id?.trim()) throw new RepositoryError("Project ID is required", "VALIDATION_ERROR", "getProject");
    const userId = await requireUserId();
    const supabase = getSupabaseClient();
    if (!supabase) throw new RepositoryError("Supabase not configured", "SUPABASE_NOT_CONFIGURED", "getProject");
    const { data, error } = await supabase.from("projects").select("*").eq("id", id).eq("user_id", userId).single();
    if (error) handleSupabaseError(error, "getProject", { id } as Record<string, unknown>);
    return data;
  });
}

export async function updateProject(id: string, patch: Record<string, unknown>) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.updateProject(userId, id, patch as never);
  }
  return withErrorHandling("updateProject", async () => {
    const userId = await requireUserId();
    const supabase = getSupabaseClient();
    if (!supabase) throw new RepositoryError("Supabase not configured", "SUPABASE_NOT_CONFIGURED", "updateProject");
    const { data, error } = await supabase.from("projects").update(patch).eq("id", id).eq("user_id", userId).select().single();
    if (error) handleSupabaseError(error, "updateProject", { id, patch } as Record<string, unknown>);
    return data;
  });
}

export async function deleteProject(id: string) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    demoStore.deleteProject(userId, id);
    return;
  }
  return withErrorHandling("deleteProject", async () => {
    if (!id?.trim()) throw new RepositoryError("Project ID is required", "VALIDATION_ERROR", "deleteProject");
    const userId = await requireUserId();
    const supabase = getSupabaseClient();
    if (!supabase) throw new RepositoryError("Supabase not configured", "SUPABASE_NOT_CONFIGURED", "deleteProject");
    const { error } = await supabase.from("projects").delete().eq("id", id).eq("user_id", userId);
    if (error) handleSupabaseError(error, "deleteProject", { id } as Record<string, unknown>);
  });
}
