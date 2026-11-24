import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import {
  type ContentEntityType,
  TAG_STATUS,
  type TagAxis,
  type TagStatus,
} from "#src/constants/learning-enums";
import { idPk, timestamps } from "./columns.ts";
import { skills } from "./taxonomy.ts";

export const contentTags = sqliteTable("content_tags", {
  id: idPk(),
  code: text("code").notNull().unique(),
  axis: integer("axis").$type<TagAxis>().notNull(),
  label: text("label").notNull(),
  status: integer("status")
    .$type<TagStatus>()
    .notNull()
    .default(TAG_STATUS.ACTIVE),
  ...timestamps(),
});

export const contentTagMap = sqliteTable(
  "content_tag_map",
  {
    entityType: integer("entity_type").$type<ContentEntityType>().notNull(),
    entityId: integer("entity_id").notNull(),
    tagId: integer("tag_id")
      .notNull()
      .references(() => contentTags.id, { onDelete: "cascade" }),
    ...timestamps(),
  },
  (table) => [
    primaryKey({ columns: [table.entityType, table.entityId, table.tagId] }),
    index("idx_content_tag_map_tag_entity").on(table.tagId, table.entityType),
  ]
);

export const contentSkillMap = sqliteTable(
  "content_skill_map",
  {
    entityType: integer("entity_type").$type<ContentEntityType>().notNull(),
    entityId: integer("entity_id").notNull(),
    skillId: integer("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    weight: text("weight").notNull(),
    ...timestamps(),
  },
  (table) => [
    primaryKey({ columns: [table.entityType, table.entityId, table.skillId] }),
    index("idx_content_skill_map_skill_entity").on(
      table.skillId,
      table.entityType
    ),
  ]
);
