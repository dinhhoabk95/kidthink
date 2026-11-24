import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
  CHILD_STATUS,
  type ChildRelationship,
  type ChildStatus,
} from "#src/constants/identity-enums";
import { idPk, timestampMs, timestamps, uuidCol } from "./columns.ts";
import { users } from "./identity.ts";

export const childProfiles = sqliteTable(
  "child_profiles",
  {
    id: idPk(),
    uuid: uuidCol("uuid").unique(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    birthYear: integer("birth_year").notNull(),
    avatarId: text("avatar_id").notNull(),
    relationship: integer("relationship").$type<ChildRelationship>(),
    currentCurriculumId: integer("current_curriculum_id"),
    dailyPlayCapMinutes: integer("daily_play_cap_minutes")
      .notNull()
      .default(60),
    status: integer("status")
      .$type<ChildStatus>()
      .notNull()
      .default(CHILD_STATUS.ACTIVE),
    purgeAt: timestampMs("purge_at"),
    ...timestamps(),
  },
  (table) => [
    index("child_profiles_birth_year_idx").on(table.birthYear),
    index("idx_child_profiles_user_id").on(table.userId),
    index("idx_child_profiles_status_purge_at")
      .on(table.status, table.purgeAt)
      .where(sql`${table.purgeAt} IS NOT NULL`),
    index("idx_child_profiles_current_curriculum_id")
      .on(table.currentCurriculumId)
      .where(sql`${table.currentCurriculumId} IS NOT NULL`),
  ]
);
