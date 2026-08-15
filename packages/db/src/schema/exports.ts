import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./identity.ts";

export const exportJobKindEnum = pgEnum("export_job_kind", [
  "lesson_plan",
  "worksheet",
  "curriculum_plan",
]);

export const exportJobStatusEnum = pgEnum("export_job_status", [
  "queued",
  "processing",
  "done",
  "failed",
]);

export const exportJobs = pgTable(
  "export_jobs",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    uuid: uuid("uuid").defaultRandom().notNull(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: exportJobKindEnum("kind").notNull(),
    refId: varchar("ref_id", { length: 200 }).notNull(),
    status: exportJobStatusEnum("status").notNull().default("queued"),
    filePath: text("file_path"),
    pageCount: integer("page_count"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_export_jobs_uuid").on(table.uuid),
    index("idx_export_jobs_user_id").on(table.userId),
    index("idx_export_jobs_status").on(table.status),
    index("idx_export_jobs_expires_at").on(table.expiresAt),
    check(
      "check_export_jobs_page_count",
      sql`${table.pageCount} IS NULL OR (${table.pageCount} >= 1 AND ${table.pageCount} <= 20)`
    ),
  ]
);
