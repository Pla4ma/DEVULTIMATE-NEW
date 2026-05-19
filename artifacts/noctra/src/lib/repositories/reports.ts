import { isDemoMode } from "@/lib/demo-mode";
import { demoStore } from "@/lib/demo-store";
import { requireUserId, RepositoryError, withErrorHandling, handleSupabaseError } from "./common";
import { supabase as _supabase } from "@/integrations/supabase/client";

const supabase: any = _supabase;

export async function saveReport(params: {
  tool: string;
  title: string;
  payload: unknown;
  score?: number;
  summary?: string;
  projectId?: string;
}) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.saveReport(userId, params);
  }
  return withErrorHandling("saveReport", async () => {
    const userId = await requireUserId();
    if (!params.tool?.trim()) throw new RepositoryError("Tool is required", "VALIDATION_ERROR", "saveReport");
    if (!params.title?.trim()) throw new RepositoryError("Title is required", "VALIDATION_ERROR", "saveReport");
    if (!params.payload) throw new RepositoryError("Payload is required", "VALIDATION_ERROR", "saveReport");

    const { data, error } = await supabase
      .from("reports")
      .insert({
        user_id: userId,
        tool: params.tool.trim(),
        title: params.title.trim(),
        payload: params.payload as never,
        score: params.score ?? null,
        summary: params.summary?.trim() ?? null,
        project_id: params.projectId ?? null,
      })
      .select()
      .single();
    if (error) handleSupabaseError(error, "saveReport", { params });
    return data;
  });
}

export async function getReports(tool?: string, projectId?: string) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.getReports(userId, tool, projectId);
  }
  return withErrorHandling("getReports", async () => {
    const userId = await requireUserId();
    let q = supabase.from("reports").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (tool) q = q.eq("tool", tool);
    if (projectId) q = q.eq("project_id", projectId);
    const { data, error } = await q;
    if (error) handleSupabaseError(error, "getReports", { tool, projectId });
    return data ?? [];
  });
}

export async function getReport(id: string) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.getReport(userId, id);
  }
  return withErrorHandling("getReport", async () => {
    if (!id?.trim()) throw new RepositoryError("Report ID is required", "VALIDATION_ERROR", "getReport");
    const userId = await requireUserId();
    const { data, error } = await supabase.from("reports").select("*").eq("id", id).eq("user_id", userId).single();
    if (error) handleSupabaseError(error, "getReport", { id });
    return data;
  });
}

export async function deleteReport(id: string) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    demoStore.deleteReport(userId, id);
    return;
  }
  return withErrorHandling("deleteReport", async () => {
    if (!id?.trim()) throw new RepositoryError("Report ID is required", "VALIDATION_ERROR", "deleteReport");
    const userId = await requireUserId();
    const { error } = await supabase.from("reports").delete().eq("id", id).eq("user_id", userId);
    if (error) handleSupabaseError(error, "deleteReport", { id });
  });
}

export async function linkReportToProject(reportId: string, projectId: string | null) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    demoStore.linkReportToProject(userId, reportId, projectId);
    return;
  }
  return withErrorHandling("linkReportToProject", async () => {
    if (!reportId?.trim()) throw new RepositoryError("Report ID is required", "VALIDATION_ERROR", "linkReportToProject");
    const userId = await requireUserId();
    const { error } = await supabase.from("reports").update({ project_id: projectId }).eq("id", reportId).eq("user_id", userId);
    if (error) handleSupabaseError(error, "linkReportToProject", { reportId, projectId });
  });
}

export async function updateReport(id: string, updates: { title?: string; payload?: unknown; score?: number; summary?: string; project_id?: string | null }) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.updateReport(userId, id, updates);
  }
  return withErrorHandling("updateReport", async () => {
    if (!id?.trim()) throw new RepositoryError("Report ID is required", "VALIDATION_ERROR", "updateReport");
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from("reports")
      .update({ ...updates, payload: updates.payload as never, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) handleSupabaseError(error, "updateReport", { id, updates });
    return data;
  });
}
