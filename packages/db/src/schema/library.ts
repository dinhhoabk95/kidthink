import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";
import type { ContentEntityType } from "#src/constants/learning-enums";
import { idPk, timestamps } from "./columns.ts";
import { users } from "./identity.ts";

export const collections = sqliteTable(
  "collections",
  {
    id: idPk(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
    ...timestamps(),
  },
  (table) => [
    unique("collections_user_id_name_unique").on(table.userId, table.name),
  ]
);

export const libraryItems = sqliteTable(
  "library_items",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entityType: integer("entity_type").$type<ContentEntityType>().notNull(),
    entityId: integer("entity_id").notNull(),
    collectionId: integer("collection_id").references(() => collections.id, {
      onDelete: "set null",
    }),
    note: text("note"),
    ...timestamps(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.entityType, table.entityId] }),
    index("idx_library_items_collection_id")
      .on(table.collectionId)
      .where(sql`${table.collectionId} IS NOT NULL`),
    index("idx_library_items_entity").on(table.entityType, table.entityId),
  ]
);

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type LibraryItem = typeof libraryItems.$inferSelect;
export type NewLibraryItem = typeof libraryItems.$inferInsert;
