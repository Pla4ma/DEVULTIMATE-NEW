import { isDemoMode } from "@/lib/demo-mode";
import { demoStore } from "@/lib/demo-store";
import { requireUserId, RepositoryError, withErrorHandling, handleSupabaseError, getSupabaseClient } from "./common";
import type { PostgrestSingleResponse } from "@supabase/supabase-js";

export type Blocker = {
  id: string;
  user_id: string;
  project_id: string;
  scan_id?: string | null;
  title: string;
  severity: "P0" | "P1" | "P2";
  category: "security" | "performance" | "testing" | "deployment" | "docs" | "code" | "privacy" | "billing";
  evidence?: string | null;
  why_it_matters?: string | null;
  recommended_fix?: string | null;
  acceptance_criteria?: string | null;
  status: "open" | "in_progress" | "fixed" | "ignored";
  linked_task_id?: string | null;
  created_at: string;
  updated_at: string;
};

export async function getBlockers(projectId: string): Promise<Blocker[]> {
  if (isDemoMode()) {
    const userId = await requireUserId();
    const blockers = demoStore.getBlockers?.(userId, projectId) ?? [];
    return blockers as Blocker[];
  }
  return withErrorHandling("getBlockers", async () => {
    const userId = await requireUserId();
    const supabase = getSupabaseClient();
    if (!supabase) throw new RepositoryError("Supabase not configured", "SUPABASE_NOT_CONFIGURED", "getBlockers");
    const { data, error } = await supabase
      .from("blockers")
      .select("*")
      .eq("user_id", userId)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false }) as unknown as QueryResponse<Blocker>;
    if (error) handleSupabaseError(error, "getBlockers", { projectId });
    return data ?? [];
  });
}

type QueryResponse<T> = {
  data: T[] | null;
  error: { message: string; code?: string } | null;
};

type SingleResponse<T> = {
  data: T | null;
  error: { message: string; code?: string } | null;
};

export async function createBlocker(params: {
  projectId: string;
  title: string;
  severity?: string;
  category?: string;
  evidence?: string;
  whyItMatters?: string;
  recommendedFix?: string;
  acceptanceCriteria?: string;
  status?: string;
  scanId?: string;
}): Promise<Blocker> {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return (demoStore.createBlocker?.(userId, params) ?? {}) as Blocker;
  }
  return withErrorHandling("createBlocker", async () => {
    const userId = await requireUserId();
    const supabase = getSupabaseClient();
    if (!supabase) throw new RepositoryError("Supabase not configured", "SUPABASE_NOT_CONFIGURED", "createBlocker");
    const { data, error } = await supabase
      .from("blockers")
      .insert({
        user_id: userId,
        project_id: params.projectId,
        title: params.title.trim(),
        severity: params.severity ?? "P1",
        category: params.category ?? "code",
        evidence: params.evidence ?? null,
        why_it_matters: params.whyItMatters ?? null,
        recommended_fix: params.recommendedFix ?? null,
        acceptance_criteria: params.acceptanceCriteria ?? null,
        status: params.status ?? "open",
        scan_id: params.scanId ?? null,
      })
      .select()
      .single() as unknown as SingleResponse<Blocker>;
    if (error) handleSupabaseError(error, "createBlocker", { params } as Record<string, unknown>);
    return data as Blocker;
  });
}

export async function updateBlocker(id: string, patch: Partial<Blocker>): Promise<Blocker> {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return (demoStore.updateBlocker?.(userId, id, patch) ?? {}) as Blocker;
  }
  return withErrorHandling("updateBlocker", async () => {
    const userId = await requireUserId();
    const supabase = getSupabaseClient();
    if (!supabase) throw new RepositoryError("Supabase not configured", "SUPABASE_NOT_CONFIGURED", "updateBlocker");
    const { data, error } = await supabase
      .from("blockers")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single() as unknown as SingleResponse<Blocker>;
    if (error) handleSupabaseError(error, "updateBlocker", { id, patch } as Record<string, unknown>);
    return data as Blocker;
  });
}

export async function deleteBlocker(id: string): Promise<void> {
  if (isDemoMode()) {
    const userId = await requireUserId();
    demoStore.deleteBlocker?.(userId, id);
    return;
  }
  return withErrorHandling("deleteBlocker", async () => {
    const userId = await requireUserId();
    const supabase = getSupabaseClient();
    if (!supabase) throw new RepositoryError("Supabase not configured", "SUPABASE_NOT_CONFIGURED", "deleteBlocker");
    const { error } = await supabase.from("blockers").delete().eq("id", id).eq("user_id", userId);
    if (error) handleSupabaseError(error, "deleteBlocker", { id } as Record<string, unknown>);
  });
}
