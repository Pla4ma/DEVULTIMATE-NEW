import { create } from "zustand";
import { getReports, getTasks, getProjects, getProofSignals } from "@/lib/repository";
import type { ReportRecord, TaskRecord, ProjectRecord, ProofSignalRecord } from "@/lib/repository";

export type Project = ProjectRecord;
export type Task = TaskRecord;
export type ProofSignal = ProofSignalRecord;
export type ReportSummary = ReportRecord;

interface DataState {
  reports: ReportSummary[];
  tasks: Task[];
  projects: Project[];
  signals: ProofSignal[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;

  fetchAll: () => Promise<void>;
  fetchReports: () => Promise<void>;
  fetchTasks: () => Promise<void>;
  fetchProjects: () => Promise<void>;
  fetchSignals: () => Promise<void>;

  addReport: (report: ReportSummary) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  addProject: (project: Project) => void;
  addSignal: (signal: ProofSignal) => void;

  clearAll: () => void;
}

export const useDataStore = create<DataState>()((set, get) => ({
  reports: [],
  tasks: [],
  projects: [],
  signals: [],
  loading: false,
  error: null,
  lastFetched: null,

  fetchAll: async () => {
    const now = Date.now();
    const lastFetched = get().lastFetched;
    if (lastFetched && now - lastFetched < 30000) return;

    set({ loading: true, error: null });
    try {
      const [reports, tasks, projects, signals] = await Promise.all([
        getReports().catch((e) => { console.error("[data-store] fetchReports failed:", e); return []; }),
        getTasks().catch((e) => { console.error("[data-store] fetchTasks failed:", e); return []; }),
        getProjects().catch((e) => { console.error("[data-store] fetchProjects failed:", e); return []; }),
        getProofSignals().catch((e) => { console.error("[data-store] fetchSignals failed:", e); return []; }),
      ]);
      set({
        reports: reports ?? [],
        tasks: tasks ?? [],
        projects: projects ?? [],
        signals: signals ?? [],
        loading: false,
        lastFetched: now,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load data";
      console.error("[data-store] fetchAll failed:", message);
      set({ loading: false, error: message });
    }
  },

  fetchReports: async () => {
    try {
      const reports = await getReports();
      set({ reports: reports ?? [] });
    } catch (e) {
      console.error("[data-store] fetchReports failed:", e);
    }
  },

  fetchTasks: async () => {
    try {
      const tasks = await getTasks();
      set({ tasks: tasks ?? [] });
    } catch (e) {
      console.error("[data-store] fetchTasks failed:", e);
    }
  },

  fetchProjects: async () => {
    try {
      const projects = await getProjects();
      set({ projects: projects ?? [] });
    } catch (e) {
      console.error("[data-store] fetchProjects failed:", e);
    }
  },

  fetchSignals: async () => {
    try {
      const signals = await getProofSignals();
      set({ signals: signals ?? [] });
    } catch (e) {
      console.error("[data-store] fetchSignals failed:", e);
    }
  },

  addReport: (report) => set((s) => ({ reports: [report, ...s.reports] })),
  addTask: (task) => set((s) => ({ tasks: [task, ...s.tasks] })),
  updateTask: (id, updates) => set((s) => ({
    tasks: s.tasks.map((t) => t.id === id ? { ...t, ...updates } : t),
  })),
  removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
  addProject: (project) => set((s) => ({ projects: [project, ...s.projects] })),
  addSignal: (signal) => set((s) => ({ signals: [signal, ...s.signals] })),

  clearAll: () => set({ reports: [], tasks: [], projects: [], signals: [], lastFetched: null }),
}));
