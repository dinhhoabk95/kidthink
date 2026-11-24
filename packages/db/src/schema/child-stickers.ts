import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";
import { childProfiles } from "./child.ts";
import { idPk, nowTimestampMs, timestamps } from "./columns.ts";
import { playSessions } from "./play.ts";

export const childStickers = sqliteTable(
  "child_stickers",
  {
    id: idPk(),
    childProfileId: integer("child_profile_id")
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    playSessionId: integer("play_session_id").references(
      () => playSessions.id,
      { onDelete: "set null" }
    ),
    themeCode: text("theme_code").notNull(),
    emoji: text("emoji").notNull(),
    label: text("label").notNull(),
    awardedAt: nowTimestampMs("awarded_at"),
    ...timestamps(),
  },
  (table) => [
    unique("uq_child_stickers_play").on(
      table.childProfileId,
      table.playSessionId
    ),
    index("idx_child_stickers_play_session_id")
      .on(table.playSessionId)
      .where(sql`${table.playSessionId} IS NOT NULL`),
  ]
);
