export interface DraftTask {
  title: string;
  detail?: string;
  priority: "high" | "medium" | "low";
  category: string;
  evidence?: string;
  targetFilesOrAreas?: string;
  estimatedDifficulty?: string;
  acceptanceCriteria?: string[];
  suggestedAiPrompt?: string;
  linkedBlockerId?: string;
  sourceReportId?: string;
  projectId?: string | null;
}
