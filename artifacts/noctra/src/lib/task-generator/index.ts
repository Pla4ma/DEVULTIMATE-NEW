import { saveTasks } from "../repositories/tasks";
import { asObj, asArray } from "./utils";
import type { DraftTask } from "./types";
import {
  generateIdeaTasks, generateRealityTasks, generateProofTasks,
  generateSwarmTasks, generateMvpTasks, generateDoctorTasks,
  generateLaunchTasks, generateTwinTasks,
} from "./tool-tasks";
export { generateSprintFromTasks } from "./sprint";
export { normalizePriority } from "./utils";
export type { Task, SprintDay, Sprint, DraftTask } from "./types";

export async function generateTasksFromReport(input: {
  id: string;
  tool: string;
  payload: unknown;
  project_id?: string | null;
}): Promise<number> {
  const payload = asObj(input.payload);
  const data = asObj(payload.data ?? payload);
  if (!data || Object.keys(data).length === 0) return 0;

  const drafts: DraftTask[] = [];
  const base = { sourceReportId: input.id, projectId: input.project_id ?? null };

  function push(t: Omit<DraftTask, "sourceReportId" | "projectId">) {
    if (!t.title?.trim()) return;
    drafts.push({ ...base, ...t });
  }

  switch (input.tool) {
    case "idea": generateIdeaTasks(data, push); break;
    case "reality": generateRealityTasks(data, push); break;
    case "proof": generateProofTasks(data, push); break;
    case "swarm": generateSwarmTasks(data, push); break;
    case "mvp": generateMvpTasks(data, push); break;
    case "doctor": generateDoctorTasks(data, push, () => drafts.length); break;
    case "launch": generateLaunchTasks(data, push); break;
    case "twin": generateTwinTasks(data, push); break;
    default: return 0;
  }

  // For doctor tool: limit to P0 (3 critical/high) + P1 (5 important/medium) + rest as P2 backlog
  if (input.tool === "doctor" && drafts.length > 8) {
    const p0: DraftTask[] = [];
    const p1: DraftTask[] = [];
    const p2: DraftTask[] = [];
    for (const d of drafts) {
      if (d.priority === "high" && p0.length < 3) {
        p0.push(d);
      } else if (d.priority !== "low" && p1.length < 5) {
        p1.push({ ...d, priority: "medium" });
      } else if (p0.length + p1.length + p2.length < 20) {
        p2.push({ ...d, priority: "low" });
      }
    }
    drafts.length = 0;
    drafts.push(...p0, ...p1, ...p2);
  }

  if (drafts.length === 0) return 0;

  // Deduplicate by title
  const seen = new Set<string>();
  const unique = drafts.filter((d) => {
    const key = d.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  try {
    const saved = await saveTasks(
      unique.map((d) => ({
        title: d.title,
        detail: d.detail,
        priority: d.priority,
        category: d.category,
        sourceReportId: d.sourceReportId,
        projectId: d.projectId ?? undefined,
      })),
    );
    return Array.isArray(saved) ? saved.length : unique.length;
  } catch (e) {
    console.error("Failed to save tasks from report:", e);
    throw new Error(`Task generation failed: ${e instanceof Error ? e.message : "Unknown error"}`);
  }
}

export const createTasksFromReport = generateTasksFromReport;
