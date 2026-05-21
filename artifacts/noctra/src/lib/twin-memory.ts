import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isDemoMode, getDemoUser, DEMO_USER_FALLBACK_ID } from "@/lib/demo-mode";
import { demoStore } from "@/lib/demo-store";

export interface MemoryContext {
  selectedProject: Record<string, unknown> | null;
  latestReports: Array<Record<string, unknown>>;
  openTasks: Array<Record<string, unknown>>;
  proofSignals: Array<Record<string, unknown>>;
  scans: Array<Record<string, unknown>>;
  failedGates: Array<Record<string, unknown>>;
  latestScores: Record<string, number>;
  passport: {
    totalReports: number;
    openTasks: number;
    proofSignals: number;
    completedScans: number;
    averageScore: number;
  };
}

const EMPTY: MemoryContext = {
  selectedProject: null,
  latestReports: [],
  openTasks: [],
  proofSignals: [],
  scans: [],
  failedGates: [],
  latestScores: {},
  passport: { totalReports: 0, openTasks: 0, proofSignals: 0, completedScans: 0, averageScore: 0 },
};

async function getCurrentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabaseClient = supabase as SupabaseClient | null;
  if (!supabaseClient) return null;
  try {
    const { data } = await supabaseClient.auth.getUser();
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

async function safeQuery<T>(supabaseClient: SupabaseClient, query: Promise<{ data: T | null }>): Promise<T | null> {
  try {
    const { data } = await query;
    return data;
  } catch {
    return null;
  }
}

function extractPayload(report: Record<string, unknown>): Record<string, unknown> {
  const raw = (report.payload ?? report.data) as unknown;
  if (raw && typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    try { return JSON.parse(raw) as Record<string, unknown>; } catch { return {}; }
  }
  return {};
}

function processReports(reports: Array<Record<string, unknown>>): {
  failedGates: Array<Record<string, unknown>>;
  latestScores: Record<string, number>;
} {
  const failedGates: Array<Record<string, unknown>> = [];
  const latestScores: Record<string, number> = {};

  reports.forEach((report) => {
    const payload = extractPayload(report);
    const data = (payload.data ?? payload) as Record<string, unknown>;
    const tool = String(report.tool ?? "unknown");

    const scoreKeys = [`${tool}_score`, "signal_score", "health_score", "proof_score", "mvp_score", "swarm_score", "launch_score", "reality_score", "score"];
    if (typeof report.score === "number") {
      latestScores[tool] = report.score;
    } else {
      for (const key of scoreKeys) {
        const val = data[key];
        if (typeof val === "number" && !isNaN(val)) {
          latestScores[tool] = Math.round(val);
          break;
        }
      }
    }

    if (typeof data.health_score === "number") latestScores.health = data.health_score;
    if (typeof data.proof_score === "number") latestScores.proof = data.proof_score;

    if (report.tool === "doctor") {
      const gates = Array.isArray(data.gates) ? data.gates : Array.isArray(data.launch_gates) ? data.launch_gates : [];
      gates.forEach((g) => {
        if (g && typeof g === "object" && (g as Record<string, unknown>).status === "RED") {
          failedGates.push(g as Record<string, unknown>);
        }
      });
    }
  });

  return { failedGates, latestScores };
}

async function loadDemoMemoryContext(projectId?: string): Promise<MemoryContext> {
  const userId = getDemoUser()?.id ?? DEMO_USER_FALLBACK_ID;

  const allReports = demoStore.getReports(userId) as unknown as Array<Record<string, unknown>>;
  const reports = allReports.slice(0, 15);

  const allTasks = demoStore.getTasks(userId);
  const openTasks = allTasks
    .filter((t) => t.status === "todo")
    .slice(0, 25) as unknown as Array<Record<string, unknown>>;

  const proofSignals = demoStore.getProofSignals(userId)
    .slice(0, 50) as unknown as Array<Record<string, unknown>>;

  const scans = demoStore.getScans(userId)
    .slice(0, 5) as unknown as Array<Record<string, unknown>>;

  let selectedProject: Record<string, unknown> | null = null;
  if (projectId) {
    const proj = demoStore.getProject(userId, projectId);
    selectedProject = proj as unknown as Record<string, unknown> | null;
  }

  const { failedGates, latestScores } = processReports(reports);

  const scoreVals = Object.values(latestScores);
  const passport = {
    totalReports: reports.length,
    openTasks: openTasks.length,
    proofSignals: proofSignals.length,
    completedScans: scans.length,
    averageScore: scoreVals.length ? Math.round(scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length) : 0,
  };

  return { selectedProject, latestReports: reports, openTasks, proofSignals, scans, failedGates, latestScores, passport };
}

export class TwinMemory {
  static async loadMemoryContext(projectId?: string): Promise<MemoryContext> {
    if (isDemoMode()) return loadDemoMemoryContext(projectId);

    const supabaseClient = supabase as SupabaseClient | null;
    if (!supabaseClient) return EMPTY;

    try {
      const userId = await getCurrentUserId();
      if (!userId) return EMPTY;

      const [selectedProject, reports, tasks, proofSignals, scans] = await Promise.all([
        projectId
          ? safeQuery(supabaseClient,
              supabaseClient.from("projects").select("*").eq("id", projectId).eq("user_id", userId).single()
            )
          : Promise.resolve(null),
        safeQuery(supabaseClient,
          supabaseClient.from("reports").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(15)
        ),
        safeQuery(supabaseClient,
          supabaseClient.from("tasks").select("*").eq("user_id", userId).eq("status", "todo").order("created_at", { ascending: false }).limit(25)
        ),
        safeQuery(supabaseClient,
          supabaseClient.from("proof_signals").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50)
        ),
        safeQuery(supabaseClient,
          supabaseClient.from("scans").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(5)
        ),
      ]);

      const safeReports = reports ?? [];
      const safeTasks = tasks ?? [];
      const safeProofSignals = proofSignals ?? [];
      const safeScans = scans ?? [];

      const { failedGates, latestScores } = processReports(safeReports);

      const scoreVals = Object.values(latestScores);
      const passport = {
        totalReports: safeReports.length,
        openTasks: safeTasks.length,
        proofSignals: safeProofSignals.length,
        completedScans: safeScans.length,
        averageScore: scoreVals.length ? Math.round(scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length) : 0,
      };

      return {
        selectedProject,
        latestReports: safeReports,
        openTasks: safeTasks,
        proofSignals: safeProofSignals,
        scans: safeScans,
        failedGates,
        latestScores,
        passport,
      };
    } catch {
      return EMPTY;
    }
  }

  static formatMemoryForPrompt(memory: MemoryContext): string {
    const out: string[] = [];

    if (memory.selectedProject) {
      const p = memory.selectedProject;
      const stage = String(p.stage ?? "unknown");
      const idea = String(p.idea ?? p.description ?? "No description");
      out.push(`## Active Project\nName: ${String(p.name ?? "Untitled")}\nStage: ${stage}\nIdea: ${idea}`);
    }

    if (Object.keys(memory.latestScores).length > 0) {
      const scoreLines = Object.entries(memory.latestScores)
        .map(([k, v]) => `  ${k}: ${v}/100`)
        .join("\n");
      const avg = memory.passport.averageScore;
      const trend = avg >= 70 ? "strong" : avg >= 50 ? "developing" : "weak";
      out.push(`## Intelligence Scores (${trend} overall — avg ${avg}/100)\n${scoreLines}`);
    }

    if (memory.latestReports.length > 0) {
      out.push(`## Report History (${memory.latestReports.length} total)`);
      memory.latestReports.slice(0, 8).forEach((r) => {
        const created = r.created_at ? new Date(String(r.created_at)).toLocaleDateString() : "unknown date";
        const score = typeof r.score === "number" ? ` — score: ${r.score}/100` : "";
        const tool = String(r.tool ?? "report");
        const title = String(r.title ?? "Untitled");
        const payload = extractPayload(r);
        const data = (payload.data ?? payload) as Record<string, unknown>;
        const verdict = String(data.verdict ?? data.go_signal ?? data.go_no_go ?? "");
        const verdictNote = verdict ? ` [${verdict}]` : "";
        out.push(`- [${tool}] ${title}${score}${verdictNote} (${created})`);
      });
    }

    if (memory.openTasks.length > 0) {
      const high = memory.openTasks.filter((t) => String(t.priority) === "high");
      const med = memory.openTasks.filter((t) => String(t.priority) === "medium");
      out.push(`## Open Tasks (${memory.openTasks.length} total — ${high.length} high priority)`);
      high.slice(0, 5).forEach((t) => out.push(`  [HIGH] ${String(t.title ?? "Untitled")}`));
      med.slice(0, 4).forEach((t) => out.push(`  [MED]  ${String(t.title ?? "Untitled")}`));
      if (memory.openTasks.length > 9) out.push(`  ... and ${memory.openTasks.length - 9} more tasks`);
    }

    if (memory.proofSignals.length > 0) {
      const kinds = memory.proofSignals.reduce<Record<string, number>>((acc, s) => {
        const k = String(s.kind ?? "other");
        acc[k] = (acc[k] ?? 0) + 1;
        return acc;
      }, {});
      const kindSummary = Object.entries(kinds).map(([k, n]) => `${k}(${n})`).join(", ");
      out.push(`## Proof Signals (${memory.proofSignals.length} total — ${kindSummary})`);
      memory.proofSignals.slice(0, 5).forEach((s) => {
        const val = typeof s.value === "number" ? ` — value: ${s.value}` : "";
        out.push(`  - ${String(s.label ?? "signal")}${val}`);
      });
    }

    if (memory.failedGates.length > 0) {
      out.push(`## Critical Gate Failures (${memory.failedGates.length} RED gates)`);
      memory.failedGates.slice(0, 3).forEach((g) => {
        out.push(`  - ${String(g.name ?? "gate")}: ${String(g.how_to_fix ?? "needs fixing")}`);
      });
    }

    if (memory.scans.length > 0) {
      out.push(`## Repo Scans (${memory.scans.length})`);
      memory.scans.slice(0, 3).forEach((s) => {
        out.push(`  - ${String(s.file_name ?? "scan")} (${new Date(String(s.created_at ?? "")).toLocaleDateString()})`);
      });
    }

    return out.join("\n\n");
  }
}
