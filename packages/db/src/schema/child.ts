import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  smallint,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./identity.ts";

export const childRelationshipEnum = pgEnum("child_relationship", [
  "child",
  "student",
  "other",
]);

export const childStatusEnum = pgEnum("child_status", [
  "active",
  "archived",
  "pending_deletion",
]);

export const childProfiles = pgTable(
  "child_profiles",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    displayName: varchar("display_name", { length: 40 }).notNull(),
    birthYear: smallint("birth_year").notNull(),
    avatarId: varchar("avatar_id", { length: 24 }).notNull(),
    relationship: childRelationshipEnum("relationship"),
    currentCurriculumId: bigint("current_curriculum_id", { mode: "number" }),
    dailyPlayCapMinutes: smallint("daily_play_cap_minutes")
      .notNull()
      .default(60),
    status: childStatusEnum("status").notNull().default("active"),
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
    index("child_profiles_birth_year_idx").on(table.birthYear),
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
