import { isDemoMode } from "@/lib/demo-mode";
import { demoStore } from "@/lib/demo-store";
import { requireUserId, RepositoryError, withErrorHandling, handleSupabaseError, getSupabaseClient } from "./common";

export type ScanSnapshot = {
  id: string;
  user_id: string;
  project_id: string;
  report_id?: string | null;
  score?: number | null;
  blockers: unknown[];
  static_signals: Record<string, unknown>;
  generated_tasks: unknown[];
  evidence_index: unknown[];
  summary?: string | null;
  created_at: string;
};

export type ScanDelta = {
  current: ScanSnapshot | null;
  previous: ScanSnapshot | null;
  delta: {
    scoreDelta: number;
    fixedBlockers: number;
    newBlockers: number;
    unresolvedBlockers: number;
    isFirstScan: boolean;
    scoreImproved: boolean;
    scoreDeclined: boolean;
  } | null;
};

export async function getScanSnapshots(projectId: string): Promise<ScanSnapshot[]> {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return (demoStore.getScanSnapshots?.(userId, projectId) ?? []) as ScanSnapshot[];
  }
  return withErrorHandling("getScanSnapshots", async () => {
    const userId = await requireUserId();
    const supabase = getSupabaseClient();
    if (!supabase) throw new RepositoryError("Supabase not configured", "SUPABASE_NOT_CONFIGURED", "getScanSnapshots");
    const { data, error } = await supabase
      .from("scan_snapshots")
      .select("*")
      .eq("user_id", userId)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (error) handleSupabaseError(error, "getScanSnapshots", { projectId } as Record<string, unknown>);
    return (data ?? []) as ScanSnapshot[];
  });
}

export async function getLatestScanSnapshot(projectId: string): Promise<ScanSnapshot | null> {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return (demoStore.getLatestScanSnapshot?.(userId, projectId) ?? null) as ScanSnapshot | null;
  }
  return withErrorHandling("getLatestScanSnapshot", async () => {
    const userId = await requireUserId();
    const supabase = getSupabaseClient();
    if (!supabase) throw new RepositoryError("Supabase not configured", "SUPABASE_NOT_CONFIGURED", "getLatestScanSnapshot");
    const { data, error } = await supabase
      .from("scan_snapshots")
      .select("*")
      .eq("user_id", userId)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (error && error.code === "PGRST116") return null;
    if (error) handleSupabaseError(error, "getLatestScanSnapshot", { projectId } as Record<string, unknown>);
    return (data ?? null) as ScanSnapshot | null;
  });
}

export async function getScanDelta(projectId: string): Promise<ScanDelta> {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return (demoStore.getScanDelta?.(userId, projectId) ?? { current: null, previous: null, delta: null }) as ScanDelta;
  }
  return withErrorHandling("getScanDelta", async () => {
    const userId = await requireUserId();
    const supabase = getSupabaseClient();
    if (!supabase) throw new RepositoryError("Supabase not configured", "SUPABASE_NOT_CONFIGURED", "getScanDelta");
    const { data, error } = await supabase
      .from("scan_snapshots")
      .select("*")
      .eq("user_id", userId)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(2);
    if (error) handleSupabaseError(error, "getScanDelta", { projectId } as Record<string, unknown>);
    const snapshots = (data ?? []) as ScanSnapshot[];
    if (snapshots.length === 0) return { current: null, previous: null, delta: null };
    const current = snapshots[0]!;
    const previous = snapshots[1] ?? null;
    const currentBlockers = (current.blockers as Array<{ id: string; status: string }>) ?? [];
    const previousBlockers = previous ? (previous.blockers as Array<{ id: string; status: string }>) ?? [] : [];
    const previousIds = new Set(previousBlockers.map((b) => b.id));
    const currentIds = new Set(currentBlockers.map((b) => b.id));
    const fixedBlockers = previousBlockers.filter((b) => !currentIds.has(b.id) || b.status === "fixed").length;
    const newBlockers = currentBlockers.filter((b) => !previousIds.has(b.id)).length;
    const unresolvedBlockers = currentBlockers.filter((b) => b.status === "open" || b.status === "in_progress").length;
    const scoreDelta = previous ? (current.score ?? 0) - (previous.score ?? 0) : 0;
    return {
      current,
      previous,
      delta: {
        scoreDelta,
        fixedBlockers,
        newBlockers,
        unresolvedBlockers,
        isFirstScan: !previous,
        scoreImproved: scoreDelta > 0,
        scoreDeclined: scoreDelta < 0,
      },
    };
  });
}

export async function createScanSnapshot(params: {
  projectId: string;
  reportId?: string;
  score?: number;
  blockers?: unknown[];
  staticSignals?: Record<string, unknown>;
  generatedTasks?: unknown[];
  evidenceIndex?: unknown[];
  summary?: string;
}): Promise<ScanSnapshot> {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return (demoStore.createScanSnapshot?.(userId, params) ?? {}) as ScanSnapshot;
  }
  return withErrorHandling("createScanSnapshot", async () => {
    const userId = await requireUserId();
    const supabase = getSupabaseClient();
    if (!supabase) throw new RepositoryError("Supabase not configured", "SUPABASE_NOT_CONFIGURED", "createScanSnapshot");
    const { data, error } = await supabase
      .from("scan_snapshots")
      .insert({
        user_id: userId,
        project_id: params.projectId,
        report_id: params.reportId ?? null,
        score: params.score ?? null,
        blockers: params.blockers ?? [],
        static_signals: params.staticSignals ?? {},
        generated_tasks: params.generatedTasks ?? [],
        evidence_index: params.evidenceIndex ?? [],
        summary: params.summary ?? null,
      })
      .select()
      .single();
    if (error) handleSupabaseError(error, "createScanSnapshot", { params } as Record<string, unknown>);
    return data as ScanSnapshot;
  });
}
