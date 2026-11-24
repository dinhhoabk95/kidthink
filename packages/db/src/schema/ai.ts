import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { idPk, timestamps, uuidCol } from "./columns.ts";
import { users } from "./identity.ts";

export const aiUsageLog = sqliteTable(
  "ai_usage_log",
  {
    id: idPk(),
    uuid: uuidCol("uuid").unique(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    feature: text("feature").notNull(),
    creditsSpent: integer("credits_spent").notNull().default(0),
    model: text("model").notNull(),
    promptVersion: text("prompt_version").notNull(),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    costUsdMicros: integer("cost_usd_micros").notNull().default(0),
    moderationPassed: integer("moderation_passed", { mode: "boolean" })
      .notNull()
      .default(true),
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

export type AiUsageLogEntry = typeof aiUsageLog.$inferSelect;
export type NewAiUsageLogEntry = typeof aiUsageLog.$inferInsert;
