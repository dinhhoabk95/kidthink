import { sql } from "drizzle-orm";
import {
  bigint,
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
import { idPk, timestamps } from "./columns.ts";
import { users } from "./identity.ts";

export const exportJobKindEnum = pgEnum("export_job_kind", ["curriculum_plan"]);

export const exportJobStatusEnum = pgEnum("export_job_status", [
  "queued",
  "processing",
  "done",
  "failed",
]);

export const exportJobs = pgTable(
  "export_jobs",
  {
    id: idPk(),
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
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("idx_export_jobs_uuid").on(table.uuid),
    index("idx_export_jobs_user_id").on(table.userId, table.createdAt.desc()),
    index("idx_export_jobs_status")
      .on(table.status, table.createdAt)
      .where(sql`${table.status} IN ('queued', 'processing')`),
    index("idx_export_jobs_expires_at")
      .on(table.expiresAt)
      .where(sql`${table.expiresAt} IS NOT NULL`),
  ]
);
