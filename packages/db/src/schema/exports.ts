import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import {
  EXPORT_JOB_STATUS,
  type ExportJobKind,
  type ExportJobStatus,
} from "#src/constants/learning-enums";
import { idPk, timestampMs, timestamps, uuidCol } from "./columns.ts";
import { users } from "./identity.ts";

export const exportJobs = sqliteTable(
  "export_jobs",
  {
    id: idPk(),
    uuid: uuidCol("uuid"),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: integer("kind").$type<ExportJobKind>().notNull(),
    refId: text("ref_id").notNull(),
    status: integer("status")
      .$type<ExportJobStatus>()
      .notNull()
      .default(EXPORT_JOB_STATUS.QUEUED),
    filePath: text("file_path"),
    pageCount: integer("page_count"),
    expiresAt: timestampMs("expires_at"),
    error: text("error"),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("idx_export_jobs_uuid").on(table.uuid),
    index("idx_export_jobs_user_id").on(table.userId, table.createdAt),
    index("idx_export_jobs_status")
      .on(table.status, table.createdAt)
      .where(
        sql.raw(
          `"status" IN (${EXPORT_JOB_STATUS.QUEUED}, ${EXPORT_JOB_STATUS.PROCESSING})`
        )
      ),
    index("idx_export_jobs_expires_at")
      .on(table.expiresAt)
      .where(sql`${table.expiresAt} IS NOT NULL`),
  ]
);
