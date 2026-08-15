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

export const imageOwnerTypeEnum = pgEnum("image_owner_type", [
  "game_level",
  "lesson",
  "activity",
  "worksheet",
  "payment_order",
  "payment_proof",
  "custom_game",
  "user_avatar",
  "manager_avatar",
]);

export const imageVisibilityEnum = pgEnum("image_visibility", [
  "public",
  "private",
]);

export const imageStatusEnum = pgEnum("image_status", [
  "active",
  "orphan",
  "archived",
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
    materialsVi: text("materials_vi"),
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
  },
  (table) => [
    primaryKey({ columns: [table.lessonId, table.position] }),
    unique("lesson_activities_lesson_activity_unique").on(
      table.lessonId,
      table.activityId
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
  thumbPath: text("thumb_path"),
  width: integer("width"),
  height: integer("height"),
  bytes: integer("bytes"),
  mime: varchar("mime", { length: 50 }),
  altTextVi: text("alt_text_vi"),
  visibility: imageVisibilityEnum("visibility").notNull().default("public"),
  status: imageStatusEnum("status").notNull().default("active"),
  uploadedByManagerId: bigint("uploaded_by_manager_id", {
    mode: "number",
  }).references(() => managers.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const contentAssetRefs = pgTable(
  "content_asset_refs",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    assetKind: varchar("asset_kind", { length: 50 }).notNull(),
    assetRef: text("asset_ref").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_content_asset_refs_asset_ref").on(table.assetRef),
    index("idx_content_asset_refs_entity").on(table.entityType, table.entityId),
    unique("content_asset_refs_unique").on(
      table.entityType,
      table.entityId,
      table.assetKind,
      table.assetRef
    ),
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
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
