import { create } from "zustand";
import { getReports, getTasks, getProjects, getProofSignals } from "@/lib/repository";

interface ReportSummary {
  id: string;
  tool: string;
  title: string;
  summary?: string | null;
  score?: number | null;
  created_at: string;
  payload?: unknown;
}

interface Project {
  id: string;
  name: string;
  stage?: string | null;
  status?: string;
  github_repo?: string | null;
  github_branch?: string | null;
  last_scan_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface Task {
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

interface ProofSignal {
  id: string;
  label: string;
  kind: string;
  value?: number | null;
  weight?: number;
  source?: string | null;
  evidence?: string | null;
  project_id?: string | null;
  created_at?: string;
}

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
        getReports().catch(() => []),
        getTasks().catch(() => []),
        getProjects().catch(() => []),
        getProofSignals().catch(() => []),
      ]);
      set({
        reports: (reports as ReportSummary[]) ?? [],
        tasks: (tasks as Task[]) ?? [],
        projects: (projects as Project[]) ?? [],
        signals: (signals as ProofSignal[]) ?? [],
        loading: false,
        lastFetched: now,
      });
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : "Failed to load data" });
    }
  },

  fetchReports: async () => {
    try {
      const reports = await getReports();
      set({ reports: (reports as ReportSummary[]) ?? [] });
    } catch {}
  },

  fetchTasks: async () => {
    try {
      const tasks = await getTasks();
      set({ tasks: (tasks as Task[]) ?? [] });
    } catch {}
  },

  fetchProjects: async () => {
    try {
      const projects = await getProjects();
      set({ projects: (projects as Project[]) ?? [] });
    } catch {}
  },

  fetchSignals: async () => {
    try {
      const signals = await getProofSignals();
      set({ signals: (signals as ProofSignal[]) ?? [] });
    } catch {}
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
