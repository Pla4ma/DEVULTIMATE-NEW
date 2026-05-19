import { isDemoMode } from "@/lib/demo-mode";
import { demoStore } from "@/lib/demo-store";
import { requireUserId, RepositoryError, withErrorHandling, handleSupabaseError } from "./common";
import { supabase as _supabase } from "@/integrations/supabase/client";

const supabase: any = _supabase;

export async function saveProofSignals(signals: Array<{ label: string; kind: string; value?: number; weight?: number; source?: string; evidence?: string; projectId?: string }>) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.saveProofSignals(userId, signals);
  }
  return withErrorHandling("saveProofSignals", async () => {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from("proof_signals")
      .insert(signals.map((s) => ({ user_id: userId, label: s.label, kind: s.kind, value: s.value ?? null, weight: s.weight ?? 1, source: s.source ?? null, evidence: s.evidence ?? null, project_id: s.projectId ?? null })))
      .select();
    if (error) handleSupabaseError(error, "saveProofSignals", { signals });
    return data ?? [];
  });
}

export async function getProofSignals(projectId?: string) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.getProofSignals(userId, projectId);
  }
  return withErrorHandling("getProofSignals", async () => {
    const userId = await requireUserId();
    let q = supabase.from("proof_signals").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (projectId) q = q.eq("project_id", projectId);
    const { data, error } = await q;
    if (error) handleSupabaseError(error, "getProofSignals", { projectId });
    return data ?? [];
  });
}

export async function createProofSignal(signal: { label: string; kind: string; value?: number; weight?: number; source?: string; evidence?: string; projectId?: string }) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.createProofSignal(userId, signal);
  }
  return withErrorHandling("createProofSignal", async () => {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from("proof_signals")
      .insert({ user_id: userId, label: signal.label, kind: signal.kind, value: signal.value ?? null, weight: signal.weight ?? 1, source: signal.source ?? null, evidence: signal.evidence ?? null, project_id: signal.projectId ?? null })
      .select().single();
    if (error) handleSupabaseError(error, "createProofSignal", { signal });
    return data;
  });
}

export async function deleteProofSignal(id: string) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    demoStore.deleteProofSignal(userId, id);
    return;
  }
  return withErrorHandling("deleteProofSignal", async () => {
    const userId = await requireUserId();
    const { error } = await supabase.from("proof_signals").delete().eq("id", id).eq("user_id", userId);
    if (error) handleSupabaseError(error, "deleteProofSignal", { id });
  });
}
