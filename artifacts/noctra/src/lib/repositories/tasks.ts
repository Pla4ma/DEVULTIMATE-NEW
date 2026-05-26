import { isDemoMode } from "@/lib/demo-mode";
import { demoStore } from "@/lib/demo-store";
import { requireUserId, RepositoryError, withErrorHandling, handleSupabaseError, getSupabaseClient } from "./common";

export async function saveTasks(tasks: Array<{ title: string; detail?: string; priority?: string; projectId?: string; sourceReportId?: string; category?: string }>) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.saveTasks(userId, tasks);
  }
  return withErrorHandling("saveTasks", async () => {
    const userId = await requireUserId();
    const supabase = getSupabaseClient();
    if (!supabase) throw new RepositoryError("Supabase not configured", "SUPABASE_NOT_CONFIGURED", "saveTasks");
    tasks.forEach((task) => {
      if (!task.title?.trim()) throw new RepositoryError("Task title is required", "VALIDATION_ERROR", "saveTasks");
    });
    const { data, error } = await supabase
      .from("tasks")
      .insert(tasks.map((t) => ({
        user_id: userId, title: t.title.trim(), detail: t.detail?.trim() ?? null,
        priority: t.priority ?? "medium", project_id: t.projectId ?? null,
        source_report_id: t.sourceReportId ?? null, category: t.category ?? "development", status: "todo",
      })))
      .select();
    if (error) handleSupabaseError(error, "saveTasks", { tasks } as Record<string, unknown>);
    return data ?? [];
  });
}

export async function createTask(task: { title: string; detail?: string; priority?: string; projectId?: string; sourceReportId?: string; category?: string }) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.createTask(userId, task);
  }
  return withErrorHandling("createTask", async () => {
    const userId = await requireUserId();
    const supabase = getSupabaseClient();
    if (!supabase) throw new RepositoryError("Supabase not configured", "SUPABASE_NOT_CONFIGURED", "createTask");
    if (!task.title?.trim()) throw new RepositoryError("Task title is required", "VALIDATION_ERROR", "createTask");
    const { data, error } = await supabase
      .from("tasks")
      .insert({ user_id: userId, title: task.title, detail: task.detail ?? null, priority: task.priority ?? "medium", project_id: task.projectId ?? null, source_report_id: task.sourceReportId ?? null, category: task.category ?? "development", status: "todo" })
      .select().single();
    if (error) handleSupabaseError(error, "createTask", { task } as Record<string, unknown>);
    return data;
  });
}

export interface TaskRecord {
  id: string;
  title: string;
  detail?: string | null;
  priority: string;
  status: string;
  category?: string | null;
  project_id?: string | null;
  source_report_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export async function getTasks(projectId?: string): Promise<TaskRecord[]> {
  if (isDemoMode()) {
    const userId = await requireUserId();
    return demoStore.getTasks(userId, projectId) as TaskRecord[];
  }
  return withErrorHandling("getTasks", async () => {
    const userId = await requireUserId();
    const supabase = getSupabaseClient();
    if (!supabase) throw new RepositoryError("Supabase not configured", "SUPABASE_NOT_CONFIGURED", "getTasks");
    let q = supabase.from("tasks").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (projectId) q = q.eq("project_id", projectId);
    const { data, error } = await q;
    if (error) handleSupabaseError(error, "getTasks", { projectId } as Record<string, unknown>);
    return (data ?? []) as TaskRecord[];
  });
}

export async function updateTaskStatus(id: string, status: string) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    demoStore.updateTaskStatus(userId, id, status);
    return;
  }
  return withErrorHandling("updateTaskStatus", async () => {
    if (!id?.trim()) throw new RepositoryError("Task ID is required", "VALIDATION_ERROR", "updateTaskStatus");
    const userId = await requireUserId();
    const supabase = getSupabaseClient();
    if (!supabase) throw new RepositoryError("Supabase not configured", "SUPABASE_NOT_CONFIGURED", "updateTaskStatus");
    const { error } = await supabase.from("tasks").update({ status }).eq("id", id).eq("user_id", userId);
    if (error) handleSupabaseError(error, "updateTaskStatus", { id, status } as Record<string, unknown>);
  });
}

export async function updateTask(id: string, patch: Record<string, unknown>) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    demoStore.updateTask(userId, id, patch);
    return;
  }
  return withErrorHandling("updateTask", async () => {
    const userId = await requireUserId();
    const supabase = getSupabaseClient();
    if (!supabase) throw new RepositoryError("Supabase not configured", "SUPABASE_NOT_CONFIGURED", "updateTask");
    const { error } = await supabase.from("tasks").update(patch).eq("id", id).eq("user_id", userId);
    if (error) handleSupabaseError(error, "updateTask", { id, patch } as Record<string, unknown>);
  });
}

export async function deleteTask(id: string) {
  if (isDemoMode()) {
    const userId = await requireUserId();
    demoStore.deleteTask(userId, id);
    return;
  }
  return withErrorHandling("deleteTask", async () => {
    if (!id?.trim()) throw new RepositoryError("Task ID is required", "VALIDATION_ERROR", "deleteTask");
    const userId = await requireUserId();
    const supabase = getSupabaseClient();
    if (!supabase) throw new RepositoryError("Supabase not configured", "SUPABASE_NOT_CONFIGURED", "deleteTask");
    const { error } = await supabase.from("tasks").delete().eq("id", id).eq("user_id", userId);
    if (error) handleSupabaseError(error, "deleteTask", { id } as Record<string, unknown>);
  });
}
