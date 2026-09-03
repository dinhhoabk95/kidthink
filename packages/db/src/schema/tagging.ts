import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "./columns.ts";
import { users } from "./identity.ts";
import { learningObjectives, skills } from "./taxonomy.ts";

export const tagAxisEnum = pgEnum("tag_axis", [
  "what",
  "thinking",
  "mechanic",
  "theme",
]);

export const tagStatusEnum = pgEnum("tag_status", ["active", "deprecated"]);

export const contentEntityTypeEnum = pgEnum("content_entity_type", [
  "game_level",
  "lesson",
  "activity",
  "curriculum",
  "worksheet",
]);

export const contentTags = pgTable("content_tags", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  axis: tagAxisEnum("axis").notNull(),
  label: varchar("label", { length: 100 }).notNull(),
  status: tagStatusEnum("status").notNull().default("active"),
  ...timestamps(),
});

export const contentTagMap = pgTable(
  "content_tag_map",
  {
    entityType: contentEntityTypeEnum("entity_type").notNull(),
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    tagId: bigint("tag_id", { mode: "number" })
      .notNull()
      .references(() => contentTags.id, { onDelete: "cascade" }),
    ...timestamps(),
  },
  (table) => [
    primaryKey({ columns: [table.entityType, table.entityId, table.tagId] }),
  ]
);

export const contentSkillMap = pgTable(
  "content_skill_map",
  {
    entityType: contentEntityTypeEnum("entity_type").notNull(),
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    skillId: bigint("skill_id", { mode: "number" })
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    weight: numeric("weight", { precision: 3, scale: 2 }).notNull(),
    ...timestamps(),
  },
  (table) => [
    primaryKey({ columns: [table.entityType, table.entityId, table.skillId] }),
    check(
      "check_content_skill_map_weight",
      sql`${table.weight} > 0 AND ${table.weight} <= 1`
    ),
  ]
);

export const contentObjectiveMap = pgTable(
  "content_objective_map",
  {
    entityType: contentEntityTypeEnum("entity_type").notNull(),
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    learningObjectiveId: bigint("learning_objective_id", { mode: "number" })
      .notNull()
      .references(() => learningObjectives.id, { onDelete: "cascade" }),
    ...timestamps(),
  },
  (table) => [
    primaryKey({
      columns: [table.entityType, table.entityId, table.learningObjectiveId],
    }),
  ]
);

export const userTags = pgTable(
  "user_tags",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 100 }).notNull(),
    ...timestamps(),
  },
  (table) => [
    unique("user_tags_user_id_label_unique").on(table.userId, table.label),
  ]
);
