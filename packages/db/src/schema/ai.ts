import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  customType,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./identity.ts";

const LEADING_BRACKET = /^\[/;
const TRAILING_BRACKET = /\]$/;

export const vector = customType<{
  data: number[];
  driverData: string;
  config: { dimensions: number };
}>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 1536})`;
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string): number[] {
    if (typeof value !== "string") {
      return value as unknown as number[];
    }
    return value
      .replace(LEADING_BRACKET, "")
      .replace(TRAILING_BRACKET, "")
      .split(",")
      .map(Number);
  },
});

export const contentEmbeddings = pgTable(
  "content_embeddings",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    contentType: varchar("content_type", { length: 30 }).notNull(),
    contentId: bigint("content_id", { mode: "number" }).notNull(),
    contentVersion: integer("content_version").notNull(),
    model: varchar("model", { length: 60 }).notNull(),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    chunkIndex: integer("chunk_index").notNull().default(0),
    chunkText: text("chunk_text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_content_embeddings_unique").on(
      table.contentType,
      table.contentId,
      table.contentVersion,
      table.model,
      table.chunkIndex
    ),
    index("idx_content_embeddings_model").on(table.model),
  ]
);

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
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
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

export type ContentEmbedding = typeof contentEmbeddings.$inferSelect;
export type NewContentEmbedding = typeof contentEmbeddings.$inferInsert;
export type AiUsageLogEntry = typeof aiUsageLog.$inferSelect;
export type NewAiUsageLogEntry = typeof aiUsageLog.$inferInsert;
