export interface Task {
  id: string;
  title: string;
  detail?: string;
  priority: "high" | "medium" | "low";
  category: string;
  acceptance_criteria?: string[];
  source_report_id?: string;
  project_id?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface SprintDay {
  day: string;
  goal: string;
  tasks: string[];
  acceptance_criteria: string[];
}

export interface Sprint {
  id: string;
  title: string;
  days: SprintDay[];
  risks: string[];
  demo_checklist: string[];
  duration?: number;
  maxTasksPerDay?: number;
}

export interface DraftTask {
  title: string;
  detail?: string;
  priority: "high" | "medium" | "low";
  category: string;
  acceptance_criteria?: string[];
  sourceReportId?: string;
  projectId?: string | null;
}
