import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import {
  accessTierEnum,
  authoredInEnum,
  contentLifecycleStatusEnum,
  contentOriginEnum,
} from "./game.ts";
import { managers } from "./identity.ts";

export const curricula = pgTable(
  "curricula",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    contentVersion: integer("content_version").notNull().default(1),
    titleVi: varchar("title_vi", { length: 200 }).notNull(),
    descriptionVi: text("description_vi"),
    accessTier: accessTierEnum("access_tier").notNull(),
    status: contentLifecycleStatusEnum("status").notNull().default("draft"),
    origin: contentOriginEnum("origin").notNull().default("human"),
    authoredIn: authoredInEnum("authored_in").notNull().default("studio"),
    seedBatchId: bigint("seed_batch_id", { mode: "number" }),
    createdByManagerId: bigint("created_by_manager_id", {
      mode: "number",
    }).references(() => managers.id),
    reviewedByManagerId: bigint("reviewed_by_manager_id", {
      mode: "number",
    }).references(() => managers.id),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("curricula_code_version_unique").on(
      table.code,
      table.contentVersion
    ),
    uniqueIndex("idx_curricula_published_code")
      .on(table.code)
      .where(sql`${table.status} = 'published'`),
    check("check_curricula_code_format", sql`${table.code} ~ '^CUR-\\d{3}$'`),
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
    position: integer("position").notNull(),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    isOptional: boolean("is_optional").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("curriculum_items_curriculum_id_position_unique").on(
      table.curriculumId,
      table.position
    ),
  ]
);

export const curriculumEnrollments = pgTable("curriculum_enrollments", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  childId: bigint("child_id", { mode: "number" }).notNull(),
  curriculumId: bigint("curriculum_id", { mode: "number" })
    .notNull()
    .references(() => curricula.id),
  enrolledAt: timestamp("enrolled_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
});

export const curriculumItemProgress = pgTable("curriculum_item_progress", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  enrollmentId: bigint("enrollment_id", { mode: "number" })
    .notNull()
    .references(() => curriculumEnrollments.id, { onDelete: "cascade" }),
  childId: bigint("child_id", { mode: "number" }).notNull(),
  curriculumItemId: bigint("curriculum_item_id", { mode: "number" })
    .notNull()
    .references(() => curriculumItems.id),
  status: varchar("status", { length: 20 }).notNull().default("not_started"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
