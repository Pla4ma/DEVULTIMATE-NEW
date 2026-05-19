export interface DraftTask {
  title: string;
  detail?: string;
  priority: "high" | "medium" | "low";
  category: string;
  acceptance_criteria?: string[];
  sourceReportId?: string;
  projectId?: string | null;
}
