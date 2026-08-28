import { relations, sql } from "drizzle-orm";
import {
  bigint,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "./columns.ts";
import { managers, users } from "./identity.ts";

export const aiCreditReasonEnum = pgEnum("ai_credit_reason", [
  "purchase",
  "usage",
  "manual_grant",
  "refund",
]);

export const aiCreditLedger = pgTable(
  "ai_credit_ledger",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    delta: integer("delta").notNull(),
    reason: aiCreditReasonEnum("reason").notNull(),
    refType: varchar("ref_type", { length: 60 }),
    refId: varchar("ref_id", { length: 100 }),
    feature: varchar("feature", { length: 60 }),
    grantedByManagerId: bigint("granted_by_manager_id", {
      mode: "number",
    }).references(() => managers.id),
    grantReason: text("grant_reason"),
    idempotencyKey: varchar("idempotency_key", { length: 128 }),
    ...timestamps(),
  },
  (table) => [
    index("idx_ai_credit_ledger_user_created").on(
      table.userId,
      table.createdAt
    ),
    index("idx_ai_credit_ledger_ref").on(table.refType, table.refId),
    uniqueIndex("idx_ai_credit_ledger_idempotency").on(table.idempotencyKey),
  ]
);

export const aiCreditBalance = pgTable(
  "ai_credit_balance",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    balance: integer("balance").notNull().default(0),
    totalGranted: integer("total_granted").notNull().default(0),
    totalUsed: integer("total_used").notNull().default(0),
    version: integer("version").notNull().default(1),
    ...timestamps(),
  },
  (table) => [
    check("check_ai_credit_balance_non_negative", sql`${table.balance} >= 0`),
  ]
);

export const aiCreditLedgerRelations = relations(aiCreditLedger, ({ one }) => ({
  user: one(users, {
    fields: [aiCreditLedger.userId],
    references: [users.id],
  }),
  grantedByManager: one(managers, {
    fields: [aiCreditLedger.grantedByManagerId],
    references: [managers.id],
  }),
}));

export const aiCreditBalanceRelations = relations(
  aiCreditBalance,
  ({ one }) => ({
    user: one(users, {
      fields: [aiCreditBalance.userId],
      references: [users.id],
    }),
  })
);

export type AiCreditLedgerEntry = typeof aiCreditLedger.$inferSelect;
export type NewAiCreditLedgerEntry = typeof aiCreditLedger.$inferInsert;
export type AiCreditBalance = typeof aiCreditBalance.$inferSelect;
export type NewAiCreditBalance = typeof aiCreditBalance.$inferInsert;
