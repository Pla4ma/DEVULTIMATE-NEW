import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const tasksTable = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  projectId: uuid("project_id"),
  sourceReportId: uuid("source_report_id"),
  title: text("title").notNull(),
  detail: text("detail"),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("todo"),
  category: text("category").notNull().default("development"),
  acceptanceCriteria: text("acceptance_criteria"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
