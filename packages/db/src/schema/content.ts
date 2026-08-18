import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
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
import { skills } from "./taxonomy.ts";

export const activityKindEnum = pgEnum("activity_kind", [
  "digital_game",
  "discussion",
  "storytelling",
  "movement",
  "manipulative",
  "worksheet",
  "observation",
  "mini_project",
  "assessment",
  "home_activity",
]);

export const worksheetLayoutTemplateEnum = pgEnum("worksheet_layout_template", [
  "pattern_coloring",
  "pair_matching",
  "group_circling",
  "shape_completion",
  "count_and_color",
  "spot_differences",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const lessons = pgTable(
  "lessons",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    contentVersion: integer("content_version").notNull().default(1),
    title: varchar("title", { length: 200 }).notNull(),
    guide: text("guide"),
    targetAgeMin: smallint("target_age_min"),
    targetAgeMax: smallint("target_age_max"),
    estimatedMinutes: integer("estimated_minutes"),
    materials: text("materials"),
    warmUp: text("warm_up"),
    reflection: text("reflection"),
    assessment: text("assessment"),
    extension: text("extension"),
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
    ...timestamps,
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
    title: varchar("title", { length: 200 }).notNull(),
    instruction: text("instruction"),
    materials: text("materials"),
    estimatedMinutes: integer("estimated_minutes"),
    refType: varchar("ref_type", { length: 50 }),
    refId: bigint("ref_id", { mode: "number" }),
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
    ...timestamps,
  },
  (table) => [
    // Cặp đa hình: index, không khoá ngoại (BR-DM-04).
    index("idx_activities_ref").on(table.refType, table.refId),

    unique("activities_code_version_unique").on(
      table.code,
      table.contentVersion
    ),
    uniqueIndex("idx_activities_published_code")
      .on(table.code)
      .where(sql`${table.status} = 'published'`),
    index("idx_activities_entity_id").on(table.entityId),
    check("check_activities_code_format", sql`${table.code} ~ '^ACT-\\d{4}$'`),
    check(
      "check_activities_estimated_minutes",
      sql`${table.estimatedMinutes} >= 2 AND ${table.estimatedMinutes} <= 20`
    ),
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Pivot: PK ghép theo hai cột khoá ngoại, không có id riêng.
    primaryKey({ columns: [table.lessonId, table.activityId] }),
    // Thứ tự trong lesson vẫn phải duy nhất — trước đây nó là PK.
    unique("lesson_activities_lesson_position_unique").on(
      table.lessonId,
      table.position
    ),
    index("idx_lesson_activities_activity_id").on(table.activityId),
  ]
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
    title: varchar("title", { length: 200 }).notNull(),
    layoutTemplate: worksheetLayoutTemplateEnum("layout_template")
      .notNull()
      .default("pattern_coloring"),
    contentBlocks: jsonb("content_blocks"),
    instructions: text("instructions"),
    learningObjectiveIds: jsonb("learning_objective_ids").default(
      sql`'[]'::jsonb`
    ),
    pdfPath: text("pdf_path"),
    previewPath: text("preview_path"),
    renderJobId: varchar("render_job_id", { length: 100 }),
    renderStatus: varchar("render_status", { length: 50 }).default("pending"),
    renderInputHash: varchar("render_input_hash", { length: 64 }),
    sourceContentVersion: integer("source_content_version"),
    renderPageCount: integer("render_page_count"),
    renderGrayscalePassed: boolean("render_grayscale_passed"),
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
    ...timestamps,
  },
  (table) => [
    unique("worksheets_code_version_unique").on(
      table.code,
      table.contentVersion
    ),
    uniqueIndex("idx_worksheets_published_code")
      .on(table.code)
      .where(sql`${table.status} = 'published'`),
    index("idx_worksheets_entity_id").on(table.entityId),
    check("check_worksheets_code_format", sql`${table.code} ~ '^WS-\\d{4}$'`),
  ]
);

export const seoPageTypeEnum = pgEnum("seo_page_type", [
  "competency",
  "skill",
  "age_program",
  "topic",
  "static",
]);

export const seoPages = pgTable(
  "seo_pages",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    slug: varchar("slug", { length: 200 }).notNull(),
    contentVersion: integer("content_version").notNull().default(1),
    pageType: seoPageTypeEnum("page_type").notNull(),
    title: varchar("title", { length: 300 }).notNull(),
    metaDescription: text("meta_description").notNull(),
    h1: varchar("h1", { length: 300 }),
    body: text("body"),
    ogImagePath: text("og_image_path"),
    canonicalUrl: text("canonical_url"),
    noindex: boolean("noindex").notNull().default(false),
    relatedContentRefs: jsonb("related_content_refs").default(sql`'[]'::jsonb`),
    faqItems: jsonb("faq_items").default(sql`'[]'::jsonb`),
    accessTier: accessTierEnum("access_tier").notNull().default("free"),
    status: contentLifecycleStatusEnum("status").notNull().default("draft"),
    redirectFrom: text("redirect_from"),
    createdByManagerId: bigint("created_by_manager_id", {
      mode: "number",
    }).references(() => managers.id),
    reviewedByManagerId: bigint("reviewed_by_manager_id", {
      mode: "number",
    }).references(() => managers.id),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    unique("seo_pages_slug_version_unique").on(
      table.slug,
      table.contentVersion
    ),
    uniqueIndex("idx_seo_pages_published_slug")
      .on(table.slug)
      .where(sql`${table.status} = 'published'`),
  ]
);

export const actionSuggestionKindEnum = pgEnum("action_suggestion_kind", [
  "home_activity",
  "in_app",
]);

export const skillActionSuggestions = pgTable(
  "skill_action_suggestions",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    skillId: bigint("skill_id", { mode: "number" })
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    orderNo: smallint("order_no").notNull().default(1),
    text: text("text").notNull(),
    kind: actionSuggestionKindEnum("kind").notNull().default("home_activity"),
    refEntityId: bigint("ref_entity_id", { mode: "number" }),
    status: contentLifecycleStatusEnum("status").notNull().default("published"),
    origin: contentOriginEnum("origin").notNull().default("human"),
    authoredIn: authoredInEnum("authored_in").notNull().default("repo_seed"),
    seedBatchId: bigint("seed_batch_id", { mode: "number" }),
    createdByManagerId: bigint("created_by_manager_id", {
      mode: "number",
    }).references(() => managers.id),
    reviewedByManagerId: bigint("reviewed_by_manager_id", {
      mode: "number",
    }).references(() => managers.id),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    unique("skill_action_suggestions_skill_order_unique").on(
      table.skillId,
      table.orderNo
    ),
  ]
);
