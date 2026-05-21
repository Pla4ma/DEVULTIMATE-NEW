import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const BLOCKER_SEVERITIES = ["P0", "P1", "P2"] as const;
export type BlockerSeverity = (typeof BLOCKER_SEVERITIES)[number];

export const BLOCKER_CATEGORIES = [
  "security",
  "performance",
  "testing",
  "deployment",
  "docs",
  "code",
  "privacy",
  "billing",
] as const;
export type BlockerCategory = (typeof BLOCKER_CATEGORIES)[number];

export const BLOCKER_STATUSES = ["open", "in_progress", "fixed", "ignored"] as const;
export type BlockerStatus = (typeof BLOCKER_STATUSES)[number];

export const blockersTable = pgTable("blockers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  projectId: uuid("project_id").notNull(),
  scanId: uuid("scan_id"),
  title: text("title").notNull(),
  severity: text("severity").notNull().default("P1"),
  category: text("category").notNull().default("code"),
  evidence: text("evidence"),
  whyItMatters: text("why_it_matters"),
  recommendedFix: text("recommended_fix"),
  acceptanceCriteria: text("acceptance_criteria"),
  status: text("status").notNull().default("open"),
  linkedTaskId: uuid("linked_task_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
