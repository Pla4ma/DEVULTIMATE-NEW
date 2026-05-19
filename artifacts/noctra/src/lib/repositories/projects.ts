import { isDemoMode } from "@/lib/demo-mode";
import { demoStore } from "@/lib/demo-store";
import { requireUserId, RepositoryError, withErrorHandling, handleSupabaseError } from "./common";
import { supabase as _supabase } from "@/integrations/supabase/client";

const supabase: any = _supabase;

export async function createProject(params: { name: string; idea?: string; stage?: string; status?: string; meta?: Record<string, unknown> }) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.createProject(userId, params);
  }
  return withErrorHandling("createProject", async () => {
    const userId = await requireUserId();
    if (!params.name?.trim()) throw new RepositoryError("Project name is required", "VALIDATION_ERROR", "createProject");
    const { data, error } = await supabase
      .from("projects")
      .insert({ user_id: userId, name: params.name.trim(), idea: params.idea?.trim() ?? null, stage: params.stage ?? "idea", status: params.status ?? "active", meta: (params.meta ?? {}) as never })
      .select().single();
    if (error) handleSupabaseError(error, "createProject", { params });
    return data;
  });
}

export async function getProjects() {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.getProjects(userId);
  }
  return withErrorHandling("getProjects", async () => {
    const userId = await requireUserId();
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
    const { data, error } = await supabase.from("projects").select("*").eq("id", id).eq("user_id", userId).single();
    if (error) handleSupabaseError(error, "getProject", { id });
    return data;
  });
}

export async function updateProject(id: string, patch: Partial<{ name: string; idea: string; stage: string; status: string; meta: Record<string, unknown> }>) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.updateProject(userId, id, patch as never);
  }
  return withErrorHandling("updateProject", async () => {
    const userId = await requireUserId();
    const { data, error } = await supabase.from("projects").update(patch as never).eq("id", id).eq("user_id", userId).select().single();
    if (error) handleSupabaseError(error, "updateProject", { id, patch });
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
    const { error } = await supabase.from("projects").delete().eq("id", id).eq("user_id", userId);
    if (error) handleSupabaseError(error, "deleteProject", { id });
  });
}
