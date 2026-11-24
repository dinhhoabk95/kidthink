import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { JsonRecord } from "#src/constants/json";
import {
  CUSTOM_GAME_STATUS,
  type CustomGameStatus,
} from "#src/constants/learning-enums";
import { idPk, timestamps, uuidCol } from "./columns.ts";
import { users } from "./identity.ts";

export const customGames = sqliteTable(
  "custom_games",
  {
    id: idPk(),
    uuid: uuidCol("uuid").unique(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    templateId: text("template_id").notNull(),
    title: text("title").notNull(),
    instruction: text("instruction").notNull(),
    contentPack: text("content_pack", { mode: "json" })
      .$type<JsonRecord>()
      .notNull(),
    difficultyParams: text("difficulty_params", { mode: "json" })
      .$type<JsonRecord>()
      .notNull(),
    themeId: text("theme_id").notNull().default("farm"),
    ageMin: integer("age_min").notNull().default(3),
    ageMax: integer("age_max").notNull().default(6),
    skillIds: text("skill_ids", { mode: "json" }).$type<number[]>(),
    status: integer("status")
      .$type<CustomGameStatus>()
      .notNull()
      .default(CUSTOM_GAME_STATUS.DRAFT),
    version: integer("version").notNull().default(1),
    ...timestamps(),
  },
  (table) => [
    index("idx_custom_games_user_status").on(table.userId, table.status),
    index("idx_custom_games_user_template").on(table.userId, table.templateId),
  ]
);

export type CustomGame = typeof customGames.$inferSelect;
export type NewCustomGame = typeof customGames.$inferInsert;
