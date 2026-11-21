import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { childProfiles } from "./child.ts";
import { idPk, timestamps } from "./columns.ts";
import {
  curriculumProgressStatusEnum,
  enrollmentStatusEnum,
} from "./curriculum.ts";
import { users } from "./identity.ts";
import { contentEntityTypeEnum } from "./tagging.ts";

export const personalCurriculumStatusEnum = pgEnum(
  "personal_curriculum_status",
  ["draft", "ready"]
);

export const personalCurricula = pgTable(
  "personal_curricula",
  {
    id: idPk(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    ageMin: smallint("age_min"),
    ageMax: smallint("age_max"),
    durationWeeks: smallint("duration_weeks").notNull().default(8),
    sessionsPerWeek: smallint("sessions_per_week").notNull().default(3),
    status: personalCurriculumStatusEnum("status").notNull().default("draft"),
    version: integer("version").notNull().default(1),
    ...timestamps(),
  },
  (table) => [index("idx_personal_curricula_user_id").on(table.userId)]
);

export const personalCurriculumItems = pgTable(
  "personal_curriculum_items",
  {
    id: idPk(),
    personalCurriculumId: bigint("personal_curriculum_id", { mode: "number" })
      .notNull()
      .references(() => personalCurricula.id, { onDelete: "cascade" }),
    weekNo: smallint("week_no").notNull(),
    sessionNo: smallint("session_no").notNull(),
    position: smallint("position").notNull(),
    entityType: contentEntityTypeEnum("entity_type").notNull(),
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    isRequired: boolean("is_required").notNull().default(true),
    ...timestamps(),
  },
  (table) => [
    // Cặp đa hình: index, không khoá ngoại (BR-DM-04).
    index("idx_personal_curriculum_items_entity").on(
      table.entityType,
      table.entityId
    ),
    // UNIQUE (personal_curriculum_id, week_no, session_no, position) đã phủ
    // tra cứu theo (personal_curriculum_id, week_no).
    unique("personal_curriculum_items_week_session_pos_unique").on(
      table.personalCurriculumId,
      table.weekNo,
      table.sessionNo,
      table.position
    ),
  ]
);

export const personalCurriculumEnrollments = pgTable(
  "personal_curriculum_enrollments",
  {
    id: idPk(),
    childId: bigint("child_id", { mode: "number" })
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    personalCurriculumId: bigint("personal_curriculum_id", { mode: "number" })
      .notNull()
      .references(() => personalCurricula.id, { onDelete: "cascade" }),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    status: enrollmentStatusEnum("status").notNull().default("active"),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("idx_personal_curriculum_enrollments_child_active_unique")
      .on(table.childId)
      .where(sql`${table.status} = 'active'`),
    index("idx_personal_curriculum_enrollments_child_status").on(
      table.childId,
      table.status
    ),
    index("idx_personal_curriculum_enrollments_curriculum_id").on(
      table.personalCurriculumId
    ),
  ]
);

export const personalCurriculumItemProgress = pgTable(
  "personal_curriculum_item_progress",
  {
    id: idPk(),
    enrollmentId: bigint("enrollment_id", { mode: "number" })
      .notNull()
      .references(() => personalCurriculumEnrollments.id, {
        onDelete: "cascade",
      }),
    childId: bigint("child_id", { mode: "number" })
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    personalCurriculumItemId: bigint("personal_curriculum_item_id", {
      mode: "number",
    })
      .notNull()
      .references(() => personalCurriculumItems.id, { onDelete: "cascade" }),
    status: curriculumProgressStatusEnum("status")
      .notNull()
      .default("not_started"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
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
