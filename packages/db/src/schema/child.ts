import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./identity.ts";

export const childProfiles = pgTable(
  "child_profiles",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    displayName: varchar("display_name", { length: 50 }).notNull(),
    gender: varchar("gender", { length: 20 }),
    birthYear: smallint("birth_year").notNull(),
    avatarUrl: text("avatar_url"),
    avatarEmoji: varchar("avatar_emoji", { length: 10 }),
    themePreference: varchar("theme_preference", { length: 50 }),
    isActive: boolean("is_active").notNull().default(true),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "check_child_profiles_birth_year",
      sql`${table.birthYear} >= 2010 AND ${table.birthYear} <= 2035`
    ),
  ]
);

export const childSessionSummaries = pgTable(
  "child_session_summaries",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    childProfileId: bigint("child_profile_id", { mode: "number" })
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    date: varchar("date", { length: 10 }).notNull(),
    totalPlayTimeSeconds: integer("total_play_time_seconds")
      .notNull()
      .default(0),
    levelsCompleted: integer("levels_completed").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("child_session_summaries_child_date_unique").on(
      table.childProfileId,
      table.date
    ),
  ]
);
