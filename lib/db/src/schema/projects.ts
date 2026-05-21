import { pgTable, uuid, text, jsonb, timestamp, integer } from "drizzle-orm/pg-core";

export const PROJECT_LIFECYCLE_STAGES = [
  "IDEA",
  "PLANNED",
  "BUILDING",
  "SCANNED",
  "FIXING",
  "READY_SOON",
  "LAUNCH_READY",
  "LAUNCHED",
] as const;

export type ProjectLifecycleStage = (typeof PROJECT_LIFECYCLE_STAGES)[number];

export const projectsTable = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  idea: text("idea"),
  stage: text("stage").notNull().default("IDEA"),
  status: text("status").notNull().default("active"),
  launchReadinessScore: integer("launch_readiness_score"),
  scanCount: integer("scan_count").notNull().default(0),
  lastScanAt: timestamp("last_scan_at", { withTimezone: true }),
  meta: jsonb("meta").notNull().default("{}"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
