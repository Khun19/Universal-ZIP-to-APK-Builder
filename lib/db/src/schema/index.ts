// Export your models here. Add one export per file
// export * from "./posts";
//
// Each model/table should ideally be split into different files.
// Each model/table should define a Drizzle table, insert schema, and types:
//
//   import { pgTable, text, serial } from "drizzle-orm/pg-core";
//   import { createInsertSchema } from "drizzle-zod";
//   import { z } from "zod/v4";
//
//   export const postsTable = pgTable("posts", {
//     id: serial("id").primaryKey(),
//     title: text("title").notNull(),
//   });
//
//   export const insertPostSchema = createInsertSchema(postsTable).omit({ id: true });
//   export type InsertPost = z.infer<typeof insertPostSchema>;
//   export type Post = typeof postsTable.$inferSelect;

import { pgTable, text, integer, timestamp, jsonb, index } from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  fileSize: integer("file_size").notNull().default(0),
  uploadStatus: text("upload_status").notNull().default("PENDING"),
  analysisStatus: text("analysis_status").notNull().default("PENDING"),
  uploadPath: text("upload_path"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({ createdAtIdx: index("projects_created_at_idx").on(table.createdAt) }));

export const analysisResults = pgTable("analysis_results", {
  projectId: text("project_id").primaryKey().references(() => projects.id),
  result: jsonb("result").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const buildJobs = pgTable("build_jobs", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id),
  status: text("status").notNull().default("QUEUED"),
  progress: integer("progress").notNull().default(0),
  logs: jsonb("logs").notNull().default([]),
  error: text("error"),
  artifactId: text("artifact_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({ projectIdx: index("build_jobs_project_idx").on(table.projectId) }));

export const artifacts = pgTable("artifacts", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id),
  buildJobId: text("build_job_id").notNull().references(() => buildJobs.id),
  filePath: text("file_path").notNull(),
  size: integer("size").notNull(),
  sha256: text("sha256").notNull(),
  applicationId: text("application_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});