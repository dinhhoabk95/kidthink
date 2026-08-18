import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
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
import {
  curriculumProgressStatusEnum,
  enrollmentStatusEnum,
} from "./curriculum.ts";
import { users } from "./identity.ts";

export const personalCurriculumStatusEnum = pgEnum(
  "personal_curriculum_status",
  ["draft", "ready"]
);

export const personalCurricula = pgTable(
  "personal_curricula",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_personal_curricula_user_id").on(table.userId),
    uniqueIndex("idx_personal_curricula_uuid").on(table.uuid),
    check(
      "check_personal_curricula_age_range",
      sql`${table.ageMin} IS NULL OR ${table.ageMax} IS NULL OR ${table.ageMin} <= ${table.ageMax}`
    ),
    check("check_personal_curricula_duration", sql`${table.durationWeeks} > 0`),
    check(
      "check_personal_curricula_sessions",
      sql`${table.sessionsPerWeek} > 0`
    ),
  ]
);

export const personalCurriculumItems = pgTable(
  "personal_curriculum_items",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    personalCurriculumId: bigint("personal_curriculum_id", { mode: "number" })
      .notNull()
      .references(() => personalCurricula.id, { onDelete: "cascade" }),
    weekNo: smallint("week_no").notNull(),
    sessionNo: smallint("session_no").notNull(),
    position: smallint("position").notNull(),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    isRequired: boolean("is_required").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Cặp đa hình: index, không khoá ngoại (BR-DM-04).
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
    index("idx_personal_curriculum_items_curriculum_week").on(
      table.personalCurriculumId,
      table.weekNo
    ),
    index("idx_personal_curriculum_items_entity_id").on(table.entityId),
  ]
);

export const personalCurriculumEnrollments = pgTable(
  "personal_curriculum_enrollments",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_personal_curriculum_enrollments_child_active_unique")
      .on(table.childId)
      .where(sql`${table.status} = 'active'`),
    index("idx_personal_curriculum_enrollments_child_id").on(table.childId),
    index("idx_personal_curriculum_enrollments_curriculum_id").on(
      table.personalCurriculumId
    ),
  ]
);

export const personalCurriculumItemProgress = pgTable(
  "personal_curriculum_item_progress",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
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
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("personal_curriculum_item_progress_enrollment_item_unique").on(
      table.enrollmentId,
      table.personalCurriculumItemId
    ),
    index("idx_personal_curriculum_item_progress_child_id").on(table.childId),
    index("idx_personal_curriculum_item_progress_status").on(
      table.enrollmentId,
      table.status
    ),
  ]
);
