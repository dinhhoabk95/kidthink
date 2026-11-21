import {
  bigint,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { idPk, timestamps } from "./columns.ts";
import { users } from "./identity.ts";

export const customGameStatusEnum = pgEnum("custom_game_status", [
  "draft",
  "ready",
]);

export const customGames = pgTable(
  "custom_games",
  {
    id: idPk(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    templateId: varchar("template_id", { length: 32 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    instruction: text("instruction").notNull(),
    contentPack: jsonb("content_pack").notNull(),
    difficultyParams: jsonb("difficulty_params").notNull(),
    themeId: varchar("theme_id", { length: 50 }).notNull().default("farm"),
    ageMin: smallint("age_min").notNull().default(3),
    ageMax: smallint("age_max").notNull().default(6),
    skillIds: jsonb("skill_ids").$type<number[]>(),
    status: customGameStatusEnum("status").notNull().default("draft"),
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
