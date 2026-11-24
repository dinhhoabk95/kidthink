import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  unique,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import {
  type AccessTier,
  type ContentEntityType,
  CURRICULUM_PROGRESS_STATUS,
  type CurriculumProgressStatus,
  ENROLLMENT_STATUS,
  type EnrollmentStatus,
  PROGRAM_TYPE,
  type ProgramType,
} from "#src/constants/learning-enums";
import { childProfiles } from "./child.ts";
import { idPk, nowTimestampMs, timestampMs, timestamps } from "./columns.ts";

export const curricula = sqliteTable("curricula", {
  id: idPk(),
  code: text("code").notNull().unique(),
  programType: integer("program_type")
    .$type<ProgramType>()
    .notNull()
    .default(PROGRAM_TYPE.AGE_BASED),
  targetAgeMin: integer("target_age_min"),
  targetAgeMax: integer("target_age_max"),
  durationWeeks: integer("duration_weeks").notNull().default(8),
  sessionsPerWeek: integer("sessions_per_week").notNull().default(3),
  title: text("title").notNull(),
  description: text("description"),
  accessTier: integer("access_tier").$type<AccessTier>().notNull(),
  ...timestamps(),
});

export const curriculumWeeks = sqliteTable(
  "curriculum_weeks",
  {
    id: idPk(),
    curriculumId: integer("curriculum_id")
      .notNull()
      .references(() => curricula.id, { onDelete: "cascade" }),
    weekNo: integer("week_no").notNull(),
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

export const curriculumItems = sqliteTable(
  "curriculum_items",
  {
    id: idPk(),
    curriculumId: integer("curriculum_id")
      .notNull()
      .references(() => curricula.id, { onDelete: "cascade" }),
    weekNo: integer("week_no").notNull(),
    sessionNo: integer("session_no").notNull(),
    position: integer("position").notNull(),
    entityType: integer("entity_type").$type<ContentEntityType>().notNull(),
    entityId: integer("entity_id").notNull(),
    isRequired: integer("is_required", { mode: "boolean" })
      .notNull()
      .default(true),
    ...timestamps(),
  },
  (table) => [
    index("idx_curriculum_items_entity").on(table.entityType, table.entityId),
    unique("curriculum_items_curriculum_week_session_pos_unique").on(
      table.curriculumId,
      table.weekNo,
      table.sessionNo,
      table.position
    ),
  ]
);

export const curriculumEnrollments = sqliteTable(
  "curriculum_enrollments",
  {
    id: idPk(),
    childId: integer("child_id")
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    curriculumId: integer("curriculum_id")
      .notNull()
      .references(() => curricula.id, { onDelete: "restrict" }),
    enrolledAt: nowTimestampMs("enrolled_at"),
    status: integer("status")
      .$type<EnrollmentStatus>()
      .notNull()
      .default(ENROLLMENT_STATUS.ACTIVE),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("idx_curriculum_enrollments_child_active_unique")
      .on(table.childId)
      .where(sql.raw(`"status" = ${ENROLLMENT_STATUS.ACTIVE}`)),
    index("idx_curriculum_enrollments_child_status").on(
      table.childId,
      table.status
    ),
    index("idx_curriculum_enrollments_curriculum_id").on(table.curriculumId),
  ]
);

export const curriculumItemProgress = sqliteTable(
  "curriculum_item_progress",
  {
    id: idPk(),
    enrollmentId: integer("enrollment_id")
      .notNull()
      .references(() => curriculumEnrollments.id, { onDelete: "cascade" }),
    childId: integer("child_id")
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    curriculumItemId: integer("curriculum_item_id")
      .notNull()
      .references(() => curriculumItems.id, { onDelete: "cascade" }),
    status: integer("status")
      .$type<CurriculumProgressStatus>()
      .notNull()
      .default(CURRICULUM_PROGRESS_STATUS.NOT_STARTED),
    completedAt: timestampMs("completed_at"),
    ...timestamps(),
  },
  (table) => [
    unique("curriculum_item_progress_enrollment_item_unique").on(
      table.enrollmentId,
      table.curriculumItemId
    ),
    index("idx_curriculum_item_progress_child_id").on(table.childId),
    index("idx_curriculum_item_progress_item_id").on(table.curriculumItemId),
    index("idx_curriculum_item_progress_enrollment_status").on(
      table.enrollmentId,
      table.status
    ),
  ]
);
