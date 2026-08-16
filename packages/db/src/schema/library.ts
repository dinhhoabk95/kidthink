import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./identity.ts";
import { contentTags } from "./tagging.ts";

export const collections = pgTable(
  "collections",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    position: smallint("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("collections_user_id_name_unique").on(table.userId, table.name),
    index("idx_collections_user_id").on(table.userId),
  ]
);

export const libraryItems = pgTable(
  "library_items",
  {
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    collectionId: bigint("collection_id", { mode: "number" }).references(
      () => collections.id,
      { onDelete: "set null" }
    ),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.entityType, table.entityId] }),
    index("idx_library_items_user_id").on(table.userId),
    index("idx_library_items_collection_id").on(table.collectionId),
    index("idx_library_items_entity").on(table.entityType, table.entityId),
    check(
      "check_library_items_entity_type",
      sql`${table.entityType} IN ('game_level', 'lesson', 'curriculum', 'activity')`
    ),
  ]
);

export const userTagMap = pgTable(
  "user_tag_map",
  {
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tagId: bigint("tag_id", { mode: "number" })
      .notNull()
      .references(() => contentTags.id, { onDelete: "cascade" }),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.tagId, table.entityType, table.entityId],
    }),
    index("idx_user_tag_map_user_tag").on(table.userId, table.tagId),
    index("idx_user_tag_map_entity").on(table.entityType, table.entityId),
  ]
);

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type LibraryItem = typeof libraryItems.$inferSelect;
export type NewLibraryItem = typeof libraryItems.$inferInsert;
export type UserTagMap = typeof userTagMap.$inferSelect;
export type NewUserTagMap = typeof userTagMap.$inferInsert;
