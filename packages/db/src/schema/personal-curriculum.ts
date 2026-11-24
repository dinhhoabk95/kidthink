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
  type ContentEntityType,
  CURRICULUM_PROGRESS_STATUS,
  type CurriculumProgressStatus,
  ENROLLMENT_STATUS,
  type EnrollmentStatus,
  PERSONAL_CURRICULUM_STATUS,
  type PersonalCurriculumStatus,
} from "#src/constants/learning-enums";
import { childProfiles } from "./child.ts";
import {
  idPk,
  nowTimestampMs,
  timestampMs,
  timestamps,
  uuidCol,
} from "./columns.ts";
import { users } from "./identity.ts";

export const personalCurricula = sqliteTable(
  "personal_curricula",
  {
    id: idPk(),
    uuid: uuidCol("uuid").unique(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    ageMin: integer("age_min"),
    ageMax: integer("age_max"),
    durationWeeks: integer("duration_weeks").notNull().default(8),
    sessionsPerWeek: integer("sessions_per_week").notNull().default(3),
    status: integer("status")
      .$type<PersonalCurriculumStatus>()
      .notNull()
      .default(PERSONAL_CURRICULUM_STATUS.DRAFT),
    version: integer("version").notNull().default(1),
    ...timestamps(),
  },
  (table) => [index("idx_personal_curricula_user_id").on(table.userId)]
);

export const personalCurriculumItems = sqliteTable(
  "personal_curriculum_items",
  {
    id: idPk(),
    personalCurriculumId: integer("personal_curriculum_id")
      .notNull()
      .references(() => personalCurricula.id, { onDelete: "cascade" }),
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
    index("idx_personal_curriculum_items_entity").on(
      table.entityType,
      table.entityId
    ),
    unique("personal_curriculum_items_week_session_pos_unique").on(
      table.personalCurriculumId,
      table.weekNo,
      table.sessionNo,
      table.position
    ),
  ]
);

export const personalCurriculumEnrollments = sqliteTable(
  "personal_curriculum_enrollments",
  {
    id: idPk(),
    childId: integer("child_id")
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    personalCurriculumId: integer("personal_curriculum_id")
      .notNull()
      .references(() => personalCurricula.id, { onDelete: "cascade" }),
    enrolledAt: nowTimestampMs("enrolled_at"),
    status: integer("status")
      .$type<EnrollmentStatus>()
      .notNull()
      .default(ENROLLMENT_STATUS.ACTIVE),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("idx_personal_curriculum_enrollments_child_active_unique")
      .on(table.childId)
      .where(sql.raw(`"status" = ${ENROLLMENT_STATUS.ACTIVE}`)),
    index("idx_personal_curriculum_enrollments_child_status").on(
      table.childId,
      table.status
    ),
    index("idx_personal_curriculum_enrollments_curriculum_id").on(
      table.personalCurriculumId
    ),
  ]
);

export const personalCurriculumItemProgress = sqliteTable(
  "personal_curriculum_item_progress",
  {
    id: idPk(),
    enrollmentId: integer("enrollment_id")
      .notNull()
      .references(() => personalCurriculumEnrollments.id, {
        onDelete: "cascade",
      }),
    childId: integer("child_id")
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    personalCurriculumItemId: integer("personal_curriculum_item_id")
      .notNull()
      .references(() => personalCurriculumItems.id, { onDelete: "cascade" }),
    status: integer("status")
      .$type<CurriculumProgressStatus>()
      .notNull()
      .default(CURRICULUM_PROGRESS_STATUS.NOT_STARTED),
    completedAt: timestampMs("completed_at"),
    ...timestamps(),
  },
  (table) => [
    unique("personal_curriculum_item_progress_enrollment_item_unique").on(
      table.enrollmentId,
      table.personalCurriculumItemId
    ),
    index("idx_personal_curriculum_item_progress_child_id").on(table.childId),
    index("idx_personal_curriculum_item_progress_item_id").on(
      table.personalCurriculumItemId
    ),
    index("idx_personal_curriculum_item_progress_status").on(
      table.enrollmentId,
      table.status
    ),
  ]
);
