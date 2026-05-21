import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const tasksTable = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  projectId: uuid("project_id"),
  sourceReportId: uuid("source_report_id"),
  linkedBlockerId: uuid("linked_blocker_id"),
  title: text("title").notNull(),
  detail: text("detail"),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("todo"),
  category: text("category").notNull().default("development"),
  evidence: text("evidence"),
  targetFilesOrAreas: text("target_files_or_areas"),
  estimatedDifficulty: text("estimated_difficulty"),
  acceptanceCriteria: text("acceptance_criteria"),
  suggestedAiPrompt: text("suggested_ai_prompt"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
