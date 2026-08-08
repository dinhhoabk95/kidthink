import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
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

export const activityKindEnum = pgEnum("activity_kind", [
  "digital_game",
  "worksheet",
  "hands_on",
  "story",
  "discussion",
  "movement",
  "song",
  "art",
  "reflection",
  "custom",
]);

export const imageOwnerTypeEnum = pgEnum("image_owner_type", [
  "game_level",
  "lesson",
  "activity",
  "worksheet",
  "user_avatar",
  "manager_avatar",
]);

export const lessons = pgTable(
  "lessons",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    contentVersion: integer("content_version").notNull().default(1),
    titleVi: varchar("title_vi", { length: 200 }).notNull(),
    guideVi: text("guide_vi"),
    targetAgeMin: smallint("target_age_min"),
    targetAgeMax: smallint("target_age_max"),
    estimatedMinutes: integer("estimated_minutes"),
    materialsVi: text("materials_vi"),
    warmUpVi: text("warm_up_vi"),
    reflectionVi: text("reflection_vi"),
    assessmentVi: text("assessment_vi"),
    extensionVi: text("extension_vi"),
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
    unique("lessons_code_version_unique").on(table.code, table.contentVersion),
    uniqueIndex("idx_lessons_published_code")
      .on(table.code)
      .where(sql`${table.status} = 'published'`),
    check("check_lessons_code_format", sql`${table.code} ~ '^LES-\\d{4}$'`),
    check(
      "check_lessons_estimated_minutes",
      sql`${table.estimatedMinutes} >= 5 AND ${table.estimatedMinutes} <= 45`
    ),
  ]
);

export const activities = pgTable(
  "activities",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    contentVersion: integer("content_version").notNull().default(1),
    kind: activityKindEnum("kind").notNull(),
    titleVi: varchar("title_vi", { length: 200 }).notNull(),
    instructionVi: text("instruction_vi"),
    estimatedMinutes: integer("estimated_minutes"),
    refType: varchar("ref_type", { length: 50 }),
    refId: bigint("ref_id", { mode: "number" }),
    accessTier: accessTierEnum("access_tier").notNull(),
    status: contentLifecycleStatusEnum("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("activities_code_version_unique").on(
      table.code,
      table.contentVersion
    ),
    uniqueIndex("idx_activities_published_code")
      .on(table.code)
      .where(sql`${table.status} = 'published'`),
    check("check_activities_code_format", sql`${table.code} ~ '^ACT-\\d{4}$'`),
  ]
);

export const lessonActivities = pgTable(
  "lesson_activities",
  {
    lessonId: bigint("lesson_id", { mode: "number" })
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    activityId: bigint("activity_id", { mode: "number" }).notNull(),
    isRequired: boolean("is_required").notNull().default(true),
  },
  (table) => [primaryKey({ columns: [table.lessonId, table.position] })]
);

export const worksheets = pgTable(
  "worksheets",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    contentVersion: integer("content_version").notNull().default(1),
    titleVi: varchar("title_vi", { length: 200 }).notNull(),
    pdfPath: text("pdf_path"),
    previewPath: text("preview_path"),
    accessTier: accessTierEnum("access_tier").notNull(),
    status: contentLifecycleStatusEnum("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("worksheets_code_version_unique").on(
      table.code,
      table.contentVersion
    ),
    uniqueIndex("idx_worksheets_published_code")
      .on(table.code)
      .where(sql`${table.status} = 'published'`),
    check("check_worksheets_code_format", sql`${table.code} ~ '^WS-\\d{4}$'`),
  ]
);

export const contentImages = pgTable("content_images", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  ownerType: imageOwnerTypeEnum("owner_type").notNull(),
  ownerId: bigint("owner_id", { mode: "number" }).notNull(),
  storagePath: text("storage_path").notNull(),
  altTextVi: text("alt_text_vi"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
