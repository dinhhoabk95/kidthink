import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "./columns.ts";
import { skills } from "./taxonomy.ts";

export const tagAxisEnum = pgEnum("tag_axis", [
  "what",
  "thinking",
  "mechanic",
  "theme",
]);

export const tagStatusEnum = pgEnum("tag_status", ["active", "deprecated"]);

export const contentEntityTypeEnum = pgEnum("content_entity_type", [
  "game_level",
  "curriculum",
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
    index("idx_content_tag_map_tag_entity").on(table.tagId, table.entityType),
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
    index("idx_content_skill_map_skill_entity").on(
      table.skillId,
      table.entityType
    ),
    check(
      "check_content_skill_map_weight",
      sql`${table.weight} > 0 AND ${table.weight} <= 1`
    ),
  ]
);
