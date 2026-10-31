import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  pgTable,
  primaryKey,
  smallint,
  text,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "./columns.ts";
import { users } from "./identity.ts";

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
    ...timestamps(),
  },
  (table) => [
    // UNIQUE (user_id, name) đã phục vụ mọi tra cứu theo user_id — index
    // (user_id) riêng chỉ thêm chi phí ghi.
    unique("collections_user_id_name_unique").on(table.userId, table.name),
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
    ...timestamps(),
  },
  (table) => [
    // PK (user_id, entity_type, entity_id) đã phủ tra cứu theo user_id.
    primaryKey({ columns: [table.userId, table.entityType, table.entityId] }),
    index("idx_library_items_collection_id").on(table.collectionId),
    index("idx_library_items_entity").on(table.entityType, table.entityId),
    check(
      "check_library_items_entity_type",
      sql`${table.entityType} IN ('game_level', 'curriculum')`
    ),
  ]
);

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type LibraryItem = typeof libraryItems.$inferSelect;
export type NewLibraryItem = typeof libraryItems.$inferInsert;
