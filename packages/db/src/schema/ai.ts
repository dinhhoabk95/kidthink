import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  pgTable,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "./columns.ts";
import { users } from "./identity.ts";

export const aiUsageLog = pgTable(
  "ai_usage_log",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    feature: varchar("feature", { length: 60 }).notNull(),
    creditsSpent: integer("credits_spent").notNull().default(0),
    model: varchar("model", { length: 60 }).notNull(),
    promptVersion: varchar("prompt_version", { length: 40 }).notNull(),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    costUsdMicros: integer("cost_usd_micros").notNull().default(0),
    moderationPassed: boolean("moderation_passed").notNull().default(true),
    ...timestamps(),
  },
  (table) => [
    index("idx_ai_usage_log_user_created").on(table.userId, table.createdAt),
    index("idx_ai_usage_log_feature_created").on(
      table.feature,
      table.createdAt
    ),
  ]
);

export const aiUsageLogRelations = relations(aiUsageLog, ({ one }) => ({
  user: one(users, {
    fields: [aiUsageLog.userId],
    references: [users.id],
  }),
}));

export type AiUsageLogEntry = typeof aiUsageLog.$inferSelect;
export type NewAiUsageLogEntry = typeof aiUsageLog.$inferInsert;
