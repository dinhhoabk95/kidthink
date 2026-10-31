import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { childProfiles } from "./child.ts";
import { timestamps } from "./columns.ts";
import { accessTierEnum } from "./game.ts";

export const programTypeEnum = pgEnum("program_type", ["age_based", "journey"]);

export const enrollmentStatusEnum = pgEnum("curriculum_enrollment_status", [
  "active",
  "completed",
  "paused",
  "withdrawn",
  "dropped",
]);

export const curriculumProgressStatusEnum = pgEnum(
  "curriculum_progress_status",
  ["not_started", "in_progress", "completed", "skipped"]
);

export const curricula = pgTable(
  "curricula",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    code: varchar("code", { length: 50 }).notNull().unique(),
    programType: programTypeEnum("program_type").notNull().default("age_based"),
    targetAgeMin: smallint("target_age_min"),
    targetAgeMax: smallint("target_age_max"),
    durationWeeks: smallint("duration_weeks").notNull().default(8),
    sessionsPerWeek: smallint("sessions_per_week").notNull().default(3),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    accessTier: accessTierEnum("access_tier").notNull(),
    ...timestamps(),
  },
  (table) => [
    check(
      "check_curricula_code_format",
      sql`${table.code} ~ '^CUR-[A-Za-z0-9_-]+$'`
    ),
  ]
);

export const curriculumWeeks = pgTable(
  "curriculum_weeks",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    curriculumId: bigint("curriculum_id", { mode: "number" })
      .notNull()
      .references(() => curricula.id, { onDelete: "cascade" }),
    weekNo: smallint("week_no").notNull(),
    goal: text("goal").notNull(),
    ...timestamps(),
  },
  (table) => [
    unique("curriculum_weeks_curriculum_id_week_no_unique").on(
      table.curriculumId,
      table.weekNo
    ),
  ]
);

export const curriculumItems = pgTable(
  "curriculum_items",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    curriculumId: bigint("curriculum_id", { mode: "number" })
      .notNull()
      .references(() => curricula.id, { onDelete: "cascade" }),
    weekNo: smallint("week_no").notNull(),
    sessionNo: smallint("session_no").notNull(),
    position: smallint("position").notNull(),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    isRequired: boolean("is_required").notNull().default(true),
    ...timestamps(),
  },
  (table) => [
    // Cặp đa hình: index, không khoá ngoại (BR-DM-04).
    index("idx_curriculum_items_entity").on(table.entityType, table.entityId),

    unique("curriculum_items_curriculum_week_session_pos_unique").on(
      table.curriculumId,
      table.weekNo,
      table.sessionNo,
      table.position
    ),
  ]
);

export const curriculumEnrollments = pgTable(
  "curriculum_enrollments",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    childId: bigint("child_id", { mode: "number" })
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    curriculumId: bigint("curriculum_id", { mode: "number" })
      .notNull()
      .references(() => curricula.id),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    status: enrollmentStatusEnum("status").notNull().default("active"),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("idx_curriculum_enrollments_child_active_unique")
      .on(table.childId)
      .where(sql`${table.status} = 'active'`),
    index("idx_curriculum_enrollments_child_status").on(
      table.childId,
      table.status
    ),
    index("idx_curriculum_enrollments_curriculum_id").on(table.curriculumId),
  ]
);

export const curriculumItemProgress = pgTable(
  "curriculum_item_progress",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    enrollmentId: bigint("enrollment_id", { mode: "number" })
      .notNull()
      .references(() => curriculumEnrollments.id, { onDelete: "cascade" }),
    childId: bigint("child_id", { mode: "number" })
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    curriculumItemId: bigint("curriculum_item_id", { mode: "number" })
      .notNull()
      .references(() => curriculumItems.id, { onDelete: "cascade" }),
    status: curriculumProgressStatusEnum("status")
      .notNull()
      .default("not_started"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [
    unique("curriculum_item_progress_enrollment_item_unique").on(
      table.enrollmentId,
      table.curriculumItemId
    ),
    index("idx_curriculum_item_progress_child_id").on(table.childId),
    index("idx_curriculum_item_progress_enrollment_status").on(
      table.enrollmentId,
      table.status
    ),
  ]
);
