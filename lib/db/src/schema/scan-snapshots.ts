import { pgTable, uuid, text, jsonb, timestamp, integer } from "drizzle-orm/pg-core";

export const scanSnapshotsTable = pgTable("scan_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  projectId: uuid("project_id").notNull(),
  reportId: uuid("report_id"),
  score: integer("score"),
  blockers: jsonb("blockers").notNull().default("[]"),
  staticSignals: jsonb("static_signals").notNull().default("{}"),
  generatedTasks: jsonb("generated_tasks").notNull().default("[]"),
  evidenceIndex: jsonb("evidence_index").notNull().default("[]"),
  summary: text("summary"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
