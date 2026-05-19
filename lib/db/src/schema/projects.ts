import { pgTable, uuid, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const projectsTable = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  idea: text("idea"),
  stage: text("stage").notNull().default("idea"),
  status: text("status").notNull().default("active"),
  meta: jsonb("meta").notNull().default("{}"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
