import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./identity.ts";

export const lessonPlanItemTypeEnum = pgEnum("lesson_plan_item_type", [
  "activity",
  "game_level",
  "custom_note",
]);

export const lessonPlans = pgTable(
  "lesson_plans",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    uuid: uuid("uuid").defaultRandom().notNull(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    targetAge: smallint("target_age"),
    estimatedMinutes: integer("estimated_minutes"),
    notes: text("notes"),
    sourceLessonCode: varchar("source_lesson_code", { length: 50 }),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_lesson_plans_uuid").on(table.uuid),
    index("idx_lesson_plans_user_id").on(table.userId),
    index("idx_lesson_plans_source_lesson_code").on(table.sourceLessonCode),
    check(
      "check_lesson_plans_target_age",
      sql`${table.targetAge} IS NULL OR (${table.targetAge} >= 3 AND ${table.targetAge} <= 6)`
    ),
    check(
      "check_lesson_plans_estimated_minutes",
      sql`${table.estimatedMinutes} IS NULL OR (${table.estimatedMinutes} >= 1 AND ${table.estimatedMinutes} <= 180)`
    ),
  ]
);

export const lessonPlanItems = pgTable(
  "lesson_plan_items",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    lessonPlanId: bigint("lesson_plan_id", { mode: "number" })
      .notNull()
      .references(() => lessonPlans.id, { onDelete: "cascade" }),
    position: smallint("position").notNull(),
    itemType: lessonPlanItemTypeEnum("item_type").notNull(),
    itemCode: varchar("item_code", { length: 50 }),
    sourceEntityId: bigint("source_entity_id", { mode: "number" }),
    sourceContentVersion: integer("source_content_version"),
    customInstruction: text("custom_instruction"),
    snapshot: jsonb("snapshot").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("lesson_plan_items_plan_pos_unique").on(
      table.lessonPlanId,
      table.position
    ),
    index("idx_lesson_plan_items_plan_id").on(table.lessonPlanId),
    index("idx_lesson_plan_items_source_entity").on(table.sourceEntityId),
    check("check_lesson_plan_items_position", sql`${table.position} >= 0`),
  ]
);
