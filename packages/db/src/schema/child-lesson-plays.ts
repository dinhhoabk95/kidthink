import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { childProfiles } from "./child.ts";
import { timestamps } from "./columns.ts";
import { lessons } from "./content.ts";

/** Một bước trong kế hoạch đã chụp của lượt học (`child-lesson-flow.md` §7.1). */
export interface ChildLessonStepSnapshot {
  readonly kind: "intro" | "game";
  readonly level_code: string;
}

/**
 * Lượt trẻ tự học một bài (`child-lesson-flow.md`, `BR-CLF-02..04`).
 *
 * Tách khỏi `lesson_runs` có chủ đích: `lesson_runs` là phiên người lớn dẫn
 * (`BR-LSR-*`), resume theo user và bước do người dạy bấm. Ở đây tiến độ suy
 * từ `play_sessions`, không có con trỏ bước.
 */
export const childLessonPlays = pgTable(
  "child_lesson_plays",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),
    childProfileId: bigint("child_profile_id", { mode: "number" })
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    lessonId: bigint("lesson_id", { mode: "number" })
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    contentVersion: integer("content_version").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("in_progress"),
    steps: jsonb("steps").$type<readonly ChildLessonStepSnapshot[]>().notNull(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [
    check(
      "check_child_lesson_plays_status",
      sql`${table.status} IN ('in_progress', 'completed')`
    ),
    // Một lượt dở cho mỗi (trẻ, bài) — `BR-CLF-04`.
    uniqueIndex("uq_child_lesson_plays_in_progress")
      .on(table.childProfileId, table.lessonId)
      .where(sql`${table.status} = 'in_progress'`),
    index("idx_child_lesson_plays_child").on(table.childProfileId),
  ]
);
