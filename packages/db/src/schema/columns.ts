import { sql } from "drizzle-orm";
import { customType, integer, text } from "drizzle-orm/sqlite-core";

export function idPk() {
  return integer("id").primaryKey({ autoIncrement: true });
}

export function uuidCol(name = "uuid") {
  return text(name)
    .notNull()
    .$defaultFn(() => crypto.randomUUID());
}

export const citext = customType<{ data: string }>({
  dataType() {
    return "text COLLATE NOCASE";
  },
});

export function timestampMs(name: string) {
  return integer(name, { mode: "timestamp_ms" });
}

export function nowTimestampMs(name: string) {
  return integer(name, { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(CAST(unixepoch('subsec') * 1000 AS INTEGER))`)
    .$defaultFn(() => new Date());
}

export function timestamps() {
  return {
    createdAt: nowTimestampMs("created_at"),
    updatedAt: nowTimestampMs("updated_at").$onUpdateFn(() => new Date()),
  };
}

export function insertOnlyTimestamps() {
  return {
    createdAt: nowTimestampMs("created_at"),
    updatedAt: nowTimestampMs("updated_at"),
  };
}
