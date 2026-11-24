import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import type { AiCreditReason } from "#src/constants/billing-ops-enums";
import { idPk, timestamps, uuidCol } from "./columns.ts";
import { managers, users } from "./identity.ts";

export const aiCreditLedger = sqliteTable(
  "ai_credit_ledger",
  {
    id: idPk(),
    uuid: uuidCol("uuid").unique(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    delta: integer("delta").notNull(),
    reason: integer("reason").$type<AiCreditReason>().notNull(),
    refType: text("ref_type"),
    refId: text("ref_id"),
    feature: text("feature"),
    grantedByManagerId: integer("granted_by_manager_id").references(
      () => managers.id,
      { onDelete: "set null" }
    ),
    grantReason: text("grant_reason"),
    idempotencyKey: text("idempotency_key"),
    ...timestamps(),
  },
  (table) => [
    index("idx_ai_credit_ledger_user_created").on(
      table.userId,
      table.createdAt
    ),
    index("idx_ai_credit_ledger_ref").on(table.refType, table.refId),
    index("idx_ai_credit_ledger_granted_by_manager")
      .on(table.grantedByManagerId)
      .where(sql`${table.grantedByManagerId} IS NOT NULL`),
    uniqueIndex("idx_ai_credit_ledger_idempotency")
      .on(table.idempotencyKey)
      .where(sql`${table.idempotencyKey} IS NOT NULL`),
  ]
);

export const aiCreditBalance = sqliteTable("ai_credit_balance", {
  id: idPk(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  balance: integer("balance").notNull().default(0),
  totalGranted: integer("total_granted").notNull().default(0),
  totalUsed: integer("total_used").notNull().default(0),
  version: integer("version").notNull().default(1),
  ...timestamps(),
});

export type AiCreditLedgerEntry = typeof aiCreditLedger.$inferSelect;
export type NewAiCreditLedgerEntry = typeof aiCreditLedger.$inferInsert;
export type AiCreditBalance = typeof aiCreditBalance.$inferSelect;
export type NewAiCreditBalance = typeof aiCreditBalance.$inferInsert;
